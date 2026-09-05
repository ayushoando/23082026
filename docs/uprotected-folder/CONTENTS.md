# Test layout

Tests are organized by test kind and then mirror their owning repository source path.

- `unit/<source-root>/...` — isolated behavior and component contracts.
- `integration/<source-root>/...` — collaboration between repository modules.
- `e2e/site/app/<route-root>/...` — route-owned browser journeys.
- `e2e/tech-docs-generator/...` — tech-docs browser journeys.
- `support/` — fixtures, page objects, accessibility, visual, and UI-state helpers.
- `manifests/` — ownership, coverage exceptions, skip exceptions, and visual baselines.

Canonical examples:

```text
tests/unit/site/components/Planner/ui/PlannerPhIcon.test.tsx
tests/integration/site/lib/catalog/catalogTree.test.ts
tests/e2e/site/app/ooplanner/dockview.spec.ts
tests/unit/scripts/general/check-test-layout.test.ts
```

Planner and Studio tests remain independent. A test under a Planner path must not import `@studio/*`, and a Studio test must not import `@planner/*`.

Legacy locations are temporary migration debt recorded in `manifests/source-test-ownership.json`. New tests must use canonical paths. Generated inventory lives in `INVENTORY.md` and `results/test-inventory.json`.
