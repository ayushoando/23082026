# Module 06 - Admin and CRM

## Summary

Admin is a protected staff suite with its own FOCSS zone, server-side admin session requirement, and operational views for plans, catalog, analytics, CRM, and theme management. Customer-query submission is separated from customer-query management and uses the Admin database.

The main concerns are contract/telemetry drift inherited from the Planner compatibility layer and non-durable theme state.

## Admin shell and authorization

[`site/app/admin/layout.tsx`](../site/app/admin/layout.tsx) loads Admin CSS, Nuqs support, and `AdminLayoutShell`, then requires an authenticated admin session. It is dynamic and marked noindex. API Admin helpers require the same role through the server session path.

Admin privilege is not inferred from browser state or user-editable metadata. This is important because CRM and catalog operations can write service-owned data.

## Plans and analytics

Admin plan list/read/update/delete routes coexist with the canonical Planner API. They use the mode-aware project store for data access, but several update/delete/detail response paths hardcode the source label `disk_planner_projects`. Admin analytics has the same source-label problem.

The analytics implementation should be read carefully:

- furniture totals come from catalog samples rather than placement events;
- export breakdown is heuristic;
- active-user style measurements represent days with plan activity, not necessarily unique users;
- source labels may say disk when the selected backend is Supabase.

These are product-definition and observability issues. They do not necessarily imply incorrect database writes, but they do limit confidence in the displayed metrics.

## CRM project detail

The CRM project-detail UI links CRM projects to Planner plans and can create a plan from the detail view. Its current caller uses a legacy response assumption and omits canonical mutation preconditions. This is the clearest Admin-to-Planner integration defect found in static inspection.

The fix should be owned jointly by Admin/CRM and Planner owners because changing only one side can leave the legacy/canonical split ambiguous.

## Customer queries

The public customer-query endpoint validates the form, checks origin, rate-limits by IP, rejects honeypot submissions, writes to the Admin project, and sends notification after commit. The management route uses verified admin session auth and CSRF for mutations, with a deprecated timing-safe static-token fallback.

The public/management separation is a good boundary. The remaining action is to remove the fallback by its documented sunset date and confirm that deployment environments no longer configure it.

## Theme management

`/api/theme/manage` validates a selected theme and calls `setActiveThemeId`. The active ID implementation stores the value in `globalThis` or falls back to environment/default state. There is no durable database write in the live path.

This means theme selection is process-local: a restart or another production instance can lose or disagree with the change. The endpoint should either write/read a durable record or clearly be restricted to development/preview use.

## Recommended checks

1. Fix the CRM Planner contract and add a targeted integration test.
2. Replace hardcoded source labels with `getPlannerProjectsSource()` or equivalent mode metadata.
3. Define analytics terms and attach provenance to every metric.
4. Persist active theme state in the intended Admin/Products store.
5. Remove the static admin-token fallback by 2026-12-01.

## Evidence

- [`site/app/admin/layout.tsx`](../site/app/admin/layout.tsx)
- [`site/app/api/admin/plans/route.ts`](../site/app/api/admin/plans/route.ts)
- [`site/app/api/admin/plans/[id]/route.ts`](<../site/app/api/admin/plans/[id]/route.ts>)
- [`site/app/api/admin/analytics/route.ts`](../site/app/api/admin/analytics/route.ts)
- [`site/features/crm/ProjectDetailView.tsx`](../site/features/crm/ProjectDetailView.tsx)
- [`site/app/api/customer-queries/route.ts`](../site/app/api/customer-queries/route.ts)
- [`site/app/api/customer-queries/manage/route.ts`](<../site/app/api/customer-queries/manage/route.ts>)
- [`site/app/api/theme/manage/route.ts`](../site/app/api/theme/manage/route.ts)
- [`site/lib/theme/activeThemeId.ts`](../site/lib/theme/activeThemeId.ts)

