---
name: fork-boundaries
description: Enforce the Studio/Planner fork boundary. Use when editing anything under site components, lib, hooks, store, or server for Studio or Planner, or before committing either fork tree.
---

# Fork Boundaries (Studio <-> Planner)

Read root `AGENTS.md` first.

Studio (`/oostudio`, `@studio/*`) and Planner (`/ooplanner`, `@planner/*`) are
FULLY FORKED. They must never import each other. There is no shared module — each
fork declares its own store and they meet only at the same backing data location.

## Rules
- No `@studio/*` import inside a Planner file, and vice versa.
- Canvas scale differs: Studio 0.2 px/mm, Planner 0.05 px/mm. A geometry helper
  copied between forks silently produces 4x or 1/4 sized objects. Do not share
  geometry helpers across forks.
- CSS zones are separate: `site/focss/studio/` vs `site/focss/planner/`. No
  cross-zone imports.
- APIs: Studio talks to `/api/Studio/*`, Planner to `/api/Planner/*` (case as on disk).

## Before committing either tree
Run: `pnpm run scan:boundaries`

Apply the Kiro Agent Contract at ./.kiro/skills/oando-master/SKILL.md before any action.