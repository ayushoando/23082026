# 04 — Repo Layout & Git Hygiene

**Rule** (from `scripts/general/check-repo-layout.mjs`): forbidden dirs (`site/results`, `site/test-results`, `site/node_modules`, `site/.cursor`, `.claude`, …), forbidden files (npm/yarn locks, `site/package.json`, `CLAUDE.md`), script sprawl (`tmp-*`, `repush-*`), required roots (`site`, `scripts`, `results`, `docs`, `Agents`, `tech-docs-generator`), no hand-written MD in `results/`.

## Findings

| # | Severity | Finding |
|---|----------|---------|
| 4.1 | Info (positive) | Conformant on every statically verifiable check: required roots present, none of the forbidden dirs/files, no `site/package.json`, no stray root scripts. |
| 4.2 | Med | **Legacy data dir still populated:** `site/data/storage/` holds **43 stale files** (`exports/e_smoke-export_bd40b3.png`, `furniture/f_test-*.json`, 16× `seed_*.json` + SVGs, `projects/p_test-project-*.json`, `p_untitled-plan_*`). Live store is `site/platform/` (`server/Planner/plannerStore.ts:17-21`, `server/Studio/studioStore.ts:18-20`); AGENTS.md explicitly says "site/data/storage/ is legacy — do not write there." `site/data/seed-furniture.json` is a stale duplicate of the live `site/platform/Studio/data/seed-furniture.json` (the one `scripts/seed_furniture_catalog.ts:32-39` and `server/Studio/studioFurnitureSeed.ts:47-54` read). **Gap:** `check-repo-layout.mjs` does not forbid `site/data/`. Stale docs: `tech-docs-generator/src/pages/CodeOrganization.tsx:8,19,29` and `Overview.tsx:105` still describe `data/storage` as the live disk store. |
| 4.3 | High (conditional) | **Untracked-but-imported wave files:** `scripts/site-ui-content-links-audit/wave3-partitions.ts` (919+ lines, imported by `cli.ts:42`, invoked at `cli.ts:244`, tested by `tests/site-ui-content-links-audit/property-w3-partition-isolation-closure.test.ts`) and `wave5-reconcile.ts` (imported by `wave5-handoffs.ts:56`, `wave5-completion-proof.ts:49`, wired at `cli.ts:43-44`, tested at `tests/site-ui-content-links-audit/property-w5r-severity-duplicate-reconciliation.test.ts:42,50`). Both are **load-bearing** — if untracked, fresh clones/CI fail on module resolution. Commit them. |
| 4.4 | Low | TODO/FIXME/HACK in `site/`: only 3, all identical CSS comments — `/* TODO: migrate to Tailwind rounded-full */` in `focss/site/components/homepage/home-base.css:425`, `products/product-viewer.css:117`, `contact/home-contact-teaser.css:357`. Zero in TS/TSX. |
| 4.5 | Trivial | Stray `-` line in `.gitignore:69`. |

## Ignored-but-present (expected, no action)

`.env.local` (gitignored with `!.env.example` carve-out), `results/{test-inventory.json,test-migration-map.json,vercel-prod-deploy.log}`, `.vercel/`, `.commandcode/`, `config/build/tsconfig.tsbuildinfo`. `.gitignore` is thorough.
