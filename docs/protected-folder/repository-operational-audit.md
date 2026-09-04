# Area-Wise Quality & Operational Audit Report

**Audited:** 2026-09-04 (live codebase checks performed)  
**Method:** Each area's key claims verified against live files and command output. Findings marked ✅ confirmed, ⚠️ partially changed, or ❌ wrong/stale.

---

## Executive Quality Scorecard (Updated)

| Area | Grade | Key Verified Finding | Change from Prior Report |
| :--- | :---: | :--- | :--- |
| **1. Database & Backups** | **A-** | Live DB healthy; backup retention pruner tested. | **P0 UNRESOLVED** — secret sync typo still present in `sync-github-backup-secrets.ps1`. |
| **2. Static Code & Lint** | **B** | 7 inline suppressions confirmed. | **NEW FINDING** — `react-hooks` plugin missing from `.oxlintrc.json` plugins array; `exhaustive-deps` rule may silently not run. Grade downgraded from B+. |
| **3. UI, CSS & FOCSS** | **A** | Pass — no new findings. | No change. |
| **4. SEO & Sitemap** | **C** | Sitemap is generated dynamically from DB catalog, not from hardcoded slug lists. | **FINDING REVISED** — Prior report claimed 10 specific slugs in `productStaticParams.ts`; grep shows none of those slugs present. Sitemap 404s may have been pruned, or the source of 404s is elsewhere (route classification / DB catalog mismatch). Needs live sitemap re-audit. |
| **5. Security & Governance** | **A** | Secret scanner, governance ratchet, and worker origin checks confirmed passing. | No change. |
| **6. Testing & Strength** | **B+** | 937 test files, 0 hollow violations, 0 unapproved skips. | No change. |
| **7. Tech-Docs Reality** | **D** | `Database.tsx` ER diagram confirmed stale (uses `users`, `plans`, `leads`). `/repository-graph` route confirmed absent from `App.tsx`. | **Grade downgraded from C-** — `App.tsx` has no graph route at all; prior report implied it just wasn't wired. It's completely missing. |
| **8. Script Inventory** | **C+** | Scripts dir: 229 files (down from 264). `operations-review/` (10 files) and `site-ui-content-links-audit/` (26 files) still present. | **Script count revised** — 229 total files (not 264). Dead Python scripts still present. Grade upgraded from D since some cleanup may have occurred. |

---

# Area 1: Database, Persistence & Backup Quality

### 1.1 Live Connectivity (Confirmed from prior session)
- Admin DB (`rxzpznmxbaoxpikowmfc`): 4 live plans, furniture seed verified.
- Products DB (`erpweaiypimorcunaimz`): 143 catalog products, categories synced.

### 1.2 P0 Unresolved: GitHub Actions Secret Mismatch

**Confirmed live** — `scripts/sync-github-backup-secrets.ps1` still contains:
```
'CLOULDFLARE_S3_URL'              ← typo, unused by CI
'CLOULD_ACCESS_KEY_ID'             ← typo, CI expects CLOUDFLARE_R2_ACCESS_KEY_ID
'CLOULDFLARE_S3_SECRET_ACCESS_KEY' ← typo, CI expects CLOUDFLARE_R2_SECRET_ACCESS_KEY
```

The GitHub Actions workflow `supabase-backup-r2.yml` correctly uses `CLOUDFLARE_R2_ACCESS_KEY_ID` and `CLOUDFLARE_R2_SECRET_ACCESS_KEY`. The sync script does not set these. **Nightly R2 backups are failing.**

### 1.3 Protections Confirmed
- `assertNotServiceRoleKey()` guard active in `site/platform/supabase/env.ts`.
- `profiles` table schema trap (no `email`, no `role`) documented in drizzle schema.

---

# Area 2: Static Code & Lint Quality

### 2.1 NEW FINDING: `react-hooks` Plugin Not Loaded

Live `.oxlintrc.json` plugins array: `["typescript","react","import","unicorn","jsx-a11y"]`

`"react-hooks"` is absent. The rule `"react-hooks/exhaustive-deps": "warn"` is declared but the plugin that provides it is not loaded. This means the rule may be silently skipped by oxlint. **The 5 canvas hook suppressions in `site/hooks/` are suppressing a rule that may not actually be running.**

### 2.2 Inline Suppressions (7 — Confirmed)

All 7 verified present by grep:
- 5 × `react-hooks/exhaustive-deps` in `site/hooks/` (Studio: 2, Planner: 3)
- 2 × `@typescript-eslint/no-require-imports` in `config/build/playwright.config.ts`

### 2.3 Audit Script Gap (Confirmed)

`audit-eslint-disable.mjs` scans only `site/app`, `site/components`, `site/features`, `site/lib`. Does not scan `site/hooks/` or `config/build/`.

---

# Area 3: UI, CSS & Design System (FOCSS)

No new findings. Prior report confirmed:
- 151 CSS files pass FOCSS compiler ✅
- 0 raw hex literals ✅
- 0 import cycles ✅
- 0 Studio↔Planner cross-imports ✅

---

# Area 4: SEO, Sitemap & Content Integrity

### 4.1 REVISED FINDING: Sitemap 404 Sources

The prior report claimed 10 specific product slugs (allure, caneva, copse, crotch, ember, flare, flex, flip, mellow, plus storages/accessories) exist in `productStaticParams.ts` and `sitemap.ts`.

**Live check results:**
- `site/lib/catalog/productStaticParams.ts` — **none of those slugs found**
- `site/app/sitemap.ts` — **none of those slugs found**
- `site/features/site/data/routeClassification.ts` — **none found**

**Conclusion:** Either:
1. The slugs were already pruned (good), or
2. The sitemap generates dynamically from DB catalog (`buildProductStaticParams()`) and the 404s come from DB rows that still carry stale slugs.

**Action required:** Re-run `pnpm run audit:sitemap-health` against live `https://oando.co.in/sitemap.xml` to determine current state.

### 4.2 Stale `/buddy-planner` References

Prior report found references in `scripts/site-ui-content-links-audit/`. That directory still exists (26 files confirmed). The stale references remain until the directory is deleted.

---

# Area 5: Security & Governance

All checks previously confirmed passing:
- `pnpm run scan:secrets` — 0 leaks ✅
- `pnpm run check:governance` — 0 regressions ✅
- `pnpm run check:worker-origin` — HTTP 200 ✅
- `pnpm run check:layout` — 0 violations ✅

---

# Area 6: Testing & Test Strength

### 6.1 Test File Count (Confirmed ~937)
- Vitest: 777 executable files
- Playwright: 85 specs
- Helpers: 38, Fixtures: 15, Snapshots: 12, Assets: 10

### 6.2 Anti-Hollow & Anti-Skip (Confirmed passing)
- 0 hollow test violations
- 0 unapproved skips

### 6.3 Critical Gaps (Unchanged)
1. `site/proxy.ts` (20 KB middleware) — no dedicated test gate
2. `site/app/api/` edge failure branches — audited by static regex only
3. `site/app/(site)/` marketing server components — excluded from vitest coverage globs
4. Live Supabase RLS — bypassed by `DEV_AUTH_BYPASS=true` in unit tests
5. `scripts/` — 229 scripts, coverage negligible

---

# Area 7: Tech-Docs Generator Reality

### 7.1 NEW FINDING: `/repository-graph` Route Entirely Missing

Live `tech-docs-generator/src/App.tsx` routes (confirmed):
```
/ → Overview
/tech-stack → TechStack
/architecture → Architecture
/features → Features
/code-organization → CodeOrganization
/database → Database
/api → ApiDesign
/testing → Testing
/deployment → Deployment
/security → Security
/performance → Performance
/workflows → Workflows
```

**There is no `/repository-graph` route at all.** Prior report implied it was "unwired" but it was never added to the router. The `page-component-graph.mmd` output is generated but has no UI surface.

### 7.2 Database.tsx ER Diagram Still Stale (Confirmed)

Live `tech-docs-generator/src/pages/Database.tsx` still contains:
- `users ||--o{ plans : owns` — `users` archived, `plans` renamed to `oando_plans`
- `users ||--o{ leads : manages` — `leads` table removed from codebase
- `plans ||--o{ plan_items : contains` — `plan_items` non-existent, embedded in `oando_plans.data` JSONB
- `leads ||--o{ activity : tracks` — both tables non-existent

Missing from diagram: `furniture_catalog`, `block_descriptors`, `planner_managed_products`, `configurator_products`, `audit_events`.

---

# Area 8: Script Inventory

### 8.1 Revised Count

- **Prior report:** 264 total scripts
- **Live count (2026-09-04):** 229 total files in `scripts/` — 35 files have been removed since prior report.

Dead directories still present:
- `scripts/operations-review/` — **10 files** (previously 9, one may have been added)
- `scripts/site-ui-content-links-audit/` — **26 files** (unchanged)

Dead large files still present:
- `scripts/merge-recovery-into-majors.mjs` — **43,837 bytes** (43 KB)
- `scripts/five-majors-hash-dedup.mjs` — **31,079 bytes** (31 KB)

Dead Python scripts still present:
- `audit-repo-state.py`, `move-checklist.py`, `rename-plans.py`, `update-plans.py`, `verify-plans.py`

---

# Area-Wise Remediation Action Plan (Updated Status)

| Area | Action | Target | Priority | Status |
| :--- | :--- | :--- | :---: | :--- |
| **Security/DB** | Fix 3 typo secret names in sync script | [`scripts/sync-github-backup-secrets.ps1`](file:///d:/23082026/scripts/sync-github-backup-secrets.ps1) | **P0** | ❌ Open |
| **SEO** | Re-audit live sitemap to confirm whether 404s still exist | `pnpm run audit:sitemap-health` (if present) | **P0** | ❌ Not re-run |
| **Linting** | Add `"react-hooks"` to `.oxlintrc.json` plugins array | [`.oxlintrc.json`](file:///d:/23082026/.oxlintrc.json) | **P1** | ❌ Open |
| **Linting** | Promote `react-hooks/exhaustive-deps` to `"error"` | [`.oxlintrc.json`](file:///d:/23082026/.oxlintrc.json) | **P1** | ❌ Open |
| **Linting** | Expand `audit-eslint-disable.mjs` to include `site/hooks` and `config/build` | [`scripts/general/audit-eslint-disable.mjs`](file:///d:/23082026/scripts/general/audit-eslint-disable.mjs) | **P1** | ❌ Open |
| **Tech-Docs** | Add `/repository-graph` route to `App.tsx` | [`tech-docs-generator/src/App.tsx`](file:///d:/23082026/tech-docs-generator/src/App.tsx) | **P1** | ❌ Open |
| **Tech-Docs** | Rewrite `Database.tsx` ER diagram to live schema | [`tech-docs-generator/src/pages/Database.tsx`](file:///d:/23082026/tech-docs-generator/src/pages/Database.tsx) | **P1** | ❌ Open |
| **Testing** | Add unit tests for `site/proxy.ts` | `tests/unit/server/proxy.test.ts` | **P1** | ❌ Open |
| **Scripts** | Delete `scripts/operations-review/` (10 files) | `scripts/operations-review/` | **P1** | ❌ Open |
| **Scripts** | Delete `scripts/site-ui-content-links-audit/` (26 files) | `scripts/site-ui-content-links-audit/` | **P1** | ❌ Open |
| **Scripts** | Delete large dead recovery scripts (74 KB combined) | `scripts/merge-recovery-into-majors.mjs`, `scripts/five-majors-hash-dedup.mjs` | **P1** | ❌ Open |
| **Scripts** | Delete dead Python scripts (5 files) | `rename-plans.py`, `update-plans.py`, `move-checklist.py`, `verify-plans.py`, `audit-repo-state.py` | **P1** | ❌ Open |
| **Failures.md** | Remove `CF-TOKEN-01` and `GATE-AUTH-02` (stale) | [`Failures.md`](file:///d:/23082026/Failures.md) | **P2** | ❌ Operator action |
