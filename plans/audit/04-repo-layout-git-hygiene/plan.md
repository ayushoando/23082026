# Plan — Repo Layout & Git Hygiene

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Make a fresh clone buildable, purge the legacy data directory, and close the layout-checker gap that lets it regrow.

## Actions (prioritized)
1. **High (conditional)** Commit the untracked-but-imported wave files — `scripts/site-ui-content-links-audit/wave3-partitions.ts` (imported by `cli.ts:42,244`, tested by `tests/site-ui-content-links-audit/property-w3-partition-isolation-closure.test.ts`) and `scripts/site-ui-content-links-audit/wave5-reconcile.ts` (imported by `wave5-handoffs.ts:56`, `wave5-completion-proof.ts:49`).
2. **Med** Retire legacy `site/data/storage/` (43 stale files) and the stale duplicate `site/data/seed-furniture.json` (live copy is `site/platform/Studio/data/seed-furniture.json`) — user-confirmed deletion required; extend `scripts/general/check-repo-layout.mjs` to forbid `site/data/`; update stale tech-docs pages `tech-docs-generator/src/pages/CodeOrganization.tsx:8,19,29` and `tech-docs-generator/src/pages/Overview.tsx:105`.
3. **Low** Resolve the 3 identical CSS TODOs (migrate to Tailwind `rounded-full` or drop the comment) — `site/focss/site/components/homepage/home-base.css:425`, `site/focss/site/components/products/product-viewer.css:117`, `site/focss/site/components/contact/home-contact-teaser.css:357`.
4. **Trivial** Remove the stray `-` line in `.gitignore:69`.

## Verification
- `node scripts/general/check-repo-layout.mjs`, `pnpm run typecheck`, `pnpm run test`, `pnpm run gate:fast` — gate runs require owner authorization.
