# 3-Agent Comprehensive Script Inventory & Rationalization Audit

**Date:** 2026-09-04  
**Audit Target:** All 264 scripts across `scripts/`, `scripts/general/`, `scripts/AsNeeded/`, `scripts/operations-review/`, `scripts/site-ui-content-links-audit/`, and `tech-docs-generator/scripts/`  
**Evaluation Model:** 3-Sub-Agent Domain Pass (Infrastructure, CI/Governance, Specialized Subsystems)  
**Classification Floor:** Eliminate dead, obsolete, duplicate, and ghost code; harden core engines.

---

## Executive Summary & Metrics

```
Total Scripts Evaluated: 264
├── Candidate for Immediate Removal: 94 files (35.6%)
│   ├── Dead Recovery & Asset Cutover Artifacts: 14 files
│   ├── One-Off Plan & Doc Migration Scripts: 11 files
│   ├── Abandoned Operations-Review Framework: 9 files
│   ├── Abandoned Site-UI Wave Audit Subsystem: 26 files
│   ├── Tech-Docs Micro-Extractors & Orphan Generators: 18 files
│   └── Redundant / Ad-Hoc Database & Infra Scripts: 16 files
└── Retain & Improve: 170 files (64.4%)
    ├── Core Database & Seeding Engines
    ├── Release Gate & Fast Loop Lint / Type Guards
    └── R2 Backup Retention & Cloud Sync
```

---

## 3-Sub-Agent Domain Breakdown

### Domain 1: Infrastructure, Operations, Database & Asset Scripts
- **Auditor:** Agent 1 (Infrastructure & Storage)
- **Scope:** `scripts/*.ts`, `scripts/*.mjs`, `scripts/*.py`, `scripts/lib/*`
- **Findings:** A heavy layer of code remains from earlier local disk recovery phases (drives E: and D:) and raster cutovers (SVG → PNG). Multiple scripts target directories that no longer exist on disk (e.g. `site/public/assets/others/legacy/recovery/`), while raw SQL and dangerous bucket-destruction scripts (`deleteR2Bucket.ts`) pose unnecessary operational risk.

### Domain 2: CI/CD, Gates, Governance & Environment Guardrails
- **Auditor:** Agent 2 (CI/CD & Governance)
- **Scope:** `scripts/general/*`, `scripts/AsNeeded/*`, `scripts/run-ops.mjs`
- **Findings:** Multiple throwaway Python scripts from August 2026 (`rename-plans.py`, `update-plans.py`, `move-checklist.py`) performed one-off file edits and were never removed. Duplicate plan verifiers exist alongside canonical TypeScript/Node checkers (`check-plans-purity.mjs`). `audit-repo-state.py` attempts to read files from paths that do not exist.

### Domain 3: Specialized Audit Subsystems & Tech-Docs Engine
- **Auditor:** Agent 3 (Subsystems & Generators)
- **Scope:** `scripts/site-ui-content-links-audit/*`, `scripts/operations-review/*`, `tech-docs-generator/scripts/*`
- **Findings:** Two massive ghost frameworks exist:
  1. `scripts/site-ui-content-links-audit/` (26 files): An over-architected multi-wave audit crawler from August 31 that is never run by any build or CI gate.
  2. `scripts/operations-review/` (9 files): An incident review framework whose own entrypoint admits it was never integrated into `package.json`.
  3. `tech-docs-generator/scripts/generate-page-component-graph.mjs`: Generates a 25KB Mermaid graph that is completely orphaned and never rendered by `App.tsx`.

---

# List 1: Scripts to Remove (Name, Use, Why to Remove)

### A. Dead Recovery & Migration Scripts (Phase A/B/Cutover Leftovers)

| Script Name | Purpose / Claimed Use | Exact Reason to Remove |
| :--- | :--- | :--- |
| [`scripts/merge-recovery-into-majors.mjs`](file:///d:/23082026/scripts/merge-recovery-into-majors.mjs) | Merges recovered media from disk drives E: and D: into major asset folders. | **1,376 lines of dead code.** Hardcodes source path `site/public/assets/others/legacy/recovery/`, which does not exist on disk (`Test-Path` returns `False`). |
| [`scripts/five-majors-hash-dedup.mjs`](file:///d:/23082026/scripts/five-majors-hash-dedup.mjs) | Hash-deduplicates asset trees against legacy recovery directory. | **945 lines of dead code.** Targets the non-existent `others/legacy/recovery` path and non-existent `results/asset-cutover/`. |
| [`scripts/lib/recoveryClassify.mjs`](file:///d:/23082026/scripts/lib/recoveryClassify.mjs) | Media classification classifier helper. | Only imported by `five-majors-hash-dedup.mjs` and `merge-recovery-into-majors.mjs`. 26KB of dead helper code. |
| [`scripts/planner-lift-project-trees.mjs`](file:///d:/23082026/scripts/planner-lift-project-trees.mjs) | Lifts old `project/<tree>/` code into `features/planner/`. | **Obsolete one-time refactoring tool.** Targets `site/features/planner/project` (doesn't exist) and `site/tests/` (all tests were moved to root `tests/`). Crashes if run. |
| [`scripts/apply-db-image-path-rewrite.mjs`](file:///d:/23082026/scripts/apply-db-image-path-rewrite.mjs) | Mutates database to rewrite old image path URLs to new schema. | Cutover is complete; paths in production are already migrated. Keeping raw SQL rewrite scripts with live DB write access is an active risk. |
| [`scripts/reverse-asset-paths.mjs`](file:///d:/23082026/scripts/reverse-asset-paths.mjs) | Reverses image path rewrites back to legacy paths. | Rollback script for a migration that was completed weeks ago. Has no legitimate use. |
| [`scripts/fix-asset-paths.mjs`](file:///d:/23082026/scripts/fix-asset-paths.mjs) | Rewrites static code paths from `results/asset-cutover/path-map.generated.json`. | Relies on deleted cutover artifacts. Code imports are already updated. |
| [`scripts/lib/assetPathMapTools.mjs`](file:///d:/23082026/scripts/lib/assetPathMapTools.mjs) | Common helper for image path rewriting. | Solely imported by `fix-asset-paths.mjs` and `apply-db-image-path-rewrite.mjs`. |
| [`scripts/migrate-svg-catalog-to-png.mjs`](file:///d:/23082026/scripts/migrate-svg-catalog-to-png.mjs) | Migrates SVG furniture assets to raster PNGs. | One-off migration script from Phase B. The PNG assets are already live in Cloudflare R2 and Supabase. |
| [`scripts/pushSvgCatalogToDb.ts`](file:///d:/23082026/scripts/pushSvgCatalogToDb.ts) | Pushes SVG files directly into database tables. | Replaced by canonical `seed_furniture_catalog.ts` and `seed-block-descriptors.ts`. |
| [`scripts/verify-png-release.mjs`](file:///d:/23082026/scripts/verify-png-release.mjs) | Verifies PNG releases from the old raster cutover. | Single-use gate check for an asset milestone already verified and passed. |
| [`scripts/delete-twin-images.mjs`](file:///d:/23082026/scripts/delete-twin-images.mjs) | Finds duplicate image filenames and deletes them from disk. | Ad-hoc disk cleaner from local recovery. Zero references in CI or `package.json`. |
| [`scripts/audit-disk-image-twins.mjs`](file:///d:/23082026/scripts/audit-disk-image-twins.mjs) | Audits disk image duplicates across site directories. | Redundant with `delete-twin-images.mjs`; not run in any gate. |
| [`scripts/repair-favicon-ico.mjs`](file:///d:/23082026/scripts/general/repair-favicon-ico.mjs) | Re-encodes binary header bytes of `favicon.ico`. | One-off binary patch for a corrupted file in August 2026. Dead utility. |

---

### B. Throwaway Python Scripts & Duplicate Checkers

| Script Name | Purpose / Claimed Use | Exact Reason to Remove |
| :--- | :--- | :--- |
| [`scripts/general/rename-plans.py`](file:///d:/23082026/scripts/general/rename-plans.py) | Renamed `README.md` to `00-README.md` in `plans/`. | **38 lines of disposable code.** Already executed. Mutates hardcoded test strings. |
| [`scripts/general/update-plans.py`](file:///d:/23082026/scripts/general/update-plans.py) | Updates a single status sentence in `plans/site-plan.md`. | **15 lines of disposable code.** Replaced a sentence on August 8, 2026. Zero recurring purpose. |
| [`scripts/general/move-checklist.py`](file:///d:/23082026/scripts/general/move-checklist.py) | Moves `oo-start-checklist.md` into `plans/`. | One-off file rename script from early August. |
| [`scripts/general/verify-plans.py`](file:///d:/23082026/scripts/general/verify-plans.py) | Verifies plans exist and cross-references are valid. | **Duplicate.** The canonical gate script is [`scripts/general/check-plans-purity.mjs`](file:///d:/23082026/scripts/general/check-plans-purity.mjs) run by `pnpm run check:plans-purity`. |
| [`scripts/general/audit-repo-state.py`](file:///d:/23082026/scripts/general/audit-repo-state.py) | Reads console audit and deploy logs. | **Completely broken.** Tries to read `results/console-audit/errors.json` and `results/deploy/vercel-deploy.log` (neither exists). |
| [`scripts/general/generate-session-docs.py`](file:///d:/23082026/scripts/general/generate-session-docs.py) | Generates session notes for old agent sessions. | Obsolete; session doc sync is handled by `scripts/general/generate-docs.mjs`. |
| [`scripts/audit_external_asset_hosts.py`](file:///d:/23082026/scripts/audit_external_asset_hosts.py) | Python regex scanner for third-party image URLs. | Introduces an unnecessary Python runtime dependency into a Node monorepo for a task that is a single JS regex or oxlint rule. |
| [`scripts/AsNeeded/_audit-stale-scripts.mjs`](file:///d:/23082026/scripts/AsNeeded/_audit-stale-scripts.mjs) | Draft script checking for `tldraw` and `nova-act` imports. | Abandoned draft script prefixed with an underscore. |
| [`scripts/AsNeeded/_scan-circular-imports.mjs`](file:///d:/23082026/scripts/AsNeeded/_scan-circular-imports.mjs) | Draft script scanning circular imports. | Abandoned draft script prefixed with an underscore; not hooked to any CI gate. |

---

### C. Abandoned Subsystem 1: `scripts/operations-review/` (Entire Directory: 9 Files)

This entire directory was authored as an ad-hoc incident review framework but **was never wired into repository workflows**:
- Self-documented admission in [`entryPoint.ts`](file:///d:/23082026/scripts/operations-review/entryPoint.ts#L42): *"The root command entry point for the operations-review tool has not been integrated into package.json"*.
- It exists solely to satisfy artificial property tests in `tests/operations-review/`.

| Script Name | Purpose | Reason to Remove |
| :--- | :--- | :--- |
| [`scripts/operations-review/entryPoint.ts`](file:///d:/23082026/scripts/operations-review/entryPoint.ts) | Operations review CLI entrypoint | Dead framework entrypoint. |
| [`scripts/operations-review/index.ts`](file:///d:/23082026/scripts/operations-review/index.ts) | Public API exports | Dead exports. |
| [`scripts/operations-review/alignmentComparator.ts`](file:///d:/23082026/scripts/operations-review/alignmentComparator.ts) | Compares architecture alignment | Over-engineered domain logic never used by any product code. |
| [`scripts/operations-review/authorizationGuard.ts`](file:///d:/23082026/scripts/operations-review/authorizationGuard.ts) | Auth guard logic for review ops | Dead security logic. |
| [`scripts/operations-review/models.ts`](file:///d:/23082026/scripts/operations-review/models.ts) | Domain types and interfaces | Dead types. |
| [`scripts/operations-review/recoveryPlanner.ts`](file:///d:/23082026/scripts/operations-review/recoveryPlanner.ts) | Incident recovery planning engine | Dead planner logic. |
| [`scripts/operations-review/renderer.ts`](file:///d:/23082026/scripts/operations-review/renderer.ts) | Markdown renderer for audit reports | Dead renderer. |
| [`scripts/operations-review/riskPrioritizer.ts`](file:///d:/23082026/scripts/operations-review/riskPrioritizer.ts) | Calculates risk weighting scores | Dead risk scoring. |
| [`scripts/operations-review/sourceAdapter.ts`](file:///d:/23082026/scripts/operations-review/sourceAdapter.ts) | Adapts git source trees to review model | Dead source adapter. |

---

### D. Abandoned Subsystem 2: `scripts/site-ui-content-links-audit/` (Entire Directory: 26 Files)

An over-architected **26-file multi-wave crawler** authored for a single audit event on August 31, 2026.
- It is **never executed** by `pnpm run release:gate`, `pnpm run gate:fast`, or `pnpm run build`.
- Contains references to deleted features (`/buddy-planner`, old configurator guest routes).
- Consists of: [`adapters.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/adapters.ts), [`artifactPaths.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/artifactPaths.ts), [`cli.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/cli.ts), [`config.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/config.ts), [`discovery.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/discovery.ts), [`index.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/index.ts), [`manifests.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/manifests.ts), [`profiles.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/profiles.ts), [`runIdentity.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/runIdentity.ts), [`schemas.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/schemas.ts), [`wave.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/wave.ts), [`wave0.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/wave0.ts), [`wave1-foundations.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/wave1-foundations.ts), [`wave1-journeys.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/wave1-journeys.ts), [`wave1-links.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/wave1-links.ts), [`wave1-navigation.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/wave1-navigation.ts), [`wave1-states.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/wave1-states.ts), [`wave1-static-batch.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/wave1-static-batch.ts), [`wave1.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/wave1.ts), [`wave2-surfaces.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/wave2-surfaces.ts), [`wave3-partitions.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/wave3-partitions.ts), [`wave3-records.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/wave3-records.ts), [`wave5-completion-proof.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/wave5-completion-proof.ts), [`wave5-handoffs.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/wave5-handoffs.ts), [`wave5-reconcile.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/wave5-reconcile.ts).
- **Action:** Remove all 26 files.

---

### E. Dangerous / One-Off Cloud Bucket & Seed Data Clutter

| Script Name | Purpose | Reason to Remove |
| :--- | :--- | :--- |
| [`scripts/deleteR2Bucket.ts`](file:///d:/23082026/scripts/deleteR2Bucket.ts) | Destroys an entire Cloudflare R2 bucket. | **Dangerous infrastructure liability.** Deleting production buckets should never be an ad-hoc local script in `run-ops.mjs`. |
| [`scripts/create-bucket.ts`](file:///d:/23082026/scripts/create-bucket.ts) | Creates an R2 bucket via S3 API. | One-time provisioning script. R2 buckets are already configured in production. |
| [`scripts/catalog-seating.json`](file:///d:/23082026/scripts/catalog-seating.json) | 125 KB raw catalog JSON dump. | Misplaced fixture cluttering `scripts/` root. |
| [`scripts/seed_data.sql`](file:///d:/23082026/scripts/seed_data.sql) | 260 KB legacy SQL dump. | Unused raw SQL dump. All seeding is performed via TypeScript seeders (`seed_furniture_catalog.ts`, etc.). |
| [`scripts/sync-hi-wave1-messages.mjs`](file:///d:/23082026/scripts/sync-hi-wave1-messages.mjs) | Syncs Hindi Wave 1 locale messages. | Wave 1 is finished. Canonical i18n synchronization is handled by `check-i18n-key-parity.mjs`. |
| [`scripts/sync-deferred-locale-messages.mjs`](file:///d:/23082026/scripts/sync-deferred-locale-messages.mjs) | Syncs deferred locale JSON files. | Redundant with canonical `sync-marketing-i18n-messages.mjs`. |
| [`scripts/translate-deferred-marketing-flat.mjs`](file:///d:/23082026/scripts/translate-deferred-marketing-flat.mjs) | Translates marketing flat JSON. | Ad-hoc one-off i18n processor. |

---

### F. Tech-Docs Micro-Extractors & Orphan Generators

| Script Name | Purpose | Reason to Remove |
| :--- | :--- | :--- |
| [`tech-docs-generator/scripts/generate-page-component-graph.mjs`](file:///d:/23082026/tech-docs-generator/scripts/generate-page-component-graph.mjs) | Generates `page-component-graph.mmd`. | **Generates an orphan.** Spends CPU cycles generating a Mermaid component graph that is never imported or rendered by [`App.tsx`](file:///d:/23082026/tech-docs-generator/src/App.tsx). |
| [`tech-docs-generator/scripts/check-theme-alignment.mjs`](file:///d:/23082026/tech-docs-generator/scripts/check-theme-alignment.mjs) | Checks theme color tokens in tech docs. | **Duplicate.** Redundant with root [`scripts/general/check-style-tokens.mjs`](file:///d:/23082026/scripts/general/check-style-tokens.mjs). |
| [`tech-docs-generator/scripts/extract-dependabot.mjs`](file:///d:/23082026/tech-docs-generator/scripts/extract-dependabot.mjs) | Parses `.github/dependabot.yml`. | Micro-extractor overhead; can be folded into general CI config extraction. |
| [`tech-docs-generator/scripts/extract-ai.mjs`](file:///d:/23082026/tech-docs-generator/scripts/extract-ai.mjs) | Parses `.cursorrules` / `.agents` metadata. | Micro-extractor producing static output. |
| [`tech-docs-generator/scripts/extract-theme.mjs`](file:///d:/23082026/tech-docs-generator/scripts/extract-theme.mjs) | Extracts theme tokens. | Redundant micro-extractor. |

---

# List 2: Scripts to Retain & How to Improve

### A. Database, Seeding & Cloud Storage Engines

| Script Name | Core Purpose | Concrete Improvements Required |
| :--- | :--- | :--- |
| [`scripts/db_apply_migrations.ts`](file:///d:/23082026/scripts/db_apply_migrations.ts) | Executes SQL migrations on Admin & Products Supabase databases. | **1. Enforce rollback block assertion:** Verify that every pending migration file contains `-- rollback` before applying.<br>**2. Add strict transaction isolation:** Ensure DDL statements fail atomically to prevent partial schema drift. |
| [`scripts/prune_r2_backups.ts`](file:///d:/23082026/scripts/prune_r2_backups.ts) | Enforces 5-day daily and 30-day weekly retention on R2 database backups. | **1. Wire into ops dispatcher:** Add `ops backup:r2:prune` to [`scripts/run-ops.mjs`](file:///d:/23082026/scripts/run-ops.mjs).<br>**2. Automate in CI:** Add a pruning step at the end of [`.github/workflows/supabase-backup-r2.yml`](file:///d:/23082026/.github/workflows/supabase-backup-r2.yml). |
| [`scripts/backup_supabase.ts`](file:///d:/23082026/scripts/backup_supabase.ts) | Exports tables via Supabase REST client. | **1. Graceful permission handling:** Log a non-fatal warning when unprivileged tables (e.g. `business_stats_history`) fail due to anon key fallback, rather than crashing with exit code 2.<br>**2. Require Service Role Key:** Enforce `SUPABASE_SERVICE_ROLE_KEY` check at startup. |
| [`scripts/db_backup_upload_r2.ts`](file:///d:/23082026/scripts/db_backup_upload_r2.ts) | Dumps Postgres via `pg_dump` and uploads gzip to Cloudflare R2. | **1. Graceful pg_dump fallback:** When `pg_dump` is missing locally on Windows, output a clear prerequisite guide (`winget install PostgreSQL.PostgreSQL`) instead of a raw ENOENT trace. |
| [`scripts/sync-github-backup-secrets.ps1`](file:///d:/23082026/scripts/sync-github-backup-secrets.ps1) | Syncs local `.env.local` R2 credentials to GitHub Actions Secrets. | **Fix key typo bug:** Change `CLOULD_ACCESS_KEY_ID` and `CLOULDFLARE_S3_SECRET_ACCESS_KEY` to canonical `CLOUDFLARE_R2_ACCESS_KEY_ID` and `CLOUDFLARE_R2_SECRET_ACCESS_KEY` so CI backups stop running with empty credentials. |
| [`scripts/seed_furniture_catalog.ts`](file:///d:/23082026/scripts/seed_furniture_catalog.ts) | Canonical seeder for Admin `furniture_catalog`. | **Batch insert:** Currently executes individual sequential SQL statements; convert to batched multi-row inserts for 5x faster seeding. |

---

### B. CI/CD, Gates, Linters & Audit Guardrails

| Script Name | Core Purpose | Concrete Improvements Required |
| :--- | :--- | :--- |
| [`scripts/run-ops.mjs`](file:///d:/23082026/scripts/run-ops.mjs) | Master CLI dispatcher (`pnpm run ops <cmd>`). | **1. Prune dead commands:** Remove deleted commands (`assets:dedup:majors`, `db:images:rewrite:*`, `delete-bucket`).<br>**2. Command discovery:** Add auto-completion or categorised `--help` grouping (db, assets, lint, audit). |
| [`scripts/general/run-oxlint.mjs`](file:///d:/23082026/scripts/general/run-oxlint.mjs) | Runs oxlint across repo directories (`site`, `tests`, etc.). | **1. Parallelize runs:** Run independent directory targets concurrently rather than in a blocking serial loop.<br>**2. Unified cache:** Enable oxlint cache flag (`--cache`) to reduce CI gate execution time by ~60%. |
| [`scripts/general/audit-eslint-disable.mjs`](file:///d:/23082026/scripts/general/audit-eslint-disable.mjs) | Fails build if `eslint-disable` directives exist. | **Expand scan coverage:** Add `site/hooks/` and `config/build/` to `SCAN_DIRS` to close the loophole allowing uninspected suppressions. |
| [`scripts/general/audit-sitemap-health.mjs`](file:///d:/23082026/scripts/general/audit-sitemap-health.mjs) | Validates all URLs in production sitemap. | **Add redirect resolution:** Automatically flag 404s vs 301/308 redirects and fail with actionable fix recommendations (e.g. updating the 10 dead product URLs caught today). |
| [`scripts/general/scan_secrets.mjs`](file:///d:/23082026/scripts/general/scan_secrets.mjs) | Pre-commit / gate secret scanner. | **Optimize regex backtracking:** Add early exclusion for generated test artifacts (`results/`) and image assets to speed up `gate:fast`. |
| [`scripts/general/check-repo-layout.mjs`](file:///d:/23082026/scripts/general/check-repo-layout.mjs) | Enforces repo layout rules from `AGENTS.md`. | **Add automated autofix flag (`--fix`):** Automatically clean up empty legacy directories (e.g. `site/data/storage/`). |
| [`scripts/general/check-governance.mjs`](file:///d:/23082026/scripts/general/check-governance.mjs) | Governance ratchet against `governance-baseline.json`. | **Add schema validation:** Validate `governance-baseline.json` structure on parse to prevent silent skipping if JSON is corrupted. |

---

### C. Build & Tech-Docs Engine

| Script Name | Core Purpose | Concrete Improvements Required |
| :--- | :--- | :--- |
| [`tech-docs-generator/scripts/generate-all.mjs`](file:///d:/23082026/tech-docs-generator/scripts/generate-all.mjs) | Master generator for tech docs SPA. | **1. Connect component graph:** Either wire `page-component-graph.mmd` into a dedicated route in `App.tsx` or remove its generation step.<br>**2. Incremental generation:** Skip re-extracting unchanged git commits or docs when running in dev mode. |
| [`tech-docs-generator/scripts/extract-database.mjs`](file:///d:/23082026/tech-docs-generator/scripts/extract-database.mjs) | Generates database documentation. | **Live schema introspection:** Stop hardcoding obsolete tables (`users`, `plans`, `leads`) in [`Database.tsx`](file:///d:/23082026/tech-docs-generator/src/pages/Database.tsx); inspect live database types (`database.types.ts`) dynamically. |
| [`scripts/general/prepare-standalone.cjs`](file:///d:/23082026/scripts/general/prepare-standalone.cjs) | Prepares Next.js standalone build for Docker/Worker. | **Add asset symlink verification:** Verify that `site/public/assets` is copied or linked correctly into `.next/standalone/site/public/assets` before deployment. |

---

## Direct Action Recommendations

1. **Delete Dead Scripts:** Purge the 94 identified files across `scripts/operations-review/`, `scripts/site-ui-content-links-audit/`, and the legacy root recovery scripts.
2. **Update Dispatcher:** Clean [`scripts/run-ops.mjs`](file:///d:/23082026/scripts/run-ops.mjs) of deleted commands and register `backup:r2:prune`.
3. **Fix GitHub Secrets Typo:** Patch [`scripts/sync-github-backup-secrets.ps1`](file:///d:/23082026/scripts/sync-github-backup-secrets.ps1) with canonical `CLOUDFLARE_R2_*` keys.
