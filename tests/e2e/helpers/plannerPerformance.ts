import {
  expect,
  type APIResponse,
  type Page,
  type TestInfo,
} from "@playwright/test";

import {
  PLANNER_PERFORMANCE_BUDGETS,
  summarizeCleanupCycles,
  type ApiLatencySample,
  type CanvasFrameSample,
  type CanvasInteraction,
  type CleanupCycleSample,
  type CleanupSummary,
  type DirectFeedbackInteraction,
  type DirectFeedbackSample,
  type NonCanvasInpSample,
  type NonCanvasInteraction,
  type ProjectApiOperation,
  type ResourceCountSnapshot,
  type RouteEntrySample,
  type SupportedRoutePath,
  type SupportedTestProfile,
  type WarmColdStatus,
} from "../../../plans/audit/28-canvas-features-logic/performanceMeasurement";
import type { RepresentativeProjectFixture } from "../../fixtures/planner/representativeProject";

interface PlannerPerformanceWindow {
  __plannerPerformanceEntries?: {
    lcpMs: number;
    cls: number;
    eventDurations: number[];
  };
  __plannerFabricView?: {
    getObjects?: () => unknown[];
    loadFromJSON?: (json: unknown) => Promise<unknown> | unknown;
    requestRenderAll?: () => void;
  };
  __plannerPerformanceResources?: {
    snapshot: () => ResourceCountSnapshot;
  };
}

export interface SupportedProfileDisposer {
  dispose: () => Promise<void>;
}

export interface ApiMeasurementInput {
  operation: ProjectApiOperation;
  projectId: string;
  project: RepresentativeProjectFixture["persistedProject"];
  warmColdStatus: WarmColdStatus;
  csrfToken?: string;
}

export function assertRequiredPerformanceProject(
  page: Page,
  browserName: string,
  testInfo: TestInfo,
  profile: SupportedTestProfile,
): void {
  if (testInfo.project.name !== "chromium-desktop" || browserName !== "chromium") {
    throw new Error(
      `Planner performance evidence requires project chromium-desktop; received ${testInfo.project.name}/${browserName}.`,
    );
  }
  const viewport = page.viewportSize();
  if (
    !viewport ||
    viewport.width !== profile.viewport.widthCssPx ||
    viewport.height !== profile.viewport.heightCssPx ||
    profile.viewport.deviceScaleFactor !== 1
  ) {
    throw new Error(
      `Profile ${profile.id} requires ${profile.viewport.widthCssPx}x${profile.viewport.heightCssPx} at device scale factor 1.`,
    );
  }
}

export async function applySupportedProfile(
  page: Page,
  profile: SupportedTestProfile,
): Promise<SupportedProfileDisposer> {
  await page.setViewportSize({
    width: profile.viewport.widthCssPx,
    height: profile.viewport.heightCssPx,
  });
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setCPUThrottlingRate", {
    rate: profile.cpu.throttleRate,
  });
  await session.send("Network.emulateNetworkConditions", {
    offline: profile.network.offline,
    latency: profile.network.latencyMs,
    downloadThroughput: (profile.network.downloadKbps * 1_000) / 8,
    uploadThroughput: (profile.network.uploadKbps * 1_000) / 8,
    packetLoss: profile.network.packetLossPercent,
  });

  return {
    dispose: async () => {
      await session
        .send("Emulation.setCPUThrottlingRate", { rate: 1 })
        .catch(() => undefined);
      await session
        .send("Network.emulateNetworkConditions", {
          offline: false,
          latency: 0,
          downloadThroughput: -1,
          uploadThroughput: -1,
          packetLoss: 0,
        })
        .catch(() => undefined);
      await session.detach().catch(() => undefined);
    },
  };
}

export async function installPerformanceObservers(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const target = window as unknown as PlannerPerformanceWindow;
    target.__plannerPerformanceEntries = {
      lcpMs: 0,
      cls: 0,
      eventDurations: [],
    };
    const bag = target.__plannerPerformanceEntries;

    if (typeof PerformanceObserver === "undefined") {
      return;
    }
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          bag.lcpMs = Math.max(bag.lcpMs, entry.startTime);
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // Capability is asserted when the sample is collected.
    }
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            value?: number;
            hadRecentInput?: boolean;
          };
          if (!shift.hadRecentInput) bag.cls += shift.value ?? 0;
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      // Capability is asserted when the sample is collected.
    }
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const event = entry as PerformanceEntry & { interactionId?: number };
          if ((event.interactionId ?? 0) > 0) bag.eventDurations.push(entry.duration);
        }
      }).observe({ type: "event", buffered: true, durationThreshold: 16 });
    } catch {
      // Capability is asserted when the sample is collected.
    }
  });
}

export async function collectRouteEntrySample(
  page: Page,
  route: SupportedRoutePath,
  navigableRoute: string = route,
): Promise<RouteEntrySample> {
  await page.goto(navigableRoute, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const values = await page.evaluate(() => {
    const bag = (window as unknown as PlannerPerformanceWindow)
      .__plannerPerformanceEntries;
    return bag ? { lcpMs: bag.lcpMs, cls: bag.cls } : null;
  });
  if (!values || values.lcpMs <= 0) {
    throw new Error(
      `Route ${route} did not expose a supported Largest Contentful Paint measurement.`,
    );
  }
  return { route, ...values };
}

export async function measureNonCanvasInteraction(
  page: Page,
  interaction: NonCanvasInteraction,
  perform: () => Promise<void>,
): Promise<NonCanvasInpSample> {
  const before = await page.evaluate(
    () =>
      (window as unknown as PlannerPerformanceWindow)
        .__plannerPerformanceEntries?.eventDurations.length ?? 0,
  );
  await perform();
  await page.waitForTimeout(100);
  const durations = await page.evaluate(
    (start) =>
      (window as unknown as PlannerPerformanceWindow)
        .__plannerPerformanceEntries?.eventDurations.slice(start) ?? [],
    before,
  );
  if (durations.length === 0) {
    throw new Error(
      `Interaction ${interaction} produced no supported Event Timing interaction entry.`,
    );
  }
  return { interaction, durationMs: Math.max(...durations) };
}

export async function measureCanvasFrames(
  page: Page,
  interaction: CanvasInteraction,
  perform: () => Promise<void>,
  durationMs = 2_000,
): Promise<CanvasFrameSample> {
  const trace = page.evaluate(
    (duration) =>
      new Promise<number[]>((resolve) => {
        const timestamps: number[] = [];
        const started = performance.now();
        const frame = (timestamp: number) => {
          timestamps.push(timestamp);
          if (timestamp - started >= duration) resolve(timestamps);
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }),
    durationMs,
  );
  await perform();
  const frameTimestampsMs = await trace;
  if (frameTimestampsMs.length < 2) {
    throw new Error(`Canvas interaction ${interaction} produced no frame trace.`);
  }
  return { interaction, frameTimestampsMs };
}

export async function measureDirectFeedback(
  page: Page,
  interaction: DirectFeedbackInteraction,
  perform: () => Promise<void>,
): Promise<DirectFeedbackSample> {
  const inputTimestampMs = await page.evaluate(() => performance.now());
  await perform();
  const visibleFeedbackTimestampMs = await page.evaluate(
    () => new Promise<number>((resolve) => requestAnimationFrame(resolve)),
  );
  return { interaction, inputTimestampMs, visibleFeedbackTimestampMs };
}

export async function loadRepresentativeProjectIntoCanvas(
  page: Page,
  fixture: RepresentativeProjectFixture,
): Promise<void> {
  const expectedCount = fixture.persistedProject.canvas_json.objects.length;
  const actualCount = await page.evaluate(async (input) => {
    const canvas = (window as unknown as PlannerPerformanceWindow)
      .__plannerFabricView;
    if (!canvas?.loadFromJSON || !canvas.getObjects) {
      throw new Error("Planner Fabric measurement hook is unavailable.");
    }
    await canvas.loadFromJSON(input.canvasJson);
    canvas.requestRenderAll?.();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return canvas.getObjects().length;
  }, { canvasJson: fixture.persistedProject.canvas_json });
  expect(actualCount).toBe(expectedCount);
}

async function requireSuccessfulResponse(
  response: APIResponse,
  operation: ProjectApiOperation,
): Promise<void> {
  if (!response.ok()) {
    throw new Error(
      `Planner ${operation} measurement prerequisite failed with HTTP ${response.status()}: ${await response.text()}`,
    );
  }
}

export async function measureApiOperation(
  page: Page,
  input: ApiMeasurementInput,
): Promise<ApiLatencySample> {
  const basePath = "/api/Planner/projects";
  const started = performance.now();
  let response: APIResponse;
  if (input.operation === "list") {
    response = await page.request.get(basePath);
  } else if (input.operation === "load") {
    response = await page.request.get(`${basePath}/${encodeURIComponent(input.projectId)}`);
  } else {
    if (!input.csrfToken) {
      throw new Error("Planner save latency requires an authorized CSRF token.");
    }
    response = await page.request.patch(
      `${basePath}/${encodeURIComponent(input.projectId)}`,
      {
        headers: { "x-csrf-token": input.csrfToken },
        data: {
          name: input.project.name,
          canvas_json: input.project.canvas_json,
          sheet: input.project.sheet,
          layers: input.project.layers,
        },
      },
    );
  }
  await requireSuccessfulResponse(response, input.operation);
  return {
    operation: input.operation,
    warmColdStatus: input.warmColdStatus,
    durationMs: performance.now() - started,
  };
}

export async function readProjectResourceSnapshot(
  page: Page,
): Promise<ResourceCountSnapshot> {
  return page.evaluate(() => {
    const hook = (window as unknown as PlannerPerformanceWindow)
      .__plannerPerformanceResources;
    if (!hook?.snapshot) {
      throw new Error(
        "Project-specific listener/subscription instrumentation is unavailable; cleanup evidence cannot be inferred from DOM or heap state.",
      );
    }
    return hook.snapshot();
  });
}

export async function measureCleanupCycles(
  page: Page,
  profile: SupportedTestProfile,
  openProject: (cycle: number) => Promise<void>,
  closeProject: (cycle: number) => Promise<void>,
): Promise<CleanupSummary> {
  if (profile.sampleCount !== PLANNER_PERFORMANCE_BUDGETS.cleanupCycles) {
    throw new Error(
      `Cleanup profile must define exactly ${PLANNER_PERFORMANCE_BUDGETS.cleanupCycles} cycles.`,
    );
  }
  const baseline = await readProjectResourceSnapshot(page);
  const samples: CleanupCycleSample[] = [];
  for (let cycle = 1; cycle <= PLANNER_PERFORMANCE_BUDGETS.cleanupCycles; cycle += 1) {
    await openProject(cycle);
    const whileOpen = await readProjectResourceSnapshot(page);
    await closeProject(cycle);
    const afterClose = await readProjectResourceSnapshot(page);
    samples.push({ cycle, whileOpen, afterClose });
  }
  return summarizeCleanupCycles(profile, baseline, samples);
}
