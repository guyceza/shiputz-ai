const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/visualize-flow-test';
const BASE_URL = 'https://shipazti.com';
const TEST_EMAIL = 'test-ollie@shipazti.com';
const TEST_PASSWORD = 'Test123456!';

async function visualizeFlowTest() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.readdirSync(SCREENSHOT_DIR).forEach(f => fs.unlinkSync(path.join(SCREENSHOT_DIR, f)));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'he-IL'
  });
  const page = await context.newPage();
  
  let num = 0;
  const shot = async (name) => {
    num++;
    const filename = `${String(num).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename) });
    console.log(`📸 ${filename}`);
    return path.join(SCREENSHOT_DIR, filename);
  };

  try {
    // ===== STEP 1: LOGIN =====
    console.log('\n🔐 STEP 1: התחברות...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("התחברות")');
    await page.waitForTimeout(4000);
    await shot('01-logged-in');
    console.log('URL:', page.url());
    
    // ===== STEP 2: GO TO VISUALIZE =====
    console.log('\n🎨 STEP 2: מעבר לעמוד הדמיות...');
    await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await shot('02-visualize-page');
    
    // Accept cookies
    const cookieBtn = await page.$('button:has-text("מאשר")');
    if (cookieBtn) await cookieBtn.click();
    
    // Check page content
    const pageText = await page.textContent('body');
    console.log('Page has upload:', pageText.includes('העלה') || pageText.includes('תמונה'));
    
    // Look for file input or upload button
    const fileInput = await page.$('input[type="file"]');
    const uploadBtn = await page.$('button:has-text("העלה"), label:has-text("העלה"), button:has-text("צור")');
    console.log('File input found:', !!fileInput);
    console.log('Upload button found:', !!uploadBtn);
    
    // ===== STEP 3: UPLOAD IMAGE =====
    console.log('\n📤 STEP 3: העלאת תמונה...');
    
    // Download test image
    const testImagePath = '/tmp/test-room-visualize.jpg';
    if (!fs.existsSync(testImagePath)) {
      const https = require('https');
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(testImagePath);
        https.get('https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', (response) => {
          response.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
      });
      console.log('Test image downloaded');
    }
    
    if (fileInput) {
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(2000);
      await shot('03-image-selected');
      
      // Look for description field
      const descField = await page.$('textarea, input[placeholder*="תאר"], input[placeholder*="מה"]');
      if (descField) {
        await descField.fill('סלון מודרני עם ספה לבנה וצמחים');
        console.log('Description filled');
      }
      
      await shot('04-ready-to-generate');
      
      // Click generate button
      const genBtn = await page.$('button:has-text("צור"), button:has-text("יצירה"), button:has-text("הדמיה"), button:has-text("שלח")');
      if (genBtn) {
        console.log('Clicking generate button...');
        await genBtn.click();
        
        // Wait for generation (up to 90 seconds)
        console.log('Waiting for AI generation...');
        await shot('05-generating');
        
        let attempts = 0;
        while (attempts < 18) {
          await page.waitForTimeout(5000);
          attempts++;
          
          const spinner = await page.$('.animate-spin');
          const loadingText = await page.$('text=יוצר, text=מעבד, text=ממתין');
          
          if (!spinner && !loadingText) {
            console.log('Generation might be complete');
            break;
          }
          console.log(`Processing... (${attempts * 5}s)`);
        }
        
        await shot('06-after-generation');
      } else {
        console.log('No generate button found');
        await shot('05-no-gen-button');
      }
    } else {
      console.log('No file input, scrolling to find upload...');
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(1000);
      await shot('03-scrolled');
      
      // Try clicking on upload area
      const uploadArea = await page.$('[class*="upload"], [class*="drop"], label');
      if (uploadArea) {
        console.log('Found upload area');
      }
    }
    
    // ===== STEP 4: CHECK FOR SHOP THE LOOK OPTION =====
    console.log('\n🛒 STEP 4: בדיקת אפשרות Shop the Look...');
    
    // Look for Shop the Look button/link after visualization
    const shopLookBtn = await page.$('a:has-text("Shop"), button:has-text("Shop"), a:has-text("קנה"), button:has-text("מוצרים")');
    if (shopLookBtn) {
      console.log('Found Shop the Look option!');
      await shopLookBtn.click();
      await page.waitForTimeout(3000);
      await shot('07-shop-the-look');
    }
    
    // ===== STEP 5: GO TO DASHBOARD =====
    console.log('\n📊 STEP 5: בדיקת Dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await shot('08-dashboard');
    
    // Check for visualizations in dashboard
    const visCards = await page.$$('[class*="card"], [class*="project"], [class*="history"]');
    console.log('Cards in dashboard:', visCards.length);
    
    // ===== STEP 6: LOGOUT =====
    console.log('\n🚪 STEP 6: התנתקות...');
    const logoutBtn = await page.$('button:has-text("התנתקות"), a:has-text("התנתקות")');
    if (logoutBtn) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
    } else {
      await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    }
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await shot('09-logged-out');
    
    // ===== STEP 7: LOGIN AGAIN =====
    console.log('\n🔐 STEP 7: התחברות מחדש...');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("התחברות")');
    await page.waitForTimeout(4000);
    await shot('10-relogin');
    
    // ===== STEP 8: CHECK PERSISTENCE =====
    console.log('\n🔍 STEP 8: בדיקת שמירה...');
    
    // Check dashboard
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await shot('11-dashboard-after-relogin');
    
    const cardsAfter = await page.$$('[class*="card"], [class*="project"]');
    console.log('Cards after relogin:', cardsAfter.length);
    
    // Check visualize page
    await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await shot('12-visualize-after-relogin');
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log('Screenshots:', num);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await shot('error');
  } finally {
    await browser.close();
  }
}

visualizeFlowTest();
