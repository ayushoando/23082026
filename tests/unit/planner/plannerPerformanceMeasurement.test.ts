import { describe, expect, it } from "vitest";

import {
  CANVAS_INTERACTIONS,
  DIRECT_FEEDBACK_INTERACTIONS,
  getSupportedTestProfile,
  NON_CANVAS_INTERACTIONS,
  PLANNED_MEASUREMENTS,
  PROJECT_API_OPERATIONS,
  summarizeApiLatency,
  summarizeCanvasFps,
  summarizeCleanupCycles,
  summarizeDirectFeedback,
  summarizeNonCanvasInp,
  summarizeRouteEntry,
  SUPPORTED_ROUTE_PATHS,
  SUPPORTED_TEST_PROFILES,
  validateSupportedTestProfiles,
  type ApiLatencySample,
  type CanvasFrameSample,
  type CleanupCycleSample,
  type DirectFeedbackSample,
  type NonCanvasInpSample,
  type RouteEntrySample,
} from "../../e2e/helpers/plannerPerformanceBudgets";
import {
  createRepresentativeProjectFixture,
  REPRESENTATIVE_FIXTURE_ID,
  validateRepresentativeProjectFixture,
} from "../../fixtures/planner/representativeProject";

function repeatTimestamps(intervalMs: number): number[] {
  return [0, intervalMs, intervalMs * 2, intervalMs * 3, intervalMs * 4];
}

describe("Planner Task 5.5 representative project fixture", () => {
  it("is deterministic and includes the complete representative project contract", () => {
    const first = createRepresentativeProjectFixture();
    const second = createRepresentativeProjectFixture();

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(validateRepresentativeProjectFixture(first)).toEqual([]);
    expect(first.fixtureId).toBe(REPRESENTATIVE_FIXTURE_ID);
    expect(first.plannerScalePxPerMm).toBe(0.05);
    expect(first.roomBoundary).toEqual(
      expect.objectContaining({
        kind: "room-boundary",
        label: expect.any(String),
        widthMm: 12_000,
        depthMm: 8_000,
      }),
    );
    expect(first.roomBoundary.pointsMm).toHaveLength(4);
    expect(first.furniture).toHaveLength(10);
    expect(first.furniture.some((item) => item.rotationDeg !== 0)).toBe(true);

    for (const item of first.furniture) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.dimensions.widthMm).toBeGreaterThan(0);
      expect(item.dimensions.depthMm).toBeGreaterThan(0);
      expect(item.dimensions.heightMm).toBeGreaterThan(0);
      expect(Object.keys(item.metadata).length).toBeGreaterThan(0);
    }

    expect(first.persistedProject.objects_count).toBe(11);
    expect(first.persistedProject.canvas_json.objects).toHaveLength(11);
    expect(first.persistedProject.metadata).toEqual(
      expect.objectContaining({
        schemaVersion: 1,
        revision: 3,
        status: "active",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
  });
});

describe("Planner Task 5.5 supported performance profiles", () => {
  it("records every required fixture field and keeps execution unclaimed", () => {
    expect(validateSupportedTestProfiles()).toEqual([]);
    expect(
      new Set(SUPPORTED_TEST_PROFILES.map((profile) => profile.measurementKind)),
    ).toEqual(
      new Set([
        "route-lcp-cls",
        "non-canvas-inp",
        "canvas-fps",
        "direct-feedback",
        "api-latency",
        "listener-subscription-cleanup",
      ]),
    );

    for (const supportedProfile of SUPPORTED_TEST_PROFILES) {
      expect(supportedProfile).toEqual(
        expect.objectContaining({
          viewport: expect.objectContaining({
            viewportClass: "desktop",
            widthCssPx: 1_440,
            heightCssPx: 900,
          }),
          orientation: "landscape",
          inputMethod: expect.any(String),
          browser: expect.objectContaining({
            name: "chromium",
            versionFixture: "resolve-installed-version-at-execution",
          }),
          device: expect.objectContaining({ id: expect.any(String) }),
          cpu: expect.objectContaining({ throttleRate: 4 }),
          network: expect.objectContaining({ name: "slow-4g" }),
          projectFixture: { id: REPRESENTATIVE_FIXTURE_ID, version: 1 },
          warmColdStatus: expect.stringMatching(/^(warm|cold)$/),
          sampleCount: expect.any(Number),
          sampleDistribution: expect.any(String),
          method: expect.any(String),
          evidenceClass: expect.stringMatching(/^(browser|integration)$/),
        }),
      );
    }

    expect(PLANNED_MEASUREMENTS).toHaveLength(SUPPORTED_TEST_PROFILES.length);
    expect(
      PLANNED_MEASUREMENTS.every(
        (measurement) =>
          measurement.executionState === "not-run" &&
          measurement.result === null,
      ),
    ).toBe(true);
  });
});

describe("Planner Task 5.5 measurement reducers", () => {
  it("summarizes route LCP/CLS and non-canvas INP using the supported distributions", () => {
    const routeSamples: RouteEntrySample[] = SUPPORTED_ROUTE_PATHS.flatMap(
      (route) =>
        Array.from({ length: 20 }, (_, index) => ({
          route,
          lcpMs: 1_200 + index * 10,
          cls: 0.02 + index * 0.001,
        })),
    );
    const routeSummary = summarizeRouteEntry(
      getSupportedTestProfile("profile-route-entry-cold-v1"),
      routeSamples,
    );

    expect(routeSummary.actualSampleCount).toBe(60);
    expect(routeSummary.lcpP75Ms).toBe(1_340);
    expect(routeSummary.clsMaximum).toBeCloseTo(0.039);
    expect(routeSummary.lcpStatus).toBe("within-budget");
    expect(routeSummary.clsStatus).toBe("within-budget");

    const inpSamples: NonCanvasInpSample[] = NON_CANVAS_INTERACTIONS.flatMap(
      (interaction) =>
        Array.from({ length: 5 }, (_, index) => ({
          interaction,
          durationMs: 100 + index * 10,
        })),
    );
    const inpSummary = summarizeNonCanvasInp(
      getSupportedTestProfile("profile-non-canvas-inp-warm-v1"),
      inpSamples,
    );

    expect(inpSummary.actualSampleCount).toBe(20);
    expect(inpSummary.inpP75Ms).toBe(130);
    expect(inpSummary.status).toBe("within-budget");
  });

  it("summarizes all six canvas actions and direct visible feedback", () => {
    const canvasSamples: CanvasFrameSample[] = CANVAS_INTERACTIONS.flatMap(
      (interaction) =>
        Array.from({ length: 5 }, () => ({
          interaction,
          frameTimestampsMs: repeatTimestamps(20),
        })),
    );
    const canvasSummary = summarizeCanvasFps(
      getSupportedTestProfile("profile-canvas-fps-warm-v1"),
      canvasSamples,
    );

    expect(canvasSummary.actualSampleCount).toBe(30);
    expect(canvasSummary.medianFps).toBe(50);
    expect(Object.keys(canvasSummary.interactionMedianFps)).toEqual(
      CANVAS_INTERACTIONS,
    );
    expect(canvasSummary.status).toBe("within-budget");

    const feedbackSamples: DirectFeedbackSample[] =
      DIRECT_FEEDBACK_INTERACTIONS.flatMap((interaction) =>
        Array.from({ length: 5 }, (_, index) => ({
          interaction,
          inputTimestampMs: index * 200,
          visibleFeedbackTimestampMs: index * 200 + 80,
        })),
      );
    const feedbackSummary = summarizeDirectFeedback(
      getSupportedTestProfile("profile-direct-feedback-warm-v1"),
      feedbackSamples,
    );

    expect(feedbackSummary.actualSampleCount).toBe(30);
    expect(feedbackSummary.maximumFeedbackMs).toBe(80);
    expect(feedbackSummary.status).toBe("within-budget");
  });

  it("keeps cold API values separate from warm p95 budget values", () => {
    const warmSamples: ApiLatencySample[] = PROJECT_API_OPERATIONS.flatMap(
      (operation) =>
        Array.from({ length: 20 }, (_, index) => ({
          operation,
          warmColdStatus: "warm" as const,
          durationMs: 900 + index * 10,
        })),
    );
    const coldSamples: ApiLatencySample[] = PROJECT_API_OPERATIONS.map(
      (operation, index) => ({
        operation,
        warmColdStatus: "cold",
        durationMs: 2_400 + index * 100,
      }),
    );
    const summary = summarizeApiLatency(
      getSupportedTestProfile("profile-api-warm-v1"),
      getSupportedTestProfile("profile-api-cold-v1"),
      [...warmSamples, ...coldSamples],
    );

    expect(summary.actualSampleCount).toBe(63);
    expect(summary.warmP95Ms).toEqual({ list: 1_080, load: 1_080, save: 1_080 });
    expect(summary.coldMs).toEqual({ list: 2_400, load: 2_500, save: 2_600 });
    expect(summary.warmStatus).toEqual({
      list: "within-budget",
      load: "within-budget",
      save: "within-budget",
    });
  });

  it("requires exactly twenty sequential cleanup cycles and reports retained resources", () => {
    const baseline = { projectEventListeners: 2, projectSubscriptions: 1 };
    const cleanSamples: CleanupCycleSample[] = Array.from(
      { length: 20 },
      (_, index) => ({
        cycle: index + 1,
        whileOpen: { projectEventListeners: 6, projectSubscriptions: 3 },
        afterClose: { ...baseline },
      }),
    );
    const profile = getSupportedTestProfile(
      "profile-cleanup-20-cycle-warm-v1",
    );
    const cleanSummary = summarizeCleanupCycles(
      profile,
      baseline,
      cleanSamples,
    );

    expect(cleanSummary.actualSampleCount).toBe(20);
    expect(cleanSummary.releasedAfterEveryClose).toBe(true);
    expect(cleanSummary.leakingCycles).toEqual([]);

    const leakingSamples = structuredClone(cleanSamples);
    leakingSamples[19] = {
      ...leakingSamples[19],
      afterClose: { projectEventListeners: 3, projectSubscriptions: 1 },
    };
    const leakingSummary = summarizeCleanupCycles(
      profile,
      baseline,
      leakingSamples,
    );

    expect(leakingSummary.releasedAfterEveryClose).toBe(false);
    expect(leakingSummary.leakingCycles).toEqual([20]);
  });

  it("rejects incomplete profile sample sets instead of generalizing partial evidence", () => {
    expect(() =>
      summarizeRouteEntry(
        getSupportedTestProfile("profile-route-entry-cold-v1"),
        [],
      ),
    ).toThrow("requires 60 samples");
  });
});
