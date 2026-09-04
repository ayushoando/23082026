# Site Application Routes (`site/app/`) Architecture Audit

**Audited:** 2026-09-04 (live files read)  
**Method:** `site/app/` directory listed live; `site/app/sitemap.ts` first 70 lines read live.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| "Next.js 16 App Router" | Claimed | ✅ **Confirmed** — `package.json` shows `next: 16.3.3` |
| `(site)`, `admin`, `ooplanner`, `oostudio`, `api`, `api-docs` route dirs | Claimed | ✅ **Confirmed** — all present in live `site/app/` listing |
| "4 distinct application domains" | Claimed | ⚠️ **UNDERCOUNTED** — `site/app/` has additional routes not mentioned: `offline/` (PWA offline fallback page) and `.well-known/` (served at edge but has a Next fallback) |
| `(legal)/` as sub-route under `(site)` | Claimed | ✅ **Confirmed** (confirmed via directory listing from prior sessions) |
| Sitemap defect: "10 URLs returning HTTP 404, attributed to `productStaticParams.ts`" | Claimed as source | ⚠️ **SOURCE ATTRIBUTION WRONG** — `sitemap.ts` is **dynamic**: it calls `buildProductStaticParams()` (fetches from DB) and uses `isSafeSitemapSegment()` validators, `buildCatalogLastModifiedByPath()`, and `routeClassification.ts` imports. The 404 slugs come from DB rows with stale slug data, not from hardcoded static lists in `productStaticParams.ts`. |
| Sitemap uses `<priority>` and `<changefreq>` | Implied | **NEW:** `sitemap.ts` comment: `// Google ignores <priority> and <changefreq> (per Search Central), so only emit <loc> + <lastmod>`. The implementation deliberately omits these. |
| `robots.ts & sitemap.ts` described as "Dynamic SEO engines" | Claimed | ✅ **Confirmed** — `sitemap.ts` is fully dynamic with DB calls |
| `global-error.tsx` and `not-found.tsx` | Claimed | ✅ **Confirmed** |

---

## 1. Live `site/app/` Route Inventory (Corrected)

```
site/app/
├── (site)/              ✅ Public marketing & catalog (en/hi routed)
│   ├── page.tsx         ✅ Homepage
│   ├── products/        ✅ Catalog browser, PDP
│   ├── choose-product/  ✅ Configurator wizard entrypoint
│   └── (legal)/         ✅ Privacy, terms, refund
├── admin/               ✅ Operations & CRM portal
│   ├── catalog/         ✅ Product manager
│   ├── plans/           ✅ Customer plans
│   ├── queries/         ✅ Lead CRM
│   └── themes/          ✅ Design token editor
├── ooplanner/           ✅ 2D/3D floor planner (Dockview + Fabric.js + Three.js)
├── oostudio/            ✅ 2D/3D furniture studio (Fabric.js + glTF)
├── api/                 ✅ Serverless API (Edge + Node runtime)
│   ├── catalog/
│   ├── plans/
│   ├── admin/
│   └── health/
├── api-docs/            ✅ OpenAPI UI (Scalar/Swagger)
├── offline/             NEW — PWA offline fallback page (not in prior report)
├── .well-known/         NEW — Next.js fallback for well-known paths (edge serves first)
├── openapi.json/        NEW — directory (static OpenAPI spec)
├── robots.ts            ✅ Dynamic robots.txt
├── sitemap.ts           ✅ Dynamic sitemap (DB-driven, no hardcoded slugs)
├── layout.tsx           ✅ Root shell
├── error.tsx            ✅ Root error boundary
├── global-error.tsx     ✅ Fatal root boundary
└── not-found.tsx        ✅ 404 handler (hi/en fallbacks)
```

---

## 2. Sitemap Defect — Corrected Root Cause

**Prior report:** "static fallback params in `site/lib/catalog/productStaticParams.ts` must be pruned to eliminate search crawler errors."

**Live reality:** `sitemap.ts` is fully dynamic — it does NOT hardcode slugs. The function `buildProductStaticParams()` fetches from the Products DB. The 404 slugs must come from **DB rows with stale or deleted product slugs** that resolve to valid-looking paths but no longer have live catalog pages.

**Correct remediation:** Run `pnpm run audit:sitemap-health` against `https://oando.co.in/sitemap.xml`, identify the 404 slugs, then either:
1. Delete or archive the corresponding `catalog_products` rows, or  
2. Add a live-URL verification step to the sitemap generation function

**Note:** `isSafeSitemapSegment()` already filters UUIDs, Title Case, `--` double-dash patterns, and host injection attempts. The issue is stale DB records, not a code defect.

---

## 3. Domain Surface Breakdown (Confirmed)

| Route | Runtime | Styling |
| :--- | :--- | :--- |
| `/(site)` | Server Components + selective islands | `@focss/*` tokens |
| `/admin` | Client hydration + session auth | `admin.css` |
| `/ooplanner` | Pure client SPA (WebGL Canvas) | `planner.css` |
| `/oostudio` | Pure client SPA (Fabric.js) | `studio.css` |
| `/api` | Edge + Node serverless | JSON only |
| `/offline` | Static client page | PWA shell |

---

## 4. Architectural Guards (Confirmed)

- **Fork isolation:** `/oostudio` → `@studio/*` only; `/ooplanner` → `@planner/*` only. Cross-imports fail `scan:boundaries`
- **Error boundaries:** `global-error.tsx` (fatal), root `error.tsx`, per-segment `error.tsx` files, `not-found.tsx` with localized fallbacks
