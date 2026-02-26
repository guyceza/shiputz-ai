const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://shipazti.com';
const TEST_EMAIL = 'test@shiputzai.com';
const TEST_PASSWORD = 'Test123456!';

// Test image path
const TEST_IMAGE = path.join(__dirname, 'public/examples/living-before.jpg');

const dir = './full-e2e';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

let counter = 0;
async function screenshot(page, name) {
  counter++;
  const filename = `${dir}/${String(counter).padStart(3, '0')}-${name}.png`;
  await page.screenshot({ path: filename });
  console.log(`📸 ${name}`);
  return filename;
}

async function runFullE2E() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 FULL E2E TEST - ShiputzAI');
  console.log('='.repeat(70));
  console.log(`Test image: ${TEST_IMAGE}`);
  console.log(`Image exists: ${fs.existsSync(TEST_IMAGE)}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'he-IL'
  });
  const page = await context.newPage();

  try {
    // =====================================================
    // STEP 1: LOGIN
    // =====================================================
    console.log('\n\n📍 STEP 1: LOGIN\n' + '-'.repeat(50));
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await screenshot(page, '01-login-form');
    
    await page.click('button:has-text("התחברות")');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await page.waitForTimeout(2000);
    await screenshot(page, '02-dashboard');
    console.log('✅ Logged in successfully');

    // =====================================================
    // STEP 2: GO TO VISUALIZATION
    // =====================================================
    console.log('\n\n📍 STEP 2: VISUALIZATION PAGE\n' + '-'.repeat(50));
    
    await page.goto(`${BASE_URL}/visualize`);
    await page.waitForTimeout(3000);
    await screenshot(page, '03-visualize-page');

    // Find and click upload or create button
    const createVizBtn = page.locator('button:has-text("צור הדמיה"), button:has-text("התחל")').first();
    if (await createVizBtn.count() > 0) {
      await createVizBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, '04-viz-modal-open');
    }

    // =====================================================
    // STEP 3: UPLOAD IMAGE
    // =====================================================
    console.log('\n\n📍 STEP 3: UPLOAD TEST IMAGE\n' + '-'.repeat(50));
    
    // Find file input
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      // Upload the test image
      await fileInput.setInputFiles(TEST_IMAGE);
      console.log('✅ Image uploaded');
      await page.waitForTimeout(2000);
      await screenshot(page, '05-image-uploaded');
      
      // Fill description if there's a text field
      const descInput = page.locator('textarea, input[placeholder*="תאר"]').first();
      if (await descInput.count() > 0) {
        await descInput.fill('סלון מודרני עם ספה לבנה וצמחים');
        console.log('✅ Description filled');
      }
      await screenshot(page, '06-form-filled');
      
      // Click generate button
      const generateBtn = page.locator('button:has-text("צור"), button:has-text("הדמיה")').first();
      if (await generateBtn.count() > 0 && !(await generateBtn.isDisabled())) {
        console.log('⏳ Starting AI generation (this takes 30-60 seconds)...');
        await generateBtn.click();
        
        // Wait for generation to complete (up to 90 seconds)
        await page.waitForTimeout(5000);
        await screenshot(page, '07-generating');
        
        // Wait for result (check for result elements)
        for (let i = 0; i < 18; i++) { // 18 * 5 = 90 seconds max
          await page.waitForTimeout(5000);
          
          // Check if result appeared
          const resultImage = await page.locator('img[src*="data:"], img[class*="result"], [class*="after"]').count();
          const shopBtn = await page.locator('button:has-text("Shop"), button:has-text("קנה")').count();
          
          if (resultImage > 0 || shopBtn > 0) {
            console.log('✅ Generation complete!');
            break;
          }
          console.log(`   Waiting... (${(i+1)*5}s)`);
        }
        await screenshot(page, '08-generation-result');
      } else {
        console.log('⚠️ Generate button not found or disabled');
      }
    } else {
      console.log('⚠️ File input not found, trying alternative...');
      
      // Maybe it's a dropzone - try drag and drop
      const dropzone = page.locator('[class*="drop"], [class*="upload"]').first();
      if (await dropzone.count() > 0) {
        console.log('Found dropzone, attempting upload...');
      }
    }

    // =====================================================
    // STEP 4: TEST SHOP THE LOOK
    // =====================================================
    console.log('\n\n📍 STEP 4: SHOP THE LOOK\n' + '-'.repeat(50));
    
    // Look for Shop the Look button
    const shopBtn = page.locator('button:has-text("Shop"), button:has-text("קנה"), button:has-text("לקנות")').first();
    if (await shopBtn.count() > 0) {
      await shopBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, '09-shop-the-look');
      console.log('✅ Shop the Look opened');
      
      // Check for product hotspots
      const products = await page.locator('[class*="hotspot"], [class*="product"], [class*="item"]').count();
      console.log(`   Found ${products} product elements`);
      
      // Click on a product if available
      const productItem = page.locator('[class*="product"], [class*="item"]').first();
      if (await productItem.count() > 0) {
        await productItem.click();
        await page.waitForTimeout(1500);
        await screenshot(page, '10-product-clicked');
      }
    } else {
      console.log('⚠️ Shop the Look button not found');
      
      // Check if we need to hover over the image first
      const afterImage = page.locator('img[class*="after"], [class*="result"]').first();
      if (await afterImage.count() > 0) {
        await afterImage.hover();
        await page.waitForTimeout(1000);
        await screenshot(page, '09-hover-on-result');
        
        // Try again
        const shopBtn2 = page.locator('button:has-text("Shop"), button:has-text("קנה")').first();
        if (await shopBtn2.count() > 0) {
          await shopBtn2.click();
          await page.waitForTimeout(2000);
          await screenshot(page, '10-shop-after-hover');
        }
      }
    }

    // =====================================================
    // STEP 5: GO TO PROJECT AND CHECK HISTORY
    // =====================================================
    console.log('\n\n📍 STEP 5: CHECK PROJECT HISTORY\n' + '-'.repeat(50));
    
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    // Go to first project
    const projectLink = page.locator('a[href*="/project/"]').first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForTimeout(2000);
      await screenshot(page, '11-project-page');
      
      // Look for visualization history tab or section
      const photosTab = page.locator('button:has-text("תמונות"), [class*="tab"]:has-text("תמונות")').first();
      if (await photosTab.count() > 0) {
        await photosTab.click();
        await page.waitForTimeout(1500);
        await screenshot(page, '12-photos-tab');
        console.log('✅ Photos tab opened');
      }
      
      // Check for saved visualizations
      const savedViz = await page.locator('[class*="visualization"], [class*="history"], img').count();
      console.log(`   Images/visualizations found: ${savedViz}`);
    }

    // =====================================================
    // STEP 6: LOGOUT AND RE-LOGIN
    // =====================================================
    console.log('\n\n📍 STEP 6: LOGOUT & RE-LOGIN\n' + '-'.repeat(50));
    
    await page.goto(`${BASE_URL}/logout`);
    await page.waitForTimeout(2000);
    await screenshot(page, '13-logged-out');
    console.log('✅ Logged out');
    
    // Re-login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("התחברות")');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await page.waitForTimeout(2000);
    await screenshot(page, '14-re-logged-in');
    console.log('✅ Re-logged in');

    // =====================================================
    // STEP 7: VERIFY PERSISTENCE
    // =====================================================
    console.log('\n\n📍 STEP 7: VERIFY DATA PERSISTED\n' + '-'.repeat(50));
    
    // Check projects still exist
    const projectCount = await page.locator('a[href*="/project/"]').count();
    console.log(`   Projects found after re-login: ${projectCount}`);
    
    // Go to project and check photos
    if (projectCount > 0) {
      await page.locator('a[href*="/project/"]').first().click();
      await page.waitForTimeout(2000);
      
      const photosTab = page.locator('button:has-text("תמונות")').first();
      if (await photosTab.count() > 0) {
        await photosTab.click();
        await page.waitForTimeout(1500);
        await screenshot(page, '15-photos-after-relogin');
        
        const savedImages = await page.locator('[class*="history"] img, [class*="viz"] img').count();
        console.log(`   Saved visualizations persisted: ${savedImages > 0 ? '✅' : '⚠️'}`);
      }
    }

    // =====================================================
    // STEP 8: TEST RECEIPT SCANNER
    // =====================================================
    console.log('\n\n📍 STEP 8: RECEIPT SCANNER\n' + '-'.repeat(50));
    
    const scannerCard = page.locator(':has-text("סריקת קבלה")').first();
    if (await scannerCard.count() > 0) {
      await scannerCard.click();
      await page.waitForTimeout(1500);
      await screenshot(page, '16-receipt-scanner');
      
      const scanInput = page.locator('input[type="file"]').first();
      if (await scanInput.count() > 0) {
        console.log('✅ Receipt scanner has file input');
        // We won't actually upload to avoid unnecessary API calls
      }
      
      await page.keyboard.press('Escape');
    }

    // =====================================================
    // STEP 9: TEST QUOTE ANALYSIS
    // =====================================================
    console.log('\n\n📍 STEP 9: QUOTE ANALYSIS\n' + '-'.repeat(50));
    
    const quoteCard = page.locator(':has-text("ניתוח הצעת מחיר")').first();
    if (await quoteCard.count() > 0) {
      await quoteCard.click();
      await page.waitForTimeout(1500);
      await screenshot(page, '17-quote-analysis');
      
      // Try to find text input
      const quoteInput = page.locator('textarea').first();
      if (await quoteInput.count() > 0) {
        await quoteInput.fill('הצעת מחיר לבדיקה:\nעבודות חשמל - 5000 ש"ח\nצביעה - 3000 ש"ח\nריצוף - 8000 ש"ח');
        await screenshot(page, '18-quote-filled');
        console.log('✅ Quote text entered');
        
        // Look for analyze button
        const analyzeBtn = page.locator('button:has-text("נתח"), button:has-text("בדוק")').first();
        if (await analyzeBtn.count() > 0) {
          console.log('   Analyze button found (not clicking to save API)');
        }
      }
      
      await page.keyboard.press('Escape');
    }

    // =====================================================
    // STEP 10: TEST BOQ
    // =====================================================
    console.log('\n\n📍 STEP 10: BILL OF QUANTITIES\n' + '-'.repeat(50));
    
    await page.goto(`${BASE_URL}/dashboard/bill-of-quantities`);
    await page.waitForTimeout(2000);
    await screenshot(page, '19-boq-page');
    
    const boqUpload = await page.locator('input[type="file"]').count();
    const boqForm = await page.locator('select, input').count();
    console.log(`   Upload input: ${boqUpload > 0 ? '✅' : '❌'}`);
    console.log(`   Form fields: ${boqForm}`);

    // =====================================================
    // SUMMARY
    // =====================================================
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 FULL E2E TEST COMPLETE');
    console.log('='.repeat(70));
    console.log(`\n📁 Screenshots saved to: ${dir}/`);
    console.log(`📸 Total screenshots: ${counter}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await screenshot(page, 'error-state');
  }

  await browser.close();
}

runFullE2E().catch(console.error);
