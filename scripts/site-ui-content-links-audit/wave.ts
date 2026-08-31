/**
 * Wave control: entry/exit enforcement, ManifestStore wiring, and wave
 * lifecycle commands (plan, run, checkpoint, complete, invalidate).
 *
 * This module is audit tooling only. It does not write product code, modify
 * databases, or cross Planner/Studio product-tree boundaries.
 *
 * Implements requirements 22.1, 22.7–22.9, 24.8, 26.9, 26.12:
 * - entry/exit criteria guards with dependency-wave validation;
 * - wave lifecycle through ManifestStore (start, checkpoint, complete,
 *   invalidate);
 * - dependency-fingerprint invalidation triggered on upstream changes;
 * - closure prevention while any owned partition is nonterminal or
 *   invalidated.
 */

import path from "node:path";

import {
  createGeneratedArtifactPath,
  resolveApprovedArtifactPath,
} from "./artifactPaths";
import type {
  AuditRunConfiguration,
  AuditWaveConfiguration,
} from "./config";
import {
  ManifestStore,
  type WaveCheckpointRecord,
  computeFingerprint,
  type ManifestStoreOptions,
  type PartitionId,
  type WaveCriteriaContext,
  type WaveManifest,
} from "./manifests";
import type { ImmutableRunInputs } from "./runIdentity";

// ---------------------------------------------------------------------------
// Wave plan (static — no ManifestStore required)
// ---------------------------------------------------------------------------

/** The read-only wave execution plan produced without opening a ManifestStore. */
export interface PreparedWaveExecution {
  readonly mode: "source-inspection-plan";
  readonly wave: AuditWaveConfiguration;
  readonly immutableRunInputs: ImmutableRunInputs;
  readonly ownedOutputPaths: readonly string[];
}

/** Compute the static execution plan for a wave without side-effects. */
export function prepareWaveExecution(
  repositoryRoot: string,
  waveId: number,
  config: AuditRunConfiguration,
  immutableRunInputs: ImmutableRunInputs,
): PreparedWaveExecution {
  const wave = config.waves.find((candidate) => candidate.id === waveId);
  if (!wave) {
    throw new Error(`Unknown audit wave: ${waveId}`);
  }

  const ownedOutputPaths = wave.ownedOutputs.map((purpose) => {
    const relativePath = createGeneratedArtifactPath(
      immutableRunInputs.runId,
      purpose,
      `wave-${wave.id}/manifest.json`,
      config,
    );
    return resolveApprovedArtifactPath(
      repositoryRoot,
      relativePath,
      config,
      immutableRunInputs.runId,
    ).relativePath;
  });

  return Object.freeze({
    mode: "source-inspection-plan" as const,
    wave,
    immutableRunInputs,
    ownedOutputPaths: Object.freeze(ownedOutputPaths),
  });
}

// ---------------------------------------------------------------------------
// Wave manifest file paths
// ---------------------------------------------------------------------------

/**
 * Canonical repository-relative path for the run-level manifest file.
 * This file is written by ManifestStore and tracks all partitions.
 */
export function runManifestPath(
  repositoryRoot: string,
  immutableRunInputs: ImmutableRunInputs,
  config: AuditRunConfiguration,
): string {
  const relative = createGeneratedArtifactPath(
    immutableRunInputs.runId,
    "manifests",
    "run-manifest.json",
    config,
  );
  return resolveApprovedArtifactPath(
    repositoryRoot,
    relative,
    config,
    immutableRunInputs.runId,
  ).relativePath;
}

/**
 * Canonical repository-relative path for a wave-level checkpoint file.
 */
export function waveCheckpointPath(
  repositoryRoot: string,
  immutableRunInputs: ImmutableRunInputs,
  config: AuditRunConfiguration,
  waveId: number,
): string {
  const relative = createGeneratedArtifactPath(
    immutableRunInputs.runId,
    "manifests",
    `wave-${waveId}/checkpoint.json`,
    config,
  );
  return resolveApprovedArtifactPath(
    repositoryRoot,
    relative,
    config,
    immutableRunInputs.runId,
  ).relativePath;
}

// ---------------------------------------------------------------------------
// Wave lifecycle operations (require ManifestStore)
// ---------------------------------------------------------------------------

export interface WaveRunOptions {
  /** Explicit entry criteria results (criterion text → pass/fail). */
  readonly entryCriteria?: Readonly<Record<string, boolean>>;
  /** Input fingerprint for the wave as a whole; defaults to computed hash. */
  readonly inputFingerprint?: string;
  /** Override the current inventory generation. */
  readonly inventoryGeneration?: number;
  /** Explicit owned partition IDs to register for this wave. */
  readonly ownedPartitionIds?: readonly PartitionId[];
  /** ManifestStore open options forwarded from the caller. */
  readonly storeOptions?: ManifestStoreOptions;
}

export interface WaveLifecycleResult {
  readonly waveManifest: WaveManifest;
  readonly store: ManifestStore;
  /** Repository-relative path of the run manifest file. */
  readonly manifestPath: string;
}

/**
 * Open a ManifestStore and start a wave.
 *
 * Enforces entry criteria (dependency waves closed, configured criteria met)
 * before starting the wave. Returns the store so callers may register
 * partitions, write data, and eventually call completeWave.
 *
 * No protected operations are executed; this is a manifest-only operation.
 */
export async function runWave(
  repositoryRoot: string,
  waveId: number,
  config: AuditRunConfiguration,
  immutableRunInputs: ImmutableRunInputs,
  options: WaveRunOptions = {},
): Promise<WaveLifecycleResult> {
  const manifestRelativePath = runManifestPath(repositoryRoot, immutableRunInputs, config);
  const manifestAbsolutePath = path.resolve(repositoryRoot, manifestRelativePath);

  const store = await ManifestStore.open(
    repositoryRoot,
    immutableRunInputs,
    config,
    manifestAbsolutePath,
    options.storeOptions,
  );

  const context: WaveCriteriaContext = {
    ...(options.entryCriteria ? { entryCriteria: options.entryCriteria } : {}),
    ...(options.ownedPartitionIds ? { ownedPartitionIds: options.ownedPartitionIds } : {}),
    ...(options.inventoryGeneration !== undefined
      ? { inventoryGeneration: options.inventoryGeneration }
      : {}),
    inputFingerprint:
      options.inputFingerprint ??
      computeFingerprint([
        immutableRunInputs.configurationHash,
        String(waveId),
        store.getRunManifest().inventoryGeneration.toString(),
      ]),
  };

  const waveManifest = await store.startWave(config, waveId, context);
  return { waveManifest, store, manifestPath: manifestRelativePath };
}

/**
 * Write a wave checkpoint record and return it.
 *
 * The checkpoint captures terminal/nonterminal partition counts, entry
 * criteria state, and inventory generation without requiring wave closure.
 *
 * No protected operations are executed.
 */
export async function checkpointWave(
  repositoryRoot: string,
  waveId: number,
  config: AuditRunConfiguration,
  immutableRunInputs: ImmutableRunInputs,
  storeOptions: ManifestStoreOptions = {},
): Promise<{ checkpoint: WaveCheckpointRecord; manifestPath: string }> {
  const manifestRelativePath = runManifestPath(repositoryRoot, immutableRunInputs, config);
  const manifestAbsolutePath = path.resolve(repositoryRoot, manifestRelativePath);

  const store = await ManifestStore.open(
    repositoryRoot,
    immutableRunInputs,
    config,
    manifestAbsolutePath,
    storeOptions,
  );

  const checkpoint = store.createWaveCheckpoint(config, waveId);
  return { checkpoint, manifestPath: manifestRelativePath };
}

/**
 * Complete a wave after verifying all exit criteria.
 *
 * Throws WaveExitCriteriaError when any owned partition is nonterminal or
 * invalidated. A wave with zero owned partitions also fails closure.
 *
 * No protected operations are executed.
 */
export async function completeWave(
  repositoryRoot: string,
  waveId: number,
  config: AuditRunConfiguration,
  immutableRunInputs: ImmutableRunInputs,
  storeOptions: ManifestStoreOptions = {},
): Promise<WaveLifecycleResult> {
  const manifestRelativePath = runManifestPath(repositoryRoot, immutableRunInputs, config);
  const manifestAbsolutePath = path.resolve(repositoryRoot, manifestRelativePath);

  const store = await ManifestStore.open(
    repositoryRoot,
    immutableRunInputs,
    config,
    manifestAbsolutePath,
    storeOptions,
  );

  const waveManifest = await store.completeWave(config, waveId);
  return { waveManifest, store, manifestPath: manifestRelativePath };
}

/**
 * Invalidate a wave and cascade invalidation to all downstream owned
 * partitions.
 *
 * No protected operations are executed.
 */
export async function invalidateWave(
  repositoryRoot: string,
  waveId: number,
  reason: string,
  config: AuditRunConfiguration,
  immutableRunInputs: ImmutableRunInputs,
  storeOptions: ManifestStoreOptions = {},
): Promise<{ manifestPath: string }> {
  const manifestRelativePath = runManifestPath(repositoryRoot, immutableRunInputs, config);
  const manifestAbsolutePath = path.resolve(repositoryRoot, manifestRelativePath);

  const store = await ManifestStore.open(
    repositoryRoot,
    immutableRunInputs,
    config,
    manifestAbsolutePath,
    storeOptions,
  );

  await store.invalidateWave(waveId, reason);
  return { manifestPath: manifestRelativePath };
}

// ---------------------------------------------------------------------------
// Wave status summary (read-only, no modification)
// ---------------------------------------------------------------------------

export interface WaveStatusSummary {
  readonly waveId: number;
  readonly status: WaveManifest["status"];
  readonly entryCriteriaMet: boolean;
  readonly ownedPartitionCount: number;
  readonly terminalCount: number;
  readonly nonterminalCount: number;
  readonly quarantineCount: number;
  readonly authorizationRequirement: string;
  readonly inventoryGeneration: number;
}

/**
 * Compute a wave status summary from an open ManifestStore without modifying
 * state. Safe to call at any point during a wave.
 */
export function waveStatusSummary(
  store: ManifestStore,
  config: AuditRunConfiguration,
  waveId: number,
): WaveStatusSummary {
  const checkpoint = store.createWaveCheckpoint(config, waveId);
  return Object.freeze({
    waveId,
    status: checkpoint.status,
    entryCriteriaMet: checkpoint.entryCriteriaMet,
    ownedPartitionCount: checkpoint.ownedItemCount,
    terminalCount: checkpoint.terminalItemCount,
    nonterminalCount: checkpoint.nonTerminalCount,
    quarantineCount: checkpoint.quarantineCount,
    authorizationRequirement: checkpoint.authorizationRequirement,
    inventoryGeneration: checkpoint.inventoryGeneration,
  });
}

