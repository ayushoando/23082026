import { describe, expect, it } from "vitest";
import {
  PLANNER_GEOMETRY_CONTRACT_VERSION,
  PLANNER_GEOMETRY_SCHEMA_VERSION,
  PLANNER_SCALE_PX_PER_MM,
  STUDIO_SCALE_PX_PER_MM,
  readPlannerGeometry,
  rescaleGeometry,
  type PlannerGeometrySnapshotV1,
} from "@planner/lib/plannerGeometryContract";
import {
  serializePlannerGeometry,
  deserializePlannerGeometry,
} from "@/lib/Planner/plannerFabricSerialize";
import { readPlannerProjectEnvelope } from "@planner/lib/plannerProjectRepository";

/**
 * Task 2.3 — Serialization/deserialization scale integrity.
 * Validates: Requirements 3.3, 3.5, 4.3, 13.7, 13.8.
 */

const sampleGeometry = {
  furniture: [
    {
      id: "desk-1",
      xMm: 1000,
      yMm: 2000,
      widthMm: 1200,
      depthMm: 800,
      rotationDeg: 45,
      catalogId: "cat-desk",
      label: "Executive Desk",
    },
  ],
  walls: [
    { id: "wall-1", x1Mm: 0, y1Mm: 0, x2Mm: 5000, y2Mm: 0, thicknessMm: 150 },
  ],
  doors: [
    { id: "door-1", kind: "door" as const, xMm: 2500, yMm: 0, widthMm: 900, depthMm: 150, rotationDeg: 0 },
  ],
  windows: [],
};

describe("Serialization round trip (Task 2.3)", () => {
  describe("Requirement 3.3: Planner scale in serialization/deserialization", () => {
    it("serializes geometry with explicit Planner scale metadata", () => {
      const snapshot = serializePlannerGeometry([], { version: "test" });
      expect(snapshot.scalePxPerMm).toBe(PLANNER_SCALE_PX_PER_MM);
      expect(snapshot.unit).toBe("mm");
      expect(snapshot.contractVersion).toBe(PLANNER_GEOMETRY_CONTRACT_VERSION);
      expect(snapshot.schemaVersion).toBe(PLANNER_GEOMETRY_SCHEMA_VERSION);
    });

    it("deserializes and validates Planner scale metadata", () => {
      const snapshot: PlannerGeometrySnapshotV1 = {
        contractVersion: PLANNER_GEOMETRY_CONTRACT_VERSION,
        schemaVersion: PLANNER_GEOMETRY_SCHEMA_VERSION,
        unit: "mm",
        scalePxPerMm: PLANNER_SCALE_PX_PER_MM,
        geometry: sampleGeometry,
      };
      const result = deserializePlannerGeometry(snapshot);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.scalePxPerMm).toBe(0.05);
      expect(result.source).toBe("current");
    });
  });

  describe("Requirement 3.5: preserve physical dimensions without Studio scale", () => {
    it("round-trips current-version geometry preserving all physical values", () => {
      const snapshot: PlannerGeometrySnapshotV1 = {
        contractVersion: PLANNER_GEOMETRY_CONTRACT_VERSION,
        schemaVersion: PLANNER_GEOMETRY_SCHEMA_VERSION,
        unit: "mm",
        scalePxPerMm: PLANNER_SCALE_PX_PER_MM,
        geometry: sampleGeometry,
      };
      const persisted = JSON.parse(JSON.stringify(snapshot)) as unknown;
      const restored = readPlannerGeometry(persisted);
      expect(restored.ok).toBe(true);
      if (!restored.ok) return;
      expect(restored.value.geometry.furniture[0].xMm).toBe(1000);
      expect(restored.value.geometry.furniture[0].yMm).toBe(2000);
      expect(restored.value.geometry.furniture[0].widthMm).toBe(1200);
      expect(restored.value.geometry.furniture[0].depthMm).toBe(800);
      expect(restored.value.geometry.furniture[0].rotationDeg).toBe(45);
      expect(restored.value.geometry.walls[0].x1Mm).toBe(0);
      expect(restored.value.geometry.walls[0].x2Mm).toBe(5000);
      expect(restored.value.geometry.walls[0].thicknessMm).toBe(150);
    });

    it("preserves catalogId and label through round trip", () => {
      const snapshot: PlannerGeometrySnapshotV1 = {
        contractVersion: PLANNER_GEOMETRY_CONTRACT_VERSION,
        schemaVersion: PLANNER_GEOMETRY_SCHEMA_VERSION,
        unit: "mm",
        scalePxPerMm: PLANNER_SCALE_PX_PER_MM,
        geometry: sampleGeometry,
      };
      const persisted = JSON.parse(JSON.stringify(snapshot)) as unknown;
      const restored = readPlannerGeometry(persisted);
      expect(restored.ok).toBe(true);
      if (!restored.ok) return;
      expect(restored.value.geometry.furniture[0].catalogId).toBe("cat-desk");
      expect(restored.value.geometry.furniture[0].label).toBe("Executive Desk");
    });
  });

  describe("Requirement 13.7: unsupported schema version preserves source", () => {
    it("returns UNSUPPORTED_GEOMETRY_VERSION for unknown contract version", () => {
      const result = readPlannerGeometry({
        contractVersion: 99,
        schemaVersion: 1,
        unit: "mm",
        scalePxPerMm: 0.05,
        geometry: sampleGeometry,
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe("UNSUPPORTED_GEOMETRY_VERSION");
    });

    it("returns UNSUPPORTED_GEOMETRY_VERSION for unknown schema version", () => {
      const result = readPlannerGeometry({
        contractVersion: 1,
        schemaVersion: 99,
        unit: "mm",
        scalePxPerMm: 0.05,
        geometry: sampleGeometry,
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe("UNSUPPORTED_GEOMETRY_VERSION");
    });
  });

  describe("Requirement 13.8: Planner scale geometry without lossy conversion", () => {
    it("deterministically adapts legacy Studio 0.2 scale by re-tagging mm values", () => {
      const legacyInput = {
        scalePxPerMm: STUDIO_SCALE_PX_PER_MM,
        geometry: sampleGeometry,
      };
      const result = readPlannerGeometry(legacyInput);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.source).toBe("legacy");
      expect(result.value.scalePxPerMm).toBe(0.05);
      // Mm values pass through unchanged — they are already correct mm.
      expect(result.value.geometry.furniture[0].xMm).toBe(1000);
      expect(result.value.geometry.furniture[0].yMm).toBe(2000);
      expect(result.value.geometry.furniture[0].widthMm).toBe(1200);
      expect(result.value.geometry.furniture[0].depthMm).toBe(800);
      // Rotation is scale-independent
      expect(result.value.geometry.furniture[0].rotationDeg).toBe(45);
    });

    it("rejects unknown scale (0.3 px/mm) with explicit error", () => {
      const result = readPlannerGeometry({
        scalePxPerMm: 0.3,
        geometry: sampleGeometry,
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe("UNSUPPORTED_PLANNER_SCALE");
    });

    it("never silently applies Studio scale to Planner geometry", () => {
      const result = readPlannerGeometry({
        scalePxPerMm: 0.05,
        geometry: sampleGeometry,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      // Values should be unchanged — no scaling applied
      expect(result.value.geometry.furniture[0].xMm).toBe(1000);
      expect(result.value.geometry.furniture[0].widthMm).toBe(1200);
    });
  });

  describe("Requirement 4.3: load restores persisted geometry", () => {
    it("readPlannerProjectEnvelope restores current-version geometry", () => {
      const project = {
        contractVersion: 1,
        schemaVersion: 1,
        id: "proj-1",
        user_id: "owner-a",
        name: "Test Plan",
        revision: 1,
        status: "active",
        geometry: {
          contractVersion: 1,
          schemaVersion: 1,
          unit: "mm",
          scalePxPerMm: 0.05,
          geometry: sampleGeometry,
        },
        sheet: {},
        layers: [],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      };
      const result = readPlannerProjectEnvelope(project, { ownerId: "owner-a" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.geometry.scalePxPerMm).toBe(0.05);
      expect(result.value.geometry.geometry.furniture[0].xMm).toBe(1000);
      expect(result.value.geometry.geometry.furniture[0].rotationDeg).toBe(45);
    });

    it("readPlannerProjectEnvelope adapts legacy canvas_json with Studio scale", () => {
      const project = {
        id: "proj-legacy",
        user_id: "owner-a",
        name: "Legacy Plan",
        revision: 1,
        status: "active",
        canvas_json: {
          version: "6.0.0",
          scale_px_per_mm: STUDIO_SCALE_PX_PER_MM,
          objects: [
            {
              left: 200,
              top: 400,
              width: 240,
              height: 160,
              scaleX: 1,
              scaleY: 1,
              angle: 45,
              data: { kind: "furniture", id: "desk-1", dimensions: { width_mm: 1200, depth_mm: 800 } },
            },
          ],
        },
        sheet: { unit: "mm", scale_px_per_mm: STUDIO_SCALE_PX_PER_MM },
        layers: [],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      };
      const result = readPlannerProjectEnvelope(project, { ownerId: "owner-a" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.source).toBe("known-old");
      expect(result.value.geometry.scalePxPerMm).toBe(PLANNER_SCALE_PX_PER_MM);
      // Furniture with explicit dimensions: widthMm and depthMm come from
      // data.dimensions (already in mm), so they are preserved as-is when
      // collectSceneGeometryAtScale extracts them.
      expect(result.value.geometry.geometry.furniture[0].widthMm).toBe(1200);
      expect(result.value.geometry.geometry.furniture[0].depthMm).toBe(800);
      expect(result.value.geometry.geometry.furniture[0].rotationDeg).toBe(45);
    });

    it("rejects a legacy canvas with explicit invalid scale metadata", () => {
      const project = {
        id: "proj-invalid-scale",
        user_id: "owner-a",
        name: "Invalid Scale",
        revision: 1,
        status: "active",
        canvas_json: { scale_px_per_mm: 0, objects: [] },
        sheet: {},
        layers: [],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      };

      const result = readPlannerProjectEnvelope(project, { ownerId: "owner-a" });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe("UNSUPPORTED_GEOMETRY");
      expect(result.geometryResult).toMatchObject({
        ok: false,
        code: "UNSUPPORTED_PLANNER_SCALE",
      });
      expect(result.source).toBe(project);
    });
  });

  describe("rescaleGeometry (utility for raw px→mm correction)", () => {
    it("scales position and size by factor but not rotation", () => {
      const adapted = rescaleGeometry(sampleGeometry, STUDIO_SCALE_PX_PER_MM);
      const factor = STUDIO_SCALE_PX_PER_MM / PLANNER_SCALE_PX_PER_MM;
      expect(adapted.furniture[0].rotationDeg).toBe(45);
      expect(adapted.furniture[0].xMm).toBe(1000 * factor);
      expect(adapted.doors[0].rotationDeg).toBe(0);
      expect(adapted.doors[0].widthMm).toBe(900 * factor);
    });

    it("preserves id and optional fields through rescaling", () => {
      const adapted = rescaleGeometry(sampleGeometry, STUDIO_SCALE_PX_PER_MM);
      expect(adapted.furniture[0].id).toBe("desk-1");
      expect(adapted.furniture[0].catalogId).toBe("cat-desk");
      expect(adapted.furniture[0].label).toBe("Executive Desk");
      expect(adapted.walls[0].id).toBe("wall-1");
      expect(adapted.doors[0].id).toBe("door-1");
      expect(adapted.doors[0].kind).toBe("door");
    });
  });
});
