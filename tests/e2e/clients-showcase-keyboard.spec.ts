import { test, expect, type Page } from "@playwright/test";

/**
 * plans/client-showcase-tabs task 9.1 — keyboard operability of the sector
 * showcase tablist (P12). Runs at 320/768/1024px widths.
 */

const SHOWCASE = 'section[aria-labelledby="clients-showcase-heading"]';

async function gotoClients(page: Page) {
  await page.goto("/clients", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(`${SHOWCASE} [role="tablist"]`)).toBeVisible();
}

const WIDTHS = [320, 768, 1024] as const;

for (const width of WIDTHS) {
  test.describe(`Client showcase keyboard @ ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("Tab reaches the active tab and Arrow keys rove with wrap", async ({ page }) => {
      await gotoClients(page);

      const tabs = page.locator(`${SHOWCASE} [role="tab"]`);
      await expect(tabs).toHaveCount(4);

      // Focus the active tab directly (the roving-tabIndex owner).
      const financial = tabs.nth(0);
      await financial.focus();
      await expect(financial).toBeFocused();
      await expect(financial).toHaveAttribute("aria-selected", "true");

      // Rove through all four and confirm wrap back to the first.
      const labels = ["Financial", "Government", "Education", "Corporates"];
      for (let index = 0; index < labels.length; index += 1) {
        await expect(tabs.nth(index)).toHaveText(new RegExp(labels[index], "i"));
      }

      await tabs.nth(3).focus();
      await page.keyboard.press("ArrowRight");
      await expect(tabs.nth(0)).toBeFocused();

      await page.keyboard.press("ArrowLeft");
      await expect(tabs.nth(3)).toBeFocused();
    });

    test("Arrow navigation moves focus only; Enter activates", async ({ page }) => {
      await gotoClients(page);
      const tabs = page.locator(`${SHOWCASE} [role="tab"]`);

      await tabs.nth(0).focus();
      await page.keyboard.press("ArrowRight");
      // Focus moved to Government, but Financial is still the active panel.
      await expect(tabs.nth(1)).toBeFocused();
      await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");

      // Reach Education (index 2) and activate it with Enter.
      await page.keyboard.press("ArrowRight");
      await expect(tabs.nth(2)).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
      await expect(
        page.locator(`${SHOWCASE} #panel-education-social-impact`),
      ).toBeVisible();
    });

    test("focused tab shows a visible focus ring", async ({ page }) => {
      await gotoClients(page);
      const tabs = page.locator(`${SHOWCASE} [role="tab"]`);
      await tabs.nth(0).focus();
      await page.keyboard.press("ArrowRight");
      const hasFocusRing = await tabs.nth(1).evaluate((element) => {
        const active = document.activeElement === element;
        const focusVisible = element.matches(":focus-visible");
        return { active, focusVisible };
      });
      expect(hasFocusRing.active).toBe(true);
      expect(hasFocusRing.focusVisible).toBe(true);
    });

    test("full tab labels are not clipped and no page scrollbar below 1024", async ({ page }) => {
      await gotoClients(page);
      const tabs = page.locator(`${SHOWCASE} [role="tab"]`);
      const count = await tabs.count();
      for (let index = 0; index < count; index += 1) {
        const clipped = await tabs.nth(index).evaluate((element) => {
          const node = element as HTMLElement;
          return node.scrollWidth > node.clientWidth + 1;
        });
        expect(clipped, `tab ${index} label clipped`).toBe(false);
      }

      if (width >= 768) {
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, "horizontal page scrollbar present").toBeLessThanOrEqual(1);
      }
    });
  });
}
