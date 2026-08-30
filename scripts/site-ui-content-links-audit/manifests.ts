/**
 * Durable artifact manifests, partitioning, resumability, and wave control.
 *
 * This module is audit tooling only. It never writes product code, databases,
 * hosted systems, or authored work. Generated records are written as canonical
 * NDJSON partitions and are referenced by small manifests; authored work is
 * referenced, never copied.
 *
 * Implements requirements 22.1, 22.7–22.9, 24.8, 26.9, and 26.12:
 * - immutable run metadata, partitioned canonical data, supersession links;
 * - leases, heartbeats, stale-lease recovery, and one writer per partition;
 * - bounded concurrency, deterministic merge, generations, and dependency
 *   invalidation;
 * - redaction, quarantine, persisted review queues, and wave closure guards.
 */

import { createHash, randomBytes } from "node:crypto";
import {
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import { resolveApprovedArtifactPath } from "./artifactPaths";
import type { AuditRunConfiguration, AuditWaveConfiguration } from "./config";
import type { ImmutableRunInputs } from "./runIdentity";

// ---------------------------------------------------------------------------
// Stable serialization and hashes
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Serialize JSON-like values with recursively sorted object keys. */
export function canonicalJson(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
    .join(",")}}`;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function computeConfigHash(config: AuditRunConfiguration): string {
  return sha256(canonicalJson(config));
}

/** Compute a stable input fingerprint from ordered or unordered parts. */
export function computeFingerprint(parts: readonly string[]): string {
  return sha256(parts.join("\u0000"));
}

export function computeNamedFingerprint(
  values: Readonly<Record<string, string>>,
): string {
  return computeFingerprint(
    Object.keys(values)
      .sort()
      .map((key) => `${key}=${values[key]}`),
  );
}

/** ISO timestamp helper; tests may override it without changing wall-clock code. */
let now = (): string => new Date().toISOString();

export function _overrideNow(fn: () => string): void {
  now = fn;
}

export function _resetNow(): void {
  now = () => new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Manifest and partition contracts
// ---------------------------------------------------------------------------

/** Canonical persisted states. Legacy aliases remain accepted for compatibility. */
export type PartitionState =
  | "pending"
  | "in-progress"
  | "completed"
  | "leased"
  | "complete"
  | "blocked"
  | "invalidated"
  | "quarantined";

export type PartitionStatus =
  | "pending"
  | "leased"
  | "complete"
  | "blocked"
  | "invalidated";

export type PartitionId = string & { readonly __brand: "PartitionId" };

export function toPartitionId(value: string): PartitionId {
  if (!value.trim()) {
    throw new ManifestError("PartitionId must be a non-empty string.");
  }
  return value as PartitionId;
}

export interface PartitionLease {
  readonly writerId: string;
  readonly acquiredAt?: string;
  readonly heartbeatAt: string;
  readonly expiresAt: string;
}

export interface PartitionBlocker {
  readonly kind:
    | "authorization"
    | "hook-denial"
    | "permission"
    | "fixture"
    | "credential"
    | "environment"
    | "command"
    | "owner-decision"
    | "source-unavailable"
    | "schema";
  readonly detail: string;
  readonly pendingOperation: string;
  readonly owner?: string;
}

export interface PartitionDependency {
  readonly partitionId: PartitionId;
  readonly inputFingerprint: string;
}

export interface PartitionManifest {
  readonly partitionId: PartitionId;
  /** Repository-relative path of the canonical partition data file. */
  readonly path: string;
  readonly contentHash: string;
  readonly recordCount: number;
  /** Optional quarantine partition retained when records fail validation. */
  readonly quarantinePath?: string;
  /** Legacy/current state field retained for callers of the first implementation. */
  readonly state: PartitionState;
  /** Schema-aligned status field. */
  readonly status?: PartitionStatus;
  readonly inputFingerprint: string;
  readonly dependencyPartitionIds?: readonly PartitionId[];
  readonly dependencyFingerprints?: Readonly<Record<string, string>>;
  readonly supersedesPartitionId?: PartitionId;
  readonly lease?: PartitionLease;
  readonly blocker?: PartitionBlocker;
  readonly quarantineReason?: string;
  readonly quarantinedRecordCount?: number;
  readonly redactedValueCount?: number;
  readonly csvPath?: string;
  readonly reviewQueueIds?: readonly string[];
  readonly inventoryGeneration?: number;
  readonly invalidatedAt?: string;
  readonly invalidationReasons?: readonly string[];
  readonly updatedAt: string;
}

export interface WaveManifest {
  readonly waveId: number;
  readonly runId: string;
  readonly status: "pending" | "in-progress" | "complete" | "blocked" | "invalidated";
  readonly entryCriteriaMet: boolean;
  readonly exitCriteriaText: readonly string[];
  readonly ownedPartitionIds: readonly PartitionId[];
  readonly authorizationRequirement: string;
  readonly updatedAt: string;
  readonly inputFingerprint?: string;
  readonly inventoryGeneration?: number;
  readonly checkpointId?: string;
}

export interface RunManifest {
  readonly recordType?: "run-manifest";
  readonly recordId?: string;
  readonly manifestId?: string;
  readonly runId: string;
  readonly auditId: string;
  readonly schemaVersion: string;
  readonly schemaHash: string;
  readonly repositoryRevision: string;
  readonly configurationHash: string;
  readonly sourceHashes: Readonly<Record<string, string>>;
  readonly toolVersions: Readonly<Record<string, string>>;
  readonly inventoryGeneration: number;
  readonly partitions: readonly PartitionManifest[];
  readonly waveManifests?: readonly WaveManifest[];
  readonly reviewQueue?: readonly ReviewQueueEntry[];
  readonly generatedArtifactReferences?: readonly string[];
  /** Authored paths are references only; this store never copies them. */
  readonly authoredWorkReferences: readonly string[];
  readonly changedPaths: readonly string[];
  readonly supersedesManifestId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ManifestStoreOptions {
  readonly sourceHashes?: Readonly<Record<string, string>>;
  readonly toolVersions?: Readonly<Record<string, string>>;
  readonly authoredWorkReferences?: readonly string[];
  readonly generatedArtifactReferences?: readonly string[];
  readonly schemaHash?: string;
  readonly changedPaths?: readonly string[];
  readonly supersedesManifestId?: string;
  readonly leaseTtlMs?: number;
  readonly lockTimeoutMs?: number;
}

export interface PartitionLeaseOptions {
  readonly dependencyPartitionIds?: readonly PartitionId[];
  readonly dependencyFingerprints?: Readonly<Record<string, string>>;
  readonly inventoryGeneration?: number;
  readonly reviewQueueIds?: readonly string[];
}

export interface WaveCriteriaContext {
  /** Exact configured criterion text → observed result. */
  readonly entryCriteria?: Readonly<Record<string, boolean>>;
  readonly ownedPartitionIds?: readonly PartitionId[];
  readonly inputFingerprint?: string;
  readonly inventoryGeneration?: number;
}

export interface WaveCheckpointRecord {
  readonly recordType: "wave-checkpoint";
  readonly recordId: string;
  readonly createdAt: string;
  readonly checkpointId: string;
  readonly runId: string;
  readonly waveId: number;
  readonly status: "pending" | "leased" | "complete" | "blocked" | "invalidated";
  readonly entryCriteriaMet: boolean;
  readonly exitCriteria: readonly string[];
  readonly dependencyWaveIds: readonly string[];
  readonly ownedPartitionIds: readonly string[];
  readonly ownedOutputPaths: readonly string[];
  readonly authorizationRequirement: string;
  readonly owner?: string;
  readonly heartbeatAt?: string;
  readonly inputFingerprint: string;
  readonly inventoryGeneration: number;
  readonly terminalItemCount: number;
  readonly ownedItemCount: number;
  readonly quarantineCount: number;
  readonly nonTerminalCount: number;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class ManifestError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ManifestError";
  }
}

export class LeaseConflictError extends ManifestError {
  public readonly holdingWriterId: string;

  public constructor(partitionId: PartitionId, holdingWriterId: string) {
    super(`Partition ${partitionId} is already leased by writer ${holdingWriterId}.`);
    this.name = "LeaseConflictError";
    this.holdingWriterId = holdingWriterId;
  }
}

export class LeaseExpiredError extends ManifestError {
  public constructor(partitionId: PartitionId) {
    super(`Lease for partition ${partitionId} has expired.`);
    this.name = "LeaseExpiredError";
  }
}

export class WaveEntryCriteriaError extends ManifestError {
  public readonly waveId: number;
  public readonly unmetCriteria: readonly string[];

  public constructor(waveId: number, unmetCriteria: readonly string[]) {
    super(`Wave ${waveId} entry criteria not met: ${unmetCriteria.join("; ")}`);
    this.name = "WaveEntryCriteriaError";
    this.waveId = waveId;
    this.unmetCriteria = unmetCriteria;
  }
}

export class WaveExitCriteriaError extends ManifestError {
  public readonly waveId: number;
  public readonly nonterminalIds: readonly PartitionId[];

  public constructor(waveId: number, nonterminalIds: readonly PartitionId[]) {
    super(
      `Wave ${waveId} cannot close: nonterminal or quarantined partitions: ${nonterminalIds.join(", ")}`,
    );
    this.name = "WaveExitCriteriaError";
    this.waveId = waveId;
    this.nonterminalIds = nonterminalIds;
  }
}

// ---------------------------------------------------------------------------
// State helpers
// ---------------------------------------------------------------------------

const DEFAULT_LEASE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_LOCK_TIMEOUT_MS = 5 * 1000;
const EMPTY_CONTENT_HASH = sha256("");

export function generateWriterId(): string {
  return randomBytes(8).toString("hex");
}

export function generateRunId(immutableRunInputs: ImmutableRunInputs): string {
  return immutableRunInputs.runId;
}

function statusForState(state: PartitionState): PartitionStatus {
  switch (state) {
    case "in-progress":
    case "leased":
      return "leased";
    case "completed":
    case "complete":
      return "complete";
    case "blocked":
    case "quarantined":
      return "blocked";
    default:
      return state;
  }
}

function stateForStatus(status: PartitionStatus): PartitionState {
  switch (status) {
    case "leased":
      return "in-progress";
    case "complete":
      return "completed";
    default:
      return status;
  }
}

function isLeaseState(state: PartitionState): boolean {
  return state === "in-progress" || state === "leased";
}

/** Terminal and closure-safe states. Quarantine is deliberately not closure-safe. */
function isClosureSafeState(state: PartitionState): boolean {
  return (
    state === "completed" || state === "complete" || state === "blocked"
  );
}

function isQuarantinedState(state: PartitionState): boolean {
  return state === "quarantined";
}

function isMutableState(state: PartitionState): boolean {
  return !isClosureSafeState(state) && !isQuarantinedState(state);
}

function leaseExpired(lease: PartitionLease | undefined, at: string): boolean {
  return Boolean(lease && Date.parse(at) >= Date.parse(lease.expiresAt));
}

function extractWaveId(partitionId: PartitionId): number {
  const match = /^wave-(\d+)\//.exec(partitionId);
  return match ? Number(match[1]) : -1;
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function isNodeErrorWithCode(value: unknown, code: string): boolean {
  return (
    isRecord(value) &&
    typeof value.code === "string" &&
    value.code === code
  );
}

function assertNonEmpty(value: string, field: string): void {
  if (!value.trim()) throw new ManifestError(`${field} must be non-empty.`);
}

// ---------------------------------------------------------------------------
// Redaction, quarantine, canonical merge, and projections
// ---------------------------------------------------------------------------

const SENSITIVE_KEY_PATTERN =
  /(?:access[_-]?token|api[_-]?key|authorization|cookie|credential|email|jwt|password|phone|secret|session|ssn|token|user[_-]?id)/i;
const SENSITIVE_VALUE_PATTERN = /^(?:bearer\s+|eyJ[a-zA-Z0-9_-]+\.)/;

export interface RedactionResult {
  readonly value: unknown;
  readonly redactedPaths: readonly string[];
}

function redactValue(value: unknown, currentPath: string, paths: string[]): unknown {
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      redactValue(item, `${currentPath}[${index}]`, paths),
    );
  }
  if (!isRecord(value)) {
    if (typeof value === "string" && SENSITIVE_VALUE_PATTERN.test(value)) {
      paths.push(currentPath || "$");
      return "[REDACTED]";
    }
    return value;
  }

  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    const childPath = currentPath ? `${currentPath}.${key}` : key;
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      paths.push(childPath);
      output[key] = "[REDACTED]";
    } else {
      output[key] = redactValue(child, childPath, paths);
    }
  }
  return output;
}

/** Redact secrets and direct personal-data fields before any generated write. */
export function redactSensitiveRecord(value: unknown): RedactionResult {
  const redactedPaths: string[] = [];
  const redacted = redactValue(value, "", redactedPaths);
  return Object.freeze({
    value: redacted,
    redactedPaths: Object.freeze(sortedUnique(redactedPaths)),
  });
}

export interface QuarantinedRecord {
  readonly index: number;
  readonly stableId: string;
  readonly record: unknown;
  readonly diagnostics: readonly string[];
}

export interface RecordValidationResult {
  readonly valid: boolean;
  readonly diagnostics?: readonly string[];
}

export interface CanonicalMergeResult<T extends object> {
  readonly records: readonly T[];
  readonly duplicateIds: readonly string[];
  readonly conflictingIds: readonly string[];
}

const ID_KEYS = [
  "recordId",
  "inventoryId",
  "occurrenceId",
  "findingId",
  "evidenceId",
  "instanceId",
  "routeId",
  "shellId",
  "partitionId",
  "id",
] as const;

export function stableRecordId(value: unknown, fallbackIndex = 0): string {
  if (isRecord(value)) {
    for (const key of ID_KEYS) {
      const candidate = value[key];
      if (typeof candidate === "string" && candidate.trim()) {
        return `${key}:${candidate}`;
      }
    }
  }
  return `content:${sha256(canonicalJson(value))}:${fallbackIndex}`;
}

/** Merge adapter order independently by stable identity and canonical content. */
export function mergeCanonicalRecords<T extends object>(
  records: readonly T[],
): CanonicalMergeResult<T> {
  const byId = new Map<string, { record: T; serialized: string }>();
  const duplicateIds = new Set<string>();
  const conflictingIds = new Set<string>();

  records.forEach((record, index) => {
    const id = stableRecordId(record, index);
    const serialized = canonicalJson(record);
    const prior = byId.get(id);
    if (!prior) {
      byId.set(id, { record, serialized });
      return;
    }
    duplicateIds.add(id);
    if (prior.serialized !== serialized) {
      conflictingIds.add(id);
      if (serialized < prior.serialized) {
        byId.set(id, { record, serialized });
      }
    }
  });

  const entries = [...byId.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );
  return Object.freeze({
    records: Object.freeze(entries.map(([, entry]) => entry.record)),
    duplicateIds: Object.freeze([...duplicateIds].sort()),
    conflictingIds: Object.freeze([...conflictingIds].sort()),
  });
}

export function serializeCanonicalRecords(records: readonly object[]): string {
  const merged = mergeCanonicalRecords(records);
  if (merged.records.length === 0) return "";
  return `${merged.records.map((record) => canonicalJson(record)).join("\n")}\n`;
}

function csvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return canonicalJson(value);
}

function csvEscape(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function serializeCsvProjection(records: readonly object[]): string {
  const merged = mergeCanonicalRecords(records);
  const rows = merged.records.filter(isRecord);
  if (rows.length === 0) return "";
  const columns = sortedUnique(rows.flatMap((row) => Object.keys(row)));
  const lines = [columns.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(csvValue(row[column]))).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export interface PartitionArtifactWriteOptions {
  readonly csvPath?: string;
  readonly quarantinePath?: string;
  readonly redact?: boolean;
  readonly validateRecord?: (
    record: unknown,
    index: number,
  ) => RecordValidationResult;
}

export interface PartitionArtifactWriteResult {
  readonly path: string;
  readonly contentHash: string;
  readonly recordCount: number;
  readonly redactedValueCount: number;
  readonly quarantinedRecordCount: number;
  readonly duplicateIds: readonly string[];
  readonly conflictingIds: readonly string[];
  readonly quarantined: readonly QuarantinedRecord[];
  readonly csvPath?: string;
  readonly quarantinePath?: string;
}

async function writeAtomicFile(filePath: string, content: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}-${randomBytes(6).toString("hex")}`;
  try {
    await writeFile(temporaryPath, content, { encoding: "utf8", flag: "wx" });
    await rename(temporaryPath, filePath);
  } finally {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
  }
}

/**
 * Redact, validate, deterministically merge, and write one canonical NDJSON
 * partition. Invalid records are written only in redacted quarantine form.
 */
export async function writeCanonicalPartition<T extends object>(
  filePath: string,
  records: readonly T[],
  options: PartitionArtifactWriteOptions = {},
): Promise<PartitionArtifactWriteResult> {
  const validRecords: object[] = [];
  const quarantined: QuarantinedRecord[] = [];
  let redactedValueCount = 0;

  records.forEach((record, index) => {
    const validation = options.validateRecord?.(record, index);
    const redaction = options.redact === false
      ? { value: record, redactedPaths: [] as readonly string[] }
      : redactSensitiveRecord(record);
    redactedValueCount += redaction.redactedPaths.length;
    if (validation && !validation.valid) {
      quarantined.push({
        index,
        stableId: stableRecordId(record, index),
        record: redaction.value,
        diagnostics: Object.freeze([...(validation.diagnostics ?? ["Record failed validation."])]),
      });
      return;
    }
    if (isRecord(redaction.value)) validRecords.push(redaction.value);
  });

  const merged = mergeCanonicalRecords(validRecords);
  const content = serializeCanonicalRecords(merged.records);
  await writeAtomicFile(filePath, content);

  let csvPath: string | undefined;
  if (options.csvPath) {
    csvPath = options.csvPath;
    await writeAtomicFile(csvPath, serializeCsvProjection(merged.records));
  }

  let quarantinePath: string | undefined;
  if (options.quarantinePath && quarantined.length > 0) {
    quarantinePath = options.quarantinePath;
    await writeAtomicFile(
      quarantinePath,
      `${quarantined.map((entry) => canonicalJson(entry)).join("\n")}\n`,
    );
  }

  return Object.freeze({
    path: filePath,
    contentHash: sha256(content),
    recordCount: merged.records.length,
    redactedValueCount,
    quarantinedRecordCount: quarantined.length,
    duplicateIds: merged.duplicateIds,
    conflictingIds: merged.conflictingIds,
    quarantined: Object.freeze(quarantined),
    ...(csvPath ? { csvPath } : {}),
    ...(quarantinePath ? { quarantinePath } : {}),
  });
}

// ---------------------------------------------------------------------------
// Review queues
// ---------------------------------------------------------------------------

export type ReviewQueueKind =
  | "owner-decision"
  | "hindi"
  | "legal-content"
  | "provenance"
  | "quarantine"
  | "authorization";

export interface ReviewQueueEntry {
  readonly queueId?: string;
  readonly partitionId: PartitionId;
  readonly subjectId?: string;
  readonly kind?: ReviewQueueKind;
  readonly reason: string;
  readonly addedAt: string;
  readonly status?: "open" | "resolved";
  readonly resolvedAt?: string;
}

function reviewQueueId(
  partitionId: PartitionId,
  reason: string,
  subjectId: string | undefined,
  kind: ReviewQueueKind,
): string {
  return `RQ-${sha256([partitionId, subjectId ?? "", kind, reason].join("\u0000")).slice(0, 24)}`;
}

/** In-memory queue with deterministic IDs and optional durable persistence. */
export class ReviewQueue {
  private readonly entries: ReviewQueueEntry[];

  public constructor(initialEntries: readonly ReviewQueueEntry[] = []) {
    this.entries = initialEntries.map((entry) => ({
      ...entry,
      queueId:
        entry.queueId ??
        reviewQueueId(
          entry.partitionId,
          entry.reason,
          entry.subjectId,
          entry.kind ?? "owner-decision",
        ),
      kind: entry.kind ?? "owner-decision",
      status: entry.status ?? "open",
    }));
  }

  public enqueue(
    partitionId: PartitionId,
    reason: string,
    options: {
      readonly subjectId?: string;
      readonly kind?: ReviewQueueKind;
    } = {},
  ): ReviewQueueEntry {
    assertNonEmpty(reason, "Review reason");
    const kind = options.kind ?? "owner-decision";
    const entry: ReviewQueueEntry = Object.freeze({
      queueId: reviewQueueId(partitionId, reason, options.subjectId, kind),
      partitionId,
      ...(options.subjectId ? { subjectId: options.subjectId } : {}),
      kind,
      reason,
      addedAt: now(),
      status: "open",
    });
    const existing = this.entries.find((candidate) => candidate.queueId === entry.queueId);
    if (!existing) this.entries.push(entry);
    return existing ?? entry;
  }

  public resolve(queueId: string): boolean {
    const index = this.entries.findIndex((entry) => entry.queueId === queueId);
    if (index < 0) return false;
    this.entries[index] = Object.freeze({
      ...this.entries[index],
      status: "resolved",
      resolvedAt: now(),
    });
    return true;
  }

  public drain(): readonly ReviewQueueEntry[] {
    return Object.freeze(
      [...this.entries].sort((left, right) =>
        (left.queueId ?? "").localeCompare(right.queueId ?? ""),
      ),
    );
  }

  public get size(): number {
    return this.entries.length;
  }

  public async persist(filePath: string): Promise<void> {
    await writeAtomicFile(filePath, `${JSON.stringify({ entries: this.drain() }, null, 2)}\n`);
  }

  public static async load(filePath: string): Promise<ReviewQueue> {
    try {
      const raw = await readFile(filePath, "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed) || !Array.isArray(parsed.entries)) {
        throw new ManifestError(`Review queue is malformed: ${filePath}`);
      }
      const entries = parsed.entries.filter(isRecord).map((entry) => {
        if (
          typeof entry.partitionId !== "string" ||
          typeof entry.reason !== "string" ||
          typeof entry.addedAt !== "string"
        ) {
          throw new ManifestError(`Review queue entry is malformed: ${filePath}`);
        }
        return entry as unknown as ReviewQueueEntry;
      });
      return new ReviewQueue(entries);
    } catch (error) {
      if (isNodeErrorWithCode(error, "ENOENT")) return new ReviewQueue();
      throw error;
    }
  }
}

// ---------------------------------------------------------------------------
// ManifestStore
// ---------------------------------------------------------------------------

export class ManifestStore {
  private readonly manifestFilePath: string;
  private readonly repositoryRoot: string;
  private readonly config: AuditRunConfiguration;
  private readonly leaseTtlMs: number;
  private readonly lockTimeoutMs: number;
  private runManifest: RunManifest;

  private constructor(
    manifestFilePath: string,
    repositoryRoot: string,
    config: AuditRunConfiguration,
    runManifest: RunManifest,
    options: ManifestStoreOptions,
  ) {
    this.manifestFilePath = manifestFilePath;
    this.repositoryRoot = path.resolve(repositoryRoot);
    this.config = config;
    this.leaseTtlMs = options.leaseTtlMs ?? DEFAULT_LEASE_TTL_MS;
    this.lockTimeoutMs = options.lockTimeoutMs ?? DEFAULT_LOCK_TIMEOUT_MS;
    this.runManifest = runManifest;
  }

  /** Open a run manifest or create it without copying authored artifacts. */
  public static async open(
    repositoryRoot: string,
    immutableRunInputs: ImmutableRunInputs,
    config: AuditRunConfiguration,
    manifestFilePath: string,
    options: ManifestStoreOptions = {},
  ): Promise<ManifestStore> {
    const absolutePath = path.isAbsolute(manifestFilePath)
      ? manifestFilePath
      : path.resolve(repositoryRoot, manifestFilePath);
    const existing = await readRunManifestIfPresent(absolutePath);
    if (existing && existing.runId !== immutableRunInputs.runId) {
      throw new ManifestError(
        `On-disk manifest runId ${existing.runId} does not match requested runId ${immutableRunInputs.runId}.`,
      );
    }

    const timestamp = now();
    const manifestId = `M-${sha256(immutableRunInputs.runId).slice(0, 24)}`;
    const fresh: RunManifest = {
      recordType: "run-manifest",
      recordId: manifestId,
      manifestId,
      runId: immutableRunInputs.runId,
      auditId: immutableRunInputs.auditId,
      schemaVersion: immutableRunInputs.schemaVersion,
      repositoryRevision: immutableRunInputs.repositoryRevision,
      configurationHash: immutableRunInputs.configurationHash,
      sourceHashes: { ...(options.sourceHashes ?? {}) },
      toolVersions: { ...(options.toolVersions ?? {}) },
      inventoryGeneration: 0,
      partitions: [],
      waveManifests: [],
      reviewQueue: [],
      generatedArtifactReferences: [],
      authoredWorkReferences: [...(options.authoredWorkReferences ?? [])].sort(),
      changedPaths: [...(options.changedPaths ?? [])].sort(),
      ...(options.supersedesManifestId
        ? { supersedesManifestId: options.supersedesManifestId }
        : {}),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const store = new ManifestStore(
      absolutePath,
      repositoryRoot,
      config,
      existing ? normalizeRunManifest(existing, fresh) : fresh,
      options,
    );
    if (!existing) await store.persist();
    return store;
  }

  public getRunManifest(): RunManifest {
    return this.runManifest;
  }

  public getPartition(partitionId: PartitionId): PartitionManifest | undefined {
    return this.runManifest.partitions.find(
      (partition) => partition.partitionId === partitionId,
    );
  }

  public getWavePartitions(
    config: AuditRunConfiguration,
    waveId: number,
  ): readonly PartitionManifest[] {
    const wave = this.requireWave(config, waveId);
    const waveManifest = this.runManifest.waveManifests?.find(
      (candidate) => candidate.waveId === waveId,
    );
    const ownedIds = waveManifest?.ownedPartitionIds;
    const partitions = ownedIds && ownedIds.length > 0
      ? this.runManifest.partitions.filter((partition) => ownedIds.includes(partition.partitionId))
      : this.runManifest.partitions.filter(
          (partition) => partition.partitionId.startsWith(`wave-${wave.id}/`),
        );
    return Object.freeze(
      [...partitions].sort((left, right) =>
        left.partitionId.localeCompare(right.partitionId),
      ),
    );
  }

  public canSkip(
    partitionId: PartitionId,
    currentInputFingerprint: string,
  ): boolean {
    const partition = this.getPartition(partitionId);
    return Boolean(
      partition &&
        (partition.state === "completed" || partition.state === "complete") &&
        partition.inputFingerprint === currentInputFingerprint &&
        !partition.invalidatedAt,
    );
  }

  public async ensurePartition(
    partitionId: PartitionId,
    partitionPath: string,
    inputFingerprint: string,
    options: PartitionLeaseOptions = {},
  ): Promise<PartitionManifest> {
    assertNonEmpty(inputFingerprint, "Partition input fingerprint");
    return this.update(async () => {
      const existing = this.getPartition(partitionId);
      if (existing) {
        if (existing.inputFingerprint !== inputFingerprint && existing.state !== "pending") {
          this.invalidateInMemory(partitionId, ["Partition input fingerprint changed."]);
        }
        return this.getPartition(partitionId) ?? existing;
      }
      const created = this.createPendingPartition(
        partitionId,
        partitionPath,
        inputFingerprint,
        options,
      );
      this.replacePartition(created);
      return created;
    });
  }

  // -------------------------------------------------------------------------
  // Lease lifecycle
  // -------------------------------------------------------------------------

  public async acquireLease(
    partitionId: PartitionId,
    writerId: string,
    partitionPath: string,
    inputFingerprint: string,
    supersedesPartitionId?: PartitionId,
    options: PartitionLeaseOptions = {},
  ): Promise<PartitionManifest> {
    assertNonEmpty(writerId, "Writer ID");
    assertNonEmpty(inputFingerprint, "Partition input fingerprint");
    return this.update(async () => {
      let existing = this.getPartition(partitionId);
      const timestamp = now();

      if (
        existing &&
        (existing.state === "completed" || existing.state === "complete") &&
        existing.inputFingerprint === inputFingerprint
      ) {
        return existing;
      }
      if (existing && isQuarantinedState(existing.state)) return existing;
      if (existing && existing.state === "blocked") return existing;

      if (existing && isLeaseState(existing.state) && existing.lease) {
        if (!leaseExpired(existing.lease, timestamp)) {
          if (existing.lease.writerId !== writerId) {
            throw new LeaseConflictError(partitionId, existing.lease.writerId);
          }
          const renewed = this.withLease(existing, writerId, timestamp);
          this.replacePartition(renewed);
          return renewed;
        }
        existing = this.replaceAsPending(existing);
        this.replacePartition(existing);
      }

      if (existing && existing.inputFingerprint !== inputFingerprint) {
        this.invalidateInMemory(partitionId, ["Partition input fingerprint changed before resume."]);
        existing = this.getPartition(partitionId);
      }

      const dependencies = normalizeDependencies(
        options.dependencyPartitionIds ?? existing?.dependencyPartitionIds ?? [],
      );
      const dependencyFingerprints = {
        ...(existing?.dependencyFingerprints ?? {}),
        ...(options.dependencyFingerprints ?? {}),
      };
      const leased: PartitionManifest = {
        partitionId,
        path: partitionPath,
        contentHash: existing?.contentHash ?? EMPTY_CONTENT_HASH,
        recordCount: existing?.recordCount ?? 0,
        state: "in-progress",
        status: "leased",
        inputFingerprint,
        dependencyPartitionIds: dependencies,
        dependencyFingerprints,
        ...(supersedesPartitionId ? { supersedesPartitionId } : {}),
        lease: {
          writerId,
          acquiredAt: timestamp,
          heartbeatAt: timestamp,
          expiresAt: new Date(Date.parse(timestamp) + this.leaseTtlMs).toISOString(),
        },
        inventoryGeneration:
          options.inventoryGeneration ?? this.runManifest.inventoryGeneration,
        ...(options.reviewQueueIds ? { reviewQueueIds: [...options.reviewQueueIds] } : {}),
        updatedAt: timestamp,
      };
      this.replacePartition(leased);
      return leased;
    });
  }

  public async renewHeartbeat(
    partitionId: PartitionId,
    writerId: string,
  ): Promise<PartitionManifest> {
    return this.update(async () => {
      const existing = this.requirePartition(partitionId);
      this.assertLeaseOwner(existing, writerId);
      if (leaseExpired(existing.lease, now())) throw new LeaseExpiredError(partitionId);
      const renewed = this.withLease(existing, writerId, now());
      this.replacePartition(renewed);
      return renewed;
    });
  }

  public async releaseLease(
    partitionId: PartitionId,
    writerId: string,
  ): Promise<PartitionManifest> {
    return this.update(async () => {
      const existing = this.requirePartition(partitionId);
      if (!isLeaseState(existing.state)) return existing;
      this.assertLeaseOwner(existing, writerId);
      const released: PartitionManifest = {
        ...existing,
        state: "pending",
        status: "pending",
        lease: undefined,
        updatedAt: now(),
      };
      this.replacePartition(released);
      return released;
    });
  }

  public async recoverStaleLease(
    partitionId: PartitionId,
  ): Promise<PartitionManifest> {
    return this.update(async () => {
      const existing = this.requirePartition(partitionId);
      if (!isLeaseState(existing.state) || !existing.lease) {
        throw new ManifestError(
          `Cannot recover stale lease: partition ${partitionId} is not leased.`,
        );
      }
      if (!leaseExpired(existing.lease, now())) {
        throw new ManifestError(`Lease for partition ${partitionId} has not expired.`);
      }
      const recovered = this.replaceAsPending(existing);
      this.replacePartition(recovered);
      return recovered;
    });
  }

  // -------------------------------------------------------------------------
  // Canonical partition writes and terminal states
  // -------------------------------------------------------------------------

  public async writePartitionData<T extends object>(
    partitionId: PartitionId,
    writerId: string,
    records: readonly T[],
    options: PartitionArtifactWriteOptions & {
      readonly partitionPath?: string;
      readonly inputFingerprint?: string;
      readonly complete?: boolean;
    } = {},
  ): Promise<PartitionManifest> {
    return this.update(async () => {
      const existing = this.requirePartition(partitionId);
      this.assertLeaseOwner(existing, writerId);
      if (leaseExpired(existing.lease, now())) throw new LeaseExpiredError(partitionId);
      if (
        options.inputFingerprint !== undefined &&
        options.inputFingerprint !== existing.inputFingerprint
      ) {
        return this.invalidateInMemory(partitionId, ["Input fingerprint changed during partition write."]);
      }

      const dataPath = this.resolvePartitionArtifactPath(
        options.partitionPath ?? existing.path,
      );
      const quarantinePath = options.quarantinePath
        ? this.resolvePartitionArtifactPath(options.quarantinePath)
        : undefined;
      const csvPath = options.csvPath
        ? this.resolvePartitionArtifactPath(options.csvPath)
        : undefined;
      const result = await writeCanonicalPartition(dataPath, records, {
        ...options,
        ...(csvPath ? { csvPath } : {}),
        ...(quarantinePath ? { quarantinePath } : {}),
      });
      const persistedPath = this.repositoryRelativeOrOriginal(dataPath);
      const timestamp = now();
      const reviewIds = [...(existing.reviewQueueIds ?? [])];
      let state: PartitionState = options.complete === false
        ? "in-progress"
        : "completed";
      let status: PartitionStatus = options.complete === false ? "leased" : "complete";
      let blocker = existing.blocker;
      let quarantineReason = existing.quarantineReason;
      if (result.quarantinedRecordCount > 0) {
        state = "quarantined";
        status = "blocked";
        quarantineReason = "One or more records failed schema validation and were quarantined.";
        const queueEntry = this.enqueueReviewInMemory(
          partitionId,
          quarantineReason,
          "quarantine",
        );
        reviewIds.push(queueEntry.queueId ?? "");
      }
      const completed: PartitionManifest = {
        ...existing,
        path: persistedPath,
        contentHash: result.contentHash,
        recordCount: result.recordCount,
        state,
        status,
        lease: state === "in-progress" ? existing.lease : undefined,
        blocker,
        ...(quarantineReason ? { quarantineReason } : {}),
        quarantinedRecordCount: result.quarantinedRecordCount,
        redactedValueCount: result.redactedValueCount,
        ...(result.csvPath ? { csvPath: this.repositoryRelativeOrOriginal(result.csvPath) } : {}),
        reviewQueueIds: sortedUnique(reviewIds),
        updatedAt: timestamp,
      };
      this.replacePartition(completed);
      return completed;
    });
  }

  public async markCompleted(
    partitionId: PartitionId,
    writerId: string,
    contentHash: string,
    recordCount: number,
    currentInputFingerprint: string,
  ): Promise<PartitionManifest> {
    return this.update(async () => {
      const existing = this.requirePartition(partitionId);
      this.assertLeaseOwner(existing, writerId);
      if (leaseExpired(existing.lease, now())) throw new LeaseExpiredError(partitionId);
      if (existing.inputFingerprint !== currentInputFingerprint) {
        return this.invalidateInMemory(partitionId, [
          `Input fingerprint changed during write: was ${existing.inputFingerprint}, now ${currentInputFingerprint}`,
        ]);
      }
      const completed: PartitionManifest = {
        ...existing,
        contentHash,
        recordCount,
        state: "completed",
        status: "complete",
        lease: undefined,
        updatedAt: now(),
      };
      this.replacePartition(completed);
      return completed;
    });
  }

  public async markBlocked(
    partitionId: PartitionId,
    writerId: string,
    blocker: PartitionBlocker,
  ): Promise<PartitionManifest> {
    assertNonEmpty(blocker.detail, "Blocker detail");
    assertNonEmpty(blocker.pendingOperation, "Pending operation");
    return this.update(async () => {
      const existing = this.requirePartition(partitionId);
      this.assertLeaseOwner(existing, writerId);
      const blocked: PartitionManifest = {
        ...existing,
        state: "blocked",
        status: "blocked",
        blocker,
        lease: undefined,
        updatedAt: now(),
      };
      this.replacePartition(blocked);
      return blocked;
    });
  }

  public async quarantinePartition(
    partitionId: PartitionId,
    writerId: string,
    reason: string,
  ): Promise<PartitionManifest> {
    assertNonEmpty(reason, "Quarantine reason");
    return this.update(async () => {
      const existing = this.requirePartition(partitionId);
      this.assertLeaseOwner(existing, writerId);
      const queueEntry = this.enqueueReviewInMemory(partitionId, reason, "quarantine");
      const quarantined: PartitionManifest = {
        ...existing,
        state: "quarantined",
        status: "blocked",
        quarantineReason: reason,
        reviewQueueIds: sortedUnique([...(existing.reviewQueueIds ?? []), queueEntry.queueId ?? ""]),
        lease: undefined,
        updatedAt: now(),
      };
      this.replacePartition(quarantined);
      return quarantined;
    });
  }

  // -------------------------------------------------------------------------
  // Invalidation and generations
  // -------------------------------------------------------------------------

  public async invalidatePartition(
    partitionId: PartitionId,
    reasons: readonly string[] = [],
  ): Promise<PartitionManifest> {
    return this.update(async () => this.invalidateInMemory(partitionId, reasons));
  }

  public async invalidateByFingerprints(
    changed: readonly { readonly partitionId: PartitionId; readonly inputFingerprint: string }[],
  ): Promise<readonly PartitionId[]> {
    return this.update(async () => {
      const invalidated: PartitionId[] = [];
      for (const change of changed) {
        const existing = this.getPartition(change.partitionId);
        if (existing && existing.inputFingerprint !== change.inputFingerprint) {
          this.invalidateInMemory(change.partitionId, ["Input fingerprint changed."]);
          invalidated.push(change.partitionId);
        }
      }
      return Object.freeze(invalidated);
    });
  }

  public async bumpInventoryGeneration(
    changedPartitionIds: readonly PartitionId[] = [],
  ): Promise<number> {
    return this.update(async () => {
      for (const partitionId of changedPartitionIds) {
        if (this.getPartition(partitionId)) {
          this.invalidateInMemory(partitionId, ["Inventory generation changed."]);
        }
      }
      const next = this.runManifest.inventoryGeneration + 1;
      this.runManifest = {
        ...this.runManifest,
        inventoryGeneration: next,
        updatedAt: now(),
      };
      return next;
    });
  }

  // -------------------------------------------------------------------------
  // Metadata and references
  // -------------------------------------------------------------------------

  public async setSourceHash(sourceKey: string, hash: string): Promise<void> {
    assertNonEmpty(sourceKey, "Source key");
    assertNonEmpty(hash, "Source hash");
    await this.update(async () => {
      this.runManifest = {
        ...this.runManifest,
        sourceHashes: { ...this.runManifest.sourceHashes, [sourceKey]: hash },
      };
    });
  }

  public async setToolVersion(toolKey: string, version: string): Promise<void> {
    assertNonEmpty(toolKey, "Tool key");
    assertNonEmpty(version, "Tool version");
    await this.update(async () => {
      this.runManifest = {
        ...this.runManifest,
        toolVersions: { ...this.runManifest.toolVersions, [toolKey]: version },
      };
    });
  }

  public async addAuthoredWorkReference(repositoryRelativePath: string): Promise<void> {
    const reference = this.validateAuthoredReference(repositoryRelativePath);
    await this.update(async () => {
      this.runManifest = {
        ...this.runManifest,
        authoredWorkReferences: sortedUnique([
          ...this.runManifest.authoredWorkReferences,
          reference,
        ]),
      };
    });
  }

  public async addGeneratedArtifactReference(repositoryRelativePath: string): Promise<void> {
    const reference = this.validateGeneratedReference(repositoryRelativePath);
    await this.update(async () => {
      this.runManifest = {
        ...this.runManifest,
        generatedArtifactReferences: sortedUnique([
          ...(this.runManifest.generatedArtifactReferences ?? []),
          reference,
        ]),
      };
    });
  }

  public async setChangedPaths(paths: readonly string[]): Promise<void> {
    await this.update(async () => {
      this.runManifest = {
        ...this.runManifest,
        changedPaths: sortedUnique(paths),
      };
    });
  }

  public async setSupersedesManifestId(supersedesManifestId: string): Promise<void> {
    assertNonEmpty(supersedesManifestId, "Superseded manifest ID");
    await this.update(async () => {
      this.runManifest = { ...this.runManifest, supersedesManifestId };
    });
  }

  public async enqueueReview(
    partitionId: PartitionId,
    reason: string,
    options: { readonly subjectId?: string; readonly kind?: ReviewQueueKind } = {},
  ): Promise<ReviewQueueEntry> {
    return this.update(async () => this.enqueueReviewInMemory(partitionId, reason, options.kind ?? "owner-decision", options.subjectId));
  }

  public async resolveReview(queueId: string): Promise<boolean> {
    return this.update(async () => {
      const queue = new ReviewQueue(this.runManifest.reviewQueue ?? []);
      const resolved = queue.resolve(queueId);
      if (resolved) this.runManifest = { ...this.runManifest, reviewQueue: queue.drain() };
      return resolved;
    });
  }

  public async save(): Promise<void> {
    await this.persist();
  }

  // -------------------------------------------------------------------------
  // Wave control
  // -------------------------------------------------------------------------

  public checkWaveEntry(
    config: AuditRunConfiguration,
    waveId: number,
    context: WaveCriteriaContext = {},
  ): void {
    const wave = this.requireWave(config, waveId);
    const unmet: string[] = [];
    for (const dependencyWaveId of wave.dependencies) {
      const dependencyPartitions = this.runManifest.partitions.filter(
        (partition) => extractWaveId(partition.partitionId) === dependencyWaveId,
      );
      const dependencyManifest = this.runManifest.waveManifests?.find(
        (candidate) => candidate.waveId === dependencyWaveId,
      );
      if (dependencyPartitions.length === 0 && dependencyManifest?.status !== "complete") {
        unmet.push(`Wave ${dependencyWaveId} has no recorded partitions.`);
        continue;
      }
      const unfinished = dependencyPartitions.filter(
        (partition) => !isClosureSafeState(partition.state),
      );
      if (unfinished.length > 0 || dependencyManifest?.status === "invalidated") {
        unmet.push(
          `Wave ${dependencyWaveId} has unfinished or invalidated partitions: ${unfinished
            .map((partition) => partition.partitionId)
            .join(", ")}`,
        );
      }
    }
    for (const criterion of wave.entryCriteria) {
      const observed = context.entryCriteria?.[criterion];
      if (observed === false) unmet.push(criterion);
    }
    if (unmet.length > 0) throw new WaveEntryCriteriaError(waveId, unmet);
  }

  public async startWave(
    config: AuditRunConfiguration,
    waveId: number,
    context: WaveCriteriaContext = {},
  ): Promise<WaveManifest> {
    this.checkWaveEntry(config, waveId, context);
    return this.update(async () => {
      const wave = this.requireWave(config, waveId);
      const existing = this.runManifest.waveManifests?.find(
        (candidate) => candidate.waveId === waveId,
      );
      const ownedPartitionIds = sortedPartitionIds(
        context.ownedPartitionIds ??
          existing?.ownedPartitionIds ??
          this.runManifest.partitions
            .filter((partition) => partition.partitionId.startsWith(`wave-${waveId}/`))
            .map((partition) => partition.partitionId),
      );
      const manifest: WaveManifest = {
        waveId,
        runId: this.runManifest.runId,
        status: "in-progress",
        entryCriteriaMet: true,
        exitCriteriaText: wave.exitCriteria,
        ownedPartitionIds,
        authorizationRequirement: wave.authorization,
        updatedAt: now(),
        ...(context.inputFingerprint ? { inputFingerprint: context.inputFingerprint } : {}),
        inventoryGeneration: context.inventoryGeneration ?? this.runManifest.inventoryGeneration,
      };
      this.replaceWaveManifest(manifest);
      return manifest;
    });
  }

  public checkWaveExit(config: AuditRunConfiguration, waveId: number): void {
    const wavePartitions = this.getWavePartitions(config, waveId);
    const nonterminal = wavePartitions
      .filter((partition) => !isClosureSafeState(partition.state) || Boolean(partition.lease))
      .map((partition) => partition.partitionId);
    if (wavePartitions.length === 0) {
      throw new WaveExitCriteriaError(waveId, [toPartitionId(`wave-${waveId}/<no-owned-partitions>`)]]);
    }
    if (nonterminal.length > 0) throw new WaveExitCriteriaError(waveId, nonterminal);
  }

  public async completeWave(
    config: AuditRunConfiguration,
    waveId: number,
  ): Promise<WaveManifest> {
    this.checkWaveExit(config, waveId);
    return this.update(async () => {
      const wave = this.requireWave(config, waveId);
      const prior = this.runManifest.waveManifests?.find(
        (candidate) => candidate.waveId === waveId,
      );
      const ownedPartitionIds = prior?.ownedPartitionIds ??
        this.getWavePartitions(config, waveId).map((partition) => partition.partitionId);
      const complete: WaveManifest = {
        waveId,
        runId: this.runManifest.runId,
        status: "complete",
        entryCriteriaMet: prior?.entryCriteriaMet ?? true,
        exitCriteriaText: wave.exitCriteria,
        ownedPartitionIds: sortedPartitionIds(ownedPartitionIds),
        authorizationRequirement: wave.authorization,
        updatedAt: now(),
        inputFingerprint: prior?.inputFingerprint,
        inventoryGeneration: this.runManifest.inventoryGeneration,
        checkpointId: prior?.checkpointId,
      };
      this.replaceWaveManifest(complete);
      return complete;
    });
  }

  public async invalidateWave(waveId: number, reason: string): Promise<void> {
    assertNonEmpty(reason, "Wave invalidation reason");
    await this.update(async () => {
      const prior = this.runManifest.waveManifests?.find(
        (candidate) => candidate.waveId === waveId,
      );
      if (prior) {
        this.replaceWaveManifest({
          ...prior,
          status: "invalidated",
          exitCriteriaText: [...prior.exitCriteriaText, reason],
          updatedAt: now(),
        });
      }
      const partitions = this.runManifest.partitions.filter(
        (partition) => extractWaveId(partition.partitionId) === waveId,
      );
      for (const partition of partitions) {
        this.invalidateInMemory(partition.partitionId, [reason]);
      }
    });
  }

  public createWaveCheckpoint(
    config: AuditRunConfiguration,
    waveId: number,
  ): WaveCheckpointRecord {
    const wave = this.requireWave(config, waveId);
    const partitions = this.getWavePartitions(config, waveId);
    const terminalItemCount = partitions.filter((partition) =>
      isClosureSafeState(partition.state),
    ).length;
    const quarantineCount = partitions.filter((partition) =>
      isQuarantinedState(partition.state),
    ).length;
    const nonTerminalCount = partitions.length - terminalItemCount;
    const waveManifest = this.runManifest.waveManifests?.find(
      (candidate) => candidate.waveId === waveId,
    );
    const status: WaveCheckpointRecord["status"] =
      nonTerminalCount > 0
        ? "blocked"
        : waveManifest?.status === "complete"
          ? "complete"
          : "leased";
    const checkpointId = `W-${sha256(`${this.runManifest.runId}:${waveId}:${this.runManifest.inventoryGeneration}`).slice(0, 24)}`;
    return Object.freeze({
      recordType: "wave-checkpoint",
      recordId: checkpointId,
      createdAt: now(),
      checkpointId,
      runId: this.runManifest.runId,
      waveId,
      status,
      entryCriteriaMet: waveManifest?.entryCriteriaMet ?? wave.dependencies.length === 0,
      exitCriteria: wave.exitCriteria,
      dependencyWaveIds: wave.dependencies.map(String),
      ownedPartitionIds: partitions.map((partition) => partition.partitionId).sort(),
      ownedOutputPaths: wave.ownedOutputs.map((purpose) =>
        `${this.config.artifactPaths.generatedRoot}/${this.runManifest.runId}/${purpose}`,
      ),
      authorizationRequirement: wave.authorization,
      heartbeatAt: waveManifest?.updatedAt,
      inputFingerprint:
        waveManifest?.inputFingerprint ??
        computeFingerprint(partitions.map((partition) => partition.inputFingerprint)),
      inventoryGeneration: this.runManifest.inventoryGeneration,
      terminalItemCount,
      ownedItemCount: partitions.length,
      quarantineCount,
      nonTerminalCount,
    });
  }

  // -------------------------------------------------------------------------
  // Store internals
  // -------------------------------------------------------------------------

  private async update<T>(callback: () => Promise<T>): Promise<T> {
    return this.withManifestLock(async () => {
      const result = await callback();
      this.runManifest = { ...this.runManifest, updatedAt: now() };
      await this.persistUnlocked();
      return result;
    });
  }

  private async persist(): Promise<void> {
    await this.withManifestLock(async () => {
      await this.persistUnlocked();
    });
  }

  private async withManifestLock<T>(callback: () => Promise<T>): Promise<T> {
    await mkdir(path.dirname(this.manifestFilePath), { recursive: true });
    const lockPath = `${this.manifestFilePath}.lock`;
    const deadline = Date.now() + this.lockTimeoutMs;
    let acquired = false;
    while (!acquired) {
      try {
        await mkdir(lockPath);
        acquired = true;
      } catch (error) {
        if (!isNodeErrorWithCode(error, "EEXIST")) throw error;
        try {
          const lockStats = await stat(lockPath);
          if (Date.now() - lockStats.mtimeMs > this.leaseTtlMs) {
            await rm(lockPath, { recursive: true, force: true });
            continue;
          }
        } catch (statError) {
          if (!isNodeErrorWithCode(statError, "ENOENT")) throw statError;
        }
        if (Date.now() >= deadline) {
          throw new ManifestError(`Timed out acquiring manifest writer lock: ${lockPath}`);
        }
        await new Promise<void>((resolve) => setTimeout(resolve, 10));
      }
    }

    try {
      await this.reloadFromDisk();
      return await callback();
    } finally {
      await rm(lockPath, { recursive: true, force: true });
    }
  }

  private async reloadFromDisk(): Promise<void> {
    const latest = await readRunManifestIfPresent(this.manifestFilePath);
    if (!latest) return;
    if (latest.runId !== this.runManifest.runId) {
      throw new ManifestError(
        `On-disk manifest runId ${latest.runId} does not match this store runId ${this.runManifest.runId}.`,
      );
    }
    this.runManifest = normalizeRunManifest(latest, this.runManifest);
  }

  private async persistUnlocked(): Promise<void> {
    const serialized = `${JSON.stringify(this.runManifest, null, 2)}\n`;
    await writeAtomicFile(this.manifestFilePath, serialized);
  }

  private requirePartition(partitionId: PartitionId): PartitionManifest {
    const partition = this.getPartition(partitionId);
    if (!partition) throw new ManifestError(`Partition not found: ${partitionId}`);
    return partition;
  }

  private requireWave(config: AuditRunConfiguration, waveId: number): AuditWaveConfiguration {
    const wave = config.waves.find((candidate) => candidate.id === waveId);
    if (!wave) throw new ManifestError(`Unknown wave ID: ${waveId}`);
    return wave;
  }

  private replacePartition(partition: PartitionManifest): void {
    const partitions = this.runManifest.partitions.filter(
      (candidate) => candidate.partitionId !== partition.partitionId,
    );
    this.runManifest = {
      ...this.runManifest,
      partitions: Object.freeze(
        [...partitions, partition].sort((left, right) =>
          left.partitionId.localeCompare(right.partitionId),
        ),
      ),
    };
  }

  private replaceWaveManifest(waveManifest: WaveManifest): void {
    const waveManifests = this.runManifest.waveManifests ?? [];
    this.runManifest = {
      ...this.runManifest,
      waveManifests: Object.freeze([
        ...waveManifests.filter((candidate) => candidate.waveId !== waveManifest.waveId),
        waveManifest,
      ].sort((left, right) => left.waveId - right.waveId)),
    };
  }

  private createPendingPartition(
    partitionId: PartitionId,
    partitionPath: string,
    inputFingerprint: string,
    options: PartitionLeaseOptions,
  ): PartitionManifest {
    return {
      partitionId,
      path: partitionPath,
      contentHash: EMPTY_CONTENT_HASH,
      recordCount: 0,
      state: "pending",
      status: "pending",
      inputFingerprint,
      dependencyPartitionIds: normalizeDependencies(options.dependencyPartitionIds ?? []),
      dependencyFingerprints: { ...(options.dependencyFingerprints ?? {}) },
      inventoryGeneration: options.inventoryGeneration ?? this.runManifest.inventoryGeneration,
      ...(options.reviewQueueIds ? { reviewQueueIds: [...options.reviewQueueIds] } : {}),
      updatedAt: now(),
    };
  }

  private replaceAsPending(partition: PartitionManifest): PartitionManifest {
    return {
      ...partition,
      state: "pending",
      status: "pending",
      lease: undefined,
      invalidatedAt: undefined,
      invalidationReasons: undefined,
      updatedAt: now(),
    };
  }

  private withLease(
    partition: PartitionManifest,
    writerId: string,
    timestamp: string,
  ): PartitionManifest {
    return {
      ...partition,
      state: "in-progress",
      status: "leased",
      lease: {
        writerId,
        acquiredAt: partition.lease?.acquiredAt ?? timestamp,
        heartbeatAt: timestamp,
        expiresAt: new Date(Date.parse(timestamp) + this.leaseTtlMs).toISOString(),
      },
      updatedAt: timestamp,
    };
  }

  private assertLeaseOwner(partition: PartitionManifest, writerId: string): void {
    if (!isLeaseState(partition.state) || !partition.lease) {
      throw new ManifestError(
        `Partition ${partition.partitionId} is not leased by a writer.`,
      );
    }
    if (partition.lease.writerId !== writerId) {
      throw new LeaseConflictError(partition.partitionId, partition.lease.writerId);
    }
  }

  private invalidateInMemory(
    partitionId: PartitionId,
    reasons: readonly string[],
  ): PartitionManifest {
    const queue: PartitionId[] = [partitionId];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId || visited.has(currentId)) continue;
      visited.add(currentId);
      const current = this.getPartition(currentId);
      if (!current) throw new ManifestError(`Partition not found: ${currentId}`);
      const invalidated: PartitionManifest = {
        ...current,
        state: "invalidated",
        status: "invalidated",
        lease: undefined,
        invalidatedAt: now(),
        invalidationReasons: sortedUnique([
          ...(current.invalidationReasons ?? []),
          ...reasons,
        ]),
        updatedAt: now(),
      };
      this.replacePartition(invalidated);
      for (const candidate of this.runManifest.partitions) {
        if (candidate.partitionId === currentId || visited.has(candidate.partitionId)) continue;
        if (dependsOn(candidate, current)) queue.push(candidate.partitionId);
      }
    }
    return this.requirePartition(partitionId);
  }

  private enqueueReviewInMemory(
    partitionId: PartitionId,
    reason: string,
    kind: ReviewQueueKind,
    subjectId?: string,
  ): ReviewQueueEntry {
    const queue = new ReviewQueue(this.runManifest.reviewQueue ?? []);
    const entry = queue.enqueue(partitionId, reason, { kind, subjectId });
    this.runManifest = { ...this.runManifest, reviewQueue: queue.drain() };
    return entry;
  }

  private resolvePartitionArtifactPath(requestedPath: string): string {
    if (path.isAbsolute(requestedPath)) return path.resolve(requestedPath);
    const normalized = requestedPath.replaceAll("\\", "/");
    if (normalized.startsWith(`${this.config.artifactPaths.generatedRoot}/`)) {
      return resolveApprovedArtifactPath(
        this.repositoryRoot,
        normalized,
        this.config,
        this.runManifest.runId,
      ).absolutePath;
    }
    return path.resolve(path.dirname(this.manifestFilePath), normalized);
  }

  private repositoryRelativeOrOriginal(absolutePath: string): string {
    const relative = path.relative(this.repositoryRoot, absolutePath).replaceAll("\\", "/");
    if (relative && relative !== ".." && !relative.startsWith("../") && !path.isAbsolute(relative)) {
      return relative;
    }
    return absolutePath;
  }

  private validateAuthoredReference(reference: string): string {
    return resolveApprovedArtifactPath(this.repositoryRoot, reference, this.config).relativePath;
  }

  private validateGeneratedReference(reference: string): string {
    return resolveApprovedArtifactPath(
      this.repositoryRoot,
      reference,
      this.config,
      this.runManifest.runId,
    ).relativePath;
  }
}

function normalizeDependencies(
  values: readonly PartitionId[],
): readonly PartitionId[] {
  return Object.freeze(
    [...new Set(values.map((value) => String(value)))].sort().map(toPartitionId),
  );
}

function sortedPartitionIds(values: readonly PartitionId[]): readonly PartitionId[] {
  return Object.freeze(
    [...new Set(values.map((value) => String(value)))].sort().map(toPartitionId),
  );
}

function dependsOn(candidate: PartitionManifest, upstream: PartitionManifest): boolean {
  if (candidate.dependencyPartitionIds?.includes(upstream.partitionId)) return true;
  if (candidate.supersedesPartitionId === upstream.partitionId) return true;
  const expected = candidate.dependencyFingerprints?.[upstream.partitionId];
  return expected !== undefined && expected !== upstream.inputFingerprint;
}

function normalizePartition(value: unknown): PartitionManifest {
  if (!isRecord(value)) throw new ManifestError("Partition manifest entry is malformed.");
  const partitionId = value.partitionId;
  const stateValue = value.state;
  const statusValue = value.status;
  if (typeof partitionId !== "string" || typeof value.path !== "string") {
    throw new ManifestError("Partition manifest requires partitionId and path.");
  }
  const state: PartitionState = typeof stateValue === "string"
    ? stateValue as PartitionState
    : typeof statusValue === "string"
      ? stateForStatus(statusValue as PartitionStatus)
      : "pending";
  const status: PartitionStatus = typeof statusValue === "string"
    ? statusValue as PartitionStatus
    : statusForState(state);
  return {
    partitionId: toPartitionId(partitionId),
    path: value.path,
    contentHash: typeof value.contentHash === "string" && value.contentHash
      ? value.contentHash
      : EMPTY_CONTENT_HASH,
    recordCount: typeof value.recordCount === "number" ? value.recordCount : 0,
    state,
    status,
    inputFingerprint: typeof value.inputFingerprint === "string" ? value.inputFingerprint : EMPTY_CONTENT_HASH,
    dependencyPartitionIds: Array.isArray(value.dependencyPartitionIds)
      ? normalizeDependencies(value.dependencyPartitionIds.filter((item): item is PartitionId => typeof item === "string").map(toPartitionId))
      : [],
    dependencyFingerprints: isRecord(value.dependencyFingerprints)
      ? Object.fromEntries(
          Object.entries(value.dependencyFingerprints).filter(
            ([key, item]) => typeof item === "string" && key.trim(),
          ),
        )
      : {},
    ...(typeof value.supersedesPartitionId === "string"
      ? { supersedesPartitionId: toPartitionId(value.supersedesPartitionId) }
      : {}),
    ...(isRecord(value.lease) && typeof value.lease.writerId === "string" && typeof value.lease.heartbeatAt === "string" && typeof value.lease.expiresAt === "string"
      ? {
          lease: {
            writerId: value.lease.writerId,
            ...(typeof value.lease.acquiredAt === "string" ? { acquiredAt: value.lease.acquiredAt } : {}),
            heartbeatAt: value.lease.heartbeatAt,
            expiresAt: value.lease.expiresAt,
          },
        }
      : {}),
    ...(isRecord(value.blocker) ? { blocker: value.blocker as unknown as PartitionBlocker } : {}),
    ...(typeof value.quarantineReason === "string" ? { quarantineReason: value.quarantineReason } : {}),
    ...(typeof value.quarantinedRecordCount === "number" ? { quarantinedRecordCount: value.quarantinedRecordCount } : {}),
    ...(typeof value.redactedValueCount === "number" ? { redactedValueCount: value.redactedValueCount } : {}),
    ...(typeof value.csvPath === "string" ? { csvPath: value.csvPath } : {}),
    ...(Array.isArray(value.reviewQueueIds) ? { reviewQueueIds: value.reviewQueueIds.filter((item): item is string => typeof item === "string") } : {}),
    ...(typeof value.inventoryGeneration === "number" ? { inventoryGeneration: value.inventoryGeneration } : {}),
    ...(typeof value.invalidatedAt === "string" ? { invalidatedAt: value.invalidatedAt } : {}),
    ...(Array.isArray(value.invalidationReasons) ? { invalidationReasons: value.invalidationReasons.filter((item): item is string => typeof item === "string") } : {}),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now(),
  };
}

function normalizeRunManifest(value: RunManifest, fallback: RunManifest): RunManifest {
  const raw = value as unknown as Record<string, unknown>;
  const partitions = Array.isArray(raw.partitions)
    ? raw.partitions.map(normalizePartition)
    : [];
  const waves = Array.isArray(raw.waveManifests)
    ? raw.waveManifests.filter(isRecord).map((wave) => wave as unknown as WaveManifest)
    : fallback.waveManifests ?? [];
  const queue = Array.isArray(raw.reviewQueue)
    ? raw.reviewQueue.filter(isRecord).map((entry) => entry as unknown as ReviewQueueEntry)
    : fallback.reviewQueue ?? [];
  return {
    ...fallback,
    ...value,
    recordType: "run-manifest",
    recordId: typeof raw.recordId === "string" ? raw.recordId : fallback.recordId,
    manifestId: typeof raw.manifestId === "string" ? raw.manifestId : fallback.manifestId,
    sourceHashes: isRecord(raw.sourceHashes)
      ? Object.fromEntries(Object.entries(raw.sourceHashes).filter(([, item]) => typeof item === "string"))
      : fallback.sourceHashes,
    toolVersions: isRecord(raw.toolVersions)
      ? Object.fromEntries(Object.entries(raw.toolVersions).filter(([, item]) => typeof item === "string"))
      : fallback.toolVersions,
    inventoryGeneration: typeof raw.inventoryGeneration === "number"
      ? raw.inventoryGeneration
      : fallback.inventoryGeneration,
    partitions,
    waveManifests: waves,
    reviewQueue: new ReviewQueue(queue).drain(),
    generatedArtifactReferences: Array.isArray(raw.generatedArtifactReferences)
      ? raw.generatedArtifactReferences.filter((item): item is string => typeof item === "string")
      : fallback.generatedArtifactReferences ?? [],
    authoredWorkReferences: Array.isArray(raw.authoredWorkReferences)
      ? raw.authoredWorkReferences.filter((item): item is string => typeof item === "string")
      : fallback.authoredWorkReferences,
    changedPaths: Array.isArray(raw.changedPaths)
      ? raw.changedPaths.filter((item): item is string => typeof item === "string").sort()
      : fallback.changedPaths,
  };
}

async function readRunManifestIfPresent(filePath: string): Promise<RunManifest | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || typeof parsed.runId !== "string") {
      throw new ManifestError(`Run manifest is malformed: ${filePath}`);
    }
    return parsed as unknown as RunManifest;
  } catch (error) {
    if (isNodeErrorWithCode(error, "ENOENT")) return null;
    if (error instanceof ManifestError) throw error;
    throw new ManifestError(`Unable to read run manifest ${filePath}: ${String(error)}`);
  }
}

// ---------------------------------------------------------------------------
// Artifact/reference reconciliation
// ---------------------------------------------------------------------------

export interface ArtifactReferenceReconciliation {
  readonly generatedReferences: readonly string[];
  readonly authoredReferences: readonly string[];
  readonly invalidReferences: readonly string[];
  readonly copiedAuthoredArtifacts: false;
}

/**
 * Validate manifest references without copying authored work into generated
 * evidence. The `copiedAuthoredArtifacts: false` field is an explicit proof of
 * the separation required by the artifact-placement contract.
 */
export function reconcileArtifactReferences(
  repositoryRoot: string,
  config: AuditRunConfiguration,
  runId: string,
  generatedReferences: readonly string[],
  authoredReferences: readonly string[],
): ArtifactReferenceReconciliation {
  const invalidReferences: string[] = [];
  const generated = generatedReferences.flatMap((reference) => {
    try {
      return [
        resolveApprovedArtifactPath(repositoryRoot, reference, config, runId).relativePath,
      ];
    } catch {
      invalidReferences.push(reference);
      return [];
    }
  });
  const authored = authoredReferences.flatMap((reference) => {
    try {
      return [resolveApprovedArtifactPath(repositoryRoot, reference, config).relativePath];
    } catch {
      invalidReferences.push(reference);
      return [];
    }
  });
  return Object.freeze({
    generatedReferences: Object.freeze(sortedUnique(generated)),
    authoredReferences: Object.freeze(sortedUnique(authored)),
    invalidReferences: Object.freeze(sortedUnique(invalidReferences)),
    copiedAuthoredArtifacts: false,
  });
}

// ---------------------------------------------------------------------------
// Source/tool fingerprints
// ---------------------------------------------------------------------------

export async function hashFile(filePath: string): Promise<string> {
  return sha256(await readFile(filePath, "utf8"));
}

async function collectFiles(root: string, current: string, result: string[]): Promise<void> {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const child = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(root, child, result);
    } else if (entry.isFile()) {
      const relative = path.relative(root, child).replaceAll("\\", "/");
      result.push(`${relative}:${sha256(await readFile(child, "utf8"))}`);
    }
  }
}

/** Hash a sorted file/content snapshot without executing any audit tool. */
export async function hashSourceRoot(
  repositoryRoot: string,
  sourceRoot: string,
): Promise<string> {
  const absoluteRoot = path.isAbsolute(sourceRoot)
    ? sourceRoot
    : path.resolve(repositoryRoot, sourceRoot);
  const files: string[] = [];
  await collectFiles(absoluteRoot, absoluteRoot, files);
  return sha256(files.sort().join("\n"));
}

export async function hashSourceRoots(
  repositoryRoot: string,
  sourceRoots: readonly string[],
): Promise<Readonly<Record<string, string>>> {
  const entries = await Promise.all(
    sourceRoots.map(async (sourceRoot) => [sourceRoot, await hashSourceRoot(repositoryRoot, sourceRoot)] as const),
  );
  return Object.freeze(Object.fromEntries(entries.sort(([left], [right]) => left.localeCompare(right))));
}

export function fingerprintToolVersions(
  tools: Readonly<Record<string, string>>,
): string {
  return computeNamedFingerprint(tools);
}

// ---------------------------------------------------------------------------
// Bounded concurrency
// ---------------------------------------------------------------------------

/** Run tasks with a hard concurrency cap and deterministic result order. */
export async function runBounded<T>(
  tasks: readonly (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new ManifestError("Concurrency must be an integer of at least 1.");
  }
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;
  async function worker(): Promise<void> {
    while (true) {
      const index = nextIndex++;
      if (index >= tasks.length) return;
      results[index] = await tasks[index]();
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()),
  );
  return results;
}
