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
  
  // Log console and network to see what happens on click
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(msg.text()));
  
  // Track window.open calls
  await page.addInitScript(() => {
    window.__openedUrls = [];
    const originalOpen = window.open;
    window.open = function(url, target) {
      window.__openedUrls.push({ url, target });
      console.log('window.open called:', url);
      return originalOpen.call(this, url, target);
    };
  });

  let screenshotCount = 0;
  const screenshot = async (name) => {
    screenshotCount++;
    const filename = `${String(screenshotCount).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: false });
    console.log(`📸 ${filename}`);
  };

  try {
    console.log('🛒 Opening Shop the Look...');
    await page.goto(`${BASE_URL}/shop-look`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Accept cookies
    const acceptBtn = await page.$('button:has-text("מאשר")');
    if (acceptBtn) {
      await acceptBtn.click();
      await page.waitForTimeout(500);
    }
    await screenshot('01-ready');
    
    // Get all hotspot positions from the page
    console.log('\n📍 Getting hotspot positions...');
    const hotspots = await page.evaluate(() => {
      const container = document.querySelector('img[alt*="סלון"]')?.parentElement;
      if (!container) return [];
      
      const divs = container.querySelectorAll('div[style*="position"]');
      return Array.from(divs).map(d => {
        const rect = d.getBoundingClientRect();
        const style = d.getAttribute('style') || '';
        return {
          x: rect.x + rect.width/2,
          y: rect.y + rect.height/2,
          style: style.slice(0, 100)
        };
      }).filter(h => h.style.includes('top'));
    });
    console.log('Hotspots found:', hotspots.length);
    hotspots.slice(0, 5).forEach((h, i) => console.log(`  ${i}: (${Math.round(h.x)}, ${Math.round(h.y)})`));
    
    if (hotspots.length > 0) {
      // Click first hotspot
      console.log(`\n🖱️ Clicking hotspot at (${Math.round(hotspots[0].x)}, ${Math.round(hotspots[0].y)})...`);
      await page.mouse.click(hotspots[0].x, hotspots[0].y);
      await page.waitForTimeout(2000);
      
      // Check if window.open was called
      const openedUrls = await page.evaluate(() => window.__openedUrls);
      console.log('window.open calls:', openedUrls.length);
      if (openedUrls.length > 0) {
        console.log('✅ URL opened:', openedUrls[0].url);
        
        // Verify the URL is correct Google Shopping format
        const url = openedUrls[0].url;
        if (url.includes('google.com/search') && url.includes('tbm=shop')) {
          console.log('✅ CONFIRMED: Correct Google Shopping URL!');
          
          // Parse query
          try {
            const urlObj = new URL(url);
            console.log('Search query:', urlObj.searchParams.get('q'));
          } catch (e) {}
        }
      }
      
      await screenshot('02-after-click');
    }
    
    // Test image upload flow (logged-in user)
    console.log('\n📤 Testing upload CTA...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await screenshot('03-upload-section');
    
    // Check the CTA button
    const uploadCTA = await page.$('a:has-text("התחבר"), label:has-text("העלה"), button:has-text("שדרג")');
    if (uploadCTA) {
      const text = await uploadCTA.textContent();
      console.log('Upload CTA text:', text);
    }
    
    // Test signup
    console.log('\n📝 Testing signup...');
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle', timeout: 30000 });
    await screenshot('04-signup');
    
    const signupFields = await page.$$eval('input', els => 
      els.map(e => `${e.type}: ${e.placeholder || e.name}`).filter(Boolean)
    );
    console.log('Signup fields:', signupFields);
    
    // Test visualize
    console.log('\n🎨 Testing visualize...');
    await page.goto(`${BASE_URL}/visualize`, { waitUntil: 'networkidle', timeout: 30000 });
    await screenshot('05-visualize');
    
    const hasUpload = await page.$('input[type="file"]');
    const uploadLabel = await page.$('label:has-text("העלה"), button:has-text("העלה")');
    console.log('Has file input:', !!hasUpload);
    console.log('Has upload label:', !!uploadLabel);
    
    console.log(`\n✅ Test complete! ${screenshotCount} screenshots`);
    console.log('Files:', fs.readdirSync(SCREENSHOT_DIR).join(', '));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await screenshot('error');
  } finally {
    await browser.close();
  }
}

test();
