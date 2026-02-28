const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/shiputz-screenshots';
const BASE_URL = 'https://shipazti.com';

async function test() {
  fs.readdirSync(SCREENSHOT_DIR).forEach(f => fs.unlinkSync(path.join(SCREENSHOT_DIR, f)));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    locale: 'he-IL'
  });
  const page = await context.newPage();
  
  let screenshotCount = 0;
  const screenshot = async (name) => {
    screenshotCount++;
    const filename = `${String(screenshotCount).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: false });
    console.log(`📸 ${filename}`);
    return path.join(SCREENSHOT_DIR, filename);
  };

  try {
    // 1. Go to Shop the Look
    console.log('🛒 Opening Shop the Look...');
    await page.goto(`${BASE_URL}/shop-look`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Accept cookies
    const acceptBtn = await page.$('button:has-text("מאשר")');
    if (acceptBtn) {
      await acceptBtn.click();
      await page.waitForTimeout(500);
    }
    
    await screenshot('01-initial');
    
    // 2. Click on a product marker
    console.log('\n🖱️ Clicking on product marker...');
    await page.mouse.click(353, 686);  // Position of first marker
    await page.waitForTimeout(1000);
    await screenshot('02-tooltip-shown');
    
    // 3. Click on Google Shopping link
    console.log('\n🔗 Looking for Google Shopping link...');
    const googleLink = await page.$('a:has-text("Google"), a[href*="google"]');
    if (googleLink) {
      const href = await googleLink.getAttribute('href');
      console.log('Google Shopping link:', href);
      
      // Open in new tab to capture the search
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        googleLink.click()
      ]);
      
      await newPage.waitForLoadState('domcontentloaded');
      const newUrl = newPage.url();
      console.log('✅ Google Shopping opened:', newUrl);
      await newPage.screenshot({ path: path.join(SCREENSHOT_DIR, `${String(++screenshotCount).padStart(2, '0')}-google-shopping.png`) });
      console.log(`📸 ${screenshotCount.toString().padStart(2, '0')}-google-shopping.png`);
      await newPage.close();
    } else {
      console.log('⚠️ No Google link found');
    }
    
    // 4. Test another product marker
    console.log('\n🖱️ Testing different product markers...');
    const markerPositions = [
      {x: 579, y: 766, name: 'sofa-area'},
      {x: 640, y: 312, name: 'lamp-area'},
      {x: 855, y: 808, name: 'table-area'},
    ];
    
    for (const pos of markerPositions) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      await page.mouse.click(pos.x, pos.y);
      await page.waitForTimeout(1000);
      await screenshot(`marker-${pos.name}`);
      
      // Check what product was shown
      const tooltipText = await page.$eval('[class*="tooltip"], [class*="popup"], [class*="absolute"]', 
        el => el.textContent?.trim().slice(0, 50)
      ).catch(() => 'No tooltip');
      console.log(`  ${pos.name}: ${tooltipText}`);
    }
    
    // 5. Test login flow
    console.log('\n🔐 Testing login flow...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    const loginBtn = await page.$('a:has-text("התחבר"), button:has-text("התחבר")');
    if (loginBtn) {
      await loginBtn.click();
      await page.waitForLoadState('networkidle');
      await screenshot('login-page');
      console.log('Current URL:', page.url());
      
      // Check login options
      const loginElements = await page.$$eval('button, input', els => 
        els.map(e => ({ type: e.type, text: e.textContent?.trim(), placeholder: e.placeholder }))
          .filter(e => e.text || e.placeholder)
      );
      console.log('Login elements:', loginElements.slice(0, 10));
    }
    
    console.log(`\n✅ Done! ${screenshotCount} screenshots`);
    console.log('Files:', fs.readdirSync(SCREENSHOT_DIR).join(', '));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await screenshot('error');
  } finally {
    await browser.close();
  }
}

test();
