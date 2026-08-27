# Requirements Document

## Introduction

`site/focss/planner/dock.css` is imported twice from two different entry paths. Its rules must win over `dockview-react`'s base stylesheet, but nothing in the codebase guarantees that ordering. This spec makes the override order declared and deterministic for the Planner fork only.

Reported symptom on `/ooplanner`: dock panels do not move (cannot be dragged or floated) and tab-bar icons are not arranged. Reported on both desktop and mobile, with no console errors and no visible response to clicks. The absence of console errors and the failure at 1920 together rule out the target-size and tap-floor defects recorded in [`agent-reports/css-static-audit-report.md`](../css-static-audit-report.md); those only affect narrow viewports and would still respond at desktop width.

### Evidence

| Fact | Location |
|---|---|
| `entry.css` imports the dock sheet | `site/focss/planner/entry.css`, final `@import "./dock.css"` |
| The component imports the same sheet again | `site/components/Planner/PlannerDockShell.tsx` line 5 |
| The component imports dockview base styles first | `site/components/Planner/PlannerDockShell.tsx` line 4 |
| The layout loads the zone entry | `site/features/Planner/layout.tsx` line 3 |
| The intended order is recorded as a comment | `site/focss/planner/entry.css`, above the dock import |
| The pinned entry contract includes `./dock.css` | `scripts/AsNeeded/verify-focss-structure.mjs` |
| No gate inspects TSX-level `@focss/` imports | `scripts/AsNeeded/verify-focss-module-imports.mjs` handles only `*.module.css`, of which none exist, so it reports `skipped` |

`entry.css` states the intent explicitly: the dock sheet must come after the dockview stylesheet imported from TSX. That holds only if the dock sheet loads later. Because `layout.tsx` renders before `PlannerDockShell.tsx` mounts, the zone entry registers `dock.css` early; when the component then pulls in `dockview.css`, the base stylesheet can be inserted after the overrides. The resulting cascade is decided by bundler and route-entry behaviour rather than by anything declared, which is also why the symptom can present intermittently.

### Hypotheses tested and rejected

Recorded so they are not re-investigated.

- **A containing block breaking `position: fixed`** on `.dv-floating-overlay-host`. No `transform`, `contain`, `will-change`, `perspective`, or `backdrop-filter` exists on any ancestor of `.side-panel--dock`. The matches in the Planner zone are on buttons, cards, tooltips, context menus, and floating pills. Rejected.
- **Dockview renamed its internal class names in an upgrade.** All targeted names exist in the installed `dockview-react@7.0.4` stylesheet: `dv-tab` 687 occurrences, `dv-tabs-and-actions-container` 151, `dv-resize-container` 96, `dv-dockview` 11, `dv-floating-overlay-host` 2. Rejected.
- **Floating groups disabled by configuration.** `PlannerDockShell.tsx` passes `disableFloatingGroups={false}` and `floatingGroupBounds` with 48px minimums. Rejected.

## Glossary

| Term | Meaning |
|---|---|
| **Zone entry** | The single root stylesheet a layout imports for a FOCSS zone. Planner's is `site/focss/planner/entry.css`. |
| **Route-local import** | A CSS import placed in a TSX module rather than in a zone entry, so it loads with that component. `site/app/admin/design-kit/page.tsx` is the existing sanctioned example. |
| **Cascade order** | The document order in which stylesheets are inserted, which decides the winner between rules of equal specificity. |
| **Override sheet** | A stylesheet whose purpose is to defeat a third-party library's base rules. It is only correct if it loads after that library's stylesheet. |
| **Pinned entry contract** | The exact `@import` list `verify-focss-structure.mjs` asserts for each zone entry. Changing an entry's imports requires changing that assertion in the same commit. |
| **Fork boundary** | Planner and Studio are separate trees that must never import each other, enforced by `pnpm run scan:boundaries`. |

## Requirements

### Requirement 1: The dock override sheet must load after the dockview base stylesheet

**User Story:** As a Planner user, I want dock panels to drag and float and the tab bar to lay out correctly, so that I can arrange my workspace.

The dock sheet exists to override `dockview-react`'s base rules. It contains `!important` declarations on `.dv-dockview`, `.dv-tabs-and-actions-container`, `.dv-tab`, and the `.dv-floating-overlay-host` float-escape rules. Those overrides only take effect if the sheet loads after `dockview-react/dist/styles/dockview.css`.

#### Acceptance Criteria

- **1.1** WHEN the Planner route loads THEN `site/focss/planner/dock.css` SHALL be inserted after `dockview-react/dist/styles/dockview.css` in document order.
- **1.2** The resulting order SHALL be guaranteed by a single declared import site, not by bundler or route-entry timing.
- **1.3** `site/focss/planner/dock.css` SHALL have exactly one import site in the codebase.
- **1.4** No rule in `dock.css` SHALL be modified to compensate for load order. The defect is ordering, not specificity.

### Requirement 2: The pinned entry contract must stay truthful

**User Story:** As a maintainer, I want the structure checker to describe the real import graph, so that the gate protects the contract instead of freezing a stale one.

`scripts/AsNeeded/verify-focss-structure.mjs` asserts an exact import list for `planner/entry.css`, and that list currently includes `./dock.css`. Removing the import without updating the assertion fails the gate; updating the assertion without removing the import leaves the duplicate in place.

#### Acceptance Criteria

- **2.1** IF the `@import "./dock.css"` line is removed from `planner/entry.css` THEN the pinned list in `verify-focss-structure.mjs` SHALL be updated in the same change.
- **2.2** The updated assertion SHALL continue to pin every remaining Planner entry import in its existing order.
- **2.3** The change SHALL NOT alter the pinned contract for `site/entry.css`, `admin/entry.css`, `studio/entry.css`, or `base/root.css`.

### Requirement 3: The Studio fork must not be touched

**User Story:** As a maintainer, I want the fork boundary respected, so that a Planner deadline fix cannot destabilise Studio.

`site/focss/studio/dock.css` has the identical duplicate: imported by `studio/entry.css` and again by `site/components/Studio/StudioDockShell.tsx` line 5. It is the same defect and needs the same fix, but not in this change.

#### Acceptance Criteria

- **3.1** No file under `site/focss/studio/**` or `site/components/Studio/**` SHALL be modified by this spec.
- **3.2** The identical Studio defect SHALL be recorded for a separate follow-up, with its evidence, so it is not lost.
- **3.3** `pnpm run scan:boundaries` SHALL be listed as required verification, because Planner files are touched.

### Requirement 4: The gate gap must be recorded

**User Story:** As a maintainer, I want to know why this defect was invisible, so that the next one is caught.

No repository check inspects TSX-level `@focss/` imports. `verify-focss-module-imports.mjs` resolves only `*.module.css` files under `site/focss`; none exist, so it exits early reporting `skipped`. `verify-focss-structure.mjs` validates CSS-to-CSS `@import` chains but never reads TSX. A stylesheet can therefore be imported from both a zone entry and a component with no gate objecting.

#### Acceptance Criteria

- **4.1** The gap SHALL be recorded in writing with the specific reason each existing checker misses it.
- **4.2** A checker that would detect duplicate zone-sheet imports SHALL be proposed as a follow-up candidate, not built here. Adding a new gate is out of scope for a deadline fix.

## Out of scope

- **Tab and icon arrangement as a design problem.** If Requirement 1 restores the override cascade, some or all of the "icons not arranged" symptom may resolve on its own. Restyling the tab bar before knowing that would mean styling around an inverted cascade. Deferred to the `planner-dock-layout` spec.
- **`DockFloatHeaderActions` layout.** `PlannerDockShell.tsx` passes a custom `rightHeaderActionsComponent`. Whether the icon arrangement is the cascade or that component's own layout needs rendered DOM to separate. Deferred to spec 2.
- **Planner control sizing.** The 20-22px swatches, icon buttons, and 14px slider thumbs recorded in the CSS audit are a design-system concern, owned in part by `site-page-css-remediation` tasks 1.5 and 1.6. Deferred to spec 3.
- **The Studio fix.** Same defect, separate change, per Requirement 3.
- **Any new repository gate.** Per criterion 4.2.

## Verification rules

- The agent must not run tests, gates, browser suites, or repository commands while planning or implementing this spec.
- `pnpm run verify:focss` and `pnpm run scan:boundaries` are user-invoked and listed in the final task wave.
- One browser observation is required to confirm the fix and cannot be performed by the agent: on `/ooplanner`, inspect a dock tab and confirm `dock.css` appears after `dockview.css` in the Styles pane.

## Acceptance criteria

1. `site/focss/planner/dock.css` has exactly one import site, and that site guarantees it loads after `dockview.css`.
2. No rule inside `dock.css` was changed.
3. `verify-focss-structure.mjs` asserts the real Planner entry import list.
4. No Studio file was modified, and the identical Studio defect is recorded for follow-up.
5. The gate gap is recorded, with a proposed checker named as a follow-up rather than implemented.
6. A browser observation confirming the corrected cascade order is captured by the user.
