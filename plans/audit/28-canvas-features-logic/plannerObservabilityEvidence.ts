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
  readonly status: "pending-serial-owner-integration" | "acknowledged";
}

export const PLANNER_OBSERVABILITY_SERIAL_HANDOFFS: readonly PlannerObservabilitySerialHandoff[] = [
  {
    id: "handoff:w4:planner-route-observability",
    owner: "workstream-4",
    path: "site/server/Planner/plannerRouteAdapter.ts",
    adapterImport: "import { observePlannerApiResponseAtCallSite } from '@/lib/observability/planner/plannerObservability.server';",
    integration: "createPlannerHandler observes the single processPlannerRequest response with descriptor-derived method/authorization labels and preserves the exact Response; unsupported-method helper coverage remains source-defined and runtime-unverified.",
    requiredAssertions: [
      "The exact Response object and body are preserved.",
      "No request body, URL, owner/project id, exception text, or arbitrary header enters observability.",
      "Rate-limit and authorization result classes are derived only from the bounded response status.",
    ],
    status: "acknowledged",
  },
  {
    id: "handoff:w2:planner-persistence-observability",
    owner: "workstream-2",
    path: "site/lib/Planner/plannerProjectOperations.ts",
    adapterImport: "import { runObservedPlannerPersistenceAtCallSite } from '@/lib/observability/planner/plannerObservability.server';",
    integration: "createPlannerProjectRepository wraps each list/load/create/save/delete operation at the selected adapter boundary with its bounded operation, adapter mode, and unchanged context correlation id; no retry or fallback adapter call is added.",
    requiredAssertions: [
      "Exactly one selected disk or Supabase adapter executes.",
      "The exact repository result or thrown value is preserved.",
      "The API-derived correlation id reaches the persistence event unchanged.",
    ],
    status: "acknowledged",
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
  limitation: "Static source establishes both serial call-site integrations and the response/result-preservation contract; runtime event emission, metric scraping across deployment instances, hosted telemetry, and a test result remain unverified.",
  artifact: { authorship: "authored", path: "plans/audit/28-canvas-features-logic/plannerObservabilityEvidence.ts" },
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
