# Root Cause Analysis: Supabase CI Backup Failures

**Status:** **RESOLVED IN REPOSITORY CODE**  
**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Affected Subsystem:** Nightly automated Supabase database backups to Cloudflare R2 (`.github/workflows/supabase-backup-r2.yml`).

---

## 1. Executive Summary

Nightly GitHub Actions runs of `supabase-backup-r2.yml` previously failed during the R2 artifact upload stage. The root cause was identified as a variable name disconnect between the PowerShell synchronization script ([`scripts/sync-github-backup-secrets.ps1`](file:///d:/23082026/scripts/sync-github-backup-secrets.ps1)) and the GitHub Actions workflow definition ([`.github/workflows/supabase-backup-r2.yml`](file:///d:/23082026/.github/workflows/supabase-backup-r2.yml)).

The sync script set secrets using misspelled and deprecated identifiers, causing GitHub Actions to evaluate the canonical R2 secrets as empty strings during backup execution.

**Remediation Status:** The sync script has been corrected with canonical secret names in repository code.

---

## 2. Defect Analysis & Variable Disconnect

### 2.1 The Disconnect Matrix

| Secret Purpose | Workflow Expectation (`.github/workflows/supabase-backup-r2.yml`) | Old Sync Script Variable (`scripts/sync-github-backup-secrets.ps1`) | Disconnect Nature |
| :--- | :--- | :--- | :--- |
| **R2 Access Key** | `CLOUDFLARE_R2_ACCESS_KEY_ID` | `CLOULD_ACCESS_KEY_ID` | Typo in sync script |
| **R2 Secret Key** | `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | `CLOULDFLARE_S3_SECRET_ACCESS_KEY` | Typo & legacy S3 naming |
| **S3 Endpoint URL**| `CLOUDFLARE_S3_URL` | `CLOULDFLARE_S3_URL` | Typo in sync script |
| **Database URLs** | `PRODUCTS_DATABASE_URL`, `SUPABASE_AUTH_DATABASE_URL` | Same | Correct ✅ |
| **R2 Bucket** | `CLOUDFLARE_R2_CATALOG_BUCKET` | Same | Correct ✅ |

### 2.2 Execution Failure Sequence
1. Step 1: `pg_dump` on Products and Admin DB executed successfully using `PRODUCTS_DATABASE_URL` and `SUPABASE_AUTH_DATABASE_URL`.
2. Step 2: Backup compression created `.sql.gz` archives in runner temporary storage.
3. Step 3: Node upload script (`scripts/db_backup_upload_r2.ts`) initialized S3 client via `getR2CatalogS3Client()`.
4. Step 4: The client constructor threw an error because `process.env.CLOUDFLARE_R2_ACCESS_KEY_ID` was empty string (`""`), aborting the backup run before files reached Cloudflare R2 bucket `oando-asset-cdn`.

---

## 3. Implemented Code Fix (Verified Live)

In [`scripts/sync-github-backup-secrets.ps1`](file:///d:/23082026/scripts/sync-github-backup-secrets.ps1), lines 10–18:

```powershell
$secretNames = @(
  'PRODUCTS_DATABASE_URL',
  'SUPABASE_AUTH_DATABASE_URL',
  'CLOUDFLARE_S3_URL',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_CATALOG_BUCKET'
)
```

Every name now matches the workflow file verbatim.

---

## 4. Verification & Deployment Protocol

Operators with GitHub CLI (`gh`) credentials can propagate the local secrets to GitHub:

```powershell
# 1. Ensure .env.local has valid credentials
# 2. Run the synchronization command
pnpm --filter oando-site run backup:github-secrets:sync

# 3. Verify secrets exist in GitHub repository
gh secret list

# 4. Trigger manual workflow test run
gh workflow run "Nightly Supabase Database Backup to R2"
```

### Acceptance Criteria:
- `gh secret list` shows all 7 canonical secrets set.
- Workflow run succeeds with exit code 0.
- Daily backup archive is visible in Cloudflare R2 bucket `oando-asset-cdn`.
