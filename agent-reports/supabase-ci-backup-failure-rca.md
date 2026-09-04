# Root Cause Analysis: Supabase CI Backup Failures

**Date:** 2026-09-04  
**Target:** GitHub Actions Workflow [`.github/workflows/supabase-backup-r2.yml`](file:///d:/23082026/.github/workflows/supabase-backup-r2.yml)  
**Command:** `pnpm run ops backup:supabase:r2`  
**Classification:** P0 Infrastructure Defect (Secret Resolution Mismatch)

---

## Executive Summary

The nightly GitHub Actions Supabase backup workflow fails with missing authentication errors because of an **environment variable naming mismatch** between the sync script [`scripts/sync-github-backup-secrets.ps1`](file:///d:/23082026/scripts/sync-github-backup-secrets.ps1) and the GitHub Actions workflow definition [`.github/workflows/supabase-backup-r2.yml`](file:///d:/23082026/.github/workflows/supabase-backup-r2.yml).

The sync script pushes typo-ridden secret names (`CLOULD_ACCESS_KEY_ID`, `CLOULDFLARE_S3_SECRET_ACCESS_KEY`), leaving the canonical secrets expected by the CI runner completely empty (`null`).

---

## 1. Disconnect Matrix

| Workflow Secret Reference (`.github/workflows/supabase-backup-r2.yml:34-36`) | Sync Script Target (`scripts/sync-github-backup-secrets.ps1:13-16`) | Result in CI Execution |
| :--- | :--- | :--- |
| `${{ secrets.CLOUDFLARE_R2_ACCESS_KEY_ID }}` | `'CLOULD_ACCESS_KEY_ID'` *(Typo)* | Evaluates to **`""` (Empty string)** |
| `${{ secrets.CLOUDFLARE_R2_SECRET_ACCESS_KEY }}` | `'CLOULDFLARE_S3_SECRET_ACCESS_KEY'` *(Typo)* | Evaluates to **`""` (Empty string)** |
| `${{ secrets.CLOUDFLARE_S3_URL }}` | `'CLOULDFLARE_S3_URL'` *(Typo)* | Evaluates to **`""` (Empty string)** |

---

## 2. Failure Mechanism in Runtime

1. The GitHub Actions job runs on `ubuntu-latest` and successfully executes `pg_dump` against `PRODUCTS_DATABASE_URL` and `SUPABASE_AUTH_DATABASE_URL`.
2. When the upload step in [`scripts/db_backup_upload_r2.ts`](file:///d:/23082026/scripts/db_backup_upload_r2.ts) invokes [`getR2CatalogS3Client()`](file:///d:/23082026/site/lib/storage/r2Catalog.ts#L178):
   ```typescript
   // site/lib/storage/r2Catalog.ts lines 180-184
   const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
   const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

   if (!accessKeyId || !secretAccessKey) {
     throw new Error("Missing S3 credentials: set CLOUDFLARE_R2_ACCESS_KEY_ID and CLOUDFLARE_R2_SECRET_ACCESS_KEY");
   }
   ```
3. Because GitHub Actions injected an empty string for those keys, the check throws immediately:
   `Error: Missing S3 credentials: set CLOUDFLARE_R2_ACCESS_KEY_ID and CLOUDFLARE_R2_SECRET_ACCESS_KEY`
4. The workflow aborts with Exit Code 1.

---

## 3. Remediation Action (P0)

Update [`scripts/sync-github-backup-secrets.ps1`](file:///d:/23082026/scripts/sync-github-backup-secrets.ps1#L10-L18) to sync canonical secret names:

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

After updating, execute:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/sync-github-backup-secrets.ps1
```
This pushes the real Cloudflare R2 credentials from `.env.local` to GitHub repository secrets, allowing nightly CI backups to succeed.
