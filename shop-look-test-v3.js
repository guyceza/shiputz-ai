const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/shop-look-v3';
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
    
    await shot('01-visualize-page');
    
    // === 3. CLICK BUTTON TO OPEN UPLOAD MODAL ===
    console.log('\n📤 3. פותח את מודל ההעלאה...');
    
    // Find and click the "צור הדמיה" or "Try Now" button
    const tryBtn = await page.$('button:has-text("צור הדמיה"), button:has-text("נסו עכשיו"), button:has-text("התחל")');
    if (tryBtn) {
      await tryBtn.click();
      console.log('Clicked try button');
      await page.waitForTimeout(2000);
    } else {
      // Scroll down and look for button
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(1000);
      
      const tryBtn2 = await page.$('button:has-text("צור הדמיה"), button:has-text("נסו")');
      if (tryBtn2) {
        await tryBtn2.click();
        console.log('Clicked try button (after scroll)');
        await page.waitForTimeout(2000);
      }
    }
    
    await shot('02-modal-opened');
    
    // Check if modal opened
    const fileInput = await page.$('input[type="file"]');
    console.log('File input found after button click:', !!fileInput);
    
    if (!fileInput) {
      console.log('Looking for labels...');
      const labels = await page.$$eval('label', els => els.length);
      console.log('Labels found:', labels);
    }
    
    // === 4. UPLOAD IMAGE ===
    console.log('\n📤 4. מעלה תמונה...');
    
    // Download test image
    const testImagePath = '/tmp/test-room-v3.jpg';
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
    
    if (fileInput) {
      await fileInput.setInputFiles(testImagePath);
      console.log('✅ Image uploaded via file input');
    } else {
      // Try clicking label to trigger file chooser
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
        page.click('label:has-text("לחץ"), label:has-text("גרור"), [class*="dashed"]').catch(() => null)
      ]);
      
      if (fileChooser) {
        await fileChooser.setFiles(testImagePath);
        console.log('✅ Image uploaded via file chooser');
      } else {
        console.log('❌ Could not upload image');
      }
    }
    
    await page.waitForTimeout(2000);
    await shot('03-image-uploaded');
    
    // Fill description
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.fill('סלון מודרני עם ספה ירוקה');
      console.log('Description filled');
    }
    
    // === 5. GENERATE ===
    console.log('\n🚀 5. יוצר הדמיה...');
    
    const genBtn = await page.$('button:has-text("צור הדמיה"):not([disabled])');
    if (genBtn) {
      await genBtn.click();
      await shot('04-generating');
      
      // Wait for result
      console.log('ממתין ליצירת הדמיה...');
      let resultFound = false;
      for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(5000);
        
        // Check for result
        const afterImg = await page.$('img[alt*="אחרי"]');
        const shopSection = await page.$('text=קנה את הסגנון');
        
        if (afterImg || shopSection) {
          console.log('✅ הדמיה נוצרה!');
          resultFound = true;
          break;
        }
        console.log(`מעבד... ${(i+1)*5}s`);
      }
      
      await shot('05-result');
      
      if (resultFound) {
        // === 6. CLICK ON AFTER IMAGE FOR SHOP THE LOOK ===
        console.log('\n🛒 6. לוחץ על Shop the Look...');
        
        const shopBtn = await page.$('button:has-text("קנה את הסגנון"), button:has-text("Shop")');
        const afterImg = await page.$('img[alt*="אחרי"]');
        
        if (shopBtn) {
          await shopBtn.click({ force: true });
        } else if (afterImg) {
          await afterImg.click({ force: true });
        }
        
        await page.waitForTimeout(5000);
        await shot('06-shop-look');
        
        // Wait for products
        console.log('ממתין לפריטים...');
        let productCount = 0;
        for (let i = 0; i < 15; i++) {
          await page.waitForTimeout(3000);
          const markers = await page.$$('circle, [class*="marker"]');
          productCount = markers.length;
          if (productCount > 0) {
            console.log(`✅ נמצאו ${productCount} פריטים!`);
            break;
          }
        }
        
        await shot('07-products');
        console.log(`פריטים לפני יציאה: ${productCount}`);
        
        // === 7. CLOSE AND REOPEN ===
        console.log('\n🔄 7. יוצא ונכנס מחדש...');
        
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
        
        // Relogin
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button:has-text("התחברות")');
        await page.waitForTimeout(4000);
        
        // Check persistence
        await page.goto(`${BASE_URL}/visualize`);
        await page.waitForTimeout(3000);
        await shot('08-after-relogin');
        
        // Look for saved visualization
        const savedMarkers = await page.$$('circle, [class*="marker"]');
        console.log(`פריטים אחרי כניסה מחדש: ${savedMarkers.length}`);
        
        console.log('\n' + '='.repeat(40));
        console.log(`📊 RESULTS:`);
        console.log(`פריטים לפני: ${productCount}`);
        console.log(`פריטים אחרי: ${savedMarkers.length}`);
        console.log('='.repeat(40));
      }
    } else {
      console.log('❌ Generate button not found or disabled');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await shot('error');
  } finally {
    await browser.close();
  }
}

test();
