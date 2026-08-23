-- D3 / DB-S12: policy customer_queries_insert_public exists for anon+authenticated
-- but GRANT INSERT was missing. Policy without GRANT is still permission denied.

grant insert on public.customer_queries to anon, authenticated;
grant all on public.customer_queries to service_role;

-- rollback:
-- revoke insert on public.customer_queries from anon, authenticated;
-- revoke all on public.customer_queries from service_role;
