const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/shop-look-persistence';
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
    await shot('01-logged-in');
    
    // === 2. GO TO VISUALIZE ===
    console.log('\n🎨 2. מעבר להדמיות...');
    await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Accept cookies
    const cookieBtn = await page.$('button:has-text("מאשר")');
    if (cookieBtn) await cookieBtn.click();
    
    // Download test image
    const testImagePath = '/tmp/test-room-shop.jpg';
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
    
    await shot('02-ready-to-generate');
    
    // === 4. GENERATE VISUALIZATION ===
    console.log('\n🚀 4. יוצר הדמיה...');
    const genBtn = await page.$('button:has-text("צור הדמיה")');
    if (genBtn) {
      await genBtn.click();
      
      // Wait for generation (up to 120 seconds)
      console.log('ממתין ליצירת הדמיה...');
      for (let i = 0; i < 24; i++) {
        await page.waitForTimeout(5000);
        
        // Check for result modal with after image
        const afterImg = await page.$('img[alt*="אחרי"]');
        if (afterImg) {
          console.log('✅ הדמיה נוצרה!');
          break;
        }
        console.log(`מעבד... ${(i+1)*5}s`);
      }
    }
    
    await shot('03-visualization-created');
    
    // === 5. CLICK ON "AFTER" IMAGE FOR SHOP THE LOOK ===
    console.log('\n🛒 5. לוחץ על תמונת אחרי ל-Shop the Look...');
    
    // Find and click the after image or Shop the Look button
    const shopLookBtn = await page.$('button:has-text("Shop"), button:has-text("קנה את הסגנון"), button:has-text("מוצרים")');
    const afterImage = await page.$('img[alt*="אחרי"]');
    
    if (shopLookBtn) {
      console.log('Found Shop the Look button');
      await shopLookBtn.click();
    } else if (afterImage) {
      console.log('Clicking after image');
      await afterImage.click();
    }
    
    await page.waitForTimeout(3000);
    await shot('04-shop-look-clicked');
    
    // === 6. WAIT FOR ITEMS TO LOAD ===
    console.log('\n⏳ 6. ממתין לטעינת פריטים...');
    
    // Wait for products to appear
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(3000);
      
      // Check for product dots or product list
      const productDots = await page.$$('[class*="marker"], [class*="dot"], [class*="product"]');
      const productList = await page.$('[class*="products"], [class*="items"]');
      
      if (productDots.length > 0 || productList) {
        console.log(`✅ נמצאו ${productDots.length} פריטים!`);
        break;
      }
      console.log(`ממתין לפריטים... ${(i+1)*3}s`);
    }
    
    await shot('05-items-loaded');
    
    // Count items
    const items = await page.$$('[class*="marker"], [class*="dot"]');
    console.log(`סה"כ פריטים שזוהו: ${items.length}`);
    
    // === 7. EXIT ===
    console.log('\n🚪 7. יוצא מהתמונה...');
    
    // Click X or close button or press Escape
    const closeBtn = await page.$('button:has-text("×"), button:has-text("✕"), [class*="close"]');
    if (closeBtn) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(2000);
    await shot('06-exited');
    
    // === 8. LOGOUT ===
    console.log('\n🔓 8. מתנתק...');
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await shot('07-logged-out');
    
    // === 9. LOGIN AGAIN ===
    console.log('\n🔐 9. מתחבר מחדש...');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("התחברות")');
    await page.waitForTimeout(4000);
    await shot('08-relogged-in');
    
    // === 10. GO TO HISTORY/DASHBOARD ===
    console.log('\n📜 10. נכנס להיסטוריה...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await shot('09-dashboard');
    
    // === 11. CLICK ON SAVED VISUALIZATION ===
    console.log('\n🖼️ 11. לוחץ על ההדמיה שנשמרה...');
    
    // Look for visualization card or link
    const vizCard = await page.$('[class*="card"], [class*="visualization"], a:has-text("הדמיה")');
    if (vizCard) {
      await vizCard.click();
      await page.waitForTimeout(3000);
    }
    
    await shot('10-visualization-opened');
    
    // === 12. CHECK IF ITEMS PERSISTED ===
    console.log('\n✅ 12. בודק אם הפריטים נשמרו...');
    
    // Check for saved products
    const savedItems = await page.$$('[class*="marker"], [class*="dot"], [class*="product"]');
    console.log(`פריטים שנמצאו אחרי כניסה מחדש: ${savedItems.length}`);
    
    await shot('11-final-check');
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 COMPLETE!');
    console.log('='.repeat(50));
    console.log(`Screenshots: ${num}`);
    console.log(`Items before exit: ${items.length}`);
    console.log(`Items after relogin: ${savedItems.length}`);
    console.log(`Persistence: ${savedItems.length > 0 ? '✅ SUCCESS' : '❌ FAILED'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await shot('error');
  } finally {
    await browser.close();
  }
}

test();
