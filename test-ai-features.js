const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testAIFeatures() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('=== ShiputzAI AI Features Test ===\n');
  
  // Login
  console.log('1. Logging in...');
  await page.goto('https://shipazti.com/login');
  await page.fill('input[type="email"]', 'test@shiputzai.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Login successful!\n');
  
  // Test Visualize
  console.log('2. Testing AI Visualize...');
  await page.goto('https://shipazti.com/visualize');
  await page.waitForTimeout(2000);
  
  // Click "נסה עכשיו בחינם" or similar button to open upload modal
  const tryButton = page.locator('button:has-text("צור הדמיה"), button:has-text("נסה עכשיו")').first();
  if (await tryButton.count() > 0) {
    await tryButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ Opened visualize modal\n');
    await page.screenshot({ path: '/tmp/ai-test-1-visualize-modal.png' });
    
    // Upload test image
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles('/tmp/test_room.jpg');
      console.log('✅ Uploaded test image\n');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/ai-test-2-image-uploaded.png' });
      
      // Fill description
      const descInput = page.locator('textarea, input[placeholder*="שנות"], input[placeholder*="תאר"]').first();
      if (await descInput.count() > 0) {
        await descInput.fill('החלף את הספה לספה לבנה');
        console.log('✅ Filled description\n');
      }
      
      // Click generate
      const generateBtn = page.locator('button:has-text("צור הדמיה")').first();
      if (await generateBtn.count() > 0) {
        await generateBtn.click();
        console.log('⏳ Generating visualization (waiting up to 90 seconds)...\n');
        
        // Wait for result or error
        try {
          await page.waitForSelector('img[alt*="אחרי"], img[alt*="after"], .result-image, [class*="result"]', { timeout: 90000 });
          console.log('✅ Visualization generated!\n');
          await page.screenshot({ path: '/tmp/ai-test-3-result.png', fullPage: true });
        } catch (e) {
          console.log('⚠️ Timeout or error during generation\n');
          await page.screenshot({ path: '/tmp/ai-test-3-error.png', fullPage: true });
        }
      }
    }
  } else {
    console.log('⚠️ Could not find visualize button\n');
    await page.screenshot({ path: '/tmp/ai-test-1-no-button.png' });
  }
  
  await browser.close();
  console.log('=== Test Complete ===');
}

testAIFeatures().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
