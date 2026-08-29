import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { applyPlannerProjectMutation, type PlannerProjectAtomicStateV1 } from "@planner/lib/plannerProjectOperations";
import { PLANNER_REPOSITORY_CONTRACT_VERSION, type PlannerProjectEnvelopeV1, type SavePlannerProjectRequestV1 } from "@planner/lib/plannerProjectRepository";

const geometry = { contractVersion: 1, schemaVersion: 1, unit: "mm", scalePxPerMm: 0.05, geometry: { furniture: [], walls: [], doors: [], windows: [] } } as const;
const context = { ownerId: "owner-a", correlationId: "correlation-a" };
function project(revision: number): PlannerProjectEnvelopeV1 {
  return { contractVersion: 1, schemaVersion: 1, id: "project-a", ownerId: context.ownerId, name: "Plan", revision, status: "active", geometry, sheet: {}, layers: [], thumbnailUrl: null, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
}
function request(expectedRevision: number): SavePlannerProjectRequestV1 {
  return { contractVersion: PLANNER_REPOSITORY_CONTRACT_VERSION, expectedRevision, idempotencyKey: `save-${expectedRevision}`, project: { id: "project-a", name: "Updated", status: "active", geometry, sheet: {}, layers: [], thumbnailUrl: null } };
}

// Property 19: Revision compare-and-swap. Authored only; execution is owner-controlled.
describe("Property 19: revision compare-and-swap", () => {
  it("increments once only for the current revision and leaves stale state unchanged", () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 10_000 }), fc.boolean(), (revision, currentRequest) => {
      const state: PlannerProjectAtomicStateV1 = { project: project(revision), receipts: [] };
      const expected = currentRequest ? revision : Math.max(0, revision - 1);
      const transition = applyPlannerProjectMutation(state, context, { operation: "save", projectId: "project-a", request: request(expected) }, "2026-02-01T00:00:00.000Z");
      if (currentRequest) {
        expect(transition.effect).toBe("saved");
        expect(transition.state.project?.revision).toBe(revision + 1);
        expect(transition.state.project?.createdAt).toBe(state.project?.createdAt);
        expect(transition.state.project?.updatedAt).toBe("2026-02-01T00:00:00.000Z");
      } else {
        expect(transition.effect).toBe("none");
        expect(transition.state).toBe(state);
        expect(transition.result).toMatchObject({ ok: false, code: "CONFLICT", currentRevision: revision });
      }
    }));
  });
});
