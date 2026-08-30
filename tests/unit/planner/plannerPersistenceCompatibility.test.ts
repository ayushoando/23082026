import { describe, expect, it } from "vitest";

import { readPlannerProjectEnvelope } from "@planner/lib/plannerProjectRepository";

const geometry = {
  geometry: {
    furniture: [
      {
        id: "desk-1",
        xMm: 1000,
        yMm: 500,
        widthMm: 1200,
        depthMm: 700,
        rotationDeg: 90,
      },
    ],
    walls: [],
    doors: [],
    windows: [],
  },
};

function legacyProject() {
  return {
    schemaVersion: 0,
    id: "project-a",
    user_id: "owner-a",
    name: "Legacy plan",
    revision: 7,
    status: "active",
    geometry,
    sheet: { scale_px_per_mm: 0.2 },
    layers: [],
    thumbnail_url: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
  };
}

// Feature: planner-comprehensive-audit, Task 2.10
// Covers schema normalization and server-owned identity/timestamp preservation.
describe("Planner persistence compatibility boundary", () => {
  it("normalizes known-old explicit geometry using the persisted legacy scale", () => {
    const source = legacyProject();
    const before = JSON.stringify(source);

    const result = readPlannerProjectEnvelope(source, { ownerId: "owner-a" });

    expect(result).toMatchObject({ ok: true, source: "known-old" });
    if (result.ok) {
      expect(result.value).toMatchObject({
        id: "project-a",
        ownerId: "owner-a",
        revision: 7,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
        schemaVersion: 1,
      });
      expect(result.value.geometry.scalePxPerMm).toBe(0.05);
      expect(result.value.geometry.geometry.furniture[0]).toMatchObject({
        xMm: 1000,
        yMm: 500,
        widthMm: 1200,
        depthMm: 700,
        rotationDeg: 90,
      });
    }
    expect(JSON.stringify(source)).toBe(before);
  });

  it("rejects an owner mismatch without replacing the persisted identity", () => {
    const source = legacyProject();
    const before = JSON.stringify(source);

    const result = readPlannerProjectEnvelope(source, { ownerId: "owner-b" });

    expect(result).toMatchObject({
      ok: false,
      code: "INVALID_PROJECT",
      source,
    });
    expect(JSON.stringify(source)).toBe(before);
  });
});
