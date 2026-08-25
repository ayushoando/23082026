---
name: graph-impact
description: Use the repo import graph to scope tests and analyze blast radius before running the full suite. Use when a change touches shared code, before choosing which tests to run, or when checking for circular dependencies.
---

# Graph Impact (ts-morph import graph)

Script: `scripts/graph-impact.mjs`. Replaces CAST Imaging for impact analysis.

## Commands (repo root)
- Impact + scoped tests for a change:
  `node scripts/graph-impact.mjs --file=site/lib/ai/providerChain.ts`
  Returns transitive dependents, domain per file, covering tests, and a
  ready-to-run `suggestedTestCommand` (scoped vitest).
- Limit blast radius: add `--depth=2` for direct + 1-hop.
- Circular deps: `node scripts/graph-impact.mjs --circles`
- Stats (fan-in/fan-out, per-domain counts): `node scripts/graph-impact.mjs --stats`

## Loop
edit file -> `--file=<file>` -> run its `suggestedTestCommand` -> fix (max 3
iterations) -> finish with `pnpm run gate:fast`.

## Notes
- One graph query replaces reading dozens of files to find dependents.
- High fan-in files are fragile (change carefully); high fan-out files are complex
  (test thoroughly).
