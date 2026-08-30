# Implementation Plan: Operations Deployment Backup Review

## Overview

Implement a repository-local TypeScript operations-review tool that reads an explicit allowlist of version-controlled sources, emits source-linked evidence and prioritized recommendations, and never performs an operational action. The tool will distinguish observed local configuration from unverified external state, independently model Vercel, the Cloudflare Worker, Products, Admin, R2, monitoring, recovery, and CI/runbook alignment, and render review artifacts only to an explicitly approved non-product evidence location.

**Implementation boundary:** All deployment, Worker, provider inspection, database, R2, backup, restore, migration, seed, local-service, and provider-log actions are Protected Operations. This plan must not introduce a code path that executes them. Test, typecheck, lint, build, gate, and fixture-test *execution* require an exact current-session authorization and enabled-hook permission; writing the test code is allowed only after implementation begins under separately approved task execution.

## Planned implementation surfaces

| Surface | Likely files to examine | Likely files to create or modify | Priority / dependency |
| --- | --- | --- | --- |
| Tool entry and source boundary | `package.json`, `scripts/run-ops.mjs`, `OPERATIONS_RUNBOOK.md` | `scripts/operations-review/index.ts`, `scripts/operations-review/sourceAdapter.ts`, root script entry only if separately approved | P0; depends on task 1 |
| Vercel and Worker | `vercel.json`, `workers/oando-worker-proxy/wrangler.toml`, Worker source, `package.json` | `scripts/operations-review/extractors/vercel.ts`, `scripts/operations-review/extractors/worker.ts` | P1; depends on task 1 |
| Database and R2 | `docs/database/ops.md`, `site/platform/supabase/migrations/**`, `site/platform/supabase/migrations.admin/**`, `.github/workflows/supabase-backup-r2.yml` | `scripts/operations-review/extractors/databases.ts`, `scripts/operations-review/extractors/r2.ts` | P0/P1; depends on task 1 |
| Recovery, monitoring, alignment | `OPERATIONS_RUNBOOK.md`, `site/instrumentation.ts`, `site/lib/observability/metrics.ts`, `config/observability/**`, CI and command sources | `scripts/operations-review/recoveryPlanner.ts`, `scripts/operations-review/alignmentComparator.ts`, `scripts/operations-review/riskPrioritizer.ts` | P0/P1; depends on tasks 2–3 |
| Record rendering and isolated tests | existing `tests/**`, `config/build/**` conventions | `scripts/operations-review/renderer.ts`, `tests/operations-review/**` | P1; depends on tasks 1–4 |

## Tasks

- [ ] 1. Establish the read-only review domain model and non-execution guardrails
  - [ ] 1.1 Create typed review models, source references, evidence states, surface enums, priorities, gaps, release decisions, restore drills, and protected-operation records under `scripts/operations-review/`.
    - Encode Products (`erpweaiypimorcunaimz`) and Admin (`rxzpznmxbaoxpikowmfc`) as distinct database owners; do not add generic merged-database behavior.
    - Define a source allowlist and a repository-only adapter that captures path, locator, and digest metadata while rejecting network, environment-secret, provider-SDK, and unapproved-output access.
    - _Requirements: 1.1, 1.4, 4.1, 4.4, 9.4_
    - **Acceptance evidence:** Type definitions require provenance for observed facts and provide distinct Products/Admin, Vercel/Worker, and evidence-status representations.
  - [ ] 1.2 Implement `AuthorizationGuard` classification so protected actions produce exactly one non-executable pending record with target, explicit-authorization requirement, expected evidence, and `not-run` or `pending-authorization` status.
    - Cover Vercel/Worker deployment, provider inspection, Products/Admin backup, R2 write/retrieval, restore, migration, seed, local observability startup, and provider-log access.
    - _Requirements: 1.1, 1.2, 1.3, 6.3, 8.4_
    - **Acceptance evidence:** No API, process-spawn, provider-client, backup, restore, or deployment capability is imported or callable from review logic.
  - [ ]* 1.3 Write property test for repository-bound evidence admission.
    - **Property 1: Evidence admission preserves the repository boundary.**
    - **Validates: Requirements 1.4**
    - Use generated candidates to prove unsupported evidence is rejected or represented only as an unverified gap.
    - **Execution authorization:** The targeted test command remains pending exact user authorization and enabled-hook permission.
  - [ ]* 1.4 Write property test for protected-operation completeness and non-execution.
    - **Property 2: Protected operations are non-executable and complete.**
    - **Validates: Requirements 1.2, 6.3**
    - **Execution authorization:** The targeted test command remains pending exact user authorization and enabled-hook permission.

- [ ] 2. Extract and assess independent Vercel and Cloudflare Worker release surfaces
  - [ ] 2.1 Implement Vercel local-configuration extraction from `vercel.json`, root command routes, and runbook material.
    - Emit configured build/deploy route, target assumptions, post-deployment evidence expectations, persisted-data release prerequisites, and P0/P1 gaps without asserting hosted deployment status.
    - Require owner, migration/seed impact, backup prerequisite, compatibility hazard, code-release order, and rollback path for persisted-data releases.
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.2_
    - **Acceptance evidence:** Every extracted Vercel assertion has a path/locator; missing prerequisites produce an attributable gap, and hosted state remains unverified without authorized evidence.
  - [ ] 2.2 Implement separate Worker extraction from `workers/oando-worker-proxy/wrangler.toml`, Worker source, root command routes, and runbook material.
    - Capture the deployment route, `ASSET_BUCKET` binding, `VERCEL_ORIGIN` dependency, and a four-case routing matrix for R2 hit, miss, error, and origin forwarding.
    - Produce a Worker-only release decision with approval point, rollback/recovery procedure, and expected verification evidence; never merge it into Vercel release state.
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
    - **Acceptance evidence:** The matrix contains all four named cases and external edge behavior is classified unverified unless current authorized evidence is supplied.
  - [ ]* 2.3 Write property test for unsupported external-claim classification.
    - **Property 3: Unsupported external claims remain unverified.**
    - **Validates: Requirements 1.3, 2.4, 3.3, 5.3, 8.2**
    - **Execution authorization:** The targeted test command remains pending exact user authorization and enabled-hook permission.
  - [ ]* 2.4 Write property test for persisted-data release and recovery completeness.
    - **Property 4: Persisted-data release and recovery records are complete.**
    - **Validates: Requirements 2.2, 7.2, 7.3**
    - **Execution authorization:** The targeted test command remains pending exact user authorization and enabled-hook permission.
  - [ ]* 2.5 Write property test for independent Worker release decisions.
    - **Property 5: Worker changes retain independent release decisions.**
    - **Validates: Requirements 3.2**
    - **Execution authorization:** The targeted test command remains pending exact user authorization and enabled-hook permission.

- [ ] 3. Model Products/Admin backup coverage and the R2 backup flow independently
  - [ ] 3.1 Implement separate Products and Admin evidence extraction and coverage assessment.
    - Read only the approved database/runbook/migration sources to capture project reference, ownership scope, configured backup route, recovery documentation, and target coverage.
    - Represent schema rollback, provider recovery/PITR, and data restore as distinct recovery paths; do not access either database or run migration/backup/restore commands.
    - _Requirements: 4.1, 4.2, 4.4, 7.1, 7.3_
    - **Acceptance evidence:** Each database record cites its own project reference and source paths; database action proposals remain protected and pending.
  - [ ] 3.2 Implement R2 workflow extraction and artifact categorization from the backup workflow, command routes, and operations documentation.
    - Record schedule, trigger modes, timeout, command route, and secret *names* only; classify database dumps, catalog snapshots, repository backups, and delivery assets separately.
    - Redact secret-like values and create unverified findings independently for creation, retention, integrity, and retrievability when provider evidence is absent.
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
    - **Acceptance evidence:** Rendered data contains no credential values and does not claim R2 object existence or retrievability from repository configuration.
  - [ ]* 3.3 Write property test for attributable missing backup-coverage gaps.
    - **Property 6: Missing database-backup elements produce attributable gaps.**
    - **Validates: Requirements 4.3**
    - **Execution authorization:** The targeted test command remains pending exact user authorization and enabled-hook permission.
  - [ ]* 3.4 Write property test for scheduled-workflow credential redaction.
    - **Property 7: Scheduled-workflow review redacts credentials while preserving structure.**
    - **Validates: Requirements 5.2**
    - **Execution authorization:** The targeted test command remains pending exact user authorization and enabled-hook permission.

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - **Validation authorization:** No check is authorized by this plan. Any future `pnpm` test, typecheck, lint, build, or gate command requires exact current-session user authorization and enabled-hook permission. Deployments, provider operations, backups, restores, migrations, seeds, local observability services, and provider inspection remain separately protected.

- [ ] 5. Assemble recovery readiness, monitoring gaps, and runbook/CI alignment
  - [ ] 5.1 Implement recovery planning for code rollback, Worker rollback, Products schema rollback, Admin schema rollback, and data recovery.
    - Emit one complete Restore Drill specification per applicable Products, Admin, catalog, and repository recovery path, with authorized operator, non-production target, source artifact category, objective, success evidence, data boundary, cleanup/rollback, and a protected execution record.
    - Model completed-drill evidence requirements without executing or simulating a drill.
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.3, 7.4_
    - **Acceptance evidence:** Each applicable recovery path maps to one source-linked drill; all drill executions and artifact retrieval remain pending protected operations.
  - [ ] 5.2 Implement monitoring extraction and gap assessment from OpenTelemetry, metrics, local Prometheus/Grafana configuration, root command routes, and runbook evidence.
    - Separate source wiring from unverified collection, export, retention, queryability, and alerting; require signals, expected conditions, owner, and escalation path for release/recovery procedures.
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
    - **Acceptance evidence:** Missing monitoring fields emit surface/procedure-specific gaps; no telemetry, log, or local-service call is performed.
  - [ ] 5.3 Implement deterministic runbook/CI/configuration alignment comparison and priority assignment.
    - Compare command route, owner, environment, order, approval boundary, and recovery reference; retain both source paths, exact difference, affected surface, and recommended resolution for every mismatch.
    - Assign P0–P3 without downgrading independent data-loss, ownership, reversibility, or evidence gaps due to similar coverage elsewhere.
    - _Requirements: 2.3, 7.4, 9.1, 9.2, 9.3_
    - **Acceptance evidence:** Differences are source-linked and recommendations retain deterministic priority/risk rationale.
  - [ ]* 5.4 Write property test for one-to-one complete Restore Drill generation.
    - **Property 8: Applicable recovery paths map one-to-one to complete restore drills.**
    - **Validates: Requirements 6.1, 6.2**
    - **Execution authorization:** The targeted test command remains pending exact user authorization and enabled-hook permission.
  - [ ]* 5.5 Write property test for completed Restore Drill evidence fields.
    - **Property 9: Restore-drill evidence has audit-ready fields.**
    - **Validates: Requirements 6.4**
    - **Execution authorization:** The targeted test command remains pending exact user authorization and enabled-hook permission.
  - [ ]* 5.6 Write property test for incident uncertainty preservation.
    - **Property 10: Incident records preserve decision-critical uncertainty.**
    - **Validates: Requirements 7.4**
    - **Execution authorization:** The targeted test command remains pending exact user authorization and enabled-hook permission.
  - [ ]* 5.7 Write property test for attributable monitoring gaps.
    - **Property 11: Monitoring gaps are attributable and complete.**
    - **Validates: Requirements 8.3**
    - **Execution authorization:** The targeted test command remains pending exact user authorization and enabled-hook permission.
  - [ ]* 5.8 Write property test for complete source-linked alignment differences.
    - **Property 12: Alignment comparison produces complete, source-linked differences.**
    - **Validates: Requirements 9.1, 9.2**
    - **Execution authorization:** The targeted test command remains pending exact user authorization and enabled-hook permission.

- [ ] 6. Render safe evidence records and wire the review entry point
  - [ ] 6.1 Implement review assembly, partitioned JSON/Markdown rendering, secret redaction, and output-path enforcement.
    - Output may be written only after an implementation owner explicitly selects either `agents-work/operations-deployment-backup-review/reviews/` for authored decisions or `results/operations-deployment-backup-review/` for generated evidence; reject `site/`, `results/` root, and provider-backed paths.
    - Include timestamp, locally available revision metadata, source list, observations, unverified external state, protected operations, recommendations/gaps, owner decisions, release decisions, restore drills, and alignment differences.
    - State explicitly that no protected operation was executed.
    - _Requirements: 1.2, 1.3, 5.3, 9.4_
    - **Acceptance evidence:** Each finding occupies exactly one appropriate output section; rendered outputs have no secret values and no operational-success claim without authorized evidence.
  - [ ] 6.2 Wire a thin root command entry point only after separate owner approval for the exact `package.json` and script changes.
    - The command must invoke the local review tool without arguments that cause deployments, provider inspection, backups, restores, migrations, seeds, or services.
    - If approval is not granted, retain the library-only implementation and document the command integration as a P1 owner decision in the generated record.
    - _Requirements: 1.1, 1.2, 9.1, 9.4_
    - **Acceptance evidence:** Static inspection proves that the entry point has no provider client, child-process, or mutable infrastructure code path.
  - [ ]* 6.3 Write property test for non-overlapping Evidence Record partitions.
    - **Property 13: Evidence Record sections form a non-overlapping partition.**
    - **Validates: Requirements 9.4**
    - **Execution authorization:** The targeted test command remains pending exact user authorization and enabled-hook permission.
  - [ ]* 6.4 Write fixture-based unit/integration tests for Vercel, Worker, Products/Admin, R2, monitoring, redaction, missing sources, malformed sources, and CI/runbook mismatch handling.
    - Use repository-local fixtures only; do not contact providers or start a service.
    - _Requirements: 2.1, 2.3, 3.1, 3.4, 4.1, 4.2, 4.4, 5.1, 5.4, 7.1, 8.1, 9.3_
    - **Execution authorization:** The exact targeted Vitest command remains pending exact user authorization and enabled-hook permission.

- [ ] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - **Required completion evidence:** static review of changed paths; observed outcomes from only explicitly authorized and hook-permitted commands; source-linked review output proving protected actions stayed pending; a separate owner decision for any generated-output location or `package.json` integration.
  - **Pending authorization:** `pnpm run check:layout`, `pnpm run typecheck`, targeted Vitest, `pnpm run lint`, build/gate commands, deployment, Worker commands, database commands, R2 backup/retrieval, restores, provider inspections, provider logs, and local monitoring services. None are authorized by this task plan.

## Notes

- Tasks marked with `*` are optional test-writing tasks and must not be implemented by an executor unless explicitly selected. Their execution remains separately authorization-gated.
- Every implementation task must preserve the repository-local evidence boundary: a repository configuration file is evidence of configured behavior, not proof of hosted success.
- Protected operations require a named target surface, explicit owner authorization, expected evidence, and `not-run`/`pending-authorization` status. The review tool must record—not execute—them.
- Priority order is P0 data ownership/recovery/rollback safety, P1 release/backup/recovery evidence and isolation, P2 alignment drift with a documented safe fallback, then P3 clarity improvements.
- No deployment, backup, restore, provider inspection, migration, seed, local observability service, test, typecheck, lint, build, or gate execution is requested or authorized by this Fast Task artifact.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "2.1", "2.2", "3.1", "3.2"] },
    { "id": 3, "tasks": ["2.3", "2.4", "2.5", "3.3", "3.4", "5.1", "5.2"] },
    { "id": 4, "tasks": ["5.3", "5.4", "5.5", "5.6", "5.7"] },
    { "id": 5, "tasks": ["5.8", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4"] }
  ]
}
```