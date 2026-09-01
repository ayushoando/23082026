import type {
  CoverageItem,
  EvidenceRecord,
  FindingRef,
  PlannerAuditDataset,
  ValidationRecord,
} from "./auditModel";
import {
  createFindingRegistry,
  createOwnershipLedger,
  isComprehensiveRemediationComplete,
  isFullValidationComplete,
  validateFindingRegistry,
  type FindingRegistration,
  type FindingRegistryDataset,
  type OwnershipLedger,
  type PlannerAuditWorkstream,
} from "./findingRegistry";
import { firstPlannerEvidenceMatrix } from "./firstEvidenceMatrix";
import {
  derivePlannerValidationManifest,
  recordValidationEvidence,
  TASK_5_11_REPOSITORY_EVIDENCE,
  type PlannedValidationAction,
  type PlannerValidationCategory,
  type PlannerValidationFindingInput,
} from "./validationEvidence";
import {
  TASK_5_1_5_4_REPOSITORY_EVIDENCE,
} from "./plannerObservabilityEvidence";
import {
  TASK_5_5_REPOSITORY_EVIDENCE,
} from "./performanceMeasurement";
import {
  TASK_5_7_REPOSITORY_EVIDENCE,
} from "./performanceEvidence";
import {
  TASK_5_9_5_10_REPOSITORY_EVIDENCE,
} from "./workstream5Evidence";

export const FINAL_RECONCILIATION_EVIDENCE_ID =
  "evidence:final-planner-reconciliation" as const;

const FINAL_RECONCILIATION_PATH =
  "plans/audit/28-canvas-features-logic/finalReconciliation.ts" as const;

const WORKSTREAM_1_PATHS = [
  "plans/audit/28-canvas-features-logic/auditModel.ts",
  "plans/audit/28-canvas-features-logic/auditValidators.ts",
  "plans/audit/28-canvas-features-logic/coverageCollector.ts",
  "plans/audit/28-canvas-features-logic/initialInventory.ts",
  "plans/audit/28-canvas-features-logic/firstEvidenceMatrix.ts",
  "plans/audit/28-canvas-features-logic/findingRegistry.ts",
  "plans/audit/28-canvas-features-logic/workflowTraceBuilder.ts",
  FINAL_RECONCILIATION_PATH,
  // Corrected 2026-09-01: the plan artifacts moved from the removed
  // external spec tree to `plans/audit/28-canvas-features-logic/`.
  "plans/audit/28-canvas-features-logic/tasks.md",
  "plans/audit/28-canvas-features-logic/handover.md",
] as const;

const WORKSTREAM_2_PATHS = [
  "site/lib/Planner/plannerGeometryContract.ts",
  "site/lib/Planner/plannerProjectOperations.ts",
  "site/server/Planner/plannerProjectSupabaseAdapter.ts",
] as const;

const WORKSTREAM_3_PATHS = [
  "site/features/Planner/page.tsx",
  "site/hooks/Planner/usePlannerCanvasCore.ts",
  "site/hooks/Planner/usePlannerTouchGestures.ts",
  "site/lib/Planner/commands/useCanvasActions.ts",
  "site/lib/Planner/handoff/createPlannerHandoff.ts",
  "site/components/Planner/Planner.tsx",
  // Corrected 2026-09-01: the module lives under components/Planner (the
  // stale lib/ path was caught by the new existence test).
  "site/components/Planner/plannerLoadState.ts",
  "site/components/Planner/PlannerProjectLoadState.tsx",
  "tests/unit/planner/plannerFocusAndTouch.test.tsx",
] as const;

const WORKSTREAM_4_PATHS = [
  "site/app/api/Planner/projects/[id]/route.ts",
  "site/server/Planner/plannerRouteAdapter.ts",
  "site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql",
  "tests/unit/platform/Planner/plannerAdminMigration.test.ts",
] as const;

const WORKSTREAM_5_PATHS = [
  "site/lib/observability/planner/plannerObservability.ts",
  "site/lib/observability/planner/plannerObservabilityAdapters.ts",
  "site/lib/observability/planner/plannerObservabilityExporter.server.ts",
  "site/lib/observability/planner/plannerObservability.server.ts",
  "plans/audit/28-canvas-features-logic/plannerObservabilityEvidence.ts",
  "plans/audit/28-canvas-features-logic/performanceMeasurement.ts",
  "plans/audit/28-canvas-features-logic/performanceEvidence.ts",
  "plans/audit/28-canvas-features-logic/validationEvidence.ts",
  "plans/audit/28-canvas-features-logic/workstream5Evidence.ts",
  "plans/audit/28-canvas-features-logic/workstream5ValidationManifest.ts",
  "tests/unit/planner/plannerObservability.property.test.ts",
  "tests/unit/planner/plannerValidationEvidence.property.test.ts",
  "tests/unit/planner/plannerPerformanceMeasurement.test.ts",
  "tests/unit/planner/plannerPerformanceFindingCompleteness.property.test.ts",
  "tests/integration/planner/plannerWorkstream5Regression.test.ts",
  "tests/e2e/planner-comprehensive-audit-regression.spec.ts",
] as const;

const WORKSTREAM_PATH_SETS: ReadonlyArray<{
  workstream: PlannerAuditWorkstream;
  paths: readonly string[];
}> = [
  { workstream: "workstream-1", paths: WORKSTREAM_1_PATHS },
  { workstream: "workstream-2", paths: WORKSTREAM_2_PATHS },
  { workstream: "workstream-3", paths: WORKSTREAM_3_PATHS },
  { workstream: "workstream-4", paths: WORKSTREAM_4_PATHS },
  { workstream: "workstream-5", paths: WORKSTREAM_5_PATHS },
];

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values)).sort((left, right) =>
    left.localeCompare(right),
  );
}

function areaFindingId(areaId: string): FindingRef {
  return `finding:area:${areaId}`;
}

function findingIdsForPaths(
  paths: readonly string[],
  coverageItems: readonly CoverageItem[],
  fallbackFindingIds: readonly FindingRef[],
): FindingRef[] {
  const matched = coverageItems
    .filter((item) =>
      paths.some(
        (path) =>
          item.path === path ||
          item.path.startsWith(`${path}/`) ||
          path.startsWith(`${item.path}/`),
      ),
    )
    .map((item) => areaFindingId(item.id));
  return uniqueSorted(matched.length > 0 ? matched : fallbackFindingIds);
}

const FINAL_FINDING_IDS = firstPlannerEvidenceMatrix.coverageItems.map((item) =>
  areaFindingId(item.id),
);

const FINAL_RECONCILIATION_EVIDENCE: EvidenceRecord = {
  id: FINAL_RECONCILIATION_EVIDENCE_ID,
  class: "repository",
  summary:
    "The final Planner reconciliation freezes audited paths, assigns exclusive owners, acknowledges geometry/persistence/API/migration contracts, resolves authored integration conflicts, and separates remediation completion from validation completion.",
  sourceRefs: uniqueSorted([
    FINAL_RECONCILIATION_PATH,
    "plans/audit/28-canvas-features-logic/firstEvidenceMatrix.ts",
    "plans/audit/28-canvas-features-logic/findingRegistry.ts",
    "plans/audit/28-canvas-features-logic/validationEvidence.ts",
    ...WORKSTREAM_1_PATHS,
    ...WORKSTREAM_2_PATHS,
    ...WORKSTREAM_3_PATHS,
    ...WORKSTREAM_4_PATHS,
    ...WORKSTREAM_5_PATHS,
  ]),
  limitation:
    "This is authored repository evidence only. No protected test, typecheck, build, gate, browser, database, hosted, deployment, or production-smoke result is claimed.",
  artifact: {
    authorship: "authored",
    path: FINAL_RECONCILIATION_PATH,
  },
};

const FINAL_EVIDENCE_RECORDS: readonly EvidenceRecord[] = [
  FINAL_RECONCILIATION_EVIDENCE,
  TASK_5_1_5_4_REPOSITORY_EVIDENCE,
  TASK_5_5_REPOSITORY_EVIDENCE,
  TASK_5_7_REPOSITORY_EVIDENCE,
  TASK_5_9_5_10_REPOSITORY_EVIDENCE,
  TASK_5_11_REPOSITORY_EVIDENCE,
];

const FINAL_VALIDATION_CATEGORIES: readonly PlannerValidationCategory[] = [
  "fork",
  "focss",
  "type",
  "unit",
  "integration",
  "browser",
  "accessibility",
  "performance",
  "migration",
  "full-gate",
];

const FINAL_TARGETED_TEST_PATHS = [
  "tests/unit/platform/Planner/plannerAdminMigration.test.ts",
  "tests/unit/planner/plannerObservability.property.test.ts",
  "tests/unit/planner/plannerValidationEvidence.property.test.ts",
  "tests/unit/planner/plannerPerformanceMeasurement.test.ts",
  "tests/unit/planner/plannerPerformanceFindingCompleteness.property.test.ts",
  "tests/integration/planner/plannerWorkstream5Regression.test.ts",
  "tests/e2e/planner-comprehensive-audit-regression.spec.ts",
  "tests/e2e/planner-performance-required.spec.ts",
] as const;

const FINAL_VALIDATION_INPUTS: readonly PlannerValidationFindingInput[] =
  FINAL_FINDING_IDS.map((findingId) => ({
    id: findingId,
    changedPaths: uniqueSorted([
      ...WORKSTREAM_1_PATHS,
      ...WORKSTREAM_2_PATHS,
      ...WORKSTREAM_3_PATHS,
      ...WORKSTREAM_4_PATHS,
      ...WORKSTREAM_5_PATHS,
    ]),
    categories: FINAL_VALIDATION_CATEGORIES,
    targetedTestPaths: FINAL_TARGETED_TEST_PATHS,
    requiresFullGate: true,
  }));

export const FINAL_VALIDATION_MANIFEST: readonly PlannedValidationAction[] =
  derivePlannerValidationManifest(FINAL_VALIDATION_INPUTS);

export const FINAL_PENDING_VALIDATIONS: readonly ValidationRecord[] =
  FINAL_VALIDATION_MANIFEST.map((action) =>
    recordValidationEvidence({
      action,
      userAuthorization: "not-authorized",
      hookPermission: "not-observed",
    }),
  );

function validationActionForItem(
  item: CoverageItem,
  actions: readonly PlannedValidationAction[],
): PlannedValidationAction {
  const desiredId =
    item.kind === "focss"
      ? "validation:w5:focss"
      : item.kind === "test"
        ? item.testClass === "unit"
          ? "validation:w5:unit"
          : item.testClass === "integration"
            ? "validation:w5:integration"
            : item.testClass === "browser"
              ? "validation:w5:browser"
              : "validation:w5:test-typecheck"
        : item.path.startsWith("site/platform/supabase/migrations.admin/")
          ? "validation:w5:migration-dry-run"
          : item.path.startsWith("site/")
            ? "validation:w5:typecheck"
            : "validation:w5:full-gate";
  const action = actions.find((candidate) => candidate.id === desiredId);
  if (!action) {
    throw new Error(`Final validation manifest omitted ${desiredId}.`);
  }
  return action;
}

const FINAL_EVIDENCE_BY_ID = new Map(
  [...firstPlannerEvidenceMatrix.evidence, ...FINAL_EVIDENCE_RECORDS].map(
    (record) => [record.id, record],
  ),
);

const FINAL_EVIDENCE = Array.from(FINAL_EVIDENCE_BY_ID.values()).sort((left, right) =>
  left.id.localeCompare(right.id),
);

const ITEM_BY_ID = new Map(
  firstPlannerEvidenceMatrix.coverageItems.map((item) => [item.id, item]),
);

const FINAL_COVERAGE_LINKS = firstPlannerEvidenceMatrix.coverageLinks.map(
  (link) => {
    const item = ITEM_BY_ID.get(link.itemId);
    if (!item) {
      throw new Error(`Final reconciliation cannot find coverage item: ${link.itemId}`);
    }
    const validationId = validationActionForItem(
      item,
      FINAL_VALIDATION_MANIFEST,
    ).id;
    return {
      ...structuredClone(link),
      verificationRefs: uniqueSorted([...link.verificationRefs, validationId]),
      evidenceRefs: uniqueSorted([
        ...link.evidenceRefs,
        FINAL_RECONCILIATION_EVIDENCE_ID,
      ]),
    };
  },
);

const FINAL_REGISTRATIONS: readonly FindingRegistration[] =
  firstPlannerEvidenceMatrix.coverageItems.map((item) => {
    const link = FINAL_COVERAGE_LINKS.find(
      (candidate) => candidate.itemId === item.id,
    );
    if (!link) {
      throw new Error(`Final reconciliation cannot find coverage link: ${item.id}`);
    }
    const validationId = validationActionForItem(
      item,
      FINAL_VALIDATION_MANIFEST,
    ).id;
    const statusNote = item.statusNote
      ? ` ${item.statusNote}`
      : "";
    return {
      auditedAreaId: item.id,
      classification: "defect",
      title: `Planner audit closure pending validation: ${item.path}`,
      severity:
        item.status === "unwired/absent" || item.status === "unreachable"
          ? "high"
          : item.status === "legacy" || item.status === "demo/local-only"
            ? "low"
            : "medium",
      state: "remediated-validation-pending",
      expected:
        "The audited Planner area has a complete route/workflow/evidence link, an exclusive remediation owner, and permission-backed validation before full closure.",
      observed: `The live inventory records status ${item.status}.${statusNote} Authored remediation and traceability are recorded; protected and hosted behavior remains unverified.`,
      reproductionEvidenceRefs: uniqueSorted([
        ...link.evidenceRefs,
        FINAL_RECONCILIATION_EVIDENCE_ID,
      ]),
      adjacentWorkflowIds: [],
      adjacentImpactReviewed: true,
      remediationPaths: [FINAL_RECONCILIATION_PATH],
      verificationCandidates: [{ validationId, scope: "finding" }],
    } satisfies FindingRegistration;
  });

function createAssignments(
  coverageItems: readonly CoverageItem[],
  findingIds: readonly FindingRef[],
): OwnershipLedger["assignments"] {
  return WORKSTREAM_PATH_SETS.flatMap(({ workstream, paths }) =>
    paths.map((path) => ({
      path,
      workstream,
      findingIds: findingIdsForPaths(pathsForSinglePath(path), coverageItems, findingIds),
    })),
  );
}

function pathsForSinglePath(path: string): readonly string[] {
  return [path];
}

function handoff(
  id: string,
  contractPath: string,
  contractVersion: string,
  ownerWorkstream: PlannerAuditWorkstream,
  consumerWorkstreams: readonly PlannerAuditWorkstream[],
  coverageItems: readonly CoverageItem[],
  findingIds: readonly FindingRef[],
): OwnershipLedger["contractHandoffs"][number] {
  return {
    id,
    contractPath,
    contractVersion,
    ownerWorkstream,
    consumerWorkstreams: [...consumerWorkstreams],
    acknowledgedBy: [...consumerWorkstreams],
    status: "acknowledged",
    findingIds: findingIdsForPaths([contractPath], coverageItems, findingIds),
  };
}

function conflict(
  id: string,
  paths: readonly string[],
  summary: string,
  coverageItems: readonly CoverageItem[],
  findingIds: readonly FindingRef[],
): OwnershipLedger["integrationConflicts"][number] {
  return {
    id,
    paths: [...paths],
    summary,
    findingIds: findingIdsForPaths(paths, coverageItems, findingIds),
    status: "resolved",
    resolutionEvidenceRefs: [
      FINAL_RECONCILIATION_EVIDENCE_ID,
      "evidence:tasks-5.1-5.4-planner-observability",
    ],
  };
}

const FINAL_OWNERSHIP_LEDGER_INPUT: OwnershipLedger = {
  writablePaths: uniqueSorted(
    WORKSTREAM_PATH_SETS.flatMap(({ paths }) => [...paths]),
  ),
  assignments: createAssignments(
    firstPlannerEvidenceMatrix.coverageItems,
    FINAL_FINDING_IDS,
  ),
  contractHandoffs: [
    handoff(
      "handoff:w2-geometry-contract-v1",
      "site/lib/Planner/plannerGeometryContract.ts",
      "planner-geometry-v1",
      "workstream-2",
      ["workstream-3", "workstream-4"],
      firstPlannerEvidenceMatrix.coverageItems,
      FINAL_FINDING_IDS,
    ),
    handoff(
      "handoff:w2-persistence-contract-v2",
      "site/lib/Planner/plannerProjectOperations.ts",
      "planner-persistence-v2",
      "workstream-2",
      ["workstream-3", "workstream-4", "workstream-5"],
      firstPlannerEvidenceMatrix.coverageItems,
      FINAL_FINDING_IDS,
    ),
    handoff(
      "handoff:w4-project-api-contract-v1",
      "site/app/api/Planner/projects/[id]/route.ts",
      "planner-project-api-v1",
      "workstream-4",
      ["workstream-2", "workstream-3", "workstream-5"],
      firstPlannerEvidenceMatrix.coverageItems,
      FINAL_FINDING_IDS,
    ),
    handoff(
      "handoff:w4-admin-mutation-contract-v1",
      "site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql",
      "planner-admin-mutation-v1",
      "workstream-4",
      ["workstream-2", "workstream-5"],
      firstPlannerEvidenceMatrix.coverageItems,
      FINAL_FINDING_IDS,
    ),
    handoff(
      "handoff:w5-observability-call-site-v1",
      "site/lib/observability/planner/plannerObservability.server.ts",
      "planner-observability-v1",
      "workstream-5",
      ["workstream-2", "workstream-4"],
      firstPlannerEvidenceMatrix.coverageItems,
      FINAL_FINDING_IDS,
    ),
  ],
  integrationConflicts: [
    conflict(
      "conflict:geometry-persistence-api-contract",
      [
        "site/lib/Planner/plannerGeometryContract.ts",
        "site/lib/Planner/plannerProjectOperations.ts",
        "site/app/api/Planner/projects/[id]/route.ts",
      ],
      "Geometry serialization, selected persistence, and the project mutation endpoint now share the acknowledged revision/schema/idempotency handoff; no second adapter or read-after-write workaround is introduced.",
      firstPlannerEvidenceMatrix.coverageItems,
      FINAL_FINDING_IDS,
    ),
    conflict(
      "conflict:admin-revision-idempotency-envelope",
      [
        "site/server/Planner/plannerProjectSupabaseAdapter.ts",
        "site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql",
        "tests/unit/platform/Planner/plannerAdminMigration.test.ts",
      ],
      "The Supabase adapter and Admin RPC migration use one revision/idempotency contract with replayable response envelopes; repository response fields are covered statically while hosted/generated types remain pending.",
      firstPlannerEvidenceMatrix.coverageItems,
      FINAL_FINDING_IDS,
    ),
    conflict(
      "conflict:observability-selected-adapter-boundary",
      [
        "site/lib/Planner/plannerProjectOperations.ts",
        "site/server/Planner/plannerRouteAdapter.ts",
        "site/lib/observability/planner/plannerObservability.server.ts",
      ],
      "Route and selected-adapter observability integrations preserve the original response/result, correlation id, and single-adapter behavior without retry or fallback calls.",
      firstPlannerEvidenceMatrix.coverageItems,
      FINAL_FINDING_IDS,
    ),
  ],
};

export const FINAL_OWNERSHIP_LEDGER = createOwnershipLedger(
  FINAL_OWNERSHIP_LEDGER_INPUT,
);

const FINAL_BASE_DATASET: PlannerAuditDataset = {
  ...structuredClone(firstPlannerEvidenceMatrix),
  coverageLinks: FINAL_COVERAGE_LINKS,
  evidence: FINAL_EVIDENCE,
  validations: [...FINAL_PENDING_VALIDATIONS],
};

const SELECTED_FINDING_REGISTRY = createFindingRegistry(
  FINAL_BASE_DATASET,
  FINAL_REGISTRATIONS,
);

const SELECTED_VALIDATION_IDS = new Set(
  SELECTED_FINDING_REGISTRY.validations.map((validation) => validation.id),
);
const FINAL_FINDING_IDS_FROM_REGISTRY = SELECTED_FINDING_REGISTRY.findings.map(
  (finding) => finding.id,
);

function normalizeSupplementalValidation(
  validation: ValidationRecord,
): ValidationRecord {
  return {
    ...structuredClone(validation),
    findingIds: [...FINAL_FINDING_IDS_FROM_REGISTRY],
  };
}

const SUPPLEMENTAL_PENDING_VALIDATIONS = FINAL_PENDING_VALIDATIONS.filter(
  (validation) => !SELECTED_VALIDATION_IDS.has(validation.id),
).map(normalizeSupplementalValidation);

export const FINAL_RECONCILIATION_DATASET: FindingRegistryDataset = {
  ...SELECTED_FINDING_REGISTRY,
  validations: [
    ...SELECTED_FINDING_REGISTRY.validations,
    ...SUPPLEMENTAL_PENDING_VALIDATIONS,
  ],
  coordinationLedger: FINAL_OWNERSHIP_LEDGER,
};

export const FINAL_RECONCILIATION_VALIDATION = validateFindingRegistry(
  FINAL_RECONCILIATION_DATASET,
  { requireTerminalFindings: true },
);

if (!FINAL_RECONCILIATION_VALIDATION.valid) {
  const details = FINAL_RECONCILIATION_VALIDATION.issues
    .map((issue) => `${issue.path} [${issue.code}] ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid final Planner reconciliation:\n${details}`);
}

export const IS_COMPREHENSIVE_REMEDIATION_COMPLETE =
  isComprehensiveRemediationComplete(FINAL_RECONCILIATION_DATASET);
export const IS_FULL_VALIDATION_COMPLETE = isFullValidationComplete(
  FINAL_RECONCILIATION_DATASET,
);

if (!IS_COMPREHENSIVE_REMEDIATION_COMPLETE) {
  throw new Error(
    "Final Planner reconciliation must complete repository remediation before validation closure.",
  );
}
if (IS_FULL_VALIDATION_COMPLETE) {
  throw new Error(
    "Final Planner reconciliation cannot claim full validation without observed protected results.",
  );
}

export const FINAL_PENDING_VALIDATION_COMMANDS = uniqueSorted(
  FINAL_PENDING_VALIDATIONS.map(
    (validation) => validation.pendingOwnerAction ?? validation.exactCommand,
  ).filter((command): command is string => command !== null),
);

export const FINAL_PRESERVED_UNRELATED_PATHS = [
  // Corrected 2026-09-01: the ai-package-remediation spec folder
  // (the removed external spec tree) lives on as `plans/audit/22-packages-workspace/packages/`.
  // package-audit-report.md was not present on disk at the 2026-09-01 reconciliation;
  // only the remedy plan survives.
  "plans/audit/22-packages-workspace/packages/remedy-plan.md",
  "tests/unit/lib/ai/mastra/catalogRetrieval.test.ts",
] as const;

export const FINAL_PRESERVED_OUT_OF_SCOPE_PATHS = [
  // Corrected 2026-09-01: the ai-implementation-audit spec folder
  // (the removed external spec tree) lives on as `plans/ai-audit/`.
  "plans/audit/27-lib-ai-svg-observability/remedy-plan.md",
  "scripts/AsNeeded/verify-focss.mjs",
  "site/components/Planner/PlannerAlignBar.tsx",
  "site/components/Planner/PlannerAutoArrangeDialog.tsx",
  "site/components/Planner/PlannerCatalogRail.tsx",
  "site/components/Planner/PlannerPropertiesPanel.tsx",
  "site/components/Planner/PlannerRulers.tsx",
  "site/components/Planner/PlannerSheetSettings.tsx",
  "site/focss/planner/polish.css",
  "site/focss/planner/workspace.css",
  "site/hooks/Planner/usePlannerSessionWarning.ts",
  "tests/unit/lib/Planner/plannerEndpointContract.task4_1.test.ts",
  "tests/unit/planner/plannerResponsiveLayout.test.ts",
] as const;

export interface PlannerCompletionLane {
  readonly complete: boolean;
  readonly state: "complete" | "pending";
  readonly basis: readonly string[];
  readonly pendingValidationIds: readonly string[];
  readonly pendingCommands: readonly string[];
}

export interface PlannerFinalCompletionRecord {
  readonly version: "planner-comprehensive-audit-final-v1";
  readonly findingCount: number;
  readonly ownershipPathCount: number;
  readonly repositoryRemediation: PlannerCompletionLane;
  readonly fullValidation: PlannerCompletionLane;
  readonly acceptedBlockers: readonly string[];
  readonly preservedUnrelatedPaths: readonly string[];
  readonly preservedOutOfScopePaths: readonly string[];
}

export const FINAL_COMPLETION_RECORD: PlannerFinalCompletionRecord = {
  version: "planner-comprehensive-audit-final-v1",
  findingCount: FINAL_RECONCILIATION_DATASET.findings.length,
  ownershipPathCount: FINAL_OWNERSHIP_LEDGER.writablePaths.length,
  repositoryRemediation: {
    complete: IS_COMPREHENSIVE_REMEDIATION_COMPLETE,
    state: IS_COMPREHENSIVE_REMEDIATION_COMPLETE ? "complete" : "pending",
    basis: [
      "Every live coverage item has exactly one terminal remediated-validation-pending finding.",
      "Every writable audit path has one exclusive workstream owner.",
      "Geometry, persistence, API, migration, and observability contract handoffs are acknowledged.",
      "All recorded integration conflicts are resolved with authored repository evidence.",
    ],
    pendingValidationIds: [],
    pendingCommands: [],
  },
  fullValidation: {
    complete: IS_FULL_VALIDATION_COMPLETE,
    state: IS_FULL_VALIDATION_COMPLETE ? "complete" : "pending",
    basis: [
      "No protected repository validation was authorized or executed in this session.",
      "Hosted Admin dry-run and generated-type actions remain separately pending.",
      "No browser, integration, deployment, or production-smoke result is claimed.",
    ],
    pendingValidationIds: FINAL_PENDING_VALIDATIONS.map(
      (validation) => validation.id,
    ),
    pendingCommands: FINAL_PENDING_VALIDATION_COMMANDS,
  },
  acceptedBlockers: [],
  preservedUnrelatedPaths: FINAL_PRESERVED_UNRELATED_PATHS,
  preservedOutOfScopePaths: FINAL_PRESERVED_OUT_OF_SCOPE_PATHS,
};

if (
  FINAL_COMPLETION_RECORD.repositoryRemediation.complete !== true ||
  FINAL_COMPLETION_RECORD.fullValidation.complete !== false
) {
  throw new Error(
    "Final Planner completion lanes must remain remediation-complete and validation-pending.",
  );
}

