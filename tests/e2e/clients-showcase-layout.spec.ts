import { test, expect, type Page } from "@playwright/test";

/**
 * plans/client-showcase-tabs task 9.2 — layout integrity of the sector
 * showcase across the full responsive range (P14).
 */

const SHOWCASE = 'section[aria-labelledby="clients-showcase-heading"]';

const WIDTHS = [320, 768, 1280, 1440, 1920] as const;

async function gotoClients(page: Page) {
  await page.goto("/clients", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(`${SHOWCASE} [role="tablist"]`)).toBeVisible();
}

for (const width of WIDTHS) {
  test.describe(`Client showcase layout @ ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("the page has no horizontal scrollbar", async ({ page }) => {
      await gotoClients(page);
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
    });

    test("the section content is horizontally centered", async ({ page }) => {
      await gotoClients(page);
      const geometry = await page
        .locator(`${SHOWCASE} .shell-container`)
        .first()
        .evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return {
            left: rect.left,
            rightGap: window.innerWidth - rect.right,
          };
        });
      expect(Math.abs(geometry.left - geometry.rightGap)).toBeLessThanOrEqual(1);
    });

    test("no card or tab overflows the section container", async ({ page }) => {
      await gotoClients(page);
      const overflow = await page.evaluate((selector) => {
        const container = document.querySelector(`${selector} .shell-container`);
        if (!container) return ["missing container"];
        const bounds = container.getBoundingClientRect();
        const offenders: string[] = [];
        const outside = (rect: DOMRect, limit: DOMRect) =>
          rect.right > limit.right + 1 || rect.left < limit.left - 1;
        const strip = container.querySelector<HTMLElement>(".clients-showcase__tabs");
        // Below the 48rem breakpoint the tab strip is an intentional
        // scroll row (clients-showcase.css: overflow-x auto + scroll-snap),
        // so individual tabs legitimately extend past the container as long
        // as the strip itself fits. At wrap widths tabs must stay inside.
        const stripScrolls =
          !!strip &&
          ["auto", "scroll"].includes(getComputedStyle(strip).overflowX) &&
          strip.scrollWidth > strip.clientWidth + 1;
        if (strip && !stripScrolls && outside(strip.getBoundingClientRect(), bounds)) {
          offenders.push("tab strip overflows container");
        }
        container.querySelectorAll("article").forEach((element) => {
          const rect = element.getBoundingClientRect();
          if (rect.width === 0) return; // hidden panels report zero width
          if (outside(rect, bounds)) {
            offenders.push(element.textContent?.slice(0, 40) ?? "?");
          }
        });
        if (!stripScrolls) {
          container.querySelectorAll('[role="tab"]').forEach((element) => {
            const rect = element.getBoundingClientRect();
            if (rect.width === 0) return;
            if (outside(rect, bounds)) {
              offenders.push(element.textContent?.slice(0, 40) ?? "?");
            }
          });
        }
        return offenders;
      }, SHOWCASE);
      expect(overflow).toEqual([]);
    });

    test("the auto-sizing grid grows column count with the viewport", async ({ page }) => {
      await gotoClients(page);
      const columns = await page.evaluate((selector) => {
        const panel = document.querySelector(
          `${selector} [role="tabpanel"]:not([hidden])`,
        );
        const grid = panel?.querySelector<HTMLElement>(".clients-showcase__grid");
        if (!grid) return 0;
        return getComputedStyle(grid).gridTemplateColumns.split(" ").length;
      }, SHOWCASE);

      if (width >= 1280) {
        expect(columns).toBeGreaterThanOrEqual(5);
      } else {
        expect(columns).toBeGreaterThanOrEqual(1);
      }
      test.info().annotations.push({
        type: "showcase-columns",
        description: `${width}px → ${columns} columns`,
      });
    });
  });
}

test.describe("Client showcase grid grows monotonically", () => {
  test("column count at 1920px is not smaller than at 768px", async ({ page }) => {
    const columnsAt = async (width: number) => {
      await page.setViewportSize({ width, height: 900 });
      await gotoClients(page);
      return page.evaluate((selector) => {
        const panel = document.querySelector(
          `${selector} [role="tabpanel"]:not([hidden])`,
        );
        const grid = panel?.querySelector<HTMLElement>(".clients-showcase__grid");
        if (!grid) return 0;
        return getComputedStyle(grid).gridTemplateColumns.split(" ").length;
      }, SHOWCASE);
    };

    const narrow = await columnsAt(768);
    const wide = await columnsAt(1920);
    expect(wide).toBeGreaterThanOrEqual(narrow);
  });
});
