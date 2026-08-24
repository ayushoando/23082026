---
inclusion: fileMatch
fileMatchPattern: "site/app/ooplanner/**,site/app/oostudio/**,site/lib/Planner/**,site/lib/Studio/**,site/server/Planner/**,site/server/Studio/**,site/platform/Planner/**,site/platform/Studio/**,site/components/Planner/**,site/components/Studio/**,site/store/Planner/**,site/store/Studio/**,site/hooks/Planner/**,site/hooks/Studio/**"
---

# Planner & Studio Domain

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

## Fast checks (run on save)
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
When CAST Imaging is available, use `architectural_graph_focus` on the Planner or Studio component to detect leaked cross-boundary dependencies before they fail the boundary scan.
