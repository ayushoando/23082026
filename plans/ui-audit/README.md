# UI Audit Plan

**Created:** 2025-07-31 (audit) · 2026-08-31 (reorganized)
**Status:** Audit complete, phased remedy plan ready for execution
**Owner:** Product / UI engineering

## Documents

| Document | Purpose |
|---|---|
| [`ui-audit-report.md`](./ui-audit-report.md) | Full UI audit: typography, color, animation, layout, images, SEO, security, accessibility across 34 routes |
| [`ui-audit-remedy-plan.md`](./ui-audit-remedy-plan.md) | Phased remedy plan (Phase 0–5) with finding-to-phase mapping, acceptance checks, and rollback boundaries |

## Key Findings

### Critical (5)
- **Planner UI is visually superficial** — no entry animation, collapsed mobile hero, no kicker, constrained title measure
- **`--font-weight-semibold` = `--font-weight-medium`** — both 500, no visual distinction
- **No dark-mode semantic layer** — `themeColor` declared dark but zero `prefers-color-scheme: dark` rules
- **Triple semantic color collision** — `--color-warning`, `--color-accent`, `--color-whatsapp` all resolve to `bronze-400`
- **SEO titles exceed 60 chars** — `/` (67 chars), `/about` (71 chars)

### Quality Scores

| Category | Score |
|---|---|
| Typography system | 8/10 |
| Animation system | 8/10 |
| Color system | 7/10 |
| Layout & containers | 9/10 |
| Images | 6/10 |
| SEO | 7/10 |
| Security | 8/10 |
| Accessibility | 7/10 |
| **Planner specifically** | **4/10** |

### Issue Register Summary
- **33 findings** (UI-001 through UI-033)
- 7 Critical (🔴), 15 Medium (🟡), 8 Low (🟢), 3 Verified/Pass (✅)
- 3 verified complete: UI-009 (FAQ schema), UI-023 (logo image), UI-024 (OG dimensions)

### Remedy Phases

| Phase | Focus | Findings |
|---|---|---|
| Phase 0 | Baseline and evidence lock | All — no code changes |
| Phase 1 | Token and semantic foundation | UI-005, UI-006, UI-007, UI-019, UI-025–UI-030, UI-033 |
| Phase 2 | Planner visual hierarchy and responsive | UI-003, UI-004, UI-012–UI-016, UI-031, UI-032 |
| Phase 3 | Interaction, focus, motion accessibility | UI-017, UI-018, UI-020–UI-022 |
| Phase 4 | SEO metadata, structured data, images | UI-001, UI-002, UI-008, UI-010, UI-011 |
| Phase 5 | Validation and release handoff | All phases verified |

## Pages Audited (34 routes)
`/`, `/about`, `/career`, `/clients`, `/compare`, `/contact`, `/downloads`, `/planning`, `/planner`, `/planner/features`, `/planner/features/[slug]`, `/planner/help`, `/products`, `/products/[category]`, `/products/[category]/[product]`, `/quote-cart`, `/service`, `/showrooms`, `/sustainability`, `/trusted-by`, `/solutions`, `/solutions/[category]`, `/terms`, `/privacy`, `/refund-and-return-policy`, `/tools/office-space-calculator`, `/tools/meeting-room-capacity-calculator`, `/portal`, `/portal/guest`, `/portal/[id]`, `/choose-product`, `/access`, `/not-found`, `/error`

## Data Sources
- FOCSS CSS token system (`site/focss/`)
- Route metadata (`site/features/site/data/routeMetadata.ts`, `site/lib/helpers/seo.ts`)
- Component CSS and page.tsx files across all 34 routes
- JSON-LD structured data helpers
- Animation keyframes and motion tokens
