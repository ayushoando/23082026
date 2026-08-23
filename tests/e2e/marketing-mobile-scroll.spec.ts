import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/products/",
  "/products/seating/",
  "/contact/",
  "/solutions/",
  "/showrooms/",
  "/trusted-by/",
  "/sitemap/",
];

for (const route of routes) {
  for (const vp of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
  ] as const) {
    test(`no horizontal scroll: ${route} @${vp.width}`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto(`http://localhost:3000${route}`, {
        waitUntil: "domcontentloaded",
      });
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
}
