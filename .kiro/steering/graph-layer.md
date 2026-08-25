---
inclusion: manual
---

# Graph Layer — ts-morph Import Graph (Layer 3)

## Overview
A lightweight dependency graph built from the repo's TypeScript/CSS imports. Replaces CAST Imaging for impact analysis, scoped testing, and circular dependency detection.

**Script:** `scripts/graph-impact.mjs`

## Commands

### Impact analysis (most common)
```bash
node scripts/graph-impact.mjs --file=site/lib/ai/providerChain.ts
```
Returns:
- All files transitively affected by a change to that file
- Domain classification for each impacted file
- Covering test files
- A ready-to-run `vitest` command scoped to only the affected tests

### Limit depth
```bash
node scripts/graph-impact.mjs --file=site/components/ui/Button.tsx --depth=2
```
Useful when a highly-connected file has huge blast radius — limit to direct + 1-hop dependents.

### Circular dependency detection
```bash
node scripts/graph-impact.mjs --circles
```
Finds import cycles across all domains. Fix these to reduce coupling.

### Graph statistics
```bash
node scripts/graph-impact.mjs --stats
```
Shows:
- Total files and edges
- File count per domain (ui-css, database, ai, seo, testing, deployment, planner, studio, api)
- High fan-in files (most imported — fragile, change carefully)
- High fan-out files (most dependencies — complex, test thoroughly)

## Integration with other layers

### Static layer (PostFileSave hook)
The hook runs domain-specific lint/typecheck on save. The graph layer adds *scoped test selection*:
1. File saved → hook runs fast check
2. If you want to also run tests → `node scripts/graph-impact.mjs --file=<saved-file>`
3. Use the `suggestedTestCommand` from the output

### Browser layer (Nova Act)
Instead of testing all routes visually:
1. Run `--file=<changed-component>` to see which pages import it
2. Only test those routes at 4 viewports

### Loop pattern with graph
```
edit file
  → graph-impact --file=<file> (get blast radius)
  → run suggestedTestCommand (scoped tests only)
  → if fail: fix → re-run scoped tests (max 3 iterations)
  → final: gate:fast
```

## Key metrics from this repo

| Metric | Value |
|--------|-------|
| Total files in graph | ~1,689 |
| Total import edges | ~3,247 |
| Highest fan-in | `guestProjectSetup.ts` (49), `home/layout/index.ts` (48), `siteUrl.ts` (43) |
| Highest fan-out | `Planner.tsx` (48), `Studio.tsx` (39), `focss/site/components/index.css` (24) |

## Token efficiency
- One graph query replaces reading dozens of files to find dependents.
- The `suggestedTestCommand` avoids running the full test suite (625 test files → just the affected ones).
- Use `--depth=1` for quick local impact; `--depth=10` (default) for full transitive blast radius.
