const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/shiputz-screenshots';
const BASE_URL = 'https://shipazti.com';

// Sample image for testing
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800';

async function downloadImage(url, filepath) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function test() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  // Clean old screenshots
  fs.readdirSync(SCREENSHOT_DIR).forEach(f => fs.unlinkSync(path.join(SCREENSHOT_DIR, f)));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'he-IL'
  });
  const page = await context.newPage();
  
  let screenshotCount = 0;
  const screenshot = async (name) => {
    screenshotCount++;
    const filename = `${String(screenshotCount).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: false });
    console.log(`📸 ${filename}`);
    return path.join(SCREENSHOT_DIR, filename);
  };

  try {
    // 1. Go to Shop the Look page
    console.log('🛒 Opening Shop the Look page...');
    await page.goto(`${BASE_URL}/shop-look`, { waitUntil: 'networkidle', timeout: 30000 });
    await screenshot('shop-look-page');
    
    // Check what's on the page
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Check for elements
    const elements = await page.$$eval('h1, h2, h3, button, input, label', els => 
      els.map(e => ({ tag: e.tagName, type: e.type || '', text: e.textContent?.trim().slice(0, 60), placeholder: e.placeholder || '' }))
    );
    console.log('Page elements:');
    elements.forEach(e => console.log(`  [${e.tag}${e.type ? ':' + e.type : ''}] ${e.text || e.placeholder}`));
    
    // 2. Look for image upload functionality
    console.log('\n📤 Looking for upload functionality...');
    const fileInput = await page.$('input[type="file"]');
    const dropzone = await page.$('[class*="dropzone"], [class*="upload"], [class*="drop"]');
    
    if (fileInput) {
      console.log('✅ Found file input');
      
      // Download a test image
      const testImagePath = '/tmp/test-room.jpg';
      console.log('📥 Downloading test image...');
      await downloadImage(TEST_IMAGE_URL, testImagePath);
      
      // Upload the image
      console.log('📤 Uploading test image...');
      await fileInput.setInputFiles(testImagePath);
      
      // Wait for processing
      await page.waitForTimeout(3000);
      await screenshot('after-upload');
      
      // Check for results
      const results = await page.$('[class*="result"], [class*="product"], [class*="item"]');
      if (results) {
        console.log('✅ Results appeared');
        await page.waitForTimeout(2000);
        await screenshot('results');
      }
    } else if (dropzone) {
      console.log('✅ Found dropzone');
      await screenshot('dropzone');
    } else {
      console.log('⚠️ No upload functionality found');
    }
    
    // 3. Check full page scroll
    console.log('\n📜 Checking full page...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await screenshot('page-bottom');
    
    // 4. Check for any error messages
    const errors = await page.$$eval('[class*="error"], [class*="alert"], .text-red', els => 
      els.map(e => e.textContent?.trim()).filter(Boolean)
    );
    if (errors.length > 0) {
      console.log('⚠️ Errors found:', errors);
    }
    
    // 5. List all clickable items
    const buttons = await page.$$eval('button:not(:disabled)', els => 
      els.map(e => e.textContent?.trim()).filter(Boolean)
    );
    console.log('\nAvailable buttons:', buttons.join(', '));

    console.log(`\n✅ Done! ${screenshotCount} screenshots in ${SCREENSHOT_DIR}`);
    console.log('Files:', fs.readdirSync(SCREENSHOT_DIR).join(', '));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await screenshot('error');
  } finally {
    await browser.close();
  }
}

test();
