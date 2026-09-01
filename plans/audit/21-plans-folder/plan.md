# Plan — plans/ Folder Hygiene

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Bring the plans/ index and root artifacts back in sync with what actually happened on disk.

## Actions (prioritized)
1. **High** Resolve the ui-audit contradiction with a recorded owner decision: `plans/ui-audit/handover.md` says scaffolding was "deleted per owner" but live code says implemented (`site/hooks/useSectorTabs.ts`, `site/components/site/clients/`, `site/components/site/ClientsPageView.tsx:121`) — live code wins; close FIX-LOG #9 accordingly.
2. **Med** Correct `plans/README.md`: line 17 (Vectorize binding exists per `workers/oando-worker-proxy/wrangler.toml:19-21`), line 9 (ui-audit 33/33 closed), lines 18–19 (`CONTEXT.md` and `adr/` don't exist), line 3 (13/16 folders are closed handover records).
3. **Med** Close off the stalled `plans/FIX-LOG-20260901.md` pending items #9–11 (sector-tabs implemented; wave3/wave5 files exist; finalReconciliation tested) and remove the redundant stale `plans/execution-checklist.md` — user-confirmed deletion required.
4. **Med** Index the 6 unindexed folders in `plans/README.md` (`client-hub/`, `client-showcase-tabs/`, `documentation-global-standards/`, `operations-deployment-backup-review/`, `planner-comprehensive-audit/`, `site-ui-content-links-audit/`) and add the missing `plans/client-showcase-tabs/handover.md`.
5. **Low** Refresh stale residues: `plans/admin-audit/README.md` (oostudio auth fixed 2026-08-31), `plans/db-audit/README.md` (43/21, not 44/20), `plans/worker-audit/README.md` (Vectorize binding present), `plans/seosec/` deferred list (SEC-R07/R08/R09 fixed per FIX-LOG #6/8b).
6. **Low** Move `plans/comprehensive-code-review-report.md` into `docs/` or delete it — user-confirmed deletion required.

## Verification
- `node scripts/general/check-governance.mjs` — `S2_stray_report` count holds or drops as strays are retired.
