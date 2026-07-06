# CryptoData API

Unified crypto data API. Real-time prices, trending coins, Fear & Greed index, gas prices, global market data.

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/price?coins=bitcoin,ethereum&vs=usd` | Real-time prices + 24h change + market cap |
| `GET /api/top?limit=20&vs=usd` | Top coins by market cap |
| `GET /api/trending` | Trending coins right now |
| `GET /api/fear-greed?limit=30` | Fear & Greed index history |
| `GET /api/gas` | Ethereum gas prices |
| `GET /api/global` | Global crypto market stats |
| `GET /api/coin/:id` | Detailed coin info |
| `GET /api/health` | Health check |

## Data Sources
- CoinGecko (prices, market data, trending)
- Alternative.me (Fear & Greed index)
- Etherscan (gas prices)

## Deploy

### Render (free tier)
1. Push to GitHub
2. Connect at render.com → New Web Service
3. Build: `npm install`
4. Start: `node server.js`

### RapidAPI listing
1. Sign up rapidapi.com
2. Create API → "CryptoData API"
3. Set pricing: Free (100 req/mo) + Pro ($9.99/mo unlimited)
4. Publish to marketplace

## Pricing
| Tier | Price | Requests |
|------|-------|----------|
| Free | $0 | 100/month |
| Pro | $9.99/mo | Unlimited |
