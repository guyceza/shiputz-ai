import { chromium, Browser, Page } from 'playwright';

const BASE_URL = 'https://shipazti.com';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  screenshot?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (e: any) {
    results.push({ name, passed: false, error: e.message });
    console.log(`❌ ${name}: ${e.message}`);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: 'he-IL',
  });
  const page = await context.newPage();

  // Get credentials from env or args
  const email = process.env.TEST_EMAIL || process.argv[2];
  const password = process.env.TEST_PASSWORD || process.argv[3];

  if (!email || !password) {
    console.error('Usage: npx tsx test-site.ts <email> <password>');
    process.exit(1);
  }

  console.log('\n🔍 Starting ShiputzAI E2E Tests...\n');

  // Test 1: Homepage loads
  await test('Homepage loads', async () => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const title = await page.title();
    if (!title.includes('ShiputzAI')) throw new Error(`Wrong title: ${title}`);
  });

  // Test 2: Login page loads
  await test('Login page loads', async () => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  });

  // Test 3: Login with credentials
  await test('Login works', async () => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
  });

  // Test 4: Dashboard loads with projects
  await test('Dashboard loads', async () => {
    await page.waitForSelector('text=הפרויקטים שלי', { timeout: 10000 });
  });

  // Test 5: Create new project
  let projectUrl: string | null = null;
  await test('Create project', async () => {
    await page.click('text=פרויקט חדש');
    await page.waitForSelector('input[placeholder*="שם"]', { timeout: 5000 });
    await page.fill('input[placeholder*="שם"]', 'פרויקט טסט אוטומטי');
    await page.fill('input[placeholder*="תקציב"]', '50000');
    await page.click('button:has-text("צור פרויקט")');
    await page.waitForURL('**/project/**', { timeout: 10000 });
    projectUrl = page.url();
  });

  // Test 6: Add expense manually
  await test('Add expense manually', async () => {
    if (!projectUrl) throw new Error('No project URL');
    await page.goto(projectUrl);
    await page.waitForLoadState('networkidle');
    
    // Look for add expense button
    const addBtn = await page.locator('button:has-text("הוסף הוצאה"), button:has-text("הוצאה חדשה")').first();
    await addBtn.click();
    
    // Fill expense form
    await page.waitForSelector('input[placeholder*="תיאור"], input[name="description"]', { timeout: 5000 });
    await page.fill('input[placeholder*="תיאור"], input[name="description"]', 'הוצאת טסט');
    await page.fill('input[placeholder*="סכום"], input[name="amount"]', '1000');
    
    // Submit
    await page.click('button:has-text("שמור"), button:has-text("הוסף")');
    await page.waitForTimeout(2000);
  });

  // Test 7: Visualize page loads
  await test('Visualize page loads', async () => {
    await page.goto(`${BASE_URL}/visualize`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=הדמיית שיפוץ, text=ראה איך', { timeout: 10000 });
  });

  // Test 8: Tips page loads
  await test('Tips page loads', async () => {
    await page.goto(`${BASE_URL}/tips`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('a[href*="/tips/"]', { timeout: 10000 });
  });

  // Test 9: Checkout page loads
  await test('Checkout page loads', async () => {
    await page.goto(`${BASE_URL}/checkout?plan=plus`);
    await page.waitForLoadState('networkidle');
  });

  // Cleanup - delete test project
  if (projectUrl) {
    try {
      await page.goto(projectUrl);
      // Try to delete the project
      const settingsBtn = await page.locator('button:has-text("הגדרות"), [aria-label="settings"]').first();
      if (await settingsBtn.isVisible()) {
        await settingsBtn.click();
        const deleteBtn = await page.locator('button:has-text("מחק פרויקט")').first();
        if (await deleteBtn.isVisible()) {
          await deleteBtn.click();
          await page.click('button:has-text("אישור"), button:has-text("מחק")');
        }
      }
    } catch (e) {
      console.log('Cleanup failed, project may still exist');
    }
  }

  await browser.close();

  // Summary
  console.log('\n📊 Summary:');
  console.log(`Passed: ${results.filter(r => r.passed).length}/${results.length}`);
  
  const failed = results.filter(r => !r.passed);
  if (failed.length > 0) {
    console.log('\n❌ Failed tests:');
    failed.forEach(r => console.log(`  - ${r.name}: ${r.error}`));
  }
}

main().catch(console.error);
