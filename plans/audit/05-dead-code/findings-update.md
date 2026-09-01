# Updated findings — Dead code & orphaned modules

**Date:** 2026-09-01

## Resolved
- None yet. No remediation performed for this area as of 2026-09-01.

## Fixed along the way (discovered during remediation)
- None.

## Remaining (failures / open items)
- 5.1: `site/components/pwa/ServiceWorkerRegister.tsx` — zero importers and registers a nonexistent `/sw.js` — open, not started (user-confirmed deletion required).
- 5.2: `site/components/home/Hero.tsx` (204 lines) orphaned, still carried in the style-token baseline — open, not started.
- 5.3: `site/lib/images/optimizerMode.ts` tested-but-unwired drift risk — open, not started.
