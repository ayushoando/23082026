# Master Review Coverage Index

**Repository Baseline:** `fdef1ba7106328ecf43e7a3232dd4bd9859b97be`
**Frozen Workspace Inputs:** 4,096 files (4,095 `git ls-files --cached` + pre-existing untracked `plans/repository-suggestions.md`)
**Review Date:** 2026-09-02
**Review Result:** **PARTIAL** (4,091 files passed validation: 2,688 `read-full` + 1,403 `binary-validated`; 5 files `failed` extension/header checks)
**Review Artifacts:** 7 module reports under `agents-work/`

---

## 1. Executive Summary & Verification Metrics

Per plan completion rule (line 94), the review is labeled **PARTIAL** because 5 paths have `failed` status (raw PNG payloads under `.ico` extensions). All 4,096 frozen repository inputs are accounted for with zero missing, zero duplicate, and zero unexpected paths.

| Metric | Target | Actual | Verification Status |
|---|---|---|---|
| **Frozen Input Baseline** | 4,096 | 4,096 | PASS |
| **Total Appendix Rows** | 4,096 | 4,096 | PASS |
| **Unique Appendix Paths** | 4,096 | 4,096 | PASS |
| **Missing Paths** | 0 | 0 | PASS |
| **Duplicate Paths** | 0 | 0 | PASS |
| **Unexpected Paths** | 0 | 0 | PASS |
| **Read-Full Files (Text/Code)** | — | 2,688 | PASS |
| **Binary-Validated Files (Images/Fonts/Assets)** | — | 1,403 | PASS |
| **Failed Files (Extension/Header Mismatches)** | — | 5 | PARTIAL (Explicitly Listed) |
| **Overall Review Verdict** | — | **PARTIAL** | **INCORRECT FOR MERGE** |

---

## 2. Five-Partition Reviewer Ownership

The 4,096 frozen inputs were reviewed across five disjoint partitions:

1. **App Routes & Root Governance (320 files)**
   - `site/app/**` (174) + Root governance (`docs/**`, `specs/**`, `plans/**`, `Agents/**`, `.github/**`, `.vscode/**`, root singletons, `plans/repository-suggestions.md`: 146)
   - Statuses: 317 `read-full`, 2 `binary-validated`, 1 `failed`
   - Reports: `D-AppRoutes-module-report.md` (174) and `D-RootMeta-module-report.md` (146)

2. **Library, Platform, Persistence & Database (503 files)**
   - `site/lib/**`, `site/platform/**`, `site/server/**`, `site/store/**`, `site/types/**`, `site/i18n/**`, `site/inventory/**`
   - Statuses: 492 `read-full`, 11 `binary-validated`, 0 `failed`
   - Report: `D-LibPlatform-module-report.md` (503)

3. **Tests Suite & Verification Harness (932 files)**
   - `tests/**` (unit, integration, e2e, tech-docs-generator, helpers, fixtures, manifests)
   - Statuses: 920 `read-full`, 12 `binary-validated`, 0 `failed`
   - Report: `D-Tests-module-report.md` (932)

4. **Components, FOCSS, Hooks & Features (572 files)**
   - `site/components/**` (194), `site/focss/**` (152), `site/hooks/**` (18), `site/features/**` (208)
   - Statuses: 572 `read-full`, 0 `binary-validated`, 0 `failed`
   - Reports: `D-ComponentsFocss-module-report.md` (364) and `D-FeaturesPublic-module-report.md` (feature section: 208)

5. **Scripts, Tech-Docs, Workers, Config & Public Assets (1,769 files)**
   - `scripts/**` (227), `tech-docs-generator/**` (131), `workers/**` (6), `config/**` (13), `site/public/**` (1,392)
   - Statuses: 389 `read-full`, 1,376 `binary-validated`, 4 `failed`
   - Reports: `D-ScriptsInfra-module-report.md` (377) and `D-FeaturesPublic-module-report.md` (public asset section: 1,392)

**Partition Sum:** 320 + 503 + 932 + 572 + 1,769 = **4,096**

---

## 3. Seven Report Status Breakdown

| Report File | Owned Count | `read-full` | `binary-validated` | `failed` | Coverage State |
|---|---|---|---|---|---|
| `D-AppRoutes-module-report.md` | 174 | 171 | 2 | 1 | Partial (1 failed asset) |
| `D-RootMeta-module-report.md` | 146 | 146 | 0 | 0 | Complete (100% pass) |
| `D-LibPlatform-module-report.md` | 503 | 492 | 11 | 0 | Complete (100% pass) |
| `D-Tests-module-report.md` | 932 | 920 | 12 | 0 | Complete (100% pass) |
| `D-ComponentsFocss-module-report.md` | 364 | 364 | 0 | 0 | Complete (100% pass) |
| `D-FeaturesPublic-module-report.md` | 1,600 | 225 | 1,372 | 3 | Partial (3 failed assets) |
| `D-ScriptsInfra-module-report.md` | 377 | 372 | 4 | 1 | Partial (1 failed asset) |
| **TOTALS** | **4,096** | **2,688** | **1,403** | **5** | **PARTIAL (4,091 pass / 5 fail)** |

---

## 4. Failed Input Inventory (5 Assets)

Every failed input in the review is a binary asset with an extension/header contract mismatch (raw PNG data under an `.ico` filename):

1. `site/app/(site)/favicon.ico` — 1,991 bytes, PNG header `89 50 4E 47`, expected ICO container `00 00 01 00` (Finding A1, P2)
2. `site/public/assets/favicon.ico` — 1,991 bytes, PNG header `89 50 4E 47`, expected ICO container `00 00 01 00` (Finding P-A1, P2)
3. `site/public/assets/marketing/brand/logos/favicon.ico` — 1,991 bytes, PNG header `89 50 4E 47`, expected ICO container `00 00 01 00` (Finding P-A1, P2)
4. `site/public/favicon.ico` — 1,991 bytes, PNG header `89 50 4E 47`, expected ICO container `00 00 01 00` (Finding P-A1, P2)
5. `tech-docs-generator/public/favicon.ico` — 1,991 bytes, PNG header `89 50 4E 47`, expected ICO container `00 00 01 00` (Finding S5, P2)

---

## 5. Consolidated P0 and P1 Findings with Observed Input/Output Evidence

### P0 Findings (Critical / Security / Edge Isolation)

#### 1. S1 — Match Supabase chunked session cookies before caching
- **Path:** `workers/oando-worker-proxy/src/cachePolicy.js:24-27`
- **Severity:** P0
- **Impact:** `requestHasSessionCookie` requires `-auth-token=` directly after cookie name, but Supabase SSR chunks tokens as `sb-<ref>-auth-token.0`, `.1`. Authenticated requests pass `shouldCacheResponse`, allowing personalized HTML into shared edge cache.
- **Observed Reproduction Input/Output:**
  - *Input (chunked cookie):* `"sb-xytz-auth-token.0=tokenpart0; sb-xytz-auth-token.1=tokenpart1"`
  - *Input (unchunked cookie):* `"sb-xytz-auth-token=fulltoken"`
  - *Shipped `cookie.includes('-auth-token=')` Output:* Chunked = `false`, Unchunked = `true`.
  - *Result:* Chunked session is not detected as authentication, causing `shouldCacheResponse` to evaluate to `true` and cache private HTML responses.
- **Concrete Fix:** Match optional numeric chunk suffixes (`sb-.*-auth-token(?:\.\d+)?=`) before enabling public response caching.

#### 2. S2 — Reject protocol-relative proxy paths
- **Path:** `workers/oando-worker-proxy/src/index.js:201-201`
- **Severity:** P0
- **Impact:** The worker constructs `new URL(pathname + url.search, origin)` from client-controlled `pathname`. Request with `pathname='//evil.com/steal'` resolves to host `evil.com`, escaping the trusted origin and proxying attacker-controlled content under the worker domain.
- **Observed Reproduction Input/Output:**
  - *Input:* `pathname = "//evil.com/steal"`, `origin = "https://oando.co.in"`
  - *Observed URL Resolution:* `new URL("//evil.com/steal", "https://oando.co.in").href` → `"https://evil.com/steal"` (`host: "evil.com"`).
  - *Result:* Host changes from trusted `oando.co.in` to attacker-controlled `evil.com`.
- **Concrete Fix:** Reject paths beginning with `//` with HTTP 400 Bad Request before constructing `targetUrl`.

---

### P1 Findings (High / Architecture / Core Invariants / Test Gaps)

#### 3. LP-1 — Provision and atomically update the distributed rate-limit store
- **Path:** `site/lib/rateLimit.ts:179-228`
- **Severity:** P1
- **Impact:** In production with service role key, queries target `public.rate_limits` table, but migrations contain no table definition. On remote DBs, read-then-upsert allows concurrent requests to overwrite identical counts, exceeding rate limits. AI-scoped routes fail closed when the table is unreachable.
- **Observed Reproduction Input/Output:**
  - *Input:* Scan 64 SQL migration files across `site/platform/supabase/migrations/**` and `migrations.admin/**` for `CREATE TABLE rate_limits`.
  - *Observed Output:* `0` matching tables found across all 64 migration files.
  - *Result:* Supabase query in `rateLimit.ts` throws table not found error and falls back to instance-local memory cache.
- **Concrete Fix:** Add migration for `public.rate_limits` table with RLS and replace read-then-upsert with an atomic RPC or `INSERT ... ON CONFLICT DO UPDATE RETURNING count`.

#### 4. T1 — Make `runIf` visible to the skip audit
- **Path:** `scripts/general/audit-gate-skips.mjs:16` (affected: 10 runIf callsites across 9 test files, including two in tests/unit/platform/serviceRoleOnlyTables.db.test.ts)
- **Severity:** P1
- **Impact:** `describe.runIf` and `it.runIf` suites in live DB/R2 smoke tests are not recognized by `skipRe`, which only matches `skip`, `skipIf`, `fixme`. Without credentials, suites register 0 tests and pass silently without recorded exceptions.
- **Observed Reproduction Input/Output:**
  - *Input:* `describe.runIf(hasDb)('Customer queries DB smoke', () => {`
  - *Audit Regex:* `/(?:test|describe|it)\s*\.\s*(?:skip(?:If)?|fixme)\s*\(/g`
  - *Observed Output:* Match = `false`.
  - *Result:* The conditional skip is invisible to the gate skip auditor and produces no audit failure.
- **Concrete Fix:** Extend audit regex in `audit-gate-skips.mjs` to match `runIf` and require exceptions in `skip-exceptions.json`.

#### 5. T2 — Fail when the zero-mutation artifact is missing
- **Path:** `tests/site-ui-content-links-audit/property-05-zero-product-mutation.test.ts:627-633`
- **Severity:** P1
- **Impact:** The test catches `readFile(manifestPath)` errors and immediately returns without assertions when the artifact is absent on disk, causing Property 5 to pass vacuously.
- **Observed Reproduction Input/Output:**
  - *Input:* `fs.existsSync("results/site-ui-content-links-audit")`
  - *Observed Output:* `false` (directory does not exist).
  - *Code Branch:* `try { raw = await readFile(manifestPath, "utf8"); } catch { return; }` executes `return;` at line 632.
  - *Result:* The test passes green with 0 assertions executed when the results directory is missing.
- **Concrete Fix:** Throw an explicit error when `manifestPath` is unreadable instead of returning early.

#### 6. C-01 — Define Studio semantic text colors
- **Path:** `site/focss/studio/base/semantic.css:10-11`
- **Severity:** P1
- **Impact:** `--text-strong` and `--text-body` reference `--color-pure-black`, which is undefined in FOCSS tokens. Declarations become invalid at computed-value time, causing font color to fall back to inheritance.
- **Observed Reproduction Input/Output:**
  - *Input:* Grep for `--color-pure-black:` definition across all 152 files in `site/focss/**`.
  - *Observed Output:* `0` definitions found. Usages in `site/focss/studio/base/semantic.css:10-11` (`--text-strong: var(--color-pure-black);`, `--text-body: var(--color-pure-black);`).
  - *Result:* CSS custom properties evaluate to invalid values at computed-value time.
- **Concrete Fix:** Align with defined tokens `--color-ink-900` and `--color-ink-800`.

#### 7. C-03 — Stop permanent canvas ruler animation loops
- **Path:** `site/components/Planner/PlannerRulers.tsx:115-123` & `site/components/Studio/StudioRulers.tsx:115-123`
- **Severity:** P1
- **Impact:** Continuous `requestAnimationFrame` loop redraws and clears backing canvases every frame (60-144 Hz) even when the canvas is stationary, causing GPU canvas thrashing and battery drain.
- **Observed Reproduction Input/Output:**
  - *Input:* Static analysis of `useEffect` in both ruler components.
  - *Observed Code:* `const loop = () => { draw(); animId = requestAnimationFrame(loop); }; animId = requestAnimationFrame(loop);`
  - *Result:* Unconditional scheduling of new animation frames every tick regardless of canvas dirty state or user interaction.
- **Concrete Fix:** Remove the permanent loop and trigger redraws only on Fabric viewport/zoom/pan and resize events.

#### 8. R1 — Remove forbidden gate token from active blocker record
- **Path:** `Failures.md:17`
- **Severity:** P1
- **Impact:** Line 17 contains the word `passed` (`passed 126/126`), which fails the `check:failures` release gate.
- **Observed Reproduction Input/Output:**
  - *Input Line 17:* `| GATE-RECHECK-01 | ... Targeted re-run of those files later passed 126/126. ... |`
  - *Gate Regex:* `/(?:pass|passed)/i`
  - *Observed Output:* Match = `true`.
  - *Result:* `pnpm run check:failures` fails with non-zero exit code due to forbidden word on active blocker line.
- **Concrete Fix:** Replace `passed` with `cleared` or `verified`.

#### 9. R2 — Quarantine or regenerate cross-checkout coverage artifact
- **Path:** `results/ops/coverage-admin.txt:9-16`
- **Severity:** P1
- **Impact:** UTF-16LE coverage artifact contains logs from `E:/18082026/site` instead of `D:/23082026`, attributing another checkout's coverage run to this repository.
- **Observed Reproduction Input/Output:**
  - *Input File:* `results/ops/coverage-admin.txt` (UTF-16LE encoded).
  - *Observed Paths:* Extracted `E:/18082026/site`, `E:/18082026/tests/setup.ts`.
  - *Result:* Foreign workspace paths embedded in checked-in coverage results artifact.
- **Concrete Fix:** Re-run admin coverage on the current repository or regenerate the report file.

#### 10. R3 — Track or relocate untracked planning coordination document
- **Path:** `plans/repository-suggestions.md:1-5`
- **Severity:** P1
- **Impact:** Untracked file on disk is omitted on fresh checkouts and CI runs, causing review/planning discrepancy.
- **Observed Reproduction Input/Output:**
  - *Input:* `git status --porcelain plans/repository-suggestions.md`
  - *Observed Output:* `?? plans/repository-suggestions.md`
  - *Result:* File exists on disk but is untracked by git commit `fdef1ba`.
- **Concrete Fix:** Commit the document to git tracking or move to `.archive/`.

#### 11. S3 — Do not bypass secret scanner on lines mentioning env keywords
- **Path:** `scripts/general/scan_secrets.mjs:61-72`
- **Severity:** P1
- **Impact:** `isSafeReferenceOrExample` returns true whenever a line contains `process.env`, `Deno.env`, or `env(`, allowing real secrets on the same line to bypass release-gate scans.
- **Observed Reproduction Input/Output:**
  - *Input Line:* `const token = 'CLOUDFLARE_API_TOKEN=shpat_12345678901234567890123456789012'; // process.env fallback`
  - *Function Call:* `isSafeReferenceOrExample(line)`
  - *Observed Output:* `true` (safe).
  - *Result:* Real API token pattern is ignored by `scan:secrets` gate check because `process.env` is present on the same line.
- **Concrete Fix:** Anchor exceptions to isolated placeholder tokens and support JSON/YAML secret formats.

---

## 6. Verification Method

Every per-file status across all seven reports was verified against the frozen 4,096-path manifest:
- **Set difference (Manifest - Appendix):** `0`
- **Set difference (Appendix - Manifest):** `0`
- **Duplicate paths across reports:** `0`
- **Machine-checkable format:** Pipe-delimited markdown tables (`| path | status | module | reviewer | finding IDs |`) in each report.
