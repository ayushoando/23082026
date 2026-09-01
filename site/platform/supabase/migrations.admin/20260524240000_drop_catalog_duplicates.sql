-- Admin DB cleanup: drop stale catalog duplicates.
-- The products DB (oando) is the source of truth for the entire catalog domain.
-- These tables on admin are leftover copies and contain stale data.
-- Backups: backups/pre-split-admin-*.sql

drop table if exists public.product_images          cascade;
drop table if exists public.product_specs           cascade;
drop table if exists public.products                cascade;
drop table if exists public.categories              cascade;

drop table if exists public.catalog_product_images  cascade;
drop table if exists public.catalog_product_specs   cascade;
drop table if exists public.catalog_products        cascade;
drop table if exists public.catalog_items           cascade;
drop table if exists public.catalog_categories      cascade;
drop table if exists public.series                  cascade;

drop table if exists public.__drizzle_migrations    cascade;

-- rollback:
-- Destructive migration: it drops stale duplicate copies of the catalog
-- domain. To undo, re-create the affected tables from the Products DB
-- (source of truth) or from backups/pre-split-admin-*.sql referenced above:
--   product_images, product_specs, products, categories, catalog_product_images,
--   catalog_product_specs, catalog_products, catalog_items, catalog_categories,
--   series, __drizzle_migrations
-- No admin runtime reads these tables; re-creating them is only required if
-- the split decision itself is reverted.
