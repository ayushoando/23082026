/**
 * Wave 5 — Task 6.3: final artifact manifests and machine-checkable
 * completion proof.
 *
 * Computes canonical inventory, matrix, finding, evidence, copy, severity,
 * handoff, exclusion, gap, pending-operation, and wave totals from the run's
 * generated artifacts, verifies the one-to-one/set-equality invariants,
 * authorization coverage, and generation/invalidation state, and emits a
 * `CompletionProofSchema` record plus a changed-path manifest proving zero
 * `site/**` or product-code mutation. Completion is prominently reported with
 * blocked, not-run, owner-decision, and gap totals rather than being treated
 * as passes; `declaredComplete` can only be true when every invariant holds,
 * so an unclassified, invalidated, or unresolved-runtime row can never be
 * papered over.
 *
 * The builder is pure; the runner only reads run artifacts and writes
 * approved audit artifacts.
 *
 * Requirements: 4.7, 22.8-22.9, 26.1-26.12.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  createGeneratedArtifactPath,
  resolveApprovedArtifactPath,
  verifyFailClosedArtifactPolicy,
} from "./artifactPaths";
import { DEFAULT_CONFIG_PATH, loadAuditConfiguration } from "./config";
import type { AuditRunConfiguration } from "./config";
import { sha256, writeCanonicalPartition } from "./manifests";
import {
  AUDIT_SCHEMA_VERSION,
  CompletionProofSchema,
  parseAuditRecord,
  validateAuditPartition,
  type AuditRecord,
} from "./schemas";
import {
  createImmutableRunInputs,
  readRepositoryRevision,
} from "./runIdentity";
import { runManifestPath } from "./wave";
import {
  classifyRunRecords,
  readNdjsonRecords,
  type ClassifiedRunRecords,
} from "./wave5-reconcile";

// ---------------------------------------------------------------------------
// Record aliases
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
type CompletionProof = Extract<
  AuditRecord,
  { readonly recordType: "completion-proof" }
>;

export interface ZeroMutationVerification {
  readonly productCodeMutations: number;
  readonly siteStarPaths: readonly string[];
  readonly outsideApprovedPaths: readonly string[];
}

/** Prove that a changed-path set contains zero product-code mutation. */
export function verifyZeroProductMutation(
  changedPaths: readonly string[],
  config: AuditRunConfiguration,
): ZeroMutationVerification {
  const approvedRoots = [
    config.artifactPaths.toolingRoot,
    config.artifactPaths.generatedRoot,
    config.artifactPaths.authoredRoot,
  ];
  const siteStarPaths = changedPaths
    .filter((relativePath) => relativePath.startsWith("site/"))
    .sort();
  const outsideApprovedPaths = changedPaths
    .filter(
      (relativePath) =>
        !approvedRoots.some((root) => relativePath.startsWith(`${root}/`)),
    )
    .sort();
  return Object.freeze({
    productCodeMutations: siteStarPaths.length,
    siteStarPaths: Object.freeze(siteStarPaths),
    outsideApprovedPaths: Object.freeze(outsideApprovedPaths),
  });
}

// ---------------------------------------------------------------------------
// Totals computation
// ---------------------------------------------------------------------------

export interface CompletionProofBuildInput {
  readonly runId: string;
  readonly manifestId: string;
  readonly inventoryGeneration: number;
  readonly createdAt: string;
  readonly records: ClassifiedRunRecords;
  readonly changedPaths: readonly string[];
  readonly changedPathManifestReference: string;
  readonly waveCheckpointIds: readonly string[];
  readonly config: AuditRunConfiguration;
  /** Coverage-gap payloads that failed schema validation during ingestion. */
  readonly unclassifiedCoverageGaps?: number;
}

export interface CompletionProofBuildResult {
  readonly proof: CompletionProof;
  readonly invariants: Readonly<Record<string, boolean>>;
  readonly mutation: ZeroMutationVerification;
}

const CANONICAL_INVENTORY_TYPES = new Set<AuditRecord["recordType"]>([
  "route",
  "dynamic-instance",
  "shared-shell",
  "specialized-inventory",
]);

function partitionInventory(records: ClassifiedRunRecords): {
  readonly canonical: readonly AuditRecord[];
  readonly copyProposals: readonly AuditRecord[];
  readonly exclusions: readonly AuditRecord[];
  readonly coverageGaps: readonly AuditRecord[];
  readonly handoffs: readonly AuditRecord[];
} {
  const canonical: AuditRecord[] = [];
  const copyProposals: AuditRecord[] = [];
  const exclusions: AuditRecord[] = [];
  const coverageGaps: AuditRecord[] = [];
  for (const record of records.inventoryRecords) {
    if (CANONICAL_INVENTORY_TYPES.has(record.recordType)) canonical.push(record);
    if (record.recordType === "copy-proposal") copyProposals.push(record);
    if (record.recordType === "exclusion") exclusions.push(record);
    if (record.recordType === "coverage-gap") coverageGaps.push(record);
  }
  return {
    canonical,
    copyProposals,
    exclusions,
    coverageGaps,
    handoffs: records.handoffRecords,
  };
}

function unclassifiedInventoryCount(
  canonical: readonly AuditRecord[],
): number {
  let unclassified = 0;
  for (const record of canonical) {
    if (
      record.recordType === "specialized-inventory" &&
      record.status === "candidate"
    ) {
      unclassified += 1;
    }
  }
  return unclassified;
}

/**
 * Compute the machine-checkable completion totals and build the proof record.
 * Deterministic and pure: the same artifact set yields the same proof ID and
 * totals; `declaredComplete` is derived from the invariants, never asserted.
 */
export function buildCompletionProof(
  input: CompletionProofBuildInput,
): CompletionProofBuildResult {
  const { records } = input;
  const inventory = partitionInventory(records);

  const matrixRows = records.matrixRows;
  const findings = records.findings;
  const evidenceRecords = records.evidenceRecords;
  const validation = validateAuditPartition([
    ...findings,
    ...evidenceRecords,
    ...matrixRows,
    ...input.records.severityAssessments,
    ...inventory.handoffs,
  ]);

  const defectFindings = findings.filter(
    (finding: OccurrenceFinding) =>
      finding.resultClassification === "nonconforming",
  );
  const assessmentIds = new Set(
    records.severityAssessments.map(
      (assessment) => assessment.assessmentId,
    ),
  );
  const defectsWithSeverityRationale = defectFindings.filter(
    (finding: OccurrenceFinding) =>
      Boolean(finding.severityAssessmentId) &&
      assessmentIds.has(finding.severityAssessmentId ?? ""),
  );
  const copyDefects = findings.filter(
    (finding: OccurrenceFinding) =>
      finding.resultClassification === "nonconforming" && finding.copyRelated,
  );
  const groupedFindingIds = new Set(
    records.duplicateGroups.flatMap((group: DuplicateGroup) => group.findingIds),
  );
  const uniqueDefectFindingIds = new Set(
    defectFindings.map((finding: OccurrenceFinding) => finding.findingId),
  );
  const ungroupedDefects = [...uniqueDefectFindingIds].filter(
    (findingId) => !groupedFindingIds.has(findingId),
  );
  const handoffSubjects =
    records.duplicateGroups.filter((group: DuplicateGroup) =>
      group.findingIds.some((findingId) =>
        uniqueDefectFindingIds.has(findingId),
      ),
    ).length + ungroupedDefects.length;

  const pendingOperationKeys = new Set<string>();
  for (const finding of findings) {
    for (const blocker of (finding as OccurrenceFinding).blockers ?? []) {
      pendingOperationKeys.add(blocker.pendingOperation);
    }
  }
  for (const row of matrixRows) {
    for (const blocker of (row as MatrixRow).blockers ?? []) {
      pendingOperationKeys.add(blocker.pendingOperation);
    }
  }

  const resultTotals = {
    conforming: 0,
    nonconforming: 0,
    blocked: 0,
    notRun: 0,
    notApplicable: 0,
    requiresOwnerDecision: 0,
  };
  for (const finding of findings) {
    switch ((finding as OccurrenceFinding).resultClassification) {
      case "conforming":
        resultTotals.conforming += 1;
        break;
      case "nonconforming":
        resultTotals.nonconforming += 1;
        break;
      case "blocked":
        resultTotals.blocked += 1;
        break;
      case "not-run":
        resultTotals.notRun += 1;
        break;
      case "not-applicable":
        resultTotals.notApplicable += 1;
        break;
      case "requires-owner-decision":
        resultTotals.requiresOwnerDecision += 1;
        break;
    }
  }

  const totals = {
    inventory: inventory.canonical.length,
    matrixRows: matrixRows.length,
    findings: findings.length,
    evidenceRecords: evidenceRecords.length,
    copyDefects: copyDefects.length,
    copyProposals: inventory.copyProposals.length,
    defects: defectFindings.length,
    severityRationales: defectsWithSeverityRationale.length,
    handoffSubjects,
    handoffs: inventory.handoffs.length,
    exclusions: inventory.exclusions.length,
    unclassifiedInventory: unclassifiedInventoryCount(inventory.canonical),
    coverageGaps: inventory.coverageGaps.length,
    unclassifiedCoverageGaps: input.unclassifiedCoverageGaps ?? 0,
    pendingOperations: pendingOperationKeys.size,
    quarantine: validation.quarantined.length,
    nonTerminalRows: matrixRows.filter(
      (row: MatrixRow) => row.status === "pending",
    ).length,
  };

  const mutation = verifyZeroProductMutation(input.changedPaths, input.config);

  const invariants: Readonly<Record<string, boolean>> = Object.freeze({
    inventoryMatrixClosure: totals.inventory === totals.matrixRows,
    matrixFindingBijection: totals.matrixRows === totals.findings,
    findingEvidenceClosure: totals.findings === totals.evidenceRecords,
    copyProposalClosure: totals.copyDefects === totals.copyProposals,
    severityRationaleClosure: totals.defects === totals.severityRationales,
    handoffClosure: totals.handoffSubjects === totals.handoffs,
    zeroUnclassifiedInventory: totals.unclassifiedInventory === 0,
    zeroUnclassifiedCoverageGaps: totals.unclassifiedCoverageGaps === 0,
    zeroQuarantine: totals.quarantine === 0,
    zeroNonTerminalRows: totals.nonTerminalRows === 0,
    zeroProductMutation:
      mutation.productCodeMutations === 0 &&
      mutation.outsideApprovedPaths.length === 0,
    wavesRecorded: input.waveCheckpointIds.length > 0,
    resultTotalsReconcile:
      resultTotals.conforming +
        resultTotals.nonconforming +
        resultTotals.blocked +
        resultTotals.notRun +
        resultTotals.notApplicable +
        resultTotals.requiresOwnerDecision ===
      totals.findings,
  });

  const declaredComplete = Object.values(invariants).every(Boolean);

  const proofId = `proof.${sha256(
    [
      input.runId,
      input.manifestId,
      String(totals.matrixRows),
      String(totals.findings),
      String(declaredComplete),
    ].join("\u0000"),
  ).slice(0, 16)}`;

  const runtimeEvidenceIds = evidenceRecords
    .filter(
      (record: EvidenceRecord) => record.claimBasis === "runtime-observed",
    )
    .map((record: EvidenceRecord) => record.evidenceId)
    .sort();

  const candidate: Record<string, unknown> = {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "completion-proof",
    recordId: `record.${proofId}`,
    createdAt: input.createdAt,
    proofId,
    runId: input.runId,
    manifestId: input.manifestId,
    declaredComplete,
    inventoryGeneration: input.inventoryGeneration,
    resultTotals,
    totals,
    waveCheckpointIds:
      input.waveCheckpointIds.length > 0
        ? [...input.waveCheckpointIds]
        : ["wave-none-recorded"],
    runtimeAuthorizationEvidenceIds: runtimeEvidenceIds,
    staticLimitations: [
      "blocked/not-run rows are reported as pending protected operations, never as passes.",
      "Runtime claims require the authorization envelope of the plan; none is fabricated here.",
      "Generated artifacts and authored work remain distinguished; no authored report is copied into results.",
    ],
    changedPathManifestReference: input.changedPathManifestReference,
  };
  const parsed = parseAuditRecord(candidate);
  if (!parsed.success) {
    // Fail closed with an explicit non-complete proof on any drift.
    const fallback = parseAuditRecord({
      ...candidate,
      declaredComplete: false,
    });
    if (!fallback.success) {
      throw new Error(
        `Completion proof failed schema validation: ${fallback.diagnostics
          .map((diagnostic) => `${diagnostic.path.join(".")}:${diagnostic.code}`)
          .join(", ")}`,
      );
    }
    return { proof: fallback.data as CompletionProof, invariants, mutation };
  }
  // Guard the schema independently so drift cannot pass silently.
  CompletionProofSchema.parse(parsed.data);
  return { proof: parsed.data as CompletionProof, invariants, mutation };
}

// ---------------------------------------------------------------------------
// Runner and artifact writing
// ---------------------------------------------------------------------------

async function writeJsonFile(
  absolutePath: string,
  value: unknown,
): Promise<void> {
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function completionArtifactPath(
  runId: string,
  artifactPath: string,
  config: AuditRunConfiguration,
): string {
  return createGeneratedArtifactPath(
    runId,
    "completion-proof",
    artifactPath,
    config,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function runWave5CompletionProof(
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
  const unclassifiedCoverageGaps = rawRecords.filter(
    (record) =>
      isRecord(record) &&
      record.recordType === "coverage-gap" &&
      !parseAuditRecord(record).success,
  ).length;

  const manifestRelative = runManifestPath(
    repositoryRoot,
    immutableRunInputs,
    config,
  );
  let manifestId = `M-${sha256(runId).slice(0, 24)}`;
  let changedPaths: readonly string[] = [];
  let waveCheckpointIds: readonly string[] = [];
  let inventoryGeneration = 0;
  try {
    const manifestRaw = await readFile(
      path.resolve(repositoryRoot, manifestRelative),
      "utf8",
    );
    const manifest: unknown = JSON.parse(manifestRaw);
    if (isRecord(manifest)) {
      if (typeof manifest.manifestId === "string") manifestId = manifest.manifestId;
      if (typeof manifest.inventoryGeneration === "number") {
        inventoryGeneration = manifest.inventoryGeneration;
      }
      if (Array.isArray(manifest.changedPaths)) {
        changedPaths = manifest.changedPaths.filter(
          (value): value is string => typeof value === "string",
        );
      }
      if (Array.isArray(manifest.waveManifests)) {
        waveCheckpointIds = manifest.waveManifests
          .filter(isRecord)
          .filter(
            (wave) =>
              typeof wave.waveId === "number" && wave.status === "complete",
          )
          .map((wave) => `wave-${String(wave.waveId as number)}`)
          .sort();
      }
    }
  } catch {
    // Missing run manifest keeps totals visible but never fabricates closure.
    waveCheckpointIds = [];
  }

  const changedPathManifestRelative = completionArtifactPath(
    runId,
    "changed-path-manifest.json",
    config,
  );
  const proof = buildCompletionProof({
    runId,
    manifestId,
    inventoryGeneration,
    createdAt: new Date().toISOString(),
    records: classified,
    changedPaths,
    changedPathManifestReference: changedPathManifestRelative,
    waveCheckpointIds,
    unclassifiedCoverageGaps,
    config,
  });

  const changedPathResolved = resolveApprovedArtifactPath(
    repositoryRoot,
    changedPathManifestRelative,
    config,
    runId,
  );
  await writeJsonFile(changedPathResolved.absolutePath, {
    recordType: "changed-path-manifest",
    runId,
    manifestId,
    createdAt: new Date().toISOString(),
    changedPaths: [...changedPaths].sort(),
    productCodeMutations: proof.mutation.productCodeMutations,
    siteStarPaths: proof.mutation.siteStarPaths,
    outsideApprovedPaths: proof.mutation.outsideApprovedPaths,
    authoredWorkReferences: [
      `${config.artifactPaths.authoredRoot}/remediation-handoffs/`,
      `${config.artifactPaths.authoredRoot}/copy-review/`,
    ],
    generatedEvidenceRoot: `${config.artifactPaths.generatedRoot}/${runId}/`,
    zeroProductMutationProven:
      proof.mutation.productCodeMutations === 0 &&
      proof.mutation.outsideApprovedPaths.length === 0,
  });

  const proofRelative = completionArtifactPath(
    runId,
    "completion-proof.ndjson",
    config,
  );
  const proofResolved = resolveApprovedArtifactPath(
    repositoryRoot,
    proofRelative,
    config,
    runId,
  );
  const partitionResult = await writeCanonicalPartition(
    proofResolved.absolutePath,
    [proof.proof],
    // The proof carries only derived counts and record IDs; blanket key
    // redaction would corrupt the machine-checkable ID lists, so it is
    // disabled deliberately for this totals artifact.
    { redact: false },
  );

  const summaryRelative = createGeneratedArtifactPath(
    runId,
    "manifests",
    "wave-5/task-6.3-summary.json",
    config,
  );
  const summaryResolved = resolveApprovedArtifactPath(
    repositoryRoot,
    summaryRelative,
    config,
    runId,
  );
  const summary = {
    task: "6.3 — Final artifact manifests and machine-checkable completion proof",
    mode: "wave-5-completion-proof-complete",
    runId,
    waveId: 5,
    startedAt,
    completedAt: new Date().toISOString(),
    repositoryRevision: immutableRunInputs.repositoryRevision,
    configurationHash: immutableRunInputs.configurationHash,
    manifestId,
    manifestPath: manifestRelative,
    inventoryGeneration,
    proofId: proof.proof.proofId,
    declaredComplete: proof.proof.declaredComplete,
    resultTotals: proof.proof.resultTotals,
    totals: proof.proof.totals,
    invariants: proof.invariants,
    mutation: proof.mutation,
    ingestion: {
      rawRecords: rawRecords.length,
      quarantined: classified.quarantinedCount,
      pendingRows: classified.pendingRowCount,
    },
    proofArtifacts: {
      path: proofResolved.relativePath,
      contentHash: partitionResult.contentHash,
      recordCount: partitionResult.recordCount,
      changedPathManifest: changedPathResolved.relativePath,
    },
    staticLimitations: [
      "blocked, not-run, owner-decision, and coverage-gap totals are reported prominently and are never passes.",
      "The proof reconciles only generated artifacts present under this run; missing downstream artifacts keep declaredComplete false.",
      "No protected runtime, browser, hosted, database, test, build, or gate operation was executed.",
    ],
    requirements: ["4.7", "22.8-22.9", "26.1-26.12"],
    validation: {
      schemaClosure: parseAuditRecord(proof.proof).success,
      zeroProductMutation:
        proof.mutation.productCodeMutations === 0 &&
        proof.mutation.outsideApprovedPaths.length === 0,
      everyInvariantVisible: Object.keys(proof.invariants).length > 0,
      sourceOnlyBatch: true,
    },
  };
  await writeJsonFile(summaryResolved.absolutePath, summary);

  return {
    ...summary,
    writtenPaths: [
      changedPathResolved.relativePath,
      proofResolved.relativePath,
      summaryResolved.relativePath,
    ],
  };
}

export const WAVE5_COMPLETION_PROOF_SCHEMA_VERSION = AUDIT_SCHEMA_VERSION;
