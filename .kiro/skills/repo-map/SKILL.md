---
name: repo-map
description: Orient in and map the oando1408 repo the correct way. Use when starting work, exploring the codebase, locating a feature, understanding structure, or answering "where does X live" — before scanning files blindly.
---

# Repo Map (oando1408)

This repo is already mapped. Read its canonical docs and use the import graph
instead of walking the tree by hand. Truth order: user > live code + fresh
commands > AGENTS.md > Agents/ > docs/.

## Step 1 — Orient from canonical docs (read first)
- `START.md` — onboarding, install/run, read order.
- `docs/architecture/layout.md` — directory map (top-level roles).
- `docs/architecture/stack.md` — toolchain, packages actually wired, persistence.
- `docs/architecture/routes.md` — pages + API inventory.
- `docs/architecture/product-map.md` — package/feature map.
- `AGENTS.md` — the process floor (hard rules).

These are hand-synced. When a doc and the code differ, the CODE wins — verify the
specific claim before relying on it.

## Step 2 — Map dependencies with the graph (not manual scanning)
Script: `scripts/graph-impact.mjs` (see the graph-impact skill).
- Whole-repo shape: `node scripts/graph-impact.mjs --stats`
  (file/edge counts, per-domain counts, high fan-in/fan-out).
- Blast radius of a file: `node scripts/graph-impact.mjs --file=<path>`.
- Cycles: `node scripts/graph-impact.mjs --circles`.
One graph query replaces reading dozens of files to find dependents.

## Step 3 — Regenerate inventories when docs look stale
`pnpm run docs:sync` (repo root) regenerates route/API inventories.

## Fixed facts to anchor the map
- Product lives in `site/` (Next.js App Router). Four surfaces: marketing
  `app/(site)`, `app/admin`, Studio `app/oostudio`, Planner `app/ooplanner`.
- Studio and Planner are FORKED — never import each other (see fork-boundaries skill).
- Edge entry is `site/proxy.ts`, NOT `middleware.ts`.
- Two databases: Admin (`rxzpznmxbaoxpikowmfc`) and Products (`erpweaiypimorcunaimz`).
- `.kiro/mcp/` contains MCP tool schemas, not proof of workspace configuration or
  runtime installation; `ltm/` is the long-term-memory working directory.
- `plans/README.md` is the active planning coordination authority. Active plans
  and plan-owned evidence use `plans/<name>/`; `plans/PLAN.md` and `plans/ref/`
  are not current repository paths.
- `site/data/storage/` is legacy — do not write there.

## Do not
- Do not claim structure from memory or a single directory listing.
- Do not scan the whole tree when a graph query or a doc answers the question.

## Powers to activate (agent decides)
- For current, version-correct docs on a library/framework used here, the agent
  may activate `context7`; for live web research beyond the repo, `exa`.
  First confirm the named capability is present in the current installed-power
  registry. Prefer repo docs + graph; do not infer installation from prose.
