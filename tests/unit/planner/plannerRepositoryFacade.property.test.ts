import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  createPlannerProjectRepository,
  type PlannerProjectAtomicAdapterV1,
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
} satisfies PlannerGeometrySnapshotV1;

function request(key: string): SavePlannerProjectRequestV1 {
  return {
    contractVersion: PLANNER_REPOSITORY_CONTRACT_VERSION,
    expectedRevision: 0,
    idempotencyKey: key,
    project: {
      id: "project-a",
      name: "Plan",
      status: "draft",
      geometry,
      sheet: {},
      layers: [],
      thumbnailUrl: null,
    },
  };
}

// Properties 18–22 facade coherence. Authored only; execution is owner-controlled.
describe("Properties 18–22: live repository facade", () => {
  it("selects one adapter and exposes committed idempotent outcomes", async () => {
    await fc.assert(fc.asyncProperty(fc.stringMatching(/^[A-Za-z0-9]{1,24}$/), async (key) => {
      let state: PlannerProjectAtomicStateV1 = { project: null, receipts: [] };
      let calls = 0;
      const adapter: PlannerProjectAtomicAdapterV1 = {
        mode: "disk",
        async list() { return state.project ? [state.project] : []; },
        async load() { return state.project; },
        async mutate(context, command) {
          calls += 1;
          const { applyPlannerProjectMutation } = await import("@planner/lib/plannerProjectOperations");
          const transition = applyPlannerProjectMutation(state, context, command, "2026-01-01T00:00:00.000Z");
          state = transition.state;
          return transition;
        },
      };
      const forbidden: PlannerProjectAtomicAdapterV1 = {
        mode: "supabase",
        async list() { throw new Error("unexpected adapter"); },
        async load() { throw new Error("unexpected adapter"); },
        async mutate() { throw new Error("unexpected adapter"); },
      };
      const repository = createPlannerProjectRepository(
        { disk: adapter, supabase: forbidden },
        { NODE_ENV: "development", DEV_AUTH_BYPASS: "1" } as NodeJS.ProcessEnv,
      );
      const context = { ownerId: "owner-a", correlationId: "correlation-a" };
      const first = await repository.create(context, request(key));
      const replay = await repository.create(context, request(key));
      expect(first).toMatchObject({ ok: true, value: { revision: 1 } });
      expect(replay).toMatchObject({ ok: true, replayed: true, value: { revision: 1 } });
      expect(calls).toBe(2);
      await expect(repository.list(context)).resolves.toMatchObject({ ok: true, value: [{ id: "project-a" }] });
    }));
  });
});
