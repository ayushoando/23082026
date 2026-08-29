# 04 · Data, API, and persistence

[← Product domains](03-product-domains.md) · [Next: tooling, CI, and tech docs →](./05-tooling-ci-tech-docs.md)

## Choose the data owner before tracing or changing data

The repository has two Supabase databases. Select the owner before discussing a table, API, migration, furniture record, descriptor, catalog item, configurator state, plan, or theme. A path or Drizzle definition is not proof that the corresponding hosted workflow is wired.

| Database | Ref | Owns | Deployable migrations | Runtime boundary |
|---|---|---|---|---|
| **Products** | `erpweaiypimorcunaimz` | Marketing catalog, configurator, feature flags, and themes | `site/platform/supabase/migrations/` | Marketing catalog/configurator data remains Products-owned; do not move it to Admin because a route or shared helper is convenient. |
| **Admin** | `rxzpznmxbaoxpikowmfc` | Staff, customers, plans, furniture, descriptors, price books, audit data, and `customer_queries` | `site/platform/supabase/migrations.admin/` | Staff/customer, plan, furniture, descriptor, price-book, audit, and customer-query persistence is Admin-owned. |

`site/platform/drizzle/schema/` is schema support and inspection material. Supabase SQL migrations in the correct database directory are the deployable schema-change path. Database ownership is a routing decision, not a claim that the route, hosted table, or persistence workflow has been observed end to end.

### Ownership decision record

Before proposing a data change, record:

1. **Owner:** Products or Admin, with the table/domain reason.
2. **Migration path:** the exact Products or Admin migration directory.
3. **Application boundary:** route handler, helper, server module, or mode-aware wrapper that reads or writes the data.
4. **Access controls:** RLS policies and grants required for the operation.
5. **Recovery:** a `-- rollback` section, backup/recovery implications, and the smallest authorized diagnostic or dry run.
6. **Proof limit:** whether the evidence is only static, local, configured, or actually authorized hosted evidence.

Do not use a shared name, a generated type, or an old document to override live ownership evidence.

## Application API surface

- **Route handlers:** `site/app/api/**/route.ts`.
- **Route inventory:** `docs/architecture/routes.md` and `site/lib/apiCatalog.ts`; the live route and handler remain authoritative when they differ from an inventory.
- **Edge boundary:** `site/proxy.ts` owns the observed security-header, protected-route, maintenance, and related edge behavior.
- **Database access:** Supabase queries go through server-side helpers under `site/lib/`; do not put raw SQL in `site/app/**/page.tsx` or `site/components/`.
- **Product routes:** marketing products/categories, configurator, quote/cart, search/filter, theme, discovery, tracking, exports/files, and health routes.
- **Admin routes:** catalog, plans, price books, themes, analytics, customer-query operations, and other internal handlers.
- **Planner routes:** `/api/Planner/*` for catalog, projects, sketch-to-plan, and handoff behavior.
- **Studio routes:** `/api/Studio/*` for furniture CRUD, upload, publish, and AI-helper behavior.
- **Security/public routes:** CSRF, auth-related boundaries, health, discovery, and public contracts.

A route entry, API catalog row, or configured client proves configuration or source presence only. It does not prove authorization, CSRF/rate-limit behavior, database access, hosted persistence, or a successful request.

## Persistence modes

Mode-aware persistence selects exactly one storage boundary for a runtime. It must not write to disk and Supabase for the same operation.

| Runtime | Plans | Furniture and descriptors |
|---|---|---|
| Local non-production with `DEV_AUTH_BYPASS=1` | Approved Planner disk stores under `site/platform/Planner/data/` | Approved shared/Studio disk stores under `site/platform/shared/data/furniture/` and `site/inventory/descriptors/` |
| CI, production, or any other runtime | Admin Supabase `oando_plans` | Admin Supabase furniture catalog and descriptor records |

Use the existing selectors and wrappers, including `site/lib/Planner/plannerPersistenceMode.ts` and `site/lib/catalog/furnitureCatalogMode.ts`, and write through helpers such as `writeFurnitureItem`. Production filesystem access is read-only. Never use raw disk helpers from request handlers, never write `site/data/storage/`, and never dual-write disk plus Supabase. This mode contract concerns plans, furniture, and descriptors; Products-owned marketing catalog/configurator/flags/themes still use the Products database.

## D03 — Auth, security, and secrets

- **Goal:** Trace authentication, authorization, and secret boundaries without exposing credentials or weakening controls.
- **Start Paths:** `./site/proxy.ts`; `./site/lib/security/`; `./site/platform/supabase/`; `./.env.example`; `./.env.local`; `./site/.env.local`; `./docs/architecture/stack.md`.
- **Scope:** Edge rules, server auth, CSRF, rate limits, RLS references, secret storage, database ownership, and hosted-proof limits.
- **Evidence Steps:** Read authority sources; inspect the listed helpers/configuration; compare claims with live source; classify security/data risk; record the Route Record, selected skills, and evidence limitation.
- **Allowed Actions:** Read-only tracing and an explicitly owned guidance/source change; keep credentials private.
- **Forbidden Actions:** Printing or committing secrets, exposing `SUPABASE_SERVICE_ROLE_KEY` to client code, bypassing RLS from a client, changing security controls by assumption, or making hosted calls without approval.
- **Risk:** Credentials, authorization, data access, and release risk.
- **Expected Evidence:** Auth source, secret boundary, database owner, access-control boundary, and unverified hosted behavior.
- **Next Decision:** Select `db-migrations` when schema/RLS/grants/ownership are implicated; add `graph-impact` only when shared security code or dependency impact is evidenced.

Secrets belong only in local `.env.local`/`site/.env.local` or provider secret stores; `.env.example` documents shape, not secret values. Static inspection cannot establish the effective production secret configuration or hosted authorization result.

## D05 — APIs and data boundaries

- **Goal:** Trace an API from its route handler through request controls, database ownership, persistence mode, and completion proof.
- **Start Paths:** `./site/app/api/`; `./site/lib/apiCatalog.ts`; `./site/proxy.ts`; `./docs/architecture/routes.md`; `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md`.
- **Scope:** Admin, Planner, Studio, catalog, configurator, AI, security, files, plans, tracking, and public handlers.
- **Evidence Steps:** Read authority sources; inspect route, catalog, proxy, helper, and persistence sources; compare route inventory with live handlers; classify API/data/release risk; record exact evidence and the next action.
- **Allowed Actions:** Read-only mapping or an explicitly approved edit in the owned source path; preserve auth and data-owner boundaries.
- **Forbidden Actions:** Treating route presence as behavior proof, making hosted requests by assumption, applying migrations, exposing secrets, or bypassing mode-aware helpers.
- **Risk:** API contract, authentication, data ownership, persistence, and release risk.
- **Expected Evidence:** Route source, auth/CSRF/rate-limit boundary, Products/Admin owner, persistence helper, matching skills, and exact hosted-proof limitation.
- **Next Decision:** Select `db-migrations` when schema ownership or RLS/grants is implicated; select `graph-impact` only for evidenced shared API dependency or blast-radius work.

## D14 — Databases, RLS, grants, rollback, and mode-aware persistence

- **Goal:** Select Products or Admin ownership and preserve deployable migration, access-control, rollback, and persistence-mode boundaries.
- **Start Paths:** `./site/platform/supabase/migrations/`; `./site/platform/supabase/migrations.admin/`; `./site/platform/drizzle/schema/`; `./site/lib/Planner/plannerPersistenceMode.ts`; `./site/lib/catalog/furnitureCatalogMode.ts`; `./site/platform/Planner/data/`; `./site/platform/shared/data/furniture/`; `./site/inventory/descriptors/`; `./docs/database/schema.md`; `./docs/database/ops.md`; `./docs/database/drizzle.md`.
- **Scope:** Products (`erpweaiypimorcunaimz`) marketing catalog/configurator/flags/themes; Admin (`rxzpznmxbaoxpikowmfc`) staff/customers/plans/furniture/descriptors/price books/audit/queries; deployable SQL; RLS and grants; rollback; and mode selectors.
- **Evidence Steps:** Read authority sources; inspect ownership, migration, schema, and selector paths; compare docs with live source; classify data-loss/access/persistence risk; record owner, migration path, policies/grants, rollback, mode, and next decision.
- **Allowed Actions:** Read-only schema planning or an explicitly approved migration edit in the correct database directory.
- **Forbidden Actions:** Direct hosted schema changes, a migration without `-- rollback`, missing grants or RLS policies, cross-database ownership drift, dual-write, production disk writes, or unapproved apply/type/seed actions.
- **Risk:** Data loss, access control, persistence, migration, and release risk.
- **Expected Evidence:** Products/Admin owner, exact migration directory, rollback section, RLS policies, grants, mode selector, and pending dry-run/hosted evidence.
- **Next Decision:** Route to `db-migrations`; add `planner-studio` and `fork-boundaries` when Planner/Studio fork persistence is implicated.

## Migration, RLS, grants, and rollback contract

Deployable database changes use raw SQL migrations in the selected Supabase directory. Each migration must make the intended owner explicit and include:

- RLS policies that protect the rows and roles involved;
- grants appropriate to the actual runtime roles, not merely table creation;
- a clearly labelled `-- rollback` section that reverses the forward change safely;
- generated-type, API-contract, application, seed, asset, and persistence-mode impact notes; and
- the required dry run before any apply action.

The named root commands are protected operations: Products uses `pnpm run db:apply -- --dry` before `pnpm run db:apply`, while Admin uses `pnpm run db:apply:admin -- --dry` before `pnpm run db:apply:admin`. Type generation (`pnpm run db:types` or `pnpm run db:types:admin`), seeds, remote inspection, and apply actions are also owner-controlled. This chapter does not authorize or run any of them.

`site/platform/drizzle/schema/` may support schema reasoning and type generation, but it is not a substitute for the deployable Supabase migration. Do not claim a migration is applied, a policy is effective, or hosted data is persistent from SQL text or a local file alone.

## Security, auth, and environment

- **Edge:** `site/proxy.ts` owns CSP/security headers, protected-route behavior, maintenance write blocking, and related edge rules.
- **Handlers:** use existing server-side auth, CSRF, rate limiting, RLS, and mode-aware wrappers.
- **Secrets:** only in local `.env.local`/`site/.env.local` or provider secret stores; never committed or client-side.
- **Environment template:** `.env.example` documents the non-secret shape.

## i18n, SEO, and public contracts

| Area | Location / rule |
|---|---|
| Marketing i18n | `site/i18n/` with `en`/`hi`; runtime validates `NEXT_LOCALE`, defaults to `en`, and loads the selected bundle |
| Root next-intl shim | `i18n/request.ts` |
| SEO/discovery | Marketing routes, metadata, robots/sitemap, public `.well-known`/security files |
| Static public files | `site/public/` |

## Safe migration request

```text
Use the database-migration workflow for [change]. Decide Products versus Admin and name the reason.
Draft the SQL with RLS policies, grants, and a -- rollback section. Identify generated types,
API contracts, application code, tests, seed/storage impact, mode-aware persistence, and the
required dry-run. Classify every command and do not apply or connect to a database.
```

## Data/API response boundary

Use the Plain-Language Response Contract in every update. Distinguish configured routes from observed behavior, static SQL from an applied migration, disk evidence from hosted persistence, and a reviewed migration from a deployed migration. A missing authorized command result is `pending-user-authorization`, `blocked-by-hook`, or `not-run`, never a pass.

## Separate Approval Work

The following remain separate from this guidance lane: SQL or migration writes outside the explicitly owned documentation path; database apply, dry-run, type-generation, seed, remote inspection, or hosted mutation; changes to RLS/grants in a live database; secret or auth-control changes; application/runtime changes; package installation; deployment, backup, or external service actions; and any generated or HTML projection update without its own provenance and write scope.

Next: [Tooling, CI, and tech docs](./05-tooling-ci-tech-docs.md).
