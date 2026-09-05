# Agent Reports — Navigation Index

**Audited:** 2026-09-04  
**Location:** [`.agents/reports/`](file:///d:/23082026/.agents/reports/)  
**Method:** Each report was re-verified against live codebase. This is not a copy — findings are based on live command output and file reads.

---

## Report Index

| Report | Area | Key New/Revised Findings |
| :--- | :--- | :--- |
| [`failures-and-blockers-audit.md`](file:///d:/23082026/.agents/reports/failures-and-blockers-audit.md) | **Blockers** | **Prior report was wrong.** All 4 blockers still in `Failures.md`. `CF-TOKEN-01` and `GATE-AUTH-02` are stale but not removed. `GATE-RECHECK-01` and `BROWSER-ORIGIN-02` legitimately open. |
| [`infrastructure-config-audit.md`](file:///d:/23082026/.agents/reports/infrastructure-config-audit.md) | **Infrastructure** | Topology confirmed intact. P0 secret name typo **still unresolved** — `CLOULD_ACCESS_KEY_ID` etc. still in `sync-github-backup-secrets.ps1`, blocking nightly R2 backups. |
| [`mcp-plugins-skills-audit.md`](file:///d:/23082026/.agents/reports/mcp-plugins-skills-audit.md) | **MCPs & Skills** | All recommendations from prior report remain unimplemented. 65% stack bloat persists. No new MCPs or workspace skills added. |
| [`oxlint-suppressions-audit.md`](file:///d:/23082026/.agents/reports/oxlint-suppressions-audit.md) | **Oxlint** | **NEW FINDING:** `react-hooks` plugin missing from `plugins` array — `exhaustive-deps` rule may silently not run despite being declared. 7 inline suppressions confirmed present. |
| [`repository-operational-audit.md`](file:///d:/23082026/.agents/reports/repository-operational-audit.md) | **Operational** | SEO slugs not found in static files (may be DB-side); tech-docs `/repository-graph` route entirely absent from `App.tsx`; script count revised to 229 (not 264). |
| [`INVENTORY.md`](file:///d:/23082026/.agents/reports/INVENTORY.md) | **Test Inventory** | 937 test files (unchanged). |
| [`CONTENTS.md`](file:///d:/23082026/.agents/reports/CONTENTS.md) | **Test Layout** | Test path conventions (unchanged). |

---

## Confirmed P0 Actions (Still Open)

| # | Action | File | Evidence |
| :--- | :--- | :--- | :--- |
| 1 | Fix 3 typo secret names in backup sync script | [`scripts/sync-github-backup-secrets.ps1`](file:///d:/23082026/scripts/sync-github-backup-secrets.ps1) | Live grep shows `CLOULD_ACCESS_KEY_ID`, `CLOULDFLARE_S3_SECRET_ACCESS_KEY`, `CLOULDFLARE_S3_URL` still present; CI expects `CLOUDFLARE_R2_*` variants |
| 2 | Re-audit live sitemap — prior 404 slugs not found in static source | `pnpm run audit:sitemap-health` | `allure`, `caneva`, `flex` etc. not in `productStaticParams.ts` or `sitemap.ts`; source of 404s may be DB catalog |

## Confirmed P1 Actions (Still Open)

| # | Action | File |
| :--- | :--- | :--- |
| 1 | Add `"react-hooks"` to `plugins` array | [`.oxlintrc.json`](file:///d:/23082026/.oxlintrc.json) |
| 2 | Add `/repository-graph` route to tech-docs router | [`tech-docs-generator/src/App.tsx`](file:///d:/23082026/tech-docs-generator/src/App.tsx) |
| 3 | Rewrite `Database.tsx` ER diagram (`users`/`plans`/`leads` all archived) | [`tech-docs-generator/src/pages/Database.tsx`](file:///d:/23082026/tech-docs-generator/src/pages/Database.tsx) |
| 4 | Delete `scripts/operations-review/` (10 files) | `scripts/operations-review/` |
| 5 | Delete `scripts/site-ui-content-links-audit/` (26 files) | `scripts/site-ui-content-links-audit/` |
| 6 | Delete large dead scripts (74 KB) | `merge-recovery-into-majors.mjs`, `five-majors-hash-dedup.mjs` |
| 7 | Delete 5 dead Python scripts | `rename-plans.py`, `update-plans.py`, `move-checklist.py`, `verify-plans.py`, `audit-repo-state.py` |
| 8 | Expand `audit-eslint-disable.mjs` SCAN_DIRS to include `site/hooks` and `config/build` | [`scripts/general/audit-eslint-disable.mjs`](file:///d:/23082026/scripts/general/audit-eslint-disable.mjs) |

## Operator Decisions Required (Failures.md)

| Blocker ID | Recommendation | Rationale |
| :--- | :--- | :--- |
| `CF-TOKEN-01` | **Remove** | Token verified active by prior agent; underlying issue resolved |
| `GATE-AUTH-02` | **Remove** | Session-scoped constraint; consolidated into `GATE-RECHECK-01` |
| `GATE-RECHECK-01` | **Keep** | Full `pnpm run gate` not observed on current tree |
| `BROWSER-ORIGIN-02` | **Keep** | Dev server ephemeral; browser walk not completed |

---

## Unimplemented Recommendations (From Prior Report)

| Recommendation | Status |
| :--- | :--- |
| Provision Supabase Postgres MCP | ❌ Not done |
| Provision Cloudflare MCP | ❌ Not done |
| Provision Playwright MCP | ❌ Not done |
| Author `supabase-dual-db-ops` skill | ❌ Not done |
| Author `focss-design-token-guard` skill | ❌ Not done |
| Author `cloudflare-worker-proxy-deploy` skill | ❌ Not done |
| Disable `data-agent-kit-plugin` for this workspace | ❌ Not done |
| Disable `firebase` plugin for this workspace | ❌ Not done |
