# Remaining — 20-scripts-governance
**Date:** 2026-09-01 (post-remediation)

- **S2 final stray:** `plans/audit/comprehensive-code-review-report.md` (now the only in-scope hit; baseline locked at 1). Deletion is user-confirmation-gated — not done here.
- **`site/data/storage` retirement (plan #5 core):** dir still exists (zero code refs verified via `git grep "data/storage"` — only docs/audit notes reference it). Physical deletion awaits user confirmation. The `check-repo-layout.mjs` FORBIDDEN_DIRS entry must be added **at deletion time** — adding it now would fail every gate run while the dir exists. (Overview.tsx "is retired" wording stays physically premature until then.)
- **Rec #2 sanitizeSvg wiring (Studio furniture upload):** not actioned — target files are `site/components|lib/Studio*` (agent B's area, hands-off per session rules).
- **Zero-wired one-off scripts (12, re-triaged):** now registered as ops commands instead of deleted; physical deletion of any of them still awaits user confirmation.
- **Recs #5–#9, #11–#14** (worker VERCEL_ORIGIN/slug tables, Planner.tsx split, route error.tsx, redirect overrides/images, bundle diet, i18n workspace strings, dead code removal, env contract, routes doc): out of this remediation's file scope — they belong to audit areas 02/03/05/08/12/15/17/19, owned by other agents/central. Not touched.
- Oxlint `scripts/` warnings (5 warnings, 4 files — surfaced by the 2026-09-02 `run-oxlint` sweep): **resolved 2026-09-02** — see findings-resolved.md (`oxlint scripts` now prints 0 warnings / 0 errors). Nothing remains for that sweep.
- **Note (no action):** S2 scans one level deep only; 20 report-like `.md` files physically exist deeper under `plans/audit/**` (13 sanctioned handovers + 6 folder reports + the orphan above). Not counted by the rule; listed for triage awareness.
