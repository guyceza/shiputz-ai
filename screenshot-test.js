const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting browser...');
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--enable-unsafe-swiftshader']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  page.on('console', msg => console.log('PAGE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  console.log('Going to page...');
  await page.goto('http://localhost:8765/test-viewer.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  console.log('Waiting for model to load...');
  try {
    await page.waitForFunction('window.modelLoaded === true', { timeout: 15000 });
    console.log('Model loaded!');
  } catch (e) {
    console.log('Model load timeout - taking screenshot anyway');
  }
  
  // Additional wait for rendering
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Taking screenshot...');
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/3d-test-output.png' });
  console.log('Screenshot saved!');
  
  await browser.close();
  console.log('Done.');
})();
