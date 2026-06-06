const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });
  await page.goto('http://localhost:8000/crm.html');
  await page.waitForTimeout(2000); // Wait for animations
  await page.screenshot({ path: 'screenshot_crm_new.png' });
  await browser.close();
})();
