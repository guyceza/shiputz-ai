const { chromium } = require('playwright');

async function screenshot() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Login
  await page.goto('https://shipazti.com/login');
  await page.fill('input[type="email"]', 'test@shiputzai.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button:has-text("התחברות")');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // Click on first project
  const projectCard = page.locator('a[href*="/project/"]').first();
  if (await projectCard.count() > 0) {
    await projectCard.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: './project-page.png', fullPage: true });
    console.log('Project page screenshot saved');
  } else {
    console.log('No project found');
  }
  
  await browser.close();
}

screenshot().catch(console.error);
