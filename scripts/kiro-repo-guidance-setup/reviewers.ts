/**
 * Lane D — review-only roles and their bounded handoff contracts.
 *
 * This module implements the two sequential, read-only review stages that run
 * after the `Integration_Validation_Gate`:
 *
 *   1. `EvidenceCompatibilityReviewer` — reviews provenance, coverage,
 *      exclusions, artifact inventory, seven surface/version compatibility
 *      records, owner decisions, and `Validation_Run` freshness.
 *   2. `SafetyRollbackReviewer` — reviews approval boundaries, security /
 *      permission / network results, repository-policy findings, pre-change
 *      snapshots, the `Known_Gaps_Register`, rollback records, and the proposed
 *      `Handover_Record`.
 *
 * Both reviewers are read-only: they inspect inputs and emit findings and
 * blockers but never mutate configuration, spawn agents, create worktrees,
 * retry/replan automatically, bypass approval, or enable external / global /
 * Crew capabilities.  Each stage records `maximumConcurrency: 1`,
 * `iterationCeiling: 3`, `readOnly: true`, and `rollbackPath: "no rollback
 * applies"`.  The stages run strictly in order — EvidenceCompatibility first,
 * then SafetyRollback — and `SafetyRollbackReviewer` may not start on partial or
 * failed evidence-review output unless that failure is explicitly represented as
 * a recorded blocker in the sequential handoff.
 *
 * This file is side-effect-free: it performs no filesystem, network, command,
 * or configuration operations.  It only projects the frozen contract records
 * into read-only review findings.
 */

import {
  COMPLETE_REVIEW_STATEMENT,
  REQUIRED_SURFACE_VERSIONS,
  REVIEWER_ITERATION_CEILING,
  REVIEWER_MAXIMUM_CONCURRENCY,
  REVIEWER_ORDER,
  type Blocker,
  type CompatibilityRecord,
  type EvidenceReviewRequest,
  type EvidenceCompatibilityReviewer as EvidenceCompatibilityReviewerContract,
  type Identifier,
  type ReviewResult,
  type ReviewerHandoff,
  type ReviewerName,
  type ReviewerStageRecord,
  type ReviewerStageStatus,
  type SafetyReviewRequest,
  type SafetyRollbackReviewer as SafetyRollbackReviewerContract,
  type StageResult,
} from "./contracts";

const REVIEWER_ROLLBACK_PATH = "no rollback applies" as const;

const APPROVED_BOUNDARY_STATUS = "approved" as const;
const CLEAN_ROLLBACK_RESULT = "pass" as const;

function nonEmpty(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

/**
 * Derive the reviewer stage status from the collected blockers.
 *
 * Missing/stale/contradictory input, an unapproved boundary, a failed rollback,
 * a policy violation, or an inconsistent handover is a hard blocker and produces
 * `blocked`.  A review that could not start (its inputs were not present) is
 * `pending`.  Advisory findings (for example, "this surface remains Unverified")
 * are recorded on the stage but never, on their own, fail a review; they carry
 * forward as evidence for the owner-approved gate.  A completed review with no
 * blocker is a clean `pass`.
 */
function resolveStatus(options: {
  readonly blockers: readonly string[];
  readonly reviewComplete: boolean;
}): ReviewerStageStatus {
  if (options.blockers.length > 0) return "blocked";
  if (!options.reviewComplete) return "pending";
  return "pass";
}

function toBlocker(blockers: readonly string[]): Blocker {
  return blockers.length > 0 ? unique([...blockers]).join("; ") : "none";
}

function buildStageRecord(options: {
  readonly reviewer: ReviewerName;
  readonly inputStageRef: Identifier;
  readonly findings: readonly string[];
  readonly blockers: readonly string[];
  readonly status: ReviewerStageStatus;
}): ReviewerStageRecord {
  return {
    reviewer: options.reviewer,
    executionLayer: "reviewer_stage",
    maximumConcurrency: REVIEWER_MAXIMUM_CONCURRENCY,
    iterationCeiling: REVIEWER_ITERATION_CEILING,
    readOnly: true,
    inputStageRef: options.inputStageRef,
    outputFindings: unique([...options.findings]),
    blocker: toBlocker(options.blockers),
    status: options.status,
    rollbackPath: REVIEWER_ROLLBACK_PATH,
  };
}

function buildHandoff(options: {
  readonly reviewer: ReviewerName;
  readonly inputRefs: readonly Identifier[];
  readonly outputRefs: readonly Identifier[];
  readonly status: ReviewerStageStatus;
  readonly blockers: readonly string[];
}): ReviewerHandoff {
  const isEvidence = options.reviewer === "EvidenceCompatibilityReviewer";
  return {
    handoffId: `handoff-${options.reviewer}`,
    fromStage: isEvidence ? "Integration_Validation_Gate" : "EvidenceCompatibilityReviewer",
    toStage: isEvidence
      ? "SafetyRollbackReviewer"
      : "owner-approved Validation/Enablement gate",
    order: isEvidence ? 1 : 2,
    inputRefs: unique([...options.inputRefs]),
    outputRefs: unique([...options.outputRefs]),
    status: options.status,
    readOnly: true,
    maximumConcurrency: REVIEWER_MAXIMUM_CONCURRENCY,
    iterationCeiling: REVIEWER_ITERATION_CEILING,
    blocker: toBlocker(options.blockers),
  };
}

function buildReviewResult(options: {
  readonly reviewer: ReviewerName;
  readonly inputStageRef: Identifier;
  readonly inputRefs: readonly Identifier[];
  readonly outputRefs: readonly Identifier[];
  readonly findings: readonly string[];
  readonly blockers: readonly string[];
  readonly evidenceRefs: readonly Identifier[];
  readonly reviewComplete: boolean;
}): { readonly result: ReviewResult; readonly status: ReviewerStageStatus } {
  const status = resolveStatus({
    blockers: options.blockers,
    reviewComplete: options.reviewComplete,
  });
  const stage = buildStageRecord({
    reviewer: options.reviewer,
    inputStageRef: options.inputStageRef,
    findings: options.findings,
    blockers: options.blockers,
    status,
  });
  const handoff = buildHandoff({
    reviewer: options.reviewer,
    inputRefs: options.inputRefs,
    outputRefs: options.outputRefs,
    status,
    blockers: options.blockers,
  });
  return {
    status,
    result: {
      reviewer: options.reviewer,
      stage,
      handoff,
      findings: unique([...options.findings]),
      blockers: unique([...options.blockers]),
      evidenceRefs: unique([...options.evidenceRefs]),
    },
  };
}

function toStageResult(
  review: ReviewResult,
  status: ReviewerStageStatus,
): StageResult<ReviewResult> {
  if (status === "pass") {
    return {
      status: "pass",
      output: review,
      blockers: [],
      evidenceRefs: review.evidenceRefs,
    };
  }
  const stageStatus = status === "fail" ? "fail" : status === "pending" ? "not_run" : "blocked";
  return {
    status: stageStatus,
    output: review,
    blockers: review.blockers.length > 0 ? review.blockers : [`${review.reviewer} did not complete a clean review`],
    evidenceRefs: review.evidenceRefs,
  };
}

// ---------------------------------------------------------------------------
// EvidenceCompatibilityReviewer
// ---------------------------------------------------------------------------

function reviewEvidenceInputsPresent(input: EvidenceReviewRequest): string[] {
  const blockers: string[] = [];
  if (!nonEmpty(input.inputStageRef)) {
    blockers.push("integration gate input stage reference is missing");
  }
  if (input.sourceInventory.records.length === 0) {
    blockers.push("source inventory has no records to review");
  }
  if (input.coverageMatrix.entries.length === 0) {
    blockers.push("coverage matrix has no entries to review");
  }
  if (input.artifactInventory.length === 0) {
    blockers.push("artifact inventory has no records to review");
  }
  if (input.compatibilityRecords.length === 0) {
    blockers.push("no surface/version compatibility records were provided");
  }
  if (input.ownerDecisions.length === 0) {
    blockers.push("no owner-decision records were provided");
  }
  return blockers;
}

function reviewArtifactInventory(input: EvidenceReviewRequest): {
  findings: string[];
  blockers: string[];
} {
  const findings: string[] = [];
  const blockers: string[] = [];

  for (const artifact of input.artifactInventory) {
    if (!nonEmpty(artifact.artifactId) || !nonEmpty(artifact.path)) {
      blockers.push("artifact inventory contains a record without an artifact id and path");
    }
    if (!nonEmpty(artifact.owner) || !nonEmpty(artifact.configurationScope)) {
      blockers.push(
        `artifact ${artifact.artifactId || "unknown"} is missing owner or configuration scope`,
      );
    }
    if (!nonEmpty(artifact.canonicalSource) || !nonEmpty(artifact.activationCondition)) {
      blockers.push(
        `artifact ${artifact.artifactId || "unknown"} is missing canonical source or activation condition`,
      );
    }
    if (artifact.inventoryStatus !== "present and readable") {
      findings.push(
        `artifact ${artifact.artifactId || artifact.path} is ${artifact.inventoryStatus} and remains inactive until its contents are validated`,
      );
    }
    if (artifact.evidenceState === "Unverified") {
      findings.push(
        `artifact ${artifact.artifactId || artifact.path} remains Unverified; inventory evidence cannot establish compatibility`,
      );
    }
  }

  return { findings, blockers };
}

function reviewCoverageCompleteness(input: EvidenceReviewRequest): {
  findings: string[];
  blockers: string[];
} {
  const findings: string[] = [];
  const blockers: string[] = [];

  if (!input.coverageMatrix.complete) {
    blockers.push("coverage matrix is incomplete; relevant official pages remain unreviewed");
  }
  if (input.coverageMatrix.completeReviewStatement !== COMPLETE_REVIEW_STATEMENT) {
    blockers.push("coverage matrix does not carry the exact complete-review statement");
  }
  for (const gapBlocker of input.coverageMatrix.blockers) {
    if (nonEmpty(gapBlocker)) blockers.push(`coverage matrix blocker: ${gapBlocker}`);
  }

  const sourceIds = new Set(input.sourceInventory.records.map((record) => record.sourceId));
  const coveredSourceIds = new Set(
    input.coverageMatrix.entries.map((entry) => entry.sourceId),
  );
  for (const sourceId of sourceIds) {
    if (!coveredSourceIds.has(sourceId)) {
      blockers.push(`source inventory record ${sourceId} has no Coverage_Matrix entry`);
    }
  }
  for (const entry of input.coverageMatrix.entries) {
    if (!sourceIds.has(entry.sourceId)) {
      blockers.push(
        `Coverage_Matrix entry ${entry.coverageId} references missing source inventory record ${entry.sourceId}`,
      );
    }
  }

  for (const finding of input.sourceInventory.unavailableFindings) {
    findings.push(
      `unavailable candidate ${finding.sourceRef} is Unverified (${finding.availability}); it cannot become enabled-valid evidence`,
    );
  }

  const excludedIds = new Set(input.exclusions.entries.map((entry) => entry.candidateRef));
  const unavailableIds = new Set(
    input.sourceInventory.unavailableFindings.map((finding) => finding.sourceRef),
  );
  const matrixUnavailableIds = new Set(input.coverageMatrix.unavailableCandidateRefs);
  for (const unavailableId of unavailableIds) {
    if (!matrixUnavailableIds.has(unavailableId)) {
      blockers.push(
        `unavailable candidate ${unavailableId} is missing from Coverage_Matrix unavailableCandidateRefs`,
      );
    }
  }
  for (const unavailableId of matrixUnavailableIds) {
    if (!unavailableIds.has(unavailableId)) {
      findings.push(
        `Coverage_Matrix preserves unavailable candidate ${unavailableId}; its Unverified finding remains required before enablement`,
      );
    }
  }
  for (const excludedId of excludedIds) {
    if (unavailableIds.has(excludedId)) {
      blockers.push(
        `candidate ${excludedId} is recorded as both excluded and unavailable; exclusions and unavailable findings must stay distinct`,
      );
    }
  }

  return { findings, blockers };
}

function reviewCompatibilityFreshness(input: EvidenceReviewRequest): {
  findings: string[];
  blockers: string[];
} {
  const findings: string[] = [];
  const blockers: string[] = [];
  const targetKey = (surface: string, version: string): string => `${surface}\u0000${version}`;
  const requiredTargets = new Set(
    REQUIRED_SURFACE_VERSIONS.map((target) => targetKey(target.surface, target.version)),
  );
  const recordsByTarget = new Map<string, CompatibilityRecord[]>();

  for (const record of input.compatibilityRecords) {
    const key = targetKey(record.surface, record.version);
    const records = recordsByTarget.get(key) ?? [];
    records.push(record);
    recordsByTarget.set(key, records);
    if (!requiredTargets.has(key)) {
      blockers.push(
        `compatibility record ${record.surface} ${record.version} is not one of the seven required surface/version targets`,
      );
    }
  }

  for (const target of REQUIRED_SURFACE_VERSIONS) {
    const records = recordsByTarget.get(targetKey(target.surface, target.version)) ?? [];
    if (records.length === 0) {
      blockers.push(
        `compatibility record for surface/version ${target.surface} ${target.version} is missing`,
      );
    } else if (records.length > 1) {
      blockers.push(
        `compatibility record for surface/version ${target.surface} ${target.version} is duplicated`,
      );
    }
  }

  const validationRunsById = new Map(input.validationRuns.map((run) => [run.validationId, run]));
  const validationRunIds = new Set(input.validationRuns.map((run) => run.validationId));

  for (const record of input.compatibilityRecords) {
    const exactTarget = targetKey(record.surface, record.version);
    const exactPassingRun = record.validationRunRefs.some((ref) => {
      const run = validationRunsById.get(ref);
      return (
        run !== undefined &&
        run.result === "pass" &&
        run.blocker === "none" &&
        run.unverifiedItems.length === 0 &&
        targetKey(run.surface, run.version) === exactTarget &&
        nonEmpty(run.startedAtUtc)
      );
    });

    for (const ref of record.validationRunRefs) {
      const run = validationRunsById.get(ref);
      if (!validationRunIds.has(ref)) {
        blockers.push(
          `${record.surface} ${record.version} references Validation_Run ${ref} that was not provided to the reviewer`,
        );
      } else if (
        run !== undefined &&
        targetKey(run.surface, run.version) !== exactTarget
      ) {
        blockers.push(
          `${record.surface} ${record.version} references Validation_Run ${ref} for ${run.surface} ${run.version}; transferred evidence cannot establish compatibility`,
        );
      }
    }

    if (record.enablementStatus === "enabled-valid") {
      if (record.status !== "applicable") {
        blockers.push(
          `${record.surface} ${record.version} claims enabled-valid while its compatibility status is ${record.status}`,
        );
      }
      if (record.evidenceFreshness !== "fresh") {
        blockers.push(
          `${record.surface} ${record.version} claims enabled-valid without fresh evidence (freshness: ${record.evidenceFreshness})`,
        );
      }
      if (record.validationRunRefs.length === 0) {
        blockers.push(
          `${record.surface} ${record.version} claims enabled-valid without any Validation_Run reference`,
        );
      }
      if (!exactPassingRun) {
        blockers.push(
          `${record.surface} ${record.version} has no passing fresh exact-target Validation_Run; evidence may be transferred from another surface or version`,
        );
      }
    } else if (record.evidenceFreshness === "fresh" && !exactPassingRun) {
      findings.push(
        `${record.surface} ${record.version} is marked fresh without a passing fresh exact-target Validation_Run; it remains unavailable for enablement`,
      );
    }
  }

  for (const record of input.compatibilityRecords) {
    if (record.status === "Unverified") {
      findings.push(
        `${record.surface} ${record.version} remains Unverified and cannot be enabled without fresh exact-target validation`,
      );
    }
    for (const unsupported of record.unsupportedClaims) {
      if (nonEmpty(unsupported)) {
        findings.push(`${record.surface} ${record.version} unsupported claim: ${unsupported}`);
      }
    }
  }

  return { findings, blockers };
}

function reviewOwnerDecisionResolution(input: EvidenceReviewRequest): {
  findings: string[];
  blockers: string[];
} {
  const findings: string[] = [];
  const blockers: string[] = [];
  for (const decision of input.ownerDecisions) {
    if (decision.unresolvedStatus === "unresolved") {
      findings.push(
        `owner decision ${decision.decisionId} is unresolved; its safe fallback must hold and no enabled-valid claim may rely on it`,
      );
    }
    if (decision.approvalStatus === "pending") {
      findings.push(`owner decision ${decision.decisionId} approval is still pending`);
    }
    if (decision.approvalStatus === "rejected" || decision.approvalStatus === "expired") {
      blockers.push(
        `owner decision ${decision.decisionId} is ${decision.approvalStatus}; dependent enablement must remain blocked`,
      );
    }
  }
  return { findings, blockers };
}

export class EvidenceCompatibilityReviewerService
  implements EvidenceCompatibilityReviewerContract
{
  public review(input: EvidenceReviewRequest): StageResult<ReviewResult> {
    const presenceBlockers = reviewEvidenceInputsPresent(input);
    const artifactInventory = reviewArtifactInventory(input);
    const coverage = reviewCoverageCompleteness(input);
    const compatibility = reviewCompatibilityFreshness(input);
    const ownerDecisions = reviewOwnerDecisionResolution(input);

    const blockers = unique([
      ...presenceBlockers,
      ...artifactInventory.blockers,
      ...coverage.blockers,
      ...compatibility.blockers,
      ...ownerDecisions.blockers,
    ]);
    const findings = unique([
      ...artifactInventory.findings,
      ...coverage.findings,
      ...compatibility.findings,
      ...ownerDecisions.findings,
    ]);
    const evidenceRefs = unique([
      nonEmpty(input.inputStageRef) ? input.inputStageRef : "",
      "reviewer:EvidenceCompatibilityReviewer",
      ...input.sourceInventory.records.map((record) => record.sourceId),
      ...input.sourceInventory.unavailableFindings.flatMap((finding) => [
        finding.findingId,
        finding.sourceRef,
      ]),
      ...input.coverageMatrix.entries.flatMap((entry) => [
        entry.coverageId,
        entry.sourceId,
        entry.evidenceProvenanceRef,
      ]),
      ...input.coverageMatrix.unavailableCandidateRefs,
      ...input.exclusions.entries.flatMap((entry) => [
        entry.exclusionId,
        entry.candidateRef,
        entry.evidenceRef,
      ]),
      ...input.artifactInventory.flatMap((artifact) => [
        artifact.artifactId,
        ...artifact.evidenceRefs,
        ...artifact.validationRunRefs,
      ]),
      ...input.compatibilityRecords.flatMap((record) => [
        record.rollbackPathRef,
        ...record.validationRunRefs,
      ]),
      ...input.ownerDecisions.map((decision) => decision.evidenceRef),
      ...input.validationRuns.flatMap((run) => [run.validationId, ...run.evidenceRefs]),
    ]);

    const { result, status } = buildReviewResult({
      reviewer: "EvidenceCompatibilityReviewer",
      inputStageRef: nonEmpty(input.inputStageRef) ? input.inputStageRef : "missing-integration-gate-ref",
      inputRefs: [nonEmpty(input.inputStageRef) ? input.inputStageRef : "missing-integration-gate-ref"],
      outputRefs: ["reviewer:EvidenceCompatibilityReviewer"],
      findings,
      blockers,
      evidenceRefs,
      reviewComplete: presenceBlockers.length === 0,
    });

    return toStageResult(result, status);
  }
}

// ---------------------------------------------------------------------------
// SafetyRollbackReviewer
// ---------------------------------------------------------------------------

/**
 * The safety reviewer may only start after the evidence reviewer completed. A
 * partial or failed evidence review is permitted to reach this read-only stage
 * only when the failure is explicitly represented by the recorded handoff; it
 * can never become a clean sequential enablement result.
 */
function reviewHandoffPrecondition(input: SafetyReviewRequest): string[] {
  const blockers: string[] = [];
  const evidence = input.evidenceReview;
  const handoff = evidence.handoff;
  const orderedFirst = REVIEWER_ORDER[0];
  const expectedEvidenceOutputRef = "reviewer:EvidenceCompatibilityReviewer";

  if (evidence.reviewer !== "EvidenceCompatibilityReviewer") {
    blockers.push(
      "SafetyRollbackReviewer requires the EvidenceCompatibilityReviewer output as its input stage",
    );
  }
  if (evidence.stage.reviewer !== "EvidenceCompatibilityReviewer") {
    blockers.push("evidence-review stage identifies a different reviewer");
  }
  if (evidence.stage.executionLayer !== "reviewer_stage") {
    blockers.push("evidence-review stage is not a reviewer-stage record");
  }
  if (
    !evidence.stage.readOnly ||
    evidence.stage.maximumConcurrency !== REVIEWER_MAXIMUM_CONCURRENCY ||
    evidence.stage.iterationCeiling !== REVIEWER_ITERATION_CEILING ||
    evidence.stage.rollbackPath !== REVIEWER_ROLLBACK_PATH
  ) {
    blockers.push("evidence-review stage violates the sequential read-only reviewer bounds");
  }

  if (handoff.fromStage !== "Integration_Validation_Gate") {
    blockers.push("evidence-review handoff did not originate from the Integration_Validation_Gate");
  }
  if (handoff.toStage !== "SafetyRollbackReviewer") {
    blockers.push("evidence-review handoff is not addressed to SafetyRollbackReviewer");
  }
  if (handoff.order !== 1) {
    blockers.push("evidence-review handoff is out of sequential order");
  }
  if (evidence.reviewer !== orderedFirst) {
    blockers.push("reviewer order was not preserved: EvidenceCompatibilityReviewer must run first");
  }
  if (
    !handoff.readOnly ||
    handoff.maximumConcurrency !== REVIEWER_MAXIMUM_CONCURRENCY ||
    handoff.iterationCeiling !== REVIEWER_ITERATION_CEILING
  ) {
    blockers.push("evidence-review handoff violates the sequential read-only reviewer bounds");
  }
  if (!handoff.inputRefs.includes(evidence.stage.inputStageRef)) {
    blockers.push("evidence-review handoff does not reference its Integration_Validation_Gate input");
  }
  if (!handoff.outputRefs.includes(expectedEvidenceOutputRef)) {
    blockers.push("evidence-review handoff does not reference the completed EvidenceCompatibilityReviewer output");
  }

  if (handoff.status !== evidence.stage.status) {
    blockers.push("evidence-review stage status and recorded handoff status disagree");
  }
  const evidenceBlockerRecorded = evidence.blockers.length > 0;
  const stageBlockerRecorded = evidence.stage.blocker !== "none";
  const handoffBlockerRecorded = handoff.blocker !== "none" && nonEmpty(handoff.blocker);
  if (evidenceBlockerRecorded !== stageBlockerRecorded) {
    blockers.push("evidence-review blocker list and stage blocker disagree");
  }
  if (stageBlockerRecorded !== handoffBlockerRecorded || evidence.stage.blocker !== handoff.blocker) {
    blockers.push("evidence-review stage blocker and sequential handoff blocker disagree");
  }

  const evidenceStatus = handoff.status;
  const evidenceHasRecordedBlocker =
    evidenceBlockerRecorded || stageBlockerRecorded || handoffBlockerRecorded;
  if (
    (evidenceStatus === "fail" || evidenceStatus === "blocked" || evidenceStatus === "pending") &&
    !evidenceHasRecordedBlocker
  ) {
    blockers.push(
      "SafetyRollbackReviewer cannot start on partial or failed evidence review that is not represented as a recorded blocker",
    );
  }

  return blockers;
}

function reviewApprovalBoundaries(input: SafetyReviewRequest): {
  findings: string[];
  blockers: string[];
} {
  const findings: string[] = [];
  const blockers: string[] = [];
  if (input.approvalBoundaries.length === 0) {
    blockers.push("no Approval_Boundary record was provided; safety review cannot approve an unbounded change");
  }

  for (const boundary of input.approvalBoundaries) {
    const boundaryRef = boundary.boundaryId || "unknown boundary";
    if (!nonEmpty(boundary.scope) || !nonEmpty(boundary.requestedChange) || !nonEmpty(boundary.targetSurface)) {
      blockers.push(`${boundaryRef} is missing scope, requested change, or target surface`);
    }
    if (!nonEmpty(boundary.owner) || !nonEmpty(boundary.approvalDate)) {
      blockers.push(`${boundaryRef} is missing owner or approval date`);
    }
    if (boundary.approvalStatus !== APPROVED_BOUNDARY_STATUS) {
      blockers.push(
        `approval boundary ${boundaryRef} (${boundary.scope}) is ${boundary.approvalStatus}; the requested change must not proceed`,
      );
    }
    if (!nonEmpty(boundary.preChangeStateRef)) {
      blockers.push(
        `approval boundary ${boundaryRef} has no pre-change state reference; the change is not rollback-ready`,
      );
    }
    if (!nonEmpty(boundary.securityBoundary)) {
      blockers.push(
        `approval boundary ${boundaryRef} does not name a security/data boundary; the boundary is unsafe`,
      );
    }
    if (!nonEmpty(boundary.rollbackPathRef)) {
      blockers.push(`approval boundary ${boundaryRef} has no rollback path reference`);
    }
  }
  return { findings, blockers };
}

function reviewSnapshotReadiness(input: SafetyReviewRequest): {
  findings: string[];
  blockers: string[];
} {
  const findings: string[] = [];
  const blockers: string[] = [];
  const snapshotRefs = new Set(input.snapshots.filter(nonEmpty));
  if (snapshotRefs.size === 0) {
    blockers.push("no pre-change snapshot was provided; safety review cannot establish preserved prior state");
  }
  for (const boundary of input.approvalBoundaries) {
    if (nonEmpty(boundary.preChangeStateRef) && !snapshotRefs.has(boundary.preChangeStateRef)) {
      blockers.push(
        `approval boundary ${boundary.boundaryId} references missing pre-change snapshot ${boundary.preChangeStateRef}`,
      );
    }
  }
  for (const record of input.rollbackRecords) {
    if (nonEmpty(record.preChangeStateRef) && !snapshotRefs.has(record.preChangeStateRef)) {
      blockers.push(
        `rollback ${record.rollbackId} references missing pre-change snapshot ${record.preChangeStateRef}`,
      );
    }
  }
  return { findings, blockers };
}

function reviewRollbackReadiness(input: SafetyReviewRequest): {
  findings: string[];
  blockers: string[];
} {
  const findings: string[] = [];
  const blockers: string[] = [];
  if (input.rollbackRecords.length === 0) {
    blockers.push("no rollback record was provided; rollback readiness is incomplete");
  }

  for (const record of input.rollbackRecords) {
    if (record.result !== CLEAN_ROLLBACK_RESULT) {
      blockers.push(
        `rollback ${record.rollbackId} for ${record.targetArtifactOrScope} did not pass (${record.result}); downstream enablement is blocked`,
      );
    }
    if (!nonEmpty(record.preChangeStateRef)) {
      blockers.push(
        `rollback ${record.rollbackId} has no pre-change state reference to restore`,
      );
    }
    if (!nonEmpty(record.rollbackAction) || !nonEmpty(record.expectedSuccessSignal)) {
      blockers.push(`rollback ${record.rollbackId} is missing its restore action or expected success signal`);
    }
    if (!nonEmpty(record.observedEvidence)) {
      blockers.push(`rollback ${record.rollbackId} has no observed verification evidence`);
    }
    if (!nonEmpty(record.verificationRunRef)) {
      blockers.push(`rollback ${record.rollbackId} is not linked to a verification run`);
    }
    if (!nonEmpty(record.owner)) {
      blockers.push(`rollback ${record.rollbackId} has no owner`);
    }
  }
  return { findings, blockers };
}

function reviewKnownGaps(input: SafetyReviewRequest): {
  findings: string[];
  blockers: string[];
} {
  const findings: string[] = [];
  const blockers: string[] = [];
  for (const gap of input.knownGaps.entries) {
    if (gap.status === "open") {
      findings.push(
        `known gap ${gap.gapId} (${gap.kind}) is open and blocks ${gap.blockedAction}`,
      );
      if (gap.kind === "policy_conflict") {
        blockers.push(
          `known gap ${gap.gapId} is an open policy conflict; enablement must remain blocked until resolved`,
        );
      }
    }
  }
  return { findings, blockers };
}

function reviewPolicyFindings(input: SafetyReviewRequest): {
  findings: string[];
  blockers: string[];
} {
  const blockers: string[] = [];
  for (const finding of input.policyFindings) {
    if (nonEmpty(finding)) {
      blockers.push(`repository policy violation: ${finding}`);
    }
  }
  return { findings: [], blockers };
}

function reviewHandoverConsistency(input: SafetyReviewRequest): {
  findings: string[];
  blockers: string[];
} {
  const findings: string[] = [];
  const blockers: string[] = [];
  const handover = input.proposedHandover;
  if (handover === undefined) {
    findings.push("no proposed handover was provided for safety review");
    return { findings, blockers };
  }

  if (handover.completeReviewStatement !== COMPLETE_REVIEW_STATEMENT) {
    blockers.push("proposed handover does not carry the exact complete-review statement");
  }
  if (handover.artifactDispositions.length === 0) {
    blockers.push("proposed handover has no artifact dispositions");
  }

  const seenArtifacts = new Set<Identifier>();
  for (const disposition of handover.artifactDispositions) {
    if (seenArtifacts.has(disposition.artifactId)) {
      blockers.push(
        `proposed handover has more than one disposition for artifact ${disposition.artifactId}`,
      );
    }
    seenArtifacts.add(disposition.artifactId);
    if (!nonEmpty(disposition.rollbackPath)) {
      blockers.push(
        `handover disposition for ${disposition.artifactId} has no rollback path`,
      );
    }
  }

  for (const gap of handover.knownGaps) {
    if (gap.status === "open" && !nonEmpty(gap.nextValidationRun)) {
      blockers.push(
        `handover known gap ${gap.gapId} is open without a next validation run`,
      );
    }
  }

  return { findings, blockers };
}

export class SafetyRollbackReviewerService implements SafetyRollbackReviewerContract {
  public review(input: SafetyReviewRequest): StageResult<ReviewResult> {
    const preconditionBlockers = reviewHandoffPrecondition(input);
    const approvals = reviewApprovalBoundaries(input);
    const snapshots = reviewSnapshotReadiness(input);
    const rollback = reviewRollbackReadiness(input);
    const knownGaps = reviewKnownGaps(input);
    const policy = reviewPolicyFindings(input);
    const handover = reviewHandoverConsistency(input);

    const blockers = unique([
      ...preconditionBlockers,
      ...approvals.blockers,
      ...snapshots.blockers,
      ...rollback.blockers,
      ...knownGaps.blockers,
      ...policy.blockers,
      ...handover.blockers,
    ]);
    const findings = unique([
      ...approvals.findings,
      ...snapshots.findings,
      ...rollback.findings,
      ...knownGaps.findings,
      ...handover.findings,
    ]);

    const inputStageRef = input.evidenceReview.stage.inputStageRef;
    const evidenceRefs = unique([
      "reviewer:SafetyRollbackReviewer",
      "reviewer:EvidenceCompatibilityReviewer",
      ...input.snapshots,
    ]);

    // The safety reviewer only "completes" its review when it is allowed to
    // start; a blocked precondition means the review did not run.
    const { result, status } = buildReviewResult({
      reviewer: "SafetyRollbackReviewer",
      inputStageRef: nonEmpty(inputStageRef) ? inputStageRef : "reviewer:EvidenceCompatibilityReviewer",
      inputRefs: ["reviewer:EvidenceCompatibilityReviewer"],
      outputRefs: ["reviewer:SafetyRollbackReviewer"],
      findings,
      blockers,
      evidenceRefs,
      reviewComplete: preconditionBlockers.length === 0,
    });

    return toStageResult(result, status);
  }
}

// ---------------------------------------------------------------------------
// Sequential reviewer pipeline
// ---------------------------------------------------------------------------

export interface SequentialReviewInput {
  readonly evidence: EvidenceReviewRequest;
  readonly safety: Omit<SafetyReviewRequest, "evidenceReview">;
}

export interface SequentialReviewOutput {
  readonly reviewerStages: readonly [ReviewerName, ReviewerName];
  readonly evidenceReview: StageResult<ReviewResult>;
  readonly safetyReview?: StageResult<ReviewResult>;
  readonly handoffRefs: readonly Identifier[];
  readonly bothReviewerStagesPass: boolean;
  readonly blockedHandoff: boolean;
}

/**
 * Run the two reviewers strictly in order.  The safety reviewer always runs so
 * that a blocked handoff is recorded, but it receives the evidence reviewer's
 * output verbatim (including any recorded blocker), which is the only way it may
 * proceed on a failed/partial evidence review.  Neither stage mutates anything.
 */
export function runSequentialReview(input: SequentialReviewInput): SequentialReviewOutput {
  const evidenceReviewer = new EvidenceCompatibilityReviewerService();
  const safetyReviewer = new SafetyRollbackReviewerService();

  const evidenceReview = evidenceReviewer.review(input.evidence);
  const evidenceOutput = evidenceReview.output;

  if (evidenceOutput === undefined) {
    return {
      reviewerStages: REVIEWER_ORDER,
      evidenceReview,
      handoffRefs: [],
      bothReviewerStagesPass: false,
      blockedHandoff: true,
    };
  }

  const safetyReview = safetyReviewer.review({
    ...input.safety,
    evidenceReview: evidenceOutput,
  });
  const safetyOutput = safetyReview.output;

  const bothReviewerStagesPass =
    evidenceReview.status === "pass" && safetyReview.status === "pass";
  const blockedHandoff = evidenceReview.status !== "pass" || safetyReview.status !== "pass";

  const handoffRefs = unique([
    evidenceOutput.handoff.handoffId,
    ...(safetyOutput ? [safetyOutput.handoff.handoffId] : []),
  ]);

  return {
    reviewerStages: REVIEWER_ORDER,
    evidenceReview,
    safetyReview,
    handoffRefs,
    bothReviewerStagesPass,
    blockedHandoff,
  };
}

export function createEvidenceCompatibilityReviewer(): EvidenceCompatibilityReviewerContract {
  return new EvidenceCompatibilityReviewerService();
}

export function createSafetyRollbackReviewer(): SafetyRollbackReviewerContract {
  return new SafetyRollbackReviewerService();
}

export const REVIEWER_STAGE_DEFAULTS = {
  order: REVIEWER_ORDER,
  maximumConcurrency: REVIEWER_MAXIMUM_CONCURRENCY,
  iterationCeiling: REVIEWER_ITERATION_CEILING,
  readOnly: true,
  rollbackPath: REVIEWER_ROLLBACK_PATH,
} as const;
