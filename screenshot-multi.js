const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });
  
  await page.goto('http://localhost:8765/test-viewer.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000)); // Wait for model to load

  // View 1: Top-down overview
  await page.evaluate(() => {
    if (window.camera) {
      window.camera.position.set(4, 18, 6);
      window.controls.target.set(4, 0, 4);
      window.controls.update();
    }
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/screenshots/view1-top.png' });
  console.log('View 1 done');

  // View 2: Side angle - living room area
  await page.evaluate(() => {
    if (window.camera) {
      window.camera.position.set(-2, 3, 6);
      window.controls.target.set(2, 1.2, 5);
      window.controls.update();
    }
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/screenshots/view2-side.png' });
  console.log('View 2 done');

  // View 3: Close-up on internal wall (bedroom/bathroom area)
  await page.evaluate(() => {
    if (window.camera) {
      window.camera.position.set(1.5, 2, 3.5);
      window.controls.target.set(2, 1.2, 2.8);
      window.controls.update();
    }
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/screenshots/view3-internal-wall.png' });
  console.log('View 3 done');

  // View 4: Looking at doors - hallway area
  await page.evaluate(() => {
    if (window.camera) {
      window.camera.position.set(4.5, 2, 5);
      window.controls.target.set(3.5, 1.2, 4.5);
      window.controls.update();
    }
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/screenshots/view4-doors.png' });
  console.log('View 4 done');

  // View 5: Isometric corner view
  await page.evaluate(() => {
    if (window.camera) {
      window.camera.position.set(12, 10, 14);
      window.controls.target.set(4, 0, 5);
      window.controls.update();
    }
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/screenshots/view5-isometric.png' });
  console.log('View 5 done');

  console.log('All screenshots saved!');
  await browser.close();
})();
