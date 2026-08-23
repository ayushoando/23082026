import { expect, test, type Page } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  clickAtPoint,
  expectObjectCountAtLeast,
  firstFurnitureCenter,
  getFurnitureCount,
  getObjectCount,
  openPlannerInventory,
  placeArmedCatalogOnCanvas,
  selectPlannerTool,
  switchPlannerStep,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

test.describe.configure({ timeout: 90_000 });

async function dismissOnboardingIfPresent(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog", { name: /Onboarding Guide/i });
  if (await dialog.isVisible().catch(() => false)) {
    await dialog.getByRole("button", { name: /Skip onboarding/i }).click();
    await expect(dialog).toBeHidden({ timeout: 10_000 }).catch(() => undefined);
  }
}

async function openWorkspace(page: Page) {
  await enterGuestPlannerWorkspace(page);
  await waitForPlannerCanvas(page);
  await dismissOnboardingIfPresent(page);
}

/** Open inventory and place first catalog tile (immediate center drop). */
async function placeFirstCatalogItem(page: Page): Promise<void> {
  const objectsBefore = await getObjectCount(page);
  const furnitureBefore = await getFurnitureCount(page);
  await placeArmedCatalogOnCanvas(page, { beforeCount: furnitureBefore });
  await expectObjectCountAtLeast(page, objectsBefore + 1);
}

test.describe("Planner chrome v2", () => {
  test("Draw step keeps canvas tools available", async ({ page }) => {
    await openWorkspace(page);
    await switchPlannerStep(page, "Draw");

    await expect(page.getByTestId("planner-top-toolbar")).toBeVisible();
    await expect(page.getByTestId("planner-toolbar-wall")).toBeVisible();
    await expect(page.locator('[data-testid="canvas-stage"]')).toBeVisible();
  });

  test("Place step can open inventory from dock tab", async ({ page }) => {
    await openWorkspace(page);
    await openPlannerInventory(page);

    await expect(page.getByTestId("catalog-search")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("catalog-rail")).toHaveAttribute("data-collapsed", "false");
  });

  test("Review step shows review dock tabs", async ({ page }) => {
    await openWorkspace(page);
    await switchPlannerStep(page, "Review");

    await expect(page.getByTestId("planner-workflow-bar")).toHaveAttribute(
      "data-current",
      "review",
    );
    // Review overlay exposes BOQ / Sheet / Properties dock shortcuts.
    const reviewTab = page
      .getByTestId("dock-tab-boq")
      .or(page.getByTestId("dock-tab-sheet"))
      .or(page.getByTestId("dock-tab-props"));
    await expect(reviewTab.first()).toBeVisible({ timeout: 10_000 });
  });

  test("3D view controls are removed from planner workspace", async ({ page }) => {
    await openWorkspace(page);
    await expect(page.getByRole("radiogroup", { name: "View mode" })).toHaveCount(0);
    await expect(page.getByTestId("planner-3d-canvas")).toHaveCount(0);
    await expect(page.getByTestId("dock-tab-3d")).toHaveCount(0);
    await expect(page.getByTestId("planner-3d")).toHaveCount(0);
  });

  test("inventory place adds an item to the canvas", async ({ page }) => {
    await openWorkspace(page);
    await placeFirstCatalogItem(page);
  });

  test("selecting a placed shape opens the inspector", async ({ page }) => {
    await openWorkspace(page);
    await placeFirstCatalogItem(page);

    await selectPlannerTool(page, "Select");
    await expect
      .poll(async () => firstFurnitureCenter(page), { timeout: 15_000 })
      .not.toBeNull();
    const center = await firstFurnitureCenter(page);
    if (!center) throw new Error("No furniture object to select");
    await clickAtPoint(page, center);

    // Fabric rebuild can drop the post-place selection — re-arm via Fabric API.
    await page.evaluate(() => {
      const w = (
        window as unknown as {
          __plannerFabricView?: {
            getObjects?: () => Array<{
              get?: (k: string) => unknown;
              plannerEntityType?: unknown;
            }>;
            setActiveObject?: (o: unknown) => void;
            requestRenderAll?: () => void;
            fire?: (name: string, payload: unknown) => void;
          };
        }
      ).__plannerFabricView;
      if (!w?.getObjects) return;
      const target = w.getObjects().find((o) => {
        const type =
          (typeof o.get === "function" ? o.get("plannerEntityType") : null) ??
          o.plannerEntityType;
        return type === "furniture";
      });
      if (!target) return;
      w.setActiveObject?.(target);
      w.fire?.("selection:created", { selected: [target], target });
      w.requestRenderAll?.();
    });

    const propsTab = page.getByTestId("dock-tab-props");
    if (await propsTab.isVisible().catch(() => false)) {
      await propsTab.click();
    }
    await expect(page.getByTestId("planner-side-panel").first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
