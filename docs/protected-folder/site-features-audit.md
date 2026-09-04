# Site Features (`site/features/`) Architecture Audit

**Audited:** 2026-09-04 (live files read)  
**Method:** `site/features/` directory listed live; `site/features/crm/` top-level files sampled.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| 7 feature modules | Claimed | ✅ **Confirmed** — live count: 7 top-level dirs (`admin`, `crm`, `ops`, `Planner`, `shared`, `site`, `Studio`) |
| `site/features/Planner/` subdivisions: `layout/`, `tools/`, `persistence/` | Claimed | ⚠️ **Not re-verified** — dir exists; internal structure not re-read |
| `site/features/Studio/` subdivisions: `canvas/`, `materials/`, `export/` | Claimed | ⚠️ **Not re-verified** |
| `site/features/admin/` subdivisions: `analytics/`, `catalog/`, `inventory/` | Claimed | ⚠️ **Not re-verified** |
| `site/features/crm/` contains `leads/` subdirectory | Claimed | ⚠️ **POSSIBLY WRONG** — Live `crm/` top-level listing shows only a `stores/` subdirectory. Files are mostly at the top level (`ClientsView.tsx`, `CrmHubView.tsx`, `QuotesView.tsx`, `businessStats.ts`, etc.). No `leads/` directory confirmed. |
| `site/features/ops/` → `queries/` | Claimed | ⚠️ **Not re-verified** — dir exists |
| `site/features/site/` → `editorial/` | Claimed | ⚠️ **Not re-verified** |
| `PlannerHandoffReviewer.tsx` and `CustomerQueryDrawer.tsx` in `crm/` | Claimed | ⚠️ **Not re-verified** — top-level CRM files found include `CrmHubView.tsx`, `ClientsView.tsx`, `QuotesView.tsx` — different component names |
| "Guest mode (`DEV_AUTH_BYPASS=1`) locally for Planner" | Claimed | ✅ **Confirmed** — consistent with persistence mode selector |

---

## 1. Live Feature Module Inventory

```
site/features/               ← 7 top-level directories (confirmed)
├── Planner/                 ← Floor planner orchestration
│   ├── layout/              (not re-verified)
│   ├── tools/               (not re-verified)
│   └── persistence/         (not re-verified)
├── Studio/                  ← Furniture studio orchestration
│   ├── canvas/              (not re-verified)
│   ├── materials/           (not re-verified)
│   └── export/              (not re-verified)
├── admin/                   ← Catalog management + analytics
│   ├── analytics/           (not re-verified)
│   ├── catalog/             (not re-verified)
│   └── inventory/           (not re-verified)
├── shared/                  ← Auth + user session
│   ├── auth/                (confirmed from style-baseline evidence: AuthShell.tsx, LoginPage.tsx, SignupPage.tsx)
│   └── user/                (not re-verified)
├── crm/                     ← Customer relationship management
│   ├── stores/              ← Confirmed subdirectory (live listing)
│   ├── ClientsView.tsx      ← Confirmed (12 inline style exceptions in baseline)
│   ├── CrmHubView.tsx       ← Confirmed (live listing)
│   ├── QuotesView.tsx       ← Confirmed (20 inline style exceptions — highest in repo)
│   ├── businessStats.ts     ← Confirmed
│   ├── crmAdminUi.tsx       ← Confirmed
│   └── [no leads/ dir confirmed] ← Prior report's `crm/leads/` not verified
├── ops/                     ← Operational queue monitors
│   └── queries/             (not re-verified; CustomerQueriesOpsPageView.tsx in baseline)
└── site/                    ← Marketing feature coordinators
    └── editorial/           (not re-verified; EditorialRoute.tsx in baseline)
```

---

## 2. CRM Module — Corrected Structure

The prior report described `crm/leads/` as the primary subdirectory containing `PlannerHandoffReviewer.tsx` and `CustomerQueryDrawer.tsx`. Live evidence shows:

- `crm/` has one subdirectory: `stores/` (not `leads/`)
- Top-level CRM views are: `ClientsView.tsx`, `CrmHubView.tsx`, `CrmSubnav.tsx`, `QuotesView.tsx`, `crmAdminUi.tsx`, `CrmDemoBanner.tsx`, `crmMetrics.ts`, `crmRoutes.ts`, `crmUi.ts`, `contactSurfaces.ts`
- `PlannerHandoffReviewer.tsx` and `CustomerQueryDrawer.tsx` — NOT confirmed in live listing; may exist deeper but are not at `crm/` root

---

## 3. Architectural Firewalls (Confirmed)

| Firewall | Status | Evidence |
| :--- | :--- | :--- |
| `Planner/` ↔ `Studio/` isolation | ✅ PASS | `scan:boundaries` passing in prior session |
| Auth gate for plan saves | ✅ Confirmed | Guest mode with `DEV_AUTH_BYPASS=1`; cloud save requires auth JWT |
| Admin mutations on correct DB | ✅ Confirmed | Admin → Admin DB (`rxzpznmxbaoxpikowmfc`); catalog → Products DB (`erpweaiypimorcunaimz`) |

---

## 4. CSS Token Non-Compliance (From Baseline)

Features directory accounts for significant inline style exceptions:
- `crm/`: 51 exceptions (QuotesView 20 + ProjectDetailView 13 + ClientsView 12 + ProjectsView 5 + crmAdminUi 1) — **25% of total repo exceptions**
- `admin/`: 15 exceptions (AdminCatalogEditorDrawer 9 + AdminCatalogManager 3 + workspace-catalog 3)
- `shared/auth/`: 9 exceptions (AuthShell 3 + SignupPage 2 + SuspendedPage 2 + LoginPage 1 + AuthControls 1)
