# Three-Domain Technical Operational Audit Report

**Audited:** 2026-09-04 (live verification pass)  
**Method:** Key claims re-checked against live files and command output from this and prior sessions.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| `catalog_products`: 143 rows | Claimed | ✅ **Confirmed** — from `db_test_connection.ts` run this session |
| `oando_plans`: 4 rows | Claimed | ✅ **Confirmed** |
| Model extraction: "18 domain models" | Claimed | ✅ **CONFIRMED** — `COVERAGE_REQUIRED_DOMAINS` has exactly 18: `workspace`, `next-app`, `api`, `route-contracts`, `deployment`, `github-actions`, `dependabot`, `environment`, `database`, `supabase`, `r2-assets`, `planner`, `admin`, `ai-openrouter`, `testing`, `css-theme`, `i18n`, `docs-health` |
| Sitemap: 10 broken 404 URLs | Claimed, with specific slugs attributed to `productStaticParams.ts` / `sitemap.ts` | ⚠️ **SOURCE ATTRIBUTION WRONG** — those slugs are **not found** in `productStaticParams.ts` or `site/app/sitemap.ts` in live codebase. The sitemap likely generates dynamically from the DB catalog; the 404s may originate from DB rows with stale slugs, not hardcoded static lists. |
| `five-majors-hash-dedup.mjs` targets legacy path that doesn't exist | Claimed | ✅ **Confirmed** — consistent with script audit findings (file still present) |
| Worker unit test: "only `originConfig.test.ts`" | Claimed | ❌ **WRONG** — two test files: `cachePolicy.test.ts` + `originConfig.test.ts` |
| `proxy.ts` — "0% gate coverage" | Implied as untested | ⚠️ **REVISED** — `proxy.test.ts` and `proxy.live-smoke.test.ts` exist. Proxy IS tested. Not in strict gate threshold, but not "0 tests". |
| Script purge target: "94 obsolete scripts" | Claimed | ⚠️ **REVISED** — prior count (264 total scripts) was wrong; live count is 229. The candidate count for deletion may be closer to 36–50, not 94. |
| P0: "Sitemap — prune 10 dead slugs from `productStaticParams.ts`" | Claimed remediation | ❌ **WRONG TARGET** — those slugs are not in `productStaticParams.ts`. Source of 404s requires fresh `audit:sitemap-health` run against live URL. |

---

## Executive Overview (Updated)

```
Repository Operational Health (2026-09-04):
├── Domain 1 (Database & Assets): HEALTHY — backup retention resolved, secret sync typo OPEN
│   ├── Live: 143 catalog products, 4 plans ✅
│   ├── Backup pruner: 12/12 tests passing ✅
│   └── DEFECT OPEN: sync-github-backup-secrets.ps1 typo → nightly R2 backups failing ❌
├── Domain 2 (Quality & Governance): ACTION REQUIRED
│   ├── Core gates: PASS (governance, secrets, layout, FOCSS 151/151) ✅
│   ├── Sitemap 404s: UNRESOLVED — source of 404s NOT confirmed in static code ⚠️
│   └── react-hooks plugin: MISSING from .oxlintrc.json → exhaustive-deps may not run ❌
└── Domain 3 (Tech-Docs Engine): ARCHITECTURAL DISCONNECT (unchanged)
    ├── Pipeline: PASS ✅
    ├── Component graph: ORPHANED (638 nodes / 1,492 edges, no UI route) ❌
    └── UI diagrams: STALE FAKE DATA (Database.tsx archived schema) ❌
```

---

# Domain 1: Database, Backups & Asset Pipelines

### 1.1 Live DB State (Confirmed)

| Script | Status | Live Evidence |
| :--- | :--- | :--- |
| `scripts/db_apply_migrations.ts` | ✅ HEALTHY | Dry-run verified; rollback assertion active |
| `scripts/db_test_connection.ts` | ✅ HEALTHY | 143 `catalog_products` rows, 4 `oando_plans` rows |
| `scripts/prune_r2_backups.ts` | ✅ HEALTHY | 12/12 unit tests passing; 5d daily / 30d weekly retention |
| `scripts/seed_furniture_catalog.ts` | ✅ HEALTHY | Idempotent; respects persistence mode |
| `scripts/db_backup_upload_r2.ts` | ❌ CI FAILING | Indirectly — backup uploads succeed, but CI credentials are wrong (secret name typo in sync script) |

### 1.2 P0 Open: GitHub Actions Secret Name Typo

Confirmed in `scripts/sync-github-backup-secrets.ps1`:
- `CLOULD_ACCESS_KEY_ID` → should be `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOULDFLARE_S3_SECRET_ACCESS_KEY` → should be `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOULDFLARE_S3_URL` → should be `CLOUDFLARE_S3_URL` or `CLOUDFLARE_R2_*`

---

# Domain 2: Quality, Governance & Gate Harnesses

### 2.1 Gate Run Results (Confirmed Passing)

| Harness | Result |
| :--- | :--- |
| `check-governance.mjs` | ✅ PASS (Exit 0) |
| `scan_secrets.mjs` | ✅ PASS (Exit 0) |
| `check-repo-layout.mjs` | ✅ PASS (Exit 0) |
| `check-worker-origin.mjs` | ✅ PASS (HTTP 200) |
| `verify-focss.mjs` | ✅ PASS (151/151 files) |

### 2.2 NEW FINDING: react-hooks Plugin Missing

`.oxlintrc.json` plugins array does not include `"react-hooks"`. The `react-hooks/exhaustive-deps` rule is declared but the plugin providing it is not loaded. 5 inline `eslint-disable` suppressions in `site/hooks/` may be suppressing a rule that isn't running.

### 2.3 REVISED: Sitemap 404 Source

The prior report attributed the 10 broken slugs to static code in `productStaticParams.ts` and `sitemap.ts`. **Live grep found none of those slugs in those files.** Options:
1. The slugs were already removed from static code (good)
2. Sitemap generates dynamically from DB catalog and the 404 slugs come from DB rows

**Required:** Re-run `pnpm run audit:sitemap-health` against live `https://oando.co.in/sitemap.xml` before assuming the 404s are resolved.

---

# Domain 3: Tech-Docs Generator Pipeline

### 3.1 Pipeline Status (Confirmed)

| Step | Script | Status |
| :--- | :--- | :--- |
| Clean output | `filesystem.mjs` | ✅ Wipes `generated-documents/` before each run |
| Model extraction | `model.mjs` | ✅ Extracts **18** domains (confirmed: includes `css-theme`, `i18n`, `docs-health`) |
| SPA Build | `generate-all.mjs` | ✅ Vite build into `generated-documents/site/` |

### 3.2 Architectural Disconnects (Confirmed)

**A. Graph Orphan:**
`generate-page-component-graph.mjs` processes 63 routes, 638 nodes, 1,492 edges → `generated-documents/repository-graph/page-components/page-component-graph.mmd`. `App.tsx` has 0 routes importing this. Output is generated and discarded.

**B. Stale Mermaid Diagrams:**

| Diagram in `Database.tsx` | Claimed Table | Actual Live Table | Disconnect |
| :--- | :--- | :--- | :--- |
| `schemaDiagram` | `users` | (Supabase Auth internal) | Not in public schema |
| `schemaDiagram` | `plans` | `oando_plans` | Outdated name |
| `schemaDiagram` | `leads` | (None) | Deleted |
| `schemaDiagram` | `plan_items` | `oando_plans.data` JSONB | Relational → JSONB |
| `schemaDiagram` | `activity` | `audit_events` | Outdated name |
| Missing | — | `furniture_catalog` | Not in diagram |
| Missing | — | `block_descriptors` | Not in diagram |
| Missing | — | `planner_managed_products` | Not in diagram |

---

# Actionable Remediation Roadmap (Updated)

| Step | Target | Action | Priority | Status |
| :--- | :--- | :--- | :---: | :--- |
| **1** | `scripts/sync-github-backup-secrets.ps1` | Fix 3 secret name typos to canonical `CLOUDFLARE_R2_*` | **P0** | ❌ Open |
| **2** | Live sitemap | Re-run `audit:sitemap-health` to confirm whether 10 404s still exist | **P0** | ❌ Not re-run |
| **3** | `.oxlintrc.json` | Add `"react-hooks"` to plugins array | **P1** | ❌ Open |
| **4** | `scripts/` | Purge dead scripts — estimated 35–50 candidates (not 94) | **P1** | ❌ Open |
| **5** | `tech-docs-generator/src/App.tsx` | Wire `/repository-graph` route | **P1** | ❌ Open |
| **6** | `tech-docs-generator/src/pages/Database.tsx` | Replace hardcoded ER diagram with live schema | **P1** | ❌ Open |
