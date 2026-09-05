# Oando Subsystem Remediation Plan: Client-Hub Sequence & Public Route Roadmap

**File Target:** `plans/05092026/10-client-hub-sequence-plan.md`  
**Note:** `plans/PLAN.md` now contains a redirect stub pointing here. The original content lives in this file.  
**Governing Standard:** `AGENTS.md` (Authority floor: User instruction > live code/fresh command output > `AGENTS.md`)  
**Execution State:** **FROZEN / PLANNING ONLY** (`NO CODE CHANGE`, `NO AUTO IMPLEMENT`)  
**Spine:** [`../client-hub/flowcharts/clients-hub-flow.md`](../client-hub/flowcharts/clients-hub-flow.md)  
**Living HTML Sitemap:** [`../client-hub/flowcharts/non-admin-site-map.html`](../client-hub/flowcharts/non-admin-site-map.html)  

---

## 1. Ground Truth & Core Boundaries

- **Fork Isolation:** Studio (`/oostudio`) and Planner (`/ooplanner`) are strictly forked — zero cross-imports (`scripts/scan-boundaries.mjs`).
- **Asset Delivery:** Cloudflare R2 serves optimized WebP images (`unoptimized` flag on client components).
- **Persistence Mode:** Production filesystem is read-only (`EROFS`); remote mutations route through Admin Supabase (`rxzpznmxbaoxpikowmfc`).
- **Evidence Floor:** User instruction > live code and fresh command output > `AGENTS.md` > `Agents/` > `docs/`.
- **Vitest Test Suite Invariant:** Canonical Planner test fixtures live under `tests/fixtures/planner/` and performance budgets live under `tests/e2e/helpers/`.

---

## 2. Sequence Roadmap

| Phase | Title | Scope & Contract | Status |
| :---: | :--- | :--- | :---: |
| **—** | **Spine** | [`../client-hub/`](../client-hub/) — Public route map, redirect register §4 | ✅ Complete |
| **1** | **Chrome** | Public header, footer, mobile tab bar, and navigation contracts | ✅ Complete (Modernized) |
| **2** | **Homepage** | `/` customer journey start, FOCSS design tokens, and hero contracts | ✅ Complete |
| **3** | **Map Equals Code** | HTTP 301/308 redirects, calculator indexability alignment | ✅ Complete (Remedied) |
| **4** | **Browser Walk** | Visual verification on `http://localhost:3000` (desktop & phone) | 🔄 Active (Blocked by `BROWSER-ORIGIN-02`) |

---

## 3. Phase Details & Live Code Contracts

### Phase 1 — Chrome (Header, Footer, Tabs) — ✅ Complete (Modernized)

- **Navigation Contract:** Defined in [`site/features/site/data/navigation.ts`](file:///d:/23082026/site/features/site/data/navigation.ts).
- **Header Structure:** Flat 8-link primary navigation bar capped at 9 links:
  1. `Products` (`/products`, `hasMega: true`)
  2. `Portfolio` (`/portfolio`)
  3. `Clients` (`/clients`)
  4. `Trusted By` (`/trusted-by`)
  5. `Planner` (`/planner`)
  6. `About Us` (`/about`)
  7. `Contact Us` (`/contact`)
  8. `FAQ` (`/faq`)
  - *Drift Remediation Note:* The legacy "More" dropdown was eliminated. `SITE_HEADER_MORE_LINKS: []` is strictly empty. Sign in (`/access`) remains a dedicated utility action.
- **Footer Contract:** Public and customer links only. Strictly excludes `/dashboard`, `/portal`, `/ooplanner`, and `/admin`. Clients lives under Company; Planning lives under Services.
- **Mobile Navigation (<768px):** Phone bottom bar renders 5 high-value tabs (`Products`, `Planner`, `Quote`, `Portfolio`, `Account`) plus hamburger drawer. Desktop primary nav expands from `1280px`.
- **Exclusion Boundaries:** Calculators, compare, quote-cart, and choose-product stay strictly out of primary chrome.

---

### Phase 2 — Homepage (`/`) — ✅ Complete

- **Customer Journey Start:** Starting point for Journeys 1–2 on the client-hub map.
- **Primary Actions:** Target destinations are `/products`, proof (`/trusted-by` or `/clients`), `/planner`, and `/contact`.
- **Hero Contract ([`site/features/site/data/homepage.ts`](file:///d:/23082026/site/features/site/data/homepage.ts)):**
  - Visible hero glass proof CTA routes to `/trusted-by/` with canonical trailing slash.
  - Primary CTA: `"Get your layout plan"` $\to$ `/planner`.
  - Secondary CTA: `"Browse products"` $\to$ `/products`.
  - Deep-linking hero buttons into `/ooplanner` is strictly avoided.
- **Asset Optimization:** Marketing hero assets load from Cloudflare R2 WebP paths (`/assets/marketing/hero/slides/Dmrc-Oneandonly-bright.webp`) with the `unoptimized` flag.
- **Design Tokens:** FOCSS CSS modules located under `site/focss/site/components/homepage/`. UI-005 verified (`--font-weight-medium: 500`, `--font-weight-semibold: 600`).
- **Trust Strip:** Client logos use kebab-case identifiers via `CLIENT_LOGO_SRC_BY_NAME` in `clientLogos.ts`.

---

### Phase 3 — Map Equals Code — ✅ Complete (Remedied)

- **HTTP Redirects ([`config/build/next.config.js#L88-L140`](file:///d:/23082026/config/build/next.config.js#L88-L140)):**
  - News aliases $\to$ `/about/`
  - Catalog and brochure aliases $\to$ `/downloads/`
  - Portfolio and project aliases (`/gallery`, `/projects`, `/social`) $\to$ `/portfolio/`
  - Support and tracking aliases $\to$ `/service/`
  - Auth sign-in aliases $\to$ `/access/`
  - Solutions aliases $\to$ `/products/`
- **Calculator Indexability (Updated Truth):**
  - *Prior Stale Assumption:* Claimed `/tools/*` were placeholder shells with `indexable: false`.
  - *Remedied Reality:* Tools under `/tools/*` (`/tools/office-space-calculator` and `/tools/meeting-room-capacity-calculator`) as well as directory `/tools` are explicitly configured with **`indexable: true`** in [`routeClassification.ts#L52-L80`](file:///d:/23082026/site/features/site/data/routeClassification.ts#L52-L80).
  - All three paths are registered in `SEO01_STATIC_METADATA` (`site/features/site/data/siteSeoContract.ts#L64-L72`) and included in `htmlSitemap.ts` and XML sitemaps.
- **Utility Route Boundaries:** Non-marketing utility surfaces (`/compare`, `/quote-cart`, `/choose-product`) remain unlinked in public sitemaps.

---

### Phase 4 — Browser Walk — 🔄 Active

- **Environment & Origin Invariant:** Manual and automated browser verification strictly on `http://localhost:3000` (NEVER `127.0.0.1`).
- **Viewports Matrix:** Desktop (1440px), Tablet (1024px), Mobile (390px iPhone 12/13/14).
- **Blocker Resolution Protocol (`BROWSER-ORIGIN-02`):**
  - Because `PLAYWRIGHT_BASE_URL` is configured, Playwright disables its internal web server spawner.
  - **Required Execution:**
    1. Boot dev server: `cross-env DEV_AUTH_BYPASS=1 pnpm run dev`
    2. Run browser gate: `pnpm run test:browser:gate`
    3. Verify mobile scroller (`.mobile-app-main`) and GSAP ScrollTrigger bindings.
    4. Delete row `BROWSER-ORIGIN-02` from `Failures.md`.
- **Key User Journeys Tested:**
  1. `/` $\to$ `/products` $\to$ category $\to$ product detail $\to$ `/contact`
  2. `/trusted-by` and `/clients` verified as peer proof siblings
  3. `/planning` and `/planner` landing pages route to `/ooplanner` only when explicitly launching the app
  4. `/access` reached only from Sign in / Account utilities
- **Leak Prevention:** Continuous validation ensuring unauthenticated sessions do not leak into `/ooplanner`, `/portal`, `/dashboard`, or `/admin`.
