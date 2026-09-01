# Updated findings — i18n

**Date:** 2026-09-01

## Resolved
- None yet. No remediation performed for this area as of 2026-09-01.

## Fixed along the way (discovered during remediation)
- None.

## Remaining (failures / open items)
- 15.1 (Med): per-locale `solutions.deliveryMedia.src` drift (hi serves DMRC photo where en serves about-bright hero) — open, not started.
- 15.2 (Med): Planner/Studio workspace trees still hardcode user-facing English (18/193 components on next-intl; `workspace` namespace near-unused) — open, not started.
- 15.3: hardcoded `aria-label="Planner access status"` (`PlannerEntry.tsx:27`) — open, not started.
- 15.4: `site/i18n/pending-translations/` deferred backlog still in-tree — open, not started.
