# Implementation Plan: Planner dock cascade fix

## Overview

Remove the duplicate import of `site/focss/planner/dock.css` so the sheet has one import site that guarantees it loads after `dockview-react`'s base stylesheet. Two files change, in one commit. No rule inside `dock.css` is touched.

This is the deadline item. Waves 0 through 2 are agent-implementable and small. Wave 3 is user-invoked verification and includes one browser observation that no gate can substitute for. Wave 4 records two findings for follow-up without fixing them.

### Execution contract

- Change only `site/focss/planner/entry.css` and `scripts/AsNeeded/verify-focss-structure.mjs`. Both in the same commit.
- Do not modify `site/focss/planner/dock.css`. Its contents are not the defect.
- Do not modify `site/components/Planner/PlannerDockShell.tsx`. Its import order is already correct.
- Never touch `site/focss/studio/**` or `site/components/Studio/**`. Same defect, separate change.
- Do not add specificity or `!important` anywhere to compensate for ordering.
- Do not add a new repository gate. Recorded as a follow-up candidate only.
- Do not assert a rendered result. The cascade claim is confirmed by the user in a browser, not by the agent.
- Tests and gates in Wave 3 are user-invoked. The agent must not run them.

### Ownership table

| Task | File | Scope of change |
|---|---|---|
| 1.1 | `site/focss/planner/entry.css` | remove final `@import "./dock.css";` and its intent comment |
| 1.2 | `scripts/AsNeeded/verify-focss-structure.mjs` | remove `"./dock.css"` from the pinned `planner/entry.css` list |
| 0.x, 2.x | `site/components/Planner/PlannerDockShell.tsx`, `site/focss/planner/dock.css` | read-only |
| 4.1 | `plans/planner-dock-cascade/` notes, or `agent-reports/` | append Studio duplicate record |
| 4.2 | same | append gate-gap record |

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 0,
      "name": "Confirm the defect still holds",
      "tasks": ["0.1", "0.2", "0.3"],
      "dependsOn": [],
      "parallel": true,
      "agentExecutable": true,
      "readOnly": true
    },
    {
      "wave": 1,
      "name": "Remove the duplicate import",
      "tasks": ["1.1", "1.2"],
      "dependsOn": ["0.1", "0.2"],
      "parallel": false,
      "agentExecutable": true,
      "note": "Both files must change in the same commit or verify:focss fails."
    },
    {
      "wave": 2,
      "name": "Confirm nothing else moved",
      "tasks": ["2.1", "2.2"],
      "dependsOn": ["1.1", "1.2"],
      "parallel": true,
      "agentExecutable": true,
      "readOnly": true
    },
    {
      "wave": 3,
      "name": "User-invoked verification",
      "tasks": ["3.1", "3.2", "3.3", "3.4"],
      "dependsOn": ["1.1", "1.2", "2.1", "2.2"],
      "parallel": false,
      "agentExecutable": false,
      "note": "3.4 is a browser observation and is the only direct evidence for the cascade property."
    },
    {
      "wave": 4,
      "name": "Record deferred findings",
      "tasks": ["4.1", "4.2", "4.3"],
      "dependsOn": [],
      "parallel": true,
      "agentExecutable": true
    }
  ]
}
```

Critical constraints encoded above:

- 1.1 and 1.2 are a single atomic change. Removing the import without updating the pinned list fails `verify:focss`; updating the list without removing the import leaves the duplicate. Neither is correct alone.
- Wave 3 cannot be run by the agent, and task 3.4 cannot be replaced by a passing gate. Stylesheet insertion order is not something the existing checkers observe.
- Wave 4 has no dependency on the fix and can be recorded at any time.
- Spec 2 (`planner-dock-layout`) must not begin until task 3.4 records which symptoms survived, because that determines its scope.

## Tasks

### Wave 0 — Confirm the defect still holds

- [ ] 0.1 Re-confirm the duplicate import. Verify `site/focss/planner/entry.css` still ends with `@import "./dock.css";` and that `site/components/Planner/PlannerDockShell.tsx` line 5 still imports `@focss/planner/dock.css`. If either is already gone, stop and re-plan; the defect may have been fixed by other work. _Requirements: 1.3_
- [ ] 0.2 Re-confirm the pinned contract. Verify `scripts/AsNeeded/verify-focss-structure.mjs` still lists `"./dock.css"` as the last entry of the `planner/entry.css` pinned import array, and record the exact surrounding array so task 1.2 edits the right one of the five pinned entries. _Requirements: 2.1_
- [ ] 0.3 Re-confirm the component's import order is already correct. `PlannerDockShell.tsx` must import `dockview-react/dist/styles/dockview.css` before `@focss/planner/dock.css`. This ordering is the thing the fix relies on; if it has changed, the fix changes shape. Record that no edit to this file is needed. _Requirements: 1.1, 1.2_

### Wave 1 — Remove the duplicate import

- [ ] 1.1 Remove the dock import from `site/focss/planner/entry.css`. Delete the final `@import "./dock.css";` line and the comment above it that asserts the ordering intent, since the intent is now enforced structurally by the component and a stale comment claiming otherwise would mislead. Leave all eleven remaining imports and their order untouched. Do not reorder anything. _Requirements: 1.1, 1.2, 1.3, 1.4_
- [ ] 1.2 Update the pinned contract in `scripts/AsNeeded/verify-focss-structure.mjs`. Remove `"./dock.css"` from the `planner/entry.css` array so the assertion matches the file. Change nothing about the pinned arrays for `site/entry.css`, `admin/entry.css`, `studio/entry.css`, or `base/root.css` — in particular, leave Studio's `"./dock.css"` in place, because the Studio entry still imports it. Commit together with 1.1. _Requirements: 2.1, 2.2, 2.3_

### Wave 2 — Confirm nothing else moved

- [ ] 2.1 Confirm `dock.css` is unchanged and now has one import site. Verify `site/focss/planner/dock.css` is byte-identical to before the change, and that a repository-wide search for `planner/dock.css` returns exactly one import site, `PlannerDockShell.tsx`. _Requirements: 1.3, 1.4_
- [ ] 2.2 Confirm the Studio fork is untouched. Verify no file under `site/focss/studio/**` or `site/components/Studio/**` differs, and that `studio/entry.css` still imports `./dock.css` with its pinned assertion intact. Studio remains deliberately unfixed. _Requirements: 3.1_

### Wave 3 — User-invoked verification

The agent does not run these.

- [ ] 3.1 User runs `pnpm run verify:focss`. Primary gate for the pinned-contract change. This is the check most likely to catch a mismatch between tasks 1.1 and 1.2.
- [ ] 3.2 User runs `pnpm run scan:boundaries`. Required because Planner files were touched.
- [ ] 3.3 User runs `pnpm run lint:ui:strict`.
- [ ] 3.4 User confirms the cascade order in a browser and records which symptoms resolved. Load `/ooplanner`, inspect a dock tab, and confirm in the Styles pane that `dock.css` appears after `dockview.css`. Then attempt to drag and float a dock panel, and check the tab-bar icon arrangement. Record which of the two reported symptoms resolved and which survived. A passing gate is not evidence for this; stylesheet insertion order is not observed by any checker. If a stale saved layout is suspected, clear the dock `storageKey` entry in `localStorage` and reload before concluding. _Requirements: 1.1_

### Wave 4 — Record deferred findings

- [ ] 4.1 Record the identical Studio duplicate for follow-up. `site/focss/studio/dock.css` is imported by `studio/entry.css` and again by `site/components/Studio/StudioDockShell.tsx` line 5 — the same defect with the same shape. Record the evidence and the fact that its pinned entry in `verify-focss-structure.mjs` will need the same paired edit. Do not fix it here. _Requirements: 3.2_
- [ ] 4.2 Record the gate gap. No repository check inspects TSX-level `@focss/` imports. `verify-focss-module-imports.mjs` resolves only `*.module.css` under `site/focss`; none exist, so it exits early reporting `skipped`. `verify-focss-structure.mjs` validates CSS-to-CSS `@import` chains and never reads TSX. A zone sheet can therefore be imported from both an entry and a component with no gate objecting. Propose a checker that flags any sheet reachable from a zone entry that is also imported from a TSX module, with `admin/components/design-kit.css` as the sanctioned exception since it is route-local and deliberately absent from its entry. Do not build it. _Requirements: 4.1, 4.2_
- [ ] 4.3 Record the rejected hypotheses so they are not re-investigated. A containing block breaking `position: fixed` — no `transform`, `contain`, `will-change`, `perspective`, or `backdrop-filter` on any `.side-panel--dock` ancestor. Renamed dockview internals — all targeted class names exist in the installed 7.0.4 stylesheet, `dv-tab` 687 occurrences and `dv-floating-overlay-host` 2. Floating groups disabled by config — `disableFloatingGroups={false}` with `floatingGroupBounds` at 48px minimums.

## Notes

### Why this is two files and not one

`verify-focss-structure.mjs` pins each zone entry's import list exactly. That is a good design — it stops entries drifting silently — but it means an entry's imports cannot be changed unilaterally. The checker and the entry are one contract expressed in two files, so they move together. A task plan that changed only the CSS would fail the gate and look like the fix was wrong when it was merely incomplete.

### Why `dock.css` is not edited

Its rules target real class names in the installed `dockview-react@7.0.4` and were written against a stated ordering intent. The sheet is already heavy with `!important`, and the standard temptation when overrides do not apply is to add more. That would convert an ordering bug into a specificity arms race and leave the duplicate import in place, so the next person sees a working dock with no idea why the sheet needs the force.

### What this spec does not claim

That it fixes the reported symptom. It fixes a provable ordering defect that is a strong candidate cause, given that clicks fail at desktop width with no console error, which rules out the target-size findings in the CSS audit. Whether "doesn't move" and "icons not arranged" both resolve is settled by task 3.4 in a browser. Some of the icon arrangement may well be `DockFloatHeaderActions` layout rather than cascade, and that is spec 2's job. Sequencing it that way is deliberate: restyling a tab bar while the cascade is inverted would produce rules that are wrong once the cascade is fixed.

### Sequence

This is spec 1 of three. Spec 2 `planner-dock-layout` covers tab and icon arrangement and float behaviour, scoped by whatever task 3.4 records as surviving. Spec 3 covers Planner control sizing and tokens from the CSS audit, coordinating with `site-page-css-remediation` tasks 1.5 and 1.6, which already own the Planner fork sheets. Spec 3 is last because it is the only one of the three that is not a bug.
