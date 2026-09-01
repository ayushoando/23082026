# Updated findings — 30-git-history-orphans

**Date:** 2026-09-01

## Resolved
- Evidence collected 2026-09-01: verdict — all 20 suspected-orphan scripts share a single-touch history (created in the 2026-08-23 "Initial import" commit `9c82fec`, untouched through 119 subsequent commits across a 9-day-old history), consistent with the orphan hypothesis but certified only as "safe-to-delete-candidate pending a reference/usage check"; the wave3-partitions.ts / wave5-reconcile.ts "untracked-but-imported" risk is closed (both tracked, clean in `git status`, last modified 2026-09-01 — closes the conditional High #1 of report 01); `specs/` is active (all 9 files last touched 2026-08-31, no staleness concern).

## Fixed along the way (discovered during remediation)
- none (read-only git evidence pass; no files modified)

## Remaining (failures / open items)
- Reference/usage check: still required before any deletion of the 20 candidates (out of scope at fast depth).
- User confirmation: deletion of the ~18–20 zero-reference scripts (reports 20/26 triage) still needs owner confirmation; `configure-cf-security-txt.ps1` may encode Cloudflare config not reproducible from code — check before deleting.
- Evidence caveat: 9-day-old squashed history cannot by itself prove orphan status; last-touch dating only corroborates (freshness distinguishes nothing here since every file shares the import commit).
