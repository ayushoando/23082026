# Updated findings — State management & data flow

**Date:** 2026-09-01

## Resolved
- None yet. No remediation performed for this area as of 2026-09-01.

## Fixed along the way (discovered during remediation)
- None.

## Remaining (failures / open items)
- react-query over-provisioning: `site/app/(site)/providers/QueryProvider.tsx` wraps the whole marketing tree for exactly one consumer (`features/site/catalog/FilterGridInner.tsx`) — drop or extend usage; open, not started.
- No other action items: zustand stores, server actions, forked server stores, and nuqs admin URL-state were verified coherent.
