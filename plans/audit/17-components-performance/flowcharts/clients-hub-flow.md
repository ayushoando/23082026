# Non-admin site and client access sitemap

**Purpose:** a readable, source-oriented sitemap for public pages, the catalog, Planner marketing, proof pages, and client-accessible workspaces. The **Primary page hierarchy** is intentionally a page map first: it contains only source-defined public/client page routes and route patterns. Utilities, journey notes, redirect aliases, source-defined content blocks, and system surfaces are registered separately.

**Evidence boundary:** route files, route classifications, source comments, and focused static searches describe repository intent only. They do not prove that a route builds, renders, is linked at runtime, authorizes correctly, returns a redirect response, or has data available. Every status below is therefore a static classification, not a browser or hosted result.

**Terms used here:**

- **Page route / route pattern** means a source-defined URL shape such as `/products/seating` or `/products/seating/[product]`.
- **Data-driven instance** means a concrete product, project, feature, or ID resolved from data at runtime; this sitemap does not fabricate or enumerate those records.
- **Content block** means an export, copy object, helper, or optional panel used by a page; it is not a page route by itself.
- **Redirect alias** means a legacy source URL grouped with a destination; it is not a second content page or a primary-tree node.
- **System surface** means admin, API, crawler, tooling, infrastructure, fallback, or generated-output territory outside the client page hierarchy.

## 1. Primary page hierarchy

The hierarchy below maps public/client page routes only. Root-level routes are siblings unless a dynamic child is indented beneath its canonical parent. The client-access branch is distinct from public navigation and labels authentication, noindex, and app status explicitly. The proof pages remain flat siblings: there is no `/clients/work` route.

```text
/
├── Public content
│   ├── /about                                      public page
│   ├── /career                                     public page
│   ├── /contact                                    public page
│   ├── /planning                                   public page
│   ├── /solutions                                  public page
│   │   └── /solutions/[category]                   dynamic public page pattern
│   ├── /showrooms                                  public page
│   ├── /service                                    public page
│   ├── /downloads                                  public page
│   ├── /sustainability                             public page
│   ├── /privacy                                    public legal page
│   ├── /terms                                     public legal page
│   ├── /refund-and-return-policy                   public policy page
│   └── /sitemap                                    public HTML route index
│
├── Planner marketing
│   ├── /planner                                    public marketing page
│   ├── /planner/help                               public marketing/help page
│   ├── /planner/features                           public marketing page
│   │   └── /planner/features/[slug]                dynamic public feature page pattern
│
├── Products
│   ├── /products                                   public catalog entry
│   ├── /products/seating                           canonical category page
│   │   └── /products/seating/[product]             dynamic product detail pattern
│   ├── /products/workstations                       canonical category page
│   │   └── /products/workstations/[product]        dynamic product detail pattern
│   ├── /products/tables                             canonical category page
│   │   └── /products/tables/[product]              dynamic product detail pattern
│   ├── /products/storages                           canonical category page
│   │   └── /products/storages/[product]            dynamic product detail pattern
│   ├── /products/soft-seating                       canonical category page
│   │   └── /products/soft-seating/[product]        dynamic product detail pattern
│   └── /products/education                          canonical category page
│       └── /products/education/[product]            dynamic product detail pattern
│
├── Proof
│   ├── /trusted-by                                 public proof page
│   └── /clients                                    public proof/portfolio page
│
└── Client access and workspaces (not public navigation)
    ├── /access                                    auth entry; public utility/noindex intent
    ├── /portal                                    authenticated client portal; protected/noindex intent
    │   ├── /portal/[id]                            authenticated plan/project view; protected/noindex intent
    │   └── /portal/guest                            guest portal entry; protected/noindex intent
    │       └── /portal/guest/view/[id]              shared guest view; protected/noindex intent
    ├── /dashboard                                 authenticated client dashboard; protected/noindex intent
    └── /ooplanner                                 interactive Planner entry; app/noindex intent
        ├── /ooplanner/projects                     saved projects; app/authenticated intent
        └── /ooplanner/projects/[id]                project workspace; app/authenticated intent
```

### Primary route status matrix

| Branch | Routes represented | Static classification | Boundary |
|---|---|---|---|
| Public content | `/`, `/about`, `/career`, `/contact`, `/planning`, `/solutions`, `/solutions/[category]`, `/showrooms`, `/service`, `/downloads`, `/sustainability`, `/privacy`, `/terms`, `/refund-and-return-policy`, `/sitemap` | Public page or dynamic public page pattern | Public/indexable intent is source classification only |
| Planner marketing | `/planner`, `/planner/help`, `/planner/features`, `/planner/features/[slug]` | Public marketing/help and dynamic feature page pattern | Separate from the interactive `/ooplanner` app |
| Products | `/products`, six concrete category pages, and six category-specific `[product]` patterns | Public catalog page and data-driven detail patterns | Concrete product records are not fabricated or enumerated here |
| Proof | `/trusted-by`, `/clients` | Flat public proof pages | No `/clients/work` child route is modeled |
| Client access | `/access`, `/portal`, `/portal/[id]`, `/portal/guest`, `/portal/guest/view/[id]`, `/dashboard` | Auth/protected client pages with noindex intent | Not public navigation; session and authorization are unverified |
| Planner app | `/ooplanner`, `/ooplanner/projects`, `/ooplanner/projects/[id]` | Interactive app pages with noindex/authenticated intent | Guest/member behavior and saved records are unverified |

### Products: category vocabulary and data boundary

The six category pages use the canonical live source vocabulary: `seating`, `workstations`, `tables`, `storages`, `soft-seating`, and `education`. Each category has a `[product]` detail pattern below it. Individual product records, slugs, images, prices, and availability are data-driven instances; this source sitemap deliberately does not invent or enumerate them.

## 2. Journey relationships (not additional hierarchy)

These are static, intended journey relationships used to explain how page families relate. They are not observed browser transitions or proof of a static inbound link.

1. **Discover → specify → enquire:** `/` → `/products` → one of the six category pages → that category's `[product]` detail pattern; a visitor may continue to `/compare`, `/quote-cart`, or `/contact`.
2. **Proof → conversation:** `/` or `/trusted-by` may lead to `/clients`; either proof sibling may continue to `/contact` or `/planning`. The public proof surface is curated, not an exhaustive client database.
3. **Planning-led entry:** `/planning` may lead to `/contact`; `/planner` may lead to `/planner/features` or `/planner/help`, then to `/ooplanner` when a visitor is ready to use the workspace.
4. **Support and resources:** `/service` and `/downloads` may lead to `/contact` or `/planning` for a human-supported next step.
5. **Authenticated customer:** `/access` is the canonical auth entry; the source map groups `/dashboard`, `/portal`, and `/portal/[id]` as client workspace destinations. Session transitions and authorization are not proven here.
6. **Guest client view:** `/access` may hand off to `/portal/guest` and `/portal/guest/view/[id]`; any auth recovery back to `/access` remains a source-level intent, not an observed response.
7. **Planner member or guest:** `/access` or `/choose-product` may lead to `/ooplanner`, then to `/ooplanner/projects` and `/ooplanner/projects/[id]`. Planner and staff-only Studio remain separate surfaces.

## 3. Utility register — not primary pages

These source-defined public utilities and transactional shells are deliberately outside the primary page hierarchy. They may be directly entered or reached through a journey, but they are not primary public content branches.

| Route | Static classification | Note |
|---|---|---|
| `/compare` | public utility | Side-by-side comparison surface; not part of the public content branch |
| `/quote-cart` | public utility/noindex intent | Quote-list builder; no static inbound link was found in the focused audit, which is not proof that no runtime link exists |
| `/choose-product` | public utility/noindex intent | Guided product choice with auth or guest handoff |
| `/tools/meeting-room-capacity-calculator` | public utility page — launched 2026-09-01 | Launched with unique NBC-based calculator content; `indexable: true` (sitemap-listed). Supersedes the earlier "placeholder shell" classification. |
| `/tools/office-space-calculator` | public utility page — launched 2026-09-01 | Launched with unique NBC-based calculator content; `indexable: true` (sitemap-listed). `spaceCalculator.ts` is its engine. Supersedes the earlier "placeholder shell" classification. |

## 4. Redirect register — not pages

These are approved redirect-only groupings. An alias is not a page node in the primary hierarchy, and the table records destination intent rather than an observed HTTP status, response body, or hosted redirect.

| Destination | Redirect alias group | Static intent |
|---|---|---|
| `/` | `/news`, `/brochure`, `/download-brochure`, `/catalog` | Retired newsroom, brochure, and catalog aliases grouped at home |
| `/clients` | `/gallery`, `/portfolio`, `/projects`, `/social` | Consolidated client proof destination |
| `/service` | `/support-ivr`, `/tracking` | After-sales/support destination |
| `/products` | `/templates`, `/portal/svg-catalog`, `/portal/svg-catalog/[slug]` | Canonical catalog destination |
| `/terms` | `/imprint` | Company identity/legal destination |
| `/access` | `/login` | Canonical sign-in destination |
| `/products/[category]` | `/products/category/[slug]` | Canonical category destination after slug resolution |

## 5. Mapped / not mapped

This section separates the page map from the other things discovered during the focused static audit.

### Mapped: primary pages

The mapped primary set is the route-only hierarchy in section 1: public content, Planner marketing, the `/products` entry plus six concrete category pages and their six `[product]` patterns, flat proof siblings, and the distinct client-access/app branch. A route pattern is mapped once; its data-driven instances are not enumerated.

### Mapped: journey/utility-only

The journey relationships in section 2 and the utility register in section 3 are mapped as supporting context, not as primary page-tree nodes. This includes `/compare`, `/quote-cart`, `/choose-product`, and both calculator shells.

### Mapped: redirect-only

The destination groups in section 4 are mapped as aliases only. Their source paths must not be mistaken for extra pages.

### Mapped: excluded/system

The surfaces in section 6 are intentionally mapped for boundary clarity, but not as client content pages.

### Source-defined content/helpers with no direct focused consumer

These items are content blocks, compatibility data, helpers, or page-support code—not additional pages. “No direct focused consumer” is a static search result and is not runtime proof that a symbol is unused, not rendered, or unavailable.

| Source-defined item | Static interpretation |
|---|---|
| `HOMEPAGE_FAQ_CONTENT` | Homepage FAQ content block, not a page route; no direct focused consumer found |
| `HOMEPAGE_PARTNERSHIP_CONTENT` / inactive partnership panel | Homepage partnership data and optional panel branch; the focused call path leaves the optional branch at its default inactive state; this is not a browser assertion |
| Legacy homepage exports: `HOMEPAGE_PROJECTS_CONTENT`, `HOMEPAGE_SHOWCASE_CONTENT`, `HOMEPAGE_STATS_CONTENT`, `HOMEPAGE_PROCESS_CONTENT`, `HOMEPAGE_SECTORS_CONTENT`, `HOMEPAGE_SOLUTIONS_CONTENT`, `HOMEPAGE_WHY_CHOOSE_US_CONTENT`, `HOMEPAGE_TESTIMONIALS_CONTENT` | Source-defined legacy content exports, not page routes; no direct focused consumer found |
| `TRUSTED_BY_STATS` | Source-defined proof stats array, not a page; no direct focused consumer found |
| Unused trusted-by copy fields: `heroKicker`, `statsKicker`, `craftQuote`, `craftAttribution`, `rosterTitle`, `rosterDescription` | Copy fields in `TRUSTED_BY_PAGE_COPY`, not routes; current view wiring does not pass these fields through |
| `CLIENTS_PAGE_CLIENTS` | Source-defined curated client data, not a page route; no direct focused consumer found |
| `PROJECTS_PAGE_CLIENTS` | Deprecated/compatibility client data, not a page route; no direct focused consumer found |
| `groupClientsBySector` | Source-defined grouping helper, not a route; no direct focused consumer found |
| `trustedByClientsMissingLogos` | Static inspection helper, not a route; no direct focused consumer found |
| `SHOWROOMS_CLIENTS` | Source-defined showroom client list, not a route; no direct focused consumer found |
| `HERO_CAROUSEL_SLIDES` | Legacy hero data export, not a page; current source comments identify it as legacy |
| `spaceCalculator.ts` | Pure calculation engine, not a page; no focused page/component import was found |

### Not mapped as concrete instances

The sitemap does not enumerate product records, product slugs, Planner project IDs, portal IDs, feature slugs, client records, catalog inventory, or any other runtime data. A dynamic route pattern is not proof that a particular instance is rendered, linked, authorized, or present in data.

## 6. Excluded / system surfaces

These surfaces are outside the primary client page hierarchy and are shown only to make the boundary explicit.

| Surface | Why it is outside the primary page map |
|---|---|
| `/admin/**` | Staff/admin pages and management tools |
| `/api/**` | API handlers, not page routes |
| `/oostudio` | Staff/admin-only Studio app; noindex intent; separate from Planner |
| `/offline` | Noindex fallback/maintenance utility |
| `/robots.txt` | Crawler policy endpoint |
| `/sitemap.xml` | Generated crawler sitemap endpoint, distinct from public HTML `/sitemap` |
| `/tech-docs/**` | Tech-docs tooling and SPA surface |
| Infrastructure and delivery: `site/proxy.ts`, worker/R2, asset delivery paths | System routing and delivery concerns |
| Build output | Generated artifacts, not source page routes |
| Observability endpoints | Operational/metrics surfaces, not client content pages |

## 7. Evidence and maintenance note

The companion `non-admin-site-map.html` mirrors these boundaries with separate interactive views: **Primary page tree**, **Products by category**, **Visitor journeys**, **Client access**, **Redirect register — not pages**, **Mapped / not mapped**, and **Excluded / system**. Search, filtering, pan, and zoom in that file are local static-file behavior; they do not add route or runtime evidence.

The artifacts should be read in this order: primary page hierarchy first, then utility and journey context, then redirect/source/system registers. Static source presence and classifications remain the only evidence represented here; no build, render, link, authorization, redirect status, or data-load result is claimed.
