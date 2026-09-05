# Oando Subsystem Remediation Plan: Test Subsystem and Integrity Audits

**File Target:** `plans/05092026/06-test-subsystem-and-integrity-audits.md`  
**Governing Standard:** `AGENTS.md` (Authority floor: User instruction > live code/fresh command output > `AGENTS.md`)  
**Execution State:** **FROZEN / PLANNING ONLY** (`NO CODE CHANGE`, `NO AUTO IMPLEMENT`)  
**Methodology:** Dual-Lane Vitest Architecture, Two-Tier Audit Dispatcher, 5 Test Integrity Audits, and Playwright Browser Gate Matrix.

---

## 1. Subsystem Overview & Architectural Topology

The Oando verification platform implements a dual-lane testing pipeline orchestrated by [`scripts/run-full-vitest.mjs`](file:///d:/23082026/scripts/run-full-vitest.mjs) and an uncompromising static test integrity suite. Testing is strictly separated into parallel units and serial documentation generators to prevent OOM errors, worker contention, and false positives.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   OANDO TEST SUBSYSTEM ARCHITECTURE                    │
├────────────────────────────────────────────────────────────────────────┤
│                       pnpm run test (Entrypoint)                       │
│                     scripts/run-full-vitest.mjs                        │
│            • Spawns vitest.mjs directly via Node (shell: false)        │
│            • Prevents Windows cmd exit code loss / OOM crashes         │
├───────────────────────────────────┬────────────────────────────────────┤
│     Lane 1: Default Vitest        │      Lane 2: Tech-Docs Vitest      │
│      tests/vitest.config.ts       │   tests/vitest.tech-docs.config.ts │
├───────────────────────────────────┼────────────────────────────────────┤
│ • 738 test files (4,296 specs)    │ • 42 test files (224 specs)        │
│ • pool: "forks", maxWorkers: 4    │ • pool: "forks", maxWorkers: 1     │
│ • environment: "happy-dom"        │ • fileParallelism: false           │
│ • DEV_AUTH_BYPASS: "true"         │ • Pre-step: generate-all.mjs       │
│ • Short-circuits on any failure   │ • globalSetup: cache clear         │
├───────────────────────────────────┴────────────────────────────────────┤
│                       results/tests/summary.json                       │
│    Array Schema: { generatedAt, lanes: [ { lane, failed, total } ] }   │
├────────────────────────────────────────────────────────────────────────┤
│                      Playwright Browser Gate Matrix                    │
│    8 gate specs • 3 browsers x 3 viewports • Mobile: .mobile-app-main  │
│    Origin Invariant: http://localhost:3000 (NEVER 127.0.0.1)           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Vitest Dual-Lane Architecture

### Lane 1: Default Vitest Suite (`tests/vitest.config.ts`)
- **Execution Scope:** 738 test files covering `site/app`, `site/components`, `site/features`, `site/lib`, `site/server`, `site/hooks`, and `scripts`.
- **Worker Cap & Pool:** Configures `pool: "forks"` with `maxWorkers: 4` (`tests/vitest.config.ts#L70-L73`). This hard cap is required on Windows to prevent filesystem lock contention and CJS module resolution deadlocks (e.g. `lucide-react`).
- **Path Resolution & Precedence:** Explicitly aliases `@planner/*` and `@studio/*` before the bare `@` root alias to prevent path shadowing across the forked workspace trees.
- **Cache Isolation:** Sets `cacheDir: VITEST_CACHE_DIR` (`node_modules/.vite` at repository root) so layout hygiene checks (`pnpm run check:layout`) never encounter `site/node_modules`.
- **DOM & Environment:** Uses `environment: "happy-dom"`. Server suites declare `@vitest-environment node` per-file pragmas (50+ files) since `environmentMatchGlobs` was deprecated in Vitest 4.
- **Auth Guard Simulation:** Sets `DEV_AUTH_BYPASS: "true"` as a string literal, allowing `withAuth` guards to execute while `plannerPersistenceMode` and `furnitureCatalogMode` resolve to `"supabase"`.
- **Short-Circuit Invariant:** If Lane 1 exits with a non-zero code, [`scripts/run-full-vitest.mjs#L71-L74`](file:///d:/23082026/scripts/run-full-vitest.mjs#L71-L74) immediately calls `process.exit(mainStatus)`. Lane 2 is never executed, codegen is skipped, and `summary.json` is not written.

### Lane 2: Tech-Docs Vitest Suite (`tests/vitest.tech-docs.config.ts`)
- **Execution Scope:** 42 test files (224 specs) under `tech-docs-generator/tests/**`.
- **Pre-execution Codegen:** Synchronously invokes [`tech-docs-generator/scripts/generate-all.mjs`](file:///d:/23082026/tech-docs-generator/scripts/generate-all.mjs) before running Vitest (`scripts/run-full-vitest.mjs#L83-L94`). Without this, tests would evaluate stale or absent bytes in `generated-documents/data/*.json`.
- **Global Setup & Cache Invalidation:** `tech-docs-generator/tests/global-setup.mjs` executes `clearSharedRepoModelCache()` once per run to wipe the cross-fork generator-model cache.
- **Worker & Resource Throttling:** `pool: "forks"`, `maxWorkers: 1`, `fileParallelism: false`, and `isolate: true` (`tests/vitest.tech-docs.config.ts#L76-L79`). Heavy AST parsing and disk generation are executed serially to prevent CPU saturation.
- **Extended Timeouts:** `testTimeout: 120_000` and `hookTimeout: 120_000` to prevent flake during full repository model synthesis.
- **Dependency Isolation:** Aliases `mermaid`, `highlight.js`, `react-router-dom`, and `framer-motion` directly to `tech-docs-generator/node_modules/` to prevent React Router context cross-contamination from root-hoisted packages.

### Output Contract (`results/tests/summary.json`)
The aggregated test summary follows an array schema:
```json
{
  "generatedAt": "2026-09-05T03:57:36.303Z",
  "lanes": [
    { "lane": "default", "failed": 0, "total": 4296, "passed": 4295 },
    { "lane": "tech-docs", "failed": 0, "total": 224, "passed": 224 }
  ]
}
```

---

## 3. The 5 Test Integrity Audits

The platform enforces 5 strict static audits split across two dispatchers:

```
                            Test Integrity Audits
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
  [scripts/general/run-test-audits.mjs]       [tech-docs-generator/scripts/]
  • audit-hollow-tests.mjs                    • fake-test-audit.mjs
  • audit-gate-skips.mjs                        (Invoked via test:audit:fake-test
  • audit-eslint-disable.mjs                     and tech-docs:gate)
  • audit-api-route-safety.mjs
```

### 1. Hollow Test Audit (`scripts/general/audit-hollow-tests.mjs`)
- Uses AST and pattern heuristics from `scripts/general/hollow-test-patterns.mjs`.
- **Rejected Patterns:**
  - `expect(true).toBe(true)` (`expect-true`).
  - Sole `expect(...).toBeTruthy()` where `expectCount <= 1` (`sole-truthy`).
  - Sole `expect(...).toBeDefined()` where `expectCount <= 1` (`sole-defined`).
  - Empty `catch (...) {}` blocks swallowing errors (`empty-catch`).
  - Test files with active `it(...)` blocks but `expectCount === 0` (`zero-expect`).

### 2. Fake Test Audit (`tech-docs-generator/scripts/fake-test-audit.mjs`)
- Enforces strict assertions across Tech-Docs generator suites.
- **Rejected Patterns:**
  - `expectCount < itCount` (fails if fewer assertions than test blocks).
  - Rejects existence-only checks (`toBeDefined`, `toBeTruthy`) in `generator/**` unless paired with strong assertions (`toBeGreaterThan`, `toEqual`, `toMatch`, `toContain`).
  - Rejects mocking the unit under test (`vi.mock` paired with `extract[A-Z]`).

### 3. Gate Skips Audit (`scripts/general/audit-gate-skips.mjs`)
- Scans all test files for unauthorized skip directives:
  - `test.skip`, `describe.skip`, `it.skip`, `testInfo.skip()`, `.skipIf`, `.runIf`.
  - Focused blocks: `test.only`, `it.only`, `describe.only`.
  - Coverage ignores: `istanbul ignore`, `v8 ignore`, `coverage ignore`.
- Validates that skips match active entries in `tests/manifests/skip-exceptions.json` (12 allowed environment-conditional guards).

### 4. ESLint Disable Audit (`scripts/general/audit-eslint-disable.mjs`)
- Banned across all application directories (`site/app`, `site/components`, `site/features`, `site/hooks`, `site/lib`, `tests`, `scripts`, `config/build`).
- **Exactly 5 Permitted Suppressions (`audit-eslint-disable.mjs#L27-L33`):**
  1. `site/hooks/Studio/useStudioFabric.ts` (`react-hooks/exhaustive-deps`)
  2. `site/hooks/Planner/usePlannerFabric.ts` (`react-hooks/exhaustive-deps`)
  3. `site/hooks/Studio/useStudioKeyboardShortcuts.ts` (`react-hooks/exhaustive-deps`)
  4. `site/hooks/Planner/usePlannerKeyboardShortcuts.ts` (`react-hooks/exhaustive-deps`)
  5. `site/hooks/Planner/usePlannerSessionWarning.ts` (`react-hooks/exhaustive-deps`)

### 5. API Route Safety Audit (`scripts/general/audit-api-route-safety.mjs`)
- Scans `site/app/api/**/route.ts` handlers.
- **Enforced Security Checks:**
  - CSRF token validation on mutating verbs (`POST`, `PUT`, `PATCH`, `DELETE`).
  - Rejection headers must include `x-csrf-rejected` (`CSRF_REJECTION_HEADER_NAME`).
  - Rate limiting on public mutators (`customer-queries`, `tracking`, `log-error`, `nav-search`).
  - Admin auth checks (`withAuth`, `requireAdminSession`, `resolveAuthContext("admin")`).

---

## 4. Playwright Browser Gate Matrix

- **Orchestrator:** `scripts/general/run-playwright-gate.mjs` (`pnpm run test:browser:gate`).
- **The 8 Mandatory Gate Specs (`config/build/playwright-gate-specs.json`):**
  1. `tests/e2e/accessibility.spec.ts`
  2. `tests/e2e/admin-smoke.spec.ts`
  3. `tests/e2e/planner-catalog.spec.ts`
  4. `tests/e2e/planner-guest-workspace.spec.ts`
  5. `tests/e2e/planner-custom-tools.spec.ts`
  6. `tests/e2e/planner-chrome.spec.ts`
  7. `tests/e2e/sketch-to-plan-pipeline.spec.ts`
  8. `tests/e2e/planner-offline-sync.spec.ts`

### Browser Origin Invariant & The WebServer Trap
- **Strict Host Rule:** Base URL is strictly `http://localhost:3000` via `config/build/playwrightBaseURL.cjs`. All `127.0.0.1` origins are forbidden (Trap #5 in `AGENTS.md`).
- **The `webServer` Trap (`config/build/playwright.config.ts#L88-L105`):**
  When `PLAYWRIGHT_BASE_URL` is set in the environment or `.env.local`, Playwright sets `webServer: undefined`. It assumes an external server is running. If the dev server is not started beforehand, tests fail immediately with `net::ERR_CONNECTION_REFUSED`.

### Viewport Matrix & Mobile Scroller Invariant
- **Test Matrix (`tests/manifests/visual-baselines.json#L20-L25`):**
  - Desktop: `1440 x 900`
  - Tablet: `1024 x 768`
  - Mobile: `390 x 844` (iPhone 12/13/14 baseline)
- **Mobile Scroller Invariant:**
  - On viewports `< 768px`, page content is rendered inside `<div className="mobile-app-main" tabIndex={-1}>` (`MobileAppShell.tsx#L72`).
  - The viewport scroller is `.mobile-app-main`, **never** `window`.
  - GSAP ScrollTrigger must dynamically bind `.mobile-app-main` via `gsapPageScroller()` (`gsapMotion.ts#L13-L28`). Binding to `window` causes animations to freeze at `opacity: 0`.

---

## 5. Verification & Audit Runbook

### Authorized Test Execution Commands
```bash
# Run full Vitest dual-lane suite (Lane 1 + Lane 2)
pnpm run test

# Run test integrity audit suite (4 scripts)
pnpm run test:audit

# Run fast test integrity audit (omits gate-skips)
pnpm run test:audit:fast

# Run tech-docs fake test audit independently
pnpm run test:audit:fake-test

# Run Playwright 8-spec browser gate (requires localhost:3000 booted)
pnpm run test:browser:gate
```

### Preflight Checklist Before Authorizing Commits
1. Verify both Vitest lanes pass ($738 + 42 = 780$ test files).
2. Confirm a **fresh, current-session** `results/tests/summary.json` records 0 failed tests across both lanes; an archived summary cannot clear a blocker or authorize a commit.
3. Verify all 5 test integrity audits exit code 0.
4. Confirm no new `eslint-disable` comments exist outside the 5 authorized hook files.
