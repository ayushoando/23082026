# Planner Comprehensive Audit — Task 4.9 Schema-Gap Decision

**Decision date:** 2026-08-29  
**Execution update:** 2026-08-30
**Scope:** Repository-local Admin migration, checked-in generated Admin types, and Planner persistence/API adapters only.  
**Database boundary:** Admin (`rxzpznmxbaoxpikowmfc`) / `public.oando_plans`; Products was not inspected or changed.

## Outcome

**Decision: preserve the existing Admin migration; no corrective migration is required.** The repository contains an Admin migration that expresses the revision, schema-version, and owner-scoped idempotency contract, and the Planner Supabase adapter is written against that contract. Before the authorized hosted lane, the checked-in generated Admin type surface lacked the migration additions and the adapter retained an explicit RPC compatibility boundary. The owner-authorized Admin dry-run reported `20260819000001_analytics_events.sql` and `20260823090000_planner_revision_idempotency.sql` as pending; the subsequent authorized Admin apply reported both migrations applied, and `pnpm run db:types:admin` regenerated `site/platform/types/database.admin.types.ts`. The regenerated artifact now contains the Planner revision/schema columns and idempotency table. The generated-type generator still emits no `Functions` entries, so the adapter's explicitly documented local RPC shape remains the compatibility boundary. The migration source passed the repository review, so Task 4.10 follows the no-new-migration branch. The authorized Admin migration/type lane is evidenced; direct RPC execution and end-to-end Planner persistence behavior remain unverified.

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
- Authorized Admin execution evidence:
  - `pnpm run db:apply:admin -- --dry` reported both the analytics migration and the Planner migration as pending.
  - `pnpm run db:apply:admin` reported both pending Admin migrations applied successfully. The runner has no per-migration selector, so the unrelated analytics migration was applied as part of the same authorized Admin batch.

### Generated Admin types

- `site/platform/types/database.admin.types.ts`
  - Before regeneration, the checked-in file lacked `oando_plans.revision`, `oando_plans.schema_version`, and `planner_operation_idempotency`.
  - The authorized `pnpm run db:types:admin` workflow wrote this exact checked-in artifact.
  - The regenerated file now contains both dedicated `oando_plans` version columns and the full `planner_operation_idempotency` table, including its owner foreign-key relationship and response-envelope fields.
  - Its `Functions` section remains `[_ in never]: never` because `scripts/db_gen_admin_types.ts` introspects tables/views but not routines. The adapter therefore retains the explicit, runtime-validated `PlannerMutationRpcArgumentsV1`/`PlannerMutationRpcRowV1` boundary rather than claiming generated RPC typing.

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
  - Declares `PLANNER_SUPABASE_MUTATION_CONTRACT_HANDOFF_V1`, explicitly noting that generated Admin types do not expose the RPC and that the local RPC boundary remains documented.
  - Preserves a read-only compatibility path for legacy payload containers; new writes use dedicated version columns.
- `site/lib/Planner/projectsStore.ts`
  - Selects exactly one persistence mode: disk under the development auth bypass or Admin Supabase otherwise; no fallback/dual-write path is used.

## Contract decision matrix

| Contract area | Repository-local and authorized Admin evidence | Decision |
|---|---|---|
| Revision column and lifecycle | Migration adds non-null/default/check-constrained column; RPC creates at 1 and increments only on successful CAS save; adapter validates returned revision; regenerated Admin types expose the columns. | **Satisfied by migration source, authorized migration output, generated type surface, and adapter boundary; end-to-end mutation behavior remains unverified.** |
| Schema version | Migration adds non-null/default/check-constrained column and deterministic legacy backfill; repository normalizer requires current/known-old handling; regenerated Admin types expose the column. | **Satisfied by migration source, authorized migration output, generated type surface, and application normalizer.** |
| Idempotency | Unique owner/operation/project/key table identity, fingerprint/status receipt fields, bounded key checks, guarded RPC replay/conflict logic; disk sidecar receipts in separate adapter; regenerated Admin types expose the table. | **Satisfied by migration source, authorized migration output, generated table surface, and adapter source; retention and end-to-end replay remain unverified.** |
| Constraints | Revision/schema/key/fingerprint/status/revision checks and owner FK are present in migration and reflected by the authorized apply output. | **Satisfied by repository migration source and authorized apply report; independent live constraint inspection was not run.** |
| RLS | Original migration enables RLS on `oando_plans`; Planner migration enables RLS on idempotency table and defines owner-scoped policies. | **Satisfied by repository migration source and authorized apply report; policy behavior was not integration-tested.** |
| Grants | Planner migration revokes public/anon access, grants authenticated read, service-role table access, and authenticated/service-role RPC execute. | **Satisfied by migration source and authorized apply report; generated types do not encode grants.** |
| Indexes | Original owner/status/timestamp indexes exist; idempotency unique identity creates an index and `created_at` index is explicit. | **Satisfied by migration source and authorized apply report; independent live index inspection was not run.** |
| Generated Admin types | Authorized generation now exposes the Planner columns and idempotency table; the repository generator does not introspect RPCs. | **Table/type contract synchronized; RPC remains an explicitly documented adapter compatibility boundary.** |
| Adapter boundary | Supabase and disk adapters implement owner scope, CAS, schema normalization, and idempotency; Supabase uses the generated table contract plus a local validated RPC shape. | **Behavioral source contract present; direct RPC execution and full hosted application behavior remain unverified.** |

## Required handoff

- **Task 4.10:** No-new-migration branch selected. The existing `20260823090000_planner_revision_idempotency.sql` was reviewed for dependency-safe rollback, deterministic transformation, owner scope, RLS, grants, indexes, and compatibility. No corrective Admin migration was created, and the existing SQL remains unchanged.
- **Task 4.11:** The authorized Admin migration dry-run, Admin apply, and generated Admin type workflow were executed. `site/platform/types/database.admin.types.ts` now reflects `oando_plans.revision`, `oando_plans.schema_version`, and `planner_operation_idempotency`. The RPC remains represented by the explicitly documented local adapter boundary because the repository generator does not emit routine types. No direct RPC integration test was run; repository typecheck completed successfully.
- Preserve the application-level owner checks and server-only service-role boundary in `plannerProjectSupabaseAdapter.ts`.

## Validation and limitations

- `pnpm run db:apply:admin -- --dry` — **observed authorized result:** Admin runner listed `20260819000001_analytics_events.sql` and `20260823090000_planner_revision_idempotency.sql` as pending.
- `pnpm run db:apply:admin` — **observed authorized result:** both listed Admin migrations reported `OK` and the runner reported `All migrations applied.`
- `pnpm run db:types:admin` — **observed authorized result:** wrote `site/platform/types/database.admin.types.ts` (27932 bytes).
- `pnpm exec node scripts/graph-impact.mjs --file=site/platform/types/database.admin.types.ts --depth=2` — **observed authorized result:** reported the generated type's dependents through `site/types/database.admin.types.ts` and the shared Supabase client/server boundary; wrote the expected report under `agents-work/repository-graph/impact/`.
- `pnpm exec vitest run --config tests/vitest.config.ts tests/unit/platform/Planner/plannerAdminMigration.test.ts` — **observed authorized result:** 1 file passed, 9 tests passed.
- `pnpm run typecheck` — **observed authorized result:** route types generated and TypeScript completed successfully.
- `pnpm run check:governance` — **observed authorized result:** `P4_migration_no_rollback=8`, all at or below baseline.
- No lint, direct RPC call, deployment command, or full suite was run after the generated artifact changed; those remain pending separately authorized validation where applicable. A fork-boundary scan was not applicable because no `site/**/Planner` or `site/**/Studio` source changed.
- The authorized apply command also applied the unrelated pending analytics migration because the repository runner does not support selecting a single migration. This is recorded scope context, not a Planner migration defect.
- Direct hosted RPC availability, mutation replay behavior, live policy/grant behavior under authenticated credentials, and full end-to-end Planner persistence remain unverified.

## Artifact and ownership record

- **Artifact classes:** Agent-authored audit decision record and generator-produced checked-in Admin type artifact.
- **Approved placement:** `agents-work/planner-comprehensive-audit/decisions/` for the decision record; `site/platform/types/database.admin.types.ts` for the repository-approved generated type output.
- **Changed paths:** `agents-work/planner-comprehensive-audit/decisions/task-4-9-schema-gap-decision.md` and `site/platform/types/database.admin.types.ts`. No migration SQL, Products path, or Planner runtime source was changed.
- **Rejected placements:** `site/` for reports, `results/` for authored evidence, root Markdown/protected authority files, Products migrations, and new corrective Admin migration SQL.
- **Site Write Gate:** Satisfied for the explicitly approved generated Admin type artifact through `pnpm run db:types:admin`; no hand edit was made to the generated file.
- **True blockers:** None for the authorized repository and Admin migration/type lane. Remaining direct-RPC and end-to-end behavior gaps are validation limitations, not evidence of a hosted defect.
