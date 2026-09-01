# Updated findings — Security: API routes

**Date:** 2026-09-01

## Resolved
- None yet. No remediation performed for this area as of 2026-09-01.

## Fixed along the way (discovered during remediation)
- None.

## Remaining (failures / open items)
- 8.1 (Medium): SVG sanitizer still dead code on the upload path — `sanitizeSvg`/`isSvgSafe` have zero production call sites while `POST /api/Studio/furniture/upload` stores raw SVG served back as `image/svg+xml` — open, not started.
- 8.3 (Low): metrics route open when `METRICS_AUTH_TOKEN` unset (dev default; prod-hidden unless enabled) — warning log / env declaration still pending — open, not started.
- 8.2 / 8.4: info-positive (body validation, guarded server actions) — no action required.
