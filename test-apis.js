const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testAPIs() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('=== ShiputzAI API Tests ===\n');
  
  // Login
  console.log('1. Logging in...');
  await page.goto('https://shipazti.com/login');
  await page.fill('input[type="email"]', 'test@shiputzai.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Login successful!\n');
  
  // Screenshot dashboard
  await page.screenshot({ path: '/tmp/test-1-dashboard.png' });
  console.log('📸 Dashboard screenshot saved\n');
  
  // Go to visualize
  console.log('2. Testing Visualize page...');
  await page.goto('https://shipazti.com/visualize');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/test-2-visualize.png' });
  console.log('📸 Visualize page screenshot saved\n');
  
  // Check if we have access (Premium + Vision)
  const hasAccess = await page.locator('text=צור הדמיה').count() > 0 || 
                    await page.locator('text=נסה עכשיו').count() > 0;
  console.log(`✅ Visualize access: ${hasAccess ? 'YES' : 'NO'}\n`);
  
  // Go to project and test receipt scanning
  console.log('3. Testing project page...');
  await page.goto('https://shipazti.com/dashboard');
  await page.waitForTimeout(2000);
  
  // Click on first project if exists
  const projectCard = page.locator('[href^="/project/"]').first();
  if (await projectCard.count() > 0) {
    await projectCard.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/test-3-project.png' });
    console.log('📸 Project page screenshot saved\n');
  } else {
    console.log('⚠️ No projects found, creating one...');
  }
  
  await browser.close();
  console.log('=== Tests Complete ===');
  console.log('Screenshots saved to /tmp/test-*.png');
}

testAPIs().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
