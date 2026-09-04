# Database & Migrations Subsystem Audit

**Date:** September 4, 2026  
**Auditor:** AntiGravity Pair Programming Agent  
**Status:** NOT COMPLETE  
**Scope:** Dual-Database Supabase Topology, Drizzle ORM Schema, Migration Lifecycles, and Rollback Governance

---

## 1. Executive Summary

Oando enforces a strict **two-database architecture** designed to eliminate multi-tenant blast radius and decouple marketing catalogue data from high-privilege administrative, customer, and design-engine records. 

1. **Admin Database (`rxzpznmxbaoxpikowmfc`):** Holds authenticated profiles, workspace plans, teams, handoffs, price books, customer queries, operational audit logs, furniture catalogs, and block descriptors.
2. **Products Database (`erpweaiypimorcunaimz`):** Holds public marketing catalogs, dynamic configurator models, theme definitions, and feature flags.
3. **ORM Layer:** Unified through Drizzle ORM ([`site/platform/drizzle`](file:///d:/23082026/site/platform/drizzle)) connecting over direct PostgreSQL wire protocols for server operations, while client-facing routes leverage Supabase HTTP REST/Auth SDKs.
4. **Governance:** Strict ratchet `P4_migration_no_rollback` forbids any migration without a corresponding `-- rollback` block.

---

## 2. Database Topology & Roles

| Database | Project Ref | Primary Data Domains | Wire Env Var | HTTP Env Var |
| :--- | :--- | :--- | :--- | :--- |
| **Admin DB** | `rxzpznmxbaoxpikowmfc` | • `oando_plans`<br>• `profiles`<br>• `teams` & `invites`<br>• `price_books`<br>• `customer_queries`<br>• `audit_events`<br>• `furniture_catalog`<br>• `block_descriptors` | `SUPABASE_AUTH_DATABASE_URL`<br>`PLANNER_DATABASE_URL` | `NEXT_ADMIN_SUPABASE_URL`<br>`SUPABASE_ADMIN_KEY` |
| **Products DB** | `erpweaiypimorcunaimz` | • `catalog_products`<br>• `configurator_products`<br>• `block_themes`<br>• `feature_flags`<br>• `svg_revisions` | `PRODUCTS_DATABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL`<br>`NEXT_PUBLIC_SUPABASE_ANON_KEY` |

---

## 3. Drizzle ORM Architecture ([`site/platform/drizzle`](file:///d:/23082026/site/platform/drizzle))

- **Wire Connection Resolution ([`databaseUrls.ts`](file:///d:/23082026/site/platform/drizzle/databaseUrls.ts)):** Direct wire URLs are strictly server-only (`resolveProductsDatabaseUrl()`, `resolvePlannerDatabaseUrl()`). Client components are prohibited from importing wire drivers.
- **Client Instances:**
  - `productsDb.ts`: Connects to `PRODUCTS_DATABASE_URL` using `postgres` client driver with prepared statement caching.
  - `adminDb.ts`: Connects to `SUPABASE_AUTH_DATABASE_URL` for administrative writes and relational queries.
- **Schema Modularization ([`schema/`](file:///d:/23082026/site/platform/drizzle/schema/)):**
  - `catalog.ts`: Defines product schemas, category hierarchies, SVG metadata, and configurator definitions.
  - `planner.ts`: Defines `profiles`, `plans`, `teams`, `teamMembers`, `invites`, `priceBooks`, `priceBookVersions`, `auditEvents`, `furnitureCatalog`, and `blockDescriptors`.

---

## 4. Migration Lifecycles & Tooling

Migration management is driven by [`scripts/db_apply_migrations.ts`](file:///d:/23082026/scripts/db_apply_migrations.ts):

### Migration Directories
- **Products Migrations:** [`site/platform/supabase/migrations/`](file:///d:/23082026/site/platform/supabase/migrations/) (47 migration files tracking catalog evolution, indexes, and RLS).
- **Admin Migrations:** [`site/platform/supabase/migrations.admin/`](file:///d:/23082026/site/platform/supabase/migrations.admin/) (22 migration files tracking plans, handoffs, idempotency, and atomic rate limits).

### Execution Commands
- **Dry-run Planning:** `pnpm run db:apply -- --dry` (Products) / `pnpm run db:apply:admin -- --dry` (Admin).
- **Live Execution:** `pnpm run db:apply` / `pnpm run db:apply:admin`.
- **Type Generation:** `pnpm run db:types` / `pnpm run db:types:admin`.

---

## 5. Security & Governance Policies

1. **Migration Rollbacks:** Every SQL migration file committed must include a valid `-- rollback` block. The CI script [`scripts/general/check-governance.mjs`](file:///d:/23082026/scripts/general/check-governance.mjs) validates `P4_migration_no_rollback` against `config/quality/governance-baseline.json`.
2. **Row Level Security (RLS):**
   - Tables containing user design states (`oando_plans`, `product_studio_drafts`) enforce ownership policies: `auth.uid() = user_id`.
   - Customer queries (`customer_queries`) enforce insert grants while restricting read access strictly to service-role admins.
3. **No Dual-Write Violations:**
   - Production filesystem is strictly read-only (`EROFS`).
   - In production, file writes throw runtime errors; all mutations must route through mode-aware Supabase wrappers. Local disk writes are permitted only when `DEV_AUTH_BYPASS=1`.
