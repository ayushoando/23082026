# Phase 0 Survey Synthesis: Feature & Remediation Inventory

**Report ID**: `SURVEY-M0-SYNTH-04`  
**Phase**: Phase 0 (Baseline Architectural & Surface Survey)  
**Document Source**: Project Architecture & Orchestrator Synthesis (`.agents/orchestrator_1/PROJECT.md`)  
**Timestamp**: 2026-09-06T19:50:00Z  
**Status**: Canonical Master Inventory  

---

## 1. System Architecture Overview

The repository hosts an enterprise Next.js commercial furniture application featuring a custom FOCSS design system (`@focss/*`), automated quality gates, and two strictly isolated CAD/geometry workspaces:

1. **Public Marketing & Client Hub**: `site/app/(site)/` (`/`, `/about`, `/clients`, `/trusted-by`, `/products`, `/products/[category]`, `/products/[category]/[product]`, `/contact`, `/career`, `/downloads`, `/faq`, `/sustainability`, `/terms`, `/privacy`, `/refund-and-return-policy`, `/choose-product`, `/compare`).
2. **Planning Tools**: `site/app/(site)/tools/` (`/tools`, `/tools/office-space-calculator`, `/tools/meeting-room-capacity-calculator`).
3. **Member & Portal**: `site/app/(site)/` (`/access`, `/login`, `/dashboard`, `/portal`, `/portal/[id]`, `/portal/guest`, `/portal/guest/view/[id]`, `/quote-cart`).
4. **Admin Surfaces**: `site/app/admin/` (`/admin`, `/admin/catalog`, `/admin/workspace-catalog`, `/admin/planner-catalog`, `/admin/inventory`, `/admin/price-books`, `/admin/crm/*`, `/admin/customer-queries`, `/admin/plans/*`, `/admin/analytics`, `/admin/settings`, `/admin/themes`, `/admin/design-kit`, `/admin/features`).
5. **Workspaces**: Furniture Studio `/oostudio` (`site/components/Studio`, scale `0.2 px/mm`) and Floor Planner `/ooplanner` (`site/components/Planner`, scale `0.05 px/mm`). Strictly separated with 0 cross-product import edges.
6. **Mobile Chrome & App Shell**: `MobileAppShell.tsx`, `MobileNavDrawer.tsx`, `Header.tsx`, `Footer.tsx`, `CookieConsentBar.tsx`, and `@focss/site/components/chrome/*`.

---

## 2. Complete 29-Item Feature & Defect Inventory

Every issue identified across the three parallel Explorer surveys and subsequent user directives was synthesized into the following master inventory:

| # | Feature / Remediation Item | Description | Milestone | Source |
|---|-----------------------------|-------------|-----------|--------|
| 1 | Multi-Viewport E2E Test Suite | Automated test runner verifying 0 overflow across 390w, 768w, 1080w, 1440w, 1920w | M0 | R1 |
| 2 | Mobile Tap Target Test Harness | Playwright/Vitest assertions verifying >=48×48px interactive touch targets | M0 | R5 |
| 3 | PDP Mobile Bar Occlusion Fix | Resolve `.pdp-mobile-bar` (z-40) hidden under `.mobile-tab-bar` (z-60) at bottom:0 | M1 | Survey (Exp 1) |
| 4 | CompareDock Occlusion Fix | Offset `CompareDock.tsx` above `--mobile-tab-bar-height` so it is not covered | M1 | Survey (Exp 1) |
| 5 | FAB CookieConsent Suppression | Suppress (`display: none !important`) FABs when CookieConsentBar active on <768px | M1 | R2, R3, Exp 1 & 3 |
| 6 | Mobile Chrome Tap Targets | Upgrade top bar buttons, menu toggle, and CookieConsentBar buttons to >=48px | M1 | R3, R5, Exp 3 |
| 7 | Mobile Drawer Menu Locking | Lock drawer strictly to 6 overflow links with search at top and clean dismiss | M1 | R3, Exp 3 |
| 8 | Calculator Gutter Fix | Replace undefined `.home-section__inner` with `.home-shell-xl` for 16px gutter on 390w | M2 | Survey (Exp 2) |
| 9 | `/access` Back Link Collision | Resolve absolute `.shell-access-back` overlapping logo on 390w/short viewports | M2 | Survey (Exp 2) |
| 10 | Quote Cart Steppers & CTAs | Upgrade `.quote-cart-qty__btn` (36px) and remove link to >=48px tap targets | M2 | R5, Survey (Exp 2) |
| 11 | Dashboard Hero Actions Styling | Style `.workspace-hub__primary-btn`, `ghost-btn`, `sign-out` with 48px height | M2 | Survey (Exp 2) |
| 12 | Portal & Access Token/Color Polish | Normalize raw white colors and bracket classes in `shell-portal.css` and `/access` | M2 | R4, Survey (Exp 2) |
| 13 | Phosphor Icon Normalization (Portal) | Replace direct Phosphor imports and inline SVGs with `PhIcon` + `phIconMap` | M2 | R4, Survey (Exp 2) |
| 14 | Marketing Raw SVG Migration | Replace raw inline SVGs in `Footer.tsx` and `SiteErrorBoundary.tsx` with Phosphor | M3 | R4, Survey (Exp 1) |
| 15 | Marketing Touch Target Polish | Upgrade `.home-hero-progress-btn` (36px), filter tabs, and pills to >=48px | M3 | R5, Survey (Exp 1) |
| 16 | Marketing Token Normalization | Remove arbitrary bracket classes in `HomepageHero`, marquee, and marketing cards | M3 | R4, Survey (Exp 1) |
| 17 | 17 Public Routes Viewport Audit | Eliminate horizontal overflow and clipping across all public marketing routes | M3 | R1, R2 |
| 18 | Admin Token Debt Reduction | Resolve 74 style-token violations in Admin & CRM components | M4 | R4, Survey (Exp 3) |
| 19 | Admin Layout Polish | Eliminate inline style in `crm/layout.tsx` and elevate mobile admin toggles to 48px | M4 | R4, R5, Exp 3 |
| 20 | Admin Inventory Data File | Connect/generate `results/app-pages-inventory.csv` for `/admin/inventory` | M4 | Survey (Exp 3) |
| 21 | Workspace Viewport Unit Modernization | Update `.oostudio-root .app-root` and `.ooplanner-root` from `100vh` to `100dvh` | M4 | Survey (Exp 3) |
| 22 | Workspace Token Normalization | Resolve 16 style-token violations in ViewportControls & Planner dialogs | M4 | R4, Survey (Exp 3) |
| 23 | Workspace Boundary Preservation | Strict fork boundary isolation verified via `scan:boundaries` (0 cross-imports) | M4 | R2, R6, Exp 3 |
| 24 | Global Button & Tap Target Standard | Upgrade `buttons.css` (`btn-primary`, `btn-outline`) and base utilities to 48px | M5 | R5 |
| 25 | Repository Quality Gate Clearance | Verify `verify:focss`, `lint:ui:strict`, `check:style-tokens`, `scan:boundaries`, `check:layout` | M5 | Acceptance Criteria |
| 26 | 100% E2E Multi-Viewport Test Pass | Verify 0 horizontal overflow across all routes at 390w, 768w, 1080w, 1440w, 1920w | M5 | Acceptance Criteria |
| 27 | Forensic Integrity Audit | Independent teamwork_preview_auditor integrity verification (CLEAN verdict) | M5 | Audit Requirement |
| 28 | Brand Rule & SEO Normalization | Enforce "One and Only" (No '&') across `brand.ts`, `routeMetadata.ts`, titles, OG, Schema | M3 | User Follow-up |
| 29 | i18n English/Hindi Parity Check | 100% parity across en/hi message catalogs, 0 untranslated English in Hindi views | M3 | User Follow-up |

---

## 3. Milestone Execution Sequence

| Milestone | Scope | Dependencies | Deliverables | Status |
|---|---|---|---|---|
| **M0** | E2E Testing Track | None | Multi-viewport test harness, `TEST_READY.md`, 2,394 test variations | **DONE** |
| **M1** | Mobile Chrome & App Shell | None | Header top bar, drawer menu, tab bar, PDP bar & CompareDock offset, FAB suppression | **DONE** |
| **M2** | Planning Tools & Portals | None | Calculator containers, `/access` collision, quote-cart steppers, dashboard hero, token polish | **DONE** |
| **M3** | Marketing, SEO & i18n | M1 | 17 public routes, SVG replacement, 48px CTAs, "One and Only" (No '&') rule, i18n parity | **IN PROGRESS** |
| **M4** | Admin & Workspaces | None | 14 admin routes, 74 admin token debt, 100dvh workspaces, boundary preservation | **PLANNED** |
| **M5** | Global Hardening & Verification | M0–M4 | Global 48px button standard, style-token ratchet, 100% test pass, final forensic audit | **PLANNED** |
