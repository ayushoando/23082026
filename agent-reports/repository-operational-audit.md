# Area-Wise Quality & Operational Audit Report

**Repository Target:** `d:\23082026`  
**Date:** 2026-09-04  
**Audit Standard:** Strict Governance Baseline • Zero-Invent Evidence • Read-Only Production Safety Floor  
**Scope:** Full Area-Wise Quality Breakdown across Database, Static Code Quality, UI/FOCSS, SEO, Security, Testing, Tech-Docs, and Script Inventory.

---

## Executive Quality Scorecard

| Area | Quality Grade | Verified Healthy | Critical Defects Identified | Action Priority |
| :--- | :---: | :--- | :--- | :---: |
| **1. Database & Backups** | **A-** | Live connectivity (143 products, 4 plans), dual-database isolation, persistence wrappers. | Indefinite accumulation of unpruned backups; permission failure on unprivileged tables with anon key; missing local `pg_dump`; typo in GitHub Actions secret sync script. | **P0** |
| **2. Static Code & Lint Quality** | **B+** | Zero handwritten `any`, oxlint configured, strict suppression checks in core trees. | 7 inline suppressions hidden in `site/hooks/` and `config/build/`; `react-hooks/exhaustive-deps` downgraded to `warn`. | **P1** |
| **3. UI, CSS & Design (FOCSS)** | **A** | 151 modular CSS files pass FOCSS compiler, 0 raw hex literals, fork boundaries intact. | None (Clean Pass). | **P3** |
| **4. SEO & Sitemap Quality** | **C** | Robots directives valid, canonical URL generators sanitized. | **10 broken HTTP 404 URLs** live in production sitemap (`https://oando.co.in/sitemap.xml`); stale `/buddy-planner` references in audit scripts. | **P0** |
| **5. Security & Governance** | **A** | Zero secret leaks, governance baseline intact (0 regressions), Worker origin probe returns 200. | CI secret key name mismatch in backup workflow. | **P0** |
| **6. Testing & Test Strength** | **B+** | 937 test files, anti-hollow checks pass (0 fake tests), anti-skip checks pass (0 unapproved skips). | `site/proxy.ts` (20KB middleware) and `app/api/**` lack unit test gates; live Supabase RLS bypassed by test bypass mode. | **P1** |
| **7. Tech-Docs Reality** | **C-** | Lockfile & route extractors active, Vite build succeeds. | Page-component graph output is orphaned (0 UI imports); Mermaid diagrams hardcode archived 20260829 tables (`users`, `plans`, `leads`). | **P1** |
| **8. Script Inventory Quality** | **D** | Core deployment and migration dispatchers functional. | 94 out of 264 scripts (~36%) are dead recovery artifacts, throwaway Python scripts, or unintegrated ghost frameworks. | **P1** |

---

# Area 1: Database, Persistence & Backup Quality

### 1.1 Live Database Separation & Connectivity

The repository enforces strict database separation between internal admin data and public marketing data. Dual-writing is forbidden. Production filesystem is read-only.

| Database Target | Supabase Project Ref | Role & Content | Expected Tables | Live Records / Health |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Database** | `rxzpznmxbaoxpikowmfc` | Staff, profiles, handoffs, pricing, teams, audit, furniture catalog, block descriptors. | `oando_plans`, `audit_events`, `furniture_catalog`, `block_descriptors`, `business_stats_history` | **Connected (Exit 0)**<br>• 4 live plans<br>• Furniture seed verified |
| **Products Database** | `erpweaiypimorcunaimz` | Public marketing catalog, configurator items, SVG asset revisions, themes, flags. | `catalog_products`, `catalog_categories`, `planner_managed_products`, `configurator_products`, `svg_revisions`, `svg_revision_artifacts` | **Connected (Exit 0)**<br>• 143 catalog products<br>• Categories synced |

### 1.2 Isolated Backup Failures & Root Causes

During operational testing of the backup suite (`pnpm run ops`), three distinct failure modes were isolated:

| Backup Task | Command | Failure Mode & Exit Code | Root Cause | Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **REST Data Backup** | `pnpm run ops supabase:backup` | **Exit Code 2**<br>`permission denied for table business_stats_history`, `configurator_products`, `planner_managed_products` | Script falls back to `anon` key because `SUPABASE_SERVICE_ROLE_KEY` is not exported in local shell. Unprivileged anon key cannot read RLS-protected admin tables. | Provide `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` or update `backup_supabase.ts` to log warnings and continue unprivileged tables rather than hard failing. |
| **R2 Postgres Dump** | `pnpm run ops backup:supabase:r2` | **Exit Code 1**<br>`spawn pg_dump ENOENT` | `pg_dump` binary is not installed on the local Windows host. | Update `scripts/lib/resolvePgDump.ts` to output a clean pre-flight guide (`winget install PostgreSQL.PostgreSQL`) instead of a raw stack trace. |
| **GitHub Actions Backup CI** | `.github/workflows/supabase-backup-r2.yml` | **Failed Run**<br>Missing/empty Cloudflare R2 credentials in CI runner | `scripts/sync-github-backup-secrets.ps1` sets typo secret names (`CLOULD_ACCESS_KEY_ID`, `CLOULDFLARE_S3_SECRET_ACCESS_KEY`), while workflow expects `CLOUDFLARE_R2_ACCESS_KEY_ID` and `CLOUDFLARE_R2_SECRET_ACCESS_KEY`. | Correct secret names in `scripts/sync-github-backup-secrets.ps1` to match the canonical GitHub Actions workflow. |

### 1.3 Backup Retention Implementation (`scripts/prune_r2_backups.ts`)

To resolve the indefinite accumulation of backups in Cloudflare R2 and local directories, an automated retention pruner was implemented:
- **Daily Backups:** Retained for a maximum of 5 days (Age $\le$ 5 days).
- **Weekly Backups:** 1 backup per ISO calendar week retained for up to 30 days (5 days $<$ Age $\le$ 30 days).
- **Monthly / Expired Backups:** Permanently deleted if Age $>$ 30 days.
- **Protected Assets:** Canonical pointers (`catalog-latest.json`, `.gitkeep`) are strictly excluded from deletion.

#### Unit Test Verification Suite (`tests/unit/scripts/prune_r2_backups.test.ts`)
```
 ✓ tests/unit/scripts/prune_r2_backups.test.ts (12 tests) 2ms
   ✓ isProtectedBackupKey > identifies protected keys
   ✓ parseBackupDate > parses timestamp formats correctly
   ✓ evaluateBackupsForPruning > retains daily backups for <= 5 days
   ✓ evaluateBackupsForPruning > retains only one weekly backup per week for 5 < age <= 30 days
   ✓ evaluateBackupsForPruning > marks backups older than 30 days for deletion
   ✓ evaluateBackupsForPruning > never deletes protected files even if older than 30 days
   ✓ evaluateBackupsForPruning > correctly handles mixed timelines

 Test Files  1 passed (1)
      Tests  12 passed (12)
   Duration  268ms
```

---

# Area 2: Static Code & Lint Quality

### 2.1 Current Oxlint Configuration & Suppressions

Oxlint serves as the primary static analysis engine configured via [`.oxlintrc.json`](file:///d:/23082026/.oxlintrc.json).

| Rule | Setting | Quality Assessment & Justification | Recommended Improvement |
| :--- | :--- | :--- | :--- |
| `no-unused-vars` | `"off"` | Standard JS rule flags TypeScript interfaces/enums as false positives. | Keep `"off"`; handled by `typescript/no-unused-vars`. |
| `typescript/no-unused-vars` | `"error"` (`^_` ignore) | Unused variables prefixed with underscore are allowed. | Add `"caughtErrors": "all"` to prevent uninspected `catch (e)` blocks. |
| `jsx-a11y/prefer-tag-over-role` | `"off"` | Suppressed globally to permit ARIA `role="..."` on generic elements. | Promote to `"error"` globally; isolate Planner/Studio canvas overlays via scoped `overrides`. |
| `react-hooks/exhaustive-deps` | `"warn"` | **Downgraded from error.** Prevents CI failures when dependency arrays are missing. | Promote to `"error"`. Refactor stale closures via `useCallback` or state updater functions. |

### 2.2 Inline Suppressions Audit (`eslint-disable-next-line`)

The repository includes a strict CI audit script: [`scripts/general/audit-eslint-disable.mjs`](file:///d:/23082026/scripts/general/audit-eslint-disable.mjs). Exactly **7 inline suppressions** exist across the codebase because they reside in directories unmonitored by the script:

| File Path | Line | Rule Suppressed | Reason / Justification | Recommended Action |
| :--- | :--- | :--- | :--- | :--- |
| [`site/hooks/Studio/useStudioFabric.ts`](file:///d:/23082026/site/hooks/Studio/useStudioFabric.ts#L56) | 56 | `react-hooks/exhaustive-deps` | Canvas disposal lifecycle hook. | Keep; add `site/hooks` to scanned paths with explicit allowlist. |
| [`site/hooks/Planner/usePlannerFabric.ts`](file:///d:/23082026/site/hooks/Planner/usePlannerFabric.ts#L81) | 81 | `react-hooks/exhaustive-deps` | Canvas disposal lifecycle hook. | Keep; add `site/hooks` to scanned paths with explicit allowlist. |
| [`site/hooks/Studio/useStudioKeyboardShortcuts.ts`](file:///d:/23082026/site/hooks/Studio/useStudioKeyboardShortcuts.ts#L135) | 135 | `react-hooks/exhaustive-deps` | Window event listener registration. | Keep; add `site/hooks` to scanned paths with explicit allowlist. |
| [`site/hooks/Planner/usePlannerKeyboardShortcuts.ts`](file:///d:/23082026/site/hooks/Planner/usePlannerKeyboardShortcuts.ts#L201) | 201 | `react-hooks/exhaustive-deps` | Window event listener registration. | Keep; add `site/hooks` to scanned paths with explicit allowlist. |
| [`site/hooks/Planner/usePlannerSessionWarning.ts`](file:///d:/23082026/site/hooks/Planner/usePlannerSessionWarning.ts#L72) | 72 | `react-hooks/exhaustive-deps` | Window session timer interval. | Keep; add `site/hooks` to scanned paths with explicit allowlist. |
| [`config/build/playwright.config.ts`](file:///d:/23082026/config/build/playwright.config.ts#L4) | 4 | `@typescript-eslint/no-require-imports` | CommonJS require of `loadEnvLocal.cjs`. | Convert to ESM `createRequire` pattern to eliminate suppression. |
| [`config/build/playwright.config.ts`](file:///d:/23082026/config/build/playwright.config.ts#L6) | 6 | `@typescript-eslint/no-require-imports` | CommonJS require of `playwrightBaseURL.cjs`. | Convert to ESM `createRequire` pattern to eliminate suppression. |

---

# Area 3: UI, CSS & Design System Quality (FOCSS)

### 3.1 FOCSS Architecture & Verification

The repository replaces external utility-first CSS frameworks with a bespoke, zero-runtime CSS architecture under `site/focss/` (`@focss/*`).

| Quality Dimension | Standard / Invariant | Measured Status | Verification Tool |
| :--- | :--- | :--- | :--- |
| **CSS Package Count** | 151 modular CSS package files | ✅ **151/151 Validated** | [`scripts/AsNeeded/verify-focss.mjs`](file:///d:/23082026/scripts/AsNeeded/verify-focss.mjs) |
| **Raw Hex Color Literals** | Zero raw `#hex` color codes allowed in CSS; all colors must resolve to design tokens. | ✅ **0 Hex Literals** | `pnpm run check:style-tokens` |
| **Import Graph Cycles** | Strict layered hierarchy (Tokens → Foundations → Components → Shells). | ✅ **0 Circular Cycles** | `pnpm run verify:focss` |
| **Fork Tree Isolation** | Studio (`/oostudio`) and Planner (`/ooplanner`) are strictly forked and must never cross-import. | ✅ **Zero Cross-Imports** | `pnpm run scan:boundaries` |

---

# Area 4: SEO, Sitemap & Content Integrity Quality

### 4.1 Production Sitemap Health (HTTP 404 Audit)

Executing [`scripts/general/audit-sitemap-health.mjs`](file:///d:/23082026/scripts/general/audit-sitemap-health.mjs) against `https://oando.co.in/sitemap.xml` revealed **10 broken URLs (HTTP 404)** currently exposed to search engine crawlers:

| Broken URL Served in Sitemap | HTTP Status | Originating Generator | Remediation Action |
| :--- | :--- | :--- | :--- |
| `https://oando.co.in/products/storages/accessories/` | **404** | `site/app/sitemap.ts` | Remove from fallback category list or redirect to `/products/storages/`. |
| `https://oando.co.in/products/soft-seating/allure/` | **404** | `site/app/sitemap.ts` | Prune discontinued `allure` slug from fallback catalog. |
| `https://oando.co.in/products/seating/caneva/` | **404** | `site/app/sitemap.ts` | Prune `caneva` slug from static params generator. |
| `https://oando.co.in/products/seating/copse/` | **404** | `site/app/sitemap.ts` | Prune `copse` slug from static params generator. |
| `https://oando.co.in/products/seating/crotch/` | **404** | `site/app/sitemap.ts` | Prune `crotch` slug from static params generator. |
| `https://oando.co.in/products/seating/ember/` | **404** | `site/app/sitemap.ts` | Prune `ember` slug from static params generator. |
| `https://oando.co.in/products/seating/flare/` | **404** | `site/app/sitemap.ts` | Prune `flare` slug from static params generator. |
| `https://oando.co.in/products/seating/flex/` | **404** | `site/app/sitemap.ts` | Prune `flex` slug from static params generator. |
| `https://oando.co.in/products/seating/flip/` | **404** | `site/app/sitemap.ts` | Prune `flip` slug from static params generator. |
| `https://oando.co.in/products/soft-seating/mellow/` | **404** | `site/app/sitemap.ts` | Prune `mellow` slug from static params generator. |

### 4.2 Stale Feature Route References (`/buddy-planner`)

The `/buddy-planner` feature route was permanently retired on August 7, 2026. However, legacy audit scripts still attempt to inspect or redirect it:

| File Path | Line | Stale Reference | Action |
| :--- | :--- | :--- | :--- |
| [`scripts/site-ui-content-links-audit/discovery.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/discovery.ts#L619) | 619 | `{ source: "/buddy-planner", destination: "/ooplanner/", permanent: true }` | Delete stale route mapping or delete containing audit directory. |
| [`scripts/site-ui-content-links-audit/wave1-links.ts`](file:///d:/23082026/scripts/site-ui-content-links-audit/wave1-links.ts#L181) | 181 | `"/buddy-planner"` | Remove entry from audit target array. |
| [`scripts/AsNeeded/_audit-stale-scripts.mjs`](file:///d:/23082026/scripts/AsNeeded/_audit-stale-scripts.mjs#L64) | 64, 94 | `"features/buddy-planner"` / `"/buddy-planner"` | Delete abandoned `_audit-stale-scripts.mjs` script. |

---

# Area 5: Security, Secret Hygiene & Governance Quality

### 5.1 Security Audits & Gate Compliance

| Security Subsystem | Validation Command | Measured Result | Scope & Guarantees |
| :--- | :--- | :--- | :--- |
| **Secret Scanning** | `pnpm run scan:secrets` | ✅ **PASS (0 leaks)** | Scans entire repository for private keys, tokens, and high-entropy secrets. |
| **Governance Ratchet** | `pnpm run check:governance` | ✅ **PASS (0 regressions)** | Validates codebase against ratchet metrics in `config/quality/governance-baseline.json`. |
| **Worker Origin Routing** | `pnpm run check:worker-origin` | ✅ **PASS (HTTP 200)** | Verifies Cloudflare Worker origin proxying to Vercel production deployment. |
| **Repository Layout** | `pnpm run check:layout` | ✅ **PASS (0 violations)** | Enforces workspace boundaries, no root locks, and no illegal worktree configurations. |

---

# Area 6: Testing & Test Strength Quality

### 6.1 Gate Coverage Profiles & Thresholds

| Profile | Config File | Target Surface | Approved Gate Floor | CI Status |
| :--- | :--- | :--- | :--- | :--- |
| **Planner & Studio** | [`tests/vitest.config.ts`](file:///d:/23082026/tests/vitest.config.ts) | `components/{Planner,Studio}`, `lib/{Planner,Studio}`, `store/{Planner,Studio}`, `hooks/{Planner,Studio}` | 100% Lines / 100% Funcs / 95% Stmts / 95% Branches | **PASS (100%)** |
| **Site Logic** | [`tests/vitest.site.config.ts`](file:///d:/23082026/tests/vitest.site.config.ts) | `features/site/data`, `lib/catalog`, `lib/configurator`, `features/site/assistant`, `features/ops` | 100% Lines / 100% Funcs / 95% Stmts / 95% Branches | **PASS (100%)** |
| **Admin Features** | [`tests/vitest.admin.coverage.config.ts`](file:///d:/23082026/tests/vitest.admin.coverage.config.ts) | `features/admin/**/*.{ts,tsx}` | 100% Lines / 100% Funcs / 95% Stmts / 95% Branches | **PASS (100%)** |

### 6.2 Test Strength & Anti-Hollow Assertions

| Guardrail Script | Command | Rules Checked | Measured Violations |
| :--- | :--- | :--- | :--- |
| [`scripts/general/audit-hollow-tests.mjs`](file:///d:/23082026/scripts/general/audit-hollow-tests.mjs) | `pnpm run test:audit:hollow` | • Banned: `expect(true).toBe(true)`<br>• Banned: Sole `toBeTruthy()` or `toBeDefined()` in file<br>• Banned: Empty `catch (...) {}` blocks swallowing errors<br>• Banned: `it()` blocks with 0 `expect()` assertions | ✅ **0 Hollow Violations** |
| [`scripts/general/audit-gate-skips.mjs`](file:///d:/23082026/scripts/general/audit-gate-skips.mjs) | `pnpm run test:audit:gate-skips` | • Banned: `test.skip`, `it.skip`, `describe.skip`<br>• Banned: `test.only`, `it.only` (focused tests)<br>• Banned: `/* istanbul ignore */`, `/* v8 ignore */` | ✅ **0 Unapproved Skips** |

### 6.3 Critical Testing Gaps (Uncovered Surfaces)

1. **Routing Middleware ([`site/proxy.ts`](file:///d:/23082026/site/proxy.ts)):** At 20KB, `proxy.ts` controls session validation, CSRF headers, and guest pass-through. It is included only in diagnostic inventory and has **zero threshold enforcement**.
2. **API Route Handlers ([`site/app/api/`](file:///d:/23082026/site/app/api)):** Audited only via static regex (`audit-api-route-safety.mjs`). Edge failure branches have no unit test suites.
3. **Marketing Page Server Components ([`site/app/(site)/`](file:///d:/23082026/site/app/(site))):** Completely absent from `vitest.site.config.ts` include globs.
4. **Live Supabase RLS Policies:** Unit tests execute with `DEV_AUTH_BYPASS=true`, bypassing live PostgreSQL Row-Level Security rules.
5. **Repository Scripts ([`scripts/`](file:///d:/23082026/scripts)):** 260 of 264 scripts have no automated test coverage.

---

# Area 7: Tech-Docs Generator Reality & Architecture

### 7.1 Tech-Docs Generator Pipeline Status

The Tech-Docs generator is an independent Vite SPA (`tech-docs-generator/`) built via `pnpm --filter oando-tech-docs build`.

| Subsystem / Script | Input Data | Generated Output | Operational Status |
| :--- | :--- | :--- | :--- |
| **Lockfile Parser** | `pnpm-lock.yaml` | `generated-documents/dependencies.json` | ✅ **Active & Synchronized** |
| **Route Parser** | `site/app/**/page.tsx` | `generated-documents/routes.json` | ✅ **Active & Synchronized** |
| **Vite SPA Build** | `tech-docs-generator/src/**` | `dist/` staged to `.next/standalone` | ✅ **Active & Passing** |
| **Page Component Graph** | `site/**/*.{ts,tsx,css}` | `page-component-graph.mmd` | ❌ **Orphaned Output** (Never rendered in UI) |
| **Database ER Diagram** | Static string in `Database.tsx` | In-memory Mermaid render | ❌ **Stale / Fictitious Schema** |

### 7.2 Hardcoded ER Diagram vs. Live Database Reality

The Mermaid ER diagram embedded in [`tech-docs-generator/src/pages/Database.tsx`](file:///d:/23082026/tech-docs-generator/src/pages/Database.tsx) is a static string unmodified since August 29, 2026. It documents a legacy schema that does not exist in production:

| Diagram Entity in `Database.tsx` | Depicted Fields | Actual Production Reality | Status |
| :--- | :--- | :--- | :--- |
| `users` | `id`, `email`, `role`, `created_at` | Supabase internal auth schema owns user records; no public `users` table exists. | ❌ **Archived / Non-existent** |
| `plans` | `id`, `user_id`, `data`, `name` | Canonical table is `oando_plans` on Admin Supabase with mode-aware disk/DB wrappers. | ❌ **Renamed to `oando_plans`** |
| `leads` | `id`, `assigned_to`, `name`, `email`, `stage` | Removed from codebase. No `leads` table exists in Admin or Products DB. | ❌ **Archived / Non-existent** |
| `plan_items` | `id`, `plan_id`, `product_id`, `transform` | Plan elements are serialized inside `oando_plans.data` JSONB; no separate items table exists. | ❌ **Non-existent** |
| `activity` | `id`, `user_id`, `action`, `timestamp` | Handled by `audit_events` table on Admin Supabase. | ❌ **Replaced by `audit_events`** |
| `products` | `id`, `slug`, `price`, `model_path` | Canonical table is `catalog_products` on Products Supabase. | ❌ **Renamed to `catalog_products`** |
| *(Missing from diagram)* | — | `furniture_catalog` (Admin DB) | ❌ **Missing from Tech-Docs** |
| *(Missing from diagram)* | — | `block_descriptors` (Admin DB) | ❌ **Missing from Tech-Docs** |
| *(Missing from diagram)* | — | `planner_managed_products` (Products DB) | ❌ **Missing from Tech-Docs** |
| *(Missing from diagram)* | — | `configurator_products` (Products DB) | ❌ **Missing from Tech-Docs** |

---

# Area 8: Script Inventory & Dead Code Elimination

### 8.1 Inventory Metrics
```
Total Scripts Evaluated: 264
├── Candidate for Immediate Removal: 94 files (35.6%)
│   ├── Dead Recovery & Asset Cutover Artifacts: 14 files
│   ├── One-Off Plan & Doc Migration Scripts: 11 files
│   ├── Abandoned Operations-Review Framework: 9 files
│   ├── Abandoned Site-UI Wave Audit Subsystem: 26 files
│   ├── Tech-Docs Micro-Extractors & Orphan Generators: 18 files
│   └── Redundant / Ad-Hoc Database & Infra Scripts: 16 files
└── Retain & Improve: 170 files (64.4%)
    ├── Core Database & Seeding Engines
    ├── Release Gate & Fast Loop Lint / Type Guards
    └── R2 Backup Retention & Cloud Sync
```

### 8.2 Top Elimination Targets

1. **Dead Recovery Artifacts:** [`scripts/merge-recovery-into-majors.mjs`](file:///d:/23082026/scripts/merge-recovery-into-majors.mjs) (1,376 lines) and [`scripts/five-majors-hash-dedup.mjs`](file:///d:/23082026/scripts/five-majors-hash-dedup.mjs) (945 lines). Both target non-existent legacy recovery directories.
2. **Abandoned Operations-Review Subsystem:** [`scripts/operations-review/`](file:///d:/23082026/scripts/operations-review) (9 files). Never integrated into package.json.
3. **Abandoned Site-UI Wave Audit Subsystem:** [`scripts/site-ui-content-links-audit/`](file:///d:/23082026/scripts/site-ui-content-links-audit) (26 files). Dead crawler from August 31 with stale route references.
4. **Disposable Python Scripts:** `rename-plans.py`, `update-plans.py`, `move-checklist.py`, `verify-plans.py`, `audit-repo-state.py`. One-off scripts that have outlived their purpose.

---

# Area-Wise Remediation Action Plan

| Area | Action Item | Target File(s) | Priority |
| :--- | :--- | :--- | :---: |
| **Database** | Wire `ops backup:r2:prune` into master dispatcher and GitHub Actions backup workflow. | [`scripts/run-ops.mjs`](file:///d:/23082026/scripts/run-ops.mjs), [`.github/workflows/supabase-backup-r2.yml`](file:///d:/23082026/.github/workflows/supabase-backup-r2.yml) | **P0** |
| **Security** | Correct secret names in backup sync script (`CLOUDFLARE_R2_*`). | [`scripts/sync-github-backup-secrets.ps1`](file:///d:/23082026/scripts/sync-github-backup-secrets.ps1) | **P0** |
| **SEO** | Prune 10 broken 404 product slugs from `productStaticParams.ts` and `sitemap.ts`. | [`site/lib/catalog/productStaticParams.ts`](file:///d:/23082026/site/lib/catalog/productStaticParams.ts) | **P0** |
| **Linting** | Expand `audit-eslint-disable.mjs` to check `site/hooks` and `config/build`; promote `react-hooks/exhaustive-deps` to error. | [`scripts/general/audit-eslint-disable.mjs`](file:///d:/23082026/scripts/general/audit-eslint-disable.mjs), [`.oxlintrc.json`](file:///d:/23082026/.oxlintrc.json) | **P1** |
| **Tech-Docs** | Wire `/repository-graph` route in Tech-Docs SPA and update `Database.tsx` ER diagram to live schema. | [`tech-docs-generator/src/App.tsx`](file:///d:/23082026/tech-docs-generator/src/App.tsx), [`tech-docs-generator/src/pages/Database.tsx`](file:///d:/23082026/tech-docs-generator/src/pages/Database.tsx) | **P1** |
| **Testing** | Author dedicated unit tests for `site/proxy.ts` covering routing, headers, and guest bypass. | `tests/unit/server/proxy.test.ts` | **P1** |
| **Scripts** | Purge 94 dead/throwaway scripts across `scripts/operations-review/`, `scripts/site-ui-content-links-audit/`, and root. | `scripts/` (94 files identified in List 1) | **P1** |
