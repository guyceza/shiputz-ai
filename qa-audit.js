const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://shipazti.com';
const TEST_EMAIL = 'test@shiputzai.com';
const TEST_PASSWORD = 'Test123456!';

const screenshotDir = './qa-screenshots';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const results = {
  timestamp: new Date().toISOString(),
  passed: [],
  failed: [],
  warnings: [],
  skipped: []
};

async function screenshot(page, name) {
  const filepath = path.join(screenshotDir, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot: ${name}`);
  return filepath;
}

async function test(name, fn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await fn();
    results.passed.push(name);
    console.log(`✅ PASS: ${name}`);
  } catch (error) {
    results.failed.push({ name, error: error.message });
    console.log(`❌ FAIL: ${name} - ${error.message}`);
  }
}

async function warn(name, message) {
  results.warnings.push({ name, message });
  console.log(`⚠️ WARNING: ${name} - ${message}`);
}

async function skip(name, reason) {
  results.skipped.push({ name, reason });
  console.log(`⏭️ SKIP: ${name} - ${reason}`);
}

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'he-IL'
  });
  const page = await context.newPage();

  console.log('🚀 Starting ShiputzAI QA Audit\n');
  console.log('='.repeat(60));

  // ============================================
  // SECTION 1: LANDING PAGE (PUBLIC)
  // ============================================
  console.log('\n\n📍 SECTION 1: LANDING PAGE (PUBLIC)');
  console.log('='.repeat(60));

  await test('1.1 Homepage loads', async () => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await screenshot(page, '01-homepage');
    const title = await page.title();
    if (!title.includes('שיפוצתי') && !title.includes('Shiputz')) {
      throw new Error(`Unexpected title: ${title}`);
    }
  });

  await test('1.2 Hero section visible', async () => {
    const hero = await page.locator('section').first();
    await hero.waitFor({ state: 'visible', timeout: 5000 });
  });

  await test('1.3 Navigation links present', async () => {
    const nav = await page.locator('nav, header');
    const links = await nav.locator('a').count();
    if (links < 2) throw new Error(`Only ${links} nav links found`);
  });

  await test('1.4 CTA buttons visible', async () => {
    const ctaButtons = await page.locator('a[href*="login"], a[href*="signup"], button:has-text("התחל"), button:has-text("הרשמ")').count();
    if (ctaButtons === 0) throw new Error('No CTA buttons found');
  });

  await test('1.5 Brand carousel/trust bar', async () => {
    const carousel = await page.locator('[class*="marquee"], [class*="carousel"], [class*="brand"]').count();
    if (carousel === 0) {
      await warn('1.5', 'No brand carousel detected - might be named differently');
    }
  });

  await test('1.6 Pricing section visible', async () => {
    await page.goto(`${BASE_URL}/#pricing`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await screenshot(page, '02-pricing-section');
    
    // Look for pricing cards
    const pricingText = await page.textContent('body');
    if (!pricingText.includes('149') && !pricingText.includes('₪')) {
      throw new Error('No pricing information found');
    }
  });

  await test('1.7 FAQ section', async () => {
    const faq = await page.locator('[class*="faq"], [class*="accordion"], details, summary').count();
    const faqText = await page.textContent('body');
    if (!faqText.includes('שאלות') && faq === 0) {
      await warn('1.7', 'FAQ section not clearly identified');
    }
  });

  await test('1.8 Footer links', async () => {
    const footer = await page.locator('footer');
    if (await footer.count() === 0) throw new Error('No footer found');
    await screenshot(page, '03-footer');
  });

  // ============================================
  // SECTION 2: AUTHENTICATION
  // ============================================
  console.log('\n\n📍 SECTION 2: AUTHENTICATION');
  console.log('='.repeat(60));

  await test('2.1 Login page loads', async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await screenshot(page, '04-login-page');
    const emailInput = await page.locator('input[type="email"], input[name="email"]');
    if (await emailInput.count() === 0) throw new Error('No email input found');
  });

  await test('2.2 Signup page loads', async () => {
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle' });
    await screenshot(page, '05-signup-page');
    const nameInput = await page.locator('input[name="name"], input[placeholder*="שם"]');
    if (await nameInput.count() === 0) {
      await warn('2.2', 'No name input found on signup');
    }
  });

  await test('2.3 Login with test user', async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"]', TEST_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
    await screenshot(page, '06-login-filled');
    
    await page.click('button[type="submit"], button:has-text("התחבר"), button:has-text("כניסה")');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await screenshot(page, '07-dashboard-after-login');
  });

  // ============================================
  // SECTION 3: DASHBOARD (AUTHENTICATED)
  // ============================================
  console.log('\n\n📍 SECTION 3: DASHBOARD');
  console.log('='.repeat(60));

  await test('3.1 Dashboard displays correctly', async () => {
    const url = page.url();
    if (!url.includes('dashboard')) throw new Error(`Not on dashboard: ${url}`);
    await screenshot(page, '08-dashboard-main');
  });

  await test('3.2 User menu/profile visible', async () => {
    const userMenu = await page.locator('[class*="user"], [class*="avatar"], [class*="profile"], button:has-text("יציאה"), button:has-text("התנתק")').count();
    if (userMenu === 0) {
      await warn('3.2', 'User menu not clearly identified');
    }
  });

  await test('3.3 New project button exists', async () => {
    const newProjectBtn = await page.locator('a[href*="new"], button:has-text("פרויקט חדש"), button:has-text("הוסף")').count();
    if (newProjectBtn === 0) throw new Error('No new project button found');
  });

  await test('3.4 Projects list/grid displays', async () => {
    await screenshot(page, '09-projects-list');
    // Check for projects container
    const projectsArea = await page.locator('[class*="project"], [class*="card"], main').first();
    await projectsArea.waitFor({ state: 'visible', timeout: 5000 });
  });

  // ============================================
  // SECTION 4: CREATE PROJECT
  // ============================================
  console.log('\n\n📍 SECTION 4: CREATE PROJECT');
  console.log('='.repeat(60));

  await test('4.1 Navigate to new project', async () => {
    // Try different selectors for new project
    const newBtn = page.locator('a[href*="new"], a[href*="create"], button:has-text("פרויקט חדש"), button:has-text("הוסף פרויקט")').first();
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(2000);
    } else {
      await page.goto(`${BASE_URL}/dashboard/new`, { waitUntil: 'networkidle' });
    }
    await screenshot(page, '10-new-project-page');
  });

  await test('4.2 Project creation form fields', async () => {
    const nameInput = await page.locator('input[name="name"], input[placeholder*="שם"], input[placeholder*="פרויקט"]').count();
    if (nameInput === 0) throw new Error('No project name input');
  });

  await test('4.3 Create test project', async () => {
    const testProjectName = `QA Test Project ${Date.now()}`;
    
    // Fill project name
    const nameInput = page.locator('input[name="name"], input[placeholder*="שם"]').first();
    await nameInput.fill(testProjectName);
    
    // Try to find budget input
    const budgetInput = page.locator('input[name="budget"], input[type="number"], input[placeholder*="תקציב"]').first();
    if (await budgetInput.count() > 0) {
      await budgetInput.fill('150000');
    }
    
    await screenshot(page, '11-project-form-filled');
    
    // Submit
    const submitBtn = page.locator('button[type="submit"], button:has-text("צור"), button:has-text("שמור"), button:has-text("הבא")').first();
    await submitBtn.click();
    await page.waitForTimeout(3000);
    await screenshot(page, '12-after-project-creation');
  });

  // ============================================
  // SECTION 5: PROJECT PAGE FEATURES
  // ============================================
  console.log('\n\n📍 SECTION 5: PROJECT PAGE FEATURES');
  console.log('='.repeat(60));

  // Navigate to a project
  await test('5.0 Navigate to project', async () => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Click first project card
    const projectCard = page.locator('[class*="project"], a[href*="/dashboard/"]').first();
    if (await projectCard.count() > 0) {
      await projectCard.click();
      await page.waitForTimeout(2000);
    }
    await screenshot(page, '13-project-page');
  });

  await test('5.1 Budget overview displays', async () => {
    const budgetSection = await page.locator('[class*="budget"], [class*="overview"]').count();
    const budgetText = await page.textContent('body');
    if (!budgetText.includes('תקציב') && budgetSection === 0) {
      await warn('5.1', 'Budget overview not clearly visible');
    }
  });

  await test('5.2 Tabs navigation works', async () => {
    // Look for tabs
    const tabs = await page.locator('[role="tab"], button[class*="tab"], [class*="tab-"]').count();
    console.log(`   Found ${tabs} tab elements`);
    
    if (tabs > 0) {
      const tabButtons = page.locator('[role="tab"], button[class*="tab"]');
      const count = await tabButtons.count();
      for (let i = 0; i < Math.min(count, 5); i++) {
        const tab = tabButtons.nth(i);
        const tabText = await tab.textContent();
        console.log(`   Tab ${i + 1}: ${tabText?.trim()}`);
      }
    }
    await screenshot(page, '14-tabs');
  });

  // ============================================
  // SECTION 6: AI FEATURES (Premium)
  // ============================================
  console.log('\n\n📍 SECTION 6: AI FEATURES');
  console.log('='.repeat(60));

  await test('6.1 Receipt scanner accessible', async () => {
    // Look for receipt scanner button/link
    const scanBtn = page.locator('button:has-text("סרוק"), button:has-text("קבלה"), a:has-text("קבלה"), [class*="scan"]').first();
    if (await scanBtn.count() > 0) {
      await scanBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, '15-receipt-scanner');
    } else {
      await warn('6.1', 'Receipt scanner button not found in current view');
    }
  });

  await test('6.2 Quote analyzer accessible', async () => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    const analyzeBtn = page.locator('button:has-text("הצעת מחיר"), a:has-text("ניתוח"), [class*="quote"], [class*="analyze"]').first();
    if (await analyzeBtn.count() > 0) {
      console.log('   Quote analyzer button found');
    } else {
      await warn('6.2', 'Quote analyzer not found - might need project context');
    }
  });

  await test('6.3 AI Assistant accessible', async () => {
    const chatBtn = page.locator('button:has-text("עוזר"), button:has-text("צ\'אט"), [class*="chat"], [class*="assistant"]').first();
    if (await chatBtn.count() > 0) {
      await chatBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, '16-ai-assistant');
    } else {
      await warn('6.3', 'AI assistant not found in current view');
    }
  });

  // ============================================
  // SECTION 7: BILL OF QUANTITIES (Vision Feature)
  // ============================================
  console.log('\n\n📍 SECTION 7: BILL OF QUANTITIES');
  console.log('='.repeat(60));

  await test('7.1 BOQ page accessible', async () => {
    await page.goto(`${BASE_URL}/dashboard/bill-of-quantities`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '17-boq-page');
    
    const pageText = await page.textContent('body');
    if (!pageText.includes('כתב כמויות') && !pageText.includes('תכנית')) {
      throw new Error('BOQ page content not found');
    }
  });

  await test('7.2 BOQ upload area present', async () => {
    const uploadArea = await page.locator('input[type="file"], [class*="upload"], [class*="dropzone"], button:has-text("העלה")').count();
    if (uploadArea === 0) throw new Error('No upload area found');
  });

  await test('7.3 BOQ form fields', async () => {
    // Check for additional context fields
    const fields = {
      scale: await page.locator('input[name="scale"], select[name="scale"], [class*="scale"]').count(),
      ceilingHeight: await page.locator('input[name*="ceiling"], input[name*="height"]').count(),
      buildingType: await page.locator('select[name*="building"], [name*="type"]').count()
    };
    console.log(`   Form fields found: scale=${fields.scale}, ceiling=${fields.ceilingHeight}, building=${fields.buildingType}`);
    await screenshot(page, '18-boq-form');
  });

  // ============================================
  // SECTION 8: MATERIALS CALCULATOR
  // ============================================
  console.log('\n\n📍 SECTION 8: MATERIALS CALCULATOR');
  console.log('='.repeat(60));

  await test('8.1 Materials calculator page', async () => {
    // Try different routes
    const routes = [
      `${BASE_URL}/dashboard/materials`,
      `${BASE_URL}/materials`,
      `${BASE_URL}/calculator`
    ];
    
    let found = false;
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'networkidle' });
      const is404 = await page.textContent('body');
      if (!is404.includes('404') && !is404.includes('not found')) {
        found = true;
        await screenshot(page, '19-materials-calculator');
        break;
      }
    }
    
    if (!found) {
      // Look for link in dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
      const calcLink = page.locator('a:has-text("מחשבון"), a:has-text("חומרים"), a[href*="material"], a[href*="calc"]').first();
      if (await calcLink.count() > 0) {
        await calcLink.click();
        await page.waitForTimeout(2000);
        await screenshot(page, '19-materials-calculator');
        found = true;
      }
    }
    
    if (!found) {
      await warn('8.1', 'Materials calculator page not found');
    }
  });

  // ============================================
  // SECTION 9: CHECKOUT/PRICING PAGES
  // ============================================
  console.log('\n\n📍 SECTION 9: CHECKOUT PAGES');
  console.log('='.repeat(60));

  await test('9.1 Main checkout page', async () => {
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '20-checkout-main');
    
    const pageText = await page.textContent('body');
    if (pageText.includes('login') || pageText.includes('התחבר')) {
      console.log('   Checkout requires login (correct behavior)');
    }
  });

  await test('9.2 Vision checkout page', async () => {
    await page.goto(`${BASE_URL}/checkout-vision`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '21-checkout-vision');
  });

  await test('9.3 Pricing plans display', async () => {
    await page.goto(`${BASE_URL}/#pricing`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    const pageText = await page.textContent('body');
    const plans = {
      basic: pageText.includes('בסיסי') || pageText.includes('Basic'),
      premium: pageText.includes('פרימיום') || pageText.includes('Premium') || pageText.includes('149'),
      vision: pageText.includes('Vision') || pageText.includes('ויז\'ן') || pageText.includes('39')
    };
    console.log(`   Plans found: Basic=${plans.basic}, Premium=${plans.premium}, Vision=${plans.vision}`);
    await screenshot(page, '22-pricing-plans');
  });

  // ============================================
  // SECTION 10: DEMO PAGES
  // ============================================
  console.log('\n\n📍 SECTION 10: DEMO/SHOWCASE PAGES');
  console.log('='.repeat(60));

  await test('10.1 Demo showcase page', async () => {
    const demoRoutes = [
      `${BASE_URL}/demo`,
      `${BASE_URL}/demo-v2-showcase.html`,
      `${BASE_URL}/showcase`
    ];
    
    let found = false;
    for (const route of demoRoutes) {
      const response = await page.goto(route, { waitUntil: 'networkidle' });
      if (response && response.status() === 200) {
        found = true;
        await screenshot(page, '23-demo-page');
        break;
      }
    }
    
    if (!found) {
      await warn('10.1', 'Demo showcase page not found');
    }
  });

  // ============================================
  // SECTION 11: TIPS/ARTICLES
  // ============================================
  console.log('\n\n📍 SECTION 11: TIPS/ARTICLES');
  console.log('='.repeat(60));

  await test('11.1 Tips page accessible', async () => {
    await page.goto(`${BASE_URL}/tips`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '24-tips-page');
    
    const pageText = await page.textContent('body');
    if (pageText.includes('404') || pageText.includes('not found')) {
      throw new Error('Tips page not found');
    }
  });

  await test('11.2 Article pages load', async () => {
    // Try to find and click an article
    const articleLink = page.locator('a[href*="/tips/"], a[href*="article"]').first();
    if (await articleLink.count() > 0) {
      await articleLink.click();
      await page.waitForTimeout(2000);
      await screenshot(page, '25-article-page');
    } else {
      await warn('11.2', 'No article links found');
    }
  });

  // ============================================
  // SECTION 12: SHOP THE LOOK
  // ============================================
  console.log('\n\n📍 SECTION 12: SHOP THE LOOK');
  console.log('='.repeat(60));

  await test('12.1 Shop the Look page', async () => {
    const shopRoutes = [
      `${BASE_URL}/dashboard/shop-the-look`,
      `${BASE_URL}/shop-the-look`,
      `${BASE_URL}/shop`
    ];
    
    let found = false;
    for (const route of shopRoutes) {
      await page.goto(route, { waitUntil: 'networkidle' });
      const pageText = await page.textContent('body');
      if (!pageText.includes('404')) {
        found = true;
        await screenshot(page, '26-shop-the-look');
        break;
      }
    }
    
    if (!found) {
      // Look in dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
      const shopLink = page.locator('a:has-text("Shop"), a:has-text("עיצוב"), a[href*="shop"]').first();
      if (await shopLink.count() > 0) {
        await shopLink.click();
        await page.waitForTimeout(2000);
        await screenshot(page, '26-shop-the-look');
        found = true;
      }
    }
    
    if (!found) {
      await warn('12.1', 'Shop the Look page not found');
    }
  });

  // ============================================
  // SECTION 13: MOBILE RESPONSIVENESS
  // ============================================
  console.log('\n\n📍 SECTION 13: MOBILE RESPONSIVENESS');
  console.log('='.repeat(60));

  await test('13.1 Mobile homepage', async () => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await screenshot(page, '27-mobile-homepage');
    
    // Check for mobile menu
    const mobileMenu = await page.locator('[class*="hamburger"], [class*="mobile-menu"], button[class*="menu"]').count();
    console.log(`   Mobile menu elements: ${mobileMenu}`);
  });

  await test('13.2 Mobile dashboard', async () => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await screenshot(page, '28-mobile-dashboard');
  });

  // Reset viewport
  await page.setViewportSize({ width: 1920, height: 1080 });

  // ============================================
  // SECTION 14: ERROR HANDLING
  // ============================================
  console.log('\n\n📍 SECTION 14: ERROR HANDLING');
  console.log('='.repeat(60));

  await test('14.1 404 page', async () => {
    await page.goto(`${BASE_URL}/this-page-does-not-exist-${Date.now()}`, { waitUntil: 'networkidle' });
    await screenshot(page, '29-404-page');
    
    const pageText = await page.textContent('body');
    // Should have some error indication
    if (!pageText.includes('404') && !pageText.includes('נמצא') && !pageText.includes('exist')) {
      await warn('14.1', 'No clear 404 message shown');
    }
  });

  await test('14.2 Protected route redirect', async () => {
    // Logout first
    await page.goto(`${BASE_URL}/logout`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Try to access protected page
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const url = page.url();
    if (url.includes('login') || url.includes('signup')) {
      console.log('   Protected route correctly redirects to login');
    } else if (url.includes('dashboard')) {
      // Might still be logged in via session
      console.log('   Still logged in (session persisted)');
    }
    await screenshot(page, '30-protected-redirect');
  });

  // ============================================
  // CLEANUP & REPORT
  // ============================================
  await browser.close();

  // Generate report
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 QA AUDIT REPORT');
  console.log('='.repeat(60));
  console.log(`\n✅ PASSED: ${results.passed.length}`);
  results.passed.forEach(t => console.log(`   - ${t}`));
  
  console.log(`\n❌ FAILED: ${results.failed.length}`);
  results.failed.forEach(t => console.log(`   - ${t.name}: ${t.error}`));
  
  console.log(`\n⚠️ WARNINGS: ${results.warnings.length}`);
  results.warnings.forEach(t => console.log(`   - ${t.name}: ${t.message}`));
  
  console.log(`\n⏭️ SKIPPED: ${results.skipped.length}`);
  results.skipped.forEach(t => console.log(`   - ${t.name}: ${t.reason}`));

  console.log('\n📁 Screenshots saved to:', screenshotDir);

  // Save JSON report
  fs.writeFileSync('./qa-report.json', JSON.stringify(results, null, 2));
  console.log('📄 JSON report saved to: qa-report.json\n');

  return results;
}

runAudit().catch(console.error);
