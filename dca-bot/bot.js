import { Connection, PublicKey, Keypair, VersionedTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, getAccount } from '@solana/spl-token';
import bs58 from 'bs58';

const RPC = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
const WALLET_SECRET = process.env.WALLET_SECRET;
const JUPITER_API = 'https://api.jup.ag/swap/v1';
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const MIN_SWAP = parseFloat(process.env.MIN_SWAP_USD || '1');
const SLIPPAGE = parseFloat(process.env.SLIPPAGE || '3');
const FEE_PCT = parseFloat(process.env.FEE_PCT || '0.005');
const POLL_MS = parseInt(process.env.POLL_MS || '15000');
const FARM_INTERVAL_MS = 60 * 60 * 1000; // farm once per hour
const FARM_SWAP_AMT = 0.0005; // SOL to use per farm cycle

if (!WALLET_SECRET) { console.error('WALLET_SECRET required'); process.exit(1); }

const secretKey = WALLET_SECRET.startsWith('[') ? Uint8Array.from(JSON.parse(WALLET_SECRET)) : bs58.decode(WALLET_SECRET);
const wallet = Keypair.fromSecretKey(secretKey);
const connection = new Connection(RPC);
const API_BASE = 'https://cryptoboss.space';

let lastUsdcBalance = 0;
let lastFarmTime = 0;
let lastSig = '';

async function getSolBalance() {
  try {
    const bal = await connection.getBalance(wallet.publicKey);
    return bal / LAMPORTS_PER_SOL;
  } catch { return 0; }
}

async function getUsdcBalance() {
  try {
    const ata = await getOrCreateAssociatedTokenAccount(connection, wallet, USDC_MINT, wallet.publicKey);
    const account = await getAccount(connection, ata.address);
    return Number(account.amount) / 1e6;
  } catch { return 0; }
}

async function getJupiterQuote(inputMint, outputMint, amountLamports) {
  const r = await fetch(`${JUPITER_API}/quote?inputMint=${inputMint.toBase58()}&outputMint=${outputMint.toBase58()}&amount=${amountLamports}&slippageBps=${SLIPPAGE * 100}`);
  if (!r.ok) throw new Error(`Jupiter quote error: ${r.status}`);
  return r.json();
}

async function executeSwap(quote) {
  const r = await fetch(`${JUPITER_API}/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: wallet.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    })
  });
  if (!r.ok) throw new Error(`Jupiter swap error: ${r.status}`);
  const { swapTransaction } = await r.json();
  const tx = VersionedTransaction.deserialize(Buffer.from(swapTransaction, 'base64'));
  tx.sign([wallet]);
  const sig = await connection.sendTransaction(tx, { skipPreflight: false, maxRetries: 3 });
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}

async function checkAndSwap() {
  const balance = await getUsdcBalance();
  if (balance === lastUsdcBalance) return;
  const delta = balance - lastUsdcBalance;
  lastUsdcBalance = balance;

  console.log(`[${new Date().toISOString()}] USDC: $${balance.toFixed(2)} ${delta > 0 ? `(+$${delta.toFixed(2)})` : ''}`);

  if (balance < MIN_SWAP) return;

  const swapAmount = balance * (1 - FEE_PCT);
  const feeAmount = balance * FEE_PCT;
  const swapLamports = Math.floor(swapAmount * 1e6);

  console.log(`Swapping $${swapAmount.toFixed(2)} USDC → SOL (fee: $${feeAmount.toFixed(2)})`);
  try {
    const quote = await getJupiterQuote(USDC_MINT, SOL_MINT, swapLamports);
    const outAmount = parseFloat(quote.outAmount) / 1e9;
    const price = swapAmount / outAmount;
    console.log(`Quote: ${outAmount.toFixed(6)} SOL @ ~$${price.toFixed(2)}`);

    const sig = await executeSwap(quote);
    console.log(`SWAP EXECUTED: ${sig}`);

    await fetch(`${API_BASE}/api/dca/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (process.env.DCA_SECRET || '') },
      body: JSON.stringify({ amount_usd: swapAmount, fee_usd: feeAmount, signature: sig, price, token_out: 'SOL' })
    }).catch(e => console.error('Record err:', e.message));
  } catch (e) {
    console.error('Swap failed:', e.message);
  }
}

async function farm() {
  const now = Date.now();
  if (now - lastFarmTime < FARM_INTERVAL_MS) return;
  lastFarmTime = now;

  const solBal = await getSolBalance();
  console.log(`[${new Date().toISOString()}] Farm check — SOL: ${solBal.toFixed(6)}`);

  // Need at least 0.0025 SOL for wSOL rent + swap + gas
  if (solBal < 0.0025) {
    console.log(`Farm: skipping — need >0.0025 SOL (have ${solBal.toFixed(6)}). Need ~$0.28 more SOL deposited.`);
    return;
  }

  try {
    // Phase 1: Swap tiny SOL → USDC via Jupiter
    const solToSwap = Math.floor(FARM_SWAP_AMT * LAMPORTS_PER_SOL);
    console.log(`Farm: swapping ${FARM_SWAP_AMT} SOL → USDC`);

    const quote1 = await getJupiterQuote(SOL_MINT, USDC_MINT, solToSwap);
    const receivedUsdc = parseFloat(quote1.outAmount) / 1e6;
    console.log(`Farm: SOL→USDC quote: ${receivedUsdc.toFixed(6)} USDC`);

    if (receivedUsdc >= 0.001) {
      const sig1 = await executeSwap(quote1);
      console.log(`Farm: SOL→USDC done: ${sig1}`);
      await logFarm('sol→usdc', FARM_SWAP_AMT, receivedUsdc, sig1);

      // Wait for confirmation propagation
      await new Promise(r => setTimeout(r, 5000));

      // Phase 2: Swap that USDC back → SOL
      const usdcToSwap = Math.floor(receivedUsdc * 1e6);
      if (usdcToSwap >= 1000) { // at least 0.001 USDC
        const quote2 = await getJupiterQuote(USDC_MINT, SOL_MINT, usdcToSwap);
        const receivedSol = parseFloat(quote2.outAmount) / 1e9;
        console.log(`Farm: USDC→SOL quote: ${receivedSol.toFixed(9)} SOL`);

        const sig2 = await executeSwap(quote2);
        console.log(`Farm: USDC→SOL done: ${sig2}`);
        await logFarm('usdc→sol', receivedUsdc, receivedSol, sig2);
      }
    }

    console.log(`Farm: cycle complete. SOL: ${(await getSolBalance()).toFixed(6)}`);
  } catch (e) {
    console.error('Farm cycle failed:', e.message);
  }
}

async function logFarm(type, input, output, sig) {
  try {
    await fetch(`${API_BASE}/api/dca/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (process.env.DCA_SECRET || '') },
      body: JSON.stringify({ type: 'farm:' + type, input, output, signature: sig, time: Date.now() })
    }).catch(() => {});
  } catch {}
}

async function mainLoop() {
  console.log(`Wallet: ${wallet.publicKey.toBase58()}`);
  lastUsdcBalance = await getUsdcBalance();
  const sol = await getSolBalance();
  console.log(`Initial — USDC: $${lastUsdcBalance.toFixed(2)}, SOL: ${sol.toFixed(6)}`);

  while (true) {
    try {
      // Watch for deposits (existing DCA logic)
      const sigs = await connection.getSignaturesForAddress(wallet.publicKey, { limit: 5 });
      if (sigs.length > 0 && sigs[0].signature !== lastSig) {
        lastSig = sigs[0].signature;
        await checkAndSwap();
      }

      // Farm protocol interactions every hour
      await farm();
    } catch (e) { /* ignore */ }
    await new Promise(r => setTimeout(r, POLL_MS));
  }
}

mainLoop().catch(e => { console.error('FATAL:', e); process.exit(1); });
