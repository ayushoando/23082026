# Site Platform (`site/platform/`) Architecture Audit

**Date:** 2026-09-04  
**Target:** [`site/platform/`](file:///d:/23082026/site/platform/)  
**Role:** Database Access Layer, Drizzle ORM Schemas, Supabase Clients & Migration Catalogs

---

## Executive Summary

The [`site/platform/`](file:///d:/23082026/site/platform/) directory is the repository's **data persistence and schema authority**. It encapsulates the Dual-Supabase architecture, housing Drizzle ORM table definitions, raw PostgreSQL migration files, mode-aware database client factories, and TypeScript database types.

```
site/platform/ Subsystem Map:
├── drizzle/                 # Drizzle ORM Definitions & Direct Wire Clients
│   ├── schema/
│   │   ├── catalog.ts       # Products DB Schema (erpweaiypimorcunaimz): catalog_products, specs, stats
│   │   └── planner.ts       # Admin DB Schema (rxzpznmxbaoxpikowmfc): oando_plans, profiles, furniture
│   └── databaseUrls.ts      # Resolves direct PostgreSQL connection pool strings
├── supabase/                # Supabase REST Clients & Migration Directories
│   ├── migrations/          # Products DB Migrations (20260524 onward tracked in _local_migration_history)
│   ├── migrations.admin/    # Admin DB Migrations (Contains archive schema movements)
│   ├── env.ts               # assertNotServiceRoleKey() guard & environment validation
│   ├── supabaseAdmin.ts     # Products service-role client factory
│   ├── auth-admin.ts        # Admin auth client factory & scoped user bearer token client
│   └── *.types.ts           # Generated Supabase TypeScript definitions
├── Planner/ & Studio/       # Platform adapters for forked planning suites
└── shared/                  # Disk dev fixtures (site/platform/shared/data/furniture/)
```

---

## 1. Dual-Database Schema Architecture

| Component | Products Database | Admin Database |
| :--- | :--- | :--- |
| **Project Ref** | `erpweaiypimorcunaimz` | `rxzpznmxbaoxpikowmfc` |
| **Drizzle Schema** | [`drizzle/schema/catalog.ts`](file:///d:/23082026/site/platform/drizzle/schema/catalog.ts) | [`drizzle/schema/planner.ts`](file:///d:/23082026/site/platform/drizzle/schema/planner.ts) |
| **Migration Folder** | `supabase/migrations/` | `supabase/migrations.admin/` |
| **Wire Client Env** | `PRODUCTS_DATABASE_URL` | `SUPABASE_AUTH_DATABASE_URL` |
| **Managed Tables** | `catalog_products`, `catalog_categories`, `catalog_product_specs`, `business_stats_current` | `oando_plans`, `profiles`, `furniture_catalog`, `block_descriptors`, `audit_events`, `teams` |

---

## 2. Key Platform Safeguards & Schema Rules

1. **Service Role Key Latch (`env.ts`):**  
   [`site/platform/supabase/env.ts:20-45`](file:///d:/23082026/site/platform/supabase/env.ts#L20-L45) includes `assertNotServiceRoleKey()`. If a superuser service-role JWT is accidentally assigned to `NEXT_PUBLIC_SUPABASE_ANON_KEY`, the client crashes immediately on startup.
2. **The `profiles` Schema Trap:**  
   The `profiles` table has **no `email` and no `role` column**. Writing either column triggers `PGRST204` (column not found).
3. **Migration Governance:**  
   All SQL migrations in `supabase/migrations/` and `supabase/migrations.admin/` must include `-- rollback:` comments, enforced by `pnpm run check:governance`.
4. **Retired Tables Archived:**  
   9 legacy tables (`plans`, `templates`, `users`, `leads`, etc.) were moved to schema `archive` on 2026-08-01 and are completely hidden from PostgREST APIs.
