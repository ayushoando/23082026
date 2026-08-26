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
  type ConcurrentImplementationWaveRecord,
  type EvidenceReviewRequest,
  type EvidenceCompatibilityReviewer as EvidenceCompatibilityReviewerContract,
  type Identifier,
  type IntegrationValidationGateRecord,
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
const REQUIRED_REVIEWER_STATUS = "completed" as const;

/**
 * Immutable execution bounds for both review-only stages.  Keeping the
 * prohibitions in a runtime-visible contract prevents a caller from treating
 * a reviewer handoff as an execution or approval capability.
 */
export const REVIEWER_PROHIBITED_ACTIONS = [
  "configuration mutation",
  "agent spawning",
  "worktree creation",
  "automatic retry",
  "automatic replan",
  "approval bypass",
  "external capability enablement",
  "global capability enablement",
  "Cloud/Crew capability enablement",
] as const;

export const REVIEWER_EXECUTION_CONTRACT = {
  executionLayer: "reviewer_stage",
  order: ["EvidenceCompatibilityReviewer", "SafetyRollbackReviewer"] as const,
  maximumConcurrency: 1 as const,
  iterationCeiling: 3 as const,
  readOnly: true as const,
  rollbackPath: REVIEWER_ROLLBACK_PATH,
  prohibitedActions: REVIEWER_PROHIBITED_ACTIONS,
  enablement: "prohibited" as const,
} as const;

export interface EvidenceReviewRequestWithWaveState extends EvidenceReviewRequest {
  /** Optional integration state is inspected when a caller provides it. */
  readonly implementationWave?: ConcurrentImplementationWaveRecord;
  readonly integrationValidationGate?: IntegrationValidationGateRecord;
}

export interface SafetyReviewRequestWithWaveState extends SafetyReviewRequest {
  readonly implementationWave?: ConcurrentImplementationWaveRecord;
  readonly integrationValidationGate?: IntegrationValidationGateRecord;
}

interface ReviewerWaveStateInput {
  readonly implementationWave?: ConcurrentImplementationWaveRecord;
  readonly integrationValidationGate?: IntegrationValidationGateRecord;
}

function nonEmpty(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function validIsoDate(value: string | undefined): boolean {
  return nonEmpty(value) && !Number.isNaN(Date.parse(value));
}

function stringValues(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((candidate): candidate is string => typeof candidate === "string")
    : [];
}

function reviewerWaveStateBlockers(state: ReviewerWaveStateInput): string[] {
  const blockers: string[] = [];
  const wave = state.implementationWave;
  const gate = state.integrationValidationGate;

  if (wave !== undefined) {
    if (wave.status !== "completed") {
      blockers.push(`implementation wave is ${wave.status}; reviewers require a completed wave`);
    }
    if (wave.activeAgentCount !== 0) {
      blockers.push("implementation wave still has active agents; reviewer handoff is incomplete");
    }
    if (wave.worktrees !== "prohibited") {
      blockers.push("implementation wave violates the no-worktrees policy");
    }
    if (wave.hiddenSpawning !== "prohibited") {
      blockers.push("implementation wave violates the no-hidden-spawning policy");
    }
    if (wave.automaticRetries !== "prohibited") {
      blockers.push("implementation wave violates the no-automatic-retries policy");
    }
    if (wave.automaticReplans !== "prohibited") {
      blockers.push("implementation wave violates the no-automatic-replans policy");
    }
    if (!nonEmpty(wave.integrationValidationGateRef)) {
      blockers.push("implementation wave has no Integration_Validation_Gate reference");
    }
    if (gate === undefined) {
      blockers.push("implementation wave state was supplied without its Integration_Validation_Gate record");
    }
  }

  if (gate !== undefined) {
    if (gate.status !== "pass") {
      blockers.push(`Integration_Validation_Gate is ${gate.status}; reviewer handoff is blocked`);
    }
    if (wave !== undefined && gate.waveId !== wave.waveId) {
      blockers.push("Integration_Validation_Gate belongs to a different implementation wave");
    }
    if (gate.reviewerStages.length !== 2 ||
        gate.reviewerStages[0] !== "EvidenceCompatibilityReviewer" ||
        gate.reviewerStages[1] !== "SafetyRollbackReviewer") {
      blockers.push("Integration_Validation_Gate reviewer order is not the required sequential order");
    }
    if (gate.repositoryValidationRuns.length === 0) {
      blockers.push("Integration_Validation_Gate has no repository validation runs");
    }
    for (const output of gate.collectedAgentOutputs) {
      if (output.status !== REQUIRED_REVIEWER_STATUS) {
        blockers.push(`implementation agent ${output.agentId} output is ${output.status}; incomplete wave output cannot be reviewed`);
      }
      if (output.blocker !== "none") {
        blockers.push(`implementation agent ${output.agentId} has a recorded blocker`);
      }
    }
    if (wave !== undefined && gate.collectedAgentOutputs.length !== wave.implementationAgents.length) {
      blockers.push("Integration_Validation_Gate has incomplete implementation-agent output collection");
    }
    for (const conflict of gate.conflictResolutions) {
      if (conflict.status === "open" || conflict.status === "blocking") {
        blockers.push(`wave conflict ${conflict.conflictId} remains ${conflict.status}`);
      }
    }
  }

  return unique(blockers);
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

function normalizeEvidenceRequest(input: EvidenceReviewRequest | undefined): EvidenceReviewRequestWithWaveState {
  const candidate = (input ?? {}) as Partial<EvidenceReviewRequestWithWaveState>;
  const sourceInventory = candidate.sourceInventory;
  const coverageMatrix = candidate.coverageMatrix;
  const exclusions = candidate.exclusions;
  return {
    inputStageRef: candidate.inputStageRef ?? "",
    sourceInventory: {
      reviewDateUtc: sourceInventory?.reviewDateUtc ?? "",
      activeSurfaces: sourceInventory?.activeSurfaces ?? [],
      discoveryMethod: sourceInventory?.discoveryMethod ?? "",
      records: sourceInventory?.records ?? [],
      unavailableFindings: sourceInventory?.unavailableFindings ?? [],
    },
    coverageMatrix: {
      entries: coverageMatrix?.entries ?? [],
      completeReviewStatement: coverageMatrix?.completeReviewStatement ?? "",
      complete: coverageMatrix?.complete ?? false,
      unavailableCandidateRefs: coverageMatrix?.unavailableCandidateRefs ?? [],
      blockers: coverageMatrix?.blockers ?? [],
    },
    exclusions: { entries: exclusions?.entries ?? [] },
    artifactInventory: candidate.artifactInventory ?? [],
    compatibilityRecords: candidate.compatibilityRecords ?? [],
    ownerDecisions: candidate.ownerDecisions ?? [],
    validationRuns: candidate.validationRuns ?? [],
    implementationWave: candidate.implementationWave,
    integrationValidationGate: candidate.integrationValidationGate,
  };
}

function reviewSourceInventory(input: EvidenceReviewRequest): {
  findings: string[];
  blockers: string[];
} {
  const findings: string[] = [];
  const blockers: string[] = [];
  const records = input.sourceInventory.records;
  const sourceIds = new Set<string>();

  if (!validIsoDate(input.sourceInventory.reviewDateUtc)) {
    blockers.push("source inventory review date is missing or stale");
  }
  if (!nonEmpty(input.sourceInventory.discoveryMethod)) {
    blockers.push("source inventory discovery method is missing");
  }
  if (input.sourceInventory.activeSurfaces.length === 0) {
    blockers.push("source inventory has no active surface scope");
  }

  for (const record of records) {
    if (!nonEmpty(record.sourceId)) blockers.push("source inventory contains a record without a source id");
    if (sourceIds.has(record.sourceId)) blockers.push(`source inventory duplicates source ${record.sourceId}`);
    sourceIds.add(record.sourceId);
    if (!validIsoDate(record.reviewDateUtc)) {
      blockers.push(`source ${record.sourceId || "unknown"} has a missing or stale review date`);
    }
    if (record.availability === "contradictory") {
      blockers.push(`source ${record.sourceId || "unknown"} has contradictory availability evidence`);
    }
    if (record.trustDecision === "unresolved" || record.trustDecision === "untrusted") {
      findings.push(`source ${record.sourceId || "unknown"} has ${record.trustDecision} provenance and cannot support enablement`);
    }
    if (record.evidenceState === "Unverified") {
      findings.push(`source ${record.sourceId || "unknown"} remains Unverified`);
    }
  }

  const findingIds = new Set<string>();
  for (const finding of input.sourceInventory.unavailableFindings) {
    if (!nonEmpty(finding.findingId) || !nonEmpty(finding.sourceRef)) {
      blockers.push("unavailable source finding is missing its finding or source reference");
    }
    if (findingIds.has(finding.findingId)) blockers.push(`unavailable source finding duplicates ${finding.findingId}`);
    findingIds.add(finding.findingId);
    if (!validIsoDate(finding.attemptedAtUtc)) {
      blockers.push(`unavailable source finding ${finding.findingId || "unknown"} has a missing or stale attempt date`);
    }
    const findingAvailability: string = finding.availability;
    if (findingAvailability === "available") {
      blockers.push(`unavailable source finding ${finding.findingId || "unknown"} contradicts available status`);
    }
    if (!sourceIds.has(finding.sourceRef)) {
      blockers.push(`unavailable source finding ${finding.findingId || "unknown"} references missing source ${finding.sourceRef}`);
    }
  }

  return { findings, blockers };
}

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
  const artifactIds = new Set<string>();

  for (const artifact of input.artifactInventory) {
    const artifactRef = artifact.artifactId || artifact.path || "unknown artifact";
    if (!nonEmpty(artifact.artifactId) || !nonEmpty(artifact.path)) {
      blockers.push("artifact inventory contains a record without an artifact id and path");
    }
    if (artifactIds.has(artifact.artifactId)) blockers.push(`artifact inventory duplicates ${artifactRef}`);
    artifactIds.add(artifact.artifactId);
    if (!nonEmpty(artifact.owner) || !nonEmpty(artifact.configurationScope)) {
      blockers.push(`${artifactRef} is missing owner or configuration scope`);
    }
    if (!nonEmpty(artifact.canonicalSource) || !nonEmpty(artifact.activationCondition)) {
      blockers.push(`${artifactRef} is missing canonical source or activation condition`);
    }
    if (!nonEmpty(artifact.rollbackPath)) {
      blockers.push(`${artifactRef} has no rollback path value`);
    }
    if (artifact.evidenceRefs.length === 0) {
      blockers.push(`${artifactRef} has no evidence references`);
    }
    if (artifact.inventoryStatus !== "present and readable") {
      findings.push(
        `${artifactRef} is ${artifact.inventoryStatus} and remains inactive until its contents are validated`,
      );
    }
    if (artifact.evidenceState === "Unverified") {
      findings.push(
        `${artifactRef} remains Unverified; inventory evidence cannot establish compatibility`,
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

  const coverageIds = new Set<string>();
  for (const entry of input.coverageMatrix.entries) {
    if (!nonEmpty(entry.coverageId) || !nonEmpty(entry.sourceId) || !nonEmpty(entry.evidenceProvenanceRef)) {
      blockers.push("Coverage_Matrix contains an incomplete evidence row");
    }
    if (coverageIds.has(entry.coverageId)) blockers.push(`Coverage_Matrix duplicates ${entry.coverageId}`);
    coverageIds.add(entry.coverageId);
    if (!validIsoDate(entry.reviewDateUtc)) blockers.push(`Coverage_Matrix entry ${entry.coverageId || "unknown"} has a missing or stale review date`);
    if (entry.availability === "contradictory") blockers.push(`Coverage_Matrix entry ${entry.coverageId || "unknown"} is contradictory`);
    if (entry.availability === "available" && entry.status === "unavailable") {
      blockers.push(`Coverage_Matrix entry ${entry.coverageId || "unknown"} contradicts available and unavailable status`);
    }
  }

  const exclusionIds = new Set<string>();
  for (const entry of input.exclusions.entries) {
    if (!nonEmpty(entry.exclusionId) || !nonEmpty(entry.candidateRef) || !nonEmpty(entry.evidenceRef)) {
      blockers.push("Exclusion_Register contains an incomplete exclusion row");
    }
    if (exclusionIds.has(entry.exclusionId)) blockers.push(`Exclusion_Register duplicates ${entry.exclusionId}`);
    exclusionIds.add(entry.exclusionId);
    if (entry.status !== "excluded") blockers.push(`Exclusion_Register entry ${entry.exclusionId || "unknown"} has an invalid status`);
    if (!validIsoDate(entry.reviewDateUtc)) blockers.push(`Exclusion_Register entry ${entry.exclusionId || "unknown"} has a missing or stale review date`);
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
  if (input.validationRuns.length === 0) {
    blockers.push("no Validation_Run records were provided for compatibility review");
  }

  for (const record of input.compatibilityRecords) {
    const exactTarget = targetKey(record.surface, record.version);
    if (record.evidenceFreshness !== "fresh") {
      blockers.push(
        `${record.surface} ${record.version} has ${record.evidenceFreshness} compatibility evidence; stale or missing evidence cannot be handed off`,
      );
    }
    if (record.status === "Unverified") {
      blockers.push(`${record.surface} ${record.version} remains Unverified`);
    }
    if (!nonEmpty(record.validationAction) || !nonEmpty(record.rollbackPathRef)) {
      blockers.push(`${record.surface} ${record.version} is missing its validation action or rollback reference`);
    }
    const exactPassingRun = record.validationRunRefs.some((ref) => {
      const run = validationRunsById.get(ref);
      return (
        run !== undefined &&
        run.result === "pass" &&
        run.blocker === "none" &&
        run.unverifiedItems.length === 0 &&
        targetKey(run.surface, run.version) === exactTarget &&
        validIsoDate(run.startedAtUtc)
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
  const requiredDecisionIds = new Set([
    "OD-01", "OD-02", "OD-03", "OD-04", "OD-05",
    "OD-06", "OD-07", "OD-08", "OD-09", "OD-10",
  ]);
  const seenDecisionIds = new Set<string>();

  for (const decision of input.ownerDecisions) {
    if (seenDecisionIds.has(decision.decisionId)) blockers.push(`owner decision ${decision.decisionId} is duplicated`);
    seenDecisionIds.add(decision.decisionId);
    if (!requiredDecisionIds.has(decision.decisionId)) blockers.push(`owner decision ${decision.decisionId} is outside OD-01 through OD-10`);
    if (!nonEmpty(decision.evidenceRef)) blockers.push(`owner decision ${decision.decisionId || "unknown"} has no evidence reference`);
    if (decision.unresolvedStatus === "unresolved") {
      findings.push(
        `owner decision ${decision.decisionId} is unresolved; its safe fallback must hold and no enabled-valid claim may rely on it`,
      );
      blockers.push(`owner decision ${decision.decisionId} is unresolved`);
    }
    if (decision.approvalStatus === "pending") {
      findings.push(`owner decision ${decision.decisionId} approval is still pending`);
      blockers.push(`owner decision ${decision.decisionId} approval is pending; approval bypass is prohibited`);
    }
    if (decision.approvalStatus === "rejected" || decision.approvalStatus === "expired") {
      blockers.push(
        `owner decision ${decision.decisionId} is ${decision.approvalStatus}; dependent enablement must remain blocked`,
      );
    }
  }

  for (const decisionId of requiredDecisionIds) {
    if (!seenDecisionIds.has(decisionId)) blockers.push(`missing owner decision ${decisionId}`);
  }
  if (input.ownerDecisions.length !== requiredDecisionIds.size) {
    blockers.push("owner-decision input must contain exactly OD-01 through OD-10");
  }
  return { findings, blockers };
}

export class EvidenceCompatibilityReviewerService
  implements EvidenceCompatibilityReviewerContract
{
  public review(input: EvidenceReviewRequestWithWaveState): StageResult<ReviewResult>;
  public review(input: EvidenceReviewRequest): StageResult<ReviewResult>;
  public review(input: EvidenceReviewRequest): StageResult<ReviewResult> {
    const reviewInput = normalizeEvidenceRequest(input);
    const presenceBlockers = reviewEvidenceInputsPresent(reviewInput);
    const sourceInventory = reviewSourceInventory(reviewInput);
    const waveStateBlockers = reviewerWaveStateBlockers(reviewInput);
    const artifactInventory = reviewArtifactInventory(reviewInput);
    const coverage = reviewCoverageCompleteness(reviewInput);
    const compatibility = reviewCompatibilityFreshness(reviewInput);
    const ownerDecisions = reviewOwnerDecisionResolution(reviewInput);

    const blockers = unique([
      ...presenceBlockers,
      ...sourceInventory.blockers,
      ...waveStateBlockers,
      ...artifactInventory.blockers,
      ...coverage.blockers,
      ...compatibility.blockers,
      ...ownerDecisions.blockers,
    ]);
    const findings = unique([
      ...sourceInventory.findings,
      ...artifactInventory.findings,
      ...coverage.findings,
      ...compatibility.findings,
      ...ownerDecisions.findings,
    ]);
    const evidenceRefs = unique([
      nonEmpty(reviewInput.inputStageRef) ? reviewInput.inputStageRef : "",
      "reviewer:EvidenceCompatibilityReviewer",
      ...reviewInput.sourceInventory.records.map((record) => record.sourceId),
      ...reviewInput.sourceInventory.unavailableFindings.flatMap((finding) => [
        finding.findingId,
        finding.sourceRef,
      ]),
      ...reviewInput.coverageMatrix.entries.flatMap((entry) => [
        entry.coverageId,
        entry.sourceId,
        entry.evidenceProvenanceRef,
      ]),
      ...reviewInput.coverageMatrix.unavailableCandidateRefs,
      ...reviewInput.exclusions.entries.flatMap((entry) => [
        entry.exclusionId,
        entry.candidateRef,
        entry.evidenceRef,
      ]),
      ...reviewInput.artifactInventory.flatMap((artifact) => [
        artifact.artifactId,
        ...artifact.evidenceRefs,
        ...artifact.validationRunRefs,
      ]),
      ...reviewInput.compatibilityRecords.flatMap((record) => [
        record.rollbackPathRef,
        ...record.validationRunRefs,
      ]),
      ...reviewInput.ownerDecisions.map((decision) => decision.evidenceRef),
      ...reviewInput.validationRuns.flatMap((run) => [run.validationId, ...run.evidenceRefs]),
    ]);

    const { result, status } = buildReviewResult({
      reviewer: "EvidenceCompatibilityReviewer",
      inputStageRef: nonEmpty(reviewInput.inputStageRef) ? reviewInput.inputStageRef : "missing-integration-gate-ref",
      inputRefs: [nonEmpty(reviewInput.inputStageRef) ? reviewInput.inputStageRef : "missing-integration-gate-ref"],
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
function normalizeSafetyRequest(input: SafetyReviewRequest | undefined): SafetyReviewRequestWithWaveState {
  const candidate = (input ?? {}) as Partial<SafetyReviewRequestWithWaveState>;
  const missingEvidenceReview = buildReviewResult({
    reviewer: "EvidenceCompatibilityReviewer",
    inputStageRef: "missing-integration-gate-ref",
    inputRefs: ["missing-integration-gate-ref"],
    outputRefs: ["reviewer:EvidenceCompatibilityReviewer"],
    findings: [],
    blockers: ["EvidenceCompatibilityReviewer output is missing"],
    evidenceRefs: ["reviewer:EvidenceCompatibilityReviewer"],
    reviewComplete: false,
  }).result;
  return {
    evidenceReview: candidate.evidenceReview ?? missingEvidenceReview,
    approvalBoundaries: candidate.approvalBoundaries ?? [],
    policyFindings: candidate.policyFindings ?? [],
    snapshots: candidate.snapshots ?? [],
    knownGaps: candidate.knownGaps ?? { entries: [] },
    rollbackRecords: candidate.rollbackRecords ?? [],
    proposedHandover: candidate.proposedHandover,
    implementationWave: candidate.implementationWave,
    integrationValidationGate: candidate.integrationValidationGate,
  };
}

function reviewHandoffPrecondition(input: SafetyReviewRequest): string[] {
  const blockers: string[] = [];
  const evidence = input.evidenceReview;
  const handoff = evidence.handoff;
  const orderedFirst = REVIEWER_ORDER[0];
  const expectedEvidenceOutputRef = "reviewer:EvidenceCompatibilityReviewer";

  if (evidence.stage.status !== "pass") {
    blockers.push("EvidenceCompatibilityReviewer did not pass; SafetyRollbackReviewer cannot produce an unblocked handoff");
  }
  if (!nonEmpty(evidence.stage.inputStageRef) || evidence.stage.inputStageRef === "missing-integration-gate-ref") {
    blockers.push("EvidenceCompatibilityReviewer output has no valid Integration_Validation_Gate input reference");
  }
  if (evidence.evidenceRefs.length === 0 || evidence.handoff.inputRefs.length === 0 || evidence.handoff.outputRefs.length === 0) {
    blockers.push("EvidenceCompatibilityReviewer output is incomplete; evidence and handoff references are required");
  }
  if (evidence.handoff.handoffId !== "handoff-EvidenceCompatibilityReviewer") {
    blockers.push("EvidenceCompatibilityReviewer handoff has an invalid handoff identifier");
  }
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
  const boundaryIds = new Set<string>();
  if (input.approvalBoundaries.length === 0) {
    blockers.push("no Approval_Boundary record was provided; safety review cannot approve an unbounded change");
  }

  for (const boundary of input.approvalBoundaries) {
    const boundaryRef = boundary.boundaryId || "unknown boundary";
    if (boundaryIds.has(boundary.boundaryId)) blockers.push(`Approval_Boundary ${boundaryRef} is duplicated`);
    boundaryIds.add(boundary.boundaryId);
    if (!nonEmpty(boundary.scope) || !nonEmpty(boundary.requestedChange) || !nonEmpty(boundary.targetSurface)) {
      blockers.push(`${boundaryRef} is missing scope, requested change, or target surface`);
    }
    if (!nonEmpty(boundary.owner) || !validIsoDate(boundary.approvalDate)) {
      blockers.push(`${boundaryRef} is missing owner or has a missing/stale approval date`);
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
      blockers.push(`${boundaryRef} does not name a security/data boundary; the boundary is unsafe`);
    }
    if (stringValues(boundary.expectedSideEffects).length === 0) {
      blockers.push(`${boundaryRef} does not describe expected side effects`);
    }
    if (!nonEmpty(boundary.rollbackPathRef)) {
      blockers.push(`${boundaryRef} has no rollback path reference`);
    }
    if (boundary.scope === "global" || boundary.scope === "external_service" || boundary.targetSurface === "Cloud/Crew") {
      blockers.push(`${boundaryRef} requests global, external, or Cloud/Crew enablement; review stages cannot enable those capabilities`);
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
  const rawSnapshotRefs = stringValues(input.snapshots);
  const snapshotRefs = new Set(rawSnapshotRefs.filter(nonEmpty));
  if (rawSnapshotRefs.length !== snapshotRefs.size) {
    blockers.push("pre-change snapshot references are missing or duplicated");
  }
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
  const rollbackIds = new Set<string>();
  if (input.rollbackRecords.length === 0) {
    blockers.push("no rollback record was provided; rollback readiness is incomplete");
  }

  for (const record of input.rollbackRecords) {
    if (rollbackIds.has(record.rollbackId)) blockers.push(`rollback ${record.rollbackId} is duplicated`);
    rollbackIds.add(record.rollbackId);
    if (!nonEmpty(record.rollbackId) || !nonEmpty(record.targetArtifactOrScope)) {
      blockers.push("rollback record is missing its id or target");
    }
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
  const gapIds = new Set<string>();
  for (const gap of input.knownGaps.entries) {
    if (gapIds.has(gap.gapId)) blockers.push(`known gap ${gap.gapId} is duplicated`);
    gapIds.add(gap.gapId);
    if (!nonEmpty(gap.gapId) || !nonEmpty(gap.title) || !nonEmpty(gap.blockedAction)) {
      blockers.push("known gap record is incomplete");
    }
    if (gap.evidenceRefs.length === 0 || !nonEmpty(gap.nextValidationRun) || !nonEmpty(gap.limitation)) {
      blockers.push(`known gap ${gap.gapId || "unknown"} is missing evidence, next validation, or limitation metadata`);
    }
    if (gap.status === "open") {
      findings.push(
        `known gap ${gap.gapId} (${gap.kind}) is open and blocks ${gap.blockedAction}`,
      );
      blockers.push(`known gap ${gap.gapId} is open; ${gap.blockedAction} remains blocked until resolved`);
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
    blockers.push("proposed handover is missing; safety review output is incomplete");
    return { findings, blockers };
  }

  if (handover.completeReviewStatement !== COMPLETE_REVIEW_STATEMENT) {
    blockers.push("proposed handover does not carry the exact complete-review statement");
  }
  if (handover.artifactDispositions.length === 0) {
    blockers.push("proposed handover has no artifact dispositions");
  }
  if (handover.reviewerStageRefs.length !== 2) {
    blockers.push("proposed handover does not preserve both reviewer stage references");
  }
  if (handover.validationRuns.length === 0) {
    blockers.push("proposed handover has no validation runs");
  }
  if (handover.rollbackRecords.length === 0) {
    blockers.push("proposed handover has no rollback records");
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
  public review(input: SafetyReviewRequestWithWaveState): StageResult<ReviewResult>;
  public review(input: SafetyReviewRequest): StageResult<ReviewResult>;
  public review(input: SafetyReviewRequest): StageResult<ReviewResult> {
    const reviewInput = normalizeSafetyRequest(input);
    const preconditionBlockers = reviewHandoffPrecondition(reviewInput);
    const waveStateBlockers = reviewerWaveStateBlockers(reviewInput);
    const approvals = reviewApprovalBoundaries(reviewInput);
    const snapshots = reviewSnapshotReadiness(reviewInput);
    const rollback = reviewRollbackReadiness(reviewInput);
    const knownGaps = reviewKnownGaps(reviewInput);
    const policy = reviewPolicyFindings(reviewInput);
    const handover = reviewHandoverConsistency(reviewInput);

    const blockers = unique([
      ...preconditionBlockers,
      ...waveStateBlockers,
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

    const inputStageRef = reviewInput.evidenceReview.stage.inputStageRef;
    const evidenceRefs = unique([
      "reviewer:SafetyRollbackReviewer",
      "reviewer:EvidenceCompatibilityReviewer",
      ...stringValues(reviewInput.snapshots),
      ...reviewInput.rollbackRecords.flatMap((record) => [
        record.rollbackId,
        record.preChangeStateRef,
        record.verificationRunRef,
      ]),
      ...reviewInput.evidenceReview.evidenceRefs,
      ...(reviewInput.integrationValidationGate === undefined
        ? []
        : [reviewInput.integrationValidationGate.gateId, reviewInput.integrationValidationGate.waveId]),
    ]);

    const { result, status } = buildReviewResult({
      reviewer: "SafetyRollbackReviewer",
      inputStageRef: nonEmpty(inputStageRef) ? inputStageRef : "reviewer:EvidenceCompatibilityReviewer",
      inputRefs: ["reviewer:EvidenceCompatibilityReviewer"],
      outputRefs: ["reviewer:SafetyRollbackReviewer"],
      findings,
      blockers,
      evidenceRefs,
      reviewComplete: preconditionBlockers.length === 0 && waveStateBlockers.length === 0,
    });

    return toStageResult(result, status);
  }
}

// ---------------------------------------------------------------------------
// Sequential reviewer pipeline
// ---------------------------------------------------------------------------

export interface SequentialReviewInput {
  readonly evidence: EvidenceReviewRequestWithWaveState;
  readonly safety: Omit<SafetyReviewRequestWithWaveState, "evidenceReview">;
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
export const BLOCKED_REVIEWER_HANDOFF =
  "handoff-EvidenceCompatibilityReviewer-blocked" as const;

export function runSequentialReview(input: SequentialReviewInput): SequentialReviewOutput {
  const evidenceReviewer = new EvidenceCompatibilityReviewerService();
  const safetyReviewer = new SafetyRollbackReviewerService();

  const evidenceReview = evidenceReviewer.review(input.evidence);
  const evidenceOutput = evidenceReview.output;

  if (evidenceOutput === undefined) {
    return {
      reviewerStages: REVIEWER_ORDER,
      evidenceReview,
      handoffRefs: [BLOCKED_REVIEWER_HANDOFF],
      bothReviewerStagesPass: false,
      blockedHandoff: true,
    };
  }

  const safetyRequest: SafetyReviewRequestWithWaveState = {
    ...input.safety,
    evidenceReview: evidenceOutput,
    implementationWave: input.evidence.implementationWave ?? input.safety.implementationWave,
    integrationValidationGate: input.evidence.integrationValidationGate ?? input.safety.integrationValidationGate,
  };
  const safetyReview = safetyReviewer.review(safetyRequest);
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
    handoffRefs: handoffRefs.length > 0 ? handoffRefs : [BLOCKED_REVIEWER_HANDOFF],
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
  ...REVIEWER_EXECUTION_CONTRACT,
} as const;
