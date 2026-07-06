const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'free-tier';

function authenticate(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.key;
  if (key === API_KEY || API_KEY === 'free-tier') {
    return next();
  }
  return res.status(401).json({ error: 'Invalid API key' });
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DataAPI/1.0)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, html: data, headers: res.headers }));
    }).on('error', reject);
  });
}

function extractData(html, url) {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || '';
  const description = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)?.[1] || '';
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';
  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';
  const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] || '';

  const links = [];
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith('http') || href.startsWith('/')) {
      links.push(href);
    }
  }

  const emails = [...new Set((html.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || []).filter(e => !e.includes('example') && !e.includes('test')))];
  const phones = [...new Set((html.match(/\+?\d{10,15}/g) || []))].slice(0, 10);

  const socialRegex = /(?:https?:\/\/)?(?:www\.)?(twitter\.com|x\.com|linkedin\.com|facebook\.com|instagram\.com|github\.com|youtube\.com)\/[\w.-]+/gi;
  const socials = [...new Set((html.match(socialRegex) || []))].slice(0, 20);

  const structuredData = [];
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      structuredData.push(JSON.parse(match[1]));
    } catch {}
  }

  const headings = [];
  const headingRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push(match[1].replace(/<[^>]+>/g, '').trim());
  }

  return {
    url,
    title: ogTitle || title,
    description,
    canonical: canonical || url,
    headings,
    links: [...new Set(links)].slice(0, 100),
    emails,
    phones,
    socials,
    structuredData,
    images: ogImage ? [ogImage] : [],
    wordCount: html.replace(/<[^>]+>/g, '').split(/\s+/).length,
    language: html.match(/<html[^>]*lang=["']([^"']+)["']/i)?.[1] || 'en',
    fetchedAt: new Date().toISOString(),
  };
}

app.get('/api/scrape', authenticate, async (req, res) => {
  const { url, format } = req.query;
  if (!url) return res.status(400).json({ error: 'url parameter required' });

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const { status, html } = await fetchPage(url);
    const data = extractData(html, url);
    data.httpStatus = status;

    if (format === 'minimal') {
      return res.json({ url: data.url, title: data.title, description: data.description, emails: data.emails, phones: data.phones, socials: data.socials });
    }
    if (format === 'links') {
      return res.json({ url: data.url, links: data.links, count: data.links.length });
    }
    if (format === 'contacts') {
      return res.json({ url: data.url, emails: data.emails, phones: data.phones, socials: data.socials });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/scrape/batch', authenticate, async (req, res) => {
  const { urls, format } = req.body;
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'urls array required (max 10)' });
  }

  const results = await Promise.allSettled(
    urls.slice(0, 10).map(async (url) => {
      try {
        const { status, html } = await fetchPage(url);
        return { url, ...extractData(html, url), httpStatus: status };
      } catch (err) {
        return { url, error: err.message };
      }
    })
  );

  return res.json({ results: results.map(r => r.value || r.reason), count: results.length });
});

app.post('/api/extract/contacts', authenticate, async (req, res) => {
  const { urls } = req.body;
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'urls array required' });
  }

  const results = await Promise.allSettled(
    urls.slice(0, 20).map(async (url) => {
      try {
        const { html } = await fetchPage(url);
        const data = extractData(html, url);
        return { url, emails: data.emails, phones: data.phones, socials: data.socials };
      } catch (err) {
        return { url, error: err.message };
      }
    })
  );

  return res.json({ results: results.map(r => r.value || r.reason) });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'DataScraper API',
    version: '1.0.0',
    description: 'Scrape any URL and extract structured data, contacts, links, and SEO info',
    endpoints: [
      { method: 'GET', path: '/api/scrape?url=<url>&format=minimal|links|contacts', desc: 'Scrape a single URL' },
      { method: 'POST', path: '/api/scrape/batch', body: { urls: ['url1', 'url2'], format: 'minimal' }, desc: 'Scrape multiple URLs (max 10)' },
      { method: 'POST', path: '/api/extract/contacts', body: { urls: ['url1'] }, desc: 'Extract emails, phones, socials from URLs (max 20)' },
      { method: 'GET', path: '/api/health', desc: 'Health check' },
    ],
    pricing: 'Pay-per-request via RapidAPI marketplace',
  });
});

app.listen(PORT, () => {
  console.log(`DataScraper API running on port ${PORT}`);
});
