# AI Package Remediation — Validation Matrix

**Task:** 4.1 — Build the exact validation matrix for the approved changed surface
**Authority:** Repository Owner — "all owner approvals are granted" (current session)
**Status:** documentation/planning artifact — no command has been run or observed this session

---

## Evidence basis

This matrix was produced by static read-only inspection of:

- `site/app/api/Planner/ai-advisor/route.ts` — Task 3.1 implementation
- `site/lib/ai/mastra/lanceVectorStore.ts` — Task 3.2 implementation
- `site/lib/ai/mastra/providers.ts` — Task 3.3 implementation
- `site/lib/observability/aiMetrics.ts` — Task 3.4 implementation
- `tests/unit/app/api/Planner/ai-advisor/route.test.ts` — Task 1 exploration test
- `tests/unit/lib/ai/mastra/lanceVectorStore.test.ts` — Task 1/2 property tests
- `tests/unit/app/api/ai-advisor/route.test.ts` — Task 2 preservation tests
- `tests/unit/lib/ai/mastra/catalogRetrieval.test.ts` — Task 2 preservation tests
- `tests/unit/lib/observability/aiMetrics.test.ts` — Task 3.4 unit tests
- `tests/vitest.config.ts` — to confirm `@/app` alias → `site/app`
- `.kiro/specs/ai-package-remediation/decision-record.md` — all task sections

**No build, test, typecheck, lint, provider call, or deployment has been run or observed this session.**

---

## Critical open item — Planner route path-case mismatch

| ID | Status | Description |
|----|--------|-------------|
| OI-1 | **BLOCKED ON OWNER DECISION** | The Planner advisor route was created at `site/app/api/Planner/ai-advisor/route.ts` (capitalized `Planner/`). The client constant `PLANNER_ADVISOR_API_PATH = "/api/planner/ai-advisor"` and the Task 1 test import (`@/app/api/planner/ai-advisor/route`) both target the lowercase `planner/` path. On Windows (case-insensitive filesystem) the Vitest alias `@/app → site/app` resolves the import successfully because the OS matches `Planner` to `planner`. On Linux and Vercel (case-sensitive filesystem) the same import returns a module-not-found error — the original bug condition (S9, S10 in design.md). The existing `site/app/api/Planner/` directory uses the capitalized convention for all other Planner API routes (`catalog`, `handoff`, `projects`, `sketch-to-plan`). |
| OI-1a | pending owner | **Option A — rename `site/app/api/Planner/` to `site/app/api/planner/`**: fixes case-sensitivity for all Planner routes; requires verifying no other file imports from the capitalized path, and a separate filesystem-change approval per decision record P-01/P-02. |
| OI-1b | pending owner | **Option B — add a lowercase alias route `site/app/api/planner/ai-advisor/route.ts`** that re-exports the handler from the capitalized path: resolves the import without renaming the tree; does not fix the underlying path-case inconsistency for other Planner routes; requires verifying Next.js handles duplicate route segments. |
| OI-1c | pending owner | **Option C — move only the ai-advisor handler to the lowercase subtree** `site/app/api/planner/ai-advisor/route.ts`, leaving other `Planner/` routes in place: minimal blast radius; preserves existing Planner route convention; a later separate approval can rename the full `Planner/` tree. |

**Until OI-1 is resolved with an owner decision, the following validations are blocked:**

- The Task 1 exploration test `P1-B` (route module exists and exports `POST`) is expected to fail with a module-not-found error on case-sensitive hosts (Linux/Vercel CI). On Windows dev machines the test may pass incidentally due to case-insensitive FS.
- The `pnpm run typecheck` result for the planner route import path is unreliable on Windows and will differ from CI.
- Any E2E or integration test that calls `POST /api/planner/ai-advisor` against a Linux host will receive a 404.

---

## Changed path inventory

All paths below are listed relative to the repository root. Each entry is marked **[NEW]** (created) or **[MODIFIED]**.

| # | Path | Task | Change summary |
|---|------|------|---------------|
| C1 | `site/app/api/Planner/ai-advisor/route.ts` | 3.1 | **[NEW]** Planner advisor POST handler — `withAuth(guest, requireCsrf, rateLimit: planner-advisor/5)`, `PlannerAdvisorRequestSchema` validation, independent `PlannerAdvisorResponse` contract, deterministic `degraded: true` fallback, no plan mutation, no Studio import |
| C2 | `site/lib/ai/mastra/lanceVectorStore.ts` | 3.2 | **[MODIFIED]** Added `isProductionNonRemote()` guard; all public write/read methods (`createIndex`, `listIndexes`, `describeIndex`, `deleteIndex`, `upsert`, `query`, `deleteVector`, `deleteVectors`) return early with a safe sentinel value when the guard fires — preventing `conn()`, `assertDevDiskWritable()`, and `fs.mkdirSync()` from executing in production without a remote URI |
| C3 | `site/lib/ai/mastra/providers.ts` | 3.3 | **[MODIFIED]** Added `APPROVED_PROVIDER_MODELS` readonly allowlist, `isAllowlisted()` function, `filterAllowlistedChain()` function; `resolveAdvisorModelChain()` now gates every candidate push on `isAllowlisted(provider, label)` before adding to the chain |
| C4 | `site/lib/observability/aiMetrics.ts` | 3.4 | **[NEW]** Privacy-safe AI observability module; exposes `recordAdvisorRequest(input)` that emits aggregate `Counter`/`Histogram`/`Gauge` metrics with approved label-only values; singleton via `globalThis`; imports `"server-only"`; no PII, no prompt text, no session identifiers, no secrets in labels |
| T1 | `tests/unit/app/api/Planner/ai-advisor/route.test.ts` | 1 | **[NEW]** Task 1 Property 1 exploration test — dynamic import of `@/app/api/planner/ai-advisor/route` (lowercase); asserts handler exists and exports `POST`; asserts path case is lowercase; asserts request/response contract shape; PBT over valid request arbitraries |
| T2 | `tests/unit/lib/ai/mastra/lanceVectorStore.test.ts` | 1/2 | **[MODIFIED]** Extended with production non-remote write guard tests (P2-A, P2-B) and preservation/URI-classification properties (P2-C through P2-E); governance and decision-record contract properties (P3, P4) |
| T3 | `tests/unit/app/api/ai-advisor/route.test.ts` | 2 | **[MODIFIED]** Preservation baseline — P2-A through P2-E covering advisory-only, boundary guards, fallback visibility, INR discipline, unknown-product rejection |
| T4 | `tests/unit/lib/ai/mastra/catalogRetrieval.test.ts` | 2 | **[MODIFIED]** Preservation baseline — P2-R1 through P2-R5 covering retrieval ordering, slug deduplication, source attribution, Orama/Fuse separation, and fail-open degradation |
| T5 | `tests/unit/lib/observability/aiMetrics.test.ts` | 3.4 | **[NEW]** Fixture-driven unit tests for `aiMetrics.ts` — asserts label PII-safety, counter/histogram/gauge increment logic, error class, schema validity, and retrieval source counters; full mock isolation via `vi.mock("@prometheus-io/client")` |
| D1 | `.kiro/specs/ai-package-remediation/decision-record.md` | 0–3.8 | **[MODIFIED]** Appended decision records for Tasks 0.1–0.6, 3.5, 3.6, 3.7, 3.8 |

---

## Validation matrix

Legend:

| Symbol | Meaning |
|--------|---------|
| ✅ required | This validation tier is applicable to the path and must be completed |
| — | Not required for this surface or path type |
| ⬛ blocked | Blocked on owner decision OI-1 (path-case) before this validation is meaningful |
| `pending auth` | Command identified; requires exact current-session owner authorization and enabled-hook permission before it may run |

### C1 — `site/app/api/Planner/ai-advisor/route.ts`

| Tier | Status | Notes |
|------|--------|-------|
| Source-level review | ✅ required | Verify: `withAuth` options (role `guest`, `requireCsrf:true`, `rateLimitScope:"planner-advisor"`, `rateLimit:5`); `PlannerAdvisorRequestSchema` used independently of catalog schema; response is `PlannerAdvisorResponse` or `{degraded:true}`; no Studio import; no plan/catalog mutation; `"server-only"` boundary not weakened |
| Fork-boundary check | ✅ required `pending auth` | The handler is in `Planner/` tree. Proposed command: `pnpm run scan:boundaries` — **pending authorization** |
| TypeScript typecheck | ✅ required `pending auth` **⬛ partially blocked** | The `import` path used by the test (`@/app/api/planner/ai-advisor/route`) resolves on case-insensitive FS; OI-1 must be resolved to get a reliable result on CI. Proposed command: `pnpm run typecheck` — **pending authorization** |
| Lint | ✅ required `pending auth` | Proposed command: `pnpm run lint` — **pending authorization** |
| Unit / property tests | ✅ required `pending auth` **⬛ OI-1 blocks full pass** | Primary: `tests/unit/app/api/Planner/ai-advisor/route.test.ts` (P1-B, P1-C, P1-D). On case-sensitive CI the T1 import assertion (P1-B) is expected to fail until OI-1 is resolved. Proposed command: `pnpm run test -- tests/unit/app/api/Planner/ai-advisor/route.test.ts` — **pending authorization** |
| Preservation tests | ✅ required `pending auth` | Verify C1 does not break catalog route behavior: `tests/unit/app/api/ai-advisor/route.test.ts`. Proposed command: `pnpm run test -- tests/unit/app/api/ai-advisor/route.test.ts` — **pending authorization** |
| Security/privacy review | ✅ required | Manual: confirm no secret in response payload; confirm `userId` and session data are not forwarded to the provider; confirm `degraded: true` is visible and cannot be misread as authoritative; confirm no mutation path exists |
| Integration tests | — | No integration test path was approved; the planner-assist E2E spec requires separate authorization |
| E2E (Planner-assist) | — `pending auth` **⬛ blocked OI-1** | Any E2E against a Linux host will receive a 404 until OI-1 is resolved. Proposed when unblocked: separate owner-authorized `pnpm exec playwright test` scoped to planner-ai-assist spec |
| Deployment | — | Excluded — no deployment authorization |

---

### C2 — `site/lib/ai/mastra/lanceVectorStore.ts`

| Tier | Status | Notes |
|------|--------|-------|
| Source-level review | ✅ required | Verify: `isProductionNonRemote()` guard applied to every public method before `conn()` is reached; `isRemoteUri()` regex covers all expected remote schemes; guard condition (`NODE_ENV !== "development"` AND `DEV_AUTH_BYPASS !== "1"` AND `!isRemoteUri(uri)`) matches the design's intent; no other code path bypasses the guard; `assertDevDiskWritable()` and `fs.mkdirSync()` are still only reached when the guard returns false (dev mode or remote URI) |
| TypeScript typecheck | ✅ required `pending auth` | Proposed command: `pnpm run typecheck` — **pending authorization** |
| Lint | ✅ required `pending auth` | Proposed command: `pnpm run lint` — **pending authorization** |
| Unit / property tests | ✅ required `pending auth` | Primary: `tests/unit/lib/ai/mastra/lanceVectorStore.test.ts` — P2-A (single production no-write), P2-B (property-based production no-write), P2-C (remote URI allows connect), P2-D/P2-E (URI classification). Proposed command: `pnpm run test -- tests/unit/lib/ai/mastra/lanceVectorStore.test.ts` — **pending authorization** |
| Preservation tests — retrieval | ✅ required `pending auth` | Verify C2 does not break retrieval ordering/deduplication/fail-open: `tests/unit/lib/ai/mastra/catalogRetrieval.test.ts`. Proposed command: `pnpm run test -- tests/unit/lib/ai/mastra/catalogRetrieval.test.ts` — **pending authorization** |
| Security/privacy review | ✅ required | Manual: confirm no local filesystem path is reachable from any production code path that bypasses the guard; confirm the guard cannot be disabled by a mis-set env var; confirm the "unavailable" return value (`[]` / empty stats) is consumed safely by callers |
| Fork-boundary check | — | `lanceVectorStore.ts` is in `lib/ai/mastra/` (shared), not a fork tree |
| Integration / E2E | — | Vector recall integration is out of scope unless a remote store is approved and separately authorized |
| Deployment | — | Excluded |

---

### C3 — `site/lib/ai/mastra/providers.ts`

| Tier | Status | Notes |
|------|--------|-------|
| Source-level review | ✅ required | Verify: `APPROVED_PROVIDER_MODELS` contains exactly the owner-approved pairs and is `readonly`; `isAllowlisted()` uses strict equality on both `provider` and `label`; every `chain.push()` in `resolveAdvisorModelChain()` is guarded by `isAllowlisted(...)`; no new entry is added that bypasses the allowlist; `filterAllowlistedChain()` is a post-hoc safety net only and is not required for normal flow correctness |
| TypeScript typecheck | ✅ required `pending auth` | Proposed command: `pnpm run typecheck` — **pending authorization** |
| Lint | ✅ required `pending auth` | Proposed command: `pnpm run lint` — **pending authorization** |
| Unit / property tests | ✅ required `pending auth` | Primary: `tests/unit/lib/ai/mastra/providers.test.ts` (existing + any Task 3.3 additions). Also: `tests/unit/lib/ai/providerChain.test.ts`. Proposed command: `pnpm run test -- tests/unit/lib/ai/mastra/providers.test.ts tests/unit/lib/ai/providerChain.test.ts` — **pending authorization** |
| Preservation tests — catalog route | ✅ required `pending auth` | Verify allowlist does not break catalog fallback: `tests/unit/app/api/ai-advisor/route.test.ts`. Proposed command: `pnpm run test -- tests/unit/app/api/ai-advisor/route.test.ts` — **pending authorization** |
| Security/privacy review | ✅ required | Manual: confirm no credential value appears in any label, log, or response; confirm that a configured-but-not-allowlisted key does not reach a provider; confirm empty allowlist degrades deterministically to `fallbackUsed: true` |
| Fork-boundary check | — | `providers.ts` is in `lib/ai/mastra/` (shared), not a fork tree |
| Integration / E2E | — | Provider network calls are out of scope |
| Deployment | — | Excluded |

---

### C4 — `site/lib/observability/aiMetrics.ts`

| Tier | Status | Notes |
|------|--------|-------|
| Source-level review | ✅ required | Verify: `RecordAdvisorRequestInput` has no PII-accepting fields (`promptText`, `sessionId`, `queryString`, `responseBody`, `providerKey` must be absent from the type); all label values come from approved union types (`AiSurface`, `AiErrorClass`, `AiRetrievalSource`, `AiFallbackReason`, `string` for provider — must be an allowlisted short name, not a secret); `"server-only"` import is present; singleton pattern via `globalThis` matches existing `metrics.ts` pattern; existing `metrics.ts` (process-level defaults) is unmodified |
| TypeScript typecheck | ✅ required `pending auth` | Proposed command: `pnpm run typecheck` — **pending authorization** |
| Lint | ✅ required `pending auth` | Proposed command: `pnpm run lint` — **pending authorization** |
| Unit / property tests | ✅ required `pending auth` | Primary: `tests/unit/lib/observability/aiMetrics.test.ts`. Proposed command: `pnpm run test -- tests/unit/lib/observability/aiMetrics.test.ts` — **pending authorization** |
| Privacy review | ✅ required | Manual: confirm no approved test label contains an example session ID, query, or response body; confirm the `provider` label field cannot carry a key or token value at runtime; verify `decision-record.md` section 0.4 T-01 through T-07 thresholds are all recorded as `pending` (no invented numeric threshold was added) |
| Fork-boundary check | — | `lib/observability/` is shared, not a fork tree |
| Integration / E2E | — | Metric emission is observable via Prometheus scrape endpoint; an integration test against a live server is out of scope and not authorized |
| Deployment | — | Excluded |

---

### T1 — `tests/unit/app/api/Planner/ai-advisor/route.test.ts`

| Tier | Status | Notes |
|------|--------|-------|
| Source-level review | ✅ required | Verify: the dynamic import targets `"@/app/api/planner/ai-advisor/route"` (lowercase) — this is the bug-condition assertion and must NOT be weakened; `fast-check` arbitraries use only deterministic in-process data; no provider or network calls; expected counterexample on case-sensitive CI is documented |
| Test run | ✅ required `pending auth` **⬛ OI-1 affects P1-B** | Expected: P1-A/C/D/E/F pass (baseline pass, unchanged); P1-B expected to fail on case-sensitive CI until OI-1 is resolved. Result on Windows dev machine may differ. Proposed command: `pnpm run test -- tests/unit/app/api/Planner/ai-advisor/route.test.ts` — **pending authorization** |
| Typecheck / lint | — | Test file; covered by the full typecheck/lint pass |

---

### T2 — `tests/unit/lib/ai/mastra/lanceVectorStore.test.ts`

| Tier | Status | Notes |
|------|--------|-------|
| Source-level review | ✅ required | Verify: the `mkdirSync` mock intercepts the call correctly; `productionEnvArb` generator in P2-B does not generate `DEV_AUTH_BYPASS === "1"` (would bypass the guard and make the property tautologically vacuous); P2-C correctly sets a remote URI and verifies `connect` is called |
| Test run | ✅ required `pending auth` | Expected: P2-A/B should pass with Task 3.2 fix; P2-C/D/E and governance/decision-record properties are baseline passes. Proposed command: `pnpm run test -- tests/unit/lib/ai/mastra/lanceVectorStore.test.ts` — **pending authorization** |
| Typecheck / lint | — | Covered by full pass |

---

### T3 — `tests/unit/app/api/ai-advisor/route.test.ts`

| Tier | Status | Notes |
|------|--------|-------|
| Source-level review | ✅ required | Verify the catalog route preservation baseline is unchanged and does not accidentally import from a fixed file |
| Test run | ✅ required `pending auth` | All five preservation properties (P2-A through P2-E) should pass before and after the fix. Proposed command: `pnpm run test -- tests/unit/app/api/ai-advisor/route.test.ts` — **pending authorization** |
| Typecheck / lint | — | Covered by full pass |

---

### T4 — `tests/unit/lib/ai/mastra/catalogRetrieval.test.ts`

| Tier | Status | Notes |
|------|--------|-------|
| Source-level review | ✅ required | Verify P2-R1 through P2-R5 preservation properties are intact and mock boundaries are correct |
| Test run | ✅ required `pending auth` | All five retrieval preservation properties should pass. Proposed command: `pnpm run test -- tests/unit/lib/ai/mastra/catalogRetrieval.test.ts` — **pending authorization** |
| Typecheck / lint | — | Covered by full pass |

---

### T5 — `tests/unit/lib/observability/aiMetrics.test.ts`

| Tier | Status | Notes |
|------|--------|-------|
| Source-level review | ✅ required | Verify `vi.mock("@prometheus-io/client")` fully captures all metric calls; `globalThis.__oandoAiAdvisorMetrics` is cleared in `beforeEach`; no real Prometheus registry is created; no PII example values used in test fixtures |
| Test run | ✅ required `pending auth` | Expected to pass. Proposed command: `pnpm run test -- tests/unit/lib/observability/aiMetrics.test.ts` — **pending authorization** |
| Typecheck / lint | — | Covered by full pass |

---

## Proposed command sequence (all pending authorization)

The commands below are listed in recommended execution order. Every item requires exact current-session owner authorization and enabled-hook permission before it may run. No command has been executed; no result is claimed.

| Step | Command | Scope | Blocked by | Status |
|------|---------|-------|-----------|--------|
| 1 | `pnpm run scan:boundaries` | Studio/Planner fork boundary | OI-1 decision recommended first | pending authorization |
| 2 | `pnpm run typecheck` | Full site/ TypeScript | OI-1 affects planner route import reliability | pending authorization |
| 3 | `pnpm run lint` | oxlint across workspace | — | pending authorization |
| 4 | `pnpm run test -- tests/unit/lib/observability/aiMetrics.test.ts` | C4 unit tests | — | pending authorization |
| 5 | `pnpm run test -- tests/unit/lib/ai/mastra/lanceVectorStore.test.ts` | C2 property tests | — | pending authorization |
| 6 | `pnpm run test -- tests/unit/lib/ai/mastra/providers.test.ts tests/unit/lib/ai/providerChain.test.ts` | C3 unit tests | — | pending authorization |
| 7 | `pnpm run test -- tests/unit/app/api/ai-advisor/route.test.ts tests/unit/lib/ai/mastra/catalogRetrieval.test.ts` | Preservation baseline (T3, T4) | — | pending authorization |
| 8 | `pnpm run test -- tests/unit/app/api/Planner/ai-advisor/route.test.ts` | Planner route property tests (T1) | OI-1 — P1-B expected to fail on case-sensitive host | pending authorization |
| 9 | `pnpm run gate:fast` | Dev-loop gate (type + lint + unit) | OI-1 affects gate result reliability | pending authorization |
| 10 | *(Planner E2E, when OI-1 resolved and separately authorized)* | Planner-assist browser workflow | OI-1 required first; separate authorization | not yet proposed |
| 11 | `pnpm run gate` | Full ship gate | OI-1 resolution + all above steps | pending authorization |

> `typecheck:scripts` is **not** a valid proposed check — its referenced `scripts/tsconfig.json` file is absent. It is excluded from this matrix.
>
> Full builds, provider calls, package operations, migrations, and deployments are **excluded** from this matrix unless separately authorized.

---

## Security and privacy checklist

These items are manual review actions and do not require command authorization.

| ID | Item | Applicable to | Status |
|----|------|--------------|--------|
| SP-1 | Confirm `site/app/api/Planner/ai-advisor/route.ts` imports `"server-only"` or that all its imports do | C1 | pending review |
| SP-2 | Confirm no credential, session token, or personal data field is passed to the provider chain or returned in the response | C1, C3 | pending review |
| SP-3 | Confirm `aiMetrics.ts` label types cannot carry secret values at call sites | C4 | pending review |
| SP-4 | Confirm `isProductionNonRemote()` cannot be bypassed by an unexpected env var combination | C2 | pending review |
| SP-5 | Confirm `APPROVED_PROVIDER_MODELS` is `readonly` and cannot be mutated at runtime | C3 | pending review |
| SP-6 | Confirm the Planner advisor route applies its own `withAuth` and does not reuse or inherit catalog advisor auth state | C1 | pending review |
| SP-7 | Confirm all existing `site/app/api/ai-advisor/route.ts` controls (`requireCsrf`, `rateLimit:5`, `role:guest`) remain unchanged | T3 baseline | pending review |
| SP-8 | Confirm no metric label, counter increment, or histogram value carries a raw query string or response body | C4 | pending review |

---

## Deferred validations (not applicable to this change set)

| Validation | Reason deferred |
|-----------|----------------|
| `pnpm run verify:focss` | No CSS or FOCSS file was modified |
| `pnpm run lint:ui:strict` | No client component or UI file was modified |
| `pnpm run check:style-tokens` | No Tailwind/token file was modified |
| Migration dry-run (`pnpm run db:apply -- --dry`) | No migration was created |
| Provider reachability / integration test with live provider | Out of scope; no provider call is authorized by this task |
| Remote vector store integration | Out of scope; no remote store is configured or approved |
| Retrieval evaluation scenarios (design.md §"Observability and Evaluation Architecture") | Pending threshold decisions T-01 through T-07 (decision record 0.4) |
| E2E Planner-assist workflow | Blocked by OI-1 and separate authorization requirement |
| Full `pnpm run gate` | Pending all steps above and OI-1 resolution |

---

## Requirements traceability

| Requirement | Addressed by (this matrix) |
|-------------|---------------------------|
| 2.3 — route to matching/degraded handler | C1 source/fork-boundary/type/lint/unit review; OI-1 open item |
| 2.4 — no production write, report unavailable | C2 source/type/lint/property review |
| 2.5 — remote-only retrieval + deterministic fallback | C2 review; deferred to remote-store decision |
| 2.6 — provider allowlist + data policy | C3 source/type/lint/unit/security review; C1 SP-2 |
| 2.7 — evaluation scenarios + metrics | C4 source/type/lint/unit/privacy review; T-01–T-07 deferred |
| 2.8 — package change gate | No package changed; decision record section 3.5 confirms retain recommendation |
| 2.9 — staged plan + validation map | This document |
| 2.10 — read-only until approval | All commands listed as pending authorization |
| 3.1 — advisory-only, no auto change | C1 source review + SP-6 |
| 3.2 — deterministic degraded fallback | C1/C2/C3 source review; T3 preservation test |
| 3.3 — INR bands / no fake BOQ | T3 preservation test (P2-D) |
| 3.4 — security controls before provider call | C1 SP-1/SP-2/SP-6; T3 preservation test (P2-B) |
| 3.5 — Orama vs Fuse separate | T4 preservation test (P2-R4) |
| 3.6 — preserve unrelated artifacts | Decision record 3.5/3.6; deferred commands list |
| 3.7 — authorization + hook permission | All commands listed as pending authorization; OI-1 open item documented |

---

## Completion criterion for Task 4.1

This task is complete when:

1. This document is written and committed (as a documentation artifact — no command was run).
2. OI-1 is presented to the Repository Owner for an explicit path-case decision.
3. The owner acknowledges the pending-authorization status of all listed commands.

Task 4.1 does NOT claim any validation was executed or passed.
The observed validation evidence required by Tasks 3.7 and 3.8 remains classified as **static analysis: expected to pass** until commands are run under separate owner authorization with enabled-hook permission.

---

## Document metadata

- **Generated by:** static read-only analysis (no commands run)
- **Session:** exact calendar date unavailable to the agent; recorded as session-date of this write
- **Classification convention:** every claim is `[STATIC-FACT]` (read from live source), `[OWNER-DECISION]` (pending), or `[UNVERIFIED]` (not confirmed by a command). No runtime behavior is asserted.
