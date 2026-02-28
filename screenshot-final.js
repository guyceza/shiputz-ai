const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });
  
  await page.goto('http://localhost:8765/test-viewer.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));

  // Get model bounds
  const bounds = await page.evaluate(() => {
    if (window.modelLoaded) {
      return {loaded: true};
    }
    return {loaded: false};
  });
  console.log('Model loaded:', bounds.loaded);

  // View 1: Diagonal view from south-west, high angle - shows exterior + interior
  await page.evaluate(() => {
    window.camera.position.set(-5, 12, -5);
    window.controls.target.set(4, 0, 5);
    window.controls.update();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/screenshots/final-view1-sw.png' });
  console.log('View 1 done');

  // View 2: Diagonal from north-east
  await page.evaluate(() => {
    window.camera.position.set(12, 12, 15);
    window.controls.target.set(4, 0, 5);
    window.controls.update();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/screenshots/final-view2-ne.png' });
  console.log('View 2 done');

  // View 3: Top-down ortho-ish view
  await page.evaluate(() => {
    window.camera.position.set(4, 20, 6);
    window.controls.target.set(4, 0, 6);
    window.controls.update();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/screenshots/final-view3-top.png' });
  console.log('View 3 done');

  // View 4: Closer look at center (where internal walls meet)
  await page.evaluate(() => {
    window.camera.position.set(2, 8, 8);
    window.controls.target.set(4, 0, 4);
    window.controls.update();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/screenshots/final-view4-center.png' });
  console.log('View 4 done');

  // View 5: Front facade
  await page.evaluate(() => {
    window.camera.position.set(4, 3, -5);
    window.controls.target.set(4, 1.4, 3);
    window.controls.update();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/home/ubuntu/clawd/projects/shiputz-ai/screenshots/final-view5-front.png' });
  console.log('View 5 done');

  console.log('All final screenshots done!');
  await browser.close();
})();
