# Site map

Source-oriented map of every site surface: public content, Planner marketing, the product catalog, proof pages, client workspaces, the admin suite, the API surface, and system territory. Route shapes are classified from live source files; they are **not** browser or hosted results — a listed route is source-defined intent, not proof of render state.

Owning detail lives one level down: page + API inventory in [`routes.md`](./routes.md), the client-hub journey analysis in [`plans/client-hub/flowcharts/clients-hub-flow.md`](../../plans/client-hub/flowcharts/clients-hub-flow.md), redirect sources in `config/build/next.config.js`.

## 1. Public content

| Route | Classification |
|---|---|
| `/` | Homepage |
| `/about` · `/career` · `/contact` · `/planning` · `/showrooms` · `/service` · `/downloads` · `/sustainability` | Public pages |
| `/solutions` + `/solutions/[category]` | Public page + dynamic pattern |
| `/privacy` · `/terms` · `/refund-and-return-policy` | Public legal/policy pages |
| `/sitemap` | Public HTML route index (distinct from `/sitemap.xml`) |
| `/compare` · `/quote-cart` · `/choose-product` | Public utilities (quote-cart / choose-product: noindex intent) |
| `/tools/office-space-calculator` · `/tools/meeting-room-capacity-calculator` | Utility placeholder shells |

## 2. Planner marketing

| Route | Classification |
|---|---|
| `/planner` | Public marketing page |
| `/planner/help` | Public help page |
| `/planner/features` + `/planner/features/[slug]` | Public feature page + dynamic pattern |

The interactive Planner app (`/ooplanner*`) is a separate surface — see §5.

## 3. Products (catalog)

`/products` is the catalog entry. Six canonical categories, each with a `[product]` detail pattern:

`seating` · `workstations` · `tables` · `storages` · `soft-seating` · `education`

Concrete product records are data-driven (Products DB, 143 `catalog_products` at last observation) and are deliberately not enumerated here.

## 4. Proof

| Route | Classification |
|---|---|
| `/trusted-by` | Public proof page |
| `/clients` | Public proof/portfolio page — **curated** (photography-forward case studies; flat sibling, no child routes) |

## 5. Client access and the Planner app (noindex/protected intent)

| Route | Classification |
|---|---|
| `/access` | Auth entry (canonical sign-in; `/login` redirects here) |
| `/dashboard` | Authenticated client dashboard |
| `/portal` · `/portal/[id]` · `/portal/guest` · `/portal/guest/view/[id]` | Authenticated/guest portal views |
| `/ooplanner` | Interactive Planner entry |
| `/ooplanner/projects` · `/ooplanner/projects/[id]` | Saved projects + project workspace (authenticated) |

## 6. Admin and Studio (staff territory)

| Surface | Classification |
|---|---|
| `/admin/**` | Staff admin suite (catalog CRUD, plans, price books, feature flags, themes, analytics, customer queries, CRM demo) |
| `/oostudio` | Staff-only Product Studio (auth-gated, noindex intent) |
| `/offline` | Noindex fallback page |

## 7. API surface (not page routes)

Route handlers under `/api/**` — full inventory owned by [`routes.md`](./routes.md). Groups:

- Planner: `/api/Planner/{ai-advisor, catalog, handoff, projects, sketch-to-plan}`
- Studio: `/api/Studio/{furniture, ai}`
- Admin: `/api/admin/{catalogs, features, themes, plans, price-books, analytics, indexnow}`
- Files/assets: `/api/files/{catalog, furniture, projects, uploads, exports}`
- Shared: `/api/{ai-advisor, products, categories, filter, nav-categories, nav-search, customer-queries, tracking, plans, features, theme, configurator, business-stats, audit, metrics, health, csrf, log-error, exports, generate-alt, git-user, products}` plus `/.well-known/api-catalog`

## 8. Redirect register (aliases, not pages)

Verified against `config/build/next.config.js`:

| Destination | Aliases |
|---|---|
| `/` | `/news`, `/brochure`, `/download-brochure`, `/catalog` |
| `/clients` | `/gallery`, `/portfolio`, `/projects`, `/social` |
| `/service` | `/support-ivr`, `/tracking` |
| `/products` | `/templates`, retired `/portal/svg-catalog[/[slug]]` |
| `/terms` | `/imprint` |
| `/access` | `/login` |
| `/products/[category]` | `/products/category/[slug]` + 16 legacy category/product aliases |
| `/ooplanner` | `/oando-planner/**` (incl. deep-link preservation), `/planner/guest|canvas|fabric|open3d`, `/buddy-planner/**` |
| `/oostudio` | `/admin/svg-editor**`, `/admin/product-studio**` |
| `/admin/customer-queries` | `/ops/**`, `/crm/**` |
| `/dashboard` | `/results**` |
| `/downloads` | `/workstations/configurator` |
| `/products/seating` | `/products/oando-chairs`, `/products/chairs-mesh`, `/products/chairs-others` |
| `/products/tables` | `/products/oando-tables`, `/products/desks-cabin-tables` |
| `/products/storages` | `/products/oando-storage` |
| `/products/soft-seating` | `/products/oando-other-seating`, `/products/oando-collaborative`, `/products/others-1`, `/products/others-2` |
| `/products/education` | `/products/oando-educational` |
| `/products/workstations` | `/products/oando-workstations` |

## 9. Excluded / system

`/api/**` (handlers), `site/proxy.ts` (edge), worker/R2 delivery, `/_next/**`, `/tech-docs/**` (tooling SPA), observability endpoints, robots.txt, sitemap.xml, build output, `results/**` (generated evidence).

## Evidence boundary

Every classification above is a static source classification. Presence of a route pattern does not prove a particular runtime instance renders, links, authorizes, or loads data. Browser proof requires a fresh authorized run per `Agents/03-browser.md`.
