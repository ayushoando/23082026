# Test Coverage & Strength Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`tests/`](file:///d:/23082026/tests/)  
**Method:** Configuration reviews of Vitest runner files, coverage policies in `coverage-exceptions.json`, anti-hollow audits, and anti-skip scanners.

---

## 1. Test Census & Inventory

The repository maintains an executable test inventory of **937 total files**:
- **777** Vitest executable test files
- **85** Playwright executable browser spec files
- **38** Shared test helpers
- **15** Mock fixtures
- **12** Snapshot manifests
- **10** Supporting test assets

---

## 2. Coverage Gate Architecture & Profiles

The release bar is governed by four Vitest coverage configurations:

| Profile | Configuration File | Release Policy Thresholds | Release Impact |
| :--- | :--- | :--- | :---: |
| **Planner & Studio** | `tests/vitest.config.ts` | 100% Lines / 100% Funcs / 95% Stmts / 95% Branches | **Enforced Gate** |
| **Site App Router** | `tests/vitest.site.config.ts` | 100% Lines / 100% Funcs / 95% Stmts / 95% Branches | **Enforced Gate** |
| **Admin Features** | `tests/vitest.admin.coverage.config.ts` | 100% Lines / 100% Funcs / 95% Stmts / 95% Branches | **Enforced Gate** |
| **Full Inventory** | `tests/vitest.coverage.inventory.config.ts` | Broad inclusion diagnostic (no failure thresholds) | Diagnostic Only |

Policy defined in [`tests/manifests/coverage-exceptions.json`](file:///d:/23082026/tests/manifests/coverage-exceptions.json):
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

## 3. Subsystem Test Coverage Clarifications

### 3.1 Next.js Edge Proxy (`site/proxy.ts`)
- Previous audits incorrectly characterized `proxy.ts` as having zero unit tests.
- **Confirmed Live:** Dedicated unit tests exist in [`tests/unit/proxy.test.ts`](file:///d:/23082026/tests/unit/proxy.test.ts) and [`tests/unit/proxy.live-smoke.test.ts`](file:///d:/23082026/tests/unit/proxy.live-smoke.test.ts).

### 3.2 Cloudflare Worker Proxy
- Worker proxy logic is covered by two distinct test suites:
  1. [`tests/unit/workers/cachePolicy.test.ts`](file:///d:/23082026/tests/unit/workers/cachePolicy.test.ts)
  2. [`tests/unit/workers/originConfig.test.ts`](file:///d:/23082026/tests/unit/workers/originConfig.test.ts)

---

## 4. Anti-Hollow & Anti-Skip Guardrails

CI prevents low-quality assertions through dedicated static AST audits:
- **`audit-hollow-tests.mjs`:** Flags empty test bodies, trivial `expect(true).toBe(true)` checks, or unhandled exceptions swallowed in tests. Result: **0 violations**.
- **`audit-gate-skips.mjs`:** Rejects unapproved `test.skip`, `describe.skip`, `it.only`, or v8 coverage ignore comments. Result: **0 violations**.

---

## 5. Verification Commands

```powershell
# 1. Run audit for hollow or superficial tests
pnpm run test:audit:hollow

# 2. Run audit for gate skips and test exclusions
pnpm run test:audit:gate-skips

# 3. Execute Planner & Studio coverage gate
pnpm run test:coverage

# 4. Execute Site coverage gate
pnpm run test:coverage:site

# 5. Execute Admin coverage gate
pnpm run test:coverage:admin
```
