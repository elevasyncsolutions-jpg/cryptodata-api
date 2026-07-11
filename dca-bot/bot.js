import { Connection, PublicKey, Keypair, VersionedTransaction } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, getAccount } from '@solana/spl-token';
import bs58 from 'bs58';

const RPC = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
const WS_URL = process.env.WS_URL || 'wss://api.mainnet-beta.solana.com';
const WALLET_SECRET = process.env.WALLET_SECRET;
const JUPITER_API = 'https://quote-api.jup.ag/v6';
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const MIN_SWAP = parseFloat(process.env.MIN_SWAP_USD || '1');
const SLIPPAGE = parseFloat(process.env.SLIPPAGE || '3');
const FEE_PCT = parseFloat(process.env.FEE_PCT || '0.005');
const POLL_MS = parseInt(process.env.POLL_MS || '15000');

if (!WALLET_SECRET) { console.error('WALLET_SECRET required'); process.exit(1); }

const secretKey = WALLET_SECRET.startsWith('[') ? Uint8Array.from(JSON.parse(WALLET_SECRET)) : bs58.decode(WALLET_SECRET);
const wallet = Keypair.fromSecretKey(secretKey);
const connection = new Connection(RPC);
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

let lastBalance = 0;

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
  if (balance === lastBalance) return;
  const delta = balance - lastBalance;
  lastBalance = balance;

  console.log(`[${new Date().toISOString()}] Balance: $${balance.toFixed(2)} ${delta > 0 ? `(+$${delta.toFixed(2)})` : ''}`);

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

    await fetch('https://cryptoboss.space/api/dca/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (process.env.DCA_SECRET || '') },
      body: JSON.stringify({ amount_usd: swapAmount, fee_usd: feeAmount, signature: sig, price, token_out: 'SOL' })
    }).catch(e => console.error('Record err:', e.message));
  } catch (e) {
    console.error('Swap failed:', e.message);
  }
}

async function watchTransactionLogs() {
  console.log(`Watching wallet: ${wallet.publicKey.toBase58()}`);
  lastBalance = await getUsdcBalance();
  console.log(`Initial balance: $${lastBalance.toFixed(2)}`);

  // Poll for new transactions involving our wallet
  let lastSig = '';
  while (true) {
    try {
      const sigs = await connection.getSignaturesForAddress(wallet.publicKey, { limit: 5 });
      if (sigs.length > 0 && sigs[0].signature !== lastSig) {
        lastSig = sigs[0].signature;
        await checkAndSwap();
      }
    } catch (e) { /* ignore poll errors */ }
    await new Promise(r => setTimeout(r, POLL_MS));
  }
}

watchTransactionLogs().catch(e => { console.error('FATAL:', e); process.exit(1); });
