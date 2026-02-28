const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/shiputz-screenshots';
const BASE_URL = 'https://shipazti.com';

async function test() {
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
    return path.join(SCREENSHOT_DIR, filename);
  };

  try {
    // 1. Go to Shop the Look
    console.log('🛒 Opening Shop the Look...');
    await page.goto(`${BASE_URL}/shop-look`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Accept cookies if present
    const acceptBtn = await page.$('button:has-text("מאשר")');
    if (acceptBtn) {
      await acceptBtn.click();
      await page.waitForTimeout(500);
    }
    
    await screenshot('1-shop-look-clean');
    
    // 2. Find clickable dots/markers
    console.log('\n🔍 Looking for product markers...');
    const dots = await page.$$('[class*="marker"], [class*="dot"], [class*="hotspot"], div[style*="cursor: pointer"], button[style*="position: absolute"]');
    console.log(`Found ${dots.length} potential markers`);
    
    // Try clicking on different areas of the image to find products
    const imageContainer = await page.$('img[src*="room"], img[alt*="room"], div[class*="image"]');
    if (imageContainer) {
      const box = await imageContainer.boundingBox();
      console.log('Image bounds:', box);
    }
    
    // Look for any buttons/links on the page
    const allButtons = await page.$$eval('button, [role="button"]', els => 
      els.map(e => ({
        text: e.textContent?.trim().slice(0, 40),
        classes: e.className,
        pos: e.getBoundingClientRect()
      }))
    );
    console.log('Buttons found:', allButtons.length);
    allButtons.slice(0, 10).forEach(b => console.log(`  - "${b.text}" [${b.classes?.slice(0,30)}]`));
    
    // 3. Scroll down to see more content
    console.log('\n📜 Scrolling to see full page...');
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);
    await screenshot('2-scrolled-down');
    
    // Look for sidebar with products
    const sidebar = await page.$('[class*="sidebar"], [class*="panel"], [class*="products"]');
    if (sidebar) {
      console.log('✅ Found sidebar/panel');
      await screenshot('3-sidebar');
    }
    
    // 4. Scroll to bottom to find upload section
    console.log('\n📤 Looking for upload section...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await screenshot('4-page-bottom');
    
    // Check the full HTML for file input
    const hasFileInput = await page.$('input[type="file"]');
    console.log('File input found:', !!hasFileInput);
    
    // Look for any dropzone or upload area
    const uploadArea = await page.$('[class*="drop"], [class*="upload"], [class*="drag"]');
    console.log('Upload area found:', !!uploadArea);
    
    // 5. Get all text content to understand the page
    const h2s = await page.$$eval('h2, h3', els => els.map(e => e.textContent?.trim()));
    console.log('\nHeadings:', h2s);
    
    // 6. Try clicking on the image area to trigger product popup
    console.log('\n🖱️ Testing click on image area...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    
    // Click near center of image
    await page.mouse.click(600, 500);
    await page.waitForTimeout(1000);
    await screenshot('5-after-click');
    
    // Check if popup appeared
    const popup = await page.$('[class*="popup"], [class*="modal"], [class*="tooltip"], [class*="product-card"]');
    if (popup) {
      console.log('✅ Popup appeared!');
      await screenshot('6-popup');
    }
    
    console.log(`\n✅ Done! ${screenshotCount} screenshots in ${SCREENSHOT_DIR}`);
    console.log('Files:', fs.readdirSync(SCREENSHOT_DIR).join(', '));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await screenshot('error');
  } finally {
    await browser.close();
  }
}

test();
