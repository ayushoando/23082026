# Database ownership and schema

This reference assigns tables and migrations to the Products and Admin Supabase projects and records the required row-level security (RLS), grant, and persistence boundaries. Migration source, generated types, and live client code take precedence; environment-specific state remains present-but-unverified until an authorized observation is recorded.

> **Production filesystem is read-only.** Runtime writes in production go to Supabase through mode-aware wrappers, never raw disk helpers.

## Two databases

The repository configures two separate Supabase projects with distinct references, migration directories, and client factories.

| DB | Project ref | Env | Migrations / Drizzle |
|----|-------------|-----|----------------------|
| **Products** | `erpweaiypimorcunaimz` | `PRODUCTS_DATABASE_URL` | `site/platform/supabase/migrations/` · `site/platform/drizzle/schema/catalog.ts` |
| **Admin / Planner** | `rxzpznmxbaoxpikowmfc` | `SUPABASE_AUTH_DATABASE_URL` | `site/platform/supabase/migrations.admin/` · `site/platform/drizzle/schema/planner.ts` |

`SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` both point at the **Products**
project. The `catalog-assets` bucket stores uploaded asset bytes there; the
`furniture_catalog` and `block_descriptors` rows remain in **Admin**.

Clients: `@/platform/supabase/supabaseAdmin.ts` (products, service role),
`auth-admin.ts` (admin, service role), `server.ts` (request-scoped anon).

## Products database tables

The following tables are represented by current migrations and schema source. This static list does not prove their state in a particular hosted environment.

| Table | Role |
|-------|------|
| `catalog_products` · `catalog_categories` · `catalog_product_specs` · `catalog_product_images` · `catalog_product_slug_aliases` | Marketing catalog |
| `catalog_items` · `series` · `templates` | Reference series |
| `business_stats_current` · `business_stats_history` | Site stats |
| `configurator_products` | Parametric catalog (separate from marketing) |
| `planner_managed_products` | Admin-curated planner library |
| *(not in Products `public`)* | `furniture_catalog` and `block_descriptors` live on **Admin**. Products leftover is `archive.furniture_catalog` if present — do not treat as a live Products table |
| `svg_revisions` · `svg_revision_artifacts` | Legacy SVG revision schema — residual |
| `_local_migration_history` | Local apply bookkeeping |

## Admin database tables

The following tables are represented by current Admin migrations and generated types. Hosted state remains present-but-unverified without an authorized environment observation.

| Table | Role |
|-------|------|
| `oando_plans` | Planner document table (`payload` jsonb); FK `user_id → profiles.id` |
| `profiles` | User row — `id`, `display_name`, `avatar_url`, `created_at` only |
| `planner_handoffs` | BOQ handoff records (customer contact + BOQ) |
| `planner_settings` | Planner preferences |
| `customer_queries` | Contact form / ops queue |
| `teams` · `team_members` · `invites` · `offices` | Team model |
| `price_books` · `price_book_versions` | Price books |
| `product_studio_templates` · `product_studio_template_audit` · `product_studio_drafts` | Admin product-studio store |
| `workspace_editor_configs` · `workspace_editor_config_audit` | Workspace editor store |
| `admin_modules` · `feature_flags` | Admin module registry / flags |
| `audit_events` · `user_history` | Audit |
| `furniture_catalog` | Shared Studio/Planner furniture library (migrated from Products DB in phase 05 cutover, 2026-08-06) |
| `block_descriptors` | Published descriptor release record + `lifecycle` (migrated from Products DB in phase 05 cutover, 2026-08-06) |
| `_local_migration_history` | Local apply bookkeeping |

`profiles` has **no `email` and no `role` column.** Writing either returns
PGRST204 — this previously broke every production Planner save (pre-deploy B4 —
profile upsert fix).

### `archive` schema — 9 retired tables

Moved out of `public` by `20260801110000_archive_legacy_planner_tables.sql`. Data
preserved, foreign keys intact, invisible to PostgREST (which exposes `public` only).

`plans` (6 rows) · `templates` (4) · `users` (2) · `plan_versions` ·
`plan_shares` · `plan_comments` · `projects` · `clients` · `quotes`

They predate the `oando_plans` cutover and had zero readers in `site/` or
`scripts/`. **`archive.plans` is not the Planner store — `public.oando_plans` is.**

## RLS

Migration sources configure RLS and policies for both databases. Hosted enforcement remains present-but-unverified until an authorized environment observation records it.

- Catalog + `furniture_catalog`: public `select`, writes service-role.
- `customer_queries`: public insert.
- `planner_handoffs`: `select` scoped to `created_by = auth.uid()`. Unowned rows
  (anonymous captures) are service-role only — staff read them through admin.
- **Service-role-only by design** (RLS on, **zero** policies): as of 2026-08-13
  both databases have **none** — every RLS-enabled `public` table carries at
  least one policy. Pinned empty sets in
  `tests/unit/platform/serviceRoleOnlyTables.db.test.ts`
  (`ADMIN_SERVICE_ROLE_ONLY = []`, `PRODUCTS_SERVICE_ROLE_ONLY = []`). Former
  admin pins (`block_descriptors`, `product_studio_*`, `workspace_editor_config*`,
  `_local_migration_history`) and product pins (`block_themes`, `svg_revisions`,
  `svg_revision_artifacts`) now have policies. Re-add a pin only when a
  deliberate zero-policy store is introduced.

A policy alone is not enough: Supabase also needs the table **grant**.
`grant select … to anon, authenticated` plus `grant all … to service_role`, or
reads fail with "permission denied for table" despite a matching policy.

## Commands

| Goal | Command |
|------|---------|
| Apply Products | `pnpm run db:apply -- --dry`, then reviewed `pnpm run db:apply` |
| Apply Admin | `pnpm run db:apply:admin -- --dry`, then reviewed `pnpm run db:apply:admin` |
| Seed furniture library | `pnpm run seed:furniture` |
| Regenerate admin types | `pnpm run db:types:admin` |
| Regenerate products types | `pnpm run db:types` |
| Verify Admin Drizzle | `pnpm run ops db:sync-drizzle` |
| Advisors | `pnpm run ops db:advisors` / `:admin` |

`db:apply` selects every migration from the managed batch start onward lexicographically and
records applied files in `_local_migration_history`. Pre-batch files (`001_*`,
`20240101*`, `20250522*`, `20260101*`) are deliberately excluded — they were
applied out of band.

Every migration needs a `-- rollback` section; `check:governance` ratchets
`P4_migration_no_rollback` against the current baseline.

## Known drift

- `site/platform/types/database.types.ts` (products) is Supabase-CLI generated.
- `db:types:admin` writes `site/platform/types/database.admin.types.ts` — the path the
  app actually imports. It previously wrote `config/database/types/`, which
  nothing reads.

## Not this file

- Not proof migrations ran on a given environment
- Not a substitute for reading SQL under `site/platform/supabase/migrations*/`
- Drizzle-kit ledger (not `db:apply`): `site/platform/drizzle/migrations/meta/_journal.json`
