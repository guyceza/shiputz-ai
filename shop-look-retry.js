const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/shop-look-retry';
const BASE_URL = 'https://shipazti.com';
const TEST_EMAIL = 'test-ollie@shipazti.com';
const TEST_PASSWORD = 'Test123456!';

async function test() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.readdirSync(SCREENSHOT_DIR).forEach(f => fs.unlinkSync(path.join(SCREENSHOT_DIR, f)));
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  let num = 0;
  const shot = async (name) => {
    num++;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${String(num).padStart(2,'0')}-${name}.png`) });
    console.log(`📸 ${num}-${name}`);
  };

  try {
    // LOGIN
    console.log('\n🔐 התחברות...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.locator('button:has-text("התחברות")').click();
    await page.waitForTimeout(4000);
    
    // GO TO VISUALIZE
    console.log('\n🎨 מעבר להדמיות...');
    await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Close overlays
    try {
      await page.locator('button:has-text("מאשר")').click({ timeout: 2000 });
    } catch {}
    
    // Scroll to bottom
    console.log('\n📜 גולל למטה...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Click "צור הדמיה חדשה" - try with locator
    console.log('\n📤 פותח מודל...');
    await page.locator('button:has-text("צור הדמיה חדשה")').click();
    await page.waitForTimeout(2000);
    await shot('modal');
    
    // Check for file input
    const hasInput = await page.locator('input[type="file"]').count();
    console.log('File inputs:', hasInput);
    
    if (hasInput === 0) {
      console.log('❌ No file input');
      await browser.close();
      return;
    }
    
    // Upload image
    console.log('\n📤 מעלה תמונה...');
    const imgPath = '/tmp/test-retry.jpg';
    if (!fs.existsSync(imgPath)) {
      const https = require('https');
      await new Promise((res, rej) => {
        const f = fs.createWriteStream(imgPath);
        https.get('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', r => {
          r.pipe(f);
          f.on('finish', () => { f.close(); res(); });
        }).on('error', rej);
      });
    }
    
    await page.locator('input[type="file"]').setInputFiles(imgPath);
    console.log('✅ תמונה הועלתה');
    await page.waitForTimeout(2000);
    
    // Fill description
    await page.locator('textarea').fill('סלון מודרני עם ספה ירוקה וצמחים');
    await shot('ready');
    
    // CLICK GENERATE - Try multiple methods
    console.log('\n🚀 לוחץ על צור הדמיה...');
    
    // Method 1: Try locator with force
    try {
      console.log('Method 1: locator with force...');
      await page.locator('button:has-text("צור הדמיה")').filter({ hasNotText: 'חדשה' }).click({ force: true, timeout: 5000 });
      console.log('✅ Method 1 worked');
    } catch (e) {
      console.log('Method 1 failed:', e.message.slice(0, 40));
      
      // Method 2: dispatchEvent
      try {
        console.log('Method 2: dispatchEvent...');
        const clicked = await page.evaluate(() => {
          const btns = document.querySelectorAll('button');
          for (const btn of btns) {
            if (btn.textContent?.includes('צור הדמיה') && !btn.textContent?.includes('חדשה') && !btn.disabled) {
              // Dispatch proper React events
              const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window });
              const mouseUp = new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window });
              const click = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
              btn.dispatchEvent(mouseDown);
              btn.dispatchEvent(mouseUp);
              btn.dispatchEvent(click);
              return true;
            }
          }
          return false;
        });
        console.log('Method 2 result:', clicked);
      } catch (e2) {
        console.log('Method 2 failed:', e2.message.slice(0, 40));
      }
    }
    
    await page.waitForTimeout(3000);
    await shot('generating');
    
    // Check if generation started
    const isGenerating = await page.evaluate(() => {
      return document.body.innerText.includes('יוצר') || 
             document.body.innerText.includes('שניות') ||
             document.querySelector('.animate-spin') !== null;
    });
    console.log('Generation started:', isGenerating);
    
    if (!isGenerating) {
      console.log('⚠️ Generation may not have started, taking more screenshots...');
      await page.waitForTimeout(5000);
      await shot('check1');
    }
    
    // Wait for result
    console.log('\nממתין לתוצאה...');
    let found = false;
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(5000);
      
      const result = await page.evaluate(() => {
        // Look for Supabase image
        const imgs = document.querySelectorAll('img');
        for (const img of imgs) {
          if (img.src?.includes('supabase') && img.src?.includes('storage') && img.alt?.includes('אחרי')) {
            return 'supabase';
          }
        }
        // Look for costs
        if (document.body.innerText.includes('עלות משוערת')) {
          return 'costs';
        }
        // Look for slider
        if (document.querySelector('[class*="slider"]')) {
          return 'slider';
        }
        return null;
      });
      
      if (result) {
        console.log(`✅ נמצא: ${result}`);
        found = true;
        break;
      }
      console.log(`${(i+1)*5}s...`);
    }
    
    await shot('result');
    
    if (!found) {
      console.log('⏰ Timeout');
      await browser.close();
      return;
    }
    
    // SHOP THE LOOK
    console.log('\n🛒 Shop the Look...');
    await page.evaluate(() => {
      const btn = document.querySelector('button[class*="קנה"], button:contains("קנה")');
      if (btn) btn.click();
      else {
        const img = document.querySelector('img[alt*="אחרי"]');
        if (img) img.click();
      }
    });
    
    await page.waitForTimeout(5000);
    await shot('shop');
    
    // Wait for products
    let products = 0;
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(3000);
      products = await page.evaluate(() => document.querySelectorAll('circle, [class*="marker"]').length);
      if (products > 0) break;
    }
    console.log(`פריטים: ${products}`);
    await shot('products');
    
    // RELOGIN TEST
    console.log('\n🔄 בדיקת שמירה...');
    await page.keyboard.press('Escape');
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.locator('button:has-text("התחברות")').click();
    await page.waitForTimeout(4000);
    
    await page.goto(`${BASE_URL}/visualize`);
    await page.waitForTimeout(3000);
    await shot('relogin');
    
    const saved = await page.evaluate(() => document.querySelectorAll('circle, [class*="marker"]').length);
    
    console.log('\n' + '='.repeat(40));
    console.log(`📊 לפני: ${products} | אחרי: ${saved}`);
    console.log('='.repeat(40));
    
  } catch (err) {
    console.error('❌', err.message);
    await shot('error');
  } finally {
    await browser.close();
  }
}

test();
