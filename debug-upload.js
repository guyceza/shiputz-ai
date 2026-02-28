const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'https://shipazti.com';
const TEST_EMAIL = 'test-ollie@shipazti.com';
const TEST_PASSWORD = 'Test123456!';

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  // Login
  console.log('Logging in...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button:has-text("התחברות")');
  await page.waitForTimeout(4000);
  
  // Go to visualize
  console.log('Going to visualize...');
  await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Accept cookies
  const cookie = await page.$('button:has-text("מאשר")');
  if (cookie) await cookie.click();
  
  // Debug: find all inputs
  const allInputs = await page.$$eval('input', els => els.map(e => ({
    type: e.type,
    accept: e.accept,
    id: e.id,
    name: e.name,
    visible: e.offsetParent !== null,
    className: e.className?.slice(0, 30)
  })));
  console.log('\nAll inputs on page:', JSON.stringify(allInputs, null, 2));
  
  // Find file input specifically
  const fileInputs = await page.$$('input[type="file"]');
  console.log('\nFile inputs found:', fileInputs.length);
  
  // Check if modal is open
  const modal = await page.$('[class*="fixed"][class*="z-50"]');
  console.log('Modal found:', !!modal);
  
  // Try to find file input inside modal
  if (modal) {
    const modalInputs = await modal.$$('input[type="file"]');
    console.log('File inputs inside modal:', modalInputs.length);
  }
  
  // Screenshot
  await page.screenshot({ path: '/tmp/debug-upload.png' });
  console.log('\nScreenshot saved to /tmp/debug-upload.png');
  
  await browser.close();
}

debug();
