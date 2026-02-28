const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/shop-look-keyboard';
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
    console.log(`📸 ${num}: ${name}`);
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
    
    // Close overlays
    try { await page.click('button:has-text("מאשר")', { timeout: 2000 }); } catch {}
    
    // Scroll & click bottom button
    console.log('\n📜 פותח מודל...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.click('button:has-text("צור הדמיה חדשה")');
    await page.waitForTimeout(2000);
    await shot('modal');
    
    // Upload image
    console.log('\n📤 מעלה תמונה...');
    const imgPath = '/tmp/test-kb.jpg';
    if (!fs.existsSync(imgPath)) {
      const https = require('https');
      await new Promise((res) => {
        const f = fs.createWriteStream(imgPath);
        https.get('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', r => {
          r.pipe(f);
          f.on('finish', () => { f.close(); res(); });
        });
      });
    }
    
    await page.setInputFiles('input[type="file"]', imgPath);
    console.log('✅ תמונה');
    await page.waitForTimeout(2000);
    
    // Fill description
    await page.fill('textarea', 'סלון מודרני עם ספה ירוקה');
    await shot('ready');
    
    // Try different click methods
    console.log('\n🚀 מנסה ללחוץ...');
    
    // Method 1: Focus and Enter
    console.log('Method 1: Focus + Enter');
    try {
      const btn = await page.$('button:has-text("צור הדמיה"):not(:has-text("חדשה"))');
      if (btn) {
        await btn.focus();
        await page.keyboard.press('Enter');
        console.log('Method 1 done');
      }
    } catch (e) {
      console.log('Method 1 failed:', e.message.slice(0, 30));
    }
    
    await page.waitForTimeout(2000);
    
    // Check if started
    let started = await page.evaluate(() => {
      return document.body.innerText.includes('יוצר') || 
             document.body.innerText.includes('שניות') ||
             document.body.innerText.includes('שומר');
    });
    
    if (!started) {
      console.log('Method 2: Click via coordinates');
      // Find button position and click at center
      const btnBox = await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          if (btn.textContent?.includes('צור הדמיה') && !btn.textContent?.includes('חדשה')) {
            const rect = btn.getBoundingClientRect();
            return { x: rect.x + rect.width/2, y: rect.y + rect.height/2 };
          }
        }
        return null;
      });
      
      if (btnBox) {
        await page.mouse.click(btnBox.x, btnBox.y);
        console.log('Clicked at', btnBox);
      }
    }
    
    await page.waitForTimeout(2000);
    
    started = await page.evaluate(() => {
      return document.body.innerText.includes('יוצר') || 
             document.body.innerText.includes('שניות') ||
             document.body.innerText.includes('שומר');
    });
    
    if (!started) {
      console.log('Method 3: Form submit');
      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      });
    }
    
    await page.waitForTimeout(2000);
    await shot('after-click');
    
    // Check button state
    const btnText = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent?.includes('הדמיה')) {
          return btn.textContent;
        }
      }
      return null;
    });
    console.log('Button text now:', btnText);
    
    started = await page.evaluate(() => {
      return document.body.innerText.includes('יוצר') || 
             document.body.innerText.includes('שניות') ||
             document.body.innerText.includes('שומר') ||
             document.querySelector('.animate-spin');
    });
    console.log('Generation started:', started);
    
    if (started) {
      console.log('\n✅ ההדמיה התחילה!');
      
      // Wait for result
      console.log('ממתין לתוצאה...');
      for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(5000);
        
        const hasResult = await page.evaluate(() => {
          const imgs = document.querySelectorAll('img');
          for (const img of imgs) {
            if (img.src?.includes('supabase') && img.src?.includes('storage')) {
              return true;
            }
          }
          if (document.body.innerText.includes('עלות משוערת')) return true;
          return false;
        });
        
        if (hasResult) {
          console.log('✅ נמצאה תוצאה!');
          await shot('result');
          
          // Click Shop the Look
          console.log('\n🛒 Shop the Look...');
          await page.evaluate(() => {
            const img = document.querySelector('img[alt*="אחרי"]');
            if (img) img.click();
          });
          
          await page.waitForTimeout(10000);
          await shot('shop');
          
          // Count products
          const products = await page.evaluate(() => {
            return document.querySelectorAll('circle').length;
          });
          console.log(`פריטים: ${products}`);
          
          // Relogin test
          console.log('\n🔄 בדיקת שמירה...');
          await page.keyboard.press('Escape');
          await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
          
          await page.goto(`${BASE_URL}/login`);
          await page.fill('input[type="email"]', TEST_EMAIL);
          await page.fill('input[type="password"]', TEST_PASSWORD);
          await page.click('button:has-text("התחברות")');
          await page.waitForTimeout(4000);
          
          await page.goto(`${BASE_URL}/visualize`);
          await page.waitForTimeout(3000);
          await shot('relogin');
          
          const saved = await page.evaluate(() => document.querySelectorAll('circle').length);
          console.log(`\n📊 לפני: ${products} | אחרי: ${saved}`);
          break;
        }
        console.log(`${(i+1)*5}s...`);
      }
    } else {
      console.log('❌ לא הצליח להתחיל הדמיה');
      await shot('failed');
    }
    
  } catch (err) {
    console.error('❌', err.message);
    await shot('error');
  } finally {
    await browser.close();
  }
}

test();
