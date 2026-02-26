const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'https://shipazti.com';
const TEST_EMAIL = 'test@shiputzai.com';
const TEST_PASSWORD = 'Test123456!';

const dir = './comprehensive-qa';
let counter = 15;

async function screenshot(page, name) {
  counter++;
  const filename = `${dir}/${String(counter).padStart(3, '0')}-${name}.png`;
  await page.screenshot({ path: filename });
  console.log(`📸 ${filename}`);
}

async function runPart2() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Login
  console.log('\n🔑 Logging in...');
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button:has-text("התחברות")');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Logged in');

  // Continue from project detail
  console.log('\n📁 PROJECT DETAIL PAGE');
  const projectLink = page.locator('a[href*="/project/"]').first();
  await projectLink.click();
  await page.waitForTimeout(2000);
  await screenshot(page, 'project-page-top');

  // Scroll to AI tools
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(500);
  await screenshot(page, 'project-ai-tools');

  // Test Receipt Scanner
  console.log('\n🧾 RECEIPT SCANNER');
  const scanBtn = page.locator(':has-text("סריקת קבלה")').first();
  if (await scanBtn.count() > 0) {
    await scanBtn.click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'receipt-scanner-open');
    console.log('✅ Receipt scanner opened');
    
    // Check upload area
    const uploadExists = await page.locator('input[type="file"]').count();
    console.log(`   Upload input: ${uploadExists > 0 ? '✅' : '❌'}`);
    
    // Close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } else {
    console.log('❌ Receipt scanner button not found');
  }

  // Test Quote Analyzer
  console.log('\n📊 QUOTE ANALYZER');
  const quoteBtn = page.locator(':has-text("ניתוח הצעת מחיר")').first();
  if (await quoteBtn.count() > 0) {
    await quoteBtn.click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'quote-analyzer-open');
    console.log('✅ Quote analyzer opened');
    
    // Check textarea
    const textarea = await page.locator('textarea').count();
    console.log(`   Text area: ${textarea > 0 ? '✅' : '❌'}`);
    
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } else {
    console.log('❌ Quote analyzer button not found');
  }

  // Test AI Assistant
  console.log('\n🤖 AI ASSISTANT');
  const assistantBtn = page.locator(':has-text("עוזר AI")').first();
  if (await assistantBtn.count() > 0) {
    await assistantBtn.click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'ai-assistant-open');
    console.log('✅ AI assistant opened');
    
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } else {
    console.log('❌ AI assistant button not found');
  }

  // Test Add Expense
  console.log('\n💰 ADD EXPENSE');
  const addBtn = page.locator('button:has-text("הוסף הוצאה")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'add-expense-modal');
    console.log('✅ Add expense modal opened');
    
    // Check form fields
    const fields = await page.locator('input, select, textarea').count();
    console.log(`   Form fields: ${fields}`);
    
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } else {
    console.log('⚠️ Add expense button - checking alternate');
    // Try scrolling to expenses section
    await page.evaluate(() => window.scrollTo(0, 600));
    await screenshot(page, 'expenses-section');
  }

  // Test Export buttons
  console.log('\n📤 EXPORT BUTTONS');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  
  const excelBtn = await page.locator('button:has-text("Excel"), a:has-text("Excel")').count();
  const pdfBtn = await page.locator('button:has-text("PDF"), a:has-text("PDF")').count();
  console.log(`   Excel: ${excelBtn > 0 ? '✅' : '⚠️'}`);
  console.log(`   PDF: ${pdfBtn > 0 ? '✅' : '⚠️'}`);
  await screenshot(page, 'export-buttons');

  // BOQ Page
  console.log('\n📋 BILL OF QUANTITIES PAGE');
  await page.goto(`${BASE_URL}/dashboard/bill-of-quantities`);
  await page.waitForTimeout(2000);
  await screenshot(page, 'boq-page');
  
  const boqUpload = await page.locator('input[type="file"]').count();
  const boqSubmit = await page.locator('button:has-text("צור"), button:has-text("נתח")').count();
  console.log(`   Upload area: ${boqUpload > 0 ? '✅' : '❌'}`);
  console.log(`   Submit button: ${boqSubmit > 0 ? '✅' : '❌'}`);

  // Visualize Page
  console.log('\n🎨 VISUALIZE PAGE');
  await page.goto(`${BASE_URL}/visualize`);
  await page.waitForTimeout(2000);
  await screenshot(page, 'visualize-page');
  
  const vizUpload = await page.locator('input[type="file"]').count();
  console.log(`   Upload area: ${vizUpload > 0 ? '✅' : '❌'}`);

  // Shop the Look
  console.log('\n🛍️ SHOP THE LOOK');
  await page.goto(`${BASE_URL}/shop-the-look`);
  await page.waitForTimeout(2000);
  await screenshot(page, 'shop-the-look');
  const is404 = page.url().includes('404') || (await page.textContent('body')).includes('404');
  console.log(`   Page: ${!is404 ? '✅' : '❌ 404'}`);

  // Checkout Premium
  console.log('\n💳 CHECKOUT PREMIUM');
  await page.goto(`${BASE_URL}/checkout`);
  await page.waitForTimeout(2000);
  await screenshot(page, 'checkout-premium');
  
  const premiumPrice = (await page.textContent('body')).includes('299');
  const payBtn = await page.locator('button:has-text("לתשלום")').count();
  console.log(`   Price visible: ${premiumPrice ? '✅' : '❌'}`);
  console.log(`   Pay button: ${payBtn > 0 ? '✅' : '❌'}`);

  // Checkout Vision
  console.log('\n💳 CHECKOUT VISION');
  await page.goto(`${BASE_URL}/checkout-vision`);
  await page.waitForTimeout(2000);
  await screenshot(page, 'checkout-vision');
  
  const visionPrice = (await page.textContent('body')).includes('39.99');
  console.log(`   Price visible: ${visionPrice ? '✅' : '❌'}`);

  // Test chat widget
  console.log('\n💬 CHAT WIDGET');
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(2000);
  const chatWidget = await page.locator('[class*="chat"], :has-text("צריך עזרה")').count();
  console.log(`   Chat widget: ${chatWidget > 0 ? '✅' : '⚠️'}`);
  
  if (chatWidget > 0) {
    const chatBtn = page.locator(':has-text("צריך עזרה")').first();
    await chatBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, 'chat-widget-open');
  }

  // Mobile test
  console.log('\n📱 MOBILE VIEW');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(2000);
  await screenshot(page, 'mobile-dashboard');
  
  // Test project page on mobile
  const mobileProject = page.locator('a[href*="/project/"]').first();
  if (await mobileProject.count() > 0) {
    await mobileProject.click();
    await page.waitForTimeout(2000);
    await screenshot(page, 'mobile-project');
  }

  await browser.close();
  console.log('\n✅ Part 2 complete! Check screenshots in ./comprehensive-qa/');
}

runPart2().catch(console.error);
