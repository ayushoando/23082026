# Remaining — Component quality & performance
**Date:** 2026-09-02

- **17.1 (file-size facet, High):** `Planner.tsx` is still 3,274 lines (re-measured 2026-09-02; 3,387 at audit time — a prior session trimmed ~113 lines). The local error boundary half is fixed (see findings-resolved.md); splitting the component remains open and is the same program as 17.2 (shared core extraction) — one more single-file split would just grow the fork.
- **17.2 (High):** ~24-file Planner/Studio parallel fork with no shared core — open, program-level refactor (needs a shared package decision + typecheck availability; central typecheck is prohibited this session).
- **17.3 (Med):** covered by route-level `error.tsx` at `app/admin/`, `app/ooplanner/`, `app/oostudio/` per report 02 (2.3 resolved) — no separate action under this report.
- **17.4 (Med):** leaf UI primitives still `"use client"` wholesale — open; removing client-ness requires hydration/bundle verification (build runs prohibited this session).
- **17.5 (Low):** dead `site/components/home/Hero.tsx` — being resolved under report 05 (deletion + baseline-entry removal) in this same session; see `plans/audit/05-dead-code/`.
- **17.7 / 17.8 / 17.9 / 17.10 (Med):** gsap (~28 route views), jspdf, fabric static imports and the app-wide `next/dynamic` deficit — open; every remediation path (dynamic imports, entry refactors) is only verifiable via production builds, which are prohibited this session.
- **17.11 / 17.14:** info-positive — no action required.
- **17.12 (Low):** images unoptimized in production (`unoptimized: true` under `VERCEL_ENV === "production"`, COST-S01) — documented, deliberate; revisit open with the owner.
- **17.13 (Low):** 6 raw `<img>` lazy thumbnails with valid alt text — open; conversion to `next/image` needs build verification (prohibited).
- **New (Low, observed 2026-09-02 during 17.6):** double-encoded mojibake in `site/focss/admin/` CSS comments (`shell.css`, `primitives.css`, `pages.css`, `crm.css` — e.g. `Ã¢â‚¬â€"` for em-dash, `Ã¢â€°Â¥` for ≥) and single-encoded box-drawing artifacts in `primitives.css:436`. Comments only, zero runtime effect; fixing needs one careful multi-form sweep across the admin focss zone (verify:focss + check:style-tokens re-run after) — queued behind the session's higher-severity items, recorded here so it is not lost.
