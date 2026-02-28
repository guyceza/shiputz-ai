const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/shop-look-jsclick';
const BASE_URL = 'https://shipazti.com';
const TEST_EMAIL = 'test-ollie@shipazti.com';
const TEST_PASSWORD = 'Test123456!';

async function test() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.readdirSync(SCREENSHOT_DIR).forEach(f => fs.unlinkSync(path.join(SCREENSHOT_DIR, f)));
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'he-IL' });
  
  let num = 0;
  const shot = async (name) => {
    num++;
    const filename = `${String(num).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename) });
    console.log(`📸 ${filename}`);
  };

  try {
    // LOGIN
    console.log('\n🔐 התחברות...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("התחברות")');
    await page.waitForTimeout(4000);
    
    // GO TO VISUALIZE
    console.log('\n🎨 מעבר להדמיות...');
    await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Close any overlays
    const cookie = await page.$('button:has-text("מאשר")');
    if (cookie) await cookie.click();
    
    // Close chatbot
    await page.evaluate(() => {
      const chatClose = document.querySelector('[class*="fixed"][class*="bottom"] button');
      if (chatClose) chatClose.click();
    });
    
    // SCROLL TO BOTTOM
    console.log('\n📜 גולל לתחתית...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // CLICK "צור הדמיה חדשה" using JS
    console.log('\n📤 פותח מודל...');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent?.includes('צור הדמיה חדשה')) {
          btn.click();
          return;
        }
      }
    });
    await page.waitForTimeout(2000);
    await shot('01-modal');
    
    // UPLOAD IMAGE
    console.log('\n📤 מעלה תמונה...');
    const testImagePath = '/tmp/test-sofa-js.jpg';
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
    await page.fill('textarea', 'סלון מודרני עם ספה ירוקה');
    await shot('02-ready');
    
    // CLICK GENERATE using JavaScript
    console.log('\n🚀 יוצר הדמיה (JS click)...');
    const clicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        // Find the button with "צור הדמיה" but NOT "חדשה"
        if (btn.textContent?.includes('צור הדמיה') && 
            !btn.textContent?.includes('חדשה') && 
            !btn.disabled) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    console.log('Button clicked:', clicked);
    
    await page.waitForTimeout(3000);
    await shot('03-generating');
    
    // Wait for generation
    console.log('ממתין ליצירת הדמיה...');
    let resultFound = false;
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(5000);
      
      const hasResult = await page.evaluate(() => {
        // Look for "after" image from Supabase
        const imgs = document.querySelectorAll('img');
        for (const img of imgs) {
          if (img.src?.includes('supabase') && img.src?.includes('storage')) {
            return true;
          }
        }
        // Look for cost analysis
        if (document.body.innerText.includes('עלות משוערת')) {
          return true;
        }
        return false;
      });
      
      if (hasResult) {
        console.log('✅ הדמיה נוצרה!');
        resultFound = true;
        break;
      }
      console.log(`מעבד... ${(i+1)*5}s`);
    }
    
    await shot('04-result');
    
    if (!resultFound) {
      console.log('⏰ Timeout - checking current state');
    }
    
    // CLICK SHOP THE LOOK
    console.log('\n🛒 Shop the Look...');
    await page.evaluate(() => {
      // Try clicking "קנה את הסגנון" button
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent?.includes('קנה את הסגנון')) {
          btn.click();
          return;
        }
      }
      // Or click after image
      const afterImg = document.querySelector('img[alt*="אחרי"]');
      if (afterImg) afterImg.click();
    });
    
    await page.waitForTimeout(5000);
    await shot('05-shop');
    
    // Wait for products
    console.log('ממתין לפריטים...');
    let productCount = 0;
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(3000);
      
      productCount = await page.evaluate(() => {
        return document.querySelectorAll('circle, [class*="marker"]').length;
      });
      
      if (productCount > 0) {
        console.log(`✅ נמצאו ${productCount} פריטים`);
        break;
      }
    }
    
    await shot('06-products');
    
    // RELOGIN TEST
    console.log('\n🔄 בודק שמירה...');
    await page.keyboard.press('Escape');
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("התחברות")');
    await page.waitForTimeout(4000);
    
    await page.goto(`${BASE_URL}/visualize`);
    await page.waitForTimeout(3000);
    await shot('07-relogin');
    
    const savedCount = await page.evaluate(() => {
      return document.querySelectorAll('circle, [class*="marker"]').length;
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTS:');
    console.log(`פריטים לפני: ${productCount}`);
    console.log(`פריטים אחרי: ${savedCount}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌:', error.message);
    await shot('error');
  } finally {
    await browser.close();
  }
}

test();
