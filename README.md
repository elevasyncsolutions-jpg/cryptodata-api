<div align="center">
  <h1>🦎 CryptoBoss MCP Server</h1>
  <p><strong>48 free crypto MCP tools for Claude, Cursor, Cline & Windsurf</strong></p>
  <p>Prices • DeFi • Meme Tokens • Gas • Sentiment • Solana • Agent Commerce</p>

  <p>
    <a href="https://cryptoboss.space"><img src="https://img.shields.io/badge/website-cryptoboss.space-9945FF?style=flat-square" alt="Website"></a>
    <a href="https://cryptoboss.space/mcp"><img src="https://img.shields.io/badge/MCP-endpoint-22c55e?style=flat-square" alt="MCP Endpoint"></a>
    <a href="https://github.com/modelcontextprotocol/specification"><img src="https://img.shields.io/badge/MCP-2025--03--26-blue?style=flat-square" alt="MCP Protocol"></a>
    <a href="https://www.npmjs.com/package/@cryptoboss/solana-mcp-sdk"><img src="https://img.shields.io/npm/v/@cryptoboss/solana-mcp-sdk?style=flat-square" alt="npm"></a>
  </p>
  <p>
    <a href="https://smithery.ai/server/@elevasyncsolutions-jpg/cryptoboss-mcp"><img src="https://img.shields.io/badge/Smithery-deployed-FF6B6B?style=flat-square" alt="Smithery"></a>
    <a href="https://glama.ai/mcp/servers/..."><img src="https://img.shields.io/badge/Glama-verified-6366f1?style=flat-square" alt="Glama"></a>
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License">
    <img src="https://img.shields.io/badge/tools-48-7c3aed?style=flat-square" alt="48 tools">
  </p>
</div>

---

CryptoBoss is an MCP (Model Context Protocol) server that gives AI agents direct access to 48 real-time crypto data tools. No signup required for basic tools. Post-paid billing via Solana USDC ($1 free credit).

## 🚀 Quick Start

Add to your MCP client configuration:

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

That's it — 13 free tools auto-discover immediately. For premium tools:

```bash
# Get a free API key ($1 credit, no email required)
curl -X POST https://cryptoboss.space/api/register
```

## 🔧 Tools

### 📊 Market Data (11)
| Tool | Description | Free |
|------|------------|------|
| `get_price` | Real-time prices for 15,000+ coins | ✅ |
| `get_trending` | Trending coins on CoinGecko | ✅ |
| `get_top` | Top coins by market cap | ✅ |
| `get_top_gainers` | Top 24h gainers | ✅ |
| `get_top_losers` | Top 24h losers | ✅ |
| `get_global` | Global market stats | ✅ |
| `get_coin` | Detailed coin info | ✅ |
| `get_categories` | Top crypto categories | ✅ |
| `get_top_volume` | Top coins by volume | |
| `get_search` | Search coins by name/symbol | ✅ |
| `get_exchanges` | Exchange listings | ✅ |

### 🏦 DeFi (4)
| Tool | Description | Cost |
|------|------------|------|
| `get_defi_yields` | DeFi yield farming APY, TVL | $0.02 |
| `get_defi_tvl` | Protocols ranked by TVL | $0.02 |
| `get_defi_pools` | Liquidity pools across DEXs | $0.02 |
| `get_defi_protocol` | Protocol breakdown by chain | $0.02 |

### 🐸 Meme Tokens & Security (5)
| Tool | Description | Cost |
|------|------------|------|
| `get_meme_scan` | Scan new meme tokens | $0.05 |
| `get_meme_analyze` | Rug risk analysis | $0.05 |
| `get_meme_trending` | Trending DEX tokens | $0.03 |
| `analyze_contract` | Deep contract audit | $0.05 |
| `check_approvals` | Token approval risk | $0.03 |

### ⛽ Gas (2)
| Tool | Description | Cost |
|------|------------|------|
| `get_gas` | Ethereum gas | $0.005 |
| `get_gas_all` | Multi-chain gas tracker | $0.01 |

### 😱 Sentiment (2)
| Tool | Description | Cost |
|------|------------|------|
| `get_fear_greed` | Fear & Greed Index | $0.005 |
| `get_social_sentiment` | Social sentiment for a coin | $0.02 |

### 📈 Charts & Data (4)
| Tool | Description | Cost |
|------|------------|------|
| `get_summary` | One-call market overview | $0.01 |
| `get_ohlc` | OHLC candlestick data | $0.01 |
| `get_price_summary` | Price statistics over N days | $0.02 |
| `get_network_health` | Blockchain network health | $0.01 |

### 🐋 Whales (2)
| Tool | Description | Cost |
|------|------------|------|
| `get_whale_moves` | Track large transactions | $0.03 |
| `get_token_holders` | Holder distribution analysis | $0.02 |

### ⚠️ Risk (2)
| Tool | Description | Cost |
|------|------------|------|
| `get_liquidations` | Liquidation risk watch | $0.02 |
| `get_arbitrage` | CEX/DEX arbitrage scan | $0.03 |

### 💼 Portfolio (2)
| Tool | Description | Cost |
|------|------------|------|
| `get_portfolio_value` | Portfolio value from holdings | $0.01 |
| `get_portfolio_health` | Diversification analysis | $0.02 |

### 🔔 Alerts (3)
| Tool | Description | Cost |
|------|------------|------|
| `set_price_alert` | Create price alert | $0.01 |
| `get_alerts` | List active alerts | $0.005 |
| `delete_alert` | Delete alert by ID | $0.005 |

### 🧠 Intelligence (4)
| Tool | Description | Cost |
|------|------------|------|
| `compare_coins` | Side-by-side comparison | $0.02 |
| `market_correlation` | Correlation matrix | $0.03 |
| `get_stablecoins` | Stablecoin market overview | $0.01 |
| `trending_categories` | Hot categories by cap change | $0.01 |

### ◎ Solana (3)
| Tool | Description | Cost |
|------|------------|------|
| `get_jupiter_quote` | Jupiter swap quote | ✅ Free |
| `get_pump_fun_new` | Latest Pump.fun tokens | ✅ Free |
| `analyze_solana_token` | Deep token analysis | $0.05 |

### 🤝 Agent Commerce (2)
| Tool | Description | Cost |
|------|------------|------|
| `pay_agent` | Send USDC between agents | $0.01 |
| `check_agent_balance` | Check agent balance | $0.005 |

### 👤 Account (2)
| Tool | Description |
|------|------------|
| `register` | Get free API key ($1 credit) |
| `check_usage` | Check balance and usage |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent (Claude/Cursor/Windsurf)         │
│                                                             │
│  "What's trending? Check Pump.fun for new tokens"           │
└───────────────┬─────────────────────────────────────────────┘
                │ MCP (streamable HTTP)
                ▼
┌─────────────────────────────────────────────────────────────┐
│                 CryptoBoss MCP Server                        │
│                   Cloudflare Workers                         │
│                                                             │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ MCP      │  │ Billing  │  │ Rate     │  │ KV Store    │  │
│  │ Router   │  │ Engine   │  │ Limiter  │  │ (API keys,  │  │
│  └────┬─────┘  └──────────┘  └──────────┘  │  balances)   │  │
│       │                                      └─────────────┘  │
│       ▼                                                       │
│  ┌────────────────────────────────────────────────────┐       │
│  │              Data Sources                           │       │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐  │       │
│  │  │CoinGecko │ │DeFiLlama │ │DexScreener│ │Jupiter│  │       │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────┘  │       │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │       │
│  │  │Alternative│ │ Pump.fun │ │ Solana RPC       │   │       │
│  │  └──────────┘ └──────────┘ └──────────────────┘   │       │
│  └────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## 💰 Billing

| Tier | Daily Limit | Rate/Min | Price |
|------|------------|----------|-------|
| Free | 200 calls | 30/min | $0 |
| Pro | 1,000 calls | 60/min | $5/mo |
| Enterprise | 10,000 calls | 300/min | $20/mo |

Every API key starts with **$1 free credit** (~100-200 premium calls). Post-paid: you pay after you use. Send USDC on Solana to `DEXbxpDbbj5AnZSqfAhuftvjrtXwjoWW1PgrxmVjuZef`.

## 📦 MCP Directory Listings

| Directory | Status |
|-----------|--------|
| [Official MCP Registry](https://registry.modelcontextprotocol.io) | ✅ Published |
| [Glama.ai](https://glama.ai/mcp/servers) | ✅ Approved |
| [Smithery](https://smithery.ai/server/@elevasyncsolutions-jpg/cryptoboss-mcp) | ✅ Deployed |
| [MCP.so](https://mcp.so) | ✅ Listed |
| [punkpeye](https://github.com/punkpeye/awesome-mcp-servers) | ⏳ PR #9880 |
| [mcpservers.org](https://mcpservers.org) | ✅ Submitted |

## 🔗 Links

- **MCP Endpoint**: `https://cryptoboss.space/mcp`
- **Website**: https://cryptoboss.space
- **MCP Discovery**: https://cryptoboss.space/.well-known/mcp.json
- **OpenAPI Spec**: https://cryptoboss.space/openapi.yaml
- **API Docs**: https://cryptoboss.space/blog/
- **SDK**: `@cryptoboss/solana-mcp-sdk` (npm)

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.

---

<div align="center">
  <sub>Built on Solana · Post-paid USDC billing · Powered by Cloudflare Workers</sub>
</div>
