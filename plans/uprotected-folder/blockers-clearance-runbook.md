# Operational Runbook: Blocker Clearance Protocol

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) §1 and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Target File:** [`Failures.md`](file:///d:/23082026/Failures.md)  
**Goal:** Resolve and clear the two active P1 blockers: `GATE-RECHECK-01` and `BROWSER-ORIGIN-02`.

---

## 1. Blocker 1: `GATE-RECHECK-01`

### Objective:
Resolve 4 failing unit tests so `pnpm run test` exits with code 0, enabling the full release gate to pass.

### Failing Test Files:
1. `tests/unit/features/site/data/htmlSitemap.test.ts`
2. `tests/unit/features/site/data/siteSeoAcceptance.test.ts`
3. `tests/unit/features/site/data/siteSeoContract.test.ts`
4. `tests/unit/lib/ai/mastra/providers.test.ts`

### Execution Steps:
1. Run targeted vitest invocation:
   ```powershell
   pnpm exec vitest run --config tests/vitest.config.ts `
     tests/unit/features/site/data/htmlSitemap.test.ts `
     tests/unit/features/site/data/siteSeoAcceptance.test.ts `
     tests/unit/features/site/data/siteSeoContract.test.ts `
     tests/unit/lib/ai/mastra/providers.test.ts
   ```
   *(Note: These 4 test files currently pass 51/51 individually; re-run verifies zero regressions in these areas).*
2. Verify full suite passes across both Vitest lanes:
   ```powershell
   pnpm run test
   ```
   *(Checks both default and tech-docs Vitest lanes; confirm exit code 0).*

---

## 2. Blocker 2: `BROWSER-ORIGIN-02`

### Objective:
Execute Playwright browser gate against a live local instance at `http://localhost:3000`.

### Execution Steps:
1. Ensure the development server is running on `http://localhost:3000` (enforced by `AGENTS.md §2`; `127.0.0.1` is strictly forbidden):
   ```powershell
   # In a dedicated terminal or service process:
   pnpm run dev
   ```
2. Verify HTTP 200 response on `http://localhost:3000`:
   ```powershell
   curl -I http://localhost:3000
   ```
3. Run Playwright browser gate:
   ```powershell
   pnpm run test:browser:gate
   ```
4. Verify screenshots and traces for `chromium-desktop`, `firefox-tablet`, and `webkit-mobile`.

---

## 3. Clearance Verification & Removal from `Failures.md`

Once both test suites pass cleanly:
1. Run the headless release gate:
   ```powershell
   pnpm run release:gate:core
   ```
2. When full release gate exits with code 0, edit [`Failures.md`](file:///d:/23082026/Failures.md) to remove `GATE-RECHECK-01` and `BROWSER-ORIGIN-02`.
3. Verify documentation consistency:
   ```powershell
   pnpm run check:failures
   ```
