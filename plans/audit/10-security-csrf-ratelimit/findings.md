# 10 — Security: CSRF & Rate Limiting

## CSRF

- **`site/lib/security/csrf.ts`**: double-submit cookie pattern, `crypto.timingSafeEqual` with length pre-check (lines 32–39); cookie `HttpOnly`, `secure` in prod, `sameSite=strict`, 24 h. Token minted by `GET /api/csrf` (rate-limited 60/min, `no-store`).
- **`withAuth`** applies `requireCsrf` on POST/PUT/PATCH/DELETE (skipped under dev bypass — `withAuth.ts:231-247`) and always rate-limits per-IP + scope **before** auth work (lines 226–228). Rejection sets `x-csrf-rejected` so `browserApiFetch` can retry.
- **`enforceAdminMutationGuard`** (`api/admin/_lib/server.ts:47-64`): rate limit → admin auth → CSRF.
- Skipped-by-design routes (`CSRF_OPTIONAL` in the audit script): `tracking`, `log-error`, `customer-queries` (public form + honeypot), `nav-search` — compensated by `enforcePublicApiRateLimit` (verified in `log-error/route.ts:24`, `csrf/route.ts:7`, `theme/active/route.ts:22`).

## Rate limiting

**`site/lib/rateLimit.ts`**: in-memory Map (10k-key cap) by default; distributed Supabase backend when service-role env present; **AI-scoped keys fail closed in production** without a distributed backend (lines 84–103); other keys fail open to per-instance memory on backend errors (lines 120–128).

## Findings

| # | Severity | Finding |
|---|----------|---------|
| 10.1 | Low | Non-AI routes fall back to **per-instance in-memory** rate limiting in serverless when the distributed backend is unavailable/fails (fail-open, `rateLimit.ts:127`). On multi-instance prod this weakens brute-force/abuse protection for e.g. `customer-queries`, `log-error`. |
| 10.2 | Info (positive) | Every mutator outside the documented public set enforces CSRF (audit, customer-queries/manage PATCH, admin, Studio/Planner, exports, theme/manage). Timing-safe compares used in both CSRF and metrics-token paths. |
