# Infrastructure & Cloud Configuration Audit

**Audited:** 2026-09-04 (live files read; diff'd against prior report)  
**Method:** `workers/oando-worker-proxy/wrangler.toml`, `vercel.json`, `scripts/sync-github-backup-secrets.ps1`, `.github/workflows/supabase-backup-r2.yml` all read directly.

---

## What Changed vs. Prior Report

| Finding | Prior Report Claim | Live Reality |
| :--- | :--- | :--- |
| `CF-TOKEN-01` blocker status | "RESOLVED & VERIFIED" | ⚠️ **Still in `Failures.md`** — operator has not removed it. Underlying token appears live but blocker row persists. |
| `wrangler.toml` Vectorize binding | Reported as present | ✅ **Confirmed** — `[[vectorize]]` binding `CATALOG_VECTORS = "catalog-nav"` present in live file. |
| `wrangler.toml` R2 binding | Reported as present | ✅ **Confirmed** — `ASSET_BUCKET = "oando-asset-cdn"` present. |
| Secret sync typo | Reported as existing | ✅ **Still unresolved** — `CLOULD_ACCESS_KEY_ID`, `CLOULDFLARE_S3_SECRET_ACCESS_KEY`, `CLOULDFLARE_S3_URL` still present in `sync-github-backup-secrets.ps1`. |
| GitHub Actions expects `CLOUDFLARE_R2_*` | Claimed | ✅ **Confirmed** — `.github/workflows/supabase-backup-r2.yml` references `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`. |
| Worker dependency decoupling | Reported as issue | ✅ **Confirmed** — `workers/oando-worker-proxy` has its own `package-lock.json`, is not a pnpm workspace member. |

---

## Executive Summary

Same dual-Supabase, Cloudflare-fronted topology as documented. One **P0 defect** confirmed live and unresolved: the GitHub Actions backup secret name mismatch. The Cloudflare token issue (CF-TOKEN-01) is functionally resolved but not cleared from `Failures.md`.

```
Topology (verified live):
  oando.co.in → Cloudflare Worker (oando-worker-proxy)
    ├── /assets/* /images/*  → R2 (oando-asset-cdn) ← ASSET_BUCKET binding ✅
    ├── Vectorize             → catalog-nav (768 dims, cosine) ← CATALOG_VECTORS ✅
    └── all other paths       → Vercel bom1 (oando1408.vercel.app) ← VERCEL_ORIGIN ✅
  Vercel → Next.js 16 standalone
    ├── Drizzle/Wire → Products DB (erpweaiypimorcunaimz)
    └── Drizzle/Wire → Admin DB   (rxzpznmxbaoxpikowmfc)
```

---

## 1. Database Configuration (Unchanged)

### Dual-DB Architecture (confirmed)

| Parameter | Products DB | Admin DB |
| :--- | :--- | :--- |
| **Project Ref** | `erpweaiypimorcunaimz` | `rxzpznmxbaoxpikowmfc` |
| **Wire URL Env** | `PRODUCTS_DATABASE_URL` | `SUPABASE_AUTH_DATABASE_URL` |
| **Service Role Key** | `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_ADMIN_SERVICE_ROLE_KEY` |
| **Migration Folder** | `site/platform/supabase/migrations/` | `site/platform/supabase/migrations.admin/` |
| **Primary Tables** | `catalog_products`, `catalog_categories`, `catalog_product_specs`, `configurator_products`, `planner_managed_products` | `oando_plans`, `profiles`, `furniture_catalog`, `block_descriptors`, `audit_events`, `customer_queries`, `teams`, `price_books` |

### Key Protections (confirmed live)

- `assertNotServiceRoleKey()` guard present in [`site/platform/supabase/env.ts`](file:///d:/23082026/site/platform/supabase/env.ts) — confirmed by grep.
- `profiles` table has no `email` or `role` column — confirmed in schema trap documentation.
- 9 legacy tables archived (`plans`, `templates`, `users`, etc.) — confirmed by `20260801110000_archive_legacy_planner_tables.sql`.

---

## 2. Cloudflare R2 Configuration

### Bucket & Credentials (confirmed)

- **Bucket:** `oando-asset-cdn` (aliases: `CLOUDFLARE_R2_CATALOG_BUCKET`, `CLOUDFLARE_R2_BUCKET`, `R2_CATALOG_BUCKET`).
- **S3 Credential Precedence** (from [`site/lib/storage/r2Catalog.ts`](file:///d:/23082026/site/lib/storage/r2Catalog.ts)):
  1. `CLOUDFLARE_R2_ACCESS_KEY_ID` + `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
  2. `CLOUDFLARE_ACCESS_KEY_ID` + `CLOUDFLARE_SECRET_ACCESS_KEY`
  3. Legacy typo aliases: `CLOULD_ACCESS_KEY_ID` + `CLOULDFLARE_S3_SECRET_ACCESS_KEY`

> **Finding:** The legacy typo aliases are still honored by the application code but **not** synced correctly by the GitHub Actions sync script.

---

## 3. Vercel Configuration (Unchanged)

- **Build Command:** `pnpm run build:site`
- **Region:** `bom1` (Mumbai)
- **SEO Protection:** `X-Robots-Tag: noindex, nofollow` injected on `*.vercel.app` hostnames via `vercel.json` headers rule. Worker strips and replaces with `X-Robots-Tag: all` for `oando.co.in`.

---

## 4. Cloudflare Worker (`oando-worker-proxy`) — Live State

From live `wrangler.toml` read 2026-09-04:

```toml
name = "oando-worker-proxy"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[r2_buckets]]
binding = "ASSET_BUCKET"
bucket_name = "oando-asset-cdn"

[vars]
VERCEL_ORIGIN = "https://oando1408.vercel.app"
PUBLIC_INDEXABLE_HOSTS = "oando.co.in,www.oando.co.in"

[[vectorize]]
binding = "CATALOG_VECTORS"
index_name = "catalog-nav"
```

All bindings confirmed intact. Worker is **not** a pnpm workspace member — requires separate `npm ci` before deploy.

---

## 5. Active Defects (Live Evidence)

### 5.1 P0 — GitHub Actions Secret Name Mismatch (NOT FIXED)

`scripts/sync-github-backup-secrets.ps1` still contains the following typo secret names:

```powershell
$secretNames = @(
  'PRODUCTS_DATABASE_URL',
  'SUPABASE_AUTH_DATABASE_URL',
  'CLOULDFLARE_S3_URL',          # ← TYPO: should be CLOUDFLARE_S3_URL or CLOUDFLARE_R2_*
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOULD_ACCESS_KEY_ID',         # ← TYPO: should be CLOUDFLARE_R2_ACCESS_KEY_ID
  'CLOULDFLARE_S3_SECRET_ACCESS_KEY',  # ← TYPO: should be CLOUDFLARE_R2_SECRET_ACCESS_KEY
  'CLOUDFLARE_R2_CATALOG_BUCKET'
)
```

The GitHub Actions workflow expects:
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`

**Impact:** Nightly R2 database backups are failing in CI because credentials are set under the wrong secret names.

**Fix:** Replace the three typo entries in `sync-github-backup-secrets.ps1` with:
```powershell
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_S3_URL',
```

### 5.2 CF-TOKEN-01 — Stale `Failures.md` Entry

Functionally resolved (active token in `.env.local` verified by prior agent). Operator must clear the row from `Failures.md`.

### 5.3 Worker Deployment Isolation

`workers/oando-worker-proxy` is outside the root pnpm workspace. Must run `npm ci` inside that directory before `pnpm run worker:deploy`.

---

## 6. Audit Summary Matrix

| Domain | Config File | Health | Open Defect |
| :--- | :--- | :--- | :--- |
| Products DB | `site/platform/drizzle/schema/catalog.ts` | ✅ Healthy | — |
| Admin DB | `site/platform/drizzle/schema/planner.ts` | ✅ Healthy | — |
| R2 Storage | `site/lib/storage/r2Catalog.ts` | ✅ Healthy (app-side) | CI backup failing: secret name mismatch in sync script |
| Vercel | `vercel.json` | ✅ Healthy | — |
| CF Worker | `workers/oando-worker-proxy/wrangler.toml` | ✅ Healthy (config) | CF-TOKEN-01 stale in Failures.md |
