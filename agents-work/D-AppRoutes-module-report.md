# D-AppRoutes — exhaustive module review

- **Frozen input:** fdef1ba7106328ecf43e7a3232dd4bd9859b97be
- **Partition:** 174 inputs (171 read-full + 2 binary-validated + 1 failed; site/app and the seven explicitly listed site root files)
- **Reviewer:** FreshRoutesRoot
- **Read policy:** Every text/code/config input was decoded from the exact on-disk path. Two image inputs were validated by PNG signature, dimensions, non-zero byte count, and SHA-256; one image failed extension/header consistency and is recorded below.

## Strengths

The App Router has explicit public/member/admin boundaries, route-local error and loading surfaces, and a centralized proxy (`site/proxy.ts`) that handles canonical redirects, maintenance read-only enforcement, security headers with dynamic CSP nonces, and fast session-cookie gating. Planner (`site/app/ooplanner`) and Studio (`site/app/oostudio`) route handlers delegate to their respective request/auth pipelines rather than duplicating policy.

The review also re-grounded the prior route leads. The former matcher concern is unsupported because the API wildcard is an explicit matcher entry; the dev auth-bypass status handler returns 404 in production; and the root layout avoids dynamic headers/cookies leakage. Those leads are confirmed benign.

## Findings

### A1 · P2 · Repair the favicon container/header mismatch
**Path:** site/app/(site)/favicon.ico (binary; 1,991 bytes; SHA-256 7fe61366b4282d1515ee4a62ce70557f13686fc5034df8cb79068b55dca16f04)
**Impact:** The exact file begins with the PNG signature 89 50 4e 47 (IHDR 32x32), but its .ico extension requires an ICO container header 00 00 01 00 for deterministic asset validation. Consumers and decoders that select an ICO parser based strictly on file extension can reject this favicon.
**Fix:** Replace the file with a valid multi-resolution ICO container (or rename it to .png and update the route metadata reference); then revalidate the extension/header pair.

## Six-month advisor guidance

1. Keep the explicit API wildcard matcher in site/proxy.ts and retain handler-level authorization as the primary security boundary when adding routes.
2. Preserve the host-gated development bypass and production 404 posture for diagnostic endpoints.
3. When adding route groups, add their loading/error/accessibility states together and update the route contract inventory in the same change.

## Binary validation evidence

- site/app/(site)/favicon.ico — **failed**: 1,991 bytes, SHA-256 7fe61366b4282d1515ee4a62ce70557f13686fc5034df8cb79068b55dca16f04; PNG signature 89 50 4e 47 does not match the required ICO header 00 00 01 00.
- site/app/(site)/icon.png — **binary-validated**: PNG 32x32, 743 bytes, SHA-256 26ce1555cdcd2422f6e57b445b50b2e96e04dab7c106b2be0ad1359675c6730d.
- site/app/icon.png — **binary-validated**: PNG 512x512, 29,873 bytes, SHA-256 b7638400603a9d77b47f57a0f2e61d4ed71e77443cfebcabd934ffde79f153b6.

## Verdict

- **overall_correctness:** incorrect
- **explanation:** All 174 owned inputs were inspected; 171 text inputs were read-full, two images were binary-validated, and favicon.ico failed the required extension/header consistency check. The remaining route review found no additional retained defect.
- **confidence:** 0.98

## Appendix A — per-input evidence

Columns are machine-checkable: path, one status (read-full, binary-validated, or failed), module, reviewer, and finding IDs.

| path | status | module | reviewer | finding_ids |
|---|---|---|---|---|
| site/app/(site)/about/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/access/AccessForm.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/access/AccessSignInView.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/access/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/career/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/choose-product/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/compare/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/contact/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/dashboard/layout.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/dashboard/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/downloads/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/error.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/faq/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/favicon.ico | failed | app/site | FreshRoutesRoot | A1 |
| site/app/(site)/globals.css | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/icon.png | binary-validated | app/site | FreshRoutesRoot | none |
| site/app/(site)/layout.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/loading.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/login/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/not-found.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/opengraph-image.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/planner/features/[slug]/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/planner/features/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/planner/help/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/planner/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/planning/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/portal/[id]/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/portal/guest/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/portal/guest/view/[id]/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/portal/layout.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/portal/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/portfolio/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/privacy/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/products/[category]/[product]/layout.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/products/[category]/[product]/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/products/[category]/loading.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/products/[category]/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/products/category/[slug]/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/products/error.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/products/layout.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/products/loading.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/products/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/providers/QueryProvider.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/quote-cart/layout.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/quote-cart/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/refund-and-return-policy/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/service/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/showrooms/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/sitemap/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/solutions/[category]/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/solutions/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/sustainability/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/terms/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/tools/meeting-room-capacity-calculator/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/tools/office-space-calculator/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/trusted-by/page.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/(site)/twitter-image.tsx | read-full | app/site | FreshRoutesRoot | none |
| site/app/.well-known/api-catalog/route.ts | read-full | site/app | FreshRoutesRoot | none |
| site/app/.well-known/security.txt/route.ts | read-full | site/app | FreshRoutesRoot | none |
| site/app/admin/analytics/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/catalog/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/crm/clients/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/crm/layout.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/crm/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/crm/projects/[id]/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/crm/projects/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/crm/quotes/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/customer-queries/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/design-kit/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/error.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/features/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/inventory/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/layout.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/planner-catalog/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/plans/[id]/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/plans/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/price-books/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/settings/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/themes/ThemeEditor.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/themes/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/admin/workspace-catalog/page.tsx | read-full | app/admin | FreshRoutesRoot | none |
| site/app/api-docs/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/Planner/ai-advisor/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/Planner/catalog/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/Planner/catalog/upload/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/Planner/handoff/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/Planner/projects/[id]/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/Planner/projects/plannerProjectEndpoint.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/Planner/projects/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/Planner/sketch-to-plan/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/Studio/ai/generate/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/Studio/ai/restyle/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/Studio/ai/suggest/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/Studio/furniture/[id]/publish/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/Studio/furniture/[id]/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/Studio/furniture/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/Studio/furniture/upload/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/_lib/exportsStore.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/_lib/gitUser.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/_lib/public.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/admin/_lib/server.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/admin/analytics/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/admin/catalogs/[type]/[id]/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/admin/catalogs/[type]/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/admin/features/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/admin/indexnow/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/admin/plans/[id]/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/admin/plans/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/admin/price-books/[bookId]/action/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/admin/price-books/[bookId]/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/admin/price-books/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/admin/themes/publish/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/admin/themes/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/ai-advisor/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/audit/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/business-stats/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/categories/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/configurator/smart-wizard/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/csrf/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/customer-queries/manage/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/customer-queries/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/dev-tools/lighthouse/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/dev/auth-bypass-status/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/exports/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/features/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/files/_lib/diskFileAccess.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/files/catalog/[...path]/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/files/exports/[filename]/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/files/furniture/[filename]/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/files/projects/[filename]/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/files/uploads/[filename]/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/filter/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/generate-alt/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/git-user/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/health/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/log-error/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/metrics/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/nav-categories/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/nav-search/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/plans/[id]/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/plans/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/products/filter/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/products/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/theme/active/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/theme/manage/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/api/tracking/route.ts | read-full | app/api | FreshRoutesRoot | none |
| site/app/global-error.tsx | read-full | site/app | FreshRoutesRoot | none |
| site/app/icon.png | binary-validated | site/app | FreshRoutesRoot | none |
| site/app/layout.tsx | read-full | site/app | FreshRoutesRoot | none |
| site/app/not-found.tsx | read-full | site/app | FreshRoutesRoot | none |
| site/app/offline/ReloadButton.tsx | read-full | app/offline | FreshRoutesRoot | none |
| site/app/offline/layout.tsx | read-full | app/offline | FreshRoutesRoot | none |
| site/app/offline/page.tsx | read-full | app/offline | FreshRoutesRoot | none |
| site/app/ooplanner/error.tsx | read-full | app/ooplanner | FreshRoutesRoot | none |
| site/app/ooplanner/layout.tsx | read-full | app/ooplanner | FreshRoutesRoot | none |
| site/app/ooplanner/page.tsx | read-full | app/ooplanner | FreshRoutesRoot | none |
| site/app/ooplanner/projects/[id]/page.tsx | read-full | app/ooplanner | FreshRoutesRoot | none |
| site/app/ooplanner/projects/page.tsx | read-full | app/ooplanner | FreshRoutesRoot | none |
| site/app/oostudio/error.tsx | read-full | app/oostudio | FreshRoutesRoot | none |
| site/app/oostudio/layout.tsx | read-full | app/oostudio | FreshRoutesRoot | none |
| site/app/oostudio/page.tsx | read-full | app/oostudio | FreshRoutesRoot | none |
| site/app/openapi.json/route.ts | read-full | site/app | FreshRoutesRoot | none |
| site/app/robots.ts | read-full | site/app | FreshRoutesRoot | none |
| site/app/security.txt/route.ts | read-full | site/app | FreshRoutesRoot | none |
| site/app/sitemap.ts | read-full | site/app | FreshRoutesRoot | none |
| site/instrumentation.ts | read-full | app/config | FreshRoutesRoot | none |
| site/next-env.d.ts | read-full | app/config | FreshRoutesRoot | none |
| site/next.config.js | read-full | app/config | FreshRoutesRoot | none |
| site/postcss.config.mjs | read-full | app/config | FreshRoutesRoot | none |
| site/proxy.ts | read-full | app/config | FreshRoutesRoot | none |
| site/tsconfig.json | read-full | app/config | FreshRoutesRoot | none |
