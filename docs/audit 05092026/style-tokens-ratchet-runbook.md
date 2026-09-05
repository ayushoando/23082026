# Operational Runbook: Style Token Debt Ratchet & FOCSS Alignment

**Document Version:** 2.0.0  
**Status:** Verified Operational Runbook  
**Last Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](../../AGENTS.md) §1, §3, §6, [`Agents/07-css.md`](../../Agents/07-css.md), and [`docs/architecture/css.md`](../../docs/architecture/css.md)  
**Target Configuration:** [`config/quality/style-token-baseline.json`](../../config/quality/style-token-baseline.json)  
**Enforcement Script:** [`scripts/general/check-style-tokens.mjs`](../../scripts/general/check-style-tokens.mjs)  
**Execution Context:** Monorepo Root (`d:\23082026`)

---

## 1. Executive Summary & Architecture Context

Oando standardizes strictly on the **FOCSS Design System** (`@focss/*`), comprising 151 modular CSS package files organized in a strict 4-layer hierarchy:
1. **Tokens (`site/focss/tokens/`):** Semantic variables for colors, elevation, spacing, radiuses, and animation.
2. **Base (`site/focss/base/`):** Global resets, typography rules, surface definitions, and layers.
3. **Components (`site/focss/components/`):** Scoped component styles (dialogs, drawers, cards, inputs).
4. **Entry (`site/focss/entry.css`):** Top-level CSS bundle entry.

### Architectural Invariants:
- **Zero Raw Hex Colors:** Components and non-token CSS files must never contain raw hex color literals (`#[0-9a-fA-F]{3,8}`). All colors must route through semantic CSS custom properties (`var(--color-...)` or `@focss/tokens`).
- **Zero Arbitrary Bracket Classes:** Prohibit arbitrary bracket utilities (`rounded-[...]`, `p-[...]`, `m-[...]`, `text-[...]`, `min-h-[...]`, `max-w-[...]`). Standardize strictly on semantic FOCSS tokens.
- **Zero Inline SVGs / Lucide Icons:** 100% compliance with `PhIcon` + `phIconMap` (Phosphor icons).
- **Studio ↔ Planner Isolation:** Studio (`0.2 px/mm`) and Planner (`0.05 px/mm`) must never cross-import styles or components (`pnpm run scan:boundaries`).

---

## 2. Baseline Reality & Ratchet Enforcement Mechanics

The repository enforces a strict downward-ratcheting quality gate for style token exceptions recorded in [`config/quality/style-token-baseline.json`](../../config/quality/style-token-baseline.json).

### Live Baseline Metrics:
- **Total Inline Style Exceptions:** Exactly **200**
- **Files with Registered Exceptions:** Exactly **58**

### Rules Checked by `scripts/general/check-style-tokens.mjs`:
The gate specifically inspects `className` attributes, `style={{ ... }}` objects, and non-token `.css` declarations:

| Rule ID | Regular Expression Checked | Targeted Pattern | Severity |
| :--- | :--- | :--- | :---: |
| **`C5_arbitrary`** | `\b[a-z-]+\[[^\]]+\]` | Arbitrary bracket overrides (`rounded-[1.25rem]`, `text-[10px]`) | MEDIUM / LOW |
| **`C3_raw_hex`** | `#[0-9a-fA-F]{3,8}\b` | Hardcoded hex color codes (`#0f172a`, `#fff`) | HIGH |
| **`C4_px_literal`** | `\b\d+px\b` / `:\s*["'`]?\d+px` | Hardcoded pixel measurements (`12px`, `padding: 24px`) | MEDIUM |
| **`C3_rgb_color`** | `\brgba?\(` | Raw RGB/RGBA function calls | HIGH |

### Ratchet Mechanics (Governance §7):
- **Regression Blocker:** `pnpm run check:style-tokens` compares current findings against `config/quality/style-token-baseline.json`. If total violations exceed 200, the command exits with code 1.
- **Ratchet Downward Only:** Running `node scripts/general/check-style-tokens.mjs --update` records a lower count when violations are removed. The script strictly refuses to raise the baseline count.

---

## 3. High-Density Target Areas & Offender Clustering

Analysis of the 200 exceptions reveals heavy clustering in specific modules. Refactoring the top 4 clusters eliminates over 60% of all repository debt:

```
┌──────────────────────────────────────────────────────────────┐
│  CRM Feature Module: 51 exceptions (25.5% of total repo debt)│
├──────────────────────────────────────────────────────────────┤
│  UI Engine & Viewport Controls: 27 exceptions (13.5%)        │
├──────────────────────────────────────────────────────────────┤
│  Shell, Navigation & Error Boundaries: 25 exceptions (12.5%) │
├──────────────────────────────────────────────────────────────┤
│  Admin Catalog & Workspaces: 15 exceptions (7.5%)            │
└──────────────────────────────────────────────────────────────┘
```

### 3.1 Primary Concentration: CRM Feature Module (51 Exceptions — 25.5%)
The CRM subsystem is the single largest contributor to style token debt:
1. **`site/features/crm/QuotesView.tsx` — 20 Exceptions (#1 Offender in Repository):**
   - Arbitrary border radius overrides: `rounded-t-[1.25rem]`, `sm:rounded-t-[1.6rem]` (lines 254).
   - Arbitrary typography scales: `text-[10px]` (lines 263, 317, 336), `text-[11px]` (lines 300, 306).
   - Arbitrary sizing & constraints: `min-h-[12rem]`, `sm:min-h-[24rem]` (line 275), `max-w-[70%]` (line 336).
2. **`site/features/crm/ProjectDetailView.tsx` — 13 Exceptions:**
   - Inline header badge padding, arbitrary status indicator margins, and tab styling.
3. **`site/features/crm/ClientsView.tsx` — 12 Exceptions:**
   - Modal dialog paddings, arbitrary client avatar dimensions, and table borders.
4. **`site/features/crm/ProjectsView.tsx` — 5 Exceptions:**
   - Kanban board column widths and progress bar heights.
5. **`site/features/crm/crmAdminUi.tsx` — 1 Exception:**
   - Arbitrary dialog overlay backdrop token.

---

### 3.2 Secondary Concentrations

#### UI Engine & Viewport Controls (27 Exceptions):
- `site/components/ui/ViewportControls.tsx` (10 exceptions) — Canvas overlay controls and zoom sliders.
- `site/lib/ui/KeyboardShortcuts.tsx` (10 exceptions) — Key-cap badge dimensions and borders.
- `site/lib/ui/SmartLayoutEngine.tsx` (7 exceptions) — Grid spacing and layout engine math.

#### Shell, Navigation & Error Boundaries (25 Exceptions):
- `site/components/site/MobileNavDrawer.tsx` (9 exceptions) — Mobile menu drawer padding and heights.
- `site/components/site/SiteErrorBoundary.tsx` (8 exceptions) — Error screen alert box styling.
- `site/features/shared/dashboard/DashboardClient.tsx` (8 exceptions) — Dashboard summary card padding.

#### Admin Catalog & Workspaces (15 Exceptions):
- `site/features/admin/catalog/AdminCatalogEditorDrawer.tsx` (9 exceptions) — Catalog property drawer styling.
- `site/features/admin/catalog/AdminCatalogManager.tsx` (3 exceptions) — Management table cell styling.
- `site/features/admin/workspace-catalog/AdminWorkspaceCatalogPageView.tsx` (3 exceptions) — Workspace cards.

---

## 4. Exact Runnable Commands & Tooling

The following exact commands control style token enforcement and verification:

```powershell
# 1. Gate Check: Compare current repository state against baseline (200 total)
pnpm run check:style-tokens
# (Direct invocation: node scripts/general/check-style-tokens.mjs)

# 2. Detailed Inspection: List every finding with exact file, line, and rule ID
node scripts/general/check-style-tokens.mjs --list

# 3. Filtered Inspection: List findings for a specific target file
node scripts/general/check-style-tokens.mjs --list | Select-String "QuotesView.tsx"

# 4. Strict UI Contract Linting: Enforce anti-drift rules (no raw Tailwind colors, no raw buttons)
pnpm run lint:ui:strict
# (Direct invocation: node scripts/general/lint-ui-contract.mjs --strict)

# 5. FOCSS Architecture Verification: Validate 151 CSS files, 0 cycles, 0 raw hex
pnpm run verify:focss
# (Direct invocation: node scripts/AsNeeded/verify-focss.mjs)

# 6. Studio vs. Planner Isolation Check: Ensure zero cross-imports
pnpm run scan:boundaries

# 7. Ratchet Baseline Update: Re-record baseline after normalizing components
node scripts/general/check-style-tokens.mjs --update

# 8. Fast Verification Loop: Run fast gate
pnpm run gate:fast
```

---

## 5. Step-by-Step Ratcheting Procedure

Follow this disciplined 5-step procedure to eliminate debt and ratchet down the baseline.

### Case Study: Normalizing `site/features/crm/QuotesView.tsx` (20 Exceptions → 0)

#### Step 1: Preflight Inspection
Inspect all 20 active violations in `QuotesView.tsx`:
```powershell
node scripts/general/check-style-tokens.mjs --list | Select-String "QuotesView.tsx"
```
*Note exact line numbers and rule IDs (primarily `C5_arbitrary`).*

#### Step 2: Semantic FOCSS Token Normalization
Refactor arbitrary bracket classes to canonical design tokens without changing visual appearance:

1. **Border Radius Normalization:**
   - Replace `rounded-t-[1.25rem] sm:rounded-t-[1.6rem]` (line 254) with semantic token `rounded-t-xl sm:rounded-t-2xl`.
   - Replace any `rounded-[8px]` with `rounded-lg`.
2. **Typography Scale Normalization:**
   - Replace `text-[10px]` (lines 263, 317, 336) with standard semantic scale `text-xs` (or `text-xs font-mono`).
   - Replace `text-[11px]` (lines 300, 306) with `text-xs`.
3. **Dimensions & Constraint Normalization:**
   - Replace `min-h-[12rem] sm:min-h-[24rem]` (line 275) with standard utility scale `min-h-48 sm:min-h-96`.
   - Replace `max-w-[70%]` (line 336) with responsive utility `max-w-xs` or flex-basis class.
4. **Color & Surface Normalization:**
   - Replace any inline `style={{ backgroundColor: "#..." }}` with semantic FOCSS classes consuming `crmUi.strongSurface` or `var(--surface-primary)`.
   - Replace any hardcoded text colors with semantic tokens (`text-strong`, `text-muted`, `text-success`, `text-warning`).

#### Step 3: Local Verification & Lint Passes
Confirm zero violations remain in the modified component:
```powershell
# Verify style tokens gate detects the reduction
pnpm run check:style-tokens

# Verify strict UI contract compliance
pnpm run lint:ui:strict

# Verify FOCSS modular package health
pnpm run verify:focss

# Verify Studio ↔ Planner boundaries remain clean
pnpm run scan:boundaries
```

#### Step 4: Update the Ratchet Baseline
Re-record the baseline to lock in the improvement:
```powershell
node scripts/general/check-style-tokens.mjs --update
```
Verify that git diff shows the baseline dropping from 200 to **180 exceptions** and removing the `QuotesView.tsx` entry:
```powershell
git diff config/quality/style-token-baseline.json
```
*Expected Diff:*
```diff
 {
-  "total": 200,
+  "total": 180,
   "perFile": {
-    "site/features/crm/QuotesView.tsx": 20,
```

#### Step 5: Full Fast Gate Verification
Verify that the full fast gate passes with zero regressions:
```powershell
pnpm run gate:fast
```

---

## 6. Exit Criteria

A style token ratcheting pass is complete and approved when:
1. **Zero New Debt:** No new arbitrary bracket utilities or inline styles are introduced.
2. **Ratchet Reduction:** `config/quality/style-token-baseline.json` records a lower total count (e.g. dropping from 200 towards 0).
3. **Gate Status:** `pnpm run check:style-tokens` exits with code 0.
4. **UI Contract Status:** `pnpm run lint:ui:strict` exits with code 0.
5. **FOCSS Architecture Status:** `pnpm run verify:focss` validates 151/151 files with 0 circular cycles and 0 raw hex literals.
6. **Visual Invariance:** Component rendering maintains 100% visual parity with existing layouts (no unapproved visual redesign).
