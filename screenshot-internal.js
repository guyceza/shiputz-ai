const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });
  
  await page.goto('http://localhost:8765/test-viewer.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000)); // Wait for model to load

  // View 1: Full house from high angle
  await page.evaluate(() => {
    if (window.camera) {
      window.camera.position.set(4, 15, 12);
      window.controls.target.set(4, 0, 5);
      window.controls.update();
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/screenshots/full-house-high.png' });
  console.log('Full house high angle done');

  // View 2: Inside bedroom looking at door wall (internal wall with door)
  // bedroom_1 is at (0,0) to (3.55, 2.8), door on back wall
  await page.evaluate(() => {
    if (window.camera) {
      window.camera.position.set(1.8, 1.5, 1.2);  // Inside bedroom
      window.controls.target.set(1.8, 1.5, 2.8);  // Looking at back wall
      window.controls.update();
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/screenshots/bedroom-door-wall.png' });
  console.log('Bedroom door wall done');

  // View 3: Hallway area looking at multiple doors
  // Living room at (0, 4.5), hallway at (3.7, 5.65)
  await page.evaluate(() => {
    if (window.camera) {
      window.camera.position.set(3, 1.5, 5);  // In hallway area
      window.controls.target.set(2, 1.5, 4.5);  // Looking at living room door
      window.controls.update();
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/screenshots/hallway-doors.png' });
  console.log('Hallway doors done');

  // View 4: Kitchen looking at interior wall with door
  // Kitchen at (3.55, 0) to (7.65, 3.3)
  await page.evaluate(() => {
    if (window.camera) {
      window.camera.position.set(5.5, 1.5, 1.5);  // Inside kitchen
      window.controls.target.set(4.5, 1.5, 3.3);  // Looking at back wall with door
      window.controls.update();
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/screenshots/kitchen-door-wall.png' });
  console.log('Kitchen door wall done');

  // View 5: Close-up from outside looking into a room through door
  await page.evaluate(() => {
    if (window.camera) {
      window.camera.position.set(2, 1.5, 3.5);  // Just outside bathroom
      window.controls.target.set(1.2, 1.5, 3.2);  // Looking into bathroom
      window.controls.update();
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/screenshots/bathroom-entrance.png' });
  console.log('Bathroom entrance done');

  // View 6: Low angle showing internal wall tops (where z-fighting usually shows)
  await page.evaluate(() => {
    if (window.camera) {
      window.camera.position.set(4, 3.5, 3);
      window.controls.target.set(3, 1.5, 3.5);
      window.controls.update();
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/screenshots/internal-walls-angle.png' });
  console.log('Internal walls angle done');

  console.log('All internal screenshots saved!');
  await browser.close();
})();
