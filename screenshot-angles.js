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
  
  // Take screenshot from different angles by moving camera
  const angles = [
    { name: 'top-down', x: 4, y: 20, z: 4, targetY: 0 },
    { name: 'front', x: 4, y: 5, z: 15, targetY: 1.4 },
    { name: 'side-left', x: -10, y: 5, z: 4, targetY: 1.4 },
    { name: 'closeup', x: 2, y: 3, z: 5, targetY: 1.4 }
  ];
  
  for (const angle of angles) {
    await page.evaluate((a) => {
      if (window.camera) {
        window.camera.position.set(a.x, a.y, a.z);
        window.controls.target.set(4, a.targetY, 4);
        window.controls.update();
      }
    }, angle);
    
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `/home/ubuntu/clawd/projects/shiputz-ai/angle-${angle.name}.png` });
    console.log(`Saved angle-${angle.name}.png`);
  }
  
  await browser.close();
  console.log('Done!');
})();
