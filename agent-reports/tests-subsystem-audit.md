# Testing Subsystem & Harness Architecture (`tests/`) Audit

**Date:** 2026-09-04  
**Target:** [`tests/`](file:///d:/23082026/tests/)  
**Test Frameworks:** Vitest 3.x (`happy-dom`) + Playwright 1.48+  
**Census:** 937 total files (777 Vitest executable files, 85 Playwright specs, 75 support/fixture assets)

---

## Executive Summary

The [`tests/`](file:///d:/23082026/tests/) directory contains the monorepo's complete automated quality assurance harness. Tests strictly mirror repository source paths and are executed across two independent Vitest runner lanes plus a multi-viewport Playwright e2e harness.

```
tests/ Architecture:
├── unit/                    # Isolated behavioral and component contract tests
├── integration/             # Cross-module collaboration & database integration tests
├── e2e/                     # Multi-viewport Playwright browser journeys
├── support/                 # Page objects, accessibility helpers, and mock factories
├── manifests/               # Ownership, coverage exceptions, and migration allowlists
├── fixtures/ & helpers/     # Reusable test payloads and DOM environment mocks
├── setup.ts                 # Global browser/DOM test setup (happy-dom polyfills)
├── setup.node.ts            # Node.js backend environment setup
└── Vitest Configurations:
    ├── vitest.config.ts     # Root test orchestrator (runs default + tech-docs lanes)
    ├── vitest.shared.ts     # Shared config (happy-dom, alias resolution, coverage settings)
    ├── vitest.site.config.ts# Site App Router unit test config
    └── vitest.tech-docs.config.ts # Dedicated Tech-Docs parity verification lane
```

---

## 1. Directory Layout & Organization Contract

Per [`tests/CONTENTS.md`](file:///d:/23082026/tests/CONTENTS.md), tests are structured by kind and mirror the owning source root:

| Directory | Scope & Purpose | Execution Runner | File Count |
| :--- | :--- | :--- | :--- |
| **`unit/`** | Isolated component tests and pure function contracts. | Vitest (`happy-dom`) | 612 files |
| **`integration/`** | Database clients, API handlers, catalog tree normalizers. | Vitest (`node` / `happy-dom`) | 165 files |
| **`e2e/`** | Full browser journeys (Studio canvas, Planner dockview, Admin). | Playwright (multi-browser) | 85 specs |
| **`support/`** | Test page objects, canvas stubs, accessibility assertion helpers. | Support / Fixtures | 38 helpers |
| **`manifests/`** | Source ownership mapping (`source-test-ownership.json`). | CI Governance | 2 manifests |

### Strict Boundary Rule
Studio and Planner tests remain strictly decoupled:
* A test under `tests/unit/site/components/Planner/` **must not** import `@studio/*`.
* A test under `tests/unit/site/components/Studio/` **must not** import `@planner/*`.
* Violations are flagged by `pnpm run scan:boundaries`.

---

## 2. Test Execution Architecture

### 2.1 The Two-Lane Vitest Suite
When running `pnpm run test`, the repository executes **two distinct test lanes**:
1. **Lane 1 (Application Suite):** Executes all `unit/` and `integration/` tests using `vitest.config.ts`.
2. **Lane 2 (Tech-Docs Parity Suite):** Executes `vitest.tech-docs.config.ts` to verify extracted architectural models and JSON parity.
*Governance Requirement:* A green run on Lane 1 alone is **not** a passing test run; both lanes must be green.

### 2.2 DOM Emulation: `happy-dom`
Unlike standard `jsdom`, the repository configures **`happy-dom`** via [`tests/vitest.shared.ts`](file:///d:/23082026/tests/vitest.shared.ts):
* **Why `happy-dom`:** Provides 3–5x faster startup and execution speeds, critical for running 777 unit tests in under 30 seconds.
* **Canvas Mocking:** In [`tests/setup.ts`](file:///d:/23082026/tests/setup.ts), custom HTML5 2D Canvas and WebGL stubs are injected so Fabric.js and Three.js canvas components can mount in unit tests without a real GPU.

### 2.3 Playwright E2E Runner
* Configured in [`config/build/playwright.config.ts`](file:///d:/23082026/config/build/playwright.config.ts).
* Targets `http://localhost:3000`.
* Runs 3 standard browser viewports: `chromium-desktop` (1280x800), `firefox-tablet` (768x1024), and `webkit-mobile` (375x667).

---

## 3. Governance & Quality Floor

* **Layout Purity:** [`scripts/general/check-test-layout.mjs`](file:///d:/23082026/scripts/general/check-test-layout.mjs) verifies that every new test file matches its source counterpart. Unmapped tests fail `pnpm run check:layout`.
* **Census Generation:** Any addition or deletion of a test automatically regenerates [`tests/INVENTORY.md`](file:///d:/23082026/tests/INVENTORY.md) via `pnpm run docs:sync`.
