---
name: planner-studio
description: Use Planner Studio guidance to plan product work, tasks, and implementation steps.
---

# Planner & Studio Domain

Read root `AGENTS.md` first.

## Architecture
- **Forked apps** — Planner (`/ooplanner`) and Studio (`/oostudio`) must NEVER import each other.
- Each has its own: components, lib, hooks, store, server, platform trees.
- Shared code lives in `site/platform/shared/` only.

## Conventions
- Run `pnpm run scan:boundaries` before committing changes to either fork.
- Planner persistence: disk when `DEV_AUTH_BYPASS=1`, else Supabase (`oando_plans`).
- Furniture/descriptors: disk when dev, else `furniture_catalog` / `block_descriptors`.
- Canvas: Fabric.js (`fabric` package), polygon-clipping for shape ops.
- Panels: `dockview-react` for dockable panel layout.

## Checks (user-owned)
These commands are for an explicit fork-validation request. An agent may execute
them only with current-session user authorization and permission from an enabled
pre-execution `block-agent-tests` hook; otherwise provide them to the user.
```
pnpm run scan:boundaries
pnpm run typecheck
pnpm run p0:unit
```

## Boundary rules
- No import from `site/*/Studio/` in any Planner file.
- No import from `site/*/Planner/` in any Studio file.
- Violation = build break.

## Graph-layer integration
Use `node scripts/graph-impact.mjs --file=<changed-file>` to inspect affected imports before optional validation. This repository graph replaces the retired CAST integration.

