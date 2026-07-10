# Leash Market Monetization Setup

## Overview

This API uses the [x402 protocol](https://docs.leash.market/standards/x402-on-solana) for per-call USDC payments on Solana. Buyers get HTTP 402 + payment instructions, pay, then retry with proof-of-payment and receive data.

## Prerequisites

- Solana wallet keypair: `~/.config/solana/id.json` (already generated)
- Public key: `DEXbxpDbbj5AnZSqfAhuftvjrtXwjoWW1PgrxmVjuZef`

## Step 1: Get devnet SOL (for testing)

The devnet faucet is rate-limited programmatically. Open in a browser:

1. Go to https://faucet.solana.com
2. Connect GitHub to unlock (or use the unauthenticated mode for 2 SOL every 8 hours)
3. Enter: `DEXbxpDbbj5AnZSqfAhuftvjrtXwjoWW1PgrxmVjuZef`
4. Select devnet, request 2 SOL

Verify: `solana balance DEXbxpDbbj5AnZSqfAhuftvjrtXwjoWW1PgrxmVjuZef --url devnet`

## Step 2: Create a Leash seller agent

### Option A: Leash API (any language)

```bash
# 1. Prepare agent mint (creates unsigned transaction)
curl -X POST https://api.leash.market/v1/agents/prepare \
  -H "Content-Type: application/json" \
  -d '{"executive": "DEXbxpDbbj5AnZSqfAhuftvjrtXwjoWW1PgrxmVjuZef"}'

# Returns transaction.base64 — sign with Solana CLI and submit
```

### Option B: Leash web app (easiest)

1. Go to https://leash.market/creator/list
2. Connect Phantom wallet (import your keypair or create new)
3. Create a seller agent
4. Note the agent mint address (this will be your LEASH_PAY_TO)

## Step 3: Provision treasury ATAs

```bash
# Provision USDC ATA on the treasury
curl -X POST "https://api.leash.market/v1/agents/{MINT}/treasury/provision/prepare" \
  -H "Authorization: Bearer $LEASH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"stable_symbol": "USDC"}'
# Sign and submit
```

## Step 4: Configure the worker

Set these environment variables on Cloudflare:

```bash
# Via wrangler:
wrangler secret put LEASH_PAY_TO
# Value: your agent treasury PDA (payTo address)

wrangler secret put LEASH_FACILITATOR
# Value: https://facilitator.leash.market (mainnet) or https://facilitator-devnet.leash.market (devnet)
```

Or in the Cloudflare dashboard: Settings → Variables → Add secret

## How it works

When `LEASH_PAY_TO` is set, the worker enforces x402 payments:

1. **Client calls** `GET /api/price` without payment
2. **Worker returns** HTTP 402 with `PAYMENT-REQUIRED` header (base64 JSON with amount, asset, payTo)
3. **Client decodes PAYMENT-REQUIRED**, builds a Solana `TransferChecked` USDC transaction
4. **Client signs** and replays with `X-PAYMENT: <base64-signed-tx>` header
5. **Worker forwards** to Leash facilitator (`/settle`) for verification and broadcast
6. **Worker returns** data with `PAYMENT-RESPONSE` header (tx_sig, receipt hash)

## Pricing (USDC atomic units, 6 decimals)

| Endpoint | Price | USDC |
|----------|-------|------|
| /api/price | 10000 | $0.01 |
| /api/trending | 10000 | $0.01 |
| /api/top | 10000 | $0.01 |
| /api/top-gainers | 20000 | $0.02 |
| /api/top-losers | 20000 | $0.02 |
| /api/global | 10000 | $0.01 |
| /api/coin/:id | 10000 | $0.01 |
| /api/categories | 10000 | $0.01 |
| /api/defi/yields | 20000 | $0.02 |
| /api/defi/tvl | 20000 | $0.02 |
| /api/defi/pools | 20000 | $0.02 |
| /api/defi/protocol/:slug | 20000 | $0.02 |
| /api/meme/scan | 50000 | $0.05 |
| /api/meme/analyze | 50000 | $0.05 |
| /api/meme/trending | 30000 | $0.03 |
| /api/gas | 5000 | $0.005 |
| /api/gas/all | 10000 | $0.01 |
| /api/fear-greed | 5000 | $0.005 |
| /api/summary | 10000 | $0.01 |

Free: `/` (landing page), `/api/health`

## Testing

```bash
# Without payment → 402
curl -i https://cryptodata-api.datachain.workers.dev/api/price

# Decode PAYMENT-REQUIRED header
curl -s -D - https://cryptodata-api.datachain.workers.dev/api/price 2>&1 | grep -i payment

# With payment (using @leashmarket/buyer-kit or leash CLI)
PAYMENT_HEADER=$(leash pay --url https://cryptodata-api.datachain.workers.dev/api/price)
curl -H "X-PAYMENT: $PAYMENT_HEADER" https://cryptodata-api.datachain.workers.dev/api/price
```

## Adding to Agent Wonderland

1. List your API on Agent Wonderland with the standard URL
2. In the description, note that x402 payment is required (USDC on Solana)
3. Provide the payment setup instructions for agent developers
