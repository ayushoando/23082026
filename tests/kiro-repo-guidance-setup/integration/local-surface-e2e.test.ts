// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  runEnablementGate,
  type FinalEnablementGateInput,
} from "../../../scripts/kiro-repo-guidance-setup/enablement.ts";
import {
  COMPLETE_REVIEW_STATEMENT,
  FEATURE_NAME,
  OWNER_DECISIONS,
  PACKAGE_MANAGER,
  REQUIRED_SURFACE_VERSIONS,
  REPOSITORY_ROOT,
  type AgentOutput,
  type ApprovalBoundary,
  type ArtifactInventoryRecord,
  type CompatibilityRecord,
  type ConcurrentImplementationWaveRecord,
  type CoverageMatrix,
  type EvidenceReviewRequest,
  type FileOwnershipReservation,
  type KnownGap,
  type RollbackRecord,
  type SafetyReviewRequest,
  type SharedContractFreeze,
  type SourceInventory,
  type ValidationRun,
  type WaveConflict,
} from "../../../scripts/kiro-repo-guidance-setup/contracts.ts";
import { createSharedContractFreeze } from "../../../scripts/kiro-repo-guidance-setup/contract-freeze.ts";
import {
  OD04_APPROVAL_BOUNDARY_REF,
  acquireFileOwnershipReservation,
} from "../../../scripts/kiro-repo-guidance-setup/reservations.ts";
import {
  runIntegrationPipeline,
  type IntegrationPipelineInput,
} from "../../../scripts/kiro-repo-guidance-setup/pipeline.ts";
import type { SequentialReviewInput } from "../../../scripts/kiro-repo-guidance-setup/reviewers.ts";
import { LANE_OWNERSHIP_DECLARATIONS } from "../../../scripts/kiro-repo-guidance-setup/ownership.ts";

// **Validates: Requirements 1.6, 2.7, 4.5, 5.5, 7.3, 7.6, 8.5, 9.7, 10.2–10.13,
// 11.4–11.8, 12.6–12.8, 13.5–13.8, 14.8–14.12; Design: Error handling,
// Failure and rollback testing.**

const WAVE_ID = "wave-local-surface-e2e";
const FREEZE_ID = "freeze-local-surface-e2e";
const FREEZE_VALIDATION_ID = "validation-freeze-local-surface-e2e";
const INTEGRATION_VALIDATION_ID = "validation-integration-local-surface-e2e";
const LOCAL_ARTIFACT_VALIDATION_ID = "validation-local-artifact-local-surface-e2e";
const SNAPSHOT_ID = "snapshot-local-surface-e2e";
const ROLLBACK_ID = "rollback-local-surface-e2e";
const TARGET_PATHS = LANE_OWNERSHIP_DECLARATIONS.map(
  (agent) => agent.writeScope.writePaths[0],
);

const ALL_TRUE_PREDICATES = {
  ownerApproval: true,
  freshExactTargetValidation: true,
  artifactSchemaPass: true,
  repositoryCompatibility: true,
  securityBoundaryConfirmed: true,
  rollbackReady: true,
  noBlockingKnownGap: true,
  policyGuardsPass: true,
  bothReviewerStagesPass: true,
} as const;

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
    integrationValidationGateRef: "integration-gate-local-surface-e2e",
    status: "completed",
    rollbackPath: "release reservations and restore pre-wave snapshots",
    validationRunRefs: [INTEGRATION_VALIDATION_ID],
    ...overrides,
  };
}

function createReservations(): FileOwnershipReservation[] {
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

const RESERVATIONS = createReservations();
const WAVE = createWave({ fileOwnershipReservations: RESERVATIONS });
const FREEZE_RESULT = createSharedContractFreeze({
  wave: WAVE,
  freezeId: FREEZE_ID,
  frozenAtUtc: "2026-08-25T00:00:00Z",
  validationRunRef: FREEZE_VALIDATION_ID,
});

if (FREEZE_RESULT.status !== "pass" || FREEZE_RESULT.output?.freeze === null) {
  throw new Error(
    FREEZE_RESULT.blockers.join("; ") || "expected a valid shared contract freeze",
  );
}

const FREEZE: SharedContractFreeze = FREEZE_RESULT.output.freeze;

const INTEGRATION_VALIDATION_RUN: ValidationRun = {
  validationId: INTEGRATION_VALIDATION_ID,
  action: "integration gate repository validation",
  repositoryRootOrActiveSurface: REPOSITORY_ROOT,
  surface: "Local_Repository_Surface",
  version: "repository",
  scope: "local-surface synthetic implementation wave",
  executionLayer: "integration_gate",
  waveId: WAVE_ID,
  startedAtUtc: "2026-08-25T00:00:00Z",
  result: "pass",
  commandOrInteraction: "pnpm run typecheck:tests",
  exitCodeOrOutcome: "exit 0",
  evidenceRefs: ["evidence-integration-local-surface-e2e"],
  unverifiedItems: [],
  blocker: "none",
};

const LOCAL_ARTIFACT_VALIDATION_RUN: ValidationRun = {
  validationId: LOCAL_ARTIFACT_VALIDATION_ID,
  action: "validate repository-local repo-map skill artifact",
  repositoryRootOrActiveSurface: REPOSITORY_ROOT,
  surface: "Local_Repository_Surface",
  version: "repository",
  scope: ".kiro/skills/repo-map/SKILL.md",
  executionLayer: "surface_validation",
  startedAtUtc: "2026-08-25T00:00:00Z",
  result: "pass",
  commandOrInteraction: "validate skill manifest and local repository references",
  exitCodeOrOutcome: "pass",
  evidenceRefs: ["evidence-local-repo-map-artifact"],
  unverifiedItems: [],
  blocker: "none",
};

function createAgentOutputs(): AgentOutput[] {
  return LANE_OWNERSHIP_DECLARATIONS.map((agent, index) => ({
    agentId: agent.agentId,
    status: "completed",
    changedPaths: [TARGET_PATHS[index]],
    evidenceRefs: [`evidence-${agent.agentId}-local-surface-e2e`],
    blocker: "none",
  }));
}

function createSourceInventory(): SourceInventory {
  return {
    reviewDateUtc: "2026-08-25",
    activeSurfaces: ["Local_Repository_Surface"],
    discoveryMethod: "repository_seed",
    records: [
      {
        sourceId: "source-local-repo-map-e2e",
        kind: "repository_file",
        locator: ".kiro/skills/repo-map/SKILL.md",
        reviewDateUtc: "2026-08-25",
        retrievalMethod: "file_read",
        surfaceApplicability: ["Local_Repository_Surface"],
        versionSensitiveClaim: false,
        availability: "available",
        evidenceState: "Validated",
        provenance: {
          observer: "local-surface-e2e-test",
          cwdOrSurface: REPOSITORY_ROOT,
          commandOrPath: ".kiro/skills/repo-map/SKILL.md",
          result: "manifest and referenced local guidance validated",
        },
        trustDecision: "trusted",
        claims: ["local-repo-map-artifact"],
        validationRunRefs: [LOCAL_ARTIFACT_VALIDATION_ID],
        disposition: "retain",
      },
    ],
    unavailableFindings: [],
  };
}

function createCoverageMatrix(
  overrides: Partial<CoverageMatrix> = {},
): CoverageMatrix {
  return {
    entries: [
      {
        coverageId: "coverage-local-repo-map-e2e",
        sourceId: "source-local-repo-map-e2e",
        url: "repository://.kiro/skills/repo-map/SKILL.md",
        family: "repository guidance",
        discoveryMethod: "repository_seed",
        reviewDateUtc: "2026-08-25",
        surface: "Local_Repository_Surface",
        applicability: "applicable",
        keyConvention: "repo-map is the primary repository guidance entry point",
        versionSensitiveClaim: false,
        evidenceProvenanceRef: "source-local-repo-map-e2e",
        availability: "available",
        disposition: "retain",
        validationAction: "validate local skill manifest and references",
        status: "reviewed",
      },
    ],
    completeReviewStatement: COMPLETE_REVIEW_STATEMENT,
    complete: true,
    unavailableCandidateRefs: [],
    blockers: [],
    ...overrides,
  };
}

function createArtifactInventory(
  overrides: Partial<ArtifactInventoryRecord> = {},
): ArtifactInventoryRecord[] {
  return [
    {
      artifactId: "artifact-local-repo-map-e2e",
      kind: "Kiro_Skill",
      path: ".kiro/skills/repo-map/SKILL.md",
      inventoryStatus: "present and readable",
      owner: "repository owner",
      configurationScope: "project",
      activationCondition: "after exact local-surface validation and rollback readiness",
      canonicalSource: "AGENTS.md",
      evidenceState: "Validated",
      disposition: "retain",
      maintenanceRisk: "low",
      evidenceRefs: ["source-local-repo-map-e2e"],
      validationRunRefs: [LOCAL_ARTIFACT_VALIDATION_ID],
      rollbackPath: "restore the captured skill and prior activation state",
      ...overrides,
    },
  ];
}

function createCompatibilityRecords(): CompatibilityRecord[] {
  return REQUIRED_SURFACE_VERSIONS.map((surfaceVersion) => {
    if (surfaceVersion.surface === "Local_Repository_Surface") {
      return {
        ...surfaceVersion,
        status: "applicable",
        documentedBehavior: ["repository-local artifacts can be inspected locally"],
        observedBehavior: ["repo-map manifest and references were validated"],
        evidenceFreshness: "fresh",
        versionSensitiveClaim: false,
        validationAction: "validate the exact repository-local artifact",
        validationRunRefs: [LOCAL_ARTIFACT_VALIDATION_ID],
        enablementStatus: "enabled-valid",
        unsupportedClaims: [],
        migrationConstraints: [],
        rollbackPathRef: "rollback-local-repo-map-e2e",
      };
    }

    return {
      ...surfaceVersion,
      status: "Unverified",
      documentedBehavior: [],
      observedBehavior: [],
      evidenceFreshness: "none",
      versionSensitiveClaim: true,
      validationAction: "run fresh exact-target validation before enablement",
      validationRunRefs: [],
      enablementStatus: "blocked",
      unsupportedClaims: [],
      migrationConstraints: [],
      rollbackPathRef: `rollback-${surfaceVersion.surface}-local-surface-e2e`,
    };
  });
}

function createApprovalBoundary(
  overrides: Partial<ApprovalBoundary> = {},
): ApprovalBoundary {
  return {
    boundaryId: "approval-local-surface-e2e",
    scope: "project",
    requestedChange: "validate repository-local guidance artifact",
    targetSurface: "Local_Repository_Surface",
    owner: "repository owner",
    approvalStatus: "approved",
    approvalDate: "2026-08-25",
    preChangeStateRef: SNAPSHOT_ID,
    securityBoundary: "repository-local only; no secrets, external services, or production writes",
    expectedSideEffects: [],
    rollbackPathRef: ROLLBACK_ID,
    ...overrides,
  };
}

function createRollbackRecord(
  overrides: Partial<RollbackRecord> = {},
): RollbackRecord {
  return {
    rollbackId: ROLLBACK_ID,
    targetArtifactOrScope: ".kiro/skills/repo-map/SKILL.md",
    preChangeStateRef: SNAPSHOT_ID,
    rollbackAction: "restore captured repository-local bytes",
    expectedSuccessSignal: "captured bytes match after restore",
    observedEvidence: "captured bytes match after restore",
    result: "pass",
    verificationRunRef: "validation-rollback-local-surface-e2e",
    owner: "repository owner",
    ...overrides,
  };
}

function createEvidenceRequest(
  overrides: Partial<EvidenceReviewRequest> = {},
): EvidenceReviewRequest {
  return {
    inputStageRef: WAVE.integrationValidationGateRef,
    sourceInventory: createSourceInventory(),
    coverageMatrix: createCoverageMatrix(),
    exclusions: { entries: [] },
    artifactInventory: createArtifactInventory(),
    compatibilityRecords: createCompatibilityRecords(),
    ownerDecisions: [...OWNER_DECISIONS],
    validationRuns: [INTEGRATION_VALIDATION_RUN, LOCAL_ARTIFACT_VALIDATION_RUN],
    ...overrides,
  };
}

function createSafetyInput(
  overrides: Omit<Partial<SafetyReviewRequest>, "evidenceReview"> = {},
): Omit<SafetyReviewRequest, "evidenceReview"> {
  return {
    approvalBoundaries: [createApprovalBoundary()],
    policyFindings: [],
    snapshots: [SNAPSHOT_ID],
    knownGaps: { entries: [] },
    rollbackRecords: [createRollbackRecord()],
    ...overrides,
  };
}

function createReviewerInput(
  evidenceOverrides: Partial<EvidenceReviewRequest> = {},
  safetyOverrides: Omit<Partial<SafetyReviewRequest>, "evidenceReview"> = {},
): SequentialReviewInput {
  return {
    evidence: createEvidenceRequest(evidenceOverrides),
    safety: createSafetyInput(safetyOverrides),
  };
}

function createPipelineInput(
  overrides: Partial<IntegrationPipelineInput> = {},
): IntegrationPipelineInput {
  const outputs = createAgentOutputs();
  return {
    wave: WAVE,
    laneOutputs: {
      laneA: outputs[0],
      laneB: outputs[1],
      laneC: outputs[2],
      laneD: outputs[3],
    },
    reservations: RESERVATIONS,
    conflicts: [],
    contractFreeze: FREEZE,
    validationRuns: [INTEGRATION_VALIDATION_RUN],
    finalGate: {
      predicates: ALL_TRUE_PREDICATES,
      evidenceRefs: [
        "evidence-owner-approval-local-surface-e2e",
        LOCAL_ARTIFACT_VALIDATION_ID,
      ],
      priorStatePreserved: true,
      target: { surface: "Local_Repository_Surface", version: "repository" },
      limitations: [],
    },
    reviewerInput: createReviewerInput(),
    ...overrides,
  };
}

function pipelineOutput(
  result: ReturnType<typeof runIntegrationPipeline>,
): NonNullable<ReturnType<typeof runIntegrationPipeline>["output"]> {
  if (result.output === undefined) {
    throw new Error("expected the integration pipeline to preserve an output projection");
  }
  return result.output;
}

function finalGateInput(
  pipelineResult: ReturnType<typeof runIntegrationPipeline>,
  overrides: Partial<FinalEnablementGateInput> = {},
): FinalEnablementGateInput {
  const output = pipelineOutput(pipelineResult);
  return {
    predicates: ALL_TRUE_PREDICATES,
    evidenceRefs: [
      "evidence-owner-approval-local-surface-e2e",
      LOCAL_ARTIFACT_VALIDATION_ID,
    ],
    priorStatePreserved: true,
    target: { surface: "Local_Repository_Surface", version: "repository" },
    limitations: [],
    integrationGate: output.integrationGate,
    reviewerHandoffRefs: output.reviewerHandoffRefs,
    reviewerOutput: output.reviewerOutput,
    ...overrides,
  };
}

function blockerText(result: { readonly blockers: readonly string[] }): string {
  return result.blockers.join(" ");
}

function createLtmGap(): KnownGap {
  return {
    gapId: "gap-ltm-stub-local-surface-e2e",
    kind: "missing_prerequisite",
    title: "LTM capture command remains a stub",
    evidenceState: "Unverified",
    evidenceRefs: ["artifact-ltm-hook-stub-local-surface-e2e"],
    owner: "LTM owner",
    nextValidationRun: "validation-ltm-capture-local-surface-e2e",
    blockedAction: "enable LTM capture hook",
    disposition: "disable",
    status: "open",
    limitation: "Crew memory and knowledge do not prove local LTM execution",
  };
}

describe("end-to-end local-surface integration gate", () => {
  it("collects the wave, runs both sequential reviewers, and grants enabled-valid only at the final gate", () => {
    const input = createPipelineInput();
    const before = JSON.stringify(input);
    const pipelineResult = runIntegrationPipeline(input);
    const output = pipelineOutput(pipelineResult);

    expect(pipelineResult.status).toBe("pass");
    expect(output.collection.outputs).toHaveLength(4);
    expect(output.collection.changedFileManifest.complete).toBe(true);
    expect(output.integrationGate).toMatchObject({
      status: "pass",
      enablementAllowed: true,
      reviewerStages: [
        "EvidenceCompatibilityReviewer",
        "SafetyRollbackReviewer",
      ],
    });
    expect(output.reviewerOutput?.bothReviewerStagesPass).toBe(true);
    expect(output.reviewerOutput?.reviewerStages).toEqual([
      "EvidenceCompatibilityReviewer",
      "SafetyRollbackReviewer",
    ]);
    expect(output.reviewerOutput?.evidenceReview.output?.handoff).toMatchObject({
      fromStage: "Integration_Validation_Gate",
      toStage: "SafetyRollbackReviewer",
      order: 1,
      readOnly: true,
      maximumConcurrency: 1,
      iterationCeiling: 3,
    });
    expect(output.reviewerOutput?.safetyReview?.output?.handoff).toMatchObject({
      fromStage: "EvidenceCompatibilityReviewer",
      toStage: "owner-approved Validation/Enablement gate",
      order: 2,
      readOnly: true,
      maximumConcurrency: 1,
      iterationCeiling: 3,
    });

    const finalResult = output.finalGate;
    expect(finalResult?.status).toBe("pass");
    expect(finalResult?.output).toMatchObject({
      target: { surface: "Local_Repository_Surface", version: "repository" },
      predicates: ALL_TRUE_PREDICATES,
      disposition: "enabled-valid",
      limitations: [],
      rollbackReady: true,
      preservedPriorState: true,
      executionStatus: "evaluated",
    });
    expect(finalResult?.output?.evidenceRefs).toEqual(
      expect.arrayContaining([
        "integration-gate-local-surface-e2e",
        LOCAL_ARTIFACT_VALIDATION_ID,
        "reviewer:EvidenceCompatibilityReviewer",
        "reviewer:SafetyRollbackReviewer",
      ]),
    );
    expect(output.enablementAllowed).toBe(true);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("does not evaluate the final gate before both reviewer results are recorded", () => {
    const input = createPipelineInput({ reviewerInput: undefined });
    const before = JSON.stringify(input);
    const pipelineResult = runIntegrationPipeline(input);
    const output = pipelineOutput(pipelineResult);

    expect(pipelineResult.status).toBe("blocked");
    expect(output.reviewerOutput).toBeUndefined();
    expect(output.finalGate?.status).toBe("blocked");
    expect(output.finalGate?.output).toMatchObject({
      disposition: "blocked",
      executionStatus: "blocked-before-evaluation",
      target: { surface: "Local_Repository_Surface", version: "repository" },
      preservedPriorState: true,
    });
    expect(output.finalGate?.blockers.join(" ")).toContain(
      "both sequential reviewer results and handoffs are recorded",
    );
    expect(output.enablementAllowed).toBe(false);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("blocks enablement when the owner gate request is missing after reviewers pass", () => {
    const input = createPipelineInput({ finalGate: undefined });
    const before = JSON.stringify(input);
    const pipelineResult = runIntegrationPipeline(input);
    const output = pipelineOutput(pipelineResult);

    expect(pipelineResult.status).toBe("blocked");
    expect(output.reviewerOutput?.bothReviewerStagesPass).toBe(true);
    expect(output.finalGate).toBeUndefined();
    expect(output.enablementAllowed).toBe(false);
    expect(blockerText(pipelineResult)).toContain(
      "final owner-approved gate input is required",
    );
    expect(JSON.stringify(input)).toBe(before);
  });

  it("keeps incomplete discovery blocked through both reviewers and the final gate", () => {
    const pipelineResult = runIntegrationPipeline(
      createPipelineInput({
        reviewerInput: createReviewerInput({
          coverageMatrix: createCoverageMatrix({
            complete: false,
            blockers: ["official discovery did not review every relevant candidate"],
          }),
        }),
      }),
    );
    const output = pipelineOutput(pipelineResult);

    expect(pipelineResult.status).toBe("blocked");
    expect(output.reviewerOutput?.evidenceReview.status).toBe("blocked");
    expect(output.reviewerOutput?.safetyReview?.output?.stage.readOnly).toBe(true);
    expect(output.enablementAllowed).toBe(false);

    const finalResult = runEnablementGate(finalGateInput(pipelineResult));
    expect(finalResult.status).toBe("blocked");
    expect(finalResult.output?.status).toBe("blocked");
    expect(finalResult.output?.preservedPriorState).toBe(true);
    expect(blockerText(finalResult)).toContain("both sequential reviewer stages must pass");
  });

  it("blocks a failed schema predicate without changing the validated local artifact state", () => {
    const pipelineResult = runIntegrationPipeline(createPipelineInput());
    const finalInput = finalGateInput(pipelineResult, {
      predicates: { ...ALL_TRUE_PREDICATES, artifactSchemaPass: false },
    });
    const before = JSON.stringify(finalInput);

    const finalResult = runEnablementGate(finalInput);

    expect(finalResult.status).toBe("blocked");
    expect(finalResult.output?.failedPredicates).toContain("artifactSchemaPass");
    expect(finalResult.output?.status).toBe("blocked");
    expect(finalResult.output?.preservedPriorState).toBe(true);
    expect(JSON.stringify(finalInput)).toBe(before);
  });

  it("blocks an unresolved approval boundary and preserves the prior state", () => {
    const pipelineResult = runIntegrationPipeline(
      createPipelineInput({
        reviewerInput: createReviewerInput({}, {
          approvalBoundaries: [createApprovalBoundary({ approvalStatus: "pending" })],
        }),
      }),
    );
    const output = pipelineOutput(pipelineResult);
    const finalResult = runEnablementGate(finalGateInput(pipelineResult));

    expect(output.reviewerOutput?.safetyReview?.status).toBe("blocked");
    expect(output.enablementAllowed).toBe(false);
    expect(finalResult.status).toBe("blocked");
    expect(finalResult.output?.preservedPriorState).toBe(true);
    expect(blockerText(finalResult)).toContain("pending");
  });

  it("blocks incompatible Crew behavior without routing or mutation", () => {
    const pipelineResult = runIntegrationPipeline(
      createPipelineInput({
        reviewerInput: createReviewerInput({}, {
          policyFindings: [
            "Crew worktree and automatic approval conflict with repository policy",
          ],
        }),
      }),
    );
    const output = pipelineOutput(pipelineResult);
    const finalResult = runEnablementGate(finalGateInput(pipelineResult));

    expect(output.reviewerOutput?.safetyReview?.status).toBe("blocked");
    expect(output.reviewerOutput?.safetyReview?.output?.stage.readOnly).toBe(true);
    expect(output.enablementAllowed).toBe(false);
    expect(finalResult.status).toBe("blocked");
    expect(finalResult.output?.status).toBe("blocked");
    expect(blockerText(finalResult)).toContain("Crew worktree");
  });

  it("keeps the stubbed LTM hook disabled even when the local artifact path passes", () => {
    const ltmArtifact: ArtifactInventoryRecord = {
      artifactId: "artifact-ltm-hook-stub-local-surface-e2e",
      kind: "Hook_Manifest",
      path: ".kiro/hooks/ltm-postturn-capture.json",
      inventoryStatus: "present and readable",
      owner: "LTM owner",
      configurationScope: "project",
      activationCondition: "after capture-turn is implemented and freshly executed",
      canonicalSource: "AGENTS.md",
      evidenceState: "Unverified",
      disposition: "disable",
      maintenanceRisk: "medium",
      evidenceRefs: ["artifact-ltm-hook-stub-local-surface-e2e"],
      validationRunRefs: [],
      rollbackPath: "no rollback applies",
    };
    const pipelineResult = runIntegrationPipeline(
      createPipelineInput({
        reviewerInput: createReviewerInput({
          artifactInventory: [
            ...createArtifactInventory(),
            ltmArtifact,
          ],
        }, {
          knownGaps: { entries: [createLtmGap()] },
        }),
      }),
    );
    const output = pipelineOutput(pipelineResult);
    const finalResult = runEnablementGate(
      finalGateInput(pipelineResult, {
        predicates: { ...ALL_TRUE_PREDICATES, noBlockingKnownGap: false },
      }),
    );

    expect(pipelineResult.status).toBe("pass");
    expect(output.reviewerOutput?.bothReviewerStagesPass).toBe(true);
    expect(finalResult.status).toBe("blocked");
    expect(finalResult.output?.failedPredicates).toContain("noBlockingKnownGap");
    expect(finalResult.output?.status).toBe("blocked");
    expect(finalResult.output?.preservedPriorState).toBe(true);
  });

  it("fails closed on an ownership conflict before reviewer handoff", () => {
    const conflict: WaveConflict = {
      conflictId: "conflict-local-surface-e2e",
      agentIds: [LANE_OWNERSHIP_DECLARATIONS[0].agentId, LANE_OWNERSHIP_DECLARATIONS[1].agentId],
      paths: [TARGET_PATHS[0]],
      reason: "synthetic ownership conflict remains unresolved",
      status: "blocking",
    };
    const pipelineResult = runIntegrationPipeline(
      createPipelineInput({ conflicts: [conflict] }),
    );
    const output = pipelineOutput(pipelineResult);
    const finalResult = runEnablementGate(finalGateInput(pipelineResult));

    expect(pipelineResult.status).toBe("blocked");
    expect(output.integrationGate.status).toBe("blocked");
    expect(output.reviewerOutput).toBeUndefined();
    expect(output.enablementAllowed).toBe(false);
    expect(finalResult.status).toBe("blocked");
    expect(finalResult.output?.preservedPriorState).toBe(true);
    expect(blockerText(finalResult)).toContain("Integration_Validation_Gate status is blocked");
  });

  it("fails closed for a partial implementation agent without automatic retry or replan", () => {
    const outputs = createAgentOutputs();
    outputs[2] = {
      ...outputs[2],
      status: "partial",
      blocker: "synthetic partial Lane C output",
    };
    const pipelineResult = runIntegrationPipeline(
      createPipelineInput({
        laneOutputs: {
          laneA: outputs[0],
          laneB: outputs[1],
          laneC: outputs[2],
          laneD: outputs[3],
        },
      }),
    );
    const output = pipelineOutput(pipelineResult);
    const finalResult = runEnablementGate(finalGateInput(pipelineResult));

    expect(pipelineResult.status).toBe("partial");
    expect(output.integrationGate.status).toBe("partial");
    expect(output.reviewerOutput).toBeUndefined();
    expect(output.policy.automaticRetries).toBe("prohibited");
    expect(output.policy.automaticReplans).toBe("prohibited");
    expect(finalResult.status).toBe("blocked");
    expect(finalResult.output?.preservedPriorState).toBe(true);
  });

  it("blocks failed rollback readiness after both reviewers inspect the handoff", () => {
    const pipelineResult = runIntegrationPipeline(
      createPipelineInput({
        reviewerInput: createReviewerInput({}, {
          rollbackRecords: [
            createRollbackRecord({
              result: "fail",
              observedEvidence: "captured bytes did not match after restore",
            }),
          ],
        }),
      }),
    );
    const output = pipelineOutput(pipelineResult);
    const finalResult = runEnablementGate(
      finalGateInput(pipelineResult, {
        predicates: { ...ALL_TRUE_PREDICATES, rollbackReady: false },
      }),
    );

    expect(output.reviewerOutput?.safetyReview?.status).toBe("blocked");
    expect(output.reviewerOutput?.safetyReview?.output?.stage.readOnly).toBe(true);
    expect(output.enablementAllowed).toBe(false);
    expect(finalResult.status).toBe("blocked");
    expect(finalResult.output?.failedPredicates).toContain("rollbackReady");
    expect(finalResult.output?.preservedPriorState).toBe(true);
    expect(blockerText(finalResult)).toContain("did not pass");
  });
});
