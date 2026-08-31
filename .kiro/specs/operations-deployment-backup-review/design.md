# Design Document: Operations Deployment Backup Review

## Overview

This design defines a repository-local implementation for reviewing deployment, backup, recovery, monitoring, runbook, and CI configuration. The implementation reads only repository files and explicitly supplied evidence; it creates a structured **Evidence Record** and prioritized recommendations. It never deploys, queries a provider, starts a local service, backs up, restores, migrates, seeds, or changes infrastructure.

The review separates configured repository behavior from external state. A configured command, workflow, binding, or runbook procedure is observed local configuration. A claim about a hosted deployment, provider backup, R2 object, retention period, restore result, telemetry delivery, or alert remains **unverified** unless the review is given current, authorized provider output.

## Scope, Route Record, and Boundaries

| Item | Design decision |
| --- | --- |
| Outcome | Produce an evidence-based operations review and implementation recommendation set for Vercel, the Worker, two Supabase databases, R2, recovery, monitoring, runbooks, and CI. |
| Domain | D21 — Operations and infrastructure. |
| Workflow mode | Spec; the output is an implementation design, not an operational execution plan. |
| Operational risk | High: release, provider credential, data loss, recovery, and observability claims. The implementation itself is read-only. |
| Selected package skills | Local Evidence and `repo-map` principles for source routing. `db-migrations` applies only if a later approved implementation changes schema/migration files; it is not needed to author this design. |
| Rejected skills | `verify-and-gate` is not selected because no validation command was authorized. UI, FOCSS, Planner/Studio, AI, and capability-packaging skills do not match the designed artifact. |
| Artifact class | Kiro fast-task specification; authored `design.md` under `.kiro/specs/operations-deployment-backup-review/`. |
| Locked Path Gate | Writable: the user explicitly requested this spec artifact. Root Markdown, `docs/`, `Agents/`, `site/`, provider configuration, CI workflows, scripts, and infrastructure are read-only evidence for this phase. |
| Site Write Gate | Not applicable; no `site/` write is proposed. |
| Command classification | Repository reads are read-only inspection. Deploy, Worker action, provider inspection, backup, restore, migration, seed, R2 write, local monitoring service, and test/gate commands are protected or pending authorization and are not run. |

### Agent compliance record

- Current user request read: yes.
- Applicable standards read: `AGENTS.md`, `Agents/01-standard.md`, `START.md`, and `plans/README.md`.
- User instructions override defaults: none.
- Assigned scope: create only this Phase 3 design document.
- Owned path and permission: `.kiro/specs/operations-deployment-backup-review/design.md` — write.
- Explicit exclusions: no application, infrastructure, provider, database, credential, workflow, script, runbook, deployment, backup, restore, or protected-operation change.
- Delivery conditions: a repository-local design covering artifacts, boundaries, prioritization, authorization, and validation.
- Validation allowed now: read-back inspection of this authored Markdown.
- Validation pending authorization: all test, gate, build, browser, database, deployment, backup, restore, provider, and local-service commands.
- Agent roster: guidance-only; no additional agents were authorized or created.

## Repository Evidence Inputs

The implementation begins from version-controlled sources. It records every source path and the extracted fact, but does not infer runtime success from a file.

| Review surface | Primary repository evidence | Review output |
| --- | --- | --- |
| Vercel application | `vercel.json`, `package.json`, `scripts/run-ops.mjs`, `OPERATIONS_RUNBOOK.md` | Build/deploy route, target assumptions, release prerequisites, release/rollback decision. |
| Cloudflare Worker | `workers/oando-worker-proxy/wrangler.toml`, Worker source, root scripts, runbook | Separate Worker configuration, origin dependency, R2 binding, behavior-case matrix, release decision. |
| Products and Admin | `docs/database/ops.md`, `OPERATIONS_RUNBOOK.md`, `site/platform/supabase/migrations/`, `site/platform/supabase/migrations.admin/`, root scripts | Independent ownership, reference, backup route, recovery coverage, schema and data paths. |
| R2 backup flow | `.github/workflows/supabase-backup-r2.yml`, `package.json`, `scripts/run-ops.mjs`, database operations documentation | Command/CI route, schedule, redacted secret names, artifact categories, proof gaps. |
| Monitoring | `site/instrumentation.ts`, `site/lib/observability/metrics.ts`, `config/observability/`, root scripts, runbook | Source wiring, configured local routes, required signals and unverified telemetry state. |
| Alignment | `OPERATIONS_RUNBOOK.md`, `docs/database/ops.md`, `package.json`, Vercel/Worker/CI files | Exact differences in commands, owners, environments, ordering, approval boundaries, and recovery references. |

`Products` is always recorded as `erpweaiypimorcunaimz` and owns marketing catalog/configurator data. `Admin` is always recorded as `rxzpznmxbaoxpikowmfc` and owns staff, customer, plans, furniture, descriptors, price-book, audit, and customer-query data. The two records must never be merged into a generic “Supabase” entry.

## Architecture

### Component boundaries

The proposed implementation is a local TypeScript review tool or library with a thin command entry point. It uses pure parsing, normalization, comparison, and prioritization functions around read-only source adapters. Provider clients are intentionally excluded.

```text
RepositorySourceAdapter ──> EvidenceExtractor ──> ReviewAssembler ──> RiskPrioritizer
      │                          │                       │                    │
      │                          │                       ├─> AlignmentComparator│
      │                          │                       ├─> RecoveryPlanner   │
      │                          │                       └─> AuthorizationGuard│
      └──── source paths ────────┴────────> EvidenceRecordRenderer <──────────┘
```

| Component | Responsibility | Allowed dependencies | Forbidden responsibility |
| --- | --- | --- | --- |
| `RepositorySourceAdapter` | Read approved repository-local text and provide path, content, and content digest metadata. | Node filesystem, explicit source allowlist. | Network calls, environment-secret reads, provider SDKs, writes outside generated review output. |
| `EvidenceExtractor` | Convert source text into typed facts with source references and confidence/status. | Adapters, parsers. | Deciding hosted state or manufacturing missing facts. |
| `ReviewAssembler` | Build surface records for Vercel, Worker, Products, Admin, R2, monitoring, recovery, and alignment. | Extracted facts, canonical enums. | Performing commands or contacting providers. |
| `AuthorizationGuard` | Classify any action proposal as repository read, protected operation, or pending authorization; require target, authorization, and expected evidence. | Review data. | Granting authorization or executing actions. |
| `RecoveryPlanner` | Produce separate rollback, recovery, and restore-drill specifications. | Review facts, static templates. | Retrieving artifacts, modifying data, or creating non-production resources. |
| `AlignmentComparator` | Compare normalized runbook statements against script/configuration/CI statements and emit exact differences. | Extracted facts. | Treating a textual match as operational success. |
| `RiskPrioritizer` | Score gaps deterministically and group recommendations by priority. | Review records. | Suppressing unresolved high-risk gaps. |
| `EvidenceRecordRenderer` | Render JSON and human-readable Markdown from the typed record. | Complete review record. | Including secret values or hiding unverified status. |

A later implementation may place the reusable review logic under `scripts/operations-review/` and use a root command only after separate approval. This design does not create those files or introduce a package.

### Interfaces and data models

```ts
export type EvidenceStatus = "observed-local" | "observed-authorized" | "unverified" | "gap";
export type OperationClass = "repository-read" | "protected-operation" | "pending-authorization";
export type Priority = "P0" | "P1" | "P2" | "P3";
export type Risk = "critical" | "high" | "medium" | "low";
export type Surface =
  | "vercel-application"
  | "cloudflare-worker"
  | "products-database"
  | "admin-database"
  | "r2-backup"
  | "monitoring"
  | "runbook-ci-alignment";

export interface SourceReference {
  path: string;
  locator: string;
  observedAt: string;
  contentDigest?: string;
}

export interface EvidenceFact {
  id: string;
  surface: Surface;
  statement: string;
  status: EvidenceStatus;
  source: SourceReference;
  externalEvidence?: AuthorizedEvidenceReference;
}

export interface AuthorizedEvidenceReference {
  suppliedBy: string;
  collectedAt: string;
  authorizationReference: string;
  summary: string;
}

export interface ProtectedOperation {
  operation: string;
  targetSurface: Surface;
  classification: "protected-operation";
  requiredAuthorization: string;
  expectedEvidence: string[];
  executionStatus: "not-run" | "pending-authorization";
}

export interface Gap {
  id: string;
  surface: Surface;
  missingOrContradictoryElement: string;
  risk: Risk;
  priority: Priority;
  sourcePaths: string[];
  recommendedFollowUp: string;
  namedOwner?: string;
}

export interface RestoreDrill {
  recoveryPath: "products" | "admin" | "catalog" | "repository";
  authorizedOperator: string;
  nonProductionTarget: string;
  artifactCategory: string;
  recoveryObjective: string;
  successEvidence: string[];
  dataHandlingBoundary: string;
  cleanupOrRollback: string;
  execution: ProtectedOperation;
}

export interface ReleaseDecision {
  surface: "vercel-application" | "cloudflare-worker";
  approvalPoint: string;
  rollbackOrRecoveryProcedure: string;
  expectedVerificationEvidence: string[];
  persistedDataImpact?: {
    databaseOwners: Array<"products-database" | "admin-database">;
    migrationImpact: string;
    seedImpact: string;
    backupPrerequisite: string;
    compatibilityHazard: string;
    codeReleaseOrder: string;
  };
}

export interface AlignmentDifference {
  surface: Surface;
  dimension: "command" | "owner" | "environment" | "order" | "approval" | "recovery";
  sourcePaths: [string, string];
  exactDifference: string;
  recommendedResolution: string;
}

export interface EvidenceRecord {
  metadata: { generatedAt: string; repositoryRevision?: string; scope: string };
  observedConfiguration: EvidenceFact[];
  unverifiedExternalState: EvidenceFact[];
  protectedOperations: ProtectedOperation[];
  gapsAndRecommendations: Gap[];
  ownerDecisions: string[];
  releaseDecisions: ReleaseDecision[];
  restoreDrills: RestoreDrill[];
  alignmentDifferences: AlignmentDifference[];
}
```

`AuthorizedEvidenceReference` accepts a summary and authorization reference but never a secret, credential, token, connection string, or raw provider export. The renderer redacts values even if an upstream caller supplies a secret-like key.

## Review flow

1. **Discover and normalize local facts.** Read only the allowlisted sources, attach a path and locator to every extracted claim, and preserve unknown values as unknown.
2. **Build independent surface records.** Create one each for the Vercel application, Cloudflare Worker, Products database, Admin database, R2 backup, monitoring, and alignment. Worker and Vercel records are distinct; Products and Admin records are distinct.
3. **Classify evidence.** Mark repository settings as `observed-local`. Mark external conditions as `observed-authorized` only with supplied current authorized evidence; otherwise mark them `unverified`.
4. **Build protected-operation proposals.** Each detected deploy, Worker action, provider inspection, database/R2 action, restore, seed, migration, or monitoring-service action becomes a non-executable proposal with a target, required approval, and expected evidence.
5. **Model releases and recovery.** For data-changing releases, require database owner, migration/seed impact, backup prerequisite, code order, compatibility hazard, rollback instruction, and recovery path. Keep code rollback, schema rollback, provider recovery/PITR, and data restore separate.
6. **Compare runbook and automation.** Normalize facts by command, owner, environment, order, approval boundary, and recovery reference. Emit each mismatch with both paths and a recommended resolution.
7. **Prioritize and render.** Score gaps, retain all high-risk blockers, then emit the evidence record and a concise implementation recommendation backlog.

## Surface-specific review rules

### Vercel application

The review identifies `vercel.json` build settings, `pnpm run vercel:prod` and preview routes, target-environment assumptions, and documented post-deploy evidence. It must label the configured deployment path as local evidence only; it cannot claim a hosted Vercel deployment completed.

A persisted-data release record requires these fields before it can reach “ready for owner decision”:

- Products or Admin owner (or both, explicitly);
- migration and seed impact;
- backup/recovery prerequisite;
- compatibility and code-release order;
- code rollback path and, where applicable, database/schema rollback path;
- expected authorized verification evidence.

### Cloudflare Worker

The Worker review records its separate deployment route, `wrangler.toml` configuration, `ASSET_BUCKET` R2 binding, and `VERCEL_ORIGIN` dependency. Every Worker change receives a separate approval point and recovery decision; it is never merged with a Vercel application release.

The review always emits this routing-case matrix:

| Case | Expected configured behavior | Evidence limitation |
| --- | --- | --- |
| R2 asset hit | Serve the configured R2 asset path. | Hosted response remains unverified without authorized evidence. |
| R2 asset miss | Apply the Worker’s configured fallback/origin behavior. | Actual edge response remains unverified. |
| R2 error | Report/document the configured error handling or missing handling. | Provider/R2 error behavior remains unverified. |
| Vercel-origin forwarding | Forward non-asset/fallback requests to configured Vercel origin. | Origin availability and response remain unverified. |

### Backup, R2, and recovery

The review records Products and Admin separately, including the configured `backup:supabase:r2` route and workflow coverage. It classifies R2 objects as database dumps, catalog snapshots, repository backups, or delivery assets. It records the backup workflow schedule, trigger modes, timeout, command route, and **names** of required secrets only.

Absence of current authorized proof means that artifact creation, retention, integrity, and retrievability each remain independently unverified. A configured scheduled workflow does not collapse those proof states.

Every applicable recovery path gets a Restore Drill specification. The drill must identify the operator, non-production target, input artifact category, objective, success evidence, data boundary, and cleanup/rollback. Executing a drill is always a protected operation when it accesses a provider, retrieves an artifact, or changes a target. Completed drill evidence must include date, target, artifact identifier, procedure version, observed result, and unresolved gap.

### Monitoring

The review detects source wiring for OpenTelemetry, the Prometheus registry, local Prometheus/Grafana configuration, and configured log/tail routes. It does not infer collection, export, retention, queryability, or alerting from wiring. Every release/recovery procedure needs named signals, expected values or conditions, an owner, and escalation path; missing elements become monitoring gaps. Starting local observability services and accessing provider logs are protected operations.

## Priority and risk approach

Priority is deterministic and explainable. A `risk` expresses potential impact; a `priority` expresses implementation order.

| Priority | Assignment rule | Typical examples |
| --- | --- | --- |
| P0 | A missing or contradictory prerequisite could cause unrecoverable data loss, uncontrolled production impact, or prevent a known recovery path. | No named owner/rollback for a schema-changing release; no documented restore path for either database. |
| P1 | A release/recovery path is configured but lacks approval, evidence, retention, integrity, or monitoring proof needed before operational approval. | Scheduled backup with no restore drill evidence; Worker change without independent recovery decision. |
| P2 | A local configuration/runbook/CI inconsistency could cause delayed or incorrect execution but has a documented safe fallback. | Command name, environment, or order-of-operations drift with a known runbook counterpart. |
| P3 | Documentation completeness or clarity improvement that does not currently block a protected operation. | Missing contextual explanation where command, owner, and recovery path are otherwise complete. |

The scoring function raises priority for data scope (both databases independently), production exposure, absence of a reversible fallback, absence of named ownership, and lack of evidence. It never lowers a P0/P1 finding merely because a similar surface is documented elsewhere.

## Authorization boundaries

| Action | Classification | Implementation behavior |
| --- | --- | --- |
| Read allowlisted repository files | Repository read | Allowed; sources are recorded. |
| Inspect a provider dashboard/API or tail hosted logs | Protected operation | Add a pending record; do not invoke a provider client. |
| Deploy Vercel or Cloudflare Worker | Protected operation | Add a release decision/approval point only. |
| Back up to or retrieve from R2 | Protected operation | Record artifact/category/evidence expectations only. |
| Run migration, seed, restore, PITR, or database test | Protected operation | Record Products/Admin target and recovery/rollback prerequisites only. |
| Start local Prometheus/Grafana or Worker development service | Protected operation | Record as pending; do not start a process. |
| Run test, gate, build, browser, or validation command | Pending authorization | Do not run unless separately and explicitly authorized and allowed by the active hook. |

A protected-operation record is valid only if it names the operation, target surface, required explicit authorization, expected evidence, and `not-run`/`pending-authorization` status. The tool has no code path that turns a review finding into an execution request.

## Error handling and failure modes

| Condition | Behavior |
| --- | --- |
| Expected source path is missing | Create a `gap` with source path, surface, risk, and recommendation; do not substitute another source silently. |
| Source is unreadable or malformed | Preserve the parse/read error as local evidence, continue independent surfaces, and create a review gap. |
| Claim has no source locator | Reject it from `observedConfiguration`; place a gap explaining the missing provenance. |
| External claim lacks current authorized evidence | Emit it under `unverifiedExternalState`, never under observed configuration. |
| Secret-like value is encountered | Redact it and report only the variable/key name; never render its value. |
| Products/Admin target is ambiguous | Stop that recovery/release sub-review at a P0/P1 ownership gap; do not assume a project. |
| CI/runbook comparison is incomplete | Emit an alignment gap with the compared paths and missing comparison dimension. |
| Proposed action is protected | Produce pending authorization metadata rather than invoking anything. |

## Output artifacts

A later approved implementation should write review outputs only to an explicitly selected, non-product evidence location such as `agents-work/operations-deployment-backup-review/reviews/` for authored review decisions or `results/operations-deployment-backup-review/` for machine-generated evidence. It must not write audit reports beneath `site/`, in `results/` root, or into provider-backed storage.

Recommended artifact set:

| Artifact | Format | Required contents |
| --- | --- | --- |
| Evidence Record | JSON | Typed source facts, evidence status, protected operations, gaps, owner decisions, release decisions, drills, alignment differences. |
| Review Summary | Markdown | Human-readable priorities, risks, source references, unverified facts, and owner decisions. |
| Restore Drill Template | Markdown/JSON | Non-production scope, operator, artifact category, procedure version, success evidence, cleanup, pending authorization. |
| Recommendation Backlog | JSON/Markdown | P0–P3 recommendation items with owner, affected surface, source evidence, and acceptance evidence. |

All outputs include a generation timestamp, repository revision when locally available without network access, input source list, and an explicit statement that no protected operation was executed.

## Validation strategy

The Phase 3 document itself is validated by read-back inspection only. No protected command is authorized by this task.

For a separately approved implementation:

- **Unit tests** cover fixed classification tables, exact source fixtures, schema validation, redaction, required fields, and error paths.
- **Property tests** cover pure evidence admission, unverified-state classification, record completeness, coverage/gap generation, alignment comparison, output partitioning, and serialization. Use at least 100 iterations per property and tag each with `Feature: operations-deployment-backup-review, Property N: <property title>`.
- **Fixture-based integration tests** parse representative repository-local versions of Vercel, Worker, CI, package, runbook, and database-operation sources without contacting providers.
- **Manual review** validates that any later generated outputs cite real paths/locators, contain no secret values, distinguish external state, and do not claim protected-operation execution.

Protected validation remains pending separate authorization: `pnpm run check:layout`, `pnpm run typecheck`, targeted Vitest commands, full gates, deploy commands, Worker commands, database operations, R2 backups, provider inspection, restore drills, and local observability services.

## Correctness Properties

*A property is a behavior that must hold across all valid review inputs. These properties are executable specifications for the pure review logic; they do not authorize infrastructure operations.*

### Property reflection

The prework identified several overlapping completeness properties. They are consolidated below so each property adds distinct coverage:

- Protected-operation record completeness combines Requirements 1.2 and 6.3 because both require safe pending-action representation.
- Release and recovery completeness combines data-changing release, schema-change, and backup-dependent recovery fields (2.2, 7.2, 7.3) while retaining each requirement reference.
- External-evidence classification combines provider, Worker, R2, Vercel, and monitoring claims (1.3, 2.4, 3.3, 5.3, 8.2).
- Database and monitoring missing-field detection remain separate because their required field sets and remediation owners differ.
- Fixed inventories/routing matrices are intentionally example tests, not redundant properties.

### Property 1: Evidence admission preserves the repository boundary

For all candidate evidence items, the review accepts an item as observed evidence only when it has a repository-local source reference or is explicitly supplied user evidence; every other candidate is rejected or recorded as an unverified gap.

**Validates: Requirements 1.4**

### Property 2: Protected operations are non-executable and complete

For all detected protected operations and protected restore-drill executions, the review emits exactly one pending record containing the operation, target surface, required explicit authorization, expected evidence, and a `not-run` or `pending-authorization` execution status; it never emits an execution result.

**Validates: Requirements 1.2, 6.3**

### Property 3: Unsupported external claims remain unverified

For all Vercel, Worker, R2, provider-recovery, and monitoring claims lacking current authorized provider evidence, the review classifies the claim as `unverified` and never as observed external state; a local configuration fact alone cannot change that result.

**Validates: Requirements 1.3, 2.4, 3.3, 5.3, 8.2**

### Property 4: Persisted-data release and recovery records are complete

For all releases marked as changing persisted data, schema-changing releases, and recovery procedures that rely on a backup, the review requires the applicable database owner, migration/seed impact, backup category or prerequisite, rollback instruction, compatibility hazard, order-of-operations, restore owner, approval boundary, and completion evidence before the record is complete.

**Validates: Requirements 2.2, 7.2, 7.3**

### Property 5: Worker changes retain independent release decisions

For all Cloudflare Worker changes, the review produces a Worker-specific release decision with a separate approval point, rollback or recovery procedure, and expected verification evidence, regardless of whether a Vercel change is also present.

**Validates: Requirements 3.2**

### Property 6: Missing database-backup elements produce attributable gaps

For all Products or Admin backup-coverage records missing any required source, target, retention statement, restore procedure, or owner, the review emits a gap for each missing element that names the affected database.

**Validates: Requirements 4.3**

### Property 7: Scheduled-workflow review redacts credentials while preserving structure

For all scheduled CI workflow records, the review retains schedule, trigger modes, timeout, command route, and secret names while omitting every secret value.

**Validates: Requirements 5.2**

### Property 8: Applicable recovery paths map one-to-one to complete restore drills

For all applicable Products, Admin, catalog, and repository recovery paths, the review produces one restore drill per path, and every drill contains an operator, non-production target, source artifact category, objective, success evidence, data boundary, and cleanup or rollback condition.

**Validates: Requirements 6.1, 6.2**

### Property 9: Restore-drill evidence has audit-ready fields

For all completed restore-drill evidence records, acceptance requires a drill date, target, artifact identifier, procedure version, observed result, and unresolved-gap field.

**Validates: Requirements 6.4**

### Property 10: Incident records preserve decision-critical uncertainty

For all incident review inputs, the resulting incident record contains affected surface, customer-impact assumption, safe observation, fallback, recovery path, and an explicit collection of unverified facts.

**Validates: Requirements 7.4**

### Property 11: Monitoring gaps are attributable and complete

For all release or recovery procedure records missing one or more named observable signals, expected values, owner, or escalation path, the review emits a monitoring gap identifying every missing element and the affected procedure.

**Validates: Requirements 8.3**

### Property 12: Alignment comparison produces complete, source-linked differences

For all normalized runbook and repository configuration fact sets, the comparison evaluates command route, owner, environment, order of operations, and recovery procedure; every detected difference records both source paths, the exact difference, affected surface, and recommended resolution.

**Validates: Requirements 9.1, 9.2**

### Property 13: Evidence Record sections form a non-overlapping partition

For all review findings, the renderer places each finding in exactly one appropriate evidence section—observed repository configuration, unverified external state, recommendation/gap, protected operation, or owner decision—without silently dropping it or placing it in conflicting sections.

**Validates: Requirements 9.4**

## Requirement-to-validation matrix

| Requirement | Primary validation |
| --- | --- |
| 1.1, 1.3 | Unit decision-table tests for classification and current-authorized evidence states. |
| 1.2, 1.4 | Properties 1–2. |
| 2.1, 2.3 | Fixture/unit tests for Vercel source inventory and prerequisite gaps. |
| 2.2, 2.4 | Properties 3–4. |
| 3.1, 3.4 | Fixture/unit tests for Worker inventory and four-case matrix. |
| 3.2, 3.3 | Properties 3 and 5. |
| 4.1, 4.2, 4.4 | Fixture/unit tests for distinct databases, target coverage, and recovery categories. |
| 4.3 | Property 6. |
| 5.1, 5.4 | Fixture/unit tests for R2 inputs and artifact categories. |
| 5.2, 5.3 | Properties 3 and 7. |
| 6.1–6.4 | Properties 2 and 8–9 plus a unit test for protected classification. |
| 7.1 | Unit test for separate rollback-path inventory. |
| 7.2–7.4 | Properties 4 and 10. |
| 8.1, 8.4 | Fixture/unit tests for monitoring sources and protected-operation classification. |
| 8.2, 8.3 | Properties 3 and 11. |
| 9.1–9.4 | Properties 12–13 plus unit test for missing CI approval/recovery references. |

## Deferred approval work

The following require a new explicit owner decision and are deliberately out of scope for this feature-design phase: implementing a command, introducing tests, changing package scripts, editing runbooks or CI, modifying Worker/Vercel configuration, changing R2 or database configuration, running any validation command, deploying, backing up, restoring, accessing providers, or starting local services.
