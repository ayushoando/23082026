import { expect, test } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  dragOnCanvas,
  expectObjectCountAtLeast,
  getObjectCount,
  getWallCount,
  plannerToolButton,
  selectPlannerTool,
  switchPlannerStep,
  placeOpeningOnCanvas,
  waitForPlannerCanvas,
  firstFurnitureCenter,
  clickAtPoint,
  placeCatalogOnCanvas,
} from "./plannerCanvasHelpers";

test.describe.configure({ timeout: 60_000 });

/** Top-toolbar draw tools always available on Draw step. */
const TOP_DRAW_TOOLS = ["Wall", "Door", "Window", "Measure"] as const;

/** Rail tools (tools dock is CSS-hidden on Draw — open on Place). */
const RAIL_ONLY_TOOLS = ["Select", "Pan", "Line", "Text"] as const;

async function ensureToolsDockOpen(page: import("@playwright/test").Page): Promise<void> {
  // Draw step forces tools dock width:0 — switch to Place so the rail is hittable.
  await switchPlannerStep(page, "Place");
  const dock = page.getByTestId("tools-dock");
  if ((await dock.getAttribute("data-collapsed")) === "true") {
    await page.getByTestId("dock-tab-tools").click();
  }
  await expect(page.getByTestId("tool-rail")).toBeVisible({ timeout: 10_000 });
}

test.describe("Planner custom tools — Playwright", () => {
  test.beforeEach(async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
  });

  test("top toolbar exposes every live draw tool", async ({ page }) => {
    await switchPlannerStep(page, "Draw");
    for (const tool of TOP_DRAW_TOOLS) {
      await expect(plannerToolButton(page, tool).first()).toBeVisible();
    }
  });

  test("tool rail exposes rail-only tools when dock is open", async ({ page }) => {
    await ensureToolsDockOpen(page);
    for (const tool of RAIL_ONLY_TOOLS) {
      await expect(plannerToolButton(page, tool).first()).toBeVisible();
    }
  });

  test("Draw step defaults to Wall tool", async ({ page }) => {
    await switchPlannerStep(page, "Draw");
    await expect(page.locator(".pw-step-bar")).toHaveAttribute("data-current", "draw");
    await expect(page.getByTestId("planner-toolbar-wall")).toHaveAttribute("aria-pressed", "true");
  });

  test("Wall tool creates a wall shape", async ({ page }) => {
    await switchPlannerStep(page, "Draw");
    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.32, ry: 0.5 }, { rx: 0.68, ry: 0.5 });
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Wall tool supports dragging up and left", async ({ page }) => {
    await switchPlannerStep(page, "Draw");
    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.65, ry: 0.62 }, { rx: 0.35, ry: 0.32 });
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Line tool creates a line shape", async ({ page }) => {
    await ensureToolsDockOpen(page);
    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Line");
    await dragOnCanvas(page, { rx: 0.3, ry: 0.3 }, { rx: 0.6, ry: 0.55 });
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Text tool activates without breaking the canvas", async ({ page }) => {
    await ensureToolsDockOpen(page);
    await selectPlannerTool(page, "Text");
    await expect(plannerToolButton(page, "Text").first()).toHaveAttribute("aria-pressed", "true");
    await waitForPlannerCanvas(page);
  });

  test("catalog item places furniture without a Furniture rail tool", async ({ page }) => {
    await switchPlannerStep(page, "Place");
    const before = await getObjectCount(page);
    await placeCatalogOnCanvas(page, 0.45, 0.42);
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Door tool places on an existing wall", async ({ page }) => {
    await switchPlannerStep(page, "Draw");
    const wallsBefore = await getWallCount(page);
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.15, ry: 0.5 }, { rx: 0.85, ry: 0.5 });
    await expect.poll(async () => getWallCount(page), { timeout: 10_000 }).toBe(wallsBefore + 1);

    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Door");
    await placeOpeningOnCanvas(page, { rx: 0.5, ry: 0.5 }, { rx: 0.55, ry: 0.5 });
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Window tool places on an existing wall", async ({ page }) => {
    await switchPlannerStep(page, "Draw");
    const wallsBefore = await getWallCount(page);
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.15, ry: 0.6 }, { rx: 0.85, ry: 0.6 });
    await expect.poll(async () => getWallCount(page), { timeout: 10_000 }).toBe(wallsBefore + 1);

    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Window");
    await placeOpeningOnCanvas(page, { rx: 0.5, ry: 0.6 }, { rx: 0.55, ry: 0.6 });
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Measure tool commits a two-point dimension", async ({ page }) => {
    await switchPlannerStep(page, "Draw");
    await selectPlannerTool(page, "Measure");
    await expect(page.getByTestId("planner-toolbar-measure")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    const before = await getObjectCount(page);
    // Dimension commits on the second mouse:down (not a drag). Avoid the
    // clickOnCanvas micro-drag — it can confuse the two-point gesture.
    async function tap(rx: number, ry: number) {
      const box = await page.locator("canvas.upper-canvas").first().boundingBox();
      if (!box) throw new Error("no upper-canvas");
      const x = box.x + box.width * rx;
      const y = box.y + box.height * ry;
      await page.mouse.click(x, y, { delay: 40 });
      await page.waitForTimeout(150);
    }
    await tap(0.25, 0.3);
    await tap(0.55, 0.45);
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Select tool selects a placed shape", async ({ page }) => {
    await switchPlannerStep(page, "Place");
    await placeCatalogOnCanvas(page, 0.45, 0.42);
    await expectObjectCountAtLeast(page, 1);

    await ensureToolsDockOpen(page);
    await selectPlannerTool(page, "Select");
    const center = await firstFurnitureCenter(page);
    if (!center) throw new Error("No furniture object to select");
    await clickAtPoint(page, center);

    // Properties dock is the live inspector surface.
    const propsTab = page.getByTestId("dock-tab-props");
    if (await propsTab.isVisible().catch(() => false)) {
      await propsTab.click();
    }
    await expect(page.getByTestId("planner-side-panel").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("Pan tool activates without breaking the canvas", async ({ page }) => {
    await switchPlannerStep(page, "Draw");
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.15, ry: 0.4 }, { rx: 0.85, ry: 0.4 });
    const countAfterWall = await getObjectCount(page);

    await ensureToolsDockOpen(page);
    await selectPlannerTool(page, "Pan");
    await dragOnCanvas(page, { rx: 0.5, ry: 0.5 }, { rx: 0.35, ry: 0.35 });
    await expect
      .poll(async () => getObjectCount(page), { timeout: 15_000 })
      .toBe(countAfterWall);
    await waitForPlannerCanvas(page);
  });
});
