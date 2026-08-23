import { expect, test, type Page } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  openPlannerInventory,
  PLANNER_FABRIC_STAGE,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";
import { warmDevRoute } from "./helpers/warmDevRoute";

async function dismissOnboardingIfPresent(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog", { name: /Onboarding Guide/i });
  if (await dialog.isVisible().catch(() => false)) {
    await dialog.getByRole("button", { name: /Skip onboarding/i }).click();
    await expect(dialog).toBeHidden({ timeout: 10_000 }).catch(() => undefined);
  }
}

test.describe("planner catalog panel", () => {
  // Parallel workers both entering guest + Place race an empty catalog rail.
  test.describe.configure({ mode: "serial" });

  // Cold dev route: the guest planner's client chunks only compile once a
  // browser requests them, which can race the manifest write.
  test.beforeAll(async ({ browser }) => {
    const warm = await browser.newPage();
    try {
      await warmDevRoute(warm, "/ooplanner/?plannerDevTools=1", {
        readySelector: PLANNER_FABRIC_STAGE,
        timeoutMs: 90_000,
      });
      // The catalog rail fetches /api/Planner/catalog, a separately-compiled dev
      // route. Pay its cold-compile cost here so the first timed rail assertion
      // (openPlannerInventory polls catalog-item tiles) does not race it under
      // parallel-worker load.
      await warm.request
        .get("/api/Planner/catalog/", { timeout: 90_000 })
        .catch(() => undefined);
    } finally {
      await warm.close();
    }
  });

  test("desktop rail, catalog, and canvas do not overlap", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
    await dismissOnboardingIfPresent(page);
    await openPlannerInventory(page);

    const catalogRail = page.getByTestId("catalog-rail");
    const canvas = page.locator('[data-testid="canvas-stage"]');

    await expect(catalogRail).toBeVisible();
    await expect(catalogRail).toHaveAttribute("data-collapsed", "false");
    await expect(canvas).toBeVisible();
    await expect(page.getByTestId("catalog-search")).toBeVisible();

    const catalogBox = await catalogRail.boundingBox();
    const canvasBox = await canvas.boundingBox();

    expect(catalogBox).not.toBeNull();
    expect(canvasBox).not.toBeNull();

    // Left catalog rail ends before canvas starts (small tolerance for borders).
    expect(catalogBox!.x + catalogBox!.width).toBeLessThanOrEqual(canvasBox!.x + 8);
  });

  test("guest workspace exposes searchable catalog", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
    await dismissOnboardingIfPresent(page);
    await openPlannerInventory(page);

    await expect(page.locator('[data-testid^="catalog-item-"]').first()).toBeVisible({
      timeout: 15_000,
    });

    const search = page.getByTestId("catalog-search");
    await search.fill("zzzznotfound");
    await expect(page.getByText(/No items match/i)).toBeVisible({ timeout: 10_000 });
    await search.fill("");
    await expect(page.locator('[data-testid^="catalog-item-"]').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
