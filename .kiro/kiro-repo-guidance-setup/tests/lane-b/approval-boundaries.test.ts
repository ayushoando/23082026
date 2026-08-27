// @vitest-environment node

import { describe, expect, it } from "vitest";

import { assessApprovalBoundaryOperation } from "../../scope.ts
import type {
  ApprovalBoundary,
  PermissionProbe,
  PermissionProbeOutcome,
} from "../../contracts.ts

function createBoundary(overrides: Partial<ApprovalBoundary> = {}): ApprovalBoundary {
  return {
    boundaryId: "boundary-global-config",
    scope: "global",
    requestedChange: "Update the named user-level Kiro configuration path.",
    targetSurface: "IDE",
    owner: "repository owner",
    approvalStatus: "approved",
    approvalDate: "2026-08-25",
    preChangeStateRef: "snapshot:global-config-before-change",
    securityBoundary: "User-level Kiro configuration; no credentials or project data are included.",
    expectedSideEffects: ["The named user-level configuration may change after validation."],
    rollbackPathRef: "rollback:restore-global-config-snapshot",
    ...overrides,
  };
}

function createProbe(
  outcome: PermissionProbeOutcome,
  overrides: Partial<PermissionProbe> = {},
): PermissionProbe {
  return {
    probeId: `probe-${outcome}`,
    surface: "IDE",
    action: `Record ${outcome} permission outcome without executing the protected operation.`,
    outcome,
    evidenceRef: `evidence:probe-${outcome}`,
    ...overrides,
  };
}

describe("approval-boundary records and safe permission probes", () => {
  it("permits only an approved, rollback-ready boundary with all applicable recorded probe outcomes", () => {
    const outcomes: PermissionProbeOutcome[] = ["allowed", "denied", "prompted", "restricted"];
    const result = assessApprovalBoundaryOperation({
      boundary: createBoundary({ scope: "workspace_root_permission" }),
      permissionProbes: outcomes.map((outcome) => createProbe(outcome)),
      requiredProbeOutcomes: outcomes,
    });

    expect(result.status).toBe("pass");
    expect(result.output?.canProceed).toBe(true);
    expect(result.output?.preservedPriorState).toBe(true);
    expect(result.output?.permissionProbes.map((probe) => probe.outcome)).toEqual(outcomes);
  });

  it("blocks a pending external operation without mutation while preserving the pre-change state", () => {
    const result = assessApprovalBoundaryOperation({
      boundary: createBoundary({
        scope: "external_service",
        targetSurface: "Cloud/Crew",
        approvalStatus: "pending",
        approvalDate: undefined,
      }),
    });

    expect(result.status).toBe("blocked");
    expect(result.output?.canProceed).toBe(false);
    expect(result.output?.preservedPriorState).toBe(true);
    expect(result.blockers).toContain("approval boundary is pending and blocks the operation");
  });

  it("blocks incomplete boundary records and does not accept secret values in boundary prose", () => {
    const result = assessApprovalBoundaryOperation({
      boundary: createBoundary({
        owner: "",
        preChangeStateRef: "",
        securityBoundary: "Credential boundary token: real-token-value",
        expectedSideEffects: [],
        rollbackPathRef: "",
      }),
    });

    expect(result.status).toBe("blocked");
    expect(result.output?.preservedPriorState).toBe(true);
    expect(result.blockers).toContain("approval boundary requires an owner");
    expect(result.blockers).toContain("approval boundary requires pre-change state");
    expect(result.blockers).toContain("approval boundary requires expected side effects");
    expect(result.blockers).toContain("approval boundary requires a rollback path");
    expect(result.blockers).toContain("approval boundary security boundary must not contain a secret value");
  });

  it("blocks a required permission outcome that was not probed", () => {
    const result = assessApprovalBoundaryOperation({
      boundary: createBoundary({ scope: "user_permission" }),
      permissionProbes: [createProbe("allowed")],
      requiredProbeOutcomes: ["allowed", "denied"],
    });

    expect(result.status).toBe("blocked");
    expect(result.output?.canProceed).toBe(false);
    expect(result.output?.preservedPriorState).toBe(true);
    expect(result.blockers).toContain("required permission probe outcome denied was not recorded");
  });
});
