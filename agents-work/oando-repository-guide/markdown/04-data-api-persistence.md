# 04 · Data, API, and persistence

[← Product domains](03-product-domains.md) · [Next: tooling, CI, and tech docs →](./05-tooling-ci-tech-docs.md)

## Two database ownership model

| Database | Ref | Owns | Migrations |
|---|---|---|---|
| Products | `erpweaiypimorcunaimz` | Marketing catalog, configurator, flags, themes | `site/platform/supabase/migrations/` |
| Admin | `rxzpznmxbaoxpikowmfc` | Staff, customers, plans, furniture, descriptors, price books, audit, customer queries | `site/platform/supabase/migrations.admin/` |

Drizzle schema support lives in `site/platform/drizzle/schema/`; deployable schema changes are Supabase SQL migrations with RLS, grants, and `-- rollback`.

## Application API surface

- **Route handlers:** `site/app/api/**/route.ts`
- **Admin routes:** catalog, plans, price books, themes, analytics, customer-query operations.
- **Planner routes:** `/api/Planner/*` for catalog, projects, sketch-to-plan, handoff.
- **Studio routes:** `/api/Studio/*` for furniture CRUD, upload, publish, AI helpers.
- **Shared/public routes:** products, categories, configurator, AI advisor, CSRF, exports/files, search/filter, tracking, theme, health, discovery.
- **API inventory:** `docs/architecture/routes.md` and `site/lib/apiCatalog.ts`; source is authoritative.

## Persistence modes

| Runtime | Plans | Furniture/descriptors |
|---|---|---|
| Local non-production with `DEV_AUTH_BYPASS=1` | Approved Planner disk stores | Approved shared/Studio disk stores |
| CI / production / other runtime | Admin Supabase `oando_plans` | Admin Supabase furniture catalog and descriptor records |

Production filesystem is read-only. Never write raw disk paths from request handlers, never write `site/data/storage/`, and never dual-write disk plus Supabase.

## Security, auth, and environment

- **Edge:** `site/proxy.ts` owns CSP/security headers, protected-route behavior, maintenance write blocking, and related edge rules.
- **Handlers:** use existing server-side auth, CSRF, rate limiting, RLS, and mode-aware wrappers.
- **Secrets:** only in local `.env.local`/`site/.env.local` or provider secret stores; never committed or client-side.
- **Environment template:** `.env.example` documents the non-secret shape.

## i18n, SEO, and public contracts

| Area | Location / rule |
|---|---|
| Marketing i18n | `site/i18n/` with `en`/`hi`; runtime currently loads English |
| Root next-intl shim | `i18n/request.ts` |
| SEO/discovery | Marketing routes, metadata, robots/sitemap, public `.well-known`/security files |
| Static public files | `site/public/` |

## Safe migration request

```text
Use the database-migration workflow for [change]. Decide Products versus Admin.
Draft the SQL with grants, RLS policies, and -- rollback. Identify generated types,
API contracts, application code, tests, and the required dry-run. Do not apply it.
```

Next: [Tooling, CI, and tech docs](./05-tooling-ci-tech-docs.md).