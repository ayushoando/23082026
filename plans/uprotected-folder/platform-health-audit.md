# Consolidated Platform Health & Architecture Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`plans/uprotected-folder/platform-health-audit.md`](file:///d:/23082026/plans/uprotected-folder/platform-health-audit.md)  
**Method:** Live codebase inspection, configuration analysis, and test run evidence.

---

## 1. Executive Quality Scorecard

| Subsystem | Grade | Live Verified Status | Key Reality & Actionable Notes |
| :--- | :---: | :--- | :--- |
| **Database & Backups** | **A** | Dual DBs verified; backup pruner passes 12/12 unit tests. | **RESOLVED** — `scripts/sync-github-backup-secrets.ps1` updated with canonical `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, and `CLOUDFLARE_S3_URL`. |
| **Static Code & Lint** | **A-** | Oxlint passes code 0; zero manual `any` enforced. | **RESOLVED** — `"react-hooks"` plugin active in `.oxlintrc.json`; `"react-hooks/exhaustive-deps": "error"` active; `audit-eslint-disable.mjs` scans `site/hooks` and `config/build`. |
| **UI, CSS & FOCSS** | **A** | 151 CSS files pass FOCSS compiler; 0 raw hex literals. | 201 legacy inline token exceptions tracked in `config/quality/style-token-baseline.json`; documented in `style-tokens-ratchet-runbook.md`. |
| **SEO & Sitemap** | **B** | Dynamic sitemap generated from database catalog via `sitemap.ts`. | Sitemap is DB-backed; follows Google Search Central standards (`<loc>` and `<lastmod>`, omitting obsolete `<priority>`). |
| **Security & Governance** | **A** | Secret scanner, governance ratchet, and edge headers active. | `assertNotServiceRoleKey()` active; `governance-baseline.json` 6 zero-tolerance metrics passing. |
| **Edge Proxy (`workers/`)** | **A** | Cloudflare Worker proxy (`oando-worker-proxy`) active. | Routes traffic between apex domain, R2 bucket (`oando-asset-cdn`), Vectorize (`catalog-nav`), and Vercel origin. |
| **Testing & Test Harness** | **B+** | 937 test files; 0 hollow tests; 0 unapproved skips. | 4 unit tests need alignment to clear `GATE-RECHECK-01` in `Failures.md`. See `blockers-clearance-runbook.md`. |
| **Script Inventory** | **B** | 229 total scripts in `scripts/`. | Candidate list of ~59 obsolete scripts identified; safe deprecation protocol in `scripts-cleanup-runbook.md`. |

---

## 2. Database, Persistence & Backup Architecture

### 2.1 Dual Database Architecture (Strict Separation, Zero Dual-Write)
- **Admin DB (`rxzpznmxbaoxpikowmfc`):**
  - Project ref: `rxzpznmxbaoxpikowmfc`
  - Connection vars: `SUPABASE_AUTH_DATABASE_URL` / `SUPABASE_ADMIN_SERVICE_ROLE_KEY`
  - Migrations: `site/platform/supabase/migrations.admin/`
  - Primary tables: `oando_plans`, `profiles`, `furniture_catalog`, `block_descriptors`, `audit_events`, `customer_queries`, `teams`, `price_books`.
- **Products DB (`erpweaiypimorcunaimz`):**
  - Project ref: `erpweaiypimorcunaimz`
  - Connection vars: `PRODUCTS_DATABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
  - Migrations: `site/platform/supabase/migrations/`
  - Primary tables: `catalog_products`, `catalog_categories`, `catalog_product_specs`, `configurator_products`, `planner_managed_products`.

### 2.2 Mode-Aware Persistence Wrappers (Read-Only Production Filesystem)
Production filesystem is read-only. Direct runtime disk writes throw `EROFS`.
- **Plans:** [`plannerPersistenceMode.ts`](file:///d:/23082026/site/lib/Planner/plannerPersistenceMode.ts) -> disk `site/platform/Planner/data/projects/` only when `DEV_AUTH_BYPASS=1`; otherwise Supabase `oando_plans`.
- **Furniture:** [`furnitureCatalogMode.ts`](file:///d:/23082026/site/lib/catalog/furnitureCatalogMode.ts) -> disk `site/platform/shared/data/furniture/` only in non-prod; otherwise Supabase `furniture_catalog`.
- **CAD Block Descriptors:** Mode-aware wrapper -> disk `site/inventory/descriptors/` only in non-prod; otherwise Supabase `block_descriptors`.

### 2.3 Backup Secrets Status
The secret name mismatch in [`scripts/sync-github-backup-secrets.ps1`](file:///d:/23082026/scripts/sync-github-backup-secrets.ps1) is **RESOLVED**. Canonical names:
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

## 3. Cloudflare Worker Edge Proxy (`workers/oando-worker-proxy`)

The edge worker handles protocol guards, security headers, asset offloading, and dynamic proxying:

```
Request (oando.co.in)
  │
  ├── 1. Protocol Guard: Reject double-slash paths (//...) with HTTP 400
  ├── 2. Security RFC 9116: Serve /.well-known/security.txt directly
  ├── 3. Apex Redirect: www.oando.co.in ──► 308 Permanent Redirect to apex
  ├── 4. Asset Offload: /assets/*, /images/* ──► Cloudflare R2 (oando-asset-cdn)
  ├── 5. Vector Search: /api/vector/* ──► Vectorize Index (catalog-nav)
  └── 6. Dynamic SSR / App: Forward to Vercel (https://oando1408.vercel.app)
```

**Bindings (`wrangler.toml`):**
- Origin: `VERCEL_ORIGIN = "https://oando1408.vercel.app"`
- R2 Bucket: `ASSET_BUCKET` -> `oando-asset-cdn`
- Vectorize: `CATALOG_VECTORS` -> `catalog-nav`

---

## 4. Static Code Quality, Lint & Strict Fork Isolation

1. **Strict Fork Isolation:**
   Studio (`/oostudio`) and Planner (`/ooplanner`) are completely forked trees — zero cross-imports allowed. Verified via `pnpm run scan:boundaries`.
2. **Oxlint & Hook Hygiene:**
   - `"plugins": ["typescript", "react", "react-hooks", "import", "unicorn", "jsx-a11y"]`
   - `"react-hooks/exhaustive-deps": "error"`
   - `"typescript/no-explicit-any": "error"` (Zero manual `any` policy enforced).
3. **Suppression Guard:**
   `audit-eslint-disable.mjs` scans all code trees (`site/app`, `site/components`, `site/features`, `site/hooks`, `site/lib`, `tests`, `scripts`, `config/build`). Only 5 documented canvas hook exceptions permitted.

---

## 5. Active Blockers & Remediation Protocol

Per [`Failures.md`](file:///d:/23082026/Failures.md), exactly 2 blockers are active:

1. **`GATE-RECHECK-01` (P1):**
   - 4 unit tests failing in `tests/unit/features/site/data/` and `tests/unit/lib/ai/mastra/`.
   - Resolution steps detailed in [`blockers-clearance-runbook.md`](./blockers-clearance-runbook.md).
2. **`BROWSER-ORIGIN-02` (P1):**
   - Requires starting local app on `http://localhost:3000` (strictly forbidden to use `127.0.0.1`) and executing `pnpm run test:browser:gate`.
   - Verification steps detailed in [`blockers-clearance-runbook.md`](./blockers-clearance-runbook.md).

---

## 6. Quick Verification Commands

```powershell
# 1. Repository Layout & Governance Purity
pnpm run check:layout
pnpm run check:docs-all
pnpm run check:governance

# 2. Boundaries & Linting
pnpm run scan:boundaries
pnpm run lint
node scripts/general/audit-eslint-disable.mjs

# 3. Security & Database Connection
node scripts/general/scan_secrets.mjs
pnpm exec tsx scripts/db_test_connection.ts

# 4. Fast Development Gate
pnpm run gate:fast
```
