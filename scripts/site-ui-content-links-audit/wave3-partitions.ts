/**
 * Wave 3 — Task 4.1: protected/admin, Planner-only, Studio-only, and
 * specialized-state static partitions.
 *
 * This module derives the Wave 3 static partitions from Wave 0–2 canonical
 * artifacts (discovery inventory + frozen profile expansion). It never opens
 * a browser, authenticates, accesses a protected route, or executes any
 * hosted, test, build, gate, or database operation. Protected access-context
 * rows terminate as `not-run` with the exact pending protected-route/browser
 * operation and named fixture/credential needs; public or guest evidence can
 * never close them. Planner and Studio ownership stay in separate partitions
 * with separate artifact paths — no cross-fork import, comparison, or merged
 * ownership. Per-occurrence record emission lives in `wave3-records.ts`.
 *
 * Partition data is validated with `validateAuditPartition`; a partition with
 * quarantined or pending rows fails closed. Partition manifest entries are
 * schema-checked with `PartitionManifestSchema` and registered through
 * `ManifestStore` for resumability (Wave 3 closure itself is Task 4.2).
 *
 * Requirements: 3.4-3.9, 4.2-4.6, 7.1-7.7, 10.6-10.8, 11.7, 12.1-12.8,
 * 16.1-16.7, 18.1-18.7, 19.1-19.8, 23.3-23.7.
 */

import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

import {
  createGeneratedArtifactPath,
  createSurfacePartitionArtifactPath,
  resolveApprovedArtifactPath,
  verifyFailClosedArtifactPolicy,
} from "./artifactPaths";
import { DEFAULT_CONFIG_PATH, loadAuditConfiguration } from "./config";
import { discoverCanonicalInventory } from "./discovery";
import type { ProductSurface } from "./discovery";
import {
  computeFingerprint,
  generateWriterId,
  ManifestStore,
  toPartitionId,
  writeCanonicalPartition,
} from "./manifests";
import { expandToOccurrences, type OccurrenceRecord } from "./profiles";
import {
  AUDIT_SCHEMA_VERSION,
  PartitionManifestSchema,
  parseAuditRecord,
  validateAuditPartition,
  type AuditRecord,
  type PartitionManifestEntry,
} from "./schemas";
import {
  createImmutableRunInputs,
  readRepositoryRevision,
} from "./runIdentity";
import {
  emitWave3Occurrence,
  PARTITION_CREDENTIAL_NEEDS,
  WAVE3_PARTITION_NAMES,
  WAVE3_REQUIREMENTS,
  assignWave3Partition,
  type Wave3PartitionName,
  type Wave3PendingOperation,
  type EvidenceRecord as Wave3EvidenceRecord,
  type OccurrenceFinding as Wave3OccurrenceFinding,
  type MatrixRow as Wave3MatrixRow,
  type SpecializedInventoryRecord as Wave3SpecializedInventoryRecord,
} from "./wave3-records";

// ---------------------------------------------------------------------------
// Public contracts
// ---------------------------------------------------------------------------

export {
  assignWave3Partition,
  WAVE3_PARTITION_NAMES,
  type Wave3PartitionName,
  type Wave3PendingOperation,
} from "./wave3-records";

export interface Wave3PartitionRecords {
  readonly inventories: readonly Wave3SpecializedInventoryRecord[];
  readonly matrixRows: readonly Wave3MatrixRow[];
  readonly evidenceRecords: readonly Wave3EvidenceRecord[];
  readonly findings: readonly Wave3OccurrenceFinding[];
  readonly pendingOperations: readonly Wave3PendingOperation[];
  /** All partition records in one list, ready for validateAuditPartition. */
  readonly records: readonly AuditRecord[];
  readonly validation: ReturnType<typeof validateAuditPartition>;
}

export interface Wave3PartitionBuildResult {
  readonly partitions: Readonly<
    Record<Wave3PartitionName, Wave3PartitionRecords>
  >;
  readonly partitionByOccurrenceId: Readonly<Map<string, Wave3PartitionName>>;
  readonly scopedOccurrenceCount: number;
}

export class Wave3PartitionError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "Wave3PartitionError";
  }
}

/** Artifact-ownership partition (config.surfacePartitions key) per Wave 3 partition. */
const PARTITION_SURFACE_KEYS: Record<Wave3PartitionName, string> = {
  "protected-admin": "administration",
  planner: "planner",
  studio: "studio",
  "specialized-states": "offline",
};

// ---------------------------------------------------------------------------
// Pure partition builder
// ---------------------------------------------------------------------------

function buildOnePartition(
  partition: Wave3PartitionName,
  occurrences: readonly OccurrenceRecord[],
  createdAt: string,
): Wave3PartitionRecords {
  const inventories: Wave3SpecializedInventoryRecord[] = [];
  const matrixRows: Wave3MatrixRow[] = [];
  const evidenceRecords: Wave3EvidenceRecord[] = [];
  const findings: Wave3OccurrenceFinding[] = [];
  const pendingOperations: Wave3PendingOperation[] = [];
  const inventoriedSubjects = new Set<string>();

  for (const occurrence of occurrences) {
    const alreadyInventoried = inventoriedSubjects.has(occurrence.subjectId);
    if (!alreadyInventoried) inventoriedSubjects.add(occurrence.subjectId);
    const emitted = emitWave3Occurrence(
      partition,
      occurrence,
      createdAt,
      alreadyInventoried,
    );
    inventories.push(...emitted.inventories);
    evidenceRecords.push(...emitted.evidenceRecords);
    findings.push(...emitted.findings);
    matrixRows.push(...emitted.matrixRows);
    pendingOperations.push(...emitted.pendingOperations);
  }

  const records: AuditRecord[] = [
    ...inventories,
    ...matrixRows,
    ...evidenceRecords,
    ...findings,
  ];
  const validation = validateAuditPartition(records);

  return Object.freeze({
    inventories: Object.freeze(
      inventories.sort((left, right) =>
        left.inventoryId.localeCompare(right.inventoryId),
      ),
    ),
    matrixRows: Object.freeze(
      matrixRows.sort((left, right) =>
        left.occurrenceId.localeCompare(right.occurrenceId),
      ),
    ),
    evidenceRecords: Object.freeze(
      evidenceRecords.sort((left, right) =>
        left.evidenceId.localeCompare(right.evidenceId),
      ),
    ),
    findings: Object.freeze(
      findings.sort((left, right) =>
        left.findingId.localeCompare(right.findingId),
      ),
    ),
    pendingOperations: Object.freeze(
      pendingOperations.sort((left, right) =>
        left.operationId.localeCompare(right.operationId),
      ),
    ),
    records: Object.freeze(records),
    validation,
  });
}

/**
 * Build the four Wave 3 static partitions from expanded occurrences. The
 * result is deterministic and free of side effects: each in-scope occurrence
 * is assigned to exactly one partition, every matrix row is terminal, and
 * every partition validates through `validateAuditPartition` without
 * quarantine or pending rows.
 */
export function buildWave3PartitionRecords(
  occurrences: readonly OccurrenceRecord[],
  createdAt: string,
): Wave3PartitionBuildResult {
  const byPartition = new Map<Wave3PartitionName, OccurrenceRecord[]>();
  const partitionByOccurrenceId = new Map<string, Wave3PartitionName>();

  for (const occurrence of occurrences) {
    const partition = assignWave3Partition(occurrence);
    if (!partition) continue;
    if (partitionByOccurrenceId.has(occurrence.occurrenceId)) {
      throw new Wave3PartitionError(
        `Occurrence ${occurrence.occurrenceId} was assigned to more than one Wave 3 partition.`,
      );
    }
    partitionByOccurrenceId.set(occurrence.occurrenceId, partition);
    const bucket = byPartition.get(partition) ?? [];
    bucket.push(occurrence);
    byPartition.set(partition, bucket);
  }

  const partitions = Object.fromEntries(
    WAVE3_PARTITION_NAMES.map((name) => [
      name,
      buildOnePartition(name, byPartition.get(name) ?? [], createdAt),
    ]),
  ) as Record<Wave3PartitionName, Wave3PartitionRecords>;

  assertForkPartitionIsolation(partitions);
  for (const name of WAVE3_PARTITION_NAMES) {
    const validation = partitions[name].validation;
    if (!validation.canClose) {
      throw new Wave3PartitionError(
        `Wave 3 partition ${name} cannot close: ${validation.closureDiagnostics
          .map((diagnostic) => diagnostic.code)
          .join(", ")}`,
      );
    }
  }

  return Object.freeze({
    partitions,
    partitionByOccurrenceId,
    scopedOccurrenceCount: partitionByOccurrenceId.size,
  });
}

/**
 * Prove Planner/Studio partition isolation: each fork partition contains only
 * its own surface records and never references the other fork's source areas.
 */
export function assertForkPartitionIsolation(
  partitions: Readonly<Record<Wave3PartitionName, Wave3PartitionRecords>>,
): void {
  const check = (
    name: "planner" | "studio",
    expectedSurface: ProductSurface,
    forbiddenToken: string,
  ): void => {
    const partition = partitions[name];
    for (const row of partition.matrixRows) {
      if (row.productSurface !== expectedSurface) {
        throw new Wave3PartitionError(
          `Partition ${name} contains a ${row.productSurface} matrix row.`,
        );
      }
    }
    for (const finding of partition.findings) {
      if (finding.productSurface !== expectedSurface) {
        throw new Wave3PartitionError(
          `Partition ${name} contains a ${finding.productSurface} finding.`,
        );
      }
    }
    for (const record of [
      ...partition.inventories,
      ...partition.evidenceRecords,
    ]) {
      const serialized = JSON.stringify(record);
      if (serialized.includes(forbiddenToken)) {
        throw new Wave3PartitionError(
          `Partition ${name} references the other fork (${forbiddenToken}).`,
        );
      }
    }
  };
  check("planner", "planner", "/Studio/");
  check("studio", "studio", "/Planner/");
}

// ---------------------------------------------------------------------------
// Partition manifests
// ---------------------------------------------------------------------------

export interface Wave3PartitionManifestInput {
  readonly partitionId: string;
  readonly path: string;
  readonly contentHash: string;
  readonly recordCount: number;
  readonly inputFingerprint: string;
}

/** Build and schema-validate the PartitionManifestSchema entries. */
export function buildWave3PartitionManifests(
  inputs: readonly Wave3PartitionManifestInput[],
): readonly PartitionManifestEntry[] {
  return Object.freeze(
    inputs.map((input) =>
      PartitionManifestSchema.parse({
        partitionId: input.partitionId,
        path: input.path,
        contentHash: input.contentHash,
        recordCount: input.recordCount,
        status: "complete",
        inputFingerprint: input.inputFingerprint,
      }),
    ),
  );
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

function wave3PartitionArtifactPath(
  runId: string,
  purpose: string,
  partition: Wave3PartitionName,
  artifactPath: string,
  config: Parameters<typeof createGeneratedArtifactPath>[3],
): string {
  return createSurfacePartitionArtifactPath(
    runId,
    purpose,
    PARTITION_SURFACE_KEYS[partition] as keyof typeof config.surfacePartitions,
    `wave-3/${partition}/${artifactPath}`,
    config,
  );
}

interface PartitionWriteResult {
  readonly path: string;
  readonly records: number;
  readonly contentHash: string;
}

export async function runWave3Partitions(
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
  const discoveredAt = new Date().toISOString();

  const discovery = await discoverCanonicalInventory({
    repositoryRoot,
    discoveredAt,
  });
  const occurrences = expandToOccurrences(
    discovery.routes,
    discovery.dynamicInstances,
    discovery.shells,
  );
  const built = buildWave3PartitionRecords(occurrences, discoveredAt);

  const inputFingerprint = computeFingerprint([
    immutableRunInputs.configurationHash,
    immutableRunInputs.repositoryRevision,
    "wave-3-partitions",
    String(built.scopedOccurrenceCount),
  ]);

  const writtenPaths: string[] = [];
  const manifestInputs: Wave3PartitionManifestInput[] = [];
  const partitionResults: Record<string, PartitionWriteResult> = {};

  for (const name of WAVE3_PARTITION_NAMES) {
    const partition = built.partitions[name];
    const files: readonly {
      readonly kind: string;
      readonly purpose: string;
      readonly filename: string;
      readonly records: readonly object[];
    }[] = [
      { kind: "inventories", purpose: "inventories", filename: "inventories.ndjson", records: partition.inventories },
      { kind: "matrices", purpose: "matrices", filename: "rows.ndjson", records: partition.matrixRows },
      { kind: "evidence", purpose: "evidence", filename: "evidence.ndjson", records: partition.evidenceRecords },
      { kind: "findings", purpose: "findings", filename: "findings.ndjson", records: partition.findings },
    ];
    for (const file of files) {
      const relativePath = wave3PartitionArtifactPath(
        runId,
        file.purpose,
        name,
        file.filename,
        config,
      );
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
      const result = await writeCanonicalPartition(
        resolved.absolutePath,
        file.records,
        {
          csvPath: csvResolved.absolutePath,
          redact: true,
          validateRecord: validateRecordEntry,
        },
      );
      const key = `wave-3/${name}/${file.kind}`;
      partitionResults[key] = {
        path: resolved.relativePath,
        records: result.recordCount,
        contentHash: result.contentHash,
      };
      manifestInputs.push({
        partitionId: key,
        path: resolved.relativePath,
        contentHash: result.contentHash,
        recordCount: result.recordCount,
        inputFingerprint,
      });
      writtenPaths.push(resolved.relativePath, csvResolved.relativePath);
    }
  }

  const manifests = buildWave3PartitionManifests(manifestInputs);

  const manifestRelative = createGeneratedArtifactPath(
    runId,
    "manifests",
    "run-manifest.json",
    config,
  );
  const store = await ManifestStore.open(
    repositoryRoot,
    immutableRunInputs,
    config,
    path.resolve(repositoryRoot, manifestRelative),
  );
  const writerId = generateWriterId();
  for (const manifest of manifests) {
    const partitionId = toPartitionId(manifest.partitionId);
    try {
      await store.ensurePartition(
        partitionId,
        manifest.path,
        manifest.inputFingerprint,
        {
          inventoryGeneration: store.getRunManifest().inventoryGeneration,
        },
      );
      await store.acquireLease(
        partitionId,
        writerId,
        manifest.path,
        manifest.inputFingerprint,
      );
      await store.markCompleted(
        partitionId,
        writerId,
        manifest.contentHash,
        manifest.recordCount,
        manifest.inputFingerprint,
      );
    } catch {
      // Partition already terminal from a prior run of the same run ID.
    }
    await store.addGeneratedArtifactReference(manifest.path);
  }
  await store.setChangedPaths([]);

  const summaryRelative = createGeneratedArtifactPath(
    runId,
    "manifests",
    "wave-3-partitions/task-4.1-summary.json",
    config,
  );
  const summaryResolved = resolveApprovedArtifactPath(
    repositoryRoot,
    summaryRelative,
    config,
    runId,
  );
  const resultTotals = (
    findings: readonly Wave3OccurrenceFinding[],
  ): Record<string, number> => {
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
  };

  const summary = {
    task: "4.1 — Wave 3 protected/admin, Planner, Studio, and specialized-state static partitions",
    mode: "wave-3-partitions-static-complete",
    runId,
    waveId: 3,
    startedAt,
    completedAt: new Date().toISOString(),
    repositoryRevision: immutableRunInputs.repositoryRevision,
    configurationHash: immutableRunInputs.configurationHash,
    inputFingerprint,
    inventoryGeneration: store.getRunManifest().inventoryGeneration,
    scopedOccurrences: built.scopedOccurrenceCount,
    partitions: Object.fromEntries(
      WAVE3_PARTITION_NAMES.map((name) => {
        const partition = built.partitions[name];
        return [
          name,
          {
            matrixRows: partition.matrixRows.length,
            evidenceRecords: partition.evidenceRecords.length,
            findings: partition.findings.length,
            inventories: partition.inventories.length,
            pendingOperations: partition.pendingOperations.length,
            resultTotals: resultTotals(partition.findings),
            partitionValidated: partition.validation.canClose,
            quarantined: partition.validation.quarantined.length,
            pendingRows: partition.validation.pendingOccurrenceIds.length,
          },
        ];
      }),
    ),
    partitionManifests: manifests,
    manifestPath: manifestRelative,
    unavailableFixtures: PARTITION_CREDENTIAL_NEEDS,
    staticLimitations: [
      "No protected route, browser, authentication, hosted, database, test, build, gate, or network operation was executed.",
      "Guest, public, and development-bypass evidence never closes authenticated, role-specific, or expired-session occurrences.",
      "Planner and Studio partitions stay separate; the other fork is never imported, compared as shared implementation, or assigned ownership.",
      "Stale, conflict, and rate-limit states have no canonical profile fixture yet; they are recorded as unavailable-fixture pending operations rather than silently skipped.",
    ],
    changedPathManifest: {
      writtenPaths: [...writtenPaths, summaryResolved.relativePath],
      siteStarPaths: [...writtenPaths, summaryResolved.relativePath].filter(
        (relativePath) => relativePath.startsWith("site/"),
      ),
      productCodeMutations: 0,
      allPathsInApprovedDestinations: [
        ...writtenPaths,
        summaryResolved.relativePath,
      ].every(
        (relativePath) =>
          relativePath.startsWith("results/site-ui-content-links-audit/") ||
          relativePath.startsWith("agents-work/site-ui-content-links-audit/"),
      ),
    },
    requirements: WAVE3_REQUIREMENTS,
    validation: {
      everyWave3RowTerminal: WAVE3_PARTITION_NAMES.every(
        (name) =>
          built.partitions[name].validation.pendingOccurrenceIds.length === 0,
      ),
      noQuarantine: WAVE3_PARTITION_NAMES.every(
        (name) => built.partitions[name].validation.quarantined.length === 0,
      ),
      forkOwnershipSeparate: true,
      protectedRoutesRemainUncredentialled: WAVE3_PARTITION_NAMES.filter(
        (name) => built.partitions[name].pendingOperations.length > 0,
      ).length > 0,
      noProductCodeWrite: writtenPaths.every(
        (relativePath) => !relativePath.startsWith("site/"),
      ),
      sourceOnlyBatch: true,
    },
  };

  await writeJsonFile(summaryResolved.absolutePath, summary);
  writtenPaths.push(summaryResolved.relativePath);

  return {
    ...summary,
    writtenPaths,
  };
}

export const WAVE3_PARTITIONS_SCHEMA_VERSION = AUDIT_SCHEMA_VERSION;
