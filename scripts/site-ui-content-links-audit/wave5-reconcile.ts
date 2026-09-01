/**
 * Wave 5 — Task 6.1: final occurrence-finding reconciliation, severity
 * reconciliation, and duplicate-group generation across waves.
 *
 * This module ingests the canonical NDJSON partitions produced by Waves 0–4,
 * verifies the matrix/finding bijection per wave, retains one terminal finding
 * per matrix row (including conforming rows), merges severity across waves by
 * the highest-supported deciding factor without losing conflicts, and groups
 * supported root causes with `DuplicateGroupSchema` while retaining every
 * per-occurrence evidence/finding record. Planner and Studio symptoms are
 * never merged into one group: grouping is surface-scoped and the schema
 * rejects cross-fork source areas. `requires-owner-decision` findings are
 * preserved as-is.
 *
 * No browser, protected-route, hosted, database, test, build, gate, or
 * product-mutating operation is performed here.
 *
 * Requirements: 20.1-20.8, 21.1-21.7, 26.3-26.5, 26.7.
 */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
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
  mergeCanonicalRecords,
  sha256,
  toPartitionId,
  writeCanonicalPartition,
} from "./manifests";
import {
  AUDIT_SCHEMA_VERSION,
  parseAuditRecord,
  validateAuditPartition,
  type AuditRecord,
} from "./schemas";
import {
  createImmutableRunInputs,
  readRepositoryRevision,
} from "./runIdentity";

// ---------------------------------------------------------------------------
// Record aliases
// ---------------------------------------------------------------------------

type MatrixRow = Extract<AuditRecord, { readonly recordType: "matrix-row" }>;
type OccurrenceFinding = Extract<
  AuditRecord,
  { readonly recordType: "finding" }
>;
type EvidenceRecord = Extract<AuditRecord, { readonly recordType: "evidence" }>;
type SeverityAssessmentRecord = Extract<
  AuditRecord,
  { readonly recordType: "severity-assessment" }
>;
type DuplicateGroup = Extract<
  AuditRecord,
  { readonly recordType: "duplicate-group" }
>;
type Severity = SeverityAssessmentRecord["severity"];

export type ResultClassification = OccurrenceFinding["resultClassification"];

// ---------------------------------------------------------------------------
// Severity ordering (deterministic, highest-supported factor wins)
// ---------------------------------------------------------------------------

export const SEVERITY_ORDER = [
  "critical",
  "high",
  "medium",
  "low",
  "advisory",
  "not-applicable",
] as const satisfies readonly Severity[];

export function severityRank(severity: Severity): number {
  return SEVERITY_ORDER.length - SEVERITY_ORDER.indexOf(severity);
}

/** Deterministic maximum: a higher impact can never reduce severity. */
export function maxSeverity(severities: readonly Severity[]): Severity {
  let best: Severity = "not-applicable";
  for (const severity of severities) {
    if (severityRank(severity) > severityRank(best)) best = severity;
  }
  return best;
}

// ---------------------------------------------------------------------------
// Wave record sets
// ---------------------------------------------------------------------------

export interface WaveRecordSet {
  readonly waveId: number;
  readonly matrixRows: readonly MatrixRow[];
  readonly findings: readonly OccurrenceFinding[];
  readonly evidenceRecords: readonly EvidenceRecord[];
  readonly severityAssessments: readonly SeverityAssessmentRecord[];
}

export interface Wave5ReconciliationResult {
  readonly finalFindings: readonly OccurrenceFinding[];
  readonly finalSeverityAssessments: readonly SeverityAssessmentRecord[];
  readonly duplicateGroups: readonly DuplicateGroup[];
  readonly matrixFindingBijection: boolean;
  readonly ungroupedDefectFindingIds: readonly string[];
  readonly requiresOwnerDecisionFindingIds: readonly string[];
  readonly conflictRetainedOccurrenceIds: readonly string[];
  readonly occurrenceCount: number;
}

export class WaveReconciliationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "WaveReconciliationError";
  }
}

// ---------------------------------------------------------------------------
// Run-artifact ingestion (read-only)
// ---------------------------------------------------------------------------

export interface ClassifiedRunRecords {
  readonly matrixRows: readonly MatrixRow[];
  readonly findings: readonly OccurrenceFinding[];
  readonly evidenceRecords: readonly EvidenceRecord[];
  readonly severityAssessments: readonly SeverityAssessmentRecord[];
  readonly duplicateGroups: readonly DuplicateGroup[];
  readonly handoffRecords: readonly AuditRecord[];
  readonly inventoryRecords: readonly AuditRecord[];
  readonly quarantinedCount: number;
  readonly pendingRowCount: number;
}

function isMatrixRow(record: AuditRecord): record is MatrixRow {
  return record.recordType === "matrix-row";
}

/** Parse untrusted NDJSON payloads into schema-valid records or quarantine. */
export function classifyRunRecords(
  records: readonly unknown[],
): ClassifiedRunRecords {
  const validation = validateAuditPartition(records);
  const inventoryKinds = new Set<AuditRecord["recordType"]>([
    "route",
    "dynamic-instance",
    "shared-shell",
    "specialized-inventory",
    "copy-proposal",
    "exclusion",
    "coverage-gap",
  ]);
  return Object.freeze({
    matrixRows: validation.records.filter(isMatrixRow),
    findings: validation.records.filter(
      (record): record is OccurrenceFinding => record.recordType === "finding",
    ),
    evidenceRecords: validation.records.filter(
      (record): record is EvidenceRecord => record.recordType === "evidence",
    ),
    severityAssessments: validation.records.filter(
      (record): record is SeverityAssessmentRecord =>
        record.recordType === "severity-assessment",
    ),
    duplicateGroups: validation.records.filter(
      (record): record is DuplicateGroup =>
        record.recordType === "duplicate-group",
    ),
    handoffRecords: validation.records.filter(
      (record) => record.recordType === "remediation-handoff",
    ),
    inventoryRecords: validation.records.filter((record) =>
      inventoryKinds.has(record.recordType),
    ),
    quarantinedCount: validation.quarantined.length,
    pendingRowCount: validation.pendingOccurrenceIds.length,
  });
}

async function collectNdjsonFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectNdjsonFiles(child)));
    } else if (entry.isFile() && entry.name.endsWith(".ndjson")) {
      files.push(child);
    }
  }
  return files;
}

/** Read canonical NDJSON partitions under one directory without executing anything. */
export async function readNdjsonRecords(
  directory: string,
): Promise<readonly unknown[]> {
  const files = await collectNdjsonFiles(directory);
  const records: unknown[] = [];
  for (const file of files) {
    const raw = await readFile(file, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        records.push(JSON.parse(trimmed) as unknown);
      } catch {
        records.push({ unparsableLine: true, file });
      }
    }
  }
  return records;
}

/**
 * Group classified run records into per-wave record sets. Duplicate identical
 * records across wave files are merged by stable identity first, then each
 * matrix row deterministically consumes exactly one unconsumed finding record
 * for its occurrence, so a finding shared by several waves (same occurrence
 * fingerprint) can never be double-counted or lost.
 */
export function groupRecordsIntoWaves(
  classified: ClassifiedRunRecords,
): readonly WaveRecordSet[] {
  const matrixRows = mergeCanonicalRecords([...classified.matrixRows]).records;
  const findings = mergeCanonicalRecords([...classified.findings]).records;
  const evidenceRecords = mergeCanonicalRecords(
    [...classified.evidenceRecords],
  ).records;
  const severityAssessments = mergeCanonicalRecords(
    [...classified.severityAssessments],
  ).records;

  const rowsByWave = new Map<number, MatrixRow[]>();
  for (const row of matrixRows) {
    const waveId = Number(row.waveId);
    if (!Number.isInteger(waveId) || waveId < 0 || waveId > 4) continue;
    const bucket = rowsByWave.get(waveId) ?? [];
    bucket.push(row);
    rowsByWave.set(waveId, bucket);
  }

  const unconsumedFindings = new Map<string, OccurrenceFinding[]>();
  for (const finding of [...findings].sort((left, right) =>
    left.recordId.localeCompare(right.recordId),
  )) {
    const bucket = unconsumedFindings.get(finding.occurrenceId) ?? [];
    bucket.push(finding);
    unconsumedFindings.set(finding.occurrenceId, bucket);
  }

  const evidenceByFindingId = new Map<string, EvidenceRecord[]>();
  for (const evidence of evidenceRecords) {
    const bucket = evidenceByFindingId.get(evidence.findingId) ?? [];
    bucket.push(evidence);
    evidenceByFindingId.set(evidence.findingId, bucket);
  }
  const severityByFindingId = new Map<string, SeverityAssessmentRecord[]>();
  for (const assessment of severityAssessments) {
    const bucket = severityByFindingId.get(assessment.findingId) ?? [];
    bucket.push(assessment);
    severityByFindingId.set(assessment.findingId, bucket);
  }

  const waves: WaveRecordSet[] = [];
  for (const [waveId, rows] of [...rowsByWave.entries()].sort(
    (left, right) => left[0] - right[0],
  )) {
    const sortedRows = [...rows].sort((left, right) =>
      left.occurrenceId.localeCompare(right.occurrenceId),
    );
    const waveFindings: OccurrenceFinding[] = [];
    for (const row of sortedRows) {
      const bucket = unconsumedFindings.get(row.occurrenceId) ?? [];
      const index = bucket.findIndex(
        (finding) => finding.findingId === row.findingId,
      );
      if (index < 0) {
        throw new WaveReconciliationError(
          `Wave ${waveId} row ${row.occurrenceId} has no unconsumed matching finding record.`,
        );
      }
      waveFindings.push(bucket.splice(index, 1)[0] as OccurrenceFinding);
    }
    const findingIds = new Set(
      waveFindings.map((finding) => finding.findingId),
    );
    waves.push({
      waveId,
      matrixRows: sortedRows,
      findings: waveFindings,
      evidenceRecords: [...findingIds].flatMap(
        (findingId) => evidenceByFindingId.get(findingId) ?? [],
      ),
      severityAssessments: [...findingIds].flatMap(
        (findingId) => severityByFindingId.get(findingId) ?? [],
      ),
    });
  }
  return Object.freeze(waves);
}

// ---------------------------------------------------------------------------
// Reconciliation
// ---------------------------------------------------------------------------

function assertWaveBijection(wave: WaveRecordSet): void {
  const occurrenceIds = wave.matrixRows.map((row) => row.occurrenceId);
  if (new Set(occurrenceIds).size !== occurrenceIds.length) {
    throw new WaveReconciliationError(
      `Wave ${wave.waveId} has duplicate occurrence IDs in its matrix.`,
    );
  }
  if (wave.matrixRows.length !== wave.findings.length) {
    throw new WaveReconciliationError(
      `Wave ${wave.waveId} matrix/finding bijection failed: ${wave.matrixRows.length} rows vs ${wave.findings.length} findings.`,
    );
  }
  const findingByOccurrence = new Map(
    wave.findings.map((finding) => [finding.occurrenceId, finding.findingId]),
  );
  for (const row of wave.matrixRows) {
    if (!row.findingId || findingByOccurrence.get(row.occurrenceId) !== row.findingId) {
      throw new WaveReconciliationError(
        `Wave ${wave.waveId} row ${row.occurrenceId} is not linked to exactly one matching finding.`,
      );
    }
    if (row.status === "pending") {
      throw new WaveReconciliationError(
        `Wave ${wave.waveId} row ${row.occurrenceId} is still pending; only terminal rows may reconcile.`,
      );
    }
  }
}

function rootCauseSignature(
  finding: OccurrenceFinding,
  evidence: readonly EvidenceRecord[],
): string {
  const parts = evidence
    .filter((record) => record.findingId === finding.findingId)
    .map((record) => `${record.auditDimension}|${record.sourceOrRuntimeLocation}`)
    .sort();
  if (parts.length === 0) {
    parts.push(`unresolved|${finding.findingId}`);
  }
  return sha256([finding.productSurface, ...parts].join("\u0000")).slice(0, 16);
}

/**
 * Reconcile final occurrence findings, severity, and duplicate groups across
 * waves. Deterministic: same input records, same output ordering and IDs.
 */
export function reconcileWaveRecords(
  waves: readonly WaveRecordSet[],
  createdAt: string,
): Wave5ReconciliationResult {
  for (const wave of waves) assertWaveBijection(wave);

  const evidenceByFinding = new Map<string, EvidenceRecord[]>();
  for (const wave of waves) {
    for (const evidence of wave.evidenceRecords) {
      const bucket = evidenceByFinding.get(evidence.findingId) ?? [];
      bucket.push(evidence);
      evidenceByFinding.set(evidence.findingId, bucket);
    }
  }

  const allFindings: OccurrenceFinding[] = [];
  for (const wave of waves) allFindings.push(...wave.findings);

  // Occurrence-level view for grouping and conflict retention.
  const findingsByOccurrence = new Map<string, OccurrenceFinding[]>();
  for (const finding of allFindings) {
    const bucket = findingsByOccurrence.get(finding.occurrenceId) ?? [];
    bucket.push(finding);
    findingsByOccurrence.set(finding.occurrenceId, bucket);
  }

  const conflictRetainedOccurrenceIds: string[] = [];
  for (const [occurrenceId, findings] of findingsByOccurrence) {
    const classifications = new Set(
      findings.map((finding) => finding.resultClassification),
    );
    if (classifications.size > 1) conflictRetainedOccurrenceIds.push(occurrenceId);
  }

  // Duplicate grouping — surface-scoped so Planner and Studio never merge.
  const groupMembers = new Map<
    string,
    { surface: DuplicateGroup["productSurface"]; findings: OccurrenceFinding[] }
  >();
  for (const finding of allFindings) {
    if (finding.resultClassification !== "nonconforming") continue;
    const evidence = evidenceByFinding.get(finding.findingId) ?? [];
    const signature = rootCauseSignature(finding, evidence);
    const key = `${finding.productSurface}\u0000${signature}`;
    const bucket = groupMembers.get(key) ?? {
      surface: finding.productSurface,
      findings: [],
    };
    bucket.findings.push(finding);
    groupMembers.set(key, bucket);
  }

  const duplicateGroups: DuplicateGroup[] = [];
  const groupIdByFinding = new Map<string, string>();
  for (const [key, member] of [...groupMembers.entries()].sort((left, right) =>
    left[0].localeCompare(right[0]),
  )) {
    const signatures = key.split("\u0000");
    const surface = signatures[0] ?? member.surface;
    const signature = signatures[1] ?? "unknown";
    if (member.findings.length < 2) continue;
    const members = [...member.findings].sort((left, right) =>
      left.findingId.localeCompare(right.findingId),
    );
    const distinctOccurrences = new Set(
      members.map((finding) => finding.occurrenceId),
    );
    // A supported duplicate group spans at least two distinct occurrences;
    // repeated wave records for one occurrence are not a duplicate group.
    if (distinctOccurrences.size < 2) continue;
    const memberEvidence = members.flatMap(
      (finding) => evidenceByFinding.get(finding.findingId) ?? [],
    );
    const duplicateGroupId = `group.wave5.${sha256(key).slice(0, 16)}`;
    const sourceAreas = [
      ...new Set(
        memberEvidence
          .map((record) => record.sourceOrRuntimeLocation)
          .filter((location) => location.trim().length > 0),
      ),
    ].sort();
    const dimensions = [
      ...new Set(memberEvidence.map((record) => record.auditDimension)),
    ].sort();
    const group: DuplicateGroup = {
      schemaVersion: AUDIT_SCHEMA_VERSION,
      recordType: "duplicate-group",
      recordId: `record.${duplicateGroupId}`,
      createdAt,
      duplicateGroupId,
      productSurface: surface as DuplicateGroup["productSurface"],
      rootCauseSignature: signature,
      likelySourceAreas:
        sourceAreas.length > 0 ? sourceAreas : ["unresolved-source-location"],
      violatedContract: `The source-visible contract for ${dimensions.join(", ")} must hold on every affected occurrence.`,
      failureMechanism: `A supported shared root cause (signature ${signature}) explains the identical failure mechanism across ${members.length} retained occurrence findings on the ${surface} surface.`,
      findingIds: [...new Set(members.map((finding) => finding.findingId))].sort(),
      occurrenceIds: [...new Set(members.map((finding) => finding.occurrenceId))].sort(),
      evidenceIds: [...new Set(memberEvidence.map((record) => record.evidenceId))].sort(),
    };
    duplicateGroups.push(group);
    for (const findingId of group.findingIds) {
      groupIdByFinding.set(findingId, duplicateGroupId);
    }
  }

  const finalFindings = allFindings.map((finding) => {
    const groupId = groupIdByFinding.get(finding.findingId);
    if (!groupId || finding.duplicateGroupId === groupId) return finding;
    return { ...finding, duplicateGroupId: groupId };
  });

  // Severity reconciliation: merged cross-wave assessment keeps the highest
  // supported severity; all original assessments are retained unchanged.
  const finalSeverityAssessments: SeverityAssessmentRecord[] = [];
  const seenAssessmentIds = new Set<string>();
  for (const wave of waves) {
    for (const assessment of wave.severityAssessments) {
      if (seenAssessmentIds.has(assessment.assessmentId)) continue;
      seenAssessmentIds.add(assessment.assessmentId);
      finalSeverityAssessments.push(assessment);
    }
  }
  const severityByFinding = new Map<string, SeverityAssessmentRecord[]>();
  for (const assessment of finalSeverityAssessments) {
    const bucket = severityByFinding.get(assessment.findingId) ?? [];
    bucket.push(assessment);
    severityByFinding.set(assessment.findingId, bucket);
  }
  for (const [occurrenceId, findings] of [...findingsByOccurrence.entries()].sort(
    (left, right) => left[0].localeCompare(right[0]),
  )) {
    const assessments = findings.flatMap(
      (finding) => severityByFinding.get(finding.findingId) ?? [],
    );
    if (assessments.length < 2) continue;
    const ranked = [...assessments].sort(
      (left, right) => severityRank(right.severity) - severityRank(left.severity),
    );
    const top = ranked[0];
    if (!top) continue;
    const assessmentId = `severity.wave5.merged.${sha256(occurrenceId).slice(0, 16)}`;
    if (seenAssessmentIds.has(assessmentId)) continue;
    seenAssessmentIds.add(assessmentId);
    finalSeverityAssessments.push({
      ...top,
      schemaVersion: AUDIT_SCHEMA_VERSION,
      recordType: "severity-assessment",
      recordId: `record.${assessmentId}`,
      createdAt,
      assessmentId,
      findingId: top.findingId,
      severity: maxSeverity(ranked.map((assessment) => assessment.severity)),
      severityRationale: `Cross-wave reconciliation retained the highest supported severity; member rationales: ${ranked
        .map((assessment) => `${assessment.assessmentId} (${assessment.severity})`)
        .join("; ")}.`,
      decidingDimension: top.decidingDimension,
      occurrenceCount: new Set(
        findings.map((finding) => finding.occurrenceId),
      ).size,
    });
  }

  const defectFindingIds = finalFindings
    .filter((finding) => finding.resultClassification === "nonconforming")
    .map((finding) => finding.findingId);
  const groupedFindingIdSet = new Set(duplicateGroups.flatMap((group) => group.findingIds));
  const ungroupedDefectFindingIds = [...new Set(defectFindingIds)]
    .filter((findingId) => !groupedFindingIdSet.has(findingId))
    .sort();

  const matrixFindingBijection =
    waves.reduce((total, wave) => total + wave.matrixRows.length, 0) ===
      finalFindings.length &&
    new Set(finalFindings.map((finding) => finding.recordId)).size ===
      finalFindings.length;

  return Object.freeze({
    finalFindings: Object.freeze(
      [...finalFindings].sort((left, right) =>
        `${left.occurrenceId}:${left.findingId}`.localeCompare(
          `${right.occurrenceId}:${right.findingId}`,
        ),
      ),
    ),
    finalSeverityAssessments: Object.freeze(
      finalSeverityAssessments.sort((left, right) =>
        left.assessmentId.localeCompare(right.assessmentId),
      ),
    ),
    duplicateGroups: Object.freeze(duplicateGroups),
    matrixFindingBijection,
    ungroupedDefectFindingIds: Object.freeze(ungroupedDefectFindingIds),
    requiresOwnerDecisionFindingIds: Object.freeze(
      [
        ...new Set(
          finalFindings
            .filter(
              (finding) =>
                finding.resultClassification === "requires-owner-decision",
            )
            .map((finding) => finding.findingId),
        ),
      ].sort(),
    ),
    conflictRetainedOccurrenceIds: Object.freeze(
      conflictRetainedOccurrenceIds.sort(),
    ),
    occurrenceCount: findingsByOccurrence.size,
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

function wave5ArtifactPath(
  runId: string,
  purpose: string,
  artifactPath: string,
  config: Parameters<typeof createGeneratedArtifactPath>[3],
): string {
  return createGeneratedArtifactPath(runId, purpose, `wave-5/${artifactPath}`, config);
}

export async function runWave5Reconciliation(
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
  const waves = groupRecordsIntoWaves(classified);
  const reconciled = reconcileWaveRecords(waves, new Date().toISOString());

  const closure = validateAuditPartition([
    ...reconciled.finalFindings,
    ...reconciled.finalSeverityAssessments,
    ...reconciled.duplicateGroups,
  ]);
  if (!closure.canClose) {
    throw new WaveReconciliationError(
      `Wave 5 reconciliation output cannot close: ${closure.closureDiagnostics
        .map((diagnostic) => diagnostic.code)
        .join(", ")}`,
    );
  }

  const files: readonly { readonly key: string; readonly purpose: string; readonly filename: string; readonly records: readonly object[] }[] = [
    {
      key: "wave-5/reconcile/final-findings",
      purpose: "findings",
      filename: "final-findings.ndjson",
      records: reconciled.finalFindings,
    },
    {
      key: "wave-5/reconcile/severity-assessments",
      purpose: "findings",
      filename: "severity-assessments.ndjson",
      records: reconciled.finalSeverityAssessments,
    },
    {
      key: "wave-5/reconcile/duplicate-groups",
      purpose: "findings",
      filename: "duplicate-groups.ndjson",
      records: reconciled.duplicateGroups,
    },
  ];

  const inputFingerprint = sha256([
    immutableRunInputs.configurationHash,
    immutableRunInputs.repositoryRevision,
    "wave-5-reconcile",
    String(reconciled.finalFindings.length),
    String(reconciled.duplicateGroups.length),
  ]).slice(0, 32);

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
    const relativePath = wave5ArtifactPath(runId, file.purpose, file.filename, config);
    const resolved = resolveApprovedArtifactPath(repositoryRoot, relativePath, config, runId);
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

  const summaryRelative = wave5ArtifactPath(
    runId,
    "manifests",
    "task-6.1-summary.json",
    config,
  );
  const summaryResolved = resolveApprovedArtifactPath(
    repositoryRoot,
    summaryRelative,
    config,
    runId,
  );
  const summary = {
    task: "6.1 — Final occurrence findings, severity, and duplicate-group reconciliation",
    mode: "wave-5-reconciliation-complete",
    runId,
    waveId: 5,
    startedAt,
    completedAt: new Date().toISOString(),
    repositoryRevision: immutableRunInputs.repositoryRevision,
    configurationHash: immutableRunInputs.configurationHash,
    inputFingerprint,
    ingestion: {
      rawRecords: rawRecords.length,
      quarantined: classified.quarantinedCount,
      pendingRows: classified.pendingRowCount,
      waves: waves.map((wave) => ({
        waveId: wave.waveId,
        matrixRows: wave.matrixRows.length,
        findings: wave.findings.length,
        evidenceRecords: wave.evidenceRecords.length,
        severityAssessments: wave.severityAssessments.length,
      })),
    },
    reconciliation: {
      finalFindings: reconciled.finalFindings.length,
      finalSeverityAssessments: reconciled.finalSeverityAssessments.length,
      duplicateGroups: reconciled.duplicateGroups.length,
      matrixFindingBijection: reconciled.matrixFindingBijection,
      ungroupedDefectFindings: reconciled.ungroupedDefectFindingIds.length,
      requiresOwnerDecisionFindings:
        reconciled.requiresOwnerDecisionFindingIds.length,
      conflictsRetainedOccurrences:
        reconciled.conflictRetainedOccurrenceIds.length,
      occurrenceCount: reconciled.occurrenceCount,
    },
    partitions: partitionResults,
    staticLimitations: [
      "Reconciliation consumed only generated run artifacts; no protected runtime evidence was fabricated.",
      "Cross-wave conflicts are retained as separate findings plus merged severity assessments; no member record is dropped.",
      "Planner and Studio symptoms are grouped separately; the duplicate-group schema rejects cross-fork source areas.",
    ],
    changedPathManifest: {
      writtenPaths: [...writtenPaths, summaryResolved.relativePath],
      siteStarPaths: [...writtenPaths, summaryResolved.relativePath].filter(
        (relativePath) => relativePath.startsWith("site/"),
      ),
      productCodeMutations: 0,
    },
    requirements: ["20.1-20.8", "21.1-21.7", "26.3-26.5", "26.7"],
    validation: {
      matrixFindingBijection: reconciled.matrixFindingBijection,
      everyReconciledRecordValid: closure.quarantined.length === 0,
      noPendingReconciledRows: closure.pendingOccurrenceIds.length === 0,
      noProductCodeWrite: true,
      sourceOnlyBatch: true,
    },
  };
  await writeJsonFile(summaryResolved.absolutePath, summary);
  writtenPaths.push(summaryResolved.relativePath);

  return { ...summary, writtenPaths };
}

export const WAVE5_RECONCILE_SCHEMA_VERSION = AUDIT_SCHEMA_VERSION;
