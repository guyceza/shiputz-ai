const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = '/home/ubuntu/clawd/projects/shiputz-ai/test-screenshots';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function screenshot(page, name) {
  const filepath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`📸 Screenshot: ${name}.png`);
  return filepath;
}

async function testShopTheLook() {
  // Create screenshots directory
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  console.log('🚀 Starting Shop the Look test...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const results = {
    passed: [],
    failed: []
  };

  try {
    // 1. Go to homepage
    console.log('1️⃣ Testing Homepage...');
    await page.goto('https://shipazti.com', { waitUntil: 'networkidle2', timeout: 30000 });
    await screenshot(page, '01-homepage');
    results.passed.push('Homepage loads');

    // 2. Go to login page
    console.log('2️⃣ Testing Login...');
    await page.goto('https://shipazti.com/login', { waitUntil: 'networkidle2' });
    await screenshot(page, '02-login-page');
    
    // Login with test account
    await page.type('input[type="email"]', 'test@shipazti.com');
    await page.type('input[type="password"]', 'test123456');
    await screenshot(page, '03-login-filled');
    
    // Click login button
    const loginBtn = await page.$('button[type="submit"]');
    if (loginBtn) {
      await loginBtn.click();
      await sleep(3000);
      await screenshot(page, '04-after-login');
      
      // Check if logged in (look for dashboard or user menu)
      const url = page.url();
      if (url.includes('dashboard') || url.includes('project')) {
        results.passed.push('Login works');
      } else {
        results.failed.push('Login - may have failed, URL: ' + url);
      }
    }

    // 3. Go to Shop the Look page directly
    console.log('3️⃣ Testing Shop the Look page...');
    await page.goto('https://shipazti.com/shop-look', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await screenshot(page, '05-shop-look-page');
    
    // Check if page loaded
    const pageContent = await page.content();
    if (pageContent.includes('Shop the Look') || pageContent.includes('קנה את הסגנון')) {
      results.passed.push('Shop the Look page loads');
    } else {
      results.failed.push('Shop the Look page content missing');
    }

    // 4. Check for product hotspots on the demo image
    console.log('4️⃣ Checking product hotspots...');
    const hotspots = await page.$$('[class*="cursor-pointer"]');
    console.log(`   Found ${hotspots.length} clickable elements`);
    
    if (hotspots.length > 0) {
      results.passed.push(`Found ${hotspots.length} interactive elements`);
    }

    // 5. Try clicking on a product hotspot
    console.log('5️⃣ Testing product click...');
    const productAreas = await page.$$('div[style*="position: absolute"]');
    console.log(`   Found ${productAreas.length} positioned elements (potential hotspots)`);
    
    if (productAreas.length > 0) {
      try {
        await productAreas[0].click();
        await sleep(1000);
        await screenshot(page, '06-after-hotspot-click');
        results.passed.push('Hotspot clickable');
      } catch (e) {
        results.failed.push('Hotspot click failed: ' + e.message);
      }
    }

    // 6. Check for Google Shopping link
    console.log('6️⃣ Checking shopping links...');
    const shoppingLinks = await page.$$('a[href*="google.com/search"]');
    console.log(`   Found ${shoppingLinks.length} Google Shopping links`);
    
    if (shoppingLinks.length > 0) {
      results.passed.push('Google Shopping links present');
      
      // Get link URL
      const href = await shoppingLinks[0].evaluate(el => el.href);
      console.log(`   Link: ${href.substring(0, 100)}...`);
    } else {
      // Check for search buttons instead
      const searchBtns = await page.$$('button');
      let foundSearchBtn = false;
      for (const btn of searchBtns) {
        const text = await btn.evaluate(el => el.textContent);
        if (text && (text.includes('חפש') || text.includes('google') || text.includes('שופינג'))) {
          foundSearchBtn = true;
          console.log(`   Found search button: "${text}"`);
          break;
        }
      }
      if (!foundSearchBtn) {
        results.failed.push('No shopping links or search buttons found');
      }
    }

    // 7. Test with the visualize page (where Shop the Look is accessed from)
    console.log('7️⃣ Testing Visualize page...');
    await page.goto('https://shipazti.com/visualize', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await screenshot(page, '07-visualize-page');

    // Look for Shop the Look button on visualize page
    const shopBtns = await page.$$('button');
    let foundShopBtn = false;
    for (const btn of shopBtns) {
      const text = await btn.evaluate(el => el.textContent);
      if (text && (text.includes('קנה') || text.includes('Shop') || text.includes('Look'))) {
        foundShopBtn = true;
        console.log(`   Found Shop button: "${text}"`);
        await btn.click();
        await sleep(2000);
        await screenshot(page, '08-after-shop-btn-click');
        break;
      }
    }

    // 8. Test project page with history
    console.log('8️⃣ Testing Project page history...');
    await page.goto('https://shipazti.com/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await screenshot(page, '09-dashboard');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    results.failed.push('Test error: ' + error.message);
    await screenshot(page, 'error-state');
  }

  await browser.close();

  // Print results
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(50));
  
  console.log('\n✅ PASSED:');
  results.passed.forEach(r => console.log(`   • ${r}`));
  
  if (results.failed.length > 0) {
    console.log('\n❌ FAILED:');
    results.failed.forEach(r => console.log(`   • ${r}`));
  }
  
  console.log('\n📁 Screenshots saved to:', SCREENSHOTS_DIR);
  
  return results;
}

testShopTheLook().catch(console.error);
