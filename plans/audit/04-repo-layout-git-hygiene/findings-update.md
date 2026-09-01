# Updated findings — Repo layout & git hygiene

**Date:** 2026-09-01

## Resolved
- None yet.

## Fixed along the way (discovered during remediation)
- 17 test files importing `plans/planner-comprehensive-audit/*` were repointed to `plans/audit/28-canvas-features-logic/` after that folder relocated; planner test suites re-verified green (67 files / 374 tests).

## Remaining (failures / open items)
- 4.3: the untracked-but-imported wave3/wave5 scripts (`scripts/site-ui-content-links-audit/wave3-partitions.ts`, `wave5-reconcile.ts`) are still untracked — fresh clones/CI still fail on module resolution.
- 4.2: legacy `site/data/storage/` (43 stale files), stale `site/data/seed-furniture.json`, missing `site/data/` prohibition in `check-repo-layout.mjs`, stale tech-docs pages — open, not started.
- 4.4: 3 identical CSS TODO comments (`rounded-full` migration) — open, not started.
- 4.5: stray `-` line in `.gitignore:69` — open, not started.
