import { expect, type Page } from "@playwright/test";

/** Stabilize marketing pages before structural checks and screenshots. */
export async function prepareSiteUiCapture(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => document.fonts.ready);
  await page.addStyleTag({
    content: `
      .footer-logo-marquee,
      a[aria-label="Open WhatsApp quick contact"] {
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `,
  });
  // Force any in-flight entrance animations to their end state. framer-motion v12
  // drives opacity/transform through the Web Animations API; under CPU load the
  // one-shot hero reveal can still be a frame short of settled at capture time,
  // producing a ~1–2px whole-block shift and a flaky diff. Finishing every finite
  // animation makes the captured frame deterministic without an arbitrary sleep.
  await page.evaluate(async () => {
    for (const animation of document.getAnimations()) {
      try {
        // Skip infinite animations (nothing to fast-forward to).
        const effect = animation.effect;
        const timing = effect?.getComputedTiming();
        if (timing && timing.iterations !== Infinity) {
          animation.finish();
        }
      } catch {
        // Non-finite / already-finished animations throw on finish(); ignore.
      }
    }
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  });
}

export async function assertMarketingStructure(page: Page) {
  await expect(page.getByTestId("home-marketing-layout")).toBeVisible();
  await expect(page.locator('[class*="home-section"]').first()).toBeVisible();
  await expect(page.locator(".home-shell-xl").first()).toBeVisible();
}

export const SITE_UI_SCREENSHOT_OPTS = {
  maxDiffPixelRatio: 0.02,
  animations: "disabled" as const,
};
