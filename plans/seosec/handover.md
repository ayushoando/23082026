# Handover — SEO & Security Audit Plan

**Date:** 2026-09-01 · **Status:** ✅ Closed — critical corrections applied; deferred items owner-gated
**Owner:** Repository owner

## Completed tasks

- **Critical correction:** SEC-C01/SEC-C02 closed as **false positives** — the audit missed that Next 16 renames `middleware.ts` to `proxy.ts`. `site/proxy.ts` already implements path-based auth defense (`isProtectedPath()`) and full CSP with per-request nonces (`buildContentSecurityPolicy()`); 54 `tests/unit/proxy.test.ts` cases pass.
- **SEC-R03** — `enforcePublicApiRateLimit` (60/min) added to `site/app/api/files/catalog/[...path]/route.ts` (other file routes already had `withAuth` + limits).
- **SEC-R04** — `METRICS_AUTH_TOKEN` bearer gate (timing-safe) on `site/app/api/metrics/route.ts`; documented in `.env.example`.
- **SEC-R05** — `isAllowedBrowserOrigin()` fails closed on missing Origin/Referer in production (injectable `env` param); production-mode test added.
- Deployment env note: `METRICS_AUTH_TOKEN` must be set in the deployment environment (present in `.env.example`).

## Verification evidence

- `pnpm exec vitest run tests/unit/lib/security/requestOrigin.test.ts tests/unit/proxy.test.ts` — **60/60 pass**.
- `tests/unit/proxy.test.ts` (54 tests) green in the 2026-09-01 full-suite run; `gate:fast` incl. `check:governance` green.
- `scan:secrets` clean (2026-09-01).

## Files modified

`site/app/api/files/catalog/[...path]/route.ts` · `site/app/api/metrics/route.ts` · `.env.example` · `site/lib/security/requestOrigin.ts` · `tests/unit/lib/security/requestOrigin.test.ts` · this plan's report/remedy docs (corrections + fix status).

## Deferred (owner-gated, not executed)

- **SEO-R01–R09** — require Google Search Console export access (indexing crisis: 31/198 indexed; 59 pages 404; Jun 6–9 drop needs root-cause).
- **SEC-R06** CORS policy — needs cross-origin consumer decision.
- **SEC-R07** deprecate static admin token — needs external consumer migration.
- **SEC-R08** tracking route anon key + RLS — needs a new migration (rollback + grants/policies per runbook).
- **SEC-R09** upload content-length pre-check — small, still pending.

## Ownership confirmation

- Only the three fix paths + their test/docs touched; deferred items untouched.
