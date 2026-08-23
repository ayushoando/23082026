-- Cleanup: Drop dead better-auth scaffolding and unused legacy tables.
-- A backup of all rows in these tables was written to backups/pre-cleanup-*.sql
-- prior to this migration.
--
-- These tables have NO references in app code. better-auth was never wired up;
-- the live auth path uses Supabase Auth (auth.users + supabase.auth.getUser).

drop table if exists public.auth_session       cascade;
drop table if exists public.auth_account       cascade;
drop table if exists public.auth_verification  cascade;
drop table if exists public.auth_user          cascade;
drop table if exists public.legacy_projects    cascade;
drop table if exists public.__drizzle_migrations cascade;

-- rollback
-- This file only DROPs tables and contains no CREATE TABLE DDL.
-- Undo: restore public.auth_session, public.auth_account, public.auth_verification,
-- public.auth_user, public.legacy_projects, public.__drizzle_migrations
-- from backups/pre-cleanup-*.sql (see header). Do not invent schemas here.
