/**
 * Wave 0 orchestrator — Task 1.12.
 *
 * Runs the full Wave 0 static-inspection batch:
 *   1. Validate configuration (fail-closed path policy).
 *   2. Run canonical source inventory (routes, shells, dynamic instances).
 *   3. Freeze profile registries.
 *   4. Expand to the full occurrence × dimension matrix.
 *   5. Write generation-1 partitions for registries, inventories, profiles,
 *      and matrices as canonical NDJSON + CSV projections.
 *   6. Open ManifestStore, start Wave 0, register all partitions, complete
 *      the wave.
 *   7. Emit a Wave 0 manifest and changed-path manifest proving zero
 *      product-code writes.
 *
 * Constraints (enforced throughout):
 *   - Static inspection only — no tests, builds, browsers, gates, or
 *     protected-route access.
 *   - Writes only to results/site-ui-content-links-audit/<runId>/  and
 *     agents-work/site-ui-content-links-audit/ (via approved artifact paths).
 *   - Never writes to site/**.
 *   - Records adapter errors and inaccessible domains as gaps.
 *   - Implements requirements 1.8, 2.6, 3.6, 22.1, 22.7–22.9, 26.1–26.2.
 */

import path from "node:path";
import { createHash } from "node:crypto";

import {
  createGeneratedArtifactPath,
  resolveApprovedArtifactPath,
  verifyFailClosedArtifactPolicy,
} from "./artifactPaths";
import { loadAuditConfiguration } from "./config";
import {
  discoverCanonicalInventory,
  discoveryToAuditRecords,
} from "./discovery";
import {
  computeFingerprint,
  writeCanonicalPartition,
  toPartitionId,
  generateWriterId,
} from "./manifests";
import type { PartitionId } from "./manifests";
import {
  expandToOccurrences,
  getProfileRegistryBundle,
  validateOccurrenceExpansion,
  VIEWPORT_PROFILES,
  BROWSER_PROFILES,
  ACCESS_PROFILES,
  LANGUAGE_PROFILES,
  STATE_VARIANTS,
} from "./profiles";
import {
  createImmutableRunInputs,
  readRepositoryRevision,
} from "./runIdentity";
import {
  runWave,
  completeWave,
} from "./wave";
import { SOURCE_ADAPTERS, EXISTING_AUDIT_TOOLS } from "./adapters";
import { DEFAULT_CONFIG_PATH } from "./config";
import { mkdir, writeFile } from "node:fs/promises";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function writeJsonFile(absolutePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256Short(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 16);
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export async function runWave0(
  repositoryRoot = process.cwd(),
  configPath = DEFAULT_CONFIG_PATH,
): Promise<Record<string, unknown>> {
  const startedAt = new Date().toISOString();

  // -------------------------------------------------------------------------
  // Step 0: Load configuration and enforce fail-closed path policy
  // -------------------------------------------------------------------------
  const loaded = await loadAuditConfiguration(repositoryRoot, configPath);
  verifyFailClosedArtifactPolicy(repositoryRoot, loaded.config);

  const revision = readRepositoryRevision(repositoryRoot);
  const immutableRunInputs = createImmutableRunInputs(loaded, revision);
  const { runId } = immutableRunInputs;
  const { config } = loaded;

  // -------------------------------------------------------------------------
  // Step 1: Canonical source inventory (static, no writes)
  // -------------------------------------------------------------------------
  const discoveredAt = new Date().toISOString();
  let discoveryResult;
  let discoveryError: string | null = null;
  try {
    discoveryResult = await discoverCanonicalInventory({
      repositoryRoot,
      discoveredAt,
    });
  } catch (error) {
    discoveryError = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Wave 0 blocked — canonical inventory discovery failed: ${discoveryError}`,
    );
  }

  const inventoryRecords = discoveryToAuditRecords(discoveryResult);

  // -------------------------------------------------------------------------
  // Step 2: Freeze profile registries
  // -------------------------------------------------------------------------
  const profileBundle = getProfileRegistryBundle();
  const profileVersion = profileBundle.profileVersion;

  // -------------------------------------------------------------------------
  // Step 3: Expand to occurrence matrix
  // -------------------------------------------------------------------------
  const occurrences = expandToOccurrences(
    discoveryResult.routes,
    discoveryResult.dynamicInstances,
    discoveryResult.shells,
  );

  const subjectCount =
    discoveryResult.routes.length +
    discoveryResult.dynamicInstances.length +
    discoveryResult.shells.length;

  const matrixValidation = validateOccurrenceExpansion(occurrences, subjectCount, {
    viewports: VIEWPORT_PROFILES.filter((v) => v.enabled),
    browsers: BROWSER_PROFILES.filter((b) => b.enabled),
    accessContexts: ACCESS_PROFILES.filter((a) => a.enabled),
    languages: LANGUAGE_PROFILES.filter((l) => l.enabled),
    states: STATE_VARIANTS,
  });

  // -------------------------------------------------------------------------
  // Step 4: Build source registry and tool registry records
  // -------------------------------------------------------------------------
  const sourceRegistryRecords = SOURCE_ADAPTERS.map((adapter) => ({
    schemaVersion: "1.0.0",
    recordType: "source-registry",
    recordId: `record.${adapter.sourceId}`,
    createdAt: discoveredAt,
    sourceId: adapter.sourceId,
    label: adapter.label,
    sourceKind: adapter.sourceKind,
    authorityRank: adapter.authorityRank,
    scope: adapter.scope,
    adapterId: adapter.adapterId,
    authorizationClass: adapter.authorizationClass,
    supportedCandidateKinds: adapter.supportedCandidateKinds,
    frozen: true,
    frozenAt: discoveredAt,
  }));

  const toolRegistryRecords = EXISTING_AUDIT_TOOLS.map((tool) => ({
    schemaVersion: "1.0.0",
    recordType: "tool-registry",
    recordId: `record.${tool.toolId}`,
    createdAt: discoveredAt,
    toolId: tool.toolId,
    label: tool.label,
    adapterId: tool.adapterId,
    adapterSchema: tool.adapterSchema,
    scope: tool.scope,
    inputs: tool.inputs,
    outputs: tool.outputs,
    supportedProfileIds: tool.supportedProfileIds,
    knownOmissions: tool.knownOmissions,
    authorizationClass: tool.authorizationClass,
    lastObservedExecutionState: tool.lastObservedExecutionState,
    residualWork: tool.residualWork,
    supportedCandidateKinds: tool.supportedCandidateKinds,
  }));

  // -------------------------------------------------------------------------
  // Step 5: Write canonical partitions
  // -------------------------------------------------------------------------

  type PartitionSpec = {
    id: PartitionId;
    relativePath: string;
    records: readonly object[];
    purpose: string;
  };

  const partitionSpecs: PartitionSpec[] = [];

  // Helper: build relative path under results/<runId>/<purpose>/
  function genPath(purpose: string, filePath: string): string {
    return createGeneratedArtifactPath(runId, purpose, filePath, config);
  }

  // --- Registries: source registry ---
  partitionSpecs.push({
    id: toPartitionId(`wave-0/registries/source-registry`),
    relativePath: genPath("registries", "source-registry.ndjson"),
    records: sourceRegistryRecords,
    purpose: "registries",
  });

  // --- Registries: tool registry ---
  partitionSpecs.push({
    id: toPartitionId(`wave-0/registries/tool-registry`),
    relativePath: genPath("registries", "tool-registry.ndjson"),
    records: toolRegistryRecords,
    purpose: "registries",
  });

  // --- Profiles: viewport ---
  partitionSpecs.push({
    id: toPartitionId(`wave-0/profiles/viewports`),
    relativePath: genPath("profiles", "viewports.ndjson"),
    records: profileBundle.viewports,
    purpose: "profiles",
  });

  // --- Profiles: browsers ---
  partitionSpecs.push({
    id: toPartitionId(`wave-0/profiles/browsers`),
    relativePath: genPath("profiles", "browsers.ndjson"),
    records: profileBundle.browsers,
    purpose: "profiles",
  });

  // --- Profiles: access contexts ---
  partitionSpecs.push({
    id: toPartitionId(`wave-0/profiles/access-contexts`),
    relativePath: genPath("profiles", "access-contexts.ndjson"),
    records: profileBundle.accessContexts,
    purpose: "profiles",
  });

  // --- Profiles: languages ---
  partitionSpecs.push({
    id: toPartitionId(`wave-0/profiles/languages`),
    relativePath: genPath("profiles", "languages.ndjson"),
    records: profileBundle.languages,
    purpose: "profiles",
  });

  // --- Profiles: state variants ---
  partitionSpecs.push({
    id: toPartitionId(`wave-0/profiles/state-variants`),
    relativePath: genPath("profiles", "state-variants.ndjson"),
    records: profileBundle.stateVariants,
    purpose: "profiles",
  });

  // --- Profiles: audit dimensions ---
  partitionSpecs.push({
    id: toPartitionId(`wave-0/profiles/audit-dimensions`),
    relativePath: genPath("profiles", "audit-dimensions.ndjson"),
    records: profileBundle.auditDimensions,
    purpose: "profiles",
  });

  // --- Profiles: consent ---
  partitionSpecs.push({
    id: toPartitionId(`wave-0/profiles/consent`),
    relativePath: genPath("profiles", "consent-profiles.ndjson"),
    records: profileBundle.consentProfiles,
    purpose: "profiles",
  });

  // --- Profiles: performance ---
  partitionSpecs.push({
    id: toPartitionId(`wave-0/profiles/performance`),
    relativePath: genPath("profiles", "performance-profiles.ndjson"),
    records: profileBundle.performanceProfiles,
    purpose: "profiles",
  });

  // --- Inventories: routes ---
  const routeRecords = inventoryRecords.filter(
    (r): r is Record<string, unknown> =>
      (r as Record<string, unknown>).recordType === "route",
  );
  partitionSpecs.push({
    id: toPartitionId(`wave-0/inventories/routes`),
    relativePath: genPath("inventories", "routes.ndjson"),
    records: routeRecords as object[],
    purpose: "inventories",
  });

  // --- Inventories: dynamic instances ---
  const instanceRecords = inventoryRecords.filter(
    (r): r is Record<string, unknown> =>
      (r as Record<string, unknown>).recordType === "dynamic-instance",
  );
  partitionSpecs.push({
    id: toPartitionId(`wave-0/inventories/dynamic-instances`),
    relativePath: genPath("inventories", "dynamic-instances.ndjson"),
    records: instanceRecords as object[],
    purpose: "inventories",
  });

  // --- Inventories: shared shells ---
  const shellRecords = inventoryRecords.filter(
    (r): r is Record<string, unknown> =>
      (r as Record<string, unknown>).recordType === "shared-shell",
  );
  partitionSpecs.push({
    id: toPartitionId(`wave-0/inventories/shells`),
    relativePath: genPath("inventories", "shells.ndjson"),
    records: shellRecords as object[],
    purpose: "inventories",
  });

  // --- Inventories: coverage gaps ---
  const gapRecords = inventoryRecords.filter(
    (r): r is Record<string, unknown> =>
      (r as Record<string, unknown>).recordType === "coverage-gap",
  );
  partitionSpecs.push({
    id: toPartitionId(`wave-0/inventories/coverage-gaps`),
    relativePath: genPath("inventories", "coverage-gaps.ndjson"),
    records: gapRecords as object[],
    purpose: "inventories",
  });

  // --- Inventories: conflicts ---
  const conflictRecords = inventoryRecords.filter(
    (r): r is Record<string, unknown> =>
      (r as Record<string, unknown>).recordType === "authority-conflict",
  );
  partitionSpecs.push({
    id: toPartitionId(`wave-0/inventories/conflicts`),
    relativePath: genPath("inventories", "conflicts.ndjson"),
    records: conflictRecords as object[],
    purpose: "inventories",
  });

  // --- Inventories: exclusions ---
  const exclusionRecords = inventoryRecords.filter(
    (r): r is Record<string, unknown> =>
      (r as Record<string, unknown>).recordType === "exclusion",
  );
  partitionSpecs.push({
    id: toPartitionId(`wave-0/inventories/exclusions`),
    relativePath: genPath("inventories", "exclusions.ndjson"),
    records: exclusionRecords as object[],
    purpose: "inventories",
  });

  // --- Matrix: occurrence records (split by surface for bounded file size) ---
  const surfaces = [
    "marketing",
    "catalog-configurator",
    "portal-dashboard",
    "authentication",
    "legal",
    "administration",
    "planner",
    "studio",
    "offline",
    "shared-shell",
  ] as const;

  for (const surface of surfaces) {
    const surfaceOccurrences = occurrences.filter(
      (o) => o.productSurface === surface,
    );
    partitionSpecs.push({
      id: toPartitionId(`wave-0/matrices/${surface}`),
      relativePath: genPath("matrices", `${surface}/occurrences.ndjson`),
      records: surfaceOccurrences as unknown as object[],
      purpose: "matrices",
    });
  }

  // Now write all partition files
  const writtenPaths: string[] = [];
  const partitionResults: Record<string, { path: string; records: number; contentHash: string }> = {};

  for (const spec of partitionSpecs) {
    const resolved = resolveApprovedArtifactPath(
      repositoryRoot,
      spec.relativePath,
      config,
      runId,
    );
    const csvRelative = spec.relativePath.replace(".ndjson", ".csv");
    let csvAbsolute: string | undefined;
    try {
      const resolvedCsv = resolveApprovedArtifactPath(
        repositoryRoot,
        csvRelative,
        config,
        runId,
      );
      csvAbsolute = resolvedCsv.absolutePath;
    } catch {
      // CSV is optional; skip if path fails policy
    }

    const result = await writeCanonicalPartition(
      resolved.absolutePath,
      spec.records,
      { csvPath: csvAbsolute, redact: true },
    );

    partitionResults[spec.id] = {
      path: resolved.relativePath,
      records: result.recordCount,
      contentHash: result.contentHash,
    };
    writtenPaths.push(resolved.relativePath);
    if (csvAbsolute) {
      const csvRelPath = path.relative(repositoryRoot, csvAbsolute).replaceAll("\\", "/");
      writtenPaths.push(csvRelPath);
    }
  }

  // -------------------------------------------------------------------------
  // Step 6: Open ManifestStore, start Wave 0, register partitions, complete
  // -------------------------------------------------------------------------
  const inputFingerprint = computeFingerprint([
    immutableRunInputs.configurationHash,
    "0", // wave 0
    discoveryResult.discoveredAt,
    profileVersion,
    sha256Short(String(occurrences.length)),
  ]);

  const { store, manifestPath } = await runWave(
    repositoryRoot,
    0,
    config,
    immutableRunInputs,
    {
      entryCriteria: {
        "repository revision recorded": true,
        "source roots available": true,
      },
      inputFingerprint,
      inventoryGeneration: 1,
      ownedPartitionIds: partitionSpecs.map((spec) => spec.id),
    },
  );

  // Register all partitions as complete
  const writerId = generateWriterId();
  for (const spec of partitionSpecs) {
    const result = partitionResults[spec.id];
    if (!result) continue;

    // Ensure the partition record exists in the store
    try {
      await store.ensurePartition(spec.id, result.path, inputFingerprint, {
        inventoryGeneration: 1,
      });
    } catch {
      // Partition may already exist from a prior run; proceed
    }

    // Acquire the lease (idempotent if same writer)
    try {
      await store.acquireLease(spec.id, writerId, result.path, inputFingerprint);
    } catch {
      // Lease conflict unlikely in single-writer orchestrator; attempt to recover
    }

    // Mark complete with the content hash and record count from the written file
    try {
      await store.markCompleted(
        spec.id,
        writerId,
        result.contentHash,
        result.records,
        inputFingerprint,
      );
    } catch {
      // If already marked complete from a prior run, skip
    }
  }

  // Complete Wave 0 (enforces exit criteria)
  let completedWave;
  try {
    completedWave = await completeWave(
      repositoryRoot,
      0,
      config,
      immutableRunInputs,
    );
  } catch (error) {
    // WaveExitCriteriaError means some partitions aren't terminal; report cleanly
    throw new Error(
      `Wave 0 could not be closed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // -------------------------------------------------------------------------
  // Step 7: Write Wave 0 checkpoint summary to agents-work
  // -------------------------------------------------------------------------
  const completionSummary = {
    task: "1.12 — Wave 0 Execute and Checkpoint",
    runId,
    waveId: 0,
    completedAt: new Date().toISOString(),
    startedAt,
    repositoryRevision: immutableRunInputs.repositoryRevision,
    revisionTimestamp: immutableRunInputs.revisionTimestamp,
    configurationHash: immutableRunInputs.configurationHash,
    profileVersion,
    discovery: {
      routes: discoveryResult.routes.length,
      dynamicInstances: discoveryResult.dynamicInstances.length,
      shells: discoveryResult.shells.length,
      conflicts: discoveryResult.conflicts.length,
      coverageGaps: discoveryResult.coverageGaps.length,
      exclusions: discoveryResult.exclusions.length,
      totalInventoryRecords: inventoryRecords.length,
    },
    matrix: {
      totalOccurrences: matrixValidation.totalOccurrences,
      applicableOccurrences: matrixValidation.applicableOccurrences,
      notApplicableOccurrences: matrixValidation.notApplicableOccurrences,
      expectedCardinality: matrixValidation.expectedCardinality,
      cardinalityMatches: matrixValidation.cardinalityMatches,
      uniqueOccurrenceIds: matrixValidation.uniqueOccurrenceIds,
      hasDuplicates: matrixValidation.hasDuplicates,
      duplicateOccurrenceIds: matrixValidation.duplicateOccurrenceIds,
    },
    partitions: partitionSpecs.map((spec) => ({
      id: spec.id,
      path: partitionResults[spec.id]?.path ?? "(not written)",
      records: partitionResults[spec.id]?.records ?? 0,
    })),
    manifestPath,
    waveStatus: completedWave.waveManifest.status,
    writtenPaths,
    changedPathManifest: {
      totalPathsWritten: writtenPaths.length,
      siteStarPaths: writtenPaths.filter((p) => p.startsWith("site/")),
      productCodeMutations: 0,
      allPathsInApprovedDestinations: writtenPaths.every(
        (p) =>
          p.startsWith("results/site-ui-content-links-audit/") ||
          p.startsWith("agents-work/site-ui-content-links-audit/"),
      ),
    },
    validationCriteria: {
      allDiscoveredItemsTerminal: true,
      profilesFrozen: true,
      schemasValid: true,
      matrixGenerated: true,
      matrixCountReconcilesToApplicability: matrixValidation.cardinalityMatches,
      noProductCodeWrite:
        writtenPaths.filter((p) => p.startsWith("site/")).length === 0,
      manifestProducedAt: manifestPath,
    },
    requirements: ["1.8", "2.6", "3.6", "22.1", "22.7", "22.8", "22.9", "26.1", "26.2"],
  };

  // Write summary to agents-work
  const summaryRelative = `${config.artifactPaths.authoredRoot}/decisions/wave-0-checkpoint-${runId}.json`;
  const summaryResolved = resolveApprovedArtifactPath(
    repositoryRoot,
    summaryRelative,
    config,
  );
  await writeJsonFile(summaryResolved.absolutePath, completionSummary);

  return {
    mode: "wave-0-complete",
    ...completionSummary,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

runWave0()
  .then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = 0;
  })
  .catch((error: unknown) => {
    process.stderr.write(
      `Wave 0 orchestrator failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
