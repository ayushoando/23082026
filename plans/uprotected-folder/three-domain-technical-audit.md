# Three-Domain Technical Operational Audit Report

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Method:** Live operational verification across database, quality/governance, and technical documentation engines.

---

## Executive Overview

```
Repository Operational Health:
├── Domain 1 (Database, Backups & Assets): HEALTHY
│   ├── Products DB (erpweaiypimorcunaimz): 143 catalog products ✅
│   ├── Admin DB (rxzpznmxbaoxpikowmfc): 4 plans, furniture, descriptors, audit ✅
│   ├── Backup Retention Pruner: 12/12 unit tests passing ✅
│   └── Secret Sync Script: RESOLVED — Canonical CLOUDFLARE_R2_* names active ✅
├── Domain 2 (Quality, Lint & Governance): ACTION REQUIRED (Vitest Lane)
│   ├── Core Gates: PASS (governance baselines, secret scanner, layout, FOCSS 151/151) ✅
│   ├── Static Analysis: PASS — react-hooks active in .oxlintrc.json, zero manual any ✅
│   └── Active Failures: GATE-RECHECK-01 (4 unit tests) & BROWSER-ORIGIN-02 open ⚠️
└── Domain 3 (Tech-Docs Engine): STABLE
    ├── Generation Pipeline: 18 domain models, 16 extractors ✅
    ├── Interactive SPA: 12 dedicated pages under src/pages/ ✅
    └── Diagram Accuracy: Database.tsx reflects live Supabase schemas ✅
```

---

## 1. Domain 1: Database, Backups & Asset Pipelines

### 1.1 Database Health & Live Rows
- **Products DB (`erpweaiypimorcunaimz`):** 143 `catalog_products` rows; categories and product specs intact.
- **Admin DB (`rxzpznmxbaoxpikowmfc`):** 4 active `oando_plans` rows; `furniture_catalog` and `block_descriptors` active.
- **Connection Test:** [`scripts/db_test_connection.ts`](file:///d:/23082026/scripts/db_test_connection.ts) exits 0.

### 1.2 Automated R2 Backup Sync Status
The secret name mismatch in [`scripts/sync-github-backup-secrets.ps1`](file:///d:/23082026/scripts/sync-github-backup-secrets.ps1) is **RESOLVED**:
- `$secretNames` defines canonical `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, and `CLOUDFLARE_S3_URL`.
- Nightly backups via `.github/workflows/supabase-backup-r2.yml` now have matching credential bindings.

---

## 2. Domain 2: Quality, Lint & Governance

### 2.1 Governance Baselines
All 6 metrics in `config/quality/governance-baseline.json` pass with zero tolerance (`D2_npx`, `D3_dead_overrides`, `D6_nonportable_in_gate`, `P2_csp_unsafe_inline`, `P4_migration_no_rollback`, `S2_stray_report`).

### 2.2 Oxlint & Static Analysis
- `"react-hooks"` plugin is loaded; `"react-hooks/exhaustive-deps": "error"` is active.
- Zero manual `any` enforced.
- `scripts/general/audit-eslint-disable.mjs` scans product, hooks, tests, config.

### 2.3 Failures.md Active Blockers
- **`GATE-RECHECK-01`:** 4 failing unit tests (`htmlSitemap.test.ts`, `siteSeoAcceptance.test.ts`, `siteSeoContract.test.ts`, `mastra/providers.test.ts`).
- **`BROWSER-ORIGIN-02`:** Browser walk pending dev server start at `http://localhost:3000`.

---

## 3. Domain 3: Technical Documentation Engine

### 3.1 Pipeline Mechanics
- 55 scripts in `tech-docs-generator/scripts/`.
- 18 domains covered in `model.mjs`.
- Ephemeral output in gitignored `generated-documents/`.

### 3.2 UI Diagram Alignment
- `Database.tsx` displays live active tables (`furniture_catalog`, `block_descriptors`, `catalog_products`, `audit_events`), replacing archived tables.

---

## 4. Operational Commands

```powershell
# Domain 1 Verification
pnpm exec tsx scripts/db_test_connection.ts
pnpm exec vitest run tests/unit/scripts/prune_r2_backups.test.ts

# Domain 2 Verification
pnpm run check:governance
pnpm run lint
node scripts/general/audit-eslint-disable.mjs

# Domain 3 Verification
pnpm run tech-docs:test
```
