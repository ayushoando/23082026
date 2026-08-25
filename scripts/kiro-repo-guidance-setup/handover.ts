/**
 * Lane D operational projections.
 *
 * These projections are pure and fail closed. They do not write a handover file,
 * change an artifact, activate a capability, or upgrade evidence. The generated
 * record is a deterministic view over the frozen Lane A-C records.
 */

import {
  CAPABILITY_DISPOSITIONS,
  COMPLETE_REVIEW_STATEMENT,
  EVIDENCE_STATES,
  INITIAL_SKILL_CANDIDATES,
  OWNER_DECISION_IDS,
  REQUIRED_SURFACE_VERSIONS,
  type ArtifactInventoryRecord,
  type ArtifactKind,
  type CapabilityDisposition,
  type CapabilityDispositionRecord,
  type CapabilityDispositionTable,
  type ConfigurationPrecedenceMap,
  type ConfigurationScope,
  type HandoverArtifactDisposition,
  type HandoverDisposition,
  type HandoverGenerator as HandoverGeneratorContract,
  type HandoverInput,
  type HandoverRecord,
  type Identifier,
  type KnownGap,
  type KnownGapKind,
  type KnownGapsRegister,
  type RollbackPath,
  type StageResult,
  type SurfaceVersion,
} from "./contracts";

export const HANDOVER_REVIEWER_STAGE_REFS = [
  "reviewer-stage:EvidenceCompatibilityReviewer",
  "reviewer-stage:SafetyRollbackReviewer",
] as const satisfies readonly [Identifier, Identifier];

export const HANDOVER_FIRST_READ_PATH = [
  "START.md",
  "AGENTS.md",
  "Agents/*",
  "docs/*",
  ".kiro/skills/repo-map/SKILL.md",
  ".kiro/steering/*",
  ".kiro/hooks/*",
  ".kiro/powers/* and MCP boundaries",
  ".kiro/agents/* and Subagents",
  "selected Active_Surface and exact version",
] as const satisfies readonly string[];

export const HANDOVER_MAINTENANCE_TRIGGERS = [
  "Kiro surface or version changes",
  "official Kiro schema or documentation family changes",
  "a skill, steering file, hook, power, agent, MCP, or specification artifact changes",
  "repository authority or process-floor rules change",
  "a validation, reviewer, or rollback gate fails",
] as const satisfies readonly string[];

const REPOSITORY_OWNER = "repository owner" as const;
const NO_ROLLBACK_APPLIES = "no rollback applies" as const;
const NO_CHANGE_CAPABILITY_DISPOSITIONS = new Set<CapabilityDisposition>([
  "retain",
  "observe",
  "defer",
  "exclude",
]);
const NO_CHANGE_HANDOVER_DISPOSITIONS = new Set<HandoverDisposition>([
  "retained",
  "observed",
  "deferred",
  "excluded",
]);

const ARTIFACT_KINDS = new Set<string>([
  "Kiro_Skill",
  "Steering_File",
  "Hook_Manifest",
  "Kiro_Power",
  "Custom_Agent",
  "MCP_Service",
  "Tool_Surface",
  "Subagent",
  "Specification",
  "Permission_Configuration",
  "Ignore_Configuration",
  "Relevant_Setting",
]);
const EXTENSION_KINDS = new Set<string>([
  "MCP_Service",
  "Tool_Surface",
  "Custom_Agent",
  "Subagent",
]);
const CONFIGURATION_SCOPES = new Set<ConfigurationScope>([
  "global",
  "project",
  "agent",
  "file_match",
  "manual",
  "workspace_root_permission",
  "user_permission",
  "external_service",
]);
const KNOWN_GAP_KINDS = new Set<KnownGapKind>([
  "unverified",
  "unavailable",
  "contradictory",
  "version_sensitive",
  "missing_prerequisite",
  "policy_conflict",
]);
/** Input accepted when projecting the shared Lane A/C audit records. */
export interface CapabilityDispositionProjectionInput {
  readonly records?: readonly CapabilityDispositionRecord[];
  readonly artifacts?: readonly ArtifactInventoryRecord[];
  readonly auditedArtifacts?: readonly ArtifactInventoryRecord[];
  readonly capabilities?: readonly CapabilityDispositionRecord[];
  readonly auditedCapabilities?: readonly CapabilityDispositionRecord[];
}

export interface KnownGapsProjectionInput {
  readonly entries: readonly KnownGap[];
}

export interface HandoverGeneratorOptions {
  readonly now?: () => Date;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function uniqueStrings(values: readonly string[]): string[] {
  return unique(values.filter(nonEmpty).map((value) => value.trim()));
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? uniqueStrings(value) : [];
}

function redact(value: string): string {
  return value
    .replace(/((?:api[_-]?key|token|password|secret|credential)\s*[=:]\s*)[^\s,&]+/gi, "$1[REDACTED]")
    .replace(/([?&](?:api[_-]?key|token|password|secret|credential)=)[^&\s]+/gi, "$1[REDACTED]");
}

function redactArray(values: readonly string[]): string[] {
  return uniqueStrings(values.map(redact));
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "record";
}

function isoDate(value: unknown): boolean {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}(?:T.*Z)?$/.test(value) && !Number.isNaN(Date.parse(value));
}

function rollbackForDisposition(
  disposition: CapabilityDisposition,
  rollbackPath: string,
): RollbackPath {
  if (NO_CHANGE_CAPABILITY_DISPOSITIONS.has(disposition)) return NO_ROLLBACK_APPLIES;
  return nonEmpty(rollbackPath) ? redact(rollbackPath) : NO_ROLLBACK_APPLIES;
}

function surfaceVersions(values: readonly SurfaceVersion[]): SurfaceVersion[] {
  const candidates = Array.isArray(values) ? values : [];
  const result: SurfaceVersion[] = [];
  for (const required of REQUIRED_SURFACE_VERSIONS) {
    if (candidates.some((value) => value.surface === required.surface && value.version === required.version)) {
      result.push(required);
    }
  }
  return result;
}

function artifactExpectedSideEffects(kind: ArtifactKind): readonly string[] {
  switch (kind) {
    case "Hook_Manifest":
      return ["a bounded repository-local hook may run only after schema, safety, surface, approval, and rollback checks"];
    case "MCP_Service":
      return ["external service access remains blocked until a named service, data, secret, and permission boundary passes"];
    case "Permission_Configuration":
      return ["permission scope remains unchanged until an explicit approval boundary and precedence validation pass"];
    case "Kiro_Power":
      return ["power routing remains local and inactive until repository-answer and exact-surface loading checks pass"];
    default:
      return ["repository-local guidance is inspected without changing application or production state"];
  }
}

function artifactValidationAction(record: ArtifactInventoryRecord): string {
  return `validate ${record.path} on the exact applicable surface/version; confirm schema, scope, evidence, and rollback before enablement`;
}

function artifactApprovalBoundary(record: ArtifactInventoryRecord): Identifier | "no_boundary" {
  if (record.configurationScope === "global" || record.configurationScope === "user_permission" || record.configurationScope === "external_service") {
    return `approval-boundary:${record.artifactId}`;
  }
  if (record.kind === "MCP_Service") return "approval-boundary:OD-06";
  if (record.kind === "Custom_Agent" || record.kind === "Subagent") return "approval-boundary:OD-07";
  if (record.kind === "Hook_Manifest") return "approval-boundary:OD-02";
  return "no_boundary";
}

function dispositionRecordFromArtifact(record: ArtifactInventoryRecord): CapabilityDispositionRecord {
  const rollbackPath = rollbackForDisposition(record.disposition, record.rollbackPath);
  return {
    capabilityId: record.artifactId,
    kind: record.kind,
    name: record.path,
    disposition: record.disposition,
    configurationScope: record.configurationScope,
    canonicalSource: record.canonicalSource || record.path,
    surfaceVersionApplicability: [...REQUIRED_SURFACE_VERSIONS],
    activationCondition: record.activationCondition || "after exact scope, evidence, validation, owner, and rollback checks",
    owner: record.owner || REPOSITORY_OWNER,
    approvalBoundaryRef: artifactApprovalBoundary(record),
    evidenceRefs: uniqueStrings(record.evidenceRefs),
    validationAction: artifactValidationAction(record),
    expectedSideEffects: artifactExpectedSideEffects(record.kind),
    rollbackPath,
    reason: `inventory status: ${record.inventoryStatus}; evidence state: ${record.evidenceState}; maintenance risk: ${record.maintenanceRisk}`,
    knownGapRefs: [],
  };
}

function normalizeDispositionRecord(
  record: CapabilityDispositionRecord,
  index: number,
): { readonly record: CapabilityDispositionRecord; readonly blockers: readonly string[] } {
  const blockers: string[] = [];
  const capabilityId = nonEmpty(record.capabilityId) ? record.capabilityId.trim() : `capability:invalid:${index}`;
  const kind = record.kind;
  const name = nonEmpty(record.name) ? record.name.trim() : "";
  const canonicalSource = nonEmpty(record.canonicalSource) ? record.canonicalSource.trim() : "";
  const scope = record.configurationScope;
  const rawSurfaces = Array.isArray(record.surfaceVersionApplicability)
    ? record.surfaceVersionApplicability
    : [];
  const surfaces = surfaceVersions(rawSurfaces);
  const rawEvidenceRefs = Array.isArray(record.evidenceRefs) ? record.evidenceRefs : [];
  const evidenceRefs = stringArray(rawEvidenceRefs);
  const rawSideEffects = Array.isArray(record.expectedSideEffects) ? record.expectedSideEffects : [];
  const sideEffects = stringArray(rawSideEffects);
  const rawKnownGapRefs = Array.isArray(record.knownGapRefs) ? record.knownGapRefs : [];
  const knownGapRefs = stringArray(rawKnownGapRefs);
  const activationCondition = nonEmpty(record.activationCondition) ? record.activationCondition.trim() : "";
  const owner = nonEmpty(record.owner) ? record.owner.trim() : "";
  const validationAction = nonEmpty(record.validationAction) ? record.validationAction.trim() : "";
  const reason = nonEmpty(record.reason) ? record.reason.trim() : "";
  const rollbackPath = nonEmpty(record.rollbackPath) ? record.rollbackPath.trim() : "";
  const approvalBoundaryRef: Identifier | "no_boundary" = record.approvalBoundaryRef === "no_boundary"
    ? "no_boundary"
    : nonEmpty(record.approvalBoundaryRef)
      ? record.approvalBoundaryRef.trim()
      : "no_boundary";

  if (!nonEmpty(record.capabilityId)) blockers.push(`capability disposition ${index} requires a capabilityId`);
  if (!ARTIFACT_KINDS.has(kind) && !EXTENSION_KINDS.has(kind)) blockers.push(`${capabilityId} has an unknown capability kind`);
  if (!name) blockers.push(`${capabilityId} requires a non-empty name`);
  if (!canonicalSource) blockers.push(`${capabilityId} requires a canonical source/path`);
  if (!CAPABILITY_DISPOSITIONS.includes(record.disposition)) blockers.push(`${capabilityId} has an invalid disposition`);
  if (!CONFIGURATION_SCOPES.has(scope)) blockers.push(`${capabilityId} has an invalid configuration scope`);
  if (surfaces.length === 0) blockers.push(`${capabilityId} requires surface/version applicability`);
  if (!activationCondition) blockers.push(`${capabilityId} requires an activation condition`);
  if (!owner) blockers.push(`${capabilityId} requires an owner`);
  if (record.approvalBoundaryRef !== "no_boundary" && !nonEmpty(record.approvalBoundaryRef)) {
    blockers.push(`${capabilityId} requires an approval-boundary reference or no_boundary`);
  }
  if (evidenceRefs.length === 0) blockers.push(`${capabilityId} requires evidence references`);
  if (!validationAction) blockers.push(`${capabilityId} requires a validation action`);
  if (sideEffects.length === 0) blockers.push(`${capabilityId} requires expected side effects`);
  if (!reason) blockers.push(`${capabilityId} requires a disposition reason`);
  if (!rollbackPath) blockers.push(`${capabilityId} requires a rollback path value`);
  if (!Array.isArray(record.knownGapRefs)) blockers.push(`${capabilityId} requires known-gap references`);

  const normalized: CapabilityDispositionRecord = {
    capabilityId,
    kind,
    name: redact(name),
    disposition: record.disposition,
    configurationScope: scope,
    canonicalSource: redact(canonicalSource),
    surfaceVersionApplicability: surfaces,
    activationCondition: redact(activationCondition),
    owner: redact(owner),
    approvalBoundaryRef,
    evidenceRefs: redactArray(evidenceRefs),
    validationAction: redact(validationAction),
    expectedSideEffects: redactArray(sideEffects),
    rollbackPath: rollbackForDisposition(record.disposition, rollbackPath),
    reason: redact(reason),
    knownGapRefs: redactArray(knownGapRefs),
  };

  return { record: normalized, blockers };
}

function projectCapabilityDispositionRecords(
  input: CapabilityDispositionProjectionInput,
): StageResult<CapabilityDispositionTable> {
  const supplied = [
    ...(input.artifacts ?? []).map(dispositionRecordFromArtifact),
    ...(input.auditedArtifacts ?? []).map(dispositionRecordFromArtifact),
    ...(input.records ?? []),
    ...(input.capabilities ?? []),
    ...(input.auditedCapabilities ?? []),
  ];
  const blockers: string[] = [];
  if (supplied.length === 0) blockers.push("capability disposition table requires at least one audited artifact or capability");

  const seenIds = new Set<string>();
  const entries: CapabilityDispositionRecord[] = [];
  supplied.forEach((candidate, index) => {
    const normalizedResult = normalizeDispositionRecord(candidate, index);
    blockers.push(...normalizedResult.blockers);
    if (seenIds.has(normalizedResult.record.capabilityId)) {
      blockers.push(`duplicate capability disposition ${normalizedResult.record.capabilityId}`);
      return;
    }
    seenIds.add(normalizedResult.record.capabilityId);
    if (normalizedResult.blockers.length === 0) entries.push(normalizedResult.record);
  });

  const output: CapabilityDispositionTable = { entries };
  const evidenceRefs = unique(entries.flatMap((entry) => entry.evidenceRefs));
  if (blockers.length > 0) return { status: "blocked", output, blockers: unique(blockers), evidenceRefs };
  return { status: "pass", output, blockers: [], evidenceRefs };
}

/** Builds one validated disposition record for every supplied audit record. */
export function buildCapabilityDispositionTable(
  input: CapabilityDispositionProjectionInput,
): StageResult<CapabilityDispositionTable> {
  return projectCapabilityDispositionRecords(input);
}

export const projectCapabilityDispositionTable = buildCapabilityDispositionTable;

export class CapabilityDispositionTableProjection {
  build(input: CapabilityDispositionProjectionInput): StageResult<CapabilityDispositionTable> {
    return projectCapabilityDispositionRecords(input);
  }
}

export const capabilityDispositionTableProjection = new CapabilityDispositionTableProjection();

function validKnownGap(entry: KnownGap, index: number): string[] {
  const blockers: string[] = [];
  const prefix = nonEmpty(entry.gapId) ? entry.gapId : `known-gap:${index}`;
  const evidenceRefs = Array.isArray(entry.evidenceRefs) ? stringArray(entry.evidenceRefs) : [];
  if (!nonEmpty(entry.gapId)) blockers.push(`${prefix} requires a gapId`);
  if (!nonEmpty(entry.title)) blockers.push(`${prefix} requires a title`);
  if (!KNOWN_GAP_KINDS.has(entry.kind)) blockers.push(`${prefix} has an invalid gap kind`);
  if (!EVIDENCE_STATES.includes(entry.evidenceState)) blockers.push(`${prefix} has an invalid evidence state`);
  if (evidenceRefs.length === 0) blockers.push(`${prefix} requires evidence references`);
  if (!nonEmpty(entry.owner)) blockers.push(`${prefix} requires an owner`);
  if (!nonEmpty(entry.nextValidationRun)) blockers.push(`${prefix} requires a next Validation_Run`);
  if (!nonEmpty(entry.blockedAction)) blockers.push(`${prefix} requires a blocked action`);
  if (!CAPABILITY_DISPOSITIONS.includes(entry.disposition)) blockers.push(`${prefix} has an invalid disposition`);
  if (entry.status !== "open" && entry.status !== "resolved") blockers.push(`${prefix} has an invalid status`);
  if (!nonEmpty(entry.limitation)) blockers.push(`${prefix} requires a limitation`);
  return blockers;
}

function normalizeKnownGap(entry: KnownGap): KnownGap {
  return {
    ...entry,
    gapId: redact(entry.gapId),
    title: redact(entry.title),
    evidenceState: entry.evidenceState,
    evidenceRefs: redactArray(stringArray(entry.evidenceRefs)),
    owner: redact(entry.owner),
    nextValidationRun: redact(entry.nextValidationRun),
    blockedAction: redact(entry.blockedAction),
    disposition: entry.disposition,
    limitation: redact(entry.limitation),
  };
}

/** Validates and redacts the append-only known-gaps projection. */
export function buildKnownGapsRegister(
  input: KnownGapsProjectionInput | KnownGapsRegister | readonly KnownGap[],
): StageResult<KnownGapsRegister> {
  const inputEntries = Array.isArray(input)
    ? input
    : input && Array.isArray((input as KnownGapsProjectionInput | KnownGapsRegister).entries)
      ? (input as KnownGapsProjectionInput | KnownGapsRegister).entries
      : [];
  const blockers: string[] = [];
  if (!Array.isArray(inputEntries)) blockers.push("known-gaps register requires an entries array");

  const entries = Array.isArray(inputEntries) ? inputEntries : [];
  const seen = new Set<string>();
  const normalized: KnownGap[] = [];

  entries.forEach((entry, index) => {
    const entryBlockers = validKnownGap(entry, index);
    blockers.push(...entryBlockers);
    if (seen.has(entry.gapId)) blockers.push(`duplicate known gap ${entry.gapId}`);
    seen.add(entry.gapId);
    if (entryBlockers.length === 0) normalized.push(normalizeKnownGap(entry));
  });

  const output: KnownGapsRegister = { entries: normalized };
  const evidenceRefs = unique(normalized.flatMap((entry) => entry.evidenceRefs));
  if (blockers.length > 0) return { status: "blocked", output, blockers: unique(blockers), evidenceRefs };
  return { status: "pass", output, blockers: [], evidenceRefs };
}

export const projectKnownGapsRegister = buildKnownGapsRegister;

export class KnownGapsRegisterProjection {
  build(input: KnownGapsProjectionInput): StageResult<KnownGapsRegister> {
    return buildKnownGapsRegister(input);
  }
}

export const knownGapsRegisterProjection = new KnownGapsRegisterProjection();

function handoverDispositionFor(disposition: CapabilityDisposition): HandoverDisposition {
  const mapping: Readonly<Record<CapabilityDisposition, HandoverDisposition>> = {
    apply: "installed",
    retain: "retained",
    update: "updated",
    merge: "merged",
    add: "added",
    observe: "observed",
    defer: "deferred",
    disable: "disabled",
    retire: "retired",
    exclude: "excluded",
  };
  return mapping[disposition];
}

function handoverArtifactDisposition(record: CapabilityDispositionRecord): HandoverArtifactDisposition {
  const disposition = handoverDispositionFor(record.disposition);
  const rollbackPath = NO_CHANGE_HANDOVER_DISPOSITIONS.has(disposition)
    ? NO_ROLLBACK_APPLIES
    : rollbackForDisposition(record.disposition, record.rollbackPath);
  return {
    artifactId: record.capabilityId,
    canonicalPath: record.canonicalSource,
    disposition,
    evidenceRefs: [...record.evidenceRefs],
    reason: record.reason,
    activationCondition: record.activationCondition,
    owner: record.owner,
    rollbackPath,
  };
}

function surfaceLine(surface: SurfaceVersion, input: HandoverInput): string {
  const record = input.compatibilityRecords.find(
    (candidate) => candidate.surface === surface.surface && candidate.version === surface.version,
  );
  if (!record) return `${surface.surface} ${surface.version}: missing compatibility record; Unverified`;

  const observed = record.observedBehavior.length > 0 ? record.observedBehavior.join(" | ") : "none recorded";
  const unsupported = record.unsupportedClaims.length > 0 ? record.unsupportedClaims.join(" | ") : "none recorded";
  const migration = record.migrationConstraints.length > 0 ? record.migrationConstraints.join(" | ") : "none recorded";
  const validation = record.validationRunRefs.length > 0 ? record.validationRunRefs.join(", ") : "none recorded";
  return `${record.surface} ${record.version}: status=${record.status}; observed=${observed}; unsupported=${unsupported}; migration=${migration}; validation=${validation}`;
}

function surfaceCompatibilityStatement(input: HandoverInput): string {
  return REQUIRED_SURFACE_VERSIONS.map((surface) => surfaceLine(surface, input)).join("\n");
}

function coverageIsComplete(input: HandoverInput): boolean {
  return input.coverageMatrix.complete &&
    input.coverageMatrix.completeReviewStatement === COMPLETE_REVIEW_STATEMENT &&
    input.coverageMatrix.entries.length > 0 &&
    input.coverageMatrix.entries.every((entry) =>
      nonEmpty(entry.coverageId) && nonEmpty(entry.sourceId) && nonEmpty(entry.evidenceProvenanceRef),
    ) &&
    input.officialFamilyStatuses.length > 0 &&
    input.officialFamilyStatuses.every(nonEmpty);
}

function compatibilityBlockers(records: HandoverInput["compatibilityRecords"]): string[] {
  const blockers: string[] = [];
  const seen = new Set<string>();
  for (const target of REQUIRED_SURFACE_VERSIONS) {
    const matching = records.filter((record) => record.surface === target.surface && record.version === target.version);
    const key = `${target.surface}::${target.version}`;
    if (matching.length === 0) blockers.push(`missing compatibility record for ${key}`);
    if (matching.length > 1) blockers.push(`duplicate compatibility record for ${key}`);
    if (matching.length === 1) seen.add(key);
  }
  if (records.length !== REQUIRED_SURFACE_VERSIONS.length) blockers.push("compatibility matrix must contain exactly seven surface/version records");
  return [...new Set(blockers)];
}

function decisionBlockers(input: HandoverInput): string[] {
  const blockers: string[] = [];
  const seen = new Set<string>();
  for (const decision of input.ownerDecisions) {
    if (seen.has(decision.decisionId)) blockers.push(`duplicate owner decision ${decision.decisionId}`);
    seen.add(decision.decisionId);
  }
  for (const id of OWNER_DECISION_IDS) {
    const decision = input.ownerDecisions.find((candidate) => candidate.decisionId === id);
    if (!decision) blockers.push(`missing owner decision ${id}`);
    else if (decision.selectedPolicy !== "enable after validation") blockers.push(`${id} does not preserve enable after validation`);
  }
  if (input.ownerDecisions.length !== OWNER_DECISION_IDS.length) blockers.push("owner-decision ledger must contain exactly OD-01 through OD-10");
  return unique(blockers);
}

function precedenceBlockers(map: ConfigurationPrecedenceMap): string[] {
  const blockers: string[] = [];
  if (!isoDate(map.generatedAtUtc)) blockers.push("configuration precedence map has an invalid generation date");
  if (!Array.isArray(map.records) || map.records.length === 0) blockers.push("configuration precedence map has no scope records");
  if (!Array.isArray(map.documentedOrder) || map.documentedOrder.length === 0) blockers.push("configuration precedence map has no documented order");
  return blockers;
}

function generatedAt(now: () => Date): string {
  const date = now();
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function handoverReferences(input: HandoverInput): Identifier[] {
  return unique([
    `coverage-matrix:${slug(input.reviewDateUtc)}`,
    `exclusion-register:${slug(input.reviewDateUtc)}`,
    `configuration-precedence-map:${slug(input.precedenceMap.generatedAtUtc)}`,
    `capability-disposition-table:${slug(input.reviewDateUtc)}`,
    ...input.ownerDecisions.map((decision) => decision.evidenceRef),
    ...input.validationRuns.map((run) => run.validationId),
    ...input.rollbackRecords.map((record) => record.rollbackId),
  ].filter(nonEmpty));
}

function buildHandover(
  input: HandoverInput,
  now: () => Date,
  normalizedGaps: readonly KnownGap[],
): { readonly output: HandoverRecord; readonly blockers: readonly string[] } {
  const complete = coverageIsComplete(input);
  const coverageBlockers = complete ? [] : [
    "official-family status/evidence or Coverage_Matrix completeness is missing; complete-review remains incomplete",
  ];
  const compatibilityErrors = compatibilityBlockers(input.compatibilityRecords);
  const ownerDecisionErrors = decisionBlockers(input);
  const precedenceErrors = precedenceBlockers(input.precedenceMap);
  const unavailable = input.coverageMatrix.unavailableCandidateRefs.length > 0
    ? `Unavailable candidates: ${input.coverageMatrix.unavailableCandidateRefs.join(", ")}.`
    : "Unavailable candidates: none recorded.";
  const limitations = uniqueStrings([
    unavailable,
    ...input.coverageMatrix.blockers,
    ...input.officialFamilyStatuses.filter((status) => /unverified|unavailable|incomplete/i.test(status)),
    ...input.compatibilityRecords.flatMap((record) => record.unsupportedClaims),
    ...normalizedGaps.filter((gap) => gap.evidenceState === "Unverified").map((gap) => `Unverified: ${gap.title}`),
    "Static repository evidence does not prove Kiro loading, hook execution, external-service success, or cross-surface compatibility.",
  ]);
  const output: HandoverRecord = {
    generatedAtUtc: generatedAt(now),
    reviewDateUtc: input.reviewDateUtc,
    completeReviewStatement: complete
      ? COMPLETE_REVIEW_STATEMENT
      : `Review incomplete: ${COMPLETE_REVIEW_STATEMENT}`,
    firstReadPath: [...HANDOVER_FIRST_READ_PATH],
    coverageMatrixRef: `coverage-matrix:${slug(input.reviewDateUtc)}`,
    exclusionRegisterRef: `exclusion-register:${slug(input.reviewDateUtc)}`,
    officialFamilyStatuses: redactArray(input.officialFamilyStatuses),
    surfaceCompatibilityStatement: surfaceCompatibilityStatement(input),
    configurationPrecedenceMapRef: `configuration-precedence-map:${slug(input.precedenceMap.generatedAtUtc)}`,
    capabilityDispositionTableRef: `capability-disposition-table:${slug(input.reviewDateUtc)}`,
    reviewerStageRefs: HANDOVER_REVIEWER_STAGE_REFS,
    ownerDecisionRefs: input.ownerDecisions.map((decision) => decision.decisionId),
    evidenceStateLegend: [...EVIDENCE_STATES],
    artifactDispositions: input.dispositionTable.entries.map(handoverArtifactDisposition),
    validationRuns: [...input.validationRuns],
    knownGaps: normalizedGaps,
    rollbackRecords: [...input.rollbackRecords],
    maintenanceTriggers: [...HANDOVER_MAINTENANCE_TRIGGERS],
    limitations,
  };
  return {
    output,
    blockers: unique([...coverageBlockers, ...compatibilityErrors, ...ownerDecisionErrors, ...precedenceErrors]),
  };
}

/** Produces the operational handover projection without enabling anything. */
export class HandoverGeneratorService implements HandoverGeneratorContract {
  private readonly now: () => Date;

  public constructor(options: HandoverGeneratorOptions = {}) {
    this.now = options.now ?? (() => new Date());
  }

  public generate(input: HandoverInput): StageResult<HandoverRecord> {
    const gapResult = buildKnownGapsRegister(input.knownGaps);
    const blockers = [...gapResult.blockers];
    if (!isoDate(input.reviewDateUtc)) blockers.push("handover reviewDateUtc must be an ISO date");
    if (input.dispositionTable.entries.length === 0) blockers.push("handover requires a non-empty Capability_Disposition_Table");
    if (input.exclusionRegister.entries.some((entry) => entry.status !== "excluded")) blockers.push("Exclusion_Register contains a non-excluded entry");

    const normalizedGaps = gapResult.output?.entries ?? [];
    const handover = buildHandover(input, this.now, normalizedGaps);
    blockers.push(...handover.blockers);
    const output = handover.output;
    const evidenceRefs = unique([...handoverReferences(input), ...normalizedGaps.flatMap((gap) => gap.evidenceRefs)]);

    if (blockers.length > 0) {
      return {
        status: "partial",
        output,
        blockers: unique(blockers),
        evidenceRefs,
      };
    }
    return { status: "pass", output, blockers: [], evidenceRefs };
  }
}

export const handoverGenerator = new HandoverGeneratorService();
export const generateHandover = (input: HandoverInput): StageResult<HandoverRecord> =>
  handoverGenerator.generate(input);
export const HandoverGenerator = HandoverGeneratorService;

export const CAPABILITY_DISPOSITION_NO_ROLLBACK = NO_ROLLBACK_APPLIES;
export const HANDOVER_NO_CHANGE_DISPOSITIONS = [...NO_CHANGE_HANDOVER_DISPOSITIONS] as const;
export const HANDOVER_EVIDENCE_STATES = EVIDENCE_STATES;
export const HANDOVER_SKILL_CANDIDATES = INITIAL_SKILL_CANDIDATES;
