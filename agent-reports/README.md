# Agent Reports Directory & Master Navigation Index

**Last Updated:** 2026-09-04  
**Location:** [`agent-reports/`](file:///d:/23082026/agent-reports/)  
**Coverage:** **100% Repository-Wide Folder & Subsystem Coverage (38 Reports)**

---

## 1. Application Layer (`site/` Architecture Suite)

| Subsystem / Folder | Audit Report File | Core Insights & Findings |
| :--- | :--- | :--- |
| **`site/app/`** | [`site-app-audit.md`](file:///d:/23082026/agent-reports/site-app-audit.md) | Next.js 16 App Router: covers 4 applications (`(site)`, `admin`, `ooplanner`, `oostudio`), API routes, and flags the 10 HTTP 404 URLs in `sitemap.ts`. |
| **`site/components/`** | [`site-components-audit.md`](file:///d:/23082026/agent-reports/site-components-audit.md) | Presentation layer across 26 subdirectories: `ui/` primitives, `Planner/`, `Studio/`, `products/`, pure `@focss/*` compliance, and the 201 capped inline style exceptions. |
| **`site/features/`** | [`site-features-audit.md`](file:///d:/23082026/agent-reports/site-features-audit.md) | Business logic and controllers: `Planner/` (dockview & tools), `Studio/` (fabric & 3D glTF), `admin/` (catalog/analytics), `crm/` (leads), and `shared/auth/` (sessions). |
| **`site/focss/`** | [`focss-design-system-audit.md`](file:///d:/23082026/agent-reports/focss-design-system-audit.md) | The `@focss/*` custom token design system across 151 files (`base/`, `admin/`, `site/`, `planner/`, `studio/`), zero raw hex rule, and token ratchets. |
| **`site/hooks/`** | [`site-hooks-audit.md`](file:///d:/23082026/agent-reports/site-hooks-audit.md) | 18 React custom hooks, Fabric.js canvas disposal lifecycles, and the **5 hook dependency suppressions** that evaded CI detection. |
| **`site/inventory/`** | [`site-inventory-audit.md`](file:///d:/23082026/agent-reports/site-inventory-audit.md) | 23 canonical CAD 2D block descriptors (`schemaVersion: 2026-07-04.v2`), millimeter geometry, viewBox, sub-blocks, and fallback handling. |
| **`site/lib/`** | [`site-lib-audit.md`](file:///d:/23082026/agent-reports/site-lib-audit.md) | Core services across 31 subdirectories: `r2Catalog.ts` (S3 credential resolution), `assetPaths.ts` (legacy path remapping), `rateLimit.ts`, and catalog tree resolvers. |
| **`site/platform/`** | [`site-platform-audit.md`](file:///d:/23082026/agent-reports/site-platform-audit.md) | Persistence authority: Drizzle schemas (`catalog.ts` vs `planner.ts`), Supabase migrations, `assertNotServiceRoleKey()`, and the `profiles` schema trap. |
| **`site/public/`** | [`site-public-assets-audit.md`](file:///d:/23082026/agent-reports/site-public-assets-audit.md) | Static public assets: PWA `site.webmanifest`, machine-readable `llms.txt` AI crawler protocol, RFC 9116 `security.txt`, and CDN fallback assets. |
| **`site/server/`** | [`site-server-audit.md`](file:///d:/23082026/agent-reports/site-server-audit.md) | Backend server actions: decoupled `Planner/` (disk vs Supabase optimistic locking) and `Studio/` (Sharp SVG-to-PNG rasterization and catalog publishing). |
| **`site/store/`** | [`site-store-audit.md`](file:///d:/23082026/agent-reports/site-store-audit.md) | Reactive client state: decoupled Zustand stores for Planner (`plannerUiStore`, `plannerCatalogStore`) and Studio (`studioUiStore`, `studioCatalogStore`). |
| **`site/types/`** | [`site-types-audit.md`](file:///d:/23082026/agent-reports/site-types-audit.md) | TypeScript type bridges: Supabase database schema bridges and Chrome WebMCP origin-trial declarative agent attributes (`toolname`, `toolautosubmit`). |
| **`site/` (Root & Proxy)**| [`site-root-and-proxy-audit.md`](file:///d:/23082026/agent-reports/site-root-and-proxy-audit.md) | 537-line Edge Middleware (`proxy.ts`): dynamic CSP (unsafe-eval restricted strictly to canvas), CSRF/origin verification, maintenance mode, and member write enforcement. |

---

## 2. Monorepo Root & Subsystem Audits

| Target Folder | Audit Report File | Core Insights & Findings |
| :--- | :--- | :--- |
| **`.github/`** | [`github-ci-workflows-audit.md`](file:///d:/23082026/agent-reports/github-ci-workflows-audit.md) | CI/CD pipelines (`release-gate.yml`, `site-ui.yml`, `supabase-backup-r2.yml`), Dependabot version grouping, and automated PR quality instructions. |
| **`docs/`** | [`docs-architecture-audit.md`](file:///d:/23082026/agent-reports/docs-architecture-audit.md) | Durable human architecture documentation (`stack.md`, `product-map.md`, `schema.md`), analyzing `scripts.csv` drift (198 vs 229 files). |
| **`plans/`** | [`plans-and-flowcharts-audit.md`](file:///d:/23082026/agent-reports/plans-and-flowcharts-audit.md) | Master `PLAN.md`, client hub flowcharts (`clients-hub-flow.md`), and the 17-file TypeScript evidence and validation harness from the Planner audit. |
| **`Agents/`** | [`agents-handbooks-audit.md`](file:///d:/23082026/agent-reports/agents-handbooks-audit.md) | Standardized operating handbooks `01-standard.md` through `07-css.md`, process floor constraints, testing rules, and localhost:3000 origin rules. |
| **`generated-documents/`** | [`generated-docs-audit.md`](file:///d:/23082026/agent-reports/generated-docs-audit.md) | Analyzes the 35MB generated data tree, flags the 33.9MB `repo-graph.json` payload risk, and audits clean staging contracts. |
| **`i18n/` & `site/i18n/`** | [`i18n-architecture-audit.md`](file:///d:/23082026/agent-reports/i18n-architecture-audit.md) | Documents the 2-locale policy (`en`, `hi`), parity manifests, and why the root `i18n/request.ts` bridge file is mandatory for `next-intl` monorepo resolution. |
| **`module-reports/`** | [`module-reports-audit.md`](file:///d:/23082026/agent-reports/module-reports-audit.md) | Reviews the 9-part static architecture audit from Sep 3, contrasting static findings with live ground-truth operational evidence on Sep 4. |
| **`specs/`** | [`specs-and-workflows-audit.md`](file:///d:/23082026/agent-reports/specs-and-workflows-audit.md) | Audits the declarative agent recipe engine (8 workflows: `/ship`, `/tdd`, `/e2e`, etc.) and the state machine contract in `specs/state.yaml`. |
| **`tech-docs-generator/`** | [`tech-docs-generator-subsystem-audit.md`](file:///d:/23082026/agent-reports/tech-docs-generator-subsystem-audit.md) | Technical audit of the 55 extraction scripts, Vite React 19 SPA (12 pages), isolated Tailwind styling, and dedicated Vitest Lane 2 testing suite. |
| **`tests/`** | [`tests-subsystem-audit.md`](file:///d:/23082026/agent-reports/tests-subsystem-audit.md) | Complete harness architecture: `unit/`, `integration/`, `e2e/`, multi-config Vitest with `happy-dom` acceleration, and source-mirroring layout rules. |
| **`workers/`** | [`workers-proxy-audit.md`](file:///d:/23082026/agent-reports/workers-proxy-audit.md) | Deep dive into `oando-worker-proxy`: R2 static asset shielding, origin host rewriting, RFC 9116 security disclosures, and apex SEO header restoration. |
| **`root` (Governance)** | [`repository-root-governance-audit.md`](file:///d:/23082026/agent-reports/repository-root-governance-audit.md) | Comprehensive audit of root process floors (`AGENTS.md`), `Failures.md`, `package.json`, pnpm workspace overrides, and Turborepo pipeline caching. |
| **`config/`** | [`config-architecture-and-tech-docs-coverage.md`](file:///d:/23082026/agent-reports/config-architecture-and-tech-docs-coverage.md) | Architecture of `config/{build,quality,observability}` and the 4 reasons why Tech-Docs Generator fails to model or watch it. |

---

## 3. Operational, Quality & Targeted Root-Cause Audits

| Investigation Topic | Audit Report File | Key Findings & Insights |
| :--- | :--- | :--- |
| **Oxlint Strictness** | [`oxlint-suppressions-audit.md`](file:///d:/23082026/agent-reports/oxlint-suppressions-audit.md) | Audits the 4 suppression layers, explains the 7 inline suppressions in `site/hooks/` and `config/build/`, and provides a drop-in strict configuration. |
| **Area-Wise Quality** | [`repository-operational-audit.md`](file:///d:/23082026/agent-reports/repository-operational-audit.md) | Quality report across 8 core domains with Executive Quality Scorecards (Grades A to D). |
| **Scripts Inventory** | [`scripts-inventory-audit.md`](file:///d:/23082026/agent-reports/scripts-inventory-audit.md) | Exhaustive audit of all 264 scripts. Categorizes 94 candidates for removal (35.6% dead code) and actionable blueprints for 170 retained scripts. |
| **Three-Domain Audit** | [`three-domain-technical-audit.md`](file:///d:/23082026/agent-reports/three-domain-technical-audit.md) | Deep dives across Domain 1 (Database/Assets), Domain 2 (CI/Gates), and Domain 3 (Tech-Docs Engine). *Single-agent domain-partitioned execution.* |
| **Test Coverage & Strength** | [`test-coverage-and-strength-audit.md`](file:///d:/23082026/agent-reports/test-coverage-and-strength-audit.md) | Unit-wise breakdown of 937 test files, anti-hollow checks, and critical uncovered surfaces (`site/proxy.ts`, `app/api/**`). |
| **Infrastructure Config** | [`infrastructure-config-audit.md`](file:///d:/23082026/agent-reports/infrastructure-config-audit.md) | Topology audit for Dual Supabase, Cloudflare R2 bucket `oando-asset-cdn`, Vercel `bom1`, and Cloudflare Worker reverse proxy. |
| **MCPs & Skills** | [`mcp-plugins-skills-audit.md`](file:///d:/23082026/agent-reports/mcp-plugins-skills-audit.md) | Evaluates active plugins (42 skills), flags 65% stack bloat (irrelevant GCP/Firebase tools), and blueprints Supabase and Cloudflare MCPs. |
| **Supabase CI Failures** | [`supabase-ci-backup-failure-rca.md`](file:///d:/23082026/agent-reports/supabase-ci-backup-failure-rca.md) | Root-cause analysis of GitHub Actions backup failures: isolated secret name typo (`CLOULD_*` vs `CLOUDFLARE_R2_*`) in `sync-github-backup-secrets.ps1`. |
| **Secrets & Env Policy** | [`secrets-and-env-security-audit.md`](file:///d:/23082026/agent-reports/secrets-and-env-security-audit.md) | Public vs. private key risk analysis, `assertNotServiceRoleKey()` guard, and evaluation of Doppler vs. Dotenv-Vault. |
| **Tech-Docs Staleness** | [`tech-docs-hosting-and-staleness-audit.md`](file:///d:/23082026/agent-reports/tech-docs-hosting-and-staleness-audit.md) | Documents Vercel hosting (`techdocsgenerator.vercel.app`), isolates stale ER diagrams, and explains decoupled Tailwind CSS. |
| **Failures.md Blockers** | [`failures-and-blockers-audit.md`](file:///d:/23082026/agent-reports/failures-and-blockers-audit.md) | Audits all 4 active blockers in `Failures.md`: live evidence verifying `CF-TOKEN-01` and `BROWSER-ORIGIN-02` are resolved and ready for removal. |
| **Test Results Storage** | [`test-results-storage-audit.md`](file:///d:/23082026/agent-reports/test-results-storage-audit.md) | Clarifies the dual-tier storage model: why `results/` is ephemeral ($\le$ 4 hours TTL) and why `tests/INVENTORY.md` is committed to Git for diff tracking. |
| **Test Census** | [`INVENTORY.md`](file:///d:/23082026/agent-reports/INVENTORY.md) | Full generated census of 937 executable test files, specs, fixtures, and snapshots. |
