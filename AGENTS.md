## Goal
Scale crypto API for real users — MCP distribution, Solana USDC billing, DCA bot revenue, zero-friction onboarding.

## Version
- **Worker**: `6db027cb` → `cryptoboss.space`
- **KV**: `f5a1cddfd3eb43fcbfa2e7c4884dadab`
- **IndexNow key**: in `.env`

## Secrets Location
All API keys, tokens, and recovery codes are stored in `.env` (gitignored). See `.env` for:
- Cloudflare API token
- GitHub PAT (`workflow` scope)
- npm token + recovery codes
- Wallet private key
- DCA_SECRET
- Test API key

## Day 5 — Distribution Complete

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
| **PulseMCP** | ✅ Will auto-sync from registry | — |

### npm
- `@mrsscs/cryptoboss-mcp@1.0.1` published with correct `mcpName`
- `chainboss-cli` deprecated

### Revenue Infrastructure
- DCA bot watches wallet every 15s, auto-swaps USDC ≥ $1 → SOL via Jupiter, 0.5% fee
- DCA API: `/api/dca/create`, plans, history, record
- Wallet balance: **$0 USDC**

### Usage
- Test key: Free plan, $0.35 balance, $0.65 used
- **Real users: 0** | **Revenue: $0**

### What's Next
1. Wait for directory approvals (punkpeye merge, Stork, mcpservers)
2. PulseMCP auto-syncs from registry
3. Build next revenue source once distribution channels are live

## Key Files
- `worker-src.js` — main worker source (~4780 lines)
- `dca-bot/bot.js` — DCA bot (poll chain every 15s)
- `.env` — secrets (gitignored)
- `wrangler.toml` — worker config
- `src/page.html` — landing page
- `dca-bot/start.sh` — bot runner
