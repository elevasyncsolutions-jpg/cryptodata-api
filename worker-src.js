// ─── LANDING PAGE ───────────────────────────────────
const LANDING_HTML = `__LANDING_HTML__`;

// ─── CACHE ──────────────────────────────────────────
const cache = {};
function getCached(key, ttl = 60000) {
  const c = cache[key];
  if (c && Date.now() - c.ts < ttl) return c.data;
  return null;
}
function setCached(key, data) { cache[key] = { data, ts: Date.now() }; }

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

async function fetchJSON(url) {
  const cached = getCached(url);
  if (cached) return cached;
  const res = await fetch(url, { headers: { "User-Agent": "CryptoDataAPI/1.0" } });
  const data = await res.json();
  setCached(url, data);
  return data;
}

// ─── ROUTER ─────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ────── MARKET DATA ──────────────────────────
      if (path === "/api/price") {
        const coins = url.searchParams.get("coins") || "bitcoin,ethereum";
        const vs = url.searchParams.get("vs") || "usd";
        const data = await fetchJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=${vs}&include_24hr_change=true&include_market_cap=true`);
        return json({ source: "coingecko", coins, vs, prices: data, timestamp: new Date().toISOString() });
      }

      if (path === "/api/trending") {
        const data = await fetchJSON("https://api.coingecko.com/api/v3/search/trending");
        const coins = (data.coins || []).map((c) => ({
          name: c.item.name, symbol: c.item.symbol, market_cap_rank: c.item.market_cap_rank, score: c.item.score, price_btc: c.item.price_btc,
        }));
        return json({ source: "coingecko", trending: coins, count: coins.length, timestamp: new Date().toISOString() });
      }

      if (path === "/api/top") {
        const limit = Math.min(parseInt(url.searchParams.get("limit")) || 20, 100);
        const vs = url.searchParams.get("vs") || "usd";
        const data = await fetchJSON(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=1h,24h,7d,30d`);
        return json({ source: "coingecko", coins: data, count: data.length, vs, timestamp: new Date().toISOString() });
      }

      if (path === "/api/top-gainers") {
        const vs = url.searchParams.get("vs") || "usd";
        const limit = Math.min(parseInt(url.searchParams.get("limit")) || 10, 50);
        const data = await fetchJSON(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs}&order=volume_desc&per_page=250&sparkline=false&price_change_percentage=24h`);
        const coins = data.filter((c) => c.price_change_percentage_24h > 0).sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, limit);
        return json({ source: "coingecko", direction: "gainers", coins, count: coins.length, timestamp: new Date().toISOString() });
      }

      if (path === "/api/top-losers") {
        const vs = url.searchParams.get("vs") || "usd";
        const limit = Math.min(parseInt(url.searchParams.get("limit")) || 10, 50);
        const data = await fetchJSON(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs}&order=volume_desc&per_page=250&sparkline=false&price_change_percentage=24h`);
        const coins = data.filter((c) => c.price_change_percentage_24h < 0).sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, limit);
        return json({ source: "coingecko", direction: "losers", coins, count: coins.length, timestamp: new Date().toISOString() });
      }

      if (path === "/api/global") {
        const data = await fetchJSON("https://api.coingecko.com/api/v3/global");
        const g = data.data;
        return json({
          source: "coingecko",
          total_market_cap_usd: g.total_market_cap?.usd,
          total_volume_usd: g.total_volume?.usd,
          btc_dominance: g.market_cap_percentage?.usd,
          active_cryptocurrencies: g.active_cryptocurrencies,
          markets: g.markets,
          market_cap_percentage: g.market_cap_percentage,
          timestamp: new Date().toISOString(),
        });
      }

      if (path.startsWith("/api/coin/")) {
        const id = path.replace("/api/coin/", "");
        const data = await fetchJSON(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`);
        return json({
          id: data.id, name: data.name, symbol: data.symbol,
          description: data.description?.en?.substring(0, 800),
          market_cap_rank: data.market_cap_rank,
          price: data.market_data?.current_price,
          market_cap: data.market_data?.market_cap,
          volume_24h: data.market_data?.total_volume,
          price_change_24h: data.market_data?.price_change_percentage_24h,
          price_change_7d: data.market_data?.price_change_percentage_7d,
          price_change_30d: data.market_data?.price_change_percentage_30d,
          ath: data.market_data?.ath, atl: data.market_data?.atl,
          high_24h: data.market_data?.high_24h, low_24h: data.market_data?.low_24h,
          circulating_supply: data.market_data?.circulating_supply,
          total_supply: data.market_data?.total_supply,
          max_supply: data.market_data?.max_supply,
          categories: data.categories,
          homepage: data.links?.homepage?.filter(Boolean),
          blockchain_explorers: data.links?.blockchain_site?.filter(Boolean),
          social: {
            twitter: data.links?.twitter_screen_name,
            reddit: `https://reddit.com/r/${data.links?.subreddit_url}`,
          },
          genesis_date: data.genesis_date,
          timestamp: new Date().toISOString(),
        });
      }

      if (path === "/api/categories") {
        const data = await fetchJSON("https://api.coingecko.com/api/v3/coins/categories");
        const cats = data.sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0)).slice(0, 50).map((c) => ({
          name: c.name, id: c.id, market_cap: c.market_cap, volume_24h: c.volume_24h, top_coin: c.top_3_coins?.[0],
        }));
        return json({ source: "coingecko", categories: cats, count: cats.length, timestamp: new Date().toISOString() });
      }

      // ────── DEFI ─────────────────────────────────
      if (path === "/api/defi/yields") {
        const minApy = parseFloat(url.searchParams.get("minApy")) || 0;
        const chain = url.searchParams.get("chain") || "all";
        const limit = Math.min(parseInt(url.searchParams.get("limit")) || 20, 100);
        const data = await fetchJSON("https://yields.llama.fi/pools");
        let pools = data.data || [];
        if (chain !== "all") pools = pools.filter((p) => p.chain?.toLowerCase() === chain.toLowerCase());
        pools = pools.filter((p) => p.apy >= minApy).sort((a, b) => b.apy - a.apy).slice(0, limit);
        const result = pools.map((p) => ({
          symbol: p.symbol, chain: p.chain, project: p.project,
          apy: parseFloat(p.apy?.toFixed(2)), tvl_usd: p.tvlUsd,
          reward_tokens: p.rewardTokens, pool: p.pool,
          apy_base: p.apyBase, apy_reward: p.apyReward,
          il_risk: p.ilRisk, exposure: p.exposure,
        }));
        return json({ source: "defillama", chain, pools: result, count: result.length, timestamp: new Date().toISOString() });
      }

      if (path === "/api/defi/tvl") {
        const limit = Math.min(parseInt(url.searchParams.get("limit")) || 30, 200);
        const chain = url.searchParams.get("chain") || "all";
        const data = await fetchJSON("https://api.llama.fi/protocols");
        let protocols = data;
        if (chain !== "all") protocols = protocols.filter((p) => p.chains?.includes(chain));
        protocols = protocols.sort((a, b) => b.tvl - a.tvl).slice(0, limit);
        const result = protocols.map((p) => ({
          name: p.name, slug: p.slug, symbol: p.symbol,
          tvl: p.tvl, tvl_change_24h: p.change_1d,
          chains: p.chains, mcap: p.mcap,
          category: p.category,
        }));
        return json({ source: "defillama", chain, protocols: result, count: result.length, timestamp: new Date().toISOString() });
      }

      if (path === "/api/defi/pools") {
        const chain = url.searchParams.get("chain") || "all";
        const sortBy = url.searchParams.get("sort") || "tvl";
        const limit = Math.min(parseInt(url.searchParams.get("limit")) || 20, 100);
        const data = await fetchJSON("https://yields.llama.fi/pools");
        let pools = data.data || [];
        if (chain !== "all") pools = pools.filter((p) => p.chain?.toLowerCase() === chain.toLowerCase());
        const sorted = sortBy === "apy" ? pools.sort((a, b) => b.apy - a.apy) : pools.sort((a, b) => (b.tvlUsd || 0) - (a.tvlUsd || 0));
        const result = sorted.slice(0, limit).map((p) => ({
          symbol: p.symbol, chain: p.chain, project: p.project,
          apy: parseFloat(p.apy?.toFixed(2)), tvl_usd: p.tvlUsd, pool: p.pool,
        }));
        return json({ source: "defillama", chain, sort_by: sortBy, pools: result, count: result.length, timestamp: new Date().toISOString() });
      }

      if (path.startsWith("/api/defi/protocol/")) {
        const slug = path.replace("/api/defi/protocol/", "");
        const data = await fetchJSON(`https://api.llama.fi/protocol/${slug}`);
        return json({
          name: data.name, slug: data.slug, symbol: data.symbol,
          tvl: data.tvl, tvl_change_24h: data.change_1d, tvl_change_7d: data.change_7d,
          mcap: data.mcap, category: data.category,
          chains: data.chains,
          chain_tvls: data.chainTvls,
          current_chain_tvls: data.currentChainTvls,
          description: data.description?.substring(0, 500),
          url: data.url, twitter: data.twitter,
          audit_note: data.auditNote,
          gecko_id: data.gecko_id,
          timestamp: new Date().toISOString(),
        });
      }

      // ────── DEX & MEME ───────────────────────────
      if (path === "/api/meme/scan") {
        const chain = url.searchParams.get("chain") || "all";
        const minLiq = parseInt(url.searchParams.get("minLiq")) || 100;
        const limit = Math.min(parseInt(url.searchParams.get("limit")) || 20, 50);
        const profiles = await fetchJSON("https://api.dexscreener.com/token-profiles/latest/v1");
        let filtered = chain === "all" ? profiles : profiles.filter((p) => p.chainId === chain);
        const coins = [];
        for (const p of filtered.slice(0, limit)) {
          try {
            const detail = await fetchJSON(`https://api.dexscreener.com/latest/dex/tokens/${p.tokenAddress}`);
            const pair = detail.pairs?.sort((a, b) => (parseFloat(b.liquidity?.usd) || 0) - (parseFloat(a.liquidity?.usd) || 0))[0];
            const liq = parseFloat(pair?.liquidity?.usd) || 0;
            if (liq < minLiq) continue;
            const name = pair?.baseToken?.name || p.tokenAddress?.slice(0, 10);
            if (name.includes("Wrapped") || name === "Solana" || name === "Ethereum") continue;
            coins.push({
              name, symbol: pair?.baseToken?.symbol || "???", address: p.tokenAddress,
              chain: p.chainId, price: parseFloat(pair?.priceUsd) || 0,
              liquidity: liq, volume_24h: parseFloat(pair?.volume?.h24) || 0,
              fdv: parseFloat(pair?.fdv) || 0, pair: pair?.pairAddress, url: p.url,
              age_hours: pair?.pairCreatedAt ? ((Date.now() - pair.pairCreatedAt) / 3600000).toFixed(1) + "h" : null,
              txns_24h: pair?.txns?.h24 ? { buys: pair.txns.h24.buys, sells: pair.txns.h24.sells } : null,
              price_change_5m: pair?.priceChange?.m5, price_change_1h: pair?.priceChange?.h1,
            });
          } catch {}
        }
        return json({ source: "dexscreener", chain, coins, count: coins.length, scanned_at: new Date().toISOString() });
      }

      if (path === "/api/meme/analyze") {
        const address = url.searchParams.get("address");
        if (!address) return json({ error: "address parameter required" }, 400);
        const data = await fetchJSON(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
        const pairs = data.pairs || [];
        const bestPair = pairs.sort((a, b) => (parseFloat(b.liquidity?.usd) || 0) - (parseFloat(a.liquidity?.usd) || 0))[0];
        const totalLiq = pairs.reduce((s, p) => s + (parseFloat(p.liquidity?.usd) || 0), 0);
        const totalVol = pairs.reduce((s, p) => s + (parseFloat(p.volume?.h24) || 0), 0);
        const topLiq = parseFloat(bestPair?.liquidity?.usd) || 0;
        let score = 0; const flags = [];
        if (totalLiq < 5000) { score += 3; flags.push("Very low liquidity (<$5K)"); }
        else if (totalLiq < 10000) { score += 2; flags.push("Low liquidity (<$10K)"); }
        if (pairs.length === 1) { score += 2; flags.push("Single trading pair"); }
        if (topLiq > 0 && totalLiq > 0 && topLiq / totalLiq > 0.9) { score += 1; flags.push("Liquidity concentrated"); }
        if (totalLiq > 0 && totalVol / totalLiq > 20) { score += 2; flags.push(`Vol/liq ratio ${(totalVol/totalLiq).toFixed(1)}x (wash trading?)`); }
        const ages = pairs.map((p) => p.pairCreatedAt ? (Date.now() - p.pairCreatedAt) : Infinity);
        const minAge = Math.min(...ages);
        if (minAge < 3600000) { score += 2; flags.push("<1 hour old"); }
        const level = score >= 5 ? "high" : score >= 3 ? "medium" : "low";
        return json({
          source: "dexscreener",
          analysis: {
            address, name: bestPair?.baseToken?.name || "unknown",
            symbol: bestPair?.baseToken?.symbol || "unknown",
            chains: [...new Set(pairs.map((p) => p.chainId))],
            price: parseFloat(bestPair?.priceUsd) || 0,
            total_liquidity: totalLiq, best_liquidity: parseFloat(bestPair?.liquidity?.usd) || 0,
            volume_24h: totalVol, fdv: parseFloat(bestPair?.fdv) || 0,
            pairs_count: pairs.length, age_hours: minAge !== Infinity ? (minAge / 3600000).toFixed(1) + "h" : null,
            rug_risk: { score, level, max_score: 11, flags, timestamp: new Date().toISOString() },
          },
          scanned_at: new Date().toISOString(),
        });
      }

      if (path === "/api/meme/trending") {
        const chain = url.searchParams.get("chain") || "all";
        const limit = Math.min(parseInt(url.searchParams.get("limit")) || 15, 50);
        const profiles = await fetchJSON("https://api.dexscreener.com/token-profiles/latest/v1");
        let filtered = chain === "all" ? profiles : profiles.filter((p) => p.chainId === chain);
        const coins = [];
        for (const p of filtered.slice(0, Math.min(limit * 3, 60))) {
          try {
            const detail = await fetchJSON(`https://api.dexscreener.com/latest/dex/tokens/${p.tokenAddress}`);
            const pairs = detail.pairs || [];
            const vol = pairs.reduce((s, pa) => s + (parseFloat(pa.volume?.h24) || 0), 0);
            if (vol > 0) coins.push({ address: p.tokenAddress, chain: p.chainId, url: p.url, volume_24h: vol });
          } catch {}
        }
        coins.sort((a, b) => b.volume_24h - a.volume_24h);
        return json({ source: "dexscreener", chain, coins: coins.slice(0, limit), count: Math.min(limit, coins.length), scanned_at: new Date().toISOString() });
      }

      // ────── ON-CHAIN ─────────────────────────────
      if (path === "/api/gas") {
        const data = await fetchJSON("https://api.etherscan.io/api?module=gastracker&action=gasoracle");
        const gas = data.result?.SafeGasPrice
          ? { low: `${data.result.SafeGasPrice} Gwei`, average: `${data.result.ProposeGasPrice} Gwei`, fast: `${data.result.FastGasPrice} Gwei`, base_fee: `${data.result.SuggestBaseFee || "?"} Gwei` }
          : { note: "Etherscan rate limited. Try again." };
        return json({ source: "etherscan", chain: "ethereum", gas, timestamp: new Date().toISOString() });
      }

      if (path === "/api/gas/all") {
        const [eth] = await Promise.all([
          fetchJSON("https://api.etherscan.io/api?module=gastracker&action=gasoracle").catch(() => ({})),
        ]);
        const gas = {};
        gas.ethereum = eth.result?.SafeGasPrice ? { low: eth.result.SafeGasPrice + " Gwei", average: eth.result.ProposeGasPrice + " Gwei", fast: eth.result.FastGasPrice + " Gwei" } : "rate_limited";
        return json({ source: "etherscan+public", gas, note: "Add more chains with their explorer APIs", timestamp: new Date().toISOString() });
      }

      // ────── SENTIMENT ────────────────────────────
      if (path === "/api/fear-greed") {
        const limit = parseInt(url.searchParams.get("limit")) || 30;
        const data = await fetchJSON(`https://api.alternative.me/fng/?limit=${limit}`);
        const entries = (data.data || []).map((d) => ({
          value: parseInt(d.value), classification: d.value_classification,
          date: new Date(parseInt(d.timestamp) * 1000).toISOString(),
        }));
        return json({ source: "alternative.me", current: entries[0] || null, history: entries, timestamp: new Date().toISOString() });
      }

      // ────── AGGREGATED SUMMARY ───────────────────
      if (path === "/api/summary") {
        const results = await Promise.allSettled([
          fetchJSON("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true"),
          fetchJSON("https://api.alternative.me/fng/?limit=1"),
          fetchJSON("https://api.coingecko.com/api/v3/global"),
          fetchJSON("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=5&sparkline=false&price_change_percentage=24h"),
        ]);
        const priceData = results[0].status === "fulfilled" ? results[0].value : {};
        const fgData = results[1].status === "fulfilled" ? results[1].value : {};
        const globalData = results[2].status === "fulfilled" ? results[2].value : {};
        const topData = results[3].status === "fulfilled" ? results[3].value : [];
        const topVol = Array.isArray(topData) ? topData.slice(0, 5).map((c) => ({ name: c.name, symbol: c.symbol, price: c.current_price, change_24h: c.price_change_percentage_24h?.toFixed(2) + "%" })) : [];
        return json({
          prices: { btc: priceData?.bitcoin?.usd, eth: priceData?.ethereum?.usd, btc_24h: priceData?.bitcoin?.usd_24h_change?.toFixed(2) + "%" },
          fear_greed: { value: fgData?.data?.[0]?.value, classification: fgData?.data?.[0]?.value_classification },
          global: { total_market_cap: "$" + ((globalData?.data?.total_market_cap?.usd || 0) / 1e12).toFixed(2) + "T", btc_dominance: (globalData?.data?.market_cap_percentage?.btc || 0).toFixed(1) + "%" },
          top_volume: topVol,
          timestamp: new Date().toISOString(),
        });
      }

      // ────── LANDING PAGE ──────────────────────────
      if (path === "/") {
        const accept = request.headers.get("Accept") || "";
        if (accept.includes("text/html")) {
          return new Response(LANDING_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
        }
        return json({
          name: "CryptoData API", version: "2.0.0",
          base_url: `https://${url.host}`,
          docs: "Browse in a browser for the landing page. Use /api/* for JSON data.",
          sources: ["CoinGecko", "DeFiLlama", "DexScreener", "Alternative.me", "Etherscan"],
          timestamp: new Date().toISOString(),
        });
      }

      // ────── HEALTH ────────────────────────────────
      if (path === "/api/health") {
        return json({ status: "ok", version: "2.0.0", timestamp: new Date().toISOString() });
      }

      return json({ error: "Not found", docs: `/` }, 404);
    } catch (e) {
      return json({ error: `Internal error: ${e.message}`, timestamp: new Date().toISOString() }, 500);
    }
  },
};
