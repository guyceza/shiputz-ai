const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://shipazti.com';
const TEST_EMAIL = 'test@shiputzai.com';
const TEST_PASSWORD = 'Test123456!';
const TEST_IMAGE = path.join(__dirname, 'public/examples/living-before.jpg');

const dir = './viz-test';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

let c = 0;
const shot = async (page, name) => {
  c++;
  await page.screenshot({ path: `${dir}/${String(c).padStart(2,'0')}-${name}.png` });
  console.log(`📸 ${name}`);
};

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Login
  console.log('🔑 Logging in...');
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button:has-text("התחברות")');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Logged in');

  // Go to visualize
  console.log('\n🎨 Going to visualize...');
  await page.goto(`${BASE_URL}/visualize`);
  await page.waitForTimeout(3000);
  await shot(page, 'visualize-page');

  // Click create button
  await page.click('button:has-text("צור הדמיה")');
  await page.waitForTimeout(2000);
  await shot(page, 'modal-open');

  // Upload image
  console.log('📤 Uploading image...');
  const fileInput = await page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(TEST_IMAGE);
  await page.waitForTimeout(2000);
  await shot(page, 'image-uploaded');

  // Fill description
  console.log('✏️ Filling description...');
  const desc = await page.locator('textarea').first();
  await desc.fill('סלון מודרני עם ספה לבנה, שטיח אפור, וצמחים ירוקים');
  await page.waitForTimeout(1000);
  await shot(page, 'description-filled');

  // Click generate using JavaScript execution
  console.log('🚀 Clicking generate button via JS...');
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent.includes('צור הדמיה') && !btn.disabled) {
        btn.click();
        return true;
      }
    }
    return false;
  });

  // Wait for generation
  console.log('⏳ Waiting for AI generation (up to 90s)...');
  await page.waitForTimeout(5000);
  await shot(page, 'generating');

  for (let i = 0; i < 17; i++) {
    await page.waitForTimeout(5000);
    
    const hasResult = await page.evaluate(() => {
      const body = document.body.innerText;
      return body.includes('Shop the Look') || 
             body.includes('התוצאה') || 
             body.includes('אחרי') ||
             document.querySelectorAll('img[src*="data:image"]').length > 2;
    });

    if (hasResult) {
      console.log('✅ Generation complete!');
      await shot(page, 'result');
      break;
    }
    
    // Check for error
    const hasError = await page.evaluate(() => {
      return document.body.innerText.includes('שגיאה') || 
             document.body.innerText.includes('נכשל');
    });
    if (hasError) {
      console.log('❌ Generation failed');
      await shot(page, 'error');
      break;
    }
    
    console.log(`   Waiting... ${(i+1)*5}s`);
  }

  await shot(page, 'final-state');

  // Check for Shop the Look
  console.log('\n🛍️ Checking for Shop the Look...');
  const shopBtn = await page.locator('button:has-text("Shop"), button:has-text("קנה"), :has-text("לקנות")').count();
  console.log(`   Shop buttons found: ${shopBtn}`);

  if (shopBtn > 0) {
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.includes('Shop') || btn.textContent.includes('קנה')) {
          btn.click();
          return;
        }
      }
    });
    await page.waitForTimeout(3000);
    await shot(page, 'shop-the-look');
    console.log('✅ Shop the Look opened');
  }

  await browser.close();
  console.log(`\n📁 Screenshots: ${dir}/`);
}

test().catch(e => console.error('Error:', e.message));
