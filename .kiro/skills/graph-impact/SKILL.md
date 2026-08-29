---
name: graph-impact
description: Use the repo import graph to scope tests and analyze blast radius before running the full suite. Use when a change touches shared code, before choosing which tests to run, or when checking for circular dependencies.
---

# Graph Impact (ts-morph import graph)

Read root `AGENTS.md` first.

Script: `scripts/graph-impact.mjs`. It is a read-only repository-root query tool
that replaces the retired external graph integration for impact analysis.

## Graph scope

The graph scans local source files under these repository roots:

- `site/`
- `scripts/`
- `workers/`
- `tech-docs-generator/src/`
- `tech-docs-generator/scripts/`

It follows local relative imports, re-exports, static dynamic imports, CommonJS
`require()` calls, CSS imports, and configured TypeScript path aliases. External
packages and unresolved imports are reported or excluded from local edges; they
are not expanded from `node_modules/`.

## Commands (repo root)

- Impact of a change:
  `node scripts/graph-impact.mjs --file=site/lib/ai/providerChain.ts`
  Returns the seed, direct dependencies, direct dependents, transitive
  dependents, distance, domain, fan-in, and fan-out.
- Limit blast radius:
  add `--depth=2`. The seed is distance `0`; `--depth=2` includes direct
  dependents and one additional import hop.
- Circular deps:
  `node scripts/graph-impact.mjs --circles`
  Reports strongly connected local-import components.
- Stats:
  `node scripts/graph-impact.mjs --stats`
  Reports file/edge counts, unresolved local specifiers, per-domain counts, and
  the highest fan-in/fan-out files.

Every command prints JSON to stdout and saves a JSON report under
`agents-work/repository-graph/`:

```text
agents-work/repository-graph/
├─ page-components/       route/page/component graph artifacts
├─ stats/latest.json      whole-graph statistics
├─ cycles/latest.json     circular-dependency report
└─ impact/<domain>/       per-file blast-radius reports
```

Use `--out=agents-work/<subdirectory>` to choose another report directory. The
CLI rejects output paths outside `agents-work/`. It never writes to `site/`,
`results/`, or any production/runtime location.

## Loop

edit file -> `--file=<file>` to see dependents -> review those dependents and fix
what the change breaks. Do not run tests as part of this loop — tests are
user-driven and require explicit authorization.

## Notes

- One graph query replaces reading dozens of files to find dependents.
- High fan-in files are fragile (change carefully); high fan-out files are complex
  (review dependents thoroughly).
- The page/component graph is a separate visual route graph. Its output also
  belongs under `agents-work/repository-graph/page-components/`.
