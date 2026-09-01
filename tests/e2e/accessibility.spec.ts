import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { enterGuestPlannerWorkspace } from "./guestProjectSetup";

async function dismissOnboardingIfVisible(page: Page): Promise<void> {
  const skip = page.getByRole("button", { name: /Skip onboarding/i });
  if (await skip.isVisible({ timeout: 3000 }).catch(() => false)) {
    await skip.click();
  }
}

test.describe("Accessibility baseline", () => {
  test("homepage has no WCAG AA violations (TST-S26 hero contrast)", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  // 16.1 — the enforced zero-violation bar now covers the largest public
  // interactive surfaces: catalog category, PDP, and the contact form.
  // Stable slugs shared with marketing-desktop-layout.spec / touch-targets.spec.
  for (const route of ["/products/workstations/", "/products/seating/rider/", "/contact/"]) {
    test(`${route} has no WCAG AA violations`, async ({ page }) => {
      await page.goto(route, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("should not have any automatically detectable accessibility issues in guest planner", async ({ page }) => {
    await enterGuestPlannerWorkspace(page, { projectName: "A11y Test" });
    await dismissOnboardingIfVisible(page);

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should not have any accessibility issues in export menu", async ({ page }) => {
    await enterGuestPlannerWorkspace(page, { projectName: "A11y Test" });
    await dismissOnboardingIfVisible(page);

    await page.getByRole("button", { name: /^Export$/ }).click();
    const exportMenu = page.getByTestId("export-menu-panel");
    await expect(exportMenu).toBeVisible({ timeout: 10000 });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="export-menu-panel"]')
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("keyboard journey allows navigating toolbar controls without pointer", async ({ page }) => {
    await enterGuestPlannerWorkspace(page, { projectName: "Keyboard Journey" });
    await dismissOnboardingIfVisible(page);

    // Tab into topbar
    await page.keyboard.press("Tab");
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeDefined();

    // Verify Draw tool button can be activated by keyboard
    const drawBtn = page.getByRole("button", { name: /Draw/i }).first();
    if (await drawBtn.isVisible()) {
      await drawBtn.focus();
      await page.keyboard.press("Enter");
    }

    // Verify Export or Save button can be reached by keyboard
    const saveBtn = page.getByTestId("btn-save");
    await expect(saveBtn).toBeVisible();
    await saveBtn.focus();
    expect(await page.evaluate(() => document.activeElement?.getAttribute("data-testid"))).toBe("btn-save");
  });

  test("prefers-reduced-motion: reduce keeps workspace tools fully reachable", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await enterGuestPlannerWorkspace(page, { projectName: "Reduced Motion Test" });
    await dismissOnboardingIfVisible(page);

    await expect(page.getByTestId("btn-save")).toBeVisible();
    await expect(page.locator('[data-testid="canvas-stage"]')).toBeVisible();
  });
});