# Repository Scripts Inventory & Rationalization Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`scripts/`](file:///d:/23082026/scripts/)  
**Associated Runbook:** [`scripts-cleanup-runbook.md`](./scripts-cleanup-runbook.md)  
**Method:** Live file census of all scripts across `scripts/`, classification by operational domain, and retirement candidate analysis.

---

## 1. Script Census Summary

The repository currently maintains **229 script files** across multiple directories:

```
scripts/ (229 files total)
├── Core Operations & CI Automation: ~170 files (Retained & Maintained)
│   ├── general/ (layout, governance, lint, secret scanners, doc generators)
│   ├── AsNeeded/ (FOCSS verification, specialized checks)
│   └── root utility scripts (run-ops.mjs, db migration runners, backup scripts)
└── Candidates for Scheduled Retirement: ~59 files (Subject to Operator Authorization)
    ├── scripts/operations-review/ (9 files)
    ├── scripts/site-ui-content-links-audit/ (26 files)
    ├── Dead recovery / hash dedup scripts (14 files)
    └── Throwaway Python one-off scripts (7 files)
```

---

## 2. Essential Operational Scripts (Confirmed Active)

| Script | Purpose | Status / Verified Notes |
| :--- | :--- | :--- |
| [`scripts/sync-github-backup-secrets.ps1`](file:///d:/23082026/scripts/sync-github-backup-secrets.ps1) | Syncs local credentials to GitHub Secrets | **P0 RESOLVED** — Uses canonical `CLOUDFLARE_R2_*` names. |
| [`scripts/run-ops.mjs`](file:///d:/23082026/scripts/run-ops.mjs) | Canonical operations CLI dispatcher | Dispatches `db:apply`, `r2:backup`, `vercel:prod`, etc. |
| [`scripts/seed_furniture_catalog.ts`](file:///d:/23082026/scripts/seed_furniture_catalog.ts) | Seeds furniture catalog and block descriptors | Respects persistence mode; writes to Admin DB in prod. |
| [`scripts/prune_r2_backups.ts`](file:///d:/23082026/scripts/prune_r2_backups.ts) | Enforces 5-day daily / 30-day weekly backup retention | 12/12 unit tests passing. |
| [`scripts/general/run-oxlint.mjs`](file:///d:/23082026/scripts/general/run-oxlint.mjs) | Multi-folder Oxlint runner | Passes with code 0; react-hooks active. |
| [`scripts/general/audit-eslint-disable.mjs`](file:///d:/23082026/scripts/general/audit-eslint-disable.mjs) | Rejects unapproved inline disable directives | Scans all product source, hooks, tests, config. |
| [`scripts/general/check-style-tokens.mjs`](file:///d:/23082026/scripts/general/check-style-tokens.mjs) | Guards against inline style token regressions | Ratchets down baseline from 201 exceptions. |
| [`scripts/general/scan_secrets.mjs`](file:///d:/23082026/scripts/general/scan_secrets.mjs) | Detects high-entropy keys and leaked tokens | Enforced in fast gate and full gate. |

---

## 3. Candidates for Retirement (Governance Rule E4)

Per repository governance and `AGENTS.md §1`:
*Scripts must not be unilaterally deleted without explicit operator authorization.*

| Candidate Path | File Count | Rationale for Retirement |
| :--- | :---: | :--- |
| `scripts/operations-review/` | 9 | Completed phase-specific review scripts; no longer part of active CI. |
| `scripts/site-ui-content-links-audit/` | 26 | Ad-hoc HTML link crawling suite superseded by `audit:sitemap-health`. |
| `scripts/merge-recovery-into-majors.mjs` | 1 | Targets non-existent `others/legacy/recovery/` paths (1,376 lines). |
| `scripts/five-majors-hash-dedup.mjs` | 1 | Historical migration de-duplication script (945 lines). |
| `scripts/deleteR2Bucket.ts` | 1 | Destructive script with extreme operational risk if invoked accidentally. |
| `scripts/general/*.py` | 7 | Throwaway Python one-offs (`rename-plans.py`, `audit-repo-state.py`, etc.). |

---

## 4. Retirement Execution Protocol

When authorized by an operator, follow [`scripts-cleanup-runbook.md`](./scripts-cleanup-runbook.md):
1. Confirm no active `package.json` scripts or CI workflows reference the target.
2. Remove files using git.
3. Run `pnpm run check:layout` and `pnpm run gate:fast` to ensure zero regressions.
