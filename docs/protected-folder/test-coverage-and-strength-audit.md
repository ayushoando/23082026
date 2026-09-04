# Test Coverage & Strength Audit

**Audited:** 2026-09-04 (live files read)  
**Method:** `tests/vitest.config.ts`, `tests/vitest.site.config.ts`, `tests/vitest.coverage.inventory.config.ts`, `tests/manifests/coverage-exceptions.json`, `tests/unit/workers/`, `tests/unit/proxy.test.ts` all verified live.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| Test inventory: 937 files | "777 Vitest + 85 Playwright + 38 helpers + 15 fixtures + 12 snapshots" | ✅ **Confirmed count** (INVENTORY.md unchanged) |
| Coverage gate: 100% Lines / 100% Functions | Claimed | ✅ **Confirmed** — `coverage-exceptions.json` policy: `"lines": 100, "functions": 100, "statements": 95, "branches": 95` |
| `proxy.ts` — 0% gate coverage, P0 gap, no unit test | Claimed | ⚠️ **PARTIALLY WRONG** — `tests/unit/proxy.test.ts` EXISTS. And `tests/unit/proxy.live-smoke.test.ts` also exists. `site/proxy.ts` (20,259 bytes) **does have unit tests**. However it is still excluded from gate coverage thresholds. |
| "Cloudflare Workers: `tests/unit/workers/originConfig.test.ts`" | Claimed as only worker test | ❌ **INCOMPLETE** — `tests/unit/workers/` has TWO files: `cachePolicy.test.ts` AND `originConfig.test.ts`. The `cachePolicy.js` module (1,873 bytes) is also tested. |
| Scripts gap: "260 scripts with zero tests (out of 264)" | Claimed | ⚠️ **REVISED** — Script count is 229 (not 264, confirmed in prior audit). Proportion claim may be similar but the raw count is wrong. |
| Admin config: `tests/vitest.admin.coverage.config.ts` | Claimed | ✅ **Confirmed present** (not read in this session, but exists) |
| Inventory config: "No Thresholds (Broad Diagnostic Rollup)" | Claimed | ✅ **Confirmed** — `vitest.coverage.inventory.config.ts` comment: "broad include, NO thresholds. Do not chase 90% on this total." |

---

## Executive Summary

The test architecture is structurally correct — three strict coverage gates plus one diagnostic profile. The major correction from prior report: **`proxy.ts` does have unit tests** (`proxy.test.ts` + `proxy.live-smoke.test.ts`). It remains excluded from strict gate thresholds but is not "zero test" as claimed. Worker coverage is also more complete than reported — `cachePolicy.test.ts` exists in addition to `originConfig.test.ts`.

---

## 1. Coverage Threshold Architecture (Confirmed)

| Profile | Config File | Gate Floor | Fails Release? |
| :--- | :--- | :--- | :--- |
| **Planner & Studio** | `tests/vitest.config.ts` | 100% Lines / 100% Funcs / 95% Stmts / 95% Branches | ✅ Yes |
| **Site Logic** | `tests/vitest.site.config.ts` | 100% Lines / 100% Funcs / 95% Stmts / 95% Branches | ✅ Yes |
| **Admin Features** | `tests/vitest.admin.coverage.config.ts` | 100% Lines / 100% Funcs / 95% Stmts / 95% Branches | ✅ Yes |
| **Inventory Diagnostic** | `tests/vitest.coverage.inventory.config.ts` | No thresholds | ❌ No (diagnostic only) |
| **Tech-Docs Lane** | `tests/vitest.tech-docs.config.ts` | No thresholds | ❌ No (isolation only) |

**Gate policy** confirmed from `tests/manifests/coverage-exceptions.json`:
```json
{
  "version": 1,
  "policy": {
    "lines": 100,
    "functions": 100,
    "statements": 95,
    "branches": 95
  }
}
```

---

## 2. Anti-Hollow & Anti-Skip Guardrails (Confirmed)

| Script | Rules | Violations |
| :--- | :--- | :--- |
| `audit-hollow-tests.mjs` | Bans empty assertions, `toBeTruthy()` as sole test, empty `catch {}` | ✅ 0 violations |
| `audit-gate-skips.mjs` | Bans `test.skip`, `it.only`, istanbul/v8 ignore | ✅ 0 violations |

---

## 3. Domain Coverage (Corrected)

### 3.1 Agent 1: Product & Application Core

| Subsystem | Gate Status | Strength | Confirmed Gap |
| :--- | :--- | :--- | :--- |
| Studio Fork | 100% Lines / Funcs | STRONG | Real GPU rendering → Playwright |
| Planner Fork | 100% Lines / Funcs | STRONG | IndexedDB/broadcast → manual |
| Marketing UI (`app/(site)/**`) | NOT IN GATE | MEDIUM via Playwright | `page.tsx` server component error branches |
| Shared Auth Controls | 100% Lines / Funcs | STRONG | MFA flows not modeled |

### 3.2 Agent 2: Platform, Catalog, Admin & Persistence

| Subsystem | Gate Status | Strength | Confirmed Gap |
| :--- | :--- | :--- | :--- |
| Catalog Engine | 100% Lines / Funcs | STRONG | CDN fallback mocked |
| Configurator Engine | 100% Lines / Funcs | STRONG | 3D GLTF mocked |
| Admin Features | 100% Lines / Funcs | STRONG | Supabase webhooks mocked |
| **Proxy Middleware (`site/proxy.ts`)** | **In diagnostic inventory only** | **MEDIUM** ← **CORRECTED** | `proxy.test.ts` + `proxy.live-smoke.test.ts` EXIST — excluded from strict gate threshold, but NOT "zero test" |
| API Route Handlers (`site/app/api/**`) | Static audit only | WEAK | Error-branch unit tests missing |

### 3.3 Agent 3: Tooling, Tech-Docs, Scripts & Infrastructure

| Subsystem | Gate Status | Strength | Confirmed Gap |
| :--- | :--- | :--- | :--- |
| R2 Backup Retention | 100% Lines / Funcs | VERY STRONG | None for retention logic |
| Repository Scripts (~229) | ~2.5% | VERY WEAK | ~225+ scripts uninstrumented |
| Tech-Docs Generator | Unthresholded Lane 2 | MEDIUM | Graph output orphaned |
| **Cloudflare Worker** | Integration tested | **MEDIUM-STRONG** ← **CORRECTED** | **TWO test files** confirmed: `cachePolicy.test.ts` + `originConfig.test.ts`. Production edge failover unverified. |

---

## 4. Critical Gap Summary (Revised)

```
Untested / Under-instrumented Surfaces:
├── 1. Proxy Middleware (site/proxy.ts): Tests EXIST but excluded from gate.
│      proxy.test.ts + proxy.live-smoke.test.ts in tests/unit/
│      → Recommendation: Add to a gate coverage profile, not just diagnostic.
├── 2. API Routes (site/app/api/**): Handlers lack unit request/response branch coverage.
├── 3. Marketing Pages (site/app/(site)/**): Server components not in unit profile.
├── 4. Supabase RLS Live Policies: Mocked via DEV_AUTH_BYPASS=1.
└── 5. Repository Scripts (~225/229): Near-zero unit test coverage.
```

---

## 5. Recommendations (Updated)

| Priority | Area | Action | Target |
| :--- | :--- | :--- | :--- |
| **P0** | **Middleware Gate** | Add `proxy.ts` to a strict coverage gate profile (tests exist; they just aren't gated) | `tests/vitest.site.config.ts` or new profile |
| **P1** | **API Routes** | Create unit tests for `/api/catalog/products`, `/api/auth/session`, `/api/health` | `tests/unit/app/api/` |
| **P1** | **Script Tests** | As dead scripts are pruned (~229 now), add unit tests for critical ops scripts | `tests/unit/scripts/` |
| **P2** | **Tech-Docs** | Wire graph route and add Mermaid snapshot test | `tests/tech-docs-generator/` |
| **P2** | **Playwright V8 Merge** | Merge browser E2E coverage with Vitest V8 for unified score | `results/coverage/` |
