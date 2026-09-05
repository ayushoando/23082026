# Oando Subsystem Remediation Plan: Blockers Clearance and Ship Gate Protocol

**File Target:** `plans/05092026/09-blockers-clearance-and-ship-gate.md`  
**Governing Standard:** `AGENTS.md` (Authority floor: User instruction > live code/fresh command output > `AGENTS.md`)  
**Execution State:** **FROZEN / PLANNING ONLY** (`NO CODE CHANGE`, `NO AUTO IMPLEMENT`)  
**Methodology:** Failures.md Governance Protocol, Evidence-Based Blocker Resolution, Dual-Gate Hierarchy, and End-to-End Release Runbook.

---

## 1. Subsystem Overview & Release Gating Hierarchy

The Oando release pipeline requires passing two comprehensive gating tiers before code is eligible for production deployment: a fast development loop gate (`pnpm run gate:fast`) and the full release ship gate (`pnpm run gate`).

```
┌────────────────────────────────────────────────────────────────────────┐
│                   OANDO SHIP GATING HIERARCHY                          │
├────────────────────────────────────────────────────────────────────────┤
│                     Development Loop Gate (gate:fast)                  │
│   • 17 sequential static, type, and priority unit checks               │
│   • Fast audit (omits gate skips)  • Layout & token verification       │
├────────────────────────────────────────────────────────────────────────┤
│                       Release Ship Gate (gate)                         │
│                           pnpm run gate                                │
│                                 │                                      │
│         ┌───────────────────────┴───────────────────────┐              │
│         ▼                                               ▼              │
│ [release:gate:core]                            [test:browser:gate]     │
│ 16 sequential checks                           8 Playwright gate specs │
│ • Layout & FOCSS hygiene                       • 3 browsers x 3 sizes  │
│ • 4 test integrity audits                      • Localhost:3000 origin │
│ • Full Vitest dual-lane (780 files)            • Mobile scroller check │
│ • Next.js production build & standalone                                │
│ • Coverage suites (site & admin)                                       │
│ • Governance ratchet & secret scan                                     │
├────────────────────────────────────────────────────────────────────────┤
│                      Failures.md Governance Floor                      │
│ • Hard CI failure on words: "resolved", "passed", "history", etc.      │
│ • Blockers cleared ONLY by row deletion after verified test pass       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. `Failures.md` Blocker Clearance Protocol

Under `AGENTS.md` Rule 1, [`Failures.md`](file:///d:/23082026/Failures.md) is the sole repository record of hard blockers. 

### Clearance Governance & Forbidden Keywords
Enforced by [`scripts/general/check-failures.mjs#L7-L14`](file:///d:/23082026/scripts/general/check-failures.mjs#L7-L14), `Failures.md` must never contain retrospective narratives or resolution markers. Any line containing the following terms triggers an immediate CI build failure:
- `resolved`, `closing`, `closed`
- `pass`, `passed`, `passing`
- `truth snapshot`
- `history`, `historical`
- `[x]`

**The Sole Allowed Clearance Mechanism:** A blocker row must be **completely deleted** from the Markdown table once fresh command evidence confirms the underlying defect has been remedied.

---

## 3. Detailed Resolution Plan for Active Blockers

### Blocker 1: `GATE-RECHECK-01` (Priority: P1)
- **Documented Blocker:** Vitest failed on 4 tests: `htmlSitemap.test.ts`, `siteSeoAcceptance.test.ts`, `siteSeoContract.test.ts`, and `providers.test.ts`.
- **Root Cause & Code Remediation:**
  1. `htmlSitemap.test.ts` & `siteSeoAcceptance.test.ts`: Missing route `/tools` in company service path array. Remedied in `site/features/site/data/htmlSitemap.ts#L128`.
  2. `siteSeoContract.test.ts`: Route `/tools` was unmapped in the static registry. Remedied in `site/features/site/data/siteSeoContract.ts#L64`.
  3. `providers.test.ts`: Stale model identifier expectation. Remedied in `site/lib/ai/mastra/providers.ts#L168` pinning model default to `gemini-2.5-flash`.
- **Live Empirical Evidence:**
  The latest full test execution recorded in [`results/tests/summary.json`](file:///d:/23082026/results/tests/summary.json) confirms 0 failed tests:
  ```json
  {
    "generatedAt": "2026-09-05T03:57:36.303Z",
    "lanes": [
      { "lane": "default", "failed": 0, "total": 4296, "passed": 4295 },
      { "lane": "tech-docs", "failed": 0, "total": 224, "passed": 224 }
    ]
  }
  ```
- **Clearance Step:**
  Upon authorized execution of `pnpm run test`, observe exit code 0, and remove the `GATE-RECHECK-01` row from [`Failures.md`](file:///d:/23082026/Failures.md).

---

### Blocker 2: `BROWSER-ORIGIN-02` (Priority: P1)
- **Documented Blocker:** Playwright test run failed with `net::ERR_CONNECTION_REFUSED` at `http://localhost:3000`.
- **Root Cause:**
  In [`config/build/playwright.config.ts#L88-L105`](file:///d:/23082026/config/build/playwright.config.ts#L88-L105), setting `PLAYWRIGHT_BASE_URL` in the environment causes Playwright to treat the server as externally managed (`userProvidedBaseURL = true`) and disables its internal `webServer` spawner. When the test was executed without manually starting the dev server, connection was refused.
- **Clearance Steps:**
  1. Boot the dev server manually on port 3000:
     ```powershell
     cross-env DEV_AUTH_BYPASS=1 pnpm run dev
     ```
  2. Execute the official 8-spec browser gate:
     ```powershell
     pnpm run test:browser:gate
     ```
  3. Confirm all 8 specs pass across Chromium, Firefox, and WebKit viewports.
  4. Delete the `BROWSER-ORIGIN-02` row from [`Failures.md`](file:///d:/23082026/Failures.md).

---

## 4. End-to-End Release Ship Gating Protocol

Once blockers are cleared, the platform must pass the complete release ship gate:

### Step 1: Preflight Hygiene
```bash
# Verify directory boundaries and layout hygiene
pnpm run check:layout

# Verify FOCSS CSS zones and token boundaries
pnpm run verify:focss

# Verify static style tokens against baseline (200 findings)
pnpm run check:style-tokens
```

### Step 2: Static & Test Integrity Audits
```bash
# Run the 4 core test audits
pnpm run test:audit

# Run the tech-docs fake test audit
pnpm run test:audit:fake-test

# Check governance ratchet (all metrics at 0)
pnpm run check:governance

# Scan repository for leaked secrets
pnpm run scan:secrets
```

### Step 3: Dual-Lane Vitest Execution
```bash
# Run full Vitest suite (Lane 1 + Lane 2)
pnpm run test

# Run code coverage analysis
pnpm run test:coverage:site
pnpm run test:coverage:admin
```

### Step 4: Next.js Production Build & Standalone Packaging
```bash
# Execute production compilation
pnpm run build

# Verify standalone server boots cleanly
pnpm run start:standalone
```

### Step 5: Playwright Browser Gate
```bash
# Boot server and execute the 8-spec browser gate
pnpm run test:browser:gate
```

---

## 5. Rollback & Emergency Runbook

1. **Gate Failure Protocol:** If any step in the ship gate fails:
   - Do NOT force-push or skip checks.
   - Investigate the specific failure output logged to `results/tests/`.
   - Never grandfather new debt via `check:governance --update` or `check:style-tokens --update` without explicit user authorization.
2. **Database Migration Rollback:** If a deployment migration fails in production:
   - Identify the failed migration script under `site/platform/supabase/migrations`.
   - Execute the rollback block annotated after `-- rollback`:
     ```bash
     pnpm run ops db:apply -- --dry
     ```
3. **Edge Worker Rollback:** If the Cloudflare Worker proxy causes edge routing anomalies:
   - Re-deploy the prior stable worker revision via Cloudflare dashboard or `pnpm run ops worker:deploy`.
