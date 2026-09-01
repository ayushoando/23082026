# 08 — Security: API Routes

**Coverage of all 59 route files under `site/app/api/`:**

- **29** use `withAuth(...)` directly (admin themes/features/catalogs/price-books/analytics, plans, Studio furniture/AI, files/*, exports, git-user, generate-alt, filter, smart-wizard, ai-advisor, features…).
- **11** use the planner pipeline (`createPlannerHandler`/`processPlannerRequest` — enforces quota+CSRF+auth internally via `site/server/Planner/plannerRouteAdapter`).
- **`app/api/admin/_lib/server.ts`** provides `requireAdminSession`/`enforceAdminMutationGuard` for `admin/plans`, `admin/plans/[id]`, `admin/indexnow`.
- **~18 non-`withAuth` routes all accounted for:**
  - Public GETs (allowlist `OTHER_PUBLIC_GET_ALLOWLIST`): health, categories, products, products/filter, features, business-stats, nav-categories, csrf, theme/active, files/catalog/[...path], root.
  - Public mutators with rate limit: tracking, log-error (zod-validated, 16 KB cap), customer-queries, nav-search.
  - Manual but complete gates: audit (auth+CSRF+rate limit), customer-queries/manage (admin session or deprecated static token, CSRF on PATCH).
  - Prod-hidden diagnostics: dev/auth-bypass-status, dev-tools/lighthouse, metrics (404 in prod unless `OBSERVABILITY_METRICS_ENABLED=1`; bearer-token gate with timing-safe compare).

**Repo's own rule** (`scripts/general/audit-api-route-safety.mjs`): enforces admin-auth markers on all `admin/*` routes (GET included), per-method CSRF, `x-csrf-rejected` header, `CSRF_FAILED` error code, rate limits, public-GET allowlist. **Wired into CI** via `run-test-audits.mjs` inside `release:gate:core`/`fast`.

**Service-role usage:** `site/platform/supabase/supabaseAdmin.ts` reads `SUPABASE_SERVICE_ROLE_KEY` server-side only; all 7 importers are server modules/API routes — no client-component usage.

## Findings

| # | Severity | Finding |
|---|----------|---------|
| 8.1 | **Medium** | **SVG sanitizer is dead code on the upload path.** `sanitizeSvg`/`isSvgSafe` (`site/lib/security/svgSanitizer.ts:96,203`) have **zero production call sites** (only definitions + their test). `POST /api/Studio/furniture/upload` (`route.ts:48-51,75`) stores raw uploaded bytes as `<id>_top.svg` when MIME/filename says SVG, and `GET /api/files/furniture/[filename]` serves them back as `Content-Type: image/svg+xml`. A member can store an SVG that, navigated to directly, loads same-origin scripts (`script-src 'self'` CSP allows it; external-`self` scripts are not nonce-blocked). Upload is member+CSRF+rate-limit gated, so not anonymous — but the sanitizer exists and is unwired. Fix: call `sanitizeSvg` in the upload path, or serve with `Content-Disposition: attachment`, or host on a separate origin. |
| 8.2 | Info (positive) | Request bodies consistently validated (`readJsonBody` rejects non-object JSON; zod in log-error; allowlist validation in customer-queries/manage). No unvalidated-body mutator found. |
| 8.3 | Low | `metrics` route open when `METRICS_AUTH_TOKEN` unset (dev default) but 404s in prod unless explicitly enabled — documented in `.env.example:122-128`. |
| 8.4 | Info (positive) | All 4 server actions guarded (admin: `requireAdminAction()` + rate limit; contact: rate-limited inside `createCustomerQuery`). No unguarded server actions. |
