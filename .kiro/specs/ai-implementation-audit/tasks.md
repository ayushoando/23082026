# Implementation Plan: AI Implementation Audit

## Overview

This plan implements the four-part deliverable in severity order: (1) audit the AI stack under `site/lib/ai/mastra/` recording `Finding` records with severity, evidence, and approval-gating classification; (2) safely remediate non-gated findings while preserving the Catalog_Advisor_Route contract and deferring approval-gated changes; (3) build the missing `POST /api/planner/ai-advisor` route mirroring `site/app/api/ai-advisor/route.ts`; and (4) wire both advisor routes into the existing Prometheus registry and `@vercel/otel` registration through a new observability adapter. Property-based and example/integration tests validate the 15 correctness properties and route/transport/observability behavior under the existing Vitest lanes.

All code is TypeScript with named exports. Tests live under `tests/`. Commands run via `pnpm` from the repository root. No new provider, package, model id, prompt, retrieval-ranking, auth-rule, LanceDB, or db-write change is applied without approval.

## Tasks

- [x] 1. Audit model and severity/gating logic
  - [x] 1.1 Implement the `Finding` audit model and sequencing/gating functions
    - Create `site/lib/ai/audit/finding.ts` with named exports: `Severity`, `AuditDimension`, `ApprovalGatedClass`, `Finding` interface, `SEVERITY_RANK`, `sequenceBySeverity`, and `isApprovalGated`
    - `sequenceBySeverity` returns a descending-severity, band-stable ordering; `isApprovalGated` returns true iff `changeClass !== "safe"`
    - Keep this an internal documentation-level model with no HTTP coupling
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Write property test for remediation ordering
    - **Feature: ai-implementation-audit, Property 1: Remediation ordering is descending by severity**
    - Assert each element's severity rank ≥ the rank of every element after it, across arbitrary `Finding` lists (fast-check, ≥100 iterations)
    - **Validates: Requirements 1.3**

  - [x] 1.3 Write property test for approval-gating classification
    - **Feature: ai-implementation-audit, Property 2: Approval-gated findings are flagged**
    - Assert `isApprovalGated` is true iff `changeClass` is a gated class (not `"safe"`)
    - **Validates: Requirements 1.4**

- [ ] 2. Record audit findings with evidence and classification
  - [x] 2.1 Produce the audit findings dataset across all seven dimensions
    - Create `site/lib/ai/audit/findings.ts` exporting `AI_STACK_FINDINGS: readonly Finding[]`, one record per confirmed observation
    - Cover correctness, provider-routing, retrieval-quality, error-handling, observability, route-contract, and performance dimensions, each with `severity`, `location` (file + optional line), and `evidence`
    - Tag each finding's `changeClass` (`safe` vs an approval-gated class) so gated items are flagged for approval and deferred
    - _Requirements: 1.1, 1.2, 1.4, 2.2_

  - [x] 2.2 Write unit tests for the findings dataset invariants
    - Assert every finding has a non-empty `location` and `evidence`, a valid `severity`, and a valid `changeClass`
    - Assert `sequenceBySeverity(AI_STACK_FINDINGS)` groups gated vs non-gated correctly via `isApprovalGated`
    - _Requirements: 1.2, 1.4_

- [x] 3. Checkpoint - audit recorded and sequenced
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Safe remediation of non-gated findings
  - [x] 4.1 Apply non-gated fixes to the catalog advisor path while preserving its contract
    - Remediate only findings classed `safe` in `site/app/api/ai-advisor/route.ts` and any non-gated helpers, leaving provider ids, prompts, retrieval ranking, auth rules, LanceDB, and db writes untouched
    - Preserve the exact Catalog_Advisor_Route response fields: `recommendations`, `summary`, `totalBudget`, `nextActions`, `warnings`, `pricingMode`, `fallbackUsed`
    - Preserve behavior in modules unrelated to each finding
    - Defer any approval-gated change: surface it for approval, do not apply
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.2 Write property test for catalog contract retention
    - **Feature: ai-implementation-audit, Property 3: Catalog advisor response retains all contract fields**
    - For arbitrary query/context/non-empty product set, assert every built response (provider-success, catalog-unavailable, fallback) contains all seven contract fields with expected types
    - **Validates: Requirements 2.3**

  - [x] 4.3 Write unit tests for unrelated-module preservation
    - Assert remediated modules do not alter exports/behavior of modules unrelated to their findings
    - _Requirements: 2.4_

- [ ] 5. Observability adapter (foundation for route wiring)
  - [x] 5.1 Implement the AI observability adapter reusing the existing registry and OTel tracer
    - Create `site/lib/observability/aiMetrics.ts` exporting `withAiObservability` and an `AiRequestObservation` type
    - Reuse `getMetricsRegistry()` from `site/lib/observability/metrics.ts` and the tracer from the existing `@vercel/otel` registration; add no new infrastructure
    - Register (lazily, HMR/global-guarded) instruments: `oando_ai_requests_total{route,provider,fallback}`, `oando_ai_fallback_total{route}`, `oando_ai_retrieval_layer_total{route,layer}`, `oando_ai_request_errors_total{route}`, and `oando_ai_request_duration_seconds{route,provider}` histogram
    - Emit a span `ai.{route}` with `provider`, `fallback`, and retrieval-layer attributes; make recording best-effort so it never changes the HTTP outcome; expose provider labels only, never secrets or raw model ids
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 5.2 Write property test for metric recording
    - **Feature: ai-implementation-audit, Property 14: Requests record provider, fallback, and retrieval-layer metrics**
    - Using an inspectable registry, assert the provider counter increments once with the resolved label, the fallback counter increments exactly when fallback ran, and one retrieval-layer metric records per layer in `sources`
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [x] 5.3 Write property test for span attributes
    - **Feature: ai-implementation-audit, Property 15: Requests emit a telemetry span with the required attributes**
    - Using an in-memory span exporter, assert every request emits a span carrying `provider`, `fallback`, and retrieval-layer attributes matching the outcome
    - **Validates: Requirements 6.5**

  - [x] 5.4 Write unit tests for latency/error recording and best-effort safety
    - Assert duration and error metrics record per request, and that an instrument error does not propagate to the caller
    - _Requirements: 6.4, 6.6_

- [ ] 6. Planner Advisor Route
  - [x] 6.1 Implement the planner advisor handler and route with withAuth guardrails
    - Create `site/app/api/planner/ai-advisor/route.ts` exporting `POST = withAuth(handlePlannerAdvisor, { role: "guest", rateLimitScope: "planner-ai-advisor", rateLimit: 5, requireCsrf: true })`
    - Mirror `handleCatalogAdvisor`: validate the body with the existing `PlannerAdvisorRequestSchema`, returning `validationError(parsed.error.issues)` → HTTP 400 on failure
    - Iterate `resolveAdvisorModelChain()` calling `requestAdvisorMessages(target, messages, { signal, stream, onDelta })` under an `AbortController` timeout, taking the first usable text; expose only `target.label`
    - _Requirements: 3.1, 3.2, 3.7, 4.1, 4.2, 4.3, 4.4_

  - [~] 6.2 Implement response shaping (streaming and non-streaming) and heuristic fallback
    - Non-streaming: return the `success()` envelope carrying a `PlannerAdvisorResponse` body (`content` string plus optional `suggestion`, `degraded`, `provider`, `layout`)
    - Streaming: return an `application/x-ndjson` `Response` using the same `ReadableStream` + `JEST_WORKER_ID` buffering pattern as the catalog route, emitting `status`/`delta`/`result`/`error` events and ending with a terminal `result` event whose payload is the `PlannerAdvisorResponse`
    - When no provider yields a usable response (including empty chain), return the deterministic Heuristic_Fallback with the fallback marker (`degraded`/`fallbackUsed`) set to `true`
    - _Requirements: 3.3, 3.4, 3.5, 3.6_

  - [ ] 6.3 Wire the planner and catalog handlers through the observability adapter
    - Wrap each handler's core logic in `withAiObservability("planner" | "catalog", ...)`, reporting resolved provider label, whether fallback ran, and the retrieval `sources` array
    - Ensure wrapping does not alter the response body or status of either route
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 6.4 Write property test for planner response shape
    - **Feature: ai-implementation-audit, Property 4: Planner response conforms to PlannerAdvisorResponse shape**
    - For any outcome (streaming terminal `result` or non-streaming body), assert `content` is a string and each present optional field matches its declared type
    - **Validates: Requirements 3.4, 3.5**

  - [x] 6.5 Write property test for NDJSON streaming transport
    - **Feature: ai-implementation-audit, Property 5: Streaming responses are newline-delimited JSON**
    - For valid streaming requests, assert every non-empty line parses as JSON and the stream ends with a terminal `result` event
    - **Validates: Requirements 3.3**

  - [x] 6.6 Write property test for heuristic fallback on no usable provider
    - **Feature: ai-implementation-audit, Property 6: Missing usable provider yields heuristic fallback**
    - For any request where no provider (or empty chain) returns usable text, assert the route returns the Heuristic_Fallback with its marker set to `true`
    - **Validates: Requirements 3.6**

  - [x] 6.7 Write property test for 400 rejection of invalid bodies
    - **Feature: ai-implementation-audit, Property 7: Invalid request bodies are rejected with 400**
    - For any body failing `PlannerAdvisorRequestSchema`, assert an HTTP 400 validation-error envelope
    - **Validates: Requirements 3.7**

  - [x] 6.8 Write property test for secret/model-id non-disclosure
    - **Feature: ai-implementation-audit, Property 10: Secrets and model identifiers never leave the server**
    - For any response (envelope, stream event, span attribute), assert serialized output contains no configured secret and no raw model id — only provider labels
    - **Validates: Requirements 4.4**

  - [x] 6.9 Write integration tests for route wiring and withAuth behavior
    - Assert guest allow, 6th-request 429 for scope `planner-ai-advisor`, and missing-CSRF 403; assert path `/api/planner/ai-advisor` accepts POST
    - Assert observability side effects fire via an inspectable registry and in-memory span exporter without changing status/body
    - _Requirements: 3.1, 3.2, 6.6_

- [ ] 7. Checkpoint - planner route and observability wired
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Provider chain and retrieval audit verification (tests only; changes gated)
  - [x] 8.1 Write property test for credential-gated provider subsequence
    - **Feature: ai-implementation-audit, Property 8: Provider chain is a credential-gated subsequence of the canonical order**
    - For arbitrary credential configs, assert `resolveAdvisorModelChain` output is a subsequence of [gemini, openrouter, openrouter-backup, openai, bedrock] and a target is present iff its credentials are configured
    - **Validates: Requirements 4.1, 4.2**

  - [x] 8.2 Write property test for failover to first usable target
    - **Feature: ai-implementation-audit, Property 9: Failover advances to the first usable target**
    - For arbitrary provider-outcome sequences, assert the stack returns the first usable target's result, skipping earlier errored/unusable targets, else the fallback
    - **Validates: Requirements 4.3**

  - [x] 8.3 Write property test for ranked, deduplicated, capped retrieval
    - **Feature: ai-implementation-audit, Property 11: Retrieval output is ordered, deduplicated, and capped**
    - For queries of length ≥ 2 and limit N, assert unique slugs, at most N results, and `sources` is a subsequence of [vector, lexical, catalog-order]
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 8.4 Write property test for fail-open retrieval
    - **Feature: ai-implementation-audit, Property 12: Retrieval fails open to catalog order**
    - For inputs where one or more recall layers throw, assert `retrieveCatalogProducts` does not throw and returns catalog-order products up to the limit
    - **Validates: Requirements 5.4**

  - [x] 8.5 Write property test for short-query catalog order
    - **Feature: ai-implementation-audit, Property 13: Short queries return catalog order**
    - For any trimmed query of length < 2, assert the return equals `products.slice(0, limit)` with `sources` equal to `["catalog-order"]`
    - **Validates: Requirements 5.5**

- [ ] 9. Final checkpoint - full validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP.
- The design includes a Correctness Properties section, so property-based tests (fast-check, ≥100 iterations) are included for all 15 properties, complemented by example/integration tests for route wiring, `withAuth`, streaming transport, and observability side effects.
- Provider-chain and retrieval-pipeline behavior (Properties 8, 9, 11, 12, 13) is verified by tests only; any change to their ranking/composition is approval-gated and deferred (Requirements 2.2).
- Each task references the specific requirements and/or design properties it implements.
- Secrets and raw model identifiers stay server-side; routes expose only provider labels.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "4.1", "5.2", "5.3", "5.4"] },
    { "id": 3, "tasks": ["4.2", "4.3", "6.1"] },
    { "id": 4, "tasks": ["6.2"] },
    { "id": 5, "tasks": ["6.3"] },
    { "id": 6, "tasks": ["6.4", "6.5", "6.6", "6.7", "6.8", "6.9", "8.1", "8.2", "8.3", "8.4", "8.5"] }
  ]
}
```
