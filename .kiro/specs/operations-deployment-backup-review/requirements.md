# Requirements Document

## Introduction

The Operations Deployment Backup Review defines a repository-local, evidence-based review of Vercel deployment, the Cloudflare Worker, Products and Admin Supabase backup coverage, R2 backup flow, restore drills, rollback and recovery procedures, monitoring, and runbook and CI alignment. The review produces implementation recommendations and an evidence record without deploying, backing up, restoring, inspecting providers, or changing hosted infrastructure.

## Glossary

- **Operations Review**: The repository-local assessment defined by this document.
- **Deployment Surface**: A release path comprising the Vercel application or the Cloudflare Worker.
- **Vercel Application**: The Next.js application configured by `vercel.json` and root deployment scripts.
- **Cloudflare Worker**: The `workers/oando-worker-proxy` edge proxy that serves R2 assets and forwards other requests to the Vercel origin.
- **Products Database**: Supabase project `erpweaiypimorcunaimz`, which owns marketing catalog and configurator data.
- **Admin Database**: Supabase project `rxzpznmxbaoxpikowmfc`, which owns staff, customer, plan, furniture, descriptor, price-book, audit, and customer-query data.
- **R2 Backup Flow**: The repository-configured process that stores Supabase, catalog, or repository backup artifacts in Cloudflare R2.
- **Restore Drill**: A controlled procedure that validates documented recovery steps and evidence requirements without altering production data during this Operations Review.
- **Rollback Path**: The documented sequence for reversing an incompatible code or schema release.
- **Recovery Path**: The documented sequence for returning a data or service surface to an intended state after an incident.
- **Monitoring Surface**: Repository configuration for OpenTelemetry, Prometheus metrics, Grafana, or operational logs.
- **Runbook**: `OPERATIONS_RUNBOOK.md` and linked operating documentation that defines authorized operational procedures.
- **CI Workflow**: A GitHub Actions workflow that automates repository operations.
- **Protected Operation**: An external deployment, backup, restore, provider inspection, migration, seed, or service action requiring separate explicit authorization.
- **Evidence Record**: A review output that identifies repository source paths, observed configuration, unverified external state, risks, and recommended follow-up.

## Requirements

### Requirement 1: Scope and authorization control

**User Story:** As an operations owner, I want the Operations Review to preserve provider and data boundaries, so that planning work cannot change external systems.

#### Acceptance Criteria

1. THE Operations Review SHALL classify Vercel deployments, Cloudflare Worker deployments, Products Database backups, Admin Database backups, R2 writes, restores, migrations, seeds, provider inspections, and local observability services as Protected Operations.
2. WHEN the Operations Review identifies a Protected Operation, THE Operations Review SHALL record the operation, target surface, required explicit authorization, and expected evidence without executing the operation.
3. IF repository evidence does not include current authorized provider output, THEN THE Operations Review SHALL label the corresponding provider state as unverified.
4. THE Operations Review SHALL limit review evidence to repository-local files and user-provided evidence.

### Requirement 2: Vercel deployment review

**User Story:** As a release owner, I want the Vercel Application deployment path reviewed, so that release risks and recovery prerequisites are visible before approval.

#### Acceptance Criteria

1. THE Operations Review SHALL identify the Vercel Application build configuration, deployment command route, target-environment assumptions, and documented post-deployment evidence from repository-local sources.
2. WHEN the Operations Review identifies a release that changes persisted data, THE Operations Review SHALL document the Products Database or Admin Database owner, migration impact, seed impact, backup prerequisite, code-release order, and Rollback Path.
3. IF a Vercel Application release prerequisite is absent, contradictory, or lacks a named owner, THEN THE Operations Review SHALL record the gap, affected release surface, risk, and recommended follow-up.
4. WHILE reviewing the Vercel Application, THE Operations Review SHALL distinguish configured deployment behavior from unverified hosted deployment state.

### Requirement 3: Cloudflare Worker review

**User Story:** As an edge-service owner, I want the Cloudflare Worker deployment and origin behavior reviewed separately from the Vercel Application, so that edge-release risks are not conflated with application-release risks.

#### Acceptance Criteria

1. THE Operations Review SHALL identify the Cloudflare Worker deployment command route, Worker configuration, R2 binding, Vercel origin dependency, and documented verification evidence from repository-local sources.
2. WHEN the Operations Review identifies a Cloudflare Worker change, THE Operations Review SHALL record a separate Worker release decision, approval point, rollback or recovery procedure, and expected verification evidence.
3. IF Cloudflare Worker documentation claims a hosted behavior without current authorized provider evidence, THEN THE Operations Review SHALL label the hosted behavior as unverified.
4. THE Operations Review SHALL identify the expected behavior for R2 asset hits, R2 asset misses, R2 errors, and Vercel-origin forwarding as separate review cases.

### Requirement 4: Products and Admin backup coverage

**User Story:** As a data owner, I want Products Database and Admin Database backups assessed independently, so that recovery planning accounts for distinct ownership and data scopes.

#### Acceptance Criteria

1. THE Operations Review SHALL identify the Products Database reference, Admin Database reference, ownership scope, configured backup route, and recovery documentation for each database.
2. WHEN a backup workflow or command is reviewed, THE Operations Review SHALL identify whether the workflow or command names both the Products Database and Admin Database as inputs or targets.
3. IF backup coverage for either database lacks a documented source, target, retention statement, restore procedure, or owner, THEN THE Operations Review SHALL record the missing element and the affected database.
4. WHILE reviewing database recovery, THE Operations Review SHALL distinguish schema rollback, provider recovery, point-in-time recovery, and data restore as separate Recovery Paths.

### Requirement 5: R2 backup flow review

**User Story:** As an operations owner, I want the R2 Backup Flow reviewed, so that backup artifact scope and evidence expectations are explicit.

#### Acceptance Criteria

1. THE Operations Review SHALL identify the R2 Backup Flow command routes, scheduled CI Workflow, configured R2 credential variables, and declared artifact categories from repository-local sources.
2. WHEN the Operations Review identifies a scheduled CI Workflow, THE Operations Review SHALL record the schedule, triggering modes, timeout, command route, and required secret names without exposing secret values.
3. IF repository evidence does not prove successful R2 artifact creation, retention, integrity, or retrievability, THEN THE Operations Review SHALL label each unproven property as unverified.
4. THE Operations Review SHALL distinguish database dumps, catalog snapshots, repository backups, and delivery assets as separate R2 artifact categories.

### Requirement 6: Restore drills and recovery readiness

**User Story:** As a recovery owner, I want a testable Restore Drill specification, so that recovery readiness can be approved without treating a backup workflow as proof of restorability.

#### Acceptance Criteria

1. THE Operations Review SHALL define a Restore Drill for each applicable Products Database, Admin Database, catalog artifact, and repository artifact Recovery Path.
2. WHEN defining a Restore Drill, THE Operations Review SHALL specify the authorized operator, non-production target, source artifact category, recovery objective, success evidence, data-handling boundary, and rollback or cleanup condition.
3. IF a Restore Drill requires provider access, data mutation, or artifact retrieval, THEN THE Operations Review SHALL classify the Restore Drill execution as a Protected Operation and leave execution pending separate authorization.
4. THE Operations Review SHALL require Restore Drill evidence to identify the drill date, target, artifact identifier, procedure version, observed result, and unresolved gap.

### Requirement 7: Rollback and incident recovery review

**User Story:** As an incident owner, I want code, schema, and data recovery paths reviewed separately, so that a failed release can be handled with the correct procedure.

#### Acceptance Criteria

1. THE Operations Review SHALL document separate Rollback Paths for Vercel Application code, Cloudflare Worker code, Products Database schema, Admin Database schema, and data recovery.
2. WHEN a release includes a schema change, THE Operations Review SHALL require the release record to identify the migration rollback instruction, compatibility hazard, and ordering between schema rollback and code rollback.
3. IF a documented recovery procedure relies on a backup, THEN THE Operations Review SHALL identify the backup artifact category, restore owner, approval boundary, and evidence required before recovery completion.
4. WHILE an incident is under review, THE Operations Review SHALL record the affected surface, customer-impact assumption, safe observation, fallback, Recovery Path, and unverified facts.

### Requirement 8: Monitoring and operational evidence review

**User Story:** As an operations owner, I want monitoring sources and gaps reviewed, so that release and recovery decisions have explicit observability evidence.

#### Acceptance Criteria

1. THE Operations Review SHALL identify repository-local OpenTelemetry registration, Prometheus metric implementation, local Prometheus and Grafana configuration, and documented log or tail command routes.
2. WHEN the Operations Review identifies a Monitoring Surface, THE Operations Review SHALL distinguish source wiring from proof that telemetry is collected, exported, retained, queried, or alerted.
3. IF a release or recovery procedure lacks named observable signals, expected values, owner, or escalation path, THEN THE Operations Review SHALL record the missing monitoring element and the affected procedure.
4. THE Operations Review SHALL classify starting local monitoring services and accessing provider logs as Protected Operations.

### Requirement 9: Runbook and CI alignment

**User Story:** As a repository owner, I want Runbook and CI Workflow alignment reviewed, so that documented operations match configured command routes and automation boundaries.

#### Acceptance Criteria

1. THE Operations Review SHALL compare repository-local Runbook procedures with root package command routes, Vercel configuration, Cloudflare Worker configuration, backup CI Workflows, and recovery documentation.
2. WHEN the Operations Review finds a command-name, owner, environment, order-of-operations, or recovery-procedure difference, THE Operations Review SHALL record the source paths, exact difference, affected operational surface, and recommended resolution.
3. IF a CI Workflow automates a backup or deployment-related action without a corresponding Runbook approval boundary or recovery reference, THEN THE Operations Review SHALL record the alignment gap.
4. THE Operations Review SHALL produce an Evidence Record that separates observed repository configuration, unverified external state, recommendations, Protected Operations, and decisions requiring an owner.
