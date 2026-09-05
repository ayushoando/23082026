# Operational Runbook: Script Inventory Rationalization & Retirement

**Document Version:** 2.0.0  
**Status:** Verified Operational Runbook  
**Last Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](../../AGENTS.md) §1, §2, §7, Rule E4, and [`oando-master`](../../.agents/skills/oando-master/SKILL.md)  
**Target Directory:** [`scripts/`](../../scripts/)  
**Execution Context:** Monorepo Root (`d:\23082026`)

---

## 1. Executive Summary & Governance Authority

The `scripts/` directory currently contains **229 total files** (calibrated from prior preliminary estimates of 264). Over successive recovery phases (Drive E: and D: data recoveries, raster asset cutovers, and link crawl campaigns), numerous one-off audit frameworks, throwaway scripts, and obsolete recovery tools accumulated in the repository.

### Governance Safety Floor (Rule E4 & `AGENTS.md` §1):
> **“Never clean, reset, restore, delete, or apply report recommendations unless the user specifically names the targets.”**
> **“Make the smallest sound change and preserve unrelated work.”**

This runbook establishes a strict, non-destructive retirement protocol. Scripts must never be deleted indiscriminately; they are categorized into explicit candidate batches, subjected to 4 preflight dependency checks, and removed via tracked git commands followed by governance verification (`pnpm run check:governance`).

---

## 2. Total Script Inventory & Directory Distribution

Live inspection of `scripts/` reveals the following exact distribution of **234 files** (229 executable scripts + 5 test fixture files in `generate-svg/_fixtures/`):

| Subdirectory | File Count | Primary Role |
| :--- | :---: | :--- |
| `scripts/` (Root) | 111 | Core operational, database, seeding, asset, and test runners |
| `scripts/general/` | 56 | Repository gates, governance ratchets, layout checks, doc tools |
| `scripts/site-ui-content-links-audit/` | 26 | **Abandoned** August 2026 multi-wave link crawl audit suite |
| `scripts/operations-review/` | 14 | **Abandoned** operational review framework (9 root + 5 in `extractors/`) |
| `scripts/lib/` | 11 | Shared utilities (`resolvePgDump`, `cdnAssetResolver`, `scriptEnv`) |
| `scripts/AsNeeded/` | 8 | On-demand verifiers (`verify-focss.mjs`, `audit-seo-indexability.mjs`) |
| `scripts/generate-svg/` | 7 | 2 pipeline scripts (`pipelineCore.ts`, `svgo.config.cjs`) + 5 JSON fixture files in `_fixtures/` |
| `scripts/codemods/` | 1 | Dialect codemod (`homepage-dialect.mjs`) |
| **Total Live Files** | **234** | **Full Monorepo Script Footprint (including 5 fixtures)** |

---

## 3. Comprehensive Catalog of Dead & Stale Scripts to Retire (~59 Files)

The forensic audit identified exactly **59 candidates for safe retirement** across 4 primary clusters and 1 secondary cluster:

### Cluster 1: Abandoned Subsystem `scripts/operations-review/` (14 Files)
*Rationale:* An ad-hoc architectural audit framework written in mid-August 2026. Documented directly in `entryPoint.ts:42` as never wired into `package.json` or CI. Completely unreferenced by any live runtime code.

#### Root Files (9 Files):
1. `scripts/operations-review/entryPoint.ts` (4,738 bytes) — Unused CLI entrypoint.
2. `scripts/operations-review/index.ts` (465 bytes) — Unused barrel re-export.
3. `scripts/operations-review/alignmentComparator.ts` (19,805 bytes) — Redundant schema comparator.
4. `scripts/operations-review/authorizationGuard.ts` (3,387 bytes) — Redundant role check stub.
5. `scripts/operations-review/models.ts` (5,419 bytes) — Obsolete operational review interfaces.
6. `scripts/operations-review/recoveryPlanner.ts` (33,058 bytes) — Legacy recovery planner.
7. `scripts/operations-review/renderer.ts` (23,273 bytes) — Unused markdown table renderer.
8. `scripts/operations-review/riskPrioritizer.ts` (11,839 bytes) — Risk categorization heuristic.
9. `scripts/operations-review/sourceAdapter.ts` (4,231 bytes) — Static filesystem adapter.

#### Extractor Files in `scripts/operations-review/extractors/` (5 Files):
10. `scripts/operations-review/extractors/databases.ts` (27,942 bytes) — Stale DB inspector.
11. `scripts/operations-review/extractors/monitoring.ts` (44,102 bytes) — Sentry/Grafana collector.
12. `scripts/operations-review/extractors/r2.ts` (14,964 bytes) — R2 bucket analyzer.
13. `scripts/operations-review/extractors/vercel.ts` (13,724 bytes) — Vercel project inspector.
14. `scripts/operations-review/extractors/worker.ts` (9,586 bytes) — Cloudflare worker inspector.

---

### Cluster 2: Abandoned Subsystem `scripts/site-ui-content-links-audit/` (26 Files)
*Rationale:* A 26-file bespoke multi-wave crawler developed for an August 31, 2026 link verification campaign. It references deleted routes (such as `/buddy-planner`), is never executed in GitHub Actions, and has been fully superseded by `scripts/general/audit-sitemap-health.mjs` and `scripts/general/check-root-markdown-links.mjs`.

1. `scripts/site-ui-content-links-audit/adapters.ts` (36,085 bytes)
2. `scripts/site-ui-content-links-audit/artifactPaths.ts` (5,603 bytes)
3. `scripts/site-ui-content-links-audit/cli.ts` (14,651 bytes)
4. `scripts/site-ui-content-links-audit/config.ts` (8,656 bytes)
5. `scripts/site-ui-content-links-audit/discovery.ts` (52,160 bytes)
6. `scripts/site-ui-content-links-audit/index.ts` (527 bytes)
7. `scripts/site-ui-content-links-audit/manifests.ts` (75,355 bytes)
8. `scripts/site-ui-content-links-audit/profiles.ts` (41,528 bytes)
9. `scripts/site-ui-content-links-audit/run-config.json` (3,773 bytes)
10. `scripts/site-ui-content-links-audit/runIdentity.ts` (2,657 bytes)
11. `scripts/site-ui-content-links-audit/schemas.ts` (62,932 bytes)
12. `scripts/site-ui-content-links-audit/wave.ts` (11,106 bytes)
13. `scripts/site-ui-content-links-audit/wave0.ts` (20,994 bytes)
14. `scripts/site-ui-content-links-audit/wave1-foundations.ts` (57,440 bytes)
15. `scripts/site-ui-content-links-audit/wave1-journeys.ts` (30,196 bytes)
16. `scripts/site-ui-content-links-audit/wave1-links.ts` (34,654 bytes)
17. `scripts/site-ui-content-links-audit/wave1-navigation.ts` (16,615 bytes)
18. `scripts/site-ui-content-links-audit/wave1-states.ts` (18,567 bytes)
19. `scripts/site-ui-content-links-audit/wave1-static-batch.ts` (23,487 bytes)
20. `scripts/site-ui-content-links-audit/wave1.ts` (13,683 bytes)
21. `scripts/site-ui-content-links-audit/wave2-surfaces.ts` (96,097 bytes)
22. `scripts/site-ui-content-links-audit/wave3-partitions.ts` (21,407 bytes)
23. `scripts/site-ui-content-links-audit/wave3-records.ts` (24,292 bytes)
24. `scripts/site-ui-content-links-audit/wave5-completion-proof.ts` (21,252 bytes)
25. `scripts/site-ui-content-links-audit/wave5-handoffs.ts` (29,757 bytes)
26. `scripts/site-ui-content-links-audit/wave5-reconcile.ts` (31,041 bytes)

---

### Cluster 3: Dead Recovery, Cutover & Destructive Scripts (13 Files)
*Rationale:* Scripts written to migrate asset formats or recover lost files during historical development milestones. The asset cutovers are complete (raster images live in Cloudflare R2), and disk targets no longer exist.

1. `scripts/merge-recovery-into-majors.mjs` (43,837 bytes, 1,376 lines) — Hardcoded to target non-existent `site/public/assets/others/legacy/recovery/`.
2. `scripts/five-majors-hash-dedup.mjs` (31,079 bytes, 945 lines) — Targets obsolete recovery folders.
3. `scripts/lib/recoveryClassify.mjs` (26,461 bytes) — Helper module only imported by `merge-recovery-into-majors.mjs` and `five-majors-hash-dedup.mjs`.
4. `scripts/planner-lift-project-trees.mjs` (19,006 bytes) — Obsolete tree reorganizer for legacy disk structures.
5. `scripts/apply-db-image-path-rewrite.mjs` (6,383 bytes) — Raw SQL mutator for completed asset migration.
6. `scripts/reverse-asset-paths.mjs` (5,163 bytes) — Rollback script for completed asset migration.
7. `scripts/fix-asset-paths.mjs` (4,882 bytes) — Relies on deleted cutover artifacts.
8. `scripts/lib/assetPathMapTools.mjs` (13,082 bytes) — Helper module only imported by path rewrite scripts.
9. `scripts/migrate-svg-catalog-to-png.mjs` (22,185 bytes) — One-off raster conversion script.
10. `scripts/verify-png-release.mjs` (9,084 bytes) — One-time release milestone gate.
11. `scripts/delete-twin-images.mjs` (7,247 bytes) — Unreferenced ad-hoc disk cleaner.
12. `scripts/general/repair-favicon-ico.mjs` (9,838 bytes) — One-off binary header repair for favicon.
13. `scripts/deleteR2Bucket.ts` (3,225 bytes) — High-risk destructive bucket deletion tool; dangerous to retain in repo.

*(Auxiliary Legacy Fixtures:*
- `scripts/seed_data.sql` (260,076 bytes) — Deprecated raw SQL dump superseded by TypeScript seeders (`seed_furniture_catalog.ts`, `seed-block-descriptors.ts`).
- `scripts/catalog-seating.json` (125,895 bytes) — Misplaced static data fixture.

---

### Cluster 4: Python Throwaway Scripts (7 Files)
*Rationale:* Violates repository governance rule `D6_nonportable_in_gate` (`check-governance.mjs`). Monorepo standardizes strictly on Node.js / TypeScript. Python scripts introduce unmanaged runtime dependencies on CI Linux runners.

1. `scripts/audit_external_asset_hosts.py` (5,796 bytes) — Ad-hoc host crawler; unintegrated.
2. `scripts/general/audit-repo-state.py` (4,631 bytes) — Broken; attempts to parse deleted `results/` logs.
3. `scripts/general/generate-session-docs.py` (4,956 bytes) — Superseded by `scripts/general/generate-docs.mjs`.
4. `scripts/general/move-checklist.py` (1,773 bytes) — Disposable checklist move tool.
5. `scripts/general/rename-plans.py` (1,233 bytes) — Disposable rename script.
6. `scripts/general/update-plans.py` (913 bytes) — Disposable update tool.
7. `scripts/general/verify-plans.py` (1,655 bytes) — Duplicate of canonical `scripts/general/check-plans-purity.mjs`.

*(Historical throwaways such as `audit-focss-tokens.py` and `batch-fix-style-tokens.py` were previously retired).*

---

### Cluster 5: Stale One-Off Helpers & Drafts (5 Files)
1. `scripts/sync-hi-wave1-messages.mjs` (5,435 bytes) — One-off localization wave seeder.
2. `scripts/sync-deferred-locale-messages.mjs` (4,004 bytes) — One-off localization seeder.
3. `scripts/translate-deferred-marketing-flat.mjs` (8,617 bytes) — One-off translation utility.
4. `scripts/AsNeeded/_audit-stale-scripts.mjs` (11,381 bytes) — Stale audit draft.
5. `scripts/AsNeeded/_scan-circular-imports.mjs` (3,149 bytes) — Stale scan draft.

---

## 4. Safe Retirement Protocol & Step-by-Step Procedure

To ensure that retiring these ~59 scripts never breaks any gate, operational command, or workflow, follow this 5-stage protocol:

### Stage 1: Preflight Cross-Checks (Safety Verification)

#### 1. Cross-Check Against `package.json`:
Verify that none of the candidate scripts are registered in `package.json`:
```powershell
# Verify no candidate script names exist in package.json
Select-String -Path "package.json" -Pattern "operations-review|site-ui-content-links|merge-recovery|five-majors|deleteR2Bucket|\.py\b"
```
*Result:* Must return 0 matches.

#### 2. Cross-Check Against `.github/workflows/`:
Verify that no GitHub Action invokes any candidate script:
```powershell
Select-String -Path ".github/workflows/*.yml" -Pattern "operations-review|site-ui-content-links|merge-recovery|five-majors|\.py\b"
```
*Result:* Must return 0 matches.

#### 3. Cross-Check Against Ops Dispatcher (`scripts/run-ops.mjs`):
Inspect `scripts/run-ops.mjs` for obsolete commands:
- Lines 213–214 currently register:
  ```javascript
  "db:images:rewrite:apply": () => runNode("apply-db-image-path-rewrite.mjs"),
  "db:images:rewrite:reverse": () => runNode("reverse-asset-paths.mjs"),
  ```
- *Action:* When retiring Cluster 3, remove lines 213–214 from `scripts/run-ops.mjs`.

#### 4. Cross-Check Codebase Imports:
Confirm no active TypeScript/JavaScript module imports any candidate file:
```powershell
git grep "operations-review"
git grep "site-ui-content-links-audit"
git grep "recoveryClassify"
git grep "assetPathMapTools"
```
*Result:* Matches should be confined strictly to audit reports and documentation.

---

### Stage 2: Staging & Safety Archiving

Before removing any files, create a recovery checkpoint tag in git:
```powershell
# Create an immutable git tag marking the state prior to retirement
git tag archive/pre-scripts-cleanup-$(Get-Date -Format 'yyyyMMdd')
```
*(If recovery is ever required, any retired script can be inspected or restored via `git checkout archive/pre-scripts-cleanup-YYYYMMDD -- <path>`).*

---

### Stage 3: Git Removal Execution Commands

Execute removals in discrete, logical batches:

```powershell
# Batch 1: Remove abandoned operations-review subsystem (14 files)
git rm -r scripts/operations-review/

# Batch 2: Remove abandoned site-ui-content-links-audit subsystem (26 files)
git rm -r scripts/site-ui-content-links-audit/

# Batch 3: Remove dead recovery and cutover scripts (13 files + fixtures)
git rm scripts/merge-recovery-into-majors.mjs
git rm scripts/five-majors-hash-dedup.mjs
git rm scripts/lib/recoveryClassify.mjs
git rm scripts/planner-lift-project-trees.mjs
git rm scripts/apply-db-image-path-rewrite.mjs
git rm scripts/reverse-asset-paths.mjs
git rm scripts/fix-asset-paths.mjs
git rm scripts/lib/assetPathMapTools.mjs
git rm scripts/migrate-svg-catalog-to-png.mjs
git rm scripts/verify-png-release.mjs
git rm scripts/delete-twin-images.mjs
git rm scripts/general/repair-favicon-ico.mjs
git rm scripts/deleteR2Bucket.ts
git rm scripts/seed_data.sql
git rm scripts/catalog-seating.json

# Batch 4: Remove Python throwaway scripts (7 files)
git rm scripts/audit_external_asset_hosts.py
git rm scripts/general/audit-repo-state.py
git rm scripts/general/generate-session-docs.py
git rm scripts/general/move-checklist.py
git rm scripts/general/rename-plans.py
git rm scripts/general/update-plans.py
git rm scripts/general/verify-plans.py

# Batch 5: Remove stale one-offs and drafts (5 files)
git rm scripts/sync-hi-wave1-messages.mjs
git rm scripts/sync-deferred-locale-messages.mjs
git rm scripts/translate-deferred-marketing-flat.mjs
git rm scripts/AsNeeded/_audit-stale-scripts.mjs
git rm scripts/AsNeeded/_scan-circular-imports.mjs
```

---

### Stage 4: Post-Retirement Verification Commands

Execute the following verification sequence immediately after removal:

```powershell
# 1. Verify ops command registry syntax and command availability
pnpm run ops:list

# 2. Verify repository layout rules
pnpm run check:layout

# 3. Verify governance baselines (confirms 0 errors, D6_nonportable_in_gate = 0)
pnpm run check:governance

# 4. Run fast gate loop
pnpm run gate:fast

# 5. Verify documentation links
pnpm run check:docs-all
```

---

## 5. Exit Criteria

The script rationalization procedure is complete when:
1. **Inventory Reduction:** Total file count in `scripts/` is reduced from 234 to **~175 files** (eliminating 59 obsolete files).
2. **Ops Dispatcher Purity:** `pnpm run ops:list` executes without errors and all registered commands point to existing files.
3. **Governance Compliance:** `pnpm run check:governance` exits with code 0 and records zero violations against `config/quality/governance-baseline.json`.
4. **Layout Compliance:** `pnpm run check:repo-layout.mjs` exits with code 0.
5. **Zero Breaking Changes:** `pnpm run gate:fast` exits with code 0.
