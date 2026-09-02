# Admin Surface Audit Report

**Date:** 2026-08-31
**Scope:** All admin pages, API routes, components, data layer, auth, UI quality
**Pages audited:** 17 routes under `/admin/`

---

## Executive Summary

The admin surface is **well-built and feature-complete**. Auth is enforced at the layout level via `requireAuthUser("/admin", "admin")` and on every API route via `withAuth("admin")` or `requireAdminSession()`. All mutating endpoints have CSRF protection and rate limiting. The admin has its own FOCSS CSS zone with responsive support.

The main gaps are: CRM is a **browser-only localStorage demo** (4 pages with no server persistence), there's **no general audit log** across admin surfaces, and the **Studio link in the admin nav points to `/oostudio/` which has no auth check**.

### Severity Summary

| Severity | Count |
|---|---|
| Critical | 1 |
| High | 2 |
| Medium | 3 |
| Low | 2 |

---

## Admin Route Inventory (17 pages)

| Route | Purpose | Status |
|---|---|---|
| `/admin` | Dashboard hub — KPI links, section cards | ✅ Complete |
| `/admin/catalog` | Standard catalog CRUD (planner_managed_products) | ✅ Complete |
| `/admin/planner-catalog` | Configurator catalog CRUD (parametric/discrete SKUs) | ✅ Complete |
| `/admin/workspace-catalog` | Read-only workspace element library | ✅ Complete |
| `/admin/features` | Feature flag toggles grouped by domain | ✅ Complete |
| `/admin/plans` | Plans list with pagination/sort/filter/search | ✅ Complete |
| `/admin/plans/[id]` | Plan detail view/edit with status transitions | ✅ Complete |
| `/admin/price-books` | Price book management with approve/activate/rollback | ✅ Complete |
| `/admin/themes` | Theme management with editor + R2 CDN publish | ✅ Complete |
| `/admin/analytics` | Planner usage charts (volume, users, exports, furniture) | ✅ Functional (sample data fallback) |
| `/admin/customer-queries` | Server-backed inbound customer query queue | ✅ Complete |
| `/admin/crm` | CRM hub | ⚠️ Browser demo only |
| `/admin/crm/clients` | CRM contacts | ⚠️ Browser demo only |
| `/admin/crm/projects` | CRM deals/plans | ⚠️ Browser demo only |
| `/admin/crm/projects/[id]` | Project detail | ⚠️ Browser demo only |
| `/admin/crm/quotes` | CRM quotes | ⚠️ Browser demo only |
| `/admin/settings` | Read-only reference (canvas limits, flags, env vars) | ✅ Complete |
| `/admin/inventory` | App route and API map | ✅ Complete |
| `/admin/design-kit` | Living visual contract | ✅ Complete |

---

## Findings

### ADM-C01: Studio Nav Link Has No Auth

**Severity:** CRITICAL
**Location:** `site/features/admin/ui/adminNav.ts` → Catalog group → "Furniture Studio" → `/oostudio`

The admin nav sidebar links to `/oostudio` as "Furniture Studio". But the Studio layout (`site/features/Studio/layout.tsx`) has **no `requireAuthUser` call** — anyone who knows the URL can access the full furniture authoring tool, canvas, AI features, and publish pipeline. See `plans/studio-audit/` for details.

**Fix:** Add `requireAuthUser("/oostudio", "admin")` to the Studio layout.

---

### ADM-H01: CRM is Browser-Only Demo (4 pages)

**Severity:** HIGH
**Location:** `/admin/crm`, `/admin/crm/clients`, `/admin/crm/projects`, `/admin/crm/quotes`

All CRM data (clients, projects, quotes) is stored in **browser localStorage only**. Each page shows an `AdminAlert` warning: "Clients, projects, and quotes save to this browser only." The data:
- Is not persisted to any database
- Is lost when the browser clears storage
- Cannot be shared between team members
- Cannot be accessed from another device

The customer-queries page (`/admin/customer-queries`) IS server-backed — it reads from the `customer_queries` Supabase table. But the rest of CRM is a demo.

**Fix:** Either:
1. Build server-backed CRM with Supabase tables on the Admin database
2. Clearly label CRM pages as "Preview" in the UI and hide them behind a feature flag
3. Remove CRM from admin nav until it's server-backed

---

### ADM-H02: No General Audit Log

**Severity:** HIGH
**Location:** Across all admin surfaces

Only price book actions have an audit trail (`readAdminPriceBookAudit`). Other admin actions (catalog create/edit/delete, feature flag toggles, theme publishes, plan status changes) are not logged to any audit table.

There IS a `/api/audit` route with full auth + CSRF + rate limiting, and an `insertEvent` function, but it's used only by specific surfaces, not globally.

**Fix:** Wire the existing audit route into all admin mutation handlers via a shared `logAdminAction()` wrapper.

---

### ADM-M01: Analytics Shows Sample Data When DB Unconfigured

**Severity:** MEDIUM
**Location:** `/admin/analytics`

When the Supabase database is not configured, analytics falls back to sample/catalog data. The API response includes `source` and `furnitureSource` fields to indicate this, but the UI doesn't clearly communicate to the admin that they're looking at sample data rather than real telemetry.

**Fix:** Show a prominent banner when analytics data is sourced from samples.

---

### ADM-M02: No Middleware-Level Admin Auth

**Severity:** MEDIUM
**Location:** No `middleware.ts` at project root

Admin auth is enforced at the layout level (pages) and per-handler level (API routes). There's no middleware-level rejection. This means unauthenticated requests still reach the server before being rejected. This is the same finding as SEC-C01 in the security audit.

---

### ADM-M03: Admin Catalog Falls Back to Local Disk

**Severity:** MEDIUM
**Location:** `site/features/admin/api/catalogAdminHandlers.ts`

When the Supabase `planner_managed_products` table is unavailable, the catalog CRUD falls back to a local disk catalog. In production (read-only FS), writes would fail silently. The fallback is only useful in local dev.

**Fix:** In production mode, show an explicit error when the database is unavailable instead of silently falling back to read-only disk.

---

### ADM-L01: Empty CRM Projects Directory

**Severity:** LOW
**Location:** `site/features/admin/crm/projects/` (empty)

CRM project views actually live in `site/features/crm/`, not `site/features/admin/crm/projects/`. The empty directory is misleading.

### ADM-L02: Settings Page is Read-Only Reference

**Severity:** LOW

The settings page shows canvas limits, flag defaults, env vars, and data sources as read-only text. There's no edit capability — admin must change `.env.local` or Supabase directly. This is fine for now but could be a future improvement.

---

## Auth Cross-Reference (all 16 API endpoints verified)

All admin API routes enforce admin auth, rate limiting, and CSRF on mutations. Full table in the context-gatherer output above.

---

## What's Working Well

| Area | Assessment |
|---|---|
| **Auth** | Layout + API double-gate with role enforcement. Dev bypass production-hardened. |
| **Catalog CRUD** | Full lifecycle: list, search, filter, create, edit, toggle visibility, delete. Pagination. |
| **Price books** | Approve/activate/rollback with governance rules and audit trail. Dual storage (Drizzle + file). |
| **Feature flags** | Grouped by domain, source indicator (DB vs default), server action for writes. |
| **UI quality** | Loading/error/empty/filter-empty states. Dedicated FOCSS zone. Responsive grid. Phone capability declarations. |
| **Plans management** | Full CRUD with status transitions, search, sort, filter. Telemetry on route handlers. |

---

*Report generated from static code analysis and context-gatherer investigation.*
