---
name: test-engineering
description: "Author, maintain, and audit Vitest unit tests, happy-dom component tests, and Playwright E2E browser tests under the thermonuclear standard. Enforces dual-lane Vitest awareness, beats the 5 static anti-cheat audits, mandates realistic persistence mocking, and guarantees zero flakiness."
---

# Test Engineering — Thermonuclear Test Authoring Standard

Use this skill whenever authoring new unit, integration, or E2E tests, refactoring test suites, mocking platform subsystems, or debugging test failures across the Oando repository (`tests/`).

Testing in this repository is governed by zero-trust verification: tests must verify actual production logic, assert real state mutations, and pass all five static anti-cheat audits.

---

## 1. The Thermonuclear Truth Floor for Testing

Under `AGENTS.md` §6, §8, and [`Testing-handbook.md`](file:///d:/23082026/Testing-handbook.md):
$$\text{User Instruction} > \text{Live Code / Fresh Command Output} > \text{AGENTS.md} > \text{Agents/} > \text{docs/}$$

- **Dual-Lane Vitest Execution:** `pnpm run test` executes **two separate vitest lanes**:
  1. **Default Site Lane:** Configured via [`tests/vitest.config.ts`](file:///d:/23082026/tests/vitest.config.ts) (using `happy-dom`, maps `@/` to `site/`).
  2. **Tech-Docs SPA Lane:** Configured via `tests/vitest.tech-docs.config.ts`.
  *A green summary on one lane does not constitute a passed suite. Both lanes must pass.*
- **Playwright Local Origin Invariant:** All E2E browser tests and local URL claims must target `http://localhost:3000` (never `127.0.0.1`). Mobile viewport tests must use 390×844 px.
- **Scope Discipline:** Do exactly the stated task. Do not expand scope, refactor adjacent code, or make opportunistic improvements. Make the smallest reversible change that achieves the requested outcome. If scope is exceeded, stop and report it.

---

## 2. The Five Non-Negotiable Anti-Cheat Test Laws

Every test file in `tests/` is audited by continuous static analysis ratchets. Violating any of these 5 laws will immediately break the CI gate:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THE 5 THERMONUCLEAR ANTI-CHEAT LAWS                  │
├────────────────────────────────────────────────────────────────────────┤
│ 1. ANTI-HOLLOW: ASSERT REAL STATE, NO TRIVIAL OR EMPTY BLOCKS          │
│ 2. ANTI-FAKE: NEVER MOCK THE UNIT UNDER TEST                           │
│ 3. ZERO UNALLOWLISTED SKIPS OR ISOLATED RUNS (.skip / .only)           │
│ 4. STRICT 5-FILE CAP ON ESLINT HOOK SUPPRESSIONS                       │
│ 5. API ROUTE ENVELOPE & AUTHENTICATION BARRIER PROOF                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Law 1: Anti-Hollow Assertions (`pnpm run test:audit`)
- **Forbidden Patterns:**
  - `expect(true).toBe(true)` or `expect(false).toBe(false)`
  - Sole `expect(x).toBeTruthy()` or `expect(x).toBeDefined()` without asserting value or structure
  - Empty `catch {}` blocks that silently swallow exceptions
  - `it()` or `test()` blocks with 0 assertions
- **Thermonuclear Standard:** Every test must assert concrete values, DOM element presence, mutation results, or specific error messages (`toThrowError(...)`).

### Law 2: Anti-Fake Testing (`pnpm run test:audit:fake-test`)
- **Forbidden Pattern:** Mocking the exact function or module you are claiming to test (e.g. `vi.mock('@/lib/solver')` inside `solver.test.ts`).
- **Assertion Ratio Invariant:** Every test file must satisfy expectCount ≥ itCount. Mocking away business logic to achieve artificial green badges is treated as falsification.

### Law 3: Zero Unallowlisted Skips (`pnpm run test:audit`)
- **Forbidden:** Adding `.skip`, `.only`, `test.todo()`, `/* istanbul ignore */`, or `/* v8 ignore */` to bypass failing tests.
- **Allowed Exception:** A test may be skipped **only** if it has an active, unexpired tracking entry in `tests/manifests/skip-exceptions.json`.

### Law 4: Strict 5-File Cap on ESLint Suppressions (`pnpm run test:audit`)
- Exactly **5 files** in the entire codebase are permitted to suppress `react-hooks/exhaustive-deps`:
  1. `site/hooks/Studio/useStudioFabric.ts`
  2. `site/hooks/Planner/usePlannerFabric.ts`
  3. `site/hooks/Studio/useStudioKeyboardShortcuts.ts`
  4. `site/hooks/Planner/usePlannerKeyboardShortcuts.ts`
  5. `site/hooks/Planner/usePlannerSessionWarning.ts`
- Adding `eslint-disable` to any test or component file outside this list triggers an immediate gate failure.

### Law 5: API Route Safety (`pnpm run test:audit`)
- Route handler tests in `site/app/api/` must verify:
  - Unauthenticated requests receive `401 Unauthorized` or `404 Not Found`.
  - Malformed payloads receive `400 Bad Request`.
  - Response envelopes adhere to platform schemas with correct Content-Type headers.

---

## 3. Mocking Invariants: Mode-Aware Persistence

> **CRITICAL INVARIANT:** Production filesystem is read-only. Never write tests that mock or expect direct disk writes via `fs.writeFileSync` in production code paths.

### Correct Mocking of Persistence
- Mock the mode-aware wrappers rather than raw filesystem APIs:
  ```typescript
  import { vi } from "vitest";
  import * as persistence from "@/lib/Planner/plannerPersistenceMode";

  // Mock the high-level mode-aware wrapper
  vi.spyOn(persistence, "savePlannerProject").mockResolvedValue({
    success: true,
    projectId: "test-project-123",
  });
  ```
- Use fixtures from [`tests/fixtures/planner/representativeProject.ts`](file:///d:/23082026/tests/fixtures/planner/representativeProject.ts) and performance budgets from [`tests/e2e/helpers/plannerPerformanceBudgets.ts`](file:///d:/23082026/tests/e2e/helpers/plannerPerformanceBudgets.ts).

---

## 4. Playwright Browser E2E Authoring

- **Target Origin:** Always configure base URL to `http://localhost:3000`.
- **Mobile Viewport Testing:**
  - Viewport: `{ width: 390, height: 844 }` (iPhone standard).
  - Page container scroller: verify scrolling inside `.mobile-app-main`, not `window`.
  - Touch target size: verify bounding box has `width >= 44` and `height >= 44`.
- **Trace Management:** Never commit Playwright trace files (`.zip`) or video recordings.

---

## 5. Verification & Audit Runbook

Execute this command sequence to certify new or modified tests:

```powershell
# 1. Run targeted test file with proper site configuration
pnpm exec vitest run tests/unit/path/to/my-test.test.ts --config tests/vitest.config.ts

# 2. Run all 5 static anti-cheat audits
pnpm run test:audit
pnpm run test:audit:fake-test

# 3. Verify TypeScript test compilation
pnpm run typecheck:tests

# 4. Verify full Vitest suite across both lanes
pnpm run test
```
