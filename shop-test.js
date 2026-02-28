const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/shiputz-screenshots';
const BASE_URL = 'https://shipazti.com';

async function test() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  // Clean old screenshots
  fs.readdirSync(SCREENSHOT_DIR).forEach(f => fs.unlinkSync(path.join(SCREENSHOT_DIR, f)));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'he-IL'
  });
  const page = await context.newPage();
  
  let screenshotCount = 0;
  const screenshot = async (name) => {
    screenshotCount++;
    const filename = `${String(screenshotCount).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: false });
    console.log(`📸 ${filename}`);
    return filename;
  };

  try {
    // 1. Homepage
    console.log('🏠 Loading homepage...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await screenshot('homepage');
    
    // 2. Find navigation and explore
    console.log('🔍 Exploring navigation...');
    const pageContent = await page.content();
    
    // List all nav links
    const links = await page.$$eval('a[href]', els => 
      els.map(e => ({ text: e.textContent?.trim().slice(0, 40), href: e.getAttribute('href') }))
        .filter(e => e.text && e.href && !e.href.startsWith('#') && !e.href.startsWith('mailto'))
    );
    console.log('Links found:', links.length);
    links.slice(0, 15).forEach(l => console.log(`  - ${l.text}: ${l.href}`));
    
    // 3. Try dashboard/app area
    console.log('\n📱 Checking dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await screenshot('dashboard');
    
    // Check if we're on login or actual dashboard
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // 4. Explore dashboard elements
    const dashboardLinks = await page.$$eval('a[href], button', els => 
      els.map(e => ({ 
        tag: e.tagName, 
        text: e.textContent?.trim().slice(0, 50), 
        href: e.getAttribute('href') 
      })).filter(e => e.text)
    );
    console.log('Dashboard elements:');
    dashboardLinks.slice(0, 20).forEach(l => console.log(`  [${l.tag}] ${l.text} ${l.href || ''}`));
    
    // 5. Look for Shop the Look or detect products
    console.log('\n🛒 Looking for Shop the Look...');
    const shopLink = await page.$('a:has-text("Shop"), a:has-text("מוצרים"), a:has-text("זהה מוצרים"), button:has-text("Shop"), [href*="shop"], [href*="detect"], [href*="product"]');
    if (shopLink) {
      const linkText = await shopLink.textContent();
      console.log(`Found: "${linkText}"`);
      await shopLink.click();
      await page.waitForLoadState('networkidle');
      await screenshot('shop-the-look');
    } else {
      console.log('No direct Shop the Look link found, trying URLs...');
      const urls = ['/shop-the-look', '/shop', '/detect-products', '/products', '/visualize'];
      for (const url of urls) {
        try {
          const resp = await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          if (resp && resp.status() < 400) {
            console.log(`✅ ${url} exists`);
            await screenshot(`page${url.replace(/\//g, '-')}`);
          }
        } catch (e) {
          // Skip
        }
      }
    }
    
    // 6. Check for image upload functionality
    console.log('\n📤 Looking for image upload...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      console.log('✅ Found file input');
    }
    
    const uploadButton = await page.$('button:has-text("העלה"), button:has-text("upload"), label:has-text("העלה")');
    if (uploadButton) {
      console.log('✅ Found upload button');
    }

    console.log(`\n✅ Done! ${screenshotCount} screenshots saved to ${SCREENSHOT_DIR}`);
    console.log('Files:', fs.readdirSync(SCREENSHOT_DIR).join(', '));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await screenshot('error');
  } finally {
    await browser.close();
  }
}

test();
