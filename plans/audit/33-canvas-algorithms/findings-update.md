# Updated findings — 33-canvas-algorithms

**Date:** 2026-09-01

## Resolved
- Evidence collected 2026-09-01 (static audit of fabric serialize, geometry bridge, snap, DXF export, room-area math): verdict — snap math clean (zoom/grid/rotation sound; only cosmetic rotated-anchor nit); the only genuinely invalid output is the DXF R12 entity-set violation (`LWPOLYLINE`/`ELLIPSE` emitted under an R12 header — strict R12 importers reject/drop every wall/polygon/furniture outline); the highest-fidelity bug is stale Fabric `Line.x1..y2` shared by the Gate-B geometry snapshot and the DXF line export (moved walls persist/export at their original position); the requested signed-area/non-convex-room check resolves to "the math doesn't exist" (rooms are `width×height` rectangles everywhere; `usedArea` ignores overlaps); remaining items are valid-but-imprecise fidelity gaps (lock-prop asymmetry, save path `["data"]`-only, silent class drop + z-order split, catalog-vs-scaled dimensions, DXF rotation/groups/scale, scale-param trap).

## Fixed along the way (discovered during remediation)
- none (read-only static audit; no code changes)

## Remaining (failures / open items)
- High: emit R12-safe DXF (`POLYLINE`/`VERTEX`/`SEQEND`; drop `ELLIPSE`) in `plannerDxfExport.ts`.
- High(-fidelity): fix stale Line endpoints — recompute `x1..y2` together with `left/top` on move (geometry snapshot and DXF export share the root cause).
- Medium: add polygon/signed-area math for non-convex rooms + overlap subtraction in `usedArea`.
- Medium: stop the silent class drop in the geometry snapshot, preserve z-order across kinds, flag non-finite coords instead of coercing to 0.
- Medium: prefer actual `width*scaleX`/`depth*scaleY` over catalog dimensions for persisted furniture size.
- Low: include `lockMovementX/Y` in `PLANNER_FABRIC_OBJECT_PROPS`; persist the full props list at save call sites; rotation-aware DXF export incl. group-local → world coords; guard/relax the `pxPerMm` assert trap; rotated-item AABB edge snapping in `plannerSnapManager`.
