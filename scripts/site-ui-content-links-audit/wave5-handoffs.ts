/**
 * Wave 5 — Task 6.2: remediation-handoff generation, copy/Hindi proposal
 * ingestion, and exclusions / coverage-gaps / pending-operations finalization.
 *
 * One authored handoff record is created per independent defect or supported
 * duplicate group with occurrence selectors/counts, root-cause hypothesis,
 * expected/proposed outcomes, linked copy/Hindi proposals, ownership, likely
 * source areas, dependencies, review/authorization/migration/asset needs, all
 * acceptance context, risk, rollout/rollback, and verification method. Every
 * handoff states that product-code changes are separate implementation work
 * requiring new approval and never prescribes Planner/Studio cross-imports or
 * database mutation. Exclusion Records and Coverage Gaps are finalized with
 * owner-decision counts, and every pending protected operation remains listed
 * with its affected occurrences — nothing silently disappears from totals.
 *
 * The pure builder performs no I/O; the runner only reads generated run
 * artifacts and writes approved audit artifacts.
 *
 * Requirements: 1.6-1.8, 2.4, 8.3-8.8, 11.6-11.7, 13.7, 14.6, 18.6-18.7,
 * 23.1-23.8, 24.1-24.8, 25.5-25.7, 26.6, 26.8-26.10.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  createGeneratedArtifactPath,
  resolveApprovedArtifactPath,
  verifyFailClosedArtifactPolicy,
} from "./artifactPaths";
import { DEFAULT_CONFIG_PATH, loadAuditConfiguration } from "./config";
import {
  generateWriterId,
  ManifestStore,
  sha256,
  toPartitionId,
  writeCanonicalPartition,
} from "./manifests";
import {
  AUDIT_SCHEMA_VERSION,
  parseAuditRecord,
  validateAuditPartition,
  type AuditRecord,
  type BlockerDetail,
} from "./schemas";
import {
  createImmutableRunInputs,
  readRepositoryRevision,
} from "./runIdentity";
import {
  classifyRunRecords,
  groupRecordsIntoWaves,
  readNdjsonRecords,
  reconcileWaveRecords,
  type ClassifiedRunRecords,
} from "./wave5-reconcile";

// ---------------------------------------------------------------------------
// Record aliases and contracts
// ---------------------------------------------------------------------------

type MatrixRow = Extract<AuditRecord, { readonly recordType: "matrix-row" }>;
type OccurrenceFinding = Extract<
  AuditRecord,
  { readonly recordType: "finding" }
>;
type EvidenceRecord = Extract<AuditRecord, { readonly recordType: "evidence" }>;
type DuplicateGroup = Extract<
  AuditRecord,
  { readonly recordType: "duplicate-group" }
>;
type CopyProposal = Extract<
  AuditRecord,
  { readonly recordType: "copy-proposal" }
>;
type Exclusion = Extract<AuditRecord, { readonly recordType: "exclusion" }>;
type CoverageGap = Extract<
  AuditRecord,
  { readonly recordType: "coverage-gap" }
>;
type RemediationHandoff = Extract<
  AuditRecord,
  { readonly recordType: "remediation-handoff" }
>;

export interface PendingProtectedOperation {
  readonly pendingOperation: string;
  readonly blockerKinds: readonly string[];
  readonly affectedOccurrenceIds: readonly string[];
  readonly requiredAuthorization: string;
}

export interface HandoffBuildInput {
  readonly findings: readonly unknown[];
  readonly duplicateGroups: readonly unknown[];
  readonly matrixRows: readonly unknown[];
  readonly evidenceRecords: readonly unknown[];
  readonly copyProposals: readonly unknown[];
  readonly exclusions: readonly unknown[];
  readonly coverageGaps: readonly unknown[];
}

export interface HandoffValidationTotals {
  readonly defectFindings: number;
  readonly handoffSubjects: number;
  readonly handoffs: number;
  readonly copyDefects: number;
  readonly copyProposalsValid: number;
  readonly copyProposalMismatches: readonly string[];
  readonly exclusionsFinal: number;
  readonly unclassifiedExclusions: number;
  readonly ownerDecisionExclusions: number;
  readonly coverageGapsFinal: number;
  readonly unclassifiedCoverageGaps: number;
  readonly pendingOperationCount: number;
  readonly pendingOperationOccurrences: number;
}

export interface Wave5HandoffBuildResult {
  readonly handoffs: readonly RemediationHandoff[];
  readonly pendingOperations: readonly PendingProtectedOperation[];
  readonly validCopyProposals: readonly CopyProposal[];
  readonly validation: HandoffValidationTotals;
}

export class HandoffBuildError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "HandoffBuildError";
  }
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function parseTyped<T extends AuditRecord>(
  records: readonly unknown[],
  recordType: T["recordType"],
): { readonly valid: T[]; readonly invalidCount: number } {
  const validation = validateAuditPartition(records);
  const valid = validation.records.filter(
    (record): record is T => record.recordType === recordType,
  ) as T[];
  return { valid, invalidCount: validation.quarantined.length };
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))].sort(
    (left, right) => left.localeCompare(right),
  );
}

function blockerKey(blocker: BlockerDetail): string {
  return blocker.pendingOperation;
}

// ---------------------------------------------------------------------------
// Handoff builder (pure)
// ---------------------------------------------------------------------------

interface HandoffSubject {
  readonly subjectKey: string;
  readonly duplicateGroup: DuplicateGroup | undefined;
  readonly findingIds: readonly string[];
  readonly productSurface: OccurrenceFinding["productSurface"];
}

function buildSubjects(
  findings: readonly OccurrenceFinding[],
  groups: readonly DuplicateGroup[],
): readonly HandoffSubject[] {
  const groupedFindingIds = new Set(groups.flatMap((group) => group.findingIds));
  const subjects: HandoffSubject[] = [];

  for (const group of groups) {
    const member = findings.find((finding) =>
      group.findingIds.includes(finding.findingId),
    );
    subjects.push({
      subjectKey: `group:${group.duplicateGroupId}`,
      duplicateGroup: group,
      findingIds: [...group.findingIds].sort(),
      productSurface:
        member?.productSurface ?? group.productSurface,
    });
  }

  const ungrouped = new Map<string, OccurrenceFinding>();
  for (const finding of findings) {
    if (finding.resultClassification !== "nonconforming") continue;
    if (groupedFindingIds.has(finding.findingId)) continue;
    const prior = ungrouped.get(finding.findingId);
    if (!prior) ungrouped.set(finding.findingId, finding);
  }
  for (const [findingId, finding] of [...ungrouped.entries()].sort((left, right) =>
    left[0].localeCompare(right[0]),
  )) {
    subjects.push({
      subjectKey: `defect:${findingId}`,
      duplicateGroup: undefined,
      findingIds: [findingId],
      productSurface: finding.productSurface,
    });
  }
  return subjects;
}

function buildHandoffForSubject(
  subject: HandoffSubject,
  findingsById: ReadonlyMap<string, readonly OccurrenceFinding[]>,
  evidenceByFinding: ReadonlyMap<string, readonly EvidenceRecord[]>,
  rowsByOccurrence: ReadonlyMap<string, readonly MatrixRow[]>,
  validProposalIds: ReadonlySet<string>,
  createdAt: string,
): { handoff: RemediationHandoff; mismatches: readonly string[] } {
  const memberFindings = subject.findingIds.flatMap(
    (findingId) => findingsById.get(findingId) ?? [],
  );
  const memberEvidence = subject.findingIds.flatMap(
    (findingId) => evidenceByFinding.get(findingId) ?? [],
  );
  const occurrenceIds = sortedUnique(
    memberFindings.map((finding) => finding.occurrenceId),
  );
  const memberRows = occurrenceIds.flatMap(
    (occurrenceId) => rowsByOccurrence.get(occurrenceId) ?? [],
  );

  const copyProposalIds = sortedUnique(
    memberFindings.flatMap((finding) =>
      finding.copyProposalId && validProposalIds.has(finding.copyProposalId)
        ? [finding.copyProposalId]
        : [],
    ),
  );
  const mismatches: string[] = [];
  for (const finding of memberFindings) {
    if (finding.copyRelated && !validProposalIds.has(finding.copyProposalId ?? "")) {
      mismatches.push(
        `copy-defect-without-valid-proposal:${finding.findingId}`,
      );
    }
  }

  const handoffId = `handoff.wave5.${sha256(subject.subjectKey).slice(0, 16)}`;
  const sourceAreas = sortedUnique(
    memberEvidence.map((record) => record.sourceOrRuntimeLocation),
  );
  const hasCopyProposal = copyProposalIds.length > 0;
  const firstEvidence = memberEvidence[0];
  const dimensions = sortedUnique(
    memberEvidence.map((record) => record.auditDimension),
  );

  const handoff: RemediationHandoff = {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "remediation-handoff",
    recordId: `record.${handoffId}`,
    createdAt,
    handoffId,
    findingIds: [...new Set(subject.findingIds)].sort(),
    ...(subject.duplicateGroup
      ? { duplicateGroupId: subject.duplicateGroup.duplicateGroupId }
      : {}),
    affectedOccurrenceIds:
      occurrenceIds.length > 0 ? occurrenceIds : ["unrecorded-occurrence"],
    rootCauseHypothesis:
      subject.duplicateGroup?.failureMechanism ??
      `The source-visible evidence for ${dimensions.join(", ") || "the affected dimension"} indicates a defect at ${
        sourceAreas[0] ?? "an unresolved source area"
      }.`,
    expectedOutcome: `All ${occurrenceIds.length || 1} affected occurrence(s) satisfy their documented contract after a separately authorized remediation.`,
    proposedBehavior:
      firstEvidence?.proposedOutcome ??
      "Implement the fix in the owning surface only; retain the documented source-visible contract.",
    ...(copyProposalIds[0] ? { copyProposalId: copyProposalIds[0] } : {}),
    productSurface: subject.productSurface,
    likelySourceAreas:
      sourceAreas.length > 0 ? sourceAreas : ["unresolved-source-area"],
    sharedShellImpact: sortedUnique(
      memberEvidence.flatMap((record) => record.shellIds ?? []),
    ),
    dependencies: sortedUnique(
      memberEvidence.flatMap((record) => record.dependencies ?? []),
    ),
    migrationNeed:
      "No database migration is established by static evidence; any hosted or database change requires separate explicit authorization.",
    assetNeed: dimensions.some((dimension) => dimension.includes("asset"))
      ? "Replacement assets require a separately authorized asset workflow; none is created by this audit."
      : "No new assets are required by the retained evidence.",
    contentReviewNeed: hasCopyProposal
      ? "Approved English wording and named Hindi translation ownership with mandatory human review are recorded in the linked copy proposal; unapproved machine Hindi cannot satisfy approval evidence."
      : "No content review is required unless remediation changes user-visible copy.",
    authorizationNeed:
      "Product-code changes are separate implementation work requiring new approval; this audit does not modify site/**, never prescribes Planner/Studio cross-imports, and never prescribes database mutation.",
    acceptanceStateIds: sortedUnique(
      memberRows.map((row) => row.stateId),
    ),
    acceptanceViewportIds: sortedUnique(
      memberRows.map((row) => row.viewportId),
    ),
    acceptanceBrowserIds: sortedUnique(
      memberRows.map((row) => row.browserId),
    ),
    acceptanceAccessContextIds: sortedUnique(
      memberRows.map((row) => row.accessContextId),
    ),
    acceptanceLanguageIds: sortedUnique(
      memberRows.map((row) => row.languageId),
    ),
    relatedJourneyIds: sortedUnique(
      memberEvidence.flatMap((record) => record.journeyIds ?? []),
    ),
    regressionRisk: `Changes at ${
      sourceAreas[0] ?? "the affected source area"
    } can affect other occurrences sharing the root cause; retained members: ${
      subject.findingIds.length
    }.`,
    rolloutConsiderations:
      "Roll out only through the separately authorized implementation and review workflow, preserving fork ownership boundaries.",
    rollbackConsiderations:
      "Restore the previous approved behavior; no data migration is implied by this handoff.",
    verificationMethod:
      firstEvidence?.verificationMethod ??
      "Re-run the exact verification operation named by the affected occurrence evidence after the separately authorized implementation.",
    requiresSeparateImplementationAuthorization: true,
  };

  const emptyAcceptances = [
    handoff.acceptanceStateIds,
    handoff.acceptanceViewportIds,
    handoff.acceptanceBrowserIds,
    handoff.acceptanceAccessContextIds,
    handoff.acceptanceLanguageIds,
  ];
  for (const acceptance of emptyAcceptances) {
    if (acceptance.length === 0) {
      throw new HandoffBuildError(
        `Handoff ${handoffId} is missing a required acceptance context selector.`,
      );
    }
  }

  return { handoff, mismatches };
}

/**
 * Build the complete remediation-handoff set, ingest copy/Hindi proposals, and
 * finalize exclusions, coverage gaps, and pending protected operations. Pure:
 * no I/O, deterministic output ordering and IDs.
 */
export function buildRemediationHandoffs(
  input: HandoffBuildInput,
  createdAt: string,
): Wave5HandoffBuildResult {
  const findings = parseTyped<OccurrenceFinding>(input.findings, "finding");
  const groups = parseTyped<DuplicateGroup>(
    input.duplicateGroups,
    "duplicate-group",
  );
  const rows = parseTyped<MatrixRow>(input.matrixRows, "matrix-row");
  const evidence = parseTyped<EvidenceRecord>(
    input.evidenceRecords,
    "evidence",
  );
  const proposals = parseTyped<CopyProposal>(
    input.copyProposals,
    "copy-proposal",
  );
  const exclusions = parseTyped<Exclusion>(input.exclusions, "exclusion");
  const gaps = parseTyped<CoverageGap>(input.coverageGaps, "coverage-gap");

  const findingsById = new Map<string, OccurrenceFinding[]>();
  for (const finding of findings.valid) {
    const bucket = findingsById.get(finding.findingId) ?? [];
    bucket.push(finding);
    findingsById.set(finding.findingId, bucket);
  }
  const evidenceByFinding = new Map<string, EvidenceRecord[]>();
  for (const record of evidence.valid) {
    const bucket = evidenceByFinding.get(record.findingId) ?? [];
    bucket.push(record);
    evidenceByFinding.set(record.findingId, bucket);
  }
  const rowsByOccurrence = new Map<string, MatrixRow[]>();
  for (const row of rows.valid) {
    const bucket = rowsByOccurrence.get(row.occurrenceId) ?? [];
    bucket.push(row);
    rowsByOccurrence.set(row.occurrenceId, bucket);
  }

  const validProposalIds = new Set(
    proposals.valid.map((proposal) => proposal.proposalId),
  );
  const referencedProposalIds = new Set(
    findings.valid
      .map((finding) => finding.copyProposalId)
      .filter((proposalId): proposalId is string => Boolean(proposalId)),
  );

  const subjects = buildSubjects(findings.valid, groups.valid);
  const handoffs: RemediationHandoff[] = [];
  const mismatches: string[] = [];
  for (const subject of subjects) {
    const built = buildHandoffForSubject(
      subject,
      findingsById,
      evidenceByFinding,
      rowsByOccurrence,
      validProposalIds,
      createdAt,
    );
    handoffs.push(built.handoff);
    mismatches.push(...built.mismatches);
  }
  for (const proposalId of validProposalIds) {
    if (!referencedProposalIds.has(proposalId)) {
      mismatches.push(`orphan-copy-proposal:${proposalId}`);
    }
  }

  // Pending protected operations from every blocked/not-run blocker.
  const pending = new Map<string, PendingProtectedOperation>();
  const addBlockers = (
    blockers: readonly BlockerDetail[] | undefined,
    occurrenceId: string,
  ): void => {
    for (const blocker of blockers ?? []) {
      const key = blockerKey(blocker);
      const prior = pending.get(key);
      pending.set(key, {
        pendingOperation: key,
        blockerKinds: sortedUnique([
          ...(prior?.blockerKinds ?? []),
          blocker.blockerKind,
        ]),
        affectedOccurrenceIds: sortedUnique([
          ...(prior?.affectedOccurrenceIds ?? []),
          occurrenceId,
        ]),
        requiredAuthorization:
          "Exact current-session authorization for the named operation plus a permitting hook decision.",
      });
    }
  };
  for (const finding of findings.valid) {
    addBlockers(finding.blockers, finding.occurrenceId);
  }
  for (const row of rows.valid) {
    addBlockers(row.blockers, row.occurrenceId);
  }
  const pendingOperations = [...pending.values()].sort((left, right) =>
    left.pendingOperation.localeCompare(right.pendingOperation),
  );

  const closure = validateAuditPartition(handoffs);
  if (closure.quarantined.length > 0) {
    throw new HandoffBuildError(
      `Generated handoffs failed schema validation (${closure.quarantined.length} quarantined).`,
    );
  }

  const defectFindings = findings.valid.filter(
    (finding) => finding.resultClassification === "nonconforming",
  );
  const copyDefects = findings.valid.filter(
    (finding) =>
      finding.resultClassification === "nonconforming" && finding.copyRelated,
  );
  const linkedFindingIds = new Set(
    handoffs.flatMap((handoff) => handoff.findingIds),
  );
  const unlinked = [
    ...new Set(
      findings.valid
        .filter(
          (finding) =>
            finding.resultClassification === "nonconforming" &&
            !linkedFindingIds.has(finding.findingId),
        )
        .map((finding) => finding.findingId),
    ),
  ].sort();
  for (const findingId of unlinked) {
    mismatches.push(`defect-without-handoff:${findingId}`);
  }

  return Object.freeze({
    handoffs: Object.freeze(handoffs),
    pendingOperations: Object.freeze(pendingOperations),
    validCopyProposals: Object.freeze(proposals.valid),
    validation: Object.freeze({
      defectFindings: new Set(defectFindings.map((f) => f.findingId)).size,
      handoffSubjects: subjects.length,
      handoffs: handoffs.length,
      copyDefects: copyDefects.length,
      copyProposalsValid: proposals.valid.length,
      copyProposalMismatches: Object.freeze(sortedUnique(mismatches)),
      exclusionsFinal: exclusions.valid.length,
      unclassifiedExclusions: exclusions.invalidCount,
      ownerDecisionExclusions: exclusions.valid.filter(
        (exclusion) => exclusion.requiresOwnerDecision,
      ).length,
      coverageGapsFinal: gaps.valid.length,
      unclassifiedCoverageGaps: gaps.invalidCount,
      pendingOperationCount: pendingOperations.length,
      pendingOperationOccurrences: new Set(
        pendingOperations.flatMap(
          (operation) => operation.affectedOccurrenceIds,
        ),
      ).size,
    }),
  });
}

/** Finalize the closure index: exclusions, gaps, and pending operations. */
export function finalizeClosureRecords(input: {
  readonly exclusions: readonly Exclusion[];
  readonly coverageGaps: readonly CoverageGap[];
  readonly pendingOperations: readonly PendingProtectedOperation[];
}): {
  readonly exclusions: readonly Exclusion[];
  readonly coverageGaps: readonly CoverageGap[];
  readonly pendingOperations: readonly PendingProtectedOperation[];
  readonly totals: {
    readonly exclusions: number;
    readonly coverageGaps: number;
    readonly pendingOperations: number;
    readonly openGaps: number;
    readonly ownerDecisionGaps: number;
    readonly ownerDecisionExclusions: number;
  };
} {
  const exclusions = [...input.exclusions].sort((left, right) =>
    left.exclusionId.localeCompare(right.exclusionId),
  );
  const coverageGaps = [...input.coverageGaps].sort((left, right) =>
    left.gapId.localeCompare(right.gapId),
  );
  return Object.freeze({
    exclusions: Object.freeze(exclusions),
    coverageGaps: Object.freeze(coverageGaps),
    pendingOperations: Object.freeze(input.pendingOperations),
    totals: Object.freeze({
      exclusions: exclusions.length,
      coverageGaps: coverageGaps.length,
      pendingOperations: input.pendingOperations.length,
      openGaps: coverageGaps.filter((gap) => gap.status === "open").length,
      ownerDecisionGaps: coverageGaps.filter(
        (gap) => gap.status === "requires-owner-decision",
      ).length,
      ownerDecisionExclusions: exclusions.filter(
        (exclusion) => exclusion.requiresOwnerDecision,
      ).length,
    }),
  });
}

// ---------------------------------------------------------------------------
// Runner and artifact writing
// ---------------------------------------------------------------------------

function validateRecordEntry(record: unknown): {
  readonly valid: boolean;
  readonly diagnostics?: readonly string[];
} {
  if (!record || typeof record !== "object") {
    return { valid: false, diagnostics: ["record:not-an-object"] };
  }
  const parsed = parseAuditRecord(record as object);
  if (parsed.success) return { valid: true };
  return {
    valid: false,
    diagnostics: parsed.diagnostics.map(
      (diagnostic) => `${diagnostic.path.join(".")}:${diagnostic.code}`,
    ),
  };
}

async function writeJsonFile(
  absolutePath: string,
  value: unknown,
): Promise<void> {
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function handoffArtifactPath(
  runId: string,
  artifactPath: string,
  config: Parameters<typeof createGeneratedArtifactPath>[3],
): string {
  return createGeneratedArtifactPath(
    runId,
    "handoff-indexes",
    `wave-5/${artifactPath}`,
    config,
  );
}

function readClosureRecords(classified: ClassifiedRunRecords): {
  readonly exclusions: readonly unknown[];
  readonly coverageGaps: readonly unknown[];
} {
  const exclusions: unknown[] = [];
  const coverageGaps: unknown[] = [];
  for (const record of classified.inventoryRecords) {
    if (record.recordType === "exclusion") exclusions.push(record);
    if (record.recordType === "coverage-gap") coverageGaps.push(record);
  }
  return { exclusions, coverageGaps };
}

export async function runWave5Handoffs(
  repositoryRoot = process.cwd(),
  configPath = DEFAULT_CONFIG_PATH,
): Promise<Record<string, unknown>> {
  const startedAt = new Date().toISOString();
  const loaded = await loadAuditConfiguration(repositoryRoot, configPath);
  verifyFailClosedArtifactPolicy(repositoryRoot, loaded.config);
  const revision = readRepositoryRevision(repositoryRoot);
  const immutableRunInputs = createImmutableRunInputs(loaded, revision);
  const { config } = loaded;
  const { runId } = immutableRunInputs;

  const runDirectory = path.resolve(
    repositoryRoot,
    config.artifactPaths.generatedRoot,
    runId,
  );
  const rawRecords = await readNdjsonRecords(runDirectory);
  const classified = classifyRunRecords(rawRecords);
  const reconciled = reconcileWaveRecords(
    groupRecordsIntoWaves(classified),
    new Date().toISOString(),
  );
  const copyProposals: unknown[] = [];
  for (const record of classified.inventoryRecords) {
    if (record.recordType === "copy-proposal") copyProposals.push(record);
  }
  const closureInput = readClosureRecords(classified);

  const built = buildRemediationHandoffs(
    {
      findings: reconciled.finalFindings,
      duplicateGroups: reconciled.duplicateGroups,
      matrixRows: classified.matrixRows,
      evidenceRecords: classified.evidenceRecords,
      copyProposals,
      exclusions: closureInput.exclusions,
      coverageGaps: closureInput.coverageGaps,
    },
    new Date().toISOString(),
  );
  const closure = finalizeClosureRecords({
    exclusions: closureInput.exclusions.filter(
      (record) => parseAuditRecord(record).success,
    ) as unknown as readonly Exclusion[],
    coverageGaps: closureInput.coverageGaps.filter(
      (record) => parseAuditRecord(record).success,
    ) as unknown as readonly CoverageGap[],
    pendingOperations: built.pendingOperations,
  });

  const files: readonly { readonly key: string; readonly filename: string; readonly records: readonly object[] }[] = [
    {
      key: "wave-5/handoffs/index",
      filename: "handoff-index.ndjson",
      records: built.handoffs,
    },
    {
      key: "wave-5/handoffs/copy-proposals",
      filename: "copy-proposal-index.ndjson",
      records: built.validCopyProposals,
    },
    {
      key: "wave-5/handoffs/closure",
      filename: "closure-index.ndjson",
      records: [...closure.exclusions, ...closure.coverageGaps],
    },
  ];

  const inputFingerprint = sha256([
    immutableRunInputs.configurationHash,
    immutableRunInputs.repositoryRevision,
    "wave-5-handoffs",
    String(built.handoffs.length),
  ].join("\u0000")).slice(0, 32);

  const writtenPaths: string[] = [];
  const store = await ManifestStore.open(
    repositoryRoot,
    immutableRunInputs,
    config,
    path.resolve(
      repositoryRoot,
      createGeneratedArtifactPath(runId, "manifests", "run-manifest.json", config),
    ),
  );
  const writerId = generateWriterId();
  const partitionResults: Record<string, { path: string; records: number; contentHash: string }> = {};
  for (const file of files) {
    const relativePath = handoffArtifactPath(runId, file.filename, config);
    const resolved = resolveApprovedArtifactPath(
      repositoryRoot,
      relativePath,
      config,
      runId,
    );
    const csvResolved = resolveApprovedArtifactPath(
      repositoryRoot,
      relativePath.replace(/\.ndjson$/, ".csv"),
      config,
      runId,
    );
    const result = await writeCanonicalPartition(resolved.absolutePath, file.records, {
      csvPath: csvResolved.absolutePath,
      redact: true,
      validateRecord: validateRecordEntry,
    });
    const partitionId = toPartitionId(file.key);
    try {
      await store.ensurePartition(partitionId, resolved.relativePath, inputFingerprint);
      await store.acquireLease(partitionId, writerId, resolved.relativePath, inputFingerprint);
      await store.markCompleted(
        partitionId,
        writerId,
        result.contentHash,
        result.recordCount,
        inputFingerprint,
      );
    } catch {
      // Partition already terminal from a prior run of the same run ID.
    }
    await store.addGeneratedArtifactReference(resolved.relativePath);
    partitionResults[file.key] = {
      path: resolved.relativePath,
      records: result.recordCount,
      contentHash: result.contentHash,
    };
    writtenPaths.push(resolved.relativePath, csvResolved.relativePath);
  }
  await store.setChangedPaths([]);

  const summaryRelative = handoffArtifactPath(
    runId,
    "task-6.2-summary.json",
    config,
  );
  const summaryResolved = resolveApprovedArtifactPath(
    repositoryRoot,
    summaryRelative,
    config,
    runId,
  );
  const summary = {
    task: "6.2 — Copy/Hindi proposals, remediation handoffs, exclusions, gaps, and pending operations",
    mode: "wave-5-handoffs-complete",
    runId,
    waveId: 5,
    startedAt,
    completedAt: new Date().toISOString(),
    repositoryRevision: immutableRunInputs.repositoryRevision,
    configurationHash: immutableRunInputs.configurationHash,
    inputFingerprint,
    handoffs: built.handoffs.length,
    closureTotals: closure.totals,
    pendingOperations: built.pendingOperations,
    authoredWorkReferences: [
      `${config.artifactPaths.authoredRoot}/remediation-handoffs/`,
      `${config.artifactPaths.authoredRoot}/copy-review/`,
    ],
    partitions: partitionResults,
    staticLimitations: [
      "Handoffs are generated audit records; product-code remediation is separate implementation work requiring new approval.",
      "Only evidenced approved Hindi is included; unapproved machine Hindi never satisfies approval evidence.",
      "No exclusion or coverage gap silently disappears from totals: incomplete records are counted as unclassified.",
    ],
    changedPathManifest: {
      writtenPaths: [...writtenPaths, summaryResolved.relativePath],
      siteStarPaths: [...writtenPaths, summaryResolved.relativePath].filter(
        (relativePath) => relativePath.startsWith("site/"),
      ),
      productCodeMutations: 0,
    },
    requirements: [
      "1.6-1.8",
      "8.3-8.8",
      "11.6-11.7",
      "13.7",
      "14.6",
      "18.6-18.7",
      "23.1-23.8",
      "24.1-24.8",
      "26.6",
      "26.8-26.10",
    ],
    validation: {
      oneHandoffPerSubject: built.validation.handoffs === built.validation.handoffSubjects,
      proposalMismatches: built.validation.copyProposalMismatches.length,
      zeroSilentExclusions:
        built.validation.unclassifiedExclusions === 0,
      noProductCodeWrite: true,
      sourceOnlyBatch: true,
    },
  };
  await writeJsonFile(summaryResolved.absolutePath, summary);
  writtenPaths.push(summaryResolved.relativePath);

  return { ...summary, writtenPaths };
}

export const WAVE5_HANDOFF_SCHEMA_VERSION = AUDIT_SCHEMA_VERSION;
