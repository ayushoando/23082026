# Planner Comprehensive Audit — Task 4.9 Schema-Gap Decision

**Decision date:** 2026-08-29
**Execution update:** 2026-08-30
**Scope:** Repository-local Admin migration history, checked-in generated Admin types, Planner persistence adapters, and related repository/API contracts.
**Database boundary:** Admin (`rxzpznmxbaoxpikowmfc`) / `public.oando_plans`; Products was not inspected or changed.

**Completion update (2026-09-03):** The authorized Admin dry run, application, and type generation completed successfully. The regenerated Admin type artifact declares `planner_mutate_plan_v1`, Drizzle now includes the complete nullable idempotency receipt envelope, and the Planner database smoke tests passed. The interactive workspace remains on the atomic `/api/Planner/projects` contract; legacy `/api/plans` and Admin document calls are explicitly retained as a separately versioned compatibility boundary rather than silently presented as atomic workspace mutations.

## Outcome

**Decision: preserve the existing Admin migration; no corrective migration is required for Task 4.10.** Repository evidence shows that `20260823090000_planner_revision_idempotency.sql` already expresses the required revision, schema-version, idempotency, constraints, RLS, grants, indexes, guarded RPC, and rollback contract. The checked-in Admin table artifact contains the corresponding version columns and idempotency table. The atomic Supabase Planner adapter and repository contract consume that contract, while the disk adapter preserves the same mutation and receipt semantics for non-production mode.

This is a repository-side decision only. No hosted schema inspection, migration dry-run, migration application, Admin type generation, RPC invocation, runtime adapter check, test, integration check, deployment, or remote result is claimed in this lane. Task 4.10 is therefore bound to the **`no-migration`** branch: do not create duplicate Admin SQL. Hosted application and type-generation actions remain separately authorized pending work, and the legacy direct adapter plus stale source/test records are follow-up application-contract handoffs rather than evidence of a missing schema migration.

## Exact repository evidence inspected

### Admin migration history

- `site/platform/supabase/migrations.admin/20260628100000_planner_plans_and_audit.sql#L5-L36` defines `public.oando_plans` with owner, payload, timestamp, and status fields.
- `site/platform/supabase/migrations.admin/20260628100000_planner_plans_and_audit.sql#L38-L47` enables RLS and establishes the existing owner/query indexing and service-role boundary.
- `site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql#L5-L40` deterministically backfills and constrains `revision` and `schema_version`.
- `site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql#L42-L84` creates `planner_operation_idempotency`, its owner relationship, receipt fields, identity uniqueness, and created-at index.
- `site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql#L85-L138` defines the relevant constraints, policies, grants, and RPC-facing access boundary.
- `site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql#L143-L388` implements owner-scoped guarded create/save/delete behavior, compare-and-swap revision checks, and idempotency replay/conflict handling in `planner_mutate_plan_v1`.
- `site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql#L390-L409` contains the dependency-aware `-- rollback:` section.

The migration file is the repository-side schema implementation. These are static SQL facts only; they do not prove that the migration history has reached the hosted Admin database.

### Checked-in Admin types

- `site/platform/types/database.admin.types.ts#L367-L417` contains `oando_plans.revision` and `oando_plans.schema_version`.
- `site/platform/types/database.admin.types.ts#L518-L579` contains `planner_operation_idempotency`, including the owner relationship, identity fields, status/revision fields, and response envelope.
- `site/types/database.admin.types.ts#L1` re-exports the canonical platform artifact.
- `site/platform/types/database.admin.types.ts#L1018-L1024` shows that the checked-in `Functions` map is empty.
- `scripts/db_gen_admin_types.ts#L226-L243` shows that the generator introspects tables/views only, not routines.

The checked-in file is local source evidence. Its generation against the current hosted schema was not observed in this lane. The absent generated routine typing is a repository contract gap, not evidence that a second SQL migration is needed.

### Planner adapters and contracts

- `site/server/Planner/plannerProjectSupabaseAdapter.ts#L28-L80` defines the local, validated RPC argument/result boundary and request fingerprinting.
- `site/server/Planner/plannerProjectSupabaseAdapter.ts#L115-L200`, `#L237-L321`, `#L353-L418`, and `#L426-L580` read dedicated version columns, enforce owner scope and bounded inputs, invoke `planner_mutate_plan_v1`, and map replay/conflict results.
- `site/lib/Planner/plannerProjectRepository.ts#L15-L115`, `#L225-L258`, `#L329-L446`, and `#L449-L515` define current schema version `1`, known-old version `0`, unsupported-version handling, server-owned revision/timestamp validation, and bounded idempotency keys.
- `site/lib/Planner/plannerProjectOperations.ts#L30-L136` and `#L158-L336` define the atomic mutation and receipt contract.
- `site/server/Planner/plannerProjectDiskAdapter.ts#L14-L37`, `#L75-L179`, and `#L180-L220` preserve state and receipt semantics with a per-project lock and write-then-rename state updates.
- `site/lib/Planner/plannerPersistenceMode.ts#L1-L15` and `#L60-L150` select one persistence mode and prevent an Admin operation from silently falling back to disk.

These are static adapter and contract facts only. No Supabase RPC call, disk operation, or end-to-end persistence behavior was executed.

### Legacy path and stale records

- `site/app/api/Planner/projects/plannerProjectEndpoint.ts#L1-L18` and `#L127-L214` use the atomic Planner repository for the canonical Planner endpoint.
- `site/lib/Planner/projectsStore.ts#L103-L108` and `#L216-L281`, `site/lib/Planner/projectsStore.supabase.ts#L135-L190`, `site/app/api/plans/route.ts#L1-L127`, and `site/app/api/plans/[id]/route.ts#L1-L222` retain legacy direct list/load/upsert/delete paths that do not carry `expectedRevision` and `idempotencyKey` through `planner_mutate_plan_v1`.
- `site/server/Planner/plannerProjectSupabaseAdapter.ts#L83-L102` contains stale handoff wording that says generated Admin types lack migration columns, although the checked-in artifact contains those table columns; only routine typing is absent.
- `tests/unit/platform/Planner/plannerAdminMigration.test.ts#L18-L41` still records a `migration-required` branch and absent-schema defects despite the repository migration and checked-in table additions.

The legacy direct adapter is an application/repository contract gap, not proof of an Admin schema defect. The stale adapter note and stale migration test were inspected but not edited or executed in Task 4.9; reconciliation belongs to the owning follow-up task.

## Contract decision matrix

| Contract area | Repository-local evidence | Decision |
|---|---|---|
| Revision | The migration backfills a dedicated `bigint` revision, adds a default and `NOT NULL`, constrains it to `>= 1`, and uses it for guarded compare-and-swap updates/deletes and one-step increments. The generated table artifact and adapter expose/consume it. | **Satisfied by repository evidence.** Hosted/runtime behavior remains unverified. |
| Schema version | The migration backfills camel- and snake-case payload versions, adds a default and `NOT NULL`, constrains the value to `>= 0`, and matches the repository's current v1/known-old v0 compatibility contract. | **Satisfied by repository evidence.** |
| Idempotency | The migration provides owner/operation/project/key uniqueness, bounded key/fingerprint/status/revision checks, atomic processing claims, replay/conflict handling, and stored response receipts. The disk adapter implements the corresponding local receipt contract; the legacy direct path does not. | **Satisfied for the covered atomic contract by repository evidence.** Legacy direct-path routing and end-to-end replay remain follow-up/validation gaps. |
| Constraints | Revision, schema-version, operation, key syntax/length, fingerprint length, receipt status, and response-revision checks are present in the migration; core constraints are also represented in Planner Drizzle support. | **Satisfied by repository evidence.** |
| RLS | The base migration enables RLS on `oando_plans`; the Planner migration enables RLS on the idempotency table and defines owner-scoped authenticated policies plus explicit service-role policies. | **Satisfied by repository evidence.** Policy behavior was not integration-tested. |
| Grants | The Planner migration revokes public/anonymous access, grants authenticated read access, grants server-side table access to `service_role`, and grants guarded RPC execution to the intended roles. | **Satisfied by repository evidence.** Generated types do not encode grants. |
| Indexes | Existing `oando_plans` owner/status/time indexes cover listing and ordering; the idempotency identity uniqueness supplies the exact claim/replay index and `created_at` supplies retention-oriented ordering. | **Satisfied by repository evidence.** |

## Repository contract gaps and handoffs

1. **Generated RPC type — `gap:task-4.9-generated-rpc-type`.** The checked-in Admin artifact declares both Planner tables but its `Functions` map is empty because `scripts/db_gen_admin_types.ts` introspects tables/views only. The adapter therefore keeps a local, runtime-validated `PlannerMutationRpcArgumentsV1`/`PlannerMutationRpcRowV1` boundary. Workstream 4 / Task 4.11 may reconcile routine typing or retain that explicit boundary after separately authorized type generation; this is not a new-migration trigger.
2. **Drizzle response-envelope parity — `gap:task-4.9-drizzle-response-envelope`.** `site/platform/drizzle/schema/planner.ts#L16-L67` covers the core Planner version fields and idempotency identity/status/revision constraints, but not the migration's response payload/name/thumbnail/status/timestamp receipt columns. The live Supabase adapter consumes those fields through the RPC envelope rather than Drizzle. Workstream 4 owns any repository-side parity reconciliation; the SQL object already exists.
3. **Legacy direct adapter — `gap:task-4.9-legacy-direct-adapter`.** The legacy `projectsStore.supabase` functions bypass `expectedRevision`, `idempotencyKey`, and `planner_mutate_plan_v1`. Workstream 2/4 must route covered project operations through the atomic Planner repository or explicitly classify the legacy portal/Admin boundary. Task 4.9 does not edit the persistence adapter implementation.
4. **Stale adapter handoff note — `gap:task-4.9-stale-adapter-handoff-note`.** The adapter note incorrectly says generated Admin types do not declare migration columns. Workstream 4 must reconcile the wording during the next serial handoff; Task 4.9 does not edit the adapter.
5. **Stale decision test — `gap:task-4.9-stale-decision-test`.** The repository-only migration test still publishes `branch=migration-required` and absent-schema defects. Task 4.11 must reconcile that static test/decision record with the no-migration branch before migration evidence is treated as closed; the test was not edited or executed here.

## Task 4.10 branch

```ts
TASK_4_10_BRANCH = "no-migration"
```

The existing `site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql` is the repository-side schema implementation. Do not create duplicate Admin SQL. Carry hosted application and type-generation actions as separate authorized work, and reconcile the legacy direct adapter and stale records in their owning follow-up tasks.

## Pending exact actions

The following commands were **not run** in this repository-edit lane and require separate authorization:

- `pnpm run db:apply:admin -- --dry` — protected Admin migration dry-run; run from the repository root before any hosted application.
- `pnpm run db:apply:admin` — hosted Admin migration application, if the dry-run and owner authorization permit it.
- `pnpm run db:types:admin` — Admin type generation after an authorized Admin environment update, followed by reconciliation of the generated routine/type handoff.

No hosted state, migration result, or regenerated artifact result is claimed here.

## Validation and limitations

- The only command executed in this lane before the artifact edit was `git status --short`, which returned exit code `0` with no output.
- No tests, gates, builds, typechecks, lint checks, migration commands, hosted inspection, RPC calls, deployment commands, or runtime adapter checks were run or claimed.
- This decision is static repository evidence. It establishes that the existing migration source and checked-in contracts express the required schema; it does not establish hosted migration state or runtime behavior.
- No fork-boundary scan is applicable because Task 4.9 does not change Studio/Planner runtime source under the fork trees.
- **True blockers:** None for the repository-side decision record. The pending hosted and runtime actions are authorization/validation limitations, not evidence of a hosted defect.

## Artifact and ownership record

- **Decision artifact:** `plans/planner-comprehensive-audit/decisions/task-4-9-schema-gap-decision.md`.
- **Typed decision artifact:** `plans/planner-comprehensive-audit/schemaGapDecision.ts`.
- **Approved artifact placement:** `plans/planner-comprehensive-audit/decisions/` for the authored evidence record and `plans/planner-comprehensive-audit/schemaGapDecision.ts` for the typed decision/evidence binding.
- **Changed paths for Task 4.9:** `plans/planner-comprehensive-audit/decisions/task-4-9-schema-gap-decision.md` and `plans/planner-comprehensive-audit/schemaGapDecision.ts`.
- **Protected/unowned paths not changed:** UI, geometry internals, Planner persistence adapter implementation, shared observability, Products migrations, and new corrective Admin migration SQL.
- **Rejected placements:** `results/` for authored reports, root authority Markdown, Products migrations, and a duplicate corrective Admin migration.
