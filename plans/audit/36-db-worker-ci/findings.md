# 36 — DB, Worker Token & CI Gate — Observed Run

**Recorded:** 2026-09-01 (owner-authorized session; read-only + dry-run scope only). **Plan:** [plan.md](./plan.md).

Context read, not duplicated here: `plans/audit/worker-audit/handover.md` (CF-TOKEN-01 blocker + pending owner steps), `plans/audit/24-platform-database/findings.md` (schema inventory, two-DB discipline), `OPERATIONS_RUNBOOK.md` §0–2 (deploy order, DB ref table, dry-run-first rule).

Script-name check requested by the task: `pnpm run db:test` **is** a real script — `package.json:90` (`"db:test": "node scripts/run-ops.mjs db:test"`), alongside `db:apply` (`:88`) and `db:apply:admin` (`:89`).

## Commands observed

Exit codes as reported by the session shell runner; non-zero exits are annotated explicitly there, and none were. All evidence lines are verbatim output.

| Command (cwd) | Exit | Actual evidence lines |
|---|---|---|
| `pnpm run db:test` (root, 600s timeout) | 0 | `Starting dual-database connection check (Products + Planner/Auth)...` · `✅ Products: connection established.` · `Products tables present: catalog_categories, catalog_products, configurator_products, planner_managed_products, svg_revision_artifacts, svg_revisions` · `✅ Products catalog_products=143` · `✅ Planner/Auth: connection established.` · `Planner/Auth tables present: audit_events, oando_plans` · `✅ oando_plans reachable (2 rows)` · `✅ Supabase HTTP env vars present (URL + service role + anon).` · `✅ Admin Supabase HTTP env vars present.` |
| `pnpm run db:apply -- --dry` (root) | 0 | `Target: products` · `Migrations to apply:` · `  (none — all up to date)` |
| `pnpm run db:apply:admin -- --dry` (root) | 0 | `Target: admin` · `Migrations to apply:` · `  - 20260901120000_user_history_owner_rls.sql` |
| `npx wrangler vectorize list` (`workers/oando-worker-proxy`, 60s timeout) | 0 | `⛅️ wrangler 4.127.1` · `📋 Listing Vectorize indexes...` · `│ catalog-nav │ 768        │ cosine │             │ 2026-09-01T03:25:03.683898Z │ 2026-09-01T03:25:03.683898Z │` |
| `gh run list --limit 10` (root) | 0 | See §CI runs observed for the verbatim table |
| `gh run view 33527825017 --json jobs` (root) | 0 | `{"conclusion":"failure","name":"gate-full","steps":["Run pnpm run release:gate:core"]}` · shards 1–4/4 `"conclusion":"cancelled"` (each failing at `Run actions/upload-artifact@v4`) · `"conclusion":"failure","name":"browser-report"` · `"conclusion":"skipped","name":"gate-fast"` |

Both `db:apply` dry-runs also printed an informational Postgres notice (not an error; the script's idempotent history-table bootstrap):

```
severity: 'NOTICE', code: '42P07',
message: 'relation "_local_migration_history" already exists, skipping'
```

## DB state

Nothing was applied — dry-runs and read-only checks only, per `OPERATIONS_RUNBOOK.md:37-44` (dry-run first) and the session authorization.

- **Products DB** (`erpweaiypimorcunaimz`, per `OPERATIONS_RUNBOOK.md:24`): **reachable.** 6 tables verified present (`catalog_categories`, `catalog_products`, `configurator_products`, `planner_managed_products`, `svg_revision_artifacts`, `svg_revisions`). Row count printed for one table: **`catalog_products=143`**. **0 pending migrations** (`db:apply -- --dry`: "none — all up to date").
- **Admin / Planner-Auth DB** (`rxzpznmxbaoxpikowmfc`, per `OPERATIONS_RUNBOOK.md:25`): **reachable.** Tables verified present: `audit_events`, `oando_plans` (`oando_plans` = 2 rows). **1 pending migration: `20260901120000_user_history_owner_rls.sql`** — apply is an owner action (this session may not run `db:apply` without `--dry`).
- Supabase HTTP env vars (URL + service role + anon) confirmed present for both projects, so the failure mode is not missing credentials.

## Worker token status

**CF-TOKEN-01 is resolved** (was: `npx wrangler vectorize list` → `Invalid access token [code: 9109]`, per `plans/audit/worker-audit/handover.md:13`).

- The same command now **succeeds** (wrangler 4.127.1) and lists exactly one index: `catalog-nav`, dimensions **768**, metric **cosine**, created `2026-09-01T03:25:03.683898Z`.
- The index therefore already exists — the handover's blocker-remedy step 1 (`wrangler vectorize create catalog-nav --dimensions 768 --metric cosine`, `handover.md:14`) is already satisfied. **This session did not create it and did not deploy.**
- Remaining worker-audit step is still owner-gated: `pnpm run worker:deploy` + the runbook smoke verification (`OPERATIONS_RUNBOOK.md:58`: dead asset → `200 image/png` with `x-oando-proxy: r2-fallback`; valid asset → `x-oando-proxy: r2`).

## CI runs observed

`gh` CLI is **available and authed**. `gh run list --limit 10` (all on `main`; verbatim):

```
completed	failure	Add audit findings for dependency CVE and currency review	Site UI gate	main	push	33538117547	1m12s	2026-09-01T17:29:58Z
in_progress		Add audit findings for dependency CVE and currency review	Release gate	main	push	33538117473	15m38s	2026-09-01T17:29:58Z
completed	failure	Add audit findings for dependency CVE and currency review	Tech docs gate	main	push	33538117468	3m58s	2026-09-01T17:29:58Z
completed	failure	feat(audit): Add comprehensive audits for component performance, Type…	Tech docs gate	main	push	33527825035	3m43s	2026-09-01T15:46:48Z
completed	failure	feat(audit): Add comprehensive audits for component performance, Type…	Site UI gate	main	push	33527825022	52s	2026-09-01T15:46:48Z
completed	failure	feat(audit): Add comprehensive audits for component performance, Type…	Release gate	main	push	33527825017	1h1m57s	2026-09-01T15:46:48Z
completed	failure	Refactor tech-docs-generator scripts to use generated-documents direc…	Tech docs gate	main	push	33511631751	3m44s	2026-09-01T13:08:41Z
completed	failure	Refactor tech-docs-generator scripts to use generated-documents direc…	Release gate	main	push	33511631603	1h1m30s	2026-09-01T13:08:41Z
completed	failure	Refactor tech-docs-generator scripts to use generated-documents direc…	Site UI gate	main	push	33511631544	48s	2026-09-01T13:08:41Z
completed	success	Supabase backup to R2	Supabase backup to R2	main	schedule	33484095981	1m8s	2026-09-01T07:50:42Z
```

**Conclusion for release-gate.yml ("Release gate"): red on main.** Of the last three pushes, the two completed Release gate runs **failed** (`33511631603`, `33527825017`) and the newest (`33538117473`, 17:29:58Z) was still `in_progress` at observation time. For run `33527825017`, `gh run view --json jobs` shows the failure is in job **`gate-full` at step `Run pnpm run release:gate:core`**; the four browser-matrix shards and `browser-report` show `cancelled`/`failure` as downstream effects, and `gate-fast` was skipped. Root cause of the `release:gate:core` failure was not diagnosed here (logs not pulled — outside this pass's scope; see plan.md action 1).

## Not run + why

| Not run | Why |
|---|---|
| `pnpm run db:apply` (real, Products) | Pointless — dry-run shows 0 pending — and applies are forbidden this session ("NEVER run db:apply without --dry"). |
| `pnpm run db:apply:admin` (real) | **Forbidden**: session authorization allows only `--dry`; the pending `20260901120000_user_history_owner_rls.sql` is an owner action (plan.md action 2). |
| `npx wrangler vectorize create catalog-nav …` | Explicitly forbidden ("Do NOT create the index") — and redundant: the index already exists (created 2026-09-01T03:25:03Z). |
| `pnpm run worker:deploy` | Explicitly forbidden ("NEVER deploy") and owner-gated per `handover.md` pending step 2. |
| Runbook smoke checks (dead/valid asset paths) | They verify a *deployed* worker; the new binding is undeployed, so the checks cannot pass yet. Left to the post-deploy step in `handover.md:21`. |
| `gh run view --log` / failure diagnosis of `release:gate:core` | Out of scope for this observation pass (task asked for run conclusions only); logged as plan.md action 1. |
| `pnpm run db:types` / `db:types:admin` | Not requested. Note: `plans/audit/24-platform-database/findings.md:21` (24.6) expects a Products type regen once the `svg_*_v2` tables are confirmed live — they appear in the live table list above, which strengthens 24.6. |

## Verdict

- **DB layer: healthy and connected.** Both DBs reachable with correct env vars; Products fully migrated (0 pending, `catalog_products=143`); Admin has exactly **1 pending migration** awaiting the owner's `pnpm run db:apply:admin` (no `--dry`).
- **Worker: CF-TOKEN-01 resolved.** Token valid, `catalog-nav` (768/cosine) already exists — the only remaining item from the worker audit is the owner-gated `pnpm run worker:deploy` + runbook smoke verification. No new blocker found.
- **CI: release-gate.yml is a failing gate on main** — 2 of the last 3 pushes ended in Release gate failure at `pnpm run release:gate:core` (third still in progress). Do not treat `main` as green until the plan below lands.

Observed results require remediation (pending Admin migration, undeployed worker binding, red release gate) → **plan.md added** (not "no plan needed").
