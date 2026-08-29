import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { readPlannerProjectEnvelope } from "@planner/lib/plannerProjectRepository";

const ownerId = "owner-a";
const canvas = { version: "7.4.0", objects: [], scale_px_per_mm: 0.05 };
function source(schemaVersion: number | undefined) {
  const normalizedGeometry = {
    contractVersion: 1,
    schemaVersion: 1,
    unit: "mm",
    scalePxPerMm: 0.05,
    geometry: { furniture: [], walls: [], doors: [], windows: [] },
  };
  return {
    ...(schemaVersion === undefined ? {} : { schemaVersion }),
    ...(schemaVersion === 1 ? { contractVersion: 1, geometry: normalizedGeometry } : {}),
    id: "project-a",
    user_id: ownerId,
    name: "Plan",
    revision: 1,
    status: "active",
    canvas_json: canvas,
    sheet: { unit: "mm", scale_px_per_mm: 0.05 },
    layers: [],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

// Property 22: Schema compatibility safety. Authored only; execution is owner-controlled.
describe("Property 22: current/known-old/unsupported schema safety", () => {
  it("validates current, migrates the known-old form in memory, and preserves unsupported sources", () => {
    fc.assert(fc.property(fc.constantFrom<1 | 0 | undefined | number>(1, 0, undefined, 2, 3, 99), (version) => {
      const persisted = source(version);
      const before = JSON.stringify(persisted);
      const result = readPlannerProjectEnvelope(persisted, { ownerId });
      if (version === 1 || version === 0 || version === undefined) {
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.source).toBe(version === 1 ? "current" : "known-old");
          expect(result.value.schemaVersion).toBe(1);
          expect(result.value.geometry.scalePxPerMm).toBe(0.05);
        }
      } else {
        expect(result).toMatchObject({ ok: false, code: "UNSUPPORTED_SCHEMA_VERSION", source: persisted });
      }
      expect(JSON.stringify(persisted)).toBe(before);
    }));
  });
});
