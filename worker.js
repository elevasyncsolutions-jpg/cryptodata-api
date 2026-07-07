export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    try {
      // ─── PRICE ──────────────────────────────────────
      if (path === "/api/price") {
        const coins = url.searchParams.get("coins") || "bitcoin,ethereum";
        const vs = url.searchParams.get("vs") || "usd";
        const data = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=${vs}&include_24hr_change=true&include_market_cap=true`,
          { headers: { "User-Agent": "CryptoDataAPI/1.0" } }
        ).then((r) => r.json());
        return json({ source: "coingecko", coins, vs, prices: data, timestamp: new Date().toISOString() }, headers);
      }

      // ─── TRENDING ──────────────────────────────────
      if (path === "/api/trending") {
        const data = await fetch("https://api.coingecko.com/api/v3/search/trending", {
          headers: { "User-Agent": "CryptoDataAPI/1.0" },
        }).then((r) => r.json());
        const coins = (data.coins || []).map((c) => ({
          name: c.item.name,
          symbol: c.item.symbol,
          market_cap_rank: c.item.market_cap_rank,
          score: c.item.score,
        }));
        return json({ source: "coingecko", trending: coins, count: coins.length, timestamp: new Date().toISOString() }, headers);
      }

      // ─── TOP COINS ─────────────────────────────────
      if (path === "/api/top") {
        const limit = Math.min(parseInt(url.searchParams.get("limit")) || 20, 100);
        const vs = url.searchParams.get("vs") || "usd";
        const data = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=1h,24h,7d`,
          { headers: { "User-Agent": "CryptoDataAPI/1.0" } }
        ).then((r) => r.json());
        return json({ source: "coingecko", coins: data, count: data.length, vs, timestamp: new Date().toISOString() }, headers);
      }

      // ─── FEAR & GREED ──────────────────────────────
      if (path === "/api/fear-greed") {
        const limit = parseInt(url.searchParams.get("limit")) || 30;
        const data = await fetch(`https://api.alternative.me/fng/?limit=${limit}`, {
          headers: { "User-Agent": "CryptoDataAPI/1.0" },
        }).then((r) => r.json());
        const entries = (data.data || []).map((d) => ({
          value: parseInt(d.value),
          classification: d.value_classification,
          date: new Date(parseInt(d.timestamp) * 1000).toISOString(),
        }));
        return json({ source: "alternative.me", current: entries[0] || null, history: entries, timestamp: new Date().toISOString() }, headers);
      }

      // ─── GAS ───────────────────────────────────────
      if (path === "/api/gas") {
        const data = await fetch("https://api.etherscan.io/api?module=gastracker&action=gasoracle", {
          headers: { "User-Agent": "CryptoDataAPI/1.0" },
        }).then((r) => r.json());
        const gas = data.result?.SafeGasPrice
          ? { low: `${data.result.SafeGasPrice} Gwei`, average: `${data.result.ProposeGasPrice} Gwei`, fast: `${data.result.FastGasPrice} Gwei` }
          : { note: "Rate limited" };
        return json({ source: "etherscan", chain: "ethereum", gas, timestamp: new Date().toISOString() }, headers);
      }

      // ─── GLOBAL ────────────────────────────────────
      if (path === "/api/global") {
        const data = await fetch("https://api.coingecko.com/api/v3/global", {
          headers: { "User-Agent": "CryptoDataAPI/1.0" },
        }).then((r) => r.json());
        const g = data.data;
        return json({
          source: "coingecko",
          total_market_cap_usd: g.total_market_cap?.usd,
          total_volume_usd: g.total_volume?.usd,
          btc_dominance: g.market_cap_percentage?.usd,
          active_cryptocurrencies: g.active_cryptocurrencies,
          markets: g.markets,
          timestamp: new Date().toISOString(),
        }, headers);
      }

      // ─── COIN DETAIL ───────────────────────────────
      if (path.startsWith("/api/coin/")) {
        const id = path.replace("/api/coin/", "");
        const data = await fetch(
          `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`,
          { headers: { "User-Agent": "CryptoDataAPI/1.0" } }
        ).then((r) => r.json());
        return json({
          id: data.id,
          name: data.name,
          symbol: data.symbol,
          description: data.description?.en?.substring(0, 500),
          market_cap_rank: data.market_cap_rank,
          price: data.market_data?.current_price,
          market_cap: data.market_data?.market_cap,
          volume_24h: data.market_data?.total_volume,
          price_change_24h: data.market_data?.price_change_percentage_24h,
          price_change_7d: data.market_data?.price_change_percentage_7d,
          ath: data.market_data?.ath,
          atl: data.market_data?.atl,
          homepage: data.links?.homepage?.filter(Boolean),
          timestamp: new Date().toISOString(),
        }, headers);
      }

      // ─── MEME COIN SCANNER ─────────────────────────
      if (path === "/api/meme/scan") {
        const chain = url.searchParams.get("chain") || "all";
        const minLiq = parseInt(url.searchParams.get("minLiq")) || 100;
        const limit = Math.min(parseInt(url.searchParams.get("limit")) || 20, 50);

        // Get latest token profiles
        const profiles = await fetch("https://api.dexscreener.com/token-profiles/latest/v1", {
          headers: { "User-Agent": "CryptoDataAPI/1.0" },
        }).then((r) => r.json());

        let filtered = profiles;
        if (chain !== "all") filtered = filtered.filter((p) => p.chainId === chain);

        // Get detailed data for each token
        const coins = [];
        for (const p of filtered.slice(0, limit)) {
          try {
            const detail = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${p.tokenAddress}`, {
              headers: { "User-Agent": "CryptoDataAPI/1.0" },
            }).then((r) => r.json());

            const pair = detail.pairs?.sort((a, b) => (parseFloat(b.liquidity?.usd) || 0) - (parseFloat(a.liquidity?.usd) || 0))[0];
            const liq = parseFloat(pair?.liquidity?.usd) || 0;
            if (liq < minLiq) continue;

            coins.push({
              name: pair?.baseToken?.name || p.tokenAddress.slice(0, 10),
              symbol: pair?.baseToken?.symbol || "???",
              address: p.tokenAddress,
              chain: p.chainId,
              price: parseFloat(pair?.priceUsd) || 0,
              liquidity: liq,
              volume_24h: parseFloat(pair?.volume?.h24) || 0,
              fdv: parseFloat(pair?.fdv) || 0,
              age_hours: pair?.pairCreatedAt ? ((Date.now() - pair.pairCreatedAt) / 3600000).toFixed(1) + "h" : null,
              pair: pair?.pairAddress,
              url: p.url,
              txns_24h: pair?.txns?.h24 ? { buys: pair.txns.h24.buys, sells: pair.txns.h24.sells } : null,
              price_change_5m: pair?.priceChange?.m5,
              price_change_1h: pair?.priceChange?.h1,
            });
          } catch {}
        }

        return json({ source: "dexscreener", chain, coins, count: coins.length, scanned_at: new Date().toISOString() }, headers);
      }

      // ─── MEME COIN ANALYZE ──────────────────────────
      if (path === "/api/meme/analyze") {
        const address = url.searchParams.get("address");
        if (!address) return json({ error: "address parameter required" }, { ...headers, status: 400 });

        const [dexData, tokenData] = await Promise.all([
          fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, {
            headers: { "User-Agent": "CryptoDataAPI/1.0" },
          }).then((r) => r.json()),
          fetch(`https://api.dexscreener.com/latest/dex/search?q=${address}`, {
            headers: { "User-Agent": "CryptoDataAPI/1.0" },
          }).then((r) => r.json()),
        ]);

        const pairs = dexData.pairs || [];
        const bestPair = pairs.sort((a, b) => (parseFloat(b.liquidity?.usd) || 0) - (parseFloat(a.liquidity?.usd) || 0))[0];

        const analysis = {
          address,
          name: bestPair?.baseToken?.name || "unknown",
          symbol: bestPair?.baseToken?.symbol || "unknown",
          chains: [...new Set(pairs.map((p) => p.chainId))],
          price: parseFloat(bestPair?.priceUsd) || 0,
          total_liquidity: pairs.reduce((s, p) => s + (parseFloat(p.liquidity?.usd) || 0), 0),
          best_liquidity: parseFloat(bestPair?.liquidity?.usd) || 0,
          volume_24h: pairs.reduce((s, p) => s + (parseFloat(p.volume?.h24) || 0), 0),
          fdv: parseFloat(bestPair?.fdv) || 0,
          age_hours: bestPair?.pairCreatedAt ? ((Date.now() - bestPair.pairCreatedAt) / 3600000).toFixed(1) + "h" : null,
          pairs_count: pairs.length,
          rug_risk: calculateRugRisk(pairs),
        };

        return json({ source: "dexscreener", analysis, scanned_at: new Date().toISOString() }, headers);
      }

      // ─── HEALTH ────────────────────────────────────
      if (path === "/api/health" || path === "/") {
        return json({ status: "ok", name: "CryptoData API", version: "1.0.0", timestamp: new Date().toISOString() }, headers);
      }

      return json({ error: "Not found. See / for docs." }, { ...headers, status: 404 });
    } catch (e) {
      return json({ error: e.message }, { ...headers, status: 500 });
    }
  },
};

function json(data, extra) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json", ...extra },
  });
}

function calculateRugRisk(pairs) {
  const totalLiq = pairs.reduce((s, p) => s + (parseFloat(p.liquidity?.usd) || 0), 0);
  const totalVol = pairs.reduce((s, p) => s + (parseFloat(p.volume?.h24) || 0), 0);
  const topPairLiq = parseFloat(pairs.sort((a, b) => (parseFloat(b.liquidity?.usd) || 0) - (parseFloat(a.liquidity?.usd) || 0))[0]?.liquidity?.usd) || 0;

  let score = 0;
  let reasons = [];

  // Low liquidity = high risk
  if (totalLiq < 5000) { score += 3; reasons.push("Very low liquidity (<$5K)"); }
  else if (totalLiq < 10000) { score += 2; reasons.push("Low liquidity (<$10K)"); }

  // Single pair concentration
  if (pairs.length === 1) { score += 2; reasons.push("Single trading pair"); }
  if (topPairLiq > 0 && totalLiq > 0 && topPairLiq / totalLiq > 0.9) { score += 1; reasons.push("Liquidity concentrated in one pair"); }

  // Volume vs liquidity ratio (wash trading indicator)
  if (totalLiq > 0 && totalVol / totalLiq > 20) { score += 2; reasons.push(`Volume/liquidity ratio unusually high (${(totalVol/totalLiq).toFixed(1)}x)`); }

  // No volume
  if (totalVol === 0) { score += 1; reasons.push("No trading volume"); }

  // Very new pair
  const ages = pairs.map((p) => p.pairCreatedAt ? (Date.now() - p.pairCreatedAt) : Infinity);
  const minAge = Math.min(...ages);
  if (minAge < 3600000) { score += 2; reasons.push("Less than 1 hour old"); }
  else if (minAge < 86400000) { score += 1; reasons.push("Less than 24 hours old"); }

  let level = "low";
  if (score >= 5) level = "high";
  else if (score >= 3) level = "medium";

  return { score, level, max_score: 11, flags: reasons };
}
