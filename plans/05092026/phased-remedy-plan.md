# Comprehensive Subsystem Master Remedy & Polish Blueprint (2026-09-05)

**Document:** `plans/05092026/phased-remedy-plan.md`  
**Governing Standard:** `AGENTS.md` (Authority floor, User Wins)  
**Methodology:** Subsystem-Centric Architecture, Deep Technical Specification & Actionable Runbooks  
**Execution State:** **FROZEN / PLANNING ONLY** (`NO CODE CHANGE`, `NO AUTO IMPLEMENT`)  
**Scope:** UI & Platform Alignment, Design Tokens, Mobile Chrome & System Debt Remediation (**Strictly No Redesign**)  

---

## 1. Executive Summary & Core Invariants

This master blueprint defines the complete architectural and technical specifications for platform debt remediation, UI alignment, and design system polish across the Oando repository. In accordance with user directives, **no visual redesign** is proposed; rather, the focus is strictly on **precision alignment and polish**: reconciling FOCSS semantic tokens, mobile chrome ergonomics, icon standardizations, dual-database boundaries, and ship-bar release verification.

### Core Invariants:
1. **Zero Code Changes (`NO CODE CHANGE`):** No application source code, tests, or scripts are modified during this planning phase.
2. **Zero Auto-Implementation (`NO AUTO IMPLEMENT`):** All output is delivered strictly as an authoritative technical blueprint in this plan file.
3. **Design Identity Preservation:** Preserve existing page layouts, brand aesthetic ("quiet luxury"), typography, and color schemes. Polish spacing, semantic tokens, and component contracts without redesigning.
4. **Boundary Isolation:** Studio (`/oostudio`) and Planner (`/ooplanner`) remain completely forked trees with zero cross-imports (`scan:boundaries`).
5. **Persistence Safeguards:** Production runs on a strictly read-only filesystem (`EROFS` protection). All mutations must route through mode-aware persistence wrappers.
6. **Dual-Database Split:**
   - **Admin Database (`rxzpznmxbaoxpikowmfc`):** Plans, user profiles, teams, price books, furniture catalog, and block descriptors.
   - **Products Database (`erpweaiypimorcunaimz`):** Marketing catalog, configurators, feature flags, and themes.
   - Zero dual-writing permitted.

---

## 2. Subsystem Module 1: UI & Design System Alignment and Polish (No Redesign)

### 2.1 Architecture Blueprint & FOCSS Token Standard
FOCSS operates as a semantic layer on top of Tailwind CSS v4 (`@tailwindcss/postcss`). You write against semantic tokens, not raw arbitrary utility overrides.

```
┌────────────────────────────────────────────────────────┐
│             Tailwind CSS v4 Utility Engine             │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│          FOCSS Semantic Tokens Layer (site/focss/)     │
│  - Colors: var(--surface-*), var(--text-*), var(--border)│
│  - Radius: rounded-sm, rounded-md, rounded-xl          │
│  - Spacing: standard 4px scale, container bounds       │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                 4 Isolated Zone Entries                │
│   site/entry.css  │ admin/entry.css                    │
│   planner/entry.css │ studio/entry.css                 │
│          (Strictly zero cross-zone imports)            │
└────────────────────────────────────────────────────────┘
```

- **Arbitrary Override Elimination:** Disallow arbitrary bracket utilities (e.g. `rounded-[var(--radius-card)]`, `p-[18px]`, `w-[320px]`). Standardize strictly on semantic tokens like `rounded-xl`, `p-4`, `max-w-md`.
- **Phosphor Icon Map Standard:** All icons across public and workspace surfaces must render via `PhIcon` using the unified `phIconMap`. Inline `<svg>` declarations and Lucide icon imports are strictly forbidden.
- **Micro-Typography & Spacing Polish:** Standardize card padding (`p-6` desktop, `p-4` mobile), section gutters, and line-heights across marketing routes, `/tools` hub, and interactive calculators.

### 2.2 Deep Technical Specification
- **Target Files:**
  - `site/focss/site/components/chrome/app-shell.css`: Coordinate mobile chrome offsets.
  - `site/app/(site)/tools/page.tsx`: Standardize card radius utility to `rounded-xl`.
  - `site/components/site/PhIcon.tsx` & `site/lib/icons/phIconMap.ts`: Ensure comprehensive icon mapping for tools, navigation, and modal controls.
  - `site/features/site/tools/OfficeSpaceCalculator.tsx` & `MeetingRoomCapacityCalculator.tsx`: Polish input field alignment, slider touch targets ($\ge 44\text{px}$), and responsive grid breakpoints.

### 2.3 Actionable Runbook Checklist
- [ ] **Step 1:** Audit all TSX files under `site/app/(site)/tools/` for bracket bypasses; verify 0 violations.
- [ ] **Step 2:** Run `pnpm run check:style-tokens` to verify token ratchet remains at or below baseline (200 findings).
- [ ] **Step 3:** Run `pnpm run verify:focss` to assert zero zone-boundary leaks across all 151 CSS files.
- [ ] **Verification Gate:**
  ```powershell
  pnpm run verify:focss
  pnpm run lint:ui:strict
  pnpm run check:style-tokens
  ```

---

## 3. Subsystem Module 2: Mobile Chrome & App Shell Ergonomics (<768px)

### 3.1 Architecture Blueprint & Viewport Coordination
Mobile chrome (<768px) coordinates five distinct floating and pinned elements without visual collisions, overlapping buttons, or layout shifts.

```
┌────────────────────────────────────────────────────────┐
│ Top Bar: [Logo]                     [Search] [Drawer ☰] │
├────────────────────────────────────────────────────────┤
│                                                        │
│                    Page Content Area                   │
│                                                        │
│                                          ┌──────────┐  │
│                                          │   FAB    │  │
│                                          └──────────┘  │
├────────────────────────────────────────────────────────┤
│ Cookie Consent Bar (z-index 40, above tab bar)         │
├────────────────────────────────────────────────────────┤
│ Bottom Nav (5 Tabs): [Products][Planner][Quote][Portfolio][Sign in] │
└────────────────────────────────────────────────────────┘
```

- **Top Bar Simplification:** Remove redundant call-to-action buttons ("Get Quote"). Top bar contains only Brand Logo, Search trigger, and Drawer toggle.
- **Drawer Menu Quarantine:** Restrict the hamburger slide-over menu strictly to the 6 designated overflow links: `About`, `Clients`, `Trusted By`, `FAQ`, `Planning`, `Downloads`.
- **Dynamic Offset Rules:**
  - Floating Action Button (FAB) bottom offset: `--site-fab-bottom: calc(var(--mobile-tab-bar-height) + 0.75rem);`.
  - Cookie consent banner: `bottom: calc(var(--mobile-tab-bar-height) + 1px) !important;`.
  - Collision suppression: `html:has([data-cookie-consent-bar]) .site-fab-launcher { display: none; }`.

### 3.2 Deep Technical Specification
- **Target Files:**
  - `site/components/site/MobileAppShell.tsx`: Eliminates `mobilePrimaryAction()` rendering the top-bar button; locks drawer links to the canonical 6.
  - `site/focss/site/components/chrome/app-shell.css`: Enforces dynamic CSS variables and cookie banner stacking rules.

### 3.3 Actionable Runbook Checklist
- [ ] **Step 1:** Confirm `MobileAppShell.tsx` renders top bar with exactly 3 elements: Logo, search button, drawer trigger.
- [ ] **Step 2:** Verify drawer contains exactly 6 links (`About`, `Clients`, `Trusted By`, `FAQ`, `Planning`, `Downloads`).
- [ ] **Step 3:** Validate CSS stacking rules in `app-shell.css` preventing FAB / cookie banner overlap.
- [ ] **Verification Gate:**
  ```powershell
  pnpm run verify:focss
  pnpm run lint:ui:strict
  ```

---

## 4. Subsystem Module 3: Route Contracts, SEO & Localization Parity

### 4.1 Architecture Blueprint & Localization Contracts
The platform enforces strict static contracts for public indexable routes, sitemaps, and bilingual copy loaders.

```
       Incoming URL Request
                │
       ┌────────┴────────┐
       ▼                 ▼
  [Route Meta]      [next-intl Request]
  (siteSeoContract) (site/i18n/request.ts)
       │                 │
  SEO01_STATIC      Detect NEXT_LOCALE (en | hi)
  Metadata Match    Merge messages/{locale}.json
       │                 │
       ▼                 ▼
  Canonical Title,  Runtime Copy Loader
  Desc & OpenGraph  (withLocaleCopy.ts across 16 routes)
```

- **Route Classification:** `/tools`, `/tools/office-space-calculator`, and `/tools/meeting-room-capacity-calculator` must be classified as `public` and `indexable: true`.
- **HTML & XML Sitemaps:** Registered in `htmlSitemap.ts` (`COMPANY_SERVICE_PATHS`) and dynamic `sitemap.ts`.
- **Localization Parity:** `messages/en.json` and `messages/hi.json` maintain **100% key parity** across 861 leaf keys and 26 namespaces with zero untranslated English leaks in Hindi navigation.

### 4.2 Deep Technical Specification
- **Target Files:**
  - `site/features/site/data/siteSeoContract.ts`: Register `/tools` static metadata.
  - `site/features/site/data/htmlSitemap.ts`: Register `/tools` and calculator links.
  - `site/features/site/data/routeClassification.ts`: Enforce public/indexable route classification.
  - `site/i18n/messages/en.json` & `site/i18n/messages/hi.json`: Maintain key parity and copy completeness.

### 4.3 Actionable Runbook Checklist
- [ ] **Step 1:** Run `pnpm run check:i18n:parity` to assert 100% translation key match.
- [ ] **Step 2:** Run targeted Vitest suite on SEO and sitemap contracts:
  ```powershell
  pnpm exec vitest run --config tests/vitest.config.ts `
    tests/unit/features/site/data/htmlSitemap.test.ts `
    tests/unit/features/site/data/siteSeoAcceptance.test.ts `
    tests/unit/features/site/data/siteSeoContract.test.ts
  ```

---

## 5. Subsystem Module 4: Interactive Workspaces (Studio & Planner)

### 5.1 Architecture Blueprint & Scale Invariants
Studio (`/oostudio`) and Planner (`/ooplanner`) are strictly forked, isolated applications.

- **Scale Invariant:**
  - **Studio:** **0.2 px/mm** (furniture component authoring).
  - **Planner:** **0.05 px/mm** (architectural space layout).
  - Geometry helpers and canvas event logic must never be shared across the fork.
- **Dockview Shelving:** Each app has its own `DockShell` using `dockview-react` 8.2.0; zero shared docking state.
- **Canvas State:** Isolated Zustand stores (`useStudioStore`, `usePlannerStore`).
- **3D Legacy State:** 3D dependencies (`three`, `@react-three/fiber`, `open3d-floorplan`) were retired 2026-08-03 and remain completely absent from disk.

### 5.2 Deep Technical Specification
- **Target Files:**
  - `site/components/Studio/` & `site/components/Planner/`: Forked UI components.
  - `site/store/Studio/` & `site/store/Planner/`: Forked state stores.
  - `site/lib/catalog/planSymbolPngContract.ts`: Contract enforcing 2 px/mm density, 40 mm padding, and SHA-256 buffer checksums for catalog symbol PNGs.
  - `scripts/scan-boundaries.mjs`: Automated gate enforcing zero cross-imports between Studio and Planner.

### 5.3 Actionable Runbook Checklist
- [ ] **Step 1:** Execute `pnpm run scan:boundaries` to confirm zero boundary violations.
- [ ] **Step 2:** Run Planner and Studio unit tests:
  ```powershell
  pnpm exec vitest run --config tests/vitest.config.ts tests/unit/planner tests/unit/studio
  ```

---

## 6. Subsystem Module 5: Data Platform, Persistence & Cloud Infrastructure

### 6.1 Architecture Blueprint & Dual-DB Security
- **Production Filesystem Protection:** Production runs on a read-only serverless filesystem. Direct `fs.writeFile` crashes with `EROFS`. Route handlers must strictly invoke mode-aware store wrappers (`writeFurnitureItem`, `savePlannerProject`).
- **Dual-Database Split:**
  - Admin DB (`rxzpznmxbaoxpikowmfc`): Plans, furniture catalog, block descriptors, and audit logs.
  - Products DB (`erpweaiypimorcunaimz`): Marketing products, configurators, flags, and themes.
- **AI Fallback Chain (`site/lib/ai/mastra/providers.ts`):**
  1. Gemini (free tier default `gemini-2.5-flash`)
  2. OpenRouter primary (`openrouter/auto`)
  3. OpenRouter backup (`openrouter/auto`)
  4. OpenAI fallback (`gpt-4o-mini`)
  5. Bedrock fallback (`us.amazon.nova-lite-v1:0`)
- **Cloudflare Infrastructure:**
  - Workers proxy (`workers/oando-worker-proxy/`).
  - Vectorize REST indexing (`catalog-nav`, 768 dims cosine).
  - R2 backup automation (`scripts/sync-github-backup-secrets.ps1`, `prune_r2_backups.ts`).

### 6.2 Deep Technical Specification
- **Target Files:**
  - `site/lib/catalog/furnitureCatalogMode.ts`: Catalog persistence mode selector.
  - `site/lib/Planner/plannerPersistenceMode.ts`: Plan persistence mode selector.
  - `site/lib/ai/mastra/providers.ts`: AI model chain allowlist and default fallback string.
  - `.oxlintrc.json`: Oxlint configuration containing `"react-hooks"` in `"plugins"`.
  - `scripts/sync-github-backup-secrets.ps1`: Canonical `CLOUDFLARE_R2_*` secret sync.

### 6.3 Actionable Runbook Checklist
- [ ] **Step 1:** Validate AI provider fallback via `tests/unit/lib/ai/mastra/providers.test.ts`.
- [ ] **Step 2:** Run Oxlint with `react-hooks` enabled via `node scripts/general/run-oxlint.mjs`.
- [ ] **Step 3:** Verify backup secrets script uses canonical `CLOUDFLARE_R2_*` variable names.
- [ ] **Verification Gate:**
  ```powershell
  pnpm exec vitest run --config tests/vitest.config.ts tests/unit/lib/ai/mastra/providers.test.ts
  node scripts/general/run-oxlint.mjs
  ```

---

## 7. Subsystem Module 6: Tech-Docs Generator (Vite Inventory SPA)

### 7.1 Architecture Blueprint & Production Hosting
The Tech-Docs Generator (`tech-docs-generator/`) is an independent Vite single-page application inventorying all platform models, architecture diagrams, and testing results.

- **Canonical Production URL:** `https://oando23.vercel.app` (synchronized across `site/lib/admin/techDocsUrl.ts` and `docs/architecture/product-map.md`).
- **Core Route Inventory:** 12 documentation pages mapped in `src/App.tsx`.
- **Database ER Diagram:** `Database.tsx` maps active live schemas (`audit_events`, `furniture_catalog`, `block_descriptors`, `catalog_products`).

### 7.2 Actionable Runbook Checklist
- [ ] **Step 1:** Execute Tech-Docs Vitest suite (Lane 2):
  ```powershell
  pnpm exec vitest run --config tests/vitest.tech-docs.config.ts
  ```
- [ ] **Step 2:** Execute Tech-Docs build:
  ```powershell
  pnpm run build:tech-docs
  ```

---

## 8. Subsystem Module 7: Governance, Test Harness & Sequential Ship Gating

### 8.1 Sequential Blocker Clearance Protocol
Blockers recorded in [`Failures.md`](../../Failures.md) are strictly governed:

1. **Sequential Step 1: Resolve `GATE-RECHECK-01` (Headless Ship Gate)**
   - Run the 4 previously failing unit test suites:
     ```powershell
     pnpm exec vitest run --config tests/vitest.config.ts `
       tests/unit/features/site/data/htmlSitemap.test.ts `
       tests/unit/features/site/data/siteSeoAcceptance.test.ts `
       tests/unit/features/site/data/siteSeoContract.test.ts `
       tests/unit/lib/ai/mastra/providers.test.ts
     ```
   - Execute `pnpm run release:gate:core` (layout, focss, oxlint, typecheck, both vitest lanes, site build, tech-docs build, coverage, docs purity, style tokens, governance, secrets).
   - Only after this exits code 0, prune `GATE-RECHECK-01` from `Failures.md`.

2. **Sequential Step 2: Resolve `BROWSER-ORIGIN-02` (Local App Browser Walk)**
   - Start the local dev server: `pnpm run dev` at `http://localhost:3000` (strictly prohibited from using `127.0.0.1`).
   - Run the 4-viewport Playwright browser walk: `pnpm run test:browser:gate`.
   - Only after Chromium observes all routes and captures screenshots, prune `BROWSER-ORIGIN-02` from `Failures.md`.

### 8.2 Master Verification Runbook

```powershell
# ==============================================================================
# 1. Structural & Hygiene Preflight
# ==============================================================================
node scripts/general/check-repo-layout.mjs
node scripts/general/run-oxlint.mjs
pnpm run lint:ui:strict
pnpm run verify:focss
pnpm run check:style-tokens
pnpm run check:governance
pnpm run check:docs-all

# ==============================================================================
# 2. Both Vitest Lanes
# ==============================================================================
pnpm exec vitest run --config tests/vitest.config.ts
pnpm exec vitest run --config tests/vitest.tech-docs.config.ts

# ==============================================================================
# 3. Release Gate (Ship Bar)
# ==============================================================================
pnpm run gate
```
