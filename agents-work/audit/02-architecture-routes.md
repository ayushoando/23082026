# 02 — Architecture & Routes

**Counts (verified by disk walk of `site/app/`):**

| Group | Pages | Layouts | Notes |
|---|---|---|---|
| `(site)` marketing | 37 | 6 | plus `error.tsx`/`loading.tsx` at group + products level |
| `admin` | 19 | 2 (`admin`, `admin/crm`) | `force-dynamic`, auth-gated layout |
| `ooplanner` | 3 | 1 | thin entries → `features/Planner/page` |
| `oostudio` | 1 | 1 | thin entry → `features/Studio/page` |
| `offline` | 1 | 1 | PWA fallback |
| **Total** | **61 pages** | **12 layouts** | |

**API routes:** 59 under `app/api/**` (admin 12, `Studio/*` 7, `Planner/*` 7, `files/*` 5, theme 2, products 2, plans 2, customer-queries 2, dev 2, 18 top-level singletons). Plus 5 metadata routes outside `api/`: `api-docs`, `openapi.json`, `security.txt`, `.well-known/api-catalog`, `.well-known/security.txt` — all backed by live `lib/apiCatalog.ts` / `lib/securityTxt.ts`.

## Findings

| # | Severity | Finding |
|---|----------|---------|
| 2.1 | Info (positive) | Route structure fully consistent: every group and product tree has a layout, no orphan route groups, no `route.ts` outside `api/` + metadata routes, thin-entry pattern (`site/app/ooplanner/page.tsx` is 3 lines re-exporting `@/features/Planner/page`). |
| 2.2 | Med | **Docs drift:** `docs/architecture/routes.md` lists 35 `(site)` pages; disk has 37. Missing: `tools/meeting-room-capacity-calculator` and `tools/office-space-calculator`. |
| 2.3 | Low | `error.tsx`/`loading.tsx` exist only under `(site)`; `admin`/`ooplanner`/`oostudio` rely solely on root `global-error.tsx`. |
| 2.4 | Low (style) | API namespaces are capitalized on disk (`app/api/Studio/…`) — case-sensitive URLs; documented as intentional in `docs/architecture/routes.md:165`. |
