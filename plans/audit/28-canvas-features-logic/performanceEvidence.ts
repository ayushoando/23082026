import type {
  AuditFinding,
  AuditValidationResult,
  EvidenceRecord,
  EvidenceRef,
  FindingState,
  RequirementRef,
  ValidationIssue,
  ValidationRecord,
} from "./auditModel";
import {
  getSupportedTestProfile,
  type MeasurementKind,
  type SupportedTestProfile,
} from "./performanceMeasurement";

export const TASK_5_7_REQUIREMENTS = ["16.8"] as const satisfies readonly RequirementRef[];

export const PERFORMANCE_METRICS = [
  "route-lcp-p75",
  "route-cls-maximum",
  "non-canvas-inp-p75",
  "canvas-median-fps",
  "direct-feedback-maximum",
  "api-warm-p95",
  "listener-subscription-cleanup",
] as const;
export type PerformanceMetric = (typeof PERFORMANCE_METRICS)[number];

export const PERFORMANCE_REMEDIATION_STATUSES = [
  "identified",
  "remediation-approved",
  "remediated-validation-pending",
  "remeasured-with-evidence",
  "blocked-with-evidence",
] as const;
export type PerformanceRemediationStatus =
  (typeof PERFORMANCE_REMEDIATION_STATUSES)[number];

interface NumericPerformanceMeasuredValue {
  metric: Exclude<PerformanceMetric, "listener-subscription-cleanup">;
  value: number;
  unit: "ms" | "layout-shift" | "fps";
  budget: number;
  status: "budget-missed";
}

interface CleanupPerformanceMeasuredValue {
  metric: "listener-subscription-cleanup";
  value: false;
  unit: "released-after-close";
  budget: true;
  status: "budget-missed";
}

export type PerformanceMeasuredValue =
  | NumericPerformanceMeasuredValue
  | CleanupPerformanceMeasuredValue;

export interface PerformanceFindingCandidate extends AuditFinding {
  measuredValue?: PerformanceMeasuredValue;
  testProfile?: SupportedTestProfile;
  bottleneckEvidenceRefs?: EvidenceRef[];
  remediationStatus?: PerformanceRemediationStatus;
}

export interface CompletePerformanceFinding extends AuditFinding {
  measuredValue: PerformanceMeasuredValue;
  testProfile: SupportedTestProfile;
  bottleneckEvidenceRefs: EvidenceRef[];
  remediationStatus: PerformanceRemediationStatus;
}

const METRIC_PROFILE_KIND: Readonly<Record<PerformanceMetric, MeasurementKind>> = {
  "route-lcp-p75": "route-lcp-cls",
  "route-cls-maximum": "route-lcp-cls",
  "non-canvas-inp-p75": "non-canvas-inp",
  "canvas-median-fps": "canvas-fps",
  "direct-feedback-maximum": "direct-feedback",
  "api-warm-p95": "api-latency",
  "listener-subscription-cleanup": "listener-subscription-cleanup",
};

const ALLOWED_FINDING_STATES = [
  "verified",
  "remediation-approved",
  "remediated-validation-pending",
  "remediated-with-evidence",
  "blocked-with-evidence",
] as const satisfies readonly FindingState[];

const ALLOWED_FINDING_STATE_SET: ReadonlySet<FindingState> = new Set(
  ALLOWED_FINDING_STATES,
);

function addIssue(
  issues: ValidationIssue[],
  code: ValidationIssue["code"],
  path: string,
  message: string,
): void {
  issues.push({ code, path, message });
}

function compareIssue(left: ValidationIssue, right: ValidationIssue): number {
  return (
    left.path.localeCompare(right.path) ||
    left.code.localeCompare(right.code) ||
    left.message.localeCompare(right.message)
  );
}

function validateMeasuredValue(
  value: PerformanceMeasuredValue | undefined,
  issues: ValidationIssue[],
): void {
  if (!value) {
    addIssue(
      issues,
      "empty-value",
      "measuredValue",
      "A missed performance budget requires its measured value.",
    );
    return;
  }
  if (value.status !== "budget-missed") {
    addIssue(
      issues,
      "invalid-finding-state",
      "measuredValue.status",
      "The completeness contract applies only to a measured budget miss.",
    );
  }
  if (value.metric === "listener-subscription-cleanup") {
    if (value.value !== false || value.budget !== true) {
      addIssue(
        issues,
        "invalid-reference",
        "measuredValue.value",
        "A cleanup miss must record that release-after-close was false against a true budget.",
      );
    }
    return;
  }
  if (!Number.isFinite(value.value) || !Number.isFinite(value.budget)) {
    addIssue(
      issues,
      "empty-value",
      "measuredValue.value",
      "Measured value and budget must be finite numbers.",
    );
  }
}

function validateProfile(
  profile: SupportedTestProfile | undefined,
  value: PerformanceMeasuredValue | undefined,
  issues: ValidationIssue[],
): void {
  if (!profile) {
    addIssue(
      issues,
      "empty-value",
      "testProfile",
      "A missed performance budget requires a complete supported test profile.",
    );
    return;
  }

  let canonical: SupportedTestProfile;
  try {
    canonical = getSupportedTestProfile(profile.id);
  } catch {
    addIssue(
      issues,
      "invalid-reference",
      "testProfile.id",
      `Unknown supported performance profile: ${profile.id}`,
    );
    return;
  }

  if (value && METRIC_PROFILE_KIND[value.metric] !== profile.measurementKind) {
    addIssue(
      issues,
      "invalid-reference",
      "testProfile.measurementKind",
      `Metric ${value.metric} requires a ${METRIC_PROFILE_KIND[value.metric]} profile.`,
    );
  }
  if (JSON.stringify(profile) !== JSON.stringify(canonical)) {
    addIssue(
      issues,
      "invalid-reference",
      "testProfile",
      "The supported test profile must be complete and match its canonical documented fixture.",
    );
  }
}

export function validatePerformanceFindingCompleteness(
  candidate: PerformanceFindingCandidate,
): AuditValidationResult {
  const issues: ValidationIssue[] = [];

  validateMeasuredValue(candidate.measuredValue, issues);
  validateProfile(candidate.testProfile, candidate.measuredValue, issues);

  if (!candidate.bottleneckEvidenceRefs || candidate.bottleneckEvidenceRefs.length === 0) {
    addIssue(
      issues,
      "missing-evidence",
      "bottleneckEvidenceRefs",
      "A missed performance budget requires bottleneck evidence.",
    );
  } else {
    candidate.bottleneckEvidenceRefs.forEach((reference, index) => {
      if (reference.trim().length === 0) {
        addIssue(
          issues,
          "missing-evidence",
          `bottleneckEvidenceRefs[${index}]`,
          "Bottleneck evidence references must not be blank.",
        );
      }
    });
  }

  if (
    !candidate.remediationStatus ||
    !PERFORMANCE_REMEDIATION_STATUSES.includes(candidate.remediationStatus)
  ) {
    addIssue(
      issues,
      "invalid-finding-state",
      "remediationStatus",
      "A missed performance budget requires a recognized remediation status.",
    );
  }
  if (!ALLOWED_FINDING_STATE_SET.has(candidate.state)) {
    addIssue(
      issues,
      "invalid-finding-state",
      "state",
      "A measured budget miss must be verified or in a remediation lifecycle state.",
    );
  }

  const sortedIssues = issues.sort(compareIssue);
  return { valid: sortedIssues.length === 0, issues: sortedIssues };
}

export function isCompletePerformanceFinding(
  candidate: PerformanceFindingCandidate,
): candidate is CompletePerformanceFinding {
  return validatePerformanceFindingCompleteness(candidate).valid;
}

export const TASK_5_7_REPOSITORY_EVIDENCE: EvidenceRecord = {
  id: "evidence:task-5.7-performance-finding-completeness",
  class: "repository",
  summary:
    "Task 5.7 defines and property-tests the mandatory evidence contract for every measured performance-budget miss.",
  sourceRefs: [
    "plans/audit/28-canvas-features-logic/performanceEvidence.ts",
    "tests/unit/planner/plannerPerformanceFindingCompleteness.property.test.ts",
  ],
  limitation:
    "Authored repository evidence does not supply browser measurements, integration latency, cleanup results, bottleneck diagnosis, remediation success, or budget compliance.",
  artifact: {
    authorship: "authored",
    path: "plans/audit/28-canvas-features-logic/performanceEvidence.ts",
  },
};

export const TASK_5_7_PENDING_VALIDATION: ValidationRecord = {
  id: "validation:task-5.7-performance-finding-completeness",
  findingIds: [],
  kind: "unit",
  target: "repository",
  repositoryRoot: ".",
  requirementRefs: [...TASK_5_7_REQUIREMENTS],
  verifies:
    "Property 26 requires measured value, complete supported profile, bottleneck evidence, and remediation status for every generated budget miss.",
  limitation:
    "The property test is authored but unexecuted; no pass, fail, browser, integration, hosted, or deployment result is claimed.",
  state: "pending",
  exactCommand:
    "pnpm exec vitest run --config tests/vitest.config.ts tests/unit/planner/plannerPerformanceFindingCompleteness.property.test.ts",
  pendingOwnerAction: null,
  userAuthorization: "not-authorized",
  hookPermission: "not-observed",
  exitStatus: null,
  outcome: null,
  evidenceRefs: [],
};
