const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/shop-look-user-test';
const BASE_URL = 'https://shipazti.com';
const TEST_EMAIL = 'test-ollie@shipazti.com';
const TEST_PASSWORD = 'Test123456!';

async function shopLookUserTest() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.readdirSync(SCREENSHOT_DIR).forEach(f => fs.unlinkSync(path.join(SCREENSHOT_DIR, f)));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'he-IL'
  });
  const page = await context.newPage();
  
  let num = 0;
  const shot = async (name) => {
    num++;
    const filename = `${String(num).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename) });
    console.log(`📸 ${filename}`);
    return path.join(SCREENSHOT_DIR, filename);
  };

  try {
    // ===== STEP 1: LOGIN =====
    console.log('\n🔐 STEP 1: התחברות...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await shot('01-login-filled');
    
    await page.click('button:has-text("התחברות")');
    await page.waitForTimeout(4000);
    await shot('02-after-login');
    console.log('Current URL:', page.url());
    
    // ===== STEP 2: GO TO SHOP THE LOOK =====
    console.log('\n🛒 STEP 2: מעבר ל-Shop the Look...');
    await page.goto(`${BASE_URL}/shop-look`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await shot('03-shop-look-page');
    
    // Accept cookies if needed
    const cookieBtn = await page.$('button:has-text("מאשר")');
    if (cookieBtn) {
      await cookieBtn.click();
      await page.waitForTimeout(500);
    }
    
    // Check if we see the upload option
    const uploadInput = await page.$('input[type="file"]');
    console.log('Upload input found:', !!uploadInput);
    
    // ===== STEP 3: UPLOAD IMAGE =====
    console.log('\n📤 STEP 3: העלאת תמונה...');
    
    // Download a test image if needed
    const testImagePath = '/tmp/test-living-room.jpg';
    if (!fs.existsSync(testImagePath)) {
      const https = require('https');
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(testImagePath);
        https.get('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', (response) => {
          response.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
      });
      console.log('Test image downloaded');
    }
    
    if (uploadInput) {
      console.log('Uploading image...');
      await uploadInput.setInputFiles(testImagePath);
      await shot('04-uploading');
      
      // Wait for upload and processing
      console.log('Waiting for AI processing (up to 60s)...');
      await page.waitForTimeout(5000);
      await shot('05-processing');
      
      // Wait for products to appear or loading to finish
      let attempts = 0;
      while (attempts < 12) {
        await page.waitForTimeout(5000);
        attempts++;
        
        // Check if loading spinner is gone
        const spinner = await page.$('.animate-spin');
        const loadingText = await page.$('text=מזהה מוצרים');
        
        if (!spinner && !loadingText) {
          console.log('Processing complete!');
          break;
        }
        console.log(`Still processing... (${attempts * 5}s)`);
      }
      
      await shot('06-after-processing');
      
      // Check for products
      const productDots = await page.$$('[class*="cursor-pointer"]');
      console.log('Product markers found:', productDots.length);
      
      // Check items list
      const itemsList = await page.$$eval('[class*="item"], h3 + div .flex', els => els.length);
      console.log('Items in list:', itemsList);
    } else {
      console.log('⚠️ No upload input found - checking page content...');
      const pageText = await page.textContent('body');
      if (pageText.includes('משהו השתבש')) {
        console.log('❌ Error page detected!');
        await shot('error-page');
      }
    }
    
    // ===== STEP 4: LOGOUT =====
    console.log('\n🚪 STEP 4: התנתקות...');
    
    // Go to dashboard to logout
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await shot('07-dashboard');
    
    // Find logout button
    const logoutBtn = await page.$('button:has-text("התנתקות"), a:has-text("התנתקות")');
    if (logoutBtn) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
    } else {
      // Clear storage to simulate logout
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    }
    
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await shot('08-logged-out');
    console.log('Logged out');
    
    // ===== STEP 5: LOGIN AGAIN =====
    console.log('\n🔐 STEP 5: התחברות מחדש...');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("התחברות")');
    await page.waitForTimeout(4000);
    await shot('09-relogin');
    
    // ===== STEP 6: CHECK PERSISTENCE =====
    console.log('\n🔍 STEP 6: בדיקת שמירה...');
    await page.goto(`${BASE_URL}/shop-look`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await shot('10-shop-look-after-relogin');
    
    // Check if custom image is loaded
    const imgSrc = await page.$eval('img[alt*="סלון"], img[src*="supabase"], img[src*="storage"]', 
      el => el.src).catch(() => null);
    
    if (imgSrc && imgSrc.includes('supabase')) {
      console.log('✅ Custom image loaded from Supabase!');
      console.log('Image URL:', imgSrc.slice(0, 80) + '...');
    } else {
      console.log('Image source:', imgSrc?.slice(0, 50) || 'default demo');
    }
    
    // Check for products
    const productsAfter = await page.$$('[class*="cursor-pointer"]');
    console.log('Product markers after relogin:', productsAfter.length);
    
    // Final screenshot
    await shot('11-final-state');
    
    // ===== SUMMARY =====
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log('Screenshots:', num);
    console.log('Files:', fs.readdirSync(SCREENSHOT_DIR).join(', '));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await shot('error');
  } finally {
    await browser.close();
  }
}

shopLookUserTest();
