// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  COMPLETE_REVIEW_STATEMENT,
  FEATURE_NAME,
  OWNER_DECISIONS,
  PACKAGE_MANAGER,
  REQUIRED_SURFACE_VERSIONS,
  REPOSITORY_ROOT,
  OWNER_DECISION_IDS,
  type ApprovalBoundary,
  type AgentOutput,
  type CompatibilityRecord,
  type ConcurrentImplementationWaveRecord,
  type EvidenceReviewRequest,
  type FileOwnershipReservation,
  type HandoverRecord,
  type KnownGapsRegister,
  type RollbackRecord,
  type SafetyReviewRequest,
  type SharedContractFreeze,
  type SourceInventory,
  type ValidationRun,
} from "../../contracts.ts";
import { createSharedContractFreeze } from "../../contract-freeze.ts";
import { LANE_OWNERSHIP_DECLARATIONS } from "../../ownership.ts";
import {
  createSafetyRollbackReviewer,
  type SequentialReviewInput,
} from "../../reviewers.ts";
import {
  acquireFileOwnershipReservation,
  OD04_APPROVAL_BOUNDARY_REF,
} from "../../reservations.ts";
import {
  INTEGRATION_PIPELINE_POLICY,
  runIntegrationPipeline,
  type IntegrationPipelineInput,
} from "../../pipeline.ts";

const WAVE_ID = "wave-reviewer-contract-test";
const FREEZE_ID = "freeze-reviewer-contract-test";
const FREEZE_VALIDATION_ID = "validation-freeze-reviewer-contract-test";
const INTEGRATION_VALIDATION_ID = "validation-integration-reviewer-contract-test";
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
    integrationValidationGateRef: "integration-gate-reviewer-contract-test",
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
      "the reviewer contract freeze fixture could not be created",
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

function createSourceInventory(): SourceInventory {
  return {
    reviewDateUtc: "2026-08-25",
    activeSurfaces: ["Local_Repository_Surface"],
    discoveryMethod: "repository_seed",
    records: [
      {
        sourceId: "source-reviewer-contract",
        kind: "repository_file",
        locator: "AGENTS.md",
        reviewDateUtc: "2026-08-25",
        retrievalMethod: "file_read",
        surfaceApplicability: ["Local_Repository_Surface"],
        versionSensitiveClaim: false,
        availability: "available",
        evidenceState: "Observed",
        provenance: {
          observer: "reviewer-contract-test",
          cwdOrSurface: REPOSITORY_ROOT,
          commandOrPath: "AGENTS.md",
          result: "read",
        },
        trustDecision: "trusted",
        claims: [],
        validationRunRefs: [],
        disposition: "retain",
      },
    ],
    unavailableFindings: [],
  };
}

function createValidationRuns(): ValidationRun[] {
  return REQUIRED_SURFACE_VERSIONS.map((surfaceVersion) => ({
    validationId: `validation-${surfaceVersion.surface}-${surfaceVersion.version}`,
    action: "surface",
    repositoryRootOrActiveSurface: surfaceVersion.surface,
    surface: surfaceVersion.surface,
    version: surfaceVersion.version,
    scope: "reviewer-contract-fixture",
    executionLayer: "surface_validation",
    startedAtUtc: "2026-08-25T00:00:00.000Z",
    result: "pass",
    commandOrInteraction: "fresh exact-target validation",
    exitCodeOrOutcome: "exit 0",
    evidenceRefs: [`evidence-${surfaceVersion.surface}`],
    unverifiedItems: [],
    blocker: "none",
  }));
}

function createCompatibilityRecords(): CompatibilityRecord[] {
  const runs = createValidationRuns();
  return REQUIRED_SURFACE_VERSIONS.map((surfaceVersion, index) => ({
    ...surfaceVersion,
    status: "applicable",
    documentedBehavior: [],
    observedBehavior: [],
    evidenceFreshness: "fresh",
    versionSensitiveClaim: false,
    validationAction: "run fresh exact-target validation",
    validationRunRefs: [runs[index].validationId],
    enablementStatus: "enabled-valid",
    unsupportedClaims: [],
    migrationConstraints: [],
    rollbackPathRef: `rollback-${surfaceVersion.surface}`,
  }));
}

function createEvidenceRequest(
  overrides: Partial<EvidenceReviewRequest> = {},
): EvidenceReviewRequest {
  return {
    inputStageRef: CANONICAL_WAVE.integrationValidationGateRef,
    sourceInventory: createSourceInventory(),
    coverageMatrix: {
      entries: [
        {
          coverageId: "coverage-reviewer-contract",
          sourceId: "source-reviewer-contract",
          url: "repository://AGENTS.md",
          family: "repository guidance",
          discoveryMethod: "repository_seed",
          reviewDateUtc: "2026-08-25",
          surface: "Local_Repository_Surface",
          applicability: "applicable",
          keyConvention: "repository authority",
          versionSensitiveClaim: false,
          evidenceProvenanceRef: "source-reviewer-contract",
          availability: "available",
          disposition: "retain",
          validationAction: "none",
          status: "reviewed",
        },
      ],
      completeReviewStatement: COMPLETE_REVIEW_STATEMENT,
      complete: true,
      unavailableCandidateRefs: [],
      blockers: [],
    },
    exclusions: { entries: [] },
    artifactInventory: [
      {
        artifactId: "artifact:reviewer-contract",
        kind: "Kiro_Skill",
        path: ".kiro/skills/repo-map/SKILL.md",
        inventoryStatus: "present and readable",
        owner: "repository owner",
        configurationScope: "project",
        activationCondition: "after exact-surface validation",
        canonicalSource: "AGENTS.md",
        evidenceState: "Observed",
        disposition: "retain",
        maintenanceRisk: "low",
        evidenceRefs: ["source-reviewer-contract"],
        validationRunRefs: [],
        rollbackPath: "no rollback applies",
      },
    ],
    compatibilityRecords: createCompatibilityRecords(),
    ownerDecisions: [...OWNER_DECISIONS],
    validationRuns: createValidationRuns(),
    ...overrides,
  };
}

function createApprovalBoundary(
  overrides: Partial<ApprovalBoundary> = {},
): ApprovalBoundary {
  return {
    boundaryId: "approval-reviewer-contract",
    scope: "project",
    requestedChange: "validate repository-local guidance",
    targetSurface: "Local_Repository_Surface",
    owner: "repository owner",
    approvalStatus: "approved",
    approvalDate: "2026-08-25",
    preChangeStateRef: "snapshot-reviewer-contract",
    securityBoundary: "repository-local, no secrets or external services",
    expectedSideEffects: ["repository-local guidance becomes validated"],
    rollbackPathRef: "rollback-reviewer-contract",
    ...overrides,
  };
}

function createProposedHandover(): HandoverRecord {
  return {
    generatedAtUtc: "2026-08-25T00:00:00.000Z",
    reviewDateUtc: "2026-08-25",
    completeReviewStatement: COMPLETE_REVIEW_STATEMENT,
    firstReadPath: ["AGENTS.md"],
    coverageMatrixRef: "coverage-reviewer-contract",
    exclusionRegisterRef: "exclusions-reviewer-contract",
    officialFamilyStatuses: [],
    surfaceCompatibilityStatement: "all required surface/version targets reviewed",
    configurationPrecedenceMapRef: "precedence-reviewer-contract",
    capabilityDispositionTableRef: "disposition-reviewer-contract",
    reviewerStageRefs: ["handoff-EvidenceCompatibilityReviewer", "handoff-SafetyRollbackReviewer"],
    ownerDecisionRefs: [...OWNER_DECISION_IDS],
    evidenceStateLegend: [],
    artifactDispositions: [
      {
        artifactId: "artifact:reviewer-contract",
        canonicalPath: ".kiro/skills/repo-map/SKILL.md",
        disposition: "retain",
        evidenceRefs: ["source-reviewer-contract"],
        reason: "reviewer-contract fixture",
        activationCondition: "after exact-surface validation",
        owner: "repository owner",
        rollbackPath: "no rollback applies",
      },
    ],
    validationRuns: createValidationRuns(),
    knownGaps: [],
    rollbackRecords: [createRollbackRecord()],
    maintenanceTriggers: [],
    limitations: [],
  };
}

function createRollbackRecord(): RollbackRecord {
  return {
    rollbackId: "rollback-reviewer-contract",
    targetArtifactOrScope: "repository-local guidance",
    preChangeStateRef: "snapshot-reviewer-contract",
    rollbackAction: "restore captured bytes",
    expectedSuccessSignal: "captured bytes match",
    observedEvidence: "captured bytes match",
    result: "pass",
    verificationRunRef: "validation-rollback-reviewer-contract",
    owner: "repository owner",
  };
}

function createSafetyInput(
  overrides: Omit<Partial<SafetyReviewRequest>, "evidenceReview"> = {},
): Omit<SafetyReviewRequest, "evidenceReview"> {
  const knownGaps: KnownGapsRegister = { entries: [] };
  return {
    approvalBoundaries: [createApprovalBoundary()],
    policyFindings: [],
    snapshots: ["snapshot-reviewer-contract"],
    knownGaps,
    rollbackRecords: [createRollbackRecord()],
    proposedHandover: createProposedHandover(),
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
    wave: CANONICAL_WAVE,
    laneOutputs: {
      laneA: outputs[0],
      laneB: outputs[1],
      laneC: outputs[2],
      laneD: outputs[3],
    },
    reservations: CANONICAL_RESERVATIONS,
    conflicts: [],
    contractFreeze: CANONICAL_FREEZE,
    validationRuns: [CANONICAL_VALIDATION_RUN],
    finalGate: {
      predicates: {
        ownerApproval: true,
        freshExactTargetValidation: true,
        artifactSchemaPass: true,
        repositoryCompatibility: true,
        securityBoundaryConfirmed: true,
        rollbackReady: true,
        noBlockingKnownGap: true,
        policyGuardsPass: true,
        bothReviewerStagesPass: true,
      },
      evidenceRefs: ["evidence-owner-approved-final-gate"],
      priorStatePreserved: true,
      target: { surface: "Local_Repository_Surface", version: "repository" },
      limitations: [],
    },
    ...overrides,
  };
}

function resultOutput(
  result: ReturnType<typeof runIntegrationPipeline>,
): NonNullable<ReturnType<typeof runIntegrationPipeline>["output"]> {
  if (result.output === undefined) throw new Error("expected integration pipeline output");
  return result.output;
}

describe("integration reviewer contract", () => {
  it("permits only Integration gate -> Evidence -> Safety -> owner gate ordering", () => {
    const result = runIntegrationPipeline(
      createPipelineInput({
        reviewerInput: createReviewerInput(),
      }),
    );
    const output = resultOutput(result);

    expect(result.status).toBe("pass");
    expect(output.integrationGate.reviewerStages).toEqual([
      "EvidenceCompatibilityReviewer",
      "SafetyRollbackReviewer",
    ]);
    expect(output.reviewerHandoffRefs).toEqual([
      "handoff-EvidenceCompatibilityReviewer",
      "handoff-SafetyRollbackReviewer",
    ]);

    const evidenceReview = output.reviewerOutput?.evidenceReview.output;
    const safetyReview = output.reviewerOutput?.safetyReview?.output;
    if (evidenceReview === undefined || safetyReview === undefined) {
      throw new Error("expected both sequential reviewer outputs");
    }

    expect(evidenceReview.handoff).toMatchObject({
      fromStage: "Integration_Validation_Gate",
      toStage: "SafetyRollbackReviewer",
      order: 1,
    });
    expect(safetyReview.handoff).toMatchObject({
      fromStage: "EvidenceCompatibilityReviewer",
      toStage: "owner-approved Validation/Enablement gate",
      order: 2,
    });
    expect(output.enablementAllowed).toBe(true);
    expect(safetyReview.handoff.toStage).not.toBe("enabled-valid");
  });

  it("fixes one-reviewer-at-a-time, read-only, bounded reviewer stages and handoffs", () => {
    const result = runIntegrationPipeline(
      createPipelineInput({
        reviewerInput: createReviewerInput(),
      }),
    );
    const output = resultOutput(result);
    const reviewerOutput = output.reviewerOutput;
    if (reviewerOutput === undefined || reviewerOutput.safetyReview === undefined) {
      throw new Error("expected both reviewer stages");
    }

    for (const review of [reviewerOutput.evidenceReview, reviewerOutput.safetyReview]) {
      expect(review.output?.stage.readOnly).toBe(true);
      expect(review.output?.stage.maximumConcurrency).toBe(1);
      expect(review.output?.stage.iterationCeiling).toBe(3);
      expect(review.output?.stage.rollbackPath).toBe("no rollback applies");
      expect(review.output?.handoff.readOnly).toBe(true);
      expect(review.output?.handoff.maximumConcurrency).toBe(1);
      expect(review.output?.handoff.iterationCeiling).toBe(3);
    }

    expect(INTEGRATION_PIPELINE_POLICY.reviewerExecution).toBe("sequential");
    expect(INTEGRATION_PIPELINE_POLICY.maximumReviewerConcurrency).toBe(1);
    expect(INTEGRATION_PIPELINE_POLICY.reviewerIterationCeiling).toBe(3);
    expect(INTEGRATION_PIPELINE_POLICY.automaticRetries).toBe("prohibited");
    expect(INTEGRATION_PIPELINE_POLICY.automaticReplans).toBe("prohibited");
    expect(INTEGRATION_PIPELINE_POLICY.externalRouting).toBe("prohibited");
    expect(INTEGRATION_PIPELINE_POLICY.enablementBeforeFinalGate).toBe("prohibited");
    expect(INTEGRATION_PIPELINE_POLICY.graphImpactExecution).toBe("manual fallback preserved");

    expect(output.integrationGate.enablementAllowed).toBe(true);
    expect(output.preservedPriorState).toBe(true);
    expect(output.integrationGate.reviewerStages).toHaveLength(2);
    expect(new Set(output.integrationGate.reviewerStages).size).toBe(2);
  });

  it("keeps worktree, spawning, retry, and replan safeguards prohibited", () => {
    expect(CANONICAL_WAVE.worktrees).toBe("prohibited");
    expect(CANONICAL_WAVE.hiddenSpawning).toBe("prohibited");
    expect(CANONICAL_WAVE.automaticRetries).toBe("prohibited");
    expect(CANONICAL_WAVE.automaticReplans).toBe("prohibited");
    expect(CANONICAL_WAVE.maxActiveAgents).toBeLessThanOrEqual(4);
  });

  it("blocks a reviewer handoff on incomplete evidence and preserves prior state", () => {
    const input = createPipelineInput({
      reviewerInput: createReviewerInput({
        coverageMatrix: {
          entries: [],
          completeReviewStatement: COMPLETE_REVIEW_STATEMENT,
          complete: false,
          unavailableCandidateRefs: [],
          blockers: [],
        },
      }),
    });
    const before = JSON.stringify(input);

    const result = runIntegrationPipeline(input);
    const output = resultOutput(result);

    expect(result.status).toBe("blocked");
    expect(output.reviewerOutput?.evidenceReview.status).toBe("blocked");
    expect(output.reviewerOutput?.bothReviewerStagesPass).toBe(false);
    expect(output.integrationGate.enablementAllowed).toBe(false);
    expect(output.enablementAllowed).toBe(false);
    expect(output.preservedPriorState).toBe(true);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("keeps downstream enablement blocked when EvidenceCompatibilityReviewer fails on incomplete evidence", () => {
    const reviewerInput = createReviewerInput({
      coverageMatrix: {
        entries: [],
        completeReviewStatement: COMPLETE_REVIEW_STATEMENT,
        complete: false,
        unavailableCandidateRefs: [],
        blockers: [],
      },
    });
    const before = JSON.stringify(reviewerInput);

    const result = runIntegrationPipeline(
      createPipelineInput({ reviewerInput }),
    );
    const output = resultOutput(result);
    const reviewerOutput = output.reviewerOutput;
    if (reviewerOutput === undefined) {
      throw new Error("expected the failed evidence review handoff to be recorded");
    }

    expect(result.status).toBe("blocked");
    expect(reviewerOutput.evidenceReview.status).toBe("blocked");
    expect(reviewerOutput.evidenceReview.output?.handoff.status).toBe("blocked");
    expect(reviewerOutput.evidenceReview.output?.handoff.blocker).toContain(
      "coverage matrix",
    );
    expect(reviewerOutput.safetyReview).toBeDefined();
    expect(reviewerOutput.bothReviewerStagesPass).toBe(false);
    expect(output.integrationGate.status).toBe("blocked");
    expect(output.integrationGate.enablementAllowed).toBe(false);
    expect(output.enablementAllowed).toBe(false);
    expect(output.preservedPriorState).toBe(true);

    const safetyOutput = reviewerOutput.safetyReview?.output;
    expect(safetyOutput?.stage.readOnly).toBe(true);
    expect(safetyOutput?.stage.maximumConcurrency).toBe(1);
    expect(safetyOutput?.stage.iterationCeiling).toBe(3);
    expect(safetyOutput?.stage.rollbackPath).toBe("no rollback applies");
    expect(safetyOutput?.handoff.readOnly).toBe(true);
    expect(JSON.stringify(reviewerInput)).toBe(before);
  });

  it("blocks a partial EvidenceCompatibilityReviewer handoff before safety approval or mutation", () => {
    const cleanResult = runIntegrationPipeline(
      createPipelineInput({ reviewerInput: createReviewerInput() }),
    );
    const cleanOutput = resultOutput(cleanResult);
    const evidenceReview = cleanOutput.reviewerOutput?.evidenceReview.output;
    if (evidenceReview === undefined) {
      throw new Error("expected a clean evidence review output");
    }

    const partialEvidenceReview = {
      ...evidenceReview,
      handoff: { ...evidenceReview.handoff, outputRefs: [] },
    };
    const safetyInput = {
      ...createSafetyInput(),
      evidenceReview: partialEvidenceReview,
    };
    const before = JSON.stringify(safetyInput);

    const result = createSafetyRollbackReviewer().review(safetyInput);
    expect(result.status).toBe("blocked");
    expect(result.output?.stage.status).toBe("blocked");
    expect(result.output?.stage.readOnly).toBe(true);
    expect(result.output?.stage.maximumConcurrency).toBe(1);
    expect(result.output?.stage.iterationCeiling).toBe(3);
    expect(result.output?.stage.rollbackPath).toBe("no rollback applies");
    expect(result.output?.handoff.readOnly).toBe(true);
    expect(result.output?.handoff.blocker).toContain(
      "does not reference the completed EvidenceCompatibilityReviewer output",
    );
    expect(JSON.stringify(safetyInput)).toBe(before);
  });

  it.each([
    "global configuration changed without an approval boundary",
    "external MCP capability enabled without an approval boundary",
    "Crew worktree requested by a reviewer",
  ])("blocks %s and cannot bypass the owner gate", (policyFinding) => {
    const result = runIntegrationPipeline(
      createPipelineInput({
        reviewerInput: createReviewerInput({}, { policyFindings: [policyFinding] }),
      }),
    );
    const output = resultOutput(result);

    expect(result.status).toBe("blocked");
    expect(output.reviewerOutput?.safetyReview?.status).toBe("blocked");
    expect(output.reviewerOutput?.safetyReview?.blockers.join(" ")).toContain("policy");
    expect(output.enablementAllowed).toBe(false);
    expect(output.preservedPriorState).toBe(true);
  });

  it("blocks approval bypass even when all repository evidence is otherwise complete", () => {
    const result = runIntegrationPipeline(
      createPipelineInput({
        reviewerInput: createReviewerInput({}, {
          approvalBoundaries: [createApprovalBoundary({ approvalStatus: "pending" })],
        }),
      }),
    );
    const output = resultOutput(result);

    expect(result.status).toBe("blocked");
    expect(output.reviewerOutput?.safetyReview?.status).toBe("blocked");
    expect(output.reviewerOutput?.safetyReview?.blockers.join(" ")).toContain("pending");
    expect(output.enablementAllowed).toBe(false);
    expect(output.preservedPriorState).toBe(true);
  });
});
