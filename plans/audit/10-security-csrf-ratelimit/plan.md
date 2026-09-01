# Plan — Security: CSRF & Rate Limiting

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Harden the one fail-open rate-limit fallback; CSRF coverage (double-submit, timing-safe, audit-enforced) is complete and stays untouched.

## Actions (prioritized)
1. **Low** Address the fail-open fallback in `site/lib/rateLimit.ts:120-128` — non-AI routes degrade to per-instance in-memory limiting on multi-instance serverless when the distributed Supabase backend is unavailable. Fail closed for sensitive public scopes (`customer-queries`, `log-error`, `tracking`, `nav-search`) or document the accepted residual risk per scope.

## Verification
- `pnpm run test`, `pnpm run gate:fast` (per-method CSRF + rate-limit checks via `scripts/general/audit-api-route-safety.mjs`) — gate runs require owner authorization.
