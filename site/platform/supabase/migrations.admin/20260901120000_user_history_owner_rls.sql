-- SEC-R08: owner-scoped RLS on public.user_history (Admin DB).
--
-- Background: product-view tracking is written by /api/tracking. Until now
-- every write used the service-role key, which bypasses RLS entirely and
-- widened the exposure surface of the service key on public-facing traffic
-- (seosec finding SEC-M03).
--
-- This migration adds an additive policy: an authenticated caller may read
-- and write ONLY the row whose user_id matches their own JWT subject. The
-- tracking route now forwards the visitor's bearer token through
-- createSupabaseAuthAnonClient(token), so authenticated persistence runs as
-- `authenticated` under this policy instead of service_role.
--
-- Anonymous cookie visitors have no JWT whose subject proves row ownership,
-- so anonymous tracking intentionally remains server-mediated via the
-- service-role path (identity = possession of the httpOnly anon cookie).
-- The existing user_history_service_role_all policy is unchanged.

grant select, insert, update on public.user_history to authenticated;

alter table public.user_history enable row level security;

drop policy if exists user_history_owner_dml on public.user_history;
create policy user_history_owner_dml
  on public.user_history
  for all
  to authenticated
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

-- rollback:
-- drop policy if exists user_history_owner_dml on public.user_history;
-- revoke select, insert, update on public.user_history from authenticated;
