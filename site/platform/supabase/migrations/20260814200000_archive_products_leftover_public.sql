-- D2: archive leftover Products public tables that moved to Admin.
-- Do not touch catalog_*, configurator_products.
-- furniture_catalog already archived by 20260813090000.

create schema if not exists archive;

revoke all on schema archive from anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'block_descriptors',
    'feature_flags',
    'block_themes',
    'image_assets'
  ]
  loop
    if to_regclass('public.' || quote_ident(t)) is not null then
      execute format('alter table public.%I set schema archive', t);
    end if;
  end loop;
end
$$;

-- rollback:
-- do $$
-- declare
--   t text;
-- begin
--   foreach t in array array[
--     'image_assets',
--     'block_themes',
--     'feature_flags',
--     'block_descriptors'
--   ]
--   loop
--     if to_regclass('archive.' || quote_ident(t)) is not null then
--       execute format('alter table archive.%I set schema public', t);
--     end if;
--   end loop;
-- end
-- $$;
