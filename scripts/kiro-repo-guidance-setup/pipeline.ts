/**
 * Integration-owned orchestration for the completed implementation wave.
 *
 * The pipeline flattens the four named lane outputs into the frozen
 * IntegrationValidationRequest, runs the single post-wave gate, invokes the
 * sequential read-only reviewers, and optionally executes the final
 * owner-approved gate only after both reviewer records are complete. It does
 * not execute graph automation, external routing, retries, or replans.
 */

import {
  REVIEWER_ITERATION_CEILING,
  REVIEWER_MAXIMUM_CONCURRENCY,
  REVIEWER_ORDER,
  type AgentOutput,
  type FileOwnershipReservation,
  type Identifier,
  type IntegrationValidationGateRecord,
  type IntegrationValidationRequest,
  type SharedContractFreeze,
  type StageResult,
  type ValidationRun,
  type WaveConflict,
  type ConcurrentImplementationWaveRecord,
} from "./contracts";
import {
  runFinalOwnerApprovedGate,
  type FinalOwnerApprovedGateProjection,
  type FinalOwnerApprovedGateRequest,
} from "./enablement";
import {
  IntegrationValidationGateService,
  type IntegrationGateCollection,
  collectIntegrationGateEvidence,
} from "./integration-gate";
import {
  runSequentialReview,
  type SequentialReviewInput,
  type SequentialReviewOutput,
} from "./reviewers";

export const BLOCKED_EVIDENCE_REVIEW_HANDOFF =
  "handoff-EvidenceCompatibilityReviewer-blocked" as const;

export interface LaneOutputCollection {
  readonly laneA: AgentOutput | null;
  readonly laneB: AgentOutput | null;
  readonly laneC: AgentOutput | null;
  readonly laneD: AgentOutput | null;
}

export interface IntegrationPipelineInput {
  readonly wave: ConcurrentImplementationWaveRecord;
  readonly laneOutputs: LaneOutputCollection;
  readonly reservations: readonly FileOwnershipReservation[];
  readonly conflicts: readonly WaveConflict[];
  readonly contractFreeze: SharedContractFreeze;
  readonly validationRuns: readonly ValidationRun[];
  /** Owner-approved predicates are evaluated only after both reviewer outputs exist. */
  readonly finalGate?: FinalOwnerApprovedGateRequest;
  /** Reviewer inputs must be supplied by the completed Lane A–D evidence projection. */
  readonly reviewerInput?: SequentialReviewInput;
}

export interface IntegrationPipelinePolicy {
  readonly graphImpactExecution: "manual fallback preserved";
  readonly reviewerExecution: "sequential";
  readonly maximumReviewerConcurrency: typeof REVIEWER_MAXIMUM_CONCURRENCY;
  readonly reviewerIterationCeiling: typeof REVIEWER_ITERATION_CEILING;
  readonly automaticRetries: "prohibited";
  readonly automaticReplans: "prohibited";
  readonly externalRouting: "prohibited";
  readonly enablementBeforeFinalGate: "prohibited";
}

export interface IntegrationPipelineResult {
  readonly integrationGate: IntegrationValidationGateRecord;
  readonly collection: IntegrationGateCollection;
  readonly reviewerOutput?: SequentialReviewOutput;
  readonly reviewerHandoffRefs: readonly Identifier[];
  readonly finalGate?: StageResult<FinalOwnerApprovedGateProjection>;
  readonly enablementAllowed: boolean;
  readonly policy: IntegrationPipelinePolicy;
  readonly preservedPriorState: true;
}

export interface IntegrationPipeline {
  run(input: IntegrationPipelineInput): StageResult<IntegrationPipelineResult>;
}

export const INTEGRATION_PIPELINE_POLICY: IntegrationPipelinePolicy = {
  graphImpactExecution: "manual fallback preserved",
  reviewerExecution: "sequential",
  maximumReviewerConcurrency: REVIEWER_MAXIMUM_CONCURRENCY,
  reviewerIterationCeiling: REVIEWER_ITERATION_CEILING,
  automaticRetries: "prohibited",
  automaticReplans: "prohibited",
  externalRouting: "prohibited",
  enablementBeforeFinalGate: "prohibited",
};

function flattenLaneOutputs(lanes: LaneOutputCollection): AgentOutput[] {
  return [lanes.laneA, lanes.laneB, lanes.laneC, lanes.laneD].filter(
    (output): output is AgentOutput => output !== null,
  );
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function resolveReviewerHandoffRefs(
  reviewerOutput: SequentialReviewOutput | undefined,
): readonly Identifier[] {
  return reviewerOutput?.handoffRefs ?? [BLOCKED_EVIDENCE_REVIEW_HANDOFF];
}

function finalGateRecord(
  base: IntegrationValidationGateRecord,
  reviewerOutput: SequentialReviewOutput | undefined,
  enablementAllowed: boolean,
): IntegrationValidationGateRecord {
  const handoffRefs = resolveReviewerHandoffRefs(reviewerOutput);
  const reviewersPass = reviewerOutput?.bothReviewerStagesPass === true;
  const status: IntegrationValidationGateRecord["status"] =
    base.status !== "pass"
      ? base.status
      : reviewersPass
        ? "pass"
        : reviewerOutput === undefined
          ? "blocked"
          : "blocked";

  return {
    ...base,
    reviewerStages: REVIEWER_ORDER,
    sequentialReviewerHandoffRefs: [...handoffRefs],
    status,
    enablementAllowed: enablementAllowed && reviewersPass,
  };
}

function pipelineBlockers(
  collection: IntegrationGateCollection,
  reviewerOutput: SequentialReviewOutput | undefined,
): string[] {
  const blockers = [...collection.blockers];
  if (reviewerOutput === undefined) {
    blockers.push(
      collection.blockers.length === 0
        ? "reviewer inputs are required after the Integration_Validation_Gate; EvidenceCompatibilityReviewer handoff is blocked and enablement remains blocked"
        : "the Integration_Validation_Gate is blocked; EvidenceCompatibilityReviewer handoff is explicitly blocked",
    );
  }
  if (reviewerOutput !== undefined && !reviewerOutput.bothReviewerStagesPass) {
    blockers.push("both sequential reviewer stages must pass before dependent enablement");
    blockers.push(...(reviewerOutput.evidenceReview.blockers ?? []));
    blockers.push(...(reviewerOutput.safetyReview?.blockers ?? []));
  }
  return unique(blockers);
}

export function toIntegrationValidationRequest(
  input: IntegrationPipelineInput,
): IntegrationValidationRequest {
  return {
    wave: input.wave,
    outputs: flattenLaneOutputs(input.laneOutputs),
    reservations: [...input.reservations],
    conflicts: [...input.conflicts],
    contractFreeze: input.contractFreeze,
    validationRuns: [...input.validationRuns],
  };
}

export class IntegrationPipelineService implements IntegrationPipeline {
  private readonly gate: IntegrationValidationGateService;

  public constructor(gate: IntegrationValidationGateService = new IntegrationValidationGateService()) {
    this.gate = gate;
  }

  public run(input: IntegrationPipelineInput): StageResult<IntegrationPipelineResult> {
    const request = toIntegrationValidationRequest(input);
    const collectionResult = collectIntegrationGateEvidence(request);
    const collection = collectionResult.output;

    if (collection === undefined) {
      return {
        status: "blocked",
        blockers: collectionResult.blockers,
        evidenceRefs: collectionResult.evidenceRefs,
      };
    }

    const gateResult = this.gate.run(request);
    const gateRecord = gateResult.output ?? {
      gateId: input.wave.integrationValidationGateRef,
      waveId: input.wave.waveId,
      collectedAgentOutputs: request.outputs,
      conflictResolutions: collection.conflicts,
      repositoryValidationRuns: request.validationRuns.map((run) => run.validationId),
      reviewerStages: REVIEWER_ORDER,
      sequentialReviewerHandoffRefs: [],
      status: "blocked" as const,
      enablementAllowed: false,
      rollbackPath: input.wave.rollbackPath,
    };

    let reviewerOutput: SequentialReviewOutput | undefined;
    if (gateResult.status === "pass" && input.reviewerInput !== undefined) {
      reviewerOutput = runSequentialReview(input.reviewerInput);
    }

    const blockers = pipelineBlockers(collection, reviewerOutput);
    const reviewerPasses =
      gateResult.status === "pass" &&
      reviewerOutput?.bothReviewerStagesPass === true &&
      blockers.length === 0;
    const integrationGate = finalGateRecord(
      gateRecord,
      reviewerOutput,
      reviewerPasses,
    );
    const reviewerHandoffRefs = resolveReviewerHandoffRefs(reviewerOutput);
    const finalGate =
      input.finalGate === undefined
        ? undefined
        : runFinalOwnerApprovedGate({
            ...input.finalGate,
            integrationGate,
            reviewerHandoffRefs,
            reviewerOutput,
          });
    const finalGateBlockers = unique([
      ...(finalGate?.blockers ?? []),
      ...(reviewerPasses && finalGate === undefined
        ? ["final owner-approved gate input is required after both sequential reviewer results"]
        : []),
    ]);
    const finalGatePass =
      finalGate !== undefined &&
      finalGate.status === "pass" &&
      finalGate.output?.disposition === "enabled-valid";
    const enablementAllowed = reviewerPasses && finalGatePass;
    const result: IntegrationPipelineResult = {
      integrationGate,
      collection,
      reviewerOutput,
      reviewerHandoffRefs,
      finalGate,
      enablementAllowed,
      policy: INTEGRATION_PIPELINE_POLICY,
      preservedPriorState: true,
    };
    const evidenceRefs = unique([
      ...collection.evidenceRefs,
      ...reviewerHandoffRefs,
      ...(reviewerOutput?.evidenceReview.evidenceRefs ?? []),
      ...(reviewerOutput?.safetyReview?.evidenceRefs ?? []),
      ...(finalGate?.evidenceRefs ?? []),
    ]);
    const allBlockers = unique([...blockers, ...finalGateBlockers]);

    if (allBlockers.length > 0 || gateResult.status !== "pass") {
      return {
        status: gateResult.status === "partial" ? "partial" : "blocked",
        output: result,
        blockers: allBlockers.length > 0 ? allBlockers : gateResult.blockers,
        evidenceRefs,
      };
    }

    return {
      status: "pass",
      output: result,
      blockers: [],
      evidenceRefs,
    };
  }
}

export const integrationPipeline = new IntegrationPipelineService();
export const runIntegrationPipeline = (
  input: IntegrationPipelineInput,
): StageResult<IntegrationPipelineResult> => integrationPipeline.run(input);

export default integrationPipeline;
