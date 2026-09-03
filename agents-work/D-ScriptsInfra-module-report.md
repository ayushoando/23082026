# Scripts, Tech Docs Generator, Workers, and Infra Configuration Module Report

**Frozen baseline:** `HEAD fdef1ba7106328ecf43e7a3232dd4bd9859b97be`; 4,095 tracked paths plus literal `plans/repository-suggestions.md` = 4,096 inputs.
**Owned inputs:** exactly 377 paths from `frozen-ScriptsAssets.txt`: `scripts/**` (227), `tech-docs-generator/**` (131), `workers/**` (6), and `config/**` (13). Generated reports are outputs and are excluded. Public assets (`site/public/**`, 1,392 files) are reported exclusively in `D-FeaturesPublic-module-report.md`.

## 1. Coverage and validation

Every one of the 372 text/code/config inputs was opened as a complete UTF-8 byte stream and decoded successfully (`read-full`). Each of the 5 binary inputs was checked for existence and non-zero size, extension/header consistency, SHA-256, and format decodability where supported; raster images were decoded and dimensions inspected. Results: **372 read-full**, **4 binary-validated**, **1 failed**.

### Failed inputs
- `tech-docs-generator/public/favicon.ico` — extension/header mismatch: `.ico` file begins PNG signature `89504e470d0a1a0a0000000d49484452`.

## 2. Strengths

- The operations registry and release-gate target references resolve on disk from the frozen tree; no dangling command target was observed during the full text read.
- Worker cache policy has explicit method/status/cookie/private-path guards, and tech-docs authentication has fail-closed branches in `AuthGate` as previously grounded.
- Build configurations and Vite/Vitest configs across tech-docs and root pipelines isolate lanes properly without cross-contamination.

## 3. Grounded findings

### S1 — Match Supabase chunked session cookies before caching (P0)
`workers/oando-worker-proxy/src/cachePolicy.js:24-27`

`requestHasSessionCookie` requires `-auth-token=` immediately after the cookie name, but Supabase SSR chunks large values as `sb-<ref>-auth-token.0`, `.1`, etc.

**Observed Reproduction Input/Output:**
- *Input (chunked cookie):* `"sb-xytz-auth-token.0=tokenpart0; sb-xytz-auth-token.1=tokenpart1"`
- *Input (unchunked cookie):* `"sb-xytz-auth-token=fulltoken"`
- *Shipped `cookie.includes('-auth-token=')` Output:* Chunked = `false`, Unchunked = `true`.
- *Result:* Public requests carrying a chunked authenticated session pass `shouldCacheResponse`, allowing personalized HTML into the shared edge cache.

**Fix:** Match the optional numeric chunk suffixes (`sb-.*-auth-token(?:\.\d+)?=`) before enabling public response caching.

### S2 — Reject protocol-relative proxy paths (P0)
`workers/oando-worker-proxy/src/index.js:201-201`

The worker constructs `new URL(pathname + url.search, origin)` from client-controlled `pathname`.

**Observed Reproduction Input/Output:**
- *Input:* `pathname = "//evil.com/steal"`, `origin = "https://oando.co.in"`
- *Observed URL Resolution:* `new URL("//evil.com/steal", "https://oando.co.in").href` → `"https://evil.com/steal"` (`host: "evil.com"`).
- *Result:* Target host resolves to `evil.com` rather than `oando.co.in`, proving origin escape and attacker-controlled content under the trusted worker host.

**Fix:** Reject paths beginning `//` (or resolve only after strict origin/path validation) with a 400 response before constructing `targetUrl`.

### S3 — Do not whitelist a whole line merely for mentioning env (P1)
`scripts/general/scan_secrets.mjs:61-72`

`isSafeReferenceOrExample` returns safe when any line contains `process.env`, `Deno.env`, or `env(`, before secret patterns are evaluated.

**Observed Reproduction Input/Output:**
- *Input Line:* `const token = process.env.CLOUDFLARE_API_TOKEN; // no literal secret`
- *Function Call:* `isSafeReferenceOrExample(line)`
- *Observed Output:* `true` (classified as safe).
- *Result:* Real API token pattern on the same line is bypassed by the shipped predicate during release gates.

**Fix:** Anchor the exception to a pure env reference/placeholder and add JSON/YAML key forms to the secret regexes.

### S4 — Avoid pre-flight cacheEverything for unknown responses (P2)
`workers/oando-worker-proxy/src/index.js:210-227`

The outgoing fetch sets `cacheEverything: true` using hard-coded `status: 200` and `setCookie: false`; the real response status and `set-cookie` are checked only after fetch at lines 265-273. A redirect, error, or cookie-setting response can thus be admitted to edge caching before the later check. Apply edge caching only to immutable static assets or use a response-cache path that evaluates the actual response before storage.

### S5 — Correct tech-docs favicon extension/header mismatch (P2)
`tech-docs-generator/public/favicon.ico`

Binary validation measured the `.ico` file as a 1,991-byte PNG with header `89504e470d0a1a0a0000000d49484452`; the extension/header contract is false, so servers selecting `image/x-icon` by suffix deliver a body that does not match the declared format. Rename to `.png` and update references, or encode a valid ICO container while preserving the canonical path.

## 4. Advisor guidance (prioritized six-month view)

1. **Before the next edge deploy:** fix S1 and S2, add worker unit coverage for chunked cookies and protocol-relative paths, and purge cache entries after rollout.
2. **Before relying on release gates:** fix S3 and add regression cases for env mentions plus JSON/YAML secret syntax.
3. **During asset maintenance:** fix S5 by generating standard ICO container assets for the tech-docs generator.

## 5. Verdict

**overall_correctness:** `incorrect` (partial coverage due to 1 failed binary validation and four grounded code/worker defects).
**confidence:** 0.98.

## Appendix A — Per-file evidence (machine-checkable)

Frozen revision: `fdef1ba7106328ecf43e7a3232dd4bd9859b97be`; owned count: 377; status totals: `read-full` 372, `binary-validated` 4, `failed` 1. Every frozen owned path occurs exactly once below.

| path | status | module | reviewer | finding IDs |
|---|---|---|---|---|
| `config/build/next.config.js` | read-full | config | FreshScriptsAssets | none |
| `config/build/playwright-gate-specs.json` | read-full | config | FreshScriptsAssets | none |
| `config/build/playwright-open3d-world-specs.json` | read-full | config | FreshScriptsAssets | none |
| `config/build/playwright.config.ts` | read-full | config | FreshScriptsAssets | none |
| `config/build/playwrightBaseURL.cjs` | read-full | config | FreshScriptsAssets | none |
| `config/build/postcss.config.mjs` | read-full | config | FreshScriptsAssets | none |
| `config/build/tsconfig.json` | read-full | config | FreshScriptsAssets | none |
| `config/build/vitest-console-reporter.ts` | read-full | config | FreshScriptsAssets | none |
| `config/observability/docker-compose.yml` | read-full | config | FreshScriptsAssets | none |
| `config/observability/grafana/provisioning/datasources/prometheus.yml` | read-full | config | FreshScriptsAssets | none |
| `config/observability/prometheus.yml` | read-full | config | FreshScriptsAssets | none |
| `config/quality/governance-baseline.json` | read-full | config | FreshScriptsAssets | none |
| `config/quality/style-token-baseline.json` | read-full | config | FreshScriptsAssets | none |
| `scripts/AsNeeded/ALLOWLIST.md` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/AsNeeded/_audit-stale-scripts.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/AsNeeded/_scan-circular-imports.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/AsNeeded/audit-css-packages.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/AsNeeded/audit-focss-static-defects.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/AsNeeded/audit-seo-indexability.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/AsNeeded/verify-db-svg-matrix.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/AsNeeded/verify-focss.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/apply-db-image-path-rewrite.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/arrange_supabase_catalog_assets.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/asset-path-map.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/audit-broken-db-image-paths.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/audit-disk-image-twins.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/audit-product-quality.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/audit-svg-catalog.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/auditCdnAssetFailures.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/auditUnresolvedCdnPaths.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/audit_external_asset_hosts.py` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/audit_slug_id_integrity.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/audit_supabase_admin.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/audit_supabase_catalog.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/backfill_canonical_catalog_metadata.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/backfill_missing_product_images.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/backup_supabase.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/blockRenderUtils.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/catalog-seating.json` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/catalog_snapshot_upload_r2.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/check-homepage-dialect.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/check-i18n-key-parity.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/check-site-ui-contract.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/check-supabase-missing-images.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/checkAuthEnv.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/check_all_env_full.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/clean-test-artifacts.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/codemods/homepage-dialect.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/configure-cf-security-txt.ps1` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/contact-sheet.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/count-r2-objects.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/coverage-metrics.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/coverage-policy.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/create-bucket.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/db_advisors.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/db_advisors_admin.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/db_apply_migrations.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/db_backup_dropped_tables.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/db_backup_pg_dump.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/db_backup_upload_r2.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/db_ensure_plans_table.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/db_gen_admin_types.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/db_sync_drizzle_schema.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/db_test_connection.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/delete-twin-images.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/deleteR2Bucket.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/detect-corrupt-images.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/downloadCdnAssets.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/ensure-retire-restore-precondition.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/ensureAuthTestUsers.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/export-pending-failures.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/export-pending-translations.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/five-majors-hash-dedup.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/fix-asset-paths.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/gate-site-ui.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/README.md` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/audit-api-route-safety.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/audit-eslint-disable.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/audit-gate-skips.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/audit-hollow-tests.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/audit-repo-state.py` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/audit-sitemap-health.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/check-active-docs.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/check-agents-folder.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/check-agents-md.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/check-composer-styles.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/check-docs-purity.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/check-failures.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/check-governance.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/check-plans-purity.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/check-product-icons.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/check-repo-layout.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/check-root-markdown-links.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/check-sharp.js` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/check-style-tokens.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/check-test-layout.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/check-worker-origin.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/ci-gate-env.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/cleanup-nested-installs.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/console-audit.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/generate-api-inventory.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/generate-docs.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/generate-persistence-sweep.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/generate-pseo-sku-matrix.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/generate-redirect-map.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/generate-route-index.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/generate-session-docs.py` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/generate-test-inventory.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/guard-workspace-install.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/hollow-test-patterns.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/lint-ui-contract.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/loadEnvLocal.cjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/move-checklist.py` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/prepare-standalone.cjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/prune-site-dumps.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/prune-stale-next-types.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/rename-plans.py` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/root-surface-purity.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/run-oxlint.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/run-plan-wave1.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/run-playwright-gate.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/run-test-audits.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/scan_secrets.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/startStandalone.cjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/sync-env-local-files.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/update-plans.py` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/validate-launch-env.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/verify-plans.py` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/general/workstation-env.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/generate-coverage-report.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/generate-route-classification.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/generate-site-ui-route-matrix.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/generate-sitemap-csv.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/generate-svg.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/generate-svg/_fixtures/chaise.json` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/generate-svg/_fixtures/linear-desk-param.json` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/generate-svg/_fixtures/missing-geometry.json` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/generate-svg/_fixtures/sectional.json` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/generate-svg/_fixtures/side-table.json` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/generate-svg/pipelineCore.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/generate-svg/svgo.config.cjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/generate-visual-audit-report.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/generate-vitest-report.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/generate_blocks.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/launch-smoke.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/lib/assetPathMapTools.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/lib/cdnAssetResolver.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/lib/exportMarketingCopy.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/lib/r2Catalog.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/lib/recoveryClassify.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/lib/repoRoot.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/lib/repoRoot.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/lib/resolvePgDump.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/lib/scriptEnv.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/lib/siteUiRouteSources.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/lib/vitest-excludes.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/marketing-ui-audit.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/merge-recovery-into-majors.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/migrate-svg-catalog-to-png.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/mirror-assets-to-r2.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/mobile-canvas-share.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/operations-review/alignmentComparator.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/operations-review/authorizationGuard.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/operations-review/entryPoint.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/operations-review/extractors/databases.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/operations-review/extractors/monitoring.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/operations-review/extractors/r2.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/operations-review/extractors/vercel.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/operations-review/extractors/worker.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/operations-review/index.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/operations-review/models.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/operations-review/recoveryPlanner.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/operations-review/renderer.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/operations-review/riskPrioritizer.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/operations-review/sourceAdapter.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/ops-command-registry.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/organize-catalog-images.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/planner-lift-project-trees.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/playwright-dev-lock.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/pushSvgCatalogToDb.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/render-catalog-qa-sheet.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/repo_backup_upload_r2.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/responsive-audit.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/reverse-asset-paths.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/run-admin-production-auth-smoke.ps1` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/run-admin-retire-restore-canvas.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/run-full-vitest.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/run-ops.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/scan-boundaries.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/scan-hardcoding.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/seed-block-descriptors.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/seed.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/seed_configurator_catalog.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/seed_data.sql` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/seed_furniture_catalog.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/seed_planner_managed_catalog.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-page-audit.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/adapters.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/artifactPaths.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/cli.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/config.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/discovery.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/index.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/manifests.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/profiles.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/run-config.json` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/runIdentity.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/schemas.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/wave.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/wave0.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/wave1-foundations.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/wave1-journeys.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/wave1-links.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/wave1-navigation.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/wave1-states.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/wave1-static-batch.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/wave1.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/wave2-surfaces.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/wave3-partitions.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/wave3-records.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/wave5-completion-proof.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/wave5-handoffs.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/site-ui-content-links-audit/wave5-reconcile.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/smoke-svg-fixtures.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/sync-deferred-locale-messages.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/sync-descriptor-svgs.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/sync-github-backup-secrets.ps1` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/sync-hi-wave1-messages.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/sync-marketing-i18n-messages.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/sync-missing-alt-text.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/sync-token-pairs.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/syncClientLogosFromR2.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/syncVendorCdnAssets.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/translate-deferred-marketing-flat.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/trim-catalog.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/tsconfig.json` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/ui-polish-pass1-audit.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/uploadCdnAssets.ts` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/verify-asset-decode.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `scripts/verify-png-release.mjs` | read-full | scripts | FreshScriptsAssets | none |
| `tech-docs-generator/README.md` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/index.html` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/package.json` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/public/favicon.ico` | failed | tech-docs | FreshScriptsAssets | S5 |
| `tech-docs-generator/public/icon.png` | binary-validated | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/public/images/brand/logo-sharp-white.png` | binary-validated | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/public/images/brand/logo-sharp.png` | binary-validated | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/public/logo-v2.webp` | binary-validated | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/build-gaps.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/check-coverage.d.mts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/check-coverage.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/check-renderer-parity.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/check-theme-alignment.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/check.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/emit-renderer-data.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/extract-ai.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/extract-api.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/extract-ci.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/extract-commands.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/extract-database.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/extract-dependabot.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/extract-dependencies.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/extract-deployment.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/extract-docs-health.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/extract-environment.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/extract-failures-status.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/extract-features.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/extract-repo-graph.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/extract-route-domains.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/extract-routes.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/extract-runner-selection.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/extract-theme.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/fake-test-audit.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/filesystem.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/gate.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/generate-all.d.mts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/generate-all.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/generate-coverage-report.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/generate-page-component-graph.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/generate.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/graph-impact.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/hardcoding-guard.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/inventory.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/live-regeneration.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/model.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/normalize.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/normalized-record.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/output-contract.d.mts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/output-contract.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/publish-all.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/publish-generated-tree.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/render-json.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/render-markdown.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/render-repository-map.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/render-search.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/renderer-data.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/resolve-admin-supabase-env.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/schema.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/source-policy.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/stage-vercel-output.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/sync-css.mjs` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/uiOnly-allowlist.json` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/scripts/vite-plugin-repo-live.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/App.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/auth/AuthGate.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/auth/AuthProvider.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/auth/AuthScreenShell.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/auth/LoginPage.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/components/BackToTop.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/components/Breadcrumbs.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/components/CodeBlock.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/components/CollapsibleSection.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/components/CommandPalette.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/components/CopyButton.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/components/GeneratedDataTables.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/components/GeneratedDomainSection.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/components/GeneratedStatusCard.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/components/LiveRepoSection.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/components/MermaidDiagram.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/components/ReadingProgress.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/components/SearchResults.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/components/Sidebar.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/components/TableOfContents.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/components/Tooltip.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/activeBlockers.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/apiData.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/architectureData.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/architectureDocsData.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/codeOrganizationData.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/databaseBoundaries.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/databaseData.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/deploymentData.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/featuresData.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/navigation.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/overviewData.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/overviewSummary.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/performanceData.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/productSurfaces.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/routeDomainTypes.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/securityData.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/snapshot.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/techStack.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/testingData.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/data/workflowsData.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/hooks/useSearch.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/index.css` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/lib/authEnv.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/lib/authRoles.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/lib/supabaseClient.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/main.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/pages/ApiDesign.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/pages/Architecture.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/pages/CodeOrganization.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/pages/Database.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/pages/Deployment.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/pages/Features.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/pages/Overview.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/pages/Performance.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/pages/Security.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/pages/TechStack.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/pages/Testing.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/pages/Workflows.tsx` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/styles/README.md` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/styles/index.css` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/types/index.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/src/vite-env.d.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/tsconfig.json` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/vercel.json` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/vite.config.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/vitest.config.ts` | read-full | tech-docs | FreshScriptsAssets | none |
| `tech-docs-generator/vitest.probe.mts` | read-full | tech-docs | FreshScriptsAssets | none |
| `workers/oando-worker-proxy/README.md` | read-full | workers | FreshScriptsAssets | none |
| `workers/oando-worker-proxy/package-lock.json` | read-full | workers | FreshScriptsAssets | none |
| `workers/oando-worker-proxy/package.json` | read-full | workers | FreshScriptsAssets | none |
| `workers/oando-worker-proxy/src/cachePolicy.js` | read-full | workers | FreshScriptsAssets | none |
| `workers/oando-worker-proxy/src/index.js` | read-full | workers | FreshScriptsAssets | none |
| `workers/oando-worker-proxy/wrangler.toml` | read-full | workers | FreshScriptsAssets | none |
