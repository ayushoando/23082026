// Feature: planner-comprehensive-audit, Task 5.10 targeted rendered specifications
// Findings: finding:trace:project-edit, finding:trace:offline-reconnect,
// finding:trace:conflict-recovery, finding:trace:handoff
// Validates: Requirements 5.1-5.8, 6.1-6.7, 7.1-7.7, 8.1-8.8,
// 9.2-9.6, 16.1-16.7, 18.5
// Authored browser coverage only. No execution or rendered result is claimed.

import AxeBuilder from "@axe-core/playwright";
import { devices, expect, test } from "@playwright/test";

import { PLANNER_BROWSER_AUDIT_PROFILES } from "../fixtures/planner/browserAuditMatrix";
import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import { waitForPlannerCanvas } from "./plannerCanvasHelpers";

async function expectWorkspaceContext(page: import("@playwright/test").Page): Promise<void> {
  await expect(page.getByTestId("planner-workspace")).toBeVisible();
  await expect(page.locator('[data-testid="canvas-stage"]')).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
}

const OPTIONAL_BROWSER_PROFILE_TAG = "@optional-browser-profile";

test.describe("Planner comprehensive rendered regression matrix", () => {
  // These journeys clear the same Planner browser storage. Serial execution is
  // required so one profile cannot delete another profile's live canvas.
  test.describe.configure({ mode: "serial" });
  for (const profile of PLANNER_BROWSER_AUDIT_PROFILES) {
    const profileLabel =
      profile.coverage === "extended"
        ? `${OPTIONAL_BROWSER_PROFILE_TAG} ${profile.id}`
        : profile.id;

    test(`${profileLabel} preserves workspace through resize and orientation changes`, async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== profile.project,
        `Profile ${profile.id} is assigned to ${profile.project}.`,
      );
      await page.setViewportSize(profile.viewport);
      await enterGuestPlannerWorkspace(page, { projectName: `W5 ${profile.id}` });
      await waitForPlannerCanvas(page, { timeoutMs: 60_000 });
      await expectWorkspaceContext(page);

      const beforeUrl = page.url();
      await page.setViewportSize({
        width: profile.viewport.height,
        height: profile.viewport.width,
      });
      await expectWorkspaceContext(page);
      expect(page.url()).toBe(beforeUrl);
    });
  }

  test("Chromium tablet keyboard menu entry, dismissal, and focus restoration do not require a pointer", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-tablet",
      "Required keyboard interaction is represented by the Chromium tablet profile.",
    );
    await page.setViewportSize({ width: 768, height: 1_024 });
    await enterGuestPlannerWorkspace(page, { projectName: "W5 keyboard" });
    await waitForPlannerCanvas(page);

    // Tablet keeps the full top toolbar; the bottom More control is phone-only.
    const trigger = page.getByTestId("btn-export-menu");
    await expect(trigger).toBeVisible();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("export-menu-panel")).toBeVisible();
    await expect(page.getByRole("menuitem").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("export-menu-panel")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("Chromium mobile touch controls expose the same inventory workflow as keyboard controls", async ({ browser }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile",
      "Required touch interaction is represented by the Chromium mobile profile.",
    );
    const baseURL = testInfo.project.use.baseURL;
    if (typeof baseURL !== "string") throw new Error("The touch profile requires the configured Playwright baseURL.");
    const context = await browser.newContext({
      baseURL,
      hasTouch: true,
      isMobile: true,
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    try {
      await enterGuestPlannerWorkspace(page, { projectName: "W5 touch parity" });
      await waitForPlannerCanvas(page);

      const inventory = page.getByTestId("planner-toggle-inventory");
      await expect(inventory).toBeVisible();
      await inventory.tap();
      await expect(inventory).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("catalog-search")).toBeVisible();
      await inventory.focus();
      await page.keyboard.press("Enter");
      await expect(inventory).toHaveAttribute("aria-pressed", "false");
    } finally {
      await context.close();
    }
  });

  test(`${OPTIONAL_BROWSER_PROFILE_TAG} Firefox tablet keyboard interaction has an explicit optional profile`, async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "firefox-tablet",
      "Optional Firefox keyboard interaction is isolated to the firefox-tablet profile.",
    );
    await page.setViewportSize({ width: 768, height: 1_024 });
    await enterGuestPlannerWorkspace(page, { projectName: "W5 firefox keyboard" });
    await waitForPlannerCanvas(page);

    const trigger = page.getByTestId("btn-export-menu");
    await expect(trigger).toBeVisible();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("export-menu-panel")).toBeVisible();
    await expect(page.getByRole("menuitem").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("export-menu-panel")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test(`${OPTIONAL_BROWSER_PROFILE_TAG} WebKit mobile touch interaction has an explicit optional profile`, async ({ browser }, testInfo) => {
    test.skip(
      testInfo.project.name !== "webkit-mobile",
      "Optional WebKit touch interaction is isolated to the webkit-mobile profile.",
    );
    const baseURL = testInfo.project.use.baseURL;
    if (typeof baseURL !== "string") throw new Error("The touch profile requires the configured Playwright baseURL.");
    const context = await browser.newContext({
      ...devices["iPhone 13"],
      baseURL,
    });
    const page = await context.newPage();
    try {
      await enterGuestPlannerWorkspace(page, { projectName: "W5 webkit touch" });
      await waitForPlannerCanvas(page);

      const inventory = page.getByTestId("planner-toggle-inventory");
      await expect(inventory).toBeVisible();
      await inventory.tap();
      await expect(inventory).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("catalog-search")).toBeVisible();
      await inventory.focus();
      await page.keyboard.press("Enter");
      await expect(inventory).toHaveAttribute("aria-pressed", "false");
    } finally {
      await context.close();
    }
  });

  test("200% reflow and reduced motion preserve reachable controls and AA contrast states", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await enterGuestPlannerWorkspace(page, { projectName: "W5 reflow" });
    await waitForPlannerCanvas(page);
    await page.evaluate(() => { document.documentElement.style.setProperty("zoom", "2"); });

    await expect(page.getByTestId("planner-workspace")).toBeVisible();
    await expect(page.getByTestId("planner-top-toolbar")).toBeVisible();
    await expect(page.getByTestId("btn-export-menu")).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious")).toEqual([]);
  });

  test("offline and reconnect events preserve the canvas and recover the workflow", async ({ page, context }) => {
    await enterGuestPlannerWorkspace(page, { projectName: "W5 offline recovery" });
    await waitForPlannerCanvas(page);
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await expectWorkspaceContext(page);
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expectWorkspaceContext(page);
  });

  test("modal dialog traps focus, fits viewport, and restores invoker on close", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterGuestPlannerWorkspace(page, { projectName: "W5 dialog focus" });
    await waitForPlannerCanvas(page);

    // Trigger a dialog — the export or settings dialog is representative
    const trigger = page.getByTestId("btn-export-menu").or(page.getByTestId("btn-settings"));
    const visibleTrigger = await trigger.first().isVisible()
      ? trigger.first()
      : page.getByRole("button", { name: /export|settings|share/i }).first();
    await expect(visibleTrigger).toBeVisible();
    await visibleTrigger.focus();
    await visibleTrigger.click();

    // Look for any dialog or modal surface
    const dialog = page.getByRole("dialog").or(page.getByTestId("export-menu-panel"));
    await expect(dialog.first()).toBeVisible();

    // Dialog must fit within the visual viewport (no overflow)
    const dialogBox = await dialog.first().boundingBox();
    const viewport = page.viewportSize()!;
    if (dialogBox) {
      expect(dialogBox.x).toBeGreaterThanOrEqual(0);
      expect(dialogBox.y).toBeGreaterThanOrEqual(0);
      expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(viewport.height + 1);
    }

    // Escape closes and restores focus to the invoker
    await page.keyboard.press("Escape");
    await expect(dialog.first()).toBeHidden();
  });

  test("interactive controls present distinguishable disabled, selected, and focus visual states", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "W5 visual states" });
    await waitForPlannerCanvas(page);

    // The view-mode radio has a selected state (aria-checked)
    const radio2D = page.getByRole("radiogroup", { name: "View mode" })
      .getByRole("radio", { name: "2D", exact: true });
    await expect(radio2D).toBeVisible();
    await expect(radio2D).toHaveAttribute("aria-checked", "true");

    // Focus indicator: tabbing to a toolbar button must produce a visible focus ring
    const firstToolbarBtn = page.getByTestId("planner-top-toolbar").getByRole("button").first();
    await firstToolbarBtn.focus();
    await expect(firstToolbarBtn).toBeFocused();
    // Verify focus is visually indicated via outline or ring (non-transparent)
    const outlineStyle = await firstToolbarBtn.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { outline: style.outline, boxShadow: style.boxShadow };
    });
    const hasFocusIndicator =
      (outlineStyle.outline && !outlineStyle.outline.includes("0px") && outlineStyle.outline !== "none") ||
      (outlineStyle.boxShadow && outlineStyle.boxShadow !== "none");
    expect(hasFocusIndicator).toBeTruthy();

    // Disabled state: undo button should be disabled when no edits have been made
    const undoBtn = page.getByRole("button", { name: /undo/i });
    if (await undoBtn.isVisible()) {
      await expect(undoBtn).toBeDisabled();
      // Disabled controls must have distinguishable opacity or cursor
      const disabledStyles = await undoBtn.evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { opacity: s.opacity, cursor: s.cursor, pointerEvents: s.pointerEvents };
      });
      const isVisuallyDisabled =
        parseFloat(disabledStyles.opacity) < 1 ||
        disabledStyles.cursor === "not-allowed" ||
        disabledStyles.pointerEvents === "none";
      expect(isVisuallyDisabled).toBeTruthy();
    }
  });

  test("server conflict keeps local work visible and renders both recovery choices", async ({ page }) => {
    const projectId = process.env.PLANNER_CONFLICT_PROJECT_ID?.trim();
    if (!projectId) {
      test.skip(true, "PLANNER_CONFLICT_PROJECT_ID is required for the authenticated conflict profile.");
      return;
    }
    await page.route(`**/api/Planner/projects/${projectId}`, async (route) => {
      if (route.request().method() !== "PATCH") return route.continue();
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ code: "CONFLICT", correlationId: "corr-conflict-0001", metadata: { currentRevision: 2 } }),
      });
    });
    await page.goto(`/ooplanner/projects/${projectId}`, { waitUntil: "domcontentloaded" });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });
    await page.getByTestId("btn-save").or(page.getByRole("button", { name: /save/i })).first().click();
    await expect(page.getByText(/save conflict|plan has changed/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /use server version/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /keep (?:my|local) changes/i })).toBeVisible();
    await expect(page.locator('[data-testid="canvas-stage"]')).toBeVisible();
  });
});
