import type {
  EvidenceRecord,
  EvidenceRef,
  FindingRef,
  RequirementRef,
} from "./auditModel";

export const TASK_4_9_REQUIREMENTS = [
  "14.1",
  "14.2",
  "14.6",
  "14.10",
  "19.4",
] as const satisfies readonly RequirementRef[];

/**
 * Schema evidence is bound to the project-operation traces that consume the
 * Admin revision, schema-version, idempotency, owner, and query contracts.
 * Workstream 1 remains the serial owner of lifecycle promotion.
 */
export const TASK_4_9_FINDING_IDS = [
  "finding:trace:project-list",
  "finding:trace:project-create",
  "finding:trace:project-load",
  "finding:trace:project-save",
  "finding:trace:project-delete",
  "finding:trace:offline-reconnect",
  "finding:trace:conflict-recovery",
] as const satisfies readonly FindingRef[];

export type Task4_10MigrationBranch = "migration-needed" | "no-migration";

export type SchemaContractConcern =
  | "revision"
  | "schema-version"
  | "idempotency"
  | "constraints"
  | "rls"
  | "grants"
  | "indexes";

export interface SchemaContractCheck {
  readonly concern: SchemaContractConcern;
  readonly status: "satisfied-by-repository-evidence";
  readonly summary: string;
  readonly evidenceRefs: readonly EvidenceRef[];
  readonly findingIds: readonly FindingRef[];
}

export interface RepositoryContractGap {
  readonly id: string;
  readonly concern:
    | "generated-rpc-type"
    | "drizzle-parity"
    | "legacy-direct-adapter"
    | "stale-handoff-note";
  readonly status:
    | "repository-contract-gap"
    | "stale-note"
    | "resolved"
    | "classified-legacy-boundary";
  readonly summary: string;
  readonly sourceRefs: readonly string[];
  readonly handoff: string;
  readonly findingIds: readonly FindingRef[];
}

export interface CompletedTask4_9Action {
  readonly id: string;
  readonly kind: "protected-validation" | "hosted-operation";
  readonly exactCommand: string;
  readonly status: "completed";
  readonly result: string;
}

const ARTIFACT_PATH =
  "plans/planner-comprehensive-audit/schemaGapDecision.ts" as const;

export const TASK_4_9_EVIDENCE = [
  {
    id: "evidence:task-4.9-admin-migration-history",
    class: "repository",
    summary:
      "The Admin migration history creates public.oando_plans with owner/time indexes, enables RLS, and leaves the service-role policy in place before the revision/idempotency migration adds the new contract.",
    sourceRefs: [
      "site/platform/supabase/migrations.admin/20260628100000_planner_plans_and_audit.sql#L5-L36",
      "site/platform/supabase/migrations.admin/20260628100000_planner_plans_and_audit.sql#L38-L47",
    ],
    limitation:
      "Static repository evidence only; it does not prove that this migration history has reached the hosted Admin database.",
    artifact: { authorship: "authored", path: ARTIFACT_PATH },
  },
  {
    id: "evidence:task-4.9-admin-migration-contract",
    class: "repository",
    summary:
      "The existing Admin migration deterministically backfills revision and schema_version, adds not-null defaults and checks, creates owner-scoped idempotency storage, defines the guarded compare-and-swap RPC, applies owner RLS, least-privilege grants, indexes, and a rollback section.",
    sourceRefs: [
      "site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql#L5-L40",
      "site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql#L42-L84",
      "site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql#L85-L138",
      "site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql#L143-L388",
      "site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql#L390-L409",
    ],
    limitation:
      "Static SQL evidence only; no hosted schema inspection, dry-run, application, or remote result is claimed.",
    artifact: { authorship: "authored", path: ARTIFACT_PATH },
  },
  {
    id: "evidence:task-4.9-generated-admin-tables",
    class: "repository",
    summary:
      "The checked-in Admin table artifact includes oando_plans revision/schema_version fields and the full planner_operation_idempotency response envelope with the owner relationship. The canonical site/types alias re-exports this platform artifact.",
    sourceRefs: [
      "site/platform/types/database.admin.types.ts#L367-L417",
      "site/platform/types/database.admin.types.ts#L518-L579",
      "site/types/database.admin.types.ts#L1",
      "site/platform/supabase/auth-admin.ts#L3-L5",
    ],
    limitation:
      "The checked-in file is local source evidence; its generation against the current hosted schema was not observed in this lane.",
    artifact: { authorship: "authored", path: ARTIFACT_PATH },
  },
  {
    id: "evidence:task-4.9-planner-adapter-contract",
    class: "repository",
    summary:
      "The atomic Supabase Planner adapter reads dedicated revision/schema columns, validates bounded idempotency and revisions, fingerprints requests, calls planner_mutate_plan_v1, and maps replay/conflict results into the repository transition contract.",
    sourceRefs: [
      "site/server/Planner/plannerProjectSupabaseAdapter.ts#L28-L80",
      "site/server/Planner/plannerProjectSupabaseAdapter.ts#L115-L200",
      "site/server/Planner/plannerProjectSupabaseAdapter.ts#L237-L321",
      "site/server/Planner/plannerProjectSupabaseAdapter.ts#L353-L418",
      "site/server/Planner/plannerProjectSupabaseAdapter.ts#L426-L580",
    ],
    limitation:
      "Static adapter evidence only; no Supabase RPC call or hosted mutation result was executed.",
    artifact: { authorship: "authored", path: ARTIFACT_PATH },
  },
  {
    id: "evidence:task-4.9-planner-repository-contract",
    class: "repository",
    summary:
      "The normalized Planner repository contract requires schema version 1, permits known-old version 0 migration in memory, rejects unsupported versions, validates server-owned revisions/timestamps, and bounds idempotency keys; the atomic operation contract defines one-effect replay and stale-revision conflict behavior.",
    sourceRefs: [
      "site/lib/Planner/plannerProjectRepository.ts#L15-L115",
      "site/lib/Planner/plannerProjectRepository.ts#L225-L258",
      "site/lib/Planner/plannerProjectRepository.ts#L329-L446",
      "site/lib/Planner/plannerProjectRepository.ts#L449-L515",
      "site/lib/Planner/plannerProjectOperations.ts#L30-L136",
      "site/lib/Planner/plannerProjectOperations.ts#L158-L336",
    ],
    limitation:
      "Static repository contract evidence only; runtime persistence behavior remains unverified until separately authorized checks run.",
    artifact: { authorship: "authored", path: ARTIFACT_PATH },
  },
  {
    id: "evidence:task-4.9-planner-disk-adapter-contract",
    class: "repository",
    summary:
      "The non-production disk adapter persists the same atomic project state and idempotency receipt contract behind a per-project lock and write-then-rename state file, while the mode selector prevents an Admin operation from falling back to disk.",
    sourceRefs: [
      "site/server/Planner/plannerProjectDiskAdapter.ts#L14-L37",
      "site/server/Planner/plannerProjectDiskAdapter.ts#L75-L179",
      "site/server/Planner/plannerProjectDiskAdapter.ts#L180-L220",
      "site/lib/Planner/plannerPersistenceMode.ts#L1-L15",
      "site/lib/Planner/plannerPersistenceMode.ts#L60-L150",
    ],
    limitation:
      "Static mode-selection and adapter evidence only; no disk or Admin operation was executed.",
    artifact: { authorship: "authored", path: ARTIFACT_PATH },
  },
  {
    id: "evidence:task-4.9-legacy-store-path",
    class: "repository",
    summary:
      "The atomic /api/Planner/projects endpoint uses plannerProjectRepository, but projectsStore.ts still exposes legacy /api/plans and Admin plan operations through direct Supabase list/load/upsert/delete helpers that do not carry expectedRevision or idempotency identity.",
    sourceRefs: [
      "site/app/api/Planner/projects/plannerProjectEndpoint.ts#L1-L18",
      "site/app/api/Planner/projects/plannerProjectEndpoint.ts#L127-L214",
      "site/lib/Planner/projectsStore.ts#L103-L108",
      "site/lib/Planner/projectsStore.ts#L216-L281",
      "site/lib/Planner/projectsStore.supabase.ts#L135-L190",
      "site/app/api/plans/route.ts#L1-L127",
      "site/app/api/plans/[id]/route.ts#L1-L222",
    ],
    limitation:
      "Static route and adapter wiring evidence only; runtime reachability and behavior were not exercised. This is an application-contract gap, not proof of an Admin schema defect.",
    artifact: { authorship: "authored", path: ARTIFACT_PATH },
  },
  {
    id: "evidence:task-4.9-stale-repository-records",
    class: "repository",
    summary:
      "The adapter handoff still says generated Admin types lack migration columns, while the checked-in artifact contains them; the existing migration-focused test still declares a migration-required branch even though the migration is already present in the repository.",
    sourceRefs: [
      "site/server/Planner/plannerProjectSupabaseAdapter.ts#L83-L102",
      "site/platform/types/database.admin.types.ts#L367-L579",
      "site/platform/types/database.admin.types.ts#L1018-L1024",
      "tests/unit/platform/Planner/plannerAdminMigration.test.ts#L18-L41",
    ],
    limitation:
      "The stale source/test records were inspected but not edited or executed in task 4.9; reconciliation is handed to the owning follow-up task.",
    artifact: { authorship: "authored", path: ARTIFACT_PATH },
  },
] as const satisfies readonly EvidenceRecord[];

export const TASK_4_9_EVIDENCE_REFS = [
  "evidence:task-4.9-admin-migration-history",
  "evidence:task-4.9-admin-migration-contract",
  "evidence:task-4.9-generated-admin-tables",
  "evidence:task-4.9-planner-adapter-contract",
  "evidence:task-4.9-planner-repository-contract",
  "evidence:task-4.9-planner-disk-adapter-contract",
  "evidence:task-4.9-legacy-store-path",
  "evidence:task-4.9-stale-repository-records",
] as const satisfies readonly EvidenceRef[];

export const TASK_4_9_SCHEMA_CONTRACT_CHECKS: readonly SchemaContractCheck[] = [
  {
    concern: "revision",
    status: "satisfied-by-repository-evidence",
    summary:
      "Dedicated bigint revision is backfilled deterministically, defaults to 1, is not null, is constrained to >= 1, and is used by the atomic RPC compare-and-swap update/delete predicates and single increment.",
    evidenceRefs: [
      "evidence:task-4.9-admin-migration-contract",
      "evidence:task-4.9-generated-admin-tables",
      "evidence:task-4.9-planner-adapter-contract",
      "evidence:task-4.9-planner-repository-contract",
    ],
    findingIds: TASK_4_9_FINDING_IDS,
  },
  {
    concern: "schema-version",
    status: "satisfied-by-repository-evidence",
    summary:
      "Dedicated integer schema_version is backfilled from camel- and snake-case payload fields, defaults to 1, is not null, is constrained to >= 0, and matches the repository's current v1/known-old v0 compatibility contract.",
    evidenceRefs: [
      "evidence:task-4.9-admin-migration-contract",
      "evidence:task-4.9-generated-admin-tables",
      "evidence:task-4.9-planner-adapter-contract",
      "evidence:task-4.9-planner-repository-contract",
    ],
    findingIds: TASK_4_9_FINDING_IDS,
  },
  {
    concern: "idempotency",
    status: "satisfied-by-repository-evidence",
    summary:
      "The owner/operation/project/key identity is unique, key and fingerprint lengths are bounded, processing claims are atomic, mismatched or in-flight reuse conflicts, and identical completed retries replay the stored response without a second project effect on the atomic Admin path.",
    evidenceRefs: [
      "evidence:task-4.9-admin-migration-contract",
      "evidence:task-4.9-generated-admin-tables",
      "evidence:task-4.9-planner-adapter-contract",
      "evidence:task-4.9-planner-repository-contract",
      "evidence:task-4.9-legacy-store-path",
    ],
    findingIds: TASK_4_9_FINDING_IDS,
  },
  {
    concern: "constraints",
    status: "satisfied-by-repository-evidence",
    summary:
      "Revision, schema version, idempotency operation, key syntax/length, fingerprint length, response status, and response revision constraints are present in the Admin migration and the core Planner Drizzle support.",
    evidenceRefs: [
      "evidence:task-4.9-admin-migration-contract",
      "evidence:task-4.9-planner-repository-contract",
    ],
    findingIds: TASK_4_9_FINDING_IDS,
  },
  {
    concern: "rls",
    status: "satisfied-by-repository-evidence",
    summary:
      "oando_plans has authenticated owner policies for select/insert/update/delete, the idempotency table has owner-scoped authenticated policies, and service_role policies remain explicit for server-side operations.",
    evidenceRefs: [
      "evidence:task-4.9-admin-migration-history",
      "evidence:task-4.9-admin-migration-contract",
      "evidence:task-4.9-planner-adapter-contract",
    ],
    findingIds: TASK_4_9_FINDING_IDS,
  },
  {
    concern: "grants",
    status: "satisfied-by-repository-evidence",
    summary:
      "Public and anonymous table/function access is revoked; authenticated clients receive read-only table access plus guarded RPC execute; service_role receives server-side table operations; no anonymous project grant is introduced.",
    evidenceRefs: ["evidence:task-4.9-admin-migration-contract"],
    findingIds: TASK_4_9_FINDING_IDS,
  },
  {
    concern: "indexes",
    status: "satisfied-by-repository-evidence",
    summary:
      "The existing oando_plans user/status/time indexes cover owner listing and ordering, while the idempotency identity unique index covers exact receipt claims/replays and created_at supplies retention-oriented ordering.",
    evidenceRefs: [
      "evidence:task-4.9-admin-migration-history",
      "evidence:task-4.9-admin-migration-contract",
    ],
    findingIds: TASK_4_9_FINDING_IDS,
  },
];

export const TASK_4_9_REPOSITORY_CONTRACT_GAPS: readonly RepositoryContractGap[] = [
  {
    id: "gap:task-4.9-generated-rpc-type",
    concern: "generated-rpc-type",
    status: "resolved",
    summary:
      "The regenerated Admin type artifact declares planner_mutate_plan_v1. The adapter retains a local, runtime-validated RPC boundary because generated routine metadata does not preserve the nullable/defaulted arguments and nullable receipt envelope.",
    sourceRefs: [
      "site/platform/types/database.admin.types.ts#L1044-L1065",
      "site/server/Planner/plannerProjectSupabaseAdapter.ts#L42-L80",
      "scripts/db_gen_admin_types.ts#L267-L341",
    ],
    handoff:
      "Keep the explicit runtime boundary when regenerating Admin types; no additional SQL migration is required.",
    findingIds: TASK_4_9_FINDING_IDS,
  },
  {
    id: "gap:task-4.9-drizzle-response-envelope",
    concern: "drizzle-parity",
    status: "resolved",
    summary:
      "Drizzle now declares the full nullable idempotency receipt envelope alongside the core Planner revision/schema and idempotency constraints.",
    sourceRefs: [
      "site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql#L42-L84",
      "site/platform/types/database.admin.types.ts#L518-L579",
      "site/platform/drizzle/schema/planner.ts#L16-L73",
      "site/server/Planner/plannerProjectSupabaseAdapter.ts#L56-L67",
    ],
    handoff:
      "Keep the Drizzle receipt fields aligned with any future Admin migration; this does not change the no-new-migration decision.",
    findingIds: TASK_4_9_FINDING_IDS,
  },
  {
    id: "gap:task-4.9-legacy-direct-adapter",
    concern: "legacy-direct-adapter",
    status: "classified-legacy-boundary",
    summary:
      "Legacy projectsStore.supabase functions remain a documented compatibility boundary for `/api/plans` and Admin document contracts. They retain owner-scoped checks, while the interactive Planner workspace exclusively uses the atomic revision/idempotency repository through `/api/Planner/projects`.",
    sourceRefs: [
      "site/lib/Planner/projectsStore.ts#L216-L281",
      "site/lib/Planner/projectsStore.supabase.ts#L135-L190",
      "site/app/api/plans/route.ts#L1-L127",
      "site/app/api/plans/[id]/route.ts#L1-L222",
      "site/app/api/Planner/projects/plannerProjectEndpoint.ts#L127-L214",
    ],
    handoff:
      "New interactive Planner mutations must continue to use the atomic repository. Moving legacy portal/Admin callers requires a versioned public-contract migration, not a duplicate Admin SQL migration.",
    findingIds: TASK_4_9_FINDING_IDS,
  },
  {
    id: "gap:task-4.9-stale-adapter-handoff-note",
    concern: "stale-handoff-note",
    status: "resolved",
    summary:
      "The atomic adapter handoff now records the generated planner_mutate_plan_v1 type and explains why the adapter still validates its nullable RPC envelope locally.",
    sourceRefs: [
      "site/server/Planner/plannerProjectSupabaseAdapter.ts#L76-L101",
      "site/platform/types/database.admin.types.ts#L367-L579",
      "site/platform/types/database.admin.types.ts#L1044-L1065",
    ],
    handoff:
      "Regenerate the Admin type artifact alongside future Admin migrations and preserve the runtime validation boundary.",
    findingIds: TASK_4_9_FINDING_IDS,
  },
  {
    id: "gap:task-4.9-stale-decision-test",
    concern: "stale-handoff-note",
    status: "resolved",
    summary:
      "The migration test and decision record now publish the no-new-migration branch, completed Admin workflow, generated RPC function type, and Drizzle receipt-envelope parity.",
    sourceRefs: [
      "tests/unit/platform/Planner/plannerAdminMigration.test.ts#L18-L41",
      "site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql#L5-L84",
      "site/platform/types/database.admin.types.ts#L367-L579",
    ],
    handoff:
      "Maintain this record when the Admin migration or generated type contract changes.",
    findingIds: TASK_4_9_FINDING_IDS,
  },
];

export const TASK_4_9_COMPLETED_ACTIONS: readonly CompletedTask4_9Action[] = [
  {
    id: "completed:task-4.9-admin-dry-run",
    kind: "protected-validation",
    exactCommand: "pnpm run db:apply:admin -- --dry",
    status: "completed",
    result:
      "Completed from the repository root on 2026-09-03; the Admin migration history validated with rollback coverage before application.",
  },
  {
    id: "completed:task-4.9-admin-application",
    kind: "hosted-operation",
    exactCommand: "pnpm run db:apply:admin",
    status: "completed",
    result:
      "Completed successfully on 2026-09-03 after the dry run; no duplicate Planner migration was introduced.",
  },
  {
    id: "completed:task-4.9-admin-type-generation",
    kind: "hosted-operation",
    exactCommand: "pnpm run db:types:admin",
    status: "completed",
    result:
      "Completed successfully on 2026-09-03; the regenerated artifact declares planner_mutate_plan_v1.",
  },
];

export const TASK_4_10_BRANCH: Task4_10MigrationBranch = "no-migration";

export const TASK_4_9_SCHEMA_GAP_DECISION = {
  id: "decision:task-4.9-admin-schema-gap",
  task: "4.9",
  database: "Admin",
  tables: ["public.oando_plans", "public.planner_operation_idempotency"],
  branch: TASK_4_10_BRANCH,
  schemaDefectVerified: false,
  migrationNeededForTask4_10: false,
  historicalTask4_10Control:
    "Select the no-new-migration branch for task 4.10. The existing 20260823090000_planner_revision_idempotency.sql is the repository-side schema implementation; carry hosted application and type-generation actions as separately authorized pending work. Reconcile the legacy direct adapter and stale records in their owning follow-up tasks without changing Products migrations or creating duplicate Admin SQL. Follow-up migrations that correct live function behaviour are distinct from new schema additions — do not create duplicate Admin SQL for changes already covered by the original migration.",
  task4_10Control:
    "Select the no-new-migration branch for task 4.10. The existing Admin migration was dry-run, applied, and followed by Admin type generation on 2026-09-03. The legacy portal/Admin compatibility path is explicitly separate from the atomic Planner workspace route; do not create duplicate Admin SQL.",
  findingIds: TASK_4_9_FINDING_IDS,
  requirementRefs: TASK_4_9_REQUIREMENTS,
  evidenceRefs: TASK_4_9_EVIDENCE_REFS,
  schemaContractChecks: TASK_4_9_SCHEMA_CONTRACT_CHECKS,
  repositoryContractGaps: TASK_4_9_REPOSITORY_CONTRACT_GAPS,
  completedHostedActions: TASK_4_9_COMPLETED_ACTIONS,
  limitation:
    "The Admin dry run, application, type generation, and Planner database smoke tests completed on 2026-09-03. This record does not claim a production deployment or a versioned migration of the legacy portal/Admin public contract.",
} as const;
