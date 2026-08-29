import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  PLANNER_GEOMETRY_CONTRACT_VERSION,
  PLANNER_GEOMETRY_SCHEMA_VERSION,
  PLANNER_SCALE_PX_PER_MM,
  readPlannerGeometry,
  type PlannerGeometrySnapshotV1,
} from "@planner/lib/plannerGeometryContract";

const finiteMm = fc.double({ min: -100_000, max: 100_000, noNaN: true, noDefaultInfinity: true });
const nonNegativeMm = fc.double({ min: 0, max: 100_000, noNaN: true, noDefaultInfinity: true });
const id = fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/);
const geometryArbitrary = fc.record({
  furniture: fc.array(
    fc.record({
      id,
      xMm: finiteMm,
      yMm: finiteMm,
      widthMm: nonNegativeMm,
      depthMm: nonNegativeMm,
      rotationDeg: finiteMm,
    }),
    { maxLength: 12 },
  ),
  walls: fc.array(
    fc.record({
      id,
      x1Mm: finiteMm,
      y1Mm: finiteMm,
      x2Mm: finiteMm,
      y2Mm: finiteMm,
      thicknessMm: fc.double({ min: 0.001, max: 10_000, noNaN: true, noDefaultInfinity: true }),
    }),
    { maxLength: 12 },
  ),
  doors: fc.constant([]),
  windows: fc.constant([]),
});

// Property 5: Geometry persistence round trip. Authored for Gate B; execution is owner-controlled.
describe("Property 5: Planner geometry persistence round trip", () => {
  it("preserves normalized millimetres, placement, rotation, and Planner scale", () => {
    fc.assert(
      fc.property(geometryArbitrary, (geometry) => {
        const snapshot: PlannerGeometrySnapshotV1 = {
          contractVersion: PLANNER_GEOMETRY_CONTRACT_VERSION,
          schemaVersion: PLANNER_GEOMETRY_SCHEMA_VERSION,
          unit: "mm",
          scalePxPerMm: PLANNER_SCALE_PX_PER_MM,
          geometry,
        };
        const persisted = JSON.parse(JSON.stringify(snapshot)) as unknown;
        const restored = readPlannerGeometry(persisted);
        expect(restored.ok).toBe(true);
        if (!restored.ok) return;
        expect(restored.value).toEqual(snapshot);
        expect(restored.value.scalePxPerMm).toBe(0.05);
        expect(restored.value.scalePxPerMm).not.toBe(0.2);
      }),
    );
  });

  it("preserves unsupported-scale source and returns an explicit result", () => {
    fc.assert(
      fc.property(geometryArbitrary, (geometry) => {
        const source = { geometry, scale_px_per_mm: 0.2 };
        const restored = readPlannerGeometry(source);
        expect(restored).toMatchObject({
          ok: false,
          code: "UNSUPPORTED_PLANNER_SCALE",
          source,
        });
      }),
    );
  });
});
