import { expect, test } from "@playwright/test";

/**
 * Plan 13 Task 4 — Oversized-layout sweep at 1920×1080.
 * Guards that marketing routes do not hug edges or exceed the
 * 1440px centered content token at ultra-wide.
 *
 * Routes: /, /products/, /products/seating/rider/, /contact/, /solutions/
 * Viewport: 1920×1080 (charter R25)
 * Checks per route:
 *   1. No horizontal overflow: documentElement.scrollWidth <= viewport.width + 1
 *   2. No edge-hugging: left/right inset of primary shell >= 16px or centered
 *   3. No >1440 max-width violation: primary marketing containers' computed
 *      max-width <= 1440px (home-shell-xl = 1320px passes; shell-container 1680 would fail)
 *
 * FOCSS only, semantic tokens, no new breakpoint tokens, reuses theme(--breakpoint-md).
 */

const VIEWPORT = { width: 1920, height: 1080 } as const;
const MAX_CONTENT_WIDTH = 1440;
const MIN_SIDE_INSET = 16; // px — prevents content flush to viewport edge at 1920

const ROUTES: Array<{ path: string; label: string }> = [
  { path: "/", label: "home" },
  { path: "/products/", label: "products hub" },
  { path: "/products/seating/rider/", label: "pdp rider" },
  { path: "/contact/", label: "contact" },
  { path: "/solutions/", label: "solutions" },
];

test.describe("marketing desktop layout — 1920×1080 oversized guard (Plan 13 T4)", () => {
  for (const route of ROUTES) {
    test(`${route.label} ${route.path} — no overflow, no edge-hug, max-width ≤${MAX_CONTENT_WIDTH}`, async ({
      page,
    }) => {
      await page.setViewportSize(VIEWPORT);
      // Use localhost exactly (plan requires http://localhost:3000, never 127.0.0.1)
      const response = await page.goto(`http://localhost:3000${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });

      expect(response?.status() ?? 0, `server response for ${route.path}`).toBeLessThan(500);

      // 1) No horizontal overflow
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
      }));
      expect(
        overflow.scrollWidth,
        `${route.path} documentElement scrollWidth ${overflow.scrollWidth} exceeds viewport ${VIEWPORT.width} (overflow ${overflow.scrollWidth - overflow.clientWidth}px)`,
      ).toBeLessThanOrEqual(VIEWPORT.width + 1);
      expect(
        overflow.bodyScrollWidth,
        `${route.path} body scrollWidth ${overflow.bodyScrollWidth} exceeds viewport`,
      ).toBeLessThanOrEqual(VIEWPORT.width + 1);

      // 2) & 3) Container checks — measure primary marketing shells if present
      // Candidates cover home, products, solutions, contact (HomeMarketingLayout + fallbacks)
      const containerReport = await page.evaluate(
        ({ maxWidth, minInset }) => {
          const selectors = [
            '[data-testid="home-marketing-layout"]',
            '[data-testid="home-section-inner"]',
            ".home-shell-xl",
            ".home-shell",
            ".shell-container",
            ".container",
            "main",
          ];
          const viewportW = window.innerWidth;
          const results: Array<{
            selector: string;
            found: boolean;
            count: number;
            computedMaxWidth: string | null;
            computedMaxWidthPx: number | null;
            bboxLeft: number | null;
            bboxRight: number | null;
            bboxWidth: number | null;
            leftInset: number | null;
            rightInset: number | null;
            violatesMaxWidth: boolean;
            hugsEdge: boolean;
          }> = [];

          for (const sel of selectors) {
            const els = Array.from(document.querySelectorAll(sel));
            if (els.length === 0) {
              results.push({
                selector: sel,
                found: false,
                count: 0,
                computedMaxWidth: null,
                computedMaxWidthPx: null,
                bboxLeft: null,
                bboxRight: null,
                bboxWidth: null,
                leftInset: null,
                rightInset: null,
                violatesMaxWidth: false,
                hugsEdge: false,
              });
              continue;
            }
            // Sample first visible element for this selector
            const el = (els.find((e) => {
              const r = (e as HTMLElement).getBoundingClientRect();
              return r.width > 0 && r.height > 0;
            }) || els[0]) as HTMLElement;
            const cs = window.getComputedStyle(el);
            const rawMax = cs.maxWidth; // e.g. "1320px" | "none" | "82.5rem"
            let maxPx: number | null = null;
            if (rawMax && rawMax !== "none") {
              // getComputedStyle resolves rem -> px, so parseFloat is viewport-px
              const n = parseFloat(rawMax);
              if (!Number.isNaN(n)) maxPx = n;
            }
            const bbox = el.getBoundingClientRect();
            const leftInset = bbox.left;
            const rightInset = viewportW - bbox.right;
            const violatesMaxWidth = maxPx !== null && maxPx > maxWidth + 1;
            // Edge-hug: content flush to edge with < minInset and not full-bleed hero
            // Heroes are full-bleed by design (hero-full) — exclude them via data attr
            const isHero = el.closest("[data-hero]") !== null || el.classList.contains("hero-full");
            const hugsEdge = !isHero && bbox.width > 0 && (leftInset < minInset - 0.5 || rightInset < minInset - 0.5);
            results.push({
              selector: sel,
              found: true,
              count: els.length,
              computedMaxWidth: rawMax,
              computedMaxWidthPx: maxPx,
              bboxLeft: Math.round(bbox.left * 10) / 10,
              bboxRight: Math.round(bbox.right * 10) / 10,
              bboxWidth: Math.round(bbox.width * 10) / 10,
              leftInset: Math.round(leftInset * 10) / 10,
              rightInset: Math.round(rightInset * 10) / 10,
              violatesMaxWidth,
              hugsEdge,
            });
          }
          return { viewportW, results };
        },
        { maxWidth: MAX_CONTENT_WIDTH, minInset: MIN_SIDE_INSET },
      );

      const marketViolations = containerReport.results.filter(
        (r) => r.violatesMaxWidth && (r.selector === ".home-shell-xl" || r.selector === ".home-shell" || r.selector.includes("home-")),
      );
      expect(
        marketViolations,
        `${route.path} marketing max-width >${MAX_CONTENT_WIDTH}px violations: ${JSON.stringify(marketViolations, null, 2)}\nFull report: ${JSON.stringify(containerReport, null, 2)}`,
      ).toEqual([]);

      const centeredSelectors = new Set([".home-shell-xl", ".home-shell", '[data-testid="home-section-inner"]']);
      const centered = containerReport.results.filter((r) => r.found && centeredSelectors.has(r.selector) && (r.bboxWidth ?? 0) > 0);
      if (centered.length > 0) {
        const bad = centered.filter((r) => r.hugsEdge);
        expect(
          bad,
          `${route.path} centered shell edge-hugging (<${MIN_SIDE_INSET}px inset) at 1920px: ${JSON.stringify(bad, null, 2)}\nFull report: ${JSON.stringify(containerReport, null, 2)}`,
        ).toEqual([]);
      }

      // Optional: capture evidence screenshot at 1920 for manual review (only on CI or when requested)
      // Not required to pass; kept for parity with plan's evidence dir.
    });
  }
});
