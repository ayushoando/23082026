import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import { waitForPlannerCanvas } from "./plannerCanvasHelpers";

// Use process.cwd() for cross-platform fixture path resolution (CJS/ESM compatible)
const SKETCH_FIXTURE = path.join(process.cwd(), "tests", "e2e", "fixtures", "sketch-1x1.png");
const MINIMAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("sketch-to-plan pipeline", () => {
  // Keep a mid-width desktop viewport to match the planner catalog Playwright lane.
  test.use({ viewport: { width: 1100, height: 800 } });

  test.beforeAll(() => {
    fs.mkdirSync(path.dirname(SKETCH_FIXTURE), { recursive: true });
    if (!fs.existsSync(SKETCH_FIXTURE)) {
      fs.writeFileSync(SKETCH_FIXTURE, MINIMAL_PNG);
    }
  });
  test.beforeEach(async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
  });

  test("uploads a sketch image and reaches sketch recovery UI", async ({ page }, testInfo) => {
    await expect(page.getByTestId("planner-workspace")).toBeVisible({ timeout: 20_000 });

    // Sketch lives under AI assist float (feature-flagged sketchToPlan).
    const aiToggle = page.getByTestId("toggle-ai-float");
    await expect(aiToggle).toBeVisible({ timeout: 15_000 });
    await aiToggle.click();

    const sketchSection = page.getByTestId("planner-sketch-section");
    if (!(await sketchSection.isVisible().catch(() => false))) {
      testInfo.skip(true, "sketchToPlan feature flag off — no sketch UI in this env");
      return;
    }

    const fileInput = page.getByTestId("planner-sketch-file");
    await fileInput.setInputFiles(SKETCH_FIXTURE);

    // Status line under AI panel — converting then preview/error.
    const status = page.getByRole("status").filter({
      hasText: /Converting sketch|Sketch recovery|preview|accepted|failed|walls/i,
    });
    await expect(status.first()).toBeVisible({ timeout: 45_000 });
  });
});

