const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });
  
  await page.goto('http://localhost:8765/test-viewer.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  
  const views = [
    // In glTF export: Blender Y -> three.js -Z, Blender Z -> three.js Y
    // House spans: X: 0-8.85, Y (Blender): 0-11.75, height: 0-2.8
    // So in three.js: X: 0-8.85, Z: 0 to -11.75, Y: 0-2.8
    { name: 'top', pos: [4, 20, -6], target: [4, 0, -6] },
    { name: 'front', pos: [4, 5, 5], target: [4, 1, -4] },
    { name: 'back', pos: [2, 5, -15], target: [2, 1, -9] },
    { name: 'left', pos: [-8, 5, -6], target: [4, 1, -6] },
    { name: 'right', pos: [16, 5, -6], target: [4, 1, -6] },
    { name: 'corner-se', pos: [-5, 8, 4], target: [2, 0, -4] },
    { name: 'corner-nw', pos: [12, 8, -12], target: [4, 0, -8] },
    { name: 'full-house', pos: [4, 18, 8], target: [4, 0, -6] },
  ];
  
  for (const v of views) {
    await page.evaluate((view) => {
      if (window.camera) {
        window.camera.position.set(...view.pos);
        window.controls.target.set(...view.target);
        window.controls.update();
      }
    }, v);
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: `/home/ubuntu/clawd/projects/shiputz-ai/verify/${v.name}.png` });
  }
  
  await browser.close();
  console.log('Done - 8 views captured');
})();
