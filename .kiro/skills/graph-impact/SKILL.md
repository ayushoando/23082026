---
name: graph-impact
description: Use the repo import graph to scope tests and analyze blast radius before running the full suite. Use when a change touches shared code, before choosing which tests to run, or when checking for circular dependencies.
---

# Graph Impact (ts-morph import graph)

Read root `AGENTS.md` first.

Script: `scripts/graph-impact.mjs`. Replaces the retired external graph integration for impact analysis.

## Commands (repo root)
- Impact of a change:
  `node scripts/graph-impact.mjs --file=site/lib/ai/providerChain.ts`
  Returns transitive dependents and domain per file, so you know what a change
  reaches before you make it.
- Limit blast radius: add `--depth=2` for direct + 1-hop.
- Circular deps: `node scripts/graph-impact.mjs --circles`
- Stats (fan-in/fan-out, per-domain counts): `node scripts/graph-impact.mjs --stats`

## Loop
edit file -> `--file=<file>` to see dependents -> review those dependents and fix
what the change breaks. Do not run tests as part of this loop — tests are
user-driven.

## Notes
- One graph query replaces reading dozens of files to find dependents.
- High fan-in files are fragile (change carefully); high fan-out files are complex
  (review dependents thoroughly).

