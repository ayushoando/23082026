---
inclusion: fileMatch
fileMatchPattern: "site/lib/seo/**,site/lib/analytics/**,site/app/**/robots*,site/app/**/sitemap*,site/lib/helpers/seo*,**/routeMetadata*"
---

# SEO Domain

## Stack
- `site/lib/seo/indexnow.ts` — IndexNow push on content changes
- `site/app/robots.ts` — dynamic robots.txt
- `site/app/sitemap.ts` — dynamic XML sitemap
- `site/lib/analytics/` — tracking and analytics integration
- Route metadata: `site/features/site/data/routeMetadata*`
- Vercel Analytics + Speed Insights for Core Web Vitals

## Conventions
- Every public route must have metadata (title, description, canonical, OG image).
- `robots.ts` must not block indexable pages; keep `Disallow` minimal.
- Sitemap must include all marketing + product pages with `lastmod`.
- Use `next-intl` for hreflang alternate links on i18n pages.
- No client-side-only rendering for SEO-critical content — use Server Components.

## Checks (user-invoked only)
For an explicit SEO validation request, run the applicable checks; do not run tests or gates automatically.
```
pnpm run test:priority-8
pnpm run check:site-ui
```

## Audit checklist
- [ ] All pages render meaningful content at SSR (view-source check)
- [ ] Canonical URLs resolve without redirect chains
- [ ] Structured data (JSON-LD) present on product pages
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms

## Browser-layer integration
Use Nova Act to verify rendered meta tags and OG images at each viewport width only for an explicit browser-check request.

## Graph-layer integration
Inspect imports and dependents directly from the live source tree before optional validation.
