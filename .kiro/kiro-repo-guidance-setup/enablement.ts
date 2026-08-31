/**
 * Integration-owned final owner-approved enablement gate.
 *
 * This module is intentionally side-effect free. It consumes the frozen
 * integration-gate record and the two sequential reviewer outputs, then
 * projects a final decision. It never changes configuration, permissions,
 * files, external services, reviewer state, or the prior working state.
 */

import {
  REVIEWER_ITERATION_CEILING,
  REVIEWER_MAXIMUM_CONCURRENCY,
  REQUIRED_SURFACE_VERSIONS,
  REVIEWER_ORDER,
  type EnablementGate,
  type EnablementGateInput,
  type EnablementGateResult,
  type EnablementPredicates,
  type Identifier,
  type IntegrationValidationGateRecord,
  type ReviewResult,
  type StageResult,
  type SurfaceVersion,
} from "./contracts";
import type { SequentialReviewOutput } from "./reviewers";

export interface FinalEnablementGateInput extends EnablementGateInput {
  /** Exact surface/version selected by the owner for this final decision. */
  readonly target: SurfaceVersion;
  /** Limitations that must remain visible in the final owner projection. */
  readonly limitations: readonly string[];
  readonly integrationGate: IntegrationValidationGateRecord;
  /** Handoffs supplied by the integration pipeline, in reviewer order. */
  readonly reviewerHandoffRefs: readonly Identifier[];
  /**
   * The concrete output of runSequentialReview. It is optional for backwards
   * compatibility with the pre-final-gate pipeline contract, but absence is a
   * hard blocker and can never be interpreted as a passing review.
   */
  readonly reviewerOutput?: SequentialReviewOutput;
}

export type FinalOwnerApprovedGateRequest = Pick<
  FinalEnablementGateInput,
  "predicates" | "evidenceRefs" | "priorStatePreserved" | "target" | "limitations"
>;

export interface FinalOwnerApprovedGateProjection {
  readonly target: SurfaceVersion;
  readonly predicates: EnablementPredicates;
  readonly reviewerHandoffRefs: readonly Identifier[];
  readonly disposition: EnablementGateResult["status"];
  readonly evidenceRefs: readonly Identifier[];
  readonly limitations: readonly string[];
  readonly rollbackReady: boolean;
  readonly preservedPriorState: boolean;
  readonly executionStatus: "evaluated" | "blocked-before-evaluation";
}

export interface IntegrationOwnedFinalEnablementGate extends EnablementGate {
  evaluate(input: FinalEnablementGateInput): StageResult<EnablementGateResult>;
}

export type FinalGateInput = FinalEnablementGateInput;
export type FinalGate = IntegrationOwnedFinalEnablementGate;

export const ENABLEMENT_PREDICATE_KEYS: readonly (keyof EnablementPredicates)[] = [
  "ownerApproval",
  "freshExactTargetValidation",
  "artifactSchemaPass",
  "repositoryCompatibility",
  "securityBoundaryConfirmed",
  "rollbackReady",
  "noBlockingKnownGap",
  "policyGuardsPass",
  "bothReviewerStagesPass",
] as const;

const REVIEWER_ROLLBACK_PATH = "no rollback applies" as const;

function nonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter(nonEmpty))];
}

function sameSequence(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function isExactTarget(target: SurfaceVersion | undefined): boolean {
  return (
    target !== undefined &&
    REQUIRED_SURFACE_VERSIONS.some(
      (candidate) =>
        candidate.surface === target.surface && candidate.version === target.version,
    )
  );
}

function targetBlockers(input: FinalEnablementGateInput): string[] {
  return isExactTarget(input.target)
    ? []
    : ["exact target surface/version is missing or not one of the required targets"];
}

function reviewerResultsRecorded(input: FinalEnablementGateInput): boolean {
  const reviewerOutput = input.reviewerOutput;
  const evidenceOutput = reviewerOutput?.evidenceReview.output;
  const safetyOutput = reviewerOutput?.safetyReview?.output;

  return (
    reviewerOutput !== undefined &&
    evidenceOutput !== undefined &&
    safetyOutput !== undefined &&
    reviewerOutput.handoffRefs.length === 2 &&
    reviewerOutput.handoffRefs[0] === evidenceOutput.handoff.handoffId &&
    reviewerOutput.handoffRefs[1] === safetyOutput.handoff.handoffId
  );
}

function finalGateExecutionBlockers(input: FinalEnablementGateInput): string[] {
  if (reviewerResultsRecorded(input)) return [];
  return [
    "final owner-approved gate is blocked until both sequential reviewer results and handoffs are recorded",
  ];
}

function stageReviewBlockers(
  review: ReviewResult | undefined,
  expectedReviewer: (typeof REVIEWER_ORDER)[number],
  expectedOrder: 1 | 2,
  expectedFrom: "Integration_Validation_Gate" | "EvidenceCompatibilityReviewer",
  expectedTo: "SafetyRollbackReviewer" | "owner-approved Validation/Enablement gate",
): string[] {
  if (review === undefined) {
    return [`${expectedReviewer} output is missing`];
  }

  const blockers: string[] = [];
  if (review.reviewer !== expectedReviewer) {
    blockers.push(
      `expected ${expectedReviewer} output but received ${review.reviewer}`,
    );
  }
  if (review.stage.reviewer !== expectedReviewer) {
    blockers.push(`${expectedReviewer} stage identity is inconsistent`);
  }
  if (review.stage.status !== "pass") {
    blockers.push(
      `${expectedReviewer} stage status is ${review.stage.status}, not pass`,
    );
  }
  if (!review.stage.readOnly) {
    blockers.push(`${expectedReviewer} is not read-only`);
  }
  if (review.stage.maximumConcurrency !== REVIEWER_MAXIMUM_CONCURRENCY) {
    blockers.push(`${expectedReviewer} maximum concurrency is not one`);
  }
  if (review.stage.iterationCeiling !== REVIEWER_ITERATION_CEILING) {
    blockers.push(`${expectedReviewer} iteration ceiling is not three`);
  }
  if (review.stage.rollbackPath !== REVIEWER_ROLLBACK_PATH) {
    blockers.push(`${expectedReviewer} has an unexpected rollback path`);
  }
  if (review.handoff.order !== expectedOrder) {
    blockers.push(`${expectedReviewer} handoff order is not ${expectedOrder}`);
  }
  if (review.handoff.fromStage !== expectedFrom) {
    blockers.push(`${expectedReviewer} handoff source is not ${expectedFrom}`);
  }
  if (review.handoff.toStage !== expectedTo) {
    blockers.push(`${expectedReviewer} handoff target is not ${expectedTo}`);
  }
  if (!review.handoff.readOnly) {
    blockers.push(`${expectedReviewer} handoff is not read-only`);
  }
  if (review.handoff.maximumConcurrency !== REVIEWER_MAXIMUM_CONCURRENCY) {
    blockers.push(`${expectedReviewer} handoff maximum concurrency is not one`);
  }
  if (review.handoff.iterationCeiling !== REVIEWER_ITERATION_CEILING) {
    blockers.push(`${expectedReviewer} handoff iteration ceiling is not three`);
  }
  if (review.handoff.status !== "pass") {
    blockers.push(`${expectedReviewer} handoff status is ${review.handoff.status}`);
  }
  if (review.blockers.length > 0) {
    blockers.push(...review.blockers.map((blocker) => `${expectedReviewer} blocker: ${blocker}`));
  }
  if (review.evidenceRefs.length === 0) {
    blockers.push(`${expectedReviewer} has no evidence references`);
  }
  return blockers;
}

function reviewerBlockers(input: FinalEnablementGateInput): string[] {
  const reviewerOutput = input.reviewerOutput;
  if (reviewerOutput === undefined) {
    return [
      "both sequential reviewer outputs are required; missing EvidenceCompatibilityReviewer and SafetyRollbackReviewer output",
    ];
  }

  const blockers: string[] = [];
  if (!sameSequence(reviewerOutput.reviewerStages, REVIEWER_ORDER)) {
    blockers.push("reviewer stages are not in Integration -> Evidence -> Safety order");
  }
  if (!reviewerOutput.blockedHandoff) {
    // This is the expected clean value. No action is needed here.
  } else {
    blockers.push("sequential reviewer handoff is blocked");
  }
  if (!reviewerOutput.bothReviewerStagesPass) {
    blockers.push("both sequential reviewer stages must pass before enablement");
  }

  const evidence = reviewerOutput.evidenceReview;
  const safety = reviewerOutput.safetyReview;
  if (evidence.status !== "pass") {
    blockers.push(`EvidenceCompatibilityReviewer result is ${evidence.status}`);
  }
  if (safety === undefined) {
    blockers.push("SafetyRollbackReviewer output is missing");
  } else if (safety.status !== "pass") {
    blockers.push(`SafetyRollbackReviewer result is ${safety.status}`);
  }

  blockers.push(
    ...stageReviewBlockers(
      evidence.output,
      "EvidenceCompatibilityReviewer",
      1,
      "Integration_Validation_Gate",
      "SafetyRollbackReviewer",
    ),
  );
  blockers.push(
    ...stageReviewBlockers(
      safety?.output,
      "SafetyRollbackReviewer",
      2,
      "EvidenceCompatibilityReviewer",
      "owner-approved Validation/Enablement gate",
    ),
  );

  const expectedHandoffs = [
    evidence.output?.handoff.handoffId,
    safety?.output?.handoff.handoffId,
  ].filter((handoff): handoff is Identifier => handoff !== undefined);
  if (!sameSequence(reviewerOutput.handoffRefs, expectedHandoffs)) {
    blockers.push("reviewer output handoffs do not match both concrete reviewer outputs");
  }
  if (!sameSequence(input.reviewerHandoffRefs, reviewerOutput.handoffRefs)) {
    blockers.push("integration reviewer handoff references do not match reviewer output");
  }
  if (!sameSequence(input.integrationGate.sequentialReviewerHandoffRefs, input.reviewerHandoffRefs)) {
    blockers.push("integration gate handoff references do not match the supplied reviewer handoffs");
  }
  return blockers;
}

function integrationGateBlockers(input: FinalEnablementGateInput): string[] {
  const blockers: string[] = [];
  if (input.integrationGate.status !== "pass") {
    blockers.push(`Integration_Validation_Gate status is ${input.integrationGate.status}`);
  }
  if (!input.integrationGate.enablementAllowed) {
    blockers.push("Integration_Validation_Gate did not allow dependent enablement");
  }
  if (!sameSequence(input.integrationGate.reviewerStages, REVIEWER_ORDER)) {
    blockers.push("Integration_Validation_Gate reviewer stages are not in required order");
  }
  if (!nonEmpty(input.integrationGate.gateId) || !nonEmpty(input.integrationGate.waveId)) {
    blockers.push("Integration_Validation_Gate identity is incomplete");
  }
  return blockers;
}

function failedPredicateKeys(
  predicates: EnablementPredicates,
  integrationPasses: boolean,
  reviewersPass: boolean,
): (keyof EnablementPredicates)[] {
  const effective: EnablementPredicates = {
    ...predicates,
    repositoryCompatibility: predicates.repositoryCompatibility && integrationPasses,
    bothReviewerStagesPass: predicates.bothReviewerStagesPass && reviewersPass,
  };
  return ENABLEMENT_PREDICATE_KEYS.filter((key) => effective[key] !== true);
}

function predicateBlockers(
  failedPredicates: readonly (keyof EnablementPredicates)[],
): string[] {
  return failedPredicates.map((predicate) => `${predicate} prerequisite is not satisfied`);
}

function evidenceReferences(input: FinalEnablementGateInput): Identifier[] {
  const reviewerOutput = input.reviewerOutput;
  return unique([
    ...input.evidenceRefs,
    input.integrationGate.gateId,
    ...input.reviewerHandoffRefs,
    ...(reviewerOutput?.evidenceReview.evidenceRefs ?? []),
    ...(reviewerOutput?.safetyReview?.evidenceRefs ?? []),
    ...(reviewerOutput?.evidenceReview.output?.evidenceRefs ?? []),
    ...(reviewerOutput?.safetyReview?.output?.evidenceRefs ?? []),
  ]);
}

export class IntegrationOwnedEnablementGateService
  implements IntegrationOwnedFinalEnablementGate
{
  public evaluate(input: FinalEnablementGateInput): StageResult<EnablementGateResult> {
    const reviewerBlockerList = reviewerBlockers(input);
    const integrationBlockerList = integrationGateBlockers(input);
    const reviewersPass = reviewerBlockerList.length === 0;
    const integrationPasses = integrationBlockerList.length === 0;
    const failedPredicates = failedPredicateKeys(
      input.predicates,
      integrationPasses,
      reviewersPass,
    );
    const blockers = unique([
      ...predicateBlockers(failedPredicates),
      ...targetBlockers(input),
      ...integrationBlockerList,
      ...reviewerBlockerList,
      ...(input.priorStatePreserved
        ? []
        : ["prior working state is not confirmed as preserved"]),
    ]);
    const references = evidenceReferences(input);
    const enabled =
      input.priorStatePreserved &&
      failedPredicates.length === 0 &&
      integrationPasses &&
      reviewersPass;
    const result: EnablementGateResult = {
      status: enabled ? "enabled-valid" : "blocked",
      failedPredicates,
      evidenceRefs: references,
      preservedPriorState: input.priorStatePreserved,
    };

    if (!enabled) {
      return {
        status: "blocked",
        output: result,
        blockers,
        evidenceRefs: references,
      };
    }

    return {
      status: "pass",
      output: result,
      blockers: [],
      evidenceRefs: references,
    };
  }
}

function finalProjection(
  input: FinalEnablementGateInput,
  result: StageResult<EnablementGateResult>,
  executionStatus: FinalOwnerApprovedGateProjection["executionStatus"],
): FinalOwnerApprovedGateProjection {
  const output = result.output ?? {
    status: "blocked" as const,
    failedPredicates: failedPredicateKeys(input.predicates, false, false),
    evidenceRefs: evidenceReferences(input),
    preservedPriorState: input.priorStatePreserved,
  };

  return {
    target: input.target,
    predicates: { ...input.predicates },
    reviewerHandoffRefs: [...input.reviewerHandoffRefs],
    disposition: output.status,
    evidenceRefs: [...output.evidenceRefs],
    limitations: [...input.limitations],
    rollbackReady: input.predicates.rollbackReady,
    preservedPriorState: output.preservedPriorState,
    executionStatus,
  };
}

/**
 * Execute the final owner-approved gate from a complete integration/reviewer
 * handoff.  Missing reviewer records produce a blocked projection without
 * evaluating enablement; a recorded but failing reviewer result is evaluated
 * and remains blocked, preserving the failure evidence.
 */
export function runFinalOwnerApprovedGate(
  input: FinalEnablementGateInput,
): StageResult<FinalOwnerApprovedGateProjection> {
  const preconditionBlockers = finalGateExecutionBlockers(input);
  if (preconditionBlockers.length > 0) {
    const evidenceRefs = evidenceReferences(input);
    const result: StageResult<EnablementGateResult> = {
      status: "blocked",
      output: {
        status: "blocked",
        failedPredicates: failedPredicateKeys(input.predicates, false, false),
        evidenceRefs,
        preservedPriorState: input.priorStatePreserved,
      },
      blockers: unique([...preconditionBlockers, ...targetBlockers(input)]),
      evidenceRefs,
    };
    const projection = finalProjection(input, result, "blocked-before-evaluation");
    return {
      status: "blocked",
      output: projection,
      blockers: result.blockers,
      evidenceRefs,
    };
  }

  const result = integrationOwnedEnablementGate.evaluate(input);
  const projection = finalProjection(input, result, "evaluated");
  if (result.status === "pass") {
    return {
      status: "pass",
      output: projection,
      blockers: [],
      evidenceRefs: projection.evidenceRefs,
    };
  }

  return {
    status: result.status,
    output: projection,
    blockers: result.blockers,
    evidenceRefs: projection.evidenceRefs,
  };
}

/** Compatibility alias for callers that use the frozen interface name. */
export class EnablementGateService extends IntegrationOwnedEnablementGateService {}

export const integrationOwnedEnablementGate = new IntegrationOwnedEnablementGateService();
export const enablementGate = integrationOwnedEnablementGate;

export function runEnablementGate(
  input: FinalEnablementGateInput,
): StageResult<EnablementGateResult> {
  return integrationOwnedEnablementGate.evaluate(input);
}

export default integrationOwnedEnablementGate;
