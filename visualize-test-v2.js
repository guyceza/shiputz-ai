const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/visualize-test-v2';
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
    // Login
    console.log('\n🔐 התחברות...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("התחברות")');
    await page.waitForTimeout(4000);
    
    // Go to visualize
    console.log('\n🎨 מעבר להדמיות...');
    await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Accept cookies
    const cookieBtn = await page.$('button:has-text("מאשר")');
    if (cookieBtn) await cookieBtn.click();
    await page.waitForTimeout(500);
    
    await shot('01-visualize-page');
    
    // Download test image
    const testImagePath = '/tmp/test-room-v2.jpg';
    if (!fs.existsSync(testImagePath)) {
      const https = require('https');
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(testImagePath);
        https.get('https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', (response) => {
          response.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
      });
    }
    
    // Find file input (might be hidden in modal)
    console.log('\n📤 מחפש input להעלאת קובץ...');
    
    // Try to find any file input on page
    let fileInput = await page.$('input[type="file"]');
    
    if (!fileInput) {
      // Click on upload area to potentially reveal file input
      const uploadArea = await page.$('[class*="upload"], [class*="drop"], label:has-text("לחץ"), div:has-text("גרור")');
      if (uploadArea) {
        console.log('Clicking upload area...');
        await uploadArea.click();
        await page.waitForTimeout(1000);
        fileInput = await page.$('input[type="file"]');
      }
    }
    
    // List all inputs on page
    const allInputs = await page.$$eval('input', els => els.map(e => ({ type: e.type, name: e.name, id: e.id })));
    console.log('All inputs:', allInputs);
    
    if (fileInput) {
      console.log('✅ Found file input!');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(2000);
      await shot('02-image-uploaded');
      
      // Fill description if available
      const descField = await page.$('textarea, input[type="text"]:not([type="email"]):not([type="password"])');
      if (descField) {
        await descField.fill('סלון מודרני עם ספה לבנה');
        console.log('Description filled');
      }
      
      await shot('03-ready');
      
      // Click generate
      const genBtn = await page.$('button:has-text("צור"), button:has-text("הדמיה")');
      if (genBtn) {
        console.log('Clicking generate...');
        await genBtn.click();
        await shot('04-generating');
        
        // Wait for result
        console.log('Waiting for AI (up to 90s)...');
        for (let i = 0; i < 18; i++) {
          await page.waitForTimeout(5000);
          const spinner = await page.$('.animate-spin');
          if (!spinner) {
            console.log('Done!');
            break;
          }
          console.log(`Processing... ${(i+1)*5}s`);
        }
        
        await shot('05-result');
        
        // Look for Shop the Look button
        const shopBtn = await page.$('button:has-text("Shop"), a:has-text("Shop"), button:has-text("מוצרים")');
        if (shopBtn) {
          console.log('Found Shop the Look button!');
          await shopBtn.click();
          await page.waitForTimeout(3000);
          await shot('06-shop-look');
        }
      }
    } else {
      console.log('❌ No file input found');
      
      // Take full page screenshot to see structure
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'full-page.png'), fullPage: true });
      console.log('📸 full-page.png (full page)');
      
      // Log page structure
      const structure = await page.evaluate(() => {
        const modal = document.querySelector('[class*="modal"], [role="dialog"], [class*="popup"]');
        if (modal) {
          return {
            hasModal: true,
            modalHTML: modal.innerHTML.slice(0, 500)
          };
        }
        return { hasModal: false };
      });
      console.log('Page structure:', structure);
    }
    
    console.log('\n📊 Screenshots:', num);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await shot('error');
  } finally {
    await browser.close();
  }
}

test();
