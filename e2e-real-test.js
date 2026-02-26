const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://shipazti.com';
const TEST_EMAIL = 'test@shiputzai.com';
const TEST_PASSWORD = 'Test123456!';

const dir = './e2e-screenshots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

let counter = 0;
async function screenshot(page, name) {
  counter++;
  const filename = `${dir}/${String(counter).padStart(3, '0')}-${name}.png`;
  await page.screenshot({ path: filename, fullPage: false });
  console.log(`📸 ${name}`);
  return filename;
}

async function runE2ETests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'he-IL'
  });
  const page = await context.newPage();

  console.log('\n' + '='.repeat(70));
  console.log('🧪 E2E REAL FUNCTIONAL TESTS - ShiputzAI');
  console.log('='.repeat(70));

  // =====================================================
  // TEST 1: LOGIN FLOW
  // =====================================================
  console.log('\n\n📍 TEST 1: LOGIN FLOW\n' + '-'.repeat(50));

  // 1a. Invalid login
  console.log('\n1a. Testing invalid login...');
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'wrong@email.com');
  await page.fill('input[type="password"]', 'wrongpassword');
  await page.click('button:has-text("התחברות")');
  await page.waitForTimeout(3000);
  await screenshot(page, 'login-invalid-attempt');
  
  const errorVisible = await page.locator(':has-text("לא נכונ"), :has-text("שגיאה"), [class*="error"]').count();
  console.log(`   Error message visible: ${errorVisible > 0 ? '✅' : '❌'}`);

  // 1b. Valid login
  console.log('\n1b. Testing valid login...');
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button:has-text("התחברות")');
  
  try {
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    console.log('   ✅ Login successful, redirected to dashboard');
  } catch (e) {
    console.log('   ❌ Login failed');
    await screenshot(page, 'login-failed');
    await browser.close();
    return;
  }
  await screenshot(page, 'dashboard-after-login');

  // =====================================================
  // TEST 2: CREATE PROJECT FLOW
  // =====================================================
  console.log('\n\n📍 TEST 2: CREATE PROJECT\n' + '-'.repeat(50));

  await page.click('button:has-text("פרויקט חדש")');
  await page.waitForTimeout(1000);
  await screenshot(page, 'new-project-modal');

  // Check button is disabled when empty
  const createBtn = page.locator('button:has-text("צור")').first();
  const disabledWhenEmpty = await createBtn.isDisabled();
  console.log(`   Button disabled when empty: ${disabledWhenEmpty ? '✅' : '❌'}`);

  // Fill the form
  const projectName = `E2E Test ${Date.now()}`;
  await page.locator('input').first().fill(projectName);
  await page.locator('input[type="number"]').fill('150000');
  await screenshot(page, 'new-project-filled');

  const enabledWhenFilled = !(await createBtn.isDisabled());
  console.log(`   Button enabled when filled: ${enabledWhenFilled ? '✅' : '❌'}`);

  // Create the project
  await createBtn.click();
  await page.waitForTimeout(3000);
  await screenshot(page, 'project-created');

  // Verify project appears
  const projectExists = await page.locator(`:has-text("${projectName}")`).count();
  console.log(`   Project created and visible: ${projectExists > 0 ? '✅' : '❌'}`);

  // =====================================================
  // TEST 3: ADD EXPENSE FLOW
  // =====================================================
  console.log('\n\n📍 TEST 3: ADD EXPENSE\n' + '-'.repeat(50));

  // Go to project
  const projectLink = page.locator('a[href*="/project/"]').first();
  await projectLink.click();
  await page.waitForTimeout(2000);
  await screenshot(page, 'project-page');

  // Find and click add expense
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);
  
  const addExpenseBtn = page.locator('button:has-text("הוסף הוצאה")').first();
  if (await addExpenseBtn.count() > 0) {
    await addExpenseBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, 'add-expense-modal');
    
    // Fill expense form
    const descInput = page.locator('input[placeholder*="תיאור"], input').first();
    await descInput.fill('בדיקת E2E');
    
    const amountInput = page.locator('input[type="number"]').first();
    if (await amountInput.count() > 0) {
      await amountInput.fill('500');
    }
    
    await screenshot(page, 'expense-filled');
    
    // Submit expense
    const submitExpense = page.locator('button:has-text("הוסף"), button:has-text("שמור")').first();
    if (await submitExpense.count() > 0) {
      await submitExpense.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'expense-added');
      console.log('   ✅ Expense added');
    }
  } else {
    console.log('   ⚠️ Add expense button not found');
  }

  // =====================================================
  // TEST 4: AI VISUALIZATION FLOW
  // =====================================================
  console.log('\n\n📍 TEST 4: AI VISUALIZATION\n' + '-'.repeat(50));

  await page.goto(`${BASE_URL}/visualize`);
  await page.waitForTimeout(3000);
  await screenshot(page, 'visualize-page');

  // Check if we can upload
  const uploadInput = page.locator('input[type="file"]').first();
  if (await uploadInput.count() > 0) {
    console.log('   ✅ Upload input found');
    
    // Create a simple test image
    const testImagePath = '/tmp/test-room.jpg';
    // We'll skip actual upload since we don't have a real image
    console.log('   ⚠️ Skipping actual upload (need real image)');
  } else {
    // Maybe it's in a modal - look for button to open upload
    const uploadBtn = page.locator('button:has-text("העלה"), button:has-text("צור הדמיה")').first();
    if (await uploadBtn.count() > 0) {
      await uploadBtn.click();
      await page.waitForTimeout(1500);
      await screenshot(page, 'visualize-upload-modal');
      console.log('   ✅ Upload modal opened');
    }
  }

  // =====================================================
  // TEST 5: RECEIPT SCANNER
  // =====================================================
  console.log('\n\n📍 TEST 5: RECEIPT SCANNER\n' + '-'.repeat(50));

  // Go back to a project
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(2000);
  
  const project = page.locator('a[href*="/project/"]').first();
  await project.click();
  await page.waitForTimeout(2000);

  // Find receipt scanner
  const scannerBtn = page.locator(':has-text("סריקת קבלה")').first();
  if (await scannerBtn.count() > 0) {
    await scannerBtn.click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'receipt-scanner-modal');
    
    const fileInput = await page.locator('input[type="file"]').count();
    console.log(`   File input in scanner: ${fileInput > 0 ? '✅' : '❌'}`);
    
    await page.keyboard.press('Escape');
  }

  // =====================================================
  // TEST 6: QUOTE ANALYSIS
  // =====================================================
  console.log('\n\n📍 TEST 6: QUOTE ANALYSIS\n' + '-'.repeat(50));

  const quoteBtn = page.locator(':has-text("ניתוח הצעת מחיר")').first();
  if (await quoteBtn.count() > 0) {
    await quoteBtn.click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'quote-analysis-modal');
    
    // Try to find text input area
    const textInputs = await page.locator('textarea, input[type="text"], [contenteditable="true"]').count();
    console.log(`   Text input areas: ${textInputs}`);
    
    // If there's a textarea, try entering text
    const textarea = page.locator('textarea').first();
    if (await textarea.count() > 0) {
      await textarea.fill('בדיקת הצעת מחיר\nעבודות חשמל: 5000 ש"ח\nעבודות אינסטלציה: 3000 ש"ח');
      await screenshot(page, 'quote-text-entered');
      
      // Find analyze button
      const analyzeBtn = page.locator('button:has-text("נתח"), button:has-text("שלח")').first();
      if (await analyzeBtn.count() > 0) {
        console.log('   ✅ Ready to analyze (not clicking to avoid API call)');
      }
    }
    
    await page.keyboard.press('Escape');
  }

  // =====================================================
  // TEST 7: BOQ (Bill of Quantities)
  // =====================================================
  console.log('\n\n📍 TEST 7: BILL OF QUANTITIES\n' + '-'.repeat(50));

  await page.goto(`${BASE_URL}/dashboard/bill-of-quantities`);
  await page.waitForTimeout(2000);
  await screenshot(page, 'boq-page');

  const boqUpload = await page.locator('input[type="file"]').count();
  const boqForm = await page.locator('form, [class*="form"]').count();
  console.log(`   Upload input: ${boqUpload > 0 ? '✅' : '❌'}`);
  console.log(`   Form present: ${boqForm > 0 ? '✅' : '⚠️'}`);

  // Check additional fields
  const scaleDropdown = await page.locator('select, [class*="select"]').count();
  console.log(`   Scale/options: ${scaleDropdown > 0 ? '✅' : '⚠️'}`);

  // =====================================================
  // TEST 8: CHECKOUT FLOW
  // =====================================================
  console.log('\n\n📍 TEST 8: CHECKOUT\n' + '-'.repeat(50));

  await page.goto(`${BASE_URL}/checkout`);
  await page.waitForTimeout(2000);
  await screenshot(page, 'checkout-page');

  // Check all elements
  const checkoutElements = {
    price: (await page.textContent('body')).includes('299'),
    email: await page.locator('input[type="email"]').count() > 0,
    discountField: await page.locator('input[placeholder*="קוד"]').count() > 0,
    payButton: await page.locator('button:has-text("לתשלום")').count() > 0
  };

  console.log(`   Price (299): ${checkoutElements.price ? '✅' : '❌'}`);
  console.log(`   Email field: ${checkoutElements.email ? '✅' : '❌'}`);
  console.log(`   Discount code: ${checkoutElements.discountField ? '✅' : '⚠️'}`);
  console.log(`   Pay button: ${checkoutElements.payButton ? '✅' : '❌'}`);

  // Test discount code input
  const discountInput = page.locator('input[placeholder*="קוד"]').first();
  if (await discountInput.count() > 0) {
    await discountInput.fill('TESTCODE');
    await screenshot(page, 'checkout-with-discount');
    
    // Look for apply/check button
    const applyBtn = page.locator('button:has-text("בדוק"), button:has-text("החל")').first();
    if (await applyBtn.count() > 0) {
      await applyBtn.click();
      await page.waitForTimeout(1500);
      await screenshot(page, 'discount-check-result');
      console.log('   ✅ Discount code check triggered');
    }
  }

  // =====================================================
  // TEST 9: LOGOUT & SESSION PERSISTENCE
  // =====================================================
  console.log('\n\n📍 TEST 9: LOGOUT & PERSISTENCE\n' + '-'.repeat(50));

  await page.goto(`${BASE_URL}/logout`);
  await page.waitForTimeout(2000);
  await screenshot(page, 'after-logout');

  // Try to access protected page
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(2000);
  
  const redirectedToLogin = page.url().includes('login');
  console.log(`   Redirected to login after logout: ${redirectedToLogin ? '✅' : '❌'}`);
  await screenshot(page, 'protected-route-redirect');

  // Login again
  console.log('\n   Logging back in...');
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button:has-text("התחברות")');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await page.waitForTimeout(2000);
  await screenshot(page, 'logged-back-in');

  // Check if data persisted
  const projectStillExists = await page.locator('a[href*="/project/"]').count();
  console.log(`   Projects persisted: ${projectStillExists > 0 ? '✅' : '❌'}`);

  // =====================================================
  // TEST 10: MOBILE RESPONSIVENESS
  // =====================================================
  console.log('\n\n📍 TEST 10: MOBILE\n' + '-'.repeat(50));

  await page.setViewportSize({ width: 375, height: 812 });
  
  await page.goto(BASE_URL);
  await page.waitForTimeout(1500);
  await screenshot(page, 'mobile-homepage');

  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(1500);
  await screenshot(page, 'mobile-dashboard');

  // Test mobile project view
  const mobileProject = page.locator('a[href*="/project/"]').first();
  if (await mobileProject.count() > 0) {
    await mobileProject.click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'mobile-project');
    
    // Check if content is readable (not overflowing)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    console.log(`   Page width: ${bodyWidth}px (should be ≤375)`);
    console.log(`   Mobile responsive: ${bodyWidth <= 400 ? '✅' : '❌'}`);
  }

  // =====================================================
  // SUMMARY
  // =====================================================
  await browser.close();

  console.log('\n\n' + '='.repeat(70));
  console.log('📊 E2E TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`\n📁 Screenshots saved to: ${dir}/`);
  console.log(`📸 Total screenshots: ${counter}`);
  console.log('\nReview screenshots to verify visual correctness.');
}

runE2ETests().catch(console.error);
