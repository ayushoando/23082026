-- Repair catalog satellite tables. Existing creates cannot be re-run:
-- 20260302110000 / 20260307150500 FK public.products as a TABLE;
-- products is now a VIEW over catalog_products. 20260307153500 only
-- renames if the old tables exist. SVG DDL copied from
-- 20260714100000 (already in history, tables missing). Furniture backup
-- is Admin public.furniture_catalog (Products archive.furniture_catalog).

create extension if not exists "pgcrypto";

create table if not exists public.catalog_product_specs (
  product_id uuid primary key references public.catalog_products(id) on delete cascade,
  specs jsonb not null default '{}'::jsonb,
  source text not null default 'catalog_products.specs',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_product_specs_specs_is_object check (jsonb_typeof(specs) = 'object')
);

create index if not exists idx_catalog_product_specs_source
  on public.catalog_product_specs (source);
create index if not exists catalog_product_specs_product_id_idx
  on public.catalog_product_specs (product_id);

create table if not exists public.catalog_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.catalog_products(id) on delete cascade,
  image_url text not null,
  image_kind text not null default 'gallery',
  variant_id text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_product_images_kind_check check (
    image_kind in ('flagship', 'gallery', 'scene', 'variant', 'other')
  )
);

create unique index if not exists idx_catalog_product_images_unique
  on public.catalog_product_images (product_id, image_kind, image_url, sort_order);
create index if not exists idx_catalog_product_images_lookup
  on public.catalog_product_images (product_id, image_kind, sort_order);
create index if not exists idx_catalog_product_images_created_at
  on public.catalog_product_images (created_at desc);

create table if not exists public.catalog_product_slug_aliases (
  id uuid primary key default gen_random_uuid(),
  alias_slug text not null,
  canonical_slug text not null references public.catalog_products(slug) on update cascade on delete cascade,
  reason text not null default 'legacy_alias',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_product_slug_aliases_alias_not_blank check (btrim(alias_slug) <> ''),
  constraint catalog_product_slug_aliases_canonical_not_blank check (btrim(canonical_slug) <> ''),
  constraint catalog_product_slug_aliases_not_self check (alias_slug <> canonical_slug)
);

create unique index if not exists idx_catalog_product_slug_aliases_active_alias
  on public.catalog_product_slug_aliases (alias_slug)
  where is_active;
create index if not exists idx_catalog_product_slug_aliases_active_canonical
  on public.catalog_product_slug_aliases (canonical_slug)
  where is_active;
create index if not exists catalog_product_slug_aliases_canonical_slug_idx
  on public.catalog_product_slug_aliases (canonical_slug);
create index if not exists idx_catalog_product_slug_aliases_created_at
  on public.catalog_product_slug_aliases (created_at desc);

insert into public.catalog_product_specs (product_id, specs, source)
select
  p.id,
  case
    when p.specs is null then '{}'::jsonb
    when jsonb_typeof(p.specs) = 'object' then p.specs
    else '{}'::jsonb
  end,
  'restored_from_catalog_products_specs'
from public.catalog_products p
on conflict (product_id) do update
set
  specs = excluded.specs,
  source = excluded.source,
  updated_at = now();

insert into public.catalog_product_images (product_id, image_url, image_kind, sort_order)
select p.id, p.flagship_image, 'flagship', 0
from public.catalog_products p
where p.flagship_image is not null
  and btrim(p.flagship_image) <> ''
on conflict do nothing;

insert into public.catalog_product_images (product_id, image_url, image_kind, sort_order)
select p.id, img.value, 'gallery', img.ord::int
from public.catalog_products p
cross join lateral jsonb_array_elements_text(
  case
    when p.images is null then '[]'::jsonb
    when jsonb_typeof(p.images) = 'array' then p.images
    else '[]'::jsonb
  end
) with ordinality as img(value, ord)
where img.value is not null
  and btrim(img.value) <> ''
on conflict do nothing;

insert into public.catalog_product_images (product_id, image_url, image_kind, sort_order)
select p.id, img.value, 'scene', img.ord::int
from public.catalog_products p
cross join lateral unnest(coalesce(p.scene_images, '{}'::text[]))
  with ordinality as img(value, ord)
where img.value is not null
  and btrim(img.value) <> ''
on conflict do nothing;

insert into public.catalog_product_slug_aliases (alias_slug, canonical_slug, reason, is_active)
select distinct on (folder.alias_slug)
  folder.alias_slug, p.slug, 'folder_slug_from_flagship', true
from public.catalog_products p
cross join lateral (
  select nullif(
    (
      select part
      from unnest(string_to_array(p.flagship_image, '/')) as part
      where part like '%--%'
      limit 1
    ),
    ''
  ) as alias_slug
) folder
where folder.alias_slug is not null
  and folder.alias_slug <> p.slug
order by folder.alias_slug, p.slug
on conflict (alias_slug) where is_active
do update set
  canonical_slug = excluded.canonical_slug,
  reason = excluded.reason,
  updated_at = now();

do $$
begin
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'product_specs' and c.relkind in ('v', 'r')
  ) then
    execute '
      create view public.product_specs
      with (security_invoker=true)
      as select * from public.catalog_product_specs
    ';
  end if;
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'product_images' and c.relkind in ('v', 'r')
  ) then
    execute '
      create view public.product_images
      with (security_invoker=true)
      as select * from public.catalog_product_images
    ';
  end if;
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'product_slug_aliases' and c.relkind in ('v', 'r')
  ) then
    execute '
      create view public.product_slug_aliases
      with (security_invoker=true)
      as select * from public.catalog_product_slug_aliases
    ';
  end if;
end
$$;

alter table public.catalog_product_specs enable row level security;
alter table public.catalog_product_images enable row level security;
alter table public.catalog_product_slug_aliases enable row level security;

drop policy if exists "Allow public read access to catalog_product_specs" on public.catalog_product_specs;
create policy "Allow public read access to catalog_product_specs"
  on public.catalog_product_specs for select to anon, authenticated using (true);

drop policy if exists "Allow public read access to catalog_product_images" on public.catalog_product_images;
create policy "Allow public read access to catalog_product_images"
  on public.catalog_product_images for select to anon, authenticated using (true);

drop policy if exists "Allow public read access to catalog_product_slug_aliases" on public.catalog_product_slug_aliases;
create policy "Allow public read access to catalog_product_slug_aliases"
  on public.catalog_product_slug_aliases for select to anon, authenticated using (true);

grant select on public.catalog_product_specs to anon, authenticated;
grant select on public.catalog_product_images to anon, authenticated;
grant select on public.catalog_product_slug_aliases to anon, authenticated;
grant all privileges on public.catalog_product_specs to service_role;
grant all privileges on public.catalog_product_images to service_role;
grant all privileges on public.catalog_product_slug_aliases to service_role;
grant select on public.product_specs to anon, authenticated;
grant select on public.product_images to anon, authenticated;
grant select on public.product_slug_aliases to anon, authenticated;
grant all privileges on public.product_specs to service_role;
grant all privileges on public.product_images to service_role;
grant all privileges on public.product_slug_aliases to service_role;

-- Same DDL as 20260714100000 (already in history; tables were never created).
create table if not exists public.svg_revisions (
  revision_id      text primary key,
  schema_version   integer not null,
  definition_type_id text not null,
  definition_version integer not null,
  compiler_version text,
  source_revision  integer,
  artifact_checksums jsonb,
  validation       jsonb,
  actor_id         text not null,
  published_at     timestamptz not null default now(),
  reason           text,
  slug             text not null,
  version          integer not null,
  definition       jsonb not null,
  released_product jsonb,
  unique (slug, version)
);

create index if not exists svg_revisions_slug_idx on public.svg_revisions (slug);

create table if not exists public.svg_revision_artifacts (
  id            uuid primary key default gen_random_uuid(),
  revision_id   text not null references public.svg_revisions (revision_id) on delete cascade,
  kind          text not null,
  checksum      text not null,
  storage_key   text not null,
  width         integer,
  created_at    timestamptz not null default now()
);

create index if not exists svg_revision_artifacts_revision_id_idx
  on public.svg_revision_artifacts (revision_id);

alter table public.svg_revisions enable row level security;
alter table public.svg_revision_artifacts enable row level security;

drop policy if exists "svg_revisions_service_all" on public.svg_revisions;
create policy "svg_revisions_service_all"
  on public.svg_revisions for all to service_role using (true) with check (true);

drop policy if exists "svg_revision_artifacts_service_all" on public.svg_revision_artifacts;
create policy "svg_revision_artifacts_service_all"
  on public.svg_revision_artifacts for all to service_role using (true) with check (true);

grant all privileges on public.svg_revisions to service_role;
grant all privileges on public.svg_revision_artifacts to service_role;

-- rollback
-- drop view if exists public.product_specs;
-- drop view if exists public.product_images;
-- drop view if exists public.product_slug_aliases;
-- drop table if exists public.catalog_product_images;
-- drop table if exists public.catalog_product_specs;
-- drop table if exists public.catalog_product_slug_aliases;
-- drop table if exists public.svg_revision_artifacts;
-- drop table if exists public.svg_revisions;
