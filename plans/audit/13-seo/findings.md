# 13 — SEO

**Overall: strong, near best-practice. Minor gaps only.**

**The repo's rule set** (`tests/unit/features/site/data/seoStandardsAudit.test.ts`): schema.org rich-results validity (Organization/WebSite/FurnitureStore graph, Product, BreadcrumbList 1-indexed, JobPosting with real `datePosted`, FAQPage), strict canonical trailing-slash integrity, open-redirect-proof canonical sanitization, single-brand title rule, title 10–80 chars / description 30–220 chars, OG `summary_large_image` with no fabricated width/height, zero-orphan navigation, no private prefix in the sitemap.

## Infrastructure (verified correct)

- `site/features/site/data/seo.ts` (737 lines) — single metadata factory: `buildPageMetadata`/`buildSiteMetadata` with absolute titles, `sanitizeCanonicalPath` (lines 105–173: rejects `//`, `\`, `%2f`, schemes, control chars), `buildCanonicalUrl` origin double-check, hreflang for `localePrefix: never` (en-IN + x-default).
- `site/lib/siteUrl.ts` — production apex `https://oando.co.in` fallback; blocks `*.vercel.app`, localhost, `0.0.0.0` from canonicals/OG (lines 11–36).
- `site/app/robots.ts` — rules for `*`, Googlebot, Bingbot, Googlebot-Image; `sitemap` + `host`; disallow list from `routeClassification.ts:675-692` covering `/admin/`, `/api/`, `/portal/`, `/dashboard/`, `/oostudio/`, `/ooplanner/`.
- `site/app/sitemap.ts` — static indexable paths + catalog products/categories; segment sanitizer rejects UUIDs/host injection (lines 29–37); dedupe by canonical URL; `lastmod` only from real catalog dates.
- OG images: `(site)/opengraph-image.tsx` (1200×630, alt, png) + `twitter-image.tsx`. Sitewide JSON-LD with `sanitizeJsonForScript` + nonce (`(site)/layout.tsx:43-50`).

## Metadata spot-check (all 61 `page.tsx` export-scanned)

36 pages declare own `metadata`/`generateMetadata`; the rest inherit from layouts that all carry `robots: { index: false }` (`app/admin/layout.tsx:14`, `features/Planner/layout.tsx:11`, `features/Studio/layout.tsx:12`, `portal/layout.tsx:13`). PDP `generateMetadata` hard-404s unknown products to prevent soft-404 (`products/[category]/[product]/page.tsx:105-108`). No page with missing metadata that isn't deliberately noindex.

## Findings

| # | Severity | Finding |
|---|----------|---------|
| 13.1 | Low | Triple re-export chain to one SEO module: `features/site/data/seo.ts` → `lib/helpers/seo.ts` → `lib/analytics/seo.ts`; callers import from all three layers — drift/ambiguity risk (`lib/helpers/seo.ts:1-13`, `lib/analytics/seo.ts:1-20`). |
| 13.2 | Low | Catalog-fetch failure in sitemap silently swallowed — sitemap degrades to static-only with no log (`app/sitemap.ts:97-99`). |
| 13.3 | Low | `robots.ts` emits non-standard `host` (Yandex-only) (`app/robots.ts:19`) — harmless but unmaintained surface. |
| 13.4 | Low | Workspace routes (`ooplanner/projects`, `[id]`, `oostudio`) have no page-level title — inherit generic "Planner"/"Studio" (`app/ooplanner/projects/page.tsx:3`). All noindex, so cosmetic. |
