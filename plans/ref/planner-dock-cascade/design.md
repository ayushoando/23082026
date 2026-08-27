# Design: Planner dock cascade fix

## Overview

One defect, one line removed, one checker assertion updated. `site/focss/planner/dock.css` has two import sites; the fix removes the one that cannot guarantee correct ordering and keeps the one that can.

The design deliberately does not touch any rule inside `dock.css`. The sheet's contents are almost certainly correct — they target real class names in the installed `dockview-react@7.0.4` and were written against a stated ordering intent. The defect is that the intent is not enforced. Adding specificity or more `!important` to compensate would mask an ordering bug with a specificity hack and leave the real problem in place.

## Architecture

Two independent load paths currently reach the same stylesheet.

**Path A — the zone entry.** `site/features/Planner/layout.tsx` line 3 imports `@focss/planner/entry.css`. That entry imports, in order: `tailwindcss`, `../base/tokens/palette.css`, `./base/palette.css`, `./base/semantic.css`, `./base/layout.css`, `./base/document.css`, `./chrome.css`, `./controls.css`, `./polish.css`, `./workspace-shell.css`, `./workspace.css`, and finally `./dock.css`.

**Path B — the component.** `site/components/Planner/PlannerDockShell.tsx` imports, in source order:

```tsx
import { DockviewReact, themeAbyss, themeLight } from "dockview-react";
import "dockview-react/dist/styles/dockview.css";
import "@focss/planner/dock.css";
```

Path B has the property the override needs: the base stylesheet and the override sheet are adjacent, in the right order, in one file. Path A does not, because it cannot see `dockview.css` at all — that stylesheet only enters the graph through the component.

A React layout renders before the components it wraps mount, so Path A registers `dock.css` first. When Path B later introduces `dockview.css`, the bundler may insert it after the already-registered override sheet. The override then loses. Nothing declares the relationship, so the outcome depends on bundler behaviour, route entry, and whether the route was reached by navigation or a cold load — which is consistent with an intermittent symptom.

The correct shape is a single import site on Path B, matching the existing sanctioned route-local pattern at `site/app/admin/design-kit/page.tsx` line 6, where `admin/components/design-kit.css` is imported by the route that needs it and is deliberately absent from `admin/entry.css`.

## Components and Interfaces

| File | Change | Risk |
|---|---|---|
| `site/focss/planner/entry.css` | remove the final `@import "./dock.css";` and its intent comment | low |
| `scripts/AsNeeded/verify-focss-structure.mjs` | remove `"./dock.css"` from the pinned `planner/entry.css` list | low; must be same commit |
| `site/components/Planner/PlannerDockShell.tsx` | none — already correct | none |
| `site/focss/planner/dock.css` | none — contents are not the defect | none |

Files that must not be opened for editing: `site/focss/studio/**`, `site/components/Studio/**`, and the pinned contracts for `site/entry.css`, `admin/entry.css`, `studio/entry.css`, `base/root.css`.

The interface being fixed is the ordering contract between two stylesheets. After the change it is expressed in exactly one place — three adjacent lines of `PlannerDockShell.tsx` — instead of being asserted in a comment in a file that cannot enforce it.

## Data Models

No runtime data model changes. The relevant model is the stylesheet insertion graph.

| Stylesheet | Import site before | Import site after |
|---|---|---|
| `dockview-react/dist/styles/dockview.css` | `PlannerDockShell.tsx` line 4 | unchanged |
| `site/focss/planner/dock.css` | `planner/entry.css` **and** `PlannerDockShell.tsx` line 5 | `PlannerDockShell.tsx` line 5 only |
| Other Planner zone sheets | `planner/entry.css` | unchanged |

The `localStorage` layout key handled by `PlannerDockShell.tsx` (`storageKey`, `savedLayoutMatchesPanels`, `pruneRetiredPanels`) is untouched. Worth noting for triage: a persisted layout that predates the fix is restored via `api.fromJSON`, so a user whose saved layout was created while the cascade was broken may still see a stale arrangement until it is reset. That is a data-state question, not a CSS one, and is called out in Error Handling rather than fixed here.

## Rejected alternatives

**Remove the TSX import and keep the entry import.** This inverts the problem. `dockview.css` would still enter through the component, and with the override now in the layout-level entry it would load even earlier, guaranteeing the base stylesheet wins. Strictly worse.

**Keep both imports and raise specificity in `dock.css`.** Masks an ordering defect, leaves a duplicate import, and grows an already `!important`-heavy sheet. Also silently depends on the duplicate never being deduplicated by a future bundler change.

**Move `dockview.css` into `entry.css` before `dock.css`.** Would make ordering explicit inside one file, but puts a third-party stylesheet into a FOCSS zone entry, which the zone rules do not contemplate, and it would load dockview's base styles on Planner routes that never mount a dock.

**Do nothing and treat it as a design problem.** Rejected because the audit already established the symptom is not viewport-dependent, and no console error implicates a handler.

## Correctness Properties

### Property 1: single import site

`site/focss/planner/dock.css` is imported from exactly one location in the repository.

**Validates: Requirements 1.3**

### Property 2: override loads after base

In document order on `/ooplanner`, `dock.css` is inserted after `dockview-react/dist/styles/dockview.css`.

**Validates: Requirements 1.1, 1.2**

### Property 3: dock rules unchanged

The contents of `site/focss/planner/dock.css` are byte-identical before and after the change.

**Validates: Requirements 1.4**

### Property 4: pinned contract matches reality

`verify-focss-structure.mjs` asserts exactly the imports `planner/entry.css` actually contains, and the other four pinned entries are unchanged.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 5: Studio untouched

No file under `site/focss/studio/**` or `site/components/Studio/**` differs after the change.

**Validates: Requirements 3.1**

### Property 6: findings recorded

The Studio duplicate and the gate gap are both recorded in writing, with evidence, and neither is fixed here.

**Validates: Requirements 3.2, 4.1, 4.2**

## Error Handling

- **If `verify:focss` fails after the change,** the pinned list in `verify-focss-structure.mjs` was not updated, or was updated inconsistently with the remaining imports. Both files must change together; neither is correct alone.
- **If the symptom persists after the cascade is confirmed corrected,** stop. Requirement 1 is satisfied and the remaining cause is not ordering. Hand off to the `planner-dock-layout` spec rather than editing `dock.css` here. This is the expected outcome for some portion of the "icons not arranged" symptom and is not a failure of this spec.
- **If a stale saved layout is suspected,** clear the `storageKey` entry in `localStorage` and reload before drawing conclusions. `handleReady` restores a persisted layout through `api.fromJSON` when `savedLayoutMatchesPanels` passes, so a layout captured while the cascade was inverted can survive the fix. Record this if it occurs; do not add layout-reset logic in this spec.
- **If dock panels still cannot be dragged with the cascade confirmed correct,** treat it as a runtime or dockview-configuration matter, not CSS. `disableFloatingGroups={false}` and `floatingGroupBounds` are already correct, so the next place to look is the dockview API wiring in `handleReady`, which is outside this spec.
- **If removing the entry import changes any non-dock Planner surface,** revert immediately. The change must be inert for everything except dock element ordering.

## Testing Strategy

Agent-side: none. No task runs tests, gates, browser suites, or repository commands. This is a repository rule.

User-invoked after implementation:

- `pnpm run verify:focss` — the primary gate for Property 4. It exercises the structure checker whose pinned list this change edits.
- `pnpm run scan:boundaries` — required, because Planner files are touched. Confirms Property 5 mechanically.
- `pnpm run lint:ui:strict` — UI contract.

One browser observation is required and cannot be delegated to a script: load `/ooplanner`, inspect a dock tab, and confirm in the Styles pane that `dock.css` appears after `dockview.css`. This is the only direct evidence for Property 2; a passing gate does not establish it. Then attempt to drag a dock panel and check the tab-bar icon arrangement, recording which symptoms resolved and which did not, since that determines the scope of spec 2.

No new automated test is added. The property at stake is stylesheet insertion order in a production bundle, which a unit test in a happy-dom environment cannot faithfully reproduce — happy-dom does not model real cascade insertion from bundled CSS imports. Asserting the single-import-site property in a test would restate a one-line grep. The honest verification is the gate plus the browser check.
