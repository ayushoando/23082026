# Operations Deployment Backup Review: Specification, Architecture & Verification Record

## Overview

The Operations Deployment Backup Review provides a repository-local, evidence-based assessment framework covering Vercel deployment, the Cloudflare Worker edge proxy (`workers/oando-worker-proxy`), the two distinct Supabase databases (Products vs Admin), R2 backup flows, restore drills, rollback and recovery procedures, monitoring coverage, and CI/runbook alignment.

The review strictly adheres to the **Protected Operations boundary**: it inspects configuration and code statically to emit source-linked evidence and prioritized recommendations, and never executes deployments, backups, restores, migrations, seeds, or external provider calls.

---

## 1. System Glossary & Boundaries

- **Vercel Application**: The Next.js web application configured by `vercel.json` and deployed via root scripts.
- **Cloudflare Worker Proxy**: The `workers/oando-worker-proxy` edge proxy routing R2 assets and forwarding origin traffic to Vercel.
- **Products Database (`erpweaiypimorcunaimz`)**: Owns marketing catalog, configurator items, and feature flags.
- **Admin Database (`rxzpznmxbaoxpikowmfc`)**: Owns staff, customer profiles, floor plans, furniture items, block descriptors, price books, and audit logs.
- **R2 Backup Flow**: Automated backup workflows storing database dumps and asset backups in Cloudflare R2 (`.github/workflows/supabase-backup-r2.yml`).
- **Protected Operations**: Operations requiring explicit manual owner authorization outside the review tool (deployments, backups, restores, provider API calls, database writes, and live observability startups).

---

## 2. Requirements & Acceptance Criteria

### Requirement 1: Scope and Authorization Control
- Classify external actions (deployments, backups, restores, migrations) as non-executable Protected Operations.
- Label any hosted or external infrastructure state as `unverified` unless supported by current repository evidence.

### Requirement 2: Vercel Deployment Review
- Extract build configuration, command routes (`pnpm run vercel:prod`, `pnpm run vercel:preview`), and target assumptions from `vercel.json` and `package.json`.
- Enforce release prerequisites (database owner, migration impact, seed impact, rollback path) for persisted-data releases.

### Requirement 3: Cloudflare Worker Review
- Model Worker deployment routes (`pnpm run worker:deploy`), `ASSET_BUCKET` R2 bindings, and `VERCEL_ORIGIN` dependencies separately from Vercel releases.
- Review the 4 routing cases: R2 asset hit, R2 asset miss, R2 error, and Vercel origin forward.

### Requirement 4: Products and Admin Backup Coverage
- Model Products (`erpweaiypimorcunaimz`) and Admin (`rxzpznmxbaoxpikowmfc`) as distinct database owners.
- Distinguish schema rollback, provider PITR, and data restore as separate recovery paths.

### Requirement 5: R2 Backup Flow Review
- Verify schedule, triggers, timeouts, and command routes in `.github/workflows/supabase-backup-r2.yml`.
- Redact secret values and classify artifacts into database dumps, catalog snapshots, repository backups, and delivery assets.

### Requirement 6: Restore Drills and Recovery Readiness
- Define reproducible Restore Drill specifications for each recovery path without executing live data mutations.
- Require audit-ready fields: drill date, target, artifact identifier, procedure version, observed result, and unresolved gaps.

### Requirement 7: Rollback and Incident Recovery Review
- Document independent Rollback Paths for Vercel code, Worker code, Products schema, Admin schema, and data restoration.
- Enforce safe ordering between schema rollback and code rollback.

### Requirement 8: Monitoring and Observability Gap Assessment
- Extract monitoring configurations from OpenTelemetry (`site/instrumentation.ts`), Prometheus metrics (`site/app/api/metrics/route.ts`), and local Grafana configs (`config/observability/`).
- Identify monitoring gaps for release and recovery procedures.

### Requirement 9: Runbook and CI Alignment
- Compare command routes, environments, and ownership between `OPERATIONS_RUNBOOK.md`, `package.json`, and GitHub Actions workflows.
- Assign deterministic risk priorities: P0 (data loss/rollback hazards), P1 (release/evidence gaps), P2 (alignment drift), P3 (clarity improvements).

---

## 3. Architecture of the Operations Review Tool

The operational review engine lives in [`scripts/operations-review/`](file:///d:/23082026/scripts/operations-review):

- **[`models.ts`](file:///d:/23082026/scripts/operations-review/models.ts)**: Strongly typed domain models for evidence states, surface enums, priorities (P0–P3), release decisions, restore drills, and protected operations.
- **[`authorizationGuard.ts`](file:///d:/23082026/scripts/operations-review/authorizationGuard.ts)**: Guardrail ensuring protected actions produce non-executable pending records.
- **[`sourceAdapter.ts`](file:///d:/23082026/scripts/operations-review/sourceAdapter.ts)**: Repository-only source adapter computing content digests and rejecting external network calls.
- **[`extractors/`](file:///d:/23082026/scripts/operations-review/extractors)**:
  - `vercel.ts`: Vercel configuration extractor.
  - `worker.ts`: Cloudflare Worker configuration & routing matrix extractor.
  - `databases.ts`: Two-database ownership & migration extractor.
  - `r2.ts`: R2 backup workflow & artifact classification extractor.
  - `monitoring.ts`: OpenTelemetry & Prometheus metric coverage extractor.
- **[`recoveryPlanner.ts`](file:///d:/23082026/scripts/operations-review/recoveryPlanner.ts)**: Generates one-to-one restore drill specifications.
- **[`alignmentComparator.ts`](file:///d:/23082026/scripts/operations-review/alignmentComparator.ts)**: Compares runbook instructions against live command routes.
- **[`riskPrioritizer.ts`](file:///d:/23082026/scripts/operations-review/riskPrioritizer.ts)**: Assigns deterministic P0–P3 risk priority.
- **[`renderer.ts`](file:///d:/23082026/scripts/operations-review/renderer.ts)**: Formats evidence records with secret redaction into partitioned Markdown/JSON.

---

## 4. Verification Matrix

The implementation is verified by 16 test suites in [`tests/operations-review/`](file:///d:/23082026/tests/operations-review):

| Test File | Property / Purpose | Validates Requirements |
|---|---|---|
| `repositoryEvidenceAdmission.property.test.ts` | Property 1: Evidence preserves repository boundary | 1.4 |
| `protectedOperationCompleteness.property.test.ts` | Property 2: Protected operations are non-executable | 1.2, 6.3 |
| `unsupportedExternalClaim.property.test.ts` | Property 3: Unsupported external claims remain unverified | 1.3, 2.4, 3.3, 5.3, 8.2 |
| `persistedDataReleaseCompleteness.property.test.ts` | Property 4: Persisted-data release & recovery completeness | 2.2, 7.2, 7.3 |
| `workerReleaseDecision.property.test.ts` | Property 5: Worker retains independent release decisions | 3.2 |
| `attributableMissingBackupCoverageGaps.property.test.ts` | Property 6: Missing backup elements produce attributable gaps | 4.3 |
| `scheduledWorkflowCredentialRedaction.property.test.ts` | Property 7: Credential redaction in scheduled workflows | 5.2 |
| `restoreDrillCompleteness.property.test.ts` | Property 8: One-to-one restore drill mapping | 6.1, 6.2 |
| `restoreDrillEvidenceFields.property.test.ts` | Property 9: Restore drill audit-ready fields | 6.4 |
| `incidentUncertaintyPreservation.property.test.ts` | Property 10: Decision-critical uncertainty preservation | 7.4 |
| `attributableMonitoringGaps.property.test.ts` | Property 11: Monitoring gaps are attributable & complete | 8.3 |
| `sourceLinkedAlignmentDifferences.property.test.ts` | Property 12: Source-linked alignment differences | 9.1, 9.2 |
| `evidenceRecordPartitions.property.test.ts` | Property 13: Non-overlapping evidence record partitions | 9.4 |
| `extractors.fixture.test.ts` | Task 6.4: Comprehensive fixture-based unit & integration tests (1,223 lines) | 2.1, 2.3, 3.1, 3.4, 4.1, 4.2, 4.4, 5.1, 5.4, 7.1, 8.1, 9.3 |
