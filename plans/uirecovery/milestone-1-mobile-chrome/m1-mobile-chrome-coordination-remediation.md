# Milestone 1 Remediation: Mobile Chrome & App Shell Coordination (<768px and 390w)

**Report ID**: `M1-REMED-01`  
**Milestone**: Milestone 1 (Mobile Chrome & App Shell Coordination)  
**Assigned Worker**: `worker_m1` (`teamwork_preview_worker`)  
**Parent Conversation ID**: `c238c2af-347e-4a3e-a1a4-48c33e537b21`  
**Timestamp**: 2026-09-06T19:57:00Z  
**Status**: Completed & Verified  

---

## 1. Executive Summary

Milestone 1 delivered complete structural remediation for mobile chrome coordination, stacking contexts, and interactive touch targets across viewports under 768px (specifically optimized for the 390w mobile baseline). 

All 6 assigned files were modified with precision:
1. `site/focss/site/components/chrome/shell-site-fabs.css`: Implemented FAB suppression when `[data-cookie-consent-bar]` is active on viewports `< 768px`.
2. `site/focss/site/components/products/pdp-cta.css`: Fixed sticky PDP action bar stacking above `--mobile-tab-bar-height`.
3. `site/components/products/CompareDock.tsx`: Added dynamic bottom offset above `--mobile-tab-bar-height` and upgraded action buttons to 48px (`min-h-12`).
4. `site/focss/site/components/chrome/app-shell.css`: Upgraded top bar buttons (`.mobile-app-bar__menu`, `.mobile-app-bar__search`) to 48×48px (`3rem`) and added `[data-compare-dock]` mobile override.
5. `site/components/site/CookieConsentBar.tsx`: Upgraded all consent action buttons across all responsive breakpoints to 48px (`min-h-12`).
6. `site/components/site/Header.tsx`: Upgraded header hamburger button from 40×40px (`h-10 w-10`) to 48×48px (`h-12 w-12`).

Zero token drift was introduced (`check:style-tokens` matched the 200 baseline exactly), and all unit test suites covering the modified components passed cleanly.

---

## 2. Detailed Technical Remediations

### 2.1 FAB Suppression Under Cookie Consent (<768px)
- **Target File**: `site/focss/site/components/chrome/shell-site-fabs.css`
- **Previous Fault**: Lines 67–76 previously elevated `--site-fab-bottom` by `4.5rem`, pushing the WhatsApp and Assistant FABs ~8.5rem (136px) above the bottom edge, obscuring page copy on 390w devices.
- **Implemented Fix**:
  ```css
  @media (width < theme(--breakpoint-md)) {
    /* Suppress FAB when CookieConsentBar is active on mobile viewports (<768px) per R2/R3 */
    html:has([data-cookie-consent-bar]) .site-fab-launcher,
    body:has([data-cookie-consent-bar]) .site-fab-launcher,
    html:has([data-cookie-consent-bar]) .site-fab-anchor,
    body:has([data-cookie-consent-bar]) .site-fab-anchor {
      display: none !important;
    }
  }
  ```
- **Behavior**: On mobile screens (<768px), when the cookie consent bar is present in the DOM, FABs are completely suppressed (`display: none !important`). As soon as consent is accepted or dismissed, `CookieConsentBar.tsx` unmounts `[data-cookie-consent-bar]`, instantly restoring the FABs to their resting elevation above the tab bar. Desktop screens (>=768px) continue to raise the FAB without suppression.

### 2.2 Sticky PDP Mobile Bar Stacking Above Bottom Tab Bar
- **Target File**: `site/focss/site/components/products/pdp-cta.css`
- **Previous Fault**: `.pdp-mobile-bar` rendered at `z-index: 40` anchored to `bottom: 0`, completely hidden beneath `.mobile-tab-bar` (`z-index: 60`, height 56px).
- **Implemented Fix**:
  ```css
  html:has(.mobile-tab-bar) .pdp-mobile-bar,
  body:has(.mobile-tab-bar) .pdp-mobile-bar {
    bottom: var(--mobile-tab-bar-height, 3.5rem);
    padding-bottom: var(--space-3);
  }
  ```
- **Behavior**: `.pdp-mobile-bar` dynamically anchors directly on top of the 56px mobile tab bar whenever `.mobile-tab-bar` exists in the document, keeping the "Add to quote" button and pricing details fully visible and touch-accessible.

### 2.3 CompareDock Stacking Offset & 48px Buttons
- **Target Files**: `site/components/products/CompareDock.tsx` and `site/focss/site/components/chrome/app-shell.css`
- **Previous Fault**: `CompareDock` rested at `bottom-4` (16px), occluded behind the 56px tab bar, and action buttons measured 44px (`min-h-11`).
- **Implemented Fix**:
  In `CompareDock.tsx`:
  ```tsx
  style={{
    bottom: "calc(var(--mobile-tab-bar-height, 0rem) + 0.75rem)",
  }}
  ```
  Action buttons upgraded to:
  ```tsx
  className="btn-outline typ-body-sm inline-flex min-h-12 items-center gap-1.5 px-4"
  className="btn-primary typ-body-sm inline-flex min-h-12 items-center gap-2 px-4"
  ```
  In `app-shell.css`:
  ```css
  :root {
    --mobile-tab-bar-height: 0rem;
  }
  [data-compare-dock] {
    bottom: calc(var(--mobile-tab-bar-height, 3.5rem) + 0.75rem) !important;
  }
  ```
- **Behavior**: On mobile (<768px), the dock floats 12px (`0.75rem`) above the tab bar. On desktop, where `--mobile-tab-bar-height` defaults to `0rem`, it rests at `0.75rem` above the bottom edge. Action buttons strictly adhere to the 48px height standard.

### 2.4 Mobile Chrome Tap Target Normalization (>=48×48px)
1. **Top App Bar Buttons (`app-shell.css`)**:
   ```css
   .mobile-app-bar__menu,
   .mobile-app-bar__search {
     display: inline-flex;
     height: 3rem;
     width: 3rem;
     min-height: 3rem;
     min-width: 3rem;
     align-items: center;
     justify-content: center;
     color: var(--text-strong);
   }
   ```
   Upgraded from 44×44px (`2.75rem`) to 48×48px (`3rem`).
2. **CookieConsentBar Action Buttons (`CookieConsentBar.tsx`)**:
   ```tsx
   const consentActionBaseClass =
     "min-h-12 rounded-full px-2.5 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-12 sm:px-3 md:min-h-12 md:px-4 ...";
   ```
   Upgraded from 36px (`min-h-9`), 40px (`sm:min-h-10`), and 44px (`md:min-h-11`) to `min-h-12` (48px) across all breakpoints.
3. **Header Hamburger Button (`Header.tsx`)**:
   ```tsx
   className="site-header__hamburger shell-icon-button ml-1 h-12 w-12 shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
   ```
   Upgraded from 40×40px (`h-10 w-10`) to 48×48px (`h-12 w-12`).

---

## 3. Verification & Quality Gate Results

- `pnpm run verify:focss`: **PASS** (Exit code 0, 151 CSS files, 159 imports, 0 cycle errors).
- `pnpm run lint:ui:strict`: **PASS** (Exit code 0, scheme freeze clean).
- `pnpm run check:style-tokens`: **PASS** (Exit code 0, exactly 200 baseline findings, 0 increase).
- `pnpm run check:product-icons`: **PASS** (Exit code 0).
- `pnpm run typecheck:site`: **PASS** (Exit code 0).
- **Component Unit Tests**:
  - `CookieConsentBar.test.tsx` (5 passed)
  - `Header.test.tsx` (10 passed)
  - `WhatsAppCTA.test.tsx` (6 passed)
  - `UnifiedAssistant.test.tsx` (10 passed)
  - `CompareShortlistHydrator.test.tsx` (2 passed)
  - `productCompare.test.ts` (5 passed)
  - **Total**: 38 tests passed, 0 failed.
