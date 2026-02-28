const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  await page.goto('http://localhost:8765/test-viewer.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));
  
  // Interior view - looking at walls from inside
  await page.evaluate(() => {
    if (window.camera) {
      // Position inside living room looking at interior walls
      window.camera.position.set(2, 1.5, 6);
      window.controls.target.set(4, 1.4, 3);
      window.controls.update();
    }
  });
  
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/interior-check.png' });
  console.log('Saved interior-check.png');
  
  // Another angle - side wall
  await page.evaluate(() => {
    if (window.camera) {
      window.camera.position.set(1, 1.5, 4);
      window.controls.target.set(3.5, 1.4, 4);
      window.controls.update();
    }
  });
  
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/interior-wall.png' });
  console.log('Saved interior-wall.png');
  
  await browser.close();
  console.log('Done!');
})();
