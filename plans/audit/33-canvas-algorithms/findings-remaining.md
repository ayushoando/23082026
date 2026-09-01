# Remaining — 33-canvas-algorithms
**Date:** 2026-09-01
- High: emit R12-safe DXF (`POLYLINE`/`VERTEX`/`SEQEND`; drop `ELLIPSE`) in `plannerDxfExport.ts`.
- High(-fidelity): fix stale Line endpoints — recompute `x1..y2` together with `left/top` on move (geometry snapshot and DXF export share the root cause).
- Medium: add polygon/signed-area math for non-convex rooms + overlap subtraction in `usedArea`.
- Medium: stop the silent class drop in the geometry snapshot, preserve z-order across kinds, flag non-finite coords instead of coercing to 0.
- Medium: prefer actual `width*scaleX`/`depth*scaleY` over catalog dimensions for persisted furniture size.
- Low: include `lockMovementX/Y` in `PLANNER_FABRIC_OBJECT_PROPS`; persist the full props list at save call sites; rotation-aware DXF export incl. group-local → world coords; guard/relax the `pxPerMm` assert trap; rotated-item AABB edge snapping in `plannerSnapManager`.
