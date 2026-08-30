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
    | "generated-admin-alias"
    | "drizzle-parity"
    | "stale-handoff-note";
  readonly status: "repository-contract-gap" | "stale-note";
  readonly summary: string;
  readonly sourceRefs: readonly string[];
  readonly handoff: string;
  readonly findingIds: readonly FindingRef[];
}

export interface PendingTask4_9Action {
  readonly id: string;
  readonly kind: "protected-validation" | "hosted-operation";
  readonly exactCommand: string;
  readonly status: "pending-separate-authorization";
  readonly ownerAction: string;
}

const ARTIFACT_PATH =
  "plans/planner-comprehensive-audit/schemaGapDecision.ts" as const;

export const TASK_4_9_EVIDENCE = [
  {
    id: "evidence:task-4.9-admin-migration-history",
    class: "repository",
    summary:
      "The Admin migration history creates public.oando_plans with owner and time indexes, enables RLS, and leaves the service-role policy in place before the revision/idempotency migration adds the new contract.",
    sourceRefs: [
      "site/platform/supabase/migrations.admin/20260628100000_planner_plans_and_audit.sql#L5-L40",
      "site/platform/supabase/migrations.admin/20260628100000_planner_plans_and_audit.sql#L42-L47",
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
      "site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql#L5-L84",
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
      "The generated Admin table artifact includes oando_plans revision/schema_version fields and the full planner_operation_idempotency response envelope, including the owner relationship.",
    sourceRefs: [
      "site/platform/types/database.admin.types.ts#L367-L417",
      "site/platform/types/database.admin.types.ts#L518-L579",
    ],
    limitation:
      "The generated file is local source evidence; it does not prove generation against the current hosted schema.",
    artifact: { authorship: "authored", path: ARTIFACT_PATH },
  },
  {
    id: "evidence:task-4.9-planner-adapter-contract",
    class: "repository",
    summary:
      "The Supabase Planner adapter reads dedicated revision/schema columns, validates bounded idempotency and revisions, fingerprints requests, calls planner_mutate_plan_v1, and maps replay/conflict results into the repository transition contract.",
    sourceRefs: [
      "site/server/Planner/plannerProjectSupabaseAdapter.ts#L28-L102",
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
      "site/lib/Planner/plannerProjectRepository.ts#L15-L70",
      "site/lib/Planner/plannerProjectRepository.ts#L329-L446",
      "site/lib/Planner/plannerProjectRepository.ts#L497-L512",
      "site/lib/Planner/plannerProjectOperations.ts#L30-L85",
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
      "The non-production disk adapter persists the same atomic project state and idempotency receipt contract behind a per-project lock and write-then-rename state file, so the schema decision is limited to the Admin branch rather than dual-writing disk.",
    sourceRefs: [
      "site/server/Planner/plannerProjectDiskAdapter.ts#L14-L37",
      "site/server/Planner/plannerProjectDiskAdapter.ts#L102-L179",
      "site/server/Planner/plannerProjectDiskAdapter.ts#L203-L220",
      "site/lib/Planner/plannerPersistenceMode.ts#L1-L15",
      "site/lib/Planner/plannerPersistenceMode.ts#L100-L150",
    ],
    limitation:
      "Static mode-selection and adapter evidence only; no disk or Admin operation was executed.",
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
] as const satisfies readonly EvidenceRef[];

export const TASK_4_9_SCHEMA_CONTRACT_CHECKS: readonly SchemaContractCheck[] = [
  {
    concern: "revision",
    status: "satisfied-by-repository-evidence",
    summary:
      "Dedicated bigint revision is backfilled deterministically, defaults to 1, is not null, is constrained to >= 1, and is used by the RPC compare-and-swap update/delete predicates and single increment.",
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
      "The owner/operation/project/key identity is unique, key and fingerprint lengths are bounded, processing claims are atomic, mismatched or in-flight reuse conflicts, and identical completed retries replay the stored response without a second project effect.",
    evidenceRefs: [
      "evidence:task-4.9-admin-migration-contract",
      "evidence:task-4.9-generated-admin-tables",
      "evidence:task-4.9-planner-adapter-contract",
      "evidence:task-4.9-planner-repository-contract",
    ],
    findingIds: TASK_4_9_FINDING_IDS,
  },
  {
    concern: "constraints",
    status: "satisfied-by-repository-evidence",
    summary:
      "Revision, schema version, idempotency operation, key syntax/length, fingerprint length, response status, and response revision constraints are present in the repository migration and mirrored in Drizzle support.",
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
      "Public and anonymous table/function access is revoked; authenticated clients receive read-only table access plus the guarded RPC execute grant; service_role receives the server-side table operations; no anonymous project grant is introduced.",
    evidenceRefs: ["evidence:task-4.9-admin-migration-contract"],
    findingIds: TASK_4_9_FINDING_IDS,
  },
  {
    concern: "indexes",
    status: "satisfied-by-repository-evidence",
    summary:
      "The existing oando_plans user/time indexes cover owner listing and ordering, while the idempotency identity unique index covers exact receipt claims/replays and created_at supplies retention-oriented ordering.",
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
    status: "repository-contract-gap",
    summary:
      "The generated Admin type artifact declares the two Planner tables but its Functions map is empty; the adapter therefore carries a local RPC argument/result interface and a cast for planner_mutate_plan_v1.",
    sourceRefs: [
      "site/platform/types/database.admin.types.ts#L1021-L1024",
      "site/server/Planner/plannerProjectSupabaseAdapter.ts#L42-L80",
      "scripts/db_gen_admin_types.ts#L235-L243",
    ],
    handoff:
      "Workstream 4/4.11 must reconcile the separately authorized Admin type-generation result; this gap is not evidence that a new SQL migration is needed.",
    findingIds: TASK_4_9_FINDING_IDS,
  },
  {
    id: "gap:task-4.9-generated-admin-alias",
    concern: "generated-admin-alias",
    status: "repository-contract-gap",
    summary:
      "site/types/database.admin.types.ts is empty at inspection while auth-admin.ts imports Database from that alias; the populated generated artifact is under site/platform/types/database.admin.types.ts.",
    sourceRefs: [
      "site/types/database.admin.types.ts (empty at inspection)",
      "site/platform/supabase/auth-admin.ts#L3-L5",
      "site/platform/types/database.admin.types.ts#L367-L579",
    ],
    handoff:
      "Workstream 4/4.11 must reconcile the repository import alias and generated-type workflow; no hosted state is inferred and no adapter implementation is changed by task 4.9.",
    findingIds: TASK_4_9_FINDING_IDS,
  },
  {
    id: "gap:task-4.9-drizzle-response-envelope",
    concern: "drizzle-parity",
    status: "repository-contract-gap",
    summary:
      "Drizzle mirrors the core idempotency identity, status, revision, constraints, and indexes but does not declare the migration's response payload/name/thumbnail/status/timestamp receipt columns; the live Supabase adapter consumes those fields through the RPC envelope instead of Drizzle.",
    sourceRefs: [
      "site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql#L42-L84",
      "site/platform/types/database.admin.types.ts#L518-L566",
      "site/platform/drizzle/schema/planner.ts#L38-L62",
      "site/server/Planner/plannerProjectSupabaseAdapter.ts#L56-L67",
    ],
    handoff:
      "Workstream 4 owns any repository-side contract reconciliation; this parity gap does not change the no-migration decision because the SQL object already exists and the adapter path is RPC-based.",
    findingIds: TASK_4_9_FINDING_IDS,
  },
  {
    id: "gap:task-4.9-stale-adapter-handoff-note",
    concern: "stale-handoff-note",
    status: "stale-note",
    summary:
      "The adapter handoff text says generated Admin types do not declare migration columns, but the current generated artifact does declare revision, schema_version, and the idempotency table; only the Functions map remains empty in the inspected artifact.",
    sourceRefs: [
      "site/server/Planner/plannerProjectSupabaseAdapter.ts#L83-L102",
      "site/platform/types/database.admin.types.ts#L367-L579",
      "site/platform/types/database.admin.types.ts#L1021-L1024",
    ],
    handoff:
      "Workstream 4 must reconcile the stale wording in its owned adapter contract during the next serial handoff; task 4.9 does not edit the persistence adapter implementation.",
    findingIds: TASK_4_9_FINDING_IDS,
  },
];

export const TASK_4_9_PENDING_ACTIONS: readonly PendingTask4_9Action[] = [
  {
    id: "pending:task-4.9-admin-dry-run",
    kind: "protected-validation",
    exactCommand: "pnpm run db:apply:admin -- --dry",
    status: "pending-separate-authorization",
    ownerAction:
      "Authorize and run the Admin migration dry-run from the repository root before any authorized application; no result is claimed here.",
  },
  {
    id: "pending:task-4.9-admin-application",
    kind: "hosted-operation",
    exactCommand: "pnpm run db:apply:admin",
    status: "pending-separate-authorization",
    ownerAction:
      "Separately authorize application of the existing Admin migration in the intended environment; task 4.9 did not apply it or inspect hosted schema state.",
  },
  {
    id: "pending:task-4.9-admin-type-generation",
    kind: "protected-validation",
    exactCommand: "pnpm run db:types:admin",
    status: "pending-separate-authorization",
    ownerAction:
      "After an authorized Admin environment update, regenerate the Admin type artifact and reconcile the RPC/alias gaps; no generation result is claimed here.",
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
  task4_10Control:
    "Do not create a second Admin migration in task 4.10. The existing 20260823090000_planner_revision_idempotency.sql is the repository-side schema implementation; carry hosted application and type-generation actions as separately authorized pending work.",
  findingIds: TASK_4_9_FINDING_IDS,
  requirementRefs: TASK_4_9_REQUIREMENTS,
  evidenceRefs: TASK_4_9_EVIDENCE_REFS,
  schemaContractChecks: TASK_4_9_SCHEMA_CONTRACT_CHECKS,
  repositoryContractGaps: TASK_4_9_REPOSITORY_CONTRACT_GAPS,
  pendingHostedActions: TASK_4_9_PENDING_ACTIONS,
  limitation:
    "This is repository-side evidence only. Hosted schema inspection, migration application, generated-type execution, runtime adapter calls, tests, integration checks, and deployment were not executed or claimed.",
} as const;
