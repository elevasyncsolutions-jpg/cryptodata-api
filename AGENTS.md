## Goal
Scale crypto API for real users — MCP distribution, Solana USDC billing, DCA bot revenue, zero-friction onboarding.

## Version
- **Worker**: `afb7df46` → `cryptoboss.space`
- **KV**: `f5a1cddfd3eb43fcbfa2e7c4884dadab`
- **IndexNow key**: in `.env`

## Secrets Location
All API keys, tokens, and recovery codes are stored in `.env` (gitignored).

## Day 6 — Financing Department Active

### Wallet Status
- SOL: **0.001239** (~$0.17) — enough for gas only
- USDC: **$0.00**
- **Need ~$0.28 more SOL** to start airdrop farming (wSOL ATA rent: 0.002 SOL)

### DCA Bot
- Running persistently via launchd (auto-restarts on crash)
- Polls wallet every 15s for USDC deposits
- Farm cycle checks hourly — skips until >0.0025 SOL
- When USDC arrives: auto-swaps → SOL with 0.5% fee
- Farm log: `dca-bot/farm.log`

### Telegram Bot
- Webhook handler deployed at `/api/telegram/webhook`
- Commands: /start, /price, /pump, /analyze, /quote, /alert
- Cron auto-posts 4x/day to Telegram
- **BLOCKED**: Need user to create @BotFather bot and set TELEGRAM_BOT_TOKEN

### MCP Directories
| Directory | Status | Ref |
|-----------|:------:|-----|
| **Official MCP Registry** | ✅ **Published** | `io.github.elevasyncsolutions-jpg/cryptoboss-mcp` |
| **punkpeye/awesome-mcp-servers** | ✅ PR #9880 (pending merge) | — |
| **Glama.ai** (connector) | ✅ **Approved** | — |
| **Stork.AI** | ✅ Submitted | — |
| **mcpservers.org** | ✅ Submitted | — |
| **AIBase MCP** | ✅ Submitted | — |
| **Smithery** | ✅ Submitted | — |
| **mcp.so** | ✅ Issues filed | — |
| **PulseMCP** | ✅ Auto-syncs from registry | — |

### npm
- `@mrsscs/cryptoboss-mcp@1.0.1` published

### New Solana Tools (3 new MCP + REST)
| Tool | Endpoint | Price | Free Tier |
|------|----------|:-----:|:---------:|
| `get_jupiter_quote` / Jupiter swap quote | `GET /api/swap/quote` | $0.01 | ✅ Free |
| `get_pump_fun_new` / Pump.fun new tokens | `GET /api/meme/pump-fun/new` | $0.03 | ✅ Free |
| `analyze_solana_token` / Solana token analysis | `GET /api/solana/analyze` | $0.05 | ❌ Key req |

**Total: 46 MCP tools** (43 original + 3 Solana)

### Usage
- Test key: Free plan, ~$0.30 balance remaining
- **Real users: 0** | **Revenue: $0**

### What's Next
1. Wait for directory approvals (punkpeye merge, Stork, mcpservers)
2. Build first paid user — Solana trader audience, promote the new Solana rug-check + Jupiter + Pump.fun tools
3. Consider adding Telegram bot for real-time Pump.fun alerts

## Key Files
- `worker-src.js` — main worker source (~4894 lines)
- `dca-bot/bot.js` — DCA bot (poll chain every 15s)
- `.env` — secrets (gitignored)
- `wrangler.toml` — worker config
- `src/page.html` — landing page
- `dca-bot/start.sh` — bot runner
