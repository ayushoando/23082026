# Requirements: FOCSS static-defects remediation

## Plan identity and proof boundary

This is the canonical, plan-owned record for the static FOCSS defects identified in the 2026-08-26 audit. Its evidence is colocated in this directory:

- [Static audit baseline](./css-static-audit-report.md)
- [Design](./design.md)
- [Execution tasks](./tasks.md)
- [Decision and handoff record](./handoffs.md)

All acceptance in this document is source-level. It does not assert a computed style, rendered size, route result, or screenshot. User-run static checks and any rendered audit are separate evidence.

### Reconciled implementation state — 2026-08-27

| Requirement | Current source state | Plan state |
|---|---|---|
| R1 / R2 | The undefined token consumer and Site-zone Admin selector remain in `mobile-tap-targets.css`. | Pending implementation. |
| R3 | The portal stylesheet deletion and stale script-reference removal are present in the working tree. | Implemented in source; user verification pending. |
| R4 | The homepage canvas fragment is absent and the shared sheet retains its canonical fragment. | Implemented in source; user verification pending. |
| R5 | The universal reduced-motion reset is in Base and component copies are removed. | Implemented in source; user verification pending. |
| R6 | Static evidence does not establish a runtime owner for catalog CSS. | Open decision gate; no catalog mutation is permitted. |

“Implemented in source” is not a claim that a user-run check, browser audit, or release check passed.

## Requirement 1: Restore the consent-link control-height floor

**User story:** As a mobile user completing the contact form, I need the consent link to retain the established minimum control height.

`site/focss/site/components/shared/mobile-tap-targets.css` contains `min-height: var(--touch-target-min)` without a fallback. The custom property has no declaration. The winning `a.contact-form-consent__link` selector outranks the preceding zero-specificity `:where(...)` rule, so its invalid declaration suppresses the otherwise applicable floor.

### Acceptance criteria

1. The consent-link `min-height` shall use `var(--control-height-sm)`.
2. No `--touch-target-min` declaration shall be introduced; `--control-height-sm` is the existing token for this concept.
3. `display: inline-flex`, `align-items: center`, and `padding-block: 0.625rem` shall remain unchanged.
4. Immediately before editing, source preflight shall confirm that `--touch-target-min` remains undeclared and `--control-height-sm` remains `2.75rem`.
5. If either precondition changed, the task shall be re-planned instead of forced. Rollback restores only the original `min-height` declaration.

## Requirement 2: Remove the inert Admin selector from the Site zone

**User story:** As a maintainer, I need a selector's FOCSS location to reflect its owning surface.

The same Site-zone sheet contains `:where(.admin-btn--md)`. Admin routes load `@focss/admin/entry.css`, which does not load the Site components barrel. The rule is both a zone-boundary violation and unreachable from the Admin surface it names.

### Acceptance criteria

1. The `:where(.admin-btn--md)` rule shall be removed from the Site-zone sheet.
2. The Admin button size ramp shall not change in this plan.
3. Before removal, the Admin layout import path and absence of Site-components import shall be re-confirmed from source.
4. The Site-zone foreign-selector inventory shall be recorded. Any additional finding is evidence for the owning plan, not a change in this one.
5. If the import-path premise is disproven, rollback restores the exact rule and the task is re-planned.

## Requirement 3: Accept the portal stylesheet removal only from static equivalence

**User story:** As a maintainer, I need a selector search to identify one live owner, not a duplicate orphan.

The baseline found `portal-svg-catalog.css` unreachable from FOCSS zone entries and duplicated in `shell-portal.css`. The working tree already removes that file and the obsolete classification-list entry. Acceptance remains conditional on documented static equivalence; it is not a rendered-output claim.

### Acceptance criteria

1. The portal selector/declaration block and its 640px, 768px, 1100px, and 390px media rules shall be compared against `shell-portal.css`.
2. An orphan-only declaration, if found, shall be merged into `shell-portal.css` before deletion and recorded in `tasks.md`.
3. `site/focss/site/components/chrome/portal-svg-catalog.css` shall remain absent after accepted implementation.
4. The obsolete portal classification-list entry shall remain absent from `scripts/AsNeeded/finalize-surface-classify.mjs`.
5. `admin/components/design-kit.css` and `base/root.css` shall remain untouched as documented reachability exceptions.
6. Rollback restores the stylesheet and stale classification-list entry together if static equivalence is not established.

## Requirement 4: Give the duplicated hero-demo canvas fragment one canonical owner

**User story:** As a developer maintaining the hero diagram, I need the canvas fragment to have one owner so edits are not silently overridden.

This requirement is deliberately narrow. It covers `.planner-hero-demo__canvas`, its `svg`, and the duplicated `.pl-*` fragment only. It does not claim that every `.planner-hero-demo` selector, surrounding chrome rule, or keyframe has one owner. Any remaining collisions need separately scoped follow-up work.

### Acceptance criteria

1. `planner-landing-shared.css` shall be the sole owner of the scoped canvas fragment.
2. The homepage sheet shall retain all rules outside the fragment, including parent/chrome rules and keyframes.
3. Each scoped declaration shall be compared before acceptance; a differing homepage value shall be preserved in the shared owner and recorded.
4. Acceptance is static cascade equivalence for the scoped fragment, not browser proof.
5. Decorative SVG text values (`0.46875rem`, `0.5625rem`, and `9px`) shall remain unchanged.
6. Rollback restores only the removed canvas fragment if a scoped value was not preserved.

## Requirement 5: Own the universal reduced-motion reset in Base

**User story:** As a user with reduced motion enabled, I need the universal reset to be owned by the shared Base layer rather than a component sheet.

The original universal reduced-motion block was in `home-contact-teaser.css`; `.home-reveal` was also duplicated there and in `homepage/home-base.css`. The working tree moves the universal block to `base/animations.css`, keeps the homepage rule as the sole `.home-reveal` owner, and removes the empty component-level media wrapper.

### Acceptance criteria

1. The seven-declaration universal reduced-motion block shall occur exactly once, in `site/focss/base/animations.css`.
2. `.home-reveal` shall have one reduced-motion declaration site in `site/focss/site/components/homepage/home-base.css`.
3. The universal block, duplicate `.home-reveal` rule, and empty media wrapper shall be absent from `home-contact-teaser.css`.
4. The plan shall record the intentional reachability expansion: Site, Admin, and Studio receive the Base reset; Planner does not import the Base index and remains unchanged.
5. No Planner import shall be added by this plan.
6. Rollback is atomic: remove the Base block and restore the original teaser media wrapper with its two rules.

## Requirement 6: Resolve catalog-CSS ownership through evidence and user decision

**User story:** As a maintainer, I need a defensible runtime-ownership conclusion before anyone modifies potentially dead catalog assets.

The scope is the eighteen sheets below `site/lib/catalog/styles/` and `site/lib/catalog/blocks.css`. They sit outside FOCSS zone verification. Duplicate primitive declarations and raw catalog-CSS literals are known, but runtime loading is not proven.

### Evidence constraints

- `styles/index.css` directly imports `theme.css`, `theme-premium-light.css`, and component sheets.
- `theme-premium-light.css` transitively imports `tokens-wood.css`, `tokens-metal.css`, `tokens-fabric.css`, `tokens-lighting.css`, and `tokens-primitives.css`.
- No static application-source import of the barrel or `blocks.css` was found. That is not proof a runtime loader does not exist.
- Raw hex values also exist in `site/lib/theme/plannerThemePacks.ts`; catalog CSS is not the only application location containing them.
- `ThemeProvider` and the active-theme API filter the catalog geometry keys enumerated in `catalogTokenKeys.ts`; that filter does not prove every material `--block-*` key is excluded.
- The TypeScript material maps mirror CSS concepts, but current evidence does not prove they are the only runtime owner.

### Acceptance criteria

1. The decision record shall distinguish direct imports, transitive imports, static-import absence, and unproven runtime behavior.
2. The record shall cite `styles/index.css`, the theme sheets, `plannerThemePacks.ts`, `catalogTokenKeys.ts`, `ThemeProvider`, and the active-theme API with source evidence.
3. The plan shall end at a written recommendation and explicit user decision in [handoffs.md](./handoffs.md).
4. No file below `site/lib/catalog/` shall be edited, deleted, moved, wired, or tokenised by this plan.
5. A delete, barrel-wiring, or tokenisation change requires a separately approved follow-up plan after the decision.

## Scope and verification rules

- The plan may change only the named R1-R5 files and its own plan files. It shall not edit `site/focss/admin/**`, `site/focss/planner/**`, `site/focss/studio/**`, `site/lib/catalog/**`, or another plan directory.
- Cross-plan facts are preserved in the local [handoffs.md](./handoffs.md); this plan does not edit another plan's tasks.
- The Admin ramp, fork control density, and image-wrapper duplication are handoffs, not implementation tasks here.
- No raw color, inline color, duplicate token concept, foreign-zone import, `core/`, `core/locked/`, `features/product/`, or root-level `focss/` directory may be introduced.
- Test-like commands require current-session, explicit user authorization and a hook state that permits execution. Without both, agents provide the commands for the user to run. The authorized Wave 5 results and rerun requirement are recorded in [tasks.md](./tasks.md).

## Implementation reconciliation — 2026-08-27

This section supersedes any earlier “pending” state that conflicts with the live scoped implementation.

| Requirement | Reconciled source state | Acceptance state |
|---|---|---|
| R1 | `a.contact-form-consent__link` now uses `min-height: var(--control-height-sm)`; its display, alignment, and padding remain unchanged. | Implemented in source; post-edit user-owned validation remains pending. |
| R2 | `:where(.admin-btn--md)` remains. Shared `site/components/ui/Button.tsx` emits this class, so the prior no-Site-markup premise is false. | Blocked; deletion requires a re-planned ownership decision. |
| R3–R5 | Current-tree source states remain as previously reconciled. | Implemented in source; user validation remains pending. |
| R6 | Catalog runtime ownership remains unproved. | Blocked awaiting explicit user decision; catalog stays read-only. |

### Non-fork TSX audit reconciliation

The plan audited production non-fork TSX only; Planner, Studio, `ooplanner`, and `oostudio` implementation paths remain excluded. Three fractional-grid rows were classification errors and are excluded. Of the resulting 54 actionable audit rows, 21 source occurrences had exact existing semantic utility owners and were replaced without changing their values or behavior. The remaining 33 audit rows are retained in `results/tsx-hardcoding-non-fork-remaining-actionable.csv`; they require a new semantic owner or an explicit follow-up decision and are not approximated.
