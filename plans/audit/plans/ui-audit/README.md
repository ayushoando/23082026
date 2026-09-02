# UI Audit Plan

**Created:** 2025-07-31 (audit) · 2026-08-31 (verified against current codebase)
**Status:** 5 findings resolved, 25 open, 3 verified-complete — remedy plan updated
**Owner:** Product / UI engineering

## Documents

| Document | Purpose |
|---|---|
| [`ui-audit-report.md`](./ui-audit-report.md) | Full UI audit: typography, color, animation, layout, images, SEO, security, accessibility across 34 routes |
| [`ui-audit-remedy-plan.md`](./ui-audit-remedy-plan.md) | Phased remedy plan (Phase 0–5) with finding-to-phase mapping, acceptance checks, and rollback boundaries |

## Verification Results (2026-08-31)

### Resolved since original audit (5 findings)

| Finding | What changed |
|---|---|
| **UI-007** Dark mode | `html.dark {}` class-based semantic layer added in `semantic.css` — full surface/text/border/shadow overrides for Planner's `WorkspaceThemeProvider` |
| **UI-010** LocalBusiness on homepage | `buildLocalBusinessJsonLd()` implemented in `seo.ts`; FurnitureStore node in sitewide `buildGlobalJsonLd()` |
| **UI-017** Contact `:focus-visible` | Contact inputs now use both `:focus` and `:focus-visible` selectors (`contact-page.css`, `contact-band.css`) |
| **UI-018** Contact transition token | Transition now uses `var(--motion-fast) var(--ease-standard)` instead of hardcoded `150ms` |
| **UI-011** Showrooms LocalBusiness | Partially resolved — helper exists and is tested; sitewide FurnitureStore covers base case |

### Still Open (25 findings)

**Critical (4):** UI-001 (homepage title 67ch), UI-002 (about title 71ch), UI-005 (semibold=medium=500), UI-006 (triple color collision)

**Planner (8):** UI-003 (no hero animation), UI-004 (mobile hero collapses), UI-012 (no kicker), UI-013 (12ch title cap), UI-014 (no feature reveals), UI-015 (no detail reveals), UI-016 (no help CSS), UI-031/032 (hero sizing, demo delay)

**Accessibility (3):** UI-020 (aggressive reduced-motion), UI-021 (focus inconsistency), UI-022 (outline vs box-shadow)

**SEO (1):** UI-008 (no SoftwareApplication JSON-LD)

**Token cleanup (9):** UI-019, UI-025–030, UI-033

### Quality Scores (original audit, partially improved)

| Category | Original | Notes |
|---|---|---|
| Typography system | 8/10 | UI-005 still open |
| Animation system | 8/10 | UI-020 still open |
| Color system | 7/10 | **UI-007 resolved** (dark mode), UI-006 still open |
| Layout & containers | 9/10 | — |
| Images | 6/10 | — |
| SEO | 7/10 | **UI-010 resolved** (LocalBusiness), UI-001/002 still open |
| Security | 8/10 | — |
| Accessibility | 7/10 | **UI-017/018 resolved** (contact focus/transition) |
| **Planner specifically** | **4/10** | All Planner findings still open |

### Issue Register Summary
- **33 findings** (UI-001 through UI-033)
- **5 resolved** since audit: UI-007 (dark mode), UI-010 (LocalBusiness), UI-011 (partial), UI-017 (contact focus), UI-018 (contact transition)
- **25 still open:** 4 critical, 8 Planner, 3 accessibility, 1 SEO, 9 token cleanup
- **3 verified complete** (unchanged): UI-009 (FAQ schema), UI-023 (logo image), UI-024 (OG dimensions)

### Remedy Phases (updated)

| Phase | Focus | Findings |
|---|---|---|
| Phase 0 | Baseline and evidence lock | All — no code changes |
| Phase 1 | Token and semantic foundation | UI-005, UI-006, UI-019, UI-025–UI-030, UI-033 |
| Phase 2 | Planner visual hierarchy and responsive | UI-003, UI-004, UI-012–UI-016, UI-031, UI-032 |
| Phase 3 | Interaction, focus, motion accessibility | UI-020, UI-021, UI-022 |
| Phase 4 | SEO metadata, structured data, images | UI-001, UI-002, UI-008, UI-011 |
| Phase 5 | Validation and release handoff | All phases verified |

## Pages Audited (34 routes)
`/`, `/about`, `/career`, `/clients`, `/compare`, `/contact`, `/downloads`, `/planning`, `/planner`, `/planner/features`, `/planner/features/[slug]`, `/planner/help`, `/products`, `/products/[category]`, `/products/[category]/[product]`, `/quote-cart`, `/service`, `/showrooms`, `/sustainability`, `/trusted-by`, `/solutions`, `/solutions/[category]`, `/terms`, `/privacy`, `/refund-and-return-policy`, `/tools/office-space-calculator`, `/tools/meeting-room-capacity-calculator`, `/portal`, `/portal/guest`, `/portal/[id]`, `/choose-product`, `/access`, `/not-found`, `/error`

## Data Sources
- FOCSS CSS token system (`site/focss/`)
- Route metadata (`site/features/site/data/routeMetadata.ts`, `site/lib/helpers/seo.ts`)
- Component CSS and page.tsx files across all 34 routes
- JSON-LD structured data helpers
- Animation keyframes and motion tokens
