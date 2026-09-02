// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 26: Performance finding completeness
// Validates: Requirements 16.8
//
// For every generated missed performance budget, measured value, complete
// supported profile, bottleneck evidence, and remediation status are mandatory.

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { AuditFinding } from "../../../plans/planner-comprehensive-audit/auditModel";
import {
  PERFORMANCE_METRICS,
  PERFORMANCE_REMEDIATION_STATUSES,
  isCompletePerformanceFinding,
  validatePerformanceFindingCompleteness,
  type PerformanceFindingCandidate,
  type PerformanceMeasuredValue,
  type PerformanceMetric,
  type PerformanceRemediationStatus,
} from "../../../plans/planner-comprehensive-audit/performanceEvidence";
import {
  getSupportedTestProfile,
  PLANNER_PERFORMANCE_BUDGETS,
  type SupportedTestProfile,
} from "../../../plans/planner-comprehensive-audit/performanceMeasurement";

const PROPERTY_SEED = 26_202_608;
const PROPERTY_RUNS = 200;

interface MetricContract {
  profileId: string;
  makeMissedValue: (offset: number) => PerformanceMeasuredValue;
}

const METRIC_CONTRACTS: Readonly<Record<PerformanceMetric, MetricContract>> = {
  "route-lcp-p75": {
    profileId: "profile-route-entry-cold-v1",
    makeMissedValue: (offset) => ({
      metric: "route-lcp-p75",
      value: PLANNER_PERFORMANCE_BUDGETS.lcpP75Ms + offset,
      unit: "ms",
      budget: PLANNER_PERFORMANCE_BUDGETS.lcpP75Ms,
      status: "budget-missed",
    }),
  },
  "route-cls-maximum": {
    profileId: "profile-route-entry-cold-v1",
    makeMissedValue: (offset) => ({
      metric: "route-cls-maximum",
      value: PLANNER_PERFORMANCE_BUDGETS.clsMaximum + offset / 1_000,
      unit: "layout-shift",
      budget: PLANNER_PERFORMANCE_BUDGETS.clsMaximum,
      status: "budget-missed",
    }),
  },
  "non-canvas-inp-p75": {
    profileId: "profile-non-canvas-inp-warm-v1",
    makeMissedValue: (offset) => ({
      metric: "non-canvas-inp-p75",
      value: PLANNER_PERFORMANCE_BUDGETS.inpP75Ms + offset,
      unit: "ms",
      budget: PLANNER_PERFORMANCE_BUDGETS.inpP75Ms,
      status: "budget-missed",
    }),
  },
  "canvas-median-fps": {
    profileId: "profile-canvas-fps-warm-v1",
    makeMissedValue: (offset) => ({
      metric: "canvas-median-fps",
      value: Math.max(0, PLANNER_PERFORMANCE_BUDGETS.canvasMedianFps - offset),
      unit: "fps",
      budget: PLANNER_PERFORMANCE_BUDGETS.canvasMedianFps,
      status: "budget-missed",
    }),
  },
  "direct-feedback-maximum": {
    profileId: "profile-direct-feedback-warm-v1",
    makeMissedValue: (offset) => ({
      metric: "direct-feedback-maximum",
      value: PLANNER_PERFORMANCE_BUDGETS.directFeedbackMaximumMs + offset,
      unit: "ms",
      budget: PLANNER_PERFORMANCE_BUDGETS.directFeedbackMaximumMs,
      status: "budget-missed",
    }),
  },
  "api-warm-p95": {
    profileId: "profile-api-warm-v1",
    makeMissedValue: (offset) => ({
      metric: "api-warm-p95",
      value: PLANNER_PERFORMANCE_BUDGETS.apiWarmP95Ms + offset,
      unit: "ms",
      budget: PLANNER_PERFORMANCE_BUDGETS.apiWarmP95Ms,
      status: "budget-missed",
    }),
  },
  "listener-subscription-cleanup": {
    profileId: "profile-cleanup-20-cycle-warm-v1",
    makeMissedValue: () => ({
      metric: "listener-subscription-cleanup",
      value: false,
      unit: "released-after-close",
      budget: true,
      status: "budget-missed",
    }),
  },
};

function baseFinding(metric: PerformanceMetric): AuditFinding {
  return {
    id: `finding:performance:${metric}`,
    title: `Measured Planner performance budget miss: ${metric}`,
    severity: "medium",
    state: "verified",
    routeIds: ["area:route:ooplanner"],
    workflowIds: [`workflow:performance:${metric}`],
    adjacentWorkflowIds: ["workflow:planner-save"],
    sourcePaths: ["site/app/ooplanner/page.tsx"],
    requirementRefs: ["16.8"],
    reproductionEvidenceRefs: [`evidence:measurement:${metric}`],
    completionEvidenceRefs: [],
    expected: "The documented supported-profile performance budget is met.",
    observed: `The measured ${metric} value missed its documented budget.`,
    affectedScope: ["Planner supported desktop performance profile"],
    remediationPaths: ["site/components/Planner"],
    validationIds: [`validation:performance:${metric}`],
  };
}

function completeCandidate(
  metric: PerformanceMetric,
  offset: number,
  remediationStatus: PerformanceRemediationStatus,
): PerformanceFindingCandidate {
  const contract = METRIC_CONTRACTS[metric];
  return {
    ...baseFinding(metric),
    measuredValue: contract.makeMissedValue(offset),
    testProfile: getSupportedTestProfile(contract.profileId),
    bottleneckEvidenceRefs: [`evidence:bottleneck:${metric}`],
    remediationStatus,
  };
}

const completeFindingArbitrary = fc
  .tuple(
    fc.constantFrom(...PERFORMANCE_METRICS),
    fc.integer({ min: 1, max: 10_000 }),
    fc.constantFrom(...PERFORMANCE_REMEDIATION_STATUSES),
  )
  .map(([metric, offset, remediationStatus]) =>
    completeCandidate(metric, offset, remediationStatus),
  );

type MissingDimension =
  | "measured-value"
  | "profile"
  | "profile-field"
  | "bottleneck-evidence"
  | "remediation-status";

const missingDimensionArbitrary = fc.constantFrom<MissingDimension>(
  "measured-value",
  "profile",
  "profile-field",
  "bottleneck-evidence",
  "remediation-status",
);

function invalidateCandidate(
  source: PerformanceFindingCandidate,
  dimension: MissingDimension,
): PerformanceFindingCandidate {
  const candidate = structuredClone(source);
  if (dimension === "measured-value") {
    delete candidate.measuredValue;
  } else if (dimension === "profile") {
    delete candidate.testProfile;
  } else if (dimension === "profile-field") {
    if (!candidate.testProfile) throw new Error("Generated profile is missing.");
    candidate.testProfile.method = "";
  } else if (dimension === "bottleneck-evidence") {
    candidate.bottleneckEvidenceRefs = [];
  } else {
    delete candidate.remediationStatus;
  }
  return candidate;
}

function expectedIssuePath(dimension: MissingDimension): string {
  if (dimension === "measured-value") return "measuredValue";
  if (dimension === "profile" || dimension === "profile-field") {
    return "testProfile";
  }
  if (dimension === "bottleneck-evidence") return "bottleneckEvidenceRefs";
  return "remediationStatus";
}

function cloneProfile(profile: SupportedTestProfile): SupportedTestProfile {
  return structuredClone(profile);
}

describe("Property 26: Performance finding completeness", () => {
  it("accepts every complete generated budget-miss finding deterministically without mutation", () => {
    fc.assert(
      fc.property(completeFindingArbitrary, (candidate) => {
        const before = structuredClone(candidate);
        const first = validatePerformanceFindingCompleteness(candidate);
        const second = validatePerformanceFindingCompleteness(candidate);

        expect(first).toEqual({ valid: true, issues: [] });
        expect(second).toEqual(first);
        expect(candidate).toEqual(before);
        expect(isCompletePerformanceFinding(candidate)).toBe(true);
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED, endOnFailure: true },
    );
  });

  it("rejects every generated finding missing one mandatory completeness dimension", () => {
    fc.assert(
      fc.property(
        completeFindingArbitrary,
        missingDimensionArbitrary,
        (complete, dimension) => {
          const candidate = invalidateCandidate(complete, dimension);
          const result = validatePerformanceFindingCompleteness(candidate);

          expect(result.valid).toBe(false);
          expect(
            result.issues.some((issue) =>
              issue.path.startsWith(expectedIssuePath(dimension)),
            ),
          ).toBe(true);
          expect(isCompletePerformanceFinding(candidate)).toBe(false);
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED + 1, endOnFailure: true },
    );
  });

  it("rejects non-finite values, incomplete profiles, blank evidence, and invalid remediation states", () => {
    fc.assert(
      fc.property(completeFindingArbitrary, (complete) => {
        const nonFinite = structuredClone(complete);
        if (
          nonFinite.measuredValue &&
          nonFinite.measuredValue.metric !== "listener-subscription-cleanup"
        ) {
          nonFinite.measuredValue.value = Number.NaN;
          expect(validatePerformanceFindingCompleteness(nonFinite).valid).toBe(false);
        }

        const incompleteProfile = structuredClone(complete);
        if (!incompleteProfile.testProfile) throw new Error("Generated profile is missing.");
        const canonicalProfile = cloneProfile(incompleteProfile.testProfile);
        incompleteProfile.testProfile.sampleCount = 0;
        expect(validatePerformanceFindingCompleteness(incompleteProfile).valid).toBe(false);
        expect(incompleteProfile.testProfile).not.toEqual(canonicalProfile);

        const blankEvidence = structuredClone(complete);
        blankEvidence.bottleneckEvidenceRefs = ["   "];
        expect(validatePerformanceFindingCompleteness(blankEvidence).valid).toBe(false);

        const invalidRemediation = {
          ...structuredClone(complete),
          remediationStatus: "done-without-evidence",
        } as unknown as PerformanceFindingCandidate;
        expect(validatePerformanceFindingCompleteness(invalidRemediation).valid).toBe(false);
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED + 2, endOnFailure: true },
    );
  });
});
