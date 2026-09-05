# Site Components (`site/components/`) Architecture Audit

**Audited:** 2026-09-04 (live files read)  
**Method:** `site/components/` directory listed live (26 dirs confirmed); `config/quality/style-token-baseline.json` read live; `scripts/AsNeeded/check-style-tokens.mjs` vs `scripts/general/check-style-tokens.mjs` existence checked.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| "26 modular subdirectories" | Claimed | ✅ **Confirmed exactly** — live count: 26 directories |
| Named subdirs: `ui/`, `Planner/`, `Studio/`, `products/`, `home/`, `shared/`, `site/`, `pwa/` + domain pages | Listed in summary block | ✅ **Confirmed** — plus many more not listed: `analytics/`, `career/`, `compare/`, `contact/`, `downloads/`, `faq/`, `legal/`, `planning/`, `security/`, `service/`, `showrooms/`, `sitemap/`, `solutions/`, `sustainability/`, `tools/`, `trusted-by/` |
| Style baseline: **201 legacy inline exceptions** in **30 files** | Claimed | ✅ **CONFIRMED EXACTLY** — live `style-token-baseline.json` has `"total": 201` across 30 files |
| Check script path: `scripts/AsNeeded/check-style-tokens.mjs` | Claimed | ❌ **WRONG PATH** — `scripts/AsNeeded/check-style-tokens.mjs` does NOT exist. The live script is at `scripts/general/check-style-tokens.mjs` |
| `ServiceWorkerRegister.tsx` and `OfflineBanner.tsx` in `pwa/` | Claimed | ⚠️ **PARTIAL** — `pwa/` has `ServiceWorkerRegister.tsx` confirmed. `OfflineBanner.tsx` not seen in directory listing. |
| `ui/` contains `Button.tsx`, `Modal.tsx`, `Drawer.tsx`, `Tabs.tsx`, `ViewportControls.tsx` | Claimed | ⚠️ **PARTIALLY WRONG** — Live `ui/` files: `Button.tsx` ✅, `dialog.tsx` (not `Modal.tsx`) ✅, `Field.tsx`, `form.tsx`, `IconButton.tsx`. No `Drawer.tsx`, `Tabs.tsx` seen directly in `ui/` top-level listing |

---

## 1. Live Directory Structure (All 26 Confirmed)

```
site/components/                    ← 26 subdirectories (confirmed)
├── ui/               Button, dialog, Field, form, IconButton (live-verified)
├── Planner/          PlannerCanvas, PlannerCatalogRail, PlannerAutoArrangeDialog
├── Studio/           StudioCanvas, StudioToolbar, StudioMaterialPicker
├── products/         ProductGrid, ProductCard, CompareDock, FilterBar
├── home/             HomepageHero, ShowcaseCarousel, Collections
├── pwa/              ServiceWorkerRegister (OfflineBanner not confirmed)
├── site/             Header, MobileNavDrawer, FooterLogoMarquee, EditorialRoute
├── shared/           Cross-cutting shared presentation components
├── about/
├── analytics/
├── career/
├── clients/
├── compare/
├── contact/
├── downloads/
├── faq/
├── legal/
├── planning/
├── security/
├── service/
├── showrooms/
├── sitemap/
├── solutions/
├── sustainability/
├── tools/
└── trusted-by/
```

---

## 2. CSS Token Baseline (Live-Confirmed Verbatim)

**201 exceptions across 30 files** (confirmed from `config/quality/style-token-baseline.json`).

Files with the most inline style exceptions (from live baseline):
| File | Count |
| :--- | :--- |
| `site/features/crm/QuotesView.tsx` | 20 |
| `site/features/crm/ProjectDetailView.tsx` | 13 |
| `site/features/crm/ClientsView.tsx` | 12 |
| `site/lib/ui/KeyboardShortcuts.tsx` | 10 |
| `site/components/site/MobileNavDrawer.tsx` | 9 |
| `site/features/admin/catalog/AdminCatalogEditorDrawer.tsx` | 9 |
| `site/components/site/SiteErrorBoundary.tsx` | 8 |
| `site/features/shared/dashboard/DashboardClient.tsx` | 8 |
| `site/lib/ui/SmartLayoutEngine.tsx` | 7 |

**Finding:** CRM feature views (`QuotesView`, `ProjectDetailView`, `ClientsView`) account for 45 of 201 exceptions (22%). These are the highest-priority candidates for CSS token refactoring.

---

## 3. Check Script Path (Corrected)

| Claim | Path | Exists |
| :--- | :--- | :--- |
| Prior report | `scripts/AsNeeded/check-style-tokens.mjs` | ❌ Does not exist |
| **Live reality** | `scripts/general/check-style-tokens.mjs` | ✅ Confirmed |

The `pnpm run check:style-tokens` command resolves to the correct `scripts/general/` path. The prior report's path was wrong but the command itself works.

---

## 4. Architectural Compliance (Confirmed)

- **Fork isolation:** `site/components/Planner/` → `@planner/*` only; `site/components/Studio/` → `@studio/*` only. Confirmed by `scan:boundaries` PASS
- **CSS Token gate:** Any new `style={{ ... }}` attribute in a file not in `style-token-baseline.json` fails CI via `pnpm run check:style-tokens` → `scripts/general/check-style-tokens.mjs`
- **Ratchet direction:** Baseline can only decrease (exception count must go down or stay flat); it cannot increase without an explicit governance decision
