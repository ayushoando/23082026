-- Tier 5 follow-up: After adding FK indexes in Tier 3, the advisor flagged
-- duplicates because the database already had idx_<table>_<col> indexes
-- created by older migrations that the Tier 3 migration didn't account for.
-- Keep the original (in-use) idx_* indexes; drop the new *_idx duplicates.

drop index if exists public.catalog_items_series_id_idx;
drop index if exists public.catalog_product_slug_aliases_canonical_slug_idx;
drop index if exists public.catalog_products_category_id_idx;
drop index if exists public.clients_user_id_idx;
drop index if exists public.plan_comments_share_id_idx;
drop index if exists public.plan_comments_plan_id_idx;
drop index if exists public.plan_shares_plan_id_idx;
drop index if exists public.plan_versions_plan_id_idx;
drop index if exists public.plans_user_id_idx;
drop index if exists public.plans_project_id_idx;
drop index if exists public.projects_client_id_idx;
drop index if exists public.projects_user_id_idx;
drop index if exists public.quotes_plan_id_idx;
drop index if exists public.quotes_user_id_idx;

-- rollback
-- recreate the Tier-3 FK indexes this file dropped (defs from 20260524233837)
-- create index if not exists catalog_items_series_id_idx on public.catalog_items (series_id);
-- create index if not exists catalog_product_slug_aliases_canonical_slug_idx on public.catalog_product_slug_aliases (canonical_slug);
-- create index if not exists catalog_products_category_id_idx on public.catalog_products (category_id);
-- create index if not exists clients_user_id_idx on public.clients (user_id);
-- create index if not exists plan_comments_share_id_idx on public.plan_comments (share_id);
-- create index if not exists plan_comments_plan_id_idx on public.plan_comments (plan_id);
-- create index if not exists plan_shares_plan_id_idx on public.plan_shares (plan_id);
-- create index if not exists plan_versions_plan_id_idx on public.plan_versions (plan_id);
-- create index if not exists plans_user_id_idx on public.plans (user_id);
-- create index if not exists plans_project_id_idx on public.plans (project_id);
-- create index if not exists projects_client_id_idx on public.projects (client_id);
-- create index if not exists projects_user_id_idx on public.projects (user_id);
-- create index if not exists quotes_plan_id_idx on public.quotes (plan_id);
-- create index if not exists quotes_user_id_idx on public.quotes (user_id);
