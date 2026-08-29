import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { applyPlannerProjectMutation, type PlannerProjectAtomicStateV1 } from "@planner/lib/plannerProjectOperations";
import type { PlannerProjectEnvelopeV1 } from "@planner/lib/plannerProjectRepository";

const geometry = { contractVersion: 1, schemaVersion: 1, unit: "mm", scalePxPerMm: 0.05, geometry: { furniture: [], walls: [], doors: [], windows: [] } } as const;
const context = { ownerId: "owner-a", correlationId: "correlation-a" };
function project(revision: number): PlannerProjectEnvelopeV1 {
  return { contractVersion: 1, schemaVersion: 1, id: "project-a", ownerId: context.ownerId, name: "Plan", revision, status: "active", geometry, sheet: {}, layers: [], thumbnailUrl: null, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
}

// Property 21: Delete unavailability. Authored only; execution is owner-controlled.
describe("Property 21: deterministic delete unavailability", () => {
  it("removes the owned record and deterministically replays the delete result", () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 10_000 }), (revision) => {
      const state: PlannerProjectAtomicStateV1 = { project: project(revision), receipts: [] };
      const command = { operation: "delete" as const, projectId: "project-a", expectedRevision: revision, idempotencyKey: `delete-${revision}` };
      const deleted = applyPlannerProjectMutation(state, context, command, "2026-02-01T00:00:00.000Z");
      expect(deleted.effect).toBe("deleted");
      expect(deleted.state.project).toBeNull();
      expect(deleted.result).toEqual({ ok: true, value: { id: "project-a", deleted: true } });
      const replay = applyPlannerProjectMutation(deleted.state, context, command, "2026-02-02T00:00:00.000Z");
      expect(replay.effect).toBe("none");
      expect(replay.result).toMatchObject({ ok: true, replayed: true, value: { id: "project-a", deleted: true } });
    }));
  });
});
