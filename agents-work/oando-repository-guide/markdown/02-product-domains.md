# 02 · Product domains

[← Repository map](01-repository-map.md) · [Next: agent workspace →](./03-agent-workspace.md)

This chapter maps Product Surfaces to their route, feature, UI, persistence, and evidence boundaries. A route or import is static evidence only; it does not prove an end-to-end workflow, hosted persistence, deployment, or evaluated AI behavior. Durable architecture detail lives in `./docs/architecture/product-map.md` and `./docs/architecture/routes.md`.

## Marketing site

- **Route roots:** `./site/app/(site)/`
- **Behavior:** `./site/features/site/`
- **UI:** `./site/components/home/` and domain/shared components
- **FOCSS:** `./site/focss/site/`
- **Owns:** product discovery, catalog browsing, SEO, contact, portal, quote, planning marketing, and legal content.
- **Boundary:** marketing `/planner*` pages are distinct from the interactive `/ooplanner` application.

```text
Update [page/component] to [outcome]. Reuse nearby components and FOCSS tokens,
keep it responsive, trace metadata/SEO if discovery changes, and report rendered
or hosted proof only when that proof was actually observed.
```

## Admin, CRM, and operations

- **Route roots:** `./site/app/admin/`
- **Behavior:** `./site/features/admin/`, `./site/features/crm/`, `./site/features/ops/`
- **UI/helpers:** `./site/components/` and `./site/lib/admin/`
- **Owns:** catalog, inventory, plans, price books, themes, analytics, customer queries, and CRM/operations views.
- **CRM status:** the browser CRM workspace is `demo/local-only`; its observed Zustand/browser persistence key is `oando-crm-storage`. Do not describe that demo as Admin Database-backed without end-to-end evidence.
- **Customer-query boundary:** `./site/app/admin/customer-queries/` and `./site/app/api/customer-queries/` are separate Admin Database-backed operations with their own evidence assessment.

```text
In Admin, add [workflow]. Trace the route, feature, API, auth requirement, and
Products-vs-Admin data ownership before editing. Keep the CRM demo separate from
customer-query operations and never expose server credentials.
```

## Floor Planner fork

- **Route:** `/ooplanner`
- **Route/API roots:** `./site/app/ooplanner/`; `./site/app/api/Planner/`
- **Fork roots:** `./site/features/Planner/`; `./site/components/Planner/`; `./site/lib/Planner/`; `./site/hooks/Planner/`; `./site/store/Planner/`; `./site/server/Planner/`; `./site/platform/Planner/`
- **Owns:** floor layout, furniture placement, project persistence, exports, and handoff.
- **Persistence:** use `./site/lib/Planner/plannerPersistenceMode.ts`; disk is non-production `DEV_AUTH_BYPASS=1`, otherwise Supabase. Never dual-write or use `./site/data/storage/`.
- **Technology:** Fabric.js, dockview-react, Planner-local state, and a Planner canvas scale distinct from Studio.

```text
Change [canvas/panel/project/catalog] behavior in Planner. Trace the Planner-only
UI, API, store, persistence, and proof path. Do not import Studio, copy Studio
geometry/state behavior blindly, or claim hosted persistence from disk evidence.
```

## Furniture Studio fork

- **Route:** `/oostudio`
- **Route/API roots:** `./site/app/oostudio/`; `./site/app/api/Studio/`
- **Fork roots:** `./site/features/Studio/`; `./site/components/Studio/`; `./site/lib/Studio/`; `./site/hooks/Studio/`; `./site/store/Studio/`; `./site/server/Studio/`; `./site/platform/Studio/`
- **Owns:** furniture authoring, furniture assets, descriptor publishing, and Studio AI helpers.
- **Persistence/release:** furniture and descriptors use mode-aware wrappers; dev records include `./site/inventory/descriptors/`, while production records belong to Admin Supabase. Do not infer release authority from a local JSON file.
- **Technology:** Fabric.js, dockview-react, Studio-local state, and a canvas scale distinct from Planner.

```text
Change [furniture/catalog/publish/canvas] behavior in Studio. Trace Studio-only
UI, API/store, release path, and proof. Do not import Planner, copy Planner
behavior blindly, call an external provider, or claim publish/deployment success
without the corresponding evidence.
```

## Shared boundaries

Planner and Studio are fully forked. They share approved backing data and API contracts, not modules. No `@studio/*` import belongs in a Planner file, no `@planner/*` import belongs in a Studio file, and no fork may import the other's `components`, `lib`, `hooks`, `store`, `server`, or platform modules. Geometry helpers must not be copied without accounting for the different canvas scales. If a capability truly belongs in shared code, use an approved `./site/platform/shared/` pattern only after comparing both forks' scale, state, and persistence assumptions.

Planner talks to `/api/Planner/*`; Studio talks to `/api/Studio/*`; the case-sensitive namespaces and route roots above are separate evidence paths. A boundary check or Fork Tree change routes to `AGENTS.md` §3 plus `pnpm run scan:boundaries`; Planner/Studio feature work begins from the `AGENTS.md` fork rules with `oando-repo-map` for discovery.

## Styling and design system

| Surface | FOCSS zone |
|---|---|
| Marketing | `./site/focss/site/` |
| Admin | `./site/focss/admin/` |
| Planner | `./site/focss/planner/` |
| Studio | `./site/focss/studio/` |

Use semantic tokens, existing components, explicit loading/empty/error states, accessible keyboard interaction, and `oando-focss-css` guidance. Do not introduce a new CSS system, use inline SVG/Lucide in place of the existing Phosphor abstraction, or create cross-zone imports.

## Catalog, assets, AI, and search

| Concern | Start at |
|---|---|
| Catalog adapters and ownership | `./site/lib/catalog/` |
| Plan symbol contract | `./site/lib/catalog/planSymbolPngContract.ts` |
| Catalog asset storage | `./site/features/shared/catalog/catalogAssetStorage.server.ts` |
| AI/retrieval | `./site/lib/ai/mastra/` |
| Fuzzy/full-text/vector retrieval | Fuse.js, Orama, and LanceDB via server-side catalog/AI code |

Exact data ownership, migrations, RLS, release, and persistence rules live in `./docs/database/schema.md`, `./docs/database/ops.md`, and `./AGENTS.md` §5.

## Visual Detail Checklist

Before reporting a product-interface change complete, review each applicable item and record the evidence or limitation:

- [ ] Use the existing Phosphor abstraction and `phIconMap`; do not add a new icon library, inline SVG, or Lucide substitute.
- [ ] Check icon alignment and the alignment of adjacent controls, labels, hit areas, and focus indicators.
- [ ] Check spacing, semantic tokens, FOCSS zone, density, and overflow at the target surface.
- [ ] Check responsive layout, wrapping, clipping, and keyboard-reachable alternatives to pointer or drag-only interaction.
- [ ] Check loading, empty, error, disabled, and success states where the surface can reach them.
- [ ] Check keyboard reachability, focus visibility/order, and accessible names; do not treat mouse-only canvas behavior as keyboard proof.
- [ ] Check reduced-motion behavior when animation or transition applies; preserve the existing GSAP/Framer and motion-preference patterns.
- [ ] For image or animation work, check owner/source, existing `./scripts/generate-svg/` or asset path, licensing, alt/metadata, and the intended output home before writing.

Static source evidence can establish that a checklist was reviewed, but it cannot establish rendered alignment, browser accessibility, animation behavior, or production asset delivery without the matching authorized observation.
