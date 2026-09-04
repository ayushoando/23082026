# Three-Agent Comprehensive Test Coverage & Strength Audit

**Date:** 2026-09-04  
**Auditors:** Agent 1 (Product & Core Apps), Agent 2 (Platform, Catalog & Admin), Agent 3 (Tooling, Tech-Docs & Infrastructure)  
**Total Test Inventory:** **937 test files** (777 Vitest executable test files, 85 Playwright browser specs, 38 helpers, 15 fixtures, 12 snapshots)  
**Strict Enforcement Baseline:** `tests/manifests/coverage-exceptions.json` (Gate: 100% Lines, 100% Functions, 95% Statements, 95% Branches)

---

## Executive Summary

```
Repository Test Landscape:
├── Total Test Executables: 937 files (777 Vitest + 85 Playwright specs)
├── Gate Enforcement: 100% Lines / 100% Functions on instrumented gate profiles
├── High Strength Areas:
│   ├── Planner & Studio State Engines (Store, Reducers, Actions)
│   ├── Catalog Classification, Canonical URLs & Product Slugs
│   ├── Admin Feature Logic & Security Boundary Assertions
│   └── Anti-Hollow Gate: 0 empty catches, 0 fake assertions, 0 unapproved skips
└── Critical Gaps (Uncovered Surfaces):
    ├── Marketing Route Handlers (app/(site)/**) not in line-coverage gates
    ├── API Route Handlers (app/api/**) lack unit coverage (static audit only)
    ├── Security Proxy Middleware (site/proxy.ts) relegated to non-gated diagnostic
    ├── Live Supabase RLS Policies bypassed via DEV_AUTH_BYPASS=1 in unit runs
    └── 97% of scripts/ (over 250 script files) completely uninstrumented
```

---

# 1. Coverage Thresholds & Gate Architecture

The repository divides testing into three separate profile gates plus one diagnostic inventory:

| Profile | Config File | Target Surface | Approved Gate Floor | Gate Enforcement |
| :--- | :--- | :--- | :--- | :--- |
| **Planner & Studio** | [`tests/vitest.config.ts`](file:///d:/23082026/tests/vitest.config.ts) | `components/{Planner,Studio}`, `lib/{Planner,Studio}`, `store/{Planner,Studio}`, `hooks/{Planner,Studio}` | 100% Lines / 100% Funcs / 95% Stmts / 95% Branches | **STRICT (Fails Release Gate)** |
| **Site Logic** | [`tests/vitest.site.config.ts`](file:///d:/23082026/tests/vitest.site.config.ts) | `features/site/data`, `lib/catalog`, `lib/configurator`, `features/site/assistant`, `features/ops` | 100% Lines / 100% Funcs / 95% Stmts / 95% Branches | **STRICT (Fails Release Gate)** |
| **Admin Features** | [`tests/vitest.admin.coverage.config.ts`](file:///d:/23082026/tests/vitest.admin.coverage.config.ts) | `features/admin/**/*.{ts,tsx}` | 100% Lines / 100% Funcs / 95% Stmts / 95% Branches | **STRICT (Fails Release Gate)** |
| **Inventory Diagnostic** | [`tests/vitest.coverage.inventory.config.ts`](file:///d:/23082026/tests/vitest.coverage.inventory.config.ts) | `app/api/**`, `features/**`, `lib/**`, `server/**`, `platform/**`, `proxy.ts` | **No Thresholds** (Broad Diagnostic Rollup) | Diagnostic only |
| **Tech-Docs Lane** | [`tests/vitest.tech-docs.config.ts`](file:///d:/23082026/tests/vitest.tech-docs.config.ts) | `tests/tech-docs-generator/**` | **No Thresholds** (Separated for concurrency isolation) | Isolated Lane |

---

# 2. Test Strength & Anti-Hollow Auditing

Unlike repositories that report high coverage with hollow or tautological tests, this codebase enforces two automated static guardrails:

### Anti-Hollow & Anti-Skip Guardrails

| Guardrail Script | Command | Rules Checked | Violations in Tree |
| :--- | :--- | :--- | :--- |
| [`scripts/general/audit-hollow-tests.mjs`](file:///d:/23082026/scripts/general/audit-hollow-tests.mjs) | `pnpm run test:audit:hollow` | • Banned: `expect(true).toBe(true)`<br>• Banned: Sole `toBeTruthy()` or `toBeDefined()` in file<br>• Banned: Empty `catch (...) {}` blocks swallowing errors<br>• Banned: `it()` blocks with 0 `expect()` assertions | ✅ **0 Hollow Violations** |
| [`scripts/general/audit-gate-skips.mjs`](file:///d:/23082026/scripts/general/audit-gate-skips.mjs) | `pnpm run test:audit:gate-skips` | • Banned: `test.skip`, `it.skip`, `describe.skip`<br>• Banned: `test.only`, `it.only` (focused tests)<br>• Banned: `/* istanbul ignore */`, `/* v8 ignore */` | ✅ **0 Unapproved Skips** |

---

# 3. Unit-Wise 3-Agent Domain Audit

## Agent 1: Product & Application Core (`site/app`, `site/components`, `site/hooks`, `site/store`)

### Coverage & Strength by Unit

| Subsystem / Unit | Files Tested | Gate Coverage Status | Test Strength & Methodology | Gaps & Uncovered Areas |
| :--- | :--- | :--- | :--- | :--- |
| **Studio Fork (`oostudio`)** | `components/Studio/**`<br>`lib/Studio/**`<br>`store/Studio/**`<br>`hooks/Studio/**` | **100% Lines / 100% Funcs** (Gate PASS) | **STRONG (State & Reducers)**<br>Fabric canvas mocked in happy-dom; state mutations, action dispatches, and export serializers verified with rigorous property assertions. | Real Canvas/WebGL GPU pixel rendering is not tested in happy-dom (relies on Playwright). |
| **Planner Fork (`ooplanner`)** | `components/Planner/**`<br>`lib/Planner/**`<br>`store/Planner/**`<br>`hooks/Planner/**` | **100% Lines / 100% Funcs** (Gate PASS) | **STRONG (Collision, Snap, History)**<br>Undo/redo stacks, block transforms, collision math, and session timeouts verified with deep matrix tests. | Offline IndexedDB fallback and multi-tab broadcast channels rely on manual browser tests. |
| **Marketing UI Routes (`app/(site)/**`)** | `app/(site)/**/page.tsx` | **NOT IN LINE-COVERAGE GATE** | **MEDIUM (Integration/DOM)**<br>Tested via Playwright specs (`tests/e2e/`) and static route contract assertions. | `page.tsx` server components lack automated unit branch coverage for metadata error fallbacks. |
| **Shared Auth Controls** | `features/shared/auth/**` | **100% Lines / 100% Funcs** | **STRONG**<br>Simulates login, token expiration, session refresh, and unverified user states with happy-dom component trees. | Multi-factor auth (MFA) flows not modeled. |

---

## Agent 2: Platform, Catalog, Admin & Persistence (`site/platform`, `site/lib/catalog`, `site/features/admin`)

### Coverage & Strength by Unit

| Subsystem / Unit | Files Tested | Gate Coverage Status | Test Strength & Methodology | Gaps & Uncovered Areas |
| :--- | :--- | :--- | :--- | :--- |
| **Catalog Engine** | `lib/catalog/**`<br>`lib/catalog/site/**` | **100% Lines / 100% Funcs** (Gate PASS) | **STRONG (Algorithmic & Property)**<br>Canonical category classification, slug normalization, price formatting, and search filters tested against real fixtures. | Catalog image fallbacks for missing CDN assets rely on static JSON mocks. |
| **Configurator Engine** | `lib/configurator/**` | **100% Lines / 100% Funcs** (Gate PASS) | **STRONG**<br>Parametric dimensional formulas, price calculation matrices, and material option dependencies rigorously tested. | 3D GLTF asset loading in configurator is mocked out. |
| **Admin Feature Surface** | `features/admin/**` | **100% Lines / 100% Funcs** (Gate PASS) | **STRONG**<br>Audit logging, price-book governance, plan state transitions, and staff privilege escalation guards tested. | Live Supabase webhook callbacks are mocked. |
| **Proxy Middleware (`site/proxy.ts`)** | `site/proxy.ts` (20KB) | **0% GATE COVERAGE** (In diagnostic inventory only) | **WEAK (Tested only as part of E2E)**<br>No dedicated isolated unit test suite validating edge routing rules, IP header preservation, and route protection. | **CRITICAL GAP:** Edge routing and header sanitization in `proxy.ts` has zero unit tests. |
| **API Route Handlers (`site/app/api/**`)** | `app/api/**/route.ts` | **0% GATE COVERAGE** (Audited statically only) | **STATIC ONLY**<br>`audit-api-route-safety.mjs` checks that route handlers export GET/POST and check auth, but does not instrument lines. | Missing unit test suites for API edge error branches (e.g. rate-limit responses, malformed JSON bodies). |

---

## Agent 3: Tooling, Tech-Docs, Scripts & Infrastructure (`scripts/`, `tech-docs-generator/`, `workers/`)

### Coverage & Strength by Unit

| Subsystem / Unit | Files Tested | Gate Coverage Status | Test Strength & Methodology | Gaps & Uncovered Areas |
| :--- | :--- | :--- | :--- | :--- |
| **R2 Backup Retention** | `scripts/prune_r2_backups.ts` | **100% Lines / 100% Funcs** | **VERY STRONG**<br>12/12 dedicated unit tests (`tests/unit/scripts/prune_r2_backups.test.ts`) covering 5d daily, 30d weekly, and protected files. | None for retention logic. |
| **Repository Scripts (`scripts/**`)** | 264 scripts across `scripts/` | **~2.5% COVERAGE** | **VERY WEAK**<br>Only 4 scripts have dedicated unit test files. 260 scripts rely on manual execution (`run-ops.mjs`) or gate runs. | 97% of repo scripts have zero automated test harnesses. |
| **Tech-Docs Generator** | `tech-docs-generator/scripts/**` | **UNTHRESHOLDED** (Second Vitest lane) | **MEDIUM**<br>Tests verify that models emit valid JSON and schemas match, but lacks branch coverage gates. | Code generation output (`page-component-graph.mmd`) is orphaned and unvalidated by UI tests. |
| **Cloudflare Workers** | `workers/**` | **INTEGRATION TESTED** | **MEDIUM**<br>`tests/unit/workers/originConfig.test.ts` validates route matching and origin proxy logic. | Production edge failover and TLS renegotiation unverified. |

---

# 4. Critical Gap Summary: What Areas Are NOT Covered?

```
Untested & Uninstrumented Surface Breakdown:
├── 1. Routing Middleware (site/proxy.ts): 20KB of core security/routing logic completely omitted from coverage gates.
├── 2. API Routes (site/app/api/**): Handlers lack unit-level request/response branch coverage.
├── 3. Marketing Pages (site/app/(site)/**): Server components not instrumented in any unit profile.
├── 4. Supabase RLS Live Policies: Mocked out via DEV_AUTH_BYPASS=1; live permissions untested in CI.
└── 5. Repository Scripts (scripts/**): 260 out of 264 scripts have zero unit test files.
```

---

# 5. Strategic Recommendations & Improvement Plan

| Priority | Area | Remediation Action | Intended Test File |
| :--- | :--- | :--- | :--- |
| **P0 (Immediate)** | **Middleware** | Author dedicated unit tests for `site/proxy.ts` covering auth routing, guest pass-through, and header sanitization. | `tests/unit/server/proxy.test.ts` |
| **P1 (High)** | **API Routes** | Create unit tests for critical API routes: `/api/catalog/products`, `/api/auth/session`, and `/api/health`. | `tests/unit/app/api/` |
| **P1 (High)** | **Script Tests** | As dead scripts are purged (down to ~170), add unit tests for critical operations: `db_apply_migrations.ts` and `sync-github-backup-secrets.ps1`. | `tests/unit/scripts/` |
| **P2 (Medium)** | **Tech-Docs** | Wire `page-component-graph.mmd` to UI and add a visual snapshot test asserting Mermaid render integrity. | `tests/tech-docs-generator/` |
| **P2 (Medium)** | **Playwright V8 Merge** | Configure Playwright coverage collection to merge browser E2E coverage with Vitest V8 reports for a unified coverage score. | `results/coverage/` |
