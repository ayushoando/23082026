# Audit Synthesis & Platform Operations Master Index

**Audited & Published:** 2026-09-05  
**Directory:** `docs/audit 05092026/`  
**Governing Authority:** [`AGENTS.md`](../../AGENTS.md) and [`oando-master`](../../.agents/skills/oando-master/SKILL.md)  
**Authority Hierarchy:** `User instruction > live code / fresh command output > AGENTS.md > Agents/ > docs/`

---

## Overview & Purpose

This directory serves as the unified, authoritative engineering synthesis of the repository-wide audit conducted across September 4–5, 2026. It condenses findings from 29 domain-specific deep dive audits (`agent-reports/new/`) and 2 root operational baselines (`agent-reports/`) into a definitive architectural reference and three actionable, verified operational runbooks.

All documented specifications have been forensically verified against live repository files, active configuration manifests, and passing test suites.

---

## Master Document Navigation

| Document | Category | Primary Focus & Scope |
| :--- | :---: | :--- |
| **[`platform-subsystems-reference.md`](./platform-subsystems-reference.md)** | **Architectural Reference** | The definitive 8-domain architectural blueprint covering governance, App Router, Studio/Planner isolation, dual-database partitioning, mode-aware persistence (`EROFS` prevention), FOCSS token engine, two-lane Vitest harness, and Cloudflare Worker proxy. |
| **[`blockers-clearance-runbook.md`](./blockers-clearance-runbook.md)** | **Active Runbook** | Resolution procedures for active P1 blockers in [`Failures.md`](../../Failures.md) (`GATE-RECHECK-01` test lane clearance and `BROWSER-ORIGIN-02` local Playwright walk on `http://localhost:3000`). |
| **[`scripts-cleanup-runbook.md`](./scripts-cleanup-runbook.md)** | **Active Runbook** | Safe phased retirement protocol for ~59 dead or obsolete scripts across unintegrated frameworks, legacy cutover tools, and throwaway Python scripts under rule E4. |
| **[`style-tokens-ratchet-runbook.md`](./style-tokens-ratchet-runbook.md)** | **Active Runbook** | Phased normalization workflow for the 200 legacy inline style exceptions recorded in [`config/quality/style-token-baseline.json`](../../config/quality/style-token-baseline.json), targeting high-debt CRM and admin views. |
| **[`platform-health-audit.md`](./platform-health-audit.md)** | **Health Summary** | High-level executive scorecard across 8 areas, live database inventories, and Edge proxy topology. |

---

## 8-Domain Architectural Cross-Reference Matrix

The repository architecture is partitioned into 8 core domains. The table below maps each domain to its live filesystem location, verified architectural contracts, and operational guides:

| Domain | Subsystem Name | Live Repository Paths | Key Architectural Invariants & Verified Truths | Primary Guide |
| :---: | :--- | :--- | :--- | :--- |
| **D1** | **Root Governance, Scripts & Tooling** | `AGENTS.md`, `package.json`, `config/quality/governance-baseline.json`, `scripts/run-ops.mjs` | Authority hierarchy; 100 package scripts; 6 zero-tolerance governance baselines (`D2_npx`, `D3_dead_overrides`, `D6_nonportable_in_gate`, `P2_csp_unsafe_inline`, `P4_migration_no_rollback`, `S2_stray_report`); 229 scripts in `scripts/`. | [`platform-subsystems-reference.md §1`](./platform-subsystems-reference.md#domain-1-root-governance-scripts--tooling), [`scripts-cleanup-runbook.md`](./scripts-cleanup-runbook.md) |
| **D2** | **Site App, Routes & Runtime Surfaces** | `site/app/`, `site/components/`, `site/features/`, `site/store/`, `site/types/`, `i18n/request.ts` | Next.js 16 App Router; load-bearing root `i18n/request.ts` bridge; 861 i18n keys with en/hi parity; dynamic sitemap fetching from live DB (sitemap 404s caused by stale DB rows, not static code); 4 Zustand stores; WebMCP type bridge. | [`platform-subsystems-reference.md §2`](./platform-subsystems-reference.md#domain-2-site-app-routes--runtime-surfaces) |
| **D3** | **Studio Subsystem (`/oostudio`)** | `site/app/oostudio/`, `site/lib/Studio/studioPalette.ts`, `site/focss/studio/` | Client-side 2D/3D customizer; metric scale ratio **0.2 px/mm** (`SCALE_PX_PER_MM = 0.2`); Fabric.js 2D pattern/cut tool + Three.js glTF preview; allowlisted canvas hook suppression in `useStudioFabric.ts`. | [`platform-subsystems-reference.md §3`](./platform-subsystems-reference.md#domain-3-studio-subsystem-oostudio) |
| **D4** | **Planner Subsystem (`/ooplanner`) & Isolation** | `site/app/ooplanner/`, `site/lib/Planner/plannerGeometryContract.ts`, `scripts/scan-boundaries.mjs` | Client-side 2D/3D architectural floor planner; architectural scale ratio **0.05 px/mm** (`PLANNER_SCALE_PX_PER_MM = 0.05`); legacy 0.2 scale adaptation; strict fork boundary isolation with 0 cross-imports (`pnpm run scan:boundaries`). | [`platform-subsystems-reference.md §4`](./platform-subsystems-reference.md#domain-4-planner-subsystem-ooplanner--studio--planner-isolation) |
| **D5** | **Data Architecture & Mode-Aware Persistence** | `site/platform/supabase/`, `site/lib/Planner/plannerPersistenceMode.ts`, `site/lib/catalog/furnitureCatalogMode.ts` | Dual Supabase DB architecture (Admin `rxzpznmxbaoxpikowmfc` vs Products `erpweaiypimorcunaimz`); zero dual-write; read-only production filesystem (`EROFS` prevention); disk persistence permitted only under `DEV_AUTH_BYPASS=1`. | [`platform-subsystems-reference.md §5`](./platform-subsystems-reference.md#domain-5-data-architecture-databases--mode-aware-persistence) |
| **D6** | **Styling & FOCSS Design System Tokens** | `site/focss/`, `config/quality/style-token-baseline.json`, `scripts/general/lint-ui-contract.mjs` | 151 modular CSS files (`@focss/*`); 0 raw hex literals; strict UI anti-drift rules; 200 inline style exceptions ratcheted down across 61 files (CRM views hold >25% of debt); 100% Phosphor icon compliance (`PhIcon`); mobile chrome coordination. | [`platform-subsystems-reference.md §6`](./platform-subsystems-reference.md#domain-6-styling--focss-design-system-tokens), [`style-tokens-ratchet-runbook.md`](./style-tokens-ratchet-runbook.md) |
| **D7** | **Testing & Quality Infrastructure** | `tests/`, `tests/vitest.*.ts`, `tests/setup.ts`, `tests/manifests/coverage-exceptions.json`, `tests/INVENTORY.md` | Two-lane Vitest pipeline (Lane 1 App + Lane 2 Tech-Docs); happy-dom DOM emulation with React 19 polyfills; 100% lines/functions coverage floor with zero exceptions; durable 940 test census in `tests/INVENTORY.md`; ephemeral gitignored test results. | [`platform-subsystems-reference.md §7`](./platform-subsystems-reference.md#domain-7-testing--quality-infrastructure), [`blockers-clearance-runbook.md`](./blockers-clearance-runbook.md) |
| **D8** | **Cloudflare Worker Proxy & Infrastructure** | `workers/oando-worker-proxy/`, `.github/workflows/supabase-backup-r2.yml`, `scripts/sync-github-backup-secrets.ps1` | Edge proxy in `workers/` managing protocol guards, 308 apex canonicalization, RFC 9116 security disclosure, R2 asset offloading with fallback logo serving, and dynamic caching; automated nightly Supabase R2 backup with retention pruner. | [`platform-subsystems-reference.md §8`](./platform-subsystems-reference.md#domain-8-cloudflare-worker-proxy--edge-infrastructure) |

---

## Audit Methodology & Key Forensic Verifications

The multi-agent audit utilized forensic, evidence-first methodologies to eliminate historical assumptions and determine code ground truth:

1. **Sitemap 404 Root Cause Correction:**
   - *Legacy Assumption:* The sitemap 404 errors were caused by hardcoded static arrays in `productStaticParams.ts`.
   - *Forensic Finding:* `site/app/sitemap.ts` dynamically fetches slugs from the live Products database. The 404 URLs correspond to deleted or archived product rows remaining in `catalog_products`. The fix is database record cleanup via `pnpm run audit:sitemap-health`, requiring zero code modifications.

2. **Supabase CI Backup Secrets Verification:**
   - *Legacy Assumption:* The GitHub Actions backup pipeline was broken due to typos in `scripts/sync-github-backup-secrets.ps1`.
   - *Forensic Finding:* The script has already been updated with canonical `CLOUDFLARE_R2_*` variable names. The remaining operational task is executing the sync script to propagate these variables to GitHub repository secrets.

3. **Oxlint Configuration & Strictness Resolution:**
   - *Legacy Assumption:* Oxlint was missing `"react-hooks"` and had `exhaustive-deps` downgraded to `"warn"`.
   - *Forensic Finding:* `.oxlintrc.json` already includes `"react-hooks"` in `plugins` and sets `"react-hooks/exhaustive-deps": "error"`. `audit-eslint-disable.mjs` scans all active code trees with exactly 5 allowlisted lifecycle exceptions.

4. **Script Census Realignment:**
   - *Legacy Assumption:* The repository contained 264 scripts with 94 removal candidates.
   - *Forensic Finding:* Live disk inspection confirmed exactly 229 scripts in `scripts/`, with ~59 candidates for phased retirement.

---

## Master Operational Verification Suite

Run these commands to verify repository health and ensure zero governance drift:

```powershell
# 1. Repository Layout & Governance Purity
pnpm run check:layout
pnpm run check:docs-all
pnpm run check:governance

# 2. Fork Isolation & Linting
pnpm run scan:boundaries
pnpm run lint
node scripts/general/audit-eslint-disable.mjs

# 3. Design System & Style Tokens Ratchet
pnpm run verify:focss
pnpm run lint:ui:strict
pnpm run check:style-tokens

# 4. Database Connectivity & Secret Scanning
node scripts/general/scan_secrets.mjs
pnpm exec tsx scripts/db_test_connection.ts

# 5. Testing & Documentation Sync
pnpm run test
pnpm run docs:check

# 6. Fast Development Loop
pnpm run gate:fast
```
