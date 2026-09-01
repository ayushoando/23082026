# Updated findings — Component quality & performance

**Date:** 2026-09-01

## Resolved
- None yet. No remediation performed for this area as of 2026-09-01.

## Fixed along the way (discovered during remediation)
- None.

## Remaining (failures / open items)
- 17.1 (High): `Planner.tsx` still 3,387 lines with no local error boundary — open, not started.
- 17.2 (High): ~24-file Planner/Studio parallel fork with no shared core — open, not started.
- 17.3 (Med): no remediation performed under this report; cross-ref — 02-architecture-routes records 2.3 resolved (route-level `error.tsx` added at `app/admin/`, `app/ooplanner/`, `app/oostudio/`), which covers this item's substance.
- 17.4 (Med): leaf UI primitives still `"use client"` wholesale — open, not started.
- 17.5: dead `site/components/home/Hero.tsx` (cross-ref report 05, still open) — open, not started.
- 17.6: mojibake "â€”" in `AboutPageView.tsx:54` — open, not started.
- 17.7 (Med): gsap still statically imported in ~28 route views — open, not started.
- 17.8 (Med): jspdf still statically bundled into workspace first load — open, not started.
- 17.9 (Med): fabric still statically imported in Planner/Studio — open, not started.
- 17.10 (Med): still only 2 `next/dynamic` usages app-wide — open, not started.
- 17.11: info-positive (homepage below-fold dynamic chunks) — no action required.
- 17.12: images still unoptimized in production by default (documented, deliberate COST-S01) — revisit open.
- 17.13: 6 raw `<img>` lazy thumbnails (valid alt text) — low, open, not started.
- 17.14: info-positive (`optimizePackageImports`, `ignoreBuildErrors: false`) — no action required.
