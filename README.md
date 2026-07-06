# DataScraper API

Scrape any URL and extract structured data, contacts, links, and SEO info.

## Deployment

### Option 1: RapidAPI (Recommended — free, has buyers)
1. Sign up at rapidapi.com (free)
2. Create new API: "DataScraper API"
3. Connect your GitHub repo or deploy endpoint
4. Set pricing: Free tier (100 req/mo) + $9.99/mo unlimited
5. RapidAPI marketplace = built-in buyers

### Option 2: Render (free tier)
1. Push to GitHub
2. Connect at render.com → New Web Service
3. Build: `npm install`
4. Start: `node server.js`
5. Free tier = 750 hours/month

### Option 3: Railway ($5 free credit)
1. `railway login`
2. `railway init`
3. `railway up`

## API Endpoints

### GET /api/scrape
Scrape a single URL.
```
GET https://your-api.vercel.app/api/scrape?url=https://example.com&format=minimal
```

Formats:
- `minimal` — title, description, emails, phones, socials
- `links` — all links + count
- `contacts` — emails, phones, socials only
- (default) — full data

### POST /api/scrape/batch
Scrape multiple URLs (max 10).
```json
{
  "urls": ["https://example.com", "https://github.com"],
  "format": "minimal"
}
```

### POST /api/extract/contacts
Extract contacts from URLs (max 20).
```json
{
  "urls": ["https://example.com"]
}
```

## Pricing (RapidAPI)

| Tier | Price | Requests |
|---|---|---|
| Free | $0 | 100/month |
| Basic | $9.99/mo | Unlimited |
| Pro | $29.99/mo | Unlimited + batch |

Revenue per subscriber: $9.99–$29.99/mo
Target: 100 subscribers = $1000–$3000/mo
