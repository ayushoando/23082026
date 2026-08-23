# Master Architecture & Code Review Synthesis Report

**Repository:** `oando1408` Monorepo  
**Target:** Full Repository Architecture, Boundaries, Persistence, Canvas Engines, Design Systems, and Tooling  
**Author:** Lead Repository Architect  
**Workflow Phase:** Master Synthesis  

---

## 1. Executive Summary & Architecture Health Score

The `oando1408` monorepo demonstrates rigorous architectural discipline in several critical areas:
- **Zero Boundary Bleed:** The Studio (`/oostudio`) and Planner (`/ooplanner`) forks are completely isolated with zero cross-product edges across 959 files.
- **Canvas Scaling Discipline:** Exact canvas scale constants (**0.2 px/mm** for Studio and **0.05 px/mm** for Planner) are cleanly maintained across coordinate transformers, snapping, DXF exporters, and auto-layout solvers.
- **Modern App Router Security:** Strict Next.js 16 `proxy.ts` execution (zero `middleware.ts`), dynamic CSP nonces, fail-closed maintenance modes, and edge-level pre-filtering.
- **Strict FOCSS Token Layers:** PostCSS and FOCSS zone fences (`base`, `site`, `admin`, `planner`, `studio`) maintain clean separation, with zero hardcoded CSS color hex literals in component TSX and clean animation separation (GSAP vs Framer Motion).

However, our audit identified specific architectural regressions, misdirected database clients, and outdated validation targets that must be resolved to protect production runtime stability:
1. **Dual DB Client Misdirection:** Two server routes/repositories query the Admin DB (`rxzpznmxbaoxpikowmfc`) using Products DB (`erpweaiypimorcunaimz`) credentials, or vice versa.
2. **Production EROFS Gaps:** Disk operations in publish pipelines (`fs.readFile`) and pricing audit logging (`node:fs`) fail silently in serverless production read-only environments.
3. **Orphaned Stylesheets & Linter Path Drift:** FOCSS component stylesheets are disconnected from entry points, and `lint-ui-contract.mjs` inspects obsolete pre-fork directory paths.
4. **Test Harness & Generator Blind Spots:** Hollow test detection heuristics fail on multi-test files, and the Tech-Docs database extractor overlooks all 60 Supabase migrations.

### Overall Architecture Health Score: **88 / 100** → Post-Fixes: **93 / 100**

| Dimension | Weight | Score | Evaluation Highlights |
|---|:---:|:---:|---|
| **Security, Edge Proxy & Routing** | 15% | **92 / 100** | Pure `proxy.ts`, robust CSP nonces, CSRF double-submit; raw auth server actions lack Zod/rate-limiting. |
| **Fork Separation & Boundaries** | 15% | **100 / 100** | Flawless Studio $\leftrightarrow$ Planner isolation; 0 cross-import edges detected across 959 files. |
| **Canvas Engines & Geometry** | 15% | **95 / 100** | Strict 0.2 px/mm (Studio) and 0.05 px/mm (Planner) conformance; DXF exports and snap engines verified. |
| **Persistence & Dual-DB Isolation** | 20% | **78 / 100** | Sound `isDevAuthBypassEnabled()` core, but client routing cross-talk and raw disk writes in serverless prod paths exist. |
| **FOCSS & UI Architecture** | 15% | **86 / 100** | Clean zone boundaries and GSAP isolation; orphaned component CSS and custom non-RAC tooltips/menus. |
| **Test Suite & Verification Harness** | 10% | **84 / 100** | Two-lane Vitest operational; glob path bugs in auth tests, alias drift in coverage, and flawed hollow test heuristics. |
| **Tech-Docs & Repository Tooling** | 10% | **81 / 100** | Linter targeting stale pre-fork directories, SPA bundle un-split (>2.2MB), and Supabase migrations omitted from extractor. |

---

## 2. Critical Findings & Anti-Patterns Matrix

| ID | Severity | Subsystem / File | Description | Impact | Target Remediation |
|---|:---:|---|---|---|---|
| **SEC-01** | ~~**HIGH**~~ **✅ FIXED** | `site/features/admin/workspace-config/workspaceConfigurationRepository.server.ts` | Uses Products DB credentials (`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`) to query `workspace_editor_configs`, which lives on the Admin DB. | Workspace editor configuration changes fail or throw in production. | Switched `serviceClient()` to `createSupabaseAuthAdminClient()` from `@/platform/supabase/auth-admin`. |
| **SEC-02** | ~~**HIGH**~~ **✅ FIXED** | `site/app/api/admin/themes/route.ts` | Uses `createSupabaseAuthAdminClient()` (Admin DB) to query `block_themes`, which lives on the Products DB. | Triggers `isMissingTableError` and falls back to starter packs. | Switched client to `createAdminServiceClient()` targeting Products DB. |
| **STO-01** | **HIGH** | `site/app/api/Studio/furniture/[id]/publish/route.ts` | Unconditionally reads `_top.png` via `fs.readFile` from local disk during publish. | Read fails in production Supabase mode (read-only FS); publishes items with missing `topPngChecksum`. | Fall back to `item.top_png_checksum` or fetch buffer from Supabase Storage before quality gate. |
| **DOC-01** | ~~**HIGH**~~ **✅ FIXED** | `tech-docs-generator/scripts/extract-database.mjs` | Database extractor only inspects `site/platform/drizzle/migrations` (2 migrations), omitting 60 Supabase migrations. | Tech-Docs SPA Database page displays truncated and inaccurate migration inventory. | Extended extractor to parse all 60 migrations from `site/platform/supabase/migrations` and `migrations.admin`. |
| **DOC-02** | ~~**HIGH**~~ **✅ FIXED** | `tech-docs-generator/scripts/extract-features.mjs` | `featurePageCandidates` searches pre-relocation paths, missing `site/features/site/planner/landing/plannerFeaturePages.ts`. | Planner marketing feature pages omitted from generated architecture dataset. | Updated candidate paths to include `site/features/site/planner/landing/plannerFeaturePages.ts` with TypeScript 7 compatibility fallback. |
| **TST-01** | **HIGH** | `scripts/general/hollow-test-patterns.mjs` | `sole-truthy` and `sole-defined` checks only trigger if whole-file `countExpectCalls(source) <= 1`. | Files with multiple weak `.toBeDefined()` / `.toBeTruthy()` tests bypass the audit undetected. | Update audit heuristic to evaluate assertion quality per `it()` / `test()` block or measure weak-to-strong assertion ratios. |
| **CSS-01** | ~~**MED**~~ **✅ FIXED** | `site/focss/site/components/products/` & `chrome/` | Stylesheets (`catalog-category-hero.css`, `catalog-desktop.css`, `product-entry-page.css`, `shell-global-nav.css`) not imported in zone barrels. | CSS classes used in TSX components are never loaded into `site/entry.css`. | Added `@import` statements in `products/index.css` and `chrome/index.css`. |
| **SEC-03** | **MED** | `site/lib/auth/supabaseServerActions.ts` | `loginWithSupabase` and `signupWithSupabase` are raw server actions without Zod schemas or IP rate-limits. | Susceptible to brute-force auth attempts and unvalidated input payloads. | Wrap via `next-safe-action` with Zod input schema and `assertActionRateLimit("auth-login", 10)`. |
| **SEC-04** | **MED** | `site/lib/safe-action.ts` | `handleServerError` returns `error.message` directly in production. | Potential leakage of internal Postgres error codes or table schema details to clients. | Mask unhandled errors in production when not an instance of `ApiError`. |
| **STO-02** | **MED** | `site/features/admin/pricing/priceBookGovernance.server.ts` | `appendPriceBookAudit()` writes directly to `_price-book-audit.jsonl` using raw `node:fs`. | Price book audit logs are silently dropped in serverless production. | Route production price book audit records to the `audit_events` table in `adminDb`. |
| **DB-01** | **MED** | `site/platform/supabase/migrations.admin/` (8 files) | 8 legacy Admin DB migrations lack `-- rollback` statements. | Fails bidirectional migration reversibility standards. | Add reverse DDL blocks (`-- rollback ...`) and ratchet baseline to 0. |
| **TOOL-01**| ~~**MED**~~ **✅ FIXED** | `scripts/general/lint-ui-contract.mjs` | Linter matchers point to deleted paths (`features/planner/workspace`, `features/admin/product-studio`). | UI contract checks silently scan 0 files across critical UI sections. | Updated `isProductZonePath()` to include all active forked directories: `site/features/Planner`, `site/features/Studio`, `site/components/Planner`, `site/components/Studio`, `site/app/ooplanner`, `site/app/oostudio`. |
| **A11Y-01**| **MED** | `site/lib/ui/Tooltip.tsx` & `StudioContextMenu.tsx` | Custom popup implementations bypass `react-aria-components`, lacking keyboard trap, roving focus, and ARIA descriptors. | Inaccessible to screen readers and keyboard-only navigation users. | Upgrade to `react-aria-components` primitives (`<TooltipTrigger>`, `<MenuTrigger>`). |
| **TST-02** | ~~**MED**~~ **✅ FIXED** | `tests/vitest.config.ts` | `environmentMatchGlobs` contains `tests/unit/lib/auth/**/*.test.ts` missing leading `../`. | Auth unit tests default to `happy-dom` instead of `node` environment. | Fixed glob path to `["../tests/unit/lib/auth/**/*.test.ts", "node"]`. |
| **SPA-01** | **MED** | `tech-docs-generator/src/App.tsx` | Monolithic static imports of all 12 doc pages with heavy dependencies (`mermaid`, `cytoscape`, `katex`). | Initial bundle bloats to ~2.28 MB (~628 kB gzip). | Convert page imports to `React.lazy()` with `<Suspense>` route-level chunking. |

---

## 3. Subsystem Breakdown

### 3.1 Next.js App Router, Routing & Security Layer
* **Strengths:** Clean Next.js 16 edge proxy (`site/proxy.ts`), dynamic per-request CSP nonces, granular evaluation permissions (`'unsafe-eval'` restricted to `/oostudio` and `/ooplanner`), timing-safe CSRF validation (`crypto.timingSafeEqual`), and strict `devAuthBypass` disabling in production.
* **Gaps:** Raw server actions in `supabaseServerActions.ts` lack rate limiting; `handleServerError` exposes raw error strings; fragmented admin route wrappers (`site/app/api/admin/_lib/server.ts`).
* **Key Remediation:** Standardize all server actions and route handlers on `next-safe-action` and `withAuth`, and unify IP resolution through `site/lib/clientIp.ts`.

### 3.2 Studio Application Fork (`/oostudio`)
* **Strengths:** Complete decoupling from Planner; canonical **0.2 px/mm** coordinate scale enforced across Fabric v7 layers, rulers, snapping, and DXF exporter; bounded JSON undo/redo history; Sharp SVG-to-PNG rasterization contract.
* **Gaps:** Publish route fails on read-only production filesystems (STU-01); `/api/Studio/furniture/upload` lacks server-rendered PNG generation; history `loadJson` desynchronizes selection state with canvas toolbar.
* **Key Remediation:** Fix production publish path to use Supabase Storage buffers; route uploads through `prepareStudioFurnitureCatalogFiles`; dispatch selection reset on history reload.

### 3.3 Planner Application Fork (`/ooplanner`)
* **Strengths:** Strict adherence to **0.05 px/mm** canvas scale; single-source-of-truth persistence (`oando_plans`); foreign-key safe profile upserts (`ensurePlannerProfile`); accessible export menus with roving keyboard focus; priority snapping hierarchy.
* **Gaps:** Unwired `onUnderlayImage` handler in `PlannerSheetPanel.tsx`; direct coordinate division (`b.left / scale`) instead of canonical `pxToMm` helper in `doAutoArrange`.
* **Key Remediation:** Wire `onUnderlayImage` through `PlannerBridge` to sheet settings; replace inline divisions with `pxToMm` / `mmToPx` helpers; connect `distanceGuides.ts` to live dragging.

### 3.4 Backend, Dual Supabase & Persistence Architecture
* **Strengths:** Strict isolation between Admin DB (`rxzpznmxbaoxpikowmfc`) and Products DB (`erpweaiypimorcunaimz`); intact R2 credential pair isolation; immutable caching for catalog assets.
* **Gaps:** Client target inversion in `workspaceConfigurationRepository.server.ts` and `themes/route.ts`; raw `node:fs` calls in price book audit; 8 Admin DB migrations lacking down migrations; backup scripts lack multipart upload support.
* **Key Remediation:** Correct client factories across all admin feature repositories; redirect price book audit logging to `adminDb`; add rollback SQL to all 8 migrations.

### 3.5 FOCSS Design System & UI Styling
* **Strengths:** 100% boundary isolation across CSS zones; zero hardcoded color hex values in TSX styling attributes; clean separation of GSAP (ScrollTrigger / canvas context) and Framer Motion (tree mount/unmount).
* **Gaps:** Four orphaned stylesheets under `site/focss/site/components/`; inline pixel styling in `PlannerAutoArrangeDialog.tsx`; custom non-RAC implementations of tooltips and context menus.
* **Key Remediation:** Connect unlinked stylesheets into zone barrels; convert custom popups/tooltips to `react-aria-components`; clean up modal inline styles into FOCSS classes.

### 3.6 Test Suite & Quality Verification Harness
* **Strengths:** Two-lane Vitest architecture separating fast parallel tests from serialized tech-docs filesystem tests; clean browser storage isolation for Playwright E2E suites; non-production bypass enforcement during tests.
* **Gaps:** Glob typo in `environmentMatchGlobs` running auth tests in Happy-DOM; alias omission in inventory coverage configs; flawed file-level heuristic in hollow test audit; missing global `window.matchMedia` mock.
* **Key Remediation:** Fix Vitest glob prefix; centralize aliases in `tests/vitest.shared.ts`; update hollow test auditor to scan per-test blocks; install global `matchMedia` mock in `tests/setup.ts`.

### 3.7 Tech-Docs Generator & Repository Tooling
* **Strengths:** Automated boundary verification (`scan:boundaries`); CSS integrity checks; governance baselines with automated ratcheting.
* **Gaps:** `lint-ui-contract.mjs` checks dead pre-fork directory paths; Tech-Docs extractor misses Supabase migrations and planner marketing pages; monolithic SPA initial bundle.
* **Key Remediation:** Update linter paths to reflect the active directory layout; extend database extractor to parse Supabase migrations; implement `React.lazy()` code splitting in the SPA.

---

## 4. Non-Negotiable Rules Audit

| Rule / Architectural Standard | Verification Method | Status | Compliance Details & Evidence |
|---|---|:---:|---|
| **1. Studio $\leftrightarrow$ Planner Fork Isolation** | `pnpm run scan:boundaries` | **PASS (100%)** | 0 cross-product edges across 959 files. Zero shared mutable state or cross-app imports. |
| **2. Dual Database Separation** | Static Code Analysis | **ACTION REQUIRED** | Admin DB and Products DB schemas are distinct, but 2 endpoints query the wrong instance (`workspace-config` and `themes`). |
| **3. Mode-Aware Persistence (No EROFS)** | Production Runtime Audit | **ACTION REQUIRED** | `isDevAuthBypassEnabled()` is solid, but `furniture/[id]/publish` and `priceBookGovernance` use raw `node:fs` calls. |
| **4. Coordinate Geometry Scaling** | Unit Test Verification (34 Suites) | **PASS (100%)** | Studio strictly uses **0.2 px/mm** ($5\text{ mm/px}$); Planner strictly uses **0.05 px/mm** ($20\text{ mm/px}$). DXF outputs verified. |
| **5. FOCSS Design Token Layer** | `verify:focss`, `check:style-tokens` | **PASS (Clean)** | Zero cross-zone CSS imports; no hardcoded hex styling in TSX; GSAP and Framer Motion are strictly segregated. |
| **6. Migration Rollback Governance** | `pnpm run check:governance` | **ACTION REQUIRED** | Products DB is 100% compliant (44/44); Admin DB has 8 legacy migrations missing `-- rollback` statements. |
| **7. Localhost Binding Policy** | Playwright & IP Normalizer Audit | **PASS (100%)** | Dev server bound to `localhost:3000`; Playwright and `clientIp.ts` normalize all loopback traffic to `localhost`. |

---

## 5. Prioritized Action Plan & Execution Roadmap

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                        PHASE 1: STABILITY & SECURITY                   │
  │  • Fix Dual DB client cross-wiring (workspace-config & themes)         │
  │  • Guard serverless EROFS publish & audit disk writes                  │
  │  • Wrap raw auth server actions with Zod schemas & rate limits         │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                        PHASE 2: TOOLING & RECOVERY                     │
  │  • Update lint-ui-contract.mjs to target active forked directory paths │
  │  • Fix Tech-Docs migration & feature page extractors                   │
  │  • Fix Vitest auth test glob & centralize path aliases                 │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                        PHASE 3: UI, CSS & ACCESSIBILITY                │
  │  • Wire orphaned FOCSS stylesheets into zone index barrels             │
  │  • Upgrade Tooltip and ContextMenu to react-aria-components            │
  │  • Convert Tech-Docs SPA to React.lazy() route code splitting          │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                        PHASE 4: GOVERNANCE & RATCHETS                  │
  │  • Add rollback blocks to 8 legacy Admin DB migrations                 │
  │  • Ratchet governance baseline down to 0 unrolled migrations           │
  │  • Ratchet style token baseline and upgrade hollow test auditor        │
  └────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Critical Stability & Security Fixes (Immediate)
1. **Fix Dual DB Client Mismatches:**
   - In `site/features/admin/workspace-config/workspaceConfigurationRepository.server.ts`, replace `serviceClient()` with `createSupabaseAuthAdminClient()`.
   - In `site/app/api/admin/themes/route.ts`, replace `createSupabaseAuthAdminClient()` with `createAdminServiceClient()`.
2. **Prevent Serverless Production Disk Crashes (EROFS):**
   - In `site/app/api/Studio/furniture/[id]/publish/route.ts`, verify persistence mode; if not `"disk"`, resolve asset bytes from Supabase Storage or fallback to `item.top_png_checksum`.
   - In `site/features/admin/pricing/priceBookGovernance.server.ts`, wrap `appendPriceBookAudit()` with `isDevAuthBypassEnabled()` and route production audit events to the Admin DB `audit_events` table.
3. **Secure Auth Server Actions:**
   - In `site/lib/auth/supabaseServerActions.ts`, wrap `loginWithSupabase` and `signupWithSupabase` using `actionClient` with Zod input validation and IP rate limiting. Mask unhandled server errors in `site/lib/safe-action.ts`.

### Phase 2: Tooling & Test Harness Remediation (Days 1–2)
1. **Synchronize UI Contract Linter:**
   - In `scripts/general/lint-ui-contract.mjs`, update all search paths from obsolete pre-fork paths to active directories: `site/features/Planner`, `site/features/Studio`, `site/components/Planner`, `site/components/Studio`, `site/app/ooplanner`, `site/app/oostudio`.
2. **Restore Tech-Docs Extraction Integrity:**
   - In `tech-docs-generator/scripts/extract-features.mjs`, update `featurePageCandidates` to include `site/features/site/planner/landing/plannerFeaturePages.ts`.
   - In `tech-docs-generator/scripts/extract-database.mjs`, collect migration files from `site/platform/supabase/migrations` and `site/platform/supabase/migrations.admin`.
3. **Correct Vitest Configuration:**
   - In `tests/vitest.config.ts`, prefix the auth glob: `["../tests/unit/lib/auth/**/*.test.ts", "node"]`.
   - In `tests/vitest.shared.ts`, export `VITEST_COMMON_ALIASES` and import it across all Vitest configuration profiles.
   - In `tests/setup.ts`, add the global `window.matchMedia` stub.

### Phase 3: UI, CSS & Accessibility Upgrades (Days 2–3)
1. **Wire Unlinked FOCSS Stylesheets:**
   - Add `@import "./catalog-category-hero.css";`, `@import "./catalog-desktop.css";`, and `@import "./product-entry-page.css";` to `site/focss/site/components/products/index.css`.
   - Add `@import "./shell-global-nav.css";` to `site/focss/site/components/chrome/index.css`, and delete redundant `portal-svg-catalog.css`.
2. **Refactor Headless Components for Accessibility:**
   - Replace custom `setTimeout` listeners in `site/lib/ui/Tooltip.tsx` with `react-aria-components` `<TooltipTrigger>` and `<Tooltip>`.
   - Refactor `StudioContextMenu.tsx` to ensure full keyboard navigation (Arrows, Escape, Enter) and focus restoration.
3. **Optimize Tech-Docs SPA Bundle:**
   - In `tech-docs-generator/src/App.tsx`, convert page imports to `React.lazy()` with `<Suspense fallback={<PageSkeleton />}>`.
   - Add slugified `id` attributes to section headings and mount `TableOfContents` across all documentation pages.

### Phase 4: Database Governance & Quality Ratchets (Days 3–4)
1. **Complete Database Migration Rollbacks:**
   - Append `-- rollback` DDL statements to the 8 unrolled files in `site/platform/supabase/migrations.admin/`.
   - Run `node scripts/general/check-governance.mjs --update` to ratchet `P4_migration_no_rollback` from 42 down to `0`.
2. **Upgrade Hollow Test Auditing:**
   - In `scripts/general/hollow-test-patterns.mjs`, update `sole-truthy` and `sole-defined` checks to evaluate assertion quality per test block rather than whole-file counts.
   - Run `node scripts/general/check-style-tokens.mjs --update` to ratchet down the style token baseline.

---

### Verification Sign-Off Checklist
- [ ] `pnpm run check:layout` passes with 0 anomalies.
- [ ] `pnpm run scan:boundaries` confirms 0 cross-boundary edges between Studio and Planner.
- [ ] `pnpm run verify:focss` passes with 0 unreachable or missing stylesheets.
- [ ] `pnpm run test` passes both default and tech-docs Vitest lanes.
- [ ] `pnpm run check:governance` passes with 0 unrolled migrations.
- [ ] `pnpm run gate` passes full compilation, build, and test verification.
