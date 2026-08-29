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
