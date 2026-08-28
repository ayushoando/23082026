// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  FEATURE_NAME,
  PACKAGE_MANAGER,
  REPOSITORY_ROOT,
  type AgentOutput,
  type ConcurrentImplementationWaveRecord,
  type FileOwnershipReservation,
  type IntegrationValidationRequest,
  type SharedContractFreeze,
  type ValidationRun,
} from "../../contracts.ts";
import { createSharedContractFreeze } from "../../contract-freeze.ts";
import {
  buildChangedFileManifest,
  collectIntegrationGateEvidence,
  IntegrationValidationGateService,
} from "../../integration-gate.ts";
import { LANE_OWNERSHIP_DECLARATIONS } from "../../ownership.ts";
import {
  acquireFileOwnershipReservation,
  OD04_APPROVAL_BOUNDARY_REF,
} from "../../reservations.ts";
import {
  runIntegrationPipeline,
  toIntegrationValidationRequest,
  type IntegrationPipelineInput,
} from "../../pipeline.ts";

const WAVE_ID = "wave-integration-gate-test";
const FREEZE_ID = "freeze-integration-gate-test";
const FREEZE_VALIDATION_ID = "validation-freeze-integration-gate-test";
const INTEGRATION_VALIDATION_ID = "validation-integration-gate-test";
const TARGET_PATHS = LANE_OWNERSHIP_DECLARATIONS.map(
  (agent) => agent.writeScope.writePaths[0],
);

function createWave(
  overrides: Partial<ConcurrentImplementationWaveRecord> = {},
): ConcurrentImplementationWaveRecord {
  return {
    waveId: WAVE_ID,
    featureName: FEATURE_NAME,
    scope: "feature_only",
    maxActiveAgents: 4,
    activeAgentCount: 4,
    implementationAgents: LANE_OWNERSHIP_DECLARATIONS,
    declaredFileOwnership: LANE_OWNERSHIP_DECLARATIONS.flatMap(
      (agent) => agent.writeScope.writePaths,
    ),
    declaredSharedOutputOwnership: "none",
    readWriteScopes: LANE_OWNERSHIP_DECLARATIONS.flatMap((agent) => [
      agent.readScope,
      agent.writeScope,
    ]),
    fileOwnershipReservations: [],
    sharedContractFreezeRef: FREEZE_ID,
    rootWorkingDirectory: REPOSITORY_ROOT,
    packageManager: PACKAGE_MANAGER,
    worktrees: "prohibited",
    hiddenSpawning: "prohibited",
    automaticRetries: "prohibited",
    automaticReplans: "prohibited",
    approvalBoundaryRefs: [OD04_APPROVAL_BOUNDARY_REF],
    conflictPolicy: "stop_affected_agent_or_wave_fail_closed",
    integrationValidationGateRef: "integration-gate-integration-test",
    status: "completed",
    rollbackPath: "release reservations and restore pre-wave snapshots",
    validationRunRefs: [INTEGRATION_VALIDATION_ID],
    ...overrides,
  };
}

function acquireReservations(): FileOwnershipReservation[] {
  const reservations: FileOwnershipReservation[] = [];

  for (const agent of LANE_OWNERSHIP_DECLARATIONS) {
    const result = acquireFileOwnershipReservation({
      waveId: WAVE_ID,
      agent,
      targetPaths: [agent.writeScope.writePaths[0]],
      existingReservations: reservations,
      acquiredAtUtc: "2026-08-25T00:00:00Z",
      approvalBoundaryRefs: [OD04_APPROVAL_BOUNDARY_REF],
    });

    if (result.status !== "pass" || result.output?.reservation === null) {
      throw new Error(result.blockers.join("; ") || "expected a valid reservation");
    }
    reservations.push(result.output.reservation);
  }

  return reservations;
}

const CANONICAL_RESERVATIONS = acquireReservations();
const CANONICAL_WAVE = createWave({
  fileOwnershipReservations: CANONICAL_RESERVATIONS,
});
const FREEZE_RESULT = createSharedContractFreeze({
  wave: CANONICAL_WAVE,
  freezeId: FREEZE_ID,
  frozenAtUtc: "2026-08-25T00:00:00Z",
  validationRunRef: FREEZE_VALIDATION_ID,
});

if (FREEZE_RESULT.status !== "pass" || FREEZE_RESULT.output?.freeze === null) {
  throw new Error(
    FREEZE_RESULT.blockers.join("; ") ||
      "the canonical integration freeze fixture could not be created",
  );
}

const CANONICAL_FREEZE: SharedContractFreeze = FREEZE_RESULT.output.freeze;

const CANONICAL_VALIDATION_RUN: ValidationRun = {
  validationId: INTEGRATION_VALIDATION_ID,
  action: "integration gate repository validation",
  repositoryRootOrActiveSurface: REPOSITORY_ROOT,
  surface: "Local_Repository_Surface",
  version: "repository",
  scope: "integration-owned synthetic wave",
  executionLayer: "integration_gate",
  waveId: WAVE_ID,
  startedAtUtc: "2026-08-25T00:00:00Z",
  result: "pass",
  commandOrInteraction: "pnpm run typecheck:tests",
  exitCodeOrOutcome: "exit 0",
  evidenceRefs: ["evidence-integration-validation"],
  unverifiedItems: [],
  blocker: "none",
};

function createAgentOutputs(): AgentOutput[] {
  return LANE_OWNERSHIP_DECLARATIONS.map((agent, index) => ({
    agentId: agent.agentId,
    status: "completed",
    changedPaths: [TARGET_PATHS[index]],
    evidenceRefs: [`evidence-${agent.agentId}`],
    blocker: "none",
  }));
}

function createRequest(
  overrides: Partial<IntegrationValidationRequest> = {},
): IntegrationValidationRequest {
  return {
    wave: CANONICAL_WAVE,
    outputs: createAgentOutputs(),
    reservations: CANONICAL_RESERVATIONS,
    conflicts: [],
    contractFreeze: CANONICAL_FREEZE,
    validationRuns: [CANONICAL_VALIDATION_RUN],
    ...overrides,
  };
}

function createPipelineInput(
  overrides: Partial<IntegrationPipelineInput> = {},
): IntegrationPipelineInput {
  return {
    wave: CANONICAL_WAVE,
    laneOutputs: {
      laneA: createAgentOutputs()[0],
      laneB: createAgentOutputs()[1],
      laneC: createAgentOutputs()[2],
      laneD: createAgentOutputs()[3],
    },
    reservations: CANONICAL_RESERVATIONS,
    conflicts: [],
    contractFreeze: CANONICAL_FREEZE,
    validationRuns: [CANONICAL_VALIDATION_RUN],
    ...overrides,
  };
}

function blockerText(result: { readonly blockers: readonly string[] }): string {
  return result.blockers.join(" ");
}

describe("integration-owned wave collection", () => {
  it("collects Lane A/B/C/D outputs and constructs a complete changed-file manifest", () => {
    const pipelineInput = createPipelineInput();
    const request = toIntegrationValidationRequest(pipelineInput);

    expect(request.outputs.map((output) => output.agentId)).toEqual(
      LANE_OWNERSHIP_DECLARATIONS.map((agent) => agent.agentId),
    );

    const manifestResult = buildChangedFileManifest({
      outputs: request.outputs,
      reservations: request.reservations,
      declarations: request.wave.implementationAgents,
      waveId: request.wave.waveId,
    });
    expect(manifestResult.status).toBe("pass");
    expect(manifestResult.output?.complete).toBe(true);
    expect(manifestResult.output?.paths).toEqual([...TARGET_PATHS].sort());
    expect(manifestResult.output?.entries).toHaveLength(4);

    const collectionResult = collectIntegrationGateEvidence(request);
    expect(collectionResult.status).toBe("pass");
    expect(collectionResult.output?.outputs).toHaveLength(4);
    expect(collectionResult.output?.changedFileManifest.complete).toBe(true);
    expect(collectionResult.output?.contractFreeze?.freezeId).toBe(FREEZE_ID);
    expect(collectionResult.output?.validationRuns).toHaveLength(1);
    expect(collectionResult.output?.evidenceRefs).toContain(WAVE_ID);
  });

  it("emits exactly one integration gate and keeps enablement closed before reviewer input", () => {
    const result = runIntegrationPipeline(createPipelineInput());

    expect(result.status).toBe("blocked");
    expect(result.output?.integrationGate.gateId).toBe(
      CANONICAL_WAVE.integrationValidationGateRef,
    );
    expect(result.output?.integrationGate.reviewerStages).toEqual([
      "EvidenceCompatibilityReviewer",
      "SafetyRollbackReviewer",
    ]);
    expect(result.output?.integrationGate.sequentialReviewerHandoffRefs).toEqual([
      "handoff-EvidenceCompatibilityReviewer-blocked",
    ]);
    expect(result.output?.reviewerOutput).toBeUndefined();
    expect(result.output?.integrationHandoff).toMatchObject({
      implementationWaveRef: WAVE_ID,
      integrationValidationGateRef: CANONICAL_WAVE.integrationValidationGateRef,
      reviewerHandoffRefs: ["handoff-EvidenceCompatibilityReviewer-blocked"],
      status: "blocked",
      enablementAllowed: false,
    });
    expect(result.output?.integrationHandoff.reviewerOutput).toBeUndefined();
    expect(result.output?.integrationHandoff.finalGate).toBeUndefined();
    expect(result.output?.enablementAllowed).toBe(false);
    expect(result.output?.preservedPriorState).toBe(true);
    expect(blockerText(result)).toContain("reviewer inputs are required");
    expect(result.output?.policy.automaticRetries).toBe("prohibited");
    expect(result.output?.policy.automaticReplans).toBe("prohibited");
  });
});

describe("integration-owned ownership and conflict handling", () => {
  it("rejects duplicate changed paths and overlapping declared writes", () => {
    const duplicateOutputs = createAgentOutputs();
    duplicateOutputs[1] = {
      ...duplicateOutputs[1],
      changedPaths: [TARGET_PATHS[0]],
    };
    const duplicateResult = collectIntegrationGateEvidence(
      createRequest({ outputs: duplicateOutputs }),
    );

    expect(duplicateResult.status).toBe("blocked");
    expect(blockerText(duplicateResult)).toContain("reported by both");
    expect(duplicateResult.output?.changedFileManifest.complete).toBe(false);

    const overlappingDeclarations = [
      LANE_OWNERSHIP_DECLARATIONS[0],
      {
        ...LANE_OWNERSHIP_DECLARATIONS[1],
        writeScope: {
          ...LANE_OWNERSHIP_DECLARATIONS[1].writeScope,
          writePaths: [
            TARGET_PATHS[0],
            ...LANE_OWNERSHIP_DECLARATIONS[1].writeScope.writePaths.slice(1),
          ],
        },
      },
      LANE_OWNERSHIP_DECLARATIONS[2],
      LANE_OWNERSHIP_DECLARATIONS[3],
    ];
    const overlappingResult = collectIntegrationGateEvidence(
      createRequest({
        wave: createWave({
          implementationAgents: overlappingDeclarations,
          fileOwnershipReservations: CANONICAL_RESERVATIONS,
        }),
      }),
    );

    expect(overlappingResult.status).toBe("blocked");
    expect(blockerText(overlappingResult)).toContain("write ownership overlaps");
    expect(overlappingResult.output?.preflight?.preservedPriorState).toBe(true);
  });

  it.each([
    ["integration-owned path", "tests/kiro-repo-guidance-setup/integration/generated.ts", "integration-owned path"],
    ["shared generated output", "results/kiro-repo-guidance-setup/generated.json", "shared generated output"],
  ])("rejects %s writes by a lane", (_label, changedPath, expectedReason) => {
    const outputs = createAgentOutputs();
    outputs[0] = { ...outputs[0], changedPaths: [changedPath] };
    const result = collectIntegrationGateEvidence(
      createRequest({ outputs }),
    );

    expect(result.status).toBe("blocked");
    expect(blockerText(result)).toContain(expectedReason);
    expect(result.output?.changedFileManifest.complete).toBe(false);
    expect(result.output?.preflight?.preservedPriorState).toBe(true);
  });

  it.each([
    [
      "missing",
      [] as readonly FileOwnershipReservation[],
      "requires an active File_Ownership_Reservation",
      true,
    ],
    [
      "stale",
      CANONICAL_RESERVATIONS.map((reservation, index) =>
        index === 0 ? { ...reservation, status: "stale" as const } : reservation,
      ),
      "is stale",
      false,
    ],
    [
      "conflicting",
      CANONICAL_RESERVATIONS.map((reservation, index) =>
        index === 0
          ? { ...reservation, conflictRefs: ["ownership-conflict-test"] }
          : reservation,
      ),
      "has recorded conflicts",
      false,
    ],
  ])(
    "fails closed for a %s reservation",
    (_label, reservations, expectedReason, expectedPreflightAllowed) => {
      const result = collectIntegrationGateEvidence(
        createRequest({ reservations }),
      );

      expect(result.status).toBe("blocked");
      expect(blockerText(result)).toContain(expectedReason);
      expect(result.output?.preflight?.allowed).toBe(expectedPreflightAllowed);
      expect(result.output?.preflight?.preservedPriorState).toBe(true);
    },
  );

  it("rejects an invalid freeze record and an absent freeze record before dependent work", () => {
    const invalidFreeze: SharedContractFreeze = {
      ...CANONICAL_FREEZE,
      freezeId: "",
      contractVersionOrHash: "",
      validationRunRef: "",
      dependentWorkAllowed: false,
    };
    const invalidResult = collectIntegrationGateEvidence(
      createRequest({ contractFreeze: invalidFreeze }),
    );

    expect(invalidResult.status).toBe("blocked");
    expect(blockerText(invalidResult)).toContain("Shared_Contract_Freeze");
    expect(invalidResult.output?.preflight?.sharedContractFreezeValidated).toBe(false);
    expect(invalidResult.output?.preflight?.preservedPriorState).toBe(true);

    const missingResult = collectIntegrationGateEvidence(
      createRequest({
        contractFreeze: undefined as unknown as SharedContractFreeze,
      }),
    );
    expect(missingResult.status).toBe("blocked");
    expect(blockerText(missingResult)).toContain("Shared_Contract_Freeze");
    expect(missingResult.output?.contractFreeze).toBeNull();
    expect(missingResult.output?.preflight?.sharedContractFreezeValidated).toBe(false);
    expect(missingResult.output?.preflight?.preservedPriorState).toBe(true);
  });

  it("rejects missing outputs, partial/abandoned outputs, and unresolved conflicts", () => {
    const missingOutputResult = runIntegrationPipeline(
      createPipelineInput({
        laneOutputs: {
          laneA: createAgentOutputs()[0],
          laneB: createAgentOutputs()[1],
          laneC: createAgentOutputs()[2],
          laneD: null,
        },
      }),
    );
    expect(missingOutputResult.status).toBe("blocked");
    expect(blockerText(missingOutputResult)).toContain("expected exactly 4 agent outputs");
    expect(missingOutputResult.output?.integrationGate.sequentialReviewerHandoffRefs).toEqual([
      "handoff-EvidenceCompatibilityReviewer-blocked",
    ]);
    expect(missingOutputResult.output?.enablementAllowed).toBe(false);
    expect(missingOutputResult.output?.preservedPriorState).toBe(true);

    for (const status of ["partial", "abandoned"] as const) {
      const outputs = createAgentOutputs();
      outputs[2] = {
        ...outputs[2],
        status,
        blocker: `${status} synthetic output`,
      };
      const result = new IntegrationValidationGateService().run(
        createRequest({ outputs }),
      );
      expect(result.status).toBe("partial");
      expect(result.output?.status).toBe("partial");
      expect(result.output?.enablementAllowed).toBe(false);
    }

    const unresolvedConflictResult = new IntegrationValidationGateService().run(
      createRequest({
        conflicts: [
          {
            conflictId: "conflict-unresolved-integration-test",
            agentIds: [LANE_OWNERSHIP_DECLARATIONS[0].agentId],
            paths: [TARGET_PATHS[0]],
            reason: "synthetic ownership conflict remains unresolved",
            status: "blocking",
          },
        ],
      }),
    );
    expect(unresolvedConflictResult.status).toBe("blocked");
    expect(unresolvedConflictResult.output?.status).toBe("blocked");
    expect(blockerText(unresolvedConflictResult)).toContain("remains unresolved");
    expect(unresolvedConflictResult.output?.enablementAllowed).toBe(false);
  });

  it("rejects out-of-scope mutation and a wave with more than four agents", () => {
    const outOfScopeOutputs = createAgentOutputs();
    outOfScopeOutputs[0] = {
      ...outOfScopeOutputs[0],
      changedPaths: ["site/unrelated-feature.ts"],
    };
    const outOfScopeResult = new IntegrationValidationGateService().run(
      createRequest({ outputs: outOfScopeOutputs }),
    );
    expect(outOfScopeResult.status).toBe("blocked");
    expect(blockerText(outOfScopeResult)).toContain("outside");
    expect(outOfScopeResult.output?.enablementAllowed).toBe(false);

    const extraAgent = {
      ...LANE_OWNERSHIP_DECLARATIONS[0],
      agentId: "extra-synthetic-agent",
    };
    const oversizedWave = createWave({
      activeAgentCount: 5 as ConcurrentImplementationWaveRecord["activeAgentCount"],
      maxActiveAgents: 5 as ConcurrentImplementationWaveRecord["maxActiveAgents"],
      implementationAgents: [...LANE_OWNERSHIP_DECLARATIONS, extraAgent],
      fileOwnershipReservations: CANONICAL_RESERVATIONS,
    });
    const oversizedResult = new IntegrationValidationGateService().run(
      createRequest({ wave: oversizedWave }),
    );
    expect(oversizedResult.status).toBe("blocked");
    expect(blockerText(oversizedResult)).toContain("no more than four");
    expect(oversizedResult.output?.enablementAllowed).toBe(false);
  });

  it("rejects failed, unverified, or wrong-root validation runs", () => {
    const invalidRuns: readonly ValidationRun[] = [
      { ...CANONICAL_VALIDATION_RUN, result: "fail" },
      { ...CANONICAL_VALIDATION_RUN, unverifiedItems: ["missing reviewer evidence"] },
      {
        ...CANONICAL_VALIDATION_RUN,
        repositoryRootOrActiveSurface: "D:\\other-repository",
      },
    ];

    for (const validationRun of invalidRuns) {
      const result = collectIntegrationGateEvidence(
        createRequest({ validationRuns: [validationRun] }),
      );
      expect(result.status).toBe("blocked");
      expect(result.output?.preflight?.preservedPriorState).toBe(true);
    }

    const failedRunResult = new IntegrationValidationGateService().run(
      createRequest({ validationRuns: [invalidRuns[0]] }),
    );
    expect(failedRunResult.status).toBe("fail");
    expect(failedRunResult.output?.status).toBe("fail");
    expect(failedRunResult.output?.enablementAllowed).toBe(false);
  });

  it("rejects a wave outside the exact feature scope and preserves the input projection", () => {
    const input = createRequest({
      wave: createWave({
        featureName: "different-feature" as ConcurrentImplementationWaveRecord["featureName"],
      }),
    });
    const before = JSON.stringify(input);

    const result = collectIntegrationGateEvidence(input);

    expect(result.status).toBe("blocked");
    expect(blockerText(result)).toContain("outside the feature scope");
    expect(result.output?.preflight?.preservedPriorState).toBe(true);
    expect(JSON.stringify(input)).toBe(before);
  });
});
