# Updated findings — Workers & edge (`workers/oando-worker-proxy`)

**Date:** 2026-09-01

## Resolved
- None yet. No remediation performed for this area as of 2026-09-01.

## Fixed along the way (discovered during remediation)
- None.

## Remaining (failures / open items)
- 12.1 (Medium): hardcoded origin in `wrangler.toml:12` + fallback in `src/index.js:188` — open, not started.
- 12.2 (Medium): seating SKU→material slug sets and `/images/` remap still embedded in worker code (`src/index.js:76-95,127-137`) — open, not started.
- 12.3: stale `compatibility_date = "2024-01-01"`, no `[env.production]`/routes config — open, not started.
- 12.6: npm `package-lock.json` in pnpm repo + wrangler version skew — open, not started.
- 12.4 / 12.5: info-positive/informational (R2-first caching, HSTS, security.txt contact disclosure) — no action required.
