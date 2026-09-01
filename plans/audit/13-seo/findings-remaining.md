# Remaining — SEO
**Date:** 2026-09-01

- 13.1 (residual): delete the now-unused deprecated shims `site/lib/helpers/seo.ts` + `site/lib/analytics/seo.ts` (and their name-mirror tests `tests/unit/lib/helpers/seo.test.ts`, `tests/unit/lib/analytics/seo.test.ts`) — **file deletions require user confirmation** (hard rule: no deletions). Shims are marked deprecated and have no app callers.
