import type {
  AuditFinding,
  CoverageDimensions,
  CoverageItem,
  CoverageLink,
  PlannerAuditDataset,
  RequirementRef,
  ValidationRecord,
} from "./auditModel";
import { validateAuditDataset } from "./auditValidators";
import type { PlannerCoverageInventory } from "./coverageCollector";
import { initialPlannerInventory } from "./initialInventory";
import {
  buildPlannerWorkflowEvidence,
  buildPlannerWorkflowTraces,
  PLANNER_WORKFLOW_BLUEPRINTS,
  TASK_1_3_REQUIREMENTS,
  TASK_1_3_VALIDATION_ID,
  workflowEvidenceId,
  workflowFindingId,
  type PlannerWorkflowBlueprint,
  type PlannerWorkflowKey,
} from "./workflowTraceBuilder";

const WORKFLOW_KEYS = PLANNER_WORKFLOW_BLUEPRINTS.map(
  (blueprint) => blueprint.key,
);

const API_WORKFLOWS: Readonly<Record<string, readonly PlannerWorkflowKey[]>> = {
  "/api/Planner/catalog": ["catalog-browse"],
  "/api/Planner/catalog/upload": ["catalog-upload"],
  "/api/Planner/handoff": ["handoff"],
  "/api/Planner/projects": ["project-list", "project-create"],
  "/api/Planner/projects/[id]": [
    "project-load",
    "project-save",
    "project-delete",
    "offline-reconnect",
    "conflict-recovery",
  ],
  "/api/Planner/sketch-to-plan": ["sketch-to-plan"],
};

const ROUTE_WORKFLOWS: Readonly<Record<string, readonly PlannerWorkflowKey[]>> = {
  "/ooplanner": [
    "entry-auth",
    "project-create",
    "project-edit",
    "project-save",
    "catalog-browse",
    "catalog-select",
    "catalog-upload",
    "handoff",
    "sketch-to-plan",
    "offline-reconnect",
    "conflict-recovery",
    "unsaved-destructive-navigation",
  ],
  "/ooplanner/projects": [
    "entry-auth",
    "project-list",
    "project-create",
    "project-delete",
  ],
  "/ooplanner/projects/[id]": [
    "entry-auth",
    "project-load",
    "project-edit",
    "project-save",
    "project-delete",
    "offline-reconnect",
    "conflict-recovery",
    "unsaved-destructive-navigation",
  ],
};

const PROJECT_OPERATION_WORKFLOWS: readonly PlannerWorkflowKey[] = [
  "entry-auth",
  "project-list",
  "project-create",
  "project-load",
  "project-save",
  "project-delete",
  "offline-reconnect",
  "conflict-recovery",
];
const CATALOG_WORKFLOWS: readonly PlannerWorkflowKey[] = [
  "catalog-browse",
  "catalog-select",
  "catalog-upload",
];
const MUTATING_API_WORKFLOWS: readonly PlannerWorkflowKey[] = [
  "project-create",
  "project-save",
  "project-delete",
  "catalog-upload",
  "handoff",
  "sketch-to-plan",
];

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values)).sort(compareText);
}

function pathWorkflows(path: string): PlannerWorkflowKey[] {
  const normalized = path.toLowerCase();
  const matches = new Set<PlannerWorkflowKey>();
  const add = (keys: readonly PlannerWorkflowKey[]): void => {
    keys.forEach((key) => matches.add(key));
  };

  if (
    normalized.includes("plannercatalog") ||
    normalized.includes("catalogstore") ||
    normalized.includes("/catalog/") ||
    normalized.endsWith("/catalog/route.ts") ||
    normalized.includes("furniturecatalog")
  ) {
    add(CATALOG_WORKFLOWS);
  }
  if (normalized.includes("handoff")) {
    add(["handoff"]);
  }
  if (normalized.includes("sketchtoplan") || normalized.includes("sketch-to-plan")) {
    add(["sketch-to-plan"]);
  }
  if (
    normalized.includes("project") ||
    normalized.includes("plannerloadstate") ||
    normalized.includes("plannerdocument") ||
    normalized.includes("plannerpersistencemode")
  ) {
    add(PROJECT_OPERATION_WORKFLOWS);
  }
  if (
    normalized.includes("withauth") ||
    normalized.includes("/auth/") ||
    normalized.includes("/security/") ||
    normalized.includes("ratelimit") ||
    normalized.includes("apiresponse") ||
    normalized.includes("apierror")
  ) {
    add([...PROJECT_OPERATION_WORKFLOWS, ...MUTATING_API_WORKFLOWS]);
  }
  if (normalized.includes("browserapi") || normalized.endsWith("plannerapi.ts")) {
    add([
      ...PROJECT_OPERATION_WORKFLOWS,
      "catalog-browse",
      "catalog-upload",
      "handoff",
      "sketch-to-plan",
    ]);
  }
  if (
    normalized.includes("planner.tsx") ||
    normalized.includes("plannerdockshell") ||
    normalized.includes("plannertop") ||
    normalized.includes("plannerworkflow")
  ) {
    add(ROUTE_WORKFLOWS["/ooplanner"]);
  }
  if (
    normalized.includes("/commands/") ||
    normalized.includes("canvas") ||
    normalized.includes("fabric") ||
    normalized.includes("geometry") ||
    normalized.includes("snap") ||
    normalized.includes("planneruistore") ||
    normalized.includes("keyboard")
  ) {
    add([
      "project-edit",
      "catalog-select",
      "unsaved-destructive-navigation",
    ]);
  }
  if (normalized.includes("supabase") || normalized.includes("plannerstore.ts")) {
    add([...PROJECT_OPERATION_WORKFLOWS, ...CATALOG_WORKFLOWS, "handoff"]);
  }

  return uniqueSorted(Array.from(matches));
}

function workflowsForItem(
  item: CoverageItem,
  itemById: ReadonlyMap<string, CoverageItem>,
  activeIds: ReadonlySet<string> = new Set(),
): PlannerWorkflowKey[] {
  if (activeIds.has(item.id)) {
    return ["entry-auth"];
  }
  const nextActiveIds = new Set(activeIds).add(item.id);

  if (item.kind === "route") {
    return [...(ROUTE_WORKFLOWS[item.routePath] ?? ["entry-auth"])];
  }
  if (item.kind === "api") {
    return [...(API_WORKFLOWS[item.endpointPath] ?? ["entry-auth"])];
  }
  if (item.kind === "focss") {
    return [...WORKFLOW_KEYS];
  }
  if (item.kind === "test") {
    const covered = item.coversItemIds.flatMap((coveredItemId) => {
      const coveredItem = itemById.get(coveredItemId);
      return coveredItem
        ? workflowsForItem(coveredItem, itemById, nextActiveIds)
        : [];
    });
    return covered.length > 0 ? uniqueSorted(covered) : ["entry-auth"];
  }

  const matched = pathWorkflows(item.path);
  if (matched.length > 0) {
    return matched;
  }

  return item.kind === "planner-source"
    ? ["project-edit"]
    : ["entry-auth"];
}

function blueprintByKey(key: PlannerWorkflowKey): PlannerWorkflowBlueprint {
  const blueprint = PLANNER_WORKFLOW_BLUEPRINTS.find(
    (candidate) => candidate.key === key,
  );
  if (!blueprint) {
    throw new Error(`Unknown Planner workflow key: ${key}`);
  }
  return blueprint;
}

function mergeDimensions(
  blueprints: readonly PlannerWorkflowBlueprint[],
): CoverageDimensions {
  return {
    viewportClasses: uniqueSorted(
      blueprints.flatMap((blueprint) => blueprint.coverage.viewportClasses),
    ),
    inputMethods: uniqueSorted(
      blueprints.flatMap((blueprint) => blueprint.coverage.inputMethods),
    ),
    stateIds: uniqueSorted(
      blueprints.flatMap((blueprint) => blueprint.coverage.stateIds),
    ),
    securityControlIds: uniqueSorted(
      blueprints.flatMap(
        (blueprint) => blueprint.coverage.securityControlIds,
      ),
    ),
    persistenceModes: uniqueSorted(
      blueprints.flatMap((blueprint) => blueprint.coverage.persistenceModes),
    ),
  };
}

function buildCoverageLinks(
  inventory: PlannerCoverageInventory,
  traces: PlannerAuditDataset["workflowTraces"],
): CoverageLink[] {
  const itemById = new Map(
    inventory.coverageItems.map((item) => [item.id, item]),
  );
  const traceByKey = new Map(
    PLANNER_WORKFLOW_BLUEPRINTS.map((blueprint, index) => [
      blueprint.key,
      traces[index],
    ]),
  );

  return inventory.coverageItems.map((item) => {
    const workflowKeys = workflowsForItem(item, itemById);
    const blueprints = workflowKeys.map(blueprintByKey);
    const linkedTraces = workflowKeys.map((key) => {
      const trace = traceByKey.get(key);
      if (!trace) {
        throw new Error(`Workflow trace was not built: ${key}`);
      }
      return trace;
    });
    const dimensions = mergeDimensions(blueprints);
    const routeIds = uniqueSorted([
      ...linkedTraces.flatMap((trace) => trace.routeIds),
      ...(item.kind === "route" ? [item.id] : []),
    ]);

    return {
      itemId: item.id,
      routeIds,
      workflowIds: linkedTraces.map((trace) => trace.id),
      ...dimensions,
      requirementRefs: uniqueSorted(
        blueprints.flatMap((blueprint) => blueprint.requirementRefs),
      ),
      findingIds: workflowKeys.map(workflowFindingId),
      verificationRefs: [TASK_1_3_VALIDATION_ID],
      evidenceRefs: uniqueSorted([
        ...item.evidenceRefs,
        ...workflowKeys.map(workflowEvidenceId),
      ]),
    };
  });
}

function buildTraceFindings(
  traces: PlannerAuditDataset["workflowTraces"],
): AuditFinding[] {
  return PLANNER_WORKFLOW_BLUEPRINTS.map((blueprint, index) => {
    const trace = traces[index];
    const sourcePaths = uniqueSorted(
      blueprint.stages.map(([sourcePath]) => sourcePath),
    );
    return {
      id: workflowFindingId(blueprint.key),
      title: `Workflow trace candidate: ${blueprint.name}`,
      severity: "note",
      state: "candidate",
      routeIds: [...trace.routeIds],
      workflowIds: [trace.id],
      adjacentWorkflowIds: [],
      sourcePaths,
      requirementRefs: [...blueprint.requirementRefs],
      reproductionEvidenceRefs: [workflowEvidenceId(blueprint.key)],
      completionEvidenceRefs: [],
      expected:
        "A complete route-to-user-visible-result trace with explicit coverage and verification links.",
      observed: blueprint.reachabilityNote,
      affectedScope: [blueprint.key],
      remediationPaths: [],
      validationIds: [TASK_1_3_VALIDATION_ID],
    };
  });
}

function buildPendingValidation(findings: readonly AuditFinding[]): ValidationRecord {
  return {
    id: TASK_1_3_VALIDATION_ID,
    state: "pending",
    findingIds: findings.map((finding) => finding.id),
    kind: "unit",
    target: "repository",
    repositoryRoot: ".",
    requirementRefs: [...TASK_1_3_REQUIREMENTS],
    verifies:
      "The Task 1.3 matrix is deterministic, every inventory row and workflow is linked, and every trace contains the ordered route-to-visible-result stages.",
    limitation:
      "The command is protected and was not authorized in this task; static unit coverage cannot prove rendered, browser, integration, hosted, or persistence behavior.",
    exactCommand:
      "pnpm exec vitest --run tests/unit/planner/plannerWorkflowTrace.test.ts",
    pendingOwnerAction: null,
    userAuthorization: "not-authorized",
    hookPermission: "not-observed",
    exitStatus: null,
    outcome: null,
    evidenceRefs: [],
  };
}

export function createFirstPlannerEvidenceMatrix(
  inventory: PlannerCoverageInventory = initialPlannerInventory,
): PlannerAuditDataset {
  const workflowTraces = buildPlannerWorkflowTraces(inventory.coverageItems);
  const findings = buildTraceFindings(workflowTraces);
  const validations = [buildPendingValidation(findings)];
  const evidence = [
    ...inventory.evidence,
    ...buildPlannerWorkflowEvidence(),
  ].sort((left, right) => compareText(left.id, right.id));
  const coverageLinks = buildCoverageLinks(inventory, workflowTraces);

  return {
    coverageItems: structuredClone(inventory.coverageItems),
    coverageLinks,
    workflowTraces,
    evidence,
    validations,
    findings,
  };
}

export function assertFirstPlannerEvidenceMatrix(
  dataset: PlannerAuditDataset,
): void {
  const result = validateAuditDataset(dataset, {
    requiredRequirementRefs: [...TASK_1_3_REQUIREMENTS],
  });
  if (!result.valid) {
    const details = result.issues
      .map((issue) => `${issue.path} [${issue.code}] ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid Planner Task 1.3 evidence matrix:\n${details}`);
  }
}

/**
 * The first authored Task 1.3 evidence matrix. It is deterministic for the
 * current inventory and contains no runtime/browser/hosted result claims.
 */
export const firstPlannerEvidenceMatrix = createFirstPlannerEvidenceMatrix();
assertFirstPlannerEvidenceMatrix(firstPlannerEvidenceMatrix);

export const FIRST_PLANNER_EVIDENCE_MATRIX_REQUIREMENTS =
  [...TASK_1_3_REQUIREMENTS] satisfies RequirementRef[];
