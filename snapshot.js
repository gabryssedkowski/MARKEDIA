const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8000/crm.html');
  // wait a bit for js to render
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'crm_screenshot.png', fullPage: true });
  await browser.close();
})();
