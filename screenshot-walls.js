const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  await page.goto('http://localhost:8765/test-viewer.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  
  // Same angle as Guy's screenshot - looking down at interior walls
  await page.evaluate(() => {
    if (window.camera) {
      // Position similar to Guy's view
      window.camera.position.set(1, 8, 8);
      window.controls.target.set(2, 0, 3);
      window.controls.update();
    }
  });
  
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/wall-check.png' });
  console.log('Saved wall-check.png');
  
  await browser.close();
})();
