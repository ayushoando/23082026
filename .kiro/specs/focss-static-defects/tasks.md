# Implementation Plan: FOCSS static defect remediation

## Overview

Six static CSS defects found across all 172 repository CSS files. This plan does not execute tests, browser audits, gates, or repository commands. Each task owns a named file and is independently revertible.

Waves 0 through 3 are agent-implementable. Wave 4 is read-only investigation ending in a user decision. Wave 5 is user-invoked verification. Wave 6 hands excluded findings to the specs that own those files.

### Execution contract

- Edit only the files named in the ownership table below.
- Never edit `site/focss/admin/**`, `site/focss/planner/**`, or `site/focss/studio/**`. Those trees are owned by `site-page-css-remediation` tasks 1.4, 1.5, 1.6 and by `planner-remediation`.
- In `mobile-tap-targets.css`, change only the two rules named in tasks 1.1 and 1.2. Leave the other thirty rules untouched; `site-page-css-remediation` task 1.2 owns them.
- Do not create `core/`, `core/locked/`, `features/product/`, a root-level `focss/`, or a duplicate token sheet.
- Do not add a raw palette value, an inline colour, or a raw Tailwind utility to product TSX.
- Do not assert a computed box, rendered font size, or screenshot result. This spec has no browser evidence and must not imply any.
- Do not delete or edit anything under `site/lib/catalog/`. Wave 4 is read-only by design.
- Tests and gates in Wave 5 are user-invoked. The agent must not run them.

### Ownership table

| Task | File | Scope of change |
|---|---|---|
| 1.1 | `site/focss/site/components/shared/mobile-tap-targets.css` | lines 134-139 only |
| 1.2 | `site/focss/site/components/shared/mobile-tap-targets.css` | lines 141-143 only |
| 1.3 | `site/focss/site/**` | read-only search |
| 2.1 | `site/focss/site/components/chrome/shell-portal.css` | read-only diff, merge only if divergent |
| 2.2 | `site/focss/site/components/chrome/portal-svg-catalog.css` | delete file |
| 2.3 | `scripts/AsNeeded/finalize-surface-classify.mjs` | line 53 only |
| 2.4 | `site/focss/site/components/planner/planner-landing-shared.css` | read-only diff, merge only if divergent |
| 2.5 | `site/focss/site/components/homepage/planner-hero-demo.css` | remove duplicated namespace |
| 3.1 | `site/focss/base/animations.css` | append reduced-motion block |
| 3.1, 3.3 | `site/focss/site/components/contact/home-contact-teaser.css` | lines 389-400 only |
| 3.3 | `site/focss/site/components/homepage/home-base.css` | read-only confirmation |
| 4.1-4.3 | `site/lib/catalog/**`, `site/lib/theme/**` | read-only |
| 6.1 | `.kiro/specs/site-page-css-remediation/tasks.md` | append evidence note |

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 0,
      "name": "Freeze evidence",
      "tasks": ["0.1", "0.2", "0.3", "0.4"],
      "dependsOn": [],
      "parallel": true,
      "agentExecutable": true
    },
    {
      "wave": 1,
      "name": "Tap-target token and zone boundary",
      "tasks": ["1.1", "1.2", "1.3"],
      "dependsOn": ["0.1", "0.2"],
      "parallel": false,
      "agentExecutable": true,
      "note": "Sequential: 1.1 and 1.2 edit the same file."
    },
    {
      "wave": 2,
      "name": "Orphan sheet and duplicate namespace",
      "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5"],
      "dependsOn": ["0.3"],
      "parallel": false,
      "agentExecutable": true,
      "note": "Two chains: 2.1 to 2.2 to 2.3, and 2.4 to 2.5. Diff before delete in both."
    },
    {
      "wave": 3,
      "name": "Relocate the document-wide reset",
      "tasks": ["3.1", "3.2", "3.3"],
      "dependsOn": [],
      "parallel": false,
      "agentExecutable": true,
      "note": "3.3 must follow 3.1; it removes the wrapper 3.1 empties."
    },
    {
      "wave": 4,
      "name": "Ungoverned catalog CSS: investigate and decide",
      "tasks": ["4.1", "4.2", "4.3"],
      "dependsOn": [],
      "parallel": false,
      "agentExecutable": true,
      "readOnly": true,
      "terminatesAt": "user-decision-gate",
      "note": "No file under site/lib/catalog may be edited or deleted."
    },
    {
      "wave": 5,
      "name": "User-invoked repository checks",
      "tasks": ["5.1", "5.2", "5.3", "5.4"],
      "dependsOn": ["1.1", "1.2", "1.3", "2.2", "2.3", "2.5", "3.1", "3.3"],
      "parallel": true,
      "agentExecutable": false,
      "note": "User-invoked only. The agent must not run these."
    },
    {
      "wave": 6,
      "name": "Handoff of excluded findings",
      "tasks": ["6.1", "6.2", "6.3"],
      "dependsOn": ["0.4"],
      "parallel": true,
      "agentExecutable": true
    }
  ]
}
```

Critical constraints encoded above:

- 1.1 must precede 1.2 because both edit `mobile-tap-targets.css`; running them out of order risks a conflicting patch.
- 2.1 must precede 2.2. Deleting before diffing risks silently dropping a rule.
- 2.4 must precede 2.5 for the same reason.
- 3.3 must follow 3.1, because 3.1 empties the `@media` wrapper that 3.3 removes.
- 4.3 terminates at a user decision and must not proceed to deletion autonomously.
- Requirement 1 should land before `site-page-css-remediation` task 1.2 begins, because reviewing tap targets in a file containing a silently dead floor produces a false reading.

## Tasks

### Wave 0 — Freeze evidence

- [ ] 0.1 Confirm `--touch-target-min` is still undefined. Search the whole repository, not just `site/focss`, for any declaration of `--touch-target-min`. Record the result. If a declaration now exists, task 1.1 changes from a repair to a no-op and must be re-planned rather than forced. _Requirements: 1.1_
- [ ] 0.2 Confirm `--control-height-sm` is still the 44px floor. Verify `site/focss/base/tokens/layout.css` line 23 still declares `2.75rem`, and that the surrounding ramp (`xs` 2.25rem, `md` 3.125rem, `lg` 3.625rem) is unchanged. Task 1.1 depends on this value being the intended floor. _Requirements: 1.1_
- [ ] 0.3 Re-verify the orphan set. Recompute reachability from the four zone entries by resolving relative `@import` transitively. Expect exactly three unreachable files: `admin/components/design-kit.css`, `base/root.css`, and `chrome/portal-svg-catalog.css`. Confirm the first is still imported by `site/app/admin/design-kit/page.tsx` and the second is still asserted as an entry by `verify-focss-structure.mjs`. Only the third is in scope. _Requirements: 3.1, 3.3_
- [ ] 0.4 Record the false positives so they are not re-investigated. `chrome/index.css` has no duplicate Tailwind import; the apparent match is comment text. The Planner/Studio entry divergence is pinned deliberately in `verify-focss-structure.mjs` lines 50-125 and is not drift.

### Wave 1 — Tap-target token and zone boundary

- [ ] 1.1 Repair the undefined token in `mobile-tap-targets.css` lines 134-139. Change `min-height: var(--touch-target-min)` on `a.contact-form-consent__link` to `var(--control-height-sm)`, matching the thirty sibling rules in the same file. Do not introduce a new `--touch-target-min` token; that would create a second name for an existing concept. Leave `display: inline-flex`, `align-items: center`, and `padding-block: 0.625rem` unchanged — the padding difference from the sibling rules' `0.25rem` is intentional and not part of this defect. Record in the task notes that this rule (specificity 0,1,1) currently defeats the `:where(.contact-form-intro a, .contact-form-consent__link)` rule immediately above it (specificity 0,0,0), so the fix restores a floor rather than adding a redundant one. _Requirements: 1.1, 1.2, 1.3_
- [ ] 1.2 Delete the cross-zone `:where(.admin-btn--md)` rule at `mobile-tap-targets.css` lines 141-143. Before deleting, confirm the reasoning holds: `site/app/admin/layout.tsx` imports `@focss/admin/entry.css`, and that entry does not import `site/focss/site/components/index.css`, so this rule cannot reach any Admin page. Confirm also that `.admin-btn--md` appears in no site-zone markup. Do not adjust the Admin size to compensate — `admin/base/buttons.css` belongs to `site-page-css-remediation` task 1.4. _Requirements: 2.1, 2.2, 2.3_
- [ ] 1.3 Confirm no other Admin, Planner, or Studio selector is styled from the site zone. Search `site/focss/site/**` for `.admin-`, `.ooplanner-`, and `.oostudio-` prefixed selectors. Record findings. Do not fix anything found beyond `.admin-btn--md` in this spec; add it to the notes for the owning spec instead. _Requirements: 2.1_

### Wave 2 — Orphan sheet and duplicate namespace

- [ ] 2.1 Diff `portal-svg-catalog.css` against the duplicated block in `shell-portal.css`, which starts near line 252 and runs to line 517, before deleting. Compare selector by selector and declaration by declaration, including the 640px, 768px, 1100px, and 390px media queries. Do not assume the duplication is complete. If any declaration exists only in the orphan, merge it into `shell-portal.css` first and record the merge. _Requirements: 3.1, 3.4_
- [ ] 2.2 Delete `site/focss/site/components/chrome/portal-svg-catalog.css`. Only after 2.1 confirms full duplication or completes the merge. The file is unreachable from all four zone entries and imported by no TSX module, so no `@import` needs removing anywhere. _Requirements: 3.1, 3.3_
- [ ] 2.3 Remove the stale reference at `scripts/AsNeeded/finalize-surface-classify.mjs` line 53. The listed path `site/components/chrome/portal-svg-catalog.css` omits the `focss/site/` segment and matches nothing today. Remove the entry rather than repairing the path, since the file is being deleted. Leave the neighbouring entries in `KEEP_GROWTH_ONLY_LIVE` alone. _Requirements: 3.2_
- [ ] 2.4 Diff the `.planner-hero-demo__canvas` namespace across both owning sheets. Compare `homepage/planner-hero-demo.css` against `planner/planner-landing-shared.css` for `.planner-hero-demo__canvas` and every `.pl-*` descendant. Expect the homepage sheet to be a strict subset and the shared sheet to additionally own `.pl-desk-divider`, `.pl-soft-shape`, `.pl-dim-badge--accent`, `.pl-dim-text--accent`, and `.pl-handle`. Record any declaration whose value genuinely differs. _Requirements: 4.3_
- [ ] 2.5 Remove the duplicated namespace from `homepage/planner-hero-demo.css`. Merge into `planner-landing-shared.css` first any value that 2.4 found genuinely different, then delete the duplicated block so the shared sheet is sole owner. Note in the task record why this preserves rendering: `components/index.css` imports `homepage/index.css` before `planner/index.css`, so the shared sheet already wins every colliding declaration today. Keep any rule outside the `.planner-hero-demo__canvas` namespace; delete the file only if nothing remains. Carry the SVG text sizes (`0.46875rem`, `0.5625rem`, `9px`) over unchanged and record them as recommended-exempt decorative canvas text. _Requirements: 4.1, 4.2, 4.4_

### Wave 3 — Relocate the document-wide reset

- [ ] 3.1 Move the `*, ::before, ::after` reduced-motion block from `home-contact-teaser.css` to `base/animations.css`. In the teaser sheet the `@media (prefers-reduced-motion: reduce)` wrapper is line 389, `.home-reveal` is line 390, and the universal block is lines 391-399. Move all seven `!important` declarations unchanged; they are correct for a reset that must defeat component-level animation, and this task relocates scope rather than relitigating specificity. Remove the block from the teaser sheet in the same change so it exists in exactly one place. _Requirements: 5.1_
- [ ] 3.2 Record the widened blast radius in the task notes. `base/animations.css` is reached by `base/index.css`, which the site, admin, and studio entries all import, so the reset will newly apply to Admin and Studio pages. State this explicitly as an intended consequence rather than leaving it to be discovered. Note also that the Planner zone does not import `base/index.css` and so will not receive the reset; do not add an import to work around that, as its entry shape is pinned. _Requirements: 5.3, 5.5_
- [ ] 3.3 Drop the duplicate `.home-reveal` override from the teaser sheet and remove the emptied wrapper. Confirm first that `homepage/home-base.css` line 22 still carries the identical override inside its own `prefers-reduced-motion` block, and that it is the owner of `.home-reveal`. Then remove the teaser copy so one declaration site remains. Because `.home-reveal` and the universal block from task 3.1 are the only two rules inside the teaser's `@media (prefers-reduced-motion: reduce)` wrapper, delete the now-empty wrapper as well so the sheet ends after `.contact-teaser__status--error`. Do not edit `home-base.css`. _Requirements: 5.2, 5.4_

### Wave 4 — Ungoverned catalog CSS: investigate and decide

Read-only. No file under `site/lib/catalog/` may be edited or deleted in this wave.

- [ ] 4.1 Establish the runtime owner of block material tokens. Determine what actually puts `--block-*` custom properties into `:root`. Check whether any path loads `site/lib/catalog/styles/index.css` that a static import grep would miss, and trace how `plannerThemePacks.ts`, `catalogTokenKeys.ts`, `ThemeProvider`, and `/api/theme/active` interact. Record the answer with file and line evidence. _Requirements: 6.1_
- [ ] 4.2 Record the defect inventory without fixing it. Nineteen files outside `site/focss` and therefore outside every FOCSS verify script. Eight raw hex literals (`#65a30d`, `#3b82f6`, `#78350f`, `#d4af37`, `#b45309`, `#4d7c0f`, `#3f6212`, `#aa8620`) sitting beside correctly tokenised references. `--block-primitive-blue-500` and `--block-primitive-lime-600` declared twice with identical values across `tokens.css` and `tokens-primitives.css`. Nothing imports the `styles/index.css` barrel, and seven `tokens-*.css` files plus `blocks.css` are not even in it. _Requirements: 6.3_
- [ ] 4.3 Produce a delete-or-wire recommendation and stop for a user decision. If 4.1 shows the TypeScript maps are the only live source, recommend deleting the nineteen files and state the blast radius. If the CSS is live, recommend wiring the seven orphaned token sheets into the barrel and tokenising the hex in a follow-up spec. Deleting nineteen files is destructive and must not proceed without explicit user approval. Do not tokenise any hex value before the decision — tokenising a dead file is wasted work that also hides the duplication. _Requirements: 6.2, 6.3_

### Wave 5 — User-invoked repository checks

Deliberately user-run after implementation. The agent does not run these.

- [ ] 5.1 User runs `pnpm run verify:focss`. Covers the import graph and structure assertions affected by Waves 2 and 3.
- [ ] 5.2 User runs `pnpm run check:style-tokens`. Covers the token drift affected by task 1.1.
- [ ] 5.3 User runs `pnpm run lint:ui:strict`.
- [ ] 5.4 User confirms `pnpm run scan:boundaries` is not required. No Planner or Studio file is touched by this spec. If the Wave 4 decision later moves files, this changes.

### Wave 6 — Handoff of excluded findings

- [ ] 6.1 Record the Admin ramp evidence against `site-page-css-remediation` task 1.4. Append a note to that spec's tasks.md: `admin/base/buttons.css` lines 113-165 define `--sm` at 2.25rem (36px), `--xs` at 1.875rem (30px), `--icon-sm` at 36px, and `--icon-xs` at 30px, all below the 40px threshold, with `--md` and `--icon` borderline at exactly 40px. This one ramp is the systemic root cause of the `H` column for rows 4-22, meaning nineteen matrix rows are one shared-primitive change rather than nineteen per-route changes. Do not edit `admin/base/buttons.css` from this spec.
- [ ] 6.2 Record the fork control density findings as a product decision, not a defect. Both fork trees carry sub-40px targets: `.layer-item__icon-btn` 22px, `.stroke-swatch` 20px, `.color-palette__picker` 28px, `.btn--icon` 32px, `.icon-btn` 36px, range thumbs 14px, chips 26px, status bars 28px, with near-identical values across Planner and Studio. Whether a CAD-style workspace supports a 390px viewport determines whether the disposition is `CSS` or `AC`. Route to `site-page-css-remediation` tasks 1.5 and 1.6 and to `planner-remediation`, which already own those files. Do not settle it with a mechanical edit.
- [ ] 6.3 Record the deferred `span:has(> img)` consolidation. The Next `<Image>` wrapper override is copy-pasted across roughly ten sheets. Consolidating it would touch ten files owned by page-level rows in `site-page-css-remediation` for no behavioural gain, so it is deliberately not attempted here. Record it as a candidate for a later shared-primitive pass.

## Notes

### Why these six and not the whole audit

The full static audit produced eight findings. Two are excluded by ownership and one by product ambiguity:

- The Admin button ramp is the highest-leverage finding in the audit, but `admin/base/buttons.css` is already claimed by `site-page-css-remediation` task 1.4. Editing it from here would create a two-spec conflict on one file. Task 6.1 hands over the evidence instead.
- Planner and Studio control density is owned by `planner-remediation` and by `site-page-css-remediation` tasks 1.5 and 1.6, and it is a product decision rather than a defect. Task 6.2 routes it.
- The repeated `span:has(> img)` pattern is a real duplication but consolidating it buys no behaviour change while touching ten files owned elsewhere. Task 6.3 defers it.

### Conflict with `site-page-css-remediation` task 1.2

Tasks 1.1 and 1.2 both edit `mobile-tap-targets.css`, which that spec's task 1.2 also names. This is a deliberate narrow claim on two specific rules. The rest of the file stays with the other spec. Ordering matters: a reviewer auditing tap targets in this file before task 1.1 lands would measure a floor that silently does not apply and could conclude the sheet is correct.

### Claims this plan does not make

No task asserts a rendered box, computed font size, or screenshot comparison. Every finding here is a source-level property of the stylesheet graph. Whether these changes move a specific `H` or `T` finding at a specific viewport is confirmed only by the five-viewport audit in `site-page-css-remediation` Wave 4, which is user-invoked.

### Verified false positives

Recorded in task 0.4 so they are not re-opened. `chrome/index.css` does not double-import Tailwind — the apparent match is comment text describing the import order. The Planner/Studio entry divergence is pinned in `verify-focss-structure.mjs` lines 50-125 and is intentional, not drift.
