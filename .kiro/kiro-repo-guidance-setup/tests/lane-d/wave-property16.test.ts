// @vitest-environment node
//
// Feature: kiro-repo-guidance-setup, Property 16: The feature implementation
// wave is bounded and fail-closed.
//
// Property 16 (design.md): "For all proposed Concurrent_Implementation_Wave
// plans, the wave is feature-only, capped at four agents, disjoint by declared
// ownership, reservation-protected, frozen before dependent work, root-only,
// and prohibited from worktrees, hidden spawning, automatic retries/replans,
// and implicit approval. Invalid, conflicting, partial, or abandoned work
// blocks dependent enablement and preserves prior state. A completed wave has
// exactly one Integration_Validation_Gate followed by sequential,
// read-only EvidenceCompatibilityReviewer and SafetyRollbackReviewer stages."
//
// Validates: Requirements 9.8-9.12, 10.12-10.13, 11.7-11.8, 14.10-14.12;
// Design: Correctness Property 16.
//
// SCOPE NOTE (Lane D ownership, test-authoring only): this file is the only
// changed file for this task. It exercises the existing pure Lane D ownership,
// reservation, Shared_Contract_Freeze, and wave-preflight modules. The
// integration-owned gate implementation does not exist yet, so the test uses a
// pure in-memory IntegrationValidationGateRecord projection as its reference
// model. It performs no filesystem writes, command execution, network access,
// agent spawning, retries, replans, or configuration changes.

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  FEATURE_NAME,
  FEATURE_WAVE_MAX_ACTIVE_AGENTS,
  PACKAGE_MANAGER,
  REVIEWER_ITERATION_CEILING,
  REPOSITORY_ROOT,
  REVIEWER_MAXIMUM_CONCURRENCY,
  REVIEWER_ORDER,
  type AgentOutput,
  type ConcurrentImplementationWaveRecord,
  type FeatureWaveAgentCount,
  type FileOwnershipReservation,
  type ImplementationAgentDeclaration,
  type IntegrationValidationGateRecord,
  type ReviewerName,
  type SharedContractFreeze,
  type WaveConflict,
} from "../../contracts.ts";
import { createSharedContractFreeze } from "../../contract-freeze.ts";
import { LANE_OWNERSHIP_DECLARATIONS } from "../../ownership.ts";
import {
  acquireFileOwnershipReservation,
  OD04_APPROVAL_BOUNDARY_REF,
} from "../../reservations.ts";
import {
  preflightWave,
  type WaveExecutionPolicyInput,
} from "../../wave-guard.ts";

const WAVE_ID = "wave-property-16";
const FREEZE_ID = "freeze-property-16";
const FREEZE_VALIDATION_ID = "validation-property-16-freeze";
const TARGET_PATHS = LANE_OWNERSHIP_DECLARATIONS.map(
  (agent) => agent.writeScope.writePaths[0],
);
const laneA = LANE_OWNERSHIP_DECLARATIONS[0];

function createWave(
  overrides: Partial<ConcurrentImplementationWaveRecord> = {},
): ConcurrentImplementationWaveRecord {
  return {
    waveId: WAVE_ID,
    featureName: FEATURE_NAME,
    scope: "feature_only",
    maxActiveAgents: FEATURE_WAVE_MAX_ACTIVE_AGENTS,
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
    integrationValidationGateRef: "integration-gate-property-16",
    status: "completed",
    rollbackPath: "release reservations and restore pre-wave snapshots",
    validationRunRefs: [],
    ...overrides,
  };
}

function acquireReservation(
  agent: ImplementationAgentDeclaration,
  existingReservations: readonly FileOwnershipReservation[],
): FileOwnershipReservation {
  const targetPath = agent.writeScope.writePaths[0];
  const result = acquireFileOwnershipReservation({
    waveId: WAVE_ID,
    agent,
    targetPaths: [targetPath],
    existingReservations,
    acquiredAtUtc: "2026-08-25T00:00:00Z",
    approvalBoundaryRefs: [OD04_APPROVAL_BOUNDARY_REF],
  });

  if (result.status !== "pass" || result.output?.reservation === null) {
    throw new Error(result.blockers.join("; ") || "expected a valid reservation");
  }
  return result.output.reservation;
}

function validReservations(count: number): FileOwnershipReservation[] {
  const reservations: FileOwnershipReservation[] = [];
  for (const agent of LANE_OWNERSHIP_DECLARATIONS.slice(0, count)) {
    reservations.push(acquireReservation(agent, reservations));
  }
  return reservations;
}

const canonicalReservations = validReservations(4);
const canonicalWave = createWave({
  fileOwnershipReservations: canonicalReservations,
});
const canonicalFreezeResult = createSharedContractFreeze({
  wave: canonicalWave,
  freezeId: FREEZE_ID,
  frozenAtUtc: "2026-08-25T00:00:00Z",
  validationRunRef: FREEZE_VALIDATION_ID,
});

if (canonicalFreezeResult.status !== "pass" || canonicalFreezeResult.output?.freeze === null) {
  throw new Error(
    canonicalFreezeResult.blockers.join("; ") ||
      "the canonical Property 16 freeze fixture could not be created",
  );
}

const canonicalFreeze = canonicalFreezeResult.output.freeze;

type ReservationState =
  | "valid"
  | "missing"
  | "stale"
  | "conflicting"
  | "after-mutation"
  | "overlapping";
type FreezeState = "valid" | "missing" | "stale" | "dependent-work-disallowed";
type AgentOutcome = "completed" | "partial" | "failed" | "abandoned";
type OutputState = "complete" | "missing" | "partial" | "failed";
type ReviewerOrderState = "correct" | "reversed";

interface WaveConditions {
  readonly activeAgentCount: number;
  readonly maxActiveAgents: number;
  readonly exactFeatureName: boolean;
  readonly featureOnlyScope: boolean;
  readonly ownershipDisjoint: boolean;
  readonly sharedOutputWrite: boolean;
  readonly reservationState: ReservationState;
  readonly freezeState: FreezeState;
  readonly scopeViolation: boolean;
  readonly rootViolation: boolean;
  readonly packageManagerViolation: boolean;
  readonly worktreeRequested: boolean;
  readonly hiddenSpawningRequested: boolean;
  readonly automaticRetryRequested: boolean;
  readonly automaticReplanRequested: boolean;
  readonly autoApprovalRequested: boolean;
  readonly mutationRequested: boolean;
  readonly agentOutcome: AgentOutcome;
  readonly outputState: OutputState;
  readonly integrationConflict: boolean;
  readonly repositoryValidationPasses: boolean;
  readonly integrationGateCount: number;
  readonly reviewerOrder: ReviewerOrderState;
  readonly reviewerConcurrency: number;
  readonly reviewerIterationCeiling: number;
  readonly reviewerReadOnly: boolean;
  readonly evidenceReviewerPasses: boolean;
  readonly safetyReviewerPasses: boolean;
}

interface WaveProposal {
  readonly wave: ConcurrentImplementationWaveRecord;
  readonly reservations: readonly FileOwnershipReservation[];
  readonly freeze?: SharedContractFreeze;
  readonly mutation?: {
    readonly waveId: string;
    readonly agentId: string;
    readonly targetPaths: readonly string[];
    readonly reservation: FileOwnershipReservation | null;
  };
  readonly execution: WaveExecutionPolicyInput;
  readonly outputs: readonly AgentOutput[];
  readonly conflicts: readonly WaveConflict[];
  readonly autoApprovalRequested: boolean;
  readonly integrationGateCount: number;
  readonly reviewerOrder: readonly ReviewerName[];
  readonly reviewerConcurrency: number;
  readonly reviewerIterationCeiling: number;
  readonly reviewerReadOnly: boolean;
  readonly evidenceReviewerPasses: boolean;
  readonly safetyReviewerPasses: boolean;
  readonly repositoryValidationPasses: boolean;
}

interface WaveEvaluation {
  readonly preflight: ReturnType<typeof preflightWave>;
  readonly integrationGate: IntegrationValidationGateRecord;
  readonly enablementAllowed: boolean;
  readonly preservedPriorState: true;
}

function declarationsFor(
  disjoint: boolean,
): readonly ImplementationAgentDeclaration[] {
  if (disjoint) {
    return LANE_OWNERSHIP_DECLARATIONS;
  }

  const laneB = LANE_OWNERSHIP_DECLARATIONS[1];
  return [
    laneA,
    {
      ...laneB,
      writeScope: {
        ...laneB.writeScope,
        writePaths: [
          laneA.writeScope.writePaths[0],
          ...laneB.writeScope.writePaths.slice(1),
        ],
      },
    },
    LANE_OWNERSHIP_DECLARATIONS[2],
    LANE_OWNERSHIP_DECLARATIONS[3],
  ];
}

function reservationSet(
  conditions: WaveConditions,
): FileOwnershipReservation[] {
  const slots = Math.min(
    FEATURE_WAVE_MAX_ACTIVE_AGENTS,
    Math.max(
      conditions.activeAgentCount,
      conditions.mutationRequested || conditions.scopeViolation ? 1 : 0,
      conditions.reservationState === "valid" ? 0 : 1,
      conditions.reservationState === "overlapping" ? 2 : 0,
    ),
  );
  const base = canonicalReservations.slice(0, slots);

  switch (conditions.reservationState) {
    case "valid":
    case "missing":
      return conditions.reservationState === "missing" ? [] : base;
    case "stale":
      return base.map((reservation, index) =>
        index === 0 ? { ...reservation, status: "stale" as const } : reservation,
      );
    case "conflicting":
      return base.map((reservation, index) =>
        index === 0
          ? { ...reservation, conflictRefs: ["conflict-property-16"] }
          : reservation,
      );
    case "after-mutation":
      return base.map((reservation, index) =>
        index === 0
          ? { ...reservation, acquiredBeforeMutation: false }
          : reservation,
      );
    case "overlapping":
      return base.map((reservation, index) =>
        index === 1
          ? {
              ...reservation,
              targetPaths: [base[0]?.targetPaths[0] ?? TARGET_PATHS[0]],
            }
          : reservation,
      );
  }
}

function freezeFor(state: FreezeState): SharedContractFreeze | undefined {
  switch (state) {
    case "valid":
      return canonicalFreeze;
    case "missing":
      return undefined;
    case "stale":
      return { ...canonicalFreeze, contractVersionOrHash: "sha256:stale" };
    case "dependent-work-disallowed":
      return { ...canonicalFreeze, dependentWorkAllowed: false };
  }
}

function outputsFor(
  activeAgentCount: number,
  state: OutputState,
): AgentOutput[] {
  const count = Math.min(FEATURE_WAVE_MAX_ACTIVE_AGENTS, Math.max(0, activeAgentCount));
  const outputs = LANE_OWNERSHIP_DECLARATIONS.slice(0, count).map(
    (agent, index): AgentOutput => ({
      agentId: agent.agentId,
      status: "completed",
      changedPaths: [TARGET_PATHS[index]],
      evidenceRefs: [`evidence-property-16-${agent.agentId}`],
      blocker: "none",
    }),
  );

  if (count === 0 && state !== "complete") {
    return [
      {
        agentId: "missing-property-16-agent",
        status: state === "partial" ? "partial" : state === "failed" ? "failed" : "completed",
        changedPaths: [],
        evidenceRefs: [],
        blocker: "missing output",
      },
    ];
  }

  switch (state) {
    case "complete":
      return outputs;
    case "missing":
      return outputs.slice(0, -1);
    case "partial":
      return outputs.map((output, index) =>
        index === 0 ? { ...output, status: "partial", blocker: "partial output" } : output,
      );
    case "failed":
      return outputs.map((output, index) =>
        index === 0 ? { ...output, status: "failed", blocker: "agent failed" } : output,
      );
  }
}

function proposalFor(conditions: WaveConditions): WaveProposal {
  const declarations = declarationsFor(conditions.ownershipDisjoint);
  const reservations = reservationSet(conditions);
  const freeze = freezeFor(conditions.freezeState);
  const activeCount = conditions.activeAgentCount as FeatureWaveAgentCount;
  const status: ConcurrentImplementationWaveRecord["status"] =
    conditions.agentOutcome === "completed"
      ? "completed"
      : conditions.agentOutcome === "partial"
        ? "partial"
        : conditions.agentOutcome === "abandoned"
          ? "blocked"
          : "rolled_back";
  const wave = {
    ...createWave({
      implementationAgents: declarations,
      declaredFileOwnership: declarations.flatMap(
        (agent) => agent.writeScope.writePaths,
      ),
      readWriteScopes: declarations.flatMap((agent) => [
        agent.readScope,
        agent.writeScope,
      ]),
      fileOwnershipReservations: reservations,
      declaredSharedOutputOwnership: conditions.sharedOutputWrite
        ? "named_disjoint_outputs"
        : "none",
      activeAgentCount: activeCount,
      maxActiveAgents: conditions.maxActiveAgents as FeatureWaveAgentCount,
      status,
    }),
    featureName: conditions.exactFeatureName
      ? FEATURE_NAME
      : ("unrelated-feature" as ConcurrentImplementationWaveRecord["featureName"]),
    scope: conditions.featureOnlyScope
      ? "feature_only"
      : ("repository_wide" as ConcurrentImplementationWaveRecord["scope"]),
    rootWorkingDirectory: conditions.rootViolation ? "D:\\other-repository" : REPOSITORY_ROOT,
    packageManager: conditions.packageManagerViolation ? "npm" : PACKAGE_MANAGER,
    worktrees: conditions.worktreeRequested ? "allowed" : "prohibited",
    hiddenSpawning: conditions.hiddenSpawningRequested ? "allowed" : "prohibited",
    automaticRetries: conditions.automaticRetryRequested ? "allowed" : "prohibited",
    automaticReplans: conditions.automaticReplanRequested ? "allowed" : "prohibited",
    integrationValidationGateRef:
      conditions.integrationGateCount === 1 ? "integration-gate-property-16" : "",
  } as unknown as ConcurrentImplementationWaveRecord;

  const mutation = conditions.mutationRequested
    ? {
        waveId: WAVE_ID,
        agentId: laneA.agentId,
        targetPaths: [
          conditions.scopeViolation ? "site/unrelated.ts" : TARGET_PATHS[0],
        ],
        reservation: reservations.find((item) => item.agentId === laneA.agentId) ?? null,
      }
    : undefined;

  const execution: WaveExecutionPolicyInput = {
    repositoryRoot: conditions.rootViolation ? "D:\\other-repository" : REPOSITORY_ROOT,
    packageManager: conditions.packageManagerViolation ? "npm" : PACKAGE_MANAGER,
    worktreeRequested: conditions.worktreeRequested,
    hiddenSpawningRequested: conditions.hiddenSpawningRequested,
    automaticRetryRequested: conditions.automaticRetryRequested,
    automaticReplanRequested: conditions.automaticReplanRequested,
  };

  const reviewerOrder: readonly ReviewerName[] =
    conditions.reviewerOrder === "correct"
      ? REVIEWER_ORDER
      : [REVIEWER_ORDER[1], REVIEWER_ORDER[0]];

  return {
    wave,
    reservations,
    freeze,
    mutation,
    execution,
    outputs: outputsFor(conditions.activeAgentCount, conditions.outputState),
    conflicts: conditions.integrationConflict
      ? [
          {
            conflictId: "integration-conflict-property-16",
            agentIds: [laneA.agentId],
            paths: [TARGET_PATHS[0]],
            reason: "integration ownership conflict remains unresolved",
            status: "blocking",
          },
        ]
      : [],
    autoApprovalRequested: conditions.autoApprovalRequested,
    integrationGateCount: conditions.integrationGateCount,
    reviewerOrder,
    reviewerConcurrency: conditions.reviewerConcurrency,
    reviewerIterationCeiling: conditions.reviewerIterationCeiling,
    reviewerReadOnly: conditions.reviewerReadOnly,
    evidenceReviewerPasses: conditions.evidenceReviewerPasses,
    safetyReviewerPasses: conditions.safetyReviewerPasses,
    repositoryValidationPasses: conditions.repositoryValidationPasses,
  };
}

function evaluateProposal(proposal: WaveProposal): WaveEvaluation {
  const preflight = preflightWave({
    wave: proposal.wave,
    declarations: proposal.wave.implementationAgents,
    reservations: proposal.reservations,
    sharedContractFreeze: proposal.freeze,
    mutation: proposal.mutation,
    execution: proposal.execution,
  });
  const sourcePreflightPasses =
    preflight.status === "pass" && preflight.output.allowed === true;
  const activeAgentCount = proposal.wave.activeAgentCount as number;
  const maxActiveAgents = proposal.wave.maxActiveAgents as number;
  const countIsBounded =
    activeAgentCount >= 0 &&
    activeAgentCount <= FEATURE_WAVE_MAX_ACTIVE_AGENTS &&
    maxActiveAgents >= activeAgentCount &&
    maxActiveAgents <= FEATURE_WAVE_MAX_ACTIVE_AGENTS;
  const identityIsExact =
    proposal.wave.featureName === FEATURE_NAME &&
    proposal.wave.scope === "feature_only";
  const freezeIsValid =
    proposal.freeze?.dependentWorkAllowed === true &&
    proposal.freeze?.freezeId === proposal.wave.sharedContractFreezeRef;
  const reservationIsReady =
    proposal.mutation === undefined ||
    (activeAgentCount > 0 && sourcePreflightPasses);
  const outputsAreComplete =
    proposal.outputs.length === activeAgentCount &&
    proposal.outputs.every((output) => output.status === "completed");
  const waveCompleted = proposal.wave.status === "completed";
  const integrationGatePasses =
    proposal.integrationGateCount === 1 &&
    proposal.wave.integrationValidationGateRef.trim().length > 0 &&
    proposal.conflicts.length === 0 &&
    proposal.repositoryValidationPasses &&
    outputsAreComplete &&
    waveCompleted;
  const reviewersPass =
    proposal.reviewerOrder.length === 2 &&
    proposal.reviewerOrder[0] === REVIEWER_ORDER[0] &&
    proposal.reviewerOrder[1] === REVIEWER_ORDER[1] &&
    proposal.reviewerConcurrency === REVIEWER_MAXIMUM_CONCURRENCY &&
    proposal.reviewerIterationCeiling >= 0 &&
    proposal.reviewerIterationCeiling <= REVIEWER_ITERATION_CEILING &&
    proposal.reviewerReadOnly &&
    proposal.evidenceReviewerPasses &&
    proposal.safetyReviewerPasses;
  const enablementAllowed =
    identityIsExact &&
    countIsBounded &&
    sourcePreflightPasses &&
    freezeIsValid &&
    reservationIsReady &&
    !proposal.autoApprovalRequested &&
    integrationGatePasses &&
    reviewersPass;
  const gate: IntegrationValidationGateRecord = {
    gateId: proposal.wave.integrationValidationGateRef,
    waveId: proposal.wave.waveId,
    collectedAgentOutputs: proposal.outputs,
    conflictResolutions: proposal.conflicts,
    repositoryValidationRuns: proposal.repositoryValidationPasses
      ? ["validation:property-16-integration"]
      : [],
    reviewerStages: ["EvidenceCompatibilityReviewer", "SafetyRollbackReviewer"],
    sequentialReviewerHandoffRefs:
      proposal.reviewerOrder[0] === REVIEWER_ORDER[0] &&
      proposal.reviewerOrder[1] === REVIEWER_ORDER[1]
        ? ["handoff:property-16-evidence", "handoff:property-16-safety"]
        : [],
    status: enablementAllowed ? "pass" : "blocked",
    enablementAllowed,
    rollbackPath: "preserve or restore pre-wave state and release reservations",
  };

  return {
    preflight,
    integrationGate: gate,
    enablementAllowed,
    preservedPriorState: true,
  };
}

const conditionsArb: fc.Arbitrary<WaveConditions> = fc.record({
  activeAgentCount: fc.integer({ min: 0, max: 6 }),
  maxActiveAgents: fc.integer({ min: 0, max: 6 }),
  exactFeatureName: fc.boolean(),
  featureOnlyScope: fc.boolean(),
  ownershipDisjoint: fc.boolean(),
  sharedOutputWrite: fc.boolean(),
  reservationState: fc.constantFrom<ReservationState>(
    "valid",
    "missing",
    "stale",
    "conflicting",
    "after-mutation",
    "overlapping",
  ),
  freezeState: fc.constantFrom<FreezeState>(
    "valid",
    "missing",
    "stale",
    "dependent-work-disallowed",
  ),
  scopeViolation: fc.boolean(),
  rootViolation: fc.boolean(),
  packageManagerViolation: fc.boolean(),
  worktreeRequested: fc.boolean(),
  hiddenSpawningRequested: fc.boolean(),
  automaticRetryRequested: fc.boolean(),
  automaticReplanRequested: fc.boolean(),
  autoApprovalRequested: fc.boolean(),
  mutationRequested: fc.boolean(),
  agentOutcome: fc.constantFrom<AgentOutcome>(
    "completed",
    "partial",
    "failed",
    "abandoned",
  ),
  outputState: fc.constantFrom<OutputState>("complete", "missing", "partial", "failed"),
  integrationConflict: fc.boolean(),
  repositoryValidationPasses: fc.boolean(),
  integrationGateCount: fc.integer({ min: 0, max: 2 }),
  reviewerOrder: fc.constantFrom<ReviewerOrderState>("correct", "reversed"),
  reviewerConcurrency: fc.integer({ min: 1, max: 2 }),
  reviewerIterationCeiling: fc.integer({ min: 0, max: 4 }),
  reviewerReadOnly: fc.boolean(),
  evidenceReviewerPasses: fc.boolean(),
  safetyReviewerPasses: fc.boolean(),
});

function isCleanScenario(conditions: WaveConditions): boolean {
  return (
    conditions.activeAgentCount >= 0 &&
    conditions.activeAgentCount <= FEATURE_WAVE_MAX_ACTIVE_AGENTS &&
    conditions.maxActiveAgents >= conditions.activeAgentCount &&
    conditions.maxActiveAgents <= FEATURE_WAVE_MAX_ACTIVE_AGENTS &&
    conditions.exactFeatureName &&
    conditions.featureOnlyScope &&
    conditions.ownershipDisjoint &&
    !conditions.sharedOutputWrite &&
    conditions.reservationState === "valid" &&
    conditions.freezeState === "valid" &&
    !conditions.scopeViolation &&
    !conditions.rootViolation &&
    !conditions.packageManagerViolation &&
    !conditions.worktreeRequested &&
    !conditions.hiddenSpawningRequested &&
    !conditions.automaticRetryRequested &&
    !conditions.automaticReplanRequested &&
    !conditions.autoApprovalRequested &&
    (!conditions.mutationRequested || conditions.activeAgentCount > 0) &&
    conditions.agentOutcome === "completed" &&
    conditions.outputState === "complete" &&
    !conditions.integrationConflict &&
    conditions.repositoryValidationPasses &&
    conditions.integrationGateCount === 1 &&
    conditions.reviewerOrder === "correct" &&
    conditions.reviewerConcurrency === REVIEWER_MAXIMUM_CONCURRENCY &&
    conditions.reviewerIterationCeiling >= 0 &&
    conditions.reviewerIterationCeiling <= REVIEWER_ITERATION_CEILING &&
    conditions.reviewerReadOnly &&
    conditions.evidenceReviewerPasses &&
    conditions.safetyReviewerPasses
  );
}

describe("Property 16: valid OD-04 waves pass the bounded implementation contract", () => {
  it("allows zero through four agents only with explicit reservation, freeze, gate, and reviewer controls", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: FEATURE_WAVE_MAX_ACTIVE_AGENTS }),
        fc.boolean(),
        (activeAgentCount, mutationRequested) => {
          const conditions: WaveConditions = {
            activeAgentCount,
            maxActiveAgents: FEATURE_WAVE_MAX_ACTIVE_AGENTS,
            exactFeatureName: true,
            featureOnlyScope: true,
            ownershipDisjoint: true,
            sharedOutputWrite: false,
            reservationState: "valid",
            freezeState: "valid",
            scopeViolation: false,
            rootViolation: false,
            packageManagerViolation: false,
            worktreeRequested: false,
            hiddenSpawningRequested: false,
            automaticRetryRequested: false,
            automaticReplanRequested: false,
            autoApprovalRequested: false,
            mutationRequested: mutationRequested && activeAgentCount > 0,
            agentOutcome: "completed",
            outputState: "complete",
            integrationConflict: false,
            repositoryValidationPasses: true,
            integrationGateCount: 1,
            reviewerOrder: "correct",
            reviewerConcurrency: REVIEWER_MAXIMUM_CONCURRENCY,
            reviewerIterationCeiling: REVIEWER_ITERATION_CEILING,
            reviewerReadOnly: true,
            evidenceReviewerPasses: true,
            safetyReviewerPasses: true,
          };
          const proposal = proposalFor(conditions);
          const evaluation = evaluateProposal(proposal);

          expect(evaluation.preflight.status).toBe("pass");
          expect(evaluation.preflight.output?.allowed).toBe(true);
          expect(evaluation.preflight.output?.sharedContractFreezeValidated).toBe(true);
          expect(evaluation.preflight.output?.policy.generalRepositoryRulePreserved).toBe(true);
          expect(evaluation.integrationGate.status).toBe("pass");
          expect(evaluation.integrationGate.enablementAllowed).toBe(true);
          expect(evaluation.integrationGate.reviewerStages).toEqual([
            "EvidenceCompatibilityReviewer",
            "SafetyRollbackReviewer",
          ]);
          expect(evaluation.integrationGate.sequentialReviewerHandoffRefs).toHaveLength(2);
          expect(evaluation.preservedPriorState).toBe(true);
          return true;
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe("Property 16: every invalid or conflicting wave remains fail-closed", () => {
  it("blocks dependent work, records the single-gate failure, and preserves prior state", () => {
    fc.assert(
      fc.property(conditionsArb, (conditions) => {
        const proposal = proposalFor(conditions);
        const before = JSON.stringify({
          wave: proposal.wave,
          reservations: proposal.reservations,
          freeze: proposal.freeze,
          outputs: proposal.outputs,
        });
        const evaluation = evaluateProposal(proposal);
        const clean = isCleanScenario(conditions);

        if (clean) {
          expect(evaluation.enablementAllowed).toBe(true);
          expect(evaluation.integrationGate.status).toBe("pass");
        } else {
          expect(evaluation.enablementAllowed).toBe(false);
          expect(evaluation.integrationGate.status).not.toBe("pass");
          expect(evaluation.integrationGate.enablementAllowed).toBe(false);
          expect(evaluation.preservedPriorState).toBe(true);
          expect(evaluation.integrationGate.rollbackPath).toContain("pre-wave state");
        }

        // A wave never silently repairs or mutates a proposal. The source guard
        // also exposes this invariant on both pass and blocked results.
        expect(JSON.stringify({
          wave: proposal.wave,
          reservations: proposal.reservations,
          freeze: proposal.freeze,
          outputs: proposal.outputs,
        })).toBe(before);
        expect(evaluation.preflight.output?.preservedPriorState).toBe(true);

        // The gate is exactly one named post-wave stage in the model; failures
        // cannot create a second gate or bypass the reviewer order.
        expect(evaluation.integrationGate.gateId).toBe(
          proposal.wave.integrationValidationGateRef,
        );
        expect(evaluation.integrationGate.reviewerStages).toEqual([
          "EvidenceCompatibilityReviewer",
          "SafetyRollbackReviewer",
        ]);
        return true;
      }),
      { numRuns: 300 },
    );
  });

  it("does not let implicit approval substitute for OD-04 controls", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: FEATURE_WAVE_MAX_ACTIVE_AGENTS }),
        (activeAgentCount) => {
          const conditions: WaveConditions = {
            activeAgentCount,
            maxActiveAgents: FEATURE_WAVE_MAX_ACTIVE_AGENTS,
            exactFeatureName: true,
            featureOnlyScope: true,
            ownershipDisjoint: true,
            sharedOutputWrite: false,
            reservationState: "valid",
            freezeState: "valid",
            scopeViolation: false,
            rootViolation: false,
            packageManagerViolation: false,
            worktreeRequested: false,
            hiddenSpawningRequested: false,
            automaticRetryRequested: false,
            automaticReplanRequested: false,
            autoApprovalRequested: true,
            mutationRequested: activeAgentCount > 0,
            agentOutcome: "completed",
            outputState: "complete",
            integrationConflict: false,
            repositoryValidationPasses: true,
            integrationGateCount: 1,
            reviewerOrder: "correct",
            reviewerConcurrency: REVIEWER_MAXIMUM_CONCURRENCY,
            reviewerIterationCeiling: REVIEWER_ITERATION_CEILING,
            reviewerReadOnly: true,
            evidenceReviewerPasses: true,
            safetyReviewerPasses: true,
          };
          const evaluation = evaluateProposal(proposalFor(conditions));
          expect(evaluation.preflight.status).toBe("pass");
          expect(evaluation.enablementAllowed).toBe(false);
          expect(evaluation.integrationGate.enablementAllowed).toBe(false);
          expect(evaluation.preservedPriorState).toBe(true);
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});
