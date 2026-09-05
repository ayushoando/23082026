# Operational Runbook: Scripts Rationalization & Cleanup

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`scripts/`](file:///d:/23082026/scripts/)  
**Goal:** Safely deprecate and remove candidate obsolete scripts under governance rule E4 without breaking active commands or CI workflows.

---

## 1. Governance Safety Constraints (Rule E4)

Per `AGENTS.md §1`:
*“Never clean, reset, restore, delete, or apply report recommendations unless the user specifically names the targets.”*

Scripts must only be removed in batches following explicit operator instruction.

---

## 2. Target Candidate Inventory (43 Dead/Obsolete Scripts)

*(Inventory of 43 primary candidate scripts across obsolete audit suites, defunct migration scripts, and throwaway helpers; expandable to ~50-59 with nested extractors and additional one-offs).*

### Batch 1: Completed Audit & Review Subsystems (35 files)
1. `scripts/operations-review/` (9 root files) — Legacy operational review scripts.
2. `scripts/site-ui-content-links-audit/` (26 files) — HTML link crawling suite superseded by `audit:sitemap-health`.

### Batch 2: Dead Root Migration Scripts
1. `scripts/merge-recovery-into-majors.mjs` (Targets defunct recovery paths)
2. `scripts/five-majors-hash-dedup.mjs` (Legacy hash deduplication)
3. `scripts/deleteR2Bucket.ts` (High-risk destructive helper)
4. `scripts/seed_data.sql` (260 KB legacy SQL dump superseded by TypeScript seeders)

### Batch 3: Single-Use Python Scripts
1. `scripts/general/rename-plans.py`
2. `scripts/general/update-plans.py`
3. `scripts/general/move-checklist.py`
4. `scripts/general/verify-plans.py`
5. `scripts/general/audit-repo-state.py`
6. `scripts/general/generate-session-docs.py`

---

## 3. Pre-Deletion Verification Protocol

Before removing any script:
1. Grep the repository for invocations:
   ```powershell
   git grep "<script-name>"
   ```
2. Confirm no references in `package.json`, `.github/workflows/`, or other scripts.
3. Remove target file via git:
   ```powershell
   git rm <target-path>
   ```
4. Verify repository layout and tests:
   ```powershell
   pnpm run check:layout
   pnpm run test:unit
   ```
