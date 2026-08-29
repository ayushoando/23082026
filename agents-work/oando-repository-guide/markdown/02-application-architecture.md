# 02 · Application architecture

[← Full map](01-repository-map.md) · [Next: product domains →](./03-product-domains.md)

This page covers every meaningful layer of the main Next.js application under `site/`.

## Route and runtime layer

| Path | Role |
|---|---|
| `site/app/` | App Router pages, layouts, errors, metadata, API handlers. Keep pages thin. |
| `site/app/(site)/` | Marketing routes: home, products, contact, planning marketing, portal, legal, SEO-facing pages. |
| `site/app/admin/` | Internal admin route pages. |
| `site/app/oostudio/` | Furniture Studio route entry. |
| `site/app/ooplanner/` | Floor Planner route entry and project pages. |
| `site/app/api/` | HTTP route handlers across Admin, Studio, Planner, catalog, AI, security, files, plans, tracking, etc. |
| `site/app/api-docs/`, `.well-known/`, `security.txt/`, `offline/` | Discovery/API documentation/security/offline routes. |
| `site/proxy.ts` | Edge security/auth/redirect/maintenance entry. This project does not use `middleware.ts`. |
| `site/instrumentation.ts` | OpenTelemetry registration. |

## Product implementation layers

| Path | Role |
|---|---|
| `site/features/` | Product behavior by domain: `site`, `admin`, `crm`, `ops`, `shared`, `Planner`, `Studio`. |
| `site/components/` | UI composition: marketing/domain/shared UI plus forked `Planner/` and `Studio/` trees. |
| `site/lib/` | Shared utilities/adapters: catalog, configurator, API, auth/security, analytics, AI, persistence, SEO, tracking, theme, Admin, Planner, Studio. |
| `site/hooks/` | React hooks, including fork-specific hooks. |
| `site/store/` | Client state, including fork-specific Zustand stores. |
| `site/server/` | Server-only stores/adapters, including separate Planner and Studio persistence stores. |
| `site/types/` | Application type declarations. |

## Platform and persistence layer

| Path | Role |
|---|---|
| `site/platform/supabase/` | Supabase clients/helpers, functions, Products migrations, Admin migrations. |
| `site/platform/drizzle/` | Drizzle schemas and database representations. Deployable DB changes still use Supabase migrations. |
| `site/platform/shared/` | Approved shared platform contracts/data; not a shortcut for cross-importing Planner and Studio. |
| `site/platform/Planner/` | Planner platform/dev-mode data and support. |
| `site/platform/Studio/` | Studio platform/dev-mode data and support. |
| `site/platform/route-contract.json` | Route contract information; confirm live routes before relying on it. |

## UI, assets, language, and legacy paths

| Path | Role / rule |
|---|---|
| `site/focss/` | Tailwind v4 + FOCSS CSS source: `base`, `site`, `admin`, `planner`, `studio`. No cross-zone imports. |
| `site/i18n/` | next-intl config, routing, request, `en`/`hi` messages, parity/pending translations. Runtime currently loads English. |
| `site/inventory/descriptors/` | Local dev-mode descriptor/release records; production equivalent is Admin Supabase. |
| `site/public/` | Deployable public assets, logos, discovery files, manifests; legacy PNG catalog mirror is not release authority. |
| `site/data/` | Legacy data area. Do not write `site/data/storage/`. |
| `site/.next/` | Generated Next build/cache output; never edit as source. |

## Framework/config files

| Path | Role |
|---|---|
| `site/next.config.js` | Loaded Next configuration. |
| `site/postcss.config.mjs` | PostCSS/Tailwind pipeline. |
| `site/tsconfig.json` | Application TypeScript configuration. |
| `site/next-env.d.ts`, `site/tsconfig.tsbuildinfo` | Generated/local TypeScript/Next outputs. |

## How to trace any product change

```text
Start at the route in site/app/.
→ Find behavior in site/features/.
→ Find UI in site/components/.
→ Find shared logic in site/lib/ or server behavior in site/server/.
→ Find persistence/contracts in site/platform/.
→ Find proof in tests/.
```

Use [Product domains](./03-product-domains.md) for surface-specific ownership and [Data/API](./04-data-api-persistence.md) for database/persistence/API work.