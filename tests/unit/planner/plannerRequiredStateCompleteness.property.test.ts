// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 8: Required state completeness
//
// **Validates: Requirements 5.1, 5.5**

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  ALL_WORKFLOW_IDS,
  getApplicableStateKinds,
  getPlannerRequiredState,
  type PlannerRequiredStateKind,
  type PlannerWorkflowId,
} from "@planner/lib/plannerWorkflowState";

const PROPERTY_RUNS = 120;

interface RequiredStatePair {
  readonly workflow: PlannerWorkflowId;
  readonly kind: PlannerRequiredStateKind;
}

const applicablePairs: readonly RequiredStatePair[] = ALL_WORKFLOW_IDS.flatMap(
  (workflow) =>
    getApplicableStateKinds(workflow).map((kind) => ({ workflow, kind })),
);

const ERROR_STATE_KINDS = new Set<PlannerRequiredStateKind>([
  "validation-error",
  "server-error",
  "unauthenticated",
  "forbidden",
  "rate-limited",
  "conflict",
  "stale",
  "offline",
  "recovery",
]);

describe("Feature: planner-comprehensive-audit, Property 8: Required state completeness", () => {
  it("provides a distinct presentable, accessible, focused, and deterministic mapping for every applicable workflow state", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...applicablePairs),
        ({ workflow, kind }) => {
          const state = getPlannerRequiredState(workflow, kind);
          if (!state) throw new Error(`Missing ${workflow}/${kind}`);

          expect(state.kind).toBe(kind);
          expect(state.heading.trim()).not.toBe("");
          expect(state.message.trim()).not.toBe("");
          expect(state.accessible.label.trim()).not.toBe("");
          expect(["status", "alert", "none"]).toContain(state.accessible.role);
          expect(["idle", "busy"]).toContain(state.accessible.busy);
          expect(["off", "polite", "assertive"]).toContain(state.accessible.live);
          expect(["heading", "primary-action", "first-invalid-field", "none"])
            .toContain(state.focusTarget.kind);

          const actionIds = state.actions.map((action) => action.id);
          expect(new Set(actionIds).size).toBe(actionIds.length);
          expect(state.actions.filter((action) => action.primary)).toHaveLength(
            state.actions.some((action) => action.primary) ? 1 : 0,
          );

          if (kind === "loading") {
            expect(state.accessible.busy).toBe("busy");
            expect(state.accessible.role).toBe("status");
          }
          if (ERROR_STATE_KINDS.has(kind)) {
            expect(state.memoryRule).toBe("preserve");
            expect(state.actions.length).toBeGreaterThan(0);
          }
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: 8_202_608, endOnFailure: true },
    );
  });

  it("keeps every state presentation distinct within each generated workflow", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_WORKFLOW_IDS), (workflow) => {
        const presentations = getApplicableStateKinds(workflow).map((kind) => {
          const state = getPlannerRequiredState(workflow, kind);
          if (!state) throw new Error(`Missing ${workflow}/${kind}`);
          return `${state.kind}\u0000${state.heading}\u0000${state.message}\u0000${state.accessible.label}`;
        });
        expect(new Set(presentations).size).toBe(presentations.length);
      }),
      { numRuns: PROPERTY_RUNS, seed: 8_202_609, endOnFailure: true },
    );
  });
});
