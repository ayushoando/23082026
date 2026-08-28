import { describe, expect, it } from "vitest";

import {
  FEATURE_NAME,
  type ConcurrentImplementationWaveRecord,
} from "../../contracts.ts";
import {
  createSharedContractFreeze,
  validateSharedContractFreeze,
  type ValidatedSharedContractFreeze,
} from "../../contract-freeze.ts";
import { LANE_OWNERSHIP_DECLARATIONS } from "../../ownership.ts";
import { OD04_APPROVAL_BOUNDARY_REF } from "../../reservations.ts";

const waveId = "wave-contract-freeze-test";
const freezeId = "freeze-contract-freeze-test";

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
    sharedContractFreezeRef: freezeId,
    rootWorkingDirectory: "D:\\23082026",
    packageManager: "pnpm",
    worktrees: "prohibited",
    hiddenSpawning: "prohibited",
    automaticRetries: "prohibited",
    automaticReplans: "prohibited",
    approvalBoundaryRefs: [OD04_APPROVAL_BOUNDARY_REF],
    conflictPolicy: "stop_affected_agent_or_wave_fail_closed",
    integrationValidationGateRef: "integration-gate-contract-freeze-test",
    status: "pending",
    rollbackPath: "restore pre-wave snapshots and release all reservations",
    validationRunRefs: [],
    ...overrides,
  };
}

function createFreeze(): ValidatedSharedContractFreeze {
  const result = createSharedContractFreeze({
    wave: createWave(),
    frozenAtUtc: "2026-08-25T00:00:00Z",
    validationRunRef: "validation-contract-freeze-test",
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

describe("Shared_Contract_Freeze", () => {
  it("records current contract and ownership hashes only after preparation passes", () => {
    const freeze = createFreeze();

    expect(freeze.contracts).toEqual(["scripts/kiro-repo-guidance-setup/contracts.ts"]);
    expect(freeze.contractVersionOrHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(freeze.contractHashes).toHaveLength(1);
    expect(freeze.ownershipManifestHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(freeze.validationResult).toBe("pass");
    expect(freeze.dependentWorkAllowed).toBe(true);
    expect(freeze.owner).toBe("repository owner");
    expect(freeze.validationRunRef).toBe("validation-contract-freeze-test");
  });

  it("is consumed by the wave guard contract validator for the exact current wave", () => {
    const wave = createWave();
    const freeze = createFreeze();
    const result = validateSharedContractFreeze({ wave, freeze });

    expect(result.status).toBe("pass");
    expect(result.output?.valid).toBe(true);
    expect(result.output?.preservedPriorState).toBe(true);
  });

  it("blocks a failed preparation prerequisite and preserves the prior freeze", () => {
    const priorFreeze = createFreeze();
    const result = createSharedContractFreeze({
      wave: createWave({ packageManager: "npm" as "pnpm" }),
      priorFreeze,
      frozenAtUtc: "2026-08-25T00:00:00Z",
    });

    expect(result.status).toBe("blocked");
    expect(result.output?.freeze).toBeNull();
    expect(result.output?.dependentWorkAllowed).toBe(false);
    expect(result.output?.priorFreeze).toBe(priorFreeze);
    expect(result.output?.preservedPriorState).toBe(true);
    expect(result.blockers.some((blocker) => blocker.includes("pnpm"))).toBe(true);
  });

  it("blocks stale contract and ownership-manifest evidence", () => {
    const wave = createWave();
    const freeze = createFreeze();
    const staleContract = {
      ...freeze,
      contractVersionOrHash: "sha256:stale",
    } satisfies ValidatedSharedContractFreeze;
    const staleOwnership = {
      ...freeze,
      ownershipManifestHash: "sha256:stale",
    } satisfies ValidatedSharedContractFreeze;

    const staleContractResult = validateSharedContractFreeze({
      wave,
      freeze: staleContract,
    });
    const staleOwnershipResult = validateSharedContractFreeze({
      wave,
      freeze: staleOwnership,
    });

    expect(staleContractResult.status).toBe("blocked");
    expect(staleContractResult.output?.preservedPriorState).toBe(true);
    expect(staleContractResult.blockers.some((blocker) => blocker.includes("contract hash is stale"))).toBe(true);
    expect(staleOwnershipResult.status).toBe("blocked");
    expect(staleOwnershipResult.blockers.some((blocker) => blocker.includes("ownership-manifest hash is stale"))).toBe(true);
  });

  it("rejects a freeze that names a contract path outside the ownership manifest", () => {
    const wave = createWave();
    const freeze = createFreeze();
    const inconsistent = {
      ...freeze,
      contracts: ["scripts/other-lane.ts"],
    } satisfies ValidatedSharedContractFreeze;

    const result = validateSharedContractFreeze({
      wave,
      freeze: inconsistent,
    });

    expect(result.status).toBe("blocked");
    expect(result.output?.valid).toBe(false);
    expect(result.blockers.some((blocker) => blocker.includes("paths are stale or inconsistent"))).toBe(true);
  });
});
