# Plan — Security: API Routes

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Wire the existing SVG sanitizer into the upload/serve path (the one real stored-XSS vector); all 59 routes are otherwise gated and stay as-is.

## Actions (prioritized)
1. **Medium** Close the stored-XSS vector: `sanitizeSvg`/`isSvgSafe` (`site/lib/security/svgSanitizer.ts:96,203`) have zero production call sites while `site/app/api/Studio/furniture/upload/route.ts:48-51,75` stores raw uploaded SVG and `site/app/api/files/furniture/[filename]/route.ts` serves it back as `image/svg+xml` (member-gated, but `script-src 'self'` CSP permits same-origin scripts). Call `sanitizeSvg` in the upload path, and/or set `Content-Disposition: attachment` on SVG responses, and/or host uploads on a separate origin.
2. **Low** Keep the metrics route posture but document/enforce it: `site/app/api/metrics/route.ts` is open when `METRICS_AUTH_TOKEN` is unset (dev default) and prod-hidden unless `OBSERVABILITY_METRICS_ENABLED=1` (`.env.example:122-128`) — add a warning log or declare the var in `site/lib/env.server.ts`.

## Verification
- `node scripts/general/audit-api-route-safety.mjs` (via `pnpm run gate:fast` / `release:gate:core`), `pnpm run typecheck`, `pnpm run test` — gate runs require owner authorization.
