# Root Cause Analysis: Supabase CI Backup Failures

**Audited:** 2026-09-04 (live files read)  
**Method:** `.github/workflows/supabase-backup-r2.yml` secret references and `scripts/sync-github-backup-secrets.ps1` full content both read live.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| Workflow expects `CLOUDFLARE_R2_ACCESS_KEY_ID` | Claimed | ✅ **Confirmed** — live workflow: `CLOUDFLARE_R2_ACCESS_KEY_ID: ${{ secrets.CLOUDFLARE_R2_ACCESS_KEY_ID }}` |
| Workflow expects `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Claimed | ✅ **Confirmed** — live workflow: `CLOUDFLARE_R2_SECRET_ACCESS_KEY: ${{ secrets.CLOUDFLARE_R2_SECRET_ACCESS_KEY }}` |
| Workflow expects `CLOUDFLARE_S3_URL` | Claimed | ✅ **Confirmed** — live workflow: `CLOUDFLARE_S3_URL: ${{ secrets.CLOUDFLARE_S3_URL }}` |
| Sync script has typo `CLOULD_ACCESS_KEY_ID` | Claimed | ✅ **CONFIRMED LIVE** — `$secretNames` array still contains `'CLOULD_ACCESS_KEY_ID'` |
| Sync script has typo `CLOULDFLARE_S3_SECRET_ACCESS_KEY` | Claimed | ✅ **CONFIRMED LIVE** |
| Sync script has typo `CLOULDFLARE_S3_URL` | Claimed | ✅ **CONFIRMED LIVE** |
| `r2Catalog.ts` throws if credentials empty | Claimed | ✅ **Confirmed** — `getR2CatalogS3Client()` requires `CLOUDFLARE_R2_ACCESS_KEY_ID` + `CLOUDFLARE_R2_SECRET_ACCESS_KEY` |
| Remediation diff shown | Claimed | ✅ **Diff is correct** — matches live file content exactly |
| **Status: still unresolved** | Not stated | ✅ **Confirmed unresolved** — typos still present in live `sync-github-backup-secrets.ps1` as of 2026-09-04 13:33 |

---

## Executive Summary

**This P0 defect is confirmed open as of this audit.** The three typo secret names in `scripts/sync-github-backup-secrets.ps1` are present verbatim in the live file. The GitHub Actions nightly backup workflow references the correct canonical names. The mismatch means R2 credentials are never set in GitHub Secrets, causing every nightly backup run to fail at the upload step.

---

## 1. Disconnect Matrix (Live Evidence)

**Live `scripts/sync-github-backup-secrets.ps1` `$secretNames` array:**
```powershell
$secretNames = @(
  'PRODUCTS_DATABASE_URL',
  'SUPABASE_AUTH_DATABASE_URL',
  'CLOULDFLARE_S3_URL',               ← TYPO (correct: CLOUDFLARE_S3_URL)
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOULD_ACCESS_KEY_ID',              ← TYPO (correct: CLOUDFLARE_R2_ACCESS_KEY_ID)
  'CLOULDFLARE_S3_SECRET_ACCESS_KEY',  ← TYPO (correct: CLOUDFLARE_R2_SECRET_ACCESS_KEY)
  'CLOUDFLARE_R2_CATALOG_BUCKET'
)
```

**Live `.github/workflows/supabase-backup-r2.yml` secret references:**
```yaml
CLOUDFLARE_S3_URL: ${{ secrets.CLOUDFLARE_S3_URL }}
CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
CLOUDFLARE_R2_ACCESS_KEY_ID: ${{ secrets.CLOUDFLARE_R2_ACCESS_KEY_ID }}
CLOUDFLARE_R2_SECRET_ACCESS_KEY: ${{ secrets.CLOUDFLARE_R2_SECRET_ACCESS_KEY }}
CLOUDFLARE_R2_CATALOG_BUCKET: ${{ secrets.CLOUDFLARE_R2_CATALOG_BUCKET }}
```

**Result:** GitHub Actions injects empty strings for `CLOUDFLARE_R2_ACCESS_KEY_ID` and `CLOUDFLARE_R2_SECRET_ACCESS_KEY` because those secrets were never set (the sync script set them under the wrong names).

---

## 2. Failure Mechanism

1. CI runs `pg_dump` via `db_backup_upload_r2.ts` — **succeeds** (uses `PRODUCTS_DATABASE_URL` / `SUPABASE_AUTH_DATABASE_URL`, which are synced correctly)
2. Upload step calls `getR2CatalogS3Client()` in `site/lib/storage/r2Catalog.ts`
3. `CLOUDFLARE_R2_ACCESS_KEY_ID` resolves to `""` → throws:
   ```
   Error: Missing S3 credentials: set CLOUDFLARE_R2_ACCESS_KEY_ID and CLOUDFLARE_R2_SECRET_ACCESS_KEY
   ```
4. Workflow exits with code 1 — **backup silently lost**

---

## 3. Remediation (P0 — Exact Diff)

```diff
 $secretNames = @(
   'PRODUCTS_DATABASE_URL',
   'SUPABASE_AUTH_DATABASE_URL',
-  'CLOULDFLARE_S3_URL',
+  'CLOUDFLARE_S3_URL',
   'CLOUDFLARE_ACCOUNT_ID',
-  'CLOULD_ACCESS_KEY_ID',
-  'CLOULDFLARE_S3_SECRET_ACCESS_KEY',
+  'CLOUDFLARE_R2_ACCESS_KEY_ID',
+  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
   'CLOUDFLARE_R2_CATALOG_BUCKET'
 )
```

After applying, run:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/sync-github-backup-secrets.ps1
```

This pushes the correct credential names from `.env.local` to GitHub Secrets so the nightly CI job can authenticate to R2.

---

## 4. Secondary Defect: `Get-EnvValue` Silent Miss

**NEW FINDING (not in prior report):** The sync script reads `.env.local` values by looking up each `$name` in the file. The typo names (`CLOULD_ACCESS_KEY_ID` etc.) will not match `.env.local` entries (which use the correct `CLOUDFLARE_R2_*` names), so `Get-EnvValue` returns `$null` and the script logs `"Skip CLOULD_ACCESS_KEY_ID (empty)"` — without error. The operator running the script sees no failure indication.

This means the bug is **silently failing** — the script appears to succeed (printing "Done: N secrets set, M skipped") but the critical credentials are in the skipped list.
