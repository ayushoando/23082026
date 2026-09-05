# Oando Subsystem Remediation Plan: Tech-Docs Generator SPA Architecture

**File Target:** `plans/05092026/05-tech-docs-generator-spa.md`  
**Governing Standard:** `AGENTS.md` (Authority floor: User instruction > live code/fresh command output > `AGENTS.md`)  
**Execution State:** **FROZEN / PLANNING ONLY** (`NO CODE CHANGE`, `NO AUTO IMPLEMENT`)  
**Methodology:** Independent Vite 8 SPA Architecture, 12 Core Documentation Routes, Live Database Schema / ER Diagram Synchronization, and Isolated Test Lane.

---

## 1. Subsystem Overview & Infrastructure Blueprint

The Tech-Docs Generator (`tech-docs-generator/`) is an independent, high-speed single-page application built on Vite 8, React 19, and Tailwind CSS v4. It compiles platform documentation, dynamic architecture graphs, and live database schemas into a production-ready static site.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TECH-DOCS GENERATOR ARCHITECTURE                     │
├────────────────────────────────────────────────────────────────────────┤
│ Host / Port Configuration:                                             │
│ • Production Deployment: https://oando23.vercel.app                    │
│ • Local Development Port: http://localhost:3001 (strictPort: true)     │
│ • Never shares port 3000 (reserved for Next.js app)                   │
├────────────────────────────────────────────────────────────────────────┤
│ Build Paths & Output Contract (scripts/output-contract.mjs):           │
│ • SPA Source Code:  tech-docs-generator/src/                           │
│ • Built Distribution:  generated-documents/site/                      │
│ • Repository Data:  generated-documents/data/                          │
│ • Static Markdown:  generated-documents/docs/                          │
│ • Vite Build Cache: results/tooling/tech-docs/vite-cache/              │
├────────────────────────────────────────────────────────────────────────┤
│ Core Components:                                                       │
│ • AppInner: Navigation sidebar, command palette, reading progress      │
│ • MermaidDiagram: Dynamic client-side rendering of entity diagrams     │
│ • LiveRepoSection: Dynamic synchronization with repository data        │
│ • CollapsibleSection & CodeBlock: Syntax-highlighted specifications    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The 12 Primary Documentation Routes (`App.tsx`)

The SPA declares 12 dedicated pages mapped via `react-router-dom`:

| Route Path | Page Component | File Path | Core Content & Responsibility |
|------------|----------------|-----------|-------------------------------|
| `/` | `Overview` | `src/pages/Overview.tsx` | Platform executive summary, subsystem health, build status. |
| `/tech-stack` | `TechStack` | `src/pages/TechStack.tsx` | Next.js 16, React 19, Tailwind v4, Fabric 7, Supabase, Cloudflare. |
| `/architecture` | `Architecture` | `src/pages/Architecture.tsx` | Monorepo layout, boundary isolation, request flow, and edge routing. |
| `/features` | `Features` | `src/pages/Features.tsx` | Commercial catalog, Planner, Studio, RFQ handoffs, price books. |
| `/code-organization` | `CodeOrganization` | `src/pages/CodeOrganization.tsx` | Directory contracts, ownership anchors, file naming conventions. |
| `/database` | `Database` | `src/pages/Database.tsx` | Dual-database schemas, Mermaid ER diagrams, persistence routes. |
| `/api` | `ApiDesign` | `src/pages/ApiDesign.tsx` | Public REST APIs, Admin actions, idempotency contracts, error shapes. |
| `/testing` | `Testing` | `src/pages/Testing.tsx` | Dual-lane Vitest matrix, Playwright gates, integrity audits. |
| `/deployment` | `Deployment` | `src/pages/Deployment.tsx` | Vercel production deployment, Cloudflare Worker proxy, R2 backups. |
| `/security` | `Security` | `src/pages/Security.tsx` | Threat models, RLS policies, service-role isolation, RFC 9116. |
| `/performance` | `Performance` | `src/pages/Performance.tsx` | Bundle sizing, Core Web Vitals (LCP/INP), canvas rendering budgets. |
| `/workflows` | `Workflows` | `src/pages/Workflows.tsx` | Developer onboarding, migration dry-runs, gate pass criteria. |

---

## 3. Database Schema & ER Diagram Synchronization (`Database.tsx`)

A centerpiece of the Tech-Docs SPA is the live visualization of the dual-database architecture:
- **Entity Relationship Model:** Visualized via Mermaid.js inside `Database.tsx`:
  - `profiles` (Auth & RBAC) owning `oando_plans` and `planner_operation_idempotency`.
  - `catalog_products` (Marketing Products DB) owning images, specs, and aliases.
  - `planner_managed_products` owning `svg_revisions` and `svg_revision_artifacts`.
  - `furniture_catalog` and `block_descriptors` (Admin DB) maintaining furniture primitives.
- **Dynamic Data Ingestion:**
  - Reads structured data from `tech-docs-generator/src/data/databaseData.ts` and `databaseBoundaries.ts`.
  - Maps tables directly to their backing Supabase project (`rxzpznmxbaoxpikowmfc` vs `erpweaiypimorcunaimz`).
  - Highlights persistence mode selectors (`plannerPersistenceMode.ts` and `furnitureCatalogMode.ts`).

---

## 3a. Authentication Layer (`AuthGate`, `AuthProvider`, `AuthScreenShell`)

The Tech-Docs SPA is **not purely public**. It ships a full authentication layer:

| Component | File | Role |
|-----------|------|------|
| `AuthProvider` | `src/auth/AuthProvider.tsx` | Wraps the app and exposes auth context (`useAuth()`). |
| `AuthGate` | `src/auth/AuthGate.tsx` | Route guard — renders `AuthScreenShell` for unauthenticated users. |
| `AuthScreenShell` | `src/auth/AuthScreenShell.tsx` | Hosts `LoginPage` for sign-in flow. |
| `LoginPage` | `src/auth/LoginPage.tsx` | Credentials form. |

- **Boundary Rule:** Auth components live under `src/auth/` and must never import from `src/pages/`. Pages import from `src/auth/` only through `useAuth()` context.
- **Gate behaviour:** `AuthGate` wraps all 12 documentation routes. Unauthenticated requests see the login screen; authenticated sessions proceed to content.
- **No impact on Next.js auth:** The tech-docs auth system is fully independent. It must never share session tokens or Supabase clients with the main `site/` app.

---

## 3b. Live-Data & Interactive UI Features

Beyond static documentation, several components provide real-time repository intelligence:

| Component | File | Capability |
|-----------|------|-----------|
| `LiveRepoSection` | `src/components/LiveRepoSection.tsx` | Fetches and renders live stats from `generated-documents/data/*.json` (refreshed by `generate-all.mjs`). Displays test pass rates, migration counts, and governance baselines. |
| `CommandPalette` | `src/components/CommandPalette.tsx` | Keyboard-driven navigation (⌘K / Ctrl+K). Indexes all 12 routes and section headings. Allows fuzzy jump-to-section. |
| `MermaidDiagram` | `src/components/MermaidDiagram.tsx` | Client-side Mermaid.js rendering of ER diagrams, sequence flows, and dependency graphs. Aliased to `tech-docs-generator/node_modules/mermaid` to prevent root-hoisted version conflicts. |
| `ReadingProgress` | `src/components/ReadingProgress.tsx` | Thin scroll-progress bar tracking position within long documentation pages. |

- **`LiveRepoSection` data freshness:** If `generate-all.mjs` has not been run before the Lane 2 Vitest suite starts, `LiveRepoSection` tests will evaluate stale or absent data files. Lane 2 always runs `generate-all.mjs` as a pre-step (see `scripts/run-full-vitest.mjs#L83-L94`).
- **`CommandPalette` — no cross-app dependency:** It must only index `tech-docs-generator` routes. Never reference `site/features/site/data/navigation.ts` or any `site/` module.



## 4. Vite Configuration & Server Isolation

The build is defined in `tech-docs-generator/vite.config.ts`:
- **Port Discipline:** Explicitly sets `server.port = 3001` and `server.strictPort = true`. It will fail rather than steal port 3000 from Next.js.
- **Monorepo FS Access:** `server.fs.allow: [repoRoot]` allows serving FOCSS tokens and shared contracts from `site/focss/` and `site/lib/`.
- **Zero Temporary Stages:** Builds directly into `generated-documents/site/` without intermediate `.tmp` directories that could pollute Git status.
- **Base URL Guarantee:** Uses `base: '/'` to prevent asset loading failures on deep path refreshes on Vercel (`https://oando23.vercel.app`).

---

## 5. Independent Test Lane (Lane 2)

Tech-Docs is verified in Vitest as an independent execution lane to guarantee that documentation builds never break or regress:
- **Configuration File:** `tests/vitest.tech-docs.config.ts`
- **Scope:** 42 test files, 224 specifications covering components, data parsers, and diagram generators.
- **Environment:** `happy-dom` with `isolate: true` and `maxWorkers: 1` (serial execution to prevent memory contention on CI/CD runners).

---

## 6. Verification & Runbook

### Authorized Local Execution Commands
```bash
# Start Tech-Docs SPA development server on port 3001
pnpm run tech-docs:dev

# Build Tech-Docs static output to generated-documents/site/
pnpm run tech-docs:build

# Preview built production output on port 3001
pnpm run tech-docs:preview

# Run the dedicated Lane 2 Vitest test suite
pnpm run test:tech-docs
```

### Preflight Checks for Documentation Updates
1. When modifying database tables or relations, update the Mermaid diagram in `src/pages/Database.tsx` and data arrays in `src/data/databaseData.ts`.
2. Run `pnpm run tech-docs:build` to confirm clean compilation with zero Tailwind v4 or TypeScript errors.
3. Execute `pnpm run test:tech-docs` to ensure all 224 specs pass cleanly.
