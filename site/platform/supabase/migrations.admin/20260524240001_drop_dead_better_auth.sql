-- Admin DB cleanup: drop dead better-auth scaffolding.
-- We are using Supabase Auth (auth.users) on this project.
-- These public.auth_* tables are leftover from a never-wired better-auth path.
-- Backups: backups/pre-split-admin-*.sql

drop table if exists public.auth_session       cascade;
drop table if exists public.auth_account       cascade;
drop table if exists public.auth_verification  cascade;
drop table if exists public.auth_user          cascade;

-- rollback:
-- Destructive migration: it drops never-wired better-auth scaffolding. To
-- undo, restore the public.auth_session / auth_account / auth_verification /
-- auth_user tables from backups/pre-split-admin-*.sql referenced above, or
-- re-run the better-auth init DDL if that path is ever adopted again.
