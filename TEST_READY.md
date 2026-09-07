# TEST_READY: Milestone 0 — Multi-Viewport Comprehensive E2E Test Suite

## Overview
Milestone 0 delivers the comprehensive multi-viewport E2E audit suite and testing infrastructure for the Oando platform.
The test suite implements opaque-box verification derived strictly from `ORIGINAL_REQUEST.md`, `PROJECT.md`, and `TEST_INFRA.md`.

## Test File
- **Source**: `tests/e2e/multi-viewport-comprehensive.spec.ts`
- **Runner**: Playwright (`@playwright/test`)
- **Config**: `config/build/playwright.config.ts`

---

## Test Execution Commands

### 1. Full Multi-Viewport Comprehensive Suite (All Viewports & Routes)
```bash
cross-env DEV_AUTH_BYPASS=1 pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/multi-viewport-comprehensive.spec.ts
```

### 2. Priority 1 — 390w Mobile Baseline First (Audited First)
```bash
cross-env DEV_AUTH_BYPASS=1 pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/multi-viewport-comprehensive.spec.ts -g "390px Mobile Baseline"
```

### 3. Mobile Chrome Coordination & Stacking Only
```bash
cross-env DEV_AUTH_BYPASS=1 pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/multi-viewport-comprehensive.spec.ts -g "Mobile Chrome Coordination"
```

### 4. Mobile Touch Targets (>=48x48px) Only
```bash
cross-env DEV_AUTH_BYPASS=1 pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/multi-viewport-comprehensive.spec.ts -g "Mobile Touch Target Standard"
```

### 5. Specific Viewport Runs
```bash
# 768w Tablet
pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/multi-viewport-comprehensive.spec.ts -g "768px"

# 1080w Narrow Desktop
pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/multi-viewport-comprehensive.spec.ts -g "1080px"

# 1440w Standard Desktop
pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/multi-viewport-comprehensive.spec.ts -g "1440px"

# 1920w Full Desktop
pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/multi-viewport-comprehensive.spec.ts -g "1920px"
```

---

## Canonical Viewports Specification
All tests explicitly enforce the 5 canonical viewports:
1. **390px** (`390x844`): Mobile Baseline (iPhone 12/13/14) — **audited first** per user mandate
2. **768px** (`768x1024`): Compact Portrait / Tablet breakpoint
3. **1080px** (`1080x800`): Narrow Desktop / 1080p Landscape
4. **1440px** (`1440x900`): Standard Desktop Reference
5. **1920px** (`1920x1080`): Full-Width High-Resolution Desktop

---

## Coverage Summary Across Tiers 1–4

| Tier | Focus | Scope | Invariants Verified | Status |
|---|---|---|---|:---:|
| **Tier 1** | **Coverage & Breadth** | 44 routes across 5 surfaces (Marketing, Tools, Portal, Admin, Workspaces) | Complete route availability, hydration stability, DOM readiness across 5 viewports | Ready |
| **Tier 2** | **Boundary & Layout Integrity** | Extreme viewport widths: 390w, 768w, 1080w, 1440w, 1920w | Strict `documentElement.scrollWidth <= documentElement.clientWidth` (0px horizontal overflow) | Ready |
| **Tier 3** | **Cross-Feature Coordination** | Mobile Chrome Stacking & Coordination | 1. `.mobile-tab-bar` does not occlude `.pdp-mobile-bar`<br>2. `.mobile-tab-bar` does not occlude `CompareDock`<br>3. `.site-fab-launcher` suppressed when CookieConsentBar is active<br>4. `.mobile-app-bar` renders cleanly with 0 overflow | Ready |
| **Tier 4** | **Workload & Accessibility Stress** | Full interactive node audit on 390w mobile | Minimum 48×48px (`MIN_TOUCH_TARGET = 48`) touch target standard on buttons, links, and inputs | Ready |

---

## Feature Inventory Checklist & Milestone Mapping

| # | Feature / Remediation Item | Target Milestone | Multi-Viewport Test Assertion |
|---|---|:---:|---|
| 1 | Multi-Viewport E2E Test Suite | M0 | `tests/e2e/multi-viewport-comprehensive.spec.ts` covers 44 routes across 5 viewports |
| 2 | Mobile Tap Target Test Harness | M0 | `auditMobileTouchTargets` asserts `>=48x48px` standard across all interactive elements on 390w |
| 3 | PDP Mobile Bar Occlusion Fix | M1 | Verifies `.mobile-tab-bar` does not overlap or occlude `.pdp-mobile-bar` bounding box on PDP |
| 4 | CompareDock Occlusion Fix | M1 | Verifies `.mobile-tab-bar` does not overlap or occlude `CompareDock` bounding box |
| 5 | FAB CookieConsent Suppression | M1 | Verifies `.site-fab-launcher` count is 0 when `CookieConsentBar` is active on `<768px` |
| 6 | Mobile Chrome Tap Targets | M1 | Verifies header, drawer, and tab bar controls meet 48×48px standard |
| 7 | Mobile Drawer Menu Locking | M1 | Verifies mobile drawer overlay, dismiss, and overflow link navigation |
| 8 | Calculator Gutter Fix | M2 | Verifies 16px gutter with 0 horizontal overflow on 390w (`/tools/*`) |
| 9 | `/access` Back Link Collision | M2 | Verifies 0 collision between `.shell-access-back` and branding at 390w |
| 10 | Quote Cart Steppers & CTAs | M2 | Verifies quote cart quantity buttons and action links meet 48px tap targets |
| 11 | Dashboard Hero Actions Styling | M2 | Verifies workspace hub primary and ghost buttons meet 48px tap target standards |
| 12 | Portal & Access Token/Color Polish | M2 | Verifies portal layout and color tokens render with 0 overflow |
| 13 | Phosphor Icon Normalization (Portal) | M2 | Verifies zero icon render breaks or missing glyphs in portal views |
| 14 | Marketing Raw SVG Migration | M3 | Verifies footer and site chrome render without DOM SVG errors |
| 15 | Marketing Touch Target Polish | M3 | Verifies carousel controls, filter pills, and tabs meet 48px standard |
| 16 | Marketing Token Normalization | M3 | Verifies marketing cards and hero sections render cleanly at all 5 viewports |
| 17 | 17 Public Routes Viewport Audit | M3 | Verifies 0 horizontal overflow across all 17 public routes at 390w, 768w, 1080w, 1440w, 1920w |
| 18 | Admin Token Debt Reduction | M4 | Verifies admin surfaces render with 0 layout shift or token errors |
| 19 | Admin Layout Polish | M4 | Verifies mobile admin navigation toggles meet 48px standards with 0 overflow |
| 20 | Admin Inventory Data File | M4 | Verifies `/admin/inventory` renders table data without horizontal document overflow |
| 21 | Workspace Viewport Modernization | M4 | Verifies `/oostudio` and `/ooplanner` adopt modern dynamic viewport units (`100dvh`) |
| 22 | Workspace Token Normalization | M4 | Verifies dialog and toolbar layout integrity |
| 23 | Workspace Boundary Preservation | M4 | Independent route tests confirm 0 cross-product leakage |
| 24 | Global Button & Tap Target Standard | M5 | Full site-wide pass of `auditMobileTouchTargets` with 0 offenders |
| 25 | Repository Quality Gate Clearance | M5 | Full release gate pass (`pnpm run gate`) |
| 26 | 100% E2E Multi-Viewport Test Pass | M5 | 100% green run of `multi-viewport-comprehensive.spec.ts` |
| 27 | Forensic Integrity Audit | M5 | Independent auditor inspection verifying clean compliance |

---

## Pre-Execution Verification
- Playwright spec registration confirmed via `pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/multi-viewport-comprehensive.spec.ts --list`.
- All 2,394 test variations across projects and viewports resolved with 0 syntax or type errors.
- Milestone 0 E2E test harness is published, isolated, and ready for progressive execution across M1–M5.
