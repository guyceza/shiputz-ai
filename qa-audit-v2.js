const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://shipazti.com';
const TEST_EMAIL = 'test@shiputzai.com';
const TEST_PASSWORD = 'Test123456!';

const screenshotDir = './qa-screenshots-v2';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const results = {
  timestamp: new Date().toISOString(),
  passed: [],
  failed: [],
  warnings: [],
  issues: []
};

async function screenshot(page, name) {
  const filepath = path.join(screenshotDir, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`📸 ${name}`);
  return filepath;
}

async function test(name, fn) {
  try {
    console.log(`\n🧪 ${name}`);
    await fn();
    results.passed.push(name);
    console.log(`   ✅ PASS`);
    return true;
  } catch (error) {
    results.failed.push({ name, error: error.message });
    console.log(`   ❌ FAIL: ${error.message}`);
    return false;
  }
}

async function issue(category, description, details = '') {
  results.issues.push({ category, description, details });
  console.log(`   🔴 ISSUE [${category}]: ${description}`);
}

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'he-IL'
  });
  const page = await context.newPage();

  console.log('🚀 ShiputzAI QA Audit v2\n');
  console.log('='.repeat(60));

  // ============================================
  // LOGIN
  // ============================================
  console.log('\n📍 AUTHENTICATION');
  console.log('='.repeat(60));

  const loggedIn = await test('Login with test user', async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await screenshot(page, '01-login-form');
    
    await page.click('button:has-text("התחברות")');
    
    // Wait for either success or error
    await Promise.race([
      page.waitForURL('**/dashboard**', { timeout: 10000 }),
      page.waitForSelector('text=לא נכונים', { timeout: 10000 }).then(() => {
        throw new Error('Login failed - wrong credentials');
      })
    ]);
    
    await screenshot(page, '02-after-login');
  });

  if (!loggedIn) {
    console.log('\n⚠️ Login failed - cannot test authenticated features');
    await browser.close();
    return results;
  }

  // ============================================
  // DASHBOARD
  // ============================================
  console.log('\n📍 DASHBOARD');
  console.log('='.repeat(60));

  await test('Dashboard loads', async () => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '03-dashboard');
    
    // Check essential elements
    const hasProjects = await page.locator('[class*="project"], [class*="card"]').count() > 0;
    const hasCreateBtn = await page.locator('a[href*="new"], button:has-text("פרויקט")').count() > 0;
    
    console.log(`   Projects area: ${hasProjects ? '✓' : '✗'}`);
    console.log(`   Create button: ${hasCreateBtn ? '✓' : '✗'}`);
  });

  await test('Create new project', async () => {
    // Click new project button
    const newBtn = page.locator('a[href*="new"], button:has-text("פרויקט חדש"), button:has-text("הוסף")').first();
    await newBtn.click();
    await page.waitForTimeout(2000);
    await screenshot(page, '04-new-project');
    
    // Fill form
    const nameInput = page.locator('input').first();
    await nameInput.fill(`QA Test ${Date.now()}`);
    
    // Submit
    const submitBtn = page.locator('button[type="submit"], button:has-text("צור"), button:has-text("שמור")').first();
    await submitBtn.click();
    await page.waitForTimeout(3000);
    await screenshot(page, '05-project-created');
  });

  // ============================================
  // PROJECT FEATURES
  // ============================================
  console.log('\n📍 PROJECT FEATURES');
  console.log('='.repeat(60));

  // Navigate to a project
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  const projectLink = page.locator('a[href*="/dashboard/"]').first();
  if (await projectLink.count() > 0) {
    await projectLink.click();
    await page.waitForTimeout(2000);
  }
  await screenshot(page, '06-project-page');

  await test('Project page elements', async () => {
    const pageText = await page.textContent('body');
    
    // Check for key elements
    const elements = {
      budget: pageText.includes('תקציב'),
      expenses: pageText.includes('הוצאות') || pageText.includes('expense'),
      tabs: await page.locator('[role="tab"], [class*="tab"]').count()
    };
    
    console.log(`   Budget section: ${elements.budget ? '✓' : '✗'}`);
    console.log(`   Expenses section: ${elements.expenses ? '✓' : '✗'}`);
    console.log(`   Tab count: ${elements.tabs}`);
    
    if (elements.tabs === 0) {
      issue('UI', 'No tabs found in project page');
    }
  });

  // ============================================
  // AI FEATURES
  // ============================================
  console.log('\n📍 AI FEATURES');
  console.log('='.repeat(60));

  await test('Receipt Scanner', async () => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Look for scan button
    const scanOptions = [
      'button:has-text("סרוק")',
      'button:has-text("קבלה")',
      '[class*="scan"]',
      'a[href*="scan"]'
    ];
    
    let found = false;
    for (const selector of scanOptions) {
      if (await page.locator(selector).count() > 0) {
        found = true;
        await page.locator(selector).first().click();
        await page.waitForTimeout(2000);
        await screenshot(page, '07-receipt-scanner');
        break;
      }
    }
    
    if (!found) {
      issue('Feature', 'Receipt scanner button not accessible from dashboard');
    }
  });

  await test('Quote Analyzer', async () => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    const analyzeOptions = [
      'button:has-text("הצעת מחיר")',
      'button:has-text("ניתוח")',
      '[class*="quote"]',
      '[class*="analyze"]'
    ];
    
    let found = false;
    for (const selector of analyzeOptions) {
      if (await page.locator(selector).count() > 0) {
        found = true;
        console.log(`   Found: ${selector}`);
        break;
      }
    }
    
    if (!found) {
      issue('Feature', 'Quote analyzer not accessible from dashboard');
    }
  });

  // ============================================
  // BILL OF QUANTITIES
  // ============================================
  console.log('\n📍 BILL OF QUANTITIES (Vision Feature)');
  console.log('='.repeat(60));

  await test('BOQ page access', async () => {
    await page.goto(`${BASE_URL}/dashboard/bill-of-quantities`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '08-boq-page');
    
    const pageText = await page.textContent('body');
    const url = page.url();
    
    if (url.includes('login')) {
      issue('Routing', 'BOQ page redirects to login even when authenticated');
    } else if (!pageText.includes('כתב כמויות') && !pageText.includes('תכנית')) {
      issue('Content', 'BOQ page missing expected content');
    }
  });

  await test('BOQ form elements', async () => {
    // Only test if we're on the BOQ page
    const url = page.url();
    if (!url.includes('bill-of-quantities')) {
      throw new Error('Not on BOQ page');
    }
    
    const elements = {
      upload: await page.locator('input[type="file"], [class*="upload"], [class*="dropzone"]').count(),
      scale: await page.locator('input[name*="scale"], select[name*="scale"]').count(),
      submit: await page.locator('button[type="submit"], button:has-text("נתח"), button:has-text("צור")').count()
    };
    
    console.log(`   Upload area: ${elements.upload}`);
    console.log(`   Scale input: ${elements.scale}`);
    console.log(`   Submit button: ${elements.submit}`);
    
    if (elements.upload === 0) {
      issue('UI', 'BOQ page missing file upload area');
    }
  });

  // ============================================
  // CHECKOUT PAGES
  // ============================================
  console.log('\n📍 CHECKOUT/PRICING');
  console.log('='.repeat(60));

  await test('Premium checkout page', async () => {
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '09-checkout');
    
    const pageText = await page.textContent('body');
    const hasPricing = pageText.includes('149') || pageText.includes('פרימיום');
    const hasPaymentForm = await page.locator('form, [class*="payment"], [class*="checkout"]').count() > 0;
    
    console.log(`   Pricing info: ${hasPricing ? '✓' : '✗'}`);
    console.log(`   Payment form: ${hasPaymentForm ? '✓' : '✗'}`);
  });

  await test('Vision checkout page', async () => {
    await page.goto(`${BASE_URL}/checkout-vision`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '10-checkout-vision');
    
    const pageText = await page.textContent('body');
    const hasVisionPricing = pageText.includes('39') || pageText.includes('Vision');
    
    console.log(`   Vision pricing: ${hasVisionPricing ? '✓' : '✗'}`);
  });

  // ============================================
  // CONTENT PAGES
  // ============================================
  console.log('\n📍 CONTENT PAGES');
  console.log('='.repeat(60));

  await test('Tips/Articles page', async () => {
    await page.goto(`${BASE_URL}/tips`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '11-tips-page');
    
    const pageText = await page.textContent('body');
    const hasArticles = pageText.includes('מאמר') || pageText.includes('טיפ') || pageText.includes('שיפוץ');
    const articleCards = await page.locator('[class*="card"], [class*="article"], a[href*="/tips/"]').count();
    
    console.log(`   Has article content: ${hasArticles ? '✓' : '✗'}`);
    console.log(`   Article cards: ${articleCards}`);
    
    if (articleCards === 0) {
      issue('Content', 'Tips page has no visible article cards');
    }
  });

  // ============================================
  // HOMEPAGE SECTIONS
  // ============================================
  console.log('\n📍 HOMEPAGE');
  console.log('='.repeat(60));

  await test('Homepage sections', async () => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const pageText = await page.textContent('body');
    
    const sections = {
      hero: await page.locator('section').first().isVisible(),
      pricing: pageText.includes('149') || pageText.includes('מחירים'),
      features: pageText.includes('פיצ\'רים') || pageText.includes('יכולות'),
      faq: pageText.includes('שאלות'),
      brands: await page.locator('[class*="marquee"], [class*="brand"], [class*="logo"]').count() > 0
    };
    
    console.log(`   Hero: ${sections.hero ? '✓' : '✗'}`);
    console.log(`   Pricing: ${sections.pricing ? '✓' : '✗'}`);
    console.log(`   Features: ${sections.features ? '✓' : '✗'}`);
    console.log(`   FAQ: ${sections.faq ? '✓' : '✗'}`);
    console.log(`   Brands carousel: ${sections.brands ? '✓' : '✗'}`);
    
    await screenshot(page, '12-homepage-full');
  });

  // ============================================
  // MOBILE VIEW
  // ============================================
  console.log('\n📍 MOBILE RESPONSIVENESS');
  console.log('='.repeat(60));

  await test('Mobile homepage', async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await screenshot(page, '13-mobile-home');
    
    const mobileMenu = await page.locator('[class*="hamburger"], [class*="menu-btn"], button[aria-label*="menu"]').count();
    console.log(`   Mobile menu button: ${mobileMenu > 0 ? '✓' : '✗'}`);
    
    if (mobileMenu === 0) {
      issue('Mobile', 'No mobile menu hamburger found');
    }
  });

  await test('Mobile dashboard', async () => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '14-mobile-dashboard');
    
    // Check if content is readable
    const mainContent = page.locator('main, [class*="content"]').first();
    const box = await mainContent.boundingBox();
    if (box && box.width > 375) {
      issue('Mobile', 'Content overflows mobile viewport');
    }
  });

  // Reset viewport
  await page.setViewportSize({ width: 1440, height: 900 });

  // ============================================
  // SUMMARY
  // ============================================
  await browser.close();

  console.log('\n\n' + '='.repeat(60));
  console.log('📊 QA AUDIT SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n✅ PASSED: ${results.passed.length}`);
  results.passed.forEach(t => console.log(`   - ${t}`));
  
  console.log(`\n❌ FAILED: ${results.failed.length}`);
  results.failed.forEach(t => console.log(`   - ${t.name}: ${t.error}`));
  
  console.log(`\n🔴 ISSUES FOUND: ${results.issues.length}`);
  results.issues.forEach(i => console.log(`   [${i.category}] ${i.description}${i.details ? ': ' + i.details : ''}`));

  fs.writeFileSync('./qa-report-v2.json', JSON.stringify(results, null, 2));
  console.log('\n📁 Screenshots: ./qa-screenshots-v2/');
  console.log('📄 Report: ./qa-report-v2.json\n');

  return results;
}

runAudit().catch(console.error);
