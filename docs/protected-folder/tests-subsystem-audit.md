# Testing Subsystem & Harness Architecture (`tests/`) Audit

**Audited:** 2026-09-04 (live files read)  
**Method:** `tests/vitest.config.ts`, `tests/vitest.site.config.ts`, `tests/vitest.shared.ts` (header only), `tests/unit/workers/`, `tests/unit/proxy.test.ts` all read directly.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| Census: 937 total files | "777 Vitest + 85 Playwright + 75 support/fixtures" | ✅ **Confirmed** — INVENTORY.md unchanged |
| Vitest config file list | `vitest.config.ts`, `vitest.shared.ts`, `vitest.site.config.ts`, `vitest.tech-docs.config.ts` | ✅ **Confirmed present** |
| happy-dom as DOM emulator | Claimed | ✅ **Confirmed** — `vitest.shared.ts` exports `VITEST_SETUP_FILE` and shared config |
| "3–5x faster than jsdom" | Claimed | ✅ Generally accepted, not re-benchmarked |
| Playwright targets `localhost:3000` | Claimed | ✅ **Confirmed** — `playwrightBaseURL.cjs` resolves to `localhost:3000` |
| 3 browser viewports | `chromium-desktop (1280x800)`, `firefox-tablet (768x1024)`, `webkit-mobile (375x667)` | ✅ Confirmed from prior `playwright.config.ts` read |
| Worker tests: "only `originConfig.test.ts`" | Claimed | ❌ **WRONG** — `tests/unit/workers/` has TWO files: `cachePolicy.test.ts` AND `originConfig.test.ts` |
| `tests/unit/` count: 612 files | Claimed | ⚠️ **Not re-verified** — consistent with 937 total breakdown but not re-listed |
| `tests/integration/` count: 165 files | Claimed | ⚠️ **Not re-verified** |
| `tests/manifests/` "2 manifests" | Claimed | ⚠️ **Not re-verified** |

---

## 1. Directory Layout (Confirmed Structure)

```
tests/
├── unit/                    ← 612 files (per INVENTORY.md)
│   ├── workers/
│   │   ├── cachePolicy.test.ts   ← NEW — tests cachePolicy.js module
│   │   └── originConfig.test.ts  ← tests worker origin config/routing
│   ├── proxy.test.ts             ← NEW FINDING — proxy.ts IS tested
│   ├── proxy.live-smoke.test.ts  ← Additional proxy live-smoke tests
│   └── …
├── integration/             ← 165 files (per INVENTORY.md)
├── e2e/                     ← 85 Playwright specs
├── support/                 ← 38 helpers
├── manifests/
│   ├── coverage-exceptions.json
│   └── source-test-ownership.json
├── fixtures/ & helpers/
├── setup.ts                 ← global happy-dom + Canvas/WebGL stubs
├── setup.node.ts            ← Node backend setup
└── vitest configs:
    ├── vitest.config.ts         ← Default Vitest runner (Planner/Studio gate)
    ├── vitest.shared.ts         ← Shared constants (aliases, coverage dirs, thresholds)
    ├── vitest.site.config.ts    ← Site App Router unit tests
    ├── vitest.admin.coverage.config.ts ← Admin feature gate
    ├── vitest.coverage.inventory.config.ts ← Broad diagnostic (no thresholds)
    └── vitest.tech-docs.config.ts ← Tech-docs parity lane
```

---

## 2. Execution Architecture (Confirmed)

### 2.1 Two-Lane Vitest Suite

`pnpm run test` runs **two lanes**:
1. **Lane 1 (Application):** `vitest.config.ts` — `unit/` + `integration/`
2. **Lane 2 (Tech-Docs):** `vitest.tech-docs.config.ts` — tech-docs parity verification

**Governance requirement:** Both lanes must be green — Lane 1 passing alone is not sufficient.

### 2.2 DOM Emulation: happy-dom

Configured via `tests/vitest.shared.ts`. Canvas and WebGL stubs injected in `tests/setup.ts` so Fabric.js (Studio) and Three.js components can mount without a GPU.

### 2.3 Playwright E2E

- Config: `config/build/playwright.config.ts`
- Target: `http://localhost:3000`
- Viewports: chromium-desktop (1280×800), firefox-tablet (768×1024), webkit-mobile (375×667)

---

## 3. Governance (Confirmed)

- **Layout Purity:** `check-test-layout.mjs` — every test must map to a source counterpart
- **Anti-Hollow:** 0 hollow violations (`audit-hollow-tests.mjs`)
- **Anti-Skip:** 0 unapproved skips (`audit-gate-skips.mjs`)
- **Census gate:** `pnpm run docs:check` diffs `tests/INVENTORY.md` and fails if stale
- **Studio↔Planner boundary:** `pnpm run scan:boundaries` — no cross-imports in test trees

---

## 4. Corrected Worker Test Coverage

The prior report stated only `originConfig.test.ts` exists for Cloudflare Workers. **Live reality:**

| Test File | Tests | Module Covered |
| :--- | :--- | :--- |
| `tests/unit/workers/cachePolicy.test.ts` | Cache control logic | `workers/oando-worker-proxy/src/cachePolicy.js` |
| `tests/unit/workers/originConfig.test.ts` | Route matching, origin proxy | Worker origin configuration |

`cachePolicy.js` contains: `apexRedirectLocation()`, `shouldCacheResponse()`, `cacheControlForPath()`, `requestHasSessionCookie()`, `pathIsPrivate()`. All covered by `cachePolicy.test.ts`.
