-- Planner Workstream 4: revision/schema columns and owner-scoped atomic idempotency.
-- Repository evidence: the prior oando_plans migration, generated Admin types,
-- and Drizzle support contain none of these contracts.

alter table public.oando_plans
  add column if not exists revision bigint,
  add column if not exists schema_version integer;

update public.oando_plans
set revision = case
      when jsonb_typeof(payload -> 'revision') = 'number'
        and payload ->> 'revision' ~ '^[0-9]+$'
        and (payload ->> 'revision')::numeric between 1 and 9223372036854775807
        then (payload ->> 'revision')::bigint
      else 1
    end,
    schema_version = case
      when jsonb_typeof(payload -> 'schemaVersion') = 'number'
        and payload ->> 'schemaVersion' ~ '^[0-9]+$'
        and (payload ->> 'schemaVersion')::numeric between 0 and 2147483647
        then (payload ->> 'schemaVersion')::integer
      when jsonb_typeof(payload -> 'schema_version') = 'number'
        and payload ->> 'schema_version' ~ '^[0-9]+$'
        and (payload ->> 'schema_version')::numeric between 0 and 2147483647
        then (payload ->> 'schema_version')::integer
      else 0
    end
where revision is null or schema_version is null;

alter table public.oando_plans
  alter column revision set default 1,
  alter column revision set not null,
  alter column schema_version set default 1,
  alter column schema_version set not null;

alter table public.oando_plans
  drop constraint if exists oando_plans_revision_check,
  add constraint oando_plans_revision_check check (revision >= 1),
  drop constraint if exists oando_plans_schema_version_check,
  add constraint oando_plans_schema_version_check check (schema_version >= 0);

create table if not exists public.planner_operation_idempotency (
  owner_id uuid not null references public.profiles (id) on delete cascade,
  operation text not null,
  project_id uuid not null,
  idempotency_key text not null,
  request_fingerprint text not null,
  response_status text not null,
  response_revision bigint,
  response_payload jsonb,
  response_name text,
  response_thumbnail_url text,
  response_plan_status text,
  response_created_at timestamptz,
  response_updated_at timestamptz,
  created_at timestamptz not null default now(),
  constraint planner_operation_idempotency_identity_key
    unique (owner_id, operation, project_id, idempotency_key),
  constraint planner_operation_idempotency_operation_check
    check (operation in ('create', 'save', 'delete')),
  constraint planner_operation_idempotency_key_check
    check (
      char_length(idempotency_key) between 1 and 120
      and idempotency_key ~ '^[A-Za-z0-9._~-]+$'
    ),
  constraint planner_operation_idempotency_fingerprint_check
    check (char_length(request_fingerprint) between 1 and 256),
  constraint planner_operation_idempotency_status_check
    check (response_status in ('processing', 'success', 'not_found', 'conflict')),
  constraint planner_operation_idempotency_revision_check
    check (response_revision is null or response_revision >= 1)
);

alter table public.planner_operation_idempotency
  add column if not exists response_payload jsonb,
  add column if not exists response_name text,
  add column if not exists response_thumbnail_url text,
  add column if not exists response_plan_status text,
  add column if not exists response_created_at timestamptz,
  add column if not exists response_updated_at timestamptz;

create index if not exists planner_operation_idempotency_created_at_idx
  on public.planner_operation_idempotency (created_at);

alter table public.planner_operation_idempotency enable row level security;

-- Owner policies remain defense in depth. Authenticated mutations use the
-- guarded RPC below, so direct authenticated table grants stay read-only.
drop policy if exists oando_plans_authenticated_select_own on public.oando_plans;
create policy oando_plans_authenticated_select_own
  on public.oando_plans for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists oando_plans_authenticated_insert_own on public.oando_plans;
create policy oando_plans_authenticated_insert_own
  on public.oando_plans for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists oando_plans_authenticated_update_own on public.oando_plans;
create policy oando_plans_authenticated_update_own
  on public.oando_plans for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists oando_plans_authenticated_delete_own on public.oando_plans;
create policy oando_plans_authenticated_delete_own
  on public.oando_plans for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists planner_operation_idempotency_service_role_all
  on public.planner_operation_idempotency;
create policy planner_operation_idempotency_service_role_all
  on public.planner_operation_idempotency for all to service_role
  using (true) with check (true);

drop policy if exists planner_operation_idempotency_authenticated_select_own
  on public.planner_operation_idempotency;
create policy planner_operation_idempotency_authenticated_select_own
  on public.planner_operation_idempotency for select to authenticated
  using (auth.uid() = owner_id);

drop policy if exists planner_operation_idempotency_authenticated_insert_own
  on public.planner_operation_idempotency;
create policy planner_operation_idempotency_authenticated_insert_own
  on public.planner_operation_idempotency for insert to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists planner_operation_idempotency_authenticated_update_own
  on public.planner_operation_idempotency;
create policy planner_operation_idempotency_authenticated_update_own
  on public.planner_operation_idempotency for update to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists planner_operation_idempotency_authenticated_delete_own
  on public.planner_operation_idempotency;
create policy planner_operation_idempotency_authenticated_delete_own
  on public.planner_operation_idempotency for delete to authenticated
  using (auth.uid() = owner_id);

drop function if exists public.planner_mutate_plan_v1(
  uuid, text, uuid, bigint, text, text, text, jsonb, text, text, integer
);

create or replace function public.planner_mutate_plan_v1(
  p_owner_id uuid,
  p_operation text,
  p_project_id uuid,
  p_expected_revision bigint,
  p_idempotency_key text,
  p_request_fingerprint text,
  p_name text default null,
  p_payload jsonb default null,
  p_thumbnail_url text default null,
  p_status text default null,
  p_schema_version integer default 1
)
returns table (
  response_status text,
  response_revision bigint,
  response_payload jsonb,
  response_name text,
  response_thumbnail_url text,
  response_plan_status text,
  response_created_at timestamptz,
  response_updated_at timestamptz,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := coalesce(auth.jwt() ->> 'role', '');
  v_claimed boolean := false;
  v_stored_fingerprint text;
  v_stored_status text;
  v_stored_revision bigint;
  v_stored_payload jsonb;
  v_stored_name text;
  v_stored_thumbnail_url text;
  v_stored_plan_status text;
  v_stored_created_at timestamptz;
  v_stored_updated_at timestamptz;
  v_current_revision bigint;
begin
  if v_role not in ('authenticated', 'service_role') then
    raise exception 'planner mutation role rejected' using errcode = '42501';
  end if;
  if v_role = 'authenticated' and auth.uid() is distinct from p_owner_id then
    raise exception 'planner mutation owner rejected' using errcode = '42501';
  end if;
  if p_operation not in ('create', 'save', 'delete')
    or p_expected_revision < 0
    or p_idempotency_key !~ '^[A-Za-z0-9._~-]{1,120}$'
    or char_length(p_request_fingerprint) not between 1 and 256
    or p_schema_version < 0 then
    raise exception 'planner mutation input rejected' using errcode = '22023';
  end if;

  insert into public.planner_operation_idempotency (
    owner_id, operation, project_id, idempotency_key,
    request_fingerprint, response_status
  ) values (
    p_owner_id, p_operation, p_project_id, p_idempotency_key,
    p_request_fingerprint, 'processing'
  )
  on conflict (owner_id, operation, project_id, idempotency_key) do nothing
  returning true into v_claimed;

  if not v_claimed then
    select receipt.request_fingerprint,
           receipt.response_status,
           receipt.response_revision,
           receipt.response_payload,
           receipt.response_name,
           receipt.response_thumbnail_url,
           receipt.response_plan_status,
           receipt.response_created_at,
           receipt.response_updated_at
      into v_stored_fingerprint,
           v_stored_status,
           v_stored_revision,
           v_stored_payload,
           v_stored_name,
           v_stored_thumbnail_url,
           v_stored_plan_status,
           v_stored_created_at,
           v_stored_updated_at
    from public.planner_operation_idempotency as receipt
    where receipt.owner_id = p_owner_id
      and receipt.operation = p_operation
      and receipt.project_id = p_project_id
      and receipt.idempotency_key = p_idempotency_key
    for update;

    if v_stored_fingerprint is distinct from p_request_fingerprint
      or v_stored_status = 'processing' then
      return query select
        'conflict'::text,
        v_stored_revision,
        null::jsonb,
        null::text,
        null::text,
        null::text,
        null::timestamptz,
        null::timestamptz,
        false;
    else
      return query select
        v_stored_status,
        v_stored_revision,
        v_stored_payload,
        v_stored_name,
        v_stored_thumbnail_url,
        v_stored_plan_status,
        v_stored_created_at,
        v_stored_updated_at,
        true;
    end if;
    return;
  end if;

  if p_operation = 'create' then
    if p_expected_revision <> 0 then
      v_stored_status := 'conflict';
    else
      insert into public.oando_plans (
        id, user_id, name, engine, payload, thumbnail_url, status,
        revision, schema_version
      ) values (
        p_project_id, p_owner_id, coalesce(p_name, 'Untitled'), 'ooplanner',
        coalesce(p_payload, '{}'::jsonb), p_thumbnail_url,
        coalesce(p_status, 'draft'), 1, p_schema_version
      )
      on conflict (id) do nothing
      returning revision, payload, name, thumbnail_url, status, created_at, updated_at
        into v_stored_revision, v_stored_payload, v_stored_name,
             v_stored_thumbnail_url, v_stored_plan_status,
             v_stored_created_at, v_stored_updated_at;
      v_stored_status := case when v_stored_revision is null then 'conflict' else 'success' end;
    end if;
  elsif p_operation = 'save' then
    update public.oando_plans as plan
    set name = coalesce(p_name, plan.name),
        payload = coalesce(p_payload, plan.payload),
        thumbnail_url = p_thumbnail_url,
        status = coalesce(p_status, plan.status),
        schema_version = p_schema_version,
        revision = plan.revision + 1,
        updated_at = now()
    where plan.id = p_project_id
      and plan.user_id = p_owner_id
      and plan.revision = p_expected_revision
    returning plan.revision, plan.payload, plan.name, plan.thumbnail_url,
              plan.status, plan.created_at, plan.updated_at
      into v_stored_revision, v_stored_payload, v_stored_name,
           v_stored_thumbnail_url, v_stored_plan_status,
           v_stored_created_at, v_stored_updated_at;
    if v_stored_revision is not null then
      v_stored_status := 'success';
    else
      select plan.revision into v_current_revision
      from public.oando_plans as plan
      where plan.id = p_project_id and plan.user_id = p_owner_id;
      v_stored_status := case when v_current_revision is null then 'not_found' else 'conflict' end;
      v_stored_revision := v_current_revision;
    end if;
  else
    delete from public.oando_plans as plan
    where plan.id = p_project_id
      and plan.user_id = p_owner_id
      and plan.revision = p_expected_revision
    returning plan.revision into v_stored_revision;
    if v_stored_revision is not null then
      v_stored_status := 'success';
    else
      select plan.revision into v_current_revision
      from public.oando_plans as plan
      where plan.id = p_project_id and plan.user_id = p_owner_id;
      v_stored_status := case when v_current_revision is null then 'not_found' else 'conflict' end;
      v_stored_revision := v_current_revision;
    end if;
  end if;

  update public.planner_operation_idempotency as receipt
  set response_status = v_stored_status,
      response_revision = v_stored_revision,
      response_payload = case
        when p_operation in ('create', 'save') and v_stored_status = 'success'
          then v_stored_payload
        else null
      end,
      response_name = case
        when p_operation in ('create', 'save') and v_stored_status = 'success'
          then v_stored_name
        else null
      end,
      response_thumbnail_url = case
        when p_operation in ('create', 'save') and v_stored_status = 'success'
          then v_stored_thumbnail_url
        else null
      end,
      response_plan_status = case
        when p_operation in ('create', 'save') and v_stored_status = 'success'
          then v_stored_plan_status
        else null
      end,
      response_created_at = case
        when p_operation in ('create', 'save') and v_stored_status = 'success'
          then v_stored_created_at
        else null
      end,
      response_updated_at = case
        when p_operation in ('create', 'save') and v_stored_status = 'success'
          then v_stored_updated_at
        else null
      end
  where receipt.owner_id = p_owner_id
    and receipt.operation = p_operation
    and receipt.project_id = p_project_id
    and receipt.idempotency_key = p_idempotency_key;

  return query select
    v_stored_status,
    v_stored_revision,
    v_stored_payload,
    v_stored_name,
    v_stored_thumbnail_url,
    v_stored_plan_status,
    v_stored_created_at,
    v_stored_updated_at,
    false;
end;
$$;

revoke all on table public.oando_plans from public, anon;
revoke all on table public.planner_operation_idempotency from public, anon;
revoke all on function public.planner_mutate_plan_v1(
  uuid, text, uuid, bigint, text, text, text, jsonb, text, text, integer
) from public, anon;

grant select on table public.oando_plans to authenticated;
grant select on table public.planner_operation_idempotency to authenticated;
grant select, insert, update, delete on table public.oando_plans to service_role;
grant select, insert, update, delete on table public.planner_operation_idempotency to service_role;
grant execute on function public.planner_mutate_plan_v1(
  uuid, text, uuid, bigint, text, text, text, jsonb, text, text, integer
) to authenticated, service_role;

-- rollback:
-- revoke execute on function public.planner_mutate_plan_v1(uuid, text, uuid, bigint, text, text, text, jsonb, text, text, integer) from authenticated, service_role;
-- revoke select on table public.planner_operation_idempotency from authenticated;
-- revoke select, insert, update, delete on table public.planner_operation_idempotency from service_role;
-- revoke select on table public.oando_plans from authenticated;
-- revoke select, insert, update, delete on table public.oando_plans from service_role;
-- drop policy if exists planner_operation_idempotency_authenticated_delete_own on public.planner_operation_idempotency;
-- drop policy if exists planner_operation_idempotency_authenticated_update_own on public.planner_operation_idempotency;
-- drop policy if exists planner_operation_idempotency_authenticated_insert_own on public.planner_operation_idempotency;
-- drop policy if exists planner_operation_idempotency_authenticated_select_own on public.planner_operation_idempotency;
-- drop policy if exists planner_operation_idempotency_service_role_all on public.planner_operation_idempotency;
-- drop policy if exists oando_plans_authenticated_delete_own on public.oando_plans;
-- drop policy if exists oando_plans_authenticated_update_own on public.oando_plans;
-- drop policy if exists oando_plans_authenticated_insert_own on public.oando_plans;
-- drop policy if exists oando_plans_authenticated_select_own on public.oando_plans;
-- drop function if exists public.planner_mutate_plan_v1(uuid, text, uuid, bigint, text, text, text, jsonb, text, text, integer);
-- drop table if exists public.planner_operation_idempotency;
-- alter table public.oando_plans drop constraint if exists oando_plans_schema_version_check;
-- alter table public.oando_plans drop constraint if exists oando_plans_revision_check;
-- alter table public.oando_plans drop column if exists schema_version;
-- alter table public.oando_plans drop column if exists revision;
