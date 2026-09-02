import type {
  EvidenceClass,
  EvidenceRecord,
  InputMethod,
  RequirementRef,
  ViewportClass,
} from "./auditModel";
import {
  REPRESENTATIVE_FIXTURE_ID,
  REPRESENTATIVE_FIXTURE_VERSION,
} from "./representativeProjectFixture";

export const TASK_5_5_REQUIREMENTS = [
  "16.1",
  "16.2",
  "16.3",
  "16.4",
  "16.5",
  "16.6",
  "16.7",
  "18.1",
  "19.4",
] as const satisfies readonly RequirementRef[];

export const PLANNER_PERFORMANCE_BUDGETS = {
  lcpP75Ms: 2_500,
  inpP75Ms: 200,
  clsMaximum: 0.1,
  canvasMedianFps: 30,
  directFeedbackMaximumMs: 100,
  apiWarmP95Ms: 2_000,
  cleanupCycles: 20,
} as const;

export const SUPPORTED_ROUTE_PATHS = [
  "/ooplanner",
  "/ooplanner/projects",
  "/ooplanner/projects/[id]",
] as const;
export type SupportedRoutePath = (typeof SUPPORTED_ROUTE_PATHS)[number];

export const CANVAS_INTERACTIONS = [
  "pan",
  "zoom",
  "selection",
  "move",
  "rotate",
  "resize",
] as const;
export type CanvasInteraction = (typeof CANVAS_INTERACTIONS)[number];

export const NON_CANVAS_INTERACTIONS = [
  "open-catalog-panel",
  "open-project-menu",
  "open-save-dialog",
  "dismiss-dialog",
] as const;
export type NonCanvasInteraction = (typeof NON_CANVAS_INTERACTIONS)[number];

export const DIRECT_FEEDBACK_INTERACTIONS = [
  "pan-start",
  "zoom-start",
  "selection-start",
  "move-start",
  "rotate-start",
  "resize-start",
] as const;
export type DirectFeedbackInteraction =
  (typeof DIRECT_FEEDBACK_INTERACTIONS)[number];

export const PROJECT_API_OPERATIONS = ["list", "load", "save"] as const;
export type ProjectApiOperation = (typeof PROJECT_API_OPERATIONS)[number];

export type MeasurementKind =
  | "route-lcp-cls"
  | "non-canvas-inp"
  | "canvas-fps"
  | "direct-feedback"
  | "api-latency"
  | "listener-subscription-cleanup";
export type WarmColdStatus = "cold" | "warm";
export type MeasurementInputMethod = InputMethod | "programmatic";
export type MeasurementExecutionState = "not-run";
export type BudgetStatus = "within-budget" | "budget-missed";

export interface SupportedViewportFixture {
  id: string;
  viewportClass: ViewportClass;
  widthCssPx: number;
  heightCssPx: number;
  orientation: "landscape" | "portrait";
  deviceScaleFactor: number;
}

export interface SupportedBrowserFixture {
  id: string;
  name: "chromium";
  channel: "playwright-bundled";
  versionFixture: "resolve-installed-version-at-execution";
}

export interface SupportedDeviceFixture {
  id: string;
  category: "desktop";
  model: string;
  logicalCpuCores: number;
  memoryGb: number;
  emulated: true;
}

export interface SupportedCpuFixture {
  id: string;
  throttleRate: number;
}

export interface SupportedNetworkFixture {
  id: string;
  name: "slow-4g";
  latencyMs: number;
  downloadKbps: number;
  uploadKbps: number;
  packetLossPercent: number;
  offline: false;
}

export interface SupportedTestProfile {
  id: string;
  measurementKind: MeasurementKind;
  viewport: SupportedViewportFixture;
  orientation: SupportedViewportFixture["orientation"];
  inputMethod: MeasurementInputMethod;
  browser: SupportedBrowserFixture;
  device: SupportedDeviceFixture;
  cpu: SupportedCpuFixture;
  network: SupportedNetworkFixture;
  projectFixture: {
    id: typeof REPRESENTATIVE_FIXTURE_ID;
    version: typeof REPRESENTATIVE_FIXTURE_VERSION;
  };
  warmColdStatus: WarmColdStatus;
  sampleCount: number;
  sampleDistribution: string;
  method: string;
  evidenceClass: Extract<EvidenceClass, "browser" | "integration">;
}

export interface PlannedMeasurement {
  profile: SupportedTestProfile;
  executionState: MeasurementExecutionState;
  result: null;
  limitation: string;
}

const DESKTOP_VIEWPORT: SupportedViewportFixture = {
  id: "desktop-1440x900-landscape-v1",
  viewportClass: "desktop",
  widthCssPx: 1_440,
  heightCssPx: 900,
  orientation: "landscape",
  deviceScaleFactor: 1,
};

const CHROMIUM_BROWSER: SupportedBrowserFixture = {
  id: "playwright-bundled-chromium-v1",
  name: "chromium",
  channel: "playwright-bundled",
  versionFixture: "resolve-installed-version-at-execution",
};

const MID_TIER_DEVICE: SupportedDeviceFixture = {
  id: "mid-tier-desktop-emulation-v1",
  category: "desktop",
  model: "4-core-8-gb-reference",
  logicalCpuCores: 4,
  memoryGb: 8,
  emulated: true,
};

const THROTTLED_CPU: SupportedCpuFixture = {
  id: "cpu-throttle-4x-v1",
  throttleRate: 4,
};

const SLOW_4G_NETWORK: SupportedNetworkFixture = {
  id: "slow-4g-150ms-v1",
  name: "slow-4g",
  latencyMs: 150,
  downloadKbps: 1_600,
  uploadKbps: 750,
  packetLossPercent: 0,
  offline: false,
};

function profile(
  input: Omit<
    SupportedTestProfile,
    | "viewport"
    | "orientation"
    | "browser"
    | "device"
    | "cpu"
    | "network"
    | "projectFixture"
  >,
): SupportedTestProfile {
  return {
    ...input,
    viewport: structuredClone(DESKTOP_VIEWPORT),
    orientation: DESKTOP_VIEWPORT.orientation,
    browser: structuredClone(CHROMIUM_BROWSER),
    device: structuredClone(MID_TIER_DEVICE),
    cpu: structuredClone(THROTTLED_CPU),
    network: structuredClone(SLOW_4G_NETWORK),
    projectFixture: {
      id: REPRESENTATIVE_FIXTURE_ID,
      version: REPRESENTATIVE_FIXTURE_VERSION,
    },
  };
}

export const SUPPORTED_TEST_PROFILES: readonly SupportedTestProfile[] = [
  profile({
    id: "profile-route-entry-cold-v1",
    measurementKind: "route-lcp-cls",
    inputMethod: "pointer",
    warmColdStatus: "cold",
    sampleCount: 60,
    sampleDistribution: "20 isolated browser contexts for each of the three supported Planner routes",
    method:
      "Create a fresh browser context per sample, navigate directly to the route, collect largest-contentful-paint entries until page hide, and sum layout-shift entries that had no recent input.",
    evidenceClass: "browser",
  }),
  profile({
    id: "profile-non-canvas-inp-warm-v1",
    measurementKind: "non-canvas-inp",
    inputMethod: "pointer",
    warmColdStatus: "warm",
    sampleCount: 20,
    sampleDistribution: "5 samples for each of four named non-canvas interactions",
    method:
      "After route and fixture stabilization, perform each named control interaction and record Event Timing duration for the interaction id; exclude canvas gestures.",
    evidenceClass: "browser",
  }),
  profile({
    id: "profile-canvas-fps-warm-v1",
    measurementKind: "canvas-fps",
    inputMethod: "pointer",
    warmColdStatus: "warm",
    sampleCount: 30,
    sampleDistribution: "5 two-second traces for each of pan, zoom, selection, move, rotate, and resize",
    method:
      "With the representative project visible, collect requestAnimationFrame timestamps during each named canvas manipulation and derive FPS from positive adjacent frame intervals.",
    evidenceClass: "browser",
  }),
  profile({
    id: "profile-direct-feedback-warm-v1",
    measurementKind: "direct-feedback",
    inputMethod: "pointer",
    warmColdStatus: "warm",
    sampleCount: 30,
    sampleDistribution: "5 samples for each of pan, zoom, selection, move, rotate, and resize start feedback",
    method:
      "Mark input dispatch and the first requestAnimationFrame containing the corresponding visible feedback, then subtract the monotonic timestamps.",
    evidenceClass: "browser",
  }),
  profile({
    id: "profile-api-cold-v1",
    measurementKind: "api-latency",
    inputMethod: "programmatic",
    warmColdStatus: "cold",
    sampleCount: 3,
    sampleDistribution: "1 explicitly cold local integration request for each of list, load, and save",
    method:
      "Start from the documented inactive local integration service state and time one complete request per operation; retain cold values separately from the warm p95 budget.",
    evidenceClass: "integration",
  }),
  profile({
    id: "profile-api-warm-v1",
    measurementKind: "api-latency",
    inputMethod: "programmatic",
    warmColdStatus: "warm",
    sampleCount: 60,
    sampleDistribution: "20 warmed local integration requests for each of list, load, and save",
    method:
      "After one excluded warm-up request, measure monotonic client request-to-complete duration against the authorized local integration environment and compute p95 per operation.",
    evidenceClass: "integration",
  }),
  profile({
    id: "profile-cleanup-20-cycle-warm-v1",
    measurementKind: "listener-subscription-cleanup",
    inputMethod: "pointer",
    warmColdStatus: "warm",
    sampleCount: PLANNER_PERFORMANCE_BUDGETS.cleanupCycles,
    sampleDistribution: "20 sequential load/open/close cycles of the same representative project",
    method:
      "Instrument project-scoped listener and subscription registration, capture one pre-cycle baseline, and compare both counters after each close for exactly 20 cycles.",
    evidenceClass: "browser",
  }),
];

export const PLANNED_MEASUREMENTS: readonly PlannedMeasurement[] =
  SUPPORTED_TEST_PROFILES.map((supportedProfile) => ({
    profile: structuredClone(supportedProfile),
    executionState: "not-run" as const,
    result: null,
    limitation:
      "This is a deterministic measurement definition only. No browser, integration, hosted, or deployment result has been executed or claimed.",
  }));

export const TASK_5_5_REPOSITORY_EVIDENCE: EvidenceRecord = {
  id: "evidence:task-5.5-performance-fixtures-and-measurement-code",
  class: "repository",
  summary:
    "Task 5.5 defines a deterministic representative project, complete supported profiles, and pure reducers for every required performance and cleanup metric.",
  sourceRefs: [
    "plans/planner-comprehensive-audit/representativeProjectFixture.ts",
    "plans/planner-comprehensive-audit/performanceMeasurement.ts",
    "tests/unit/planner/plannerPerformanceMeasurement.test.ts",
  ],
  limitation:
    "Static repository evidence proves only that fixtures, profiles, and measurement reducers are authored. Browser values, API integration latency, cleanup behavior, and budget compliance remain unverified until separately authorized execution.",
  artifact: {
    authorship: "authored",
    path: "plans/planner-comprehensive-audit/performanceMeasurement.ts",
  },
};

export interface MeasurementSummaryMetadata {
  profile: SupportedTestProfile;
  actualSampleCount: number;
}

export interface RouteEntrySample {
  route: SupportedRoutePath;
  lcpMs: number;
  cls: number;
}

export interface RouteEntrySummary extends MeasurementSummaryMetadata {
  lcpP75Ms: number;
  clsMaximum: number;
  routeValues: Readonly<
    Record<SupportedRoutePath, { lcpP75Ms: number; clsMaximum: number }>
  >;
  lcpStatus: BudgetStatus;
  clsStatus: BudgetStatus;
}

export interface NonCanvasInpSample {
  interaction: NonCanvasInteraction;
  durationMs: number;
}

export interface NonCanvasInpSummary extends MeasurementSummaryMetadata {
  inpP75Ms: number;
  interactionP75Ms: Readonly<Record<NonCanvasInteraction, number>>;
  status: BudgetStatus;
}

export interface CanvasFrameSample {
  interaction: CanvasInteraction;
  frameTimestampsMs: readonly number[];
}

export interface CanvasFpsSummary extends MeasurementSummaryMetadata {
  medianFps: number;
  interactionMedianFps: Readonly<Record<CanvasInteraction, number>>;
  status: BudgetStatus;
}

export interface DirectFeedbackSample {
  interaction: DirectFeedbackInteraction;
  inputTimestampMs: number;
  visibleFeedbackTimestampMs: number;
}

export interface DirectFeedbackSummary extends MeasurementSummaryMetadata {
  maximumFeedbackMs: number;
  interactionMaximumMs: Readonly<Record<DirectFeedbackInteraction, number>>;
  status: BudgetStatus;
}

export interface ApiLatencySample {
  operation: ProjectApiOperation;
  warmColdStatus: WarmColdStatus;
  durationMs: number;
}

export interface ApiLatencySummary {
  warmProfile: SupportedTestProfile;
  coldProfile: SupportedTestProfile;
  actualSampleCount: number;
  warmP95Ms: Readonly<Record<ProjectApiOperation, number>>;
  coldMs: Readonly<Record<ProjectApiOperation, number>>;
  warmStatus: Readonly<Record<ProjectApiOperation, BudgetStatus>>;
}

export interface ResourceCountSnapshot {
  projectEventListeners: number;
  projectSubscriptions: number;
}

export interface CleanupCycleSample {
  cycle: number;
  whileOpen: ResourceCountSnapshot;
  afterClose: ResourceCountSnapshot;
}

export interface CleanupSummary extends MeasurementSummaryMetadata {
  baseline: ResourceCountSnapshot;
  cycleDeltas: readonly {
    cycle: number;
    listenerDelta: number;
    subscriptionDelta: number;
  }[];
  leakingCycles: readonly number[];
  releasedAfterEveryClose: boolean;
}

function assertFiniteNonNegative(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a finite non-negative number.`);
  }
}

function percentile(values: readonly number[], proportion: number): number {
  if (values.length === 0) {
    throw new Error("A percentile requires at least one sample.");
  }
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil(proportion * sorted.length) - 1);
  const value = sorted[index];
  if (value === undefined) {
    throw new Error("The percentile index did not resolve to a sample.");
  }
  return value;
}

function median(values: readonly number[]): number {
  if (values.length === 0) {
    throw new Error("A median requires at least one sample.");
  }
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    const value = sorted[middle];
    if (value === undefined) {
      throw new Error("The median index did not resolve to a sample.");
    }
    return value;
  }
  const lower = sorted[middle - 1];
  const upper = sorted[middle];
  if (lower === undefined || upper === undefined) {
    throw new Error("The median indices did not resolve to samples.");
  }
  return (lower + upper) / 2;
}

function assertProfile(
  supportedProfile: SupportedTestProfile,
  measurementKind: MeasurementKind,
  actualSampleCount: number,
): void {
  if (supportedProfile.measurementKind !== measurementKind) {
    throw new Error(
      `Profile ${supportedProfile.id} is for ${supportedProfile.measurementKind}, not ${measurementKind}.`,
    );
  }
  if (supportedProfile.sampleCount !== actualSampleCount) {
    throw new Error(
      `Profile ${supportedProfile.id} requires ${supportedProfile.sampleCount} samples; received ${actualSampleCount}.`,
    );
  }
}

function valuesForScenario<T extends string, TSample>(
  scenarios: readonly T[],
  samples: readonly TSample[],
  scenarioOf: (sample: TSample) => T,
  expectedPerScenario: number,
): Readonly<Record<T, TSample[]>> {
  const grouped = Object.fromEntries(
    scenarios.map((scenario) => [scenario, [] as TSample[]]),
  ) as Record<T, TSample[]>;
  for (const sample of samples) {
    grouped[scenarioOf(sample)].push(sample);
  }
  for (const scenario of scenarios) {
    if (grouped[scenario].length !== expectedPerScenario) {
      throw new Error(
        `Scenario ${scenario} requires ${expectedPerScenario} samples; received ${grouped[scenario].length}.`,
      );
    }
  }
  return grouped;
}

function statusAtMost(value: number, budget: number): BudgetStatus {
  return value <= budget ? "within-budget" : "budget-missed";
}

export function summarizeRouteEntry(
  supportedProfile: SupportedTestProfile,
  samples: readonly RouteEntrySample[],
): RouteEntrySummary {
  assertProfile(supportedProfile, "route-lcp-cls", samples.length);
  const expectedPerRoute = supportedProfile.sampleCount / SUPPORTED_ROUTE_PATHS.length;
  if (!Number.isInteger(expectedPerRoute)) {
    throw new Error("Route sample count must divide evenly across supported routes.");
  }
  for (const sample of samples) {
    assertFiniteNonNegative(sample.lcpMs, "Route LCP");
    assertFiniteNonNegative(sample.cls, "Route CLS");
  }
  const grouped = valuesForScenario(
    SUPPORTED_ROUTE_PATHS,
    samples,
    (sample) => sample.route,
    expectedPerRoute,
  );
  const routeValues = Object.fromEntries(
    SUPPORTED_ROUTE_PATHS.map((route) => [
      route,
      {
        lcpP75Ms: percentile(grouped[route].map((sample) => sample.lcpMs), 0.75),
        clsMaximum: Math.max(...grouped[route].map((sample) => sample.cls)),
      },
    ]),
  ) as Record<SupportedRoutePath, { lcpP75Ms: number; clsMaximum: number }>;
  const lcpP75Ms = Math.max(
    ...SUPPORTED_ROUTE_PATHS.map((route) => routeValues[route].lcpP75Ms),
  );
  const clsMaximum = Math.max(
    ...SUPPORTED_ROUTE_PATHS.map((route) => routeValues[route].clsMaximum),
  );

  return {
    profile: structuredClone(supportedProfile),
    actualSampleCount: samples.length,
    lcpP75Ms,
    clsMaximum,
    routeValues,
    lcpStatus: statusAtMost(lcpP75Ms, PLANNER_PERFORMANCE_BUDGETS.lcpP75Ms),
    clsStatus: statusAtMost(clsMaximum, PLANNER_PERFORMANCE_BUDGETS.clsMaximum),
  };
}

export function summarizeNonCanvasInp(
  supportedProfile: SupportedTestProfile,
  samples: readonly NonCanvasInpSample[],
): NonCanvasInpSummary {
  assertProfile(supportedProfile, "non-canvas-inp", samples.length);
  const expectedPerInteraction =
    supportedProfile.sampleCount / NON_CANVAS_INTERACTIONS.length;
  if (!Number.isInteger(expectedPerInteraction)) {
    throw new Error("INP sample count must divide evenly across interactions.");
  }
  for (const sample of samples) {
    assertFiniteNonNegative(sample.durationMs, "Non-canvas INP");
  }
  const grouped = valuesForScenario(
    NON_CANVAS_INTERACTIONS,
    samples,
    (sample) => sample.interaction,
    expectedPerInteraction,
  );
  const interactionP75Ms = Object.fromEntries(
    NON_CANVAS_INTERACTIONS.map((interaction) => [
      interaction,
      percentile(grouped[interaction].map((sample) => sample.durationMs), 0.75),
    ]),
  ) as Record<NonCanvasInteraction, number>;
  const inpP75Ms = percentile(samples.map((sample) => sample.durationMs), 0.75);
  return {
    profile: structuredClone(supportedProfile),
    actualSampleCount: samples.length,
    inpP75Ms,
    interactionP75Ms,
    status: statusAtMost(inpP75Ms, PLANNER_PERFORMANCE_BUDGETS.inpP75Ms),
  };
}

function framesPerSecond(frameTimestampsMs: readonly number[]): number {
  if (frameTimestampsMs.length < 2) {
    throw new Error("A canvas FPS trace requires at least two frame timestamps.");
  }
  const intervals: number[] = [];
  for (let index = 1; index < frameTimestampsMs.length; index += 1) {
    const previous = frameTimestampsMs[index - 1];
    const current = frameTimestampsMs[index];
    if (previous === undefined || current === undefined) {
      throw new Error("Canvas frame timestamps must be contiguous.");
    }
    assertFiniteNonNegative(previous, "Canvas frame timestamp");
    assertFiniteNonNegative(current, "Canvas frame timestamp");
    const interval = current - previous;
    if (interval <= 0) {
      throw new Error("Canvas frame timestamps must increase monotonically.");
    }
    intervals.push(interval);
  }
  return 1_000 / median(intervals);
}

export function summarizeCanvasFps(
  supportedProfile: SupportedTestProfile,
  samples: readonly CanvasFrameSample[],
): CanvasFpsSummary {
  assertProfile(supportedProfile, "canvas-fps", samples.length);
  const expectedPerInteraction =
    supportedProfile.sampleCount / CANVAS_INTERACTIONS.length;
  if (!Number.isInteger(expectedPerInteraction)) {
    throw new Error("Canvas FPS sample count must divide evenly across interactions.");
  }
  const grouped = valuesForScenario(
    CANVAS_INTERACTIONS,
    samples,
    (sample) => sample.interaction,
    expectedPerInteraction,
  );
  const interactionMedianFps = Object.fromEntries(
    CANVAS_INTERACTIONS.map((interaction) => [
      interaction,
      median(grouped[interaction].map((sample) => framesPerSecond(sample.frameTimestampsMs))),
    ]),
  ) as Record<CanvasInteraction, number>;
  const medianFps = median(
    CANVAS_INTERACTIONS.map((interaction) => interactionMedianFps[interaction]),
  );
  return {
    profile: structuredClone(supportedProfile),
    actualSampleCount: samples.length,
    medianFps,
    interactionMedianFps,
    status:
      medianFps >= PLANNER_PERFORMANCE_BUDGETS.canvasMedianFps
        ? "within-budget"
        : "budget-missed",
  };
}

export function summarizeDirectFeedback(
  supportedProfile: SupportedTestProfile,
  samples: readonly DirectFeedbackSample[],
): DirectFeedbackSummary {
  assertProfile(supportedProfile, "direct-feedback", samples.length);
  const expectedPerInteraction =
    supportedProfile.sampleCount / DIRECT_FEEDBACK_INTERACTIONS.length;
  if (!Number.isInteger(expectedPerInteraction)) {
    throw new Error("Direct-feedback sample count must divide evenly across interactions.");
  }
  for (const sample of samples) {
    assertFiniteNonNegative(sample.inputTimestampMs, "Direct-feedback input timestamp");
    assertFiniteNonNegative(
      sample.visibleFeedbackTimestampMs,
      "Direct-feedback visible timestamp",
    );
    if (sample.visibleFeedbackTimestampMs < sample.inputTimestampMs) {
      throw new Error("Visible feedback cannot precede its input timestamp.");
    }
  }
  const grouped = valuesForScenario(
    DIRECT_FEEDBACK_INTERACTIONS,
    samples,
    (sample) => sample.interaction,
    expectedPerInteraction,
  );
  const interactionMaximumMs = Object.fromEntries(
    DIRECT_FEEDBACK_INTERACTIONS.map((interaction) => [
      interaction,
      Math.max(
        ...grouped[interaction].map(
          (sample) => sample.visibleFeedbackTimestampMs - sample.inputTimestampMs,
        ),
      ),
    ]),
  ) as Record<DirectFeedbackInteraction, number>;
  const maximumFeedbackMs = Math.max(
    ...DIRECT_FEEDBACK_INTERACTIONS.map(
      (interaction) => interactionMaximumMs[interaction],
    ),
  );
  return {
    profile: structuredClone(supportedProfile),
    actualSampleCount: samples.length,
    maximumFeedbackMs,
    interactionMaximumMs,
    status: statusAtMost(
      maximumFeedbackMs,
      PLANNER_PERFORMANCE_BUDGETS.directFeedbackMaximumMs,
    ),
  };
}

export function summarizeApiLatency(
  warmProfile: SupportedTestProfile,
  coldProfile: SupportedTestProfile,
  samples: readonly ApiLatencySample[],
): ApiLatencySummary {
  const warmSamples = samples.filter((sample) => sample.warmColdStatus === "warm");
  const coldSamples = samples.filter((sample) => sample.warmColdStatus === "cold");
  assertProfile(warmProfile, "api-latency", warmSamples.length);
  assertProfile(coldProfile, "api-latency", coldSamples.length);
  if (warmProfile.warmColdStatus !== "warm" || coldProfile.warmColdStatus !== "cold") {
    throw new Error("API profiles must keep warm and cold samples separate.");
  }
  for (const sample of samples) {
    assertFiniteNonNegative(sample.durationMs, "API latency");
  }
  const warmPerOperation = warmProfile.sampleCount / PROJECT_API_OPERATIONS.length;
  const coldPerOperation = coldProfile.sampleCount / PROJECT_API_OPERATIONS.length;
  if (!Number.isInteger(warmPerOperation) || !Number.isInteger(coldPerOperation)) {
    throw new Error("API sample counts must divide evenly across operations.");
  }
  const groupedWarm = valuesForScenario(
    PROJECT_API_OPERATIONS,
    warmSamples,
    (sample) => sample.operation,
    warmPerOperation,
  );
  const groupedCold = valuesForScenario(
    PROJECT_API_OPERATIONS,
    coldSamples,
    (sample) => sample.operation,
    coldPerOperation,
  );
  const warmP95Ms = Object.fromEntries(
    PROJECT_API_OPERATIONS.map((operation) => [
      operation,
      percentile(groupedWarm[operation].map((sample) => sample.durationMs), 0.95),
    ]),
  ) as Record<ProjectApiOperation, number>;
  const coldMs = Object.fromEntries(
    PROJECT_API_OPERATIONS.map((operation) => [
      operation,
      groupedCold[operation][0]?.durationMs ?? 0,
    ]),
  ) as Record<ProjectApiOperation, number>;
  const warmStatus = Object.fromEntries(
    PROJECT_API_OPERATIONS.map((operation) => [
      operation,
      statusAtMost(warmP95Ms[operation], PLANNER_PERFORMANCE_BUDGETS.apiWarmP95Ms),
    ]),
  ) as Record<ProjectApiOperation, BudgetStatus>;
  return {
    warmProfile: structuredClone(warmProfile),
    coldProfile: structuredClone(coldProfile),
    actualSampleCount: samples.length,
    warmP95Ms,
    coldMs,
    warmStatus,
  };
}

export function summarizeCleanupCycles(
  supportedProfile: SupportedTestProfile,
  baseline: ResourceCountSnapshot,
  samples: readonly CleanupCycleSample[],
): CleanupSummary {
  assertProfile(
    supportedProfile,
    "listener-subscription-cleanup",
    samples.length,
  );
  if (samples.length !== PLANNER_PERFORMANCE_BUDGETS.cleanupCycles) {
    throw new Error(
      `Cleanup measurement requires exactly ${PLANNER_PERFORMANCE_BUDGETS.cleanupCycles} cycles.`,
    );
  }
  assertFiniteNonNegative(baseline.projectEventListeners, "Baseline listeners");
  assertFiniteNonNegative(baseline.projectSubscriptions, "Baseline subscriptions");
  const cycleDeltas = samples.map((sample, index) => {
    if (sample.cycle !== index + 1) {
      throw new Error("Cleanup cycles must be sequential and one-indexed.");
    }
    for (const [name, value] of Object.entries(sample.whileOpen)) {
      assertFiniteNonNegative(value, `Open-cycle ${name}`);
    }
    for (const [name, value] of Object.entries(sample.afterClose)) {
      assertFiniteNonNegative(value, `Closed-cycle ${name}`);
    }
    if (
      sample.whileOpen.projectEventListeners < baseline.projectEventListeners ||
      sample.whileOpen.projectSubscriptions < baseline.projectSubscriptions
    ) {
      throw new Error("Open-cycle resource counts cannot be below the pre-cycle baseline.");
    }
    return {
      cycle: sample.cycle,
      listenerDelta:
        sample.afterClose.projectEventListeners - baseline.projectEventListeners,
      subscriptionDelta:
        sample.afterClose.projectSubscriptions - baseline.projectSubscriptions,
    };
  });
  const leakingCycles = cycleDeltas
    .filter(
      (cycle) => cycle.listenerDelta !== 0 || cycle.subscriptionDelta !== 0,
    )
    .map((cycle) => cycle.cycle);
  return {
    profile: structuredClone(supportedProfile),
    actualSampleCount: samples.length,
    baseline: structuredClone(baseline),
    cycleDeltas,
    leakingCycles,
    releasedAfterEveryClose: leakingCycles.length === 0,
  };
}

export function validateSupportedTestProfiles(
  profiles: readonly SupportedTestProfile[] = SUPPORTED_TEST_PROFILES,
): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  const representedKinds = new Set<MeasurementKind>();
  for (const supportedProfile of profiles) {
    if (ids.has(supportedProfile.id)) {
      issues.push(`Duplicate supported profile id: ${supportedProfile.id}`);
    }
    ids.add(supportedProfile.id);
    representedKinds.add(supportedProfile.measurementKind);
    if (supportedProfile.orientation !== supportedProfile.viewport.orientation) {
      issues.push(`Profile ${supportedProfile.id} has inconsistent orientation metadata.`);
    }
    if (supportedProfile.sampleCount <= 0 || supportedProfile.method.trim().length === 0) {
      issues.push(`Profile ${supportedProfile.id} requires a sample count and method.`);
    }
    if (
      supportedProfile.browser.id.trim().length === 0 ||
      supportedProfile.device.id.trim().length === 0 ||
      supportedProfile.cpu.id.trim().length === 0 ||
      supportedProfile.network.id.trim().length === 0
    ) {
      issues.push(`Profile ${supportedProfile.id} requires browser, device, CPU, and network fixtures.`);
    }
    if (
      supportedProfile.projectFixture.id !== REPRESENTATIVE_FIXTURE_ID ||
      supportedProfile.projectFixture.version !== REPRESENTATIVE_FIXTURE_VERSION
    ) {
      issues.push(`Profile ${supportedProfile.id} does not reference the representative project.`);
    }
    const expectedEvidenceClass =
      supportedProfile.measurementKind === "api-latency" ? "integration" : "browser";
    if (supportedProfile.evidenceClass !== expectedEvidenceClass) {
      issues.push(
        `Profile ${supportedProfile.id} must use ${expectedEvidenceClass} evidence.`,
      );
    }
  }
  const allKinds: readonly MeasurementKind[] = [
    "route-lcp-cls",
    "non-canvas-inp",
    "canvas-fps",
    "direct-feedback",
    "api-latency",
    "listener-subscription-cleanup",
  ];
  for (const measurementKind of allKinds) {
    if (!representedKinds.has(measurementKind)) {
      issues.push(`Missing supported profile for ${measurementKind}.`);
    }
  }
  const apiStatuses = new Set(
    profiles
      .filter((candidate) => candidate.measurementKind === "api-latency")
      .map((candidate) => candidate.warmColdStatus),
  );
  if (!apiStatuses.has("cold") || !apiStatuses.has("warm")) {
    issues.push("API latency requires separate cold and warm supported profiles.");
  }
  return issues.sort();
}

const profileIssues = validateSupportedTestProfiles();
if (profileIssues.length > 0) {
  throw new Error(`Invalid supported Planner test profiles:\n${profileIssues.join("\n")}`);
}

export function getSupportedTestProfile(id: string): SupportedTestProfile {
  const supportedProfile = SUPPORTED_TEST_PROFILES.find(
    (candidate) => candidate.id === id,
  );
  if (!supportedProfile) {
    throw new Error(`Unknown supported Planner test profile: ${id}`);
  }
  return structuredClone(supportedProfile);
}
