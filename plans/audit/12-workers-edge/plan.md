# Plan — Workers & Edge (`workers/oando-worker-proxy`)

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Remove hardcoded origin/catalog knowledge from the edge worker and bring its runtime/config up to date, preserving the verified R2-first caching and security headers.

## Actions (prioritized)
1. **Medium** De-hardcode the origin: `workers/oando-worker-proxy/wrangler.toml:12` (`VERCEL_ORIGIN = "https://oando1408.vercel.app"`) and the second fallback in `workers/oando-worker-proxy/src/index.js:188` — move to a wrangler var/secret indirection so a Vercel project rename doesn't silently break production (note: `oando1408` itself is owner-off-limits; only the indirection changes).
2. **Medium** Move product data out of worker code: seating SKU→material slug sets (`workers/oando-worker-proxy/src/index.js:76-95`) and the `/images/` path remap (`src/index.js:127-137`) belong in config/KV/R2 metadata so catalog changes don't require edge deploys.
3. **Med(-low)** Update `workers/oando-worker-proxy/wrangler.toml`: bump `compatibility_date` from `2024-01-01` (2+ years behind wrangler 4.x), add `[env.production]` and document the dashboard-bound routes/custom-domain config.
4. **Low** Resolve the npm lockfile/version skew: `workers/oando-worker-proxy/package-lock.json` inside a pnpm repo; align wrangler `^4.123.0` with root `^4.127.1`.

## Verification
- `pnpm run worker:dev` (smoke), `pnpm run worker:deploy --dry-run`, then `pnpm run worker:tail` post-deploy — deploy/tail require owner authorization.
