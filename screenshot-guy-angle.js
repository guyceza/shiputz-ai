const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 800 }); // Vertical like phone
  
  await page.goto('http://localhost:8765/test-viewer.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  
  // Match Guy's angle - looking at interior walls from above-left
  await page.evaluate(() => {
    if (window.camera) {
      window.camera.position.set(-2, 12, 6);
      window.controls.target.set(3, 0, 4);
      window.controls.update();
    }
  });
  
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/guy-angle.png' });
  console.log('Done');
  
  await browser.close();
})();
