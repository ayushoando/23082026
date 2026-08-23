import { expect, test } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import { waitForPlannerCanvas } from "./plannerCanvasHelpers";

/**
 * Product no longer mounts a `.pw-shell[data-offline]` banner (removed with
 * the modular shell rewrite). Contract: workspace stays mounted offline and
 * recovers when the network returns — not a grepwipe of offline coverage.
 */
test.describe("planner offline sync shell", () => {
  test.beforeEach(async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
  });

  test("keeps workspace mounted when network is offline", async ({ page, context }) => {
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));

    await expect(page.getByTestId("planner-workspace")).toBeVisible();
    await expect(page.locator('[data-testid="canvas-stage"]')).toBeVisible();
    // Legacy offline shell is gone — do not require .pw-shell.
    await expect(page.locator(".pw-shell")).toHaveCount(0);
  });

  test("workspace remains usable when network is restored", async ({ page, context }) => {
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await expect(page.getByTestId("planner-workspace")).toBeVisible();

    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expect(page.getByTestId("planner-workspace")).toBeVisible();
    await expect(page.locator('[data-testid="canvas-stage"]')).toBeVisible();
  });
});
