import type { EvidenceRecord, RequirementRef, ValidationRecord } from "./auditModel";

export const TASK_5_1_5_4_REQUIREMENTS = [
  "17.1", "17.2", "17.3", "17.4", "17.5", "17.6", "17.7",
] as const satisfies readonly RequirementRef[];

export interface PlannerObservabilitySerialHandoff {
  readonly id: string;
  readonly owner: "workstream-2" | "workstream-4";
  readonly path: string;
  readonly adapterImport: string;
  readonly integration: string;
  readonly requiredAssertions: readonly string[];
  readonly status: "pending-serial-owner-integration";
}

export const PLANNER_OBSERVABILITY_SERIAL_HANDOFFS: readonly PlannerObservabilitySerialHandoff[] = [
  {
    id: "handoff:w4:planner-route-observability",
    owner: "workstream-4",
    path: "site/server/Planner/plannerRouteAdapter.ts",
    adapterImport: "import { observePlannerApiResponseAtCallSite } from '@/lib/observability/planner/plannerObservability.server';",
    integration: "Capture startedAtMs immediately inside the generated handler, await processPlannerRequest once, and return observePlannerApiResponseAtCallSite({ operation: descriptor.id, method: descriptor.method, authorizationProtected: descriptor.security.auth === 'member' || descriptor.security.owner === 'authenticated-owner-or-admin-item', startedAtMs, response }). Apply the same adapter to plannerMethodNotAllowed using its response correlation header and a bounded descriptor-derived operation supplied by each route owner.",
    requiredAssertions: [
      "The exact Response object and body are preserved.",
      "No request body, URL, owner/project id, exception text, or arbitrary header enters observability.",
      "Rate-limit and authorization result classes are derived only from the bounded response status.",
    ],
    status: "pending-serial-owner-integration",
  },
  {
    id: "handoff:w2:planner-persistence-observability",
    owner: "workstream-2",
    path: "site/lib/Planner/plannerProjectOperations.ts",
    adapterImport: "import { runObservedPlannerPersistenceAtCallSite } from '@/lib/observability/planner/plannerObservability.server';",
    integration: "At the selected-adapter boundary, pass the explicit bounded persistence operation, getPlannerPersistenceMode(env), and context.correlationId to runObservedPlannerPersistenceAtCallSite; place the existing single runContextualPlannerPersistenceOperation call inside execute without adding retries or a second adapter call.",
    requiredAssertions: [
      "Exactly one selected disk or Supabase adapter executes.",
      "The exact repository result or thrown value is preserved.",
      "The API-derived correlation id reaches the persistence event unchanged.",
    ],
    status: "pending-serial-owner-integration",
  },
];

export const TASK_5_1_5_4_REPOSITORY_EVIDENCE: EvidenceRecord = {
  id: "evidence:tasks-5.1-5.4-planner-observability",
  class: "repository",
  summary: "Planner-only allowlisted operation events, bounded Prometheus labels, response/persistence adapters, exporter isolation, fallback behavior, and Properties 24-25 are authored.",
  sourceRefs: [
    "site/lib/observability/planner/plannerObservability.ts",
    "site/lib/observability/planner/plannerObservabilityAdapters.ts",
    "site/lib/observability/planner/plannerObservabilityExporter.server.ts",
    "site/lib/observability/planner/plannerObservability.server.ts",
    "tests/unit/planner/plannerObservability.property.test.ts",
  ],
  limitation: "W2/W4 owner call sites remain serial handoffs. Static source does not prove runtime event emission, metric scraping across deployment instances, hosted telemetry, or a test result.",
  artifact: { authorship: "authored", path: "plans/planner-comprehensive-audit/plannerObservabilityEvidence.ts" },
};

export const TASK_5_3_5_4_PENDING_VALIDATION: ValidationRecord = {
  id: "validation:tasks-5.3-5.4-observability-properties",
  findingIds: ["finding:trace:project-save"],
  kind: "unit",
  target: "repository",
  repositoryRoot: ".",
  requirementRefs: [...TASK_5_1_5_4_REQUIREMENTS],
  verifies: "Properties 24 and 25 cover correlation/privacy preservation and observability failure isolation for generated cases.",
  limitation: "The property specification is authored but unexecuted; no pass, fail, runtime metric, browser, hosted, or deployment result is claimed.",
  state: "pending",
  exactCommand: "pnpm exec vitest run --config tests/vitest.config.ts tests/unit/planner/plannerObservability.property.test.ts",
  pendingOwnerAction: null,
  userAuthorization: "not-authorized",
  hookPermission: "not-observed",
  exitStatus: null,
  outcome: null,
  evidenceRefs: [],
};
