# ChainBoss CLI

Command-line interface for [ChainBoss](https://cryptoboss.space) — the crypto API for AI agents. 21 MCP tools, post-paid $1 USDC on Solana.

## Install

```bash
npm install -g chainboss-cli
```

## Quick Start

```bash
# Generate a free API key with $1 credit
chainboss register

# Get crypto prices
chainboss price bitcoin,ethereum

# Check gas fees
chainboss gas

# Scan meme tokens
chainboss meme-scan
```

## Commands

| Command | Description |
|---|---|
| `register` | Generate a free API key ($1 credit) |
| `price <coins>` | Get crypto prices (default: bitcoin,ethereum) |
| `trending` | Trending coins on CoinGecko |
| `top [limit]` | Top coins by market cap |
| `gas` | Ethereum gas prices |
| `fear-greed` | Fear & Greed index |
| `meme-scan` | Scan new meme tokens |
| `meme-analyze <address>` | Analyze a token for rug risk |
| `defi-yields` | Top DeFi yield opportunities |
| `config` | Show current config |
| `help` | Show help |

## Options

- `--key=cd_abc123` — Use a specific API key (overrides saved key)

## Examples

```bash
chainboss register
chainboss price bitcoin,ethereum,solana
chainboss top 20
chainboss meme-analyze So11111111111111111111111111111111111111112
chainboss meme-scan --key=cd_abc123
chainboss defi-yields
chainboss fear-greed
```

## How It Works

1. Run `chainboss register` to get a free API key with $1 credit (~100-200 calls)
2. Use any command to query real-time crypto data
3. When credit runs low, send $1 USDC to the ChainBoss Solana wallet to top up

## Links

- Website: [https://cryptoboss.space](https://cryptoboss.space)
- API Base: `https://cryptodata-api.datachain.workers.dev`
- MCP: `https://cryptodata-api.datachain.workers.dev/mcp`
- X: [@Kristiamanekmu](https://x.com/Kristiamanekmu)
