const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/visualize-test-js';
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
    
    await shot('01-visualize');
    
    // Download test image
    const testImagePath = '/tmp/test-room-js.jpg';
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
    
    // Debug - list all inputs on page via JS
    console.log('\n🔍 מחפש inputs...');
    const inputs = await page.evaluate(() => {
      const allInputs = document.querySelectorAll('input');
      return Array.from(allInputs).map(i => ({
        type: i.type,
        accept: i.accept,
        hidden: i.hidden || i.style.display === 'none' || i.className.includes('hidden'),
        id: i.id,
        className: i.className?.slice(0, 50)
      }));
    });
    console.log('Inputs found:', inputs);
    
    // Try to use page.setInputFiles with a locator
    console.log('\n📤 מנסה להעלות תמונה...');
    
    // Method 1: Use locator
    try {
      await page.setInputFiles('input[type="file"]', testImagePath);
      console.log('✅ Method 1 worked!');
      await page.waitForTimeout(2000);
      await shot('02-uploaded');
    } catch (e) {
      console.log('Method 1 failed:', e.message.slice(0, 50));
      
      // Method 2: Click on label then use file chooser
      try {
        console.log('Trying method 2...');
        const [fileChooser] = await Promise.all([
          page.waitForEvent('filechooser', { timeout: 5000 }),
          page.click('label:has-text("לחץ"), label:has-text("גרור"), [class*="upload"], [class*="drop"]')
        ]);
        await fileChooser.setFiles(testImagePath);
        console.log('✅ Method 2 worked!');
        await page.waitForTimeout(2000);
        await shot('02-uploaded');
      } catch (e2) {
        console.log('Method 2 failed:', e2.message.slice(0, 50));
        
        // Method 3: Direct DOM manipulation
        try {
          console.log('Trying method 3 (DOM manipulation)...');
          
          // Read image as base64
          const imageBuffer = fs.readFileSync(testImagePath);
          const base64 = imageBuffer.toString('base64');
          
          // Trigger file upload via JavaScript
          const result = await page.evaluate(async (base64Data) => {
            // Find the file input
            const input = document.querySelector('input[type="file"]');
            if (!input) return { error: 'No input found' };
            
            // Create a data transfer with the file
            const dataTransfer = new DataTransfer();
            const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(r => r.blob());
            const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
            
            // Trigger change event
            input.dispatchEvent(new Event('change', { bubbles: true }));
            
            return { success: true };
          }, base64);
          
          console.log('Method 3 result:', result);
          await page.waitForTimeout(2000);
          await shot('02-uploaded');
        } catch (e3) {
          console.log('Method 3 failed:', e3.message.slice(0, 50));
        }
      }
    }
    
    // Check if image was uploaded
    const uploadedImg = await page.$('img[src*="blob:"], img[src*="data:"]');
    console.log('Uploaded image visible:', !!uploadedImg);
    
    // Fill description and generate
    const descField = await page.$('textarea');
    if (descField) {
      await descField.fill('סלון מודרני');
    }
    
    await shot('03-before-generate');
    
    const genBtn = await page.$('button:has-text("צור הדמיה")');
    if (genBtn) {
      console.log('Found generate button, clicking...');
      await genBtn.click();
      
      // Wait for generation
      console.log('Waiting for generation (60s)...');
      await page.waitForTimeout(60000);
      await shot('04-after-generation');
    }
    
    console.log('\n📊 Done! Screenshots:', num);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await shot('error');
  } finally {
    await browser.close();
  }
}

test();
