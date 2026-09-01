# Remaining — 20-scripts-governance
**Date:** 2026-09-01
- 20.1: open — both nonzero ratchets remain live debt (P4_migration_no_rollback: 8; S2_stray_report: 22). Note: report 24 observed all supabase migrations already carry `-- rollback` (stale baseline), but the baseline has not been re-recorded.
- 20.2: open — `check-governance.mjs --update` can still silently launder a count increase into the baseline (no confirm guard added).
- Orphan one-offs: open — ~18 zero-reference scripts confirmed by report 26's triage (corroborated by report 30's single-touch git history); deletion awaits user confirmation; unregistered one-offs still not registered in `run-ops.mjs`/`ops-command-registry.mjs`.
- Prioritized recommendations 1–14: open — none actioned (wave3/wave5 commit, sanitizeSvg wiring, scan:secrets in gate:fast, site/data/storage retirement, Planner.tsx split, migration/stray-report cleanup, etc.).
