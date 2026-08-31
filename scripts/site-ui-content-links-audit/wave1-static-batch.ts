/**
 * Wave 1 — Task 2.4 static batch and checkpoint.
 *
 * This is the single source-only entry point for the Wave 1 checkpoint. It
 * combines the existing Wave 1 inventory builders with the foundation
 * occurrence evaluator, writes generated evidence under the approved audit
 * artifact root, and closes the Wave 1 manifest only after every owned
 * partition is terminal.
 *
 * No browser, network, authentication, consent-delivery, offline-transition,
 * test, build, gate, local-service, hosted, database, or product-code action
 * is performed here. Runtime-dependent work is represented as exact pending
 * operations in the generated summary and occurrence evidence.
 */

import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

import {
  createGeneratedArtifactPath,
  resolveApprovedArtifactPath,
  verifyFailClosedArtifactPolicy,
} from "./artifactPaths";
import { DEFAULT_CONFIG_PATH, loadAuditConfiguration } from "./config";
import {
  discoverCanonicalInventory,
  discoveryToAuditRecords,
  type ProductSurface,
} from "./discovery";
import {
  computeFingerprint,
  generateWriterId,
  toPartitionId,
  writeCanonicalPartition,
  type PartitionId,
} from "./manifests";
import { expandToOccurrences, type OccurrenceRecord } from "./profiles";
import {
  AUDIT_SCHEMA_VERSION,
  parseAuditRecord,
  type AuditRecord,
} from "./schemas";
import {
  createImmutableRunInputs,
  readRepositoryRevision,
} from "./runIdentity";
import { completeWave, runWave } from "./wave";
import { buildJourneyInventory, type JourneyRecord } from "./wave1-journeys";
import { buildLinkInventory, type LinkInventoryRecord } from "./wave1-links";
import {
  buildNavigationInventory,
  type NavItemRecord,
} from "./wave1-navigation";
import { buildStateInventory, type StateRecord } from "./wave1-states";
import {
  buildFoundationAuditRecords,
  buildFoundationInventories,
} from "./wave1-foundations";

// ---------------------------------------------------------------------------
// Types and small helpers
// ---------------------------------------------------------------------------

type SpecializedInventoryRecord = Extract<
  AuditRecord,
  { readonly recordType: "specialized-inventory" }
>;
type MatrixRow = Extract<AuditRecord, { readonly recordType: "matrix-row" }>;
type EvidenceRecord = Extract<AuditRecord, { readonly recordType: "evidence" }>;
type OccurrenceFinding = Extract<
  AuditRecord,
  { readonly recordType: "finding" }
>;

type SharedShellRecord = Extract<
  AuditRecord,
  { readonly recordType: "shared-shell" }
>;

type InventoryRecord =
  | SharedShellRecord
  | SpecializedInventoryRecord
  | LinkInventoryRecord
  | NavItemRecord
  | StateRecord
  | JourneyRecord;

interface PartitionSpec {
  readonly id: PartitionId;
  readonly relativePath: string;
  readonly records: readonly object[];
}

interface PartitionResult {
  readonly path: string;
  readonly records: number;
  readonly contentHash: string;
}

interface PendingRuntimeOperation {
  readonly operationId: string;
  readonly exactOperation: string;
  readonly requiredAuthorization: string;
  readonly affectedOccurrenceIds: readonly string[];
  readonly resultWhenUnauthorized: "not-run" | "requires-owner-decision";
}

const FOUNDATION_SURFACES = new Set<ProductSurface>([
  "authentication",
  "legal",
  "offline",
  "portal-dashboard",
  "administration",
  "planner",
  "studio",
  "shared-shell",
]);

const FOUNDATION_STATE_IDS = new Set([
  "state.loading",
  "state.error",
  "state.not-found",
  "state.offline",
  "state.logged-in",
  "state.logged-out",
]);

function isWave1Occurrence(occurrence: OccurrenceRecord): boolean {
  return (
    occurrence.subjectKind === "shell" ||
    occurrence.waveId === 1 ||
    FOUNDATION_SURFACES.has(occurrence.productSurface) ||
    FOUNDATION_STATE_IDS.has(occurrence.stateId)
  );
}

function validateAuditRecord(record: unknown): {
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

function assertValidRecords(records: readonly object[], label: string): void {
  for (const [index, record] of records.entries()) {
    const validation = validateAuditRecord(record);
    if (!validation.valid) {
      throw new Error(
        `${label}[${index}] failed audit schema validation: ${(validation.diagnostics ?? []).join(", ")}`,
      );
    }
  }
}

async function writeJsonFile(
  absolutePath: string,
  value: unknown,
): Promise<void> {
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function generatedPath(
  runId: string,
  purpose: string,
  relativePath: string,
  config: Parameters<typeof createGeneratedArtifactPath>[3],
): string {
  return createGeneratedArtifactPath(runId, purpose, relativePath, config);
}

function surfacePartitions(
  rows: readonly MatrixRow[],
  evidence: readonly EvidenceRecord[],
  findings: readonly OccurrenceFinding[],
): readonly ProductSurface[] {
  return [
    ...new Set([
      ...rows.map((row) => row.productSurface),
      ...evidence.map((record) => record.productSurface),
      ...findings.map((finding) => finding.productSurface),
    ]),
  ].sort() as ProductSurface[];
}

function pendingFromFoundation(foundation: {
  readonly pendingOperations: readonly {
    readonly operationId: string;
    readonly exactOperation: string;
    readonly requiredAuthorization: string;
    readonly occurrenceId: string;
    readonly resultWhenUnauthorized: "not-run" | "requires-owner-decision";
  }[];
}): readonly PendingRuntimeOperation[] {
  return foundation.pendingOperations.map((operation) => ({
    operationId: operation.operationId,
    exactOperation: operation.exactOperation,
    requiredAuthorization: operation.requiredAuthorization,
    affectedOccurrenceIds: [operation.occurrenceId],
    resultWhenUnauthorized: operation.resultWhenUnauthorized,
  }));
}

function linkPendingOperations(
  links: readonly LinkInventoryRecord[],
  occurrenceIds: readonly string[],
): readonly PendingRuntimeOperation[] {
  const pending = links.filter((record) =>
    record.payload.resultClassification.startsWith("not-run"),
  );
  if (pending.length === 0) return [];

  const sourceKinds = [
    ...new Set(pending.map((record) => record.payload.targetType)),
  ].sort();
  const sourceDescription =
    sourceKinds.length > 0
      ? sourceKinds.join(", ")
      : "runtime-dependent link targets";

  return [
    {
      operationId: "op.wave1.links.external-and-protocol-availability",
      exactOperation: `Authorized external/protocol target inspection for Wave 1 link inventory (${sourceDescription}): verify availability, protocol handling, opening behavior, download response, and security attributes without persisting secrets or personal data.`,
      requiredAuthorization:
        "Exact current-session authorization for the named external/protocol inspection and hook permission; no network request is made during this static batch.",
      affectedOccurrenceIds: occurrenceIds,
      resultWhenUnauthorized: "not-run",
    },
    {
      operationId: "op.wave1.links.rendered-target-verification",
      exactOperation:
        "Authorized browser workflow for every affected Wave 1 link occurrence: verify rendered link targets, fragments, downloads, navigation transitions, and recovery behavior at the recorded profiles.",
      requiredAuthorization:
        "Exact browser operation authorization matching the affected occurrence selectors and hook permission; this static batch does not launch a browser.",
      affectedOccurrenceIds: occurrenceIds,
      resultWhenUnauthorized: "not-run",
    },
  ];
}

function uniquePendingOperations(
  operations: readonly PendingRuntimeOperation[],
): readonly PendingRuntimeOperation[] {
  const byId = new Map<string, PendingRuntimeOperation>();
  for (const operation of operations) {
    const previous = byId.get(operation.operationId);
    if (!previous) {
      byId.set(operation.operationId, operation);
      continue;
    }
    byId.set(operation.operationId, {
      ...previous,
      affectedOccurrenceIds: [
        ...new Set([
          ...previous.affectedOccurrenceIds,
          ...operation.affectedOccurrenceIds,
        ]),
      ].sort(),
    });
  }
  return [...byId.values()].sort((left, right) =>
    left.operationId.localeCompare(right.operationId),
  );
}

function resultTotals(
  findings: readonly OccurrenceFinding[],
): Record<string, number> {
  const totals: Record<string, number> = {
    conforming: 0,
    nonconforming: 0,
    blocked: 0,
    "not-run": 0,
    "not-applicable": 0,
    "requires-owner-decision": 0,
  };
  for (const finding of findings) {
    totals[finding.resultClassification] =
      (totals[finding.resultClassification] ?? 0) + 1;
  }
  return totals;
}

function inventoryStatusTotals(
  records: readonly InventoryRecord[],
): Record<string, number> {
  return records.reduce<Record<string, number>>((totals, record) => {
    totals[record.status] = (totals[record.status] ?? 0) + 1;
    return totals;
  }, {});
}

// ---------------------------------------------------------------------------
// Public static batch entry point
// ---------------------------------------------------------------------------

export async function runWave1StaticBatch(
  repositoryRoot = process.cwd(),
  configPath = DEFAULT_CONFIG_PATH,
): Promise<Record<string, unknown>> {
  const startedAt = new Date().toISOString();
  const loaded = await loadAuditConfiguration(repositoryRoot, configPath);
  verifyFailClosedArtifactPolicy(repositoryRoot, loaded.config);

  const revision = readRepositoryRevision(repositoryRoot);
  const immutableRunInputs = createImmutableRunInputs(loaded, revision);
  const { config, configurationHash } = loaded;
  const { runId } = immutableRunInputs;
  const discoveredAt = new Date().toISOString();

  const discovery = await discoverCanonicalInventory({
    repositoryRoot,
    discoveredAt,
  });
  const discoveryRecords = discoveryToAuditRecords(discovery);
  const shellRecords = discoveryRecords.filter(
    (
      record,
    ): record is Extract<
      AuditRecord,
      { readonly recordType: "shared-shell" }
    > => record.recordType === "shared-shell",
  );

  const occurrences = expandToOccurrences(
    discovery.routes,
    discovery.dynamicInstances,
    discovery.shells,
  );
  const wave1Occurrences = occurrences.filter(isWave1Occurrence);

  const [linkRecords, foundationInventories] = await Promise.all([
    buildLinkInventory({
      repositoryRoot,
      discoveredAt,
      scanSourceFiles: true,
    }),
    buildFoundationInventories(repositoryRoot, discoveredAt),
  ]);
  const navigationRecords = buildNavigationInventory(discoveredAt);
  const stateRecords = buildStateInventory(discoveredAt);
  const journeyRecords = buildJourneyInventory(discoveredAt);
  const foundationAudit = buildFoundationAuditRecords(
    wave1Occurrences,
    foundationInventories.records,
    journeyRecords,
    discovery.shells,
    discoveredAt,
  );

  const messageRecords = foundationInventories.records.filter(
    (record) =>
      record.inventoryKind === "security-privacy-message" ||
      record.inventoryKind === "analytics-consent",
  );
  const errorRecoveryRecords = foundationInventories.records.filter(
    (record) => record.inventoryKind === "error-recovery",
  );
  const offlineRecords = errorRecoveryRecords.filter(
    (record) =>
      record.productSurface === "offline" ||
      record.sourceLocator.toLowerCase().includes("offline"),
  );

  const inventoryGroups: Readonly<Record<string, readonly object[]>> = {
    shells: shellRecords,
    links: linkRecords,
    navigation: navigationRecords,
    messages: messageRecords,
    states: stateRecords,
    "error-recovery": errorRecoveryRecords,
    offline: offlineRecords,
    journeys: journeyRecords,
  };

  const matrixRows = foundationAudit.matrixRows;
  const evidenceRecords = foundationAudit.evidenceRecords;
  const findings = foundationAudit.findings;
  const surfaces = surfacePartitions(matrixRows, evidenceRecords, findings);

  const allInventoryRecords: readonly InventoryRecord[] = [
    ...shellRecords,
    ...linkRecords,
    ...navigationRecords,
    ...messageRecords,
    ...stateRecords,
    ...errorRecoveryRecords,
    ...journeyRecords,
  ];
  const validationGroups: Readonly<Record<string, readonly object[]>> = {
    ...inventoryGroups,
    matrices: matrixRows,
    evidence: evidenceRecords,
    findings,
  };
  for (const [label, records] of Object.entries(validationGroups)) {
    assertValidRecords(records, `wave-1 ${label}`);
  }

  const partitionSpecs: PartitionSpec[] = [];
  for (const [name, records] of Object.entries(inventoryGroups)) {
    partitionSpecs.push({
      id: toPartitionId(`wave-1/inventories/${name}`),
      relativePath: generatedPath(
        runId,
        "inventories",
        `wave-1/${name}.ndjson`,
        config,
      ),
      records,
    });
  }

  for (const surface of surfaces) {
    partitionSpecs.push({
      id: toPartitionId(`wave-1/matrices/${surface}`),
      relativePath: generatedPath(
        runId,
        "matrices",
        `wave-1/${surface}/occurrences.ndjson`,
        config,
      ),
      records: matrixRows.filter((row) => row.productSurface === surface),
    });
    partitionSpecs.push({
      id: toPartitionId(`wave-1/evidence/${surface}`),
      relativePath: generatedPath(
        runId,
        "evidence",
        `wave-1/${surface}/evidence.ndjson`,
        config,
      ),
      records: evidenceRecords.filter(
        (record) => record.productSurface === surface,
      ),
    });
    partitionSpecs.push({
      id: toPartitionId(`wave-1/findings/${surface}`),
      relativePath: generatedPath(
        runId,
        "findings",
        `wave-1/${surface}/findings.ndjson`,
        config,
      ),
      records: findings.filter((finding) => finding.productSurface === surface),
    });
  }

  const writtenPaths: string[] = [];
  const partitionResults: Record<string, PartitionResult> = {};
  for (const spec of partitionSpecs) {
    const resolved = resolveApprovedArtifactPath(
      repositoryRoot,
      spec.relativePath,
      config,
      runId,
    );
    const csvRelative = spec.relativePath.replace(/\.ndjson$/, ".csv");
    const csvResolved = resolveApprovedArtifactPath(
      repositoryRoot,
      csvRelative,
      config,
      runId,
    );
    const result = await writeCanonicalPartition(
      resolved.absolutePath,
      spec.records,
      {
        csvPath: csvResolved.absolutePath,
        redact: true,
        validateRecord: validateAuditRecord,
      },
    );
    partitionResults[spec.id] = {
      path: resolved.relativePath,
      records: result.recordCount,
      contentHash: result.contentHash,
    };
    writtenPaths.push(resolved.relativePath, csvResolved.relativePath);
  }

  const inputFingerprint = computeFingerprint([
    configurationHash,
    immutableRunInputs.repositoryRevision,
    "wave-1-static-batch",
    discovery.discoveredAt,
    String(wave1Occurrences.length),
    String(matrixRows.length),
    String(evidenceRecords.length),
    String(findings.length),
  ]);
  const { store, manifestPath } = await runWave(
    repositoryRoot,
    1,
    config,
    immutableRunInputs,
    {
      entryCriteria: { "Wave 0 closed": true },
      inputFingerprint,
      inventoryGeneration: 1,
      ownedPartitionIds: partitionSpecs.map((spec) => spec.id),
    },
  );

  const writerId = generateWriterId();
  for (const spec of partitionSpecs) {
    const result = partitionResults[spec.id];
    if (!result) continue;
    await store.ensurePartition(spec.id, result.path, inputFingerprint, {
      inventoryGeneration: 1,
    });
    await store.acquireLease(spec.id, writerId, result.path, inputFingerprint);
    await store.markCompleted(
      spec.id,
      writerId,
      result.contentHash,
      result.records,
      inputFingerprint,
    );
    await store.addGeneratedArtifactReference(result.path);
  }
  await store.setChangedPaths([]);

  const completedWave = await completeWave(
    repositoryRoot,
    1,
    config,
    immutableRunInputs,
  );
  const checkpoint = completedWave.store.createWaveCheckpoint(config, 1);

  const pendingOperations = uniquePendingOperations([
    ...pendingFromFoundation(foundationAudit),
    ...linkPendingOperations(
      linkRecords,
      wave1Occurrences.map((occurrence) => occurrence.occurrenceId),
    ),
  ]);
  const totals = resultTotals(findings);
  const findingIdByOccurrence = new Map(
    findings.map((finding) => [finding.occurrenceId, finding.findingId]),
  );
  const matrixFindingBijection =
    matrixRows.length === findings.length &&
    new Set(matrixRows.map((row) => row.occurrenceId)).size ===
      matrixRows.length &&
    new Set(findings.map((finding) => finding.occurrenceId)).size ===
      findings.length &&
    matrixRows.every(
      (row) => row.findingId === findingIdByOccurrence.get(row.occurrenceId),
    );
  const summaryRelative = `${config.artifactPaths.authoredRoot}/decisions/wave-1-static-batch-${runId}.json`;
  const allWrittenPaths = [...writtenPaths, summaryRelative];

  const summary = {
    task: "2.4 — Wave 1 static batch and checkpoint",
    mode: "wave-1-static-batch-complete",
    runId,
    waveId: 1,
    startedAt,
    completedAt: new Date().toISOString(),
    repositoryRevision: immutableRunInputs.repositoryRevision,
    configurationHash,
    profileVersion: wave1Occurrences[0]?.profileVersion ?? "not-observed",
    discovery: {
      routes: discovery.routes.length,
      dynamicInstances: discovery.dynamicInstances.length,
      shells: discovery.shells.length,
      conflicts: discovery.conflicts.length,
      coverageGaps: discovery.coverageGaps.length,
      exclusions: discovery.exclusions.length,
      sourceErrors: foundationInventories.sourceErrors,
    },
    inventories: {
      sourceFilesScanned: foundationInventories.sourceFilesScanned,
      shellRecords: shellRecords.length,
      linkRecords: linkRecords.length,
      navigationRecords: navigationRecords.length,
      messageRecords: messageRecords.length,
      stateRecords: stateRecords.length,
      errorRecoveryRecords: errorRecoveryRecords.length,
      offlineRecords: offlineRecords.length,
      journeyRecords: journeyRecords.length,
      statusTotals: inventoryStatusTotals(allInventoryRecords),
    },
    coverage: {
      totalExpandedOccurrences: occurrences.length,
      wave1Occurrences: wave1Occurrences.length,
      matrixRows: matrixRows.length,
      evidenceRecords: evidenceRecords.length,
      findings: findings.length,
      matrixFindingBijection,
      terminalMatrixRows: matrixRows.filter((row) => row.status !== "pending")
        .length,
      terminalFindings: findings.filter(
        (finding) =>
          finding.resultClassification !== "blocked" ||
          Boolean(finding.blockers?.length),
      ).length,
    },
    resultTotals: {
      conforming: totals.conforming ?? 0,
      nonconforming: totals.nonconforming ?? 0,
      blocked: totals.blocked ?? 0,
      notRun: totals["not-run"] ?? 0,
      notApplicable: totals["not-applicable"] ?? 0,
      requiresOwnerDecision: totals["requires-owner-decision"] ?? 0,
    },
    partitions: partitionSpecs.map((spec) => ({
      id: spec.id,
      path: partitionResults[spec.id]?.path ?? "(not written)",
      records: partitionResults[spec.id]?.records ?? 0,
    })),
    manifestPath,
    checkpoint: {
      status: checkpoint.status,
      entryCriteriaMet: checkpoint.entryCriteriaMet,
      ownedPartitionCount: checkpoint.ownedItemCount,
      terminalPartitionCount: checkpoint.terminalItemCount,
      nonterminalPartitionCount: checkpoint.nonTerminalCount,
      quarantineCount: checkpoint.quarantineCount,
      inventoryGeneration: checkpoint.inventoryGeneration,
    },
    pendingOperations,
    staticLimitations: [
      "No browser, network, authentication, consent delivery, offline transition, reconnect, logging delivery, assistive-technology, performance, hosted, database, test, build, lint, typecheck, or gate operation was executed.",
      "External-link availability, telephone/email handling, fragment scrolling, download response, and rendered navigation remain not-run.",
      "Source-visible authentication, consent, analytics, error, offline, and policy declarations are expectations only; they are not runtime or legal conclusions.",
      "Protected customer, staff, administrator, Planner-member, and Studio-user behavior remains occurrence-specific and is not closed by guest or bypass evidence.",
    ],
    changedPathManifest: {
      writtenPaths: allWrittenPaths,
      siteStarPaths: allWrittenPaths.filter((relativePath) =>
        relativePath.startsWith("site/"),
      ),
      productCodeMutations: 0,
      allPathsInApprovedDestinations: allWrittenPaths.every(
        (relativePath) =>
          relativePath.startsWith("results/site-ui-content-links-audit/") ||
          relativePath.startsWith("agents-work/site-ui-content-links-audit/"),
      ),
    },
    requirements: [
      "3.7-3.9",
      "4.1-4.6",
      "5.1-5.8",
      "6.1-6.7",
      "7.1-7.7",
      "16.1",
      "16.7",
      "17.1-17.3",
      "17.8",
      "18.1-18.7",
      "19.4",
      "20.1-20.8",
      "22.2",
      "22.7-22.9",
      "26.3-26.5",
      "26.10",
    ],
    validation: {
      everyOwnedPartitionTerminal: checkpoint.nonTerminalCount === 0,
      noQuarantinedPartitions: checkpoint.quarantineCount === 0,
      everyMatrixRowTerminal: matrixRows.every(
        (row) => row.status !== "pending",
      ),
      oneFindingPerMatrixRow: matrixFindingBijection,
      noProductCodeWrite: writtenPaths.every(
        (relativePath) => !relativePath.startsWith("site/"),
      ),
      sourceOnlyBatch: true,
    },
  };

  const summaryResolved = resolveApprovedArtifactPath(
    repositoryRoot,
    summaryRelative,
    config,
  );
  await writeJsonFile(summaryResolved.absolutePath, summary);
  await completedWave.store.addAuthoredWorkReference(
    summaryResolved.relativePath,
  );
  writtenPaths.push(summaryResolved.relativePath);

  return {
    ...summary,
    writtenPaths,
  };
}

export const WAVE1_STATIC_BATCH_SCHEMA_VERSION = AUDIT_SCHEMA_VERSION;
