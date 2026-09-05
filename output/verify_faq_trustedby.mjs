import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

async function verify() {
  const browser = await chromium.launch({ headless: true });

  console.log("--- Testing /trusted-by ---");
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const res = await page.goto("http://localhost:3000/trusted-by", { waitUntil: "load" });
    console.log("Status:", res?.status());
    await page.waitForTimeout(1000);

    const axeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const contrastViolations = axeResults.violations.filter((v) => v.id === "color-contrast");
    console.log("Total Axe Violations on /trusted-by:", axeResults.violations.length);
    console.log("Color contrast violations on /trusted-by:", contrastViolations.length);
    if (contrastViolations.length > 0) {
      console.log(JSON.stringify(contrastViolations, null, 2));
    }
    await page.close();
    await context.close();
  }

  console.log("\n--- Testing /faq Desktop (1440x900) ---");
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    const res = await page.goto("http://localhost:3000/faq", { waitUntil: "load" });
    console.log("Status:", res?.status());
    await page.waitForTimeout(1000);

    const axeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    console.log("Axe violations on /faq:", axeResults.violations.length);
    if (axeResults.violations.length > 0) {
      console.log(JSON.stringify(axeResults.violations.map(v => ({ id: v.id, nodes: v.nodes.length })), null, 2));
    }

    // Check FAQ count
    const cardCount = await page.locator(".faq-card").count();
    console.log("FAQ cards rendered initially:", cardCount);

    // Test Search input
    await page.locator(".faq-search-input").fill("warranty");
    await page.waitForTimeout(300);
    const searchResultCount = await page.locator(".faq-card").count();
    console.log("FAQ cards matching 'warranty':", searchResultCount);

    // Test Clear search
    await page.locator(".faq-search-clear").click();
    await page.waitForTimeout(300);
    const afterClearCount = await page.locator(".faq-card").count();
    console.log("FAQ cards after clear:", afterClearCount);

    // Test Category filter
    const planningPill = page.locator(".faq-category-pill", { hasText: "Planning & Design" });
    await planningPill.click();
    await page.waitForTimeout(300);
    const categoryResultCount = await page.locator(".faq-card").count();
    console.log("FAQ cards in 'Planning & Design':", categoryResultCount);

    // Check console errors
    console.log("Console errors on /faq desktop:", consoleErrors.length);
    await page.screenshot({ path: "output/playwright/live-audit/faq-desktop-elevated.png", fullPage: true });
    await page.close();
    await context.close();
  }

  console.log("\n--- Testing /faq Mobile (390x844) ---");
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    });
    const page = await context.newPage();
    const res = await page.goto("http://localhost:3000/faq", { waitUntil: "load" });
    console.log("Status:", res?.status());
    await page.waitForTimeout(1000);

    const overflow = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    console.log("Mobile 390px overflow check:", overflow);

    await page.screenshot({ path: "output/playwright/live-audit/faq-mobile-elevated.png", fullPage: true });
    await page.close();
    await context.close();
  }

  await browser.close();
  console.log("\nVerification complete!");
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
