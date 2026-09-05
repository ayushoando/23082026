# Operational Runbook: Blocker Clearance & RCA Protocol

**Document Version:** 2.0.0  
**Status:** Verified Operational Runbook  
**Last Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](../../AGENTS.md) §1, §2, §6, [`Failures.md`](../../Failures.md), and [`Testing-handbook.md`](../../Testing-handbook.md)  
**Target Ledger:** [`Failures.md`](../../Failures.md)  
**Execution Context:** Monorepo Root (`d:\23082026`)

---

## 1. Executive Summary & Purpose

This operational runbook provides procedures for reproducing and clearing the current blockers linked from [`Failures.md`](../../Failures.md), describes independent Supabase backup operations, and defines the release-gate sequence.

The repository paths were inspected on September 5, 2026. Treat commands and historical RCA as guidance only; `Failures.md` and fresh authorized output determine current status.

### Current Ledger Status

Do not duplicate blocker identifiers or statuses here. Read [`Failures.md`](../../Failures.md) before running any procedure. At this revision, it records three active blockers: a test-lane blocker, a local-browser-origin blocker, and `AUTH-LOOP-03` (/access redirect loop & sign-out crash); archived cleared incidents are intentionally omitted from this runbook.

---

## 2. Test-Lane Blocker

### 2.1 Current Status & Remaining Action
The last full result recorded in [`Failures.md`](../../Failures.md) has four failing files. The later authorized recheck of exactly those files passed `htmlSitemap.test.ts`, `siteSeoContract.test.ts`, and `providers.test.ts`, but `siteSeoAcceptance.test.ts` still failed because the footer expects `/tools` to be `public` while the route classifier returns `not-found`.

The canonical host had returned `404` for `/tools` and its two calculator paths. Do not add pages, SEO titles, or sitemap URLs to satisfy the test. Obtain a product decision to either remove the public `/tools` references or restore a verified public `200` route. Then run the affected test followed by the authorized full suite and gate. An archived `results/tests/summary.json` cannot clear the ledger row.

---

### 2.2 Archived Diagnostic: PriceBook Currency Tests (Not an Active Blocker)

This historical diagnostic is retained for context only. It is not named in the current [`Failures.md`](../../Failures.md) ledger and must not broaden work on the active test-lane blocker.

#### Root Cause Analysis:
The price book subsystem enforces strict contract invariants in `site/features/admin/pricing/`:
1. **Currency Allowlist Invariant:** In `site/features/admin/pricing/emitPriceBookContract.ts` (lines 27–31), `CURRENCIES` is defined as:
   ```typescript
   const CURRENCIES = new Set<PriceBookCurrency>(["INR", "USD"]);
   function isCurrency(value: string): value is PriceBookCurrency {
     return CURRENCIES.has(value as PriceBookCurrency);
   }
   ```
2. **Strict Rule Normalization:** In `normalizeRule()` (lines 44–48), any line rule whose `currency` is not in `CURRENCIES` (e.g. lowercase `"inr"`, `"EUR"`, or un-trimmed whitespace) evaluates to `null` and is dropped.
3. **Contract Emission Failure:** If a version has an invalid currency code or if all rules are filtered out, `emitPriceBookContract()` returns `null` (line 85: `if (emittedVersions.length === 0) return null;`).
4. **Activation Abort:** In `site/features/admin/pricing/priceBookService.ts` (lines 125–133), when `emitPriceBookContract` returns `null`, `activatePriceBookVersion` fails closed:
   ```typescript
   const contract = emitPriceBookContract(nextBook, nextVersions);
   if (!contract) {
     return {
       ok: false,
       action,
       previousActiveVersionId: previousActive,
       error: "Activated book failed contract emission",
     };
   }
   ```
5. **Test Failure Origin:** When test suites (`tests/unit/priceBookService.test.ts` or `tests/unit/features/admin/pricing/priceBookService.test.ts`) construct mock version rows or line rules with lowercase `"inr"` or mismatched currency codes, `activatePriceBookVersion` returns `ok: false`, causing assertions like `expect(activated.ok).toBe(true)` to fail.

#### Preflight Check:
Verify the test file location and run targeted vitest:
```powershell
# Verify test file exists
Test-Path tests/unit/features/admin/pricing/priceBookService.test.ts

# Run targeted vitest invocation
pnpm exec vitest run tests/unit/features/admin/pricing/priceBookService.test.ts
```

#### Step-by-Step Resolution (Zero Business Logic Changes):
**DO NOT modify business logic** in `site/features/admin/pricing/priceBookService.ts` or `site/features/admin/pricing/emitPriceBookContract.ts`. The server-side currency validation and fail-closed rollbacks are load-bearing security controls.

1. **Inspect Test Fixtures:**
   Open `tests/unit/features/admin/pricing/priceBookService.test.ts` and inspect all seed rows and rules:
   - Check `currency` fields on all `PriceBookVersionRow` objects: must be strictly `"INR"` or `"USD"`.
   - Check `currency` fields on all `PriceBookLineRule` objects: must be strictly `"INR"` or `"USD"`.
2. **Align Test Expectations:**
   Ensure test assertions expect valid uppercase ISO 4217 strings:
   ```typescript
   const rule = {
     sku: "OFL-TBL-001",
     unitPriceMinor: 1_000_00,
     currency: "INR" as const,
     uom: "each" as const,
   };
   ```
3. **Verify Targeted Vitest Passes:**
   ```powershell
   pnpm exec vitest run tests/unit/features/admin/pricing/priceBookService.test.ts
   ```
   *Expected Output:* All test suites pass (exit code 0).

---

### 2.3 Historical Four-File Inventory and Current Reconciliation

The last full test result recorded four failing files. This list is a diagnostic inventory, not a standing implementation instruction. The later targeted recheck passed the HTML sitemap, SEO contract, and provider tests; only the footer/classification assertion remains.

#### 1. `tests/unit/features/site/data/htmlSitemap.test.ts`
- **Target Command:**
  ```powershell
  pnpm exec vitest run tests/unit/features/site/data/htmlSitemap.test.ts
  ```
- **Diagnostic Area:** `buildSitemapSections()` and `getHtmlSitemapHrefs()`.
- **Historical failure mechanism:** A public indexable static route may be absent from the expected sitemap section.
- **Current guardrail:** Do not apply this remedy to `/tools` while the canonical host returns `404`; a `not-found` route belongs in neither public sitemap.

#### 2. `tests/unit/features/site/data/siteSeoAcceptance.test.ts`
- **Target Command:**
  ```powershell
  pnpm exec vitest run tests/unit/features/site/data/siteSeoAcceptance.test.ts
  ```
- **Current diagnostic area:** Footer-link route lifecycle agreement.
- **Current failure mechanism:** The footer expects `/tools` to be `public`, while `routeClassification.ts` reports `not-found`.
- **Resolution prerequisite:** Obtain the product decision to retire public references or restore a verified public `200`; do not alter canonical URLs, metadata, or sitemap contents as a substitute.

#### 3. `tests/unit/features/site/data/siteSeoContract.test.ts`
- **Target Command:**
  ```powershell
  pnpm exec vitest run tests/unit/features/site/data/siteSeoContract.test.ts
  ```
- **Diagnostic Area:** Route metadata contracts for `/products`, `/tools`, and calculators.
- **Common Failure Mechanism:** Missing `title` or `description` templates for dynamically generated routes.
- **Remediation:** Ensure `routeMetadata.ts` supplies fallback title and description strings for all active routes.

#### 4. `tests/unit/lib/ai/mastra/providers.test.ts`
- **Target Command:**
  ```powershell
  pnpm exec vitest run tests/unit/lib/ai/mastra/providers.test.ts
  ```
- **Diagnostic Area:** `APPROVED_PROVIDER_MODELS` and `isAllowlisted()`.
- **Common Failure Mechanism:** Provider model chain ordering (`gemini-2.5-flash` vs `openrouter/auto`) or mock environment variables in `env.server`.
- **Remediation:** Check mock `env.server` definitions at the top of the test file; ensure `APPROVED_PROVIDER_MODELS` contains the 5 approved pairs (`gemini/gemini`, `openrouter/openrouter`, `openrouter/openrouter-backup`, `openai/openai`, `bedrock/bedrock`).

---

### 2.4 Full Vitest Two-Lane Verification Command
Once individual test failures are resolved, execute the full two-lane test runner:
```powershell
pnpm run test
```
*Architecture Note:* `scripts/run-full-vitest.mjs` runs **two sequential lanes**:
- **Lane 1:** `tests/vitest.config.ts` (Application unit/integration tests with `happy-dom`).
- **Intermediate:** `tech-docs-generator/scripts/generate-all.mjs` (Generates dynamic AST data).
- **Lane 2:** `tests/vitest.tech-docs.config.ts` (Tech-Docs suite in serial isolation, `maxWorkers: 1`).

**Exit Requirement:** Both lanes must exit with code 0.

---

## 3. Browser-Origin Blocker

### 3.1 Problem Description & Impact
The Playwright browser walk cannot start because the local application is unavailable, returning `net::ERR_CONNECTION_REFUSED` at `http://localhost:3000`. No screenshot baselines or browser route audits can be captured.

---

### 3.2 Strict Invariant: `localhost:3000` ONLY (Strict Ban on `127.0.0.1`)
Per [`AGENTS.md`](../../AGENTS.md) §2:
> **“Use `http://localhost:3000` for UI work; never use `127.0.0.1`.”**

**Rationale:**
- Cookie attributes (`SameSite`, `Domain`), Supabase Auth callback redirects, and NextAuth session cookies are pinned to the hostname `localhost`.
- `config/build/playwright.config.ts` enforces `playwrightBaseURL.cjs`, which strictly maps to `http://localhost:3000`.
- Calling `127.0.0.1:3000` causes CORS rejections, cookie stripping, and authentication session drops.

---

### 3.3 Preflight Checks
Before launching the server, execute these preflight checks:

#### 1. Port 3000 Availability Check:
Ensure no zombie Node, Next.js, or Docker process is holding port 3000:
```powershell
# PowerShell Port 3000 check
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Format-Table OwningProcess, State, LocalAddress, LocalPort

# If occupied, terminate the rogue process (replace <PID>):
Stop-Process -Id <PID> -Force
```

#### 2. Environment File Check:
Confirm `.env.local` exists in the repository root and contains required local development keys:
```powershell
Test-Path .env.local
Test-Path site/.env.local
```
*(If missing, run `pnpm run env:sync` to synchronize from template).*

---

### 3.4 Dev Server Launch & Browser Gate Execution

#### Step 1: Start the Local Development Server
In a dedicated terminal, launch the Next.js development server:
```powershell
pnpm run dev
```
*(Wait until terminal logs indicate `Ready in X ms` at `http://localhost:3000`).*

*Alternative (Production Standalone Mode):*
If testing against production build output:
```powershell
pnpm run build
node scripts/general/startStandalone.cjs
```

#### Step 2: Probe Connectivity
In a second terminal, verify that `http://localhost:3000` responds with HTTP 200:
```powershell
# Probe via curl
curl -I http://localhost:3000

# Or via PowerShell
Test-NetConnection -ComputerName localhost -Port 3000
```

#### Step 3: Run the Playwright Browser Gate
Execute the browser walk across the full project matrix:
```powershell
pnpm run test:browser:gate
```
*Project Matrix (from `tests/manifests/visual-baselines.json`):*
- **3 browsers:** `chromium`, `firefox`, `webkit`
- **3 viewport tiers per browser:** `desktop` (1440×900), `tablet` (1024×768), `mobile` (390×844)
- **= 9 total projects** × **8 gate specs** (`playwright-gate-specs.json`) = 72 spec runs

**Exit Requirement:** Browser gate must pass with 0 errors and all route screenshots captured.

---

## 4. Authentication Loop & Client Sign-Out Blocker (`AUTH-LOOP-03`)

### 4.1 Symptom & Forensic Root Cause
1. **`/access` 307 Loop:** `site/proxy.ts:442-454` uses `hasSessionAuthCookies()` to bounce requests containing `sb-*-auth-token` cookies directly to `/dashboard`. When tokens are expired or invalid, `site/lib/auth/session.ts` rejects them and bounces back to `/access?next=/dashboard`, triggering `ERR_TOO_MANY_REDIRECTS`.
2. **Local Dev Lockout:** `DEV_AUTH_BYPASS=1` unconditionally redirects `/access` to `/dashboard`, locking developers out from inspecting or testing the `/access` interface.
3. **Client Sign-Out Crash:** In `DashboardClient.tsx:142`, `createAuthClient().auth.signOut()` tries to read server-only `NEXT_ADMIN_SUPABASE_URL`, crashing the browser bundle.

### 4.2 Remediation & Clearance Procedure
1. In `site/proxy.ts`, do not auto-redirect visits to `/access` or `/login` based solely on unverified cookie presence; provide an explicit bypass escape for `DEV_AUTH_BYPASS=1`.
2. In `DashboardClient.tsx`, replace client `createAuthClient().auth.signOut()` with the server action `signOutFromSupabase()`.
3. In browser at `http://localhost:3000`:
   - Verify `/access` renders when session cookies are absent or expired.
   - Verify signing out from `/dashboard` redirects smoothly to `/access` without console errors.
4. Delete the `AUTH-LOOP-03` row from [`Failures.md`](../../Failures.md).

---

## 5. Archived Operational Incidents

To prevent duplicate investigations by operators or automated agents, the following blockers are confirmed **RESOLVED and CLEARED**:

### 4.1 Cloudflare Token Scope
- **Previous Issue:** Worker deployment failed due to missing R2 bucket read/write permissions on the Cloudflare API token.
- **Resolution Applied:** Cloudflare API token was granted `Workers Scripts:Edit`, `Workers R2 Storage:Edit`, and `Workers KV Storage:Edit`. Token verified and updated in Cloudflare secrets and `.env.local`.
- **Status:** **CLEARED.** Removed from `Failures.md`. Do not re-open.

### 4.2 Gate Hook Authorization
- **Previous Issue:** Pre-commit/pre-push hooks halted on unverified execution flags.
- **Resolution Applied:** Hook authorization scripts were reconciled with operator consent workflows.
- **Status:** **CLEARED.** Removed from `Failures.md`. Do not re-open.

---

## 5. Supabase CI Backup Failure: RCA & Remediation Procedure

### 5.1 Root Cause Analysis (RCA)
- **Incident Description:** Nightly GitHub Actions backup workflow `.github/workflows/supabase-backup-r2.yml` failed during the backup upload step.
- **Root Cause:** In older versions of `scripts/sync-github-backup-secrets.ps1`, secret names contained three typographical errors:
  - `CLOULD_ACCESS_KEY_ID` instead of `CLOUDFLARE_R2_ACCESS_KEY_ID`
  - `CLOULDFLARE_S3_SECRET_ACCESS_KEY` instead of `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
  - `CLOULDFLARE_S3_URL` instead of `CLOUDFLARE_S3_URL`
- **Result:** When `Get-EnvValue` parsed `.env.local`, it searched for the misspelled names, leaving the GitHub repository secrets unset or empty. The CI runner was unable to authenticate against Cloudflare R2 S3 endpoints.

---

### 5.2 Current Live Verification
Live inspection of `scripts/sync-github-backup-secrets.ps1` (lines 10–18) confirms the script has **ALREADY BEEN CORRECTED**:
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
In addition:
- `scripts/run-ops.mjs` line 216 wires `"backup:supabase:r2"` to `db_backup_upload_r2.ts`.
- `scripts/run-ops.mjs` line 236 wires `"backup:r2:prune"` to `prune_r2_backups.ts`.
- `.github/workflows/supabase-backup-r2.yml` runs nightly at `15 2 * * *` (02:15 UTC) with `sudo apt-get install -y postgresql-client` to ensure `pg_dump` is installed.

---

### 5.3 Operator Remediation Steps
To ensure CI backups succeed continuously, the operator must synchronize secrets and test the backup and retention pruner:

#### Step 1: Run the GitHub Secrets Synchronization Script
Execute the synchronization script using credentials from `.env.local`:
```powershell
# Execute via PowerShell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/sync-github-backup-secrets.ps1

# Or via Ops Dispatcher
pnpm run ops backup:github-secrets:sync
```

#### Step 2: Verify Secrets in GitHub Repository
Using GitHub CLI, verify that the canonical secrets are populated:
```powershell
gh secret list
```
*Confirm the presence of:*
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `PRODUCTS_DATABASE_URL`
- `SUPABASE_AUTH_DATABASE_URL`

#### Step 3: Test R2 Backup Locally (Dry Run / Probe)
Verify that local database dump and R2 upload execute cleanly:
```powershell
pnpm run ops backup:supabase:r2
```

#### Step 4: Test Backup Retention Pruner
Test the retention pruning script (retains 5 daily snapshots and 30 weekly snapshots):
```powershell
# Dry run verification
pnpm run ops backup:r2:prune -- --dry-run

# Live pruning execution
pnpm run ops backup:r2:prune
```

#### Step 5: Verify GitHub Actions Workflow Syntax
Verify that `.github/workflows/supabase-backup-r2.yml` is valid and runs both backup and retention pruning:
```powershell
git diff .github/workflows/supabase-backup-r2.yml
```

---

## 6. Full Release Gate & Blocker Removal Procedure

### 6.1 Step-by-Step Gate Execution Sequence
Follow this exact sequence to achieve full clearance:

```powershell
# 1. Preflight layout check
pnpm run check:layout

# 2. Fast development loop gate
pnpm run gate:fast

# 3. Two-lane full Vitest suite
pnpm run test

# 4. Core headless release gate
pnpm run release:gate:core

# 5. Execute browser gate with dev server running
pnpm run test:browser:gate

# 6. Full ship bar release gate
pnpm run gate
```

---

### 6.2 Exit Criteria for Updating [`Failures.md`](../../Failures.md)
Per [`AGENTS.md`](../../AGENTS.md) §1:
> *“Remove a row only after an authorized rerun observes the fix.”*

After authorized reruns observe each corresponding fix:
1. Open [`Failures.md`](../../Failures.md).
2. Remove only the row whose fresh evidence supports clearance. A full gate does not retroactively prove an unrun browser-origin check.
3. The table may be empty only when every active row has its own authorized successful evidence.
4. Run the failures validation check:
   ```powershell
   pnpm run check:failures
   ```
   *Expected Output:* `check:failures OK - Failures.md is valid`.
