import { expect, test } from "@playwright/test";

import {
  clearPlannerStorage,
  completePlannerSetupGate,
} from "./guestProjectSetup";
import {
  PLANNER_PRIMARY_CANVAS,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

test.describe("04a guest first-run", () => {
  test("choose-product guest → ooplanner canvas without login wall", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await clearPlannerStorage(page);
    await page.goto("/choose-product?mode=guest", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.getByText(/Guest session/i)).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("choose-product-planner-launch").click();
    await expect(page).toHaveURL(/\/ooplanner/, { timeout: 30_000 });
    await expect(page).not.toHaveURL(/\/access/);

    await Promise.race([
      page.locator('[data-testid="topbar"]').waitFor({ state: "visible", timeout: 60_000 }),
      page.getByRole("form", { name: /Project setup/i }).waitFor({
        state: "visible",
        timeout: 60_000,
      }),
    ]);
    await completePlannerSetupGate(page, "04a first-run");
    await waitForPlannerCanvas(page, { timeoutMs: 90_000 });
    await expect(page.locator(PLANNER_PRIMARY_CANVAS)).toBeVisible();
  });
});
