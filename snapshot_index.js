const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8000/index.html');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'index_screenshot.png' });
  await browser.close();
})();
