# Test Layout & Mirroring Conventions

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`tests/`](file:///d:/23082026/tests/)  
**Reference Document:** [`tests/CONTENTS.md`](file:///d:/23082026/tests/CONTENTS.md)

---

## 1. Test Organization Conventions

Tests are organized strictly by test kind and mirror the directory hierarchy of their owning repository source path:

- `tests/unit/<source-root>/...` — Isolated component contracts, pure functions, and domain logic.
- `tests/integration/<source-root>/...` — Multi-module collaboration, database wire interactions, and API routes.
- `tests/e2e/site/app/<route-root>/...` — Route-owned Playwright user journeys across 3 viewports.
- `tests/e2e/tech-docs-generator/...` — Tech-docs generator browser verification.
- `tests/support/` — Fixtures, page objects, accessibility audits, and UI-state mock helpers.
- `tests/manifests/` — Ownership mapping, coverage policy thresholds, and skip exceptions.

### Canonical Path Examples:
```text
tests/unit/site/components/Planner/ui/PlannerPhIcon.test.tsx
tests/integration/site/lib/catalog/catalogTree.test.ts
tests/e2e/site/app/ooplanner/dockview.spec.ts
tests/unit/scripts/general/check-test-layout.test.ts
```

---

## 2. Fork Boundary Test Isolation

Per `AGENTS.md §3`:
- **Studio and Planner tests must remain completely independent.**
- A test residing under a Planner path must never import from `@studio/*` or `site/components/Studio/`.
- A test residing under a Studio path must never import from `@planner/*` or `site/components/Planner/`.
- Boundary violations will be flagged by `pnpm run scan:boundaries`.

---

## 3. Migration Debt & Ownership Tracking

Any non-canonical legacy test locations are tracked as temporary migration debt in `tests/manifests/source-test-ownership.json`. All newly authored tests must adhere to canonical mirrored paths.

---

## 4. Verification Commands

```powershell
# 1. Verify test directory layout compliance
pnpm exec vitest run tests/unit/scripts/general/check-test-layout.test.ts

# 2. Check fork boundary isolation across tests
pnpm run scan:boundaries
```
