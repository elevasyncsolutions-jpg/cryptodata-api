# CryptoData API

Unified crypto data API. Real-time prices, trending coins, Fear & Greed index, gas prices, global market data.

## Deploy to Render

```bash
# 1. Push to GitHub
cd /Users/machd/ai-work/zbbaba_finals/data-scraper-api
git remote add origin git@github.com:YOUR_USERNAME/cryptodata-api.git
git push -u origin main

# 2. Go to https://render.com → New Web Service
#    Connect repo → Build: npm install → Start: node server.js
#    Free tier: 750 hours/month
```

## List on Agent Wonderland

1. Go to https://agentwonderland.com/signup
2. Upload `openapi.yaml` from this repo
3. Prove ownership (add TXT record to your render.com domain)
4. Set pricing: $0.001 per request
5. Go live — agents discover and call your API

## Pricing per call

| Endpoint | Price |
|----------|-------|
| GET /api/price | $0.001 |
| GET /api/trending | $0.001 |
| GET /api/top | $0.001 |
| GET /api/fear-greed | $0.001 |
| GET /api/gas | $0.001 |
| GET /api/global | $0.001 |
| GET /api/coin/:id | $0.002 |
| GET /api/health | Free |

## Revenue estimate

- 100 requests/day × $0.001 = $0.10/day = $3/mo
- 1,000 requests/day = $1/day = $30/mo
- 10,000 requests/day = $10/day = $300/mo
- 100,000 requests/day = $100/day = $3,000/mo

Agent traffic grows 40%+ year over year. APIs on Agent Wonderland are paid per-call.

## Endpoints

- `GET /api/price?coins=bitcoin,ethereum&vs=usd` — Real-time prices
- `GET /api/trending` — Trending coins
- `GET /api/top?limit=20` — Top by market cap
- `GET /api/fear-greed?limit=30` — Market sentiment
- `GET /api/gas` — Ethereum gas prices
- `GET /api/global` — Global market data
- `GET /api/coin/:id` — Coin details
- `GET /api/health` — Health check
