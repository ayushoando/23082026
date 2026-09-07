# Phase 0 Survey: Public Marketing & Client Hub Surfaces

**Report ID**: `SURVEY-M0-PUB-01`  
**Phase**: Phase 0 (Baseline Architectural & Surface Survey)  
**Surface Scope**: 17 Public Marketing Routes & Client Hub (`/`, `/about`, `/clients`, `/trusted-by`, `/products`, `/products/[category]`, `/products/[category]/[product]`, `/contact`, `/career`, `/downloads`, `/faq`, `/sustainability`, `/terms`, `/privacy`, `/refund-and-return-policy`, `/choose-product`, `/compare`)  
**Source Agent**: `explorer_survey_1` (`cbad719c-bc1a-409f-a484-33ae722d1171`)  
**Timestamp**: 2026-09-06T19:40:00Z  
**Status**: Completed & Verified  

---

## 1. Executive Summary

A comprehensive, non-destructive survey was conducted across all 17 public marketing and client hub routes in `site/app/(site)/`. The audit examined responsive layout stability across 5 canonical viewports (390px, 768px, 1080px, 1440px, 1920px), mobile chrome collision risks on small viewports (<768px and 390w), FOCSS design system token adherence, touch target dimensions against the >=48×48px standard, and iconography compliance with `@phosphor-icons/react`.

While the underlying FOCSS CSS graph and theme tokens are architecturally sound (151 CSS files, 0 cycles, 0 scheme freeze violations), three critical mobile chrome stacking defects were discovered on viewports under 768px:
1. The sticky Product Detail Page (PDP) mobile action bar (`.pdp-mobile-bar`, z-index 40) was completely occluded beneath the fixed global bottom tab bar (`.mobile-tab-bar`, z-index 60) at `bottom: 0`.
2. The product comparison dock (`CompareDock.tsx`, z-index 40) positioned at `bottom: 1rem` (16px) was occluded by the 56px (`3.5rem`) mobile tab bar.
3. Floating Action Buttons (FABs) were elevated upward by 4.5rem to ~8.5rem (136px) above the bottom edge when the Cookie Consent Bar was active, crowding vertical screen space on 390w viewports rather than being suppressed.

---

## 2. Key Empirical Findings

### 2.1 PDP Mobile Bar vs. Mobile Tab Bar Occlusion
- **File**: `site/focss/site/components/products/pdp-cta.css` (lines 138–154)
- **Defect Code**:
  ```css
  .pdp-mobile-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-surface);
    border-top: 1px solid var(--border-subtle);
  }
  ```
- **Conflict**: `site/focss/site/components/chrome/app-shell.css` (lines 10–38) defines `.mobile-tab-bar` with `position: fixed; bottom: 0; z-index: 60; height: calc(3.5rem + env(safe-area-inset-bottom, 0px));`. Because `z-index: 60 > 40` and both anchor to `bottom: 0`, the mobile tab bar completely covers the PDP "Add to quote" CTA and pricing summary on viewports `< 768px`.
- **Impact**: Crucial conversion actions unreachable on mobile screens.

### 2.2 CompareDock Mobile Overlap
- **File**: `site/components/products/CompareDock.tsx` (line 30)
- **Defect Code**:
  ```tsx
  <aside
    aria-label="Product comparison dock"
    className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-1rem)] -translate-x-1/2 rounded-xl ..."
  >
  ```
- **Conflict**: `bottom-4` equates to `1rem` (16px). The mobile tab bar has a height of `3.5rem` (56px) with `z-index: 60`. The dock's primary action button ("Compare") and "Clear" button sit directly behind the global bottom tab bar.
- **Impact**: Severe tap interference; users cannot clear or execute product comparisons on 390w mobile devices.

### 2.3 FAB Elevation vs. Suppression During Cookie Consent
- **File**: `site/focss/site/components/chrome/shell-site-fabs.css` (lines 67–76)
- **Defect Code**:
  ```css
  body:has([data-cookie-consent-bar]) {
    --site-fab-bottom: calc(
      var(--mobile-tab-bar-height, 0px) +
      4.5rem +
      var(--spacing-sm, 0.5rem)
    );
  }
  ```
- **Conflict**: Requirement R2/R3 explicitly directs that FABs must be suppressed (`display: none !important;`) rather than pushed upward into the middle of the viewport on viewports `< 768px`. The upward elevation of 8.5rem (136px) obscures primary page copy on 390w screens.

### 2.4 Raw Inline SVGs in Marketing Components
- **Files**:
  - `site/components/site/Footer.tsx` (lines 18–32): Raw inline `<svg>` elements used for Facebook and YouTube social media icons.
  - `site/components/site/SiteErrorBoundary.tsx` (lines 72–84): Raw inline `<svg>` warning triangle icon.
- **Conflict**: Violates the repo standard mandating `@phosphor-icons/react` or centralized SVG asset wrappers.

### 2.5 Mobile Touch Target Baseline Discrepancies (<48×48px)
- **Files**:
  - `site/focss/site/components/shared/mobile-tap-targets.css` (lines 5–25, 115): Sets `--mobile-tap-target-min-height: var(--control-height-sm, 2.75rem);` (44px) based on legacy Apple HIG, violating the mandatory WCAG 2.5.5 / R5 standard of 48×48px (`min-h-12` / `3rem`).
  - `site/focss/site/pages/home-premium-pass.css` (lines 280–285): `.home-hero-progress-btn` measured `2.25rem` (36px width) by `2.75rem` (44px height), presenting tap-miss hazards on mobile hero sliders.

---

## 3. Tool Verification Baseline

The following non-mutating validation tools were executed during the survey to establish the baseline health:
- `pnpm run verify:focss`: **PASS** (151 CSS files validated, 0 circular dependencies, 0 fence errors).
- `pnpm run lint:ui:strict`: **PASS** (Scheme freeze clean).
- `pnpm run check:style-tokens`: **PASS** (200 baseline findings accounted for in `config/quality/style-token-baseline.json`).
- `pnpm run check:layout`: **PASS** (Workspace structure verified).
- `pnpm run check:product-icons`: **PASS** (Zero unapproved icon packages).
- `pnpm run check:composer-styles`: **PASS** (Zero rogue composer classes).

---

## 4. Remediation Assignment

The findings from this survey were directly incorporated into the master feature inventory and scheduled as follows:
- **Milestone 1**: Resolve PDP mobile bar occlusion, CompareDock offset, FAB suppression under CookieConsentBar, and mobile chrome button sizing (48px).
- **Milestone 3**: Replace raw inline SVGs in `Footer.tsx` and `SiteErrorBoundary.tsx` with Phosphor icons, elevate marketing CTA buttons and hero slider buttons to 48px, normalize bracket classes, and execute the 17-route responsive audit.
