# Requirements: Page-wise FOCSS CSS remediation

## Status and source of truth
This is an implementation plan, not an implementation change. It is based on the completed audit in `results/site/page-audit-production-complete/` generated on 2026-08-26:

- 61 route patterns.
- 305 checks: every route at 1920, 1440, 1078, 768, and 390 CSS pixels.
- HTTP 200 for all 305 checks.
- 114 small interactive targets under 40px.
- 16 text samples below 11px.
- 130 missing `contentinfo` heuristic findings.
- 6 visible-control groups without accessible names.
- 15 console-error findings.

The route/component graph is `results/site/page-component-graph/page-component-graph.json`. The graph and route inventory are evidence for ownership; they are not permission to invent a component or stylesheet that does not exist.

## Classification vocabulary
Every route remedy must be assigned one or more of these work types before implementation:

- **CSS** — an existing rendered element has a verified FOCSS owner and needs layout, spacing, type, or target-size changes.
- **Markup** — the rendered element needs semantic structure, a landmark, an accessible name, or a component change. CSS cannot close this item.
- **Runtime** — the audit reports a console error. Reproduce it in the owning runtime/component; do not hide it with CSS.
- **Audit contract** — the route intentionally uses a shell without public marketing chrome, or is redirect-only. Update the audit rule/expected shell contract rather than adding a fake footer.
- **Owner gap** — the audit found a control or page state, but the graph has no live component owner. Investigate the route before creating any new CSS file.

## Scope
The implementation plan covers all 61 route patterns in `tasks.md`, including dynamic routes and the exact audit samples:

- `planId=demo-plan` for portal, Admin project/plan, and Planner project detail samples.
- `/products/seating/` and `/products/seating/arvo/` for catalog/product samples.
- `/products/category/seating/` for the legacy category sample.
- `/planner/features/measure/` and `/solutions/seating/` for dynamic marketing samples.

The plan does not expand database-backed IDs beyond those samples during this CSS pass.

## FOCSS ownership constraints
1. Presentation changes stay in the existing `site/focss/` tree and the already-owned component class names.
2. The site, Admin, Planner, and Studio zones remain isolated. No CSS import may cross from Planner to Studio, Studio to Planner, Admin to either fork, or a fork to site marketing CSS.
3. Site work uses the canonical site entry and barrels: `site/focss/site/entry.css`, `site/focss/site/components/index.css`, and their existing component sheets.
4. Admin work uses `site/focss/admin/entry.css` and the existing Admin base/component sheets. Admin does not import site marketing sheets.
5. Planner keeps its own `@import "tailwindcss"` in `site/focss/planner/entry.css`; it must not import `site/focss/base/scan.css` or Studio CSS.
6. Studio remains a separate fork rooted at `site/focss/studio/entry.css`; it must not import Planner CSS.
7. Use existing semantic tokens and existing FOCSS class composition. Do not add raw palette values, inline color styles, raw Tailwind utilities in product TSX, or a parallel CSS tree.
8. A new CSS file is allowed only after the existing owner/barrel has been checked and a repeated concern cannot be placed in an existing canonical sheet.

## Requirements

### R1 — Preserve the complete route and viewport matrix
`tasks.md` must retain one row for each audit route pattern and must show findings for all five widths: 1920, 1440, 1078, 768, and 390. Dynamic rows must show both the route pattern and its sampled audit path.

### R2 — Name the real page and component owner
Each route row must identify the App Router page source and the direct page/view owner from the component graph. Redirect-only routes must say `redirect-only` and must not receive a fabricated page component. The calculator routes must retain an explicit owner-gap record because the graph shows no live calculator component import.

### R3 — Fix shared interactive target sizing once per zone
At 768 and 390, links, buttons, icon buttons, form controls, filters, pagination, and shell navigation controls must meet the repository's 40px target contract without destroying hierarchy or causing horizontal clipping. First inspect the existing shared owner:

- Site: `site/focss/site/components/shared/buttons.css` and `mobile-tap-targets.css`, plus the relevant shell sheet.
- Admin: `site/focss/admin/base/buttons.css`, `primitives.css`, and shell sheets.
- Planner: `site/focss/planner/controls.css`, `dock.css`, `workspace-shell.css`, and `workspace.css`.
- Studio: `site/focss/studio/controls.css`, `dock.css`, `workspace-shell.css`, and `workspace.css`.

A page sheet may add only the layout context that the shared primitive cannot solve.

### R4 — Correct intentional sub-11px text at its owner
The 16 text findings must be traced to the actual rendered class and owner. The known review points are homepage `Flagship`/`Trusted by` labels, Planner `Plan`/`Select` labels, Planner project-detail labels, and product-detail mobile breadcrumbs. Use `site/focss/base/type/type.css`, `site/focss/base/type/typography.css`, the homepage `home-type.css`, the Planner control/type owner, or `pdp-detail.css` only after DOM confirmation. Do not globally inflate intentional metadata.

### R5 — Resolve footer findings through the shell contract
A footer heuristic is not automatically a CSS defect. Use `site/features/site/data/routeChromeRules.ts` and the actual layout owner to classify each finding:

- Public marketing routes: expected full site chrome; required footer belongs to `RouteChromeSuspense` and the existing chrome/footer sheets.
- `/access`, `/dashboard`, `/portal`, and their descendants: intentional footerless workspace chrome; use `shell-access.css`, `shell-workspace.css`, or `shell-portal.css` and update the audit contract if the markup is correct.
- `/choose-product`: public/pre-planner marketing chrome; it is not a workspace exception.
- `/login`: `header=hidden|full` and `footer=login-tools` based on the `next` query; it is redirect/auth contract work, not a universal footer target.
- Admin: the `AdminLayoutShell` contains its own navigation/sidebar footer and intentionally has no public site footer.
- Planner, Studio, and Offline: application/utility shells without a public site footer.

CSS may style an existing footer; it may not create a valid landmark with a pseudo-element.

### R6 — Name visible controls structurally
The product category findings must be fixed in the actual product owners, not in CSS:

- `site/features/site/catalog/CategoryPageView.tsx`.
- `site/features/site/catalog/FilterGridInner.tsx`.
- `site/features/site/catalog/FilterGrid.components.tsx`.
- `site/features/site/catalog/CategoryListingHero.tsx`.

The legacy `/products/category/[slug]` page is redirect-only and must inherit the canonical category behavior. The six visible-control groups must be rechecked after naming, then styled through the existing product/filter sheets.

### R7 — Separate runtime errors from CSS work
The 15 console findings on `/offline`, `/ooplanner/projects`, and `/ooplanner/projects/[id]` require reproduction and assignment to their runtime owners. CSS completion cannot mask, suppress, or redefine a console error as a visual issue.

### R8 — Handle missing or redirect-only owners honestly
The two calculator pages have no live calculator component in the graph and no matching `tools-engine-placeholder` or `tools-faq` CSS owner. Their audit findings must be investigated as an owner gap before any CSS is added. `/login`, `/products/category/[slug]`, and `/portal/guest/view/[id]` must be treated according to their current redirect behavior.

### R9 — Keep page CSS canonical and narrowly scoped
The plan may reference only existing canonical files listed in `design.md` and `tasks.md`. Do not create `core/`, `core/locked/`, `features/product/`, root-level `focss/`, or duplicate token sheets. Route-local sheets are appropriate only where they already exist, such as `solutions-page.css`, `legal-page.css`, and `products/*`.

### R10 — Re-audit by route and viewport
After implementation, the user must re-run the deterministic 61 × 5 browser audit and retain route, audit path, viewport, status, finding category, DOM target, owner, and screenshot evidence. Aggregate counts alone do not close this plan.

## Acceptance criteria
- [ ] `tasks.md` contains all 61 route patterns from `route-inventory.json`.
- [ ] The route matrix explicitly represents 1920, 1440, 1078, 768, and 390 for every route.
- [ ] Every route row names its source page, direct page/view owner, and canonical CSS owner or an explicit redirect/owner-gap disposition.
- [ ] No CSS task points to a nonexistent stylesheet or component.
- [ ] Small targets are corrected at the verified owner, or the remaining exception is documented with an interaction rationale.
- [ ] Intentional sub-11px labels have a token-level rationale and are not changed globally without DOM confirmation.
- [ ] Every footer finding has a required-footer, intentional-footerless, redirect/auth, or false-positive disposition.
- [ ] Product-category controls have accessible names in markup and are rechecked at the canonical and legacy sample paths.
- [ ] `/offline`, `/ooplanner/projects`, and `/ooplanner/projects/[id]` console findings are resolved or recorded as explicit runtime blockers.
- [ ] Planner and Studio remain import-isolated.
- [ ] The user, not the agent, runs the repository's FOCSS/UI checks and browser audit after implementation: `pnpm run verify:focss`, `pnpm run lint:ui:strict`, `pnpm run check:style-tokens`, and `pnpm run scan:boundaries` when a fork is touched.

## Non-goals
- Rebuilding or replacing FOCSS.
- Adding a universal footer to Admin, Planner, Studio, Offline, workspace, or redirect-only shells.
- Treating audit heuristics as proof of a visual defect without DOM/screenshot confirmation.
- Expanding all dynamic records beyond the recorded samples.
- Running tests, gates, browser suites, or Postman collections automatically as part of this plan.
