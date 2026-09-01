# 26 — CI, Scripts Orphans & Supabase Edge Function

## 1. `.github/` (4 workflows + dependabot)

- `release-gate.yml` — PR → `release:gate:fast`, push main → `release:gate:core`, browser matrix on both; matches package.json; every referenced script exists. `site-ui.yml`, `supabase-backup-r2.yml` (cron 02:15, `db_backup_upload_r2.ts` exists), `tech-docs.yml` — all wired correctly.

| # | Severity | Finding |
|---|----------|---------|
| 26.1 | **Med** | `dependabot.yml` is npm-only — **no `github-actions` ecosystem entry**, so actions/checkout, upload-artifact, setup-node, pnpm/action-setup are never updated. |
| 26.2 | Low | No `permissions:` hardening block in any workflow. |
| 26.3 | Low | ~40 secrets injected as workflow-level env (incl. `SUPABASE_SERVICE_ROLE_KEY`); empty-string env when unset can mask missing config instead of failing loudly. |
| 26.4 | Low | Browser matrix runs on every PR (duplicate cost); `tech-docs.yml` artifact path `generated-documents/site/` may not exist → silent empty artifact (`if-no-files-found` unset). |

## 2. Root `scripts/` zero-reference triage (static, no git)

**Truly orphaned (no live callers):** `trim-catalog.mjs`, `contact-sheet.mjs`, `detect-corrupt-images.mjs`, `ui-polish-pass1-audit.mjs`, `syncClientLogosFromR2.ts`, `pushSvgCatalogToDb.ts` (superseded by PNG pipeline), `generate-route-classification.mjs`, `five-majors-hash-dedup.mjs`, `mobile-canvas-share.mjs`, `configure-cf-security-txt.ps1`, `verify-asset-decode.mjs`, `check-supabase-missing-images.mjs` (logic mirrored into `audit-broken-db-image-paths.mjs`).

**Closed orphan cluster (reference only each other):** `asset-path-map.mjs`, `audit-disk-image-twins.mjs`, `delete-twin-images.mjs`, `audit-broken-db-image-paths.mjs`, `apply-db-image-path-rewrite.mjs`, `fix-asset-paths.mjs`, `reverse-asset-paths.mjs`, `mirror-assets-to-r2.mjs` + `scripts/lib/assetPathMapTools.mjs` — one-off DB/disk image-path recovery tooling, nothing wires it in. (~18 files total; deletion candidates, user-confirmed per repo rule.)

**False alarms (referenced, keep):** `coverage-policy/metrics/verify-png-release/migrate-svg-catalog-to-png` (unit-tested), `playwright-dev-lock.mjs` (e2e teardown), `seed_data.sql`, `catalog-seating.json`, `ops-command-registry.mjs`, `marketing-ui-audit.mjs` (site-ui audit adapter), retire-restore chain scripts.

## 3. `site/platform/supabase/functions/assistant-chat/`

- Auth: user JWT via anon client; office access + AI quota via RLS (`can_use_ai_for_office` RPC); service-role only for `ai_threads`/`ai_messages`. CORS: strict origin allowlist, no wildcards, `Vary: Origin`. Secrets: none hardcoded; OpenAI errors logged server-side, generic 502 out. Size caps: context 16 KB, message 4,000 chars.

| # | Severity | Finding |
|---|----------|---------|
| 26.5 | **Med** | **Thread ownership not checked** — any user with RLS access to an office can read/append to *any* thread in that office (only `office_id` equality, `created_by` ignored). In-office data leak otherwise. |
| 26.6 | **Med** | OpenAI call sends office context + 14-message history with no `store: false` / PII handling → third-party retention of user content. |
| 26.7 | Med(-low) | The `fetch` to api.openai.com (line 246) has **no try/catch, no AbortController/timeout** — network throw → bare 500; hang → pins the function. |
| 26.8 | Low | User message persisted *before* the OpenAI call → provider failure leaves stored user msg with no reply (retry duplicates rows). No streaming (single buffered JSON, `max_output_tokens: 600`). Deno deps pinned by URL, old versions (`std@0.208.0`, supabase-js 2.39.7 vs repo 2.112.4), no integrity pinning, no tests. |

## 4. `run-ops.mjs` COMMANDS map — clean

All ~90 entries resolve to existing files. Zero broken entries.
