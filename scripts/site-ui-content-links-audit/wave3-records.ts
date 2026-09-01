/**
 * Wave 3 — Task 4.1 record builders: scope rules and per-occurrence static,
 * not-applicable, and protected-runtime-pending audit records for the
 * protected/admin, Planner-only, Studio-only, and specialized-state
 * partitions.
 *
 * Pure tooling: no browser, protected-route, hosted, database, test, build,
 * gate, or network operation happens here, and nothing is written to disk.
 * Partition assembly, isolation asserts, manifests, and artifact writing live
 * in `wave3-partitions.ts`.
 *
 * Requirements: 3.4-3.9, 4.2-4.6, 12.1-12.8, 16.1-16.7, 19.1-19.8, 23.3-23.7.
 */

import { sha256 } from "./manifests";
import type { ProductSurface } from "./discovery";
import type { OccurrenceRecord } from "./profiles";
import {
  AUDIT_SCHEMA_VERSION,
  type AuditRecord,
  type BlockerDetail,
  type ProvenanceReference,
} from "./schemas";

// ---------------------------------------------------------------------------
// Record aliases and public contracts
// ---------------------------------------------------------------------------

export type SpecializedInventoryRecord = Extract<
  AuditRecord,
  { readonly recordType: "specialized-inventory" }
>;
export type EvidenceRecord = Extract<
  AuditRecord,
  { readonly recordType: "evidence" }
>;
export type OccurrenceFinding = Extract<
  AuditRecord,
  { readonly recordType: "finding" }
>;
export type MatrixRow = Extract<AuditRecord, { readonly recordType: "matrix-row" }>;

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

export const PROTECTED_ACCESS_CONTEXTS: ReadonlySet<string> = new Set<
  OccurrenceRecord["accessId"]
>([
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

export const PARTITION_DIMENSIONS: Record<
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
  {
    readonly kind: SpecializedInventoryRecord["inventoryKind"];
    readonly owner: string;
  }
> = {
  "protected-admin": {
    kind: "security-privacy-message",
    owner: "administration-protection",
  },
  planner: { kind: "journey", owner: "planner-fork" },
  studio: { kind: "journey", owner: "studio-fork" },
  "specialized-states": { kind: "state", owner: "state-boundaries" },
};

export const PARTITION_CREDENTIAL_NEEDS: Record<
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

export const WAVE3_REQUIREMENTS = [
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

// ---------------------------------------------------------------------------
// Pending operations and blockers
// ---------------------------------------------------------------------------

export function pendingWave3Operation(
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

export function buildWave3InventoryRecord(
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

export function buildWave3StaticEvidence(
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
  const staticEvidence = buildWave3StaticEvidence(
    partition,
    occurrence,
    createdAt,
  );
  const evidenceId = `evidence.wave3.${sha256Short(
    occurrence.occurrenceId,
    partition,
    "not-applicable",
  )}`;
  return {
    ...staticEvidence,
    evidenceId,
    recordId: `record.${evidenceId}`,
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
  const blockers =
    resultClassification === "not-run" ||
    resultClassification === "blocked"
      ? uniqueBlockers(
          evidenceRecords.flatMap((record) => record.blockers ?? []),
        )
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
  const meta =
    PARTITION_DIMENSIONS[assignWave3Partition(occurrence) ?? "protected-admin"];
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
// Per-occurrence emission
// ---------------------------------------------------------------------------

export interface Wave3OccurrenceEmission {
  readonly inventories: readonly SpecializedInventoryRecord[];
  readonly evidenceRecords: readonly EvidenceRecord[];
  readonly findings: readonly OccurrenceFinding[];
  readonly matrixRows: readonly MatrixRow[];
  readonly pendingOperations: readonly Wave3PendingOperation[];
}

/**
 * Emit the records for one occurrence. The caller passes
 * `subjectAlreadyInventoried` so each partition subject gets exactly one
 * specialized-inventory record.
 */
export function emitWave3Occurrence(
  partition: Wave3PartitionName,
  occurrence: OccurrenceRecord,
  createdAt: string,
  subjectAlreadyInventoried: boolean,
): Wave3OccurrenceEmission {
  const inventories: SpecializedInventoryRecord[] = [];
  if (!subjectAlreadyInventoried) {
    inventories.push(
      buildWave3InventoryRecord(partition, occurrence, createdAt),
    );
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
    return {
      inventories,
      evidenceRecords: [evidence],
      findings: [finding],
      matrixRows: [buildMatrixRow(occurrence, finding, createdAt)],
      pendingOperations: [],
    };
  }

  const occurrenceEvidence: EvidenceRecord[] = [
    buildWave3StaticEvidence(partition, occurrence, createdAt),
  ];
  const pendingOperations: Wave3PendingOperation[] = [];
  let resultClassification: OccurrenceFinding["resultClassification"] =
    "conforming";

  if (
    PROTECTED_ACCESS_CONTEXTS.has(occurrence.accessId) ||
    partition === "specialized-states" ||
    partition === "protected-admin" ||
    partition === "planner" ||
    partition === "studio"
  ) {
    // Every Wave 3 partition (protected/admin, Planner, Studio, and
    // specialized states) carries a protected or rendered aspect that stays
    // `not-run` until its exact operation is authorized.
    const operation = pendingWave3Operation(partition, occurrence);
    occurrenceEvidence.push(
      buildRuntimePendingEvidence(partition, occurrence, operation, createdAt),
    );
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
  return {
    inventories,
    evidenceRecords: occurrenceEvidence,
    findings: [finding],
    matrixRows: [buildMatrixRow(occurrence, finding, createdAt)],
    pendingOperations,
  };
}
