const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 600, height: 900 });
  
  await page.goto('http://localhost:8765/test-viewer.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  
  // Top-down view of the whole house (like Guy's screenshot)
  await page.evaluate(() => {
    if (window.camera) {
      window.camera.position.set(4, 18, 4);
      window.controls.target.set(4, 0, 4);
      window.controls.update();
    }
  });
  
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/top-view.png' });
  console.log('Done');
  
  await browser.close();
})();
