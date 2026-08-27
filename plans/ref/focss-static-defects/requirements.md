# Requirements Document

## Introduction

Close the defects found by a static audit of all 172 repository CSS files that the route/viewport audit cannot detect. A rendered-DOM audit measures what a page looks like at a viewport; it cannot see an undefined custom property, an unreachable stylesheet, a duplicated selector owner, or a stylesheet tree that no entry imports. This spec covers only that class of finding.

Evidence source: static analysis of every `.css` file outside `node_modules`, `.next`, and `.tmp` — 148 under `site/focss`, 24 outside it. Evidence is the file content itself at the line references given in `design.md`. No browser measurement was performed and none is claimed.

Two findings from that audit were verified as false positives and are recorded here so they are not re-investigated:

- There is no duplicate `@import "tailwindcss"` in `site/focss/site/components/chrome/index.css`. The apparent match is text inside that file's leading comment block.
- The Planner/Studio entry divergence is not drift. `scripts/AsNeeded/verify-focss-structure.mjs` lines 50-125 pins both shapes deliberately: Planner takes `tailwindcss` plus palette, Studio takes the full product base.

## Glossary

| Term | Meaning |
|---|---|
| **Zone** | A FOCSS ownership boundary with its own entry sheet: `base`, `site`, `admin`, `planner`, `studio`. Zones must never cross-import. |
| **Entry** | A root stylesheet that a layout imports. The four zone entries are `site/entry.css`, `admin/entry.css`, `planner/entry.css`, `studio/entry.css`; `base/root.css` is a pinned fifth entry. |
| **Reachable** | A sheet is reachable if a transitive chain of relative `@import` statements connects it to a zone entry. Unreachable sheets are dead unless imported directly by a TSX module. |
| **Orphan** | An unreachable sheet with no route-local TSX import. |
| **Invalid at computed-value time** | A CSS declaration whose `var()` reference cannot resolve. The declaration is discarded and the property falls back to its initial value, silently. |
| **Owner** | The single canonical sheet permitted to declare a given selector namespace. |
| **`H` finding** | Audit code for an interactive target measuring below 40px. |
| **`T` finding** | Audit code for a text sample below 11px. |
| **`AC` disposition** | Audit-contract outcome: the finding is intended behaviour and the audit rule is updated instead of the CSS. |

## Requirements

### Requirement 1: Undefined tap-target token must not silently disable a floor

**User Story:** As a mobile user of the contact form, I want the consent link to be a reliable 44px tap target, so that I can accept consent without mis-taps.

`site/focss/site/components/shared/mobile-tap-targets.css` declares `min-height: var(--touch-target-min)` with no fallback. That custom property is declared nowhere in the repository, so the declaration is invalid at computed-value time and `min-height` resolves to `auto`. Because the owning selector `a.contact-form-consent__link` has specificity 0,1,1 it also outranks the working `:where(...)` rule immediately above, so the broken declaration removes a floor that would otherwise apply.

#### Acceptance Criteria

- **1.1** WHEN the mobile consent link is styled THEN the sheet SHALL source its minimum height from the existing `--control-height-sm` token, matching every sibling rule in the same file.
- **1.2** The implementation SHALL NOT introduce a new token to express the existing 44px floor concept.
- **1.3** WHEN the repair is made THEN `display: inline-flex`, `align-items: center`, and `padding-block: 0.625rem` SHALL be preserved unchanged.

### Requirement 2: Site zone must not style Admin primitives

**User Story:** As a maintainer, I want zone boundaries to hold, so that a rule's location tells me truthfully which surface it affects.

The same file contains a `:where(.admin-btn--md)` rule. `.admin-btn--md` is an Admin-zone primitive owned by `site/focss/admin/base/buttons.css`. This breaks the FOCSS zone boundary, and it is also inert: Admin routes load `admin/entry.css`, which never imports the site components barrel, so the rule cannot ever apply.

#### Acceptance Criteria

- **2.1** The `:where(.admin-btn--md)` rule SHALL be removed from the site zone.
- **2.2** The implementation SHALL NOT change the underlying Admin button size; `admin/base/buttons.css` belongs to another spec. See Out of scope.
- **2.3** WHEN the rule is removed THEN the reasoning SHALL first be re-confirmed by tracing the import path from `site/app/admin/layout.tsx`.

### Requirement 3: Unreachable duplicate stylesheet must be removed

**User Story:** As a maintainer, I want dead stylesheets gone, so that searching for a selector's owner returns one live answer.

`site/focss/site/components/chrome/portal-svg-catalog.css` (6,061 bytes) is unreachable from all four zone entries and is imported by no TypeScript or TSX module. Its entire rule set already exists in `site/focss/site/components/chrome/shell-portal.css`. The only reference anywhere is a stale path in `scripts/AsNeeded/finalize-surface-classify.mjs` that omits the `focss/site/` path segment.

#### Acceptance Criteria

- **3.1** WHEN the orphan file is removed THEN no rendered rule SHALL change.
- **3.2** The stale script reference SHALL be removed in the same change.
- **3.3** The two legitimate unreachable files SHALL be left untouched: `admin/components/design-kit.css`, a deliberate route-local import in `site/app/admin/design-kit/page.tsx`, and `base/root.css`, a pinned entry asserted by `verify-focss-structure.mjs`.
- **3.4** IF any declaration exists only in the orphan THEN it SHALL be merged into `shell-portal.css` before deletion, and the merge SHALL be recorded.

### Requirement 4: One canonical owner per selector namespace

**User Story:** As a developer editing the planner hero demo, I want my edit to take effect, so that I am not debugging a sheet that is silently overridden.

`site/focss/site/components/homepage/planner-hero-demo.css` and `site/focss/site/components/planner/planner-landing-shared.css` both define `.planner-hero-demo__canvas` and roughly sixteen identical `.pl-*` descendants with identical values. Both reach the same site entry through `components/index.css`, so they collide globally and the later import wins. This violates the one-canonical-path-per-concern rule and means edits to the losing sheet have no visible effect.

#### Acceptance Criteria

- **4.1** Exactly one sheet SHALL own the `.planner-hero-demo__canvas` namespace afterwards.
- **4.2** Rendered output SHALL NOT change.
- **4.3** IF a shared declaration differs in value between the two sheets THEN it SHALL be merged into the canonical owner before the duplicate is deleted.
- **4.4** IF the homepage sheet contains rules outside the `.planner-hero-demo__canvas` namespace THEN those rules SHALL be preserved and the file SHALL NOT be deleted.

### Requirement 5: Document-wide resets must not live in a component sheet

**User Story:** As a user with reduced-motion enabled, I want animation suppression to be owned by the design system base, so that it applies consistently rather than depending on which component sheet happens to load.

`site/focss/site/components/contact/home-contact-teaser.css` contains a `*, ::before, ::after` reduced-motion block with seven `!important` declarations, plus a `.home-reveal` override already present in `homepage/home-base.css`. Because `components/index.css` pulls the teaser sheet into the site entry, a single component's stylesheet currently governs animation behaviour for every element on every marketing page. `site/focss/base/animations.css` contains no reduced-motion block and is the correct owner.

#### Acceptance Criteria

- **5.1** The universal reset SHALL move to `base/animations.css` with reduced-motion behaviour preserved, including all seven `!important` declarations.
- **5.2** The duplicate `.home-reveal` override SHALL collapse to one declaration site, owned by `homepage/home-base.css`.
- **5.3** The widened coverage to Admin and Studio that results from moving into the base zone SHALL be recorded explicitly as intended, not left to be discovered.
- **5.4** WHEN both rules are removed from the teaser sheet THEN the emptied `@media` wrapper SHALL also be removed.
- **5.5** The implementation SHALL NOT add a base import to the Planner zone to extend the reset there; the Planner entry shape is pinned.

### Requirement 6: Ungoverned catalog CSS must be resolved by decision, not by patching

**User Story:** As a maintainer, I want to know whether nineteen ungoverned stylesheets are live before anyone edits them, so that effort is not spent tokenising dead code.

Nineteen files under `site/lib/catalog/` sit outside `site/focss`, so no zone rule and no FOCSS verify script covers them. They are the only place in the application with raw hex colour literals (`#65a30d`, `#3b82f6`, `#78350f`, `#d4af37`, `#b45309`, `#4d7c0f`, `#3f6212`, `#aa8620`), sitting beside correctly tokenised `var(--color-bronze-800)` references. `--block-primitive-blue-500` and `--block-primitive-lime-600` are each declared twice with identical values in both `tokens.css` and `tokens-primitives.css`. No TypeScript, TSX, or CSS file imports the `styles/index.css` barrel, and seven `tokens-*.css` files plus `blocks.css` are not even in that barrel. Their semantic maps are reimplemented in TypeScript at `site/lib/theme/plannerThemePacks.ts`, which is the live path via the theme API.

#### Acceptance Criteria

- **6.1** The runtime owner of the `--block-*` custom properties SHALL be established and recorded with file and line evidence.
- **6.2** The spec SHALL stop at a written delete-or-wire recommendation and an explicit user decision. Deleting nineteen files is destructive with a real blast radius and SHALL NOT proceed autonomously.
- **6.3** No file under `site/lib/catalog/` SHALL be edited or deleted by this spec. Tokenising the hex values is forbidden until the decision is made, because tokenising a dead file is wasted work that also makes the duplication harder to spot later.

## Out of scope

### Admin button size ramp

`site/focss/admin/base/buttons.css` defines `--sm` at 36px, `--xs` at 30px, `--icon-sm` at 36px, and `--icon-xs` at 30px, all below the 40px audit threshold, with `--md` and `--icon` borderline at exactly 40px. This single ramp is the systemic root cause of the `H` column for all nineteen Admin routes in `site-page-css-remediation`.

Excluded here because that file is already owned by task 1.4 of `site-page-css-remediation`. This spec must not edit it. The finding is handed to that spec as evidence that its rows 4-22 are one shared-primitive change rather than nineteen per-route changes.

### Planner and Studio control density

Both fork trees are saturated with sub-40px interactive targets: `.layer-item__icon-btn` at 22px, `.stroke-swatch` at 20px, `.color-palette__picker` at 28px, `.btn--icon` at 32px, `.icon-btn` at 36px, range thumbs at 14px, chips at 26px, status bars at 28px. Neither zone raises these at narrow viewports.

Excluded for two reasons. Ownership is already taken: `planner-remediation` owns `planner/workspace-shell.css` and `controls.css`, and `site-page-css-remediation` tasks 1.5 and 1.6 own both fork trees. More importantly this is a product decision, not a defect — whether a CAD-style workspace supports a 390px viewport at all determines whether the correct disposition is `CSS` or `AC`. It must not be settled by a mechanical edit.

### Sub-11px type

Confirmed at `planner/workspace.css` lines 297, 456, 658, 720, `planner/chrome.css` line 153, and `products/catalog-cards.css` lines 161 and 209. All are inside files owned by other specs. The 9px and 0.46875rem values in the hero-demo sheets are SVG `fill` text inside a decorative canvas and are recommended as exempt rather than remediated.

### Everything requiring a browser

No task in this spec may assert a computed box, a rendered font size, or a screenshot comparison. Those belong to the five-viewport audit in `site-page-css-remediation` Wave 4.

## Ownership and conflict rules

- Requirements 1 and 2 both edit `site/focss/site/components/shared/mobile-tap-targets.css`, which `site-page-css-remediation` task 1.2 also names. This spec claims only the two specific rules described and must leave every other rule in the file untouched. Requirement 1 in particular should land before task 1.2 begins, because reviewing tap targets in a file containing a silently dead floor produces a false reading.
- No task may edit `site/focss/admin/**`, `site/focss/planner/**`, or `site/focss/studio/**`.
- No task may create `core/`, `core/locked/`, `features/product/`, a root-level `focss/`, or a duplicate token sheet.
- No task may add a raw palette value or an inline colour.
- Every change must be independently revertible.

## Verification rules

- The agent must not run tests, gates, browser suites, or repository commands while planning or implementing this spec.
- `pnpm run verify:focss`, `pnpm run lint:ui:strict`, and `pnpm run check:style-tokens` are user-invoked and listed as the final wave of `tasks.md`.
- Because no task touches Planner or Studio files, `pnpm run scan:boundaries` is not required by this spec unless the Requirement 6 decision later moves files.

## Acceptance criteria

1. `--touch-target-min` has no remaining consumer, and the mobile consent link resolves to the same 44px floor as its sibling rules.
2. No selector owned by the Admin zone is styled from within the site zone.
3. `portal-svg-catalog.css` no longer exists, no rendered rule changed, and no stale path reference to it remains.
4. `.planner-hero-demo__canvas` and its `.pl-*` descendants have exactly one owning sheet.
5. The document-wide reduced-motion reset lives in `base/animations.css`, `.home-reveal` has one declaration site, and no empty `@media` wrapper remains.
6. The runtime owner of block material tokens is recorded in writing, with a delete-or-wire recommendation and an explicit user decision captured. No hex value under `site/lib/catalog/` is edited before that decision.
7. The Admin ramp evidence is recorded against `site-page-css-remediation` task 1.4 without this spec editing the file.
