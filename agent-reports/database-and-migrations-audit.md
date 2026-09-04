# Database & Migrations Architecture Audit

**Target Systems:** Dual-Database Supabase Topology (`erpweaiypimorcunaimz` & `rxzpznmxbaoxpikowmfc`), Drizzle ORM, and Migration Governance  
**Audit Scope:** Full migration inventory (65 SQL files), dual-DB routing contract, Drizzle schema definitions, RLS security policies, and rollback governance.  
**Repository State:** Read-Only (`d:/23082026`) — Non-destructive verification.

---

## 1. Executive Summary

Oando enforces a **Dual-Database Architecture** isolating public marketing catalog data from sensitive member plans, administrative price books, and staff operations. Direct PostgreSQL wire connections via Drizzle ORM coexist with Supabase HTTP/PostgREST APIs. Production runtime filesystems are strictly read-only (`EROFS`), requiring persistence mode wrappers to manage disk versus Supabase routing.

```mermaid
flowchart TD
    App["Next.js Server Runtime (Vercel Edge / Node.js)"]
    
    subgraph DataAccessLayer ["Data Access Wrappers"]
        WireClient["Drizzle ORM (postgres-js Wire Pools)"]
        RestAdmin["Supabase Auth Admin Client (Service Role)"]
        RestAnon["Supabase Scoped Client (Bearer User JWT)"]
        ModeSelector["Persistence Mode Selectors (planner / catalog)"]
    end
    App --> DataAccessLayer

    subgraph ProductsDatabase ["Products DB (erpweaiypimorcunaimz)"]
        P_Pool["AWS AP-Northeast-1 (Tokyo Pooler :5432)"]
        P_Tables[("Public Tables:<br/>• catalog_products<br/>• catalog_categories<br/>• catalog_product_specs<br/>• configurator_products<br/>• planner_managed_products<br/>• business_stats_current<br/>• block_themes")]
        P_Pool --> P_Tables
    end

    subgraph AdminDatabase ["Admin DB (rxzpznmxbaoxpikowmfc)"]
        A_Pool["AWS AP-South-1 (Mumbai Pooler :5432)"]
        A_Tables[("Public Tables:<br/>• oando_plans (Floorplans)<br/>• profiles (Auth user data)<br/>• price_books & tiers<br/>• furniture_catalog<br/>• block_descriptors<br/>• customer_queries<br/>• audit_events<br/>• teams")]
        A_Pool --> A_Tables
    end

    WireClient -->|PRODUCTS_DATABASE_URL| P_Pool
    WireClient -->|PLANNER_DATABASE_URL| A_Pool
    RestAdmin -->|SUPABASE_SERVICE_ROLE_KEY| P_Tables
    RestAdmin -->|SUPABASE_ADMIN_SERVICE_ROLE_KEY| A_Tables
    RestAnon -->|Row-Level Security (RLS)| A_Tables
```

---

## 2. Database Topology & Responsibility Split

The two databases serve orthogonal business domains:

| Parameter | Products Database (Public Catalog) | Admin Database (Operations & Plans) |
| :--- | :--- | :--- |
| **Supabase Ref** | `erpweaiypimorcunaimz` | `rxzpznmxbaoxpikowmfc` |
| **Cloud Region** | AWS `ap-northeast-1` (Tokyo) | AWS `ap-south-1` (Mumbai) |
| **Wire Connection Env** | `PRODUCTS_DATABASE_URL` | `PLANNER_DATABASE_URL` / `SUPABASE_AUTH_DATABASE_URL` |
| **PostgREST API URL** | `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_ADMIN_SUPABASE_URL` |
| **Service Role Key** | `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_ADMIN_SERVICE_ROLE_KEY` |
| **Anon / Client Key** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_ADMIN_SUPABASE_ANON_KEY` |
| **Migration Folder** | [`site/platform/supabase/migrations/`](file:///d:/23082026/site/platform/supabase/migrations) | [`site/platform/supabase/migrations.admin/`](file:///d:/23082026/site/platform/supabase/migrations.admin) |
| **Drizzle Schema File**| [`site/platform/drizzle/schema/catalog.ts`](file:///d:/23082026/site/platform/drizzle/schema/catalog.ts) | [`site/platform/drizzle/schema/planner.ts`](file:///d:/23082026/site/platform/drizzle/schema/planner.ts) |
| **Primary Domain Data** | Marketing products, categories, specs, configurator products, material themes. | Floorplans, user profiles, teams, price books, furniture items, 2D block descriptors, contact queries, audit logs. |

---

## 3. Migration Ledger & Governance Protocol

### 3.1 Products DB Migrations (43 Files in `site/platform/supabase/migrations/`)
Managed batches begin from `20260524` onward. Pre-batch migrations were applied during bootstrap:
* `20260524233835_drop_unused_legacy_tables.sql` — Prunes deprecated early-stage tables.
* `20260524233836_pin_function_search_path.sql` — Mitigates schema injection by locking `search_path = public`.
* `20260524233837_add_foreign_key_indexes.sql` — Performance indexes on all relational FKs.
* `20260524233839_enable_rls_and_policies.sql` — Enforces RLS across catalog entities.
* `20260524233841_secure_local_migration_history.sql` — Creates and locks `_local_migration_history`.
* `20260601120000_create_configurator_products.sql` — Modular configurator desk tables.
* `20260604134500_create_block_themes.sql` — Visual surface palettes and finishes.
* `20260714100000_create_svg_revisions.sql` — Immutable SVG geometry revision history.
* `20260813090000_retire_products_furniture_catalog.sql` — Drops catalog furniture duplicate from Products DB.
* `20260814200000_archive_products_leftover_public.sql` — Moves legacy planner tables to `archive` schema.

### 3.2 Admin DB Migrations (22 Files in `site/platform/supabase/migrations.admin/`)
* `20260524240000_drop_catalog_duplicates.sql` — Removes redundant marketing tables.
* `20260628100000_planner_plans_and_audit.sql` — Provisions `oando_plans` and `audit_events`.
* `20260713000000_price_books.sql` — Provisions `price_books` and volume tiering tables.
* `20260727010000_product_studio_drafts.sql` — Furniture Studio authoring state persistence.
* `20260801100000_planner_handoffs_owner_only_read.sql` — Restricts plan handoff visibility to document owners.
* `20260801110000_archive_legacy_planner_tables.sql` — Moves 9 legacy tables (`plans`, `templates`, `projects`, etc.) to `archive` schema.
* `20260805180000_studio_furniture_to_admin.sql` — Relocates authoritative furniture catalog to Admin DB.
* `20260814200001_customer_queries_insert_grant.sql` — Permits public inbound submissions with anon RLS.
* `20260823090000_planner_revision_idempotency.sql` — Adds revision CAS and idempotency keys to plans.
* `20260903170000_rate_limits_atomic.sql` — Atomic sliding-window rate limit store in Postgres.

### 3.3 Governance Rules (`pnpm run check:governance`)
1. **Mandatory Rollback Comment:** Every single `.sql` file MUST contain a `-- rollback:` comment detailing how the schema change is inverted.
2. **Two-Phase Apply:** Migrations are always dry-run tested before application:
   ```bash
   pnpm run db:apply -- --dry
   pnpm run db:apply:admin -- --dry
   ```
3. **Migration History Table:** Applied files are atomically tracked in `public._local_migration_history (filename text primary key, applied_at timestamptz)`.

---

## 4. Drizzle ORM Schema Specification

Drizzle ORM provides full TypeScript type safety and direct SQL pool execution:

### 4.1 Products Schema ([`catalog.ts`](file:///d:/23082026/site/platform/drizzle/schema/catalog.ts))
* `catalogProducts`: Core furniture marketing entities (id, slug, name, category, price, dimensions).
* `catalogCategories`: Hierarchical navigation taxomony (id, slug, name, parent_id).
* `catalogProductSpecs`: Detailed technical and ergonomic specifications.
* `configuratorProducts`: Parametric desk components, surface finishes, modesty panels.
* `blockThemes`: Material tokens (light, dark, warm wood, industrial steel).
* `businessStatsCurrent`: Live sales KPI metrics (client count, projects completed).

### 4.2 Admin & Planner Schema ([`planner.ts`](file:///d:/23082026/site/platform/drizzle/schema/planner.ts))
* `oandoPlans`: Authoritative floorplan document store (id, title, owner_id, canvas_data, revision, idempotency_key).
* `profiles`: User account metadata (id, full_name, avatar_url, updated_at). **No email or role columns** (auth lives in Supabase Auth schema).
* `priceBooks` & `priceBookTiers`: Tiered price books and customer-specific discount schedules.
* `furnitureCatalog`: 3D and 2D symbol models authored by Studio for use in Planner.
* `blockDescriptors`: Authoritative snapping anchors and collision bounds.
* `customerQueries`: Inbound lead queue (name, email, phone, requirements, status).
* `auditEvents`: Immutable tamper-evident operational change logs.

---

## 5. Security & Row-Level Security (RLS) Protocol

1. **`assertNotServiceRoleKey()` Guard:**
   [`site/platform/supabase/env.ts`](file:///d:/23082026/site/platform/supabase/env.ts) inspects anonymous client keys. If a service-role JWT is placed in `NEXT_PUBLIC_SUPABASE_ANON_KEY`, the client fails closed immediately to prevent accidental global RLS bypass.
2. **Profiles Schema Trap:**
   The `profiles` table contains **no `email` and no `role` column**. Any query attempting to write or read `email` directly triggers PostgREST error `PGRST204`. User emails must be resolved via Supabase Auth admin API.
3. **Archived Schema Isolation:**
   Retired tables (9 legacy entities: `plans`, `templates`, `users`, `projects`, etc.) live in schema `archive.*`. PostgREST exposes only schema `public`, preventing deprecated table tampering.

---

## 6. Persistence Modes & Filesystem Safety

The application dynamically selects storage backends based on environment:

| Data Type | Disk Storage Path | Database Table | Mode Selector Helper |
| :--- | :--- | :--- | :--- |
| **Floorplans** | `site/platform/Planner/data/projects/` | `oando_plans` | [`plannerPersistenceMode.ts`](file:///d:/23082026/site/lib/Planner/plannerPersistenceMode.ts) |
| **Furniture** | `site/platform/shared/data/furniture/` | `furniture_catalog` | [`furnitureCatalogMode.ts`](file:///d:/23082026/site/lib/catalog/furnitureCatalogMode.ts) |
| **Descriptors** | `site/inventory/descriptors/` | `block_descriptors` | `furnitureCatalogMode.ts` |

* **Disk Mode:** Enabled when `DEV_AUTH_BYPASS=1` (local development only). Writes to local disk files for fast iteration.
* **Supabase Mode:** Mandatory in production. Direct file writes in production throw `EROFS` (read-only filesystem).
* **Zero Dual-Write:** Handlers write to either disk OR Supabase, never both simultaneously.

---

## 7. Verification & Test Matrix

| Test Scope | File Path | Type | Invariant Checked |
| :--- | :--- | :--- | :--- |
| **Admin DB Connection** | [`tests/unit/platform/drizzle/adminDb.test.ts`](file:///d:/23082026/tests/unit/platform/drizzle/adminDb.test.ts) | Vitest Unit | Validates pool initialization and query latency. |
| **Planner Drizzle Schema** | [`tests/unit/platform/drizzle/schema/planner.test.ts`](file:///d:/23082026/tests/unit/platform/drizzle/schema/planner.test.ts) | Vitest Unit | Validates column types, constraints, and relational joins. |
| **Database Connection Test**| [`tests/unit/scripts/db_test_connection.test.ts`](file:///d:/23082026/tests/unit/scripts/db_test_connection.test.ts) | Vitest Unit | Tests wire connection script `scripts/db_test_connection.ts`. |
| **Governance Verification** | `pnpm run check:governance` | Governance Gate | Enforces rollback comments on all 65 migrations. |
| **Exclusive Persistence** | [`tests/unit/planner/plannerExclusivePersistence.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerExclusivePersistence.property.test.ts) | Vitest Property | Proves exactly one persistence backend is active at any time. |

---

## 8. Operational Findings & Health Summary

* **Finding DB-01 — Rollback Governance:** All 65 migration files across Products and Admin databases carry valid `-- rollback:` documentation.
* **Finding DB-02 — Clean Separation of Authority:** The marketing catalog and operational control plane databases are completely isolated with separate connection credentials and regions.
* **Finding DB-03 — Atomic Migration Tracking:** `public._local_migration_history` guarantees that migrations cannot be applied twice or out of sequence.
