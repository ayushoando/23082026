# Exhaustive Subsystem Master Remedy & Platform Blueprint (2026-09-05)

**Document:** `plans/05092026/phased-remedy-plan.md`  
**Governing Standard:** `AGENTS.md` (Authority floor: User instruction > live code/fresh command output > `AGENTS.md` > `Agents/` > `docs/`)  
**Methodology:** Comprehensive Horizontal and Vertical Subsystem Master Architecture, Deep Technical Specifications, and Actionable Verification Runbooks  
**Execution State:** **FROZEN / PLANNING ONLY** (`NO CODE CHANGE`, `NO AUTO IMPLEMENT`)  
**Scope:** Repository-wide platform layers across Next.js 16.3.3 engine, FOCSS Tailwind v4 styling, Studio vs Planner isolation, dual-database split, AI & Cloudflare edge infrastructure, dual-lane Vitest test subsystem, Playwright browser gates, test integrity audits, scripts & ops subsystem, asset sizing, and Tech-Docs SPA.

---

## 1. Executive Summary & Repository Invariants

This master blueprint delivers an exhaustive architectural investigation and phased execution plan across all platform layers in the Oando repository (`D:\23082026`). Rather than narrowing into isolated UI tweaks or single-file fixes, this plan encompasses the entire system horizontally and vertically across all platform layers.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            OANDO PLATFORM ARCHITECTURE                            │
├─────────────────────────┬────────────────────────────┬───────────────────────────┤
│    Public & Marketing   │    Interactive Workspaces  │     Admin & Operations    │
│    site/app/(site)      │    /ooplanner  │  /oostudio│     site/app/admin        │
├─────────────────────────┴────────────────────────────┴───────────────────────────┤
│                               Design & Styling Layer                             │
│       FOCSS Semantic Engine (Tailwind CSS v4 @tailwindcss/postcss)               │
│       4 Isolated Zones: site/entry.css, admin/entry.css, planner/, studio/       │
│       GSAP 3.15.0 Animation Layer (ScrollTrigger + gsapPageScroller)             │
├──────────────────────────────────────────────────────────────────────────────────┤
│                           Core Application Runtime Engine                        │
│       Next.js 16.3.3 (Webpack Engine, Node 24 baseline, TypeScript ^7.0.2)       │
│       next-intl Localization (en, hi - 861 keys across 26 namespaces)            │
│       Standalone Distribution (scripts/general/prepare-standalone.cjs)           │
├──────────────────────────────────────────────────────────────────────────────────┤
│                            AI & Cloud Edge Subsystem                             │
│       Mastra Provider Chain: Gemini -> OpenRouter -> OpenAI -> Bedrock           │
│       Cloudflare Worker Proxy (oando-worker-proxy), Vectorize (catalog-nav)      │
│       Cloudflare R2 Bucket (oando-asset-cdn), S3 API, Automated Backups          │
├──────────────────────────────────────────────────────────────────────────────────┤
│                          Data & Dual-Database Layer                              │
│       Admin DB (rxzpznmxbaoxpikowmfc): Plans, Profiles, Furniture, Descriptors   │
│       Products DB (erpweaiypimorcunaimz): Catalog, Configurators, Flags, Themes  │
│       Persistence Mode Wrappers: furnitureCatalogMode.ts, plannerPersistenceMode │
│       Production Filesystem Read-Only Protection (assertDevDiskWritable -> EROFS)│
├──────────────────────────────────────────────────────────────────────────────────┤
│                        Verification & Release Gate Suite                         │
│       Lane 1 Vitest (780 files)  │ Lane 2 Vitest Tech-Docs (42 files, 224 specs) │
│       Playwright Browser Gate (8 specs, 4 viewports) │ Test Integrity Audits     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Core Master Invariants:
1. **Zero Code Changes (`NO CODE CHANGE`):** Strictly zero edits to application source code, test files, or scripts during this blueprinting phase.
2. **Zero Auto-Implementation (`NO AUTO IMPLEMENT`):** All output is delivered strictly as an authoritative technical blueprint and runbook.
3. **User Wins & Authority Order:** Current user instruction > live code/fresh command output > `AGENTS.md` > `Agents/` > `docs/`. Tests, builds, gates, and browser checks require exact current-session user authorization.
4. **Platform Boundary Isolation:** Studio (`/oostudio`) and Planner (`/ooplanner`) are strictly forked, isolated applications. Cross-imports between `@planner/*` and `@studio/*` are strictly forbidden and ratchet-checked via `pnpm run scan:boundaries`.
5. **Dual-Database Split (Zero Dual-Write):**
   - **Admin Database (`rxzpznmxbaoxpikowmfc`):** Holds plans (`oando_plans`), profiles, handoffs, teams, price books, queries, audit events (`audit_events`), furniture items (`furniture_catalog`), and block descriptors (`block_descriptors`).
   - **Products Database (`erpweaiypimorcunaimz`):** Holds marketing catalog (`catalog_products`, `catalog_product_images`, `catalog_product_specs`), configurators, feature flags, and themes.
6. **Read-Only Production Filesystem:** Serverless and production runtimes have read-only filesystems. Direct disk writes crash with `EROFS`. Disk writes are permitted only when `DEV_AUTH_BYPASS=1` in non-production. All runtime writes must route through mode-aware persistence wrappers (`writeFurnitureItem`, `savePlannerProject`).
7. **Absolute Quarantine:** `docs/protected-folder/` (and any nested `protected-folder/`) is completely quarantined. Never read, view, list, grep, import, or reference this directory.
8. **Blocker Accounting:** All blockers must reside solely in `Failures.md`. Adding or removing rows requires reproducible evidence observed in the current session.

---
## 2. Subsystem Module 1: Full Tech Stack Architecture & Runtime Engines

### 2.1 Next.js 16.3.3 Webpack Engine & Node Baseline
- **Engine Baseline:** Next.js `16.3.3` running on Node 24, React `19.2.8`, React-DOM `19.2.8`, TypeScript `^7.0.2` with `pnpm 11.24.0`.
- **Compiler Configuration (`site/next.config.js` & `config/build/next.config.js`):**
  - Webpack is the primary engine (`next dev site --webpack`, `next build site --webpack`). Turbopack is reserved for optional low-RAM probes (`dev:turbo`).
  - TypeScript 7 integration: `experimental: { useTypeScriptCli: true }` instructs Next.js to use the project-local `tsc` CLI rather than the removed JS compiler API.
  - Package import optimization: `experimental: { optimizePackageImports: ["@phosphor-icons/react", "framer-motion"] }`.
  - Server external packages: `serverExternalPackages: ["sharp", "@lancedb/lancedb", "@mastra/core"]` to prevent bundling native C++ binaries or dynamic-require modules into Webpack chunks.
  - Webpack resolution aliases & client fallbacks:
    ```typescript
    config.resolve.alias = {
      ...config.resolve.alias,
      "@focss": focssRoot,
      "@focss/": `${focssRoot}/`,
      "@oando/focss": focssRoot,
      "@oando/focss/": `${focssRoot}/`,
    };
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }
    ```
- **Security Headers & CSP:** Strict Content-Security-Policy denying frame-ancestors, blocking unauthorized script origins, enforcing HTTPS HSTS (`max-age=31536000; includeSubDomains; preload`), `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.

### 2.2 FOCSS CSS Engine & Tailwind v4 Isolation
FOCSS (`site/focss/`) is a plain CSS architectural layer built atop Tailwind CSS v4 (`@tailwindcss/postcss` 4.3.3). It is not an npm package. It enforces strict boundary isolation across 4 zones:

```
site/focss/
  ├── base/             # Shared tokens, typography, document baseline
  │     ├── tokens/     # palette.css, semantic.css, layout.css
  │     ├── type/       # typography.css, type.css (typ-* utilities)
  │     ├── scan.css    # @import "tailwindcss" scanner
  │     ├── runtime.css # @import "tw-animate-css"
  │     └── index.css   # Consolidated foundation
  ├── site/             # Zone 1: Marketing entry (site/entry.css)
  ├── admin/            # Zone 2: Admin entry (admin/entry.css) - scopes overrides to .shell-admin-layout
  ├── planner/          # Zone 3: Planner entry (planner/entry.css) - owns Tailwind scan, no base/scan.css
  └── studio/           # Zone 4: Studio entry (studio/entry.css) - product base + studio chrome
```

- **Zone Boundaries:**
  - `planner/entry.css` is completely self-contained with its own `@import "tailwindcss"`, `planner/base/palette.css`, and `planner/base/semantic.css`. It strictly forbids importing `base/scan.css` or `base/tokens/semantic.css`.
  - `admin/entry.css` must scope all overrides strictly under `.shell-admin-layout` and must never override document-level `body` tokens (`verify-focss.mjs` line 240).
  - Cross-zone imports between `planner/` and `studio/` or between `site/` and `admin/` are hard-blocked.
- **Token Bypass Ratchet (`scripts/general/check-style-tokens.mjs`):**
  - Enforces governance rules C3 (raw hex/rgb), C4 (pixel literals), and C5 (arbitrary bracket values).
  - Inspects only styling positions: `className="..."`, `style={{ ... }}`, and non-token `.css` declaration lines.
  - Baseline recorded in `config/quality/style-token-baseline.json` at exactly **200 findings**. Remediation can lower the baseline; any commit increasing the count fails the gate.

### 2.3 GSAP Dominant Animation Layer
- **Core Engine:** GSAP `3.15.0` with `@gsap/react` `2.1.2` and `ScrollTrigger`.
- **Centralized Motion Coordinator (`site/lib/helpers/gsapMotion.ts`):**
  - **Scroll Scroller Invariant:** Phone viewports scroll inside `.mobile-app-main`, not `window`. Using `window` as the ScrollTrigger scroller causes `gsap.from()` tweens to freeze at `opacity: 0`. The helper `gsapPageScroller()` inspects the DOM and binds the scroller dynamically:
    ```typescript
    export function gsapPageScroller(from?: Element | null): HTMLElement | undefined {
      const root = from instanceof Element ? from : document.body;
      const main = root.closest?.(".mobile-app-main") ?? document.querySelector(".mobile-app-main");
      if (!(main instanceof HTMLElement)) return undefined;
      const overflowY = getComputedStyle(main).overflowY;
      return (overflowY === "auto" || overflowY === "scroll") ? main : undefined;
    }
    ```
  - **Reduced Motion Support:** Listens to `(prefers-reduced-motion: reduce)` via `gsapReducedMotion()` and `subscribeGsapReducedMotion()` to skip parallax, reveals, and staggers for accessibility.
  - **Standard Timing Constants:** `GSAP_EASE_OUT = "power3.out"`, `GSAP_REVEAL = { y: 16, opacity: 1, duration: 0.7, stagger: 0.07 }`.

---
## 3. Subsystem Module 2: Interactive Workspaces (Studio & Planner)

### 3.1 Namespace Fork & Boundary Isolation
Studio (`/oostudio`) and Planner (`/ooplanner`) are strictly forked applications. They share zero code directly and must never import across product lines.

```
                    site/
                      ├── components/
                      │     ├── Planner/   ◄─── NEVER CROSS-IMPORT ───►   Studio/
                      ├── lib/
                      │     ├── Planner/   ◄─── NEVER CROSS-IMPORT ───►   Studio/
                      ├── hooks/
                      │     ├── Planner/   ◄─── NEVER CROSS-IMPORT ───►   Studio/
                      ├── store/
                      │     ├── Planner/   ◄─── NEVER CROSS-IMPORT ───►   Studio/
                      ├── server/
                      │     ├── Planner/   ◄─── NEVER CROSS-IMPORT ───►   Studio/
                      ├── features/
                      │     ├── Planner/                                  Studio/
                      ├── app/
                      │     ├── ooplanner/                                oostudio/
                      │     └── api/Planner/                              api/Studio/
                      └── focss/
                            ├── planner/                                  studio/
```

- **Boundary Enforcement Gate (`scripts/scan-boundaries.mjs`):**
  - Validates all 10 namespace roots exist.
  - Validates required authority anchors (`plannerPalette.ts`, `plannerTokens.ts`, `studioPalette.ts`, `studioTokens.ts`, etc.).
  - Rejects any import matching `@studio/*` or `site/*/Studio/` from within Planner, and vice versa.
  - Rejects obsolete roots (`site/apps/planner`, `site/apps/studio`) and forbidden shared folders (`site/lib/shared`, `site/components/OOShared`, `site/focss/ooshared`).

### 3.2 Fabric 7.4.0 Canvas Engine & Scale Invariants
Both applications build upon Fabric.js `7.4.0`, but maintain distinct physical scale invariants that must never be mixed:

| Attribute | Product Studio (`/oostudio`) | Floor Planner (`/ooplanner`) | Plan Symbol PNG Contract |
| :--- | :--- | :--- | :--- |
| **Physical Role** | Component furniture authoring | Architectural space planning | Raster catalog symbol rendering |
| **Scale Ratio** | **0.2 px/mm** | **0.05 px/mm** | **2.0 px/mm** |
| **1000 mm Physical** | 200 canvas pixels | 50 canvas pixels | 2000 raster pixels |
| **Padding** | N/A | Variable / wall offset | Exactly 40 mm pad each side |
| **Contract File** | `studioGeometryContract.ts` | `plannerGeometryContract.ts` | `site/lib/catalog/planSymbolPngContract.ts` |
| **Legacy Handling** | Native format | Deterministic adapter for 0.2 px/mm snapshots | SHA-256 hex checksum validation |

- **Planner Geometry Persistence Contract (`site/lib/Planner/plannerGeometryContract.ts`):**
  - Contract version: 1, schema version: 1, unit: `"mm"`, scale: `0.05 px/mm`.
  - Deterministic adaptation: Any legacy snapshot at `STUDIO_SCALE_PX_PER_MM = 0.2` is deterministically converted to `0.05 px/mm` without precision loss. Unknown scales throw `UNSUPPORTED_PLANNER_SCALE`.
- **PNG Plan-Symbol Contract (`site/lib/catalog/planSymbolPngContract.ts`):**
  - Scale: `PLAN_SYMBOL_PX_PER_MM = 2` (2 px/mm density).
  - Padding: `PLAN_SYMBOL_PAD_MM = 40` (40 mm pad matches `CatalogBlockPreview`).
  - Raster box math: Core pixels = `Math.round(mm * 2)`. Total raster width = `coreWidthPx + padPx * 2`.
  - Checksum validation: 64-character SHA-256 hex string stored in `planSymbolPngChecksum`.

### 3.3 Dockview 8.2.0 Desktop Shells & State Stores
- **Docking Engine:** `dockview-react` `8.2.0` with `themeLight` styling.
- **Forked Shell Components:** `StudioDockShell.tsx` and `PlannerDockShell.tsx` operate isolated panel definitions (`DockPanelDef`, `DockviewApiLike`).
- **Floating Header Controls:** `StudioDockFloatHeaderActions.tsx` and `PlannerDockFloatHeaderActions.tsx` provide tab-header controls to pop out groups into floating windows or re-dock them with mouse drag tracking.
- **State Management (Zustand 5.0.15):**
  - Studio stores: `studioCatalogStore.ts` (catalog items, selected piece), `studioUiStore.ts` (active tool, zoom, pan).
  - Planner stores: `plannerCatalogStore.ts` (furniture library, placement status), `plannerUiStore.ts` (wall mode, measurement tools, grid snapping).
  - Server persistence stores: `site/server/Studio/studioStore.ts` and `site/server/Planner/plannerStore.ts` handle serialization and mode-aware database persistence.

---
## 4. Subsystem Module 3: Data Platform, Dual-Database Split & Cloud Infrastructure

### 4.1 Dual-Database Architecture & RLS Boundary

```
                                  Platform Runtime
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     [Admin Database Project]                       [Products Database Project]
      Ref: rxzpznmxbaoxpikowmfc                      Ref: erpweaiypimorcunaimz
      URL: NEXT_ADMIN_SUPABASE_URL                   URL: NEXT_PUBLIC_SUPABASE_URL
  ┌─────────────────────────────────────┐        ┌─────────────────────────────────────┐
  │ - oando_plans (Floor plans)         │        │ - catalog_products (Marketing)      │
  │ - profiles & auth.users             │        │ - catalog_product_images            │
  │ - furniture_catalog (Authoring)     │        │ - catalog_product_specs             │
  │ - block_descriptors                 │        │ - catalog_product_slug_aliases      │
  │ - audit_events                      │        │ - configurator_products             │
  │ - teams, price_books, handoffs      │        │ - feature_flags & active themes     │
  └─────────────────────────────────────┘        └─────────────────────────────────────┘
```

- **Database Credentials & Misuse Guard (`site/platform/supabase/env.ts`):**
  - `NEXT_ADMIN_SUPABASE_URL` and `SUPABASE_ADMIN_SERVICE_ROLE_KEY` access the Admin project.
  - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` access the Products project.
  - **Finding 9.3 Security Guard:** `assertNotServiceRoleKey()` decodes JWT payloads and immediately throws if a key with `role === "service_role"` is provided in an anon/publishable slot, preventing accidental RLS bypass on public endpoints.

### 4.2 Mode-Aware Persistence Wrappers (Zero Dual-Write)
- **Production Filesystem Invariant:** Vercel serverless functions have a read-only disk. Any call to `fs.writeFile` crashes with `EROFS`.
- **Enforcement Helper (`site/lib/persistence/assertDevDiskWritable.ts`):**
  ```typescript
  export function assertDevDiskWritable(env = process.env): void {
    if (isDevAuthBypassEnabled(env)) return;
    const err = new Error("Disk writes are disabled outside DEV_AUTH_BYPASS local mode (production FS is read-only)");
    (err as NodeJS.ErrnoException).code = "EROFS";
    throw err;
  }
  ```
- **Mode Selectors:**
  - **Furniture Catalog (`site/lib/catalog/furnitureCatalogMode.ts`):** Returns `"disk"` if `DEV_AUTH_BYPASS=1`, else `"supabase"`. Writes route exclusively to `site/platform/shared/data/furniture/` on disk OR `public.furniture_catalog` in Admin Supabase.
  - **Planner Projects (`site/lib/Planner/plannerPersistenceMode.ts`):** Returns `"disk"` only when `DEV_AUTH_BYPASS=1` AND `NODE_ENV !== "production"`. In production, it unconditionally routes to `oando_plans` in Admin Supabase. Ambiguous flag values reject without executing. Selected adapter failures propagate directly without fallback writing.

### 4.3 AI & Search Subsystem (Mastra AI & Cloudflare Vectorize)
- **Mastra AI Fallback Chain (`site/lib/ai/mastra/providers.ts`):**
  1. **Gemini:** Free tier default (`gemini-2.5-flash`), 15 RPM, 1M tokens/day via Google Generative AI endpoint.
  2. **OpenRouter Primary:** `openrouter/auto` via `OPENROUTER_API_KEY_PRIMARY`.
  3. **OpenRouter Backup:** `openrouter/auto` via `OPENROUTER_API_KEY_BACKUP`.
  4. **OpenAI Fallback:** `gpt-4o-mini` via `OPENAI_API_KEY`.
  5. **Amazon Bedrock Fallback:** `us.amazon.nova-lite-v1:0` via AWS credentials.
  - **Allowlist Gate:** `APPROVED_PROVIDER_MODELS` enforces that only explicitly allowlisted provider/label pairs can enter the runtime model chain.
- **Cloudflare Edge Proxy (`workers/oando-worker-proxy/`):**
  - Built with Wrangler, routes `oando.co.in/*` and `www.oando.co.in/*`.
  - Enforces HTTPS HSTS, serves edge RFC 9116 `/.well-known/security.txt`, executes 308 redirect from `www` to apex.
  - Serves static assets directly from Cloudflare R2 bucket `oando-asset-cdn` with zero Vercel egress cost.
  - Routes dynamic requests to Vercel origin (`https://23082026.vercel.app`) while stripping preview noindex headers on `PUBLIC_INDEXABLE_HOSTS`.
- **Cloudflare Vectorize (`catalog-nav`):**
  - Vector dimension: **768**, metric: **cosine**.
  - Bound in `wrangler.toml` via `[[vectorize]] binding = "CATALOG_VECTORS" index_name = "catalog-nav"`.
  - Supports RAG embeddings for AI catalog semantic search.
- **R2 Backup Sync Automation (`scripts/sync-github-backup-secrets.ps1`):**
  - Synchronizes canonical backup credentials (`PRODUCTS_DATABASE_URL`, `SUPABASE_AUTH_DATABASE_URL`, `CLOUDFLARE_R2_*`) from `.env.local` to GitHub Actions secrets.

---
## 5. Subsystem Module 4: Localization Subsystem (next-intl Parity)

### 5.1 Bilingual Architecture & Routing
- **Locales:** English (`en`, default) and Hindi (`hi`).
- **Configuration:** `site/i18n/config.ts` and `site/i18n/request.ts` load locale messages per request via `next-intl/plugin`.
- **Key Coverage:** **861 leaf translation keys** across **26 namespaces** in `site/i18n/messages/en.json` and `site/i18n/messages/hi.json`.

### 5.2 Key Parity & Dialect Auditing
- **Parity Gate Script (`scripts/check-i18n-key-parity.mjs`):**
  - Recursively audits key bijection between `en.json` and `hi.json`.
  - Validates placeholder parity (`{name}`, `{count}`) to prevent runtime format crashes.
  - Validates that Hindi message files have 0 missing keys and 0 extra unmapped keys.
- **Homepage Dialect Gate (`scripts/check-homepage-dialect.mjs`):**
  - Asserts proper tone and vocabulary consistency across localized marketing copy.

---
## 6. Subsystem Module 5: Test Subsystem, Test Integrity & Release Gating

### 6.1 Dual-Lane Vitest Architecture
The test suite spans **738 Lane 1 + 42 Lane 2 = 780 Vitest files combined**, plus **85 Playwright spec files** in `tests/e2e/` (of which **8 are required by the browser release gate** — `config/build/playwright-gate-specs.json`). To prevent out-of-memory errors and runner crashes on Windows, tests execute in two isolated lanes via `scripts/run-full-vitest.mjs`:

```
                           pnpm run test
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       [Lane 1: Default Vitest]       [Lane 2: Tech-Docs Vitest]
       Config: tests/vitest.config.ts Config: tests/vitest.tech-docs.config.ts
       - 738 test files               - 42 test files, 224 specs
       - High fan-out worker pool     - Serial forks, maxWorkers: 1
       - Unit & integration tests     - happy-dom environment
       - Output: vitest-results.json  - Regenerates data via generate-all.mjs
                                      - Output: vitest-tech-docs-results.json
                                 │
                                 ▼
                     [Summary Writer & Reporter]
                     results/tests/summary.json
```

- **Lane 1 (Default):** Covers unit and integration suites across `site/app`, `site/features`, `site/lib`, `Planner`, `Studio`, and APIs. Runs with standard thread pooling.
- **Lane 2 (Tech-Docs):** Dedicated low-concurrency lane (`tests/vitest.tech-docs.config.ts`). Runs generator tests, AST extractors, and component rendering in `happy-dom` with serial forks (`maxWorkers: 1`, `isolate: true`) to avoid filesystem lock contention.

### 6.2 Test Integrity Auditing Suite
The platform enforces five static test integrity gates (`node scripts/general/run-test-audits.mjs --preset=release`):

1. **Hollow Tests Audit (`scripts/general/audit-hollow-tests.mjs`):**
   - Heuristics in `scripts/general/hollow-test-patterns.mjs`:
     * Rejects `expect(true).toBe(true)`.
     * Rejects sole truthy/defined assertions without state proof (`expect(x).toBeTruthy()` or `toBeDefined()` when total expect count <= 1).
     * Rejects empty catch blocks (`catch (e) {}`).
     * Rejects active test blocks with zero expect calls (`zero-expect`).
2. **Fake Test Audit (`tech-docs-generator/scripts/fake-test-audit.mjs`):**
   - Asserts that every test file in Tech-Docs has at least as many `expect()` calls as `it()` blocks.
   - Forbids mocking the subject under test in AST extractor tests.
   - Requires strong value assertions (`toEqual`, `toMatch`, `toBeGreaterThan`) rather than weak existence checks.
3. **Gate Skips & Only Audit (`scripts/general/audit-gate-skips.mjs`):**
   - Detects and fails on `test.skip`, `it.skip`, `describe.skip`, `test.only`, `it.only`, `testInfo.skip()`, and coverage ignore comments (`v8 ignore`, `istanbul ignore`).
   - Any bypass requires an explicit, unexpired, peer-reviewed entry in `tests/manifests/skip-exceptions.json`.
4. **ESLint Disable Audit (`scripts/general/audit-eslint-disable.mjs`):**
   - Forbids `eslint-disable` comments across all source, test, and script files.
   - Exactly **5 hook files** are permitted to suppress `react-hooks/exhaustive-deps`:
     * `site/hooks/Studio/useStudioFabric.ts`
     * `site/hooks/Planner/usePlannerFabric.ts`
     * `site/hooks/Studio/useStudioKeyboardShortcuts.ts`
     * `site/hooks/Planner/usePlannerKeyboardShortcuts.ts`
     * `site/hooks/Planner/usePlannerSessionWarning.ts`
5. **API Route Safety Audit (`scripts/general/audit-api-route-safety.mjs`):**
   - Enforces double-submit CSRF protection on mutating HTTP handlers (`POST`, `PUT`, `PATCH`, `DELETE`).
   - Requires `x-csrf-rejected` header on rejections so client fetchers can refresh tokens.
   - Enforces admin session gating and rate limiting on all protected and public form mutators.

### 6.3 Hard Blocker Clearance Protocol (`Failures.md`)

#### Blocker 1: `GATE-RECHECK-01` (Ship bar currently stops at Vitest lane)
- **Observed Cause:** Vitest reported failures in 4 test files:
  1. `tests/unit/features/site/data/htmlSitemap.test.ts` (missing `/tools` path).
  2. `tests/unit/features/site/data/siteSeoAcceptance.test.ts` (missing `/tools` SEO entry).
  3. `tests/unit/features/site/data/siteSeoContract.test.ts` (missing `/tools` metadata contract).
  4. `tests/unit/lib/ai/mastra/providers.test.ts` (mismatched default model string: `gemini-3.6-flash` vs `gemini-2.5-flash`).
- **Remedy Verification Protocol:**
  Commit `961e64413acf96ce6e9b5b10c954d94002d15e15` registered `/tools` in `htmlSitemap.ts`, added `TOOLS_PAGE_METADATA` to `siteSeoContract.ts`, and updated `providers.ts` to `gemini-2.5-flash`.
  To clear the blocker, execute:
  ```powershell
  pnpm exec vitest run --config tests/vitest.config.ts `
    tests/unit/features/site/data/htmlSitemap.test.ts `
    tests/unit/features/site/data/siteSeoAcceptance.test.ts `
    tests/unit/features/site/data/siteSeoContract.test.ts `
    tests/unit/lib/ai/mastra/providers.test.ts
  ```
  Follow with a full headless gate `pnpm run release:gate:core`. Only after observing an exit code of `0`, delete the row from `Failures.md`.

#### Blocker 2: `BROWSER-ORIGIN-02` (Browser walk app unavailable)
- **Observed Cause:** Local server was not running when Playwright attempted connection to `http://localhost:3000`, causing `net::ERR_CONNECTION_REFUSED`. Prohibited from using `127.0.0.1`.
- **Remedy Verification Protocol:**
  1. Start Next.js dev server on exact origin: `pnpm run dev` (`http://localhost:3000`).
  2. In an authorized terminal, execute the 4-viewport Playwright gate:
     ```powershell
     pnpm run test:browser:gate
     ```
  3. Observe all 8 gate specs passing and screenshots captured under `results/`.
  4. Only after observing code 0, delete `BROWSER-ORIGIN-02` from `Failures.md`.

---
## 7. Subsystem Module 6: Scripts & Operational Subsystem

### 7.1 Script Inventory & Governance
The repository maintains a clean operational structure partitioned into three tiers:
- **Root Scripts (`scripts/`):** 111 operational scripts handling database migrations, R2 snapshots, catalog seeds, and pipeline runners.
- **General Utilities (`scripts/general/`):** 56 governance, layout verification, secret scanning, and linting scripts.
- **As-Needed Specialized Tools (`scripts/AsNeeded/`):** Governed strictly by `scripts/AsNeeded/ALLOWLIST.md`. Only 8 allowlisted basenames are permitted:
  * `_audit-stale-scripts.mjs` (find dead script references)
  * `_scan-circular-imports.mjs` (static cycle scanner)
  * `audit-css-packages.mjs` (broken CSS imports)
  * `audit-focss-static-defects.mjs` (orphan styles and custom properties)
  * `verify-focss.mjs` (canonical FOCSS architecture verification)
  * `verify-db-svg-matrix.mjs` (DB/SVG matrix verification)

### 7.2 Central Ops Runner (`scripts/run-ops.mjs`)
Exposes standardized commands (`pnpm run ops <command>`):
- `db:apply` & `db:apply:admin` (apply migrations with mandatory dry-run preflight).
- `db:types` & `db:types:admin` (regenerate TypeScript database types).
- `backup:r2`, `catalog:snapshot:r2`, `repo:backup:r2` (trigger automated R2 snapshots).
- `vercel:prod` & `vercel:preview` (deploy Vercel environments).

### 7.3 Governance Ratchet (`scripts/general/check-governance.mjs`)
Ratchets repository-wide code quality rules against `config/quality/governance-baseline.json`. It enforces that migrations contain `-- rollback` SQL statements, ensures zero unlinked secrets exist, and prevents any drift in technical governance standards.

---

## 8. Subsystem Module 7: File & Asset Sizing

### 8.1 Standalone Distribution Footprint
- **Target:** `site/.next/standalone` created via `output: "standalone"` in `next.config.js`.
- **Preparation Automation (`scripts/general/prepare-standalone.cjs`):**
  - Recursively copies `site/.next/static` to `standalone/.next/static` and `standalone/site/.next/static`.
  - Recursively copies `site/public` to `standalone/public` and `standalone/site/public`.
  - Injects `scripts/generate-svg.mjs` and fixtures to support runtime SVG rendering.
- **Execution Script (`scripts/general/startStandalone.cjs`):** Resolves candidate paths for `server.js`, loads `.env.local`, and boots the lightweight standalone server on `PORT=3000` without requiring the multi-gigabyte development `node_modules`.

### 8.2 Catalog Plan Symbols & Image Assets
- **Contract Density:** Exactly **2 px/mm** density with **40 mm padding** on each side (`site/lib/catalog/planSymbolPngContract.ts`).
- **Integrity Validation:** Every raster plan symbol PNG requires a SHA-256 hex checksum.
- **Image Optimization Flag:** Controlled via `NEXT_IMAGE_UNOPTIMIZED`. Production forces unoptimized image pass-through when serving via Cloudflare CDN to eliminate Vercel image optimization costs.

### 8.3 Tech-Docs Generator Vite Bundle
- **Output Target:** `generated-documents/site/` (built via `tech-docs-generator/vite.config.ts`).
- **Production Hosting:** Hosted independently at `https://oando23.vercel.app`.
- **Next.js Integration:** Routed in Next.js via rewrite rule: `/tech-docs/:path*` -> `/tech-docs/index.html`.

---
## 9. Subsystem Module 8: Tech-Docs Generator (Vite Inventory SPA)

### 9.1 Application Architecture & Routes
The Tech-Docs Generator (`tech-docs-generator/`) is an independent React 19 application built with Vite 8 and Tailwind CSS. It inventories all platform systems, schemas, routes, and testing health.
- **Route Inventory (`src/App.tsx`):**
  1. `/` — `Overview`: Executive platform summary and system vitals.
  2. `/tech-stack` — `TechStack`: Next.js, React, Webpack, FOCSS, Fabric, GSAP specifications.
  3. `/architecture` — `Architecture`: Subsystem diagrams and cross-product isolation boundaries.
  4. `/features` — `Features`: Detailed catalog, planner, studio, and admin feature matrix.
  5. `/code-organization` — `CodeOrganization`: Monorepo package structure and file ownership rules.
  6. `/database` — `Database`: Supabase dual-database schemas, table structures, and ER diagrams.
  7. `/api` — `ApiDesign`: REST endpoints, CSRF protection rules, and rate limit policies.
  8. `/testing` — `Testing`: Dual-lane Vitest test architecture, coverage reports, and Playwright matrices.
  9. `/deployment` — `Deployment`: Cloudflare edge proxy, Vercel environments, and R2 backup pipelines.
  10. `/security` — `Security`: RFC 9116 security.txt, CSP headers, and auth session gating.
  11. `/performance` — `Performance`: Bundle sizing, standalone footprint, and LCP optimizations.
  12. `/workflows` — `Workflows`: Developer onboarding, release runbooks, and migration gates.

### 9.2 ER Diagram & Live Schema Synchronization (`Database.tsx`)
`Database.tsx` renders Mermaid.js ER diagrams and table specifications synchronized with the live databases:
- **Admin DB Tables:** `profiles`, `oando_plans`, `planner_operation_idempotency`, `audit_events`, `furniture_catalog`, `block_descriptors`.
- **Products DB Tables:** `catalog_products`, `catalog_product_images`, `catalog_product_specs`, `catalog_product_slug_aliases`, `configurator_products`.

---

## 10. Subsystem Module 9: UI Polish & Ergonomics Alignment (No Redesign)

### 10.1 Spacing, Typography & Icon Standards
- **Brand Identity Preservation:** Strictly preserve the existing "quiet luxury" aesthetic, warm neutral palette, and layout hierarchy.
- **FOCSS Token Compliance:** Eliminate arbitrary bracket utilities (e.g. `rounded-[14px]` -> `rounded-xl`, `p-[18px]` -> `p-4`). Keep token findings below baseline (200).
- **Icon Standard:** All icons must render through `site/components/site/PhIcon.tsx` using `site/lib/icons/phIconMap.ts`. Direct Lucide imports and inline SVGs are prohibited.

### 10.2 Mobile Chrome Ergonomics (<768px)
- **Top Bar Simplification:** Top bar contains Brand Logo, Search trigger, and Drawer toggle. Remove redundant buttons.
- **Drawer Containment:** Slide-over drawer contains strictly the 6 designated overflow links (`About`, `Clients`, `Trusted By`, `FAQ`, `Planning`, `Downloads`).
- **Dynamic CSS Offsets:**
  - FAB bottom offset: `--site-fab-bottom: calc(var(--mobile-tab-bar-height) + 0.75rem);`.
  - Cookie consent banner: `bottom: calc(var(--mobile-tab-bar-height) + 1px) !important;`.
  - Collision suppression: `html:has([data-cookie-consent-bar]) .site-fab-launcher { display: none; }`.

---
## 11. Master Sequential Execution Runbook

When authorized by the user to proceed with implementation, execute the remediation strictly in this sequential order:

```
[Phase 1: Blocker Resolution]
  ├── Step 1.1: Re-verify failing unit test suites (sitemap, SEO, Mastra)
  ├── Step 1.2: Execute headless ship gate (pnpm run release:gate:core)
  ├── Step 1.3: Start app on http://localhost:3000 & run Playwright gate (pnpm run test:browser:gate)
  └── Step 1.4: Prune GATE-RECHECK-01 and BROWSER-ORIGIN-02 from Failures.md
              │
              ▼
[Phase 2: Platform Hygiene & Static Audits]
  ├── Step 2.1: Verify repository layout (node scripts/general/check-repo-layout.mjs)
  ├── Step 2.2: Verify FOCSS zone isolation (pnpm run verify:focss)
  ├── Step 2.3: Verify workspace boundaries (pnpm run scan:boundaries)
  ├── Step 2.4: Execute Oxlint with react-hooks (node scripts/general/run-oxlint.mjs)
  └── Step 2.5: Run test integrity audit suite (node scripts/general/run-test-audits.mjs --preset=release)
              │
              ▼
[Phase 3: Localization, Tokens & Governance Verification]
  ├── Step 3.1: Check i18n key parity (pnpm run check:i18n:parity)
  ├── Step 3.2: Check style token ratchet (pnpm run check:style-tokens)
  ├── Step 3.3: Check documentation purity (pnpm run check:docs-all)
  └── Step 3.4: Check governance baseline (pnpm run check:governance)
              │
              ▼
[Phase 4: Full Release Gate Verification]
  ├── Step 4.1: Run both Vitest lanes (pnpm run test)
  ├── Step 4.2: Build Next.js site and standalone (pnpm run build:site)
  ├── Step 4.3: Build Tech-Docs generator (pnpm run build:tech-docs)
  └── Step 4.4: Execute complete release gate (pnpm run gate)
```

### Actionable Commands Reference:

```powershell
# ==============================================================================
# 1. Structural & Boundary Preflight
# ==============================================================================
node scripts/general/check-repo-layout.mjs
pnpm run scan:boundaries
pnpm run verify:focss
node scripts/general/run-oxlint.mjs
pnpm run lint:ui:strict
node scripts/general/run-test-audits.mjs --preset=release

# ==============================================================================
# 2. Localization, Style Tokens & Governance
# ==============================================================================
pnpm run check:i18n:parity
pnpm run check:style-tokens
pnpm run check:governance
pnpm run check:docs-all

# ==============================================================================
# 3. Dual-Lane Testing & Full Release Gate
# ==============================================================================
pnpm run test
pnpm run build
pnpm run gate
```

---

## 12. Subsystem Module 10: Client-Hub Sequence Plan & Public Route Roadmap

**Governing Plan:** [`plans/05092026/10-client-hub-sequence-plan.md`](./10-client-hub-sequence-plan.md) (relocated from `plans/PLAN.md`)  
**Spine Route Map:** [`../client-hub/flowcharts/clients-hub-flow.md`](../client-hub/flowcharts/clients-hub-flow.md)  
**Living HTML Sitemap:** [`../client-hub/flowcharts/non-admin-site-map.html`](../client-hub/flowcharts/non-admin-site-map.html)  
**Vitest Test Fixtures:** Canonical Planner test fixtures live under `tests/fixtures/planner/` and performance budgets live under `tests/e2e/helpers/`.

### 12.1 Client-Hub 4-Phase Sequence Architecture

While Modules 1–9 define the horizontal and vertical engineering infrastructure, Module 10 defines the **active customer-facing delivery sequence**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CLIENT-HUB DELIVERY SEQUENCE ROADMAP                 │
├────────────────────────────────────────────────────────────────────────┤
│ Phase —: Spine (client-hub/flowcharts/clients-hub-flow.md)             │
│ • Public route map, customer journeys 1–4, redirect register §4        │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 1: Chrome (Header, Footer, Tabs) [Modernized]                    │
│ • Flat 8-link header (site/features/site/data/navigation.ts)           │
│ • 5 mobile tabs (<768px): Products, Planner, Quote, Portfolio, Account │
│ • Footer public boundary: strictly excludes /dashboard, /portal, etc. │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 2: Homepage (site/features/site/data/homepage.ts)                │
│ • Customer journey entrypoint: hero glass proof routes to /trusted-by/ │
│ • Primary CTA: /planner ("Get your layout plan")                       │
│ • Cloudflare R2 WebP assets with unoptimized flag                      │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 3: Map Equals Code (Redirects & Calculator Indexability)         │
│ • Permanent 308/301 redirects in next.config.js (news, catalog, etc.)  │
│ • Calculator routes (/tools/*) live status: indexable: true in SEO     │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 4: Browser Walk (Manual & Playwright E2E Verification)           │
│ • Origin invariant: http://localhost:3000 (never 127.0.0.1)           │
│ • Resolves BROWSER-ORIGIN-02 via manual dev server bootstrap           │
└────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Integration of Technical Remedy with Product Sequence
1. **Header Modernization:** Phase 1 in `PLAN.md` previously described a legacy "More" dropdown. This has been reconciled with live code (`navigation.ts`), which enforces a flat 8-link bar with `SITE_HEADER_MORE_LINKS: []`.
2. **SEO & Sitemap Parity:** Phase 3 previously assumed `/tools/*` calculators were unindexed placeholders. Live reality proves `/tools/meeting-room-capacity-calculator`, `/tools/office-space-calculator`, and `/tools` are fully indexed (`indexable: true`) and registered in `SEO01_STATIC_METADATA` (`siteSeoContract.ts`), resolving the prior `GATE-RECHECK-01` failure.
3. **Browser Walk Verification:** Phase 4 directly orchestrates the clearance of `BROWSER-ORIGIN-02` by validating that all 8 Playwright gate specs pass against `http://localhost:3000` with the `.mobile-app-main` scroller active.
