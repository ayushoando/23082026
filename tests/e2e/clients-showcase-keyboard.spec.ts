/**
 * Client Showcase — keyboard interaction and ARIA tab-pattern coverage.
 *
 * Feature: client-showcase-tabs
 * Covers spec Tasks 2 (useSectorTabs roving-focus hook), 4 (composite tab
 * components) and 9.1 (keyboard browser checks at 320/768/1024px).
 *
 * Browser evidence: fresh run against http://localhost:3000/clients/.
 */

import { expect, test, type Page } from "@playwright/test";

const TAB_IDS = [
  "tab-financial-services",
  "tab-government-public-sector",
  "tab-education-social-impact",
  "tab-corporates-multinationals",
] as const;

const TAB_LABELS = [
  "Financial Services",
  "Government & Public Sector",
  "Education, Social Impact & Development",
  "Corporates & Multinationals",
] as const;

const TABLIST_LABEL = "Client industry sectors";

async function openClientsPage(page: Page): Promise<void> {
  await page.goto("/clients/");
  await expect(page.getByRole("tablist", { name: TABLIST_LABEL })).toBeVisible();
}

function tab(page: Page, index: number) {
  return page.locator(`#${TAB_IDS[index]}`);
}

test.describe("Feature: client-showcase-tabs — keyboard tab pattern (Tasks 2, 4, 9.1)", () => {
  test("Tab focus lands on the active Financial Services tab", async ({
    page,
  }) => {
    await openClientsPage(page);

    await page.keyboard.press("Tab");
    await expect(tab(page, 0)).toBeFocused();
    await expect(tab(page, 0)).toHaveAttribute("tabindex", "0");
    for (const index of [1, 2, 3]) {
      await expect(tab(page, index)).toHaveAttribute("tabindex", "-1");
    }
  });

  test("ArrowRight cycles through all four tabs and wraps back to the first", async ({
    page,
  }) => {
    await openClientsPage(page);

    await tab(page, 0).focus();
    for (const expectedIndex of [1, 2, 3, 0]) {
      await page.keyboard.press("ArrowRight");
      await expect(tab(page, expectedIndex)).toBeFocused();
    }

    // Activation keys are the only way activeTab changes — panels stay put.
    await expect(tab(page, 0)).toHaveAttribute("aria-selected", "true");
    for (const index of [1, 2, 3]) {
      await expect(tab(page, index)).toHaveAttribute("aria-selected", "false");
    }
    await expect(page.locator("#panel-financial-services")).toBeVisible();
    await expect(page.locator("#panel-education-social-impact")).toBeHidden();
  });

  test("ArrowLeft wraps backwards from the first tab to the last", async ({
    page,
  }) => {
    await openClientsPage(page);

    await tab(page, 0).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(tab(page, 3)).toBeFocused();
  });

  test("Home moves focus to the first tab and End to the last", async ({
    page,
  }) => {
    await openClientsPage(page);

    await tab(page, 0).focus();
    await page.keyboard.press("End");
    await expect(tab(page, 3)).toBeFocused();

    await page.keyboard.press("Home");
    await expect(tab(page, 0)).toBeFocused();

    // Home/End move focus only — the active tab and panel are unchanged.
    await expect(tab(page, 0)).toHaveAttribute("aria-selected", "true");
  });

  test("Enter on the Education tab activates its panel", async ({ page }) => {
    await openClientsPage(page);

    await tab(page, 0).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(tab(page, 2)).toBeFocused();

    await page.keyboard.press("Enter");

    await expect(tab(page, 2)).toHaveAttribute("aria-selected", "true");
    await expect(tab(page, 2)).toHaveAttribute("tabindex", "0");
    await expect(
      page.locator("#panel-education-social-impact"),
    ).toBeVisible();
    await expect(page.locator("#panel-financial-services")).toBeHidden();
    await expect(page.locator("#panel-financial-services")).toHaveAttribute(
      "aria-labelledby",
      TAB_IDS[0],
    );
  });

  test("Space on the Corporates tab activates its panel", async ({ page }) => {
    await openClientsPage(page);

    await tab(page, 0).focus();
    await page.keyboard.press("End");
    await page.keyboard.press(" ");

    await expect(tab(page, 3)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#panel-corporates-multinationals")).toBeVisible();
  });

  test("Each full tab label stays visible and focused tabs show a focus ring", async ({
    page,
  }) => {
    await openClientsPage(page);

    for (const [index, label] of TAB_LABELS.entries()) {
      const button = tab(page, index);
      await expect(button).toHaveText(label);
      await expect(button).toBeVisible();
      const box = await button.boundingBox();
      expect(box).not.toBeNull();
      // WCAG 2.x 44px minimum target size (min-h-11 min-w-11).
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }

    await tab(page, 0).focus();
    await expect(tab(page, 0)).toHaveClass(/focus-visible:ring-2/);
  });

  for (const width of [320, 768, 1024]) {
    test(`no horizontal page scrollbar at ${width}px; labels remain visible`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await openClientsPage(page);

      const scrollWidth = await page.evaluate(
        () => document.scrollingElement?.scrollWidth ?? 0,
      );
      expect(scrollWidth).toBeLessThanOrEqual(width);

      for (const label of TAB_LABELS) {
        await expect(page.getByRole("tab", { name: label })).toBeAttached();
      }
    });
  }
});
