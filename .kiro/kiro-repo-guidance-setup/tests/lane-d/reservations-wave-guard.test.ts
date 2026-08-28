import { describe, expect, it } from "vitest";

import {
  FEATURE_NAME,
  type ConcurrentImplementationWaveRecord,
  type SharedContractFreeze,
} from "../../contracts.ts";
import { LANE_OWNERSHIP_DECLARATIONS } from "../../ownership.ts";
import { createSharedContractFreeze } from "../../contract-freeze.ts";
import {
  acquireFileOwnershipReservation,
  OD04_APPROVAL_BOUNDARY_REF,
  requireActiveReservation,
} from "../../reservations.ts";
import { preflightWave } from "../../wave-guard.ts";

const waveId = "wave-lane-d-test";
const laneA = LANE_OWNERSHIP_DECLARATIONS[0];
const targetPath = ".kiro/kiro-repo-guidance-setup/contracts.ts";

function createWave(
  overrides: Partial<ConcurrentImplementationWaveRecord> = {},
): ConcurrentImplementationWaveRecord {
  return {
    waveId,
    featureName: FEATURE_NAME,
    scope: "feature_only",
    maxActiveAgents: 4,
    activeAgentCount: 1,
    implementationAgents: LANE_OWNERSHIP_DECLARATIONS,
    declaredFileOwnership: LANE_OWNERSHIP_DECLARATIONS.flatMap((agent) => agent.writeScope.writePaths),
    declaredSharedOutputOwnership: "none",
    readWriteScopes: LANE_OWNERSHIP_DECLARATIONS.flatMap((agent) => [agent.readScope, agent.writeScope]),
    fileOwnershipReservations: [],
    sharedContractFreezeRef: "freeze-lane-d-test",
    rootWorkingDirectory: "D:\\23082026",
    packageManager: "pnpm",
    worktrees: "prohibited",
    hiddenSpawning: "prohibited",
    automaticRetries: "prohibited",
    automaticReplans: "prohibited",
    approvalBoundaryRefs: [OD04_APPROVAL_BOUNDARY_REF],
    conflictPolicy: "stop_affected_agent_or_wave_fail_closed",
    integrationValidationGateRef: "integration-gate-lane-d-test",
    status: "pending",
    rollbackPath: "restore pre-wave snapshots and release all reservations",
    validationRunRefs: [],
    ...overrides,
  };
}

function createFreeze(): SharedContractFreeze {
  const result = createSharedContractFreeze({
    wave: createWave(),
    frozenAtUtc: "2026-08-25T00:00:00Z",
    validationRunRef: "validation-freeze-lane-d-test",
  });
  expect(result.status).toBe("pass");
  if (result.status !== "pass") {
    throw new Error(result.blockers.join("; "));
  }
  if (!result.output.freeze) {
    throw new Error("freeze builder returned no freeze after a passing result");
  }
  return result.output.freeze;
}

function createReservation() {
  const result = acquireFileOwnershipReservation({
    waveId,
    agent: laneA,
    targetPaths: [targetPath],
    acquiredAtUtc: "2026-08-25T00:00:00Z",
    approvalBoundaryRefs: [OD04_APPROVAL_BOUNDARY_REF],
  });
  expect(result.status).toBe("pass");
  if (result.status !== "pass") {
    throw new Error(result.blockers.join("; "));
  }
  return result.output.reservation;
}

describe("Lane D file-ownership reservations", () => {
  it("records OD-04 governance and grants an active in-scope reservation", () => {
    const reservation = createReservation();

    expect(reservation).not.toBeNull();
    expect(reservation?.status).toBe("active");
    expect(reservation?.acquiredBeforeMutation).toBe(true);
    expect(reservation?.featureName).toBe(FEATURE_NAME);
    expect(reservation?.approvalBoundaryRefs).toContain(OD04_APPROVAL_BOUNDARY_REF);
    expect(reservation?.owner).toBe("repository owner");
    expect(reservation?.decisionDate).toBe("2026-08-25");
    expect(reservation?.explicitReadScope.agentId).toBe(laneA.agentId);
    expect(reservation?.explicitWriteScope.agentId).toBe(laneA.agentId);
    expect(reservation?.conflictPolicy).toBe("stop_affected_agent_or_wave_fail_closed");
    expect(reservation?.rollbackPath).toContain("release this reservation");
  });

  it("blocks a missing, stale, conflicting, or out-of-scope mutation reservation", () => {
    const missing = requireActiveReservation({
      waveId,
      agentId: laneA.agentId,
      targetPaths: [targetPath],
    });
    expect(missing.status).toBe("blocked");
    expect(missing.output?.conflicts.some((item) => item.reason.includes("requires an active"))).toBe(true);

    const reservation = createReservation();
    expect(reservation).not.toBeNull();
    if (!reservation) {
      return;
    }

    const stale = requireActiveReservation({
      waveId,
      agentId: laneA.agentId,
      targetPaths: [targetPath],
      reservation: { ...reservation, status: "stale" },
    });
    expect(stale.status).toBe("blocked");
    expect(stale.output?.conflicts.some((item) => item.reason.includes("not active"))).toBe(true);

    const outOfScope = requireActiveReservation({
      waveId,
      agentId: laneA.agentId,
      targetPaths: ["site/unrelated.ts"],
      reservation,
    });
    expect(outOfScope.status).toBe("blocked");
    expect(outOfScope.output?.conflicts.some((item) => item.reason.includes("not covered"))).toBe(true);

    const conflict = acquireFileOwnershipReservation({
      waveId,
      agent: LANE_OWNERSHIP_DECLARATIONS[1],
      targetPaths: [targetPath],
      existingReservations: [reservation],
      acquiredAtUtc: "2026-08-25T00:01:00Z",
      approvalBoundaryRefs: [OD04_APPROVAL_BOUNDARY_REF],
    });
    expect(conflict.status).toBe("blocked");
    expect(conflict.output?.conflicts.some((item) => item.reason.includes("already holds"))).toBe(true);
  });
});

describe("Lane D wave preflight", () => {
  it("allows an in-scope mutation only with an active reservation and freeze evidence", () => {
    const reservation = createReservation();
    expect(reservation).not.toBeNull();
    if (!reservation) {
      return;
    }

    const result = preflightWave({
      wave: createWave({ fileOwnershipReservations: [reservation] }),
      reservations: [reservation],
      sharedContractFreeze: createFreeze(),
      mutation: {
        waveId,
        agentId: laneA.agentId,
        targetPaths: [targetPath],
        reservation,
      },
      execution: {
        repositoryRoot: "D:\\23082026",
        packageManager: "pnpm",
      },
    });

    expect(result.status).toBe("pass");
    expect(result.output?.allowed).toBe(true);
    expect(result.output?.sharedContractFreezeValidated).toBe(true);
    expect(result.output?.policy.generalRepositoryRulePreserved).toBe(true);
  });

  it("fails closed when dependent mutation has no freeze, even with a valid reservation", () => {
    const reservation = createReservation();
    expect(reservation).not.toBeNull();
    if (!reservation) {
      return;
    }

    const result = preflightWave({
      wave: createWave({ fileOwnershipReservations: [reservation] }),
      reservations: [reservation],
      mutation: {
        waveId,
        agentId: laneA.agentId,
        targetPaths: [targetPath],
        reservation,
      },
    });

    expect(result.status).toBe("blocked");
    expect(result.output?.allowed).toBe(false);
    expect(result.output?.preservedPriorState).toBe(true);
    expect(result.output?.conflicts.some((item) => item.reason.includes("Shared_Contract_Freeze"))).toBe(true);
  });

  it("rejects policy violations and records them without resolving the wave", () => {
    const invalidWave = createWave({
      maxActiveAgents: 4,
      worktrees: "prohibited",
      approvalBoundaryRefs: [],
    });
    const result = preflightWave({
      wave: invalidWave,
      execution: {
        repositoryRoot: "D:\\other-repository",
        packageManager: "npm",
        worktreeRequested: true,
        hiddenSpawningRequested: true,
        automaticRetryRequested: true,
        automaticReplanRequested: true,
      },
    });

    expect(result.status).toBe("blocked");
    expect(result.output?.allowed).toBe(false);
    expect(result.output?.preservedPriorState).toBe(true);
    expect(result.output?.conflicts.length).toBeGreaterThan(1);
    expect(result.output?.conflicts.every((item) => item.status === "blocking")).toBe(true);
  });

  it("rejects more than four active agents", () => {
    const result = preflightWave({
      wave: createWave({
        activeAgentCount: 4,
        maxActiveAgents: 4,
        implementationAgents: [
          ...LANE_OWNERSHIP_DECLARATIONS,
          LANE_OWNERSHIP_DECLARATIONS[0],
        ],
      } as unknown as Partial<ConcurrentImplementationWaveRecord>),
    });

    expect(result.status).toBe("blocked");
    expect(result.output?.conflicts.some((item) => item.reason.includes("more than four"))).toBe(true);
  });

  it("does not authorize a lane to reserve shared generated output", () => {
    const result = acquireFileOwnershipReservation({
      waveId,
      agent: laneA,
      targetPaths: [targetPath],
      sharedOutputs: ["results/kiro-repo-guidance-setup/**"],
      acquiredAtUtc: "2026-08-25T00:00:00Z",
      approvalBoundaryRefs: [OD04_APPROVAL_BOUNDARY_REF],
    });

    expect(result.status).toBe("blocked");
    expect(result.output?.conflicts.some((item) => item.reason.includes("shared generated output"))).toBe(true);
  });
});
