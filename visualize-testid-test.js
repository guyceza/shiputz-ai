const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/visualize-testid-test';
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
    await shot('01-logged-in');
    
    // === GO TO VISUALIZE ===
    console.log('\n🎨 מעבר להדמיות...');
    await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Accept cookies
    const cookieBtn = await page.$('button:has-text("מאשר")');
    if (cookieBtn) await cookieBtn.click();
    
    await shot('02-visualize-page');
    
    // Check for data-testid
    const hasTestId = await page.$('[data-testid="image-upload-input"]');
    console.log('Has data-testid:', !!hasTestId);
    
    // Download test image
    const testImagePath = '/tmp/test-room-testid.jpg';
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
    
    // === UPLOAD IMAGE ===
    console.log('\n📤 העלאת תמונה...');
    
    // Try using data-testid first
    let fileInput = await page.$('[data-testid="image-upload-input"]');
    
    if (fileInput) {
      console.log('✅ Found file input via data-testid');
      await fileInput.setInputFiles(testImagePath);
    } else {
      console.log('Trying fallback methods...');
      
      // Method: Use file chooser with label click
      try {
        const [fileChooser] = await Promise.all([
          page.waitForEvent('filechooser', { timeout: 5000 }),
          page.click('[data-testid="image-upload-label"]')
        ]);
        await fileChooser.setFiles(testImagePath);
        console.log('✅ File chooser method worked');
      } catch (e) {
        console.log('File chooser failed:', e.message.slice(0, 50));
        
        // Last resort: Find any file input
        fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles(testImagePath);
          console.log('✅ Direct input method worked');
        }
      }
    }
    
    await page.waitForTimeout(2000);
    await shot('03-image-uploaded');
    
    // Check if image was uploaded
    const uploadedImg = await page.$('img[alt="לפני"]');
    console.log('Image uploaded:', !!uploadedImg);
    
    // Fill description
    const descField = await page.$('[data-testid="description-input"]') || await page.$('textarea');
    if (descField) {
      await descField.fill('סלון מודרני עם ספה לבנה, שטיח אפור וצמחים ירוקים');
      console.log('Description filled');
    }
    
    await shot('04-ready-to-generate');
    
    // === GENERATE ===
    console.log('\n🚀 יוצר הדמיה...');
    const genBtn = await page.$('[data-testid="generate-button"]') || await page.$('button:has-text("צור הדמיה")');
    
    if (genBtn) {
      const isDisabled = await genBtn.getAttribute('disabled');
      console.log('Generate button disabled:', isDisabled);
      
      if (!isDisabled) {
        await genBtn.click();
        await shot('05-generating');
        
        // Wait for generation (up to 120 seconds)
        console.log('Waiting for AI generation...');
        let completed = false;
        for (let i = 0; i < 24; i++) {
          await page.waitForTimeout(5000);
          
          // Check for completion
          const resultSection = await page.$('img[alt*="אחרי"]');
          const trialEnded = await page.$('text=הניסיון החינמי נגמר');
          
          if (trialEnded) {
            console.log('❌ Trial ended');
            await shot('06-trial-ended');
            break;
          }
          
          if (resultSection) {
            console.log('✅ Generation complete!');
            completed = true;
            await shot('06-result');
            break;
          }
          
          console.log(`Processing... ${(i+1)*5}s`);
        }
        
        if (!completed) {
          await shot('06-timeout');
        }
      } else {
        console.log('Button is disabled - image or description missing');
      }
    }
    
    // === CHECK DASHBOARD ===
    console.log('\n📊 בדיקת Dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await shot('07-dashboard');
    
    // === LOGOUT ===
    console.log('\n🚪 התנתקות...');
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto(`${BASE_URL}/login`);
    await shot('08-logged-out');
    
    // === LOGIN AGAIN ===
    console.log('\n🔐 התחברות מחדש...');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("התחברות")');
    await page.waitForTimeout(4000);
    
    // === CHECK PERSISTENCE ===
    console.log('\n🔍 בדיקת שמירה...');
    await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await shot('09-visualize-after-relogin');
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 COMPLETE! Screenshots:', num);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await shot('error');
  } finally {
    await browser.close();
  }
}

test();
