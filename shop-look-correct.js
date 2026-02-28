const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/shop-look-correct';
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
    
    // Close cookies/chat
    const cookie = await page.$('button:has-text("מאשר")');
    if (cookie) await cookie.click();
    
    // === SCROLL TO BOTTOM AND CLICK REAL BUTTON ===
    console.log('\n📜 גולל לתחתית העמוד...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await shot('01-scrolled-bottom');
    
    // Click the REAL "צור הדמיה חדשה" button at the bottom
    console.log('\n📤 לוחץ על כפתור יצירת הדמיה...');
    const bottomButton = await page.$('button:has-text("צור הדמיה חדשה")');
    if (bottomButton) {
      await bottomButton.click();
      console.log('✅ לחצתי על הכפתור בתחתית');
    } else {
      // Try finding any button with the text
      await page.click('text=צור הדמיה חדשה');
    }
    
    await page.waitForTimeout(2000);
    await shot('02-modal-opened');
    
    // Check for file input
    const fileInput = await page.$('input[type="file"]');
    console.log('File input found:', !!fileInput);
    
    if (!fileInput) {
      console.log('❌ לא נמצא file input');
      await browser.close();
      return;
    }
    
    // === UPLOAD IMAGE ===
    console.log('\n📤 מעלה תמונה...');
    const testImagePath = '/tmp/test-room-correct.jpg';
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
    
    await fileInput.setInputFiles(testImagePath);
    console.log('✅ תמונה הועלתה');
    await page.waitForTimeout(2000);
    
    // Fill description
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.fill('סלון מודרני עם ספה ירוקה וצמחים');
    }
    
    await shot('03-ready-to-generate');
    
    // === CLICK GENERATE ===
    console.log('\n🚀 יוצר הדמיה...');
    
    // Find and click the generate button inside the modal
    const genButton = await page.$('button:has-text("צור הדמיה"):not(:has-text("חדשה"))');
    if (genButton) {
      await genButton.click();
      console.log('✅ לחצתי על צור הדמיה');
    } else {
      // Fallback - click via JS
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          if (btn.textContent?.includes('צור הדמיה') && !btn.textContent?.includes('חדשה') && !btn.disabled) {
            btn.click();
            break;
          }
        }
      });
    }
    
    await shot('04-generating');
    
    // Wait for generation
    console.log('ממתין ליצירת הדמיה...');
    let resultFound = false;
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(5000);
      
      // Look for result modal with before/after
      const hasResult = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        for (const img of imgs) {
          if (img.alt?.includes('אחרי') && img.src?.includes('supabase')) {
            return true;
          }
        }
        // Also check for slider or costs section
        if (document.querySelector('[class*="slider"]') || document.body.innerText.includes('עלות משוערת')) {
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
    
    await shot('05-result');
    
    if (!resultFound) {
      console.log('❌ לא נוצרה הדמיה בזמן');
      await browser.close();
      return;
    }
    
    // === CLICK SHOP THE LOOK ===
    console.log('\n🛒 לוחץ על Shop the Look...');
    
    // Look for the after image or shop button
    const shopClicked = await page.evaluate(() => {
      // Try Shop the Look button
      const shopBtn = document.querySelector('button:has-text("קנה את הסגנון")');
      if (shopBtn) {
        shopBtn.click();
        return 'button';
      }
      
      // Try clicking after image
      const afterImg = document.querySelector('img[alt*="אחרי"]');
      if (afterImg) {
        afterImg.click();
        return 'image';
      }
      
      return null;
    });
    
    console.log('Clicked:', shopClicked);
    await page.waitForTimeout(5000);
    await shot('06-shop-look');
    
    // Wait for products
    console.log('ממתין לפריטים...');
    let productCount = 0;
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(3000);
      
      productCount = await page.evaluate(() => {
        // Count product markers
        const circles = document.querySelectorAll('circle');
        const markers = document.querySelectorAll('[class*="marker"], [class*="dot"]');
        return circles.length + markers.length;
      });
      
      if (productCount > 0) {
        console.log(`✅ נמצאו ${productCount} פריטים`);
        break;
      }
    }
    
    await shot('07-products');
    
    // === LOGOUT AND RELOGIN ===
    console.log('\n🔄 בודק שמירה...');
    
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("התחברות")');
    await page.waitForTimeout(4000);
    
    await page.goto(`${BASE_URL}/visualize`);
    await page.waitForTimeout(3000);
    
    await shot('08-after-relogin');
    
    const savedCount = await page.evaluate(() => {
      const circles = document.querySelectorAll('circle');
      const markers = document.querySelectorAll('[class*="marker"]');
      return circles.length + markers.length;
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 תוצאות:');
    console.log(`פריטים לפני: ${productCount}`);
    console.log(`פריטים אחרי: ${savedCount}`);
    console.log(`שמירה: ${savedCount > 0 ? '✅ SUCCESS' : '❌ NEEDS CHECK'}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ שגיאה:', error.message);
    await shot('error');
  } finally {
    await browser.close();
  }
}

test();
