# Requirements Document

## Introduction

This feature covers a full audit and remediation of the server-side AI stack under `site/lib/ai/mastra/` and its route surface. The AI stack combines Mastra orchestration, a provider routing chain (Gemini, OpenRouter primary, OpenRouter backup, OpenAI, Bedrock), a layered retrieval pipeline (LanceDB vector recall, Orama lexical search, catalog-order tail filler), and the deterministic heuristic fallback used when providers are unavailable.

The deliverable has four parts, treated with equal weight and sequenced by severity of findings:

1. A full audit of the AI stack across correctness, provider routing, retrieval quality, error handling, observability, route contracts, and performance.
2. Remediation of every confirmed finding, with risky changes flagged for approval before they are applied.
3. Construction of the missing `POST /api/planner/ai-advisor` route that `plannerAdvisorClient.ts` already calls, mirroring the patterns in `site/app/api/ai-advisor/route.ts`.
4. Wiring of the AI route surface into the existing Prometheus and OpenTelemetry observability, with no new infrastructure.

Changes to providers, packages, model identifiers, prompts, route contracts, authentication, retrieval ranking, LanceDB behavior, and database writes are approval-gated. Secrets and model identifiers remain server-side.

## Glossary

- **AI_Stack**: The server-side AI modules under `site/lib/ai/mastra/` together with the API routes that consume them.
- **Auditor**: The process that inspects the AI_Stack and records findings with severity, location, and evidence.
- **Provider_Chain**: The ordered set of language-model targets resolved by `resolveAdvisorModelChain`, in the order Gemini, OpenRouter primary, OpenRouter backup, OpenAI, Bedrock.
- **Retrieval_Pipeline**: The `retrieveCatalogProducts` layered recall of LanceDB vector, then Orama lexical, then catalog order.
- **Catalog_Advisor_Route**: The existing endpoint `POST /api/ai-advisor` implemented in `site/app/api/ai-advisor/route.ts`.
- **Planner_Advisor_Route**: The endpoint `POST /api/planner/ai-advisor` consumed by `plannerAdvisorClient.ts`, to be built by this feature.
- **Planner_Advisor_Client**: The browser client `site/lib/ai/mastra/plannerAdvisorClient.ts` that calls the Planner_Advisor_Route.
- **Planner_Advisor_Request**: A request body consumed by the Planner_Advisor_Route that includes an optional boolean `stream` field controlling the response transport.
- **Heuristic_Fallback**: The deterministic, provider-independent result path used when no provider returns a usable response; Catalog_Advisor_Route results mark the fallback with `fallbackUsed` set to `true`, and Planner_Advisor_Route results mark the fallback with `degraded` set to `true`.
- **Metrics_Registry**: The Prometheus registry exposed by `site/lib/observability/metrics.ts`.
- **Telemetry**: The OpenTelemetry registration via `@vercel/otel` in `site/instrumentation.ts`.
- **Approval_Gate**: The requirement that a change class be presented for explicit user approval before it is applied.
- **Approval_Gated_Change**: A change to a provider, package, model identifier, prompt, route contract, authentication rule, retrieval ranking, LanceDB behavior, or database write.
- **Finding**: A recorded audit observation with a severity, a location, and supporting evidence.
- **Severity**: A ranked classification of a Finding used to sequence remediation.

## Requirements

### Requirement 1: Full AI Stack Audit with Severity and Evidence

**User Story:** As a maintainer, I want a full audit of the AI stack recorded with severity and evidence, so that remediation can be sequenced by impact.

#### Acceptance Criteria

1. THE Auditor SHALL inspect the AI_Stack across correctness, provider routing, retrieval quality, error handling, observability, route contracts, and performance.
2. WHEN the Auditor records a Finding, THE Auditor SHALL include a Severity, a file location, and supporting evidence for that Finding.
3. THE Auditor SHALL sequence remediation of recorded Findings in order of descending Severity.
4. WHERE a Finding concerns an Approval_Gated_Change, THE Auditor SHALL flag that Finding for approval before the corresponding change is applied.

### Requirement 2: Safe Remediation of Confirmed Findings

**User Story:** As a maintainer, I want confirmed findings remediated safely, so that fixes do not introduce unreviewed risk.

#### Acceptance Criteria

1. WHEN a Finding is not an Approval_Gated_Change, THE AI_Stack SHALL be updated to resolve that Finding.
2. IF a proposed change is an Approval_Gated_Change, THEN THE Auditor SHALL present that change for approval and SHALL defer application until approval is granted.
3. THE AI_Stack SHALL retain the existing Catalog_Advisor_Route contract fields `recommendations`, `summary`, `totalBudget`, `nextActions`, `warnings`, `pricingMode`, and `fallbackUsed` after remediation.
4. WHEN remediation modifies a module, THE AI_Stack SHALL preserve behavior in modules unrelated to the Finding.

### Requirement 3: Missing Planner Advisor Route

**User Story:** As a Planner user, I want the missing planner advisor route to exist, so that the planner advisor client receives valid responses instead of failures.

#### Acceptance Criteria

1. THE Planner_Advisor_Route SHALL accept `POST` requests at the path `/api/planner/ai-advisor`.
2. WHEN the Planner_Advisor_Route receives a request, THE Planner_Advisor_Route SHALL apply guest authentication, a rate limit of 5 requests per scope, and CSRF protection, mirroring the Catalog_Advisor_Route.
3. WHEN a Planner_Advisor_Request includes `stream` with the value `true`, THE Planner_Advisor_Route SHALL return a newline-delimited JSON stream.
4. WHEN a Planner_Advisor_Request omits `stream` or includes `stream` with the value `false`, THE Planner_Advisor_Route SHALL return a success-envelope JSON response.
5. WHEN the Planner_Advisor_Route returns a response, THE Planner_Advisor_Route SHALL return fields that satisfy the `PlannerAdvisorResponse` shape consumed by the Planner_Advisor_Client, including `content`.
6. IF no provider in the Provider_Chain returns a usable response, THEN THE Planner_Advisor_Route SHALL return a Heuristic_Fallback result with `degraded` set to `true`.
7. IF the request body fails validation, THEN THE Planner_Advisor_Route SHALL return a `400` validation error response.

### Requirement 4: Fixed-Order Provider Chain Resolution

**User Story:** As a maintainer, I want the provider chain to resolve in a fixed order, so that routing and failover are predictable.

#### Acceptance Criteria

1. THE Provider_Chain SHALL order available targets as Gemini, then OpenRouter primary, then OpenRouter backup, then OpenAI, then Bedrock.
2. WHERE a provider credential is absent, THE Provider_Chain SHALL omit that provider target from the resolved chain.
3. WHEN a provider target returns an unusable or errored response, THE AI_Stack SHALL advance to the next available target in the Provider_Chain.
4. THE AI_Stack SHALL keep provider secrets and model identifiers on the server side.

### Requirement 5: Ranked, Deduplicated, Fail-Open Retrieval Pipeline

**User Story:** As a maintainer, I want the retrieval pipeline to rank, dedupe, and fail open, so that grounding stays relevant and resilient.

#### Acceptance Criteria

1. THE Retrieval_Pipeline SHALL contribute results in the order LanceDB vector recall, then Orama lexical search, then catalog order.
2. THE Retrieval_Pipeline SHALL deduplicate contributed products by slug.
3. THE Retrieval_Pipeline SHALL cap the returned products at the requested limit.
4. IF a retrieval layer raises an error, THEN THE Retrieval_Pipeline SHALL degrade to catalog order and return available results.
5. WHERE the trimmed query is shorter than 2 characters, THE Retrieval_Pipeline SHALL return products in catalog order.

### Requirement 6: AI Routes Wired into Existing Observability

**User Story:** As an operator, I want the AI routes wired into existing observability, so that provider use, fallback, retrieval, latency, and errors are measurable.

#### Acceptance Criteria

1. WHEN an AI route processes a request, THE AI_Stack SHALL record the provider used through the Metrics_Registry.
2. WHEN the Heuristic_Fallback is triggered, THE AI_Stack SHALL record that a fallback occurred through the Metrics_Registry.
3. WHEN the Retrieval_Pipeline contributes results, THE AI_Stack SHALL record the retrieval layer that was hit through the Metrics_Registry.
4. WHEN an AI route processes a request, THE AI_Stack SHALL record request latency and error occurrence through the Metrics_Registry.
5. WHEN an AI route processes a request, THE AI_Stack SHALL emit a Telemetry span carrying provider, fallback, and retrieval-layer attributes.
6. THE AI_Stack SHALL wire observability using the existing Metrics_Registry and Telemetry registration without adding new infrastructure.
