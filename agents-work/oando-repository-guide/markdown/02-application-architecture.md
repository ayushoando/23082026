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


## Coverage-audited routing for application changes

Use this chapter for D05 APIs and D06 Site UI, SEO, accessibility, and performance. A product change starts at the user-facing route, then traces feature behavior, components, shared/server logic, platform/persistence, and the narrowest proof. The route is a candidate until live source evidence confirms it.

### D05 APIs card

- **Goal:** Trace an API outcome from its route handler through authentication, data ownership, and evidence.
- **Start Paths:** `./site/app/api/`; `./site/lib/apiCatalog.ts`; `./site/proxy.ts`; `./docs/architecture/routes.md`; `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md`.
- **Scope:** Route ownership, auth/CSRF/rate-limit boundary, persistence, and API proof.
- **Evidence Steps:** Read authority; inspect route/catalog/proxy paths; compare route docs with live handlers; classify data/security/release risk; record the Route Record and proof limitation.
- **Allowed Actions:** Read-only tracing or an explicitly approved Core Product Write to owned source paths.
- **Forbidden Actions:** Hosted calls, migrations, secret exposure, or claiming behavior from a route filename.
- **Risk:** API, auth, data, and release risk.
- **Expected Evidence:** Exact route source, auth/data boundary, selected skills, and unverified hosted behavior.
- **Next Decision:** Select `graph-impact` for shared/API dependency impact and `db-migrations` when schema/ownership evidence matches.

### D06 Site UI card

- **Goal:** Improve a Site UI outcome through the route, feature, component, FOCSS zone, SEO, i18n, and accessibility layers.
- **Start Paths:** `./site/app/(site)/`; `./site/features/site/`; `./site/components/home/`; `./site/focss/site/`; `./site/i18n/`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`; `./docs/architecture/stack.md`.
- **Scope:** UI structure, metadata, responsive behavior, loading/empty/error states, keyboard reachability, and performance planning.
- **Evidence Steps:** Read authority; inspect route and neighboring patterns; compare docs with source; classify UI/accessibility/shared-code risk; record the visual checklist and proof limitation.
- **Allowed Actions:** Approved Core Product Writes only after the Site Write Gate; reuse existing components and semantic tokens.
- **Forbidden Actions:** Non-Core Artifacts under `./site/`, custom CSS systems, cross-zone imports, or browser/performance claims without observed proof.
- **Risk:** Product UI, accessibility, responsive behavior, and shared-code risk.
- **Expected Evidence:** Route-to-component trace, matching skills, Visual Detail Checklist, and exact rendered-proof limitation.
- **Next Decision:** Route styling/token work to `focss-css`; route shared impact to `graph-impact`; keep browser checks pending without authorization.

### Forked application boundaries

Planner and Studio have separate route, feature, component, library, hook, store, server, and platform roots. `./site/app/ooplanner/` and `./site/app/oostudio/` are separate Product Surfaces; do not use one fork as an implementation shortcut for the other. A Planner or Studio task selects `planner-studio`, and a Fork Tree change or cross-import evaluation also selects `fork-boundaries`. Shared data/API contracts do not permit cross-fork module imports.

### Site Write Gate

Before any proposed write under `./site/`, the Route Record states the exact Core Product outcome, owned paths, matching skills, and expected evidence. A report, result, prompt, plan, skill, steering file, MCP definition, generated file, temporary file, debug file, or other Non-Core Artifact is rejected and redirected to its approved home. `./results/site/` remains Machine Evidence and is never a source-tree relocation target.

### Completion boundary

The Plain-Language Response Contract is required for start, progress, handoff, pause, and completion responses. Static source tracing cannot prove rendered interaction, browser accessibility, hosted API behavior, or persistence. Name each as unverified or pending unless an exact authorized observation exists.
