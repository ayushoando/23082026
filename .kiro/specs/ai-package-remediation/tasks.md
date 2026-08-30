# Implementation Plan: AI Package Remediation

## Overview

This task list translates the approved `bugfix.md` and `design.md` into later, owner-gated work. It does not authorize or record a source edit, test, command, package operation, provider call, secret/configuration change, migration, deployment, or runtime result. Every unchecked item remains pending until the Repository Owner grants exact current-session approval for its named scope; every protected command additionally requires enabled-hook permission.

The remediation remains advisory-only. Model output, retrieval hits, provider labels, and Planner suggestions are untrusted guidance until a human explicitly applies them. No task may introduce automatic plan, catalog, price, order, or filesystem mutation.

## Execution gates and evidence rules

- Work only from the repository root and preserve unrelated changes. Candidate paths below are future-only and are not authorization to edit them.
- For every source or test task, first obtain exact owner approval for the specific files and outcome. For every type, lint, test, build, browser, package, provider, migration, deployment, or other protected command, obtain separate current-session command authorization and hook permission.
- Use mocks, fixtures, or controlled adapters for all exploratory, property, and integration tests. Do not make provider or remote-vector network calls merely to execute a test.
- Treat static source evidence as static evidence only. Do not infer provider reachability, route execution, remote-store availability, hosted persistence, latency, cost, or deployment state.
- Record observed outputs as observed, failures as counterexamples, and unrun checks as pending. Do not convert an owner decision, a plan, or a configuration key's presence into a runtime claim.
- Do not modify `package.json`, the lockfile, secrets, runtime configuration, migrations, or deployment state unless a later owner approval names the exact path and package/version or configuration scope.

## Task Dependency Graph

```text
0. Phase-zero decision record (record format and evidence boundary)
├─ 0.1 Planner route/control decisions ───────────────────────────> 3.1 Planner endpoint repair
├─ 0.2 Retrieval mode/freshness/recovery decisions ───────────────> 3.2 Retrieval safety
├─ 0.3 Provider/data-policy decisions ────────────────────────────> 3.3 Provider policy
├─ 0.4 Evaluation-threshold decision ─────────────────────────────> 3.4 Metrics/evaluation
├─ 0.5 LanceDB verification + package decision gate ──────────────> 3.5 Package review
└─ 0.6 Optional-spike decision ───────────────────────────────────> 3.6 Optional spikes

0 (record format) ─> 1. Bug-condition exploration PBT ─> 2. Preservation PBT
                                                            │
                                                            ├─> 3.1 Planner endpoint repair
                                                            ├─> 3.2 Retrieval safety
                                                            ├─> 3.3 Provider policy
                                                            ├─> 3.4 Metrics/evaluation (after relevant implemented surfaces)
                                                            └─> 3.5 Package review gate

3.1, 3.2, 3.3, 3.4, and any separately approved 3.5/3.6 scope
  ─> 3.7 Re-run Property 1 ─> 3.8 Re-run Property 2 ─> 4. Checkpoint and owner handoff
```

Tasks 1 and 2 are standalone, pre-fix test tasks and must remain before all implementation work. Task 0 records decisions and gates; an entry marked `pending` is not approval and cannot unblock the associated implementation task.

## Phase zero — decision and approval record

- [x] 0. Establish the evidenced phase-zero decision and approval record
  - **Candidate artifact (requires a later exact file-creation approval):** `.kiro/specs/ai-package-remediation/decision-record.md`. Do not edit `bugfix.md` or `design.md` unless the owner separately names either file.
  - **Implementation intent:** create a phase-by-phase record that distinguishes `[STATIC-FACT]`, `[UNVERIFIED]`, and `[OWNER-DECISION]`; identifies the approving authority, decision date/scope, affected surface, acceptance condition, rollback owner, and status (`pending`, `approved`, `rejected`, or `superseded`). The record itself must not imply provider reachability, a package change, or deployment.
  - **Prerequisites / owner gates:** exact approval to create the decision record; no source, package, secret, configuration, migration, provider, or deployment authorization follows from that approval.
  - **Validation intent:** review the completed record against the requirements/design traceability table below; no command or provider call is needed to create a record.
  - _Requirements: 1.1, 1.2, 1.6, 1.7, 2.1, 2.2, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [x] 0.1 Record the canonical Planner endpoint and boundary decisions as pending until explicitly approved
    - Record the canonical path/case (`/api/planner/ai-advisor` is the proposed target, not an approval), whether a lowercase route is added or an existing `Planner/` path is renamed, Planner auth role, CSRF requirement, rate-limit scope/count, non-streaming default versus streaming, and whether catalog grounding participates in Planner responses.
    - Require an explicit decision that the Planner response remains independently typed and advisory-only, with no automatic plan mutation and no Studio import.
    - **Owner gate:** the owner must approve each decision before Task 3.1; a path/case decision must precede any filesystem rename.
    - _Requirements: 1.3, 2.3, 2.9, 2.10, 3.1, 3.4_

  - [x] 0.2 Record the retrieval-mode, freshness, and recovery decision as pending until explicitly approved
    - Choose either lexical/catalog-only degraded mode as the production default or a specifically named remote vector store/URI policy. Record the remote-URI eligibility rule, index freshness policy, retrieval-failure policy, source-attribution exposure, and remote-index recovery owner.
    - State that a local production vector-store path is never an approved fallback. If no remote store is approved, vector retrieval must be represented as unavailable rather than attempted locally.
    - **Owner gate:** the chosen mode and any runtime configuration change require exact approval before Task 3.2; a remote-store decision is not proof that a store is reachable.
    - _Requirements: 1.4, 1.5, 2.4, 2.5, 2.9, 2.10, 3.2, 3.5, 3.6_

  - [x] 0.3 Record provider/model, data-minimization, retention, and cost decisions as pending until explicitly approved
    - List only owner-approved `{ provider, model }` pairs; define the approved catalog/context fields, prohibited personal or sensitive data, server-only credential boundary, provider retention assumptions, and cost-accountability owner.
    - Record how an empty or unavailable approved set degrades deterministically without presenting model output as authoritative.
    - **Owner gate:** no provider-set, model, secret, environment, or data-policy change may begin until the owner approves the exact decision and scope.
    - _Requirements: 1.6, 2.6, 2.7, 2.8, 2.10, 3.2, 3.4, 3.7_

  - [x] 0.4 Record the evaluation-threshold decision
    - Define whether the owner approves numeric thresholds for grounded-catalog accuracy, structured-response validity, fallback visibility, latency, error rate, retrieval contribution, and provider selection, or explicitly decides that a metric has no fixed target.
    - **Owner gate:** no threshold may be invented by an implementer; metric instrumentation may proceed only after the metric set and privacy boundary are approved.
    - _Requirements: 1.6, 2.7, 2.9, 2.10_

  - [x] 0.5 Verify the LanceDB manifest/registry question without asserting a result in advance
    - Capture the declared manifest range, then—only under a later approved evidence-gathering scope—compare it with installed/resolvable and official metadata. Mark the result as verified, unresolved, or blocked; do not state that a discrepancy exists or that a version resolves until evidence is collected.
    - **Owner gate:** this is a verification task, not package authorization. Any registry/network lookup, package operation, manifest edit, or lockfile edit needs its own approval.
    - _Requirements: 1.2, 1.7, 2.2, 2.8, 2.10, 3.6, 3.7_

  - [x] 0.6 Record optional AI Gateway, remote-vector, and pgvector spikes as separate decisions
    - Define a narrow question, comparison criteria, authorized evidence source, bounded candidate paths, expected rollback, and a stop condition for each optional spike. Keep all spikes `defer` unless the owner explicitly selects one.
    - **Owner gate:** a spike is not part of the minimal-churn path and cannot add packages, call providers, create migrations, or change deployment/configuration without a separate exact approval.
    - _Requirements: 2.2, 2.5, 2.6, 2.8, 2.9, 2.10, 3.6, 3.7_

## Pre-fix baseline tasks

- [x] 1. Write bug-condition exploration property tests
  - **Property 1: Bug Condition** - Safe, contract-conforming AI delivery remediation
  - **CRITICAL:** write these tests before implementing any fix. Run them on the unfixed baseline only after an exact current-session test authorization and hook permission. Their expected result is failure; do not weaken the assertions or alter production code to make the baseline pass.
  - **Bug_Condition (`isBugCondition(input)`):** a decision lacks an evidenced phase contract; a Planner advisor request targets a missing or case-mismatched handler; a production vector recall lacks a configured remote store and attempts a local filesystem write; or a package/provider change lacks owner approval and an exact pin.
  - **Expected_Behavior (`expectedBehavior(result)`):** a valid Planner request reaches a matching independently typed handler and returns a contract-conforming or explicitly degraded response; non-remote production vector capability reports unavailable without a local write; a package/provider change cannot proceed without an approved, exact-pin decision record.
  - **Candidate future test paths:** `tests/unit/app/api/planner/ai-advisor/route.test.ts` (new), `tests/unit/lib/ai/mastra/plannerAdvisorClient.test.ts`, `tests/unit/lib/ai/mastra/lanceVectorStore.test.ts`, `tests/unit/lib/ai/mastra/catalogRetrieval.test.ts`, and an owner-approved governance/decision-record test location.
  - **Scoped PBT approach:** use `fast-check` with deterministic fixtures and stubs only. Generate valid Planner message/context combinations, non-remote production capability configurations, and proposed dependency/provider-change records. Assert the expected contract/capability/governance properties rather than making a real provider or remote-store request.
  - **Required exploration cases:**
    - Assert the canonical Planner endpoint module/path exists with the selected case and can normalize a valid `PlannerAdvisorRequest` to `PlannerAdvisorResponse` or `{ degraded: true }`; on the baseline, preserve the missing-handler/path-case counterexample rather than masking it.
    - Assert a simulated production non-remote vector invocation yields an explicit unavailable capability and invokes no directory/file-write seam; on the baseline, preserve the exception-based/local-path counterexample if observed.
    - Assert a proposed package/provider mutation lacks approval until a decision record supplies an approver, exact pinned version, compatibility/supply-chain review, migration, and rollback; preserve missing-record counterexamples.
    - Assert phase-record/evaluation fields required for an AI delivery decision are present before a decision may be applied; do not equate a pending decision with approval.
  - **Evidence handling:** capture only actual counterexamples in the later owner-approved test/decision evidence; do not describe a failure as observed until the test runs. Do not issue provider calls.
  - **Prerequisites / owner gates:** Task 0.1 must at least establish the record format; exact test-file write approval, exact test command authorization, and hook permission are required. Package, source, configuration, and provider changes remain prohibited.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

- [x] 2. Write preservation property tests before implementing the fix
  - **Property 2: Preservation** - Existing catalog safety, degraded behavior, INR discipline, and retrieval separation
  - **IMPORTANT:** use observation-first methodology. On the unfixed baseline, observe and record behavior for inputs where `isBugCondition(input)` is false, then encode those observed patterns in property tests. These tests must pass before any remediation implementation begins.
  - **Non-bug condition (`NOT isBugCondition(input)`):** a valid catalog advisor request, a dev-mode disk vector recall, an existing route, or an already-approved dependency path. The tests must preserve these behaviors rather than infer new behavior.
  - **Candidate future test paths:** `tests/unit/app/api/ai-advisor/route.test.ts`, `tests/unit/lib/ai/mastra/catalogRetrieval.test.ts`, `tests/unit/lib/ai/mastra/lanceVectorStore.test.ts`, `tests/unit/lib/ai/mastra/catalogLocalSearch.test.ts` (new only if needed), and existing route-safety/schema test matrices.
  - **Observation-first baseline cases:**
    - Valid catalog advisor inputs remain advisory-only, grounded to known catalog records, and do not mutate plans, catalog items, prices, or orders.
    - Auth, CSRF, rate-limit, input-validation, response-normalization, and unknown-product rejection paths stop a request before a mocked provider boundary is invoked.
    - Unavailable provider/retrieval paths return the existing visibly marked deterministic catalog fallback (`fallbackUsed: true`); no unavailable model output is presented as authoritative.
    - Pricing remains INR-oriented through budget bands or `On request`, with no fabricated final BOQ or precise authoritative total.
    - Existing dev-mode vector behavior is measured without treating it as production-safe; Orama advisor retrieval and Fuse.js product filtering remain separate unless live imports change under an approved design.
  - **PBT approach:** generate valid catalog queries/context and fixture catalogs, mock provider/retrieval seams, and assert schema validity, known-product normalization, advisory-only/no-write behavior, fallback visibility, INR-safe price text, and source-layer separation. The test suite must not contact a provider, remote store, or live catalog service.
  - **Expected outcome:** tests pass on the unfixed baseline. Record only observed baseline patterns; if a proposed preservation property fails, stop and reconcile it with the owner rather than silently redefining existing behavior.
  - **Prerequisites / owner gates:** exact test-file write approval, exact test command authorization, and hook permission. Task 1 must have documented the defect counterexamples first; no implementation or package/configuration change is permitted while establishing this baseline.
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

## Owner-approved implementation

- [x] 3. Implement only the owner-approved remediation scopes
  - **Prerequisites / owner gates:** Tasks 1 and 2 are complete with their results honestly recorded; every child task has its named Phase-zero decision approved; the owner grants exact source/test scope. Parent completion does not authorize a child task, a package change, a secret/configuration change, a provider call, a migration, or deployment.
  - **Implementation intent:** apply the smallest reversible change using existing packages where possible. Keep catalog and Planner contracts independent, retain advisory-only behavior, preserve the Studio/Planner boundary, and use deterministic degradation whenever an approved capability is unavailable.
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 3.1 Repair the Planner advisor endpoint with an independent, non-streaming-by-default contract
    - **Candidate paths:** `site/app/api/planner/ai-advisor/route.ts` (new only after path/case approval); `site/lib/ai/mastra/plannerAdvisorClient.ts`; `site/features/shared/api/schemas.ts`; existing server-only AI/provider helpers; relevant auth/rate-limit helpers; future tests under `tests/unit/app/api/planner/ai-advisor/`.
    - **Implementation intent:** implement only the owner-approved canonical route/path casing. Validate `PlannerAdvisorRequest` independently from the catalog contract; return a single JSON `PlannerAdvisorResponse` by default, unless the owner separately approves streaming. Apply the approved auth, CSRF, rate-limit, input-validation, and error-envelope policy; return a deterministic `degraded: true` response for unavailable/invalid model capability rather than an automatic plan change. Normalize any catalog-specific Planner recommendation against known catalog records. Do not import Studio code or mutate Planner persistence.
    - **Test / validation intent:** use the same route/path cases created in Task 1 plus schema, rejected-boundary, degraded-response, no-mutation, and no-Studio-import coverage. Use mocked provider/retrieval seams only. Source review and any type/lint/unit/integration execution require separate exact approval and hook permission.
    - **Prerequisites / owner gates:** Task 0.1 decisions on path/case, auth role, CSRF, rate limit, streaming, and catalog grounding; Task 2 preservation baseline; exact write approval for every source/test path. A chosen provider policy in Task 0.3 is required before a provider is callable.
    - _Bug_Condition: `input.kind = "planner-advisor-request" AND NOT routeHandlerExists("/api/planner/ai-advisor")`, including a path/case mismatch._
    - _Expected_Behavior: valid requests receive an independently typed contract response or explicit deterministic degradation; rejected requests do not reach a provider; no suggestion auto-applies a layout._
    - _Preservation: catalog route behavior, server-only secrets, existing controls, advisory-only semantics, and Studio/Planner separation remain unchanged._
    - _Requirements: 1.3, 2.3, 2.6, 2.9, 2.10, 3.1, 3.2, 3.4, 3.6, 3.7_

  - [x] 3.2 Make vector retrieval explicitly remote-or-degrade and production-safe
    - **Candidate paths:** `site/lib/ai/mastra/lanceVectorStore.ts`, `site/lib/ai/mastra/catalogRag.ts`, `site/lib/ai/mastra/catalogRetrieval.ts`, and focused tests under `tests/unit/lib/ai/mastra/`.
    - **Implementation intent:** add a typed capability decision that recognizes a specifically approved remote URI as remote-capable and otherwise reports vector retrieval as unavailable in production before any local-path initialization/write seam. Preserve deterministic vector → lexical → catalog-order ordering and slug-level deduplication. When a remote store is configured, use that store only; when it is absent or fails, fall through to lexical/catalog-order without a production filesystem write. Keep source attribution available to the owner-approved response/observability boundary without silently changing a public client contract. Apply index freshness and `ensureCatalogVectorIndex(force)` recovery only to the owner-approved remote mode.
    - **Test / validation intent:** extend the Task 1 no-local-write property and Task 2 ordering/preservation property with mocked filesystem, environment, remote-store, embedding, and clock seams. Assert zero local write calls for all non-remote production configurations, remote-only selection for approved remote configurations, deterministic fallback ordering/deduplication, and explicit unavailable capability. No actual remote store, embedding, or provider call is permitted in these tests.
    - **Prerequisites / owner gates:** Task 0.2 retrieval mode/freshness/recovery decision; Tasks 1–2 baseline evidence; exact write approval. Any `LANCE_DB_URI` or other runtime configuration change needs separate exact owner approval and is not implied by source approval.
    - _Bug_Condition: `input.kind = "vector-recall" AND isProduction() AND NOT remoteVectorStoreConfigured() AND attemptsLocalFilesystemWrite()`._
    - _Expected_Behavior: non-remote production vector recall returns an explicit unavailable capability with no filesystem write; approved remote mode uses only the configured remote store and deterministically falls back on failure._
    - _Preservation: dev-mode behavior, Orama lexical retrieval, catalog-order tail filling, slug deduplication, and Fuse.js separation remain intact unless an approved decision explicitly changes them._
    - _Requirements: 1.4, 1.5, 2.4, 2.5, 2.9, 2.10, 3.2, 3.5, 3.6, 3.7_

  - [x] 3.3 Enforce the explicit provider/model allowlist and data-policy boundary
    - **Candidate paths:** `site/lib/ai/mastra/providers.ts`, `site/lib/ai/mastra/providerFetch.ts` only if needed to carry approved metadata, `site/lib/env.server.ts` for server-only validation, the approved decision record, and focused unit/property tests under `tests/unit/lib/ai/mastra/`.
    - **Implementation intent:** gate model-chain selection on the owner-approved `{ provider, model }` allowlist rather than key presence alone. Retain server-only credential access; pass only the approved catalog/context fields; prohibit secrets, raw unnecessary personal data, and raw session identifiers from logs, prompts, metrics, or client payloads. Ensure an unavailable/empty allowlist reaches the existing deterministic degraded behavior rather than a hidden provider attempt.
    - **Test / validation intent:** property-test arbitrary configured-key/allowlist combinations against mocked model factories: only allowlisted pairs may be selected, no allowlist means no provider invocation, and allowed request payloads exclude forbidden data. Re-run catalog/Planner fallback tests without a provider network call.
    - **Prerequisites / owner gates:** Task 0.3 approved provider/model, retention, cost, and data-minimization record; Tasks 1–2 baseline evidence; exact source/test approval. No secret, environment, provider, package, or model-default change is authorized merely by this task.
    - _Bug_Condition: `input.kind = "package-or-provider-change" AND NOT ownerApprovedAndPinned(input.change)`, or provider selection occurs solely because a key is present._
    - _Expected_Behavior: only explicitly approved provider/model pairs can be selected, credentials remain server-side, minimized approved data crosses the provider boundary, and unavailable capability degrades deterministically._
    - _Preservation: existing catalog security controls execute before a provider call; fallback visibility, advisory-only behavior, and INR guidance remain intact._
    - _Requirements: 1.6, 2.6, 2.7, 2.8, 2.9, 2.10, 3.1, 3.2, 3.3, 3.4, 3.6, 3.7_

  - [x] 3.4 Add privacy-safe AI observability and an owner-gated evaluation harness
    - **Candidate paths:** `site/lib/observability/metrics.ts`, a focused server-only AI metrics module under `site/lib/observability/`, approved catalog/Planner route or helper instrumentation points, and deterministic fixtures/tests under `tests/unit/` and `tests/e2e/`.
    - **Implementation intent:** emit aggregate counters/histograms only for grounded-catalog accuracy, structured-response validity, fallback/degraded visibility, latency, error class, approved provider selection, and retrieval-source contribution. Construct representative catalog and Planner scenarios plus unavailable-provider, malformed-output, retrieval-failure, timeout, authorization, CSRF, and rate-limit cases. Exclude prompts containing personal data, provider keys, raw session identifiers, and model response bodies from metrics.
    - **Test / validation intent:** use fixture-driven unit/property tests to check metric labels/cardinality and that schema validity, catalog grounding, fallback visibility, provider selection, and retrieval contribution are measured without sensitive payloads. Treat any integration/E2E/retrieval evaluation as pending until exact command authorization and hook permission; do not make a provider call solely for metrics evaluation.
    - **Prerequisites / owner gates:** Task 0.4 evaluation-threshold decision and Task 0.3 privacy/data-policy decision; relevant route/retrieval/provider implementation approved; exact write scope. Numeric targets must be owner-approved or explicitly recorded as having no fixed target.
    - _Expected_Behavior: observations are aggregate and privacy-safe, cover the approved scenarios, and distinguish a degraded/fallback response from successful authoritative-looking output._
    - _Preservation: existing OpenTelemetry/Prometheus plumbing, catalog response contracts, secret boundary, and advisory-only behavior remain unchanged unless separately approved._
    - _Requirements: 1.6, 2.1, 2.6, 2.7, 2.9, 2.10, 3.1, 3.2, 3.4, 3.6, 3.7_

  - [x] 3.5 Complete the package decision gate and preserve the minimal-churn recommendation
    - **Candidate paths:** the approved decision record; root `package.json` and lockfile only if the owner later approves a named package at an exact version; package-specific tests only if a package change is separately approved.
    - **Implementation intent:** review each direct AI/retrieval dependency and any shortlisted alternative against official-source/license evidence, compatibility with the repository's Node.js/Next.js 16/React 19/TypeScript context, active source usage, supply-chain/transitive risk, provider/data/cost impact, migration complexity, and rollback feasibility. Maintain the current minimal-churn recommendation—retain/reconfigure existing packages rather than change them—unless a documented owner decision supersedes it.
    - **LanceDB verification:** complete Task 0.5 as evidence collection. Treat the manifest-versus-registry question as unresolved until verified; do not use it as a claim that a package is broken or as justification for a package operation.
    - **Test / validation intent:** use the governance property from Task 1 to assert that a proposed package/provider mutation has a named approver, exact pin, compatibility/supply-chain review, migration, and rollback before a manifest/lockfile edit. No install, update, lockfile generation, registry mutation, or provider call occurs under this task without separate approval.
    - **Prerequisites / owner gates:** Tasks 0.5 and 0.6; exact evidence-gathering approval; for any package change, a separate explicit approval naming `package@exact-version`, affected manifest/lockfile paths, migration, rollback, and validation scope.
    - _Bug_Condition: a direct AI/retrieval package or provider changes without an approved comparison recommendation and exact pin._
    - _Expected_Behavior: unapproved changes stop; an approved change has a package-specific decision, compatibility and supply-chain evidence, reversible migration, and rollback plan before files change._
    - _Preservation: package declarations, lockfile, dependencies, secrets, provider configuration, and unrelated runtime behavior remain unchanged when no exact change is approved._
    - _Requirements: 1.2, 1.7, 2.2, 2.8, 2.9, 2.10, 3.6, 3.7_

  - [x] 3.6 Evaluate optional AI Gateway, remote-vector, or pgvector spikes only as separately approved work
    - **Candidate paths:** the approved decision record and a separately owner-approved spike plan; no production source, package, configuration, migration, or deployment path is in scope by default.
    - **Implementation intent:** answer only the bounded decision question selected in Task 0.6—for example, whether an alternative can satisfy the approved provider/retrieval contract with lower operational risk—then recommend retain, defer, or a separately scoped migration. Do not treat a comparison as approval to adopt the alternative.
    - **Test / validation intent:** define a non-production evidence method before work begins. Any proof requiring a package install, provider call, remote store, migration, build, or deployment needs its own exact authorization and hook permission.
    - **Prerequisites / owner gates:** an explicit Task 0.6 selection, approved hypothesis/success criterion, candidate paths, data boundary, cost owner, rollback plan, and stopping rule. Absence of this approval means this task remains deferred.
    - _Requirements: 2.2, 2.5, 2.6, 2.8, 2.9, 2.10, 3.6, 3.7_

  - [x] 3.7 Verify the same bug-condition exploration property now passes
    - **Property 1: Expected Behavior** - Safe, contract-conforming AI delivery remediation
    - **IMPORTANT:** re-run the same property tests from Task 1; do not replace them with new passing tests. Apply only to the approved implementation branches and report deferred branches as pending rather than passing.
    - **Expected outcome:** the approved Planner contract/path, production no-local-write capability, and package/provider governance assertions pass; actual provider/remote-store reachability remains outside this property unless separately authorized.
    - **Prerequisites / owner gates:** relevant implementation tasks complete; exact test command authorization; hook permission; no provider network call.
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [x] 3.8 Verify the same preservation properties still pass
    - **Property 2: Preservation** - Existing catalog safety, degraded behavior, INR discipline, and retrieval separation
    - **IMPORTANT:** re-run the same tests from Task 2; do not write new preservation tests to mask a regression. Compare against the observation-first baseline and identify any intentional, owner-approved difference explicitly.
    - **Expected outcome:** existing catalog advisory-only behavior, boundary controls, deterministic fallback, INR discipline, known-product normalization, dev-mode baseline, and Orama/Fuse separation remain intact.
    - **Prerequisites / owner gates:** relevant implementation tasks complete; exact test command authorization; hook permission; no provider network call.
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

## Checkpoint, rollout, rollback, and final decision handoff

- [x] 4. Checkpoint — complete only authorized validation and release decision work
  - **Prerequisites / owner gates:** Tasks 3.7 and 3.8 have observed results for every approved implementation branch. Each validation command, configuration action, provider call, package action, migration, build, browser run, or deployment remains separately owner-authorized and hook-permitted. No deployment is authorized by this task list.
  - **Completion rule:** do not mark this checkpoint complete merely because a plan exists. Every unrun check remains pending; any failure is a scope-limited fix, an owner decision, or an evidenced blocker handled under repository policy.
  - _Requirements: 2.7, 2.9, 2.10, 3.6, 3.7_

  - [x] 4.1 Build the exact validation matrix for the approved changed surface
    - **Candidate paths/evidence:** changed source/test paths only, plus the approved decision record and observed command output captured through repository-approved evidence handling.
    - **Validation intent:** sequence source-level review; targeted type and lint checks; targeted unit and property tests; focused integration tests; retrieval evaluation; security/privacy review; and, only if the relevant surface changed and the owner authorizes it, controlled browser/E2E coverage such as the Planner-assist workflow. Confirm fork-boundary review when Planner/Studio source changes; do not run a command merely because it appears in this plan.
    - **Owner gate:** select each exact root-level `pnpm` command only after current-session authorization and hook permission. `typecheck:scripts` is not a valid proposed check because its configuration is unavailable. Full gates, builds, provider calls, package actions, migrations, and deployments are excluded unless explicitly authorized.
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 4.2 Prepare a controlled rollout decision without deploying by default
    - **Candidate paths:** owner-approved runtime/configuration locations only; possible flags named in the design (`PLANNER_ADVISOR_ENABLED`, `LANCE_DB_URI`) are proposals and must not be assumed to exist.
    - **Implementation intent:** document the exact feature-flag state, rollout audience, monitoring window, fallback/degraded visibility, owner, and stop condition for any approved Planner route, retrieval mode, provider policy, or metrics change. Keep the route disabled or the retrieval mode degraded until the owner approves the relevant runtime configuration.
    - **Validation intent:** confirm the rollout plan maps each enabled capability to its Property 1/Property 2 evidence and privacy/security review. Do not claim a configuration is set, a flag is live, or a deployment occurred without observed authorized evidence.
    - **Prerequisites / owner gates:** final owner approval for every configuration path and deployment action; no automatic deployment, secret change, or provider activation.
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.9, 2.10, 3.1, 3.2, 3.4, 3.6, 3.7_

  - [x] 4.3 Confirm reversible rollback and recovery instructions for the exact approved change set
    - **Candidate paths/evidence:** approved decision record, changed source/configuration/package paths, and an owner-approved recovery record if needed.
    - **Implementation intent:** map each applied change to a reversible action: Planner route/flag disablement; remote-vector configuration removal returning to lexical/catalog-only degraded behavior; remote-only index recovery through the approved mechanism; provider-allowlist rollback; metrics removal; and, only if a package change was approved, manifest/lockfile reversion to the previously approved exact pin. Do not perform these actions under this planning task.
    - **Validation intent:** review that rollback never reintroduces a production local filesystem write, bypasses security controls, exposes secrets, or auto-applies AI output. Label any untested recovery as unverified.
    - **Prerequisites / owner gates:** exact applied-change inventory and owner-approved rollback authority; package/configuration/index actions require separate exact approval.
    - _Requirements: 2.4, 2.5, 2.6, 2.8, 2.9, 2.10, 3.2, 3.4, 3.6, 3.7_

  - [x] 4.4 Produce the final decision and release handoff for the Repository Owner
    - **Candidate artifact:** the owner-approved decision/validation record; no release report, deployment record, or claim of production behavior is created by default.
    - **Handoff intent:** state changed paths, unchanged paths, observed validation evidence with exact commands and outcomes, pending validations, Property 1 and Property 2 status, metric/threshold decision, package decision status, unresolved owner decisions, rollback/recovery readiness, security/privacy findings, and an explicit owner go/no-go/hold decision. State `not deployed` unless an authorized deployment has an observed result.
    - **Prerequisites / owner gates:** all applicable approved validation evidence; owner review of every unresolved decision and release boundary. If a true blocker is evidenced, follow the repository blocker process rather than creating a competing report.
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

## Correctness-property coverage

| Correctness property from the design | Planned coverage | Primary tasks |
|---|---|---|
| Property 1 — safe, contract-conforming AI delivery for bug-condition inputs | Pre-fix counterexamples, then the same assertions after only approved fixes | 1, 3.1–3.5, 3.7 |
| Property 2 — preservation for non-bug-condition inputs | Observation-first baseline, then the same properties after implementation | 2, 3.1–3.4, 3.8 |
| No production disk writes | Property tests over non-remote production configurations with filesystem seams | 1, 3.2, 3.7 |
| Deterministic degraded behavior | Fixture/property coverage for unavailable provider/retrieval behavior and visible flags | 2, 3.1–3.3, 3.8 |
| Catalog grounding | Generated catalog/request fixtures assert normalized known-product references | 2, 3.1, 3.4, 3.8 |
| Provider allowlisting and data minimization | Generated allowlist/key/payload combinations with mocked factories | 3.3, 3.7 |
| Independent contract normalization | Planner and catalog schema/property coverage remain separate | 1, 2, 3.1, 3.7, 3.8 |
| Retrieval fallback ordering and deduplication | Generated catalog/query fixtures cover vector → lexical → catalog-order and slug deduplication | 2, 3.2, 3.8 |
| Package approval and pinning | Governance property checks decision record before any proposed package mutation | 1, 3.5, 3.7 |
| Evidence honesty | Decision record and handoff distinguish observed, unverified, pending, and owner-approved states | 0, 1, 4.4 |

## Requirements traceability

| Requirement | Planned task coverage |
|---|---|
| 1.1 | 0, 1 |
| 1.2 | 0, 1, 3.5 |
| 1.3 | 0.1, 1, 3.1 |
| 1.4 | 0.2, 1, 3.2 |
| 1.5 | 0.2, 1, 3.2 |
| 1.6 | 0.3–0.4, 1, 3.3–3.4 |
| 1.7 | 0.5, 1, 3.5 |
| 2.1 | 0, 1, 3, 3.4, 4.4 |
| 2.2 | 0, 1, 3.5, 4.4 |
| 2.3 | 0.1, 1, 3.1, 4.1–4.2 |
| 2.4 | 0.2, 1, 3.2, 4.2–4.3 |
| 2.5 | 0.2, 1, 3.2, 4.1–4.3 |
| 2.6 | 0.3, 1, 3.1, 3.3–3.4, 4.2–4.3 |
| 2.7 | 0.4, 1, 3.3–3.4, 4.1–4.2 |
| 2.8 | 0.3, 0.5, 1, 3.3, 3.5, 4.1, 4.3 |
| 2.9 | 0, 1, 3.1–3.6, 4.1–4.4 |
| 2.10 | 0, 1, 3.1–3.6, 4.1–4.4 |
| 3.1 | 2, 3.1, 3.3–3.4, 3.8, 4.1–4.2 |
| 3.2 | 2, 3.1–3.4, 3.8, 4.2–4.3 |
| 3.3 | 2, 3.3, 3.8, 4.1 |
| 3.4 | 2, 3.1, 3.3–3.4, 3.8, 4.1–4.3 |
| 3.5 | 2, 3.2, 3.8, 4.1 |
| 3.6 | 0, 2, 3.1–3.6, 3.8, 4.1–4.4 |
| 3.7 | 0, 2, 3.1–3.6, 3.8, 4.1–4.4 |

## Final decision criteria

The Repository Owner may make a later release decision only when the approved scope has an evidenced decision record; required owner decisions are resolved or explicitly deferred; the same Property 1 and Property 2 tests have their authorized observed outcomes; required privacy/security and retrieval evaluations are complete or honestly pending; rollback/recovery is documented for the exact applied changes; and no unapproved package, secret, configuration, migration, provider, or deployment action has been performed. This task list alone does not satisfy any of those criteria.

