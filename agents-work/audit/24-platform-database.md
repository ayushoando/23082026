# 24 — Platform, Database & Server Layer Deep Audit

## Structure

`site/platform/drizzle/` (dual clients + schemas), `site/platform/supabase/` (6 clients + 2 migration sets + edge function), `platform/types/` (2 generated type files), `platform/shared/data/furniture/` (56 disk dev files), `platform/Studio/data/seed-furniture.json` (16 specs), `site/inventory/descriptors/` (23 files).

## Schema inventory

- **Products DB** (`drizzle/schema/catalog.ts`, 284 lines): 14 tables — `catalog_products/categories/product_specs/product_images/product_slug_aliases`, `configurator_products`, `business_stats_current`, `svg_revisions`, `svg_revision_artifacts`, 4 × `svg_*_v2`, `planner_managed_products`.
- **Admin DB** (`drizzle/schema/planner.ts`, 177 lines): 11 tables — `profiles`, `oando_plans`, `planner_operation_idempotency`, `teams`, `team_members`, `invites`, `price_books`, `price_book_versions`, `audit_events`, `furniture_catalog`, `block_descriptors`.

## Findings

| # | Severity | Finding |
|---|----------|---------|
| 24.1 | **Med** | **P4 baseline is stale, not a live defect list:** grep over all 64 supabase migrations shows **every file contains `-- rollback` today** — 0 lack the marker. Baseline `P4_migration_no_rollback: 8` (historically 42 per `plans/db-audit/README.md:11`) passes the ratchet but should be re-recorded to 0. Report 20's "retire the 8" recommendation is therefore already satisfied at file level; only the baseline number lags. |
| 24.2 | **Med** | **Blind spot:** the 3 Drizzle SQL files (`drizzle/migrations/0000_…`, `0001_add_missing_indexes.sql`, `products/0002_svg_assets_v2.sql`) have **no rollback sections and are not scanned by P4** (only the two supabase dirs are). `products/0002_svg_assets_v2.sql` also sits outside `meta/_journal.json` — un-journaled. |
| 24.3 | **Med** | **`site/platform/supabase/types.ts` is a stale hand-written Products type** containing only `image_assets` — a table archived out of `public` by migration `20260814200000`. Still used by `adminServer.ts`, forcing cast/"narrow query shape" workarounds in `rateLimit.ts:192` and `admin/themes/route.ts:64-76`. Two competing Database types for the same project (generated `platform/types/database.types.ts` vs this). Fix: migrate `adminServer.ts` to generated types, delete the hand-written one. |
| 24.4 | **Med** | **`admin/themes` route reads a table that no longer exists in any live schema:** `route.ts:16,53` reads `block_themes` via the Products client, but Products migration archived `block_themes` and Admin has no such table — the route can only ever serve built-in starter packs. Same class: `rateLimit.ts:135-200` targets a `rate_limits` table that exists **nowhere** (acknowledged in code + db-audit) — every DB attempt errors → in-memory fallback, which is why report 10's fail-open finding matters. |
| 24.5 | Med | **`drizzle.config.ts` targets the Admin URL while including `catalog.ts` (Products tables)** in its schema — drizzle-kit operations for Products-defined tables run against Admin. Footgun for any `db:push`-style command. |
| 24.6 | Low | **Products generated types missing the 4 `svg_*_v2` tables** present in drizzle schema/migration (0 hits in `database.types.ts`) — only the Drizzle wire path is typed; `pnpm run db:types` regen needed once applied to the live project. |
| 24.7 | Low | **Duplicate env plumbing:** `features/shared/catalog/catalogAssetStorage.server.ts:62-76` builds its own raw service client from `process.env` instead of using `platform/supabase/supabaseAdmin.ts`; `updateFeatureFlags.server.ts:58-71` duplicates the auth-admin factory. Routing correct in both, factories duplicated. |
| 24.8 | Info (positive) | **Two-DB discipline verified correct table-by-table:** furniture_catalog + block_descriptors + oando_plans + handoffs + user_history + customer_queries → Admin (auth-admin client or adminDb); catalog_* + configurator_products → Products (productsDb); planner_managed_products → Products service client. No Admin↔Products table misuse found. |
| 24.9 | Info (positive) | **Legacy `site/data/storage/`: zero code references.** Grep across `site/` + `platform/` finds no path usage — the stale dir (report 04) is unreferenced leftover only, safe for user-confirmed deletion. |
| 24.10 | Info (positive) | Server tree clean: all raw writes behind `assertDevDiskWritable` (8 call sites); only `providerFetch.server.ts:55` reads `process.env` directly (GEMINI fallback); wrappers complete for furniture/plans/exports. |

## Seed data flow (verified)

`seed-furniture.json` (16 specs) → `studioFurnitureSeed.ts` materializes `shared/data/furniture/seed_*.json` + SVGs in disk mode; `seed:furniture` → `seed_furniture_catalog.ts` inserts into **Admin** `public.furniture_catalog` (idempotent by id, `--dry`/`--force`, off the read path).
