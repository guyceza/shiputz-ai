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
    await screenshot('01-page-ready');
    
    // 2. Click on a hotspot - should open Google Shopping
    console.log('\n🖱️ Clicking on sofa hotspot...');
    
    // Listen for new page before clicking
    const [newPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 10000 }),
      // Click in center of sofa area (based on position: top: 48%, left: 30%, width: 28%)
      // Image bounds: x=128, width=1024, so sofa center is around x=128 + 1024*(0.30+0.14) = 580
      // y: top of image + 48% of image height
      page.mouse.click(580, 600)
    ]);
    
    console.log('✅ New page opened!');
    await newPage.waitForLoadState('domcontentloaded');
    const url = newPage.url();
    console.log('URL:', url);
    
    // Check if it's Google Shopping
    if (url.includes('google.com/search') && url.includes('tbm=shop')) {
      console.log('✅ CONFIRMED: Google Shopping search page');
      
      // Parse search query
      const urlObj = new URL(url);
      const query = urlObj.searchParams.get('q');
      console.log('Search query:', query);
    }
    
    await newPage.screenshot({ path: path.join(SCREENSHOT_DIR, `${String(++screenshotCount).padStart(2, '0')}-google-shopping.png`) });
    console.log(`📸 ${screenshotCount.toString().padStart(2, '0')}-google-shopping.png`);
    
    await newPage.close();
    
    // 3. Test another hotspot - floor lamp
    console.log('\n🖱️ Clicking on floor lamp hotspot...');
    const [newPage2] = await Promise.all([
      context.waitForEvent('page', { timeout: 10000 }),
      // Floor lamp: top: 35%, left: 82% - so x ~= 128 + 1024*0.87 = 1020
      page.mouse.click(350, 500)  // Left side where the lamp is
    ]);
    
    await newPage2.waitForLoadState('domcontentloaded');
    const url2 = newPage2.url();
    console.log('Second click URL:', url2);
    
    if (url2.includes('google.com')) {
      const urlObj = new URL(url2);
      const query = urlObj.searchParams.get('q');
      console.log('Search query:', query);
      await newPage2.screenshot({ path: path.join(SCREENSHOT_DIR, `${String(++screenshotCount).padStart(2, '0')}-google-lamp.png`) });
      console.log(`📸 ${screenshotCount.toString().padStart(2, '0')}-google-lamp.png`);
    }
    
    await newPage2.close();
    
    // 4. Test signup flow
    console.log('\n📝 Testing signup flow...');
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle', timeout: 30000 });
    await screenshot('signup-page');
    
    // Check form fields
    const formFields = await page.$$eval('input', els => 
      els.map(e => ({ type: e.type, placeholder: e.placeholder, name: e.name }))
    );
    console.log('Signup form fields:', formFields);
    
    // 5. Test visualize page
    console.log('\n🎨 Testing Visualize (AI Vision) page...');
    await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle', timeout: 30000 });
    await screenshot('visualize-page');
    
    // Check for upload functionality
    const hasFileInput = await page.$('input[type="file"]');
    console.log('File input found:', !!hasFileInput);
    
    const pageContent = await page.textContent('body');
    console.log('Page has "העלה תמונה":', pageContent.includes('העלה'));
    console.log('Page has "הדמיה":', pageContent.includes('הדמיה'));
    
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
