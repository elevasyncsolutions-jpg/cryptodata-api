const { chromium } = require('playwright');
const fs = require('fs');

const POST_TEXT = process.argv[2];
const IMAGE_PATH = process.argv[3] || null;

if (!POST_TEXT) {
  console.error('Usage: node x-post.js "post text" [image-path]');
  process.exit(1);
}

(async () => {
  const context = await chromium.launchPersistentContext('/tmp/x-profile', {
    viewport: { width: 1280, height: 900 },
    storageState: 'x-session.json',
    headless: true
  });

  const page = await context.newPage();
  await page.goto('https://x.com/compose/post', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  if (IMAGE_PATH) {
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(IMAGE_PATH);
    await page.waitForTimeout(2000);
  }

  await page.keyboard.type(POST_TEXT, { delay: 30 });
  await page.waitForTimeout(1000);

  await page.locator('[data-testid="tweetButtonInline"]').click();
  await page.waitForTimeout(3000);

  console.log('Posted!');
  await context.close();
})();
