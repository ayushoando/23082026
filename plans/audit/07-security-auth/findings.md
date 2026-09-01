# 07 — Security: Auth

## Guards verified

- **`site/lib/auth/devAuthBypass.ts`** — bypass requires **two** conditions: `DEV_AUTH_BYPASS === "1"` **and** `NODE_ENV !== "production"` (lines 40–49). Production unconditionally returns `false`. Synthetic user is a fixed admin UUID (`DEV_BYPASS_USER`, line 25).
- **`site/lib/auth/session.ts`** — `getOptionalUser()` honors bypass, otherwise `supabase.auth.getUser()`; `requireAuthUser()` redirects unauthenticated users and enforces role gates (`admin` surface requires `owner` role, lines 103–111).
- **`site/lib/auth/roles.ts`** — role resolved **only** from `app_metadata` (server-set); `user_metadata` deliberately ignored (client-writable). Correct.
- **`site/proxy.ts`** (Next 16 edge):
  - `/dashboard`, `/portal`, `/admin` protected via cookie-existence check + real session validation in layouts (`getOptionalUser()`).
  - Member-only write APIs (`/api/plans`, `/api/admin`, `/api/customer-queries/manage`, `/api/theme/manage`, `/api/exports` + segment list) 403-rejected at the edge for unauthenticated callers — defense-in-depth behind `withAuth`.
  - Server actions blocked on guest product shells.
  - Security headers on every response: CSP with per-request nonce, HSTS preload, X-Frame-Options, COOP/CORP, Permissions-Policy. `strict-dynamic` deliberately omitted with rationale.
  - Maintenance mode fails closed: all API mutations 503 except `/api/log-error`.
- **Page-level gates:** `app/admin/layout.tsx:29` → `requireAuthUser("/admin", "admin")`; `features/Studio/layout.tsx:22` → `requireAuthUser("/oostudio", "admin")`. `/ooplanner` is a guest surface by design (guest pass cookie never unlocks protected paths, `proxy.ts:124`).
- **API admin gate:** `app/api/admin/_lib/server.ts` — `requireAdminSession()` / `enforceAdminMutationGuard()` wrap `resolveAuthContext("admin")` + CSRF + rate limit.

## Findings

| # | Severity | Finding |
|---|----------|---------|
| 7.1 | Low | `DEV_AUTH_BYPASS` cannot activate when `NODE_ENV=production`, but any **non-production** deployment (staging container, `next dev` exposed on a network) with the flag set gets full admin bypass as a fixed admin user. No allowed-host guard. |
| 7.2 | Low | `.env.example:90` ships `DEV_AUTH_BYPASS=1` as template default — copying verbatim to a non-prod host re-creates the above posture. |
| 7.3 | Info (positive) | `/api/dev/auth-bypass-status` 404s in production and returns no secrets. No missing auth found on admin/oostudio/ooplanner server routes; all `/api/admin/*` carry auth markers. |
