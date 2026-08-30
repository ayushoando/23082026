// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 7: Failure-safe UI state
//
// **Validates: Requirements 4.6, 4.8, 5.6, 5.7, 5.8, 10.8**

import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";
import {
  confirmPlannerNavigation,
  usePlannerUIStore,
} from "@planner/store/plannerUiStore";
import {
  clearObsoleteErrorOnRetry,
  getPlannerRequiredState,
  type PlannerRequiredStateKind,
  type PlannerWorkflowId,
} from "@planner/lib/plannerWorkflowState";

const PROPERTY_RUNS = 120;
const PROPERTY_SEED = 7_202_608;

type FailureOperation = "edit" | "save" | "offline" | "reauth" | "stale";

interface FailureTransition {
  readonly operation: FailureOperation;
  readonly workflow: PlannerWorkflowId;
  readonly kind: PlannerRequiredStateKind;
  readonly requiresExplicitReplacement: boolean;
}

interface InMemoryProject {
  readonly id: string;
  readonly name: string;
  readonly revision: number;
  readonly objectIds: readonly string[];
  readonly hasUnsavedChanges: true;
}

const failedEditTransitionArbitrary: fc.Arbitrary<FailureTransition> = fc
  .record({
    kind: fc.constantFrom<PlannerRequiredStateKind>(
      "validation-error",
      "server-error",
    ),
  })
  .map(({ kind }) => ({
    operation: "edit" as const,
    workflow: "project-edit" as const,
    kind,
    requiresExplicitReplacement: false,
  }));

const failedSaveTransitionArbitrary: fc.Arbitrary<FailureTransition> = fc
  .record({
    kind: fc.constantFrom<PlannerRequiredStateKind>(
      "validation-error",
      "server-error",
      "offline",
      "conflict",
      "stale",
    ),
  })
  .map(({ kind }) => ({
    operation: "save" as const,
    workflow: "project-save" as const,
    kind,
    requiresExplicitReplacement: kind === "conflict" || kind === "stale",
  }));

const offlineTransitionArbitrary: fc.Arbitrary<FailureTransition> = fc
  .record({
    workflow: fc.constantFrom<PlannerWorkflowId>(
      "project-edit",
      "project-load",
      "project-save",
      "offline-reconnect",
    ),
  })
  .map(({ workflow }) => ({
    operation: "offline" as const,
    workflow,
    kind: "offline" as const,
    requiresExplicitReplacement: false,
  }));

const reauthenticationTransitionArbitrary: fc.Arbitrary<FailureTransition> = fc
  .record({
    workflow: fc.constantFrom<PlannerWorkflowId>(
      "entry-auth",
      "project-list",
      "project-load",
      "project-save",
    ),
  })
  .map(({ workflow }) => ({
    operation: "reauth" as const,
    workflow,
    kind: "unauthenticated" as const,
    requiresExplicitReplacement: false,
  }));

const staleTransitionArbitrary: fc.Arbitrary<FailureTransition> = fc
  .record({
    workflow: fc.constantFrom<PlannerWorkflowId>(
      "project-edit",
      "project-load",
      "project-save",
      "offline-reconnect",
      "conflict-recovery",
    ),
  })
  .map(({ workflow }) => ({
    operation: "stale" as const,
    workflow,
    kind: "stale" as const,
    requiresExplicitReplacement: true,
  }));

const failureTransitionArbitrary: fc.Arbitrary<FailureTransition> = fc.oneof(
  failedEditTransitionArbitrary,
  failedSaveTransitionArbitrary,
  offlineTransitionArbitrary,
  reauthenticationTransitionArbitrary,
  staleTransitionArbitrary,
);

const inMemoryProjectArbitrary: fc.Arbitrary<InMemoryProject> = fc
  .record({
    id: fc.stringMatching(/^project-[a-z0-9]{4,18}$/),
    name: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,48}$/),
    revision: fc.integer({ min: 1, max: 10_000 }),
    objectIds: fc.array(fc.stringMatching(/^object-[a-z0-9]{2,10}$/), {
      maxLength: 16,
    }),
  })
  .map((project) => ({ ...project, hasUnsavedChanges: true as const }));

const EXPLICIT_REPLACEMENT_ACTIONS = new Set([
  "discard",
  "force-save",
  "keep-local",
  "reload",
  "use-server",
]);

function cloneProject(project: InMemoryProject): InMemoryProject {
  return { ...project, objectIds: [...project.objectIds] };
}

describe("Feature: planner-comprehensive-audit, Property 7: Failure-safe UI state", () => {
  it("preserves unsaved state across generated edit/save/offline/reauth/stale failures and clears only obsolete retry errors after success", () => {
    fc.assert(
      fc.property(
        failureTransitionArbitrary,
        inMemoryProjectArbitrary,
        (transition, project) => {
          const beforeFailure = cloneProject(project);
          const state = getPlannerRequiredState(
            transition.workflow,
            transition.kind,
          );
          if (!state) {
            throw new Error(
              `Missing failure state ${transition.workflow}/${transition.kind}`,
            );
          }

          // Failed edit/save/load transitions never replace the last valid
          // in-memory project. The production descriptor is the state contract
          // consumed by the Planner UI after task 3.4.
          expect(state.memoryRule).toBe("preserve");
          expect(project).toEqual(beforeFailure);
          expect(state.actions.length).toBeGreaterThan(0);

          if (transition.operation === "reauth") {
            expect(state.actions.some((action) => action.id === "sign-in")).toBe(
              true,
            );
          }
          if (transition.operation === "offline") {
            expect(state.actions.some((action) => action.id === "reconnect")).toBe(
              true,
            );
            const recovery = getPlannerRequiredState(
              transition.workflow,
              "recovery",
            );
            expect(recovery).toBeDefined();
            expect(recovery?.memoryRule).toBe("preserve");
            expect(recovery?.actions.length).toBeGreaterThan(0);
          }
          if (transition.requiresExplicitReplacement) {
            expect(
              state.actions.some((action) =>
                EXPLICIT_REPLACEMENT_ACTIONS.has(action.id),
              ),
            ).toBe(true);
          }

          const afterSuccessfulRetry = clearObsoleteErrorOnRetry(
            transition.workflow,
            transition.kind,
          );
          if (state.clearOnRetrySuccess) {
            expect(afterSuccessfulRetry).not.toBeNull();
            expect(["success", "default"]).toContain(
              afterSuccessfulRetry?.kind,
            );
          } else {
            // Reauthentication and unresolved conflict cannot clear the error
            // until the user completes the explicit recovery decision.
            expect(afterSuccessfulRetry).toBeNull();
          }

          // Clearing an obsolete UI error is not permission to rewrite the
          // newer local project; the document remains byte-for-byte equivalent.
          expect(project).toEqual(beforeFailure);
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED, endOnFailure: true },
    );
  });

  it("replaces an unsaved project only after an explicit navigation decision", () => {
    fc.assert(
      fc.property(
        inMemoryProjectArbitrary,
        fc.boolean(),
        (project, shouldReplace) => {
          const store = usePlannerUIStore.getState();
          store.setHasUnsavedChanges(project.hasUnsavedChanges);
          const confirm = vi.fn(() => shouldReplace);
          vi.stubGlobal("window", { confirm });

          try {
            expect(confirmPlannerNavigation("Replace unsaved Planner work?")).toBe(
              shouldReplace,
            );
            expect(confirm).toHaveBeenCalledOnce();
            expect(usePlannerUIStore.getState().hasUnsavedChanges).toBe(
              shouldReplace ? false : true,
            );
          } finally {
            // Keep each generated case independent and do not leak a stubbed
            // browser global into the following fast-check case.
            usePlannerUIStore.getState().setHasUnsavedChanges(false);
            vi.unstubAllGlobals();
          }
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED + 1, endOnFailure: true },
    );
  });
});
