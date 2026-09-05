# Actionable Audit Registry & Operational Index

**Audited & Updated:** 2026-09-05  
**Location:** [`plans/uprotected-folder/`](file:///d:/23082026/plans/uprotected-folder/)  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Hierarchy:** `User instruction > live code / fresh command output > AGENTS.md > Agents/ > docs/`

---

## Executive Status & Live Reality

This directory serves as the master repository operational audit and actionable runbook registry. All documents have been re-verified against live codebase state following the `oando-master` skill architecture:

1. **Dual Database Architecture:**
   - **Admin DB (`rxzpznmxbaoxpikowmfc`):** Holds customer plans (`oando_plans`), profiles, handoffs, teams, price books, queries, audit (`audit_events`), furniture catalog (`furniture_catalog`), and block descriptors (`block_descriptors`).
   - **Products DB (`erpweaiypimorcunaimz`):** Holds marketing catalog (`catalog_products`, `catalog_categories`, `catalog_product_specs`), configurator, flags, and themes.
   - **Zero Dual-Write:** Strict separation between operational admin tables and catalog tables.
2. **Mode-Aware Persistence Wrappers:**
   - Production filesystem is read-only. Direct disk writes throw `EROFS`.
   - Runtime writes use persistence wrappers: [`plannerPersistenceMode.ts`](file:///d:/23082026/site/lib/Planner/plannerPersistenceMode.ts) and [`furnitureCatalogMode.ts`](file:///d:/23082026/site/lib/catalog/furnitureCatalogMode.ts) (disk when `DEV_AUTH_BYPASS=1`, Supabase in production).
3. **Strict Fork Isolation:**
   - Studio (`/oostudio`) and Planner (`/ooplanner`) are completely forked trees — zero cross-imports allowed. Verified via `pnpm run scan:boundaries`.
4. **Zero Manual `any`:**
   - Enforced by Oxlint (`typescript/no-explicit-any: error`) and strict TypeScript compiler settings.
5. **Live Fixes Confirmed:**
   - ✅ **Backup Secrets Typo Resolved:** Canonical `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, and `CLOUDFLARE_S3_URL` active in [`scripts/sync-github-backup-secrets.ps1`](file:///d:/23082026/scripts/sync-github-backup-secrets.ps1).
   - ✅ **Oxlint `react-hooks` Plugin Loaded:** `"react-hooks"` declared in plugins array; `"react-hooks/exhaustive-deps": "error"` active in [`.oxlintrc.json`](file:///d:/23082026/.oxlintrc.json).
   - ✅ **Eslint Disable Scanner Expanded:** `site/hooks` and `config/build` included in `audit-eslint-disable.mjs` scan directories.
   - ✅ **Active Failures.md Cleaned:** Stale entries `CF-TOKEN-01` and `GATE-AUTH-02` cleared. Only legitimate blockers `GATE-RECHECK-01` and `BROWSER-ORIGIN-02` remain open.
   - ✅ **Workspace Skills:** 4 active workspace skills present in [`.agents/skills/`](file:///d:/23082026/.agents/skills/): `oando-master`, `recovery-audit`, `safe-change`, and `ui-redesign`.

---

## Master Document Navigation (All 29 Documents)

### 1. Governance, Operations & Architecture
| Document | Focus Area | Live Status / Actionable Summary |
| :--- | :--- | :--- |
| [`failures-and-blockers-audit.md`](./failures-and-blockers-audit.md) | **Blockers** | Authoritative audit of `Failures.md`. Exactly 2 active blockers (`GATE-RECHECK-01`, `BROWSER-ORIGIN-02`). |
| [`repository-root-governance-audit.md`](./repository-root-governance-audit.md) | **Root Governance** | 100 npm scripts, `pnpm-workspace.yaml`, `turbo.json` DAG, zero-tolerance governance baselines. |
| [`repository-operational-audit.md`](./repository-operational-audit.md) | **Operations Scorecard** | Subsystem grades, live DB status, dynamic sitemap reality, and script rationalization. |
| [`three-domain-technical-audit.md`](./three-domain-technical-audit.md) | **Three Domains** | Domain 1 (Database & Assets), Domain 2 (Quality & Governance), Domain 3 (Tech-Docs Engine). |
| [`specs-and-workflows-audit.md`](./specs-and-workflows-audit.md) | **Workflows** | 8 declarative workflow recipes in `specs/workflows/` and state machine alignment. |
| [`mcp-plugins-skills-audit.md`](./mcp-plugins-skills-audit.md) | **MCP & Skills** | Audit of 4 workspace skills, global plugins, and MCP server ecosystem. |

### 2. Infrastructure, Cloud & Security
| Document | Focus Area | Live Status / Actionable Summary |
| :--- | :--- | :--- |
| [`infrastructure-config-audit.md`](./infrastructure-config-audit.md) | **Cloud Infra** | Dual Supabase DBs, Cloudflare Worker proxy, R2 asset storage, Vectorize bindings. |
| [`supabase-ci-backup-failure-rca.md`](./supabase-ci-backup-failure-rca.md) | **Backup CI RCA** | Root cause analysis of past backup failure; verifies canonical `CLOUDFLARE_R2_*` secret fix. |
| [`workers-proxy-audit.md`](./workers-proxy-audit.md) | **Edge Proxy** | `oando-worker-proxy` (`index.js` + `cachePolicy.js`), R2 bypass, Vectorize, and RFC 9116 security. |
| [`secrets-and-env-security-audit.md`](./secrets-and-env-security-audit.md) | **Secrets & Env** | Local `.env.local` security, `assertNotServiceRoleKey()` guard, and `scan_secrets.mjs`. |

### 3. Application, Components & Persistence
| Document | Focus Area | Live Status / Actionable Summary |
| :--- | :--- | :--- |
| [`site-app-audit.md`](./site-app-audit.md) | **Next.js App** | Next.js 16 App Router route inventory, dynamic sitemap generation, and edge fallbacks. |
| [`site-components-audit.md`](./site-components-audit.md) | **Components** | 26 subdirectories, FOCSS CSS compliance, and style-token baseline (201 exceptions). |
| [`site-features-audit.md`](./site-features-audit.md) | **Features** | 7 top-level feature modules (`Planner`, `Studio`, `admin`, `crm`, `ops`, `shared`, `site`). |
| [`site-inventory-audit.md`](./site-inventory-audit.md) | **CAD Descriptors** | 23 2D CAD/Canvas block descriptors; mode-aware persistence (`DEV_AUTH_BYPASS=1` vs DB). |
| [`site-store-audit.md`](./site-store-audit.md) | **State Stores** | Zustand state architecture; strict fork isolation between Studio and Planner stores. |
| [`site-types-audit.md`](./site-types-audit.md) | **Type System** | Dual-DB type generation bridges (`database.types.ts` & `database.admin.types.ts`), WebMCP. |
| [`i18n-architecture-audit.md`](./i18n-architecture-audit.md) | **Internationalization** | Root bridge `i18n/request.ts`, locale routing (`en`/`hi`), marketing parity manifest. |

### 4. Quality, Testing & Linting
| Document | Focus Area | Live Status / Actionable Summary |
| :--- | :--- | :--- |
| [`oxlint-suppressions-audit.md`](./oxlint-suppressions-audit.md) | **Oxlint** | Config audit: `"react-hooks"` plugin loaded, 7 allowed inline suppressions, zero `any`. |
| [`test-coverage-and-strength-audit.md`](./test-coverage-and-strength-audit.md) | **Coverage** | 4 coverage gate configurations; anti-hollow and anti-skip test guardrails. |
| [`tests-subsystem-audit.md`](./tests-subsystem-audit.md) | **Test Harness** | Vitest + happy-dom, Playwright browser test runner, and two-lane test execution. |
| [`test-results-storage-audit.md`](./test-results-storage-audit.md) | **Test Artifacts** | Dual storage: gitignored ephemeral `results/` vs durable tracked inventories (`tests/`). |
| [`INVENTORY.md`](./INVENTORY.md) | **Test Inventory** | Census of 937 test files (777 Vitest, 85 Playwright, 75 support/fixtures). |
| [`CONTENTS.md`](./CONTENTS.md) | **Test Layout** | Directory layout rules and mirroring conventions for unit, integration, and e2e tests. |

### 5. Scripts & Tech-Docs Engine
| Document | Focus Area | Live Status / Actionable Summary |
| :--- | :--- | :--- |
| [`scripts-inventory-audit.md`](./scripts-inventory-audit.md) | **Scripts** | Census of 229 repository scripts; rationalization candidates vs essential ops scripts. |
| [`config-architecture-and-tech-docs-coverage.md`](./config-architecture-and-tech-docs-coverage.md) | **Config Subsystem** | `config/build/`, `config/quality/`, `config/observability/` architecture and governance ratchets. |
| [`tech-docs-generator-subsystem-audit.md`](./tech-docs-generator-subsystem-audit.md) | **Tech-Docs Engine** | 55 generator scripts, 18 domain models, 12 SPA pages, and AST extraction pipeline. |
| [`tech-docs-hosting-and-staleness-audit.md`](./tech-docs-hosting-and-staleness-audit.md) | **Tech-Docs Hosting** | Vercel deployment configuration, build commands, and ER diagram alignment. |
| [`generated-docs-audit.md`](./generated-docs-audit.md) | **Generated Docs** | `generated-documents/` artifact storage, JSON domain datasets, and cache hygiene. |

---

## Active Operational Runbooks

For fast execution of high-priority maintenance workflows, reference the focused runbooks:
- [`blockers-clearance-runbook.md`](./blockers-clearance-runbook.md) — Step-by-step resolution of `GATE-RECHECK-01` and `BROWSER-ORIGIN-02`.
- [`scripts-cleanup-runbook.md`](./scripts-cleanup-runbook.md) — Safe deprecation and retirement protocol for dead scripts.
- [`style-tokens-ratchet-runbook.md`](./style-tokens-ratchet-runbook.md) — Remediation steps for inline CSS token exceptions in admin views.

---

## Key Verification Commands

```powershell
# 1. Repository Layout & Governance Purity
pnpm run check:layout
pnpm run check:docs-all
pnpm run check:governance

# 2. Boundaries & Linting
pnpm run scan:boundaries
pnpm run lint
node scripts/general/audit-eslint-disable.mjs

# 3. Database Connectivity & Secret Scanning
node scripts/general/scan_secrets.mjs
pnpm exec tsx scripts/db_test_connection.ts

# 4. Release Gate (Fast Dev Loop vs Full Release)
pnpm run gate:fast
pnpm run gate
```
