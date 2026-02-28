const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/shop-look-v2';
const BASE_URL = 'https://shipazti.com';
const TEST_EMAIL = 'test-ollie@shipazti.com';
const TEST_PASSWORD = 'Test123456!';

async function test() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.readdirSync(SCREENSHOT_DIR).forEach(f => fs.unlinkSync(path.join(SCREENSHOT_DIR, f)));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'he-IL' });
  const page = await context.newPage();
  
  let num = 0;
  const shot = async (name) => {
    num++;
    const filename = `${String(num).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename) });
    console.log(`📸 ${filename}`);
  };

  try {
    // === 1. LOGIN ===
    console.log('\n🔐 1. התחברות...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("התחברות")');
    await page.waitForTimeout(4000);
    
    // === 2. GO TO VISUALIZE ===
    console.log('\n🎨 2. מעבר להדמיות...');
    await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Accept cookies
    const cookieBtn = await page.$('button:has-text("מאשר")');
    if (cookieBtn) await cookieBtn.click();
    
    // Download test image
    const testImagePath = '/tmp/test-room-shop2.jpg';
    if (!fs.existsSync(testImagePath)) {
      const https = require('https');
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(testImagePath);
        https.get('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', (response) => {
          response.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
      });
    }
    
    // === 3. UPLOAD IMAGE ===
    console.log('\n📤 3. העלאת תמונה...');
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(2000);
    }
    
    // Fill description
    const descField = await page.$('textarea');
    if (descField) {
      await descField.fill('סלון מודרני עם ספה ירוקה וצמחים');
    }
    
    await shot('01-ready-to-generate');
    
    // === 4. GENERATE VISUALIZATION ===
    console.log('\n🚀 4. יוצר הדמיה...');
    const genBtn = await page.$('button:has-text("צור הדמיה")');
    if (genBtn) {
      await genBtn.click();
      
      // Wait for result modal to appear (has before/after slider)
      console.log('ממתין לתוצאה...');
      for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(5000);
        
        // Check for result modal with slider or after section
        const resultModal = await page.$('.max-w-5xl, [class*="result"]');
        const afterSection = await page.$('text=אחרי');
        const shopLookSection = await page.$('text=קנה את הסגנון, text=Shop the Look');
        
        if (shopLookSection) {
          console.log('✅ נמצא Shop the Look!');
          break;
        }
        if (afterSection || resultModal) {
          console.log('✅ נמצא מודל תוצאה!');
          break;
        }
        console.log(`מעבד... ${(i+1)*5}s`);
      }
    }
    
    await shot('02-result-modal');
    
    // === 5. FIND AND CLICK SHOP THE LOOK ===
    console.log('\n🛒 5. מחפש Shop the Look...');
    
    // Look for Shop the Look button or section
    let shopFound = false;
    
    // Try different selectors
    const selectors = [
      'button:has-text("קנה את הסגנון")',
      'button:has-text("Shop the Look")',
      'text=קנה את הסגנון',
      '[class*="shop"]',
      'button:has-text("מוצרים")'
    ];
    
    for (const sel of selectors) {
      const el = await page.$(sel);
      if (el) {
        console.log(`Found element: ${sel}`);
        try {
          await el.click({ force: true });
          shopFound = true;
          break;
        } catch (e) {
          console.log(`Click failed on ${sel}: ${e.message.slice(0, 30)}`);
        }
      }
    }
    
    if (!shopFound) {
      // Try clicking on after image directly
      console.log('Trying to click after image...');
      const afterImg = await page.$('img[alt*="אחרי"]');
      if (afterImg) {
        await afterImg.click({ force: true });
      }
    }
    
    await page.waitForTimeout(3000);
    await shot('03-shop-look-opened');
    
    // === 6. WAIT FOR PRODUCTS ===
    console.log('\n⏳ 6. ממתין לטעינת פריטים...');
    
    let productCount = 0;
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(3000);
      
      // Look for product markers/dots
      const markers = await page.$$('circle, [class*="marker"], [class*="dot"]');
      const productList = await page.$$('[class*="product"]');
      
      productCount = markers.length + productList.length;
      if (productCount > 0) {
        console.log(`✅ נמצאו ${productCount} פריטים!`);
        break;
      }
      console.log(`ממתין... ${(i+1)*3}s`);
    }
    
    await shot('04-products-loaded');
    console.log(`פריטים לפני יציאה: ${productCount}`);
    
    // === 7. CLOSE AND GO TO DASHBOARD ===
    console.log('\n📊 7. סוגר והולך ל-Dashboard...');
    
    // Press Escape multiple times to close modals
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await shot('05-dashboard');
    
    // === 8. LOGOUT ===
    console.log('\n🔓 8. מתנתק...');
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    
    // === 9. LOGIN AGAIN ===
    console.log('\n🔐 9. מתחבר מחדש...');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("התחברות")');
    await page.waitForTimeout(4000);
    
    // === 10. GO TO VISUALIZE HISTORY ===
    console.log('\n📜 10. נכנס להיסטוריית הדמיות...');
    await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await shot('06-visualize-relogin');
    
    // Look for history section or saved visualization
    const historySection = await page.$('text=היסטוריה, text=הדמיות קודמות, [class*="history"]');
    console.log('History section found:', !!historySection);
    
    // Scroll down to find history
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await shot('07-scrolled-for-history');
    
    // === 11. CLICK ON SAVED VISUALIZATION ===
    console.log('\n🖼️ 11. מחפש הדמיה שמורה...');
    
    // Look for visualization cards
    const vizCards = await page.$$('[class*="card"], [class*="history"] img');
    console.log(`Found ${vizCards.length} visualization cards`);
    
    if (vizCards.length > 0) {
      await vizCards[0].click();
      await page.waitForTimeout(3000);
      await shot('08-viz-clicked');
      
      // Try Shop the Look again
      const shopBtn2 = await page.$('button:has-text("קנה"), button:has-text("Shop")');
      if (shopBtn2) {
        await shopBtn2.click({ force: true });
        await page.waitForTimeout(3000);
      }
    }
    
    await shot('09-final-state');
    
    // === 12. CHECK PERSISTENCE ===
    console.log('\n✅ 12. בודק שמירת פריטים...');
    
    const savedMarkers = await page.$$('circle, [class*="marker"], [class*="dot"]');
    const savedProducts = await page.$$('[class*="product"]');
    const savedCount = savedMarkers.length + savedProducts.length;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTS:');
    console.log('='.repeat(50));
    console.log(`פריטים לפני יציאה: ${productCount}`);
    console.log(`פריטים אחרי כניסה מחדש: ${savedCount}`);
    console.log(`Persistence: ${savedCount > 0 ? '✅ SUCCESS' : '❌ NEEDS CHECK'}`);
    console.log(`Screenshots: ${num}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await shot('error');
  } finally {
    await browser.close();
  }
}

test();
