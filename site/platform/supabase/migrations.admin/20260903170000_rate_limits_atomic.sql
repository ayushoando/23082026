-- Distributed, service-role-only rate limiting for the Admin Supabase project.
-- The single RPC makes the window reset and increment decision atomic across
-- concurrent server instances.

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null check (count >= 0),
  window_start bigint not null check (window_start >= 0)
);

alter table public.rate_limits enable row level security;

revoke all on table public.rate_limits from anon, authenticated;
grant select, insert, update, delete on table public.rate_limits to service_role;

comment on table public.rate_limits is
  'service_role only by design - RLS on, no policies; atomic API request rate limiting.';

create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_ms bigint
)
returns table (allowed boolean, count integer, window_start bigint)
language plpgsql
set search_path = public
as $$
declare
  now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  if p_key is null or btrim(p_key) = '' then
    raise exception 'Rate limit key must not be empty';
  end if;
  if p_limit <= 0 then
    raise exception 'Rate limit must be positive';
  end if;
  if p_window_ms <= 0 then
    raise exception 'Rate limit window must be positive';
  end if;

  return query
  insert into public.rate_limits as rate_limit (key, count, window_start)
  values (p_key, 1, now_ms)
  on conflict (key) do update
  set
    count = case
      when rate_limit.window_start <= now_ms - p_window_ms then 1
      else rate_limit.count + 1
    end,
    window_start = case
      when rate_limit.window_start <= now_ms - p_window_ms then now_ms
      else rate_limit.window_start
    end
  returning
    rate_limit.count <= p_limit,
    rate_limit.count,
    rate_limit.window_start;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, bigint) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, bigint) to service_role;

-- rollback:
-- revoke execute on function public.consume_rate_limit(text, integer, bigint) from service_role;
-- drop function if exists public.consume_rate_limit(text, integer, bigint);
-- drop table if exists public.rate_limits;
