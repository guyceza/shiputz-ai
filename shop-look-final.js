const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/shop-look-final';
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
    // === LOGIN ===
    console.log('\n🔐 התחברות...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("התחברות")');
    await page.waitForTimeout(4000);
    
    // === GO TO VISUALIZE ===
    console.log('\n🎨 מעבר להדמיות...');
    await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Close any popups
    const cookie = await page.$('button:has-text("מאשר")');
    if (cookie) await cookie.click();
    
    // Close chatbot if open
    const chatClose = await page.$('button:has-text("✕")');
    if (chatClose) await chatClose.click();
    
    // === CLICK TRY BUTTON ===
    console.log('\n📤 פותח מודל...');
    await page.click('button:has-text("צור הדמיה")', { force: true });
    await page.waitForTimeout(2000);
    
    // === UPLOAD IMAGE ===
    console.log('\n📤 מעלה תמונה...');
    
    const testImagePath = '/tmp/test-sofa.jpg';
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
    
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles(testImagePath);
      console.log('✅ תמונה הועלתה');
    }
    
    await page.waitForTimeout(2000);
    
    // Fill description
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.fill('סלון מודרני עם ספה ירוקה');
    }
    
    await shot('01-ready');
    
    // === GENERATE ===
    console.log('\n🚀 יוצר הדמיה...');
    
    // Use evaluate to click the button directly
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent?.includes('צור הדמיה') && !btn.disabled) {
          btn.click();
          return;
        }
      }
    });
    
    await shot('02-generating');
    
    // Wait for result
    console.log('ממתין ליצירת הדמיה (עד 2 דקות)...');
    let found = false;
    for (let i = 0; i < 24; i++) {
      await page.waitForTimeout(5000);
      
      const afterImg = await page.$('img[alt*="אחרי"]');
      if (afterImg) {
        console.log('✅ הדמיה נוצרה!');
        found = true;
        break;
      }
      console.log(`עיבוד... ${(i+1)*5}s`);
    }
    
    await shot('03-result');
    
    if (found) {
      // === SHOP THE LOOK ===
      console.log('\n🛒 Shop the Look...');
      
      // Click on after image using evaluate
      await page.evaluate(() => {
        const afterImg = document.querySelector('img[alt*="אחרי"]');
        if (afterImg) afterImg.click();
      });
      
      await page.waitForTimeout(5000);
      await shot('04-shop-click');
      
      // Wait for products
      console.log('ממתין לפריטים...');
      let productCount = 0;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(3000);
        const markers = await page.$$('circle, [class*="absolute"][class*="cursor-pointer"]');
        productCount = markers.length;
        if (productCount > 0) {
          console.log(`✅ נמצאו ${productCount} פריטים`);
          break;
        }
      }
      
      await shot('05-products');
      
      // === RELOGIN TEST ===
      console.log('\n🔄 יציאה וכניסה מחדש...');
      
      // Close everything
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // Clear storage
      await page.evaluate(() => { 
        localStorage.clear(); 
        sessionStorage.clear(); 
      });
      
      // Relogin
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button:has-text("התחברות")');
      await page.waitForTimeout(4000);
      
      // Go back to visualize
      await page.goto(`${BASE_URL}/visualize`);
      await page.waitForTimeout(3000);
      
      await shot('06-after-relogin');
      
      // Check for saved products
      const savedMarkers = await page.$$('circle, [class*="absolute"][class*="cursor-pointer"]');
      const savedCount = savedMarkers.length;
      
      console.log('\n' + '='.repeat(50));
      console.log('📊 תוצאות:');
      console.log('='.repeat(50));
      console.log(`פריטים לפני: ${productCount}`);
      console.log(`פריטים אחרי: ${savedCount}`);
      console.log(`שמירה: ${savedCount > 0 ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('❌ שגיאה:', error.message);
    await shot('error');
  } finally {
    await browser.close();
  }
}

test();
