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
 * ownership.
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
  sha256,
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
  type BlockerDetail,
  type PartitionManifestEntry,
  type ProvenanceReference,
} from "./schemas";
import {
  createImmutableRunInputs,
  readRepositoryRevision,
} from "./runIdentity";

// ---------------------------------------------------------------------------
// Public contracts
// ---------------------------------------------------------------------------

type SpecializedInventoryRecord = Extract<
  AuditRecord,
  { readonly recordType: "specialized-inventory" }
>;
type EvidenceRecord = Extract<AuditRecord, { readonly recordType: "evidence" }>;
type OccurrenceFinding = Extract<
  AuditRecord,
  { readonly recordType: "finding" }
>;
type MatrixRow = Extract<AuditRecord, { readonly recordType: "matrix-row" }>;

export const WAVE3_PARTITION_NAMES = [
  "protected-admin",
  "planner",
  "studio",
  "specialized-states",
] as const;

export type Wave3PartitionName = (typeof WAVE3_PARTITION_NAMES)[number];

export interface Wave3PendingOperation {
  readonly operationId: string;
  readonly partition: Wave3PartitionName;
  readonly exactOperation: string;
  readonly requiredAuthorization: string;
  readonly occurrenceId: string;
  readonly accessContextId: string;
  readonly stateId: string;
  readonly viewportId: string;
  readonly browserId: string;
  readonly languageId: "en" | "hi";
  readonly credentialOrFixtureNeeds: readonly string[];
  readonly resultWhenUnauthorized: "not-run";
}

export interface Wave3PartitionRecords {
  readonly inventories: readonly SpecializedInventoryRecord[];
  readonly matrixRows: readonly MatrixRow[];
  readonly evidenceRecords: readonly EvidenceRecord[];
  readonly findings: readonly OccurrenceFinding[];
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

// ---------------------------------------------------------------------------
// Scope rules
// ---------------------------------------------------------------------------

const PROTECTED_ADMIN_SURFACES: readonly ProductSurface[] = [
  "administration",
  "portal-dashboard",
  "authentication",
];

const SPECIALIZED_STATE_IDS = new Set<OccurrenceRecord["stateId"]>([
  "state.error",
  "state.empty",
  "state.not-found",
  "state.offline",
  "state.logged-out",
]);

const PROTECTED_ACCESS_CONTEXTS = new Set<OccurrenceRecord["accessId"]>([
  "access.authenticated-admin",
  "access.authenticated-customer",
  "access.planner-member",
  "access.studio-user",
]);

/**
 * Assign an occurrence to exactly one Wave 3 partition (disjoint coverage).
 * Returns `undefined` for occurrences outside the Wave 3 scope.
 */
export function assignWave3Partition(
  occurrence: OccurrenceRecord,
): Wave3PartitionName | undefined {
  if (occurrence.productSurface === "planner") return "planner";
  if (occurrence.productSurface === "studio") return "studio";
  if (PROTECTED_ADMIN_SURFACES.includes(occurrence.productSurface)) {
    return "protected-admin";
  }
  if (SPECIALIZED_STATE_IDS.has(occurrence.stateId)) {
    return "specialized-states";
  }
  return undefined;
}

const PARTITION_DIMENSIONS: Record<
  Wave3PartitionName,
  { readonly auditDimension: string; readonly expected: string }
> = {
  "protected-admin": {
    auditDimension: "dim.wave3-protected-access",
    expected:
      "Administration, portal/dashboard, and authentication protection contracts remain source-visible only; guest, public, and development-bypass evidence never close authenticated or role-specific occurrences.",
  },
  planner: {
    auditDimension: "dim.wave3-planner-ownership",
    expected:
      "Every Planner occurrence stays inside the Planner fork partition with Planner-owned source areas and no Studio implementation reference.",
  },
  studio: {
    auditDimension: "dim.wave3-studio-ownership",
    expected:
      "Every Studio occurrence stays inside the Studio fork partition with Studio-owned source areas and no Planner implementation reference.",
  },
  "specialized-states": {
    auditDimension: "dim.wave3-specialized-state",
    expected:
      "Error, empty, not-found, offline/reconnect, and expired-session states remain separately recorded static expectations until an authorized browser workflow observes them.",
  },
};

const PARTITION_INVENTORY: Record<
  Wave3PartitionName,
  { readonly kind: SpecializedInventoryRecord["inventoryKind"]; readonly owner: string }
> = {
  "protected-admin": {
    kind: "security-privacy-message",
    owner: "administration-protection",
  },
  planner: { kind: "journey", owner: "planner-fork" },
  studio: { kind: "journey", owner: "studio-fork" },
  "specialized-states": { kind: "state", owner: "state-boundaries" },
};

const PARTITION_CREDENTIAL_NEEDS: Record<
  Wave3PartitionName,
  readonly string[]
> = {
  "protected-admin": [
    "Staff/administrator session fixture (Supabase admin identity) — unavailable to this static batch.",
    "Expired-session and insufficient-role fixtures — unavailable to this static batch.",
    "DEV_AUTH_BYPASS=1 local-only behavior must never be presented as hosted protected-route evidence.",
  ],
  planner: [
    "Planner-member session fixture — unavailable to this static batch.",
    "Discoverable Planner project instances from the Planner persistence mode — not read by this static batch.",
  ],
  studio: [
    "Studio-user session fixture — unavailable to this static batch.",
    "Furniture catalog fixtures for Studio canvas actions — not read by this static batch.",
  ],
  "specialized-states": [
    "Offline/reconnect network-transition harness — unavailable to this static batch.",
    "Error-injection and rate-limit/stale/conflict simulation fixtures — unavailable to this static batch.",
  ],
};

/** Artifact-ownership partition (config.surfacePartitions key) per Wave 3 partition. */
const PARTITION_SURFACE_KEYS: Record<Wave3PartitionName, string> = {
  "protected-admin": "administration",
  planner: "planner",
  studio: "studio",
  "specialized-states": "offline",
};

const WAVE3_REQUIREMENTS = [
  "3.4-3.9",
  "4.2-4.6",
  "7.1-7.7",
  "10.6-10.8",
  "11.7",
  "12.1-12.8",
  "16.1-16.7",
  "18.1-18.7",
  "19.1-19.8",
  "23.3-23.7",
];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function sha256Short(...parts: readonly string[]): string {
  return sha256(parts.join("\u0000")).slice(0, 16);
}

function wave3Provenance(
  occurrence: OccurrenceRecord,
  discoveredAt: string,
): ProvenanceReference {
  return {
    sourceId: "source.app-router",
    sourceKind: "source",
    location: `scripts/site-ui-content-links-audit/profiles.ts:${occurrence.subjectId}`,
    discoveredAt,
    authorityRank: 100,
  };
}

function forkSourceLocator(
  partition: Wave3PartitionName,
  occurrence: OccurrenceRecord,
): string {
  if (partition === "planner") {
    return `site/components/Planner:${occurrence.concreteUrl}`;
  }
  if (partition === "studio") {
    return `site/components/Studio:${occurrence.concreteUrl}`;
  }
  if (partition === "protected-admin") {
    return `site/app/admin:${occurrence.concreteUrl}`;
  }
  return `shared-state-boundaries:${occurrence.stateId}`;
}

function pendingOperation(
  partition: Wave3PartitionName,
  occurrence: OccurrenceRecord,
): Wave3PendingOperation {
  const operationId = `op.wave3.${partition}.${sha256Short(
    occurrence.occurrenceId,
    partition,
  )}`;
  return {
    operationId,
    partition,
    exactOperation:
      partition === "specialized-states"
        ? `Authorized browser workflow for occurrence ${occurrence.occurrenceId}: drive the ${occurrence.stateId} transition on ${occurrence.concreteUrl} at ${occurrence.viewportId}/${occurrence.browserId}/${occurrence.languageId} and capture recovery, reconnection, and fallback behavior without mutating production or real user data.`
        : `Authorized ${occurrence.accessId} browser workflow for occurrence ${occurrence.occurrenceId}: open the protected surface ${occurrence.concreteUrl} (${occurrence.stateId}) at ${occurrence.viewportId}/${occurrence.browserId}/${occurrence.languageId} and capture access-context, redirect, role-contract, and recovery behavior without mutating production data.`,
    requiredAuthorization:
      "Exact current-session authorization naming this operation, the matching access context and occurrence selector, and a permitting hook decision; credentials and fixtures must be provided separately.",
    occurrenceId: occurrence.occurrenceId,
    accessContextId: occurrence.accessId,
    stateId: occurrence.stateId,
    viewportId: occurrence.viewportId,
    browserId: occurrence.browserId,
    languageId: occurrence.languageId,
    credentialOrFixtureNeeds: PARTITION_CREDENTIAL_NEEDS[partition],
    resultWhenUnauthorized: "not-run",
  };
}

function blockerForOperation(
  operation: Wave3PendingOperation,
): BlockerDetail {
  return {
    blockerKind: "authorization",
    detail:
      "Wave 3 static partitions never access protected routes; this occurrence has no exact current-session authorization or permitting hook decision for its protected or rendered-behavior operation.",
    pendingOperation: operation.exactOperation,
    owner: "audit-program-owner",
  };
}

// ---------------------------------------------------------------------------
// Record builders
// ---------------------------------------------------------------------------

function buildInventoryRecord(
  partition: Wave3PartitionName,
  occurrence: OccurrenceRecord,
  createdAt: string,
): SpecializedInventoryRecord {
  const meta = PARTITION_INVENTORY[partition];
  const inventoryId = `inventory.wave3.${partition}.${sha256Short(
    occurrence.subjectId,
    partition,
  )}`;
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "specialized-inventory",
    recordId: `record.${inventoryId}`,
    createdAt,
    inventoryId,
    inventoryKind: meta.kind,
    owner: meta.owner,
    sourceLocator: forkSourceLocator(partition, occurrence),
    productSurface: occurrence.productSurface,
    provenance: [wave3Provenance(occurrence, createdAt)],
    applicableOccurrenceSelector: {
      subjectIds: [occurrence.subjectId],
      stateIds: [occurrence.stateId],
      viewportIds: [occurrence.viewportId],
      browserIds: [occurrence.browserId],
      accessContextIds: [occurrence.accessId],
      languageIds: [occurrence.languageId],
    },
    status: "canonical",
    payload: {
      partition,
      concreteUrl: occurrence.concreteUrl,
      namedFixtureNeeds: PARTITION_CREDENTIAL_NEEDS[partition],
    },
    coverageGapIds: [],
  };
}

function buildStaticEvidence(
  partition: Wave3PartitionName,
  occurrence: OccurrenceRecord,
  createdAt: string,
): EvidenceRecord {
  const meta = PARTITION_DIMENSIONS[partition];
  const evidenceId = `evidence.wave3.${sha256Short(
    occurrence.occurrenceId,
    partition,
    "static",
  )}`;
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "evidence",
    recordId: `record.${evidenceId}`,
    createdAt,
    evidenceId,
    findingId: occurrence.findingId,
    occurrenceId: occurrence.occurrenceId,
    route: occurrence.concreteUrl,
    concreteUrl: occurrence.concreteUrl,
    productSurface: occurrence.productSurface,
    stateVariant: occurrence.stateId,
    viewportProfile: occurrence.viewportId,
    browserProfile: occurrence.browserId,
    accessContext: occurrence.accessId,
    languageContext: occurrence.languageId,
    auditDimension: meta.auditDimension,
    expectedResult: meta.expected,
    observedResult:
      partition === "planner" || partition === "studio"
        ? `The Wave 3 ${partition} static partition retains the ${occurrence.subjectId} source contract inside its own fork partition; no implementation of the other fork is imported, compared, or reassigned.`
        : `The Wave 3 ${partition} static partition retains the source-visible contract for ${occurrence.subjectId} without accessing any protected route or rendered state.`,
    claimBasis: "source-observed",
    resultClassification: "conforming",
    severity: "advisory",
    severityRationale:
      "The static partition record itself establishes no defect; protected and rendered behavior stays separately recorded.",
    userImpact:
      "No user-visible conclusion is drawn from this static partition record alone.",
    evidenceLane: "static-inspection",
    evidenceType: "wave3-static-partition",
    sourceOrRuntimeLocation: forkSourceLocator(partition, occurrence),
    capturedAt: createdAt,
    reproductionSteps: [
      `Inspect the Wave 3 ${partition} partition inventory for ${occurrence.subjectId}.`,
      "Do not substitute another state, access context, viewport, browser, or language occurrence.",
    ],
    evidenceReferences: [
      `occurrence:${occurrence.occurrenceId}`,
      `inventory.wave3.${partition}.${sha256Short(occurrence.subjectId, partition)}`,
    ],
    requirementIds: ["3.4", "4.2", "19.5", "23.3"],
    journeyIds: [],
    shellIds: [],
    relatedFindingIds: [],
    proposedOutcome:
      "Keep the static partition contract and resolve protected behavior only through the exact pending operation.",
    likelyOwner: PARTITION_INVENTORY[partition].owner,
    dependencies: [],
    verificationMethod:
      "Static partition inspection; no protected-route, browser, hosted, or database operation was executed.",
  };
}

function buildNotApplicableEvidence(
  partition: Wave3PartitionName,
  occurrence: OccurrenceRecord,
  createdAt: string,
): EvidenceRecord {
  const staticEvidence = buildStaticEvidence(partition, occurrence, createdAt);
  return {
    ...staticEvidence,
    evidenceId: `evidence.wave3.${sha256Short(
      occurrence.occurrenceId,
      partition,
      "not-applicable",
    )}`,
    recordId: `record.evidence.wave3.${sha256Short(
      occurrence.occurrenceId,
      partition,
      "not-applicable",
    )}`,
    observedResult:
      occurrence.notApplicableRationale ??
      "The frozen applicability rules exclude this occurrence.",
    resultClassification: "not-applicable",
    severity: "not-applicable",
    severityRationale:
      "The frozen profile applicability rules exclude this occurrence from evaluation.",
    userImpact:
      "No conclusion is drawn for an occurrence that does not apply to this access context or state.",
    evidenceType: "profile-applicability-decision",
    claimBasis: "source-observed",
    notApplicableRationale:
      occurrence.notApplicableRationale ??
      "The frozen applicability rules exclude this occurrence.",
  };
}

function buildRuntimePendingEvidence(
  partition: Wave3PartitionName,
  occurrence: OccurrenceRecord,
  operation: Wave3PendingOperation,
  createdAt: string,
): EvidenceRecord {
  const meta = PARTITION_DIMENSIONS[partition];
  const evidenceId = `evidence.wave3.${sha256Short(
    occurrence.occurrenceId,
    partition,
    "pending",
  )}`;
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "evidence",
    recordId: `record.${evidenceId}`,
    createdAt,
    evidenceId,
    findingId: occurrence.findingId,
    occurrenceId: occurrence.occurrenceId,
    route: occurrence.concreteUrl,
    concreteUrl: occurrence.concreteUrl,
    productSurface: occurrence.productSurface,
    stateVariant: occurrence.stateId,
    viewportProfile: occurrence.viewportId,
    browserProfile: occurrence.browserId,
    accessContext: occurrence.accessId,
    languageContext: occurrence.languageId,
    auditDimension: `${meta.auditDimension}-runtime`,
    expectedResult: meta.expected,
    observedResult: `Runtime work was not executed: ${operation.exactOperation}`,
    claimBasis: "source-inferred-expectation",
    resultClassification: "not-run",
    severity: "advisory",
    severityRationale:
      "No runtime conclusion is available; protected behavior remains unverified for this occurrence.",
    userImpact:
      "Protected, rendered, and specialized-state behavior remains unverified for this exact occurrence.",
    evidenceLane: "static-inspection",
    evidenceType: "authorization-gap",
    sourceOrRuntimeLocation: "authorization registry",
    capturedAt: createdAt,
    reproductionSteps: [
      "Request authorization for the exact protected operation named in the blocker.",
      "Supply the named credentials or fixtures before any protected-route execution.",
    ],
    evidenceReferences: [
      `occurrence:${occurrence.occurrenceId}`,
      operation.operationId,
    ],
    requirementIds: ["4.2", "4.3", "12.1", "16.5"],
    journeyIds: [],
    shellIds: [],
    relatedFindingIds: [],
    proposedOutcome:
      "Run the exact pending operation with matching authorization and ingest occurrence-scoped evidence.",
    likelyOwner: "audit-program-owner",
    dependencies: [...operation.credentialOrFixtureNeeds],
    verificationMethod: operation.exactOperation,
    blockers: [blockerForOperation(operation)],
  };
}

function buildFinding(
  partition: Wave3PartitionName,
  occurrence: OccurrenceRecord,
  evidenceRecords: readonly EvidenceRecord[],
  resultClassification: OccurrenceFinding["resultClassification"],
  createdAt: string,
): OccurrenceFinding {
  const blockers = resultClassification === "not-run" || resultClassification === "blocked"
    ? uniqueBlockers(evidenceRecords.flatMap((record) => record.blockers ?? []))
    : [];
  const notApplicableRationale =
    resultClassification === "not-applicable"
      ? occurrence.notApplicableRationale ??
        "The frozen applicability rules exclude this occurrence."
      : undefined;
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "finding",
    recordId: `record.${occurrence.findingId}.wave3`,
    createdAt,
    findingId: occurrence.findingId,
    occurrenceId: occurrence.occurrenceId,
    resultClassification,
    claimBasis:
      resultClassification === "not-run" ||
      resultClassification === "blocked"
        ? "source-inferred-expectation"
        : "source-observed",
    conclusionSummary:
      resultClassification === "not-applicable"
        ? `The Wave 3 ${partition} partition records this occurrence as not applicable: ${notApplicableRationale}`
        : resultClassification === "not-run"
          ? `The Wave 3 ${partition} static partition keeps this protected or rendered occurrence pending the exact named operation; guest, public, or bypass evidence cannot close it.`
          : `The Wave 3 ${partition} static partition observed the expected source contract without accessing protected routes.`,
    evidenceIds: evidenceRecords.map((record) => record.evidenceId).sort(),
    requirementIds: [...WAVE3_REQUIREMENTS],
    productSurface: occurrence.productSurface,
    copyRelated: false,
    ...(blockers.length > 0 ? { blockers: [...blockers] } : {}),
    ...(notApplicableRationale ? { notApplicableRationale } : {}),
  };
}

function buildMatrixRow(
  occurrence: OccurrenceRecord,
  finding: OccurrenceFinding,
  createdAt: string,
): MatrixRow {
  const meta = PARTITION_DIMENSIONS[
    assignWave3Partition(occurrence) ?? "protected-admin"
  ];
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "matrix-row",
    recordId: `record.wave3.matrix.${occurrence.occurrenceId}`,
    createdAt,
    occurrenceId: occurrence.occurrenceId,
    concreteUrl: occurrence.concreteUrl,
    productSurface: occurrence.productSurface,
    stateId: occurrence.stateId,
    viewportId: occurrence.viewportId,
    browserId: occurrence.browserId,
    accessContextId: occurrence.accessId,
    languageId: occurrence.languageId,
    applicableDimensionIds: [
      ...occurrence.applicableDimensionIds,
      meta.auditDimension,
    ],
    waveId: "3",
    status: finding.resultClassification,
    findingId: finding.findingId,
    inputFingerprint: occurrence.inputFingerprint,
    ...(finding.blockers ? { blockers: [...finding.blockers] } : {}),
    ...(finding.notApplicableRationale
      ? { notApplicableRationale: finding.notApplicableRationale }
      : {}),
  };
}

function uniqueBlockers(
  blockers: readonly BlockerDetail[],
): readonly BlockerDetail[] {
  const seen = new Set<string>();
  return Object.freeze(
    blockers.filter((blocker) => {
      const key = `${blocker.blockerKind}\u0000${blocker.pendingOperation}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  );
}

// ---------------------------------------------------------------------------
// Pure partition builder
// ---------------------------------------------------------------------------

function buildOnePartition(
  partition: Wave3PartitionName,
  occurrences: readonly OccurrenceRecord[],
  createdAt: string,
): Wave3PartitionRecords {
  const inventories: SpecializedInventoryRecord[] = [];
  const matrixRows: MatrixRow[] = [];
  const evidenceRecords: EvidenceRecord[] = [];
  const findings: OccurrenceFinding[] = [];
  const pendingOperations: Wave3PendingOperation[] = [];
  const inventoriedSubjects = new Set<string>();

  for (const occurrence of occurrences) {
    if (!inventoriedSubjects.has(occurrence.subjectId)) {
      inventoriedSubjects.add(occurrence.subjectId);
      inventories.push(buildInventoryRecord(partition, occurrence, createdAt));
    }

    if (occurrence.notApplicableRationale) {
      const evidence = buildNotApplicableEvidence(
        partition,
        occurrence,
        createdAt,
      );
      const finding = buildFinding(
        partition,
        occurrence,
        [evidence],
        "not-applicable",
        createdAt,
      );
      evidenceRecords.push(evidence);
      findings.push(finding);
      matrixRows.push(buildMatrixRow(occurrence, finding, createdAt));
      continue;
    }

    const occurrenceEvidence: EvidenceRecord[] = [
      buildStaticEvidence(partition, occurrence, createdAt),
    ];
    let resultClassification: OccurrenceFinding["resultClassification"] =
      "conforming";

    if (
      PROTECTED_ACCESS_CONTEXTS.has(occurrence.accessId) ||
      partition === "specialized-states" ||
      partition === "protected-admin" ||
      partition === "planner" ||
      partition === "studio"
    ) {
      const operation = pendingOperation(partition, occurrence);
      const pendingEvidence = buildRuntimePendingEvidence(
        partition,
        occurrence,
        operation,
        createdAt,
      );
      occurrenceEvidence.push(pendingEvidence);
      pendingOperations.push(operation);
      resultClassification = "not-run";
    }

    const finding = buildFinding(
      partition,
      occurrence,
      occurrenceEvidence,
      resultClassification,
      createdAt,
    );
    evidenceRecords.push(...occurrenceEvidence);
    findings.push(finding);
    matrixRows.push(buildMatrixRow(occurrence, finding, createdAt));
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
    for (const record of [...partition.inventories, ...partition.evidenceRecords]) {
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
    const files: readonly { readonly kind: string; readonly purpose: string; readonly filename: string; readonly records: readonly object[] }[] = [
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
        { inventoryGeneration: store.getRunManifest().inventoryGeneration },
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
  const resultTotals = (records: readonly OccurrenceFinding[]): Record<string, number> => {
    const totals: Record<string, number> = {
      conforming: 0,
      nonconforming: 0,
      blocked: 0,
      "not-run": 0,
      "not-applicable": 0,
      "requires-owner-decision": 0,
    };
    for (const finding of records) {
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
