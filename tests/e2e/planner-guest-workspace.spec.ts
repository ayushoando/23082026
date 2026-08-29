import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { clearPlannerStorage, enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  dragOnCanvas,
  getObjectCount,
  getWallCount,
  openPlannerInventory,
  PLANNER_PRIMARY_CANVAS,
  selectPlannerTool,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

test.describe("Planner guest workspace — plan 06 UI bar", () => {
  test.beforeEach(async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
  });

  test("loads canvas chrome and opens catalog on demand", async ({ page }) => {
    await expect(page.getByTestId("planner-top-toolbar")).toBeVisible();
    await expect(page.getByTestId("planner-toolbar-undo")).toBeVisible();
    await expect(page.getByTestId("planner-workflow-bar")).toBeVisible();
    await expect(page.getByTestId("planner-3d-canvas")).toHaveCount(0);

    await openPlannerInventory(page);
    await expect(page.getByTestId("catalog-search")).toBeVisible();
    await expect(page.locator(PLANNER_PRIMARY_CANVAS)).toBeVisible();
  });

  test("Start from Scratch opens a blank canvas", async ({ page }) => {
    await expect.poll(async () => getWallCount(page), { timeout: 15_000 }).toBe(0);
    await expect.poll(async () => getObjectCount(page), { timeout: 15_000 }).toBe(0);
  });

  test("top toolbar exposes live draw tools", async ({ page }) => {
    for (const id of ["wall", "door", "window", "measure"] as const) {
      await expect(page.getByTestId(`planner-toolbar-${id}`)).toBeVisible();
    }
  });

  test("inventory never requests an unpublished new-block SVG", async ({ page }) => {
    const missingNewBlock: string[] = [];
    page.on("response", (response) => {
      if (response.status() >= 400 && response.url().includes("/svg-catalog/new-block.svg")) {
        missingNewBlock.push(response.url());
      }
    });

    await openPlannerInventory(page);
    await expect(page.getByTestId("catalog-search")).toBeVisible();
    await expect.poll(() => missingNewBlock).toEqual([]);
  });

  test("catalog search filters elements", async ({ page }) => {
    await openPlannerInventory(page);
    const search = page.getByTestId("catalog-search");
    await search.fill("zzzznotfound");
    await expect(page.getByText(/No items match/i)).toBeVisible();
    await search.fill("");
    await expect(page.locator('[data-testid^="catalog-item-"]').first()).toBeVisible();
  });

  test("workflow bar shows current step metrics host", async ({ page }) => {
    const bar = page.getByTestId("planner-workflow-bar");
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("data-current", /draw|place|review/);
  });

  test("view mode 3D controls are absent", async ({ page }) => {
    await expect(page.getByRole("radiogroup", { name: "View mode" })).toHaveCount(0);
    await expect(page.getByTestId("planner-3d-canvas")).toHaveCount(0);
    await expect(page.locator(PLANNER_PRIMARY_CANVAS)).toBeVisible();
  });
});

test("planner landing exceeds generic benchmark proof points", async ({ page }) => {
  await page.goto("/planner/", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Plan your\s+office/i);
  await expect(page.getByRole("link", { name: /Start free/i }).first()).toBeVisible();
});

test.describe("a11y — key flows", () => {
  test("empty state / setup gate has no critical or serious a11y violations", async ({ page }) => {
    await clearPlannerStorage(page);
    await page.goto("/ooplanner/?plannerDevTools=1", { waitUntil: "domcontentloaded" });

    const setupHeading = page.getByRole("heading", { name: /Set up your space|Set up in 30 seconds/i });
    const topbar = page.locator('[data-testid="topbar"]');
    const workspace = page.getByTestId("planner-workspace");
    await expect
      .poll(
        async () =>
          (await setupHeading.isVisible().catch(() => false)) ||
          (await topbar.isVisible().catch(() => false)) ||
          (await workspace.isVisible().catch(() => false)),
        { timeout: 20_000 },
      )
      .toBe(true);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const blocking = results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );
    expect(blocking).toEqual([]);
  });

  test("complex plan (walls + furniture) has no critical or serious a11y violations", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);

    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.2, ry: 0.2 }, { rx: 0.8, ry: 0.2 });
    await dragOnCanvas(page, { rx: 0.8, ry: 0.2 }, { rx: 0.8, ry: 0.8 });
    await dragOnCanvas(page, { rx: 0.8, ry: 0.8 }, { rx: 0.2, ry: 0.8 });
    await dragOnCanvas(page, { rx: 0.2, ry: 0.8 }, { rx: 0.2, ry: 0.2 });

    await openPlannerInventory(page);
    const item = page.locator('[data-testid^="catalog-item-"]').first();
    if (await item.isVisible().catch(() => false)) {
      await item.click();
    }

    await expect.poll(() => getObjectCount(page), { timeout: 10_000 }).toBeGreaterThan(0);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const blocking = results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );
    expect(blocking).toEqual([]);
  });

  test("inventory at scale (catalog search + results) has no critical or serious a11y violations", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
    await openPlannerInventory(page);

    const search = page.getByTestId("catalog-search");
    await search.fill("a");

    const resultsOrEmpty = page
      .locator('[data-testid^="catalog-item-"]')
      .first()
      .or(page.getByText(/No items match/i));
    await expect(resultsOrEmpty).toBeVisible({ timeout: 10_000 });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const blocking = results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );
    expect(blocking).toEqual([]);
  });

  test.describe("small screen", () => {
    test.use({ viewport: { width: 390, height: 844 } }); // phone portrait

    test("small screen empty state / setup has no critical a11y violations", async ({ page }) => {
      await clearPlannerStorage(page);
      await page.goto("/ooplanner/?plannerDevTools=1", { waitUntil: "domcontentloaded" });

      const setupHeading = page.getByRole("heading", { name: /Set up your space|Set up in 30 seconds/i });
      const topbar = page.locator('[data-testid="topbar"]');
      const workspace = page.getByTestId("planner-workspace");
      await expect
        .poll(
          async () =>
            (await setupHeading.isVisible().catch(() => false)) ||
            (await topbar.isVisible().catch(() => false)) ||
            (await workspace.isVisible().catch(() => false)),
          { timeout: 20_000 },
        )
        .toBe(true);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      const blocking = results.violations.filter(
        (violation) => violation.impact === "critical" || violation.impact === "serious",
      );
      expect(blocking).toEqual([]);
    });

    test("small screen workspace with plan has no critical a11y violations", async ({ page }) => {
      await enterGuestPlannerWorkspace(page);
      await waitForPlannerCanvas(page);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      const blocking = results.violations.filter(
        (violation) => violation.impact === "critical" || violation.impact === "serious",
      );
      expect(blocking).toEqual([]);
    });
  });
});
