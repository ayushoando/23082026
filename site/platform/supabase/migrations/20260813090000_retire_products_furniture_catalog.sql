-- ---------------------------------------------------------------------------
-- Retire Products-DB furniture_catalog (legacy mirror) -> archive
-- ---------------------------------------------------------------------------
-- The shared Studio/Planner furniture library moved to the Admin DB
-- (public.furniture_catalog) on 2026-08-06. The Products-DB copy is a legacy
-- mirror with zero live readers: the Planner rail and Studio both address the
-- furniture library via furnitureCatalogMode -> Admin Supabase, and no public
-- table references this copy via FK (verified 2026-08-13).
--
-- Retired per governance E4: moved to the `archive` schema (data preserved,
-- invisible to PostgREST) rather than a bare drop. Policies/grants travel with
-- the table and are inert while it lives outside `public`; rollback restores it
-- wholesale.

create schema if not exists archive;

alter table public.furniture_catalog set schema archive;

comment on schema archive is
  'Retired Products tables. Not exposed by PostgREST; kept for restore/audit.';

-- rollback:
-- alter table archive.furniture_catalog set schema public;