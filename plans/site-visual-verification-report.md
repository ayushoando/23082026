# Site visual verification report

Generated 2026-08-26 from the complete browser evidence set at "http://localhost:3000". The source run completed the full matrix: **61 route patterns × 5 viewports = 305 checks**, with HTTP 200 for all 305. Every row has a fold screenshot; rows with findings also have a full-page screenshot when the capture recorded one.

## Evidence and coverage

- CSV: "results/site/page-audit-visual-20260826/visual-findings.csv"
- Screenshot source: "results/site/page-audit-production-complete"
- Source audit JSON: "results/site/page-audit-production-complete/audit-results.json"
- Representative screenshots directly reviewed: `w1920/root-fold.png`, `w390/root-full.png`, `w390/login-full.png`, `w390/products-category-product-full.png`, `w390/offline-full.png`, and `w390/ooplanner-projects-id-full.png`
- Viewports: 1920×1080, 1440×900, 1078×800, 768×1024, 390×844
- Route rows: 61; viewport rows: 305
- Fold captures: 305/305; full captures emitted by the audit: 215
- Per-route coverage: 61/61 routes have all five viewport records

The fresh rerun under "page-audit-visual-20260826" was stopped after the dev-server/browser worker hung during the w1920 transition near "/showrooms". It did not replace the complete evidence source above; the partial rerun directory is not used as evidence.

## Findings summary

| Finding | Count | Classification | Treatment |
| --- | ---: | --- | --- |
| Missing footer/contentinfo landmark | 130 | Audit-contract/shell heuristic | Classify route chrome before changing CSS; app shells and redirects are not automatically defects. |
| Small interactive targets under 40px | 114 | CSS/markup heuristic | Review mobile shell and repeated controls; do not infer a visual defect from the count alone. |
| Text below 11px | 16 | Typography heuristic | Review labels/breadcrumbs against the approved type scale; avoid global inflation. |
| Console errors | 15 | Runtime | Investigate missing assets and authenticated API calls separately from CSS. |
| Visible controls without accessible names | 6 | Markup/accessibility | Add accessible names at the owning component. |

## Confirmed visual observations

1. **Mobile site shell:** the 390px homepage capture shows the fixed bottom navigation over the lower edge of the first category card. The 390px product-detail capture similarly places the bottom navigation over lower detail content. This is the clearest confirmed presentation issue and points to the shared mobile shell/padding owner, not individual page CSS.
2. **Planner project runtime state:** the captured "/ooplanner/projects/[id]" workspace shows a red “Failed to load project: Authentication required” toast. This is a runtime/authentication finding, not a visual styling defect. It is repeated across viewport records.
3. **Offline page:** the offline card is visually coherent in the 390px full capture. The audit nevertheless records a 404 for "/media/hero/planning-poster.webp"; treat that as an asset/runtime issue, not as a layout conclusion.
4. The 1920px homepage capture shows the desktop navigation, hero, category cards, and floating actions aligned without horizontal overflow.

## Contract and false-positive handling

- The 130 missing-footer records are not all defects: app shells intentionally use different chrome, and several paths resolve to another route. The CSV marks these as audit-contract/shell classification rows.
- Redirect/contract rows include "/login", "/portal/guest/view/[id]", and "/products/category/[slug]" when the final path differs from the requested audit path. Their screenshot is evidence of the resolved page, not proof that the source route lacks a CSS owner.
- 15 rows resolve through redirect/route behavior in the complete records.
- 15 rows include runtime/network evidence and must not be folded into a CSS remediation count.
- Automated heuristics are preserved in every CSV row; only the observations above are labeled confirmed visual defects. The remaining issue rows are “finding recorded” rather than unsupported visual claims.

## Review disposition

Use the CSV as the column-wise handoff. Start remediation with the shared mobile shell overlap, then the Planner authentication/runtime path, missing offline asset, and mobile target/type heuristics. Preserve FOCSS zone ownership and keep redirect-only and owner-gap rows out of invented CSS work.
