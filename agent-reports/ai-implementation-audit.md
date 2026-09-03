# AI Implementation Audit: Specification, Design & Execution Record

## Overview

This document consolidates the complete requirements, technical architecture, and execution record for auditing and remediating the server-side AI advisor stack under `site/lib/ai/mastra/` and its live route surface, building the `POST /api/Planner/ai-advisor` route, and wiring both advisor routes into the existing Prometheus and OpenTelemetry observability infrastructure.

---

## 1. Requirements

### Requirement 1: Audit Model and Severity/Gating Logic
- **1.1** The AI stack audit shall classify findings across seven dimensions: `correctness`, `provider-routing`, `retrieval-quality`, `error-handling`, `observability`, `route-contract`, and `performance`.
- **1.2** Each finding record shall include an identifier, dimension, severity (`critical` > `high` > `medium` > `low` > `info`), location, evidence excerpt, and change class.
- **1.3** Remediation ordering must sort by descending severity rank.
- **1.4** Any change touching an approval-gated class (`provider`, `package`, `model-id`, `prompt`, `route-contract`, `auth-rule`, `retrieval-ranking`, `lancedb`, `db-write`) must be flagged and deferred until explicit approval.

### Requirement 2: Safe Remediation of Non-Gated Findings
- **2.1** Remediations must apply only to non-gated findings.
- **2.2** The 7 required fields of the Catalog Advisor response (`recommendations`, `summary`, `totalBudget`, `nextActions`, `warnings`, `pricingMode`, `fallbackUsed`) must be strictly preserved across all outcomes.
- **2.3** Unrelated modules must remain unmodified.

### Requirement 3: Planner AI Advisor Route
- **3.1** The Planner Advisor Route shall accept `POST` requests at `/api/Planner/ai-advisor`.
- **3.2** Apply guest authentication, rate limiting (outer 5/min, inner guest 2/min), and CSRF protection through the Planner request pipeline.
- **3.3** When `stream: true`, return an `application/x-ndjson` stream emitting `status`, `delta`, and terminal `result` events.
- **3.4** When `stream: false`, return a standard JSON success envelope matching `PlannerAdvisorResponse` (`content`, optional `degraded`, `provider`).
- **3.5** If all providers fail or the chain is empty, return a deterministic heuristic fallback with `degraded: true`.
- **3.6** Invalid request bodies must be rejected with HTTP 400 validation errors.

### Requirement 4: Provider Chain and Credential Gating
- **4.1** The provider chain must resolve available targets in fixed canonical order: Gemini $\to$ OpenRouter primary $\to$ OpenRouter backup $\to$ OpenAI $\to$ Bedrock.
- **4.2** Providers without configured credentials must be omitted from the active chain.
- **4.3** On provider failure/timeout (10-second timeout), failover must advance to the next configured target.
- **4.4** Secrets and raw model identifiers must remain server-side; client responses and metrics expose only provider labels.

### Requirement 5: Ranked, Deduplicated, Fail-Open Retrieval Pipeline
- **5.1** Retrieval pipeline ranks contributions in order: LanceDB vector recall $\to$ Orama lexical search $\to$ catalog order.
- **5.2** Products contributed across layers must be deduplicated by `slug` and capped at the requested limit.
- **5.3** If a retrieval layer throws, the pipeline fails open to catalog order without crashing.
- **5.4** Queries shorter than 2 characters bypass vector search and return catalog order.

### Requirement 6: AI Observability Wiring
- **6.1** Record provider selection, fallback usage, retrieval layer contributions, latency, and error classes via the Prometheus `Metrics_Registry`.
- **6.2** Emit OpenTelemetry spans carrying provider, fallback, and retrieval layer attributes.
- **6.3** Observability recording must be best-effort and fail-safe: metrics failures must never fail the HTTP response.

---

## 2. Technical Architecture & Design

### Request Flow Diagram

```
Client Request
    │
    ▼
Pipeline Authentication & Guardrails (CSRF ▸ Rate Limiting ▸ Guest Session)
    │
    ▼
Zod Validation (PlannerAdvisorRequestSchema / CatalogAdvisorRequestSchema)
    │
    ▼
resolveAdvisorModelChain() ──▶ [Gemini, OpenRouter, OpenRouter-Backup, OpenAI, Bedrock] ∩ Configured
    │
    ▼
Grounding Retrieval (LanceDB Vector ──▶ Orama Lexical ──▶ Catalog Order Tail)
    │
    ▼
Target Iteration: requestAdvisorMessages / requestAdvisorRawResponse (10s Timeout)
    │
    ├─► Usable Response ──▶ Build Success Result
    │
    └─► All Failed / Empty Chain ──▶ Heuristic Fallback (degraded: true)
    │
    ▼
recordAdvisorRequest / withAiObservability (Prometheus Metrics & OTel Spans)
    │
    ▼
Response Delivery (stream ? application/x-ndjson : JSON Success Envelope)
```

---

## 3. Completed Implementation & Verification Record

All tasks across the specification have been fully implemented and verified against the live codebase:

| Task | Description | Status | Live File Reference |
|---|---|---|---|
| **1.1** | Audit Finding model & sequencing | Completed | [`site/lib/ai/audit/finding.ts`](file:///d:/23082026/site/lib/ai/audit/finding.ts) |
| **1.2** | Property 1: Remediation descending ordering | Verified | [`tests/unit/lib/ai/audit/finding.property.test.ts`](file:///d:/23082026/tests/unit/lib/ai/audit/finding.property.test.ts) |
| **1.3** | Property 2: Approval-gated classification | Verified | [`tests/unit/lib/ai/audit/finding.property.test.ts`](file:///d:/23082026/tests/unit/lib/ai/audit/finding.property.test.ts) |
| **2.1** | Audit findings dataset (7 dimensions) | Completed | [`site/lib/ai/audit/findings.ts`](file:///d:/23082026/site/lib/ai/audit/findings.ts) |
| **2.2** | Findings dataset invariant tests | Verified | [`tests/unit/lib/ai/audit/findings.test.ts`](file:///d:/23082026/tests/unit/lib/ai/audit/findings.test.ts) |
| **4.1** | Safe non-gated catalog fixes & contract | Completed | [`site/app/api/ai-advisor/route.ts`](file:///d:/23082026/site/app/api/ai-advisor/route.ts) |
| **4.2** | Property 3: Catalog advisor contract retention | Verified | [`tests/unit/app/api/ai-advisor/catalogContract.property.test.ts`](file:///d:/23082026/tests/unit/app/api/ai-advisor/catalogContract.property.test.ts) |
| **5.1** | AI observability adapter (`aiMetrics.ts`) | Completed | [`site/lib/observability/aiMetrics.ts`](file:///d:/23082026/site/lib/observability/aiMetrics.ts) |
| **5.2** | Property 14: Provider, fallback & retrieval metrics | Verified | [`tests/unit/lib/observability/aiObservability.property.test.ts`](file:///d:/23082026/tests/unit/lib/observability/aiObservability.property.test.ts) |
| **5.3** | Property 15: OTel span attributes | Verified | [`tests/unit/lib/observability/aiObservability.property.test.ts`](file:///d:/23082026/tests/unit/lib/observability/aiObservability.property.test.ts) |
| **6.1** | Planner Advisor route handler with pipeline | Completed | [`site/app/api/Planner/ai-advisor/route.ts`](file:///d:/23082026/site/app/api/Planner/ai-advisor/route.ts) |
| **6.2** | Response shaping (NDJSON stream & non-stream fallback) | Completed | [`site/app/api/Planner/ai-advisor/route.ts`](file:///d:/23082026/site/app/api/Planner/ai-advisor/route.ts) |
| **6.3** | Observability wiring (both routes, streaming & non-streaming) | Completed | [`site/app/api/Planner/ai-advisor/route.ts`](file:///d:/23082026/site/app/api/Planner/ai-advisor/route.ts), [`site/app/api/ai-advisor/route.ts`](file:///d:/23082026/site/app/api/ai-advisor/route.ts) |
| **6.4** | Property 4: Planner response shape | Verified | [`tests/unit/app/api/Planner/ai-advisor/plannerAdvisorShape.property.test.ts`](file:///d:/23082026/tests/unit/app/api/Planner/ai-advisor/plannerAdvisorShape.property.test.ts) |
| **6.5** | Property 5: NDJSON streaming transport | Verified | [`tests/unit/app/api/Planner/ai-advisor/plannerAdvisorStreaming.property.test.ts`](file:///d:/23082026/tests/unit/app/api/Planner/ai-advisor/plannerAdvisorStreaming.property.test.ts) |
| **6.6** | Property 6: Heuristic fallback on missing provider | Verified | [`tests/unit/app/api/Planner/ai-advisor/plannerAdvisorFallback.property.test.ts`](file:///d:/23082026/tests/unit/app/api/Planner/ai-advisor/plannerAdvisorFallback.property.test.ts) |
| **6.7** | Property 7: Rejection of invalid bodies (HTTP 400) | Verified | [`tests/unit/app/api/Planner/ai-advisor/plannerAdvisorValidation.property.test.ts`](file:///d:/23082026/tests/unit/app/api/Planner/ai-advisor/plannerAdvisorValidation.property.test.ts) |
| **6.8** | Property 10: Secrets & model IDs non-disclosure | Verified | [`tests/unit/app/api/Planner/ai-advisor/plannerAdvisorSecrets.property.test.ts`](file:///d:/23082026/tests/unit/app/api/Planner/ai-advisor/plannerAdvisorSecrets.property.test.ts) |
| **6.9** | Route wiring and withAuth integration tests | Verified | [`tests/unit/app/api/Planner/ai-advisor/plannerAdvisorWiring.test.ts`](file:///d:/23082026/tests/unit/app/api/Planner/ai-advisor/plannerAdvisorWiring.test.ts) |
| **8.1** | Property 8: Credential-gated provider order | Verified | [`tests/unit/lib/ai/mastra/providerChain.property.test.ts`](file:///d:/23082026/tests/unit/lib/ai/mastra/providerChain.property.test.ts) |
| **8.2** | Property 9: Failover to first usable target | Verified | [`tests/unit/lib/ai/mastra/providerFailover.property.test.ts`](file:///d:/23082026/tests/unit/lib/ai/mastra/providerFailover.property.test.ts) |
| **8.3** | Property 11: Retrieval ordered, deduplicated, capped | Verified | [`tests/unit/lib/ai/mastra/retrievalOrdering.property.test.ts`](file:///d:/23082026/tests/unit/lib/ai/mastra/retrievalOrdering.property.test.ts) |
| **8.4** | Property 12: Fail-open retrieval to catalog order | Verified | [`tests/unit/lib/ai/mastra/retrievalOrdering.property.test.ts`](file:///d:/23082026/tests/unit/lib/ai/mastra/retrievalOrdering.property.test.ts) |
| **8.5** | Property 13: Short queries return catalog order | Verified | [`tests/unit/lib/ai/mastra/retrievalOrdering.property.test.ts`](file:///d:/23082026/tests/unit/lib/ai/mastra/retrievalOrdering.property.test.ts) |

