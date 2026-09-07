# Milestone 4 Remediation Plan: Admin Surfaces & Workspace Boundaries

**Report ID**: `M4-PLAN-01`  
**Milestone**: Milestone 4 (Admin Surfaces & Workspace Boundaries)  
**Surface Scope**: 14 Admin Routes (`/admin/*`) & Interactive Workspaces (`/oostudio`, `/ooplanner`)  
**Derived From**: Explorer 3 Survey (`.agents/explorer_survey_3/handoff.md`) and Project Architecture (`PROJECT.md`)  
**Timestamp**: 2026-09-07T01:20:00Z  
**Status**: Scheduled & Specified  

---

## 1. Executive Summary

Milestone 4 focuses on remediating style token debt across the Admin console and CRM components, modernizing viewport height units across CAD workspaces, generating missing operational inventory datasets, and strictly enforcing the fork boundary isolation between Furniture Studio and Floor Planner.

---

## 2. Key Objectives & Work Packages

### 2.1 Work Package 1: Admin & CRM Style Token Debt Reduction (74 Findings)
- **Problem**: 74 of the repository's 200 style token violations reside in Admin surfaces and CRM components (`QuotesView`: 20, `ProjectDetailView`: 13, `ClientsView`: 12, `AdminCatalogEditorDrawer`: 9, `ProjectsView`: 5, `AdminCatalogManager`: 3, `AdminWorkspaceCatalogPageView`: 3, `ThemeEditor`: 3, others: 6).
- **Remediation**:
  - Replace arbitrary bracket sizing utilities (`w-[...]`, `h-[...]`, `min-h-[...]`) with semantic FOCSS tokens (`w-full`, `h-10`, `min-h-12`).
  - Replace raw colors and arbitrary hex borders with semantic surface and border tokens (`var(--surface-card)`, `var(--border-subtle)`).
  - Eliminate the inline style `style={{ marginTop: "1.5rem" }}` in `site/app/admin/crm/layout.tsx:22`.
- **Target Invariant**: Ratchet down style-token findings from 190 to <= 116.

### 2.2 Work Package 2: Workspace Viewport Unit Modernization (`100dvh`)
- **Problem**:
  - `site/focss/studio/chrome.css:1`: `.oostudio-root .app-root { height: 100vh; overflow: hidden; }`
  - `site/focss/planner/chrome.css:2`: `.ooplanner-root .app-root { height: 100vh; overflow: hidden; }`
  On mobile devices and tablets, the standard `100vh` unit fails to account for dynamic browser address bars and bottom navigation bars, causing canvas controls to be pushed beneath the screen fold.
- **Remediation**: Update `.oostudio-root .app-root` and `.ooplanner-root .app-root` to `height: 100dvh;`.
- **Target Invariant**: Canvas containers fill dynamic screen heights without triggering viewport-level scrollbars or UI bar clipping.

### 2.3 Work Package 3: Admin Inventory Dataset Generation
- **Problem**: `site/app/admin/inventory/page.tsx:9` attempts to read `results/app-pages-inventory.csv`. Because this file does not exist on disk, `AdminInventoryPageView.tsx` renders an empty error state instructing operators to generate the CSV.
- **Remediation**:
  - Implement a generation script or statically generate `results/app-pages-inventory.csv` containing complete route, template, and chunk metadata for all 44 platform routes.
- **Target Invariant**: `/admin/inventory` renders fully populated page inventory tables with live row counts and bundle metadata.

### 2.4 Work Package 4: Workspace Boundary Preservation (0 Cross-Product Edges)
- **Problem**: The Studio and Planner workspaces share geometry concepts but operate on strictly segregated scale contracts (`0.2 px/mm` for Studio, `0.05 px/mm` for Planner). Cross-imports between the two products introduce build cycles and contract violations.
- **Verification Requirement**:
  - Execute `node scripts/scan-boundaries.mjs`.
  - Enforce exactly 0 cross-product import edges between `site/{components,lib,hooks,store,server}/Studio` and `site/{components,lib,hooks,store,server}/Planner`.

### 2.5 Work Package 5: Admin Phone Tap Target Normalization (>=48px)
- **Problem**: `site/features/admin/ui/adminMobileReview.ts:16-19` specifies `ADMIN_PHONE_MIN_TAP_PX = 44;`, and `site/focss/admin/base/shell.css:343-344` specifies `min-width: 2.75rem; min-height: 2.75rem;` on `.shell-admin-mobile-toggle`.
- **Remediation**: Upgrade `ADMIN_PHONE_MIN_TAP_PX` to 48 and `.shell-admin-mobile-toggle` to `min-height: 3rem; min-width: 3rem;` (`min-h-12 min-w-12`).

---

## 3. Verification Criteria & Acceptance Gate

To achieve clean passage in Milestone 4:
1. `pnpm run scan:boundaries`: Exit code 0 (0 cross-product edges).
2. `pnpm run check:style-tokens`: Exit code 0 (finding count <= 116).
3. `pnpm run verify:focss`: Exit code 0.
4. `pnpm run lint:ui:strict`: Exit code 0.
5. `pnpm run typecheck:site`: Exit code 0.
6. Independent Forensic Integrity Audit verdict: **CLEAN**.
