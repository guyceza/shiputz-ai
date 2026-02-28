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
    
    // 2. Find the white dots (product markers) - they have specific styling
    console.log('\n🔍 Looking for product markers (white dots)...');
    
    // Get all elements that look like dots
    const markerInfo = await page.evaluate(() => {
      const markers = [];
      // Look for small circular elements positioned absolutely
      document.querySelectorAll('*').forEach(el => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        // Dots are typically small, round, absolutely positioned
        if (rect.width > 5 && rect.width < 30 && 
            rect.height > 5 && rect.height < 30 &&
            style.borderRadius && 
            rect.top > 200 && rect.top < 900) {
          markers.push({
            tag: el.tagName,
            classes: el.className?.slice(0, 50),
            x: rect.left + rect.width/2,
            y: rect.top + rect.height/2,
            width: rect.width,
            bg: style.backgroundColor
          });
        }
      });
      return markers;
    });
    
    console.log(`Found ${markerInfo.length} potential markers`);
    markerInfo.forEach((m, i) => console.log(`  ${i}: (${Math.round(m.x)}, ${Math.round(m.y)}) ${m.width}px [${m.bg}]`));
    
    // Look for white/light colored circles specifically
    const whiteDots = markerInfo.filter(m => 
      m.bg.includes('255') || m.bg.includes('rgb(255') || m.bg === 'white'
    );
    console.log(`White dots: ${whiteDots.length}`);
    
    await screenshot('01-initial');
    
    // 3. Click on first marker
    if (markerInfo.length > 0) {
      const firstDot = markerInfo[0];
      console.log(`\n🖱️ Clicking on marker at (${Math.round(firstDot.x)}, ${Math.round(firstDot.y)})...`);
      await page.mouse.click(firstDot.x, firstDot.y);
      await page.waitForTimeout(1500);
      await screenshot('02-after-dot-click');
      
      // Check if anything changed
      const popup = await page.$('[class*="popup"], [class*="modal"], [class*="tooltip"], [class*="card"], [class*="product"]');
      console.log('Popup appeared:', !!popup);
    }
    
    // 4. Try clicking directly on item names in the list
    console.log('\n📝 Testing item list clicks...');
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);
    
    // Find items with text like "ספה" or product names
    const itemLinks = await page.$$('a:has-text("ספה"), a:has-text("מנורה"), button:has-text("ספה"), [class*="item"]');
    console.log(`Found ${itemLinks.length} item links`);
    
    if (itemLinks.length > 0) {
      await itemLinks[0].click();
      await page.waitForTimeout(1500);
      await screenshot('03-after-item-click');
    }
    
    // 5. Check if there's a hover effect on dots
    console.log('\n🖱️ Testing hover on image area...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    
    // Hover over the image at different positions
    const positions = [
      {x: 300, y: 700},  // Left side (near floor lamp)
      {x: 500, y: 500},  // Center (near sofa)
      {x: 700, y: 400},  // Right (near pictures)
    ];
    
    for (const pos of positions) {
      await page.mouse.move(pos.x, pos.y);
      await page.waitForTimeout(800);
    }
    await screenshot('04-after-hover');
    
    // 6. Look at the actual image overlay structure
    console.log('\n🔍 Analyzing image overlay structure...');
    const overlayStructure = await page.evaluate(() => {
      const container = document.querySelector('img')?.parentElement;
      if (!container) return null;
      
      const children = Array.from(container.children);
      return {
        containerTag: container.tagName,
        containerClass: container.className,
        childCount: children.length,
        children: children.map(c => ({
          tag: c.tagName,
          class: c.className?.slice(0, 50),
          text: c.textContent?.slice(0, 30)
        }))
      };
    });
    console.log('Container structure:', JSON.stringify(overlayStructure, null, 2));
    
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
