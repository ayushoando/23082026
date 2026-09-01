# 21 — `plans/` Folder Audit

**Inventory:** 16 folders + 5 root files. 10 indexed audit folders + 6 unindexed. 13/16 folders have `handover.md`.

## Indexed plans (10) — all claim closed, handovers dated 2026-09-01

| Folder | Status | Assessment |
|---|---|---|
| `seosec/` | ✅ Closed | Fresh; deferred list (SEO-R01–09, SEC-R06–09) partially stale — SEC-R07/R08/R09 since fixed per FIX-LOG #6/8b |
| `ui-audit/` | ✅ Closed (all 33 verified) | Fresh, but claims "showcase scaffolding deleted per owner" — **contradicted by live code** (see below) |
| `packages/` | ✅ Closed | Fresh, internally consistent |
| `ai-audit/` | ✅ Closed | Fresh; blocker CF-TOKEN-01 genuinely open (matches Failures.md) |
| `admin-audit/` | ✅ Closed | Mostly fresh; README still says "/oostudio has NO auth check" — fixed 2026-08-31 (stale residue) |
| `studio-audit/` | ✅ Complete | Fresh — verified: `site/features/Studio/layout.tsx:22` has `requireAuthUser("/oostudio", "admin")` |
| `planner-audit/` | ✅ Closed | Fresh |
| `db-audit/` | ✅ Closed | Fresh with minor drift: README says "44 Products + 20 Admin"; live is 43/21 (64 total still correct) |
| `testing-audit/` | ✅ Closed | Fresh — README predates the Vitest-4 repairs its handover records |
| `worker-audit/` | ⚠️ Closed, 1 owner-gated step pending | Fresh, but README "Issues" still says "No Vectorize binding" — `wrangler.toml:19-21` has `[[vectorize]]` `CATALOG_VECTORS` |

## Unindexed folders (6) — README drift

`client-hub/`, `client-showcase-tabs/`, `documentation-global-standards/`, `operations-deployment-backup-review/`, `planner-comprehensive-audit/`, `site-ui-content-links-audit/` — none indexed in `plans/README.md`. Four are fresh closed plans; only `operations-deployment-backup-review`, `planner-comprehensive-audit`, `site-ui-content-links-audit` have handovers.

- `client-hub/` — flowcharts only, no README/status/handover. Reference artifact, not a plan; per README's own truth order it arguably belongs in `docs/`.
- `client-showcase-tabs/` — tasks.md all 33 `[x]`, "implemented (owner re-approved)". **Implemented per live code**: `site/hooks/useSectorTabs.ts`, 7 components in `site/components/site/clients/`, unit + e2e specs (`clients-showcase-keyboard.spec.ts`, `clients-showcase-layout.spec.ts`), i18n keys at `en.json:938-940`, integrated at `ClientsPageView.tsx:121`. **Missing handover.md.**

## README factual errors (`plans/README.md`)

| Line | Claim | Reality |
|---|---|---|
| 17 | worker-audit "Needs Vectorize binding" | Binding exists in wrangler.toml; only index creation + deploy pending (CF-TOKEN-01) |
| 9 | ui-audit "5 resolved" | All 33 closed |
| 18–19 | References `CONTEXT.md` and `adr/` | **Neither exists** |
| 3 | "active planning coordination" | 13/16 folders are closed handover records |

## Root files

| File | Assessment |
|---|---|
| `FIX-LOG-20260901.md` | **Stalled WIP, highest-value stale artifact.** Pending items #9–11 are demonstrably resolved in live code/tasks (sector-tabs implemented; wave3/wave5 files exist; finalReconciliation tested) but never closed off; its "## Entries" section is empty |
| `PLAN.md` | Current placeholder ("no active plan") — fine |
| `execution-checklist.md` (243 lines) | **Stale, redundant** with the indexed audits' handovers; lists SEC-R07/R08/R09 as pending while FIX-LOG records them fixed |
| `comprehensive-code-review-report.md` | **Orphaned** one-off Kiro review (2026-08-30, B+ 85/100) — the only genuine S2 stray report |
| `README.md` | The stale layer — lags the folders by one full remediation cycle |

## S2_stray_report: 22 — decomposed (matters: report 20 flagged it as vague)

13 × `handover.md` (repo-sanctioned convention, counted by the pattern anyway) + 8 × folder audit reports + 1 × `comprehensive-code-review-report.md` (the only true orphan) = 22, exactly matching the baseline.

## One live contradiction needing owner decision

ui-audit handover says showcase scaffolding was "deleted per owner" → FIX-LOG #9 said "31 of 33 boxes unexecuted" → tasks.md + live code say "implemented, owner re-approved 2026-09-01". **Live code wins** — the feature exists and is integrated. FIX-LOG #9 and the ui-audit claim are both stale.
