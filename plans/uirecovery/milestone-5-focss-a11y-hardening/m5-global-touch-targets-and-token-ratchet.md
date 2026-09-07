# Milestone 5 Hardening: Global Touch Targets & Token Ratchet

**Report ID**: `M5-HARDEN-01`  
**Milestone**: Milestone 5 (Global FOCSS Token Normalization & a11y Touch Target Hardening)  
**Surface Scope**: Sitewide Components, Utility Base Styles, Quality Gates  
**Derived From**: Master Feature Inventory (`PROJECT.md`) & Quality Handbooks  
**Timestamp**: 2026-09-07T01:25:00Z  
**Status**: Scheduled & Specified  

---

## 1. Executive Summary

Milestone 5 represents the final consolidation and hardening phase of the UI recovery initiative. It upgrades global base button utilities to the mandatory 48px height floor, ratchets down the repository style token baseline in `config/quality/style-token-baseline.json`, executes full 100% E2E multi-viewport test runs across all 44 routes, and prepares the codebase for final forensic certification.

---

## 2. Key Objectives & Work Packages

### 2.1 Work Package 1: Global Button & Utility Tap Target Upgrade
- **Target File**: `site/focss/site/components/shared/buttons.css`
- **Current Baseline**: Base utility classes `.btn-primary`, `.btn-outline`, `.btn-outline-light`, `.btn-accent`, and `.home-btn-secondary` hardcode `min-height: 2.75rem;` (44px).
- **Remediation**:
  - Elevate base `min-height` to `3rem` (48px / `var(--control-height-md)`).
  - Update `site/focss/site/components/shared/mobile-tap-targets.css`:
    ```css
    --mobile-tap-target-min-height: var(--control-height-md, 3rem);
    --mobile-tap-target-min-width: var(--control-height-md, 3rem);
    ```
  - Remove all remaining `:not()` exclusions that allow sub-48px interactive targets on mobile viewports.

### 2.2 Work Package 2: Style Token Ratchet Downward Ratchet
- **Target File**: `config/quality/style-token-baseline.json`
- **History & Progress**:
  - Initial baseline: **200 findings**
  - Post-Milestone 2: **190 findings** (-10 reduction from Dashboard & Portal)
  - Post-Milestone 3: Expected reduction to ~130 findings (Marketing bracket cleanup)
  - Post-Milestone 4: Expected reduction to <= 98 findings (Admin & Workspace token cleanup)
- **Remediation**:
  - Run `node scripts/general/check-style-tokens.mjs --update` once all milestone cleanups land.
  - Permanently lock the ratchet baseline to the new lower threshold, preventing future token regressions.

### 2.3 Work Package 3: Sitewide 100% Multi-Viewport E2E Test Execution
- **Target Test Suite**: `tests/e2e/multi-viewport-comprehensive.spec.ts`
- **Verification Invariants**:
  1. **Zero Horizontal Scrollbar**:
     - `scrollWidth <= clientWidth` on all 44 routes across 390px, 768px, 1080px, 1440px, and 1920px viewports.
  2. **Zero Sub-48px Mobile Touch Targets**:
     - All interactive elements on 390w screens pass `auditMobileTouchTargets`.
  3. **Full Chrome Coordination**:
     - 100% pass on PDP mobile bar stacking, CompareDock elevation, and FAB suppression under CookieConsentBar.

---

## 3. Milestone Completion Criteria

1. `pnpm run verify:focss`: Exit code 0.
2. `pnpm run lint:ui:strict`: Exit code 0.
3. `pnpm run check:style-tokens`: Exit code 0 (finding count <= 98).
4. `pnpm run scan:boundaries`: Exit code 0 (0 cross-product edges).
5. `pnpm run check:layout`: Exit code 0.
6. Full E2E test pass across 2,394 test variations in `multi-viewport-comprehensive.spec.ts`.
7. Final Independent Forensic Integrity Audit verdict: **CLEAN**.
