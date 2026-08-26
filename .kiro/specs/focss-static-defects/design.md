# Design: FOCSS static defect remediation

## Overview

Six independent defects, each with a single owning file and a mechanical fix. There is no shared refactor and no ordering dependency between them beyond the R1-before-1.2 note. Each task is written so it can be reverted alone.

The design deliberately avoids two temptations. It does not consolidate the repeated `> span:has(> img)` Next `<Image>` wrapper pattern that appears across roughly ten sheets, because that touches ten files owned by page-level rows in another spec for no behavioural gain. And it does not tokenise the catalog hex values, because those files are probably dead and tokenising dead code is worse than leaving it legible for the delete decision.

All evidence is static: file contents at the line references below. No browser measurement was performed and none is claimed. Nothing in this design may be used to assert a rendered box or computed font size.

## Architecture

The defects sit inside the FOCSS zone graph, which is the structure that determines whether a given sheet is live and which zone may own it.

Four zone entries are the roots. `site/entry.css`, `admin/entry.css`, and `studio/entry.css` each pull `../base/scan.css` (which imports Tailwind) plus `../base/index.css`. `planner/entry.css` deliberately does not: it imports `tailwindcss` directly plus only `../base/tokens/palette.css`. Both fork shapes are pinned in `scripts/AsNeeded/verify-focss-structure.mjs` lines 50-125 and are not drift.

Reachability computed transitively from those four roots yields exactly three unreachable files. Two are legitimate: `admin/components/design-kit.css` is a deliberate route-local import in `site/app/admin/design-kit/page.tsx` line 6, and `base/root.css` is a documented fifth entry asserted by `verify-focss-structure.mjs` lines 62 and 261. The third, `chrome/portal-svg-catalog.css`, is genuinely dead and is defect R3.

Two consequences of this graph drive the design:

- `base/animations.css` is reached by `base/index.css`, which the site, admin, and studio entries all import, but which the planner entry does not. Moving a reset into it therefore widens coverage to Admin and Studio while leaving Planner untouched. That is stated in R5 rather than discovered later.
- `admin/entry.css` never imports `site/focss/site/components/index.css`. Any rule targeting an Admin selector from inside the site components barrel is unreachable. That is the basis for R2.

Import order inside `site/focss/site/components/index.css` also matters: `homepage/index.css` is imported before `planner/index.css`, so on a selector collision between those two subtrees the planner subtree wins. That determines the safe direction of the R4 de-duplication.

## Components and Interfaces

"Components" here are the owning stylesheets and the selector contracts they expose.

| Defect | Owning file | Lines | Other spec claims this file |
|---|---|---|---|
| R1 undefined token | `site/focss/site/components/shared/mobile-tap-targets.css` | 134-139 | `site-page-css-remediation` 1.2 |
| R2 cross-zone leak | `site/focss/site/components/shared/mobile-tap-targets.css` | 141-143 | `site-page-css-remediation` 1.2 |
| R3 orphan sheet | `site/focss/site/components/chrome/portal-svg-catalog.css` | whole file | none |
| R3 live owner | `site/focss/site/components/chrome/shell-portal.css` | 252-517, read-only | none |
| R3 stale reference | `scripts/AsNeeded/finalize-surface-classify.mjs` | 53 | none |
| R4 duplicate owner | `site/focss/site/components/homepage/planner-hero-demo.css` | whole file | none |
| R4 canonical owner | `site/focss/site/components/planner/planner-landing-shared.css` | 182-310, read-only | none |
| R5 global reset | `site/focss/site/components/contact/home-contact-teaser.css` | 389-400 | none |
| R5 reset destination | `site/focss/base/animations.css` | append | none |
| R5 duplicate override | `site/focss/site/components/homepage/home-base.css` | 22, read-only | none |
| R6 investigation only | `site/lib/catalog/**` (19 files), `site/lib/theme/**` | read-only | none |

Files that must not be opened for editing by this spec: `site/focss/admin/**`, `site/focss/planner/**`, `site/focss/studio/**`.

Selector contracts affected:

- `a.contact-form-consent__link` and the `:where(.contact-form-intro a, .contact-form-consent__link)` group immediately above it, both in `mobile-tap-targets.css`.
- `:where(.admin-btn--md)`, whose real owner is `admin/base/buttons.css` line 113.
- `.portal-svg-catalog*` and `.portal-svg-detail*`, live in `shell-portal.css`.
- `.planner-hero-demo__canvas` and its `.pl-*` descendants, to be owned solely by `planner-landing-shared.css`.
- `.home-reveal`, owned by `homepage/home-base.css`.
- The universal `*, ::before, ::after` reduced-motion group, to be owned by `base/animations.css`.

## Data Models

The data model in a token system is the custom-property contract. Three properties matter here.

| Property | Declared in | Value | Status |
|---|---|---|---|
| `--control-height-sm` | `site/focss/base/tokens/layout.css` line 23 | `2.75rem` (44px) | live, correct floor |
| `--touch-target-min` | nowhere | undefined | consumed once; defect R1 |
| `--block-primitive-blue-500`, `--block-primitive-lime-600` | `site/lib/catalog/styles/tokens.css` and `tokens-primitives.css` | identical hex in both | duplicate declaration; R6 |

The surrounding control ramp in `layout.css` is `xs` 2.25rem, `sm` 2.75rem, `md` 3.125rem, `lg` 3.625rem. `sm` is the mobile tap floor used by every other rule in `mobile-tap-targets.css`.

`--touch-target-min` has exactly one consumer and no declaration. In CSS a `var()` reference to an undeclared property with no fallback makes the whole declaration invalid at computed-value time, so `min-height` resolves to its initial value `auto`. The property is therefore not a missing token to be added but a typo to be pointed at the existing one.

The catalog `--block-*` family is the R6 subject. Its live source is unresolved: `site/lib/theme/plannerThemePacks.ts` lines 102-139 define `PREMIUM_LIGHT_SEMANTIC` and `EXECUTIVE_DARK_SEMANTIC` as TypeScript maps whose keys mirror `theme-premium-light.css` and `theme-executive-dark.css`, while `site/lib/theme/catalogTokenKeys.ts` exists specifically so `/api/theme/active` never injects these keys and `ThemeProvider` strips them defensively.

## Detailed defect design

### R1 — Undefined tap-target token

Current state at `mobile-tap-targets.css` lines 134-139:

```css
  a.contact-form-consent__link {
    display: inline-flex;
    align-items: center;
    min-height: var(--touch-target-min);
    padding-block: 0.625rem;
  }
```

Two possible fixes: point the declaration at `--control-height-sm`, or declare `--touch-target-min` as a new token. Option one is correct. Declaring a new token would add a second name for an existing concept, which is the duplicate-token pattern the zone rules forbid, and would leave two names for one floor.

`display: inline-flex`, `align-items: center`, and `padding-block: 0.625rem` are left unchanged. The padding differs intentionally from the sibling rules' `0.25rem` and is not part of this defect.

The specificity interaction determines whether the fix is observable. The rule immediately above is `:where(.contact-form-intro a, .contact-form-consent__link)`, which `:where()` reduces to specificity 0,0,0 and which correctly uses `--control-height-sm`. The broken rule is `a.contact-form-consent__link` at 0,1,1, so it wins and contributes nothing. Repairing it restores a floor rather than adding a redundant one.

### R2 — Cross-zone Admin rule

Current state at lines 141-143:

```css
  :where(.admin-btn--md) {
    min-height: var(--control-height-sm);
  }
```

Delete the rule. It is safe and not a behaviour change: `site/app/admin/layout.tsx` imports `@focss/admin/entry.css`, and that entry never imports `site/focss/site/components/index.css`, so the barrel containing this rule is absent from every Admin page. The rule is unreachable in the Admin zone and meaningless in the site zone, where `.admin-btn--md` never appears in markup.

The Admin `--md` variant is 2.5rem (40px) at `admin/base/buttons.css` line 113. Raising it belongs to `site-page-css-remediation` task 1.4, not here.

### R3 — Orphan duplicate sheet

`portal-svg-catalog.css` is unreachable, is imported by no TSX module, and its rule set is present verbatim in `shell-portal.css` from roughly line 252 to line 517 — same selectors, same declarations, same media queries at 640px, 768px, 1100px, and 390px. `shell-portal.css` is reachable via `chrome/index.css`, so it is the live owner and deletion changes no rendered rule.

The implementer must confirm the duplication is still complete rather than assume it. A partial divergence would mean deletion silently drops rules. Any declaration existing only in the orphan must be merged into `shell-portal.css` first.

`scripts/AsNeeded/finalize-surface-classify.mjs` line 53 lists `site/components/chrome/portal-svg-catalog.css`, a path missing the `focss/site/` segment, so it matches nothing today. Remove the entry rather than repair the path, since the file it names is being deleted.

### R4 — Duplicate selector owner

Both sheets define `.planner-hero-demo__canvas` plus these descendants with identical declarations: `svg`, `.pl-wall`, `.pl-door`, `.pl-desk`, `.pl-chair`, `.pl-storage`, `.pl-zone`, `.pl-zone--alt`, `.pl-zone-label`, `.pl-room-label`, `.pl-dim-line`, `.pl-dim-badge`, `.pl-dim-text`, `.pl-cursor`, `.pl-selection`.

`planner-landing-shared.css` is the superset, additionally owning `.pl-desk-divider`, `.pl-soft-shape`, `.pl-dim-badge--accent`, `.pl-dim-text--accent`, and `.pl-handle`.

Because `components/index.css` imports `homepage/index.css` before `planner/index.css`, the shared sheet already wins every colliding declaration. The effective rendered result today is already the superset sheet. Therefore deleting the duplicated block from `homepage/planner-hero-demo.css` preserves rendering exactly.

Two constraints. The implementer must diff the shared declarations rather than trust the list above, merging into the shared sheet any genuinely different value before deleting. And if the homepage sheet contains rules outside the `.planner-hero-demo__canvas` namespace, those stay; the file is deleted only if nothing remains.

The sub-11px values inside this namespace (`0.46875rem` zone label, `0.5625rem` room label, `9px` dim text) are SVG `fill` text on a decorative canvas. They carry over unchanged and are recommended as exempt. Changing them is out of scope.

### R5 — Document-wide reset in a component sheet

Current state at `home-contact-teaser.css` lines 389-400, where the `@media` wrapper is 389, `.home-reveal` is 390, and the universal block is 391-399:

```css
@media (prefers-reduced-motion: reduce) {
  .home-reveal { opacity: 1 !important; transform: none !important; animation: none !important; }
  *, ::before, ::after {
    animation-delay: -1ms !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    background-attachment: initial !important;
    scroll-behavior: auto !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
}
```

Move the universal block to `site/focss/base/animations.css`, which currently holds only four `@keyframes` and no reduced-motion handling. Per the Architecture section this widens the reset to Admin and Studio, which previously lacked it. That is the correct behaviour for an accessibility reset but it is a change, not a no-op, and must be stated in the task record. Planner will not receive it, consistent with its pinned entry shape; do not add an import to work around that.

Drop the `.home-reveal` line from the teaser sheet. `homepage/home-base.css` line 22 already carries the identical override inside its own `prefers-reduced-motion` block and is the owner of `.home-reveal`.

Because those two rules are the only contents of the teaser's `@media` wrapper, removing both leaves an empty wrapper at line 389. Delete the wrapper too, so the sheet ends after `.contact-teaser__status--error`. An empty at-rule is not a syntax error but it is dead weight and would read as an accidental deletion later.

The seven `!important` declarations are retained. They are correct for a reduced-motion reset that must defeat component-level animation; this task relocates scope rather than relitigating specificity.

### R6 — Ungoverned catalog CSS

Evidence gathered so far:

- No TypeScript, TSX, or CSS file imports `site/lib/catalog/styles/index.css`. Grep across `site/**/*.{ts,tsx,css}` returns only prose comments referring to the directory.
- That barrel imports nine sheets. The seven `tokens-*.css` files and `blocks.css` are not in it, so they have no import path at all.
- `site/lib/theme/plannerThemePacks.ts` lines 102-139 reimplement the semantic maps in TypeScript, and the file's own comment states the values mirror the CSS.
- `site/lib/theme/catalogTokenKeys.ts` describes these variables as owned by `lib/catalog/styles` and exists so `/api/theme/active` never injects them.
- `site/app/api/theme/active/route.ts` confirms catalog block tokens are excluded from the remote theme payload and stripped defensively by `ThemeProvider`.

The unresolved question is which path actually puts these custom properties into `:root` at runtime. Either the CSS is loaded by a path invisible to a static import grep, or the TypeScript maps are the only live source and the nineteen CSS files are stale mirrors.

The work is investigation and a written recommendation terminating in a user decision. It must not delete or edit anything. Deleting nineteen files is destructive and irreversible from the agent's side, and the duplicate `--block-primitive-*` declarations are only worth resolving once the delete-or-keep answer is known. If the decision is keep, a follow-up spec tokenises the eight hex literals and resolves the duplicates. If the decision is delete, none of that work is needed.

## Correctness Properties

Invariants that must hold after implementation. Properties 1, 3, 4, 5, and 6 are statically checkable; Property 7 is the one most at risk from a careless implementation, which is why tasks 2.1 and 2.4 are diff-first.

### Property 1: every custom property reference resolves

No `var()` reference in `site/focss/**` names an undeclared custom property without a fallback. Verified by `check:style-tokens`.

**Validates: Requirements 1.1, 1.2**

### Property 2: zones do not style each other's selectors

No selector owned by the Admin, Planner, or Studio zone is declared from within `site/focss/site/**`, and no site selector is declared from within those zones.

**Validates: Requirements 2.1**

### Property 3: every sheet is reachable

Every non-entry file under `site/focss/**` is reachable from one of the four zone entries, with exactly two documented exceptions: `admin/components/design-kit.css` via route-local import, and `base/root.css` as a pinned fifth entry.

**Validates: Requirements 3.1, 3.3**

### Property 4: one owner for the hero-demo namespace

`.planner-hero-demo__canvas` and each `.pl-*` descendant is declared in exactly one sheet.

**Validates: Requirements 4.1**

### Property 5: one owner for `.home-reveal`

`.home-reveal` is declared in exactly one sheet, `homepage/home-base.css`.

**Validates: Requirements 5.2**

### Property 6: the universal reset lives in base

The `*, ::before, ::after` reduced-motion group is declared in exactly one sheet, and that sheet is in the `base` zone rather than a component zone.

**Validates: Requirements 5.1, 5.3**

### Property 7: rendered output is unchanged by de-duplication

The set of rendered declarations is unchanged by Requirements 3 and 4. Both remove rules that were already overridden or already duplicated, so neither may alter computed style on any route.

**Validates: Requirements 3.1, 4.2**

### Property 8: catalog files are untouched

No file under `site/lib/catalog/` is created, modified, or deleted by this spec.

**Validates: Requirements 6.2, 6.3**

### Property 9: no raw colour is introduced

No raw hex, raw palette value, or inline colour is added anywhere by this spec.

**Validates: Requirements 6.3**

## Error Handling

Preconditions can fail, and each has a defined response rather than a forced edit:

- If `--touch-target-min` has gained a declaration since the audit, task 1.1 is no longer a repair. Re-plan it instead of applying the change.
- If `--control-height-sm` is no longer `2.75rem`, do not assume 44px. Re-derive the intended floor before touching task 1.1.
- If the R3 duplication is partial, merge the orphan-only declarations into `shell-portal.css` first and record the merge. Do not delete on the assumption of equivalence.
- If the R4 shared declarations diverge in value, merge into `planner-landing-shared.css` before deleting from the homepage sheet. If the homepage sheet holds rules outside the namespace, keep the file.
- If `homepage/home-base.css` line 22 no longer carries the `.home-reveal` override, do not remove the teaser copy; that would delete the only remaining declaration.
- If reachability now reports more or fewer than three unreachable files, stop and re-freeze evidence. The orphan set is the premise of Wave 2.
- If R6 investigation shows the catalog CSS is live, the recommendation flips from delete to wire-up. Either way the wave ends at a recommendation, never at a deletion.

## Testing Strategy

Agent-side: none. No task in this spec runs tests, gates, browser audits, or repository commands. This is a repository rule, not a preference.

User-invoked after implementation:

- `pnpm run verify:focss` covers the import graph, fences, and structure assertions that R3 and R4 affect. This is the primary check for correctness properties 3 and 4.
- `pnpm run check:style-tokens` covers the token drift that R1 affects, and is the primary check for property 1.
- `pnpm run lint:ui:strict` covers the UI contract.
- `pnpm run scan:boundaries` is not required, because no Planner or Studio file is touched. This changes only if the R6 decision later moves files.

No new automated test is added. These defects are structural properties of the stylesheet graph, which the existing `verify:focss` and `check:style-tokens` scripts already assert; a unit test asserting CSS text would duplicate them and rot faster. Rendered-box confirmation for R1 belongs to the five-viewport audit in `site-page-css-remediation` Wave 4, not here.

## Risk

| Change | Risk | Mitigation |
|---|---|---|
| R1 token repair | Consent link grows to 44px at mobile, which is the intent | Single selector, single property |
| R2 rule deletion | None; rule is unreachable | Import path traced from `admin/layout.tsx` |
| R3 file deletion | Dropping a rule if duplication is partial | Diff against `shell-portal.css` 252-517 before deleting |
| R4 block deletion | Dropping a rule if values diverge | Diff shared declarations; deleted block was already overridden |
| R5 reset relocation | Reset newly applies to Admin and Studio | Stated explicitly; correct for an a11y reset |
| R6 investigation | None; read-only | No edit permitted in this spec |
