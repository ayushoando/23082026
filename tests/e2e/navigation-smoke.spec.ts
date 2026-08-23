import { expect, test } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";

test("planner landing opens the planner canvas", async ({ page }) => {
  await page.goto("/planner");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Plan your office/i);
  const startFree = page.locator("#planner-hero").getByRole("link", { name: /Start free/i });
  await startFree.click();

  await page.waitForURL(/\/choose-product|\/planner\/guest|\/ooplanner/, { timeout: 30_000 });
  if (page.url().includes("/choose-product")) {
    await page.goto("/ooplanner");
  }

  await enterGuestPlannerWorkspace(page, { navigate: false });
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 30_000 });
});