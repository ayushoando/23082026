# Plan — Security: Secrets & Env

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Move the secret scanner into CI and complete the declared-env contract; no hardcoded secrets exist today.

## Actions (prioritized)
1. **Medium** Add `scan:secrets` (`scripts/general/scan_secrets.mjs`) to `release:gate:fast` in `.github/workflows/release-gate.yml` — CI regression protection for committed secrets is currently absent (it runs only via local `pnpm run check:launch`).
2. **Low** Declare the ad-hoc `process.env` reads in the `site/lib/env.server.ts` schema: `RESEND_API_KEY`, `METRICS_AUTH_TOKEN`, `SITE_MAINTENANCE_MODE`, `CUSTOMER_QUERIES_ADMIN_TOKEN(S)`, `E2E_*`, `VERCEL_TOKEN`; collapse the `CLOULD_ACCESS_KEY_ID`/`CLOOUDFLARE_*` typo-alias chain (`env.server.ts:80-107`) once declared.
3. **Low (naming)** Rename `NEXT_ADMIN_SUPABASE_ANON_KEY` / `NEXT_ADMIN_PUBLISHABLE_KEY` — "ADMIN" invites misuse of public-by-design keys; update `.env.example:86-87` and all consumers.

## Verification
- `pnpm run scan:secrets`, `pnpm run typecheck`, `pnpm run test`, `pnpm run gate:fast` — gate runs require owner authorization.
