import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  applyPlannerProjectMutation,
  boundedPlannerMutationFingerprint,
  type PlannerProjectAtomicStateV1,
} from "@planner/lib/plannerProjectOperations";
import type { PlannerGeometrySnapshotV1 } from "@planner/lib/plannerGeometryContract";
import {
  PLANNER_REPOSITORY_CONTRACT_VERSION,
  type SavePlannerProjectRequestV1,
} from "@planner/lib/plannerProjectRepository";

const geometry: PlannerGeometrySnapshotV1 = {
  contractVersion: 1,
  schemaVersion: 1,
  unit: "mm",
  scalePxPerMm: 0.05,
  geometry: { furniture: [], walls: [], doors: [], windows: [] },
};
const context = { ownerId: "owner-a", correlationId: "correlation-a" };
function request(
  key: string,
  name: string,
  expectedRevision = 0,
): SavePlannerProjectRequestV1 {
  return {
    contractVersion: PLANNER_REPOSITORY_CONTRACT_VERSION,
    expectedRevision,
    idempotencyKey: key,
    project: {
      id: "project-a",
      name,
      status: "draft",
      geometry,
      sheet: {},
      layers: [],
      thumbnailUrl: null,
    },
  };
}

// Property 20: Idempotent mutation. Authored only; execution is owner-controlled.
describe("Property 20: owner/operation/project-scoped idempotent mutation", () => {
  it("replays identical fingerprints once and conflicts on mismatched reuse", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Za-z0-9]{1,24}$/),
        fc.string({ minLength: 1, maxLength: 20 }),
        (key, suffix) => {
          const empty: PlannerProjectAtomicStateV1 = { project: null, receipts: [] };
          const command = {
            operation: "create" as const,
            projectId: "project-a",
            request: request(key, "Plan"),
          };
          const first = applyPlannerProjectMutation(
            empty,
            context,
            command,
            "2026-01-01T00:00:00.000Z",
          );
          const replay = applyPlannerProjectMutation(
            first.state,
            context,
            command,
            "2026-01-02T00:00:00.000Z",
          );
          expect(first.effect).toBe("created");
          expect(replay.effect).toBe("none");
          expect(replay.result).toMatchObject({ ok: true, replayed: true });
          expect(replay.state).toBe(first.state);

          const mismatch = applyPlannerProjectMutation(
            first.state,
            context,
            {
              ...command,
              request: request(key, `Plan-${suffix}`),
            },
            "2026-01-02T00:00:00.000Z",
          );
          expect(mismatch.effect).toBe("none");
          expect(mismatch.result).toMatchObject({ ok: false, code: "CONFLICT" });
          expect(mismatch.state).toBe(first.state);
        },
      ),
    );
  });

  it("replays save and delete outcomes without a second effect", () => {
    const created = applyPlannerProjectMutation(
      { project: null, receipts: [] },
      context,
      {
        operation: "create",
        projectId: "project-a",
        request: request("shared-key", "Plan"),
      },
      "2026-01-01T00:00:00.000Z",
    );
    const saveCommand = {
      operation: "save" as const,
      projectId: "project-a",
      request: request("shared-key", "Updated", 1),
    };
    const saved = applyPlannerProjectMutation(
      created.state,
      context,
      saveCommand,
      "2026-01-01T00:00:01.000Z",
    );
    expect(saved.effect).toBe("saved");
    expect(saved.result).toMatchObject({ ok: true, value: { revision: 2 } });

    const savedReplay = applyPlannerProjectMutation(
      saved.state,
      context,
      saveCommand,
      "2026-01-02T00:00:00.000Z",
    );
    expect(savedReplay.effect).toBe("none");
    expect(savedReplay.result).toMatchObject({
      ok: true,
      replayed: true,
      value: { revision: 2 },
    });
    expect(savedReplay.state).toBe(saved.state);

    const deleteCommand = {
      operation: "delete" as const,
      projectId: "project-a",
      expectedRevision: 2,
      idempotencyKey: "shared-key",
    };
    const deleted = applyPlannerProjectMutation(
      saved.state,
      context,
      deleteCommand,
      "2026-01-01T00:00:02.000Z",
    );
    expect(deleted.effect).toBe("deleted");
    const deletedReplay = applyPlannerProjectMutation(
      deleted.state,
      context,
      deleteCommand,
      "2026-01-02T00:00:00.000Z",
    );
    expect(deletedReplay.effect).toBe("none");
    expect(deletedReplay.result).toMatchObject({
      ok: true,
      replayed: true,
      value: { id: "project-a", deleted: true },
    });
    expect(deletedReplay.state).toBe(deleted.state);
  });

  it("stores failed outcomes so retries replay the same result", () => {
    const command = {
      operation: "save" as const,
      projectId: "project-a",
      request: request("missing-save", "Plan", 1),
    };
    const first = applyPlannerProjectMutation(
      { project: null, receipts: [] },
      context,
      command,
      "2026-01-01T00:00:00.000Z",
    );
    expect(first.result).toMatchObject({ ok: false, code: "NOT_FOUND" });
    expect(first.state.receipts).toHaveLength(1);

    const replay = applyPlannerProjectMutation(
      first.state,
      context,
      command,
      "2026-01-02T00:00:00.000Z",
    );
    expect(replay.result).toMatchObject({
      ok: false,
      code: "NOT_FOUND",
      replayed: true,
    });
    expect(replay.state).toBe(first.state);

    const otherOwner = applyPlannerProjectMutation(
      first.state,
      { ownerId: "owner-b", correlationId: "correlation-b" },
      command,
      "2026-01-02T00:00:00.000Z",
    );
    expect(otherOwner.result).toMatchObject({ ok: false, code: "NOT_FOUND" });
    expect(otherOwner.result).not.toHaveProperty("replayed");
  });

  it("bounds oversized fingerprints for both persistence adapters", () => {
    const command = {
      operation: "create" as const,
      projectId: "project-a",
      request: request("large-request", "x".repeat(512)),
    };
    const fingerprint = boundedPlannerMutationFingerprint(command);
    expect(fingerprint).toHaveLength(64);
    expect(fingerprint).toMatch(/^[0-9a-f]{64}$/);
  });
});
