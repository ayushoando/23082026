# Testing Subsystem & Harness Architecture (`tests/`) Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`tests/`](file:///d:/23082026/tests/)  
**Method:** Live file inspections of `tests/setup.ts`, `tests/vitest.shared.ts`, `config/build/playwright.config.ts`, and runner scripts.

---

## 1. Directory Structure & Organization

```
tests/
├── unit/                    ← 612 isolated unit test files
│   ├── workers/             ← Cloudflare worker unit tests (cachePolicy, originConfig)
│   ├── proxy.test.ts        ← Next.js proxy routing tests
│   └── site/                ← App Router component & utility tests
├── integration/             ← 165 subsystem integration test files
├── e2e/                     ← 85 Playwright browser user journey specs
├── support/                 ← 38 test helpers and DOM interaction mocks
├── manifests/               ← Coverage policy exceptions and ownership maps
├── fixtures/                ← Mock JSON datasets and fixtures
├── setup.ts                 ← Global happy-dom initialization + Canvas/WebGL stubs
├── setup.node.ts            ← Node backend environment configuration
└── vitest configs:
    ├── vitest.config.ts         ← Primary runner for Planner & Studio
    ├── vitest.shared.ts         ← Shared aliases, setup files, and thresholds
    ├── vitest.site.config.ts    ← Site App Router runner
    ├── vitest.admin.coverage.config.ts ← Admin feature coverage runner
    ├── vitest.coverage.inventory.config.ts ← Diagnostic full-repo runner
    └── vitest.tech-docs.config.ts ← Tech-docs generator isolation lane
```

---

## 2. Execution Harness: Vitest + happy-dom

### 2.1 DOM Simulation
- The test harness uses **`happy-dom`** across all UI test suites.
- Emulates modern Web APIs (DOM, MutationObserver, Fetch, Canvas) with 3–5× less memory overhead than jsdom.
- Configured in [`tests/setup.ts`](file:///d:/23082026/tests/setup.ts) with explicit mocks for HTML5 Canvas and WebGL contexts needed by Fabric.js and Three.js.

### 2.2 Two-Lane Vitest Architecture
Per `AGENTS.md §6`, `pnpm run test` executes **two independent lanes**:
1. **Lane 1: Main Platform Suite** (`vitest.config.ts`) — Runs all unit and integration tests for Planner, Studio, Site, and Admin.
2. **Lane 2: Tech-Docs Suite** (`vitest.tech-docs.config.ts`) — Isolated runner verifying technical documentation generators and extractors.

---

## 3. Browser E2E Harness (Playwright)

Configuration in [`config/build/playwright.config.ts`](file:///d:/23082026/config/build/playwright.config.ts):
- **Base URL:** Strictly enforces `http://localhost:3000` via `playwrightBaseURL.cjs`. Usage of `127.0.0.1` is strictly forbidden per `AGENTS.md §2`.
- **Target Viewports:**
  - `chromium-desktop` (1280 × 800)
  - `firefox-tablet` (768 × 1024)
  - `webkit-mobile` (375 × 667)

---

## 4. Test Verification Commands

```powershell
# 1. Run two-lane test suite
pnpm run test

# 2. Run unit tests only
pnpm run test:unit

# 3. Run tech-docs isolation lane
pnpm run test:tech-docs

# 4. Run Playwright browser gate (requires running server at localhost:3000)
pnpm run test:browser:gate
```
