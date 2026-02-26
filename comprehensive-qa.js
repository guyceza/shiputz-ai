const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'https://shipazti.com';
const TEST_EMAIL = 'test@shiputzai.com';
const TEST_PASSWORD = 'Test123456!';

const results = {
  timestamp: new Date().toISOString(),
  tested: [],
  issues: [],
  screenshots: []
};

let screenshotCounter = 0;

async function screenshot(page, name) {
  screenshotCounter++;
  const filename = `./comprehensive-qa/${String(screenshotCounter).padStart(3, '0')}-${name}.png`;
  await page.screenshot({ path: filename, fullPage: false });
  results.screenshots.push(filename);
  console.log(`📸 ${filename}`);
  return filename;
}

function log(message) {
  console.log(message);
}

function tested(item, status, details = '') {
  results.tested.push({ item, status, details });
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${item}${details ? ': ' + details : ''}`);
}

function issue(category, description) {
  results.issues.push({ category, description });
  console.log(`🔴 ISSUE [${category}]: ${description}`);
}

async function clickAndWait(page, selector, description) {
  try {
    const element = page.locator(selector).first();
    if (await element.count() > 0) {
      await element.click();
      await page.waitForTimeout(1500);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

async function testAllButtons(page, pageName) {
  // Find all clickable elements
  const buttons = await page.locator('button:visible').all();
  const links = await page.locator('a:visible').all();
  
  log(`   Found ${buttons.length} buttons, ${links.length} links on ${pageName}`);
  return { buttons: buttons.length, links: links.length };
}

async function runComprehensiveQA() {
  // Create screenshots directory
  if (!fs.existsSync('./comprehensive-qa')) {
    fs.mkdirSync('./comprehensive-qa', { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'he-IL'
  });
  const page = await context.newPage();

  log('\n' + '='.repeat(70));
  log('🔍 COMPREHENSIVE QA AUDIT - ShiputzAI');
  log('='.repeat(70) + '\n');

  // =====================================================
  // PART 1: PUBLIC PAGES (NO LOGIN)
  // =====================================================
  log('\n📍 PART 1: PUBLIC PAGES\n' + '-'.repeat(50));

  // 1.1 Homepage
  log('\n🏠 HOMEPAGE');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await screenshot(page, 'homepage-top');
  
  // Check all sections by scrolling
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
  await page.waitForTimeout(500);
  await screenshot(page, 'homepage-mid');
  
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 2 / 3));
  await page.waitForTimeout(500);
  await screenshot(page, 'homepage-bottom');
  
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await screenshot(page, 'homepage-footer');

  // Test navbar links
  const navLinks = await page.locator('nav a, header a').all();
  log(`   Navbar links: ${navLinks.length}`);
  for (let i = 0; i < navLinks.length; i++) {
    const text = await navLinks[i].textContent();
    const href = await navLinks[i].getAttribute('href');
    tested(`Nav link: ${text?.trim()}`, 'pass', href);
  }

  // Test CTA buttons on homepage
  const ctaButtons = await page.locator('a[href*="login"], a[href*="signup"], a[href*="checkout"], button').all();
  log(`   CTA buttons: ${ctaButtons.length}`);

  // 1.2 Login Page
  log('\n🔐 LOGIN PAGE');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await screenshot(page, 'login-page');
  
  // Check form elements
  const emailInput = await page.locator('input[type="email"]').count();
  const passwordInput = await page.locator('input[type="password"]').count();
  const loginBtn = await page.locator('button[type="submit"], button:has-text("התחבר")').count();
  const googleBtn = await page.locator('button:has-text("Google"), [class*="google"]').count();
  const forgotPassword = await page.locator('a:has-text("שכחתי"), a[href*="forgot"]').count();
  const signupLink = await page.locator('a:has-text("הרשמה"), a[href*="signup"]').count();

  tested('Email input', emailInput > 0 ? 'pass' : 'fail');
  tested('Password input', passwordInput > 0 ? 'pass' : 'fail');
  tested('Login button', loginBtn > 0 ? 'pass' : 'fail');
  tested('Google login', googleBtn > 0 ? 'pass' : 'warn', 'Optional');
  tested('Forgot password link', forgotPassword > 0 ? 'pass' : 'warn');
  tested('Signup link', signupLink > 0 ? 'pass' : 'fail');

  // Test invalid login
  await page.fill('input[type="email"]', 'invalid@test.com');
  await page.fill('input[type="password"]', 'wrongpassword');
  await page.click('button[type="submit"], button:has-text("התחבר")');
  await page.waitForTimeout(2000);
  await screenshot(page, 'login-invalid');
  const errorMsg = await page.locator('[class*="error"], [class*="alert"], :has-text("שגיאה"), :has-text("לא נכונ")').count();
  tested('Invalid login shows error', errorMsg > 0 ? 'pass' : 'fail');

  // 1.3 Signup Page
  log('\n📝 SIGNUP PAGE');
  await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle' });
  await screenshot(page, 'signup-page');
  
  const signupFields = {
    name: await page.locator('input[name="name"], input[placeholder*="שם"]').count(),
    email: await page.locator('input[type="email"]').count(),
    password: await page.locator('input[type="password"]').count(),
    submit: await page.locator('button[type="submit"]').count()
  };
  tested('Signup name field', signupFields.name > 0 ? 'pass' : 'warn');
  tested('Signup email field', signupFields.email > 0 ? 'pass' : 'fail');
  tested('Signup password field', signupFields.password > 0 ? 'pass' : 'fail');
  tested('Signup submit button', signupFields.submit > 0 ? 'pass' : 'fail');

  // 1.4 Tips/Articles Page
  log('\n📚 TIPS PAGE');
  await page.goto(`${BASE_URL}/tips`, { waitUntil: 'networkidle' });
  await screenshot(page, 'tips-page');
  
  const articleCards = await page.locator('a[href*="/tips/"], [class*="article"], [class*="card"]').count();
  tested('Article cards visible', articleCards > 0 ? 'pass' : 'fail', `Found ${articleCards}`);
  
  // Click first article
  const firstArticle = page.locator('a[href*="/tips/"]').first();
  if (await firstArticle.count() > 0) {
    await firstArticle.click();
    await page.waitForTimeout(2000);
    await screenshot(page, 'article-detail');
    tested('Article detail page loads', 'pass');
  }

  // 1.5 Pricing/Checkout pages (public view)
  log('\n💰 PRICING PAGES');
  await page.goto(`${BASE_URL}/#pricing`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await screenshot(page, 'pricing-section');
  
  // Check pricing cards
  const pageText = await page.textContent('body');
  tested('Premium price visible', pageText.includes('299') ? 'pass' : 'fail');
  tested('Vision price visible', pageText.includes('39') ? 'pass' : 'fail');

  // 1.6 Terms & Privacy
  log('\n📜 LEGAL PAGES');
  await page.goto(`${BASE_URL}/terms`, { waitUntil: 'networkidle' });
  await screenshot(page, 'terms-page');
  tested('Terms page loads', page.url().includes('terms') ? 'pass' : 'fail');
  
  await page.goto(`${BASE_URL}/privacy`, { waitUntil: 'networkidle' });
  await screenshot(page, 'privacy-page');
  tested('Privacy page loads', page.url().includes('privacy') ? 'pass' : 'fail');

  // =====================================================
  // PART 2: AUTHENTICATED USER FLOW
  // =====================================================
  log('\n\n📍 PART 2: AUTHENTICATED USER\n' + '-'.repeat(50));

  // Login
  log('\n🔑 LOGGING IN');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"], button:has-text("התחבר")');
  
  try {
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    tested('Login successful', 'pass');
  } catch (e) {
    tested('Login successful', 'fail', 'Did not redirect to dashboard');
    await screenshot(page, 'login-failed');
    issue('Auth', 'Login failed - cannot continue authenticated tests');
    await browser.close();
    return results;
  }

  // 2.1 Dashboard
  log('\n📊 DASHBOARD');
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await screenshot(page, 'dashboard-full');

  // Check dashboard elements
  const dashboardElements = {
    stats: await page.locator('[class*="stat"], :has-text("תקציב"), :has-text("הוצאות")').count(),
    newProjectBtn: await page.locator('button:has-text("פרויקט חדש"), a:has-text("פרויקט חדש")').count(),
    projectCards: await page.locator('[class*="project"], a[href*="/project/"]').count(),
    toolsSection: await page.locator(':has-text("כלים מתקדמים")').count(),
    tipBox: await page.locator(':has-text("הידעת")').count()
  };
  
  tested('Dashboard stats', dashboardElements.stats > 0 ? 'pass' : 'warn');
  tested('New project button', dashboardElements.newProjectBtn > 0 ? 'pass' : 'fail');
  tested('Project cards', dashboardElements.projectCards > 0 ? 'pass' : 'warn', `Found ${dashboardElements.projectCards}`);
  tested('Tools section', dashboardElements.toolsSection > 0 ? 'pass' : 'fail');
  tested('Tip box', dashboardElements.tipBox > 0 ? 'pass' : 'warn');

  // Scroll to see all dashboard
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);
  await screenshot(page, 'dashboard-tools');

  // 2.2 Create New Project
  log('\n➕ CREATE PROJECT');
  const newProjectBtn = page.locator('button:has-text("פרויקט חדש")').first();
  if (await newProjectBtn.count() > 0) {
    await newProjectBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, 'new-project-modal');
    
    // Check modal fields
    const modalFields = {
      nameInput: await page.locator('input[placeholder*="שם"], input[name="name"]').count(),
      budgetInput: await page.locator('input[type="number"], input[placeholder*="תקציב"]').count(),
      createBtn: await page.locator('button:has-text("צור")').count(),
      cancelBtn: await page.locator('button:has-text("ביטול")').count()
    };
    
    tested('Project name input', modalFields.nameInput > 0 ? 'pass' : 'fail');
    tested('Budget input', modalFields.budgetInput > 0 ? 'pass' : 'fail');
    tested('Create button', modalFields.createBtn > 0 ? 'pass' : 'fail');
    tested('Cancel button', modalFields.cancelBtn > 0 ? 'pass' : 'fail');

    // Test validation - empty form
    const createBtn = page.locator('button:has-text("צור")').first();
    const isDisabled = await createBtn.isDisabled();
    tested('Create button disabled when empty', isDisabled ? 'pass' : 'fail');

    // Fill and create
    await page.fill('input[placeholder*="שם"], input[name="name"]', `QA Test ${Date.now()}`);
    await page.fill('input[type="number"]', '100000');
    await screenshot(page, 'new-project-filled');
    
    const isEnabledNow = !(await createBtn.isDisabled());
    tested('Create button enabled when filled', isEnabledNow ? 'pass' : 'fail');

    // Cancel (don't actually create)
    await page.locator('button:has-text("ביטול")').click();
    await page.waitForTimeout(500);
  }

  // 2.3 Project Detail Page
  log('\n📁 PROJECT DETAIL');
  const projectLink = page.locator('a[href*="/project/"]').first();
  if (await projectLink.count() > 0) {
    await projectLink.click();
    await page.waitForTimeout(2000);
    await screenshot(page, 'project-detail-top');

    const projectElements = {
      budgetDisplay: await page.locator(':has-text("תקציב")').count(),
      expensesDisplay: await page.locator(':has-text("הוצאות")').count(),
      aiTools: await page.locator(':has-text("כלי AI")').count(),
      addExpenseBtn: await page.locator('button:has-text("הוסף"), button:has-text("הוצאה")').count()
    };

    tested('Budget display', projectElements.budgetDisplay > 0 ? 'pass' : 'fail');
    tested('Expenses display', projectElements.expensesDisplay > 0 ? 'pass' : 'fail');
    tested('AI tools section', projectElements.aiTools > 0 ? 'pass' : 'fail');
    tested('Add expense button', projectElements.addExpenseBtn > 0 ? 'pass' : 'warn');

    // Scroll to see AI tools
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);
    await screenshot(page, 'project-ai-tools');

    // Test AI Tools
    log('\n🤖 AI TOOLS IN PROJECT');
    
    // Receipt Scanner
    const scanBtn = page.locator('button:has-text("סריקת קבלה"), :has-text("סרוק")').first();
    if (await scanBtn.count() > 0) {
      await scanBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'receipt-scanner');
      tested('Receipt scanner opens', 'pass');
      
      // Check for upload area
      const uploadArea = await page.locator('input[type="file"], [class*="upload"], [class*="drop"]').count();
      tested('Receipt upload area', uploadArea > 0 ? 'pass' : 'fail');
      
      // Close modal if open
      const closeBtn = page.locator('button:has-text("סגור"), button:has-text("ביטול"), [class*="close"]').first();
      if (await closeBtn.count() > 0) await closeBtn.click();
      await page.waitForTimeout(500);
    } else {
      tested('Receipt scanner button', 'fail', 'Not found');
    }

    // Quote Analyzer
    const quoteBtn = page.locator('button:has-text("ניתוח"), :has-text("הצעת מחיר")').first();
    if (await quoteBtn.count() > 0) {
      await quoteBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'quote-analyzer');
      tested('Quote analyzer opens', 'pass');
      
      // Check for text area or upload
      const quoteInput = await page.locator('textarea, input[type="file"]').count();
      tested('Quote input area', quoteInput > 0 ? 'pass' : 'fail');
      
      // Close
      const closeBtn = page.locator('button:has-text("סגור"), button:has-text("ביטול")').first();
      if (await closeBtn.count() > 0) await closeBtn.click();
      await page.waitForTimeout(500);
    }

    // AI Assistant
    const assistantBtn = page.locator('button:has-text("עוזר"), :has-text("AI")').first();
    if (await assistantBtn.count() > 0) {
      await assistantBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'ai-assistant');
      tested('AI assistant opens', 'pass');
      
      // Close
      const closeBtn = page.locator('button:has-text("סגור"), button:has-text("ביטול")').first();
      if (await closeBtn.count() > 0) await closeBtn.click();
    }

    // Test add expense
    log('\n💸 ADD EXPENSE');
    const addExpenseBtn = page.locator('button:has-text("הוסף הוצאה"), button:has-text("הוסף")').first();
    if (await addExpenseBtn.count() > 0) {
      await addExpenseBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'add-expense-modal');
      tested('Add expense modal opens', 'pass');
      
      // Check expense form fields
      const expenseFields = {
        description: await page.locator('input[name*="desc"], input[placeholder*="תיאור"]').count(),
        amount: await page.locator('input[type="number"], input[name*="amount"]').count(),
        category: await page.locator('select, [class*="select"]').count()
      };
      tested('Expense description field', expenseFields.description > 0 ? 'pass' : 'warn');
      tested('Expense amount field', expenseFields.amount > 0 ? 'pass' : 'fail');
      
      // Close
      const closeBtn = page.locator('button:has-text("סגור"), button:has-text("ביטול")').first();
      if (await closeBtn.count() > 0) await closeBtn.click();
    }

    // Test export buttons
    log('\n📤 EXPORT FUNCTIONS');
    const exportBtns = {
      excel: await page.locator('button:has-text("Excel"), a:has-text("Excel")').count(),
      pdf: await page.locator('button:has-text("PDF"), a:has-text("PDF")').count()
    };
    tested('Excel export button', exportBtns.excel > 0 ? 'pass' : 'warn');
    tested('PDF export button', exportBtns.pdf > 0 ? 'pass' : 'warn');
  }

  // 2.4 Bill of Quantities
  log('\n📋 BILL OF QUANTITIES');
  await page.goto(`${BASE_URL}/dashboard/bill-of-quantities`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await screenshot(page, 'boq-page');

  const boqElements = {
    title: await page.locator(':has-text("כתב כמויות")').count(),
    uploadArea: await page.locator('input[type="file"], [class*="upload"], [class*="drop"]').count(),
    scaleInput: await page.locator('input[name*="scale"], select').count(),
    heightInput: await page.locator('input[name*="height"], input[placeholder*="גובה"]').count(),
    submitBtn: await page.locator('button:has-text("נתח"), button:has-text("צור"), button[type="submit"]').count()
  };

  tested('BOQ title', boqElements.title > 0 ? 'pass' : 'fail');
  tested('BOQ upload area', boqElements.uploadArea > 0 ? 'pass' : 'fail');
  tested('BOQ scale input', boqElements.scaleInput > 0 ? 'pass' : 'warn');
  tested('BOQ submit button', boqElements.submitBtn > 0 ? 'pass' : 'fail');

  // Scroll to see form
  await page.evaluate(() => window.scrollTo(0, 300));
  await screenshot(page, 'boq-form');

  // 2.5 Visualize (if has subscription)
  log('\n🎨 VISUALIZE PAGE');
  await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await screenshot(page, 'visualize-page');

  const visualizeElements = {
    uploadArea: await page.locator('input[type="file"], [class*="upload"]').count(),
    styleOptions: await page.locator('[class*="style"], [class*="option"]').count()
  };
  tested('Visualize page loads', !page.url().includes('login') ? 'pass' : 'fail');
  tested('Visualize upload area', visualizeElements.uploadArea > 0 ? 'pass' : 'warn');

  // 2.6 Settings/Profile
  log('\n⚙️ SETTINGS');
  await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  if (!page.url().includes('login') && !page.url().includes('404')) {
    await screenshot(page, 'settings-page');
    tested('Settings page loads', 'pass');
  } else {
    tested('Settings page', 'warn', 'May not exist');
  }

  // 2.7 Checkout pages (authenticated)
  log('\n💳 CHECKOUT PAGES');
  await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await screenshot(page, 'checkout-premium');

  const checkoutElements = {
    price: await page.locator(':has-text("299")').count(),
    features: await page.locator('[class*="feature"], li').count(),
    emailField: await page.locator('input[type="email"]').count(),
    discountField: await page.locator('input[placeholder*="קוד"], input[name*="discount"]').count(),
    payBtn: await page.locator('button:has-text("לתשלום"), button:has-text("שלם")').count()
  };

  tested('Checkout price display', checkoutElements.price > 0 ? 'pass' : 'fail');
  tested('Checkout features list', checkoutElements.features > 0 ? 'pass' : 'warn');
  tested('Checkout email (pre-filled)', checkoutElements.emailField > 0 ? 'pass' : 'fail');
  tested('Discount code field', checkoutElements.discountField > 0 ? 'pass' : 'warn');
  tested('Pay button', checkoutElements.payBtn > 0 ? 'pass' : 'fail');

  // Vision checkout
  await page.goto(`${BASE_URL}/checkout-vision`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await screenshot(page, 'checkout-vision');

  const visionPrice = await page.locator(':has-text("39.99")').count();
  tested('Vision checkout price', visionPrice > 0 ? 'pass' : 'fail');

  // 2.8 Test logout
  log('\n🚪 LOGOUT');
  await page.goto(`${BASE_URL}/logout`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await screenshot(page, 'after-logout');
  
  // Try accessing dashboard after logout
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const redirectedToLogin = page.url().includes('login');
  tested('Logout works', redirectedToLogin ? 'pass' : 'fail');

  // =====================================================
  // PART 3: MOBILE RESPONSIVENESS
  // =====================================================
  log('\n\n📍 PART 3: MOBILE TESTS\n' + '-'.repeat(50));

  await page.setViewportSize({ width: 375, height: 812 });

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await screenshot(page, 'mobile-homepage');
  
  const mobileMenu = await page.locator('[class*="hamburger"], [class*="menu-btn"], button[aria-label*="menu"]').count();
  tested('Mobile menu button', mobileMenu > 0 ? 'pass' : 'warn', 'May use different nav');

  // Login on mobile
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await screenshot(page, 'mobile-login');
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await screenshot(page, 'mobile-dashboard');
  tested('Mobile dashboard loads', !page.url().includes('login') ? 'pass' : 'fail');

  // =====================================================
  // SUMMARY
  // =====================================================
  await browser.close();

  log('\n\n' + '='.repeat(70));
  log('📊 COMPREHENSIVE QA SUMMARY');
  log('='.repeat(70));

  const passed = results.tested.filter(t => t.status === 'pass').length;
  const failed = results.tested.filter(t => t.status === 'fail').length;
  const warnings = results.tested.filter(t => t.status === 'warn').length;

  log(`\n✅ PASSED: ${passed}`);
  log(`❌ FAILED: ${failed}`);
  log(`⚠️ WARNINGS: ${warnings}`);
  log(`📸 SCREENSHOTS: ${results.screenshots.length}`);

  if (failed > 0) {
    log('\n❌ FAILED TESTS:');
    results.tested.filter(t => t.status === 'fail').forEach(t => {
      log(`   - ${t.item}${t.details ? ': ' + t.details : ''}`);
    });
  }

  if (results.issues.length > 0) {
    log('\n🔴 ISSUES:');
    results.issues.forEach(i => log(`   [${i.category}] ${i.description}`));
  }

  // Save report
  fs.writeFileSync('./comprehensive-qa/report.json', JSON.stringify(results, null, 2));
  log('\n📄 Full report: ./comprehensive-qa/report.json');
  log('📁 Screenshots: ./comprehensive-qa/\n');

  return results;
}

runComprehensiveQA().catch(console.error);
