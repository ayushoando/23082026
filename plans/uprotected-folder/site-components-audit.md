# Site Components (`site/components/`) Architecture Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`site/components/`](file:///d:/23082026/site/components/)  
**Method:** Live directory listing, FOCSS compiler validation, and style token exception registry analysis.

---

## 1. Directory Structure (26 Modular Subdirectories)

```
site/components/
├── ui/              ✅ Shared primitive widgets (Button, dialog, Field, form, IconButton)
├── Planner/         ✅ 2D/3D Floor Planner UI (Canvas, CatalogRail, AutoArrangeDialog)
├── Studio/          ✅ 2D/3D Furniture Studio UI (Canvas, Toolbar, MaterialPicker)
├── products/        ✅ Catalog presentation (ProductGrid, ProductCard, CompareDock, FilterBar)
├── home/            ✅ Marketing landing sections (HomepageHero, ShowcaseCarousel, Collections)
├── pwa/             ✅ PWA components (ServiceWorkerRegister)
├── site/            ✅ Chrome navigation & shells (Header, MobileNavDrawer, FooterLogoMarquee)
├── shared/          ✅ Cross-domain shared presentation helpers
├── about/           ├── analytics/       ├── career/          ├── clients/
├── compare/         ├── contact/         ├── downloads/       ├── faq/
├── legal/           ├── planning/        ├── security/        ├── service/
├── showrooms/       ├── sitemap/         ├── solutions/       ├── sustainability/
├── tools/           └── trusted-by/
```

---

## 2. Design System & CSS Architecture (FOCSS)

- **Compiler:** Custom zero-runtime CSS processor (`site/focss/`).
- **Token Compliance:** Raw hex color literals (e.g. `#1e293b`) are strictly forbidden in UI components. All styling must consume design tokens from `@focss/tokens`.
- **CSS Verification:** `pnpm run verify:focss` passes with 100% compliance across all 151 stylesheet modules.

---

## 3. Style Token Baseline & Legacy Exceptions

The CI pipeline guards against inline style regressions via [`config/quality/style-token-baseline.json`](file:///d:/23082026/config/quality/style-token-baseline.json).

### Baseline Summary:
- **Total Registered Exceptions:** 201
- **Affected Files:** 30 files (predominantly in legacy CRM and administrative views)
- **Top Files with Exceptions:**
  - `site/features/crm/QuotesView.tsx` (20 exceptions)
  - `site/features/crm/ClientsView.tsx` (12 exceptions)
  - `site/components/site/MobileAppShell.tsx`
  - `site/features/shared/auth/components/LoginPage.tsx`

### Verification Script Location:
- The authoritative script is [`scripts/general/check-style-tokens.mjs`](file:///d:/23082026/scripts/general/check-style-tokens.mjs) (invoked via `pnpm run check:style-tokens`).
- Note: Previous documentation incorrectly referenced an `AsNeeded` subpath; the canonical location is `scripts/general/`.

---

## 4. Fork Isolation at Component Level

- Components under `site/components/Planner/` must never import from `site/components/Studio/`.
- Components under `site/components/Studio/` must never import from `site/components/Planner/`.
- Enforced by `pnpm run scan:boundaries`.

---

## 5. Actionable Verification & Ratchet Runbook

```powershell
# 1. Run FOCSS compiler validation
pnpm run verify:focss

# 2. Check inline style token compliance against baseline
pnpm run check:style-tokens

# 3. List all current inline token violations
node scripts/general/check-style-tokens.mjs --list

# 4. Ratchet down baseline after refactoring legacy styles
node scripts/general/check-style-tokens.mjs --update
```
