-- 20 Phase 2 · first-party event store (Admin DB rxzpznmxbaoxpikowmfc)
-- Stores consented site/planner funnel events for /admin/analytics.
-- Intake: POST /api/events (allowlist from conversionContract, origin+rate, payload cap ~8 KB, server-side privacy filter).
-- Transport stays dual-emit: @vercel/analytics track() + fetch('/api/events', { keepalive: true }) → queue fallback.
-- Evidence: results/analytics/tracking-probe.txt · results/onboarding/sample-workspace-spec.txt

create extension if not exists "pgcrypto";

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  payload jsonb not null default '{}'::jsonb,
  pathname text,
  locale text not null default 'en',
  source text,
  session_id text,
  created_at timestamptz not null default now(),
  constraint analytics_events_name_check check (char_length(name) between 1 and 64)
);

create index if not exists analytics_events_name_created_at_idx
  on public.analytics_events (name, created_at desc);
create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);
create index if not exists analytics_events_session_id_idx
  on public.analytics_events (session_id);
create index if not exists analytics_events_pathname_idx
  on public.analytics_events (pathname);

alter table public.analytics_events enable row level security;

-- Insert-only for anon + authenticated (member/guest via anon key). No select/update/delete for those roles.
drop policy if exists "analytics_events anon insert" on public.analytics_events;
create policy "analytics_events anon insert"
  on public.analytics_events
  for insert
  to anon
  with check (true);

drop policy if exists "analytics_events authenticated insert" on public.analytics_events;
create policy "analytics_events authenticated insert"
  on public.analytics_events
  for insert
  to authenticated
  with check (true);

-- Admin read via service_role (server-side /api/admin/analytics uses service role). No anon/auth select.
drop policy if exists "analytics_events service select" on public.analytics_events;
create policy "analytics_events service select"
  on public.analytics_events
  for select
  to service_role
  using (true);

drop policy if exists "analytics_events service write" on public.analytics_events;
create policy "analytics_events service write"
  on public.analytics_events
  for all
  to service_role
  using (true)
  with check (true);

-- Grants mirror RLS: insert for anon/auth, select for service_role (admin dashboard reads server-side).
grant insert on public.analytics_events to anon, authenticated;
grant select on public.analytics_events to service_role;
grant all on public.analytics_events to service_role;

-- rollback:
-- drop policy if exists "analytics_events authenticated insert" on public.analytics_events;
-- drop policy if exists "analytics_events anon insert" on public.analytics_events;
-- drop policy if exists "analytics_events service select" on public.analytics_events;
-- drop policy if exists "analytics_events service write" on public.analytics_events;
-- drop index if exists public.analytics_events_pathname_idx;
-- drop index if exists public.analytics_events_session_id_idx;
-- drop index if exists public.analytics_events_created_at_idx;
-- drop index if exists public.analytics_events_name_created_at_idx;
-- drop table if exists public.analytics_events;
