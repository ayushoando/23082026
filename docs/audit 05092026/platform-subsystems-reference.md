# Platform Subsystems Reference: Architectural Model & Subsystem Contracts

**Audited & Published:** 2026-09-05  
**Synthesis Source:** Comprehensive synthesis of 29 domain audits (`agent-reports/new/`) and 2 root baseline audits (`agent-reports/`) against live codebase ground truth.  
**Governing Authority:** [`AGENTS.md`](../../AGENTS.md) and [`oando-master`](../../.agents/skills/oando-master/SKILL.md)  
**Authority Hierarchy:** `User instruction > live code and fresh command output > AGENTS.md > Agents/ > docs/`

---

## Executive Architectural Summary

The Oando engineering platform is a unified monorepo hosting the customer-facing marketing storefront, the internal administration and CRM portal, two specialized interactive visual CAD/canvas applications (**Studio** and **Planner**), an edge proxy gateway, and a technical documentation generator.

The repository enforces strict architectural boundaries:
1. **Zero Dual-Write Database Separation:** Admin DB (`rxzpznmxbaoxpikowmfc`) vs. Products DB (`erpweaiypimorcunaimz`).
2. **Mode-Aware Persistence:** Read-only production filesystem safety (`EROFS` prevention) with disk persistence strictly restricted to local development under `DEV_AUTH_BYPASS=1`.
3. **Strict Fork Isolation:** Complete architectural decoupling between Studio (`/oostudio` at `0.2 px/mm`) and Planner (`/ooplanner` at `0.05 px/mm`), enforced by static boundary scanning (`pnpm run scan:boundaries`).
4. **FOCSS Tokenized Design System:** 151 modular CSS package files (`@focss/*`), zero raw hex color literals, and a strict 200-violation ratchet baseline for legacy inline style debt.
5. **Two-Lane Vitest Pipeline:** Two distinct test execution lanes (Application lane + Tech-Docs serial lane) backing a 100% line/function coverage floor with zero exceptions.
6. **Edge Proxy Routing:** Cloudflare Worker edge proxy managing protocol guards, RFC 9116 security disclosure, 308 apex canonicalization, R2 asset offloading with fallback logo serving, and Vercel origin failover.

---

## Domain 1: Root Governance, Scripts & Tooling

### 1.1 Process Floor & Authority Ordering
The repository execution model is strictly governed by [`AGENTS.md`](../../AGENTS.md). The precedence order is unambiguous:
$$\text{User Instruction} > \text{Live Code / Fresh Command Output} > \text{AGENTS.md} > \text{Agents/} > \text{docs/}$$

Key process floor rules:
- **Repository Root Only:** All tooling, scripts, and package commands must execute from the repository root. Creating Git worktrees is strictly prohibited.
- **Package Manager:** Strict enforcement of `pnpm`. `npm` and `yarn` are prohibited at the root; `npx` inside package scripts is forbidden.
- **Agent Ownership:** Maximum 4 concurrent agents with disjoint directory ownership and serial integration.
- **User Control States:** Directives such as `wait`, `pause`, `read-only`, and `do not write` immediately halt all mutations and file edits.
- **Local Secrets:** Stored exclusively in `.env.local` or `site/.env.local` (gitignored).
- **Local Hostname:** All UI verification must target `http://localhost:3000`; `127.0.0.1` is strictly banned.

### 1.2 Governance Baseline & Zero-Tolerance Metrics
Root governance invariants are checked via `scripts/general/check-governance.mjs` (invoked via `pnpm run check:governance`) and ratcheted against [`config/quality/governance-baseline.json`](../../config/quality/governance-baseline.json).

```json
{
  "D2_npx": 0,
  "D3_dead_overrides": 0,
  "D6_nonportable_in_gate": 0,
  "P2_csp_unsafe_inline": 0,
  "P4_migration_no_rollback": 0,
  "S2_stray_report": 0
}
```

The six governance rules enforce:
- **`D2_npx` (Count: 0):** Scans `package.json` scripts for `\bnpx\b`. All binaries must resolve through `pnpm exec` or local lockfile dependencies.
- **`D3_dead_overrides` (Count: 0):** Prohibits a `package.json#overrides` block. In pnpm monorepos, package overrides are only parsed from `pnpm-workspace.yaml`.
- **`D6_nonportable_in_gate` (Count: 0):** Prohibits `pwsh` or `python` inside any CI-reachable script chain, guaranteeing execution portability on Ubuntu CI runners.
- **`P2_csp_unsafe_inline` (Count: 0):** Scans `site/proxy.ts` production CSP headers to ensure `'unsafe-inline'` is never permitted in `script-src`.
- **`P4_migration_no_rollback` (Count: 0):** Scans all SQL migrations in `site/platform/supabase/migrations` and `site/platform/supabase/migrations.admin`, verifying every migration contains `-- rollback:` or `-- down`.
- **`S2_stray_report` (Count: 0):** Scans `plans/` to prevent placement of stray report files matching `/(report|handover|outstanding|finish-plan|completion-contract)/i` outside canonical programme plans.

### 1.3 Package Scripts & Operational Dispatcher
The repository defines exactly **101 scripts** in `package.json`. Operational workflows route through `scripts/run-ops.mjs` via `pnpm run ops <command>`:
- `pnpm run ops db:test` $\rightarrow$ Executes `scripts/db_test_connection.ts`.
- `pnpm run ops db:apply` / `db:apply:admin` $\rightarrow$ Executes Supabase database migrations (dry-run supported via `-- --dry`).
- `pnpm run ops db:types` / `db:types:admin` $\rightarrow$ Generates TypeScript database interfaces into `site/platform/supabase/`.
- `pnpm run ops backup:supabase:r2` $\rightarrow$ Runs `scripts/db_backup_upload_r2.ts` for nightly pg_dump R2 archival.
- `pnpm run ops backup:r2:prune` $\rightarrow$ Runs `scripts/prune_r2_backups.ts` enforcing retention (5 days daily, 30 days weekly).
- `pnpm run ops seed:furniture` $\rightarrow$ Off-read-path furniture catalog database seeder.

### 1.4 Script Inventory Reality & Cleanup Targets
A full census confirms **234 total files** in `scripts/` across all subdirectories (correcting the legacy audit estimate of 264 and the earlier calibrated estimate of 229 — the 5-file difference is 5 JSON fixture files in `scripts/generate-svg/_fixtures/` counted as part of the directory total). A total of **59 candidate files** are identified for safe retirement under [`scripts-cleanup-runbook.md`](./scripts-cleanup-runbook.md), reducing the total to ~175:
1. `scripts/operations-review/` (14 files: 9 root TS files + 5 in `extractors/`): Unintegrated operational audit prototype.
2. `scripts/site-ui-content-links-audit/` (26 files): Legacy multi-wave crawling framework superseded by dynamic sitemap health checks.
3. Dead Recovery Scripts (13 files): `merge-recovery-into-majors.mjs`, `five-majors-hash-dedup.mjs`, `planner-lift-project-trees.mjs`, `deleteR2Bucket.ts`, etc.
4. Throwaway Python Scripts (7 files): `rename-plans.py`, `update-plans.py`, `move-checklist.py`, `verify-plans.py`, `audit-repo-state.py`, `generate-session-docs.py`, `audit_external_asset_hosts.py`.
5. Misplaced Fixtures (2 files): `scripts/seed_data.sql` (260 KB legacy dump) and `scripts/catalog-seating.json` (125 KB fixture).

---

## Domain 2: Site App, Routes & Runtime Surfaces

### 2.1 Next.js 16 App Router Topology
The primary application resides in `site/` running Next.js `16.3.3` (App Router). The root topology is organized into distinct zones under `site/app/`:

| Route Subtree | Runtime Character | Primary Functions & Styling |
| :--- | :--- | :--- |
| `site/app/(site)/` | Hybrid SSR / ISR | Public marketing catalog (`products/`, `choose-product/`), corporate routes (`about/`, `clients/`, `showrooms/`), tools hub (`tools/`), and legal documents (`(legal)/`). Styled via semantic `@focss/*` tokens. |
| `site/app/admin/` | Dynamic Client / SSR | Back-office management portal (`catalog/`, `plans/`, `queries/`, `themes/`). Auth-guarded. Styled via `admin.css`. |
| `site/app/ooplanner/` | Pure Client SPA | Interactive 2D/3D floor planning canvas workspace. Dockview layout, Fabric.js 2D canvas, Three.js 3D viewport. Styled via `planner.css`. |
| `site/app/oostudio/` | Pure Client SPA | Interactive 2D/3D furniture customization canvas. Fabric.js 2D pattern/cut tool, Three.js glTF 3D preview. Styled via `studio.css`. |
| `site/app/api/` | Edge & Node Serverless | Catalog APIs, plan persistence endpoints, CSRF validation, and health checks. |
| `site/app/api-docs/` | Static Documentation | Interactive OpenAPI specification visualizer (Scalar/Swagger). |
| `site/app/offline/` | Client PWA Fallback | Offline caching fallback interface for Progressive Web App capability. |

### 2.2 Dynamic Sitemap & SEO Engine Root Cause
SEO generation is handled dynamically by `site/app/sitemap.ts` and `site/app/robots.ts`:
- **Robots Policy (`robots.ts`):** Emits user-agent allowances, references the canonical sitemap URL (`https://oando.co.in/sitemap.xml`), and disallows private admin and internal tool paths (`/admin/`, `/api/`, `/ooplanner/`, `/oostudio/`).
- **Sitemap Architecture (`sitemap.ts`):** Follows Google Search Central modern guidance by emitting strictly `<loc>` and `<lastmod>` while omitting deprecated `<priority>` and `<changefreq>` tags.
- **Dynamic Catalog Fetching:** The sitemap does not rely on static file lists. It calls `buildProductStaticParams()` to fetch active slugs from the live database and filters entries via `isSafeSitemapSegment()` (rejecting raw UUIDs, title-case anomalies, and double dashes).
- **Forensic Root Cause of Sitemap 404s:** Historical audit reports misattributed sitemap 404 errors to hardcoded static arrays. Forensic investigation confirmed that the 404s stem from orphaned or deleted product slugs remaining in the live `catalog_products` table in the Products DB (`erpweaiypimorcunaimz`). Remediation requires database row pruning via `pnpm run audit:sitemap-health`, not source code edits.

### 2.3 Internationalization (i18n) Architecture & Root Bridge Pattern
The platform supports bilingual localization (`en` and `hi`) managed by `next-intl`:
- **Load-Bearing Root Bridge:** Monorepo root requires `i18n/request.ts` (which re-exports `../site/i18n/request`). This bridge exists because `site/next.config.js` configures `createNextIntlPlugin("./i18n/request.ts")`, which resolves relative to the monorepo root `process.cwd()`. **This file must never be deleted.**
- **Key Parity Contract:** 861 keys are tracked in `site/i18n/marketing-parity-manifest.json`.
- **Byte Size Reality:** `hi.json` (150,160 bytes) is significantly larger than `en.json` (80,886 bytes) solely due to 3-byte UTF-8 encoding of Devanagari script characters, not key count discrepancy. Parity is verified by `pnpm run check:i18n:parity`.

### 2.4 Component, Feature & Store Architecture
- **Component Subdirectories (`site/components/`):** 26 verified subdirectories: `ui/` (`Button.tsx`, `dialog.tsx`, `Field.tsx`, `form.tsx`, `IconButton.tsx`), `Planner/`, `Studio/`, `products/`, `home/`, `site/`, `shared/`, `pwa/`, `about/`, `analytics/`, `career/`, `clients/`, `compare/`, `contact/`, `downloads/`, `faq/`, `legal/`, `planning/`, `security/`, `service/`, `showrooms/`, `sitemap/`, `solutions/`, `sustainability/`, `tools/`, `trusted-by/`.
- **Feature Modules (`site/features/`):** 7 top-level directories: `Planner/`, `Studio/`, `admin/`, `shared/`, `ops/`, `site/`, `crm/`. In `crm/`, subdirectories are strictly `stores/` (no `leads/` folder). Main views include `ClientsView.tsx`, `CrmHubView.tsx`, `QuotesView.tsx`, `crmAdminUi.tsx`, and `businessStats.ts`.
- **Zustand Client Stores (`site/store/`):**
  - `Planner/plannerUiStore.ts`: High-frequency UI state (60fps pan/zoom, active tool selection, dockview layout).
  - `Planner/plannerCatalogStore.ts`: Catalog cache, block category filters, IndexedDB fallback.
  - `Studio/studioUiStore.ts`: 2D/3D mode toggles, active swatch selection, camera presets.
  - `Studio/studioCatalogStore.ts`: Customizable furniture templates, material swatch options.
- **Type Bridges & Chrome WebMCP (`site/types/`):**
  - `database.types.ts`: Canonical re-export bridge for Products DB (`site/platform/supabase/database.types.ts`).
  - `database.admin.types.ts`: Canonical re-export bridge for Admin DB (`site/platform/supabase/database.admin.types.ts`).
  - `webmcp.d.ts`: Chrome WebMCP Declarative API ambient module augmentation extending `react.HTMLAttributes<T>` with `toolname?: string`, `tooldescription?: string`, `toolautosubmit?: boolean | ""`, and `toolparamdescription?: string`.

---

## Domain 3: Studio Subsystem (`/oostudio`)

### 3.1 Subsystem Role & Canvas Architecture
Studio is a specialized, pure-client web application dedicated to modular furniture customization and material configuration, accessible at route `/oostudio`:
- **Dual-Mode Canvas Engine:** Combines Fabric.js for 2D surface pattern, cut, and panel customization with Three.js (glTF loading) for real-time 3D photorealistic material rendering.
- **Dedicated Styling:** Encapsulated in `site/focss/studio/` and `studio.css`, completely isolated from Planner styles.
- **Zero Server State Dependency:** Fully client-rendered SPA architecture with instant local swatch manipulation.

### 3.2 Exact Scale Ratio Contract
The Studio drawing canvas operates on an immutable metric scale ratio:
$$\text{Scale}_{\text{Studio}} = 0.2\text{ px/mm} \quad (1\text{ mm} = 0.2\text{ pixels}, \quad 1\text{ pixel} = 5\text{ mm})$$

- Verified in code: `site/lib/Studio/studioPalette.ts:116`:
  ```typescript
  export const SCALE_PX_PER_MM = 0.2;
  ```
- All dimensional measurements, texture projections, and panel cutouts within Studio strictly evaluate against this 0.2 px/mm ratio.

### 3.3 State Management & Lifecycle Hygiene
- **Stores:** UI state resides in `studioUiStore.ts` and template/material configuration resides in `studioCatalogStore.ts`.
- **Canvas Lifecycle Hook:** Canvas mounting and tearing-down is managed by `site/hooks/Studio/useStudioFabric.ts`.
- **Linter Exception:** The hook requires explicit window event listener and Fabric context cleanup. It is registered as an approved suppression in `scripts/general/audit-eslint-disable.mjs` to allow necessary canvas lifecycle bindings.

---

## Domain 4: Planner Subsystem (`/ooplanner`) & Studio $\leftrightarrow$ Planner Isolation

### 4.1 Subsystem Role & Multi-Pane Layout
Planner is a full-featured architectural space planning and commercial furniture layout engine located at `/ooplanner`:
- **Dockview Workspace:** Employs Dockview for multi-pane dockable panels (Catalog Explorer, 2D Floor Plan Canvas, 3D Walkthrough Viewport, Bill of Materials Inspector, Wall/Room Property Editors).
- **Fabric.js 2D Architectural Engine:** High-performance vector canvas handling wall drawing, dimension lines, snap-to-grid, room bounding polygons, and furniture item placement.
- **Three.js 3D Environment:** Synchronized 3D scene rendering walls, floors, windows, doors, and placed furniture models.

### 4.2 Exact Scale Ratio & Legacy Adaptation Contract
The Planner canvas operates on a high-precision architectural scale ratio:
$$\text{Scale}_{\text{Planner}} = 0.05\text{ px/mm} \quad (1\text{ mm} = 0.05\text{ pixels}, \quad 1\text{ pixel} = 20\text{ mm})$$

- Verified in code: `site/lib/Planner/plannerGeometryContract.ts:12`:
  ```typescript
  export const PLANNER_SCALE_PX_PER_MM = 0.05 as const;
  ```
- **Legacy Scale Ratio Adaptation:** Early prototypes of Planner shared Studio's 0.2 px/mm scale. To prevent data corruption when loading legacy plan snapshots, `site/lib/Planner/plannerGeometryContract.ts:22-25` codifies:
  ```typescript
  export const STUDIO_SCALE_PX_PER_MM = 0.2 as const;
  export const PLANNER_KNOWN_LEGACY_SCALES = new Set([0.2]);
  ```
- The geometry engine inspects incoming plan snapshots: if the snapshot's recorded scale is `0.2`, the geometry normalizer applies a scaling factor of $0.05 / 0.2 = 0.25$ to seamlessly adapt the plan into canonical 0.05 px/mm geometry.

### 4.3 Fork Boundary Isolation & Boundary Scanner
Studio and Planner are completely forked sub-applications. Direct cross-imports are strictly prohibited by repository architecture:
- **Scan Enforcement:** `scripts/scan-boundaries.mjs` (run via `pnpm run scan:boundaries`).
- **Enforced Boundary Pairs:**
  - `site/{components,lib,hooks,store,server}/Planner` $\nleftrightarrow$ `site/{components,lib,hooks,store,server}/Studio`
  - `site/features/Planner` $\nleftrightarrow$ `site/features/Studio`
  - `site/app/ooplanner` $\nleftrightarrow$ `site/app/oostudio`
  - `site/focss/planner` $\nleftrightarrow$ `site/focss/studio`
- **Shared Data Access:** Neither application may import data directly from the other's internal directories. Shared furniture definitions must route exclusively through the mode-aware persistence abstraction `site/lib/catalog/furnitureCatalogMode.ts`.

---

## Domain 5: Data Architecture, Databases & Mode-Aware Persistence

### 5.1 Dual Database Architecture (Strict Separation)
The platform integrates two physically distinct Supabase PostgreSQL instances with zero cross-database joins and zero dual-write mechanisms:

```
┌────────────────────────────────────────────────────────┐   ┌────────────────────────────────────────────────────────┐
│                   ADMIN SUPABASE                       │   │                  PRODUCTS SUPABASE                     │
│               (rxzpznmxbaoxpikowmfc)                   │   │               (erpweaiypimorcunaimz)                   │
├────────────────────────────────────────────────────────┤   ├────────────────────────────────────────────────────────┤
│ • Internal staff records & profiles                    │   │ • Public marketing catalog (catalog_products)          │
│ • Customer floor plans (oando_plans)                   │   │ • Product categories & specifications                  │
│ • Furniture master catalog (furniture_catalog)         │   │ • Public configurator models & options                 │
│ • CAD Block Descriptors (block_descriptors)            │   │ • Feature flags & dynamic site themes                  │
│ • Customer inquiries & CRM handoffs                    │   │ • Public review data & ratings                         │
│ • Audit events log (audit_events)                      │   │                                                        │
│ • Price books & vendor quotations                      │   │                                                        │
└────────────────────────────────────────────────────────┘   └────────────────────────────────────────────────────────┘
```

- **Admin DB Connection:** `SUPABASE_AUTH_DATABASE_URL` / `SUPABASE_ADMIN_SERVICE_ROLE_KEY`. Migrations in `site/platform/supabase/migrations.admin/`.
- **Products DB Connection:** `PRODUCTS_DATABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`. Migrations in `site/platform/supabase/migrations/`.
- **Security Guard:** `site/platform/supabase/env.ts` implements `assertNotServiceRoleKey()` to ensure admin service-role keys are never exposed to browser-facing client bundles.

### 5.2 Mode-Aware Persistence Wrappers (`EROFS` Prevention)
In production (Vercel Serverless / Cloudflare Edge), the local filesystem is **strictly read-only**. Any unmediated attempt to execute `fs.writeFileSync()` or `fs.mkdirSync()` immediately triggers a fatal `EROFS` crash.

All persistence routines are wrapped in mode-aware selectors that guarantee zero disk writes in production:

#### A. Planner Project Persistence (`site/lib/Planner/plannerPersistenceMode.ts`)
```typescript
export function getPlannerPersistenceMode(): "disk" | "supabase" {
  if (process.env.DEV_AUTH_BYPASS === "1" && process.env.NODE_ENV !== "production") {
    return "disk";
  }
  assertNoDiskInProduction();
  return "supabase";
}
```
- In local development (`DEV_AUTH_BYPASS=1`), plans write to disk at `site/platform/Planner/data/projects/`.
- In production, plans write exclusively to Supabase table `public.oando_plans`.
- `assertNoDiskInProduction()` actively guards against misconfigured environment variables by throwing a hard exception if `mode === "disk"` during production execution.

#### B. Furniture Catalog Persistence (`site/lib/catalog/furnitureCatalogMode.ts`)
- In local development, reads and writes target `site/platform/shared/data/furniture/`.
- In production, reads and writes route strictly to Supabase table `public.furniture_catalog` and the `catalog-assets` storage bucket.

#### C. CAD Block Descriptors (`site/inventory/descriptors/`)
- 23 JSON descriptor files conforming to schema `2026-07-04.v2` (including fallback descriptor `missing-geom-fallback-001.json`).
- Read from disk during local development; read from Supabase table `public.block_descriptors` in production.

---

## Domain 6: Styling & FOCSS Design System Tokens

### 6.1 FOCSS Modular CSS Engine Architecture
The design system is implemented via FOCSS, structured into **151 modular CSS package files** under `site/focss/` and imported via `@focss/*`:
- **Layer 1: Tokens (`site/focss/tokens/`):** Primitives and semantic color/spacing definitions (`colors.css`, `spacing.css`, `elevation.css`, `radii.css`, `typography.css`). Zero raw `#hex` color literals permitted.
- **Layer 2: Base (`site/focss/base/`):** CSS reset, font definitions, and root custom properties (`index.css`).
- **Layer 3: Components (`site/focss/components/`):** Reusable component classes (`buttons.css`, `dialogs.css`, `cards.css`, `forms.css`).
- **Layer 4: Entry & Application Zones (`site/focss/entry.css`, `planner/`, `studio/`):** Top-level bundling and zone-specific CSS isolation.
- **Compiler Gate:** Enforced via `scripts/AsNeeded/verify-focss.mjs` (`pnpm run verify:focss`), validating 151 files, zero hex literals, zero dependency cycles, and zero Studio $\leftrightarrow$ Planner cross-zone imports.

### 6.2 UI Anti-Drift Contract & Strict Linting
`scripts/general/lint-ui-contract.mjs` (invoked via `pnpm run lint:ui:strict`) enforces strict aesthetic standards:
- **Prohibited Tailwind Palettes:** Eliminates raw un-themed Tailwind color utilities (`text-slate-500`, `bg-blue-600`, `text-zinc-400`, `emerald`, `gray`).
- **Surface Token Enforcement:** Prohibits raw `bg-white` in public marketing surfaces, mandating semantic surface tokens (`var(--surface-primary)`).
- **Component Consistency:** Prohibits legacy `.admin-btn` styling in product zones, mandating the unified shadcn `Button` component.
- **Planner TSX Isolation:** Prohibits raw utility class styling in Planner views, mandating CSS modules and design tokens.

### 6.3 Style Token Ratchet Baseline (200 Baseline Violations)
To eliminate legacy inline style attributes without halting active feature development, [`config/quality/style-token-baseline.json`](../../config/quality/style-token-baseline.json) maintains a strict ratchet baseline:
- **Baseline Count:** Exactly **200 violations** tracked across **58 files**.
- **Enforcing Script:** `scripts/general/check-style-tokens.mjs` (run via `pnpm run check:style-tokens`).
- **Checked Violation Rules:**
  - `C5_arbitrary`: Arbitrary bracket classes (`\b[a-z-]+\[[^\]]+\]`, e.g., `rounded-[14px]`, `p-[7px]`).
  - `C3_raw_hex`: Hardcoded hex color codes (`#[0-9a-fA-F]{3,8}\b`).
  - `C4_px_literal`: Hardcoded pixel literals in inline styles (`\b\d+px\b`).
  - `C3_rgb_color`: Direct `rgb()` / `rgba()` definitions.
- **Primary Debt Clustering:** Over 25% of all exceptions are concentrated in the CRM feature module:
  - `site/features/crm/QuotesView.tsx`: 20 exceptions.
  - `site/features/crm/ProjectDetailView.tsx`: 13 exceptions.
  - `site/features/crm/ClientsView.tsx`: 12 exceptions.
  - Shell / Navigation: `site/components/site/MobileNavDrawer.tsx` (9), `SiteErrorBoundary.tsx` (8).
  - UI Library: `site/lib/ui/KeyboardShortcuts.tsx` (10), `ViewportControls.tsx` (10).
- Normalization protocol is codified in [`style-tokens-ratchet-runbook.md`](./style-tokens-ratchet-runbook.md).

### 6.4 Phosphor Icon Compliance & Mobile Chrome Coordination
- **Phosphor Icon Contract:** 100% icon usage must utilize `PhIcon` backed by `phIconMap`. Inline SVG elements and Lucide icons are strictly prohibited, enforced by `pnpm run check:product-icons`.
- **Mobile Navigation Shell (<768px Viewports):**
  - **Top Bar:** Single brand presence (logo, search trigger, drawer menu trigger); zero redundant action buttons.
  - **Drawer Menu:** Strict 6-link overflow lock (`About`, `Clients`, `Trusted By`, `FAQ`, `Planning`, `Downloads`).
  - **Bottom Navigation:** Fixed 5-tab bar (`Products`, `Planner`, `Quote`, `Portfolio`, `Sign in`).
  - **Dynamic Stacking:** `--site-fab-bottom` dynamically calculates offset above the bottom navigation bar and suppresses the floating action button when the cookie consent banner is visible.

---

## Domain 7: Testing & Quality Infrastructure

### 7.1 Two-Lane Vitest Pipeline Architecture
The primary test harness executes via `scripts/run-full-vitest.mjs` (invoked via `pnpm run test`), structuring execution into two distinct, non-interfering lanes:

```
pnpm run test
  │
  ├── Lane 1: Application Vitest Suite (tests/vitest.config.ts)
  │     ├── Pool: "forks", maxWorkers: 4
  │     └── Executes unit & integration tests for Planner, Studio, Site, and Admin
  │
  ├── Intermediate: Staging Codegen (tech-docs-generator/scripts/generate-all.mjs)
  │     └── Generates fresh AST datasets into generated-documents/data/
  │
  └── Lane 2: Tech-Docs Vitest Suite (tests/vitest.tech-docs.config.ts)
        ├── Pool: "forks", isolate: true, maxWorkers: 1, testTimeout: 120s
        └── Executes serial AST validation and tech-docs integration tests
```

- **Isolation Rationale:** Lane 2 must run serially with `maxWorkers: 1` because full AST extraction and graph generation across 18 domains consume massive memory. Running Lane 2 concurrently with the 4-worker application suite causes Windows worker deadlocks and heap exhaustion.
- **Execution Rule:** A test pass is valid only if **both Lane 1 and Lane 2 exit with code 0**.

### 7.2 DOM Emulation & Global Stubs (`tests/setup.ts`)
Vitest executes under the `happy-dom` environment (`tests/vitest.config.ts:75`):
- **React 19 Polyfills:** `IS_REACT_ACT_ENVIRONMENT = true`, plus React 19 `delegateAct` bridge handling CJS/ESM compatibility.
- **Web APIs:** Global `crypto.subtle` fallback implemented via Node's `node:crypto` `webcrypto`.
- **Next.js Framework Mocks:** Polyfilled mocks for `next/font`, `next/image`, `next/link`, and `next-intl`.
- **Canvas & WebGL Stubs:** Injects headless canvas and WebGL context stubs, allowing Fabric.js and Three.js components to mount and execute lifecycle assertions without GPU hardware.

### 7.3 Coverage Floor Policy & Gate Realities
- **100% Policy Floor:** Tracked in [`tests/manifests/coverage-exceptions.json`](../../tests/manifests/coverage-exceptions.json):
  ```json
  {
    "version": 1,
    "policy": {
      "lines": 100,
      "functions": 100,
      "statements": 95,
      "branches": 95
    },
    "exceptions": []
  }
  ```
- With `"exceptions": []`, zero coverage exceptions are granted for gated profiles.
- **Coverage Profiles:**
  - `tests/vitest.config.ts`: Covers Planner, Studio, and shared libraries.
  - `tests/vitest.site.config.ts`: Covers Site marketing logic and routes.
  - `tests/vitest.admin.coverage.config.ts`: Covers Admin operations and CRM views.
  - `tests/vitest.coverage.inventory.config.ts`: Unthresholded diagnostic rollup profile.
- **`site/proxy.ts` Middleware Coverage Reality:** `site/proxy.ts` (20 KB reverse proxy middleware) has active unit tests in `tests/unit/site/proxy.test.ts` and `tests/unit/site/proxy.live-smoke.test.ts`. However, it is currently included only in the diagnostic inventory profile (`VITEST_PLANNER_INVENTORY_COVERAGE_INCLUDE`), rather than the strict release gate profile (`VITEST_PLANNER_GATE_COVERAGE_INCLUDE`). Adding `site/proxy.ts` to `vitest.site.config.ts` will formalize its coverage gating without requiring new test mock infrastructure.

### 7.4 Test Results Storage Routing & Git Purity
- **Census File:** [`tests/INVENTORY.md`](../../tests/INVENTORY.md) is the sole Git-tracked census of all **940 test files** (780 vitest, 85 playwright, 75 test support files). Drift is detected via `pnpm run docs:check` (running `git diff --exit-code -- tests/INVENTORY.md`).
- **Ephemeral Test Evidence:** Output artifacts (`results/tests/vitest-results.json`, `results/coverage/`) are strictly gitignored via `.gitignore:68-70`. Hand-written Markdown reports under `results/` are strictly forbidden by `AGENTS.md §8`.
- **Playwright Evidence:** Browser traces, screenshots, and videos output to `test-results/` (gitignored).

---

## Domain 8: Cloudflare Worker Proxy & Edge Infrastructure

### 8.1 Edge Proxy Subsystem (`workers/oando-worker-proxy/`)
The Cloudflare Worker proxy acts as the edge entry point for all traffic arriving at `oando.co.in` and `www.oando.co.in`:
- **Package Architecture:** Standalone package with independent `package.json` and `package-lock.json`, npm-managed outside the root pnpm workspace. Deployed via `pnpm run worker:deploy`.
- **Source Modules:**
  - `src/index.js`: Request handler, protocol guards, URL rewriting, R2 proxying, and origin fetch dispatch.
  - `src/cachePolicy.js`: Cache-Control header evaluation, bypass rules, and TTL computation.
- **Tested Coverage:** Unit tests live in `tests/unit/workers/cachePolicy.test.ts` and `tests/unit/workers/originConfig.test.ts`.

### 8.2 Bindings & Origins
- `ASSET_BUCKET`: Bound to Cloudflare R2 bucket `oando-asset-cdn`.
- `CATALOG_VECTORS`: Bound to Cloudflare Vectorize index `catalog-nav`.
- `VERCEL_ORIGIN`: Configured to `https://23082026.vercel.app` (per `workers/oando-worker-proxy/wrangler.toml`).
- `PUBLIC_INDEXABLE_HOSTS`: Set to `oando.co.in,www.oando.co.in`.

### 8.3 Edge Routing Rules & Invariants
```
Incoming Edge Request
  │
  ├── 1. Protocol Guard: Path begins with "//" ──► HTTP 400 Bad Request
  │
  ├── 2. Apex Canonicalization: Host is "www.oando.co.in" ──► HTTP 308 to "https://oando.co.in"
  │
  ├── 3. Security RFC 9116: "/.well-known/security.txt" or "/security.txt" ──► Edge Response (24h TTL)
  │
  ├── 4. Asset Offloading: "/assets/*" or "/images/*"
  │     ├── Found in R2 Bucket ──► Stream from R2 (Cache: public, max-age=31536000, immutable)
  │     └── R2 Miss ──► Serve Fallback Brand Logo ("x-oando-proxy: r2-fallback", 5-min TTL)
  │
  └── 5. Dynamic / Marketing SSR ──► Forward to Vercel Origin
        ├── Strips origin "X-Robots-Tag: noindex, nofollow"
        ├── Sets "X-Robots-Tag: all" and "x-oando-indexable: 1" for apex indexable hosts
        └── Injects Cache-Control headers based on path and session state
```

### 8.4 Caching Policy Contract (`cachePolicy.js`)

| Route Category | Target Paths / Conditions | Cache-Control Header Emitted |
| :--- | :--- | :--- |
| **Immutable Next Assets** | `/_next/static/**` | `public, max-age=31536000, immutable` |
| **Static Images & Icons** | `/favicon.ico`, `/icon.png`, `/assets/**`, `/images/**` | `public, max-age=86400, stale-while-revalidate=604800` |
| **Public HTML & SSR** | `/`, `/products/**`, `/choose-product/**`, `/about/**`, etc. | `public, s-maxage=300, stale-while-revalidate=3600` |
| **Private Applications** | `/ooplanner/**`, `/oostudio/**`, `/admin/**`, `/portal/**` | `private, no-cache, no-store, must-revalidate` (Bypasses Edge Cache) |
| **API Endpoints** | `/api/**` | `private, no-cache, no-store, must-revalidate` (Bypasses Edge Cache) |
| **Authenticated Users** | Requests bearing `sb-access-token` or `sb-refresh-token` | `private, no-cache, no-store, must-revalidate` (Bypasses Edge Cache) |

### 8.5 Supabase R2 Nightly Backup Pipeline
Database backup safety is maintained by an automated pipeline:
- **GitHub Actions Workflow:** [`.github/workflows/supabase-backup-r2.yml`](../../.github/workflows/supabase-backup-r2.yml) triggers nightly at 02:15 UTC (`15 2 * * *`).
- **Runner Setup:** Installs `postgresql-client` on the Ubuntu runner to provide native `pg_dump`.
- **Archival Execution:** Runs `pnpm run ops backup:supabase:r2` (`scripts/db_backup_upload_r2.ts`), streaming compressed database dumps directly to the Cloudflare R2 backup bucket.
- **Retention Pruner:** Runs `pnpm run ops backup:r2:prune` (`scripts/prune_r2_backups.ts`), enforcing retention rules:
  - Daily backups: Retained for **5 days**.
  - Weekly backups: Retained for **30 days**.
  - Older backups: Automatically pruned. Tested by 12 passing unit tests in `tests/unit/lib/storage/r2Catalog.test.ts`.
- **Secrets Synchronization:** Operationalized via `scripts/sync-github-backup-secrets.ps1` using verified canonical secret names: `PRODUCTS_DATABASE_URL`, `SUPABASE_AUTH_DATABASE_URL`, `CLOUDFLARE_S3_URL`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, and `CLOUDFLARE_R2_CATALOG_BUCKET`.

### 8.6 Cloud-First Telemetry & 3-Way Environment Discipline
- **Cloud-First Observability ([`OBSERVABILITY.md`](../../OBSERVABILITY.md)):** The platform standardizes on three lean, decoupled telemetry channels without running heavyweight third-party APM daemons:
  1. Client Core Web Vitals (LCP, INP, CLS) and real user monitoring via `@vercel/analytics` and `@vercel/speed-insights`.
  2. Business analytics and conversion tracking via Google Analytics 4 (`GoogleAnalytics.tsx` + `NEXT_PUBLIC_GA_MEASUREMENT_ID`).
  3. Standard OpenTelemetry distributed tracing via Next.js runtime hook in `site/instrumentation.ts`.
  4. Local Prometheus `/api/metrics` scraping endpoint for ad-hoc inspection without requiring local Docker containers.
- **3-Way Environment Architecture:**
  1. Root `.env.example` → `.env.local` and `site/.env.local`. Default `DEV_AUTH_BYPASS=1`.
  2. `site/.env.example`: Next runtime. Default `DEV_AUTH_BYPASS=0`. Prod `https://oando.co.in`. Adds Bedrock/OTEL/metrics.
  3. `tech-docs-generator/.env.example`: six public keys (`VITE_PORT`, `NEXT_PUBLIC_*`, `NEXT_ADMIN_SUPABASE_URL` / anon / publishable). No service role. `:3001` / `https://oando23.vercel.app`.

---

## Architectural Invariants Verification Matrix

To independently verify all subsystem invariants documented above, execute the following commands from the repository root:

```powershell
# 1. Domain 1: Governance & Layout Floor
pnpm run check:layout
pnpm run check:governance
node scripts/general/check-root-markdown-links.mjs

# 2. Domain 3 & 4: Scale Ratio Invariants & Fork Boundary Isolation
Select-String -Path "site/lib/Studio/studioPalette.ts" -Pattern "SCALE_PX_PER_MM"
Select-String -Path "site/lib/Planner/plannerGeometryContract.ts" -Pattern "PLANNER_SCALE_PX_PER_MM|STUDIO_SCALE_PX_PER_MM"
pnpm run scan:boundaries

# 3. Domain 5: Mode-Aware Persistence & Database Connectivity
Select-String -Path "site/lib/Planner/plannerPersistenceMode.ts" -Pattern "assertNoDiskInProduction"
Select-String -Path "site/lib/catalog/furnitureCatalogMode.ts" -Pattern "getFurnitureCatalogMode"
pnpm run ops db:test

# 4. Domain 6: FOCSS Modular Engine & Style Token Ratchet
pnpm run verify:focss
pnpm run lint:ui:strict
pnpm run check:style-tokens

# 5. Domain 7: Two-Lane Vitest Suite & Documentation Drift
pnpm run test
pnpm run docs:check

# 6. Domain 8: Cloudflare Worker Edge Proxy Tests
pnpm exec vitest run tests/unit/workers/cachePolicy.test.ts tests/unit/workers/originConfig.test.ts
```
