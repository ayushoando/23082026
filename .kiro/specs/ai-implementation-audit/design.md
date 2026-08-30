# Design Document

## Overview

This feature audits and remediates the server-side AI stack under `site/lib/ai/mastra/` and its route surface, builds the missing `POST /api/planner/ai-advisor` route, and wires the AI routes into the existing Prometheus and OpenTelemetry observability. The work is grounded in the real modules that already exist:

- Provider routing: `site/lib/ai/mastra/providers.ts` (`resolveAdvisorModelChain`, `toMastraModel`).
- Model invocation: `site/lib/ai/mastra/requestAdvisorText.ts` (`requestAdvisorText`, `requestAdvisorMessages`).
- Retrieval: `site/lib/ai/mastra/catalogRetrieval.ts` (`retrieveCatalogProducts`), backed by `catalogRag.ts` (LanceDB vector) and `catalogLocalSearch.ts` (Orama lexical).
- Existing route reference: `site/app/api/ai-advisor/route.ts` (`handleCatalogAdvisor`, `withAuth` wrapper).
- Planner client contract: `site/lib/ai/mastra/plannerAdvisorClient.ts` (`PlannerAdvisorResponse`, `PLANNER_ADVISOR_API_PATH`).
- Shared API primitives: `withAuth`, `success`/`error`/`validationError`, `PlannerAdvisorRequestSchema`.
- Observability: `site/lib/observability/metrics.ts` (`getMetricsRegistry`) and `site/instrumentation.ts` (`registerOTel` via `@vercel/otel`).

The deliverable is sequenced by finding severity. Changes to providers, packages, model identifiers, prompts, route contracts, authentication, retrieval ranking, LanceDB behavior, and database writes are approval-gated; secrets and model identifiers stay server-side.

### Scope Boundaries

- **In scope (non-gated):** the new planner route wiring using existing patterns, an observability adapter that reuses the existing registry and OTel registration, bug fixes that do not alter contracts, and documentation of findings.
- **Approval-gated:** any edit to `providers.ts` chain composition, model ids, prompts in `route.ts`, retrieval ranking in `catalogRetrieval.ts`, LanceDB indexing in `catalogRag.ts`, `withAuth` auth rules, or Supabase writes.
- **Preserved contracts:** the Catalog_Advisor_Route response fields (`recommendations`, `summary`, `totalBudget`, `nextActions`, `warnings`, `pricingMode`, `fallbackUsed`) and the `PlannerAdvisorResponse` shape (`content`, `suggestion?`, `degraded?`, `provider?`, `layout?`).

## Architecture

### Audit Pipeline

```
AI_Stack modules ──▶ Auditor ──▶ Findings[] ──▶ sequenceBySeverity() ──▶ Remediation queue
                        │                                                     │
                        └── classifyChangeClass() ──▶ approvalGated? ──────────┘
                                                          │
                                          gated ──▶ present for approval, defer
                                       non-gated ──▶ apply fix
```

The Auditor inspects seven dimensions (correctness, provider routing, retrieval quality, error handling, observability, route contracts, performance). Each observation becomes a `Finding` record with severity, file location, and evidence. Findings are ordered by descending severity to form the remediation queue; any finding whose change touches an approval-gated class is flagged and deferred until approval.

### Runtime Request Flow (both advisor routes)

```
Request ──▶ withAuth (rate limit ▸ CSRF ▸ guest auth)
              │
              ▼
        parse + validate body (Zod)  ──invalid──▶ 400 validationError
              │ valid
              ▼
        resolveAdvisorModelChain()  ──▶ [gemini, openrouter, openrouter-backup, openai, bedrock] ∩ configured
              │
              ▼
        retrieveCatalogProducts(query, products, limit)   (catalog route grounding)
              │
              ▼
        for target in chain: requestAdvisorText(...) ──usable──▶ build success response
              │ all unusable / errored
              ▼
        Heuristic_Fallback (fallbackUsed = true)
              │
              ▼
        observability adapter: metrics + OTel span (provider, fallback, retrieval layer, latency, error)
              │
              ▼
        stream ? NDJSON Response : success() envelope
```

## Components and Interfaces

### 1. Audit model (`Finding`)

An internal, documentation-level type used to record and sequence findings. It is not part of any HTTP contract.

```typescript
type Severity = "critical" | "high" | "medium" | "low";

type AuditDimension =
  | "correctness"
  | "provider-routing"
  | "retrieval-quality"
  | "error-handling"
  | "observability"
  | "route-contract"
  | "performance";

/** A change class that requires explicit approval before application. */
type ApprovalGatedClass =
  | "provider"
  | "package"
  | "model-id"
  | "prompt"
  | "route-contract"
  | "auth-rule"
  | "retrieval-ranking"
  | "lancedb"
  | "db-write";

interface Finding {
  readonly id: string;
  readonly dimension: AuditDimension;
  readonly severity: Severity;
  readonly location: string; // file path + optional line reference
  readonly evidence: string; // observed code/behavior supporting the finding
  readonly changeClass: ApprovalGatedClass | "safe";
}

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

/** Descending-severity ordering, stable within a severity band. */
function sequenceBySeverity(findings: readonly Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity],
  );
}

/** A finding is approval-gated when its change class is not "safe". */
function isApprovalGated(finding: Finding): boolean {
  return finding.changeClass !== "safe";
}
```

### 2. Planner Advisor Route (`site/app/api/planner/ai-advisor/route.ts`)

New route mirroring `handleCatalogAdvisor` in `site/app/api/ai-advisor/route.ts`. It reuses `withAuth` with the same guardrails the catalog route uses (`role: "guest"`, `rateLimit: 5`, `requireCsrf: true`) and a distinct rate-limit scope.

```typescript
export const POST = withAuth(
  async (req, auth) => handlePlannerAdvisor(req as NextRequest, auth),
  { role: "guest", rateLimitScope: "planner-ai-advisor", rateLimit: 5, requireCsrf: true },
);
```

Request validation uses the existing `PlannerAdvisorRequestSchema` (already defined in `schemas.ts`), which enforces `messages` (1–20, each with a valid role and 1–2000 char content), optional `mode` (`chat` | `space-suggest`), and optional `context`. A failed parse returns `validationError(parsed.error.issues)` → HTTP 400.

The handler produces a `PlannerAdvisorResponse`-shaped body. On the non-streaming path it uses the `success()` envelope (`{ success: true, content, suggestion?, degraded?, provider?, layout? }`) so `callPlannerAdvisor` reads top-level fields exactly as it does today. On the streaming path (`mode`/flag requesting streaming) it returns an `application/x-ndjson` `Response` built with the same `ReadableStream` + `JEST_WORKER_ID` buffering pattern as the catalog route, emitting `status` / `delta` / `result` / `error` events, ending with a terminal `result` event whose payload is the `PlannerAdvisorResponse`.

```typescript
interface PlannerAdvisorResponseBody {
  content: string;                 // required by PlannerAdvisorResponse
  suggestion?: PlannerAdvisorLayoutSuggestion;
  degraded?: boolean;              // true when heuristic fallback used
  provider?: string;              // resolved provider label, never a model id/secret
  layout?: Record<string, unknown>;
}
```

The provider loop and fallback mirror the catalog route: iterate `resolveAdvisorModelChain()`, call `requestAdvisorMessages(target, messages, { signal, stream, onDelta })` under a timeout `AbortController`, take the first usable text, and otherwise return a deterministic heuristic fallback with `degraded: true` (the planner analog of `fallbackUsed: true`).

### 3. Provider chain (`providers.ts`) — audit only, no ranking change

`resolveAdvisorModelChain()` already builds the chain in the required fixed order (Gemini → OpenRouter primary → OpenRouter backup → OpenAI → Bedrock), pushing a target only when its credential(s) resolve. The audit confirms this order and the credential-gated membership. Any change here is approval-gated (`provider` / `model-id`). Model ids and keys are read from `env.server` and never surface in responses — the routes expose only `target.label` (e.g. `"gemini"`, `"openrouter-backup"`, `"bedrock"`).

### 4. Retrieval pipeline (`catalogRetrieval.ts`) — audit only, no ranking change

`retrieveCatalogProducts(query, products, limit)` already implements the required behavior:

- Ordered contribution: vector (`recallVectorProductIds` via LanceDB) → lexical (`recallLexicalSlugs` via Orama) → catalog order.
- Dedupe by slug (`seen` set keyed on `product.slug`).
- Cap at `limit` (the `push` guard `picked.length >= limit`).
- Fail-open: each recall layer catches its own error and returns `[]`, so the tail catalog-order pass always fills results.
- Short query: trimmed length `< 2` returns `products.slice(0, limit)` with `sources: ["catalog-order"]`.

The `sources` array is the signal the observability adapter maps to retrieval-layer metrics. Any change to ranking is approval-gated (`retrieval-ranking`).

### 5. Observability adapter (`site/lib/observability/aiMetrics.ts`, new; non-gated)

A thin adapter that reuses the existing registry from `getMetricsRegistry()` and the existing OTel registration from `instrumentation.ts`. It adds no new infrastructure — only metric instruments registered against the existing Prometheus `register`, and spans from the already-registered tracer.

```typescript
import { getMetricsRegistry } from "@/lib/observability/metrics";
import { Counter, Histogram } from "@prometheus-io/client";
import { trace, SpanStatusCode } from "@opentelemetry/api";

// Registered once against the existing registry (guarded for HMR/global reuse).
// - oando_ai_requests_total{route, provider, fallback}
// - oando_ai_fallback_total{route}
// - oando_ai_retrieval_layer_total{route, layer}
// - oando_ai_request_errors_total{route}
// - oando_ai_request_duration_seconds{route, provider} (histogram)

interface AiRequestObservation {
  route: "catalog" | "planner";
  provider: string;      // label only, e.g. "gemini"; "fallback" when heuristic used
  fallbackUsed: boolean;
  retrievalLayers: readonly ("vector" | "lexical" | "catalog-order")[];
  durationSeconds: number;
  errored: boolean;
}

export async function withAiObservability<T>(
  route: "catalog" | "planner",
  run: () => Promise<{ result: T; observation: Omit<AiRequestObservation, "route" | "durationSeconds" | "errored"> }>,
): Promise<T> {
  const tracer = trace.getTracer("oando-ai");
  return tracer.startActiveSpan(`ai.${route}`, async (span) => {
    const start = performance.now();
    try {
      const { result, observation } = await run();
      recordMetrics({ route, durationSeconds: (performance.now() - start) / 1000, errored: false, ...observation });
      span.setAttribute("ai.provider", observation.provider);
      span.setAttribute("ai.fallback", observation.fallbackUsed);
      span.setAttribute("ai.retrieval_layers", observation.retrievalLayers.join(","));
      return result;
    } catch (err) {
      recordErrorMetrics(route, (performance.now() - start) / 1000);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw err;
    } finally {
      span.end();
    }
  });
}
```

The catalog and planner handlers wrap their core logic in `withAiObservability(...)`, reporting the resolved provider label, whether the heuristic fallback ran, and the retrieval `sources` array. Instruments are created lazily and reused via a module/global guard, matching the pattern in `metrics.ts` (`__oandoPrometheusDefaultsInitialized`).

## Data Models

### PlannerAdvisorRequest (validated)

Validated by `PlannerAdvisorRequestSchema` (existing): `{ mode?: "chat" | "space-suggest", messages: {role, content}[1..20], context? }`.

### PlannerAdvisorResponse (contract with `plannerAdvisorClient.ts`)

`{ content: string, suggestion?, degraded?, provider?, layout? }`, delivered inside the `success()` envelope (non-stream) or as the terminal `result` event payload (stream). `content` is always a string; `callPlannerAdvisor` coerces a missing `content` to `""`, but the route always supplies a string.

### Catalog advisor response (unchanged contract)

`{ recommendations, summary, totalBudget, nextActions, warnings, pricingMode, fallbackUsed }` inside the `success()` envelope — preserved exactly by remediation.

## Error Handling

- **Validation:** invalid bodies return HTTP 400 via `validationError`/`ApiError(VALIDATION_ERROR)`, matching the catalog route.
- **Auth / rate limit / CSRF:** handled by `withAuth` — 401/403/429 envelopes, identical to the catalog route.
- **Provider errors and timeouts:** each provider call runs under an `AbortController` timeout; abort-like and thrown errors are caught per target, logged, and the loop advances to the next target. This preserves the fail-forward behavior in `handleCatalogAdvisor`.
- **No usable provider / empty chain:** the route returns the heuristic fallback with the fallback marker set (`fallbackUsed`/`degraded` = true) instead of erroring.
- **Retrieval errors:** absorbed inside `retrieveCatalogProducts` (fail-open to catalog order); the handler never sees a retrieval throw.
- **Observability failures:** metric/span recording is best-effort and must never change the HTTP outcome; recording is wrapped so an instrument error cannot fail the request.
- **Secret safety:** responses expose provider labels only; api keys and raw model ids are never serialized into any envelope, stream event, or span attribute.

## Testing Strategy

**Dual approach.** Property-based tests (fast-check, ≥100 iterations) cover universal invariants of pure logic — provider-chain resolution, retrieval ranking, response shape, and validation. Example/integration tests cover route wiring, `withAuth` behavior (guest allow, 6th-request 429, missing-CSRF 403), streaming transport, and observability side effects using an inspectable registry and an in-memory span exporter. UI-free server logic keeps DOM out of scope; tests run under the existing Vitest lanes.

Each property test is tagged **Feature: ai-implementation-audit, Property {n}: {property text}** and references the design property it validates.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Remediation ordering is descending by severity

For any list of Findings, the output of `sequenceBySeverity` is ordered so that the severity rank of each element is greater than or equal to the severity rank of every element that follows it.

**Validates: Requirements 1.3**

### Property 2: Approval-gated findings are flagged

For any Finding, `isApprovalGated` returns `true` if and only if the Finding's change class is one of the approval-gated classes (not `"safe"`).

**Validates: Requirements 1.4**

### Property 3: Catalog advisor response retains all contract fields

For any query, optional context, and non-empty product set, every response the Catalog_Advisor_Route builds (provider-success, catalog-unavailable, or heuristic fallback) contains `recommendations`, `summary`, `totalBudget`, `nextActions`, `warnings`, `pricingMode`, and `fallbackUsed` with their expected types.

**Validates: Requirements 2.3**

### Property 4: Planner response conforms to PlannerAdvisorResponse shape

For any outcome the Planner_Advisor_Route returns (streaming terminal `result` event or non-streaming body), `content` is a string, and each optional field (`suggestion`, `degraded`, `provider`, `layout`), when present, matches its declared type.

**Validates: Requirements 3.4, 3.5**

### Property 5: Streaming responses are newline-delimited JSON

For any valid streaming request, every non-empty line emitted by the Planner_Advisor_Route parses as JSON, and the stream ends with a terminal `result` event.

**Validates: Requirements 3.3**

### Property 6: Missing usable provider yields heuristic fallback

For any valid request in which no provider in the Provider_Chain returns a usable response (including an empty chain), the Planner_Advisor_Route returns the Heuristic_Fallback result with its fallback marker set to `true`.

**Validates: Requirements 3.6**

### Property 7: Invalid request bodies are rejected with 400

For any request body that fails `PlannerAdvisorRequestSchema`, the Planner_Advisor_Route returns an HTTP 400 validation-error envelope.

**Validates: Requirements 3.7**

### Property 8: Provider chain is a credential-gated subsequence of the canonical order

For any configuration of provider credentials, the chain returned by `resolveAdvisorModelChain` is a subsequence of the canonical order [gemini, openrouter, openrouter-backup, openai, bedrock], and a target is present if and only if its required credential(s) are configured.

**Validates: Requirements 4.1, 4.2**

### Property 9: Failover advances to the first usable target

For any sequence of provider outcomes, the AI_Stack returns the result of the first target that produces a usable response, skipping all earlier errored or unusable targets; when no target is usable it returns the fallback.

**Validates: Requirements 4.3**

### Property 10: Secrets and model identifiers never leave the server

For any route response (envelope, stream event, or span attribute), the serialized output contains none of the configured provider secrets and no raw model identifier — only provider labels.

**Validates: Requirements 4.4**

### Property 11: Retrieval output is ordered, deduplicated, and capped

For any query of length ≥ 2 and any product set with limit N, the products returned by `retrieveCatalogProducts` have unique slugs, number at most N, and the `sources` array is a subsequence of [vector, lexical, catalog-order].

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 12: Retrieval fails open to catalog order

For any inputs in which one or more recall layers raise an error, `retrieveCatalogProducts` does not throw and returns products in catalog order (up to the limit).

**Validates: Requirements 5.4**

### Property 13: Short queries return catalog order

For any query whose trimmed length is less than 2, `retrieveCatalogProducts` returns `products.slice(0, limit)` with `sources` equal to `["catalog-order"]`.

**Validates: Requirements 5.5**

### Property 14: Requests record provider, fallback, and retrieval-layer metrics

For any AI route request, the observability adapter increments the provider-used counter once with the resolved provider label, increments the fallback counter exactly when the Heuristic_Fallback ran, and records one retrieval-layer metric for each layer present in the retrieval `sources`.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 15: Requests emit a telemetry span with the required attributes

For any AI route request, the emitted Telemetry span carries `provider`, `fallback`, and retrieval-layer attributes reflecting that request's outcome.

**Validates: Requirements 6.5**
