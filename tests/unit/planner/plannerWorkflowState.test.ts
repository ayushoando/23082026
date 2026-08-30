// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  ALL_REQUIRED_STATE_KINDS,
  ALL_WORKFLOW_IDS,
  PLANNER_WORKFLOW_STATE_MAP,
  clearObsoleteErrorOnRetry,
  getApplicableStateKinds,
  getPlannerRequiredState,
  isClearableErrorState,
  type PlannerRequiredState,
  type PlannerRequiredStateKind,
  type PlannerWorkflowId,
} from "@planner/lib/plannerWorkflowState";

/* ================================================================== */
/*  Structural completeness                                            */
/* ================================================================== */

describe("plannerWorkflowState — structural completeness", () => {
  const requiredStateKindsByWorkflow: Readonly<
    Record<PlannerWorkflowId, readonly PlannerRequiredStateKind[]>
  > = {
    "entry-auth": ["default", "loading", "success", "unauthenticated", "forbidden", "rate-limited", "server-error", "recovery"],
    "project-list": ["loading", "empty", "success", "unauthenticated", "forbidden", "rate-limited", "server-error", "recovery"],
    "project-create": ["default", "loading", "success", "validation-error", "unauthenticated", "forbidden", "rate-limited", "server-error", "recovery"],
    "project-load": ["loading", "success", "unauthenticated", "forbidden", "rate-limited", "stale", "server-error", "recovery"],
    "project-edit": ["default", "success", "validation-error", "server-error", "recovery"],
    "project-save": ["default", "loading", "success", "validation-error", "unauthenticated", "forbidden", "rate-limited", "conflict", "stale", "offline", "server-error", "recovery"],
    "project-delete": ["default", "loading", "success", "unauthenticated", "forbidden", "rate-limited", "server-error", "recovery"],
    "catalog-browse": ["default", "loading", "empty", "success", "rate-limited", "server-error", "recovery"],
    "catalog-select": ["default", "success", "validation-error", "server-error", "recovery"],
    "catalog-upload": ["default", "loading", "success", "validation-error", "unauthenticated", "forbidden", "rate-limited", "server-error", "recovery"],
    handoff: ["default", "loading", "success", "validation-error", "rate-limited", "server-error", "recovery"],
    "sketch-to-plan": ["default", "loading", "success", "validation-error", "forbidden", "rate-limited", "server-error", "recovery"],
    "offline-reconnect": ["offline", "server-error", "stale", "conflict", "recovery"],
    "conflict-recovery": ["conflict", "stale", "server-error", "recovery"],
    "unsaved-destructive-navigation": ["default", "success", "recovery"],
  };

  it("covers every declared workflow id in the map", () => {
    for (const wf of ALL_WORKFLOW_IDS) {
      expect(PLANNER_WORKFLOW_STATE_MAP[wf]).toBeDefined();
      expect(PLANNER_WORKFLOW_STATE_MAP[wf].size).toBeGreaterThan(0);
    }
  });

  it("declares every state applicable to each covered workflow", () => {
    for (const [workflow, kinds] of Object.entries(requiredStateKindsByWorkflow)) {
      for (const kind of kinds) {
        expect(
          getPlannerRequiredState(workflow as PlannerWorkflowId, kind),
          `${workflow} should define its applicable ${kind} state`,
        ).toBeDefined();
      }
    }
  });

  it("every state kind used in a workflow is from the Required State Set", () => {
    for (const wf of ALL_WORKFLOW_IDS) {
      for (const kind of getApplicableStateKinds(wf)) {
        expect(ALL_REQUIRED_STATE_KINDS).toContain(kind);
      }
    }
  });

  it("all 13 required state kinds are represented across at least one workflow", () => {
    const covered = new Set<PlannerRequiredStateKind>();
    for (const wf of ALL_WORKFLOW_IDS) {
      for (const kind of getApplicableStateKinds(wf)) {
        covered.add(kind);
      }
    }
    for (const kind of ALL_REQUIRED_STATE_KINDS) {
      expect(covered.has(kind), `state kind '${kind}' not covered`).toBe(true);
    }
  });
});

/* ================================================================== */
/*  Per-state descriptor contracts                                     */
/* ================================================================== */

describe("plannerWorkflowState — descriptor contract", () => {
  function forEachState(
    fn: (wf: PlannerWorkflowId, kind: PlannerRequiredStateKind, state: PlannerRequiredState) => void,
  ) {
    for (const wf of ALL_WORKFLOW_IDS) {
      for (const kind of getApplicableStateKinds(wf)) {
        const state = getPlannerRequiredState(wf, kind)!;
        fn(wf, kind, state);
      }
    }
  }

  it("every state has a non-empty heading", () => {
    forEachState((wf, kind, state) => {
      expect(state.heading.length, `${wf}/${kind} heading empty`).toBeGreaterThan(0);
    });
  });

  it("every state has a non-empty message", () => {
    forEachState((wf, kind, state) => {
      expect(state.message.length, `${wf}/${kind} message empty`).toBeGreaterThan(0);
    });
  });

  it("every state has a valid accessible status", () => {
    forEachState((wf, kind, state) => {
      const { accessible } = state;
      expect(["status", "alert", "none"]).toContain(accessible.role);
      expect(["idle", "busy"]).toContain(accessible.busy);
      expect(["off", "polite", "assertive"]).toContain(accessible.live);
      expect(typeof accessible.label).toBe("string");
    });
  });

  it("loading states are marked busy", () => {
    forEachState((wf, kind, state) => {
      if (kind === "loading") {
        expect(state.accessible.busy, `${wf}/loading should be busy`).toBe("busy");
      }
    });
  });

  it("error states use alert role (except informational guest entry)", () => {
    const errorKinds: PlannerRequiredStateKind[] = [
      "server-error",
      "unauthenticated",
      "forbidden",
      "rate-limited",
      "conflict",
      "validation-error",
    ];
    forEachState((wf, kind, state) => {
      if (!errorKinds.includes(kind)) return;
      // entry-auth/unauthenticated is an informational guest-workspace
      // notification, not a blocking error — status role is correct there.
      if (wf === "entry-auth" && kind === "unauthenticated") {
        expect(state.accessible.role, `${wf}/${kind} is informational`).toBe("status");
        return;
      }
      expect(state.accessible.role, `${wf}/${kind} should use alert role`).toBe("alert");
    });
  });

  it("every state has a valid focus target", () => {
    forEachState((wf, kind, state) => {
      expect(["heading", "primary-action", "first-invalid-field", "none"]).toContain(
        state.focusTarget.kind,
      );
      if (state.focusTarget.kind === "heading" || state.focusTarget.kind === "primary-action") {
        expect(
          (state.focusTarget as { selector: string }).selector.length,
          `${wf}/${kind} focus target needs a selector`,
        ).toBeGreaterThan(0);
      }
    });
  });

  it("validation-error states focus the first invalid field", () => {
    forEachState((wf, kind, state) => {
      if (kind === "validation-error") {
        expect(
          state.focusTarget.kind,
          `${wf}/validation-error should focus first invalid field`,
        ).toBe("first-invalid-field");
      }
    });
  });

  it("every state has a valid memory-preservation rule", () => {
    forEachState((wf, kind, state) => {
      expect(["preserve", "clear", "prompt"]).toContain(state.memoryRule);
    });
  });

  it("offline and unauthenticated states preserve in-memory work (Req 5.6, 10.8)", () => {
    forEachState((wf, kind, state) => {
      if (kind === "offline" || kind === "unauthenticated") {
        expect(state.memoryRule, `${wf}/${kind} should preserve memory`).toBe("preserve");
      }
    });
  });

  it("every action has a non-empty id and label", () => {
    forEachState((wf, kind, state) => {
      for (const action of state.actions) {
        expect(action.id.length, `${wf}/${kind} action id empty`).toBeGreaterThan(0);
        expect(action.label.length, `${wf}/${kind} action label empty`).toBeGreaterThan(0);
        expect(typeof action.primary).toBe("boolean");
      }
    });
  });

  it("error and recovery states that are retryable have at least one action", () => {
    const retryableKinds: PlannerRequiredStateKind[] = [
      "server-error",
      "rate-limited",
      "offline",
      "recovery",
    ];
    forEachState((wf, kind, state) => {
      if (retryableKinds.includes(kind)) {
        expect(
          state.actions.length,
          `${wf}/${kind} should have at least one recovery action`,
        ).toBeGreaterThan(0);
      }
    });
  });

  it("unauthenticated states offer a sign-in action", () => {
    forEachState((wf, kind, state) => {
      if (kind === "unauthenticated") {
        const hasSignIn = state.actions.some((a) => a.id === "sign-in");
        expect(hasSignIn, `${wf}/unauthenticated should offer sign-in`).toBe(true);
      }
    });
  });
});

/* ================================================================== */
/*  Distinct presentation (Property 8)                                 */
/* ================================================================== */

describe("plannerWorkflowState — distinct presentation per workflow", () => {
  it("within each workflow, every applicable state has a unique heading", () => {
    for (const wf of ALL_WORKFLOW_IDS) {
      const headings = new Set<string>();
      for (const kind of getApplicableStateKinds(wf)) {
        const state = getPlannerRequiredState(wf, kind)!;
        expect(
          headings.has(state.heading),
          `${wf} has duplicate heading '${state.heading}'`,
        ).toBe(false);
        headings.add(state.heading);
      }
    }
  });

  it("within each workflow, every applicable state has a unique accessible label", () => {
    for (const wf of ALL_WORKFLOW_IDS) {
      const labels = new Set<string>();
      for (const kind of getApplicableStateKinds(wf)) {
        const state = getPlannerRequiredState(wf, kind)!;
        // Skip states with empty labels (default/success with role "none")
        if (state.accessible.label === "") continue;
        expect(
          labels.has(state.accessible.label),
          `${wf} has duplicate accessible label '${state.accessible.label}'`,
        ).toBe(false);
        labels.add(state.accessible.label);
      }
    }
  });
});

/* ================================================================== */
/*  Obsolete error clearing (Req 4.8)                                  */
/* ================================================================== */

describe("plannerWorkflowState — clearObsoleteErrorOnRetry (Req 4.8)", () => {
  it("returns the success state for clearable error kinds", () => {
    const result = clearObsoleteErrorOnRetry("project-list", "server-error");
    expect(result).toBeDefined();
    expect(result!.kind).toBe("success");
  });

  it("returns null for non-clearable states like unauthenticated", () => {
    const result = clearObsoleteErrorOnRetry("project-list", "unauthenticated");
    expect(result).toBeNull();
  });

  it("returns null for non-clearable states like forbidden", () => {
    const result = clearObsoleteErrorOnRetry("project-load", "forbidden");
    expect(result).toBeNull();
  });

  it("clears rate-limited after successful retry", () => {
    const result = clearObsoleteErrorOnRetry("catalog-browse", "rate-limited");
    expect(result).toBeDefined();
    expect(result!.kind).toBe("success");
  });

  it("clears offline state after recovery", () => {
    const result = clearObsoleteErrorOnRetry("project-save", "offline");
    expect(result).toBeDefined();
    expect(result!.kind).toBe("success");
  });

  it("returns null for a state kind not in the workflow", () => {
    // project-edit has no "empty" state
    const result = clearObsoleteErrorOnRetry("project-edit", "empty");
    expect(result).toBeNull();
  });

  it("isClearableErrorState agrees with clearOnRetrySuccess flag", () => {
    for (const wf of ALL_WORKFLOW_IDS) {
      for (const kind of getApplicableStateKinds(wf)) {
        const state = getPlannerRequiredState(wf, kind)!;
        expect(isClearableErrorState(wf, kind)).toBe(state.clearOnRetrySuccess);
      }
    }
  });
});

/* ================================================================== */
/*  Lookup helpers                                                     */
/* ================================================================== */

describe("plannerWorkflowState — lookup helpers", () => {
  it("getPlannerRequiredState returns undefined for inapplicable states", () => {
    // project-list has no "conflict" state
    expect(getPlannerRequiredState("project-list", "conflict")).toBeUndefined();
  });

  it("getApplicableStateKinds returns correct count for project-save", () => {
    const kinds = getApplicableStateKinds("project-save");
    // project-save has: default, loading, success, validation-error, server-error,
    // unauthenticated, forbidden, rate-limited, conflict, stale, offline, recovery
    expect(kinds.length).toBe(12);
  });

  it("ALL_REQUIRED_STATE_KINDS has exactly 13 members", () => {
    expect(ALL_REQUIRED_STATE_KINDS.length).toBe(13);
  });

  it("ALL_WORKFLOW_IDS has exactly 15 workflows", () => {
    expect(ALL_WORKFLOW_IDS.length).toBe(15);
  });
});

/* ================================================================== */
/*  Specific workflow state checks (requirements traceability)         */
/* ================================================================== */

describe("plannerWorkflowState — requirements traceability", () => {
  it("project-list empty state offers a create-project action (Req 5.3)", () => {
    const state = getPlannerRequiredState("project-list", "empty")!;
    expect(state).toBeDefined();
    expect(state.actions.some((a) => a.id === "create-project")).toBe(true);
  });

  it("project-save unauthenticated state preserves in-memory work (Req 10.8)", () => {
    const state = getPlannerRequiredState("project-save", "unauthenticated")!;
    expect(state.memoryRule).toBe("preserve");
    expect(state.actions.some((a) => a.id === "sign-in")).toBe(true);
  });

  it("project-save conflict state offers explicit resolution (Req 5.8)", () => {
    const state = getPlannerRequiredState("project-save", "conflict")!;
    expect(state.actions.some((a) => a.id === "use-server")).toBe(true);
    expect(state.actions.some((a) => a.id === "keep-local")).toBe(true);
    expect(state.memoryRule).toBe("preserve");
  });

  it("project-load conflict does not silently overwrite (Req 5.7)", () => {
    const state = getPlannerRequiredState("project-load", "conflict")!;
    expect(state).toBeDefined();
    expect(state.memoryRule).toBe("preserve");
    expect(state.actions.some((a) => a.id === "use-server" || a.id === "keep-local")).toBe(true);
  });

  it("project-delete default state uses prompt memory rule (Req 4.7)", () => {
    const state = getPlannerRequiredState("project-delete", "default")!;
    expect(state.memoryRule).toBe("prompt");
    expect(state.actions.some((a) => a.id === "confirm-delete")).toBe(true);
    expect(state.actions.some((a) => a.id === "cancel")).toBe(true);
  });

  it("handoff validation-error preserves valid values (Req 15.4)", () => {
    const state = getPlannerRequiredState("handoff", "validation-error")!;
    expect(state.memoryRule).toBe("preserve");
    expect(state.focusTarget.kind).toBe("first-invalid-field");
  });

  it("offline states across all workflows preserve in-memory work (Req 5.6)", () => {
    for (const wf of ALL_WORKFLOW_IDS) {
      const state = getPlannerRequiredState(wf, "offline");
      if (state) {
        expect(state.memoryRule, `${wf}/offline should preserve work`).toBe("preserve");
      }
    }
  });

  it("recovery states across all workflows have deterministic actions (Req 5.7)", () => {
    for (const wf of ALL_WORKFLOW_IDS) {
      const state = getPlannerRequiredState(wf, "recovery");
      if (state) {
        expect(
          state.actions.length,
          `${wf}/recovery should have actions`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("rate-limited states present retryable recovery (Req 5.5)", () => {
    for (const wf of ALL_WORKFLOW_IDS) {
      const state = getPlannerRequiredState(wf, "rate-limited");
      if (state) {
        expect(state.clearOnRetrySuccess, `${wf}/rate-limited should clear on retry`).toBe(true);
        expect(state.actions.length).toBeGreaterThan(0);
      }
    }
  });
});
