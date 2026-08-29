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


## Coverage-audited data and API cards

### D03 — Auth, security, and secrets

- **Goal:** Trace authentication, authorization, and secret boundaries without exposing credentials or weakening controls.
- **Start Paths:** `./site/proxy.ts`; `./site/lib/security/`; `./site/platform/supabase/`; `./.env.example`; `./.env.local`; `./site/.env.local`; `./docs/architecture/stack.md`.
- **Scope:** Edge rules, server auth, CSRF/rate limits, RLS references, secret storage, and hosted-proof limits.
- **Evidence Steps:** Read authority; inspect the listed helpers/config; compare documentation with source; classify security/data risk; record Route Record and limitation.
- **Allowed Actions:** Read-only tracing and approved source guidance changes in owned paths.
- **Forbidden Actions:** Printing secrets, exposing service-role keys, changing controls, client-side privileged access, or hosted calls.
- **Risk:** Security, credentials, authorization, and data access.
- **Expected Evidence:** Auth source, secret boundary, database owner, selected skills, and unverified hosted behavior.
- **Next Decision:** Select `db-migrations` for schema/RLS/grants/ownership evidence and `graph-impact` for shared security code.

### D05 — APIs and data boundaries

- **Goal:** Trace an API from route handler through request controls, persistence, and completion proof.
- **Start Paths:** `./site/app/api/`; `./site/lib/apiCatalog.ts`; `./site/proxy.ts`; `./docs/architecture/routes.md`; `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md`.
- **Scope:** Admin, Planner, Studio, catalog, AI, security, files, plans, tracking, and public handlers.
- **Evidence Steps:** Read authority; inspect route/catalog/proxy sources; compare route inventory; classify API/data/release risk; record evidence and next action.
- **Allowed Actions:** Read-only mapping or approved Core Product Write in exact owned source paths.
- **Forbidden Actions:** Hosted requests, migration/apply actions, secret exposure, or route-presence overclaims.
- **Risk:** API, auth, data, and release risk.
- **Expected Evidence:** Route source, auth/data boundary, matching skills, and exact hosted-proof limitation.
- **Next Decision:** Select `db-migrations` when schema ownership is implicated and `graph-impact` for shared API impact.

### D14 — Databases, RLS, grants, rollback, and mode-aware persistence

- **Goal:** Select Products or Admin ownership and preserve deployable migration, RLS, grants, rollback, and persistence-mode boundaries.
- **Start Paths:** `./site/platform/supabase/migrations/`; `./site/platform/supabase/migrations.admin/`; `./site/platform/drizzle/schema/`; `./site/lib/Planner/plannerPersistenceMode.ts`; `./site/lib/catalog/furnitureCatalogMode.ts`; `./site/platform/Planner/data/`; `./site/platform/shared/data/furniture/`; `./site/inventory/descriptors/`; `./docs/database/schema.md`; `./docs/database/ops.md`; `./docs/database/drizzle.md`.
- **Scope:** Products (`erpweaiypimorcunaimz`) marketing catalog/configurator/flags/themes; Admin (`rxzpznmxbaoxpikowmfc`) staff/customers/plans/furniture/descriptors/price books/audit/queries; deployable SQL; mode selectors.
- **Evidence Steps:** Read authority; inspect ownership/migration/schema/selector paths; compare docs with source; classify data-loss/access/persistence risk; record owner, rollback, policies/grants, and next decision.
- **Allowed Actions:** Read-only schema planning or an explicitly approved migration write in the correct directory.
- **Forbidden Actions:** Direct schema changes, missing `-- rollback`, absent grants/policies, dual-write, production disk writes, or unapproved apply/type/seed actions.
- **Risk:** Data loss, access control, persistence, migration, and release risk.
- **Expected Evidence:** Database owner, migration path, rollback/RLS/grants, mode, and pending dry-run/hosted evidence.
- **Next Decision:** Select `db-migrations`; add `planner-studio`/`fork-boundaries` when fork persistence is implicated.

## Mode-aware persistence contract

Disk is allowed only for non-production local development when `DEV_AUTH_BYPASS=1` and only through approved mode-aware wrappers. Other runtime modes use Admin Supabase for plans, furniture, and descriptors. Production filesystem is read-only. Use `writeFurnitureItem` and related mode-aware helpers rather than raw disk helpers; never dual-write disk and Supabase, and never write `./site/data/storage/`.

## Database ownership and migration checklist

Before proposing SQL or a schema change, record: Products versus Admin owner; exact migration directory; affected Drizzle support path; RLS policies; grants; `-- rollback`; generated types; API/application impact; seed or storage impact; mode-aware persistence; and the exact dry-run/apply command as a Protected Command. Supabase migrations are the deployable path; `./site/platform/drizzle/schema/` is schema support, not a substitute deployment path.

## Data/API response boundary

Use the Plain-Language Response Contract in every update. Distinguish configured routes from observed behavior, disk evidence from hosted persistence, and a reviewed migration from an applied migration. A missing authorized command result is `pending-user-authorization`, `blocked-by-hook`, or `not-run`, never a pass.
