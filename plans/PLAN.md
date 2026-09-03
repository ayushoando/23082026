# Client-Hub Sequence Plan

**Spine:** [`client-hub/flowcharts/clients-hub-flow.md`](./client-hub/flowcharts/clients-hub-flow.md)  
**Living HTML Sitemap:** [`client-hub/flowcharts/non-admin-site-map.html`](./client-hub/flowcharts/non-admin-site-map.html)  

---

## 1. Ground Truth & Boundaries

- **Fork Isolation:** Studio (`/oostudio`) and Planner (`/ooplanner`) are strictly forked — zero cross-imports.
- **Asset Delivery:** Cloudflare R2 serves optimized webp images (`unoptimized` flag on client components).
- **Persistence Mode:** Production filesystem is read-only (`EROFS`); remote mutations route through Supabase.
- **Evidence Floor:** User instruction > live code and fresh command output > `AGENTS.md` > `Agents/` > `docs/`.

---

## 2. Sequence Roadmap

| Phase | Title | Scope & Contract | Status |
| :---: | :--- | :--- | :---: |
| **—** | **Spine** | [`client-hub/`](./client-hub/) — Public route map, redirect register §4 | ✅ Complete |
| **1** | **Chrome** | Public header, footer, mobile bar, and navigation contracts | ✅ Complete |
| **2** | **Homepage** | `/` customer journey start, FOCSS design tokens, and hero contracts | ✅ Complete |
| **3** | **Map Equals Code** | HTTP 301/308 redirects, calculator indexability alignment | ✅ Complete |
| **4** | **Browser Walk** | Visual verification on `http://localhost:3000` (desktop & phone) | 🔄 Active |

*Note: [`planner-comprehensive-audit/`](./planner-comprehensive-audit/) contains 16 TypeScript modules imported directly by Vitest test suites under `tests/unit/planner/`.*

---

## 3. Phase Details & Contracts

### Phase 1 — Chrome (Header, Footer, Tabs) — ✅ Complete

- **Navigation Contract:** Defined in [`site/features/site/data/navigation.ts`](file:///d:/23082026/site/features/site/data/navigation.ts).
- **Header:** Products, Solutions, Clients, Planner (`/planner`), About, Contact, plus **More** dropdown (Planning, Showrooms, Trusted By, Careers, After Sales, Downloads, Sustainability, FAQ). Sign in (`/access`) is a utility action.
- **FAQ:** Standardized at `/faq` (linked in footer Services and More menu); not a header primary.
- **Footer:** Public and customer links only. Strictly excludes `/dashboard`, `/portal`, `/ooplanner`, and `/admin`. Clients lives under Company; Planning lives under Services.
- **Mobile Navigation:** Phone bottom bar renders Get Quote + hamburger drawer for viewports `<768px`. Desktop primary nav expands from `1280px`. Planner mobile tab links directly to `/planner`; Account links to `/access`.
- **Exclusion Boundaries:** Calculators, compare, quote-cart, and choose-product stay strictly out of chrome.

---

### Phase 2 — Homepage (`/`) — ✅ Complete

- **Customer Journey Start:** Serves as the starting point for Journeys 1–2 on the client-hub map.
- **Primary Actions:** Target destinations are `/products`, proof (`/trusted-by` or `/clients`), `/planner`, and `/contact` or `/planning`.
- **Hero Contract:** The visible hero CTA routes to `/trusted-by/`. Product exploration lives in Collections; Planner suite launch links to `/planner`. Deep-linking hero buttons into `/ooplanner` is strictly avoided.
- **Asset Optimization:** Marketing hero assets load from Cloudflare R2 webp paths (`/assets/marketing/hero/`) with the `unoptimized` flag.
- **Design Tokens:** FOCSS CSS modules located under `site/focss/site/components/homepage/`. UI-005 verified (`--font-weight-medium: 500`, `--font-weight-semibold: 600`).
- **Trust Strip:** Client logos use kebab-case identifiers via `CLIENT_LOGO_SRC_BY_NAME` in `clientLogos.ts`.
- **Suite Login:** Interactive tools floorplan demo links to `/ooplanner/?siteSource=/`, while `loginHref` targets `/access/?next=/ooplanner/`.

---

### Phase 3 — Map Equals Code — ✅ Complete

- **HTTP Redirects:** Configured in `config/build/next.config.js` and mirrored in client-hub §4:
  - News aliases → `/about`
  - Catalog and brochure aliases → `/downloads`
  - Portfolio/gallery aliases → `/clients`
  - Support and tracking aliases → `/service`
  - Auth sign-in aliases → `/access`
- **Calculator Indexability:** Tools under `/tools/*` (Office Space Calculator, Meeting Room Calculator) render `tools-engine-placeholder` shells and are explicitly configured with `indexable: false` across `routeClassification.ts`, sitemap, and robots.txt.
- **Utility Route Boundaries:** Non-marketing utility surfaces (`/compare`, `/quote-cart`, `/choose-product`) remain unlinked in public sitemaps.

---

### Phase 4 — Browser Walk — 🔄 Active

- **Environment:** Manual and automated browser verification on `http://localhost:3000` (never `127.0.0.1`).
- **Viewports:** Desktop 1440px and Mobile 390px.
- **Key User Journeys:**
  1. `/` → `/products` → category → product detail → `/contact`
  2. `/trusted-by` and `/clients` verified as peer proof siblings
  3. `/planning` and `/planner` landing pages route to `/ooplanner` only when explicitly launching the app
  4. `/access` reached only from Sign in / Account utilities
- **Leak Prevention:** Continuous validation ensuring unauthenticated sessions do not leak into `/ooplanner`, `/portal`, `/dashboard`, or `/admin`.
