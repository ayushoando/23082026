# SEO Audit Report

**Date:** 2026-08-31
**Scope:** Full SEO and indexability audit including Google Search Console data
**Domain:** oando.co.in (One&Only office furniture)
**Data source:** Google Search Console export (`results/stupidgoogle/`)

---

## Executive Summary

The site has **strong SEO infrastructure** — dynamic sitemap, comprehensive structured data (7+ JSON-LD types), canonical URLs on every page, OG/Twitter cards, and 60+ legacy redirects. However, Google Search Console shows a **severe indexing crisis**: only **31 pages indexed** vs **198 not-indexed** (as of Aug 21, 2026). The indexed count dropped from 15→14→12→1 in early June before recovering to 21-31, suggesting a technical incident or Google recrawl event. The primary problems are **59 404 errors**, **47 robots-blocked pages**, and **18 crawled-but-not-indexed pages**.

### Key Metrics (Aug 21, 2026)

| Metric | Value | Status |
|---|---|---|
| Indexed pages | 31 | 🔴 Very low |
| Not-indexed pages | 198 | 🔴 Growing |
| Daily impressions | 8-16 (Aug) | 🔴 Declining from 40-60 (Jul) |
| 404 errors | 59 | 🔴 Critical |
| Robots-blocked | 47 | 🟡 Needs review |
| Redirect issues | 22 | 🟡 Needs review |
| Crawled not indexed | 18 | 🟡 Content quality signal |
| Excluded by noindex | 32 | 🟢 Intentional |
| Soft 404s | 3 | 🟡 Fix needed |

---

## Google Search Console Analysis

### Indexing Timeline

```
Jun 01: 15 indexed, 39 not-indexed → Baseline
Jun 06: 12 indexed, 82 not-indexed → Sudden spike in not-indexed (+43)
Jun 09: 1 indexed, 124 not-indexed → Catastrophic drop to 1 indexed page
Jun 13: 21 indexed, 123 not-indexed → Recovery begins
Jul 01: 22 indexed, 156 not-indexed → Stabilized but not-indexed still growing
Aug 11: 27 indexed, 161 not-indexed → Slight improvement
Aug 18: 31 indexed, 198 not-indexed → Not-indexed continues growing
```

**Critical event around Jun 6-9:** Indexed pages dropped from 12 to 1. This suggests either:
1. A deploy broke the site (returning 5xx to Googlebot)
2. A `noindex` tag was accidentally applied site-wide
3. The Cloudflare Worker's X-Robots-Tag logic malfunctioned
4. Google penalized the site for some reason

**Impressions trend:** Dropped from 36-61/day in late June/early July to a flat 10/day from mid-July onward, recovering slightly to 11-16 in mid-August.

---

## Issue Breakdown

### SEO-C01: 59 Pages Returning 404 (Not Found)

**Severity:** CRITICAL
**Source:** Website → Validation: Failed

These are URLs Google knows about (from sitemap, internal links, or backlinks) that return 404. Every 404 wastes crawl budget and signals low site quality.

**Likely causes:**
1. Legacy product URLs that were deleted without redirects
2. Category slug changes (e.g., `oando-chairs` → `seating`) where some variants were missed
3. Blog or content pages that were removed
4. URLs from external backlinks pointing to pages that no longer exist

**Evidence from codebase:** The `next.config.js` has ~60+ redirects covering many legacy paths, but the 404 count suggests gaps remain. Product URLs generated from catalog data may have stale entries.

**Remediation:** See SEO-R01 in remedy plan.

---

### SEO-C02: 47 Pages Blocked by robots.txt

**Severity:** HIGH (if unintentional)
**Source:** Website → Validation: Failed

The `robots.ts` disallows these prefixes:
```
/api/, /admin/, /crm/, /ops/, /portal/, /dashboard/,
/login/, /access/, /repo-store/, /quote-cart/, /tracking/,
/choose-product/, /support-ivr/, /offline/, /oostudio/, /ooplanner/
```

**Assessment:** These are correctly blocked — they're admin, API, and app-shell routes that should not be indexed. However, 47 pages being flagged as "blocked by robots.txt" means Google is **discovering** these URLs (through internal links, sitemap, or JavaScript rendering) and then being told not to crawl them.

**Risk:** If any of these 47 URLs include public-facing pages that should be indexed, they're being silently blocked.

**Remediation:** See SEO-R02 in remedy plan.

---

### SEO-C03: 22 Pages with Redirect Issues

**Severity:** MEDIUM
**Source:** Website → Validation: Failed

Google is seeing redirect problems on 22 URLs. Possible causes:
1. Redirect chains (A → B → C) rather than direct A → C
2. Redirect loops
3. Temporary (302) redirects being used where permanent (301/308) is appropriate
4. Redirects to pages that themselves 404

**Evidence from codebase:** All redirects in `next.config.js` use `permanent: true` (308 status), which is correct. The Cloudflare Worker adds a www-to-apex 308 redirect. No redirect chains were detected in the static config, but runtime `redirect()` calls in page components could create chain behavior.

**Remediation:** See SEO-R03 in remedy plan.

---

### SEO-C04: 18 Crawled but Currently Not Indexed

**Severity:** MEDIUM
**Source:** Google systems → Validation: Failed

Google crawled 18 pages but chose not to index them. This is typically a **content quality signal** — Google deemed these pages too thin, duplicative, or low-value to include in the index.

**Likely candidates:**
- Thin category pages with few or no products
- Pages with identical or near-identical content (e.g., product variants)
- Tool/calculator pages with minimal unique content
- Pages with heavy JavaScript rendering that Googlebot couldn't render fully

**Remediation:** See SEO-R04 in remedy plan.

---

### SEO-C05: 3 Soft 404 Pages

**Severity:** MEDIUM
**Source:** Website → Validation: Started

Google considers these pages to be soft 404s — they return a 200 status but look like error/empty pages. This usually means:
- Pages that render a "no products found" or empty state
- Pages where dynamic data failed to load and the page rendered with placeholder content
- Very thin pages that Google interprets as "nothing here"

**Remediation:** See SEO-R05 in remedy plan.

---

### SEO-C06: 1 Page Blocked with 403

**Severity:** LOW
**Source:** Website → Validation: Started

One page is returning 403 (Forbidden) to Googlebot. This is likely an auth-protected page that Googlebot attempted to access.

---

## SEO Infrastructure Assessment

### Strengths

| Area | Implementation | Quality |
|---|---|---|
| **Sitemap** | Dynamic `site/app/sitemap.ts` with catalog products, safety checks, dedup | ✅ Excellent |
| **Metadata** | `buildSiteMetadata` + `buildPageMetadata` on all pages | ✅ Excellent |
| **Canonical URLs** | `canonicalPath()` + `buildCanonicalUrl()` on every page | ✅ Excellent |
| **Structured data** | 7+ JSON-LD types: Organization, WebSite, FurnitureStore, Product, BreadcrumbList, FAQPage, JobPosting, LocalBusiness | ✅ Excellent |
| **OpenGraph** | Full OG tags + locale on all pages | ✅ Excellent |
| **Twitter Cards** | `summary_large_image` on all pages | ✅ Excellent |
| **Redirects** | 60+ permanent redirects covering legacy URLs | ✅ Excellent |
| **robots.txt** | Dynamic with proper disallows for admin/API/app routes | ✅ Good |
| **Robots tags** | Cloudflare Worker manages `X-Robots-Tag` by host | ✅ Good |
| **HSTS** | Worker sets `max-age=31536000; includeSubDomains; preload` | ✅ Excellent |
| **JSON-LD safety** | All JSON-LD sanitized via `sanitizeJsonForScript()` | ✅ Excellent |
| **404 page** | Custom not-found.tsx with metadata `indexable: false` | ✅ Good |

### Gaps

| Area | Issue | Severity |
|---|---|---|
| **Image optimization** | `unoptimized: true` in production (cost trade-off, COST-S01) | 🟡 Medium |
| **Image alt text** | AI alt-text generation exists (`/api/generate-alt`) but coverage unknown | 🟡 Medium |
| **Internal linking** | Not audited — thin internal link structure can hurt indexing | 🟡 Medium |
| **Page speed** | Image optimization disabled; no lazy loading audit done | 🟡 Medium |
| **Hreflang** | `localePrefix: "never"` means no distinct locale URLs — correct but limits i18n SEO | ℹ️ Info |
| **Product schema** | No price or availability in Product JSON-LD (SITE-SEO-04 — intentional for accuracy) | ℹ️ Info |
| **IndexNow** | Admin endpoint exists (`/api/admin/indexnow`) for Bing/Yandex push indexing | ✅ Good |

---

## Image Optimization Analysis

**Current config** (`config/build/next.config.js`):
```javascript
images: {
  formats: ["image/avif", "image/webp"],
  imageSizes: [/* 16–640 */],
  deviceSizes: [/* 640–3840 */],
  qualities: [75, 85],
  unoptimized: true, // COST-S01 — Vercel Image Optimization billing
}
```

The `unoptimized: true` flag **disables all Next.js image optimization** in production. Images are served as-is from R2/CDN without format conversion (AVIF/WebP), resizing, or quality adjustment. This impacts:
- **Core Web Vitals:** Larger images = slower LCP
- **Crawl budget:** Google deprioritizes slow sites
- **User experience:** Mobile users load desktop-sized images

The Cloudflare Worker serves assets with `Cache-Control: public, max-age=31536000, immutable` (good), but without optimization, raw images may be large.

---

## Structured Data Coverage

| Type | Pages | Schema |
|---|---|---|
| Organization + WebSite + FurnitureStore | Site-wide (layout) | `buildGlobalJsonLd()` |
| Product | `/products/[category]/[product]` | `buildProductJsonLd()` |
| BreadcrumbList | All pages | `buildBreadcrumbJsonLd()` |
| FAQPage | Category pages with FAQs | `buildFaqJsonLd()` |
| LocalBusiness | Showrooms page | `buildLocalBusinessJsonLd()` |
| JobPosting | Career page | `buildCareerJobsJsonLd()` |
| WebPage/CollectionPage/ContactPage | Various | `buildPageJsonLd()` |

**Quality notes:**
- Product schema intentionally omits `offers` (price/availability) — per SITE-SEO-04 comment, to avoid inventing data
- All JSON-LD sanitized with `sanitizeJsonForScript()` escaping `<`, `>`, `&`
- Image URLs resolved to absolute via `toAbsoluteAssetUrl()`

---

## Files Audited

| File | Role | Quality |
|---|---|---|
| `site/features/site/data/seo.ts` | SEO utilities | ✅ Excellent |
| `site/features/site/data/routeClassification.ts` | Route classification | ✅ Good |
| `site/app/robots.ts` | Dynamic robots.txt | ✅ Good |
| `site/app/sitemap.ts` | Dynamic sitemap | ✅ Excellent |
| `site/app/(site)/layout.tsx` | Root layout + JSON-LD | ✅ Good |
| `config/build/next.config.js` | Redirects + headers | ✅ Good |
| `vercel.json` | Deploy config + preview protection | ✅ Good |
| `workers/oando-worker-proxy/src/index.js` | Robots tag + caching | ✅ Excellent |
| `results/stupidgoogle/*.csv` | Google Search Console data | Analyzed |

---

*Report generated from static code analysis and Google Search Console export data. Live crawl testing, Core Web Vitals measurement, and backlink analysis require separate tools.*
