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
  await page.waitForTimeout(2000);
  
  // Close cookies
  const cookie = await page.$('button:has-text("מאשר")');
  if (cookie) await cookie.click();
  
  // Take full page screenshot
  await page.screenshot({ path: '/tmp/visualize-full.png', fullPage: true });
  console.log('📸 Full page screenshot saved');
  
  // Find all buttons with "צור הדמיה"
  const buttons = await page.$$eval('button', els => els.map((e, i) => ({
    index: i,
    text: e.textContent?.trim().slice(0, 40),
    y: e.getBoundingClientRect().top,
    visible: e.offsetParent !== null,
    disabled: e.disabled
  })).filter(b => b.text?.includes('צור') || b.text?.includes('נסו')));
  
  console.log('\nButtons found:', buttons);
  
  // Scroll down
  await page.evaluate(() => window.scrollTo(0, 1000));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/visualize-scrolled.png' });
  console.log('📸 Scrolled screenshot saved');
  
  await browser.close();
}

debug();
