# Operational Runbook: Blocker Clearance & RCA Protocol

**Document Version:** 2.0.0  
**Status:** Verified Operational Runbook  
**Last Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](../../AGENTS.md) §1, §2, §6, [`Failures.md`](../../Failures.md), and [`Testing-handbook.md`](../../Testing-handbook.md)  
**Target Ledger:** [`Failures.md`](../../Failures.md)  
**Execution Context:** Monorepo Root (`d:\23082026`)

---

## 1. Executive Summary & Purpose

This operational runbook provides exact, step-by-step instructions for clearing active repository blockers in [`Failures.md`](../../Failures.md), resolving nightly Supabase CI backup failures, and verifying that the full ship bar release gate passes cleanly.

Every procedure, command line, and verification check in this runbook has been verified against live repository code as of September 5, 2026.

### Active Ledger Status in [`Failures.md`](../../Failures.md):
| ID | Priority | Blocker Summary | Target Area |
| :--- | :---: | :--- | :--- |
| **`GATE-RECHECK-01`** | **P1 — Pending Deletion** | Tests passing (0 failures per `summary.json`); row not yet deleted from `Failures.md` | Unit & Integration Test Suites |
| **`BROWSER-ORIGIN-02`** | **P1** | Local app unavailable (`net::ERR_CONNECTION_REFUSED` at `http://localhost:3000`) | Dev Server & Playwright Browser Gate |

### Cleared Blockers (DO NOT RE-INVESTIGATE):
- **`CF-TOKEN-01`**: Cloudflare API token scope mismatch — **CLEARED** (canonical token provisioned in Cloudflare dashboard and `.env.local`; removed from `Failures.md`).
- **`GATE-AUTH-02`**: Operator execution permission floor — **CLEARED** (current-session authorization hooks verified; removed from `Failures.md`).

---

## 2. Active Blocker 1: `GATE-RECHECK-01` (Vitest Lane Failures)

### 2.1 Current Status & Remaining Action
`results/tests/summary.json` (written `2026-09-05T03:57:36Z`) confirms **0 failures** across both Vitest lanes (0/4296 Lane 1, 0/224 Lane 2). The code fixes for all 4 previously failing tests have been committed:
- `htmlSitemap.ts` — `/tools` routes registered ✅
- `siteSeoAcceptance.test.ts` — canonical URL formation correct ✅
- `siteSeoContract.ts` — `/tools` in `SEO01_STATIC_METADATA` at line 64 ✅
- `providers.test.ts` — model string `gemini-2.5-flash` at line 168 ✅

**Remaining action:** Run `pnpm run test` in the current session, observe exit code 0, then delete the `GATE-RECHECK-01` row from `Failures.md`. The §2.2–2.4 steps below document the historical RCA and are retained for reference.

---

### 2.2 Currency Code Expectation Mismatch in PriceBook Service Tests

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

### 2.3 Diagnostic & Resolution for the 4 Failing Test Suites Named in `Failures.md`

`Failures.md` specifically enumerates 4 test files that failed on `main`:

#### 1. `tests/unit/features/site/data/htmlSitemap.test.ts`
- **Target Command:**
  ```powershell
  pnpm exec vitest run tests/unit/features/site/data/htmlSitemap.test.ts
  ```
- **Diagnostic Area:** `buildSitemapSections()` and `getHtmlSitemapHrefs()`.
- **Common Failure Mechanism:** A static route was added to `PUBLIC_INDEXABLE_STATIC_PATHS` in `site/features/site/data/routeClassification.ts` without being added to the expected sections in `site/features/site/data/htmlSitemap.ts`, causing `expect(hrefs).toContain(path)` to fail.
- **Remediation:** Ensure all indexable routes in `routeClassification.ts` are categorized into a sitemap section in `htmlSitemap.ts`.

#### 2. `tests/unit/features/site/data/siteSeoAcceptance.test.ts`
- **Target Command:**
  ```powershell
  pnpm exec vitest run tests/unit/features/site/data/siteSeoAcceptance.test.ts
  ```
- **Diagnostic Area:** Canonical URL formation, OpenGraph image tags, and robots meta.
- **Common Failure Mechanism:** Protocol mismatches (`http:` vs `https:`) or trailing slash mismatches on canonical URL construction.
- **Remediation:** Verify `siteUrl.ts` resolves to `https://oando.co.in` without trailing slashes.

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

## 3. Active Blocker 2: `BROWSER-ORIGIN-02` (Dev Server Availability)

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

## 4. Documentation of Cleared Blockers

To prevent duplicate investigations by operators or automated agents, the following blockers are confirmed **RESOLVED and CLEARED**:

### 4.1 `CF-TOKEN-01` (Cloudflare Token Scope)
- **Previous Issue:** Worker deployment failed due to missing R2 bucket read/write permissions on the Cloudflare API token.
- **Resolution Applied:** Cloudflare API token was granted `Workers Scripts:Edit`, `Workers R2 Storage:Edit`, and `Workers KV Storage:Edit`. Token verified and updated in Cloudflare secrets and `.env.local`.
- **Status:** **CLEARED.** Removed from `Failures.md`. Do not re-open.

### 4.2 `GATE-AUTH-02` (Gate Hook Authorization)
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

When `pnpm run gate` exits with code 0:
1. Open [`Failures.md`](../../Failures.md).
2. Remove the rows for `GATE-RECHECK-01` and `BROWSER-ORIGIN-02`.
3. The table may now be empty (an empty blocker table is valid per line 10 of `Failures.md`).
4. Run the failures validation check:
   ```powershell
   pnpm run check:failures
   ```
   *Expected Output:* `check:failures OK - Failures.md is valid`.
