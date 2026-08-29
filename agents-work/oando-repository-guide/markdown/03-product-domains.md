# 03 · Product domains

[← Application architecture](02-application-architecture.md) · [Next: data, API, and persistence →](./04-data-api-persistence.md)

## Marketing site

- **Route roots:** `site/app/(site)/`
- **Behavior:** `site/features/site/`
- **UI:** `site/components/home/` and domain/shared components
- **Owns:** product discovery, catalog browsing, SEO, contact, portal, quote, planning marketing, legal content.

```text
Update [page/component] to [outcome]. Reuse nearby components and FOCSS tokens,
keep it responsive, and trace metadata/SEO if the change affects discovery.
```

## Admin, CRM, and operations

- **Route roots:** `site/app/admin/`
- **Behavior:** `site/features/admin/`, `site/features/crm/`, `site/features/ops/`
- **Owns:** catalog, inventory, plans, price books, themes, analytics, customer queries, CRM demo/ops.
- **Note:** CRM demo is localStorage; real contact inbox/customer queries are Admin database data.

```text
In Admin, add [workflow]. Trace the route, feature, API, auth requirement, and
Products-vs-Admin data ownership before editing. Do not expose server credentials.
```

## Floor Planner fork

- **Route:** `/ooplanner`
- **Roots:** `app/ooplanner`, `features/Planner`, `components/Planner`, `lib/Planner`, `hooks/Planner`, `store/Planner`, `server/Planner`.
- **Owns:** floor layout, furniture placement, project persistence, exports, and handoff.
- **Technology:** Fabric.js, dockview-react, Planner-local state.

```text
Change [canvas/panel/project/catalog] behavior in Planner. Trace UI, API, store,
persistence, and tests. Do not import Studio or copy Studio behavior blindly.
```

## Furniture Studio fork

- **Route:** `/oostudio`
- **Roots:** `app/oostudio`, `features/Studio`, `components/Studio`, `lib/Studio`, `hooks/Studio`, `store/Studio`, `server/Studio`.
- **Owns:** furniture authoring, furniture assets, descriptor publishing, Studio AI helpers.
- **Technology:** Fabric.js, dockview-react, Studio-local state.

```text
Change [furniture/catalog/publish/canvas] behavior in Studio. Trace UI, API/store,
release path, and tests. Do not import Planner or copy Planner behavior blindly.
```

## Shared boundaries

Planner and Studio share approved backing data and API contracts, not modules. If a capability truly belongs in shared code, place it through approved platform/shared patterns after comparing each fork’s scale, state, and persistence assumptions.

## Styling and design system

| Surface | FOCSS zone |
|---|---|
| Marketing | `site/focss/site/` |
| Admin | `site/focss/admin/` |
| Planner | `site/focss/planner/` |
| Studio | `site/focss/studio/` |

Use semantic tokens, utilities, existing components, explicit empty/error/loading states, accessible keyboard interaction, and `focss-css` guidance. Do not introduce a new CSS system or cross-zone imports.

## Catalog, assets, AI, and search

| Concern | Start at |
|---|---|
| Catalog adapters and ownership | `site/lib/catalog/` |
| Plan symbol contract | `site/lib/catalog/planSymbolPngContract.ts` |
| Catalog asset storage | `site/features/shared/catalog/catalogAssetStorage.server.ts` |
| AI/retrieval | `site/lib/ai/mastra/` |
| Fuzzy/full-text/vector retrieval | Fuse, Orama, LanceDB via server-side catalog/AI code |

Use [Data/API](./04-data-api-persistence.md) for exact data ownership and release/persistence rules.