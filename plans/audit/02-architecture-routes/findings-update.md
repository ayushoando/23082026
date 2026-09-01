# Updated findings — Architecture & routes

**Date:** 2026-09-01

## Resolved
- 2.2: Docs drift closed — `docs/architecture/routes.md` now lists the two previously missing `(site)` pages, `/tools/meeting-room-capacity-calculator` and `/tools/office-space-calculator`, verified against disk.
- 2.3: Route-level `error.tsx` added at `site/app/admin/`, `site/app/ooplanner/`, `site/app/oostudio/`; typecheck clean and the route-contract test suite green 9/9.

## Fixed along the way (discovered during remediation)
- None.

## Remaining (failures / open items)
- None for this area. (2.1 is a positive finding needing no action; 2.4 capitalized API namespaces are documented as intentional — no action.)
