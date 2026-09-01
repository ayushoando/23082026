# Updated findings — Security: secrets & env

**Date:** 2026-09-01

## Resolved
- None yet. No remediation performed for this area as of 2026-09-01.

## Fixed along the way (discovered during remediation)
- None.

## Remaining (failures / open items)
- 9.1 (Medium): `scan:secrets` still absent from `release:gate:fast` in `.github/workflows/release-gate.yml` — CI secret regression protection still absent — open, not started.
- 9.2: ad-hoc `process.env` reads (`RESEND_API_KEY`, `METRICS_AUTH_TOKEN`, `SITE_MAINTENANCE_MODE`, `CUSTOMER_QUERIES_ADMIN_TOKEN(S)`, `E2E_*`, `VERCEL_TOKEN`) still undeclared in `env.server.ts`; typo-alias chain remains — open, not started.
- 9.3: `NEXT_ADMIN_SUPABASE_ANON_KEY` / `NEXT_ADMIN_PUBLISHABLE_KEY` naming invites misuse — open, not started.
