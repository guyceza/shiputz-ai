const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/shiputz-full-test';
const BASE_URL = 'https://shipazti.com';
const TEST_EMAIL = 'test-ollie@shipazti.com';
const TEST_PASSWORD = 'Test123456!';

async function fullSiteTest() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.readdirSync(SCREENSHOT_DIR).forEach(f => fs.unlinkSync(path.join(SCREENSHOT_DIR, f)));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'he-IL'
  });
  const page = await context.newPage();
  
  const results = [];
  let screenshotCount = 0;
  
  const screenshot = async (name) => {
    screenshotCount++;
    const filename = `${String(screenshotCount).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename) });
    return filename;
  };
  
  const test = async (name, fn) => {
    try {
      await fn();
      results.push({ name, status: '✅' });
      console.log(`✅ ${name}`);
    } catch (error) {
      results.push({ name, status: '❌', error: error.message.slice(0, 100) });
      console.log(`❌ ${name}: ${error.message.slice(0, 50)}`);
      await screenshot(`error-${name.replace(/\s+/g, '-')}`);
    }
  };

  try {
    // ========== PUBLIC PAGES ==========
    console.log('\n📄 PUBLIC PAGES\n');
    
    await test('Homepage loads', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await screenshot('01-homepage');
      const title = await page.title();
      if (!title.includes('ShiputzAI')) throw new Error('Wrong title: ' + title);
    });
    
    await test('Homepage has CTA buttons', async () => {
      const signupBtn = await page.$('a:has-text("התחילו"), a:has-text("התחל")');
      if (!signupBtn) throw new Error('No signup CTA found');
    });
    
    await test('Tips page loads', async () => {
      await page.goto(`${BASE_URL}/tips`, { waitUntil: 'networkidle', timeout: 30000 });
      await screenshot('02-tips');
      const heading = await page.$('h1');
      if (!heading) throw new Error('No heading on tips page');
    });
    
    await test('Login page loads', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
      await screenshot('03-login');
      const emailInput = await page.$('input[type="email"]');
      if (!emailInput) throw new Error('No email input');
    });
    
    await test('Signup page loads', async () => {
      await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle', timeout: 30000 });
      await screenshot('04-signup');
      const nameInput = await page.$('input[placeholder*="שם"], input[name="name"]');
      if (!nameInput) throw new Error('No name input');
    });
    
    await test('Shop the Look page loads', async () => {
      await page.goto(`${BASE_URL}/shop-look`, { waitUntil: 'networkidle', timeout: 30000 });
      await screenshot('05-shop-look');
      const image = await page.$('img[alt*="סלון"], img[src*="room"]');
      if (!image) throw new Error('No room image');
    });
    
    await test('Visualize page loads', async () => {
      await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle', timeout: 30000 });
      await screenshot('06-visualize');
      const heading = await page.$('h1');
      if (!heading) throw new Error('No heading');
    });
    
    await test('Contact page loads', async () => {
      await page.goto(`${BASE_URL}/contact`, { waitUntil: 'networkidle', timeout: 30000 });
      await screenshot('07-contact');
    });
    
    await test('Privacy page loads', async () => {
      await page.goto(`${BASE_URL}/privacy`, { waitUntil: 'networkidle', timeout: 30000 });
      await screenshot('08-privacy');
    });
    
    await test('Checkout page loads', async () => {
      await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle', timeout: 30000 });
      await screenshot('09-checkout');
    });

    // ========== LOGIN FLOW ==========
    console.log('\n🔐 AUTH FLOW\n');
    
    await test('Can fill login form', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await screenshot('10-login-filled');
    });
    
    await test('Login submits', async () => {
      await page.click('button:has-text("התחברות")');
      await page.waitForTimeout(3000);
      await screenshot('11-after-login');
    });

    // ========== AUTHENTICATED PAGES ==========
    console.log('\n🔒 AUTHENTICATED PAGES\n');
    
    await test('Dashboard accessible', async () => {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
      await screenshot('12-dashboard');
      // Check if redirected to login or shows dashboard
      const url = page.url();
      console.log('   Dashboard URL:', url);
    });
    
    await test('Shop the Look with auth', async () => {
      await page.goto(`${BASE_URL}/shop-look`, { waitUntil: 'networkidle', timeout: 30000 });
      await screenshot('13-shop-look-auth');
      // Check for upload button (only visible when logged in)
      const uploadLabel = await page.$('label:has-text("העלה"), input[type="file"]');
      console.log('   Upload available:', !!uploadLabel);
    });
    
    await test('Visualize with auth', async () => {
      await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle', timeout: 30000 });
      await screenshot('14-visualize-auth');
    });

    // ========== INTERACTIVE FEATURES ==========
    console.log('\n🖱️ INTERACTIVE FEATURES\n');
    
    await test('Shop the Look - click on product marker', async () => {
      await page.goto(`${BASE_URL}/shop-look`, { waitUntil: 'networkidle', timeout: 30000 });
      // Accept cookies if present
      const cookieBtn = await page.$('button:has-text("מאשר")');
      if (cookieBtn) await cookieBtn.click();
      await page.waitForTimeout(500);
      
      // Click on product area
      await page.mouse.click(500, 600);
      await page.waitForTimeout(1000);
      await screenshot('15-shop-look-clicked');
      
      // Check for tooltip
      const tooltip = await page.$('[class*="tooltip"], [class*="absolute"][class*="bg-"]');
      console.log('   Tooltip appeared:', !!tooltip);
    });
    
    await test('Navigation menu works', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      const navLinks = await page.$$('nav a, header a');
      console.log('   Nav links found:', navLinks.length);
      if (navLinks.length < 2) throw new Error('Not enough nav links');
    });

    // ========== API ENDPOINTS ==========
    console.log('\n🔌 API ENDPOINTS\n');
    
    await test('API: detect-products responds', async () => {
      const res = await fetch(`${BASE_URL}/api/detect-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      console.log('   Status:', res.status);
      if (res.status >= 500) throw new Error('Server error');
    });
    
    await test('API: save-shop-look-image responds', async () => {
      const res = await fetch(`${BASE_URL}/api/save-shop-look-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      console.log('   Status:', res.status);
      if (res.status >= 500) throw new Error('Server error');
    });
    
    await test('API: get-shop-look-history responds', async () => {
      const res = await fetch(`${BASE_URL}/api/get-shop-look-history?userId=test`);
      console.log('   Status:', res.status);
      if (res.status >= 500) throw new Error('Server error');
    });

  } catch (error) {
    console.error('Test suite error:', error.message);
  } finally {
    await browser.close();
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.status === '✅').length;
  const failed = results.filter(r => r.status === '❌').length;
  
  console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => r.status === '❌').forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }
  
  console.log(`\n📸 ${screenshotCount} screenshots saved to ${SCREENSHOT_DIR}`);
}

fullSiteTest();
