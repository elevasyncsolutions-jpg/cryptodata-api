const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chromium',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'America/New_York',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
  });

  const page = await context.newPage();

  console.log('Navigating to X...');
  await page.goto('https://x.com/i/flow/login', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('Log in manually in the browser, then press Enter here...');

  await new Promise(resolve => process.stdin.once('data', resolve));

  await context.storageState({ path: 'x-session.json' });
  console.log('Session saved!');

  await browser.close();
})();
