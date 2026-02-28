const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/tmp/shiputz-screenshots';
const BASE_URL = 'https://shipazti.com';

async function test() {
  fs.readdirSync(SCREENSHOT_DIR).forEach(f => fs.unlinkSync(path.join(SCREENSHOT_DIR, f)));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    locale: 'he-IL'
  });
  const page = await context.newPage();
  
  let screenshotCount = 0;
  const screenshot = async (name) => {
    screenshotCount++;
    const filename = `${String(screenshotCount).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: false });
    console.log(`📸 ${filename}`);
    return path.join(SCREENSHOT_DIR, filename);
  };

  try {
    // 1. Go to Shop the Look
    console.log('🛒 Opening Shop the Look...');
    await page.goto(`${BASE_URL}/shop-look`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Accept cookies
    const acceptBtn = await page.$('button:has-text("מאשר")');
    if (acceptBtn) {
      await acceptBtn.click();
      await page.waitForTimeout(500);
    }
    
    // 2. Click on a product marker to show tooltip
    console.log('\n🖱️ Clicking product marker...');
    await page.mouse.click(579, 766);  // Sofa area
    await page.waitForTimeout(1500);
    await screenshot('01-tooltip-visible');
    
    // 3. Find and click the Google Shopping link text in tooltip
    console.log('\n🔗 Clicking Google Shopping link...');
    
    // Find all clickable elements that mention Google
    const allLinks = await page.$$('a, button, span[class*="cursor"], div[class*="cursor"]');
    console.log(`Found ${allLinks.length} clickable elements`);
    
    // Look for the specific link text
    const googleShoppingText = await page.$('text=Google Shopping');
    if (googleShoppingText) {
      console.log('Found "Google Shopping" text element');
      
      // Get the parent link
      const parent = await googleShoppingText.evaluateHandle(el => el.closest('a') || el.parentElement);
      if (parent) {
        // Listen for new page
        const pagePromise = context.waitForEvent('page', { timeout: 5000 }).catch(() => null);
        
        await googleShoppingText.click();
        await page.waitForTimeout(2000);
        
        const newPage = await pagePromise;
        if (newPage) {
          await newPage.waitForLoadState('domcontentloaded');
          const url = newPage.url();
          console.log('✅ New page opened:', url);
          
          // Take screenshot of Google Shopping
          await newPage.screenshot({ path: path.join(SCREENSHOT_DIR, `${String(++screenshotCount).padStart(2, '0')}-google-results.png`) });
          console.log(`📸 ${screenshotCount.toString().padStart(2, '0')}-google-results.png`);
          
          // Check if it's actually Google Shopping
          if (url.includes('google.com/search')) {
            console.log('✅ Correctly opened Google Shopping search');
          }
          await newPage.close();
        } else {
          console.log('No new page opened, checking current URL...');
          console.log('Current URL:', page.url());
          await screenshot('02-after-click');
        }
      }
    } else {
      console.log('⚠️ Google Shopping text not found');
      
      // Try finding by class or href
      const tooltipContent = await page.evaluate(() => {
        const tooltip = document.querySelector('[class*="absolute"][class*="bg-white"], [class*="tooltip"], [class*="popup"]');
        if (tooltip) {
          return {
            html: tooltip.innerHTML.slice(0, 500),
            links: Array.from(tooltip.querySelectorAll('a')).map(a => ({ href: a.href, text: a.textContent }))
          };
        }
        return null;
      });
      console.log('Tooltip content:', JSON.stringify(tooltipContent, null, 2));
    }
    
    // 4. Test signup flow
    console.log('\n📝 Testing signup flow...');
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle', timeout: 30000 });
    await screenshot('03-signup-page');
    
    // List signup form elements
    const signupElements = await page.$$eval('input, button', els => 
      els.map(e => ({ 
        tag: e.tagName, 
        type: e.type, 
        name: e.name,
        placeholder: e.placeholder,
        text: e.textContent?.trim().slice(0, 30) 
      }))
    );
    console.log('Signup elements:', signupElements);
    
    // 5. Test visualize page (AI Vision)
    console.log('\n🎨 Testing AI Vision page...');
    await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle', timeout: 30000 });
    await screenshot('04-visualize-page');
    
    const visualizeElements = await page.$$eval('h1, h2, button, input[type="file"]', els => 
      els.map(e => ({ tag: e.tagName, type: e.type || '', text: e.textContent?.trim().slice(0, 50) }))
    );
    console.log('Visualize elements:', visualizeElements);
    
    console.log(`\n✅ Done! ${screenshotCount} screenshots`);
    console.log('Files:', fs.readdirSync(SCREENSHOT_DIR).join(', '));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await screenshot('error');
  } finally {
    await browser.close();
  }
}

test();
