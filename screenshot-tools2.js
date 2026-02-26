const { chromium } = require('playwright');

async function screenshot() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 2000 } });
  
  // Login
  await page.goto('https://shipazti.com/login');
  await page.fill('input[type="email"]', 'test@shiputzai.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button:has-text("התחברות")');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Take full page screenshot
  await page.screenshot({ path: './dashboard-full.png', fullPage: true });
  
  console.log('Full screenshot saved');
  await browser.close();
}

screenshot().catch(console.error);
