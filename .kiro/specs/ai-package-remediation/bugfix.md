# Bugfix Requirements Document

## Introduction

This bugfix/improvement addresses insufficiently evidenced AI assistance for One & Only Furniture’s catalog advisor and Planner advisor client. Static inspection identifies an unavailable Planner advisory path and retrieval persistence behavior that cannot rely on production filesystem writes. The requested outcome is a phase-specific, user-safe remediation decision that improves catalog and planning assistance without treating model output as authoritative.

This requirements phase is limited to discovery and decision preparation. It does not authorize package installation, version changes, lockfile changes, provider calls, secret changes, production configuration, data migration, route deployment, or automatic application of AI suggestions. The comparison chart and staged implementation plan are required remediation deliverables; they must be based on current official metadata and explicit owner decisions before any implementation begins.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an AI delivery phase requires a package, provider, retrieval, or response-format decision THEN the system lacks one evidenced, phase-specific requirements record that identifies the affected user outcome, permitted data, provider constraints, evaluation measure, and pass/fail acceptance condition for that decision.

1.2 WHEN maintainers assess declared direct AI and retrieval dependencies against source usage THEN the system lacks a comparison chart that, for every dependency, cites official-source and source-usage evidence; classifies active usage, functional overlap, removal candidacy, or replacement candidacy; and assesses package suitability, operational cost, and migration risk.

1.3 WHEN the Planner advisor client posts a request conforming to its defined advisor-request contract to `/api/planner/ai-advisor` THEN the current source tree has no matching route handler, so the client cannot receive a response conforming to its defined advisor-response contract from that endpoint.

1.4 WHEN vector recall is invoked in production without an explicitly configured remote store THEN the implementation attempts a local vector-store filesystem write instead of reporting vector retrieval as unavailable to the calling AI workflow and preserving the request without creating local vector-store data.

1.5 WHEN vector recall is invoked in production with an explicitly configured remote store THEN the current requirements do not establish an approved contract that retrieval uses that store without writing vector-store data to the production filesystem.

1.6 WHEN an AI request uses a configured provider fallback, retrieval layer, model response, or deterministic fallback THEN the inspected implementation lacks a complete, phase-defined evaluation and observability contract for relevance, structured-response validity, provider selection, latency, error, fallback, and data-boundary outcomes.

1.7 WHEN a direct AI or retrieval dependency is retained, upgraded, added, removed, or replaced THEN the current package manifest and requirements lack a package-specific decision that identifies the approving authority, exact pinned version for each retained or added package, compatibility assessment, migration decision, and rollback decision before the manifest changes.

### Expected Behavior (Correct)

2.1 WHEN an audit, selection, remediation/migration, or evaluation/rollout phase is planned THEN the system SHALL maintain one evidenced phase record that identifies the catalog-and-Planner user outcome, supported request and response behavior, permitted catalog/context data, provider and retrieval constraints, evaluation measure, owner-approved pass/fail acceptance criteria, and approval gate for that phase.

2.2 WHEN the audit compares a current direct AI/retrieval dependency or shortlisted alternative THEN the system SHALL maintain a current official-source comparison chart that records package version and license; Node.js, Next.js 16, React 19, and TypeScript compatibility; active source usage; operational, security, data, provider, and cost implications; maintenance maturity; migration complexity; rollback feasibility; and a recommendation supported by cited evidence.

2.3 WHEN a catalog advisor or Planner advisor client submits a request conforming to its documented advisor-request contract THEN the system SHALL route it to a matching handler that returns a response conforming to the documented advisor-response contract or a clearly marked deterministic degraded response conforming to that contract; the phase record SHALL assess the endpoint, authentication, CSRF, rate limiting, request validation, response normalization, and streaming or non-streaming behavior before owner approval.

2.4 WHEN vector recall is invoked in production without an explicitly configured remote store THEN the system SHALL not attempt a filesystem write, SHALL indicate to the calling AI workflow that vector retrieval is unavailable, and SHALL preserve the request data without creating local vector-store data.

2.5 WHEN vector recall is invoked in production with an explicitly configured remote store THEN the system SHALL perform retrieval only through that configured store, SHALL not write vector-store data to the production filesystem, and SHALL follow an owner-approved catalog-index freshness and retrieval-failure policy that preserves a deterministic lexical/catalog fallback when remote retrieval is unavailable.

2.6 WHEN the implementation selects or invokes a provider or provider fallback THEN the system SHALL use only an explicitly owner-approved provider set, keep credentials and model configuration server-side, minimize catalog and session-derived data to the approved purpose, prohibit unapproved personal or sensitive-data transfer, record provider-specific retention and cost assumptions, and require an owner decision before changing the provider set or data policy.

2.7 WHEN the remediation evaluates AI behavior THEN the system SHALL define representative catalog and Planner scenarios plus adverse unavailable-provider, malformed-model-output, retrieval-failure, timeout, and authorization cases; the evaluation SHALL measure grounded-catalog accuracy, structured-response validity, fallback visibility, latency, error rate, retrieval-source contribution, and provider selection without recording secrets or unnecessary personal data; any numerical target SHALL be an explicit owner-approved decision or a documented owner decision that no fixed target applies.

2.8 WHEN a direct AI or retrieval package change is proposed THEN the system SHALL require an approved comparison-chart recommendation, approving authority, exact pinned version for every retained or added package, official-source and license review, Node.js/Next.js/React/TypeScript compatibility review, supply-chain and transitive-dependency review, migration steps, rollback steps, and explicit owner approval before modifying `package.json`, the lockfile, dependencies, or runtime configuration.

2.9 WHEN a remediation phase changes an advisor, provider adapter, retrieval store, schema, prompt contract, or persistence boundary THEN the system SHALL provide a staged implementation plan with owner approvals, pre-change baseline evidence, reversible migration and rollback steps, data/index recovery expectations, observability instrumentation, and a release-validation map covering source-level, type, lint, targeted unit/integration, retrieval-evaluation, security/privacy, and controlled end-to-end validation appropriate to the changed surface.

2.10 WHEN a change to an advisor, provider, retrieval store, package, lockfile, secret, runtime configuration, or related source is proposed THEN the system SHALL remain read-only until the owner grants exact current-session approval for the named scope; any protected command SHALL additionally require applicable hook permission before it runs.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the catalog advisor receives a valid request THEN the system SHALL CONTINUE TO return advisory-only catalog guidance grounded in known catalog records and SHALL NOT automatically change a plan, catalog item, price, or order.

3.2 WHEN an approved provider or retrieval layer is unavailable THEN the system SHALL CONTINUE TO return a clearly identifiable deterministic degraded fallback rather than present unavailable AI output as authoritative.

3.3 WHEN catalog recommendations include price or budget guidance THEN the system SHALL CONTINUE TO use INR-oriented budget bands or “On request”, avoid a fabricated final BOQ or precise authoritative total, and require a human decision before a client-facing outcome.

3.4 WHEN a request reaches an existing AI route THEN the system SHALL CONTINUE TO enforce the established server-only secret boundary and applicable authentication, CSRF, rate-limit, input-validation, response-normalization, and unknown-product rejection controls and, if any control rejects the request, SHALL CONTINUE TO reject it before initiating a provider call.

3.5 WHEN lexical or fuzzy catalog search is assessed THEN the system SHALL CONTINUE TO treat Orama’s advisor retrieval path and Fuse.js product filtering as separate concerns unless live import evidence and an approved design deliberately join them.

3.6 WHEN this requirements phase is completed THEN the system SHALL CONTINUE TO preserve unrelated source, existing `ai-implementation-audit` specification artifacts, package declarations, lockfiles, dependencies, secrets, provider configuration, and runtime behavior until a later phase receives exact owner approval.

3.7 WHEN a validation, provider call, migration, deployment, package operation, or other protected command is proposed THEN the system SHALL CONTINUE TO require exact current-session authorization and applicable hook permission before it runs.
