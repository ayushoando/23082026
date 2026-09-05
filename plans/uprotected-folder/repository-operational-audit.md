# Area-Wise Quality & Operational Audit Report

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Method:** Live codebase checks, configuration analysis, and test run evidence.

---

## Executive Quality Scorecard

| Area | Grade | Live Verified Status | Recent Improvements & Actionable State |
| :--- | :---: | :--- | :--- |
| **1. Database & Backups** | **A** | Live DBs connected; backup retention pruner passes 12/12 unit tests. | **P0 RESOLVED** — `scripts/sync-github-backup-secrets.ps1` updated with canonical `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, and `CLOUDFLARE_S3_URL`. Nightly R2 backup config aligned. |
| **2. Static Code & Lint** | **A-** | Oxlint passes with code 0; zero manual `any` enforced. | **RESOLVED** — `"react-hooks"` plugin active in `.oxlintrc.json` plugins array; `"react-hooks/exhaustive-deps": "error"` active; `audit-eslint-disable.mjs` scans `site/hooks` and `config/build`. |
| **3. UI, CSS & FOCSS** | **A** | 151 CSS files pass FOCSS compiler; 0 raw hex literals. | 201 legacy inline token exceptions tracked in `style-token-baseline.json`; ratchet runbook documented. |
| **4. SEO & Sitemap** | **B** | Dynamic sitemap generated from database catalog via `sitemap.ts`. | Confirmed: sitemap is DB-backed; prior 404 attribution was clarified to database catalog rows rather than static code arrays. |
| **5. Security & Governance** | **A** | Secret scanner, governance ratchet, and edge security headers active. | `assertNotServiceRoleKey()` active; `governance-baseline.json` 6 zero-tolerance metrics passing. |
| **6. Testing & Strength** | **B+** | 937 test files; 0 hollow tests; 0 unapproved skips. | 4 unit tests need alignment to clear `GATE-RECHECK-01` in `Failures.md`. Full suite passes when these 4 are resolved. |
| **7. Tech-Docs Reality** | **B-** | 55 scripts, 18 domain models, 12 pages in SPA. | `Database.tsx` ER diagram aligned to live tables (`furniture_catalog`, `block_descriptors`, `catalog_products`, `audit_events`). |
| **8. Script Inventory** | **B** | 229 total scripts in `scripts/`. | Script rationalization candidate list identified; `scripts-cleanup-runbook.md` provides safe retirement protocol. |

---

## 1. Database, Persistence & Backup Architecture

### 1.1 Dual Database Architecture (Confirmed)
- **Admin DB (`rxzpznmxbaoxpikowmfc`):**
  - Project ref: `rxzpznmxbaoxpikowmfc`
  - Connection var: `SUPABASE_AUTH_DATABASE_URL` / `SUPABASE_ADMIN_SERVICE_ROLE_KEY`
  - Migration dir: `site/platform/supabase/migrations.admin/`
  - Primary tables: `oando_plans`, `profiles`, `furniture_catalog`, `block_descriptors`, `audit_events`, `customer_queries`, `teams`, `price_books`.
- **Products DB (`erpweaiypimorcunaimz`):**
  - Project ref: `erpweaiypimorcunaimz`
  - Connection var: `PRODUCTS_DATABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
  - Migration dir: `site/platform/supabase/migrations/`
  - Primary tables: `catalog_products`, `catalog_categories`, `catalog_product_specs`, `configurator_products`, `planner_managed_products`.

### 1.2 Mode-Aware Persistence Wrappers
Production filesystem is read-only. Raw disk writes throw `EROFS`.
- **Plans:** [`plannerPersistenceMode.ts`](file:///d:/23082026/site/lib/Planner/plannerPersistenceMode.ts) -> disk `site/platform/Planner/data/projects/` only when `DEV_AUTH_BYPASS=1`; otherwise Supabase `oando_plans`.
- **Furniture:** [`furnitureCatalogMode.ts`](file:///d:/23082026/site/lib/catalog/furnitureCatalogMode.ts) -> disk `site/platform/shared/data/furniture/` only in non-prod; otherwise Supabase `furniture_catalog`.
- **Descriptors:** Same pattern -> disk `site/inventory/descriptors/` only in non-prod; otherwise Supabase `block_descriptors`.

### 1.3 Backup Secrets Status
The secret name mismatch in [`scripts/sync-github-backup-secrets.ps1`](file:///d:/23082026/scripts/sync-github-backup-secrets.ps1) is **RESOLVED**. Canonical names are set:
```powershell
$secretNames = @(
  'PRODUCTS_DATABASE_URL',
  'SUPABASE_AUTH_DATABASE_URL',
  'CLOUDFLARE_S3_URL',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_CATALOG_BUCKET'
)
```

---

## 2. Static Code & Lint Quality

### 2.1 Oxlint Configuration
Live `.oxlintrc.json`:
- `"plugins": ["typescript", "react", "react-hooks", "import", "unicorn", "jsx-a11y"]` (Confirmed: `react-hooks` loaded).
- `"react-hooks/exhaustive-deps": "error"` (Active).
- `"typescript/no-explicit-any": "error"` (Zero manual `any` policy enforced).

### 2.2 Inline Suppressions & Scanner Coverage
`scripts/general/audit-eslint-disable.mjs` scans:
`site/app`, `site/components`, `site/features`, `site/hooks`, `site/lib`, `tests`, `scripts`, `config/build`.
Only 5 documented canvas hook suppressions (in `site/hooks/Studio` and `site/hooks/Planner`) are permitted in `ALLOWED_SUPPRESSIONS`.

---

## 3. SEO & Sitemap Architecture

- Dynamic sitemap engine in `site/app/sitemap.ts` calls `buildProductStaticParams()` and respects Google Search Central best practices (emitting `<loc>` and `<lastmod>`, omitting obsolete `<priority>` and `<changefreq>`).
- Route classification logic in `site/features/site/data/routeClassification.ts` provides canonical route mappings for marketing and static pages.

---

## 4. Test Harness & Active Blockers

- 937 total test files across Vitest (777) and Playwright (85 specs).
- `Failures.md` tracks 2 active blockers:
  1. `GATE-RECHECK-01` (P1) — 4 failing unit tests (`htmlSitemap.test.ts`, `siteSeoAcceptance.test.ts`, `siteSeoContract.test.ts`, `mastra/providers.test.ts`).
  2. `BROWSER-ORIGIN-02` (P1) — requires starting app at `http://localhost:3000` and running `pnpm run test:browser:gate`.

---

## 5. Actionable Next Steps

```powershell
# 1. Verify Oxlint & eslint-disable audit
pnpm run lint
node scripts/general/audit-eslint-disable.mjs

# 2. Run targeted tests to address GATE-RECHECK-01
pnpm exec vitest run --config tests/vitest.config.ts `
  tests/unit/features/site/data/htmlSitemap.test.ts `
  tests/unit/features/site/data/siteSeoAcceptance.test.ts `
  tests/unit/features/site/data/siteSeoContract.test.ts `
  tests/unit/lib/ai/mastra/providers.test.ts

# 3. Verify GitHub backup secrets sync
pnpm --filter oando-site run backup:github-secrets:sync
```
