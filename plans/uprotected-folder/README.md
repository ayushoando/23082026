# Actionable Operations & Runbooks Index

**Audited & Updated:** 2026-09-05  
**Location:** [`plans/uprotected-folder/`](file:///d:/23082026/plans/uprotected-folder/)  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Hierarchy:** `User instruction > live code / fresh command output > AGENTS.md > Agents/ > docs/`

---

## Actionable Document Inventory

This directory contains only the essential, high-value actionable runbooks and consolidated health audit for the Oando repository:

| Document | Type | Target Scope / Objective |
| :--- | :---: | :--- |
| [`blockers-clearance-runbook.md`](./blockers-clearance-runbook.md) | **Active Runbook** | Resolution protocol for current `Failures.md` blockers (`GATE-RECHECK-01` and `BROWSER-ORIGIN-02`). |
| [`scripts-cleanup-runbook.md`](./scripts-cleanup-runbook.md) | **Active Runbook** | Safe deprecation and retirement protocol for dead/obsolete repository scripts. |
| [`style-tokens-ratchet-runbook.md`](./style-tokens-ratchet-runbook.md) | **Active Runbook** | Refactoring workflow for 201 legacy inline style token exceptions in `style-token-baseline.json`. |
| [`platform-health-audit.md`](./platform-health-audit.md) | **Health Summary** | Consolidated quality scorecard, dual DB architecture, mode-aware persistence, and edge worker status. |

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

# 4. Fast Development Gate
pnpm run gate:fast
```
