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
  - Desktop Wide: `1920 x 1080` (Full HD standard; **MANDATORY INVARIANT: Desktop must ALWAYS include 1920 x 1080**)
  - Desktop Standard: `1440 x 900` (Laptop baseline)
  - Tablet: `1024 x 768`
  - Mobile: `390 x 844` (iPhone 12/13/14 baseline)
- **Desktop Viewport Invariant:** All responsive audits, visual baselines, browser suites, and layout verifications evaluating desktop surfaces must **always** include `1920 x 1080`. No desktop verification is complete without `1920 x 1080`.
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
## Test reconciliation update (2026-09-05)

### Detailed work packages: discovery, profiles and evidence integrity

| Work package | Required decision and deliverable | Completion evidence |
| --- | --- | --- |
| Per-file review | Record every spec/helper/asset with owner, behavioral assertions, consumers, side effects, destination and disposition | No initial file disappears without a reviewed mapping; inventory is revision-scoped |
| Runner parity | Trace package scripts, gate lists, CI filters, include/exclude globs and package-local tests | Authorized before/after discovery sets reconcile; totals alone are insufficient |
| Browser profiles | Current playwright.config.ts spreads Desktop Chrome/Firefox/Safari devices across viewport tiers; distinguish responsive width coverage from touch/mobile emulation | Explicit browser, viewport, touch, device scale and input-mode contract; no phone-device claim from width alone |
| Server lifecycle | Config forces the base-URL environment; globalSetup/globalTeardown skip locking when that variable is present | Trace direct-run versus gate-owned lock paths, reuse policy and ownership before any lock change; runtime behavior remains unverified |
| Fixture concurrency | Inspect identifiers, output names, mutable catalog fixtures and cleanup across workers/retries | Parallel cases cannot overwrite each other's data; cleanup does not remove pre-existing state |
| Visual comparisons | Align manifest root, runner template and helper naming; separate capture jobs from comparisons | Reviewed baseline per intended profile, fresh actual image and meaningful diff; moving baselines preserves bytes |
| Assertion integrity | Separate legitimate profile exclusions from missing-control skips and output-file-only checks | Required behavior fails when broken; skip reason and owner are explicit |
| Result aggregation | Distinguish executed, failed, skipped, interrupted and unrun lanes | An old summary or a short-circuited second lane cannot produce a complete green report |

Implementation order: classify files; agree profile/fixture contracts; move one owner batch without assertion changes; reconcile discovery; repair that batch's assertions; review visual baselines separately. Do not rewrite the suite.

Each authorized run record must include command, working directory, revision/dirty scope, config, project selection, exit code, failure paths and skip counts. Preserve first-attempt failures when retries pass. Proposed acceptance tests are not execution evidence.

### Observed issues and required decisions

The static inventory observed 85 E2E specs and 18 support/assets. Full semantic review of every file and runtime execution remain pending.

| Evidence | Planned action |
| --- | --- |
| All 85 specs share the E2E root | Assign Marketing, Admin, Planner and Studio route owners before moving |
| Helpers/fixtures span root tests, E2E and support directories | Consolidate under owner-specific `tests/support/` folders with consumer updates |
| Legacy unit paths coexist with `tests/unit/site` | Migrate bounded source groups while preserving other agents' ongoing moves |
| Landing/navigation screenshot specs assert output-file existence | Classify as capture tooling or replace with meaningful behavioral contracts |
| Six site visual baselines are missing | Review replacement images or explicitly replace the visual assertions |
| Manifest baseline root differs from Playwright snapshot template | Adopt one storage contract across manifest, helpers and runner |
| Snapshot template omits project identity | Separate browser/viewport baselines or constrain the comparison project |
| Comprehensive Planner specs skip when settings/undo are absent | Required missing controls must fail; justified profile filters can remain |

### Migration sequence and review record

1. Create one disposition row per initial file: path, kind, source/route owner, imports and consumers, assertions, fixture side effects, browser profile, evidence and destination. Use keep, move, repair, retirement candidate or runtime review pending.
2. Claim disjoint file batches in the shared tree and reread their current contents before edits. Preserve concurrent changes and avoid shared-index cleanup.
3. Target route specs at `tests/e2e/site/app/(site)/`, `admin/`, `ooplanner/` and `oostudio/`; target shared support at `tests/support/`. Preserve package-local Tech-Docs tests.
4. Update imports, root calculations, explicit command/CI paths, setup/teardown, snapshot paths and inventory in the same batch. Baseline relocation preserves image bytes.
5. Repair stale assertions separately from path moves. Retire only with evidence that behavior is obsolete or equivalent coverage survives elsewhere.
6. With execution authorized, reconcile discovered specs before/after each batch and run affected checks. Record failures, skipped scenarios and reviewed visual differences; regenerate inventories from agreed roots.

Completion requires every initial file to have a disposition, every retained test to remain discoverable, and every required scenario to have execution evidence. Keep hard blockers in `Failures.md`; this plan creates no green status.

Classify every file before moving or retiring it. Preserve route ownership, assertion coverage, fixture isolation and runner selection through the migration sequence below.

Acceptance: record current path, owner, destination/disposition, preserved assertions, affected commands, and evidence. A filename or age alone is insufficient grounds for retirement. Runtime validation remains pending; this update changes planning documents only.
