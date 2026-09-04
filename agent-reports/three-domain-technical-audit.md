# Three-Domain Technical Operational Audit Report

**Date:** 2026-09-04  
**Audit Execution:** Single Agent (Sequential domain-partitioned investigation across 3 domains). *Note: No autonomous subagents were spawned; all evidence gathered directly via ground-truth tools.*  
**Target Repository:** `d:\23082026`  
**Operational Scope:** Domain 1 (Database & Assets), Domain 2 (Quality & CI Governance), Domain 3 (Tech-Docs Engine)  
**Working Environment Floor:** Zero invent, ground-truth live evidence, read-only prod FS, strict gate compliance.

---

## Executive Overview

```
Repository Operational Health Assessment:
├── Domain 1 (Database & Assets): HEALTHY WITH RECENT FIX
│   ├── Live Connectivity: OK (143 catalog products, 4 plans)
│   ├── Migration Engine: OK (dual-database targeting, rollback assertion)
│   └── Backup Accumulation: RESOLVED via scripts/prune_r2_backups.ts (5d/30d retention)
├── Domain 2 (Quality & Governance): ACTION REQUIRED ON SITEMAP
│   ├── Core Gates: PASS (Governance ratchet, secret scan, layout purity, FOCSS 151/151)
│   ├── Production Sitemap: CRITICAL DEFECT (10 broken HTTP 404 URLs live on oando.co.in)
│   └── Stale References: /buddy-planner remnants identified in site-ui audit scripts
└── Domain 3 (Tech-Docs Engine): ARCHITECTURAL DISCONNECT ISOLATED
    ├── Pipeline: PASS (Parity validation, Vite build staging)
    ├── Component Graph: ORPHANED (638 nodes / 1,492 edges generated, 0 imports in UI)
    └── UI Diagrams: STALE FAKE DATA (Database.tsx hardcodes archived 20260829 schema)
```

---

# Domain 1: Database, Backups, Data & Asset Pipelines (Root `scripts/`)

### 1. Database Operations & Connectivity

| Script Name | Operational Status | Live Evidence / Verification | Architectural Constraints & Mechanics |
| :--- | :--- | :--- | :--- |
| [`scripts/db_apply_migrations.ts`](file:///d:/23082026/scripts/db_apply_migrations.ts) | **HEALTHY** | Verified with `--dry`. Targets Admin (`rxzpznmxbaoxpikowmfc`) or Products (`erpweaiypimorcunaimz`). | Direct wire connection via `postgres.js`. Verifies `-- rollback:` comments. Tracks state in `_local_migration_history`. Pre-20260524 files safely bypassed. |
| [`scripts/db_test_connection.ts`](file:///d:/23082026/scripts/db_test_connection.ts) | **HEALTHY** | Tested live (Exit 0):<br>• `catalog_products`: **143 rows**<br>• `oando_plans`: **4 rows** | Probes both Supabase projects concurrently via direct SQL ping; validates table presence against expected schema contracts. |
| [`scripts/db_backup_upload_r2.ts`](file:///d:/23082026/scripts/db_backup_upload_r2.ts)<br>[`scripts/repo_backup_upload_r2.ts`](file:///d:/23082026/scripts/repo_backup_upload_r2.ts)<br>[`scripts/catalog_snapshot_upload_r2.ts`](file:///d:/23082026/scripts/catalog_snapshot_upload_r2.ts) | **DEFECT RESOLVED** | Defect: Indefinite accumulation of unpruned backups.<br>**Fix Implemented:** [`scripts/prune_r2_backups.ts`](file:///d:/23082026/scripts/prune_r2_backups.ts) (12/12 unit tests passing). | Enforces 5-day daily cutoff and 30-day weekly retention rules. Exempts canonical pointers (`catalog-latest.json`, `.gitkeep`) from deletion. |
| [`scripts/seed_furniture_catalog.ts`](file:///d:/23082026/scripts/seed_furniture_catalog.ts)<br>[`scripts/seed_planner_managed_catalog.ts`](file:///d:/23082026/scripts/seed_planner_managed_catalog.ts) | **HEALTHY** | Verified idempotent upsert logic. | Respects persistence mode (`FURNITURE_CATALOG_PERSISTENCE`). Writes to disk only under `DEV_AUTH_BYPASS=1`. Pushes to Admin Supabase in prod to avoid `EROFS`. |

### 2. Media, CDN & Storage Pipelines

| Script Name | Operational Status | Safety Floor & Risk Profile | Policy / Execution Rule |
| :--- | :--- | :--- | :--- |
| [`scripts/downloadCdnAssets.ts`](file:///d:/23082026/scripts/downloadCdnAssets.ts)<br>[`scripts/uploadCdnAssets.ts`](file:///d:/23082026/scripts/uploadCdnAssets.ts) | **HEALTHY** | Safe / Non-destructive. Enforces intact S3 credential pairs (`CLOUDFLARE_R2_ACCESS_KEY_ID` + `CLOUDFLARE_R2_SECRET_ACCESS_KEY`). | Never mixes credentials across distinct environment pairs. Supports `--skip-existing` for incremental sync. |
| [`scripts/trim-catalog.mjs`](file:///d:/23082026/scripts/trim-catalog.mjs) | **HIGH RISK / DESTRUCTIVE** | Mutates media disk assets using perceptual hash (pHash). Keeps best $\le$ MAX images per product folder. | **Manual / opt-in only.** Must require explicit `--apply` flag; never execute in automated gates or CI. |
| [`scripts/five-majors-hash-dedup.mjs`](file:///d:/23082026/scripts/five-majors-hash-dedup.mjs) | **CANDIDATE FOR REMOVAL** | Targets legacy recovery path `site/public/assets/others/legacy/recovery/` which does not exist on disk. | Candidate for immediate deletion (List 1); cutover is complete. |

---

# Domain 2: Quality, Governance, Gate & Testing Harnesses (`scripts/general/`, `scripts/AsNeeded/`)

### 1. Live Validation Run Results

| Harness / Guardrail | Script Path | Live Run Result | Measured Scope / Contract |
| :--- | :--- | :--- | :--- |
| **Governance Ratchet** | [`scripts/general/check-governance.mjs`](file:///d:/23082026/scripts/general/check-governance.mjs) | **PASS (Exit 0)** | Zero regressions against `config/quality/governance-baseline.json`. |
| **Secret Scanner** | [`scripts/general/scan_secrets.mjs`](file:///d:/23082026/scripts/general/scan_secrets.mjs) | **PASS (Exit 0)** | Zero exposed credentials or high-entropy tokens across source files. |
| **Repository Layout** | [`scripts/general/check-repo-layout.mjs`](file:///d:/23082026/scripts/general/check-repo-layout.mjs) | **PASS (Exit 0)** | Zero rogue `package-lock.json`, zero unlinked worktrees, clean directory purity. |
| **Worker Origin Probe** | [`scripts/general/check-worker-origin.mjs`](file:///d:/23082026/scripts/general/check-worker-origin.mjs) | **PASS (HTTP 200)** | Probe on `https://oando1408.vercel.app/ooplanner/` returns HTTP 200. |
| **FOCSS Architecture** | [`scripts/AsNeeded/verify-focss.mjs`](file:///d:/23082026/scripts/AsNeeded/verify-focss.mjs) | **PASS (151/151 files)** | 0 raw hex color literals, 0 circular CSS imports, clean token layer cascade. |

### 2. Concrete Defect Discovered: Live Sitemap Health

Executing [`scripts/general/audit-sitemap-health.mjs`](file:///d:/23082026/scripts/general/audit-sitemap-health.mjs) against `https://oando.co.in/sitemap.xml` revealed **10 broken URLs (HTTP 404)** being served to search engine crawlers:

| Broken URL Served in Sitemap | HTTP Status | Code Origin | Remediation Action |
| :--- | :--- | :--- | :--- |
| `https://oando.co.in/products/storages/accessories/` | **404** | `site/app/sitemap.ts` | Remove from fallback category list or redirect to `/products/storages/`. |
| `https://oando.co.in/products/soft-seating/allure/` | **404** | `site/app/sitemap.ts` | Prune discontinued `allure` slug from `productStaticParams.ts`. |
| `https://oando.co.in/products/seating/caneva/` | **404** | `site/app/sitemap.ts` | Prune `caneva` slug from fallback product map. |
| `https://oando.co.in/products/seating/copse/` | **404** | `site/app/sitemap.ts` | Prune `copse` slug from fallback product map. |
| `https://oando.co.in/products/seating/crotch/` | **404** | `site/app/sitemap.ts` | Prune `crotch` slug from fallback product map. |
| `https://oando.co.in/products/seating/ember/` | **404** | `site/app/sitemap.ts` | Prune `ember` slug from fallback product map. |
| `https://oando.co.in/products/seating/flare/` | **404** | `site/app/sitemap.ts` | Prune `flare` slug from fallback product map. |
| `https://oando.co.in/products/seating/flex/` | **404** | `site/app/sitemap.ts` | Prune `flex` slug from fallback product map. |
| `https://oando.co.in/products/seating/flip/` | **404** | `site/app/sitemap.ts` | Prune `flip` slug from fallback product map. |
| `https://oando.co.in/products/soft-seating/mellow/` | **404** | `site/app/sitemap.ts` | Prune `mellow` slug from fallback product map. |

### 3. Stale Route References Discovered

Executing [`scripts/AsNeeded/_audit-stale-scripts.mjs`](file:///d:/23082026/scripts/AsNeeded/_audit-stale-scripts.mjs) confirmed:
- **Clean Package Removal:** All retired dependencies (`tldraw`, `konva`, `nova-act`, `three`) have zero imports in product code.
- **Defect Isolated:** Stale references to `/buddy-planner` (retired on August 7, 2026) still exist in:
  - [`scripts/site-ui-content-links-audit/discovery.ts:619`](file:///d:/23082026/scripts/site-ui-content-links-audit/discovery.ts#L619)
  - [`scripts/site-ui-content-links-audit/wave1-links.ts:181`](file:///d:/23082026/scripts/site-ui-content-links-audit/wave1-links.ts#L181)

---

# Domain 3: Tech-Docs Generator Pipeline Scripts (`tech-docs-generator/scripts/`)

### 1. Generator Pipeline Execution

| Step | Script | Execution Reality | Contract & Parity Verification |
| :--- | :--- | :--- | :--- |
| **Clean Output** | `filesystem.mjs` | Deletes `generated-documents/` and staging roots. | Ensures zero stale artifacts survive across generation cycles. |
| **Model Extraction** | `model.mjs` | Extracts 18 domain models into `generated-documents/data/*.json`. | Validated byte-for-byte against `PARITY_DATA_FILES`. |
| **SPA Build** | `generate-all.mjs` | Executes `vite build` into `generated-documents/site/`. | Passes clean; staged for standalone Next.js deployment. |

### 2. Architectural Disconnect: Root Cause of "It Doesn't Even Generate Graphs"

#### A. The Graph Generator is an Orphan
- **The Execution:** [`tech-docs-generator/scripts/generate-page-component-graph.mjs`](file:///d:/23082026/tech-docs-generator/scripts/generate-page-component-graph.mjs) processes **63 routes, 638 nodes, and 1,492 edges**, successfully generating:
  - `generated-documents/repository-graph/page-components/page-component-graph.mmd`
  - `generated-documents/repository-graph/page-components/summary.txt`
- **The Disconnect:** In [`tech-docs-generator/src/`](file:///d:/23082026/tech-docs-generator/src/), there are **0 imports** of these files. [`tech-docs-generator/src/App.tsx`](file:///d:/23082026/tech-docs-generator/src/App.tsx) has no route for repository graphs. The generated output is never rendered in the SPA.

#### B. The Mermaid Diagrams are Hardcoded Fake Data
- [`tech-docs-generator/src/pages/Database.tsx#L13`](file:///d:/23082026/tech-docs-generator/src/pages/Database.tsx#L13) hardcodes an ancient ER diagram featuring **`users`**, **`plans`**, **`leads`**, and **`activity`** (tables archived weeks ago).
- [`tech-docs-generator/src/pages/Architecture.tsx#L12`](file:///d:/23082026/tech-docs-generator/src/pages/Architecture.tsx#L12) hardcodes static strings referencing defunct disk SVG authorities.
- **Git Commit Evidence:** These UI files have not been updated since **August 29, 2026** (`commit 6a2ffae`).

| Diagram in `Database.tsx` | Claimed Table | Actual Live Production Table | Disconnect Type |
| :--- | :--- | :--- | :--- |
| `schemaDiagram` | `users` | *(Supabase Auth internal)* | Table does not exist in public schema |
| `schemaDiagram` | `plans` | `oando_plans` (Admin DB) | Outdated table name |
| `schemaDiagram` | `leads` | *(None)* | Table deleted weeks ago |
| `schemaDiagram` | `plan_items` | `oando_plans.data` (JSONB) | Relational table replaced by JSONB state |
| `schemaDiagram` | `activity` | `audit_events` (Admin DB) | Outdated table name |
| `schemaDiagram` | *(Missing)* | `furniture_catalog` (Admin DB) | Live table absent from diagram |
| `schemaDiagram` | *(Missing)* | `block_descriptors` (Admin DB) | Live table absent from diagram |
| `schemaDiagram` | *(Missing)* | `planner_managed_products` (Products DB) | Live table absent from diagram |

---

# Actionable Remediation Roadmap

| Step | Target Subsystem | Intended Files | Action Item | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Database / CI** | [`scripts/sync-github-backup-secrets.ps1`](file:///d:/23082026/scripts/sync-github-backup-secrets.ps1) | Correct secret names to canonical `CLOUDFLARE_R2_*` so CI backups succeed. | **P0** |
| **2** | **Quality / SEO** | [`site/lib/catalog/productStaticParams.ts`](file:///d:/23082026/site/lib/catalog/productStaticParams.ts) | Prune the 10 dead 404 product slugs from fallback catalog data to heal production sitemap. | **P0** |
| **3** | **Script Rationalization** | `scripts/` (94 files identified in List 1) | Purge the 94 obsolete/recovery scripts across `operations-review`, `site-ui-content-links-audit`, and root. | **P1** |
| **4** | **Tech-Docs Wiring** | [`tech-docs-generator/src/App.tsx`](file:///d:/23082026/tech-docs-generator/src/App.tsx)<br>[`tech-docs-generator/src/pages/Database.tsx`](file:///d:/23082026/tech-docs-generator/src/pages/Database.tsx) | Wire `/repository-graph` to render `page-component-graph.mmd`; replace hardcoded ER diagram with live database schema. | **P1** |
