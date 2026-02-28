const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

const SCREENSHOT_DIR = '/tmp/shiputz-flow-test';
const BASE_URL = 'https://shipazti.com';
const TEST_EMAIL = 'test-ollie@shipazti.com';
const TEST_PASSWORD = 'Test123456!';

// Download test image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

async function test() {
  // Setup
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.readdirSync(SCREENSHOT_DIR).forEach(f => fs.unlinkSync(path.join(SCREENSHOT_DIR, f)));
  
  // Download test image
  const testImagePath = '/tmp/test-room.jpg';
  if (!fs.existsSync(testImagePath)) {
    console.log('📥 Downloading test image...');
    await downloadImage('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', testImagePath);
  }
  
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
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename) });
    console.log(`📸 ${filename}`);
    return path.join(SCREENSHOT_DIR, filename);
  };

  try {
    // ===== STEP 1: LOGIN =====
    console.log('\n🔐 STEP 1: Logging in...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await screenshot('01-login-page');
    
    // Fill login form
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await screenshot('02-login-filled');
    
    // Submit
    await page.click('button:has-text("התחברות")');
    await page.waitForTimeout(3000);
    await screenshot('03-after-login');
    
    const currentUrl = page.url();
    console.log('After login URL:', currentUrl);
    
    if (currentUrl.includes('dashboard')) {
      console.log('✅ Login successful!');
    } else {
      console.log('⚠️ May not have redirected to dashboard');
    }
    
    // ===== STEP 2: CREATE VISUALIZATION =====
    console.log('\n🎨 STEP 2: Creating visualization...');
    await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle' });
    await screenshot('04-visualize-page');
    
    // Look for file upload
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      console.log('Found file input, uploading test image...');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(2000);
      await screenshot('05-image-uploaded');
      
      // Wait for processing and fill description if needed
      const descInput = await page.$('textarea, input[placeholder*="תאר"]');
      if (descInput) {
        await descInput.fill('סלון מודרני עם ספה אפורה');
      }
      
      // Click generate button
      const generateBtn = await page.$('button:has-text("צור"), button:has-text("יצירה"), button:has-text("הדמיה")');
      if (generateBtn) {
        console.log('Clicking generate button...');
        await generateBtn.click();
        
        // Wait for generation (can take up to 30 seconds)
        console.log('Waiting for AI generation (up to 60s)...');
        await page.waitForTimeout(5000);
        await screenshot('06-generating');
        
        // Wait for result
        try {
          await page.waitForSelector('img[src*="blob:"], img[src*="data:"], img[src*="storage"]', { timeout: 60000 });
          console.log('✅ Visualization generated!');
          await screenshot('07-visualization-done');
        } catch (e) {
          console.log('⚠️ Generation timeout or no result image found');
          await screenshot('07-generation-status');
        }
      }
    } else {
      console.log('⚠️ No file input found, checking for alternative upload method...');
      
      // Maybe there's a button to trigger upload
      const uploadBtn = await page.$('button:has-text("העלה"), label:has-text("העלה")');
      if (uploadBtn) {
        console.log('Found upload button');
      }
      await screenshot('05-no-file-input');
    }
    
    // ===== STEP 3: GO TO SHOP THE LOOK =====
    console.log('\n🛒 STEP 3: Going to Shop the Look...');
    await page.goto(`${BASE_URL}/shop-look`, { waitUntil: 'networkidle' });
    await screenshot('08-shop-look');
    
    // Check if there's a way to upload for Shop the Look
    const shopUpload = await page.$('input[type="file"]');
    if (shopUpload) {
      console.log('Found Shop the Look upload');
      await shopUpload.setInputFiles(testImagePath);
      await page.waitForTimeout(5000);
      await screenshot('09-shop-look-processing');
      
      // Wait for products to be detected
      await page.waitForTimeout(30000);
      await screenshot('10-products-detected');
    }
    
    // Check for products list
    const products = await page.$$('[class*="item"], [class*="product"]');
    console.log('Products found:', products.length);
    
    // ===== STEP 4: LOGOUT =====
    console.log('\n🚪 STEP 4: Logging out...');
    
    // Clear localStorage to simulate logout
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await screenshot('11-logged-out');
    
    // ===== STEP 5: LOGIN AGAIN =====
    console.log('\n🔐 STEP 5: Logging in again...');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("התחברות")');
    await page.waitForTimeout(3000);
    await screenshot('12-relogin');
    
    // ===== STEP 6: CHECK IF DATA PERSISTED =====
    console.log('\n🔍 STEP 6: Checking if data persisted...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await screenshot('13-dashboard-after-relogin');
    
    // Check for saved visualizations/projects
    const savedItems = await page.$$('[class*="card"], [class*="project"], [class*="history"]');
    console.log('Saved items in dashboard:', savedItems.length);
    
    // Go to shop-look and check for saved products
    await page.goto(`${BASE_URL}/shop-look`, { waitUntil: 'networkidle' });
    await screenshot('14-shop-look-after-relogin');
    
    const productsAfter = await page.$$eval('[class*="item"]', els => els.length);
    console.log('Products after re-login:', productsAfter);
    
    console.log(`\n✅ Test complete! ${screenshotCount} screenshots saved to ${SCREENSHOT_DIR}`);
    console.log('Files:', fs.readdirSync(SCREENSHOT_DIR).join(', '));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await screenshot('error');
  } finally {
    await browser.close();
  }
}

test();
