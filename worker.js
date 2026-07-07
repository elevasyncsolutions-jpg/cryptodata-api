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
