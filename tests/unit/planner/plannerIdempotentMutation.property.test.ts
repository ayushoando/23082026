import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { applyPlannerProjectMutation, type PlannerProjectAtomicStateV1 } from "@planner/lib/plannerProjectOperations";
import type { PlannerGeometrySnapshotV1 } from "@planner/lib/plannerGeometryContract";
import { PLANNER_REPOSITORY_CONTRACT_VERSION, type SavePlannerProjectRequestV1 } from "@planner/lib/plannerProjectRepository";

const geometry: PlannerGeometrySnapshotV1 = { contractVersion: 1, schemaVersion: 1, unit: "mm", scalePxPerMm: 0.05, geometry: { furniture: [], walls: [], doors: [], windows: [] } };
const context = { ownerId: "owner-a", correlationId: "correlation-a" };
function request(key: string, name: string): SavePlannerProjectRequestV1 {
  return { contractVersion: PLANNER_REPOSITORY_CONTRACT_VERSION, expectedRevision: 0, idempotencyKey: key, project: { id: "project-a", name, status: "draft", geometry, sheet: {}, layers: [], thumbnailUrl: null } };
}

// Property 20: Idempotent mutation. Authored only; execution is owner-controlled.
describe("Property 20: owner/operation/project-scoped idempotent mutation", () => {
  it("replays identical fingerprints once and conflicts on mismatched reuse", () => {
    fc.assert(fc.property(fc.stringMatching(/^[A-Za-z0-9]{1,24}$/), fc.string({ minLength: 1, maxLength: 20 }), (key, suffix) => {
      const empty: PlannerProjectAtomicStateV1 = { project: null, receipts: [] };
      const command = { operation: "create" as const, projectId: "project-a", request: request(key, "Plan") };
      const first = applyPlannerProjectMutation(empty, context, command, "2026-01-01T00:00:00.000Z");
      const replay = applyPlannerProjectMutation(first.state, context, command, "2026-01-02T00:00:00.000Z");
      expect(first.effect).toBe("created");
      expect(replay.effect).toBe("none");
      expect(replay.result).toMatchObject({ ok: true, replayed: true });
      expect(replay.state).toBe(first.state);

      const mismatch = applyPlannerProjectMutation(first.state, context, { ...command, request: request(key, `Plan-${suffix}`) }, "2026-01-02T00:00:00.000Z");
      expect(mismatch.effect).toBe("none");
      expect(mismatch.result).toMatchObject({ ok: false, code: "CONFLICT" });
      expect(mismatch.state).toBe(first.state);
    }));
  });
});
