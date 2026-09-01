# Resolved — Repo layout & git hygiene
**Date:** 2026-09-01

- (Earlier, along the way) 17 test files importing `plans/planner-comprehensive-audit/*` were repointed to `plans/audit/28-canvas-features-logic/` after that folder relocated; planner test suites re-verified green (67 files / 374 tests).
- **4.3 — resolved-stale.** `wave3-partitions.ts` and `wave5-reconcile.ts` are already tracked: `git ls-files scripts/site-ui-content-links-audit/` lists both; `git status --porcelain` for that dir is empty; `git log --oneline -2 -- <both files>` shows them committed in `e273f2d feat(tests): enhance coverage...`. No staging needed.
- **4.4 — fixed.** Dropped the 3 identical `/* TODO: migrate to Tailwind rounded-full */` comments (kept `border-radius: 9999px;` — value unchanged) in `site/focss/site/components/homepage/home-base.css:425`, `products/product-viewer.css:117`, `contact/home-contact-teaser.css:357`. Verified: `grep TODO|FIXME|HACK` over `site/` ts/tsx/css/js/mjs → 0 matches.
- **4.5 — fixed.** Removed stray `-` line at `.gitignore:69` (between `workers/**/.wrangler/` and `# Python cache`).
- **4.2 (docs part) — fixed.** Stale tech-docs pages updated to the live `site/platform/` store (verified `site/server/Planner/plannerStore.ts:17-21` and `site/server/Studio/studioStore.ts:16-20` both resolve `site/platform/...`): `tech-docs-generator/src/pages/CodeOrganization.tsx:8` (dropped `data/storage` from `site/` desc), `:19` (entry now `site/platform/` — live disk store), `:29` (planner tree now `platform/`), `tech-docs-generator/src/pages/Overview.tsx:105` (disk store now `site/platform`, legacy dir marked retired).
- Verification: `node scripts/general/check-repo-layout.mjs` → `check-repo-layout OK — required workspace present; no nested installs or wrong locks`.
