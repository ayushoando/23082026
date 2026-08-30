// Feature: planner-comprehensive-audit, Task 5.10 targeted rendered specifications
// Findings: finding:trace:project-edit, finding:trace:offline-reconnect,
// finding:trace:conflict-recovery, finding:trace:handoff
// Validates: Requirements 5.1-5.8, 6.1-6.7, 7.1-7.7, 8.1-8.8,
// 9.2-9.6, 16.1-16.7, 18.5
// Authored browser coverage only. No execution or rendered result is claimed.

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { PLANNER_BROWSER_AUDIT_PROFILES } from "../fixtures/planner/browserAuditMatrix";
import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import { waitForPlannerCanvas } from "./plannerCanvasHelpers";

async function expectWorkspaceContext(page: import("@playwright/test").Page): Promise<void> {
  await expect(page.getByTestId("planner-workspace")).toBeVisible();
  await expect(page.locator('[data-testid="canvas-stage"]')).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
}

test.describe("Planner comprehensive rendered regression matrix", () => {
  for (const profile of PLANNER_BROWSER_AUDIT_PROFILES) {
    test(`${profile.id} preserves workspace through resize and orientation changes`, async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== profile.project,
        `Profile ${profile.id} is assigned to ${profile.project}.`,
      );
      await page.setViewportSize(profile.viewport);
      await enterGuestPlannerWorkspace(page, { projectName: `W5 ${profile.id}` });
      await waitForPlannerCanvas(page, { timeoutMs: 60_000 });
      await expectWorkspaceContext(page);

      const beforeUrl = page.url();
      await page.setViewportSize(
        profile.orientation === "portrait"
          ? { width: profile.viewport.height, height: profile.viewport.width }
          : { width: profile.viewport.height, height: profile.viewport.width },
      );
      await expectWorkspaceContext(page);
      expect(page.url()).toBe(beforeUrl);
    });
  }

  test("keyboard entry, menu dismissal, and focus restoration do not require a pointer", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1_024 });
    await enterGuestPlannerWorkspace(page, { projectName: "W5 keyboard" });
    await waitForPlannerCanvas(page);

    const trigger = page.getByTestId("planner-more-actions");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("planner-more-menu")).toBeVisible();
    await expect(page.getByRole("menuitem").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("planner-more-menu")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("touch controls expose the same inventory workflow as keyboard controls", async ({ browser }, testInfo) => {
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

  test("200% reflow and reduced motion preserve reachable controls and AA contrast states", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await enterGuestPlannerWorkspace(page, { projectName: "W5 reflow" });
    await waitForPlannerCanvas(page);
    await page.evaluate(() => { document.documentElement.style.setProperty("zoom", "2"); });

    await expect(page.getByTestId("planner-workspace")).toBeVisible();
    await expect(page.getByTestId("planner-more-actions")).toBeVisible();
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

  test("server conflict keeps local work visible and renders both recovery choices", async ({ page }) => {
    const projectId = process.env.PLANNER_CONFLICT_PROJECT_ID?.trim();
    if (!projectId) throw new Error("PLANNER_CONFLICT_PROJECT_ID is required to execute the authored conflict-recovery profile.");
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
