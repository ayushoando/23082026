# Updated findings — 34-runtime-verification

**Date:** 2026-09-01

## Resolved
- scan:secrets: verified clean 2026-09-01 — exit 0, sole stdout line "No likely secrets found." (`node scripts/general/scan_secrets.mjs`).
- typecheck: verified green 2026-09-01 — exit 0; route types regenerated + `tsc -p site/tsconfig.json --noEmit` with no diagnostics (covers site/ only; `typecheck:tests` not run).
- two-lane test: executed 2026-09-01 — RED at run time (default lane 17/731 test files, 5/4138 tests failed; orchestrator skipped the tech-docs lane, so it was never evaluated).

## Fixed along the way (discovered during remediation)
- Import-path causes of the failing files were repaired after the run — the planner-comprehensive-audit module relocation (see 27's findings-update: 17 test import paths + 9 in-module path literals updated, initialInventory repo-root depth corrected) with planner suites re-verified green (67 files / 374 tests). A full-lane re-run has not yet confirmed all-green.

## Remaining (failures / open items)
- Full-lane test re-run: pending — must confirm both lanes green after the import-path repairs, and will also settle the non-import-path causes observed at run time (missing `@vitest-environment node` pragma in `staticAdminToken.test.ts`; clients page empty render).
- gate:fast: not run — pending until the two-lane test is green (`check:docs-all` → `check-root-markdown-links` was already demonstrated failing at run time).
