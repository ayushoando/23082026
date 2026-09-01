# Plan — SEO

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Fix the four minor SEO gaps (re-export drift, silent sitemap degradation, non-standard robots field, cosmetic titles) while keeping the test-enforced SEO contract intact.

## Actions (prioritized)
1. **Low** Collapse the triple re-export chain `site/features/site/data/seo.ts` → `site/lib/helpers/seo.ts:1-13` → `site/lib/analytics/seo.ts:1-20` — pick one canonical module and migrate all callers.
2. **Low** Log the swallowed catalog-fetch failure in `site/app/sitemap.ts:97-99` (sitemap silently degrades to static-only).
3. **Low** Remove the non-standard Yandex-only `host` emission from `site/app/robots.ts:19` (or move it behind a documented user-agent rule).
4. **Low** Add page-level titles to the workspace routes that inherit generic "Planner"/"Studio" — `site/app/ooplanner/projects/page.tsx:3`, `site/app/ooplanner/projects/[id]/page.tsx`, `site/app/oostudio/page.tsx` (all noindex, so cosmetic).

## Verification
- `pnpm run test` (includes `tests/unit/features/site/data/seoStandardsAudit.test.ts`), `pnpm run typecheck`, `pnpm run gate:fast` — gate runs require owner authorization.
