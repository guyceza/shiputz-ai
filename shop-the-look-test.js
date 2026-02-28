const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/shiputz-screenshots';

async function test() {
  // Create screenshot directory
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'he-IL'
  });
  const page = await context.newPage();
  
  let screenshotCount = 0;
  const screenshot = async (name) => {
    screenshotCount++;
    const filename = `${String(screenshotCount).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: false });
    console.log(`📸 ${filename}`);
  };

  try {
    // 1. Go to homepage
    console.log('🏠 Loading homepage...');
    await page.goto('https://shiputzai.com', { waitUntil: 'networkidle', timeout: 30000 });
    await screenshot('homepage');
    
    // 2. Look for Shop the Look / product detection feature
    console.log('🔍 Looking for Shop the Look...');
    
    // Check if there's a direct link or button
    const shopLookLink = await page.$('a:has-text("Shop"), a:has-text("מוצרים"), a:has-text("זהה"), button:has-text("Shop")');
    if (shopLookLink) {
      console.log('Found Shop the Look link');
      await shopLookLink.click();
      await page.waitForLoadState('networkidle');
      await screenshot('shop-the-look-page');
    }
    
    // 3. Try to find the feature in different ways
    // Check navigation menu
    const navLinks = await page.$$eval('nav a, header a', links => 
      links.map(l => ({ text: l.textContent?.trim(), href: l.href }))
    );
    console.log('Navigation links:', JSON.stringify(navLinks.slice(0, 10)));
    
    // 4. Go directly to possible URLs
    const possibleUrls = [
      '/shop-the-look',
      '/detect',
      '/products',
      '/detect-products',
      '/shop'
    ];
    
    for (const url of possibleUrls) {
      try {
        console.log(`Trying ${url}...`);
        const response = await page.goto(`https://shiputzai.com${url}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        if (response && response.status() === 200) {
          console.log(`✅ Found: ${url}`);
          await screenshot(`found-${url.replace(/\//g, '-')}`);
          break;
        }
      } catch (e) {
        console.log(`❌ ${url} - ${e.message.split('\n')[0]}`);
      }
    }
    
    // 5. Check the dashboard/app area
    console.log('📱 Checking app dashboard...');
    await page.goto('https://shiputzai.com/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    await screenshot('dashboard');
    
    // List all buttons and links on current page
    const elements = await page.$$eval('button, a[href]', els => 
      els.map(e => ({ tag: e.tagName, text: e.textContent?.trim().slice(0, 50), href: e.href || null }))
        .filter(e => e.text)
    );
    console.log('Interactive elements:', JSON.stringify(elements.slice(0, 20)));

  } catch (error) {
    console.error('Error:', error.message);
    await screenshot('error-state');
  } finally {
    await browser.close();
    console.log(`\n✅ Done! ${screenshotCount} screenshots saved to ${SCREENSHOT_DIR}`);
  }
}

test();
