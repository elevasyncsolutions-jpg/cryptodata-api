const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'free-tier';

function authenticate(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.key;
  if (key === API_KEY || API_KEY === 'free-tier') return next();
  return res.status(401).json({ error: 'Invalid API key' });
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'CryptoAPI/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON')); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const cache = {};
function cacheKey(prefix, params) { return `${prefix}:${JSON.stringify(params)}`; }
function getCached(key, ttl = 60000) {
  const c = cache[key];
  if (c && Date.now() - c.ts < ttl) return c.data;
  return null;
}
function setCache(key, data) { cache[key] = { data, ts: Date.now() }; }

// ─── PRICE ──────────────────────────────────────────
app.get('/api/price', authenticate, async (req, res) => {
  const coins = req.query.coins || 'bitcoin,ethereum';
  const vs = req.query.vs || 'usd';
  const key = cacheKey('price', { coins, vs });
  const cached = getCached(key, 30000);
  if (cached) return res.json(cached);

  try {
    const data = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=${vs}&include_24hr_change=true&include_market_cap=true`);
    const result = { source: 'coingecko', coins, vs, prices: data, timestamp: new Date().toISOString() };
    setCache(key, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TRENDING ────────────────────────────────────────
app.get('/api/trending', authenticate, async (req, res) => {
  const key = cacheKey('trending', {});
  const cached = getCached(key, 120000);
  if (cached) return res.json(cached);

  try {
    const data = await fetch('https://api.coingecko.com/api/v3/search/trending');
    const coins = data.coins?.map(c => ({
      name: c.item.name,
      symbol: c.item.symbol,
      market_cap_rank: c.item.market_cap_rank,
      price_btc: c.item.price_btc,
      score: c.item.score,
      thumb: c.item.thumb,
    })) || [];
    const result = { source: 'coingecko', trending: coins, count: coins.length, timestamp: new Date().toISOString() };
    setCache(key, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TOP COINS ───────────────────────────────────────
app.get('/api/top', authenticate, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const vs = req.query.vs || 'usd';
  const key = cacheKey('top', { limit, vs });
  const cached = getCached(key, 60000);
  if (cached) return res.json(cached);

  try {
    const data = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=1h,24h,7d`);
    const result = { source: 'coingecko', coins: data, count: data.length, vs, timestamp: new Date().toISOString() };
    setCache(key, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FEAR & GREED ────────────────────────────────────
app.get('/api/fear-greed', authenticate, async (req, res) => {
  const limit = parseInt(req.query.limit) || 30;
  const key = cacheKey('fg', { limit });
  const cached = getCached(key, 300000);
  if (cached) return res.json(cached);

  try {
    const data = await fetch(`https://api.alternative.me/fng/?limit=${limit}`);
    const entries = data.data?.map(d => ({
      value: parseInt(d.value),
      classification: d.value_classification,
      timestamp: d.timestamp,
      date: new Date(parseInt(d.timestamp) * 1000).toISOString(),
    })) || [];
    const result = {
      source: 'alternative.me',
      current: entries[0] || null,
      history: entries,
      count: entries.length,
      timestamp: new Date().toISOString(),
    };
    setCache(key, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GAS PRICES ──────────────────────────────────────
app.get('/api/gas', authenticate, async (req, res) => {
  const key = cacheKey('gas', {});
  const cached = getCached(key, 30000);
  if (cached) return res.json(cached);

  try {
    const data = await fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle');
    const gas = data.result?.SafeGasPrice ? {
      low: data.result.SafeGasPrice,
      average: data.result.ProposeGasPrice,
      fast: data.result.FastGasPrice,
      base_fee: data.result.BaseFee,
    } : null;

    const result = {
      source: 'etherscan',
      chain: 'ethereum',
      gas: gas || { low: '~20', average: '~30', fast: '~50' },
      note: 'Prices in Gwei. Etherscan free tier may hit rate limits.',
      timestamp: new Date().toISOString(),
    };
    setCache(key, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GLOBAL MARKET ───────────────────────────────────
app.get('/api/global', authenticate, async (req, res) => {
  const key = cacheKey('global', {});
  const cached = getCached(key, 60000);
  if (cached) return res.json(cached);

  try {
    const data = await fetch('https://api.coingecko.com/api/v3/global');
    const g = data.data;
    const result = {
      source: 'coingecko',
      total_market_cap: g.total_market_cap,
      total_volume: g.total_volume,
      market_cap_percentage: g.market_cap_percentage,
      active_cryptocurrencies: g.active_cryptocurrencies,
      markets: g.markets,
      btc_dominance: g.market_cap_percentage?.usd,
      timestamp: new Date().toISOString(),
    };
    setCache(key, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── COIN DETAIL ─────────────────────────────────────
app.get('/api/coin/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const key = cacheKey('coin', { id });
  const cached = getCached(key, 60000);
  if (cached) return res.json(cached);

  try {
    const data = await fetch(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`);
    const result = {
      source: 'coingecko',
      id: data.id,
      name: data.name,
      symbol: data.symbol,
      description: data.description?.en?.substring(0, 500),
      market_cap_rank: data.market_cap_rank,
      price: data.market_data?.current_price,
      market_cap: data.market_data?.market_cap,
      volume: data.market_data?.total_volume,
      price_change_24h: data.market_data?.price_change_percentage_24h,
      price_change_7d: data.market_data?.price_change_percentage_7d,
      ath: data.market_data?.ath,
      atl: data.market_data?.atl,
      categories: data.categories,
      homepage: data.links?.homepage?.filter(Boolean),
      timestamp: new Date().toISOString(),
    };
    setCache(key, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── HEALTH ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ─── DOCS ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'CryptoData API',
    version: '1.0.0',
    description: 'Unified crypto data API. Real-time prices, trending coins, Fear & Greed index, gas prices, global market data.',
    endpoints: [
      { method: 'GET', path: '/api/price?coins=bitcoin,ethereum&vs=usd', desc: 'Real-time prices + 24h change + market cap' },
      { method: 'GET', path: '/api/top?limit=20&vs=usd', desc: 'Top coins by market cap' },
      { method: 'GET', path: '/api/trending', desc: 'Trending coins right now' },
      { method: 'GET', path: '/api/fear-greed?limit=30', desc: 'Fear & Greed index history' },
      { method: 'GET', path: '/api/gas', desc: 'Ethereum gas prices' },
      { method: 'GET', path: '/api/global', desc: 'Global crypto market stats' },
      { method: 'GET', path: '/api/coin/bitcoin', desc: 'Detailed coin info' },
      { method: 'GET', path: '/api/health', desc: 'Health check' },
    ],
    pricing: 'RapidAPI marketplace — Free tier (100 req/mo) + Pro ($9.99/mo unlimited)',
    data_sources: ['CoinGecko', 'Alternative.me', 'Etherscan'],
  });
});

app.listen(PORT, () => {
  console.log(`CryptoData API running on port ${PORT}`);
});
