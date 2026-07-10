#!/usr/bin/env node
const BASE = 'https://cryptodata-api.datachain.workers.dev';
const CONFIG_DIR = require('path').join(require('os').homedir(), '.chainboss');
const CONFIG_FILE = require('path').join(CONFIG_DIR, 'config.json');
const fs = require('fs');

function readConfig() {
  try {
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, '{}');
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch { return {}; }
}

function writeConfig(cfg) {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

const cfg = readConfig();
const args = process.argv.slice(2);
const cmd = args[0] || 'help';

const colors = {
  reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', bold: '\x1b[1m',
};

function c(str, color) { return colors[color] + str + colors.reset; }
function error(msg) { console.error(c('✖', 'red'), msg); process.exit(1); }
function success(msg) { console.log(c('✓', 'green'), msg); }

function getKey() {
  return args.find(a => a.startsWith('--key='))?.split('=')[1] || cfg.key;
}

async function api(path, key) {
  const headers = {};
  if (key) headers['x-api-key'] = key;
  const res = await fetch(BASE + path, { headers });
  const data = await res.json();
  if (!res.ok) error(data.error || data.message || 'API error');
  return data;
}

function ensureKey() {
  const key = getKey();
  if (!key) error('No API key. Run "chainboss register" first, or pass --key=cd_...');
  return key;
}

// ─── COMMANDS ────────────────────

async function cmdRegister() {
  const data = await api('/api/register');
  cfg.key = data.key;
  writeConfig(cfg);
  console.log('');
  console.log(c('  ChainBoss API Key', 'cyan'));
  console.log(c('  ────────────────', 'dim'));
  console.log('  ' + c(data.key, 'green'));
  console.log('  ' + c(data.balance_usd + ' free credit', 'dim'));
  console.log('');
  success('Key saved to ~/.chainboss/config.json');
}

async function cmdPrice() {
  const coins = args[1] || 'bitcoin,ethereum';
  const vs = args[2] || 'usd';
  const key = ensureKey();
  const data = await api(`/api/price?coins=${coins}&vs=${vs}`, key);
  console.log('');
  const prices = data.prices || {};
  Object.entries(prices).forEach(([coin, vals]) => {
    const usd = vals[vs] || vals.usd;
    const ch = vals[`${vs}_24h_change`] || vals.usd_24h_change;
    const chStr = ch != null ? (ch >= 0 ? c(`+${ch.toFixed(2)}%`, 'green') : c(`${ch.toFixed(2)}%`, 'red')) : '';
    console.log(`  ${c(coin.toUpperCase(), 'bold')}  ${c('$' + (usd?.toLocaleString() || '?'), 'cyan')}  ${chStr}`);
  });
  console.log('');
}

async function cmdTrending() {
  const key = ensureKey();
  const data = await api('/api/trending', key);
  const coins = data.trending || [];
  console.log('');
  coins.slice(0, 15).forEach((c2, i) => {
    console.log(`  ${c(String(i+1).padStart(2,'0'), 'dim')}  ${c(c2.name || c2.id, 'bold')}  ${c('#' + (c2.market_cap_rank || '?'), 'dim')}`);
  });
  console.log('');
}

async function cmdTop() {
  const limit = args[1] || 10;
  const key = ensureKey();
  const data = await api(`/api/top?limit=${limit}`, key);
  const coins = data.coins || [];
  console.log('');
  coins.forEach((c2, i) => {
    const ch = c2.price_change_percentage_24h;
    const chStr = ch != null ? (ch >= 0 ? c(`+${ch.toFixed(2)}%`, 'green') : c(`${ch.toFixed(2)}%`, 'red')) : '';
    console.log(`  ${c(String(i+1).padStart(2,'0'), 'dim')}  ${c(c2.symbol?.toUpperCase() || '?', 'bold')}  ${c('$' + (c2.current_price?.toLocaleString() || '?'), 'cyan')}  ${chStr}`);
  });
  console.log('');
}

async function cmdGainers() {
  const limit = args[1] || 10;
  const key = ensureKey();
  const data = await api(`/api/top-gainers?limit=${limit}`, key);
  const coins = data.coins || [];
  console.log('');
  coins.forEach((c2, i) => {
    const ch = c2.price_change_percentage_24h;
    console.log(`  ${c(String(i+1).padStart(2,'0'), 'dim')}  ${c(c2.symbol?.toUpperCase() || '?', 'bold')}  ${c('$' + (c2.current_price?.toLocaleString() || '?'), 'cyan')}  ${c('+' + (ch||0).toFixed(2) + '%', 'green')}`);
  });
  console.log('');
}

async function cmdLosers() {
  const limit = args[1] || 10;
  const key = ensureKey();
  const data = await api(`/api/top-losers?limit=${limit}`, key);
  const coins = data.coins || [];
  console.log('');
  coins.forEach((c2, i) => {
    const ch = c2.price_change_percentage_24h;
    console.log(`  ${c(String(i+1).padStart(2,'0'), 'dim')}  ${c(c2.symbol?.toUpperCase() || '?', 'bold')}  ${c('$' + (c2.current_price?.toLocaleString() || '?'), 'cyan')}  ${c((ch||0).toFixed(2) + '%', 'red')}`);
  });
  console.log('');
}

async function cmdCoin() {
  const id = args[1];
  if (!id) error('Usage: chainboss coin <id> (e.g. bitcoin, ethereum, solana)');
  const key = ensureKey();
  const data = await api(`/api/coin/${id}`, key);
  console.log('');
  console.log(`  ${c(data.name || id, 'bold')} (${data.symbol || '?'})`);
  console.log(`  ${c('Rank:', 'dim')} #${data.market_cap_rank || '?'}`);
  if (data.price) console.log(`  ${c('Price:', 'dim')} ${c('$' + (Object.values(data.price)[0]?.toLocaleString() || '?'), 'cyan')}`);
  if (data.price_change_24h != null) {
    const v = data.price_change_24h;
    console.log(`  ${c('24h:', 'dim')} ${c((v >= 0 ? '+' : '') + v.toFixed(2) + '%', v >= 0 ? 'green' : 'red')}`);
  }
  if (data.market_cap) console.log(`  ${c('Market Cap:', 'dim')} $${(Object.values(data.market_cap)[0] / 1e9).toFixed(2)}B`);
  if (data.volume_24h) console.log(`  ${c('Volume 24h:', 'dim')} $${(Object.values(data.volume_24h)[0] / 1e9).toFixed(2)}B`);
  if (data.circulating_supply) console.log(`  ${c('Supply:', 'dim')} ${(data.circulating_supply / 1e6).toFixed(2)}M / ${data.max_supply ? (data.max_supply / 1e6).toFixed(2) + 'M' : '∞'}`);
  if (data.description) console.log(`  ${c('About:', 'dim')} ${data.description.substring(0, 200)}...`);
  console.log('');
}

async function cmdGlobal() {
  const key = ensureKey();
  const data = await api('/api/global', key);
  console.log('');
  console.log(`  ${c('Global Market', 'bold')}`);
  if (data.total_market_cap_usd) console.log(`  ${c('Market Cap:', 'dim')} ${c('$' + (data.total_market_cap_usd / 1e12).toFixed(2) + 'T', 'cyan')}`);
  if (data.total_volume_usd) console.log(`  ${c('24h Volume:', 'dim')} ${c('$' + (data.total_volume_usd / 1e9).toFixed(2) + 'B', 'cyan')}`);
  if (data.btc_dominance != null) console.log(`  ${c('BTC Dominance:', 'dim')} ${data.btc_dominance.toFixed(1)}%`);
  if (data.active_cryptocurrencies) console.log(`  ${c('Active Coins:', 'dim')} ${data.active_cryptocurrencies}`);
  console.log('');
}

async function cmdGas() {
  const key = ensureKey();
  const data = await api('/api/gas', key);
  const gas = data.gas || {};
  console.log('');
  console.log('  ' + c('Ethereum Gas', 'bold'));
  Object.entries(gas).forEach(([k, v]) => console.log(`  ${c(k.padEnd(10), 'dim')} ${c(v, 'cyan')}`));
  console.log('');
}

async function cmdFearGreed() {
  const key = ensureKey();
  const data = await api('/api/fear-greed?limit=1', key);
  const current = data.current || data.data?.[0] || {};
  const val = parseInt(current.value) || 0;
  const cls = current.classification || current.value_classification || '—';
  console.log('');
  console.log(`  ${c('Fear & Greed', 'bold')}: ${c(String(val), val > 50 ? 'green' : 'red')} ${c('(' + cls + ')', 'dim')}`);
  if (data.history?.length > 1) {
    const prev = data.history[1];
    console.log(`  ${c('Prev:', 'dim')} ${prev.value} (${prev.classification})`);
  }
  console.log('');
}

async function cmdMemeScan() {
  const key = ensureKey();
  const data = await api('/api/meme/scan?limit=15', key);
  const coins = data.coins || [];
  console.log('');
  console.log(`  ${c('Recent Meme Tokens', 'bold')}${c('  (DexScreener)', 'dim')}`);
  console.log('');
  coins.forEach(c2 => {
    const liq = c2.liquidity ? '$' + (c2.liquidity > 1000 ? (c2.liquidity/1000).toFixed(1) + 'K' : c2.liquidity.toFixed(0)) : '?';
    const vol = c2.volume_24h ? '$' + (c2.volume_24h > 1000 ? (c2.volume_24h/1000).toFixed(1) + 'K' : c2.volume_24h.toFixed(0)) : '';
    console.log(`  ${c(c2.symbol?.padEnd(10) || '?'.padEnd(10), 'bold')} ${c((c2.name || '').substring(0,16).padEnd(16), 'dim')} ${c(liq.padStart(10), 'cyan')} ${c(vol.padStart(10), 'yellow')}`);
  });
  console.log('');
}

async function cmdMemeAnalyze() {
  const address = args[1];
  if (!address) error('Usage: chainboss meme-analyze <token-address>');
  const key = ensureKey();
  const data = await api(`/api/meme/analyze?address=${address}`, key);
  const analysis = data.analysis || {};
  const risk = analysis.rug_risk || {};
  console.log('');
  console.log(`  ${c(analysis.name || 'Token', 'bold')} (${analysis.symbol || '?'})`);
  if (analysis.chains?.length) console.log(`  ${c('Chain:', 'dim')} ${analysis.chains.join(', ')}`);
  console.log(`  ${c('Price:', 'dim')} ${c('$' + (analysis.price || 0), 'cyan')}`);
  console.log(`  ${c('Liquidity:', 'dim')} ${c('$' + (analysis.total_liquidity?.toLocaleString() || 0), 'cyan')}`);
  console.log(`  ${c('Volume 24h:', 'dim')} ${c('$' + (analysis.volume_24h?.toLocaleString() || 0), 'cyan')}`);
  if (analysis.age_hours) console.log(`  ${c('Age:', 'dim')} ${analysis.age_hours}`);
  if (risk.level) {
    const color = risk.level === 'high' ? 'red' : risk.level === 'medium' ? 'yellow' : 'green';
    console.log(`  ${c('Risk:', 'dim')} ${c(risk.level.toUpperCase(), color)} (${risk.score}/${risk.max_score})`);
    (risk.flags || []).forEach(f => console.log(`    ${c('⚠', 'yellow')} ${f}`));
  }
  console.log('');
}

async function cmdDeFiYields() {
  const key = ensureKey();
  const data = await api('/api/defi/yields?limit=15', key);
  const pools = data.pools || [];
  console.log('');
  console.log(`  ${c('DeFi Yield Opportunities', 'bold')}`);
  console.log('');
  pools.forEach(p => {
    console.log(`  ${c(p.symbol?.padEnd(12) || '?'.padEnd(12), 'bold')} ${c(p.chain?.padEnd(10) || '', 'dim')} ${c((p.apy||0).toFixed(2) + '%', 'green')} ${c('TVL: $' + ((p.tvl_usd||0)/1e6).toFixed(1) + 'M', 'dim')} ${c(p.project || '', 'yellow')}`);
  });
  console.log('');
}

async function cmdDeFiTVL() {
  const limit = args[1] || 15;
  const key = ensureKey();
  const data = await api(`/api/defi/tvl?limit=${limit}`, key);
  const protocols = data.protocols || [];
  console.log('');
  console.log(`  ${c('Top Protocols by TVL', 'bold')}`);
  console.log('');
  protocols.forEach((p, i) => {
    console.log(`  ${c(String(i+1).padStart(2,'0'), 'dim')}  ${c(p.name?.padEnd(20) || '?'.padEnd(20), 'bold')} ${c('$' + ((p.tvl||0)/1e9).toFixed(2) + 'B', 'cyan')} ${p.tvl_change_24h != null ? c((p.tvl_change_24h >= 0 ? '+' : '') + p.tvl_change_24h.toFixed(1) + '%', p.tvl_change_24h >= 0 ? 'green' : 'red') : ''}`);
  });
  console.log('');
}

async function cmdDefiPools() {
  const limit = args[1] || 15;
  const key = ensureKey();
  const data = await api(`/api/defi/pools?limit=${limit}`, key);
  const pools = data.pools || [];
  console.log('');
  console.log(`  ${c('Top Liquidity Pools', 'bold')}`);
  console.log('');
  pools.forEach(p => {
    console.log(`  ${c(p.symbol?.padEnd(14) || '?'.padEnd(14), 'bold')} ${c(p.chain?.padEnd(10) || '', 'dim')} ${c('TVL: $' + ((p.tvl_usd||0)/1e6).toFixed(1) + 'M', 'cyan')} ${c('APY: ' + (p.apy||0).toFixed(2) + '%', 'green')}`);
  });
  console.log('');
}

async function cmdUsage() {
  const key = getKey();
  if (!key) error('No API key. Run "chainboss register" first.');
  const data = await api('/api/usage', key);
  console.log('');
  console.log(c('  API Key Usage', 'cyan'));
  console.log(c('  ─────────────', 'dim'));
  console.log(`  ${c('Balance:', 'dim')} ${c('$' + (data.balance_usd || '$' + (data.balance/1000000).toFixed(2)), 'green')}`);
  console.log(`  ${c('Used:', 'dim')} ${c('$' + (data.used_usd || '$' + (data.total_used/1000000).toFixed(2)), 'yellow')}`);
  console.log(`  ${c('Total Paid:', 'dim')} ${c('$' + (data.total_paid/1000000).toFixed(2), 'dim')}`);
  if (data.requires_payment) console.log(`  ${c('⚠ Payment required — send $1 USDC', 'yellow')}`);
  console.log('');
}

async function cmdConfig() {
  console.log('');
  console.log(c('  ChainBoss Config', 'cyan'));
  console.log(c('  ────────────────', 'dim'));
  if (cfg.key) {
    console.log('  Key:  ' + c(cfg.key, 'green'));
    console.log('  Path: ' + c(CONFIG_FILE, 'dim'));
    console.log('');
    console.log(c('  Commands to try:', 'dim'));
    console.log('    chainboss price bitcoin,ethereum');
    console.log('    chainboss gas');
    console.log('    chainboss fear-greed');
    console.log('    chainboss meme-scan');
  } else {
    console.log('  ' + c('No key configured. Run:', 'yellow'));
    console.log('    ' + c('chainboss register', 'cyan'));
  }
  console.log('');
}

async function cmdHelp() {
  console.log('');
  console.log(c('  ChainBoss CLI', 'cyan') + c(' — Crypto API for AI agents', 'dim'));
  console.log('  ' + c('21 MCP tools · Post-paid $1 USDC · Zero signup', 'dim'));
  console.log('');
  console.log(c('  Usage:', 'bold'));
  console.log('    chainboss <command> [options]');
  console.log('');
  console.log(c('  Auth:', 'bold'));
  console.log('    ' + c('register', 'green') + '          ' + c('Generate a free API key with $1 credit', 'dim'));
  console.log('    ' + c('usage', 'green') + '             ' + c('Check your API key balance and usage', 'dim'));
  console.log('    ' + c('config', 'green') + '            ' + c('Show saved config', 'dim'));
  console.log('');
  console.log(c('  Market Data:', 'bold'));
  console.log('    ' + c('price', 'green') + '             ' + c('Get prices for coins (default: bitcoin,ethereum)', 'dim'));
  console.log('    ' + c('trending', 'green') + '          ' + c('Trending coins on CoinGecko', 'dim'));
  console.log('    ' + c('top', 'green') + '               ' + c('Top coins by market cap', 'dim'));
  console.log('    ' + c('gainers', 'green') + '           ' + c('Top gainers (24h)', 'dim'));
  console.log('    ' + c('losers', 'green') + '            ' + c('Top losers (24h)', 'dim'));
  console.log('    ' + c('coin', 'green') + '              ' + c('Detailed info on a specific coin', 'dim'));
  console.log('    ' + c('global', 'green') + '            ' + c('Global market stats', 'dim'));
  console.log('');
  console.log(c('  DeFi:', 'bold'));
  console.log('    ' + c('defi-yields', 'green') + '       ' + c('Top DeFi yield opportunities', 'dim'));
  console.log('    ' + c('defi-tvl', 'green') + '          ' + c('Top protocols by TVL', 'dim'));
  console.log('    ' + c('defi-pools', 'green') + '        ' + c('Top liquidity pools', 'dim'));
  console.log('');
  console.log(c('  Meme Coins:', 'bold'));
  console.log('    ' + c('meme-scan', 'green') + '         ' + c('Scan new meme tokens', 'dim'));
  console.log('    ' + c('meme-analyze', 'green') + '      ' + c('Analyze a token for rug risk', 'dim'));
  console.log('');
  console.log(c('  On-Chain:', 'bold'));
  console.log('    ' + c('gas', 'green') + '               ' + c('Ethereum gas prices', 'dim'));
  console.log('    ' + c('fear-greed', 'green') + '        ' + c('Fear & Greed index', 'dim'));
  console.log('');
  console.log(c('  Options:', 'bold'));
  console.log('    --key=cd_...     ' + c('Use a specific API key (overrides saved key)', 'dim'));
  console.log('');
  console.log(c('  Examples:', 'bold'));
  console.log('    chainboss register');
  console.log('    chainboss price bitcoin,ethereum,solana');
  console.log('    chainboss top 25');
  console.log('    chainboss gainers');
  console.log('    chainboss coin bitcoin');
  console.log('    chainboss gas');
  console.log('    chainboss meme-scan');
  console.log('    chainboss meme-analyze So11111111111111111111111111111111111111112');
  console.log('    chainboss defi-yields');
  console.log('    chainboss defi-tvl');
  console.log('    chainboss usage --key=cd_abc123');
  console.log('');
  console.log(c('  Links:', 'dim'));
  console.log('    ' + c('https://cryptoboss.space', 'cyan'));
  console.log('');
}

const commands = {
  register: cmdRegister, price: cmdPrice, trending: cmdTrending, top: cmdTop,
  gainers: cmdGainers, losers: cmdLosers, coin: cmdCoin, global: cmdGlobal,
  gas: cmdGas, 'fear-greed': cmdFearGreed, 'fear': cmdFearGreed, 'fng': cmdFearGreed,
  'meme-scan': cmdMemeScan, 'meme-analyze': cmdMemeAnalyze, 'meme': cmdMemeAnalyze,
  'defi-yields': cmdDeFiYields, 'defi-tvl': cmdDeFiTVL, 'defi-pools': cmdDefiPools,
  yields: cmdDeFiYields, tvl: cmdDeFiTVL,
  usage: cmdUsage, config: cmdConfig, help: cmdHelp,
};

if (commands[cmd]) {
  commands[cmd]().catch(e => error(e.message));
} else {
  console.error(c('Unknown command: ' + cmd, 'red'));
  cmdHelp().catch(() => {});
}
