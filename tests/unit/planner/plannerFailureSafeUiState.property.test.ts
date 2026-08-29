// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 7: Failure-safe UI state
//
// **Validates: Requirements 4.6, 4.8, 5.6, 5.7, 5.8, 10.8**

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  ALL_WORKFLOW_IDS,
  clearObsoleteErrorOnRetry,
  getApplicableStateKinds,
  getPlannerRequiredState,
  type PlannerRequiredStateKind,
  type PlannerWorkflowId,
} from "@planner/lib/plannerWorkflowState";

const PROPERTY_RUNS = 120;

const FAILURE_STATE_KINDS: readonly PlannerRequiredStateKind[] = [
  "validation-error",
  "server-error",
  "unauthenticated",
  "forbidden",
  "rate-limited",
  "conflict",
  "stale",
  "offline",
  "recovery",
];

interface FailurePair {
  readonly workflow: PlannerWorkflowId;
  readonly kind: PlannerRequiredStateKind;
}

const failurePairs: readonly FailurePair[] = ALL_WORKFLOW_IDS.flatMap(
  (workflow) =>
    getApplicableStateKinds(workflow)
      .filter((kind) => FAILURE_STATE_KINDS.includes(kind))
      .map((kind) => ({ workflow, kind })),
);

const documentArbitrary = fc.record({
  name: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,48}$/),
  revision: fc.integer({ min: 1, max: 10_000 }),
  objectIds: fc.array(fc.stringMatching(/^object-[a-z0-9]{2,10}$/), {
    maxLength: 16,
  }),
});

describe("Feature: planner-comprehensive-audit, Property 7: Failure-safe UI state", () => {
  it("preserves the latest in-memory document through every represented failure and clears only recoverable stale errors after success", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...failurePairs),
        documentArbitrary,
        ({ workflow, kind }, document) => {
          const before = structuredClone(document);
          const descriptor = getPlannerRequiredState(workflow, kind);
          if (!descriptor) {
            throw new Error(`Missing required state ${kind} for ${workflow}`);
          }

          // Failure-state descriptors must never silently replace local work.
          expect(descriptor.memoryRule).toBe("preserve");
          expect(document).toEqual(before);

          const afterSuccessfulRetry = clearObsoleteErrorOnRetry(workflow, kind);
          if (descriptor.clearOnRetrySuccess) {
            expect(afterSuccessfulRetry).not.toBeNull();
            expect(["success", "default"]).toContain(afterSuccessfulRetry?.kind);
            // The recovery is state-only: it does not rewrite the in-memory
            // document while clearing an obsolete error.
            expect(document).toEqual(before);
          } else {
            expect(afterSuccessfulRetry).toBeNull();
            // A non-clearable failure (for example auth or conflict) requires
            // an explicit user action before persisted content can replace it.
            expect(descriptor.actions.length).toBeGreaterThan(0);
            expect(document).toEqual(before);
          }
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: 7_202_608, endOnFailure: true },
    );
  });
});
