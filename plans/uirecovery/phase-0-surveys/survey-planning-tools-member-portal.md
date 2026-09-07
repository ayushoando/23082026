# Phase 0 Survey: Planning Tools & Member/Portal Surfaces

**Report ID**: `SURVEY-M0-PLAN-02`  
**Phase**: Phase 0 (Baseline Architectural & Surface Survey)  
**Surface Scope**: Planning Tools (`/tools`, `/tools/office-space-calculator`, `/tools/meeting-room-capacity-calculator`) and Member & Portal Surfaces (`/access`, `/login`, `/dashboard`, `/portal`, `/portal/[id]`, `/portal/guest`, `/portal/guest/view/[id]`, `/quote-cart`)  
**Source Agent**: `explorer_survey_2` (`a391a8b1-86ac-4d06-b5db-543417f244cc`)  
**Timestamp**: 2026-09-06T19:42:00Z  
**Status**: Completed & Verified  

---

## 1. Executive Summary

A comprehensive investigation was executed across the Planning Tools and Member/Portal surface areas. These surfaces represent high-interaction functional hubs where users configure spaces, estimate workstation counts, authenticate, manage project quotes, and view saved plans.

The survey discovered significant container, positioning, and touch target deficiencies:
1. Both calculator routes (`/tools/office-space-calculator` and `/tools/meeting-room-capacity-calculator`) declared an undefined container class (`.home-section__inner`), resulting in 0px horizontal padding on 390w screens and unbound full-bleed expansion on 1920w displays.
2. In `/access`, the back navigation link (`.shell-access-back`) was absolutely positioned at `top: 2rem; left: 2rem;` directly colliding with the brand logo in `.shell-access-form-wrap` on short or mobile viewports.
3. Quantity stepper buttons in the Quote Cart (`.quote-cart-qty__btn`) were restricted to 36×36px (`2.25rem`), the Remove CTA had an interactive height of ~20px, and dashboard hero buttons (`.workspace-hub__primary-btn`, `ghost-btn`, `sign-out`) lacked layout rules, dimensions, and padding.
4. Portal stylesheets and dashboard components contained multiple raw `white` color declarations and arbitrary bracket classes (`rounded-[1.35rem]`, `min-h-[11rem]`), which violated the ecru paper design language and FOCSS token standards.

---

## 2. Key Empirical Findings

### 2.1 Undefined Container Class & Missing Gutters at 390w and 1920w
- **Files**:
  - `site/app/(site)/tools/office-space-calculator/page.tsx:78`
  - `site/app/(site)/tools/meeting-room-capacity-calculator/page.tsx:78`
- **Defect Code**:
  ```tsx
  <div className="home-section__inner">
  ```
- **Analysis**: A ripgrep scan of `site/focss/` revealed 0 definitions for `home-section__inner`. Consequently, browsers treated the container as an unpadded block element. At 390px viewport width, calculator cards collided with the screen edges (0px gutter). At 1920px, the calculators stretched unbounded across the monitor.
- **Canonical Standard**: `site/focss/site/components/homepage/home-layout.css` defines `.home-shell-xl`, which enforces `padding-inline: var(--space-4)` (16px) on mobile and clamps maximum width to `var(--container-home-max)` (1440px / 82.5rem).

### 2.2 Mobile Layout Collision in `/access`
- **Files**:
  - `site/focss/site/components/chrome/shell-access.css:15-27`
  - `site/app/(site)/access/AccessSignInView.tsx:86-93`
- **Defect Code**:
  ```css
  .shell-access-back {
    position: absolute;
    top: 2rem;
    left: 2rem;
  }
  .shell-access-form-wrap {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  ```
- **Analysis**: The absolute positioning of `.shell-access-back` placed it at fixed viewport coordinates `(32px, 32px)`. In `AccessSignInView.tsx`, the centered form panel container also had `2rem` (32px) padding, placing the "One and Only" brand logo directly over the back link on 390px mobile screens or landscape phones.

### 2.3 Sub-48px Touch Targets Across Interactive Workflows
- **Quote Cart Quantity Stepper**:
  - File: `site/focss/site/components/quote-cart/quote-cart-page.css:130-137`
  - Code: `.quote-cart-qty__btn { width: 2.25rem; height: 2.25rem; }` -> Exactly 36×36px (violates >=48×48px).
- **Quote Cart Remove Item Action**:
  - File: `site/app/(site)/quote-cart/page.tsx:218-226`
  - Code: Unpadded inline text link with a 14px trash icon; rendered tap height ~20px.
- **Dashboard Action Buttons**:
  - File: `site/focss/site/components/products/workspace-hub.css:57-71`
  - Code: `.workspace-hub__primary-btn` and `ghost-btn` defined only background and text colors; no `min-height`, no `padding`, no `border-radius`. Rendered interactive height ~20px.
- **Portal Navigation and Back Controls**:
  - File: `site/focss/site/components/chrome/shell-portal.css:219, 238, 266`
  - Code: Hardcoded `min-height: 2.75rem;` (44px) on primary, secondary, and SVG catalog back buttons.
  - File: `site/features/site/portal/PortalPlanPageView.tsx:26-28`
  - Code: Inline unpadded `← All plans` link (~20px tap height) using a raw unicode arrow.

### 2.4 FOCSS Token Normalization & Icon Gaps
- **Arbitrary Bracket Classes**:
  - `site/features/shared/dashboard/DashboardClient.tsx`: `rounded-[1.35rem]`, `min-h-[11rem]`, `tracking-[0.1em]`, `rounded-[2rem]`, `z-[1]`, `text-[0.6875rem]`.
  - `site/features/site/portal/PortalPlanPageView.tsx:12, 25`: `min-h-[40vh]`.
- **Raw Color Declarations**:
  - `site/focss/site/components/chrome/shell-portal.css:68, 78, 127, 149, 163`: Hardcoded raw `white` and `color-mix(in srgb, white 95%, transparent)`.
  - `site/focss/site/components/products/workspace-hub.css:99`: Raw `white` in `color-mix(in srgb, var(--color-primary) 12%, white)`.
- **Icon Architecture**:
  - Bare unicode glyphs used instead of Phosphor icons: `←` in `PortalPlanPageView.tsx` and `−`, `+` in `NumberStepper.tsx`.
  - Direct imports from `@phosphor-icons/react` in `/tools/page.tsx`, `AccessSignInView.tsx`, and `DashboardClient.tsx` bypassing `phIconMap` + `PhIcon`.

---

## 3. Remediation Assignment

The survey recommendations were assigned to **Milestone 2**:
1. Update calculator pages to use `.home-shell-xl` for consistent 16px mobile gutters and 1440px desktop constraint.
2. Restructure `.shell-access-back` to flow naturally on mobile (`position: relative`) and absolute on desktop (`>=md`).
3. Upgrade quote cart steppers, Remove CTA, and dashboard actions to >=48×48px.
4. Normalize arbitrary bracket classes to semantic tokens, replace raw `white` with `--surface-page` / `--surface-panel`, and migrate bare text glyphs to `PhIcon`.
