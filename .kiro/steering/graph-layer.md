---
inclusion: manual
---

# Graph Layer — Repository Import Graph

## Overview

The generated-document pipeline builds a repository graph from live source through `tech-docs-generator/scripts/extract-repo-graph.mjs`. That module is an exported generator component, not a standalone impact, cycle, statistics, or test-selection CLI.

The previously documented dedicated impact script is not present in the live worktree. Do not invoke unsupported impact flags or claim a generated test recommendation. For change-impact work, inspect imports and dependents directly from the live source tree and keep the review scoped to the changed domain.

## Integration with other layers

### Static layer (PostFileSave hook)

The hook runs configured domain-specific non-test checks on save. For additional impact analysis:

1. Identify direct imports and dependents from live source.
2. Follow only the paths relevant to the changed domain.
3. Report any applicable user-invoked validation command; never run tests or gates automatically.

### Browser layer

Instead of testing all routes visually:

1. Inspect which pages import the changed component.
2. Test only those routes at the required viewports when the user explicitly requests browser verification.

### Review loop

```text
edit file
  → inspect live imports and dependents
  → report applicable user-invoked validation
  → apply fixes and repeat only when the user requests validation
```

## Token efficiency

- Keep dependency inspection scoped to the changed file and its direct consumers first.
- Expand transitively only when direct consumers show shared or cross-domain impact.
- Do not rely on historical generated graph metrics as proof of the current worktree.
