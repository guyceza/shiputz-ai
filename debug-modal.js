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
  await page.waitForTimeout(1000);
  
  // Find ALL fixed elements
  const fixedEls = await page.evaluate(() => {
    const all = document.querySelectorAll('[class*="fixed"]');
    return Array.from(all).map(el => ({
      tag: el.tagName,
      classes: el.className?.slice(0, 80),
      hasInput: el.querySelector('input') !== null,
      hasLabel: el.querySelector('label') !== null,
      innerTextPreview: el.innerText?.slice(0, 100)
    }));
  });
  
  console.log('Fixed elements:', JSON.stringify(fixedEls, null, 2));
  
  // Look specifically for upload-related elements
  const uploadEls = await page.evaluate(() => {
    // Find by text content
    const byText = document.evaluate(
      "//*[contains(text(), 'לחץ או גרור') or contains(text(), 'תמונה לכאן')]",
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    
    const results = [];
    for (let i = 0; i < byText.snapshotLength; i++) {
      const el = byText.snapshotItem(i);
      results.push({
        tag: el.tagName,
        text: el.textContent?.slice(0, 50),
        parentHasInput: el.closest('label')?.querySelector('input') !== null
      });
    }
    return results;
  });
  
  console.log('\nUpload elements:', uploadEls);
  
  // Check all label elements
  const labels = await page.evaluate(() => {
    const all = document.querySelectorAll('label');
    return Array.from(all).map(l => ({
      text: l.textContent?.slice(0, 30),
      forAttr: l.getAttribute('for'),
      children: l.children.length,
      hasHiddenInput: l.querySelector('input.hidden, input[class*="hidden"]') !== null
    }));
  });
  
  console.log('\nAll labels:', labels);
  
  await browser.close();
}

debug();
