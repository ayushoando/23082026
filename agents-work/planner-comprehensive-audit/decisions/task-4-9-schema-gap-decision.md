# Planner Comprehensive Audit — Task 4.9 Schema-Gap Decision

**Decision date:** 2026-08-29  
**Scope:** Repository-local Admin migration, checked-in generated Admin types, and Planner persistence/API adapters only.  
**Database boundary:** Admin (`rxzpznmxbaoxpikowmfc`) / `public.oando_plans`; Products was not inspected or changed.

## Outcome

**Decision: conditional schema-gap handoff required.** The repository contains a proposed Admin migration that expresses the revision, schema-version, and owner-scoped idempotency contract, and the Planner Supabase adapter is written against that contract. The checked-in generated Admin type surface does not contain the migration additions or RPC, and repository-local evidence does not establish migration application state. Therefore the contract is **not repository-verified end to end**. Task 4.10 must remain conditional on the owner’s migration decision: reconcile or replace the existing migration only if its forward/rollback and local compatibility review proves defective; otherwise record it as the existing migration branch and proceed to the separately authorized type-generation workflow in 4.11. No migration was authored, applied, or modified by this task.

## Exact evidence inspected

### Admin migrations

- `site/platform/supabase/migrations.admin/20260628100000_planner_plans_and_audit.sql`
  - Defines `public.oando_plans` with `id`, `user_id`, `payload`, timestamps, and status fields.
  - Creates owner/query indexes including `oando_plans_user_id_idx`, status, timestamp, and owner-plus-status/timestamp indexes.
  - Enables RLS on `oando_plans` and defines a service-role policy.
- `site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql`
  - Adds `revision bigint` and `schema_version integer` to `oando_plans`.
  - Deterministically backfills revision from numeric payload `revision`, otherwise `1`; backfills schema version from numeric camel/snake payload fields, otherwise `0`, then sets the column default to `1` and both columns `NOT NULL`.
  - Adds checks `revision >= 1` and `schema_version >= 0`.
  - Defines `planner_operation_idempotency` with owner foreign key to `profiles`, operation/project/key identity, request fingerprint, response receipt fields, and unique `(owner_id, operation, project_id, idempotency_key)`.
  - Adds key, fingerprint, operation, status, and response-revision checks plus a `created_at` index.
  - Enables RLS on the idempotency table and defines owner-scoped authenticated policies plus service-role policy.
  - Replaces/defines owner-scoped `oando_plans` policies and grants authenticated read access, service-role table access, and authenticated/service-role execute access to `planner_mutate_plan_v1`.
  - Implements guarded create/save/delete RPC behavior with compare-and-swap revision checks and idempotency replay/conflict handling.
  - Contains a `-- rollback:` section removing the function, policies, table, constraints, columns, and grants in dependency-aware order.

### Generated Admin types

- `site/platform/types/database.types.ts`
  - Search for `oando_plans`, `planner_operation_idempotency`, and `planner_mutate_plan_v1` returned no matching Planner Admin table/RPC definitions.
  - The file does contain unrelated `schema_version` fields (for example catalog revision data), which is not evidence for `oando_plans.schema_version`.
  - This is a checked-in type-surface gap: the Supabase adapter’s local `OandoPlanRow` and RPC argument/row interfaces are hand-maintained because generated Admin types do not expose the migration contract.

### Planner repository and adapters

- `site/lib/Planner/plannerProjectRepository.ts`
  - Defines current project schema version `1`, known old version `0`, revision validation, unsupported-schema behavior, bounded idempotency key validation (maximum 120 characters), and owner/revision/timestamp server-derived boundaries.
- `site/lib/Planner/plannerProjectOperations.ts`
  - Defines atomic mutation state and owner/operation/project/key/fingerprint receipt identity for disk mode.
- `site/server/Planner/plannerProjectDiskAdapter.ts`
  - Persists state and receipts in an atomic sidecar under the approved Planner project directory, uses write-then-rename and a project lock, and applies the same mutation transition contract locally.
- `site/server/Planner/plannerProjectSupabaseAdapter.ts`
  - Reads owner-scoped `oando_plans` rows using dedicated `revision` and `schema_version` columns.
  - Calls `planner_mutate_plan_v1` for create/save/delete with expected revision, bounded idempotency key, and request fingerprint.
  - Declares `PLANNER_SUPABASE_MUTATION_CONTRACT_HANDOFF_V1`, explicitly noting that generated Admin types are pending and that migration/type workflow authorization is separate.
  - Preserves a read-only compatibility path for legacy payload containers; new writes use dedicated version columns.
- `site/lib/Planner/projectsStore.ts`
  - Selects exactly one persistence mode: disk under the development auth bypass or Admin Supabase otherwise; no fallback/dual-write path is used.

## Contract decision matrix

| Contract area | Repository-local evidence | Decision |
|---|---|---|
| Revision column and lifecycle | Migration adds non-null/default/check-constrained column; RPC creates at 1 and increments only on successful CAS save; adapter validates returned revision. | **Satisfied by migration source; application/type verification pending.** |
| Schema version | Migration adds non-null/default/check-constrained column and deterministic legacy backfill; repository normalizer requires current/known-old handling. | **Satisfied by migration source; generated-type/application verification pending.** |
| Idempotency | Unique owner/operation/project/key table identity, fingerprint/status receipt fields, bounded key checks, guarded RPC replay/conflict logic; disk sidecar receipts in separate adapter. | **Satisfied by migration and adapter source; retention/hosted application state unverified.** |
| Constraints | Revision/schema/key/fingerprint/status/revision checks and owner FK are present in migration. | **Satisfied by migration source; application state unverified.** |
| RLS | Original migration enables RLS on `oando_plans`; Planner migration enables RLS on idempotency table and defines owner-scoped policies. | **Satisfied by repository migration source; hosted state unverified.** |
| Grants | Planner migration revokes public/anon access, grants authenticated read, service-role table access, and authenticated/service-role RPC execute. | **Satisfied by migration source; generated types/hosted state unverified.** |
| Indexes | Original owner/status/timestamp indexes exist; idempotency unique identity creates an index and `created_at` index is explicit. | **Satisfied by migration source; hosted state unverified.** |
| Generated Admin types | Checked-in generated types lack the Planner table columns, idempotency table, and RPC. | **Defect: type contract is not synchronized.** |
| Adapter boundary | Supabase and disk adapters implement owner scope, CAS/revision, schema normalization, and idempotency; Supabase uses local hand-written row/RPC shapes. | **Behavioral source contract present; generated-type integration gap remains.** |

## Required handoff

- **Task 4.10:** Conditional only. Do not create a second migration automatically. Review `20260823090000_planner_revision_idempotency.sql` for dependency-safe rollback, deterministic transformation, and compatibility. If that review finds a defect, create the smallest Admin-only corrective migration under `site/platform/supabase/migrations.admin/`; if it finds no defect, record the no-new-migration branch and preserve the existing SQL unchanged.
- **Task 4.11:** Record and, when separately authorized, run the generated Admin type workflow so `database.types.ts` reflects `oando_plans.revision`, `oando_plans.schema_version`, `planner_operation_idempotency`, and the RPC. Update adapter typing only through the generated contract or an explicitly documented compatibility boundary; do not claim generated types are current now.
- Preserve the application-level owner checks and server-only service-role boundary in `plannerProjectSupabaseAdapter.ts`.

## Pending protected actions and limitations

- `pnpm run db:apply:admin -- --dry` is pending exact user authorization and hook permission; it was not run.
- Applying the Admin migration is pending explicit authorization; it was not run.
- `pnpm run db:types:admin` is pending explicit authorization; it was not run.
- Hosted schema, migration history, live RLS/grants/indexes, and remote RPC availability were intentionally not inspected. No hosted or remote state is claimed.
- No tests, typecheck, lint, migration dry run, database operation, or deployment command was run.

## Artifact and ownership record

- **Artifact class:** Agent-authored audit decision record.
- **Approved placement:** `agents-work/planner-comprehensive-audit/decisions/`.
- **Changed path:** `agents-work/planner-comprehensive-audit/decisions/task-4-9-schema-gap-decision.md` only.
- **Rejected placements:** `site/`, `results/`, root Markdown/protected authority files, Products migrations, and Planner product source.
- **Site Write Gate:** Not applicable; no `site/` path was changed.
- **True blockers:** None for this read-only decision record. The generated-type gap and unverified application state are coverage gaps/pending protected actions, not evidence of a hosted defect.
