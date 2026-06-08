import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:8000/zamow.html")
        await page.wait_for_timeout(1000)

        await page.evaluate("""
            const cartItem = {
              id: `conf-test`,
              title: 'Testowy',
              price: 500,
              config: {}
            };
            document.dispatchEvent(new CustomEvent("cart:add", { detail: cartItem }));
        """)
        await page.wait_for_timeout(500)

        # Screenshot the page
        await page.screenshot(path="verification/screenshots/page_before_cart.png", full_page=True)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
