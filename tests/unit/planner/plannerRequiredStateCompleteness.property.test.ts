// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 8: Required state completeness
//
// **Validates: Requirements 5.1, 5.5**

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  ALL_WORKFLOW_IDS,
  clearObsoleteErrorOnRetry,
  getApplicableStateKinds,
  getPlannerRequiredState,
  type PlannerRequiredState,
  type PlannerRequiredStateKind,
  type PlannerWorkflowId,
} from "@planner/lib/plannerWorkflowState";

const PROPERTY_RUNS = 120;
const PROPERTY_SEED = 8_202_608;

interface WorkflowStateApplicabilitySet {
  readonly workflow: PlannerWorkflowId;
  readonly applicableKinds: readonly PlannerRequiredStateKind[];
}

/**
 * Generate workflow applicability sets from the live typed state contract.
 * Each generated workflow carries its complete applicable state set so the
 * property exercises the contract's own workflow/state boundary without
 * duplicating a second hand-maintained applicability list in the test.
 */
const workflowStateApplicabilitySetArbitrary: fc.Arbitrary<
  readonly WorkflowStateApplicabilitySet[]
> = fc
  .uniqueArray(fc.constantFrom<PlannerWorkflowId>(...ALL_WORKFLOW_IDS), {
    minLength: 1,
    maxLength: ALL_WORKFLOW_IDS.length,
  })
  .map((workflows) =>
    workflows.map((workflow) => ({
      workflow,
      applicableKinds: getApplicableStateKinds(workflow),
    })),
  );

const RECOVERABLE_STATE_KINDS = new Set<PlannerRequiredStateKind>([
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

function presentationFingerprint(state: PlannerRequiredState): string {
  return [state.heading.trim(), state.message.trim()].join("\u0000");
}

function statusFingerprint(state: PlannerRequiredState): string {
  return [
    state.accessible.role,
    state.accessible.busy,
    state.accessible.live,
    state.accessible.label.trim(),
  ].join("\u0000");
}

function focusFingerprint(state: PlannerRequiredState): string {
  const target = state.focusTarget;
  if (target.kind === "heading" || target.kind === "primary-action") {
    return [target.kind, target.selector.trim()].join("\u0000");
  }
  return target.kind;
}

function recoveryFingerprint(state: PlannerRequiredState): string {
  return JSON.stringify({
    clearOnRetrySuccess: state.clearOnRetrySuccess,
    actions: state.actions.map(({ id, label, primary }) => ({
      id,
      label,
      primary,
    })),
  });
}

function assertStateMapping(
  workflow: PlannerWorkflowId,
  kind: PlannerRequiredStateKind,
  state: PlannerRequiredState,
  presentations: Set<string>,
  statuses: Set<string>,
  mappings: Set<string>,
): void {
  expect(state.kind, `${workflow}/${kind} kind`).toBe(kind);
  expect(state.heading.trim(), `${workflow}/${kind} heading`).not.toBe("");
  expect(state.message.trim(), `${workflow}/${kind} message`).not.toBe("");

  const presentation = presentationFingerprint(state);
  expect(
    presentations.has(presentation),
    `${workflow}/${kind} presentation must be distinct`,
  ).toBe(false);
  presentations.add(presentation);

  const { accessible } = state;
  expect(["status", "alert", "none"], `${workflow}/${kind} role`).toContain(
    accessible.role,
  );
  expect(["idle", "busy"], `${workflow}/${kind} busy state`).toContain(
    accessible.busy,
  );
  expect(["off", "polite", "assertive"], `${workflow}/${kind} live region`).toContain(
    accessible.live,
  );
  expect(accessible.label.trim(), `${workflow}/${kind} status label`).not.toBe("");

  const status = statusFingerprint(state);
  expect(
    statuses.has(status),
    `${workflow}/${kind} accessible status must be distinct`,
  ).toBe(false);
  statuses.add(status);

  const focus = focusFingerprint(state);
  expect(focus, `${workflow}/${kind} focus mapping`).not.toBe("");
  if (state.focusTarget.kind === "heading" || state.focusTarget.kind === "primary-action") {
    expect(state.focusTarget.selector.trim(), `${workflow}/${kind} focus selector`).not.toBe("");
  }
  if (kind === "validation-error") {
    expect(state.focusTarget.kind, `${workflow}/${kind} focus target`).toBe(
      "first-invalid-field",
    );
  }

  const actionIds = state.actions.map((action) => action.id);
  expect(new Set(actionIds).size, `${workflow}/${kind} action ids`).toBe(
    actionIds.length,
  );
  expect(
    state.actions.filter((action) => action.primary).length,
    `${workflow}/${kind} primary action count`,
  ).toBeLessThanOrEqual(1);
  for (const action of state.actions) {
    expect(action.id.trim(), `${workflow}/${kind} action id`).not.toBe("");
    expect(action.label.trim(), `${workflow}/${kind} action label`).not.toBe("");
  }

  if (kind === "loading") {
    expect(accessible.role, `${workflow}/loading role`).toBe("status");
    expect(accessible.busy, `${workflow}/loading busy state`).toBe("busy");
  }
  if (RECOVERABLE_STATE_KINDS.has(kind)) {
    expect(state.actions.length, `${workflow}/${kind} recovery actions`).toBeGreaterThan(0);
  }

  const firstRecovery = clearObsoleteErrorOnRetry(workflow, kind);
  const secondRecovery = clearObsoleteErrorOnRetry(workflow, kind);
  expect(
    secondRecovery ? recoveryFingerprint(secondRecovery) : null,
    `${workflow}/${kind} recovery mapping must be deterministic`,
  ).toBe(firstRecovery ? recoveryFingerprint(firstRecovery) : null);
  if (state.clearOnRetrySuccess) {
    expect(firstRecovery, `${workflow}/${kind} should clear after retry`).not.toBeNull();
  } else {
    expect(firstRecovery, `${workflow}/${kind} should require explicit recovery`).toBeNull();
  }

  const mapping = [presentation, status, focus, recoveryFingerprint(state)].join("\u0000");
  expect(
    mappings.has(mapping),
    `${workflow}/${kind} state mapping must be distinct`,
  ).toBe(false);
  mappings.add(mapping);
}

describe("Feature: planner-comprehensive-audit, Property 8: Required state completeness", () => {
  it("maps every generated workflow/state applicability set to distinct presentation and status with deterministic focus and recovery behavior", () => {
    fc.assert(
      fc.property(workflowStateApplicabilitySetArbitrary, (applicabilitySets) => {
        for (const { workflow, applicableKinds } of applicabilitySets) {
          expect(applicableKinds.length, `${workflow} applicability`).toBeGreaterThan(0);
          expect(
            new Set(applicableKinds).size,
            `${workflow} applicability must not duplicate states`,
          ).toBe(applicableKinds.length);

          const presentations = new Set<string>();
          const statuses = new Set<string>();
          const mappings = new Set<string>();
          for (const kind of applicableKinds) {
            const state = getPlannerRequiredState(workflow, kind);
            if (!state) throw new Error(`Missing ${workflow}/${kind}`);
            assertStateMapping(
              workflow,
              kind,
              state,
              presentations,
              statuses,
              mappings,
            );
          }

          expect(presentations.size, `${workflow} presentations`).toBe(applicableKinds.length);
          expect(statuses.size, `${workflow} accessible statuses`).toBe(applicableKinds.length);
          expect(mappings.size, `${workflow} complete mappings`).toBe(applicableKinds.length);
        }
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED, endOnFailure: true },
    );
  });
});
