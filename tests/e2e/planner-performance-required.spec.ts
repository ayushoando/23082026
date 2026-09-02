// Feature: planner-comprehensive-audit
// Task 5.5 required performance profiles
// Validates: Requirements 16.1-16.7, 18.5
// Authored measurement coverage only. Execution and numeric evidence remain pending
// exact current-session authorization and enabled-hook permission.

import { expect, test, type Page, type TestInfo } from "@playwright/test";

import {
  CANVAS_INTERACTIONS,
  DIRECT_FEEDBACK_INTERACTIONS,
  getSupportedTestProfile,
  NON_CANVAS_INTERACTIONS,
  PROJECT_API_OPERATIONS,
  summarizeApiLatency,
  summarizeCanvasFps,
  summarizeDirectFeedback,
  summarizeNonCanvasInp,
  summarizeRouteEntry,
  SUPPORTED_ROUTE_PATHS,
  type CanvasInteraction,
  type NonCanvasInteraction,
} from "../../plans/planner-comprehensive-audit/performanceMeasurement";
import { createRepresentativeProjectTestFixture } from "../fixtures/planner/representativeProject";
import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  PLANNER_PRIMARY_CANVAS,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";
import {
  applySupportedProfile,
  assertRequiredPerformanceProject,
  collectRouteEntrySample,
  installPerformanceObservers,
  loadRepresentativeProjectIntoCanvas,
  measureApiOperation,
  measureCanvasFrames,
  measureCleanupCycles,
  measureDirectFeedback,
  measureNonCanvasInteraction,
} from "./helpers/plannerPerformance";

test.describe.configure({ mode: "serial" });
test.setTimeout(30 * 60_000);

async function attachJson(
  testInfo: TestInfo,
  name: string,
  value: unknown,
): Promise<void> {
  await testInfo.attach(name, {
    body: Buffer.from(JSON.stringify(value, null, 2)),
    contentType: "application/json",
  });
}

function requireEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} is required to execute this profile; authored coverage does not invent a runtime project or authorization value.`,
    );
  }
  return value;
}

async function performNonCanvasInteraction(
  page: Page,
  interaction: NonCanvasInteraction,
): Promise<void> {
  if (interaction === "open-catalog-panel") {
    await page
      .getByTestId("planner-toolbar-place")
      .or(page.getByRole("button", { name: /inventory|catalog/i }))
      .first()
      .click();
    await expect(page.getByTestId("catalog-search")).toBeVisible();
    return;
  }
  if (interaction === "open-project-menu") {
    await page
      .getByRole("button", { name: /project menu|project actions|file/i })
      .first()
      .click();
    return;
  }
  if (interaction === "open-save-dialog") {
    await page.getByRole("button", { name: /save project|save/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    return;
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
}

async function canvasPoint(page: Page, xRatio: number, yRatio: number) {
  const box = await page.locator(PLANNER_PRIMARY_CANVAS).boundingBox();
  if (!box) throw new Error("Planner canvas has no measurable bounding box.");
  return { x: box.x + box.width * xRatio, y: box.y + box.height * yRatio };
}

async function performCanvasInteraction(
  page: Page,
  interaction: CanvasInteraction,
): Promise<void> {
  const start = await canvasPoint(page, 0.5, 0.5);
  if (interaction === "zoom") {
    await page.mouse.move(start.x, start.y);
    await page.mouse.wheel(0, -180);
    return;
  }
  if (interaction === "selection") {
    await page.mouse.click(start.x, start.y);
    return;
  }
  const offsets: Readonly<Record<Exclude<CanvasInteraction, "zoom" | "selection">, { x: number; y: number }>> = {
    pan: { x: 80, y: 45 },
    move: { x: 55, y: 20 },
    rotate: { x: 65, y: -45 },
    resize: { x: 70, y: 55 },
  };
  const offset = offsets[interaction];
  if (interaction === "pan") await page.keyboard.down("Space");
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + offset.x, start.y + offset.y, { steps: 20 });
  await page.mouse.up();
  if (interaction === "pan") await page.keyboard.up("Space");
}

test.describe("Planner required performance measurements", () => {
  test.beforeEach(({ browserName }, testInfo) => {
    test.skip(
      browserName !== "chromium" || testInfo.project.name !== "chromium-desktop",
      "Required Planner performance evidence uses the documented chromium-desktop profile.",
    );
  });
  test("records route-entry LCP p75 and CLS for every supported route", async ({
    browser,
    browserName,
    page,
  }, testInfo) => {
    const profile = getSupportedTestProfile("profile-route-entry-cold-v1");
    assertRequiredPerformanceProject(page, browserName, testInfo, profile);
    const projectId = requireEnvironmentValue("PLANNER_PERFORMANCE_PROJECT_ID");
    const samples = [];

    for (const route of SUPPORTED_ROUTE_PATHS) {
      const navigableRoute =
        route === "/ooplanner/projects/[id]"
          ? `/ooplanner/projects/${encodeURIComponent(projectId)}`
          : route;
      for (let sampleIndex = 0; sampleIndex < 20; sampleIndex += 1) {
        const context = await browser.newContext({
          viewport: {
            width: profile.viewport.widthCssPx,
            height: profile.viewport.heightCssPx,
          },
          deviceScaleFactor: profile.viewport.deviceScaleFactor,
        });
        const samplePage = await context.newPage();
        const applied = await applySupportedProfile(samplePage, profile);
        try {
          await installPerformanceObservers(samplePage);
          samples.push(
            await collectRouteEntrySample(samplePage, route, navigableRoute),
          );
        } finally {
          await applied.dispose();
          await context.close();
        }
      }
    }

    const summary = summarizeRouteEntry(profile, samples);
    await attachJson(testInfo, "route-entry-performance-profile-and-summary", {
      profile,
      summary,
    });
    expect(summary.lcpStatus).toBe("within-budget");
    expect(summary.clsStatus).toBe("within-budget");
  });

  test("records non-canvas INP, canvas FPS, and direct feedback", async ({
    browserName,
    page,
  }, testInfo) => {
    const inpProfile = getSupportedTestProfile("profile-non-canvas-inp-warm-v1");
    const canvasProfile = getSupportedTestProfile("profile-canvas-fps-warm-v1");
    const feedbackProfile = getSupportedTestProfile(
      "profile-direct-feedback-warm-v1",
    );
    assertRequiredPerformanceProject(page, browserName, testInfo, inpProfile);
    const applied = await applySupportedProfile(page, inpProfile);
    try {
      await installPerformanceObservers(page);
      await enterGuestPlannerWorkspace(page, {
        projectName: "Planner representative performance project",
      });
      await waitForPlannerCanvas(page, { timeoutMs: 60_000 });
      await loadRepresentativeProjectIntoCanvas(
        page,
        createRepresentativeProjectTestFixture(),
      );

      const inpSamples = [];
      for (const interaction of NON_CANVAS_INTERACTIONS) {
        for (let index = 0; index < 5; index += 1) {
          inpSamples.push(
            await measureNonCanvasInteraction(page, interaction, () =>
              performNonCanvasInteraction(page, interaction),
            ),
          );
        }
      }

      const frameSamples = [];
      const feedbackSamples = [];
      for (const interaction of CANVAS_INTERACTIONS) {
        for (let index = 0; index < 5; index += 1) {
          frameSamples.push(
            await measureCanvasFrames(page, interaction, () =>
              performCanvasInteraction(page, interaction),
            ),
          );
          feedbackSamples.push(
            await measureDirectFeedback(
              page,
              `${interaction}-start`,
              () => performCanvasInteraction(page, interaction),
            ),
          );
        }
      }

      expect(frameSamples.map((sample) => sample.interaction)).toEqual(
        expect.arrayContaining([...CANVAS_INTERACTIONS]),
      );
      expect(feedbackSamples.map((sample) => sample.interaction)).toEqual(
        expect.arrayContaining([...DIRECT_FEEDBACK_INTERACTIONS]),
      );
      const inpSummary = summarizeNonCanvasInp(inpProfile, inpSamples);
      const canvasSummary = summarizeCanvasFps(canvasProfile, frameSamples);
      const feedbackSummary = summarizeDirectFeedback(
        feedbackProfile,
        feedbackSamples,
      );
      await attachJson(testInfo, "interaction-performance-profiles-and-summaries", {
        profiles: { inpProfile, canvasProfile, feedbackProfile },
        summaries: { inpSummary, canvasSummary, feedbackSummary },
      });
      expect(inpSummary.status).toBe("within-budget");
      expect(canvasSummary.status).toBe("within-budget");
      expect(feedbackSummary.status).toBe("within-budget");
    } finally {
      await applied.dispose();
    }
  });

  test("records cold and warm list/load/save API latency separately", async ({
    browserName,
    page,
  }, testInfo) => {
    const coldProfile = getSupportedTestProfile("profile-api-cold-v1");
    const warmProfile = getSupportedTestProfile("profile-api-warm-v1");
    assertRequiredPerformanceProject(page, browserName, testInfo, warmProfile);
    if (process.env.PLANNER_PERFORMANCE_COLD_START_CONFIRMED !== "1") {
      throw new Error(
        "PLANNER_PERFORMANCE_COLD_START_CONFIRMED=1 is required after the authorized local integration service is placed in its documented cold state.",
      );
    }
    const projectId = requireEnvironmentValue("PLANNER_PERFORMANCE_PROJECT_ID");
    const csrfToken = requireEnvironmentValue("PLANNER_PERFORMANCE_CSRF_TOKEN");
    const project = createRepresentativeProjectTestFixture().persistedProject;
    const samples = [];

    for (const operation of PROJECT_API_OPERATIONS) {
      samples.push(
        await measureApiOperation(page, {
          operation,
          projectId,
          project,
          warmColdStatus: "cold",
          csrfToken,
        }),
      );
      await measureApiOperation(page, {
        operation,
        projectId,
        project,
        warmColdStatus: "warm",
        csrfToken,
      });
      for (let index = 0; index < 20; index += 1) {
        samples.push(
          await measureApiOperation(page, {
            operation,
            projectId,
            project,
            warmColdStatus: "warm",
            csrfToken,
          }),
        );
      }
    }

    const summary = summarizeApiLatency(warmProfile, coldProfile, samples);
    await attachJson(testInfo, "api-performance-profiles-and-summary", {
      coldProfile,
      warmProfile,
      summary,
    });
    for (const operation of PROJECT_API_OPERATIONS) {
      expect(summary.warmStatus[operation]).toBe("within-budget");
    }
  });

  test("releases project listeners and subscriptions after each of 20 cycles", async ({
    browserName,
    page,
  }, testInfo) => {
    const profile = getSupportedTestProfile("profile-cleanup-20-cycle-warm-v1");
    assertRequiredPerformanceProject(page, browserName, testInfo, profile);
    const applied = await applySupportedProfile(page, profile);
    try {
      await enterGuestPlannerWorkspace(page, {
        projectName: "Planner cleanup performance project",
      });
      const fixture = createRepresentativeProjectTestFixture();
      const summary = await measureCleanupCycles(
        page,
        profile,
        async () => loadRepresentativeProjectIntoCanvas(page, fixture),
        async () => {
          await page.evaluate(async () => {
            const canvas = (
              window as unknown as {
                __plannerFabricView?: {
                  loadFromJSON?: (json: unknown) => Promise<unknown> | unknown;
                  requestRenderAll?: () => void;
                };
              }
            ).__plannerFabricView;
            if (!canvas?.loadFromJSON) {
              throw new Error("Planner Fabric measurement hook is unavailable.");
            }
            await canvas.loadFromJSON({ version: "7.4.0", objects: [] });
            canvas.requestRenderAll?.();
          });
        },
      );
      await attachJson(testInfo, "cleanup-performance-profile-and-summary", {
        profile,
        summary,
      });
      expect(summary.actualSampleCount).toBe(20);
      expect(summary.releasedAfterEveryClose).toBe(true);
      expect(summary.leakingCycles).toEqual([]);
    } finally {
      await applied.dispose();
    }
  });
});
