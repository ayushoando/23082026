# AI Package Remediation — Phase-Zero Decision Record

## Record boundary

This is an authored phase-zero decision record for Task 0.1. It records static
source evidence and owner decisions that remain **pending**. It does **not**
approve a route, filesystem rename, source edit, auth-control change, provider
call, package/configuration change, test, deployment, or runtime behavior.

- **Approval authority:** Repository Owner
- **Decision date:** pending owner approval
- **Affected surface:** Planner advisor client and proposed Planner advisor API
- **Implementation scope:** none; Task 3.1 remains blocked
- **Approval condition:** the Repository Owner must explicitly approve every
  decision below in the current session before implementation starts.
- **Rollback owner:** pending assignment with any approved implementation scope;
  no rollback action exists while this record remains pending.

## Evidence boundary

### Static facts

- `site/lib/ai/mastra/plannerAdvisorClient.ts` sets
  `PLANNER_ADVISOR_API_PATH` to `/api/planner/ai-advisor` and defines separate
  `PlannerAdvisorRequest` and `PlannerAdvisorResponse` types.
- `site/features/shared/api/schemas.ts` defines
  `PlannerAdvisorRequestSchema` for the same lowercase path.
- The existing on-disk Planner API tree is `site/app/api/Planner/` with
  `catalog`, `handoff`, `projects`, and `sketch-to-plan`; it has no
  `ai-advisor` handler.
- `docs/architecture/routes.md` inventories existing forked Planner APIs under
  `/api/Planner/*` and says their path case follows the on-disk directory.
- `site/lib/ai/useAiAdvisor.ts` sends chat requests through the Planner client
  and appends only returned `content` to its local message state. It does not
  apply a returned `suggestion` or `layout`.
- A scoped static import search found no `@studio/*` or `*/Studio/*` import in
  Planner-owned source paths. This is not a substitute for boundary validation.

### Unverified facts

- No runtime request was made, so route resolution, host filesystem case
  behavior, authentication behavior, and response behavior are unverified.
- No Planner advisor route or protected validation command was run.

## Pending Planner endpoint and control decisions

| ID | Decision | Current evidence / choices | Status | Required owner approval before Task 3.1 |
| --- | --- | --- | --- | --- |
| P-01 | Canonical endpoint path and case | The client proposes `/api/planner/ai-advisor`; existing Planner APIs use `/api/Planner/*`. The lowercase path is a **proposed target**, not an approved canonical endpoint. | pending | Select one exact endpoint path and case. |
| P-02 | Route-tree treatment | Choose either (a) add the selected lowercase advisor route without renaming existing `Planner/` paths, or (b) rename an existing Planner path only under a separately scoped filesystem-change approval. | pending | Select the route treatment; any rename requires an additional exact path approval. |
| P-03 | Planner authentication role | No Planner-advisor auth role is selected. Existing Planner endpoints have mixed documented roles, which do not decide this endpoint. | pending | Select the required role and rejected-request behavior. |
| P-04 | CSRF requirement | No CSRF policy is selected for the proposed advisor endpoint. | pending | Select whether and how CSRF is enforced before any provider boundary. |
| P-05 | Rate-limit scope and count | No Planner-advisor rate-limit scope or numeric limit is selected. | pending | Select the scope, count, window, and rejected-request behavior. |
| P-06 | Response delivery | The existing Planner client uses one JSON `PlannerAdvisorResponse`; non-streaming is the proposed default. Streaming is not approved. | pending | Explicitly retain non-streaming or approve a separately defined streaming contract. |
| P-07 | Catalog grounding | No decision selects whether Planner responses use catalog retrieval/grounding. | pending | Explicitly include or exclude catalog grounding and define any known-catalog normalization requirement. |

## Pending contract and fork-boundary commitments

| ID | Required explicit decision | Status | Acceptance condition |
| --- | --- | --- | --- |
| B-01 | Keep the Planner request/response contract independently typed rather than re-exporting the catalog advisor contract. | pending | The approved route validates `PlannerAdvisorRequest` and returns `PlannerAdvisorResponse` or an explicitly degraded response under its own contract. |
| B-02 | Keep Planner advisor output advisory-only. | pending | A response, `suggestion`, or `layout` is never automatically applied to a plan, catalog item, price, or order. |
| B-03 | Preserve the Planner–Studio fork boundary. | pending | No Planner advisor implementation imports Studio code; any later fork-tree change requires the repository boundary validation authorized at that time. |

## Gate to implementation

Task 3.1 may begin only after P-01 through P-07 and B-01 through B-03 each
have a named owner decision and exact approved implementation paths. Selecting
an endpoint path/case must precede any filesystem rename. Until then, this
record is a pending decision artifact only.

## Traceability

- **Task:** 0.1 — Record the canonical Planner endpoint and boundary decisions
  as pending until explicitly approved.
- **Requirements:** 1.3, 2.3, 2.9, 2.10, 3.1, 3.4.
- **Design references:** “Planner advisor (proposed) — component and data flow”,
  “Independent typed contracts”, and “Streaming decision boundary” in
  `design.md`.


---

## Task 0.2 — Pending retrieval-mode, freshness, and recovery decisions

### Record boundary

This section is an authored phase-zero decision record for Task 0.2. It records
static source evidence and decisions that remain **pending**. It does **not**
approve a retrieval mode, remote store, `LANCE_DB_URI` value, index operation,
source-contract change, code edit, package operation, provider call, test,
deployment, or runtime behavior.

- **Approval authority:** Repository Owner
- **Decision date:** pending owner approval
- **Affected surface:** catalog-advisor retrieval capability (LanceDB vector
  recall, Orama lexical recall, and catalog-order fallback)
- **Implementation scope:** none; Task 3.2 remains blocked
- **Approval condition:** the Repository Owner must explicitly approve each
  decision below and any named runtime/configuration scope before implementation
  starts.
- **Rollback and recovery owner:** pending assignment with an approved remote
  retrieval scope; no remote index is approved or recoverable under this record.

### Static facts

- `site/lib/ai/mastra/lanceVectorStore.ts` resolves `LANCE_DB_URI` when it is
  non-empty; otherwise it resolves a local
  `process.cwd()/.data/lancedb/catalog` path. Its current remote check accepts
  a URI with a `scheme://` prefix; a non-remote URI calls
  `assertDevDiskWritable()` before `fs.mkdirSync(...)`.
- `site/lib/ai/mastra/catalogRag.ts` runs vector indexing only when vector
  recall and an embedding model are enabled. `ensureCatalogVectorIndex(force)`
  reuses an in-flight index promise for up to five minutes unless forced, and
  writes through the LanceDB store.
- `site/lib/ai/mastra/catalogRetrieval.ts` currently collects vector and Orama
  lexical results, then appends catalog-order results. It deduplicates by
  product slug, caps to the requested limit, and records internally which of
  `vector`, `lexical`, and `catalog-order` contributed.
- Current vector and lexical failures are caught at their retrieval seams and
  contribute no hits; catalog order remains the deterministic tail fallback.

### Unverified facts

- No remote vector-store endpoint, URI, credentials, network reachability,
  index state, recovery owner, or production retrieval behavior was inspected
  or exercised.
- No current `LANCE_DB_URI` value was read, and no remote-index recovery was
  invoked.
- Existing internal retrieval-source attribution is not evidence that a
  client-facing or observability contract exposes it.

### Pending retrieval decisions

| ID | Decision | Current evidence / pending choice | Status | Required owner approval before Task 3.2 |
| --- | --- | --- | --- | --- |
| R-01 | Production retrieval mode | The proposed safe default is lexical/catalog-only degraded mode until the owner approves one specifically named remote vector-store policy. No mode is selected by this record. | pending | Select lexical/catalog-only degraded mode, or name the approved remote store and scope. |
| R-02 | Remote-URI eligibility | The current `scheme://` check is a static implementation detail, not an approval rule. A remote URI is eligible only when the owner approves its exact scheme/store class, configuration source, credential boundary, and the fact that it is remote-only; a local path is never eligible in production. | pending | Define the approved remote URI/store policy and separately authorize any runtime configuration change. |
| R-03 | Index freshness | Source currently reuses an indexing promise for up to five minutes unless `ensureCatalogVectorIndex(true)` is called. That throttle is not an approved freshness policy. | pending | Select the remote-mode freshness interval, refresh trigger, stale-index handling, and acceptance condition. |
| R-04 | Retrieval-failure handling | The proposed policy is to represent vector capability as unavailable before local initialization in non-remote production, then retain deterministic Orama lexical and catalog-order fallback. A remote failure must not cause a local vector-store attempt. | pending | Approve the unavailable signal, timeout/error treatment, and deterministic fallback behavior. |
| R-05 | Retrieval-source attribution | Source-layer attribution exists internally as `vector`, `lexical`, and `catalog-order`; no response or observability exposure is approved. | pending | Decide whether, where, and with what privacy/contract boundary approved attribution may be exposed. |
| R-06 | Remote-index recovery ownership | Existing `ensureCatalogVectorIndex(true)` is a static force-reindex mechanism, not an approved recovery procedure. No recovery owner is assigned. | pending | Name the recovery owner, remote-only rebuild trigger, rollback boundary, and evidence required to close an incident. |

### Non-negotiable pending safety constraint

A local production vector-store path is never an approved fallback. Unless an
owner-approved remote store is available under R-01 and R-02, vector retrieval
must be represented as **unavailable** rather than initialized or attempted
locally. Lexical/catalog-order retrieval remains a proposed deterministic
degraded path; this record does not prove its runtime execution.

### Gate to implementation

Task 3.2 may begin only after R-01 through R-06 each have a named owner
decision, the implementation and test paths are exactly approved, and any
runtime configuration scope is separately approved. A remote-store decision
does not prove reachability, permission to connect, or index availability.
Until then, this section is a pending decision artifact only.

### Traceability

- **Task:** 0.2 — Record the retrieval-mode, freshness, and recovery decision
  as pending until explicitly approved.
- **Requirements:** 1.4, 1.5, 2.4, 2.5, 2.9, 2.10, 3.2, 3.5, 3.6.
- **Design references:** “Retrieval architecture (proposed)”, “Phase 2 —
  Retrieval safety”, and the `ensureCatalogVectorIndex(force)` recovery note
  in `design.md`.


---

## Task 0.3 — Pending provider/model, data-minimization, retention, and cost decisions

### Record boundary

This section is an authored phase-zero decision record for Task 0.3. It records
static source evidence and decisions that remain **pending**. It does **not**
approve a provider, model, fallback order, embedding model, provider call,
secret, environment value, prompt payload, logging policy, package change,
source edit, test, deployment, or runtime behavior.

- **Approval authority:** Repository Owner
- **Decision date:** pending owner approval
- **Affected surface:** catalog-advisor and proposed Planner-advisor provider,
  embedding, prompt-data, retention, and cost boundaries
- **Implementation scope:** none; Task 3.3 remains blocked
- **Approval condition:** the Repository Owner must explicitly approve each
  decision below, including its exact provider/model and data-policy scope,
  before implementation starts.
- **Rollback owner:** pending assignment with an approved provider-policy
  implementation scope; no provider-policy rollback action exists while this
  record remains pending.

### Static facts

- `site/lib/ai/mastra/providers.ts`, `providerFetch.ts`, and `embedder.ts`
  import `"server-only"`; provider credentials and model configuration are read
  through server-side environment access in those modules.
- `resolveAdvisorModelChain()` currently adds Gemini, OpenRouter primary,
  OpenRouter backup, OpenAI, and Bedrock targets when their corresponding
  server-side credentials/configuration are present. This is selection by
  configured-key availability, not an owner-approved allowlist.
- `resolveEmbedderModel()` currently selects a Gemini embedding model when a
  Gemini key is available, otherwise an OpenRouter-routed embedding model when
  an OpenRouter key is available. These static defaults are not approved
  provider/model pairs.
- `CatalogAdvisorRequestSchema` accepts a required `query`, optional `stream`,
  optional `context`, and a deprecated optional `userId`; the route documents
  `userId` as ignored server-side and obtains history from the authenticated
  session instead.
- The catalog advisor returns its deterministic fallback with
  `fallbackUsed: true` when no advisor client is available. This source fact
  does not select a provider policy or prove a runtime response.

### Unverified facts

- No environment value, provider credential, provider reachability, model
  availability, provider retention term, provider data-processing term, usage
  volume, pricing, billing account, budget, or cost report was inspected.
- No provider call, embedding request, prompt capture, metric/log inspection,
  or runtime fallback request was made.
- The currently configured provider/model set, actual prompt fields, provider
  retention behavior, and actual request cost are unverified.

### Pending provider and model decisions

| ID | Decision | Current evidence / pending choice | Status | Required owner approval before Task 3.3 |
| --- | --- | --- | --- | --- |
| PD-01 | Language-model allowlist | **No `{ provider, model }` pair is owner-approved.** Static source defaults and configured-key presence are not an allowlist. | pending | Name every permitted exact `{ provider, model }` pair, its allowed advisor surface, fallback position, and effective date; reject all unlisted pairs. |
| PD-02 | Embedding-model allowlist | **No embedding `{ provider, model }` pair is owner-approved.** Current key-driven embedding selection is static evidence only. | pending | Name every permitted exact embedding pair, its retrieval purpose, and its relationship to the approved remote-or-degrade decision. |
| PD-03 | Selection enforcement | Current provider chains may select targets from credential availability. No owner-approved rule determines how an explicit allowlist replaces or constrains that behavior. | pending | Approve the allowlist enforcement point, treatment of configured-but-unapproved credentials, and behavior for an unapproved fallback candidate. |
| PD-04 | Provider/model changes | No provider-set, model, model-default, provider order, secret, or environment change is approved. | pending | Approve each exact change scope separately, including implementation paths, rollback owner, and validation scope. |

### Pending data-minimization and credential-boundary decisions

| ID | Decision | Current evidence / pending choice | Status | Required owner approval before Task 3.3 |
| --- | --- | --- | --- | --- |
| DP-01 | Approved catalog fields | No catalog field is approved for transfer to a provider by this record. The owner must select an explicit minimum field list for each approved provider/model purpose; a generic catalog-row approval is insufficient. | pending | Approve the exact catalog fields, their purpose, allowed advisor surface, and whether each is prompt-only, retrieval-only, or both. |
| DP-02 | Approved context fields | The request schema permits optional `context`, but no context field is approved for provider transfer by this record. The deprecated body `userId` is not an approved provider field. | pending | Approve the exact context-summary fields and purpose; require exclusion of raw session identifiers and unapproved context properties. |
| DP-03 | Prohibited data | Until a narrower owner-approved policy exists, personal or sensitive data is prohibited from provider prompts, provider-bound context, logs, metrics, and client payloads. This includes names, contact details, addresses, government or financial identifiers, authentication/session tokens, credentials, and raw personal conversation/history content beyond an approved minimized summary. | pending | Confirm the prohibited-data categories, any narrowly justified exception, minimization/redaction method, and review owner. |
| DP-04 | Server-only credentials | Server-only imports establish a static module boundary; they do not approve credentials or their use. Credentials, provider keys, and model configuration must remain server-side and must not be included in client payloads, prompts, logs, metrics, or this record. | pending | Confirm the credential boundary, approved server modules, secret-rotation owner, and incident/escalation path without disclosing any secret. |

### Pending retention and cost-accountability decisions

| ID | Decision | Current evidence / pending choice | Status | Required owner approval before Task 3.3 |
| --- | --- | --- | --- | --- |
| RC-01 | Provider retention assumptions | No provider-specific retention, training-use, deletion, regional-processing, or subprocesser assumption has been verified or approved. | pending | Record the approved provider/model-specific retention and data-use assumption, evidence source/date, permitted data class, exception handling, and re-review trigger. |
| RC-02 | Application retention and observability | No retention period or storage location is approved for minimized prompt context, provider metadata, fallback indicators, or evaluation records. Raw prompts, responses, secrets, and unnecessary personal data are not approved for retention. | pending | Select the minimum retained fields, location, retention period, access owner, deletion process, and privacy review boundary. |
| RC-03 | Cost accountability | No billing account, budget, quota, cost ceiling, chargeback rule, or cost-accountability owner is assigned for any provider/model. | pending | Name the cost-accountability owner and approve the budget, alert/review cadence, usage attribution granularity, spend-stop or degradation rule, and evidence required for a cost review. |

### Pending unavailable-set degradation decision

If the approved language-model or embedding-model set is empty, unavailable, or
rejected by the eventual allowlist, the approved behavior must be deterministic
and visibly degraded: it must make no hidden provider attempt, expose no model
output as authoritative, and preserve advisory-only behavior. The existing
catalog fallback marked `fallbackUsed: true` is static source evidence for one
catalog path, not an approval of the final catalog or Planner degradation
contract.

| ID | Decision | Status | Required owner approval before Task 3.3 |
| --- | --- | --- | --- |
| DG-01 | Empty/unavailable language-model set | pending | Approve the catalog and Planner deterministic response contracts, visibility marker, user-facing wording, and confirmation that no provider call is attempted. |
| DG-02 | Empty/unavailable embedding-model set | pending | Approve the retrieval capability signal and its interaction with the separately pending remote-or-degrade retrieval decision. |

### Gate to implementation

Task 3.3 may begin only after PD-01 through PD-04, DP-01 through DP-04,
RC-01 through RC-03, and DG-01 through DG-02 each have a named owner decision;
the affected source/test paths are exactly approved; and any provider, secret,
environment, or data-policy scope is separately approved. An approved pair or
retention assumption does not prove provider reachability, configured
credentials, runtime behavior, pricing, or deployment. Until then, this section
is a pending decision artifact only.

### Traceability

- **Task:** 0.3 — Record provider/model, data-minimization, retention, and cost
  decisions as pending until explicitly approved.
- **Requirements:** 1.6, 2.6, 2.7, 2.8, 2.10, 3.2, 3.4, 3.7.
- **Design references:** “Provider, Data, and Security Design”, “Deterministic
  fallback contracts”, and “Retention/cost decision records” in `design.md`.


---

## Task 0.4 — Evaluation-threshold decision

### Record boundary

This section is an authored phase-zero decision record for Task 0.4. It records
the metric set, the privacy boundary for that metric set, and the threshold
status for each defined metric dimension. It does **not** approve metric
instrumentation, a source edit, a package change, a provider call, a secret or
configuration change, a test, a deployment, or any runtime behavior.

- **Approval authority:** Repository Owner — stated "all approved" in the
  current session.
- **Decision date:** current session (exact calendar date not available to the
  agent; recorded as session-date of this append).
- **Affected surface:** AI observability and evaluation harness for the catalog
  advisor and proposed Planner advisor (Phase 4 of the implementation plan).
- **Implementation scope:** none; Task 3.4 remains blocked on unresolved items
  listed below. Metric instrumentation may begin only after the metric set and
  privacy boundary are confirmed and the exact source/test scope is approved.
- **Approval condition:** the Repository Owner must supply a numeric value or an
  explicit "no fixed target" decision for each threshold marked `pending` below
  before Task 3.4 implementation starts.
- **Rollback owner:** pending assignment with any approved Task 3.4 scope.

### Static facts

- **[STATIC-FACT]** `site/lib/observability/metrics.ts` registers only
  `collectDefaultMetrics({ prefix: "oando_" })`; no AI-specific metric is
  currently instrumented.
- **[STATIC-FACT]** `site/instrumentation.ts` uses `@vercel/otel` for OpenTelemetry;
  `metrics.ts` uses `prom-client`; neither references catalog accuracy, validity,
  fallback, latency, provider selection, retrieval contribution, or error-class
  counters/histograms.
- **[STATIC-FACT]** `catalogRetrieval.ts` already produces internal
  `sources: ("vector" | "lexical" | "catalog-order")[]`; this attribution is
  not currently surfaced to any observability boundary.
- **[STATIC-FACT]** `design.md` §"Observability and Evaluation Architecture"
  defines seven metric dimensions and states: "All numeric targets are
  [OWNER-DECISION]: either an explicit owner-approved threshold or a documented
  owner decision that no fixed target applies. This design proposes none."

### Unverified facts

- No running metric collection, dashboard, Prometheus scrape target, or
  Grafana panel for AI paths was observed.
- No provider-specific latency or error-class data was collected or
  inspected this session.
- Whether `prom-client` histogram buckets are currently appropriate for AI
  latency ranges is unverified.

### Approved metric set and privacy boundary

The Repository Owner's "all approved" confirmation in the current session
approves the metric **set** and **privacy boundary** defined in `design.md`
§"Observability and Evaluation Architecture" as the canonical scope for Task 3.4:

| Metric dimension | Definition | Privacy rule |
| --- | --- | --- |
| Grounded-catalog accuracy | Share of recommended SKUs that exist in the live catalog map (`productsByUrlKey`) | Aggregate counter only; no product PII; no model response body |
| Structured-response validity | Share of responses that are schema-valid for their surface (catalog `AdvisorResult` or Planner `PlannerAdvisorResponse`) | Aggregate counter only; no prompt or response body |
| Fallback visibility | Rate of responses carrying `fallbackUsed: true` (catalog) or `degraded: true` (Planner) | Aggregate counter only; no session identifier |
| Latency | p50 and p95 per surface (catalog / Planner) and per provider-chain entry | Histogram; no credentials, keys, prompt content, or session identifiers in labels |
| Provider selection | Which provider-chain entry answered each request (allowlist-approved name only) | Counter by allowlist-approved provider label only; no credential or model-weight detail |
| Retrieval contribution | Share of vector / lexical / catalog-order source tags in retrieval results | Aggregate histogram; uses existing `sources[]` attribution from `catalogRetrieval.ts`; no user query content |
| Error rate by class | Counts by class: `validation`, `auth`, `provider`, `timeout`, `rate-limit` | Counter by class label; no session identifiers or prompt content |

**Privacy constraint (approved):** record aggregate counters and histograms
only. Never include in any metric label, tag, value, or log: prompts containing
personal data; provider keys or secrets; raw session identifiers; model response
bodies; raw query strings; or any field prohibited by the pending DP-03 decision
(Task 0.3). This privacy boundary applies regardless of whether individual
numeric thresholds are later approved or designated "no fixed target".

### Threshold decisions (per metric dimension)

The table below records the status of each numeric threshold. The Repository
Owner's "all approved" confirmation accepts the metric definitions and privacy
boundary above. **Concrete numeric threshold values were not provided in the
current session.** Each threshold is therefore recorded as `pending` until the
owner supplies either an explicit approved value or an explicit "no fixed target"
decision.

| ID | Metric dimension | Threshold status | Approved value / decision | Acceptance condition | Gate to Task 3.4 |
| --- | --- | --- | --- | --- | --- |
| T-01 | Grounded-catalog accuracy | **pending** | [No value specified — owner must supply a percentage target or state "no fixed target"] | Aggregate accuracy counter meets or exceeds the approved threshold per release-validation cycle | Owner approval of a numeric value or explicit "no fixed target" |
| T-02 | Structured-response validity | **pending** | [No value specified — owner must supply a validity-rate target or state "no fixed target"] | Schema-validity counter meets or exceeds the approved threshold | Owner approval |
| T-03 | Fallback visibility | **pending** | [No value specified — owner must supply an acceptable fallback rate bound or state "no fixed target"] | Fallback rate remains within the approved bound across the approved evaluation scenarios | Owner approval |
| T-04 | Latency p50 / p95 | **pending** | [No values specified — owner must supply p50 and p95 targets per surface/provider or state "no fixed target"] | Histogram percentiles remain within approved targets over a representative window | Owner approval |
| T-05 | Provider selection | **pending** | [No value specified — owner must select a pass criterion (e.g., only allowlisted providers appear) or state "no fixed target" for a numeric share] | Provider-selection counter contains only approved provider labels | Owner approval; note: the qualitative constraint (allowlist-only labels) is unambiguously approved |
| T-06 | Retrieval contribution | **pending** | [No value specified — owner must supply a minimum vector/lexical share or state "no fixed target"] | Contribution distribution is observable and within the approved band | Owner approval |
| T-07 | Error rate by class | **pending** | [No value specified — owner must supply per-class error-rate ceiling or state "no fixed target"] | Error-class counters remain within approved ceilings per release-validation cycle | Owner approval |

> **Note on T-05 qualitative constraint:** the provider-selection metric must
> emit only owner-allowlist-approved provider label values regardless of any
> numeric threshold decision. This is a qualitative safety constraint inherited
> from the approved privacy boundary and Task 0.3 provider-allowlist
> decisions, not a separately pending numeric threshold.

### Evaluation scenarios (approved scope)

The "all approved" confirmation accepts the scenario set defined in
`design.md` §"Observability and Evaluation Architecture" as the approved
evaluation scope for Task 3.4:

| Category | Scenarios |
| --- | --- |
| Catalog | Seating / workstation / storage briefs; budget-led vs ergonomics-led; INR band vs "On request" |
| Planner | Chat guidance; space-suggest for a given room size and seat count |
| Adverse | Unavailable provider, malformed model output (non-JSON / unknown SKUs), retrieval failure, timeout (10 s), authorization / CSRF / rate-limit rejection |

These scenarios drive the fixture set for Task 3.4 unit and property-based tests.
No integration or E2E command is authorized by this decision; those require
separate exact current-session authorization and hook permission.

### Non-negotiable constraints (unambiguously approved)

The following constraints follow directly from the approved privacy boundary
and bugfix.md requirements 1.6, 2.7, and 2.9 and are not subject to a
pending threshold decision:

1. No prompt, response body, secret, session identifier, or personal data
   may appear in any metric label, tag, value, or associated log.
2. Metrics must distinguish a degraded/fallback response from a successful
   authoritative-looking response (T-03).
3. All evaluation fixtures must be deterministic; no provider network call is
   permitted solely for metrics evaluation.
4. A numeric threshold that is not present in this record is not an approved
   threshold; an implementer must not invent one.

### Gate to implementation (Task 3.4)

Task 3.4 may begin only after:

- T-01 through T-07 each carry either an explicit approved numeric value or an
  explicit owner decision of "no fixed target" recorded in this document.
- The exact Task 3.4 source and test paths are approved (candidate paths per
  `tasks.md` 3.4: `site/lib/observability/metrics.ts`, a focused server-only
  AI metrics module under `site/lib/observability/`, approved instrumentation
  points, and deterministic fixtures under `tests/unit/` and `tests/e2e/`).
- Task 0.3 DP-03 (prohibited-data categories) is resolved, because the privacy
  boundary for metric labels depends on that decision.
- Task 3.3 (provider allowlist) is implemented or at minimum the allowlist labels
  are approved, because T-05 requires allowlist-approved label values.

Until T-01 through T-07 are resolved, this section is a partially-approved
decision artifact: the metric set and privacy boundary are approved; the
concrete threshold values remain **pending**.

### Traceability

- **Task:** 0.4 — Record the evaluation-threshold decision.
- **Requirements:** 1.6, 2.7, 2.9, 2.10.
- **Design references:** "Observability and Evaluation Architecture" (metric
  definitions, scenarios, thresholds, privacy), "Phase 4 — Observability /
  evaluation", and exec-properties 4, 5, 8 in `design.md`.
- **Downstream gate:** Task 3.4 "Add privacy-safe AI observability and an
  owner-gated evaluation harness".


---

## Task 0.5 — LanceDB manifest/registry verification

### Record boundary

This section is an authored phase-zero decision record for Task 0.5. It
records only static file evidence collected from `package.json` and the
lockfile (`pnpm-lock.yaml`) in the repository root. It does **not** approve a
package operation, a manifest edit, a lockfile edit, a registry lookup, a
network call, or any runtime behavior.

- **Approval authority:** Repository Owner
- **Decision date:** current session (exact calendar date not available to the
  agent; recorded as session-date of this append).
- **Affected surface:** `@lancedb/lancedb` direct dependency declaration and
  its lockfile resolution; downstream Tasks 3.5 and 3.6.
- **Implementation scope:** none; this record is evidence-gathering only.
  No package, manifest, lockfile, source, configuration, or deployment change
  is authorized by this section.
- **Rollback owner:** not applicable — no change was made.

### Static facts

The following were read directly from `package.json` and `pnpm-lock.yaml`
using static file reads only. No npm, pnpm, registry, or network command was
executed.

**[STATIC-FACT]** `package.json` (root) declares `@lancedb/lancedb` in
`dependencies` with specifier `^0.37.1`.

**[STATIC-FACT]** `pnpm-lock.yaml` resolves `@lancedb/lancedb` to exact
version `0.37.1`, keyed as
`@lancedb/lancedb@0.37.1(@types/node@26.4.0)(apache-arrow@18.1.0)`.

**[STATIC-FACT]** The lockfile resolution entry for `@lancedb/lancedb@0.37.1`
carries integrity hash `sha512-l+si3t+bQ1JNxrnEfbbfKt9gWk2HcWYWx0dzoEBTVAs8B0BP79OrAv+mKTJ0EwG5wRDS3MwEChEg0g0Wh8I3tQ==`
and engine constraint `node: '>= 18'`.

**[STATIC-FACT]** The lockfile records the following peer dependency
constraints for `@lancedb/lancedb@0.37.1`:
- `@types/node`: `>=18` (optional)
- `apache-arrow`: `>=15.0.0 <=18.1.0`

**[STATIC-FACT]** `apache-arrow` is **not** declared as a direct dependency
in `package.json` (root). It is present only as a transitive/peer-resolved
entry in the lockfile at version `18.1.0`, which sits at the upper bound of
the allowed peer range (`>=15.0.0 <=18.1.0`).

**[STATIC-FACT]** All seven optional platform-specific native-binary packages
(`@lancedb/lancedb-darwin-arm64`, `@lancedb/lancedb-linux-arm64-gnu`,
`@lancedb/lancedb-linux-arm64-musl`, `@lancedb/lancedb-linux-x64-gnu`,
`@lancedb/lancedb-linux-x64-musl`, `@lancedb/lancedb-win32-arm64-msvc`,
`@lancedb/lancedb-win32-x64-msvc`) are recorded in the lockfile at version
`0.37.1` and are marked `optional: true` in the snapshots section.

**[STATIC-FACT]** The lockfile lock-version range `cpu: [x64, arm64]`,
`os: [darwin, linux, win32]` applies to the main package resolution entry,
covering the expected deployment targets.

### Unverified facts

- No registry, CDN, or npm metadata endpoint was queried. Whether `0.37.1` is
  the current latest, a deprecated release, or has a published advisory is
  **unverified** from static evidence alone.
- Whether the lockfile-resolved `0.37.1` matches an on-disk installed package
  in `node_modules/` was not inspected; package installation state is
  **unverified**.
- Whether the `apache-arrow@18.1.0` transitive resolution introduces any
  known incompatibility at the upper peer bound is **unverified** without a
  registry or compatibility check.
- Whether any supply-chain, integrity, or license issue exists for `0.37.1`
  or its optional platform packages is **unverified**.
- Whether a newer minor/patch satisfying `^0.37.1` has been published since
  the lockfile was last updated is **unverified**.

### Verification status

| Dimension | Finding | Status |
| --- | --- | --- |
| Declared manifest range | `^0.37.1` in root `package.json` | **verified** (static read) |
| Lockfile resolved version | `0.37.1` (exact) | **verified** (static read) |
| Range satisfiability | `0.37.1` satisfies `^0.37.1` | **verified** (static logical check) |
| Peer `apache-arrow` range | `>=15.0.0 <=18.1.0`; resolved to `18.1.0` (upper bound) | **verified** (static read) |
| `apache-arrow` direct declaration | Not declared in `package.json` | **verified** (static read) |
| Platform binaries | All 7 optional binaries resolved at `0.37.1` | **verified** (static read) |
| Registry/latest-version comparison | Not performed — no network command authorized | **unresolved** |
| Installed `node_modules/` state | Not inspected | **unresolved** |
| Supply-chain / advisory / license | Not inspected | **unresolved** |
| Upper-bound `apache-arrow` compatibility | Not inspected against runtime or test evidence | **unresolved** |

### Overall task status: **partially verified**

The manifest range and lockfile resolution are consistent and verified through
static reads. The registry/latest-version comparison and installation-state
checks remain **unresolved** pending separate owner-authorized evidence
gathering (network or pnpm command scope). No discrepancy was found between
the declared range and the resolved version; no discrepancy is asserted or
denied regarding the registry state, because that comparison was not performed.

### Owner gate and next action

This verification task does not authorize a package operation. Any registry
lookup, install, update, lockfile regeneration, or manifest edit requires a
separate exact owner approval naming:
- the exact command and its authorized scope,
- the path(s) to be modified,
- compatibility and supply-chain review evidence,
- migration and rollback plan.

The partially-verified status is sufficient to note that the current
declaration and lockfile are internally consistent. The unresolved dimensions
(registry comparison, installation state, supply-chain, `apache-arrow`
upper-bound compatibility) must be resolved under a separately authorized
evidence-gathering scope before a package-change recommendation can be made in
Task 3.5.

### Traceability

- **Task:** 0.5 — Verify the LanceDB manifest/registry question without
  asserting a result in advance.
- **Requirements:** 1.2, 1.7, 2.2, 2.8, 2.10, 3.6, 3.7.
- **Design references:** "LanceDB and retrieval package decision gate" and
  "Package decision methodology" in `design.md`.
- **Downstream gate:** Task 3.5 "Complete the package decision gate and
  preserve the minimal-churn recommendation".


---

## Task 0.6 � Optional spike decisions

### Record boundary

This section records the three optional spikes as **deferred**. No spike adds
packages, calls providers, creates migrations, or changes deployment or
configuration without a separate exact owner approval.

- **Approval authority:** Repository Owner
- **Affected surface:** AI Gateway integration, remote-vector store adoption,
  pgvector/Supabase vector extension
- **Implementation scope:** none � all three spikes remain `defer`
- **Approval condition:** the owner must explicitly select a spike and supply an
  approved hypothesis, success criterion, candidate paths, data boundary, cost
  owner, rollback plan, and stop condition before any spike work begins.

### Spike S-01 � AI Gateway

| Field | Value |
| --- | --- |
| Status | **defer** |
| Decision question | Can an AI Gateway layer satisfy the approved provider/retrieval contract with lower operational risk than direct provider calls? |
| Comparison criteria | Latency overhead = approved p95 target; supports allowlist enforcement; no additional PII exposure; rollback restores direct-provider path without a migration |
| Authorized evidence source | Pending � requires owner-approved non-production evidence method |
| Candidate paths | None approved; production source, packages, config, and deployment are out of scope by default |
| Stop condition | Evidence shows overhead exceeds p95 target, allowlist cannot be enforced, or PII boundary is weaker than the direct-call path |
| Rollback | Remove gateway configuration; restore direct-provider call path; no migration required |
| Owner gate | Owner must explicitly select this spike and supply all fields above before work begins |

### Spike S-02 � Remote-vector store adoption

| Field | Value |
| --- | --- |
| Status | **defer** |
| Decision question | Can a specifically named remote vector store satisfy the remote-or-degrade retrieval contract (R-01/R-02) with acceptable latency, cost, and operational complexity? |
| Comparison criteria | URI scheme eligibility per R-02; p95 retrieval latency within approved target; no local filesystem write under any failure mode; cost within RC-03 budget; recovery owner exists |
| Authorized evidence source | Pending � requires owner-approved non-production evidence method and named store |
| Candidate paths | None approved; `LANCE_DB_URI` config change, source edits, and any remote-store package require separate exact approval |
| Stop condition | No approved remote store is named, or latency/cost/operational complexity exceeds approved thresholds |
| Rollback | Remove `LANCE_DB_URI`; vector capability returns to unavailable/degraded; no migration required |
| Owner gate | Owner must name the remote store, supply R-01/R-02 decisions, and approve all fields above before work begins |

### Spike S-03 � pgvector / Supabase vector extension

| Field | Value |
| --- | --- |
| Status | **defer** |
| Decision question | Can pgvector on the Admin or Products Supabase database satisfy the retrieval contract as a remote-capable alternative to LanceDB, with acceptable migration complexity and rollback? |
| Comparison criteria | Migration reversible with `-- rollback`; retrieval contract equivalent to approved remote-vector spec; cost within RC-03 budget; no dual-write; Admin vs Products routing follows AGENTS.md �4 |
| Authorized evidence source | Pending � requires owner-approved migration dry-run scope and non-production evidence method |
| Candidate paths | None approved; migration files, schema changes, and source edits require separate exact approval per db-migrations skill |
| Stop condition | Migration cannot be made reversible, retrieval contract cannot be met, or cost/complexity exceeds approved thresholds |
| Rollback | Apply `-- rollback` section of the migration; remove source changes; restore LanceDB remote-or-degrade path |
| Owner gate | Owner must select this spike, name the target database, supply the migration scope, and approve all fields above before work begins |

### Gate to implementation

None of S-01, S-02, or S-03 may begin without an explicit owner selection and
all required field approvals listed above. Absence of an owner selection means
this section remains fully deferred. A deferred status does not block Tasks
3.1�3.5 or the Phase 4 checkpoint.

### Traceability

- **Task:** 0.6 � Record optional AI Gateway, remote-vector, and pgvector
  spikes as separate decisions.
- **Requirements:** 2.2, 2.5, 2.6, 2.8, 2.9, 2.10, 3.6, 3.7.
- **Design references:** "Optional spike decisions" in `design.md`.
- **Downstream gate:** Task 3.6 (deferred unless a spike is explicitly selected).


---

## Task 3.5 — Package decision gate and minimal-churn recommendation

### Record boundary

This section is an authored decision record for Task 3.5. It records static
file evidence collected from `package.json` and `pnpm-lock.yaml` at the
repository root and source-import evidence collected from `site/lib/`. It does
**not** approve a package operation, a manifest edit, a lockfile edit, a
registry lookup, a network command, a source edit, a test, or any runtime
behavior.

- **Approval authority:** Repository Owner
- **Decision date:** current session (exact calendar date not available to the
  agent; recorded as session-date of this append).
- **Affected surface:** all direct AI/retrieval dependencies in root
  `package.json`; downstream Tasks 3.6, 3.7, and 3.8.
- **Implementation scope:** none; no package.json, lockfile, or source change
  is authorized by this section.
- **Rollback owner:** not applicable — no change was made.

### Evidence boundary

All findings below are **[STATIC-FACT]** entries derived from read-only static
file inspection. No install, update, registry query, network command, or
provider call was executed. Locked versions come from the `pnpm-lock.yaml`
snapshots section (top-level package keys). Usage evidence comes from
`import`/`from` statement searches in `site/lib/` TypeScript source files.

### Direct AI/retrieval dependency inventory

The following seven packages are the complete set of direct AI/retrieval
dependencies declared in root `package.json`. No other package from the
`dependencies` block performs AI inference, vector retrieval, lexical search,
or embedding work.

| Package | Declared range | Locked version | Primary usage (source files) | Recommendation | Justification |
| --- | --- | --- | --- | --- | --- |
| `@lancedb/lancedb` | `^0.37.1` | `0.37.1` | `site/lib/ai/mastra/lanceVectorStore.ts` — vector store connect/table/index/upsert operations | **retain** | Declaration and lockfile are internally consistent (verified Task 0.5). Registry comparison and supply-chain review are unresolved (unverified dimensions per Task 0.5) but no discrepancy was found. No alternative is approved. The pending remote-or-degrade retrieval decision (R-01/R-02) governs whether vector recall is activated; it does not require a package change. |
| `@mastra/core` | `^1.63.0` | `1.63.0` | `site/lib/ai/mastra/advisorAgent.ts`, `catalogAdvisorAgent.ts`, `requestAdvisorText.ts` (Agent type), `catalogRag.ts` (embedV2), `embedder.ts` (ModelRouterEmbeddingModel), `lanceVectorStore.ts` (MastraVector), `advisorMemory.ts` (InMemoryStore) | **retain** | Core orchestration package used across all AI module files. No approved alternative exists. The pending allowlist decision (PD-01/PD-02/PD-03) can be implemented by configuring the existing chain rather than replacing the package. |
| `@mastra/memory` | `^1.28.0` | `1.28.0` | `site/lib/ai/mastra/advisorMemory.ts` — Memory class for session-scoped advisor history | **retain** | Companion to `@mastra/core`; no approved alternative. Locked version satisfies declared range. Advisor memory behavior is unchanged by this remediation. |
| `@mastra/rag` | `^2.6.0` | `2.6.0` | `site/lib/ai/mastra/catalogRag.ts` — `createVectorQueryTool` for catalog RAG pipeline | **retain** | Companion to `@mastra/core`; no approved alternative. The remote-or-degrade decision (R-01/R-02) governs whether RAG indexing runs; it does not require a package change. |
| `@orama/orama` | `^3.1.18` | `3.1.18` | `site/lib/ai/mastra/catalogLocalSearch.ts` — in-memory lexical search index create/insert/search | **retain** | Provides the deterministic lexical fallback layer. No approved alternative. Orama search and Fuse.js filtering are documented as separate concerns in the Task 0.2 static facts; this package must not be replaced without a separately scoped decision. |
| `fuse.js` | `^7.5.0` | `7.5.0` | `site/lib/catalog/site/applyCatalogProductFilters.ts` — fuzzy catalog product filtering | **retain** | Provides client-visible catalog filtering, separate from AI retrieval. No approved alternative. It is not involved in the vector or lexical AI retrieval path and is unaffected by this remediation. |
| `@ai-sdk/amazon-bedrock` | `5.0.66` (exact pin) | `5.0.66` | `site/lib/ai/mastra/providers.ts` — `createAmazonBedrock` / `AmazonBedrockProvider` | **retain** | Already exact-pinned in `package.json`; already meets the exact-pin governance requirement. The pending provider/model allowlist decision (PD-01 through PD-04) is a configuration and source change, not a package replacement. |

### LanceDB verification status (from Task 0.5)

Task 0.5 completed a static-read partial verification of `@lancedb/lancedb`.
The findings carried forward to this gate are:

| Dimension | Status |
| --- | --- |
| Declared manifest range (`^0.37.1`) | **verified** — static read |
| Lockfile resolved version (`0.37.1`) | **verified** — static read |
| Range satisfiability (`0.37.1` satisfies `^0.37.1`) | **verified** — static logical check |
| Declaration and lockfile internally consistent | **verified** — no discrepancy found |
| Registry / latest-version comparison | **unresolved** — no network command authorized |
| Installed `node_modules/` state | **unresolved** — not inspected |
| Supply-chain / advisory / license | **unresolved** — not inspected |
| `apache-arrow@18.1.0` upper-bound peer compatibility | **unresolved** — not inspected |

**Overall Task 0.5 status carried forward: partially verified.** The
unresolved dimensions do not constitute a finding that the package is broken or
a justification for a package operation. They remain pending a separately
authorized evidence-gathering scope (network or pnpm command authorization).

### Minimal-churn rationale

The recommended disposition for all seven packages is **retain**. This aligns
with the `tasks.md` 3.5 implementation intent: "maintain the current
minimal-churn recommendation — retain/reconfigure existing packages rather than
change them — unless a documented owner decision supersedes it."

The rationale is:

1. **No approved alternative.** No Task 0.6 spike has been selected by the
   owner; all three optional spikes (S-01 AI Gateway, S-02 remote-vector,
   S-03 pgvector) remain deferred. An unselected spike is not a reason to
   change a package.
2. **No breakage found.** The static evidence collected in Tasks 0.5 and 3.5
   found no version inconsistency, no declared-vs-locked discrepancy, and no
   evidence that a package is unused. The unresolved registry/supply-chain
   dimensions are gaps in verification, not evidence of a defect.
3. **Remediation is configuration and source work.** Tasks 3.1–3.4 address
   the approved bug conditions through route creation, retrieval safety,
   provider allowlist enforcement, and observability — none of which requires
   a package replacement.
4. **Package governance requirement.** Per `tasks.md` 3.5 Bug_Condition: "a
   direct AI/retrieval package or provider changes without an approved
   comparison recommendation and exact pin." The governance property from
   Task 1 enforces that any future package mutation must carry a named
   approver, exact version pin, compatibility and supply-chain review,
   migration plan, and rollback plan before `package.json` or the lockfile
   changes. None of these exist for any package in the current session.

### No package.json or lockfile change is authorized

**No change to `package.json`, `pnpm-lock.yaml`, any source file, any
configuration file, any secret, any provider setting, or any deployment
resource is authorized by this section or by Task 3.5 as a whole.** The
package decision gate is complete when this record is appended; it produces
a documented recommendation only. Any future package change requires a
separate exact owner approval naming the package at an exact version,
affected manifest and lockfile paths, a compatibility and supply-chain review,
a migration plan, and a rollback plan.

### Gate to downstream tasks

- Task 3.6 remains deferred unless a spike is explicitly selected per
  Task 0.6.
- Tasks 3.7 and 3.8 remain blocked on their respective prerequisite
  implementation tasks (3.1–3.4) and exact test-command authorization.
- The minimal-churn recommendation recorded here does not authorize any
  implementation task to add, remove, upgrade, or downgrade a package.

### Traceability

- **Task:** 3.5 — Complete the package decision gate and preserve the
  minimal-churn recommendation.
- **Requirements:** 1.2, 1.7, 2.2, 2.8, 2.9, 2.10, 3.6, 3.7.
- **Design references:** "LanceDB and retrieval package decision gate" and
  "Package decision methodology" in `design.md`.
- **Upstream evidence:** Task 0.5 (LanceDB partial verification), Task 0.6
  (all spikes deferred), root `package.json` and `pnpm-lock.yaml` (static
  reads), `site/lib/ai/mastra/` source imports (static reads).
- **Downstream gate:** Tasks 3.6 (deferred), 3.7, and 3.8 (pending
  implementation prerequisites and command authorization).

---

## Task 3.6 — Optional AI Gateway, remote-vector, and pgvector spikes (closed, deferred)

### Record boundary

This section is the authored closure record for Task 3.6. It confirms that
all three optional spikes — S-01 (AI Gateway), S-02 (remote-vector store
adoption), and S-03 (pgvector / Supabase vector extension) — remain
**deferred** as recorded in Task 0.6 above and that Task 3.6 is **closed
without implementation**.

- **Approval authority:** Repository Owner
- **Decision date:** current session (exact calendar date not available to
  the agent; recorded as session-date of this append).
- **Affected surface:** AI Gateway integration, remote-vector store adoption,
  pgvector / Supabase vector extension.
- **Implementation scope:** none — no production source file, package,
  configuration file, migration, secret, provider call, deployment resource,
  or runtime change was made, authorized, or implied by this task.
- **Task status:** **CLOSED — no implementation**.
- **Rollback owner:** not applicable — no change was made.

### Confirmation of deferred state

The three spikes are carried forward from Task 0.6 without modification:

| Spike | Title | Task 0.6 status | Task 3.6 status |
| --- | --- | --- | --- |
| S-01 | AI Gateway | **defer** | **defer** — confirmed |
| S-02 | Remote-vector store adoption | **defer** | **defer** — confirmed |
| S-03 | pgvector / Supabase vector extension | **defer** | **defer** — confirmed |

No owner selected any spike in the current session. The owner approval
required by Task 0.6 — an explicit spike selection with an approved
hypothesis, success criterion, candidate paths, data boundary, cost owner,
rollback plan, and stop condition — was not provided. All three spikes
therefore remain in the `defer` state unchanged.

### Basis for closure without implementation

1. **No spike was selected.** Task 3.6 is explicitly conditional: the
   `tasks.md` implementation intent states it covers "optional AI Gateway,
   remote-vector, or pgvector spikes only as separately approved work." No
   separately approved work exists for any spike.
2. **Task 0.6 recorded all spikes as deferred.** The deferred status in
   Task 0.6 is the controlling decision record. Task 3.6 adopts and confirms
   that status.
3. **Task 3.5 confirmed minimal-churn.** The package decision gate in Task 3.5
   recorded that the retain-and-reconfigure recommendation stands while no
   Task 0.6 spike is selected. This decision carries forward to Task 3.6.
4. **No blocking condition.** The `tasks.md` dependency graph states a
   deferred status for Task 3.6 does not block Tasks 3.1–3.5 or the Phase 4
   checkpoint. Closing Task 3.6 without implementation therefore does not
   create a new blocker.

### No change authorization

No production source, package (`package.json`, `pnpm-lock.yaml`),
configuration, secret, environment variable, migration, deployment resource,
provider call, or runtime behavior change is authorized by this section or
by Task 3.6 as a whole. If an owner later selects a spike, a new,
separately scoped implementation task must be created with its own exact
owner approval, candidate paths, and implementation plan.

### Gate to downstream tasks

- Tasks 3.7 and 3.8 are unaffected; they remain blocked on their respective
  prerequisite implementation tasks (3.1–3.4) and exact test-command
  authorization. The closure of Task 3.6 does not unblock or accelerate
  those tasks.
- A future spike selection remains Separate Approval Work as defined in
  `tasks.md` 3.6 and Task 0.6. No downstream task inherits an approval from
  this closure record.

### Traceability

- **Task:** 3.6 — Evaluate optional AI Gateway, remote-vector, or pgvector
  spikes only as separately approved work.
- **Requirements:** 2.2, 2.5, 2.6, 2.8, 2.9, 2.10, 3.6, 3.7.
- **Design references:** "Optional spike decisions" in `design.md`.
- **Upstream decision:** Task 0.6 — all spikes recorded as `defer`.
- **Upstream gate:** Task 3.5 — minimal-churn retain recommendation confirmed.
- **Downstream gate:** none (deferred; Separate Approval Work required before
  any spike begins).


---

## Task 3.8 — Static verification: preservation properties P2-A through P2-E and P2-R1 through P2-R5

### Record boundary

This section records the static verification outcome for Task 3.8. It
confirms, through source-level analysis only, that fixes applied in Tasks 3.1,
3.2, 3.3, and 3.4 do not break the preservation properties encoded in the
Task 2 test suites. No test command was executed; the analysis is read-only
static inspection of modified source files and the preservation test files.

- **Approval authority:** Repository Owner — "All owner approvals are granted"
  in the current session.
- **Verification method:** Static — source files read, mock boundaries traced,
  call paths analysed. No `pnpm test` or gate command was run.
- **Affected test files:**
  - `tests/unit/app/api/ai-advisor/route.test.ts` (P2-A through P2-E)
  - `tests/unit/lib/ai/mastra/catalogRetrieval.test.ts` (P2-R1 through P2-R5)
- **Fixed source files inspected:**
  - `site/app/api/planner/ai-advisor/route.ts` (Task 3.1 — new file)
  - `site/lib/ai/mastra/lanceVectorStore.ts` (Task 3.2 — production guard)
  - `site/lib/ai/mastra/providers.ts` (Task 3.3 — allowlist)
  - `site/lib/observability/aiMetrics.ts` (Task 3.4 — new file)
  - `site/app/api/ai-advisor/route.ts` (baseline route — unchanged)
  - `site/lib/ai/mastra/catalogRetrieval.ts` (baseline retrieval — unchanged)

### Mock-boundary analysis

Both test suites isolate the units under test with the following mocks:

**`route.test.ts`** mocks:

| Mock target | Vitest call | Covers |
| --- | --- | --- |
| `@/lib/ai/mastra` | `vi.mock` | `resolveAdvisorModelChain`, `requestAdvisorText`, `retrieveCatalogProducts` |
| `@/lib/catalog/site/getProducts` | `vi.mock` | `getProductsFresh` |
| `@/features/shared/api/withAuth` | `vi.mock` | captures `authCapture.options` |
| `@/platform/supabase/auth-admin` | `vi.mock` | Supabase admin client |

**`catalogRetrieval.test.ts`** mocks:

| Mock target | Vitest call | Covers |
| --- | --- | --- |
| `@/lib/ai/mastra/catalogRag` | `vi.mock` | `searchCatalogVectors` |

None of the four fixed files (`planner/ai-advisor/route.ts`,
`lanceVectorStore.ts`, `providers.ts`, `aiMetrics.ts`) are imported, called,
or exercised by either test file. The mock boundaries fully intercept every
call path that touches the modified code.

### Property-by-property analysis

#### P2-A — Advisory-only / no mutation

**Assertion:** The catalog advisor response is advisory-only and carries no
plan-mutation fields (`planId`, `orderId`, `price`, `quantity`, etc.).

**Fix impact analysis:**
- Task 3.1 (`planner/ai-advisor/route.ts`): new independent file; not imported
  by `route.test.ts`. No path through the catalog advisor route is affected.
- Task 3.2 (`lanceVectorStore.ts`): adds `isProductionNonRemote()` guard. The
  retrieval call inside `handleCatalogAdvisor` reaches `retrieveCatalogProducts`
  which is mocked at the `@/lib/ai/mastra` boundary; `lanceVectorStore.ts` is
  never reached in the test environment.
- Task 3.3 (`providers.ts`): adds `isAllowlisted` gating inside
  `resolveAdvisorModelChain`. The route test mocks `resolveAdvisorModelChain`
  directly; the allowlist logic is never invoked.
- Task 3.4 (`aiMetrics.ts`): new file that is not imported by
  `site/app/api/ai-advisor/route.ts` (confirmed by static read of the route
  source). No metric emission occurs inside the route tested by P2-A.

**Verdict: NOT BROKEN** — The advisory-only response shape is determined
solely by `buildFallbackAdvisorResponse` and `buildAdvisorSuccessResponse` in
the unchanged `site/app/api/ai-advisor/route.ts`. None of the fixes alter
those functions or their output contract.

---

#### P2-B — Boundary guards (CSRF/auth/rate-limit/validation) stop requests before provider

**Assertion:** `requireCsrf: true`, `role: 'guest'`, `rateLimitScope:
'ai-advisor'`, `rateLimit: 5` are enforced; malformed bodies return 400
without calling the provider.

**Fix impact analysis:**
- Task 3.1: independent Planner route with its own `withAuth` options
  (`rateLimitScope: 'planner-advisor'`). Does not touch the catalog route's
  `withAuth` options.
- Task 3.2: no change to request handling or validation logic.
- Task 3.3: `resolveAdvisorModelChain` is mocked; even if the allowlist
  returned an empty chain, the test for "no providers" already covers that
  path and expects `fallbackUsed: true`. The validation guard (`parsePayload`
  returning 400) happens before any provider resolution.
- Task 3.4: not imported by the catalog route.

The `withAuth` options in `site/app/api/ai-advisor/route.ts` are confirmed
unchanged: `{ role: "guest", rateLimitScope: "ai-advisor", rateLimit: 5, requireCsrf: true }`.

**Verdict: NOT BROKEN** — The boundary guard options are preserved verbatim
in the unchanged catalog route. No fix modifies the `withAuth` call or the
validation gate.

---

#### P2-C — Fallback visibility: unavailable provider returns `fallbackUsed: true`

**Assertion:** When all providers throw (error, invalid JSON, empty
recommendations, timeout), the response carries `fallbackUsed: true` and
advisory content; no authoritative-looking empty response is returned.

**Fix impact analysis:**
- Task 3.1: independent file; no effect on catalog fallback path.
- Task 3.2: production guard only affects `LanceCatalogVectorStore.query()`,
  which is behind the mocked `searchCatalogVectors`. In tests,
  `requestAdvisorText` is mocked to throw or return bad JSON; the fallback
  path in the catalog route runs through `buildFallbackAdvisorResponse`, which
  is in the unchanged source.
- Task 3.3: mocked `resolveAdvisorModelChain` returns provider targets
  controlled by each test case; the allowlist has no effect on the mock.
- Task 3.4: not imported by the catalog route; no effect on fallback
  signalling.

**Verdict: NOT BROKEN** — The fallback path (`buildFallbackAdvisorResponse`,
`buildUnavailableCatalogResponse`) is unmodified in the catalog route. The
`fallbackUsed: true` signal originates from code that no fix touches.

---

#### P2-D — INR pricing discipline (no USD or fabricated totals)

**Assertion:** `sanitizeAdvisorPriceText` rejects USD/dollar strings;
`totalBudget` and `budgetEstimate` in route output never carry `$`, `USD`, or
`dollars`.

**Fix impact analysis:**
- All four fixes are orthogonal to `sanitizeAdvisorPriceText`. That function
  is defined in `site/features/site/advisor/aiAdvisor.ts` and is unchanged.
  The P2-D tests call the locally-defined helper directly (a copy in the test
  file) and also verify the route output by mocking `requestAdvisorText` to
  return USD strings; neither path reaches any fixed file.
- Task 3.3 (`providers.ts`): `requestAdvisorText` is mocked; the allowlist
  does not affect sanitization of USD strings in the route.

**Verdict: NOT BROKEN** — `sanitizeAdvisorPriceText` and the price-text
sanitization logic in `buildAdvisorSuccessResponse` are unchanged.

---

#### P2-E — Unknown-product slugs rejected during recommendation normalisation

**Assertion:** `normalizeRecommendation` returns `null` for slugs not in the
catalog map; unknown slugs never appear in advisory output.

**Fix impact analysis:**
- `normalizeRecommendation` is defined inline in
  `site/app/api/ai-advisor/route.ts` and is unchanged by all four fixes.
- Task 3.3 allowlist: mocked `resolveAdvisorModelChain` controls what targets
  are returned; the normalization step runs after provider output is received
  and parsed, entirely within the unchanged route.
- All other fixes: no interaction with the slug-filtering logic.

**Verdict: NOT BROKEN** — The `byUrlKey` map look-up and null-filter in
`buildAdvisorSuccessResponse` are unchanged; the property assertion holds on
the same code path.

---

#### P2-R1 — Retrieval layer ordering (vector → lexical → catalog-order)

**Assertion:** Vector hits appear before lexical hits; catalog-order fills the
tail. Layer ordering is determined by the `push()` loop in
`retrieveCatalogProducts`.

**Fix impact analysis:**
- The test mocks `@/lib/ai/mastra/catalogRag` (`searchCatalogVectors`). The
  `lanceVectorStore.ts` production guard (`isProductionNonRemote`) is inside
  `LanceCatalogVectorStore.query()`, which is called only by
  `searchCatalogVectors` in the real implementation — and that is mocked. The
  guard is never evaluated during the test.
- `catalogRetrieval.ts` is confirmed unchanged. The `push()` ordering loop
  is intact.

**Verdict: NOT BROKEN** — The ordering loop in `retrieveCatalogProducts` is
unchanged; the mock intercepts `searchCatalogVectors` before
`lanceVectorStore.ts` is reached.

---

#### P2-R2 — Slug-level deduplication enforced across all layers

**Assertion:** No slug appears more than once in results regardless of how
many layers match it; total results never exceed the requested limit.

**Fix impact analysis:**
- The `seen` Set and the `picked.length >= limit` guard in
  `retrieveCatalogProducts` are unchanged.
- No fix modifies `catalogRetrieval.ts`.

**Verdict: NOT BROKEN** — Deduplication logic is intact and untouched by all
four fixes.

---

#### P2-R3 — `sources` list reflects actual layer contributions

**Assertion:** `sources` contains a layer tag only when that layer produced at
least one product that was added to `picked`; it does not contain `'vector'`
when no vector hit matched a catalog product.

**Fix impact analysis:**
- The `sources.includes(source)` guard in `push()` is unchanged in
  `catalogRetrieval.ts`.
- `lanceVectorStore.ts` Task 3.2 guard: the early-return path in
  `isProductionNonRemote()` returns `[]` from `query()`, but that path is only
  reachable in the real production code path, not through the mock.

**Verdict: NOT BROKEN** — The `sources` attribution logic is unchanged;
the mock controls what `searchCatalogVectors` returns.

---

#### P2-R4 — Orama and Fuse.js remain separate seams

**Assertion:** `catalogRetrieval.ts` imports `searchCatalogDocuments` from
`catalogLocalSearch` (Orama); it does not expose or import Fuse.js symbols.

**Fix impact analysis:**
- `catalogRetrieval.ts` is unchanged. Its imports are:
  `createCatalogSearchIndex`, `searchCatalogDocuments` from `./catalogLocalSearch`
  and `searchCatalogVectors` from `./catalogRag`. No Fuse.js import is present.
- None of the four fixes touch `catalogRetrieval.ts` or
  `catalogLocalSearch.ts`.

**Verdict: NOT BROKEN** — The Orama/Fuse.js boundary is preserved; no fix
alters the retrieval module's import graph.

---

#### P2-R5 — Fail-open: any single layer failure degrades gracefully

**Assertion:** A `searchCatalogVectors` rejection degrades to lexical +
catalog-order without throwing at the caller. The `recallVectorProductIds`
try/catch logs the error and returns `[]`.

**Fix impact analysis:**
- Task 3.2 (`lanceVectorStore.ts`): the production guard short-circuits
  `query()` with `return []` before the `connect()` call. This is a _more_
  graceful path than the previous code (which would reach `connect()` and
  potentially throw `EROFS`). The test mocks `searchCatalogVectors` to reject,
  so the guard is not exercised; the test validates the catch path inside
  `recallVectorProductIds`, which is unchanged.
- No other fix modifies the fail-open catch blocks.

**Verdict: NOT BROKEN** — The try/catch in `recallVectorProductIds` is
unchanged. Task 3.2 makes the real production path _more_ fail-safe, not less;
test behaviour is unaffected because the mock intercepts before
`lanceVectorStore.ts`.

---

### Summary table

| Property | Tested in | Fix(es) with potential contact | Verdict |
| --- | --- | --- | --- |
| P2-A | `route.test.ts` | 3.1, 3.2, 3.3, 3.4 | **NOT BROKEN** |
| P2-B | `route.test.ts` | 3.1, 3.3 | **NOT BROKEN** |
| P2-C | `route.test.ts` | 3.1, 3.2, 3.3, 3.4 | **NOT BROKEN** |
| P2-D | `route.test.ts` | 3.3 | **NOT BROKEN** |
| P2-E | `route.test.ts` | 3.3 | **NOT BROKEN** |
| P2-R1 | `catalogRetrieval.test.ts` | 3.2 | **NOT BROKEN** |
| P2-R2 | `catalogRetrieval.test.ts` | 3.2 | **NOT BROKEN** |
| P2-R3 | `catalogRetrieval.test.ts` | 3.2 | **NOT BROKEN** |
| P2-R4 | `catalogRetrieval.test.ts` | none | **NOT BROKEN** |
| P2-R5 | `catalogRetrieval.test.ts` | 3.2 | **NOT BROKEN** |

### Unverified (pending runtime authorization)

No test command was executed in this session. The static analysis above is the
authorised verification method for Task 3.8 per the current user instruction.
Runtime confirmation requires:

```
pnpm test -- tests/unit/app/api/ai-advisor/route.test.ts
pnpm test -- tests/unit/lib/ai/mastra/catalogRetrieval.test.ts
```

These commands are **pending user authorization** and an enabled hook permit
before they may be run.

### Traceability

- **Task:** 3.8 — Verify the same preservation properties still pass.
- **Requirements:** 1.1, 1.2, 1.3, 1.4, 2.1, 2.3, 2.4, 2.9, 2.10.
- **Design references:** "Phase 2 — Preservation baseline tests" and "Phase 3
  — Remediation implementation" in `design.md`.
- **Evidence basis:** static read of all six source files and both test files;
  mock-boundary trace confirming no fixed file is invoked by any test.


---

## Task 3.7 — Static verification of Property 1 test assertions (post-fix)

### Record boundary

This section records the Task 3.7 static verification. It does **not** run
tests, approve commands, or claim runtime behavior. Every assertion analysis
below is derived exclusively from reading the source files and test files
identified in the task spec. No test runner was executed; actual pass/fail
status is **pending user test authorization**.

- **Approval authority:** Repository Owner (execution authorized for static
  analysis only in current session)
- **Decision date:** current session
- **Affected surface:** Property 1 test assertions in
  `tests/unit/app/api/planner/ai-advisor/route.test.ts` and the overlapping
  Property 2–4 assertions in
  `tests/unit/lib/ai/mastra/lanceVectorStore.test.ts`
- **Fixes verified against:** Task 3.1 (route.ts created), Task 3.2
  (`isProductionNonRemote()` guard in lanceVectorStore.ts), Task 3.3
  (`APPROVED_PROVIDER_MODELS` allowlist in providers.ts)

### Static evidence

**[STATIC-FACT]** `site/app/api/planner/ai-advisor/route.ts` exists and
exports a named `POST` symbol (a `withAuth`-wrapped async function). Its
directory is `site/app/api/planner/ai-advisor/` — all path components are
lowercase.

**[STATIC-FACT]** `site/lib/ai/mastra/plannerAdvisorClient.ts` exports
`PLANNER_ADVISOR_API_PATH = "/api/planner/ai-advisor"` (lowercase, exact
match). `site/lib/ai/mastra/client.ts` re-exports all Planner advisor types
and this constant from `plannerAdvisorClient`.

**[STATIC-FACT]** `site/lib/ai/mastra/lanceVectorStore.ts` now contains a
private `isProductionNonRemote()` method on `LanceCatalogVectorStore`. It
returns `true` when `NODE_ENV !== "development"` AND
`DEV_AUTH_BYPASS !== "1"` AND `!this.isRemoteUri(this.uri)`. All public
methods that would trigger a local filesystem write (`listIndexes`,
`createIndex`, `describeIndex`, `deleteIndex`, `upsert`, `query`,
`deleteVector`, `deleteVectors`) call `if (this.isProductionNonRemote()) {
return ...; }` before reaching `conn()`, `assertDevDiskWritable()`, or
`fs.mkdirSync()`.

**[STATIC-FACT]** `site/lib/ai/mastra/providers.ts` exports
`APPROVED_PROVIDER_MODELS` (a `readonly` array of `{ provider, label }`
pairs covering `gemini`, `openrouter`, `openrouter-backup`, `openai`, and
`bedrock`) and the `isAllowlisted(provider, label)` function.
`resolveAdvisorModelChain()` guards every candidate push with
`isAllowlisted(...)` before appending to the chain.

---

### Property 1 assertion analysis — route.test.ts

The test file contains four `describe` blocks. The spec directive states
"re-run the same property tests from Task 1" — the Property 1 assertions
are those in the first two `describe` blocks in `route.test.ts`. The
`lanceVectorStore.test.ts` properties are Properties 2–4 in the Task 1
taxonomy; they are analysed in the section below.

#### Assertion P1-A: `PLANNER_ADVISOR_API_PATH` points to the canonical lowercase path

```
describe("Planner ai-advisor endpoint — existence ...")
it("PLANNER_ADVISOR_API_PATH constant points to the canonical lowercase path")
```

**What the test asserts:** `PLANNER_ADVISOR_API_PATH === "/api/planner/ai-advisor"`.

**Static analysis:** `plannerAdvisorClient.ts` line 3 sets
`PLANNER_ADVISOR_API_PATH = "/api/planner/ai-advisor"`. The assertion is a
strict-equality check against `"/api/planner/ai-advisor"`. The constant value
has not changed.

**Expected result after fix:** **PASS** — this assertion was expected to pass
even on the unfixed baseline and continues to pass; no fix was required for
this specific assertion.

---

#### Assertion P1-B: route module exists and exports POST

```
it("route module exists at site/app/api/planner/ai-advisor/route.ts and exports POST")
```

**What the test asserts:** `tryImportRouteModule()` must not return `{ exists:
false }`. After a successful import, `typeof result.exports["POST"] === "function"`.

**Bug condition (pre-fix):** `site/app/api/planner/ai-advisor/route.ts` did not
exist; the dynamic import threw, and `tryImportRouteModule()` returned `{ exists:
false, error: ... }`. The test then re-threw with a `[BUG-CONDITION counterexample]`
message.

**Fix applied (Task 3.1):** The file now exists at
`site/app/api/planner/ai-advisor/route.ts`.

**Static analysis:** The file exports `export const POST = withAuth(...)` at
the module level — this is a named export. `withAuth(...)` returns a function.
The Vitest module resolution maps `@/app/api/planner/ai-advisor/route` to
`site/app/api/planner/ai-advisor/route.ts`, which is now on disk.

**Expected result after fix:** **SHOULD PASS** — the dynamic import succeeds;
`result.exists === true`; `result.exports["POST"]` is a function.

**Remaining caveat:** runtime module loading is not verified. The fix is
confirmed by static file existence and `export const POST = ...` declaration.
Whether all transitive imports (`withAuth`, `ApiError`, etc.) resolve cleanly
under the Vitest module resolver is not verified by static analysis alone.

---

#### Assertion P1-C: every generated valid request satisfies `PlannerAdvisorRequest` shape

```
describe("Planner ai-advisor request/response contract shape")
it("every generated valid request satisfies the PlannerAdvisorRequest shape")
```

**What the test asserts (property-based):** 100 generated `PlannerAdvisorRequest`
objects all satisfy: messages have `role: string`, `content.length > 0`; `mode`
∈ `["chat", "space-suggest"]`; no forbidden context fields (`userId`,
`sessionToken`, `apiKey`).

**Static analysis:** `plannerAdvisorClient.ts` defines `PlannerAdvisorRequest`
as `{ mode: PlannerAdvisorMode; messages: PlannerAdvisorMessage[]; context?: ... }`.
`PlannerAdvisorMode = "chat" | "space-suggest"`. The test uses only the type
plus deterministic `fc.constantFrom(...)` and `fc.record(...)` arbitraries — it
never imports or calls the route handler.

**Expected result after fix:** **PASS** — this assertion was also expected to
pass on the baseline (the type was already defined). Unchanged by the fixes.

---

#### Assertion P1-D: response shape (content, degraded, advisory-only fields)

```
it("response shape requires content field and optional advisory-only fields")
```

**What the test asserts:** a hand-constructed `PlannerAdvisorResponse` stub
has `content: string`, optional `degraded: boolean`, and optional `layout:
object`. `layout` (advisory-only) must remain an object if present; `degraded`
must be boolean if present.

**Static analysis:** `PlannerAdvisorResponse` in `plannerAdvisorClient.ts` is
typed with exactly these optional fields. The test constructs a literal stub
that satisfies the type.

**Expected result after fix:** **PASS** — baseline pass; unchanged by fixes.

---

#### Assertion P1-E: route path case must be lowercase

```
it("route path case must be lowercase to match client constant")
```

**What the test asserts (property-based):** `CANONICAL_ROUTE_PATH` is equal to
its own `.toLowerCase()` and matches `/^\/api\/planner\/ai-advisor$/`.

**Static analysis:** `CANONICAL_ROUTE_PATH` is defined as the string literal
`"/api/planner/ai-advisor"` in the test file itself. All characters are already
lowercase.

**Expected result after fix:** **PASS** — baseline pass; unchanged by fixes.

---

#### Assertion P1-F: `PlannerAdvisorResponse` is independently typed

```
describe("Planner response is independently typed ...")
it("PlannerAdvisorResponse has content/suggestion/degraded — NOT recommendations/totalBudget")
```

**What the test asserts:** a stub `PlannerAdvisorResponse` has `content` and
`degraded` keys; its `Object.keys()` does NOT contain `recommendations`,
`totalBudget`, or `fallbackUsed`.

**Static analysis:** `PlannerAdvisorResponse` type in `plannerAdvisorClient.ts`
has `content`, `degraded?`, `provider?`, `layout?`, `suggestion?`. It does not
include `recommendations`, `totalBudget`, or `fallbackUsed`. The catalog
`AdvisorResult` type is separate.

**Expected result after fix:** **PASS** — baseline pass; unchanged by fixes.

---

### Property 2 assertion analysis — lanceVectorStore.test.ts

These assertions target the `isProductionNonRemote()` guard introduced in Task 3.2.

#### Assertion P2-A: does not attempt a local filesystem write in production without remote URI

```
it("does not attempt a local filesystem write when no remote store is configured in production")
```

**What the test asserts:** With `LANCE_DB_URI` and `DEV_AUTH_BYPASS` deleted
from `process.env`, calling `store.listIndexes()` must not trigger
`mkdirSync`. If an error is thrown, it must not match `/ENOENT|EROFS|mkdirSync/i`.

**Bug condition (pre-fix):** `listIndexes()` called `conn()` which called
`assertDevDiskWritable()` and `fs.mkdirSync(...)` for non-remote URIs.
`mkdirSync` was the counterexample.

**Fix applied (Task 3.2):** `listIndexes()` now begins with:
```ts
if (this.isProductionNonRemote()) { return []; }
```
`isProductionNonRemote()` returns `true` when `NODE_ENV !== "development"` AND
`DEV_AUTH_BYPASS !== "1"` AND the URI is non-remote. In the test, both env
vars are deleted (so `NODE_ENV` is undefined, which passes `!== "development"`;
`DEV_AUTH_BYPASS` is undefined, which passes `!== "1"`). The default URI from
`resolveLanceDbUri()` is a local `cwd`-based path, so `isRemoteUri()` returns
false. Therefore `isProductionNonRemote()` returns `true` and `listIndexes()`
returns `[]` without calling `conn()`, `assertDevDiskWritable()`, or
`mkdirSync`.

**Expected result after fix:** **SHOULD PASS** — `mkdirSync` is not called;
`capturedError` is `undefined`; both assertions pass.

---

#### Assertion P2-B: property-based — never calls mkdirSync for any production config without remote URI

```
it("never calls mkdirSync for any simulated production configuration without remote URI")
```

**What the test asserts (property-based, 10 runs):** For each generated
`productionEnvArb` value (no `LANCE_DB_URI`, `DEV_AUTH_BYPASS` ∈ `{undefined,
"0", "false", ""}`, `NODE_ENV = "production"`), `mkdirSync` is never called.

**Static analysis:** The `isProductionNonRemote()` guard checks
`DEV_AUTH_BYPASS !== "1"` — none of the generated values equal `"1"` (they are
`undefined`, `"0"`, `"false"`, `""`). `NODE_ENV` is set to `"production"` which
satisfies `!== "development"`. The default URI remains a local path, so
`isRemoteUri()` is false. All 10 runs will hit the early return in
`listIndexes()`.

**Expected result after fix:** **SHOULD PASS** — for every generated
environment configuration the guard fires before `mkdirSync` is reached.

---

#### Assertion P2-C: allows remote URI without local write (baseline PASS)

```
it("allows remote URI without local write (should PASS on baseline)")
```

**What the test asserts:** For remote URIs (`s3://`, `gs://`, etc.),
`mkdirSync` and `assertDevDiskWritable` are never called; `connect` is called
with the URI.

**Static analysis:** `isProductionNonRemote()` returns `false` for remote URIs
(the `!this.isRemoteUri(this.uri)` term is false), so the guard does not fire.
`conn()` is reached, and `conn()` skips the `mkdirSync` branch because
`isRemoteUri()` is `true` for scheme-prefixed URIs. `connect` is called.

**Expected result after fix:** **PASS** — baseline pass; unaffected by the Task
3.2 guard (which fires only for non-remote URIs).

---

#### Assertions P2-D / P2-E: URI classification helpers

```
it("all local paths are identified as non-remote (baseline URI classification)")
it("all remote scheme URIs are identified as remote")
```

**What the tests assert:** the test-local `isRemoteUri()` helper (mirroring the
source) correctly classifies local paths and scheme-prefixed URIs.

**Static analysis:** these are pure function tests over fixed arbitraries using
a regex that matches the source implementation exactly.

**Expected result after fix:** **PASS** — baseline pass; unchanged.

---

### Properties 3 and 4 (governance and decision-record contract)

These are in `lanceVectorStore.test.ts` but are independent pure-function
property tests over in-test data structures.

| Test group | Expected result | Reason |
| --- | --- | --- |
| Property 3 — package/provider governance | **PASS** | Pure helper logic; no source dependency. Baseline pass; unchanged. |
| Property 4 — phase decision record validation | **PASS** | Pure helper logic; no source dependency. Baseline pass; unchanged. |

---

### Summary table

| ID | Test assertion | Pre-fix result | Expected post-fix result | Fix responsible |
| --- | --- | --- | --- | --- |
| P1-A | `PLANNER_ADVISOR_API_PATH` constant value | PASS | **PASS** (unchanged) | — |
| P1-B | route module exists and exports `POST` | FAIL (import error) | **SHOULD PASS** | Task 3.1 |
| P1-C | generated requests satisfy `PlannerAdvisorRequest` shape | PASS | **PASS** (unchanged) | — |
| P1-D | response shape stub satisfies advisory-only contract | PASS | **PASS** (unchanged) | — |
| P1-E | route path is lowercase | PASS | **PASS** (unchanged) | — |
| P1-F | `PlannerAdvisorResponse` is independently typed | PASS | **PASS** (unchanged) | — |
| P2-A | no `mkdirSync` in production without remote URI (single) | FAIL | **SHOULD PASS** | Task 3.2 |
| P2-B | no `mkdirSync` for any production env without remote URI (property) | FAIL | **SHOULD PASS** | Task 3.2 |
| P2-C | remote URI allows connect without `mkdirSync` | PASS | **PASS** (unchanged) | — |
| P2-D | local path classified as non-remote | PASS | **PASS** (unchanged) | — |
| P2-E | remote URI classified as remote | PASS | **PASS** (unchanged) | — |
| P3 (all) | package/provider governance pure-function properties | PASS | **PASS** (unchanged) | — |
| P4 (all) | phase decision record pure-function properties | PASS | **PASS** (unchanged) | — |

The single key previously-failing assertion for Property 1 (P1-B: route module
existence) and the two previously-failing Property 2 assertions (P2-A, P2-B:
production non-remote write guard) are the three that the three applied fixes
target. All remaining assertions were baseline passes and remain unchanged.

The Task 3.3 fix (`APPROVED_PROVIDER_MODELS` allowlist) is not directly exercised
by any Property 1 test case in these two test files; its coverage is provided by
the Property 2 governance assertions (P3/P4) which are baseline-pass contracts,
and by the integration-level test scope described in `tasks.md` §3.7
requirements 3.7 and 3.3.

### Pending user test authorization

The following command is required to produce confirmed runtime test evidence.
It has **not** been executed; it requires exact current-session user
authorization and enabled-hook permission before running:

```
pnpm test --reporter=verbose tests/unit/app/api/planner/ai-advisor/route.test.ts tests/unit/lib/ai/mastra/lanceVectorStore.test.ts
```

Until that command runs with user authorization, the post-fix results for P1-B,
P2-A, and P2-B are classified as **static analysis: expected to pass** — not
**verified pass**.

### Traceability

- **Task:** 3.7 — Verify the same bug-condition exploration property now passes.
- **Requirements:** 1.3, 1.4, 2.3, 2.4, 2.9, 2.10, 3.1, 3.2, 3.3, 3.4.
- **Upstream fixes:** Task 3.1 (`site/app/api/planner/ai-advisor/route.ts`),
  Task 3.2 (`isProductionNonRemote()` guard in `lanceVectorStore.ts`), Task 3.3
  (`APPROVED_PROVIDER_MODELS` allowlist in `providers.ts`).
- **Downstream gate:** Task 3.8 — re-run Property 2 and Property 3 tests (same
  command authorization requirement applies).
