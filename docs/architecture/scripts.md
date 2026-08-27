# Scripts catalog

## Purpose and authority

This is the durable catalog for the repository `scripts/` tree. It answers **what each tracked script or support artifact is for**, where its command route is known, and whether the path is currently present in the working tree.

**Command authority:** [`package.json`](../../package.json) owns root `pnpm run <key>` names. [`scripts/run-ops.mjs`](../../scripts/run-ops.mjs) owns the Ops command map (`pnpm run ops <key> [-- args]`). [`scripts/general/README.md`](../../scripts/general/README.md) owns the membership policy for `scripts/general/` only. This document is a catalog, not an alternate dispatcher or command registry.

**Scope and truthfulness:** The current catalog contains **231** tracked `scripts/**` paths. **199 are present** in the working tree; **32 are already deleted/missing** and are marked `missing†` below. One additional visible ignored build artifact, `scripts/tsconfig.tsbuildinfo`, is also cataloged and marked `untracked‡`. This catalog does not restore, remove, move, or change those paths. The historical all-path audit is [`plans/ref/scripts-folder-audit.md`](../../plans/ref/scripts-folder-audit.md); it preserves the earlier 247-path baseline and its bounded caller evidence.

Purpose is derived from a known package/Ops route where cited; otherwise it is a conservative static filename/directory description. It does **not** prove runtime behavior, safety, ownership, complete callers, or lifecycle status. `maybe` artifacts remain active and untouched under the audit policy.

## Documentation map

| Need | Source | Authority / scope |
|---|---|---|
| Root command names and exact command strings | [`package.json`](../../package.json) | Authoritative root package command surface |
| Operational command names and dispatch targets | [`scripts/run-ops.mjs`](../../scripts/run-ops.mjs) | Authoritative Ops `COMMANDS` map |
| Derived Ops command inventory | [`scripts/ops-command-registry.mjs`](../../scripts/ops-command-registry.mjs) | Derived from `run-ops.mjs`; not a second authority |
| Gate-critical `general/` membership and exceptions | [`scripts/general/README.md`](../../scripts/general/README.md) | Scoped to `scripts/general/` |
| Full audit, caller evidence, dispositions | [`plans/ref/scripts-folder-audit.md`](../../plans/ref/scripts-folder-audit.md) | Historical 247-path audit; evidence is static and bounded |
| Protected caller/path compatibility surface | [`plans/ref/scripts-folder-compatibility-matrix.md`](../../plans/ref/scripts-folder-compatibility-matrix.md) | Cleanup planning constraint, not runtime proof |
| Operations, migrations, deploy, backup procedures | [`OPERATIONS_RUNBOOK.md`](../../OPERATIONS_RUNBOOK.md) | Human operating procedure |
| Generated command view | [`generated-documents/docs/markdown/commands/index.md`](../../generated-documents/docs/markdown/commands/index.md) | Derived/disposable command inventory only |
| Spreadsheet export | [`scripts.csv`](./scripts.csv) | CSV mirror of this catalog; includes path, family, type, purpose, route, and working-tree state |
| Staleness review export | [`scripts-stale-review.csv`](./scripts-stale-review.csv) | Evidence-backed stale/missing/maybe review; does not authorize archival |

## Catalog legend

| Marker | Meaning |
|---|---|
| `present` | Path was visible in the working tree during this catalog update. |
| `missing†` | Git-tracked path is already deleted/missing in the working tree. It is recorded, not restored or removed by this documentation work. |
| `untracked‡` | Visible ignored/generated artifact; cataloged for completeness but excluded from the 243 Git-tracked total. |
| `root command` | A `package.json` command has a direct route to this artifact. |
| `Ops command` | `run-ops.mjs` routes an Ops key to this artifact. |
| `support` | Configuration, data, fixture, golden, placeholder, or documentation rather than an executable entrypoint. |

## Root scripts — 117 tracked paths plus one visible untracked metadata artifact

| Artifact | Static purpose / known route | State |
|---|---|---|
| `scripts/.gitkeep` | Directory-retention placeholder (`support`) | present |
| `scripts/apply-db-image-path-rewrite.mjs` | Apply database image-path rewrite | present |
| `scripts/arrange_supabase_catalog_assets.ts` | Arrange Supabase catalog assets; Ops `supabase:assets:arrange` | present |
| `scripts/asset-path-map.mjs` | Build or inspect asset-path mappings | present |
| `scripts/audit-broken-db-image-paths.mjs` | Audit broken database image paths | present |
| `scripts/audit-disk-image-twins.mjs` | Audit duplicate/twin disk images | present |
| `scripts/audit-product-quality.ts` | Audit product quality; Ops `audit:products:quality` | present |
| `scripts/audit-svg-catalog.ts` | Audit SVG catalog; Ops `audit:svg-catalog` | present |
| `scripts/auditCdnAssetFailures.ts` | Audit CDN asset failures; Ops `assets:cdn:audit` / `assets:cdn:fix` | present |
| `scripts/auditUnresolvedCdnPaths.ts` | Audit unresolved CDN paths; Ops `assets:cdn:replacements` | present |
| `scripts/audit_external_asset_hosts.py` | Detect third-party asset hosts; Ops `assets:audit:thirdparty` | present |
| `scripts/audit_slug_id_integrity.ts` | Audit slug/ID integrity; Ops `audit:slug-id` | present |
| `scripts/audit_supabase_admin.ts` | Audit Admin Supabase data; Ops `audit:supabase:admin` | present |
| `scripts/audit_supabase_catalog.ts` | Audit Products catalog Supabase data; Ops `audit:supabase:catalog` | present |
| `scripts/backfill_canonical_catalog_metadata.ts` | Backfill canonical catalog metadata; Ops `supabase:backfill:canonical` | present |
| `scripts/backfill_missing_product_images.ts` | Backfill missing product images; Ops `supabase:backfill:images` | present |
| `scripts/backup_supabase.ts` | Create Supabase backup; Ops `supabase:backup` | present |
| `scripts/blockRenderUtils.ts` | Block-render utility module | present |
| `scripts/catalog-seating.json` | Seating catalog data (`support`) | present |
| `scripts/catalog_snapshot_upload_r2.ts` | Upload catalog snapshot to R2; Ops `catalog:snapshot:r2` | present |
| `scripts/check-homepage-dialect.mjs` | Check homepage dialect; `check:site-ui` route | present |
| `scripts/check-i18n-key-parity.mjs` | Check i18n key parity; root/Ops check route | present |
| `scripts/check-site-ui-contract.mjs` | Verify marketing shell, copy-source, and inline-style contracts; root/Ops `check:site-ui` routes; supports `--scope=<name>` | present |
| `scripts/check-supabase-missing-images.mjs` | Check Supabase records for missing images | present |
| `scripts/checkAuthEnv.ts` | Check authentication environment; Ops `test:auth:env` | present |
| `scripts/check_all_env_full.ts` | Full environment check; root `check:env:full` | present |
| `scripts/clean-test-artifacts.mjs` | Clean generated test artifacts; root `test:clean` | present |
| `scripts/configure-cf-security-txt.ps1` | Configure Cloudflare `security.txt` | present |
| `scripts/contact-sheet.mjs` | Generate image contact sheet | present |
| `scripts/count-r2-objects.mjs` | Count R2 objects; Ops `assets:r2:count` | present |
| `scripts/coverage-metrics.mjs` | Calculate coverage metrics | present |
| `scripts/coverage-policy.mjs` | Apply or report coverage policy | present |
| `scripts/create-bucket.ts` | Create R2 bucket; Ops `assets:r2:create-bucket` | present |
| `scripts/create-private-repo.bat` | Create private repository helper | missing† |
| `scripts/create-private-repo.ps1` | Create private repository helper | missing† |
| `scripts/db_advisors.ts` | Run Products DB advisors; Ops `db:advisors*` | present |
| `scripts/db_advisors_admin.ts` | Run Admin DB advisors; Ops `db:advisors:admin` | present |
| `scripts/db_apply_migrations.ts` | Apply or plan DB migrations; Ops/root `db:apply*` | present |
| `scripts/db_backup_dropped_tables.ts` | Back up dropped DB tables; Ops `db:backup-dropped` | present |
| `scripts/db_backup_pg_dump.ts` | Create `pg_dump` backup; Ops `db:backup:pgdump` | present |
| `scripts/db_backup_upload_r2.ts` | Back up database to R2; Ops `backup:supabase:r2` | present |
| `scripts/db_ensure_plans_table.ts` | Ensure plans table; Ops `db:ensure-plans` | present |
| `scripts/db_gen_admin_types.ts` | Generate Admin database types; Ops/root `db:types:admin` | present |
| `scripts/db_sync_drizzle_schema.ts` | Synchronize Drizzle schema; Ops `db:sync-drizzle` | present |
| `scripts/db_test_connection.ts` | Test database connection; root/Ops `db:test` | present |
| `scripts/delete-twin-images.mjs` | Delete duplicate/twin image files | present |
| `scripts/deleteR2Bucket.ts` | Delete R2 bucket; Ops `assets:r2:delete-bucket` | present |
| `scripts/detect-corrupt-images.mjs` | Detect corrupt image files | present |
| `scripts/downloadCdnAssets.ts` | Download CDN assets; Ops `assets:cdn:catalog` | present |
| `scripts/ensure-retire-restore-precondition.mjs` | Verify retire/restore prerequisites | present |
| `scripts/ensureAuthTestUsers.ts` | Seed/ensure authentication test users; Ops `test:auth:seed-users` | present |
| `scripts/export-pending-failures.mjs` | Export pending failures; root/Ops `failures:sync` | present |
| `scripts/export-pending-translations.mjs` | Export pending translations | present |
| `scripts/finish-all.ps1` | Finish-all automation helper | missing† |
| `scripts/five-majors-hash-dedup.mjs` | Hash/deduplicate five-major assets | present |
| `scripts/fix-asset-paths.mjs` | Repair asset paths | present |
| `scripts/fix-commit-author.ps1` | Correct Git commit author metadata | missing† |
| `scripts/gate-site-ui.mjs` | Run site UI gate; root/Ops `gate:site-ui` | present |
| `scripts/generate-coverage-report.mjs` | Generate coverage report; coverage command route | present |
| `scripts/generate-page-component-graph.mjs` | Generate page/component graph; root `graph:page-components` | present |
| `scripts/generate-route-classification.mjs` | Generate route classification | present |
| `scripts/generate-site-ui-route-matrix.mjs` | Generate site UI route matrix; Ops `site-ui:matrix` | present |
| `scripts/generate-sitemap-csv.ts` | Generate sitemap CSV; Ops `docs:sync:sitemap-csv` | present |
| `scripts/generate-svg.mjs` | Path-stable SVG generation entrypoint; Ops/test SVG route | present |
| `scripts/generate-visual-audit-report.mjs` | Generate visual audit report; root `audit:visual:report` | present |
| `scripts/generate-vitest-report.mjs` | Generate Vitest report; root test lifecycle/coverage route | present |
| `scripts/generate_blocks.ts` | Generate catalog blocks; Ops `catalog:blocks:qa` | present |
| `scripts/graph-impact.mjs` | Analyze TypeScript import-graph impact/cycles | present |
| `scripts/launch-smoke.mjs` | Launch smoke verification; Ops `launch:smoke` | present |
| `scripts/marketing-ui-audit.mjs` | Audit marketing UI | present |
| `scripts/merge-recovery-into-majors.mjs` | Merge recovery data into major records | present |
| `scripts/migrate-svg-catalog-to-png.mjs` | Migrate SVG catalog assets to PNG | present |
| `scripts/mirror-assets-to-r2.mjs` | Mirror assets to R2 | present |
| `scripts/mobile-canvas-share.mjs` | Mobile canvas sharing helper | present |
| `scripts/ops-command-registry.mjs` | Derive Ops names from `run-ops.mjs` (`support`) | present |
| `scripts/organize-catalog-images.ts` | Organize catalog images; Ops dry/apply/sync routes | present |
| `scripts/planner-lift-project-trees.mjs` | Lift/verify Planner project trees; Ops `planner:lift*` | present |
| `scripts/playwright-dev-lock.mjs` | Coordinate Playwright development lock | present |
| `scripts/pushSvgCatalogToDb.ts` | Push SVG catalog to database | present |
| `scripts/render-catalog-qa-sheet.ts` | Render catalog QA sheet; Ops `catalog:qa:sheet` | present |
| `scripts/repo_backup_upload_r2.ts` | Back up repository to R2; Ops `repo:backup:r2` | present |
| `scripts/responsive-audit.mjs` | Audit responsive UI behavior | present |
| `scripts/reverse-asset-paths.mjs` | Reverse asset-path changes | present |
| `scripts/run-admin-production-auth-smoke.ps1` | Run Admin production-auth smoke check | present |
| `scripts/run-admin-retire-restore-canvas.mjs` | Run Admin retire/restore canvas flow | present |
| `scripts/run-full-vitest.mjs` | Run two-lane Vitest suite; root `test` | present |
| `scripts/run-ops.mjs` | Authoritative Ops dispatcher | present |
| `scripts/scan-boundaries.mjs` | Scan Studio/Planner import boundaries; root `scan:boundaries` | present |
| `scripts/scan-hardcoding.mjs` | Scan hard-coded values; Ops `scan:hardcoding` | present |
| `scripts/seed-block-descriptors.ts` | Seed block descriptors; Ops `seed:block-descriptors` | present |
| `scripts/seed.ts` | Seed catalog data; Ops `seed` | present |
| `scripts/seed_configurator_catalog.ts` | Seed configurator catalog; Ops `seed:configurator` | present |
| `scripts/seed_data.sql` | SQL seed data (`support`) | present |
| `scripts/seed_furniture_catalog.ts` | Seed furniture catalog; root/Ops `seed:furniture` | present |
| `scripts/seed_planner_managed_catalog.ts` | Seed managed Planner catalog; Ops `seed:managed` | present |
| `scripts/setup-ayushonmicrosoft-remote.ps1` | Configure Ayushonmicrosoft remote | missing† |
| `scripts/shallow-push-ayushonmicrosoft.ps1` | Perform shallow push to Ayushonmicrosoft remote | missing† |
| `scripts/site-page-audit.mjs` | Audit site pages; root `audit:site-pages` | present |
| `scripts/smoke-svg-fixtures.mjs` | Smoke SVG fixtures; Ops `p0:svg` | present |
| `scripts/sync-deferred-locale-messages.mjs` | Synchronize deferred locale messages | present |
| `scripts/sync-descriptor-svgs.ts` | Synchronize descriptor SVGs; Ops `sync:descriptor-svgs` | present |
| `scripts/sync-github-backup-secrets.ps1` | Synchronize GitHub backup secrets; Ops route | present |
| `scripts/sync-hi-wave1-messages.mjs` | Synchronize Hindi wave-one messages | present |
| `scripts/sync-marketing-i18n-messages.mjs` | Synchronize marketing i18n messages | present |
| `scripts/sync-missing-alt-text.ts` | Synchronize missing alt text; Ops dry/apply routes | present |
| `scripts/sync-token-pairs.mjs` | Synchronize token pairs; Ops `scan:tokens` | present |
| `scripts/syncClientLogosFromR2.ts` | Synchronize client logos from R2 | present |
| `scripts/syncVendorCdnAssets.mjs` | Synchronize vendor CDN assets; Ops `assets:cdn:sync` | present |
| `scripts/translate-deferred-marketing-flat.mjs` | Translate deferred marketing locales | present |
| `scripts/trim-catalog.mjs` | Trim catalog data | present |
| `scripts/tsconfig.json` | TypeScript configuration for script compilation (`support`) | present |
| `scripts/tsconfig.tsbuildinfo` | TypeScript build metadata (`support`) | untracked‡ |
| `scripts/ui-polish-pass1-audit.mjs` | Audit first-pass UI polish | present |
| `scripts/uploadCdnAssets.ts` | Upload CDN assets; Ops upload routes | present |
| `scripts/verify-asset-decode.mjs` | Verify asset decoding | present |
| `scripts/verify-png-release.mjs` | Verify PNG release assets | present |
| `scripts/verify-remote.ps1` | Verify remote configuration | missing† |

## `scripts/general/` — 54 tracked paths

| Artifact | Static purpose / known route | State |
|---|---|---|
| `scripts/general/.gitkeep` | Directory-retention placeholder (`support`) | present |
| `scripts/general/README.md` | `general/` membership contract (`support`) | present |
| `scripts/general/audit-api-route-safety.mjs` | Audit API-route safety; root/Ops audit route | present |
| `scripts/general/audit-eslint-disable.mjs` | Audit ESLint disable directives; root/Ops audit route | present |
| `scripts/general/audit-gate-skips.mjs` | Audit gate skips; root/Ops audit route | present |
| `scripts/general/audit-hollow-tests.mjs` | Audit hollow tests; root/Ops audit route | present |
| `scripts/general/audit-repo-state.py` | Repository-state audit (`maybe`) | present |
| `scripts/general/block-agent-tests.mjs` | Kiro `PreToolUse` test-blocking policy hook (`support`) | present |
| `scripts/general/check-active-docs.mjs` | Check active documentation; root/Ops gate route | present |
| `scripts/general/check-agents-folder.mjs` | Check Agents folder; root/Ops gate route | present |
| `scripts/general/check-agents-md.mjs` | Check `AGENTS.md`; root/Ops gate route | present |
| `scripts/general/check-composer-styles.mjs` | Check Composer styles; root/Ops UI-assets gate | present |
| `scripts/general/check-docs-purity.mjs` | Check documentation purity; root/Ops gate route | present |
| `scripts/general/check-failures.mjs` | Check `Failures.md` purity; root/Ops gate route | present |
| `scripts/general/check-governance.mjs` | Check governance; root/Ops release-gate route | present |
| `scripts/general/check-plans-purity.mjs` | Check plans purity; root/Ops gate route | present |
| `scripts/general/check-product-icons.mjs` | Check product icons; root/Ops UI-assets gate | present |
| `scripts/general/check-repo-layout.mjs` | Check repository layout; root/Ops gate route | present |
| `scripts/general/check-root-markdown-links.mjs` | Check root Markdown links; root/Ops docs route | present |
| `scripts/general/check-sharp.js` | Check Sharp installation; root/Ops build route | present |
| `scripts/general/check-style-tokens.mjs` | Check style tokens; root/Ops release-gate route | present |
| `scripts/general/check-test-layout.mjs` | Check test layout; Ops `test:layout:check` | present |
| `scripts/general/check-worker-origin.mjs` | Verify Worker/Vercel origin route; Ops `check:worker-origin` | present |
| `scripts/general/ci-gate-env.mjs` | CI gate-environment helper (`maybe`) | present |
| `scripts/general/cleanup-nested-installs.mjs` | Remove nested installs/locks; `postinstall` | present |
| `scripts/general/console-audit.mjs` | Console audit (`maybe`) | present |
| `scripts/general/generate-api-inventory.mjs` | Generate API inventory (`maybe`) | present |
| `scripts/general/generate-docs.mjs` | Generate/check docs; root/Ops docs routes | present |
| `scripts/general/generate-persistence-sweep.mjs` | Generate persistence sweep (`maybe`) | present |
| `scripts/general/generate-pseo-sku-matrix.mjs` | Generate pSEO SKU matrix; root `plan:pseo-matrix` | present |
| `scripts/general/generate-redirect-map.mjs` | Generate redirect map (`maybe`) | present |
| `scripts/general/generate-route-index.mjs` | Generate route index; root/Ops docs route | present |
| `scripts/general/generate-session-docs.py` | Generate session docs (`maybe`) | present |
| `scripts/general/generate-test-inventory.mjs` | Generate test inventory | present |
| `scripts/general/guard-workspace-install.mjs` | Block non-pnpm nested workspace install; `preinstall` | present |
| `scripts/general/hollow-test-patterns.mjs` | Hollow-test pattern support (`maybe`) | present |
| `scripts/general/lint-ui-contract.mjs` | Lint UI contract; root/Ops lint route | present |
| `scripts/general/loadEnvLocal.cjs` | Load root/site `.env.local` for scripts (`support`) | present |
| `scripts/general/move-checklist.py` | Move plan checklist (`maybe`) | present |
| `scripts/general/prepare-standalone.cjs` | Prepare Next standalone output; root `build:site` | present |
| `scripts/general/prune-site-dumps.mjs` | Prune fixed site dump paths; `release:gate:fast` | present |
| `scripts/general/prune-stale-next-types.mjs` | Prune stale Next types; root `typecheck` | present |
| `scripts/general/rename-plans.py` | Rename plans (`maybe`) | present |
| `scripts/general/root-surface-purity.mjs` | Root-surface purity support (`maybe`) | present |
| `scripts/general/run-oxlint.mjs` | Run Oxc lint across workspace areas; root/Ops lint routes | present |
| `scripts/general/run-plan-wave1.mjs` | Run plan wave one; root `plan:wave1` | present |
| `scripts/general/run-test-audits.mjs` | Run test audits; root/Ops audit routes | present |
| `scripts/general/scan_secrets.mjs` | Scan for secrets; root/Ops `scan:secrets` | present |
| `scripts/general/startStandalone.cjs` | Start standalone Next server; root `start` | present |
| `scripts/general/sync-env-local-files.mjs` | Synchronize missing `.env.local` keys; root/Ops `env:sync` | present |
| `scripts/general/update-plans.py` | Update plans (`maybe`) | present |
| `scripts/general/validate-launch-env.mjs` | Validate launch environment; root/Ops launch route | present |
| `scripts/general/verify-plans.py` | Verify plans (`maybe`) | present |
| `scripts/general/workstation-env.mjs` | Workstation environment contract helper (`maybe`) | present |

## `scripts/AsNeeded/` — 12 tracked paths

| Artifact | Static purpose / known route | State |
|---|---|---|
| `scripts/AsNeeded/ALLOWLIST.md` | Allowlist/support policy (`support`) | present |
| `scripts/AsNeeded/_audit-stale-scripts.mjs` | Audit stale scripts | present |
| `scripts/AsNeeded/_scan-circular-imports.mjs` | Scan circular imports | present |
| `scripts/AsNeeded/audit-css-packages.mjs` | Audit CSS packages | present |
| `scripts/AsNeeded/audit-focss-static-defects.mjs` | Audit static FOCSS defects | present |
| `scripts/AsNeeded/compare-focss-trees.mjs` | Compare FOCSS trees | present |
| `scripts/AsNeeded/count-focss-hardcodes.mjs` | Count hard-coded FOCSS values | present |
| `scripts/AsNeeded/finalize-surface-classify.mjs` | Finalize surface classification | present |
| `scripts/AsNeeded/reapply-feature-flags-grants.mjs` | Reapply feature-flag grants | present |
| `scripts/AsNeeded/smoke-site-pages.mjs` | Smoke site pages | present |
| `scripts/AsNeeded/verify-db-svg-matrix.mjs` | Verify DB/SVG matrix; Ops `verify:db-svg` | present |
| `scripts/AsNeeded/verify-focss.mjs` | Verify FOCSS structure, imports, fences, and CSS-module graph; root `verify:focss`; supports `--scope=<name>` | present |

## `scripts/codemods/` — 2 tracked paths

| Artifact | Static purpose / known route | State |
|---|---|---|
| `scripts/codemods/.gitkeep` | Directory-retention placeholder (`support`) | present |
| `scripts/codemods/homepage-dialect.mjs` | Apply homepage dialect codemod; Ops `codemod:homepage-dialect` | present |

## SVG pipeline support — 9 tracked paths

| Artifact | Static purpose / known route | State |
|---|---|---|
| `scripts/generate-svg/.gitkeep` | Directory-retention placeholder (`support`) | present |
| `scripts/generate-svg/pipelineCore.ts` | Path-stable SVG pipeline implementation | present |
| `scripts/generate-svg/svgo.config.cjs` | SVGO optimizer configuration (`support`) | present |
| `scripts/generate-svg/_fixtures/.gitkeep` | Fixture-directory placeholder for live smoke inputs (`support`) | present |
| `scripts/generate-svg/_fixtures/chaise.json` | Live SVG smoke input; read by `smoke-svg-fixtures.mjs` | present |
| `scripts/generate-svg/_fixtures/linear-desk-param.json` | Live SVG smoke input; read by `smoke-svg-fixtures.mjs` | present |
| `scripts/generate-svg/_fixtures/missing-geometry.json` | Live SVG smoke input; read by `smoke-svg-fixtures.mjs` | present |
| `scripts/generate-svg/_fixtures/sectional.json` | Live SVG smoke input; read by `smoke-svg-fixtures.mjs` | present |
| `scripts/generate-svg/_fixtures/side-table.json` | Live SVG smoke input; read by `smoke-svg-fixtures.mjs` | present |

## `scripts/kiro-repo-guidance-setup/` — 25 tracked paths

All paths in this family are TypeScript repository-guidance setup modules. They are currently missing† from the working tree; this catalog records the tracked paths only.

| Artifact | Static purpose | State |
|---|---|---|
| `scripts/kiro-repo-guidance-setup/capabilities.ts` | Guidance capability definitions | missing† |
| `scripts/kiro-repo-guidance-setup/compatibility.ts` | Guidance compatibility rules | missing† |
| `scripts/kiro-repo-guidance-setup/continuity.ts` | Guidance continuity rules | missing† |
| `scripts/kiro-repo-guidance-setup/contract-freeze.ts` | Guidance contract-freeze rules | missing† |
| `scripts/kiro-repo-guidance-setup/contracts.ts` | Guidance contracts | missing† |
| `scripts/kiro-repo-guidance-setup/coverage.ts` | Guidance coverage definitions | missing† |
| `scripts/kiro-repo-guidance-setup/discovery.ts` | Guidance discovery rules | missing† |
| `scripts/kiro-repo-guidance-setup/enablement.ts` | Guidance enablement rules | missing† |
| `scripts/kiro-repo-guidance-setup/handover.ts` | Guidance handover rules | missing† |
| `scripts/kiro-repo-guidance-setup/hooks.ts` | Guidance hook definitions | missing† |
| `scripts/kiro-repo-guidance-setup/integration-gate.ts` | Guidance integration-gate rules | missing† |
| `scripts/kiro-repo-guidance-setup/inventory.ts` | Guidance inventory definitions | missing† |
| `scripts/kiro-repo-guidance-setup/owner-decisions.ts` | Guidance owner-decision rules | missing† |
| `scripts/kiro-repo-guidance-setup/ownership.ts` | Guidance ownership definitions | missing† |
| `scripts/kiro-repo-guidance-setup/pipeline.ts` | Guidance pipeline definitions | missing† |
| `scripts/kiro-repo-guidance-setup/policy.ts` | Guidance policy definitions | missing† |
| `scripts/kiro-repo-guidance-setup/provenance.ts` | Guidance provenance definitions | missing† |
| `scripts/kiro-repo-guidance-setup/reservations.ts` | Guidance reservation rules | missing† |
| `scripts/kiro-repo-guidance-setup/reviewers.ts` | Guidance reviewer definitions | missing† |
| `scripts/kiro-repo-guidance-setup/rollback.ts` | Guidance rollback rules | missing† |
| `scripts/kiro-repo-guidance-setup/scope.ts` | Guidance scope definitions | missing† |
| `scripts/kiro-repo-guidance-setup/skills.ts` | Guidance skill definitions | missing† |
| `scripts/kiro-repo-guidance-setup/validation.ts` | Guidance validation rules | missing† |
| `scripts/kiro-repo-guidance-setup/wave-guard.ts` | Guidance wave-guard rules | missing† |
| `scripts/kiro-repo-guidance-setup/wave-manifest.ts` | Guidance wave-manifest definitions | missing† |

## `scripts/lib/` — 12 tracked paths

| Artifact | Static purpose / known use | State |
|---|---|---|
| `scripts/lib/.gitkeep` | Directory-retention placeholder (`support`) | present |
| `scripts/lib/assetPathMapTools.mjs` | Shared asset-path mapping helper | present |
| `scripts/lib/cdnAssetResolver.ts` | Shared CDN asset resolver | present |
| `scripts/lib/exportMarketingCopy.ts` | Marketing-copy export helper | present |
| `scripts/lib/r2Catalog.ts` | Shared R2 catalog helper | present |
| `scripts/lib/recoveryClassify.mjs` | Recovery classification helper | present |
| `scripts/lib/repoRoot.mjs` | Shared repository-root resolver | present |
| `scripts/lib/repoRoot.ts` | Shared TypeScript repository-root resolver | present |
| `scripts/lib/resolvePgDump.ts` | Shared `pg_dump` executable resolver | present |
| `scripts/lib/scriptEnv.mjs` | Shared script environment helper | present |
| `scripts/lib/siteUiRouteSources.mjs` | Shared site UI route-source helper | present |
| `scripts/lib/vitest-excludes.mjs` | Shared Vitest exclude-pattern helper | present |

## Working-tree reconciliation

The catalog contains every tracked `scripts/**` path:

| Family | Tracked | Present | Missing† |
|---|---:|---:|---:|
| Root scripts | 117 | 110 | 7 |
| Visible ignored support metadata | 0 | 1 | 0 |
| `scripts/general/` | 54 | 54 | 0 |
| `scripts/AsNeeded/` | 12 | 12 | 0 |
| `scripts/codemods/` | 2 | 2 | 0 |
| SVG pipeline | 9 | 9 | 0 |
| `scripts/kiro-repo-guidance-setup/` | 25 | 0 | 25 |
| `scripts/lib/` | 12 | 12 | 0 |
| **Tracked total** | **231** | **199** | **32** |
| **Catalog total (including ignored metadata)** | **232** | **200** | **32** |

The catalog reflects the current working tree, including user-approved script removals and both checker consolidations. The one `untracked‡` entry is ignored generated metadata. No scripts, tests, gates, or builds were run to create this catalog.

## Staleness review

The audit distinguishes evidence from filename appearance. A stale-looking name is **not** safe to archive or move by itself. The machine-readable review is [`scripts-stale-review.csv`](./scripts-stale-review.csv).

| Evidence-backed category | Count | What it means | Required next action | Archive/move now? |
|---|---:|---|---|---|
| Proven stale/archive candidate | 0 | The completed historical audit found no path with both obsolete evidence and a completed caller-free scope. | Keep every artifact under the preservation boundary. | No |
| Missing tracked path | 32 | The path is already absent from the working tree. This is a Git/worktree state, not evidence that the script is obsolete. | Decide whether to restore the path or commit the existing deletion; preserve callers if restoring/replacing. | No |
| Active unresolved `maybe` | 141 | Caller, lifecycle, owner, import, or safety evidence remains incomplete. Many may be one-offs, but that has not been proved. | Complete evidence before any change. | No |
| Protected `keep` | 106 | Positive caller, gate/path policy, or shared-helper evidence exists. | Preserve the current path and known compatibility surface. | No |

The missing-path CSV lists all 32 exact paths and the required decision. It intentionally contains **no archive target**, because a missing working-tree file cannot be moved to an archive and its deletion may still need restoration or caller migration.
