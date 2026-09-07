# Phase 0 Survey: Admin Surfaces, Workspaces & Mobile Chrome Coordination

**Report ID**: `SURVEY-M0-ADM-03`  
**Phase**: Phase 0 (Baseline Architectural & Surface Survey)  
**Surface Scope**: Admin Surfaces (14 routes in `site/app/admin/`), Interactive Workspaces (`/oostudio` and `/ooplanner`), and Mobile Chrome & App Shell Coordination (<768px and 390w)  
**Source Agent**: `explorer_survey_3` (`d4255184-242c-4174-9bd3-80679ebe9131`)  
**Timestamp**: 2026-09-06T19:45:00Z  
**Status**: Completed & Verified  

---

## 1. Executive Summary

A comprehensive architectural audit was performed covering Admin surfaces, the forked geometry workspaces (Furniture Studio and Floor Planner), and the global mobile application shell.

Key conclusions of this investigation:
1. **Fork Boundary Integrity**: The isolation boundary between Furniture Studio (`site/{components,lib,hooks,store,server}/Studio`) and Floor Planner (`site/{components,lib,hooks,store,server}/Planner`) is 100% pure. A scan across 1,039 repository files confirmed exactly 0 cross-product import edges. Studio operates on its canonical scale contract of `0.2 px/mm` (raster export at `2 px/mm`), while Floor Planner operates on `0.05 px/mm`.
2. **Viewport Units in Workspaces**: Both workspace root wrappers (`.oostudio-root .app-root` and `.ooplanner-root .app-root`) hardcoded `height: 100vh`, causing mobile browser address bars to occlude canvas action bars. Both require migration to `100dvh`.
3. **Mobile Chrome Tap Targets**: Top bar buttons (`.mobile-app-bar__menu` and `.mobile-app-bar__search`) were constrained to 44×44px (`2.75rem`), the tablet header hamburger was 40×40px, and CookieConsentBar buttons were 36–44px. All fall below the mandatory 48×48px standard.
4. **Style Token Debt Concentration**: Of the 200 findings recorded in `config/quality/style-token-baseline.json`, 102 findings (51% of repository debt) resided in Admin/CRM (74 findings), Mobile Chrome (12 findings), and Workspaces (16 findings).
5. **Missing Inventory File**: `/admin/inventory` attempts to read `results/app-pages-inventory.csv`, which is absent from the workspace.

---

## 2. Key Empirical Findings

### 2.1 Workspace Boundary Scan & Geometry Scale Contracts
- **Boundary Scan Execution**:
  - Command: `node scripts/scan-boundaries.mjs`
  - Output:
    ```text
    === planner / studio boundary scan (relocated namespaces) ===
    files scanned: 1039
    owned files analyzed: 265
    import edges checked: 792
    boundary OK — zero cross-product edges, namespaces verified, no shared layer.
    ```
- **Scale Contracts**:
  - Floor Planner: `site/lib/Planner/plannerGeometryContract.ts:12` defines `PLANNER_SCALE_PX_PER_MM = 0.05`.
  - Furniture Studio: `site/lib/Planner/plannerGeometryContract.ts:22` defines `STUDIO_SCALE_PX_PER_MM = 0.2`.
  - Studio Raster Rendering: `site/server/Studio/renderTopPngFromSvg.ts:5` defines `2 px/mm + 40 mm pad`.
- **Viewport Unit Debt**:
  - `site/focss/studio/chrome.css:1`: `.oostudio-root .app-root { height: 100vh; overflow: hidden; }`
  - `site/focss/planner/chrome.css:2`: `.ooplanner-root .app-root { height: 100vh; overflow: hidden; }`
  - Migration to `100dvh` prevents mobile URL bar clipping.

### 2.2 Mobile Chrome & App Shell Coordination
- **Top App Bar**: `site/components/site/MobileAppShell.tsx` renders `.mobile-app-bar`. In `site/focss/site/components/chrome/app-shell.css:133-136`, buttons `.mobile-app-bar__menu` and `.mobile-app-bar__search` measured `2.75rem` (44px), violating the 48px standard.
- **Header Hamburger**: `site/components/site/Header.tsx:369` applied `h-10 w-10` (40×40px) to `.site-header__hamburger`.
- **Cookie Consent Bar Buttons**: `site/components/site/CookieConsentBar.tsx:103` specified `min-h-9 sm:min-h-10` (36px and 40px), violating the 48px floor.
- **Mobile Drawer Menu Isolation**: `site/components/site/MobileNavDrawer.tsx:63-70` properly isolates mobile navigation strictly to 6 overflow links (`/about`, `/clients`, `/trusted-by`, `/faq`, `/planning`, `/downloads`) with integrated search.
- **Bottom Tab Bar Ergonomics**: `site/features/site/data/navigation.ts:39-45` defines 5 core tabs. With `min-height: 3.5rem` (56px) and 5 equal columns, each tab measures 78×56px on 390w screens, satisfying the touch target standard.

### 2.3 Admin Surfaces & Style Token Debt
- **14 Admin Routes Audited**:
  - `/admin`, `/admin/catalog`, `/admin/workspace-catalog`, `/admin/planner-catalog`, `/admin/inventory`, `/admin/price-books`, `/admin/crm` (`clients`, `projects`, `projects/[id]`, `quotes`), `/admin/customer-queries`, `/admin/plans`, `/admin/plans/[id]`, `/admin/analytics`, `/admin/settings`, `/admin/themes`, `/admin/design-kit`, `/admin/features`.
- **Admin Phone Touch Targets**: `site/features/admin/ui/adminMobileReview.ts:16-19` set `ADMIN_PHONE_MIN_TAP_PX = 44;`, and `site/focss/admin/base/shell.css:343-344` set `.shell-admin-mobile-toggle` to `2.75rem` (44px).
- **Style Token Debt Breakdown (102 findings total)**:
  - CRM & Admin Drawers: 74 findings (`QuotesView`: 20, `ProjectDetailView`: 13, `ClientsView`: 12, `AdminCatalogEditorDrawer`: 9, `ProjectsView`: 5, `AdminCatalogManager`: 3, `AdminWorkspaceCatalogPageView`: 3, `ThemeEditor`: 3, others: 6).
  - Mobile Chrome & Shell: 12 findings (`MobileNavDrawer`: 9, `Header`: 2, `FooterLogoMarquee`: 1).
  - Workspaces: 16 findings (`ViewportControls`: 10, `PlannerAutoArrangeDialog`: 5, `PlannerCatalogRail`: 1).

---

## 3. Remediation Assignment

The findings from this survey were scheduled into two delivery milestones:
- **Milestone 1**: Remediate mobile chrome button touch targets to 48px (`.mobile-app-bar__menu`, `.mobile-app-bar__search`, `.site-header__hamburger`, and `CookieConsentBar` actions), enforce FAB suppression under CookieConsentBar on mobile viewports (<768px).
- **Milestone 4**: Remediate Admin surface style token debt (74 findings), migrate workspaces from `100vh` to `100dvh`, generate `results/app-pages-inventory.csv`, and verify strict boundary preservation (`scan:boundaries` exit code 0).
