# Site Features (`site/features/`) Architecture Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`site/features/`](file:///d:/23082026/site/features/)  
**Method:** Live directory analysis of feature modules, persistence mode integration, and fork isolation checks.

---

## 1. Feature Module Inventory (7 Top-Level Domains)

```
site/features/
├── Planner/     ✅ 2D/3D Floor Planner orchestration & persistence
├── Studio/      ✅ 2D/3D Furniture Studio canvas & material customization
├── admin/       ✅ Catalog management, inventory controls & analytics
├── crm/         ✅ Client relationship management, quote generator & CRM hub
├── ops/         ✅ Customer query review & operations management
├── shared/      ✅ Authentication flows, user session & entry routing
└── site/        ✅ Marketing editorial, dynamic assistant & SEO contracts
```

---

## 2. Module Deep Dives & Verified Reality

### 2.1 CRM Module (`site/features/crm/`)
- **Structure:** Live directory contains `stores/` subdirectory and top-level views:
  - `CrmHubView.tsx` — Main CRM operations dashboard.
  - `ClientsView.tsx` — Customer registry view.
  - `QuotesView.tsx` — Enterprise quote calculation engine.
  - `businessStats.ts` — Pipeline analytics calculator.
  - `crmAdminUi.tsx` — Reusable CRM administrative UI shell.
- **Clarification:** Previous audit speculated the existence of a `crm/leads/` directory; live inspection confirms leads are integrated into the main CRM hub and operations views.

### 2.2 Fork Isolation: Planner vs. Studio
- Features under `site/features/Planner/` must NEVER import from `site/features/Studio/` or `@studio/*`.
- Features under `site/features/Studio/` must NEVER import from `site/features/Planner/` or `@planner/*`.
- Enforced by `pnpm run scan:boundaries`.

### 2.3 Mode-Aware Persistence Wrappers
All feature writes adhere to `AGENTS.md §5`:
- **Plans Feature:** Uses [`plannerPersistenceMode.ts`](file:///d:/23082026/site/lib/Planner/plannerPersistenceMode.ts). Writes to local disk `site/platform/Planner/data/projects/` only when `DEV_AUTH_BYPASS=1`; writes to Admin DB `oando_plans` in production.
- **Catalog & Admin Feature:** Uses [`furnitureCatalogMode.ts`](file:///d:/23082026/site/lib/catalog/furnitureCatalogMode.ts). Writes to local disk `site/platform/shared/data/furniture/` only in non-prod; writes to Admin DB `furniture_catalog` in production.

---

## 3. Verification & Gate Commands

```powershell
# 1. Typecheck features tree
pnpm run typecheck

# 2. Run boundary scan for feature trees
pnpm run scan:boundaries

# 3. Run unit tests for features
pnpm exec vitest run tests/unit/features/
```
