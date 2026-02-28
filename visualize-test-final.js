const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/visualize-test-final';
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
    console.log('Logged in, URL:', page.url());
    
    // Go to visualize
    console.log('\n🎨 מעבר להדמיות...');
    await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Accept cookies
    const cookieBtn = await page.$('button:has-text("מאשר")');
    if (cookieBtn) await cookieBtn.click();
    
    await shot('01-visualize-page');
    
    // Download test image
    const testImagePath = '/tmp/test-room-final.jpg';
    if (!fs.existsSync(testImagePath)) {
      const https = require('https');
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(testImagePath);
        https.get('https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', (response) => {
          response.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
      });
      console.log('Downloaded test image');
    }
    
    // Find the hidden file input and set files directly
    console.log('\n📤 העלאת תמונה...');
    
    // The input is hidden but we can still setInputFiles on it
    const fileInput = await page.$('input[type="file"][accept="image/*"]');
    
    if (fileInput) {
      console.log('✅ Found file input');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(2000);
      await shot('02-image-uploaded');
      
      // Fill description
      const descField = await page.$('textarea');
      if (descField) {
        await descField.fill('סלון מודרני עם ספה לבנה וצמחים ירוקים');
        console.log('Description filled');
      }
      
      await shot('03-ready-to-generate');
      
      // Click generate button
      const genBtn = await page.$('button:has-text("צור הדמיה")');
      if (genBtn) {
        console.log('Clicking generate...');
        await genBtn.click();
        await shot('04-generating-started');
        
        // Wait for generation (up to 90 seconds)
        console.log('Waiting for AI generation (up to 90s)...');
        for (let i = 0; i < 18; i++) {
          await page.waitForTimeout(5000);
          
          // Check for completion
          const resultImg = await page.$('img[alt*="אחרי"], img[src*="generated"], img[src*="after"]');
          const spinner = await page.$('.animate-spin, [class*="animate"]');
          const errorMsg = await page.$('text=שגיאה, text=נכשל');
          
          if (resultImg) {
            console.log('✅ Generation complete - result image found!');
            break;
          }
          if (errorMsg) {
            console.log('❌ Error during generation');
            break;
          }
          if (!spinner && i > 2) {
            console.log('No spinner, checking if done...');
          }
          console.log(`Processing... ${(i+1)*5}s`);
        }
        
        await shot('05-after-generation');
        
        // Check for result
        const afterImage = await page.$('img[src*="supabase"], img[src*="storage"]');
        if (afterImage) {
          const src = await afterImage.getAttribute('src');
          console.log('Result image URL:', src?.slice(0, 60));
        }
        
        // Look for Shop the Look option
        const shopBtn = await page.$('button:has-text("Shop"), a:has-text("Shop"), button:has-text("קנה")');
        if (shopBtn) {
          console.log('Found Shop the Look option!');
        }
        
      } else {
        console.log('❌ No generate button found');
        // List all buttons
        const buttons = await page.$$eval('button', els => els.map(e => e.textContent?.trim().slice(0, 30)));
        console.log('Buttons on page:', buttons);
      }
    } else {
      console.log('❌ No file input found');
    }
    
    // Check dashboard for saved visualization
    console.log('\n📊 בדיקת Dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await shot('06-dashboard');
    
    // Logout
    console.log('\n🚪 התנתקות...');
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await shot('07-logged-out');
    
    // Login again
    console.log('\n🔐 התחברות מחדש...');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("התחברות")');
    await page.waitForTimeout(4000);
    
    // Check persistence
    console.log('\n🔍 בדיקת שמירה...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await shot('08-dashboard-after-relogin');
    
    // Check if visualization saved
    const savedViz = await page.$('[class*="card"], [class*="history"], img[src*="supabase"]');
    console.log('Saved visualization found:', !!savedViz);
    
    console.log('\n📊 Done! Screenshots:', num);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await shot('error');
  } finally {
    await browser.close();
  }
}

test();
