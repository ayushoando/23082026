-- Planner Workstream 4: fix idempotency replay detection in planner_mutate_plan_v1.
--
-- Root cause: when INSERT ... ON CONFLICT DO NOTHING skips the insert,
-- the RETURNING clause produces no row, so v_claimed stays NULL (not FALSE).
-- The prior guard `if not v_claimed` evaluates to TRUE for both NULL and FALSE,
-- so the function incorrectly re-enters the new-mutation branch on a replay,
-- overwrites the existing receipt status with "conflict", and returns
-- response_status:"conflict", replayed:false instead of status:"success", replayed:true.
--
-- Fix: replace the BOOLEAN variable guard with IS NOT TRUE so that only an
-- explicit true (meaning the INSERT actually wrote a row and claimed ownership)
-- bypasses the receipt-read branch.  The rest of the function body is unchanged.

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

  -- FIX: use IS NOT TRUE so that a NULL v_claimed (ON CONFLICT DO NOTHING
  -- skipped the insert and returned no row) is treated as "did not claim"
  -- and correctly falls through to the existing-receipt read path.
  -- The prior `if not v_claimed` treated NULL identically to FALSE, which was
  -- correct for a fresh NULL-initialised variable, but after the INSERT the
  -- variable is either TRUE (claimed) or still NULL (conflict skip), never
  -- explicitly set to FALSE, so the guard must test IS NOT TRUE.
  if v_claimed is not true then
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

-- Grants unchanged from prior migration — function signature is identical.
revoke all on function public.planner_mutate_plan_v1(
  uuid, text, uuid, bigint, text, text, text, jsonb, text, text, integer
) from public, anon;
grant execute on function public.planner_mutate_plan_v1(
  uuid, text, uuid, bigint, text, text, text, jsonb, text, text, integer
) to authenticated, service_role;

-- rollback:
-- Restore the prior function body (with `if not v_claimed` guard).
-- drop function if exists public.planner_mutate_plan_v1(uuid, text, uuid, bigint, text, text, text, jsonb, text, text, integer);
-- create or replace function public.planner_mutate_plan_v1(p_owner_id uuid, p_operation text, p_project_id uuid, p_expected_revision bigint, p_idempotency_key text, p_request_fingerprint text, p_name text default null, p_payload jsonb default null, p_thumbnail_url text default null, p_status text default null, p_schema_version integer default 1) returns table (response_status text, response_revision bigint, response_payload jsonb, response_name text, response_thumbnail_url text, response_plan_status text, response_created_at timestamptz, response_updated_at timestamptz, replayed boolean) language plpgsql security definer set search_path = '' as $BODY$ declare v_role text := coalesce(auth.jwt() ->> 'role', ''); v_claimed boolean := false; v_stored_fingerprint text; v_stored_status text; v_stored_revision bigint; v_stored_payload jsonb; v_stored_name text; v_stored_thumbnail_url text; v_stored_plan_status text; v_stored_created_at timestamptz; v_stored_updated_at timestamptz; v_current_revision bigint; begin if v_role not in ('authenticated', 'service_role') then raise exception 'planner mutation role rejected' using errcode = '42501'; end if; if v_role = 'authenticated' and auth.uid() is distinct from p_owner_id then raise exception 'planner mutation owner rejected' using errcode = '42501'; end if; if p_operation not in ('create', 'save', 'delete') or p_expected_revision < 0 or p_idempotency_key !~ '^[A-Za-z0-9._~-]{1,120}$' or char_length(p_request_fingerprint) not between 1 and 256 or p_schema_version < 0 then raise exception 'planner mutation input rejected' using errcode = '22023'; end if; insert into public.planner_operation_idempotency (owner_id, operation, project_id, idempotency_key, request_fingerprint, response_status) values (p_owner_id, p_operation, p_project_id, p_idempotency_key, p_request_fingerprint, 'processing') on conflict (owner_id, operation, project_id, idempotency_key) do nothing returning true into v_claimed; if not v_claimed then select receipt.request_fingerprint, receipt.response_status, receipt.response_revision, receipt.response_payload, receipt.response_name, receipt.response_thumbnail_url, receipt.response_plan_status, receipt.response_created_at, receipt.response_updated_at into v_stored_fingerprint, v_stored_status, v_stored_revision, v_stored_payload, v_stored_name, v_stored_thumbnail_url, v_stored_plan_status, v_stored_created_at, v_stored_updated_at from public.planner_operation_idempotency as receipt where receipt.owner_id = p_owner_id and receipt.operation = p_operation and receipt.project_id = p_project_id and receipt.idempotency_key = p_idempotency_key for update; if v_stored_fingerprint is distinct from p_request_fingerprint or v_stored_status = 'processing' then return query select 'conflict'::text, v_stored_revision, null::jsonb, null::text, null::text, null::text, null::timestamptz, null::timestamptz, false; else return query select v_stored_status, v_stored_revision, v_stored_payload, v_stored_name, v_stored_thumbnail_url, v_stored_plan_status, v_stored_created_at, v_stored_updated_at, true; end if; return; end if; if p_operation = 'create' then if p_expected_revision <> 0 then v_stored_status := 'conflict'; else insert into public.oando_plans (id, user_id, name, engine, payload, thumbnail_url, status, revision, schema_version) values (p_project_id, p_owner_id, coalesce(p_name, 'Untitled'), 'ooplanner', coalesce(p_payload, '{}'::jsonb), p_thumbnail_url, coalesce(p_status, 'draft'), 1, p_schema_version) on conflict (id) do nothing returning revision, payload, name, thumbnail_url, status, created_at, updated_at into v_stored_revision, v_stored_payload, v_stored_name, v_stored_thumbnail_url, v_stored_plan_status, v_stored_created_at, v_stored_updated_at; v_stored_status := case when v_stored_revision is null then 'conflict' else 'success' end; end if; elsif p_operation = 'save' then update public.oando_plans as plan set name = coalesce(p_name, plan.name), payload = coalesce(p_payload, plan.payload), thumbnail_url = p_thumbnail_url, status = coalesce(p_status, plan.status), schema_version = p_schema_version, revision = plan.revision + 1, updated_at = now() where plan.id = p_project_id and plan.user_id = p_owner_id and plan.revision = p_expected_revision returning plan.revision, plan.payload, plan.name, plan.thumbnail_url, plan.status, plan.created_at, plan.updated_at into v_stored_revision, v_stored_payload, v_stored_name, v_stored_thumbnail_url, v_stored_plan_status, v_stored_created_at, v_stored_updated_at; if v_stored_revision is not null then v_stored_status := 'success'; else select plan.revision into v_current_revision from public.oando_plans as plan where plan.id = p_project_id and plan.user_id = p_owner_id; v_stored_status := case when v_current_revision is null then 'not_found' else 'conflict' end; v_stored_revision := v_current_revision; end if; else delete from public.oando_plans as plan where plan.id = p_project_id and plan.user_id = p_owner_id and plan.revision = p_expected_revision returning plan.revision into v_stored_revision; if v_stored_revision is not null then v_stored_status := 'success'; else select plan.revision into v_current_revision from public.oando_plans as plan where plan.id = p_project_id and plan.user_id = p_owner_id; v_stored_status := case when v_current_revision is null then 'not_found' else 'conflict' end; v_stored_revision := v_current_revision; end if; end if; update public.planner_operation_idempotency as receipt set response_status = v_stored_status, response_revision = v_stored_revision, response_payload = case when p_operation in ('create', 'save') and v_stored_status = 'success' then v_stored_payload else null end, response_name = case when p_operation in ('create', 'save') and v_stored_status = 'success' then v_stored_name else null end, response_thumbnail_url = case when p_operation in ('create', 'save') and v_stored_status = 'success' then v_stored_thumbnail_url else null end, response_plan_status = case when p_operation in ('create', 'save') and v_stored_status = 'success' then v_stored_plan_status else null end, response_created_at = case when p_operation in ('create', 'save') and v_stored_status = 'success' then v_stored_created_at else null end, response_updated_at = case when p_operation in ('create', 'save') and v_stored_status = 'success' then v_stored_updated_at else null end where receipt.owner_id = p_owner_id and receipt.operation = p_operation and receipt.project_id = p_project_id and receipt.idempotency_key = p_idempotency_key; return query select v_stored_status, v_stored_revision, v_stored_payload, v_stored_name, v_stored_thumbnail_url, v_stored_plan_status, v_stored_created_at, v_stored_updated_at, false; end; $BODY$;
-- revoke all on function public.planner_mutate_plan_v1(uuid, text, uuid, bigint, text, text, text, jsonb, text, text, integer) from public, anon;
-- grant execute on function public.planner_mutate_plan_v1(uuid, text, uuid, bigint, text, text, text, jsonb, text, text, integer) to authenticated, service_role;
