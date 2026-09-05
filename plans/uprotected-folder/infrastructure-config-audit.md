# Infrastructure & Cloud Configuration Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Method:** Live file inspections of `workers/oando-worker-proxy/wrangler.toml`, `vercel.json`, `scripts/sync-github-backup-secrets.ps1`, and `.github/workflows/supabase-backup-r2.yml`.

---

## 1. Verified Infrastructure Topology

```
Internet Request (oando.co.in)
  │
  ▼
Cloudflare Edge: Worker Proxy (workers/oando-worker-proxy)
  ├── /assets/*, /images/* ──► Cloudflare R2 Bucket (oando-asset-cdn)
  ├── Vector Similarity    ──► Cloudflare Vectorize (catalog-nav: 768 dims, cosine)
  └── All Application SSR  ──► Vercel Origin (bom1: oando1408.vercel.app)
                                 │
                                 ▼
                         Next.js 16 Standalone (site/)
                           ├── Wire/ORM ──► Products Supabase DB (erpweaiypimorcunaimz)
                           └── Wire/ORM ──► Admin Supabase DB    (rxzpznmxbaoxpikowmfc)
```

---

## 2. Dual Database Configuration (Confirmed Live)

Strict separation between Admin and Products databases per `AGENTS.md §4`:

| Parameter | Products DB (Marketing & Catalog) | Admin DB (Operations & Personnel) |
| :--- | :--- | :--- |
| **Project Ref** | `erpweaiypimorcunaimz` | `rxzpznmxbaoxpikowmfc` |
| **Wire URL Env** | `PRODUCTS_DATABASE_URL` | `SUPABASE_AUTH_DATABASE_URL` |
| **Service Role Key** | `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_ADMIN_SERVICE_ROLE_KEY` |
| **Anon Key** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_ADMIN_SUPABASE_ANON_KEY` |
| **Migration Path** | `site/platform/supabase/migrations/` | `site/platform/supabase/migrations.admin/` |
| **Key Tables** | `catalog_products`, `catalog_categories`, `catalog_product_specs`, `configurator_products`, `planner_managed_products` | `oando_plans`, `profiles`, `furniture_catalog`, `block_descriptors`, `audit_events`, `customer_queries`, `teams`, `price_books` |

### Database Integrity Rules:
1. **No Dual-Write:** Application logic never writes marketing catalog data to Admin DB or operational records to Products DB.
2. **Read-Only Prod Filesystem:** All runtime persistence writes must use mode-aware wrappers:
   - `plannerPersistenceMode.ts` for plans.
   - `furnitureCatalogMode.ts` for furniture and descriptors.
3. **Migration Rollback Requirement:** Every migration file must define a valid `-- rollback` block.
4. **Dry Run First:** Always execute `pnpm run db:apply -- --dry` and `pnpm run db:apply:admin -- --dry` before applying schema migrations.

---

## 3. Backup Infrastructure & Secret Synchronization

### 3.1 P0 Defect: Resolved
Previous audits flagged a secret name mismatch where `scripts/sync-github-backup-secrets.ps1` contained typos (`CLOULD_ACCESS_KEY_ID`, `CLOULDFLARE_S3_SECRET_ACCESS_KEY`, `CLOULDFLARE_S3_URL`).

**Current Status: RESOLVED**  
The live sync script [`scripts/sync-github-backup-secrets.ps1`](file:///d:/23082026/scripts/sync-github-backup-secrets.ps1) defines the canonical array:
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
This directly matches the GitHub Actions secret expectations in `.github/workflows/supabase-backup-r2.yml`.

---

## 4. Cloudflare Worker Proxy & Edge Bindings

Live configuration in [`workers/oando-worker-proxy/wrangler.toml`](file:///d:/23082026/workers/oando-worker-proxy/wrangler.toml):
- **Name:** `oando-worker-proxy`
- **Compatibility Date:** `2024-09-03`
- **R2 Bucket Binding:** `ASSET_BUCKET = "oando-asset-cdn"`
- **Vectorize Binding:** `CATALOG_VECTORS = "catalog-nav"`
- **Vercel Origin:** `VERCEL_ORIGIN = "https://oando1408.vercel.app"`
- **Indexable Hosts:** `PUBLIC_INDEXABLE_HOSTS = "oando.co.in,www.oando.co.in"`

### Cloudflare Authentication:
- Token issue `CF-TOKEN-01` has been resolved; underlying API token in `.env.local` is valid and active.
- `CF-TOKEN-01` was formally removed from [`Failures.md`](file:///d:/23082026/Failures.md).

---

## 5. Actionable Verification & Operations Runbook

```powershell
# 1. Test database connections
pnpm exec tsx scripts/db_test_connection.ts

# 2. Dry-run migrations
pnpm run db:apply -- --dry
pnpm run db:apply:admin -- --dry

# 3. Synchronize GitHub Actions backup secrets
pnpm --filter oando-site run backup:github-secrets:sync

# 4. Dry-run R2 backup prune
pnpm exec tsx scripts/prune_r2_backups.ts --dry-run
```
