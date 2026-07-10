# CryptoBoss — Crypto API for AI Agents

**The only crypto API built for AI agents with zero-friction MCP, post-paid $1 USDC billing on Solana.**

[![MCP Server](https://img.shields.io/badge/MCP-Server-7C3AED)](https://cryptoboss.space/.well-known/mcp.json)
[![Live](https://img.shields.io/badge/Live-cryptoboss.space-22c55e)](https://cryptoboss.space)

**11 tools work without any API key.** 30+ premium tools for analysis, security, and DeFi. No signup required to start.

---

## Quick Start (Zero Setup)

Add to Claude Desktop, Cursor, Cline, or Windsurf:

```json
{
  "mcpServers": {
    "cryptoboss": {
      "type": "streamableHttp",
      "url": "https://cryptoboss.space/mcp"
    }
  }
}
```

That's it. Your agent immediately discovers 42+ crypto tools. Prices, trends, categories, global stats — all work without a key.

---

## What You Get Without Signing Up

| Tool | What it does |
|------|-------------|
| `get_price` | Real-time prices for 15,000+ coins |
| `get_trending` | Trending coins on CoinGecko |
| `get_top` | Top coins by market cap (via CoinPaprika) |
| `get_top_gainers` | Biggest 24h gainers |
| `get_top_losers` | Biggest 24h losers |
| `get_global` | Total market cap, volume, BTC dominance |
| `get_categories` | Top crypto categories |
| `get_coin` | Detailed coin info (ATH, supply, social) |
| `get_search` | Search coins by name or symbol |
| `get_exchanges` | Exchange listings by volume |

**No API key. No signup. No billing info. Just point and use.**

---

## Premium Tools (Need Free API Key)

| Category | Tools |
|----------|-------|
| **DeFi** | Yields, TVL, pools, protocol breakdowns |
| **Meme & DEX** | Scan new tokens, rug risk analysis, trending DEX pairs |
| **Security** | Contract audit, approval risk check, whale tracking, holder data |
| **Portfolio** | Portfolio value, diversification health |
| **Alerts** | Price alerts, list, delete |
| **Trading** | CEX/DEX arbitrage scanner, top volume |
| **Sentiment** | Fear & Greed Index, social sentiment, market mood |
| **OHLC** | Candlestick data (1d, 7d, 30d, 90d) |
| **Gas** | Ethereum gas tracker, multi-chain gas |
| **Intelligence** | Compare coins, correlation matrix, stablecoin overview, trending categories, price summary |

Get a free key with $1 credit:

```
curl -X POST https://cryptoboss.space/api/register
```

Pass it to any premium tool:

```json
{
  "name": "analyze_contract",
  "arguments": {
    "api_key": "cd_YOUR_KEY",
    "address": "0x..."
  }
}
```

---

## Pricing

| Tier | Price | Daily Limit | Rate |
|------|-------|-------------|------|
| Free | $0 | 200 calls | 30/min |
| Pro | $5 USDC | 1,000 calls | 60/min |
| Enterprise | $20 USDC | 10,000 calls | 300/min |

**Post-paid billing:** You get a free $1 credit upfront. When it runs out, send $1 USDC to our Solana wallet and your credit resets. No subscription, no prepayment.

Payment address: `DEXbxpDbbj5AnZSqfAhuftvjrtXwjoWW1PgrxmVjuZef` (Solana mainnet, USDC)

---

## Why CryptoBoss?

- **Zero-friction MCP** — 11 tools work without any key. First crypto MCP server that does this.
- **Post-paid $1 USDC** — No monthly subscription. Pay $1 when you exhaust credit.
- **MCP-native** — 42+ tools auto-discovered by Claude, Cursor, Cline, Windsurf, and any MCP client.
- **Multi-source data** — CoinGecko, CoinPaprika, DeFiLlama, DexScreener, Alternative.me
- **No signup required** — Generate a key in one click. No email, no KYC, no password.

---

## Architecture

- **Runtime:** Cloudflare Workers (global edge, <50ms responses)
- **Storage:** Cloudflare KV (API keys, balances, cache)
- **Discovery:** `.well-known/mcp.json` + `llms.txt` + `openapi.yaml`
- **Data sources:** CoinGecko, CoinPaprika, DeFiLlama, DexScreener, Alternative.me
- **Build:** `node build.js` → `worker.js`
- **Deploy:** `wrangler deploy`

---

## Links

- **Live:** https://cryptoboss.space
- **MCP endpoint:** https://cryptoboss.space/mcp
- **Discovery:** https://cryptoboss.space/.well-known/mcp.json
- **llms.txt:** https://cryptoboss.space/llms.txt
- **Dashboard:** https://cryptoboss.space (account, plans, call log)
- **Blog:** https://cryptoboss.space/blog (26+ articles)
- **OpenAPI:** https://cryptoboss.space/openapi.yaml
