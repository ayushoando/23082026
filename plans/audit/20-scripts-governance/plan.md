# Plan — Scripts, Governance & Prioritized Remediation

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Make the repo build from a clean clone, retire the two nonzero ratchets, and lock in the prioritized remediation list.

## Actions (prioritized)
1. **High** Commit the load-bearing untracked files `scripts/site-ui-content-links-audit/wave3-partitions.ts` + `scripts/site-ui-content-links-audit/wave5-reconcile.ts` — the repo doesn't build from a clean clone without them.
2. **Med** Add `-- rollback` markers to the 8 migrations counted by `P4_migration_no_rollback` under `site/platform/supabase/migrations{,.admin}/` (report 24: all 64 already carry the marker — then re-record the baseline).
3. **Med** Triage the 22 `S2_stray_report` hits in `plans/` (13 sanctioned `handover.md` + 8 folder reports + the true orphan `plans/comprehensive-code-review-report.md` — user-confirmed deletion required for that one).
4. **Med** Wire `sanitizeSvg` into the Studio furniture upload path (report 08) and add `scan:secrets` to `release:gate:fast` (report 09).
5. **Med** Retire legacy `site/data/storage/` (zero code references per report 24) — user-confirmed deletion required; forbid it in `scripts/general/check-repo-layout.mjs` and fix the stale tech-docs pages.
6. **Med** Register the unregistered one-offs in `scripts/` root (e.g. `delete-twin-images.mjs`, `planner-lift-project-trees.mjs`, `ui-polish-pass1-audit.mjs`) into `scripts/run-ops.mjs`/`ops-command-registry.mjs` or mark them disposable.
7. **Low** Put a confirm guard on `scripts/general/check-governance.mjs --update` so one command cannot silently launder a count increase into `config/quality/governance-baseline.json`.

## Verification
- `git status --short` — wave3/wave5 tracked (closes High #1).
- `pnpm run gate:fast` — governance + focss + hollow-test gates; owner authorization required.
- `node scripts/general/check-governance.mjs` — ratchets hold or drop.
