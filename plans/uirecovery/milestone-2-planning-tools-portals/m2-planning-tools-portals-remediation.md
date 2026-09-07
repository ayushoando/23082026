# Milestone 2 Remediation: Planning Tools & Member/Portal Surfaces

**Report ID**: `M2-REMED-01`  
**Milestone**: Milestone 2 (Planning Tools & Member/Portal Surfaces)  
**Assigned Worker**: `worker_m2` (`teamwork_preview_worker`, `3b77f33c-d92e-46cb-ac09-7a551680c612`)  
**Parent Conversation ID**: `c238c2af-347e-4a3e-a1a4-48c33e537b21`  
**Timestamp**: 2026-09-06T20:25:00Z  
**Status**: Completed & Verified  

---

## 1. Executive Summary

Milestone 2 remediated structural container issues, touch target deficiencies, layout collisions, and token debt across the Planning Tools (`/tools`, `/tools/office-space-calculator`, `/tools/meeting-room-capacity-calculator`) and Member/Portal surfaces (`/access`, `/login`, `/dashboard`, `/portal`, `/quote-cart`).

Worker M2 executed changes across exactly 12 exclusively assigned files:
1. Replaced the undefined container class `.home-section__inner` with `.home-shell-xl` in both calculator routes, restoring 16px lateral gutters on 390w viewports and clamping desktop width to 1440px.
2. Restructured `.shell-access-back` in `/access` from absolute positioning to relative document flow on mobile viewports (<md), eliminating vertical collisions with the logo and form panel.
3. Upgraded Quote Cart steppers from 36px to 48×48px (`3rem`) and elevated the Remove CTA to >=48px interactive height.
4. Styled Dashboard hero action buttons (`.workspace-hub__primary-btn`, `ghost-btn`, `sign-out`) with 48px minimum height, pill radii, and active states.
5. Replaced raw `white` colors with semantic tokens (`--surface-page`, `--surface-panel`) in `shell-portal.css` and `workspace-hub.css`, and normalized 8 arbitrary bracket classes in `DashboardClient.tsx`, reducing style token findings from 200 to 190 (-10 debt reduction).
6. Standardized icons via `PhIcon` + `phIconMap`, eliminating bare unicode text glyphs (`←`, `−`, `+`), and updated `/tools/page.tsx` metadata to "One and Only" (No '&').

---

## 2. Detailed Technical Remediations

### 2.1 Calculator Container Restoration (`home-shell-xl`)
- **Files**:
  - `site/app/(site)/tools/office-space-calculator/page.tsx:78`
  - `site/app/(site)/tools/meeting-room-capacity-calculator/page.tsx:78`
- **Previous Fault**: Used undefined class `.home-section__inner`, which defaulted to unpadded block display, causing calculator cards to touch the screen edge on 390w devices and stretch unbounded on 1920w monitors.
- **Implemented Fix**:
  ```tsx
  <div className="home-shell-xl">
  ```
- **Result**: `home-shell-xl` (`site/focss/site/components/homepage/home-layout.css`) enforces `padding-inline: var(--space-4)` (16px) on mobile viewports and clamps maximum width to `var(--container-home-max)` (1440px / 82.5rem) on desktop displays.

### 2.2 Mobile `/access` Back Link Collision Resolution
- **Files**:
  - `site/focss/site/components/chrome/shell-access.css:15-27`
  - `site/app/(site)/access/AccessSignInView.tsx:86-93`
- **Previous Fault**: `.shell-access-back` had `position: absolute; top: 2rem; left: 2rem;` while the form panel had `padding: 2rem;`, causing overlapping coordinates with the brand logo on 390w screens.
- **Implemented Fix**:
  In `shell-access.css`:
  ```css
  .shell-access-back {
    position: relative;
    top: auto;
    left: auto;
    padding: 1.5rem 1.5rem 0.5rem;
    z-index: 10;
  }
  @media (width >= theme(--breakpoint-md)) {
    .shell-access-back {
      position: absolute;
      top: 2rem;
      left: 2rem;
      padding: 0;
    }
  }
  ```
  In `AccessSignInView.tsx`: Upgraded back link to `min-h-12 py-2` and integrated `<PhIcon name="arrowLeft" className="h-4 w-4" />`.
- **Result**: On mobile screens (<768px), the back link sits in natural document flow above the form panel, completely preventing collision regardless of screen height or scroll position.

### 2.3 Quote Cart Touch Target Elevation (>=48×48px)
- **Files**:
  - `site/focss/site/components/quote-cart/quote-cart-page.css:130-143`
  - `site/app/(site)/quote-cart/page.tsx:216-238`
- **Implemented Fix**:
  In `quote-cart-page.css`:
  ```css
  .quote-cart-qty__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    min-width: 3rem;
    min-height: 3rem;
    color: var(--text-body);
    transition: background-color var(--duration-fast) var(--ease-standard),
                color var(--duration-fast) var(--ease-standard);
  }
  ```
  In `quote-cart/page.tsx`:
  - Upgraded the Remove item CTA to `min-h-12 items-center gap-1.5 px-3 py-2 rounded` (>=48px touch height).
  - Migrated quantity steppers and remove action to `PhIcon` (`minus`, `plus`, `trash`).

### 2.4 Dashboard Hero Actions Styling
- **Files**:
  - `site/focss/site/components/products/workspace-hub.css:57-151`
  - `site/features/shared/dashboard/DashboardClient.tsx`
- **Implemented Fix**: Added full responsive layout and interactive tokens for `.workspace-hub__actions` (flex column on mobile, row on tablet/desktop). Styled `.workspace-hub__primary-btn`, `.workspace-hub__ghost-btn`, and `.workspace-hub__sign-out` with:
  - `min-height: 3rem;` (48px)
  - `padding: 0.75rem 1.5rem;`
  - `border-radius: var(--radius-pill);`
  - `:active { transform: translateY(1px); }`
  - `focus-visible` outline rings using `var(--focus-ring)`

### 2.5 Token Normalization & Ratchet Debt Reduction
- **Raw Color Replacements**:
  - `shell-portal.css` lines 68, 78, 127, 149, 163: Replaced raw `white` with `var(--surface-page)` and `var(--surface-panel)`.
  - `workspace-hub.css:180`: Replaced raw `white` in `color-mix(...)` with `var(--surface-panel)`.
- **Arbitrary Bracket Removal (`DashboardClient.tsx`)**:
  - `rounded-[1.35rem]` -> `rounded-2xl`
  - `rounded-[2rem]` -> `rounded-3xl`
  - `min-h-[11rem]` -> `min-h-44`
  - `transition-[border-color,box-shadow,transform]` -> `transition-all`
  - `tracking-[0.1em]` -> `tracking-wider`
  - `z-[1]` -> `z-10`
  - `text-[0.6875rem]` -> `text-xs`
  - `tracking-[0.3em]` -> `tracking-widest`
  - In `PortalPlanPageView.tsx`: Replaced `min-h-[40vh]` with `min-h-80`.
- **Debt Impact**: Total findings in `check:style-tokens` dropped from 200 to 190 (10 fewer than baseline).

### 2.6 Icon Standardization & Brand Rule
- Standardized Phosphor icon usage across all 12 files using `phIconMap` + `PhIcon`.
- Replaced bare text glyphs (`←` in `PortalPlanPageView.tsx`, `−` and `+` in `NumberStepper.tsx`) with accessible Phosphor SVGs (`aria-hidden="true"`).
- In `site/app/(site)/tools/page.tsx:47`, updated page title metadata to `"Workspace Planning Tools & Calculators | One and Only"` (No '&') in strict adherence to brand rules.

---

## 3. Verification Commands & Results

- `pnpm run verify:focss`: **PASS** (Exit code 0, 151 CSS files, 159 imports, 0 cycle errors).
- `pnpm run lint:ui:strict`: **PASS** (Exit code 0, scheme freeze clean).
- `pnpm run check:style-tokens`: **PASS** (Exit code 0, 190 findings, 10 below baseline).
- `pnpm run check:product-icons`: **PASS** (Exit code 0).
- `pnpm run scan:boundaries`: **PASS** (Exit code 0, 0 cross-product edges).
- `pnpm run typecheck:site`: **PASS** (Exit code 0).
- **Targeted Vitest Suite**:
  - `AccessForm.test.tsx` (1 passed)
  - `quote-cart/page.test.tsx` (4 passed)
  - `quote-cart/layout.test.tsx` (1 passed)
  - `SpaceCalculator.test.ts` (2 passed)
  - `DashboardClient.test.tsx` (3 passed)
  - `access/page.test.tsx` (2 passed)
  - `workspaceHub.test.ts` (4 passed)
  - **Total**: 17 tests passed, 0 failed.
