import { Connection, PublicKey, Keypair, VersionedTransaction } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, getAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58';

const RPC = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
const WALLET_SECRET = process.env.WALLET_SECRET; // JSON array of numbers
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT = process.env.CF_ACCOUNT_ID || '7590f6ca64af9feb45c2256854f9d194';
const KV_NAMESPACE = process.env.KV_NAMESPACE_ID || 'f5a1cddfd3eb43fcbfa2e7c4884dadab';
const DCA_FEE = parseFloat(process.env.DCA_FEE || '0.005'); // 0.5%
const JUPITER_API = 'https://quote-api.jup.ag/v6';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

if (!WALLET_SECRET) { console.error('WALLET_SECRET required'); process.exit(1); }
if (!CF_TOKEN) { console.error('CLOUDFLARE_API_TOKEN required'); process.exit(1); }

const secretKey = WALLET_SECRET.startsWith('[') ? Uint8Array.from(JSON.parse(WALLET_SECRET)) : bs58.decode(WALLET_SECRET);
const wallet = Keypair.fromSecretKey(secretKey);
const connection = new Connection(RPC);
const USDC_DECIMALS = 6;

async function cfGet(key) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/storage/kv/namespaces/${KV_NAMESPACE}/values/${encodeURIComponent(key)}`;
  const r = await fetch(url, { headers: { 'Authorization': `Bearer ${CF_TOKEN}` } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`CF GET error: ${r.status}`);
  const text = await r.text();
  try { return JSON.parse(text); } catch { return text; }
}

async function cfList(prefix) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/storage/kv/namespaces/${KV_NAMESPACE}/keys?prefix=${encodeURIComponent(prefix)}&limit=1000`;
  const r = await fetch(url, { headers: { 'Authorization': `Bearer ${CF_TOKEN}` } });
  if (!r.ok) throw new Error(`CF list error: ${r.status}`);
  const data = await r.json();
  return data.result || [];
}

async function getJupiterQuote(inputMint, outputMint, amount, slippage = 1) {
  const url = `${JUPITER_API}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippage * 100}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Jupiter quote error: ${r.status}`);
  return r.json();
}

async function executeSwap(quote, userWallet) {
  const swapUrl = `${JUPITER_API}/swap`;
  const swapBody = {
    quoteResponse: quote,
    userPublicKey: wallet.publicKey.toBase58(),
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
    prioritizationFeeLamports: 'auto',
  };
  const r = await fetch(swapUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(swapBody) });
  if (!r.ok) throw new Error(`Jupiter swap error: ${r.status}`);
  const { swapTransaction } = await r.json();
  const tx = VersionedTransaction.deserialize(Buffer.from(swapTransaction, 'base64'));
  tx.sign([wallet]);
  const sig = await connection.sendTransaction(tx, { skipPreflight: false, maxRetries: 3 });
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}

async function getUsdcBalance() {
  try {
    const ata = await getOrCreateAssociatedTokenAccount(connection, wallet, new PublicKey(USDC_MINT), wallet.publicKey);
    const account = await getAccount(connection, ata.address);
    return Number(account.amount) / Math.pow(10, USDC_DECIMALS);
  } catch (e) {
    return 0;
  }
}

async function processDcaPlan(key, plan) {
  if (!plan.active) return;
  const hoursSinceExec = (Date.now() - plan.last_exec) / 3600000;
  if (hoursSinceExec < plan.interval_hours) return;
  const balance = await getUsdcBalance();
  if (balance < plan.amount_usd) return;
  const execAmount = plan.amount_usd;
  const feeAmount = execAmount * DCA_FEE;
  const swapAmount = (execAmount - feeAmount) * Math.pow(10, USDC_DECIMALS);
  try {
    const quote = await getJupiterQuote(USDC_MINT, SOL_MINT, Math.floor(swapAmount));
    const sig = await executeSwap(quote, key);
    const price = parseFloat(quote.outAmount) / (swapAmount / Math.pow(10, USDC_DECIMALS));
    const result = { key, plan_id: plan.id, executed_usd: execAmount - feeAmount, fee_usd: feeAmount, signature: sig, token_out: 'SOL', price, time: Date.now() };
    await fetch(`https://cryptoboss.space/api/dca/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (process.env.DCA_SECRET || '') },
      body: JSON.stringify(result)
    });
    console.log(`DCA executed: ${key} ${plan.id} ${execAmount} USDC -> SOL sig=${sig}`);
    return result;
  } catch (e) {
    console.error(`DCA failed for ${key} ${plan.id}: ${e.message}`);
  }
}

async function main() {
  console.log('DCA Bot started at', new Date().toISOString());
  const keys = await cfList('dca:plans:');
  let total = 0, executed = 0;
  for (const keyEntry of keys) {
    const key = keyEntry.name.replace('dca:plans:', '');
    const raw = await cfGet(keyEntry.name);
    if (!raw) continue;
    let plans;
    try { plans = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { continue; }
    if (!Array.isArray(plans)) continue;
    for (const plan of plans) {
      total++;
      const result = await processDcaPlan(key, plan);
      if (result) executed++;
    }
  }
  console.log(`DCA complete: ${executed}/${total} plans executed`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
