import type { EvidenceRecord, RequirementRef, ValidationRecord } from "./auditModel";
import type { PlannerValidationFindingInput } from "./validationEvidence";

export const TASK_5_6_REQUIREMENTS = [
  "2.1", "2.6", "16.1", "16.2", "16.3", "16.4", "16.5", "16.6", "16.7", "16.8",
] as const satisfies readonly RequirementRef[];

export interface RegressionEvidenceLink {
  readonly concern: "geometry" | "commands" | "state" | "middleware" | "owner-scope" | "adapter" | "revision-idempotency-schema" | "guest-handoff" | "observability" | "migration-transform";
  readonly findingIds: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly requirementRefs: readonly RequirementRef[];
  readonly evidenceClass: "repository" | "integration" | "browser";
  readonly testPath: string;
  readonly conditionalReason?: string;
}

export const TASK_5_6_PERFORMANCE_HANDOFFS = [] as const;

export const TASK_5_6_REPOSITORY_EVIDENCE: EvidenceRecord = {
  id: "evidence:task-5.6-performance-remediation-gate",
  class: "repository",
  summary:
    "The required performance runner defines comparable supported profiles and budget assertions; because it has not been authorized or executed, no measured miss exists to dispatch to a product-file owner.",
  sourceRefs: [
    "plans/planner-comprehensive-audit/performanceMeasurement.ts",
    "plans/planner-comprehensive-audit/performanceEvidence.ts",
    "tests/e2e/planner-performance-required.spec.ts",
    "tests/e2e/helpers/plannerPerformance.ts",
  ],
  limitation:
    "Static inspection cannot establish a measured value, bottleneck, before/after comparison, cleanup defect, remediation need, or budget compliance. Product-owner handoffs remain empty until an authorized measurement records a miss.",
  artifact: {
    authorship: "authored",
    path: "plans/planner-comprehensive-audit/workstream5Evidence.ts",
  },
};

export const TASK_5_8_EXTENDED_PROFILE_EVIDENCE: EvidenceRecord = {
  id: "evidence:task-5.8-extended-browser-device-profiles",
  class: "repository",
  summary: "The rendered Planner regression matrix assigns non-duplicative Firefox tablet/keyboard and WebKit mobile/touch profiles in addition to the required Chromium profiles.",
  sourceRefs: [
    "config/build/playwright.config.ts",
    "tests/fixtures/planner/browserAuditMatrix.ts",
    "tests/e2e/planner-comprehensive-audit-regression.spec.ts",
    "tests/unit/planner/plannerBrowserAuditMatrix.test.ts",
  ],
  limitation: "These extra profiles are authored optional browser coverage only. They do not establish rendered behavior or block closure of required-profile findings.",
  artifact: { authorship: "authored", path: "plans/planner-comprehensive-audit/workstream5Evidence.ts" },
};

export const TASK_5_8_PENDING_VALIDATION: ValidationRecord = {
  id: "validation:task-5.8-extended-browser-device-profiles",
  findingIds: ["finding:workstream-5-authored-deliverables"],
  kind: "browser",
  target: "browser",
  repositoryRoot: ".",
  requirementRefs: ["6.1", "7.1", "8.1", "16.1", "16.2", "16.3", "16.4", "16.5", "16.6", "16.7"],
  verifies: "Optional Firefox tablet/keyboard and WebKit mobile/touch rendered profiles without duplicating required Chromium coverage.",
  limitation: "The optional browser specifications are authored but unexecuted; no rendered, accessibility, or performance result is claimed.",
  state: "pending",
  exactCommand: "pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/planner-comprehensive-audit-regression.spec.ts --project=firefox-tablet --project=webkit-mobile",
  pendingOwnerAction: null,
  userAuthorization: "not-authorized",
  hookPermission: "not-observed",
  exitStatus: null,
  outcome: null,
  evidenceRefs: [],
};

export const TASK_5_6_PENDING_VALIDATION: ValidationRecord = {
  id: "validation:task-5.6-required-performance-measurements",
  findingIds: ["finding:workstream-5-authored-deliverables"],
  kind: "performance",
  target: "browser",
  repositoryRoot: ".",
  requirementRefs: [...TASK_5_6_REQUIREMENTS],
  verifies: "Required profiles identify any performance-budget or cleanup miss before an exclusive product owner receives a serial remediation handoff.",
  limitation: "All deterministic measurement definitions remain not-run. No measured miss, bottleneck, before/after value, remediation, or compliance result is claimed.",
  state: "pending",
  exactCommand: "pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/planner-performance-required.spec.ts --project=chromium-desktop",
  pendingOwnerAction: null,
  userAuthorization: "not-authorized",
  hookPermission: "not-observed",
  exitStatus: null,
  outcome: null,
  evidenceRefs: [],
};

export const TASK_5_9_REGRESSION_LINKS: readonly RegressionEvidenceLink[] = [
  { concern: "geometry", findingIds: ["finding:trace:project-edit"], sourcePaths: ["site/lib/Planner/geometry", "site/lib/Planner/plannerUnits.ts"], requirementRefs: ["2.6", "18.5", "19.1"], evidenceClass: "repository", testPath: "tests/integration/planner/plannerWorkstream5Regression.test.ts" },
  { concern: "commands", findingIds: ["finding:trace:project-edit"], sourcePaths: ["site/lib/Planner/commands"], requirementRefs: ["2.6", "18.5", "19.1"], evidenceClass: "repository", testPath: "tests/integration/planner/plannerWorkstream5Regression.test.ts" },
  { concern: "state", findingIds: ["finding:trace:conflict-recovery", "finding:trace:offline-reconnect"], sourcePaths: ["site/lib/Planner/plannerWorkflowState.ts"], requirementRefs: ["2.6", "18.5", "19.3"], evidenceClass: "repository", testPath: "tests/integration/planner/plannerWorkstream5Regression.test.ts" },
  { concern: "middleware", findingIds: ["finding:trace:project-save"], sourcePaths: ["site/lib/Planner/plannerRequestPipeline.ts"], requirementRefs: ["2.6", "18.5", "19.3"], evidenceClass: "integration", testPath: "tests/integration/planner/plannerWorkstream5Regression.test.ts" },
  { concern: "owner-scope", findingIds: ["finding:trace:project-load"], sourcePaths: ["site/lib/Planner/plannerOwnerScope.ts"], requirementRefs: ["2.6", "18.5", "19.3"], evidenceClass: "integration", testPath: "tests/integration/planner/plannerWorkstream5Regression.test.ts" },
  { concern: "adapter", findingIds: ["finding:trace:project-save"], sourcePaths: ["site/lib/Planner/plannerPersistenceMode.ts"], requirementRefs: ["2.6", "18.5", "19.3"], evidenceClass: "integration", testPath: "tests/integration/planner/plannerWorkstream5Regression.test.ts" },
  { concern: "revision-idempotency-schema", findingIds: ["finding:trace:project-save"], sourcePaths: ["site/lib/Planner/plannerProjectOperations.ts", "site/lib/Planner/plannerProjectRepository.ts"], requirementRefs: ["2.6", "18.5", "19.3"], evidenceClass: "repository", testPath: "tests/integration/planner/plannerWorkstream5Regression.test.ts" },
  { concern: "guest-handoff", findingIds: ["finding:trace:handoff"], sourcePaths: ["site/lib/Planner/plannerHandoff.ts"], requirementRefs: ["2.6", "18.5", "19.3"], evidenceClass: "browser", testPath: "tests/e2e/planner-comprehensive-audit-regression.spec.ts" },
  { concern: "observability", findingIds: ["finding:trace:project-save"], sourcePaths: ["site/lib/observability/planner"], requirementRefs: ["17.1", "17.2", "17.3", "17.4", "17.5", "17.6"], evidenceClass: "repository", testPath: "tests/unit/planner/plannerObservability.property.test.ts" },
  { concern: "migration-transform", findingIds: ["finding:trace:project-save"], sourcePaths: ["site/platform/supabase/migrations.admin"], requirementRefs: ["2.6", "18.5", "19.3"], evidenceClass: "integration", testPath: "tests/integration/planner/plannerWorkstream5Regression.test.ts", conditionalReason: "No Task 4.9 schema defect or Task 4.10 migration branch is evidenced; transformation assertions remain conditional." },
];

export const WORKSTREAM_5_VALIDATION_INPUT: PlannerValidationFindingInput = {
  id: "finding:workstream-5-authored-deliverables",
  changedPaths: [
    "site/lib/observability/planner/plannerObservability.ts",
    "site/lib/observability/planner/plannerObservabilityAdapters.ts",
    "site/lib/observability/planner/plannerObservabilityExporter.server.ts",
    "site/lib/observability/planner/plannerObservability.server.ts",
    "plans/planner-comprehensive-audit/plannerObservabilityEvidence.ts",
    "plans/planner-comprehensive-audit/validationEvidence.ts",
    "plans/planner-comprehensive-audit/workstream5Evidence.ts",
    "plans/planner-comprehensive-audit/workstream5ValidationManifest.ts",
    "tests/fixtures/planner/browserAuditMatrix.ts",
    "tests/unit/planner/plannerBrowserAuditMatrix.test.ts",
    "tests/unit/planner/plannerObservability.property.test.ts",
    "tests/unit/planner/plannerValidationEvidence.property.test.ts",
    "tests/integration/planner/plannerWorkstream5Regression.test.ts",
    "tests/e2e/planner-comprehensive-audit-regression.spec.ts",
  ],
  categories: ["unit", "integration", "browser", "accessibility", "performance", "type"],
  targetedTestPaths: [
    "tests/unit/planner/plannerBrowserAuditMatrix.test.ts",
    "tests/unit/planner/plannerObservability.property.test.ts",
    "tests/unit/planner/plannerValidationEvidence.property.test.ts",
    "tests/unit/planner/plannerPerformanceMeasurement.test.ts",
    "tests/unit/planner/plannerPerformanceFindingCompleteness.property.test.ts",
    "tests/integration/planner/plannerWorkstream5Regression.test.ts",
    "tests/e2e/planner-comprehensive-audit-regression.spec.ts",
    "tests/e2e/planner-performance-required.spec.ts",
  ],
};

export const TASK_5_9_5_10_REPOSITORY_EVIDENCE: EvidenceRecord = {
  id: "evidence:tasks-5.9-5.10-targeted-regression-specifications",
  class: "repository",
  summary: "Finding-linked regression metadata and distinct Workstream 5 unit, integration, and browser specifications are authored.",
  sourceRefs: TASK_5_9_REGRESSION_LINKS.map((link) => link.testPath),
  limitation: "Authored tests are static repository evidence only; no regression, rendered, accessibility, performance, integration, hosted, or deployment result is claimed.",
  artifact: { authorship: "authored", path: "plans/planner-comprehensive-audit/workstream5Evidence.ts" },
};

export const TASK_5_11_REPOSITORY_EVIDENCE: EvidenceRecord = {
  id: "evidence:task-5.11-change-derived-validation-manifest",
  class: "repository",
  summary:
    "The Workstream 5 manifest derives narrow exact commands from finding categories and changed paths, records authorization and hook state, and leaves every unexecuted action pending without an outcome.",
  sourceRefs: [
    "plans/planner-comprehensive-audit/validationEvidence.ts",
    "plans/planner-comprehensive-audit/workstream5ValidationManifest.ts",
  ],
  limitation:
    "The manifest is authored static evidence. No protected command was authorized or executed, so it contains no validation result and proves no runtime behavior.",
  artifact: {
    authorship: "authored",
    path: "plans/planner-comprehensive-audit/workstream5ValidationManifest.ts",
  },
};

export const TASKS_5_12_TO_5_14_REPOSITORY_EVIDENCE: EvidenceRecord = {
  id: "evidence:tasks-5.12-5.14-validation-properties",
  class: "repository",
  summary:
    "Properties 27-29 are authored with deterministic 200-case generators for authorization gating, change-derived command selection, and evidence-class separation.",
  sourceRefs: [
    "plans/planner-comprehensive-audit/validationEvidence.ts",
    "tests/unit/planner/plannerValidationEvidence.property.test.ts",
  ],
  limitation:
    "The property tests are authored but unexecuted. Their presence is repository evidence only and is not a passing test result.",
  artifact: {
    authorship: "authored",
    path: "tests/unit/planner/plannerValidationEvidence.property.test.ts",
  },
};

export const TASKS_5_12_TO_5_14_PENDING_VALIDATION: ValidationRecord = {
  id: "validation:tasks-5.12-5.14-validation-properties",
  findingIds: ["finding:workstream-5-authored-deliverables"],
  kind: "unit",
  target: "repository",
  repositoryRoot: ".",
  requirementRefs: [
    "14.10",
    "17.7",
    "18.1",
    "18.2",
    "18.3",
    "18.4",
    "18.5",
    "18.6",
    "18.7",
    "18.8",
    "18.9",
    "19.4",
    "19.5",
    "19.6",
  ],
  verifies:
    "Properties 27-29 enforce dual authorization, narrow change-derived validation without typecheck:scripts, and one non-promoted evidence class per record.",
  limitation:
    "The property test is authored but unexecuted; no pass, fail, browser, integration, hosted, or deployment result is claimed.",
  state: "pending",
  exactCommand:
    "pnpm exec vitest run --config tests/vitest.config.ts tests/unit/planner/plannerValidationEvidence.property.test.ts",
  pendingOwnerAction: null,
  userAuthorization: "not-authorized",
  hookPermission: "not-observed",
  exitStatus: null,
  outcome: null,
  evidenceRefs: [],
};
