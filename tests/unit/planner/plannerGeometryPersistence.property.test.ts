import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  PLANNER_GEOMETRY_CONTRACT_VERSION,
  PLANNER_GEOMETRY_SCHEMA_VERSION,
  PLANNER_SCALE_PX_PER_MM,
  STUDIO_SCALE_PX_PER_MM,
  readPlannerGeometry,
  type PlannerGeometrySnapshotV1,
} from "@planner/lib/plannerGeometryContract";
import {
  serializePlannerGeometry,
  deserializePlannerGeometry,
} from "@/lib/Planner/plannerFabricSerialize";
import type {
  PlannerMmRect,
  PlannerMmWall,
  PlannerMmOpening,
  PlannerSceneGeometry,
  FabricLikeObject,
} from "@planner/lib/fabricGeometryBridge";

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const finiteMm = fc.double({
  min: -100_000,
  max: 100_000,
  noNaN: true,
  noDefaultInfinity: true,
});

const nonNegativeMm = fc.double({
  min: 0,
  max: 100_000,
  noNaN: true,
  noDefaultInfinity: true,
});

const positiveThickness = fc.double({
  min: 0.001,
  max: 10_000,
  noNaN: true,
  noDefaultInfinity: true,
});

const rotationDeg = fc.double({
  min: -360,
  max: 360,
  noNaN: true,
  noDefaultInfinity: true,
});

const id = fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/);

const furnitureArb: fc.Arbitrary<PlannerMmRect> = fc.record({
  id,
  xMm: finiteMm,
  yMm: finiteMm,
  widthMm: nonNegativeMm,
  depthMm: nonNegativeMm,
  rotationDeg,
});

const wallArb: fc.Arbitrary<PlannerMmWall> = fc.record({
  id,
  x1Mm: finiteMm,
  y1Mm: finiteMm,
  x2Mm: finiteMm,
  y2Mm: finiteMm,
  thicknessMm: positiveThickness,
});

const doorArb: fc.Arbitrary<PlannerMmOpening> = fc.record({
  id,
  kind: fc.constant("door" as const),
  xMm: finiteMm,
  yMm: finiteMm,
  widthMm: nonNegativeMm,
  depthMm: nonNegativeMm,
  rotationDeg,
});

const windowArb: fc.Arbitrary<PlannerMmOpening> = fc.record({
  id,
  kind: fc.constant("window" as const),
  xMm: finiteMm,
  yMm: finiteMm,
  widthMm: nonNegativeMm,
  depthMm: nonNegativeMm,
  rotationDeg,
});

const geometryArbitrary: fc.Arbitrary<PlannerSceneGeometry> = fc.record({
  furniture: fc.array(furnitureArb, { maxLength: 8 }),
  walls: fc.array(wallArb, { maxLength: 6 }),
  doors: fc.array(doorArb, { maxLength: 4 }),
  windows: fc.array(windowArb, { maxLength: 4 }),
});

/** Optional canvas snapshot — arbitrary opaque JSON-safe record. */
const canvasSnapshotArb = fc.oneof(
  fc.constant(undefined),
  fc.record({
    version: fc.constant("7.0.0"),
    objects: fc.array(fc.record({ type: fc.constant("rect") }), { maxLength: 3 }),
  }),
);

const NUM_RUNS = 150;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal array of FabricLikeObjects from a PlannerSceneGeometry
 * so we can feed it to serializePlannerGeometry, which calls
 * collectSceneGeometry internally.
 */
function geometryToFabricObjects(
  geometry: PlannerSceneGeometry,
): FabricLikeObject[] {
  const objects: FabricLikeObject[] = [];

  for (const item of geometry.furniture) {
    objects.push({
      left: item.xMm * PLANNER_SCALE_PX_PER_MM,
      top: item.yMm * PLANNER_SCALE_PX_PER_MM,
      width: item.widthMm * PLANNER_SCALE_PX_PER_MM,
      height: item.depthMm * PLANNER_SCALE_PX_PER_MM,
      scaleX: 1,
      scaleY: 1,
      angle: item.rotationDeg,
      data: {
        kind: "furniture",
        id: item.id,
        dimensions: { width_mm: item.widthMm, depth_mm: item.depthMm },
      },
    });
  }

  for (const wall of geometry.walls) {
    objects.push({
      x1: wall.x1Mm * PLANNER_SCALE_PX_PER_MM,
      y1: wall.y1Mm * PLANNER_SCALE_PX_PER_MM,
      x2: wall.x2Mm * PLANNER_SCALE_PX_PER_MM,
      y2: wall.y2Mm * PLANNER_SCALE_PX_PER_MM,
      strokeWidth: wall.thicknessMm * PLANNER_SCALE_PX_PER_MM,
      data: { kind: "wall", id: wall.id },
    });
  }

  for (const door of geometry.doors) {
    objects.push({
      left: door.xMm * PLANNER_SCALE_PX_PER_MM,
      top: door.yMm * PLANNER_SCALE_PX_PER_MM,
      width: door.widthMm * PLANNER_SCALE_PX_PER_MM,
      height: door.depthMm * PLANNER_SCALE_PX_PER_MM,
      scaleX: 1,
      scaleY: 1,
      angle: door.rotationDeg,
      data: { kind: "door", id: door.id },
    });
  }

  for (const win of geometry.windows) {
    objects.push({
      left: win.xMm * PLANNER_SCALE_PX_PER_MM,
      top: win.yMm * PLANNER_SCALE_PX_PER_MM,
      width: win.widthMm * PLANNER_SCALE_PX_PER_MM,
      height: win.depthMm * PLANNER_SCALE_PX_PER_MM,
      scaleX: 1,
      scaleY: 1,
      angle: win.rotationDeg,
      data: { kind: "window", id: win.id },
    });
  }

  return objects;
}

/**
 * Compare two PlannerSceneGeometry values for physical equivalence within
 * IEEE 754 JSON round-trip tolerance.
 *
 * We compare each numeric field with a tolerance that accounts for the
 * double multiply-divide round trip through the Planner scale (0.05) during
 * Fabric pixel conversion. The tolerance is generous enough to pass all
 * representable doubles in range but tight enough to detect lossy scale
 * application (e.g. accidental 0.2 px/mm).
 */
function expectGeometryClose(
  actual: PlannerSceneGeometry,
  expected: PlannerSceneGeometry,
): void {
  // Same array lengths
  expect(actual.furniture).toHaveLength(expected.furniture.length);
  expect(actual.walls).toHaveLength(expected.walls.length);
  expect(actual.doors).toHaveLength(expected.doors.length);
  expect(actual.windows).toHaveLength(expected.windows.length);

  // Furniture — dimensions come from data.dimensions (exact mm), position
  // and rotation go through px round trip.
  for (let i = 0; i < expected.furniture.length; i++) {
    const a = actual.furniture[i];
    const e = expected.furniture[i];
    expect(a.id).toBe(e.id);
    expect(a.xMm).toBeCloseTo(e.xMm, 6);
    expect(a.yMm).toBeCloseTo(e.yMm, 6);
    // widthMm and depthMm are taken from data.dimensions (exact)
    expect(a.widthMm).toBe(e.widthMm);
    expect(a.depthMm).toBe(e.depthMm);
    expect(a.rotationDeg).toBeCloseTo(e.rotationDeg, 6);
  }

  // Walls
  for (let i = 0; i < expected.walls.length; i++) {
    const a = actual.walls[i];
    const e = expected.walls[i];
    expect(a.id).toBe(e.id);
    expect(a.x1Mm).toBeCloseTo(e.x1Mm, 6);
    expect(a.y1Mm).toBeCloseTo(e.y1Mm, 6);
    expect(a.x2Mm).toBeCloseTo(e.x2Mm, 6);
    expect(a.y2Mm).toBeCloseTo(e.y2Mm, 6);
    // Wall thickness goes through px→mm, may have small fp noise
    expect(a.thicknessMm).toBeCloseTo(
      Math.max(1, e.thicknessMm),
      6,
    );
  }

  // Doors
  for (let i = 0; i < expected.doors.length; i++) {
    const a = actual.doors[i];
    const e = expected.doors[i];
    expect(a.id).toBe(e.id);
    expect(a.kind).toBe("door");
    expect(a.xMm).toBeCloseTo(e.xMm, 6);
    expect(a.yMm).toBeCloseTo(e.yMm, 6);
    expect(a.widthMm).toBeCloseTo(e.widthMm, 6);
    expect(a.depthMm).toBeCloseTo(e.depthMm, 6);
    expect(a.rotationDeg).toBeCloseTo(e.rotationDeg, 6);
  }

  // Windows
  for (let i = 0; i < expected.windows.length; i++) {
    const a = actual.windows[i];
    const e = expected.windows[i];
    expect(a.id).toBe(e.id);
    expect(a.kind).toBe("window");
    expect(a.xMm).toBeCloseTo(e.xMm, 6);
    expect(a.yMm).toBeCloseTo(e.yMm, 6);
    expect(a.widthMm).toBeCloseTo(e.widthMm, 6);
    expect(a.depthMm).toBeCloseTo(e.depthMm, 6);
    expect(a.rotationDeg).toBeCloseTo(e.rotationDeg, 6);
  }
}

// ---------------------------------------------------------------------------
// Property 5: Geometry persistence round trip
// ---------------------------------------------------------------------------

/**
 * Feature: planner-comprehensive-audit, Property 5: Geometry persistence round trip
 *
 * Generate valid geometry and verify serialize-save-load-deserialize preserves
 * physical state and never applies `0.2 px/mm` or lossy conversion.
 * At least 100 generated cases.
 *
 * **Validates: Requirements 3.5, 4.3, 13.8**
 */
describe("Feature: planner-comprehensive-audit, Property 5: Geometry persistence round trip", () => {
  it("serialize → JSON persist → deserialize preserves physical dimensions, placement, rotation, and Planner scale", () => {
    /**
     * Validates: Requirements 3.5, 4.3, 13.8
     *
     * Full round trip through the production serialize/deserialize boundary:
     *   1. Generate valid PlannerSceneGeometry with furniture, walls, doors, windows
     *   2. Convert to Fabric-like objects and call serializePlannerGeometry
     *   3. Simulate persistence via JSON.stringify / JSON.parse
     *   4. Call deserializePlannerGeometry to read the stored snapshot
     *   5. Verify physical dimensions, placement, rotation, and Planner scale
     */
    fc.assert(
      fc.property(
        geometryArbitrary,
        canvasSnapshotArb,
        (geometry, canvasSnapshot) => {
          // Step 1: Build Fabric-like objects from the generated geometry
          const fabricObjects = geometryToFabricObjects(geometry);

          // Step 2: Serialize through the production function
          const snapshot = serializePlannerGeometry(
            fabricObjects,
            canvasSnapshot,
          );

          // Verify serialize produces correct Planner metadata
          expect(snapshot.scalePxPerMm).toBe(PLANNER_SCALE_PX_PER_MM);
          expect(snapshot.scalePxPerMm).not.toBe(STUDIO_SCALE_PX_PER_MM);
          expect(snapshot.unit).toBe("mm");
          expect(snapshot.contractVersion).toBe(
            PLANNER_GEOMETRY_CONTRACT_VERSION,
          );
          expect(snapshot.schemaVersion).toBe(
            PLANNER_GEOMETRY_SCHEMA_VERSION,
          );

          // Step 3: Simulate persistence (JSON round trip)
          const persisted = JSON.parse(
            JSON.stringify(snapshot),
          ) as unknown;

          // Step 4: Deserialize through the production function
          const restored = deserializePlannerGeometry(persisted);

          // Step 5: Verify round-trip integrity
          expect(restored.ok).toBe(true);
          if (!restored.ok) return;

          expect(restored.value.scalePxPerMm).toBe(PLANNER_SCALE_PX_PER_MM);
          expect(restored.value.scalePxPerMm).not.toBe(0.2);
          expect(restored.value.unit).toBe("mm");
          expect(restored.source).toBe("current");

          // Physical geometry preserved
          expectGeometryClose(restored.value.geometry, snapshot.geometry);

          // Canvas snapshot preserved when present
          if (canvasSnapshot !== undefined) {
            expect(restored.value.canvasSnapshot).toBeDefined();
            expect(restored.value.canvasSnapshot).toEqual(
              JSON.parse(JSON.stringify(canvasSnapshot)),
            );
          }
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it("normalized mm snapshot round trips exactly through JSON persistence and readPlannerGeometry", () => {
    /**
     * Validates: Requirements 3.5, 13.8
     *
     * Direct snapshot creation → JSON → readPlannerGeometry round trip.
     * This tests the persistence boundary when the normalized mm geometry
     * is stored directly (e.g. by the project repository adapter).
     */
    fc.assert(
      fc.property(geometryArbitrary, (geometry) => {
        const snapshot: PlannerGeometrySnapshotV1 = {
          contractVersion: PLANNER_GEOMETRY_CONTRACT_VERSION,
          schemaVersion: PLANNER_GEOMETRY_SCHEMA_VERSION,
          unit: "mm",
          scalePxPerMm: PLANNER_SCALE_PX_PER_MM,
          geometry,
        };

        // JSON round trip normalizes -0 to 0; use JSON-normalized as baseline
        const persisted = JSON.parse(JSON.stringify(snapshot)) as unknown;
        const normalized = JSON.parse(
          JSON.stringify(snapshot),
        ) as PlannerGeometrySnapshotV1;

        const restored = readPlannerGeometry(persisted);
        expect(restored.ok).toBe(true);
        if (!restored.ok) return;

        expect(restored.value).toEqual(normalized);
        expect(restored.value.scalePxPerMm).toBe(0.05);
        expect(restored.value.scalePxPerMm).not.toBe(0.2);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("deterministically adapts known legacy Studio scale (0.2 px/mm) geometry without lossy conversion", () => {
    /**
     * Validates: Requirements 3.5, 13.8
     *
     * Legacy snapshots stored with the Studio scale (0.2 px/mm) contain mm
     * values that are already physically correct (extracted as px / 0.2).
     * readPlannerGeometry re-tags them with Planner scale without rescaling,
     * preserving every physical dimension and rotation.
     */
    fc.assert(
      fc.property(geometryArbitrary, (geometry) => {
        const source = { geometry, scalePxPerMm: STUDIO_SCALE_PX_PER_MM };
        const restored = readPlannerGeometry(source);

        expect(restored.ok).toBe(true);
        if (!restored.ok) return;

        expect(restored.source).toBe("legacy");
        expect(restored.value.scalePxPerMm).toBe(PLANNER_SCALE_PX_PER_MM);
        expect(restored.value.unit).toBe("mm");

        // Mm values are already correct (extracted at legacy scale).
        // readPlannerGeometry re-tags with Planner scale without rescaling.
        geometry.furniture.forEach((item, i) => {
          const adapted = restored.value.geometry.furniture[i];
          expect(adapted.xMm).toBe(item.xMm);
          expect(adapted.yMm).toBe(item.yMm);
          expect(adapted.widthMm).toBe(item.widthMm);
          expect(adapted.depthMm).toBe(item.depthMm);
          expect(adapted.rotationDeg).toBe(item.rotationDeg);
        });

        geometry.walls.forEach((wall, i) => {
          const adapted = restored.value.geometry.walls[i];
          expect(adapted.x1Mm).toBe(wall.x1Mm);
          expect(adapted.y1Mm).toBe(wall.y1Mm);
          expect(adapted.x2Mm).toBe(wall.x2Mm);
          expect(adapted.y2Mm).toBe(wall.y2Mm);
          expect(adapted.thicknessMm).toBe(wall.thicknessMm);
        });

        geometry.doors.forEach((door, i) => {
          const adapted = restored.value.geometry.doors[i];
          expect(adapted.id).toBe(door.id);
          expect(adapted.kind).toBe("door");
          expect(adapted.xMm).toBe(door.xMm);
          expect(adapted.yMm).toBe(door.yMm);
          expect(adapted.widthMm).toBe(door.widthMm);
          expect(adapted.depthMm).toBe(door.depthMm);
          expect(adapted.rotationDeg).toBe(door.rotationDeg);
        });

        geometry.windows.forEach((win, i) => {
          const adapted = restored.value.geometry.windows[i];
          expect(adapted.id).toBe(win.id);
          expect(adapted.kind).toBe("window");
          expect(adapted.xMm).toBe(win.xMm);
          expect(adapted.yMm).toBe(win.yMm);
          expect(adapted.widthMm).toBe(win.widthMm);
          expect(adapted.depthMm).toBe(win.depthMm);
          expect(adapted.rotationDeg).toBe(win.rotationDeg);
        });
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("returns explicit UNSUPPORTED_PLANNER_SCALE for unknown scales — never silently applies 0.2 px/mm", () => {
    /**
     * Validates: Requirements 3.5, 13.8
     *
     * Any scale that is neither the Planner canonical scale (0.05) nor a
     * known legacy scale (0.2) must be explicitly rejected. The system must
     * never silently adopt the Studio scale.
     */
    const unknownScale = fc
      .double({
        min: 0.001,
        max: 10,
        noNaN: true,
        noDefaultInfinity: true,
      })
      .filter(
        (s) =>
          s !== PLANNER_SCALE_PX_PER_MM && s !== STUDIO_SCALE_PX_PER_MM,
      );

    fc.assert(
      fc.property(
        fc.tuple(geometryArbitrary, unknownScale),
        ([geometry, scale]) => {
          const source = { geometry, scalePxPerMm: scale };
          const restored = readPlannerGeometry(source);

          expect(restored).toMatchObject({
            ok: false,
            code: "UNSUPPORTED_PLANNER_SCALE",
            source,
          });
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it("serialized geometry never contains Studio scale 0.2 px/mm in metadata", () => {
    /**
     * Validates: Requirements 3.5, 13.8
     *
     * Regardless of input geometry, the serialize function must always emit
     * Planner scale (0.05) and never Studio scale (0.2).
     */
    fc.assert(
      fc.property(geometryArbitrary, (geometry) => {
        const fabricObjects = geometryToFabricObjects(geometry);
        const snapshot = serializePlannerGeometry(fabricObjects);
        const json = JSON.stringify(snapshot);
        const parsed = JSON.parse(json) as Record<string, unknown>;

        expect(parsed.scalePxPerMm).toBe(0.05);
        expect(parsed.scalePxPerMm).not.toBe(0.2);
        expect(parsed.unit).toBe("mm");
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
