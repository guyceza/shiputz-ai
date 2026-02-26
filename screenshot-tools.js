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
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  // Scroll to the tools section
  await page.evaluate(() => {
    const toolsSection = document.querySelector('h2');
    if (toolsSection) {
      const sections = document.querySelectorAll('h2, h3');
      for (const s of sections) {
        if (s.textContent.includes('כלים מתקדמים')) {
          s.scrollIntoView({ behavior: 'instant', block: 'start' });
          break;
        }
      }
    }
    // Also try scrolling down
    window.scrollBy(0, 500);
  });
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tools-section.png', fullPage: false });
  
  console.log('Screenshot saved to tools-section.png');
  await browser.close();
}

screenshot().catch(console.error);
