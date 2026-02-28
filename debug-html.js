const { chromium } = require('playwright');

const BASE_URL = 'https://shipazti.com';
const TEST_EMAIL = 'test-ollie@shipazti.com';
const TEST_PASSWORD = 'Test123456!';

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  // Login
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button:has-text("התחברות")');
  await page.waitForTimeout(4000);
  
  // Go to visualize
  await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Accept cookies
  const cookie = await page.$('button:has-text("מאשר")');
  if (cookie) await cookie.click();
  
  // Get modal HTML
  const modalHTML = await page.evaluate(() => {
    const modal = document.querySelector('[class*="fixed"][class*="z-50"]');
    if (modal) {
      return modal.innerHTML.slice(0, 3000);
    }
    return 'No modal found';
  });
  
  console.log('Modal HTML:', modalHTML);
  
  // Check for label element
  const labels = await page.$$eval('label', els => els.map(e => ({
    text: e.textContent?.slice(0, 50),
    hasInput: e.querySelector('input') !== null,
    className: e.className?.slice(0, 50)
  })));
  console.log('\nLabels:', labels);
  
  await browser.close();
}

debug();
