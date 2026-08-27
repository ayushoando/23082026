# CSS static audit — all 172 stylesheets

Agent note, not a handbook. Static source analysis only; no browser measurement was performed and none is claimed below.

- **Date:** 2026-08-26
- **Scope:** every `.css` file in the repo excluding `node_modules`, `.next`, `.tmp`
- **Method:** file-content analysis plus a transitive `@import` reachability walk from the FOCSS zone entries
- **Remediation spec:** [`plans/ref/focss-static-defects/`](./focss-static-defects)

## Why this audit exists

The 61-route audit behind [`site-page-css-remediation`](./site-page-css-remediation/tasks.md) measures rendered pages at five viewports. That method cannot see an undefined custom property, an unreachable stylesheet, a selector owned by two sheets, or a stylesheet tree that no entry imports. This audit covers only that class of defect. The two are complementary, not overlapping.

## Inventory

| Location | Files | Governed by FOCSS zone rules |
|---|---:|---|
| `site/focss/**` | 148 | yes |
| `site/lib/catalog/**` | 19 | **no** |
| `tech-docs-generator/src/**` | 2 | no — separate inventory SPA |
| `site/app/(site)/globals.css` | 1 | entry re-export only |
| `Agents/kiro-workflow-guide/styles.css` | 1 | no — doc tooling |
| `generated-documents/**` | 1 | no — build artifact |
| **Total** | **172** | |

FOCSS zone breakdown: `base` 12, `site` ~110, `admin` 13, `planner` 11, `studio` 12.

## What is clean

Stated first because it narrows where the real problems are.

**Token discipline inside FOCSS is airtight.** Zero raw hex outside `base/tokens/`. All 148 sheets resolve colour through `var()` or `color-mix()`. A repo-wide grep for `:\s*#[0-9a-fA-F]{3,8}` excluding `base/tokens/**` returns nothing.

**The import graph is fully conformant.** No missing `@import` targets, no cross-zone imports, no `core/` or `core/locked/` live homes. Reachability from the four zone entries resolves cleanly.

**`site/app/(site)/globals.css` is a clean one-line re-export** of `@focss/site/entry.css`. No drift.

## Findings

Ranked by leverage, not by discovery order.

### 1. `--touch-target-min` is undefined — the rule consuming it silently does nothing

`site/focss/site/components/shared/mobile-tap-targets.css` lines 134-139:

```css
  a.contact-form-consent__link {
    display: inline-flex;
    align-items: center;
    min-height: var(--touch-target-min);   /* undefined, no fallback */
    padding-block: 0.625rem;
  }
```

A repo-wide search for `touch-target-min\s*:` returns no declaration. The `var()` reference cannot resolve and has no fallback, so the declaration is invalid at computed-value time and `min-height` falls back to `auto`.

The compounding detail: the rule immediately above is `:where(.contact-form-intro a, .contact-form-consent__link)`, which `:where()` reduces to specificity 0,0,0 and which correctly uses `--control-height-sm`. The broken rule is `a.contact-form-consent__link` at specificity 0,1,1, so it **wins and contributes nothing**. It actively defeats the floor that would otherwise apply.

Every other rule in the file uses `--control-height-sm`, declared `2.75rem` (44px) at `site/focss/base/tokens/layout.css` line 23. One-token fix. Maps to the `H` finding on `/contact` at 390 in matrix row 27.

### 2. Admin button ramp sits below the 40px threshold — root cause for 19 matrix rows

`site/focss/admin/base/buttons.css` lines 113-165:

| Variant | Declared | vs 40px |
|---|---|---|
| `--lg` | 2.75rem / 44px | pass |
| `--md` | 2.5rem / 40px | borderline |
| `--sm` | 2.25rem / 36px | **fail** |
| `--xs` | 1.875rem / 30px | **fail** |
| `--icon` | 40×40px | borderline |
| `--icon-sm` | 36×36px | **fail** |
| `--icon-xs` | 30×30px | **fail** |

This single ramp explains the `H` column for all 19 Admin routes at 768 and 390. `site-page-css-remediation` currently treats rows 4-22 as 19 separate per-route CSS jobs; they are one shared-primitive change. This is the highest-leverage finding in the audit and a meaningful re-scope of Wave 1 task 1.4.

### 3. Cross-zone leak that is also dead code

`mobile-tap-targets.css` lines 141-143:

```css
  :where(.admin-btn--md) {
    min-height: var(--control-height-sm);
  }
```

`.admin-btn--md` is an Admin-zone primitive owned by `admin/base/buttons.css` line 113. Two problems:

- It violates the site-zone boundary in the FOCSS zone table.
- It can never fire. `site/app/admin/layout.tsx` imports `@focss/admin/entry.css`, which never imports `site/focss/site/components/index.css`, so the barrel holding this rule is absent from every Admin page.

Delete it; fix the size in the Admin ramp instead (finding 2).

### 4. `portal-svg-catalog.css` is an unreachable verbatim duplicate

`site/focss/site/components/chrome/portal-svg-catalog.css`, 6,061 bytes. Unreachable from all four zone entries and imported by no TSX module. Its entire rule set already exists in `shell-portal.css` from roughly line 252 to 517 — same selectors, same declarations, same media queries at 640px, 768px, 1100px, and 390px.

The only reference anywhere is a stale path in `scripts/AsNeeded/finalize-surface-classify.mjs` line 53 (`site/components/chrome/...`, missing the `focss/site/` segment, so it matches nothing). [`docs/guide/CODEBASE_REVIEW_REPORT.md`](../../docs/guide/CODEBASE_REVIEW_REPORT.md) line 172 already recommends deletion.

The other two unreachable files are legitimate and must be left alone:

- `admin/components/design-kit.css` — deliberate route-local import at `site/app/admin/design-kit/page.tsx` line 6.
- `base/root.css` — documented fifth entry, asserted by `scripts/AsNeeded/verify-focss-structure.mjs` lines 62 and 261.

### 5. Two sheets own the same selector namespace

`site/focss/site/components/homepage/planner-hero-demo.css` is a near-complete subset of `site/focss/site/components/planner/planner-landing-shared.css`. Both define `.planner-hero-demo__canvas` plus these identical descendants: `svg`, `.pl-wall`, `.pl-door`, `.pl-desk`, `.pl-chair`, `.pl-storage`, `.pl-zone`, `.pl-zone--alt`, `.pl-zone-label`, `.pl-room-label`, `.pl-dim-line`, `.pl-dim-badge`, `.pl-dim-text`, `.pl-cursor`, `.pl-selection`.

The shared sheet additionally owns `.pl-desk-divider`, `.pl-soft-shape`, `.pl-dim-badge--accent`, `.pl-dim-text--accent`, and `.pl-handle`.

Both reach the same site entry through `components/index.css`, which imports `homepage/index.css` **before** `planner/index.css`. So the shared sheet already wins every colliding declaration and the homepage copy is inert — edits to it have no visible effect. Breaks one-canonical-path-per-concern.

### 6. A component sheet carries a document-wide reset

`site/focss/site/components/contact/home-contact-teaser.css` lines 389-400:

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

`components/index.css` pulls this sheet into the site entry, so a single component's stylesheet governs animation behaviour for every element on every marketing page. `site/focss/base/animations.css` holds only four `@keyframes` and no reduced-motion block at all — it is the correct owner.

The `.home-reveal` override is also already present at `homepage/home-base.css` line 22, which is that selector's real owner.

Broader `!important` usage across FOCSS is otherwise defensible: reduced-motion overrides, Next `<Image>` wrapper fixes, and dockview third-party overrides.

### 7. Planner and Studio have no mobile control floor

Both fork trees are saturated with desktop-density interactive targets:

| Selector | Size | Zone |
|---|---|---|
| `.stroke-swatch` | 20×20 | both |
| `.layer-item__icon-btn` | 22×22 | both |
| range thumbs (`::-webkit-slider-thumb`) | 14×14 | both |
| `.color-palette__picker`, `.color-palette__preview` | 28×28 | both |
| `.btn--icon` | 32×32 | studio |
| `.icon-btn` | 36×36 | studio |
| step-bar chips | `min-height: 26px` | planner |
| `.status-bar` | 28px | both |

Values are near-identical across the two forks. Nothing in either zone raises these at narrow viewports, which is why matrix rows 32-35 show `H` at 768/390.

This is a product decision, not a defect. Whether a CAD-style workspace supports a 390px viewport at all determines whether the correct disposition is `CSS` or `AC`. It should not be settled by a mechanical edit.

### 8. Nineteen ungoverned catalog stylesheets, all unreferenced

`site/lib/catalog/styles/` (18 files) plus `site/lib/catalog/blocks.css` sit outside `site/focss`, so no zone rule and no FOCSS verify script covers them.

- **Only raw-hex site in the app:** `#65a30d`, `#3b82f6`, `#78350f`, `#d4af37`, `#b45309`, `#4d7c0f`, `#3f6212`, `#aa8620` — sitting directly beside correctly tokenised `var(--color-bronze-800)` references. Half-migrated.
- **Duplicate token declarations:** `--block-primitive-blue-500` and `--block-primitive-lime-600` declared twice with identical values, in both `tokens.css` and `tokens-primitives.css`.
- **Nothing imports them.** `styles/index.css` is a barrel over nine sheets, but no `.ts`, `.tsx`, or `.css` file imports the barrel. The seven `tokens-*.css` files and `blocks.css` are not even in it.
- **Reimplemented in TypeScript.** `site/lib/theme/plannerThemePacks.ts` lines 102-139 define `PREMIUM_LIGHT_SEMANTIC` and `EXECUTIVE_DARK_SEMANTIC`, whose keys mirror `theme-premium-light.css` and `theme-executive-dark.css`. The file's own comment states the values mirror the CSS. `site/lib/theme/catalogTokenKeys.ts` exists so `/api/theme/active` never injects these keys.

Reading: these are stale hand-maintained mirrors of a TypeScript source of truth, invisible to CSS tooling. Needs a delete-or-wire decision before anyone touches the hex — tokenising a dead file is wasted work that also hides the duplication.

## Sub-11px type

Confirmed against source, matching the `T` predictions in the route matrix:

| File | Lines | Value | Note |
|---|---|---|---|
| `planner/workspace.css` | 297, 456, 658, 720 | 10px | the `Plan`/`Select` labels in matrix row 32 |
| `planner/chrome.css` | 153 | 10px | export-menu heading |
| `products/catalog-cards.css` | 161, 209 | 10px | card badge + fact label |
| `planner-landing-shared.css`, `homepage/planner-hero-demo.css` | — | 9px, 0.46875rem, 0.5625rem | SVG `fill` text, decorative canvas |

The SVG canvas values are recommended **exempt** rather than remediated. The rest sit in files owned by other specs.

## Verified false positives

Recorded so they are not re-investigated.

- **No duplicate Tailwind import in `chrome/index.css`.** An `@import` regex matched the words `@import "tailwindcss"` inside that file's leading comment block, which documents the expected import order. There is no second Tailwind entry.
- **The Planner/Studio entry divergence is not drift.** `verify-focss-structure.mjs` lines 50-125 pins both shapes deliberately: Planner takes `tailwindcss` plus `../base/tokens/palette.css` only, Studio takes `../base/scan.css` plus the full product base. Both entries match their pinned contract exactly.

## Disposition

| # | Finding | Owner | Action |
|---|---|---|---|
| 1 | undefined `--touch-target-min` | `focss-static-defects` R1 | fix |
| 2 | Admin button ramp | `site-page-css-remediation` 1.4 | handed over as evidence |
| 3 | `.admin-btn--md` cross-zone | `focss-static-defects` R2 | delete rule |
| 4 | `portal-svg-catalog.css` orphan | `focss-static-defects` R3 | delete file + stale ref |
| 5 | duplicate hero-demo namespace | `focss-static-defects` R4 | one owner |
| 6 | global reset in component sheet | `focss-static-defects` R5 | move to `base/animations.css` |
| 7 | fork control density | `site-page-css-remediation` 1.5/1.6, `planner-remediation` | product decision, `CSS` vs `AC` |
| 8 | ungoverned catalog CSS | `focss-static-defects` R6 | investigate, then user decision |

Findings 2 and 7 are excluded from the new spec on purpose: those files are already claimed by other specs, and editing them from a second spec would create a two-spec conflict on one file.

Also deferred: the Next `<Image>` `> span:has(> img)` wrapper override is copy-pasted across roughly ten sheets. Consolidating it would touch ten files owned by page-level rows for no behavioural gain.

## What was not verified

- **No rendered-DOM or computed-style measurement.** Every target-size and type finding above is read from source declarations. Confirming which actually produce `H`/`T` findings per viewport requires the five-viewport run.
- **`verify:focss`, `lint:ui:strict`, and `check:style-tokens` were not run.** Those are user-invoked in this repo.
- **Finding 8's runtime path is unresolved.** Whether the catalog CSS or the TypeScript maps put `--block-*` into `:root` at runtime is an open question, not a conclusion.
