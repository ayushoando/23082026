# Admin Surface Audit

**Created:** 2026-08-31
**Status:** Audit complete, remedy plan ready
**Owner:** Repository owner

## Documents

| Document | Purpose |
|---|---|
| [`admin-audit-report.md`](./admin-audit-report.md) | Full audit: 17 pages, 16 API endpoints, auth, data flow, features, UI quality |
| [`remedy-plan.md`](./remedy-plan.md) | Prioritized fix plan |

## Key Findings

### Strengths
- **Auth is solid** — layout-level `requireAuthUser("/admin", "admin")` + API routes all use `withAuth("admin")` or `requireAdminSession()` + CSRF on mutations
- **17 fully functional pages** — catalog CRUD, plans, price books, feature flags, themes, analytics, customer queries, design kit
- **Dedicated FOCSS CSS zone** with responsive support — phone-specific capability declarations
- **Good state management** — loading, error, empty, filter-empty states in catalog manager

### Issues
- **CRM is browser-only demo** — clients, projects, quotes all use localStorage. 4 pages with no server persistence.
- **No general audit log** — only price book actions have audit trail. No cross-surface admin activity log.
- **No middleware-level auth** — admin auth is layout + per-route handler (no edge rejection)
- **Analytics shows catalog samples** — not real telemetry when DB is unconfigured
- **Studio link in admin nav goes to /oostudio** — which has NO auth check (see studio-audit)
