/**
 * Homepage hero — typography + copy/glass alignment across viewports.
 */
import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const EVIDENCE = path.join(process.cwd(), "..", "results", "screenshots", "home-hero-audit");

type HeroMetrics = {
  titleFontPx: number;
  titleCenterX: number;
  copyCenterX: number;
  glassCenterX: number;
  copyGlassDeltaPx: number;
  mobileTabVisible: boolean;
  mobileAppBarVisible: boolean;
  scrollMainScrollHeight: number;
  scrollMainClientHeight: number;
};

async function heroMetrics(page: import("@playwright/test").Page): Promise<HeroMetrics> {
  return page.evaluate(() => {
    const title = document.querySelector("#home-hero-heading");
    const copy = document.querySelector(".home-hero__copy");
    const glass = document.querySelector(".home-hero-glass-stack");
    const main = document.querySelector(".mobile-app-main");
    const tab = document.querySelector(".mobile-tab-bar");
    const appBar = document.querySelector(".mobile-app-bar");

    const centerX = (el: Element | null) => {
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      return r.left + r.width / 2;
    };

    const titleFontPx = title
      ? parseFloat(getComputedStyle(title).fontSize)
      : 0;

    const copyCx = centerX(copy);
    const glassCx = centerX(glass);

    return {
      titleFontPx,
      titleCenterX: centerX(title),
      copyCenterX: copyCx,
      glassCenterX: glassCx,
      copyGlassDeltaPx: Math.abs(copyCx - glassCx),
      mobileTabVisible: tab ? getComputedStyle(tab).display !== "none" : false,
      mobileAppBarVisible: appBar ? getComputedStyle(appBar).display !== "none" : false,
      scrollMainScrollHeight: main?.scrollHeight ?? document.documentElement.scrollHeight,
      scrollMainClientHeight: main?.clientHeight ?? window.innerHeight,
    };
  });
}

const VIEWPORTS = [
  { name: "iphone-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 800 },
] as const;

for (const vp of VIEWPORTS) {
  test.describe(`home hero layout — ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("metrics, scroll, screenshot", async ({ page }) => {
      fs.mkdirSync(EVIDENCE, { recursive: true });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.locator("#home-hero").waitFor({ state: "visible" });

      const before = await heroMetrics(page);
      const shotPath = path.join(EVIDENCE, `${vp.name}-hero-top.png`);
      await page.screenshot({ path: shotPath, fullPage: false });

      if (vp.width < 768) {
        expect(before.mobileAppBarVisible, "phone app bar").toBe(true);
        expect(before.mobileTabVisible, "phone tab dock").toBe(true);
        expect(before.titleFontPx, "title not tiny on phone").toBeGreaterThanOrEqual(40);
        expect(before.copyGlassDeltaPx, "copy vs glass center axis").toBeLessThan(4);

        const main = page.locator(".mobile-app-main");
        await main.evaluate((el) => {
          el.scrollTop = 400;
        });
        const afterScroll = await main.evaluate((el) => el.scrollTop);
        expect(afterScroll, "mobile main scrolls").toBeGreaterThan(100);
      } else if (vp.width < 1280) {
        expect(before.titleFontPx).toBeGreaterThanOrEqual(44);
        expect(before.copyGlassDeltaPx).toBeLessThan(6);
      } else {
        expect(before.titleFontPx).toBeGreaterThanOrEqual(48);
      }

      const scrollable = await page.evaluate(() => {
        const main = document.querySelector(".mobile-app-main");
        const docScroll =
          document.documentElement.scrollHeight > window.innerHeight + 1;
        const mainScroll = main
          ? main.scrollHeight > main.clientHeight + 1
          : false;
        return docScroll || mainScroll;
      });
      expect(scrollable, "page content scrolls").toBe(true);

      await page.screenshot({
        path: path.join(EVIDENCE, `${vp.name}-full.png`),
        fullPage: true,
      });
    });
  });
}
