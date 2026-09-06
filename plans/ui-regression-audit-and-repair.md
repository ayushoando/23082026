# UI Regression Audit and Page-by-Page Repair Plan

**Repository:** `ayushoando/23082026`  
**Target branch:** `main`  
**Created:** 2026-09-06  
**Status:** Audit first; implementation follows one page at a time

## Purpose

Investigate and repair the reported major UI regression without restoring or broadly reverting files. The work must isolate the smallest cause for each page and preserve unrelated backend, data, documentation, and platform behavior.

## Reported symptoms

- Large UI regression across the site.
- Many i18n behaviors are non-functional or inconsistent.
- Mobile behavior is more severely affected than desktop behavior.
- Layout and interaction behavior changes unexpectedly at 1024px and 768px.
- Different viewport resolutions appear to take different, incorrect layout paths.

These are reported symptoms and investigation targets, not yet verified findings. Every defect claim must be tied to a route, viewport, revision, reproduction step, and observed result.

## Non-negotiable constraints

1. Audit before editing.
2. Fix the site page by page, carefully.
3. Do not restore files, perform a broad rollback, or replace the current UI with an older snapshot.
4. Preserve unrelated work and keep each repair small and reviewable.
5. Before any multi-file edit, name the exact files and the contract being changed.
6. Treat historical commits and old reports as leads only; current source and fresh browser evidence are authoritative.
7. Do not declare a page fixed until it passes the required viewport and locale checks.
8. Record blockers in `Failures.md` only when a hard blocker is confirmed.

## Working hypothesis

The prior investigation identified a concentrated set of recent UI-related changes involving mobile navigation, viewport handling, CSS tokens, i18n links, content-security policy, and consent-bar behavior. These changes are investigation leads, not proof of causality. The audit must trace each visible failure to the current source and runtime behavior before changing anything.

## Audit order

Use this order so shared contracts are understood before page-specific repairs:

1. **Shared application shell** — root layout, locale initialization, document direction, header/navigation, mobile chrome, consent/FAB layers, and global CSS.
2. **Locale and navigation contracts** — locale detection, locale-prefixed routes, language switching, translated links, fallback behavior, namespace loading, and server/client hydration.
3. **Homepage** — primary responsive layout and the first user-visible route.
4. **Access/auth entry** — `/access` and its redirects, copy, form layout, and signed-in/signed-out states.
5. **Public client-hub routes** — header links, route transitions, responsive content containers, and empty/error/loading states.
6. **Studio and Planner entry points** — only after shared shell and locale contracts are stable; keep the two forked trees isolated.
7. **Admin and remaining page families** — audit each route independently rather than assuming a shared fix covers it.

If the live route inventory differs from this order, preserve the dependency order and add the exact route to the page ledger before work begins.

## Viewport matrix

Test each audited page at the exact viewport dimensions below. Include both orientations where 1024 and 768 could be interpreted as either width or height:

| Profile | Viewport | Why it is required |
|---|---:|---|
| Compact landscape | 1024 × 768 | Directly targets the reported breakpoint regression |
| Compact portrait | 768 × 1024 | Detects width/height and orientation assumptions |
| Small mobile | 390 × 844 | Baseline mobile layout and mobile chrome |
| Large mobile | 412 × 915 | Catches width-dependent wrapping and overflow |
| Desktop reference | 1280 × 800 | Desktop-to-compact transition comparison |
| Wide reference | 1440 × 900 | Ensures repairs do not regress the normal desktop layout |

For each viewport, record the browser/device emulation, scroll position, locale, route, and whether the issue reproduces.

## Page audit ledger

Create one row per route and locale under review. Do not mark a row complete from source inspection alone.

| Page/route | Locale(s) | 1024×768 | 768×1024 | Mobile | i18n | Evidence | Status |
|---|---|---|---|---|---|---|---|
| Shared shell | all supported locales | pending | pending | pending | pending | pending | audit pending |
| Homepage `/` | all supported locales | pending | pending | pending | pending | pending | audit pending |
| Access `/access` | all supported locales | pending | pending | pending | pending | pending | audit pending |
| Public client-hub routes | all supported locales | pending | pending | pending | pending | pending | audit pending |
| Studio entry/workspace | applicable locales | pending | pending | pending | pending | pending | audit pending |
| Planner entry/workspace | applicable locales | pending | pending | pending | pending | pending | audit pending |
| Admin route family | applicable locales | pending | pending | pending | pending | pending | audit pending |

Expand the ledger with the exact routes from the current route map before implementation starts.

## Shared-contract checks

### Responsive layout

- Identify the winning CSS rule at each failing viewport.
- Check breakpoint boundaries, container widths, grid/flex changes, wrapping, overflow, and viewport-unit calculations.
- Verify fixed and sticky elements do not cover content or create a second scroll owner.
- Verify header, drawer, bottom navigation, consent bar, FAB, and safe-area offsets together.
- Check touch target size, focus visibility, keyboard reachability, and scroll locking.
- Compare the compact landscape and compact portrait profiles separately.

### i18n and routing

- Confirm the locale is initialized before translated UI renders.
- Confirm locale-prefixed links preserve the selected locale and route intent.
- Exercise the language switcher from every audited page.
- Check missing-key behavior, namespace loading, fallback language, and plural/formatting output.
- Check server-rendered and client-rendered text for hydration or locale drift.
- Check translated metadata, document language/direction, navigation labels, accessible names, and error messages.
- Check that responsive repairs do not hide or duplicate localized controls.

### Interaction integrity

- Test navigation, menus, forms, buttons, dialogs, tabs, loading states, and error states at every required viewport.
- Confirm click/tap targets use the intended element and are not blocked by overlays.
- Confirm state survives route transitions and locale changes where it should.
- Record console errors, failed requests, and visible runtime errors as evidence; do not infer them.

## Per-page repair loop

For each page, follow this sequence:

1. Capture the current revision and reproduce the defect at the smallest failing viewport.
2. Record the route, locale, dimensions, steps, expected result, actual result, and evidence location.
3. Trace the defect to the owning component, hook, route contract, translation source, or CSS rule.
4. State the exact files and smallest intended change before editing.
5. Apply one focused repair slice; do not combine unrelated page fixes.
6. Re-run the page at the failing viewport and the paired reference viewport.
7. Re-run the full locale checks for that page.
8. Re-check the shared shell and the immediately preceding page in the audit order.
9. Record residual issues, deferred work, and acceptance evidence.

## Evidence standard

Every completed ledger row must include:

- current commit/revision;
- route and locale;
- exact viewport dimensions and orientation;
- reproduction steps and observed result;
- files inspected or changed;
- targeted command or browser check actually run;
- screenshots, logs, or links where applicable;
- residual defects and explicit reason for deferral.

A green historical report, a component existing in source, or a successful build alone is not proof that the canonical page behaves correctly.

Do not place hand-written Markdown audit reports under `results/`; this plan belongs under `plans/` and generated evidence must follow the repository's evidence conventions.

## Acceptance criteria

A page is complete only when:

- the original defect is reproduced before the repair and no longer reproduces afterward;
- 1024 × 768 and 768 × 1024 have both been checked independently;
- the page passes the mobile and desktop reference profiles;
- all supported locale paths and the language switcher behave consistently;
- no overlay, overflow, hydration, console, or navigation regression is introduced;
- the change is limited to the identified owning files and preserves unrelated behavior;
- the evidence is current, reproducible, and tied to the tested revision.

## First repair slice

Begin with a read-only audit of the shared shell, locale initialization, locale-aware links, and homepage at 1024 × 768 and 768 × 1024. Do not edit until the first defect ledger is populated and the exact owning files are named.

Relevant existing planning references:

- [`AGENTS.md`](../AGENTS.md) — repository execution and safety floor
- [`01-ui-focss-and-mobile-chrome.md`](./05092026/01-ui-focss-and-mobile-chrome.md) — UI, CSS, and mobile chrome
- [`02-route-contracts-seo-and-i18n.md`](./05092026/02-route-contracts-seo-and-i18n.md) — route, SEO, and i18n contracts
- [`05092026/README.md`](./05092026/README.md) — existing remediation suite index
