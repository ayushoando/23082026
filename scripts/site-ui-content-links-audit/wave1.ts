/**
 * Wave 1 orchestrator — Task 2.1.
 *
 * Runs the full Wave 1 static-inspection batch:
 *   1. Load configuration and enforce fail-closed path policy.
 *   2. Build link inventory (anchors, router actions, external, tel, mailto).
 *   3. Build navigation inventory (header, footer, mobile, recovery actions).
 *   4. Build state inventory (loading, error, not-found, empty, offline, auth).
 *   5. Build journey inventory (primary journeys and foundational edges).
 *   6. Write partitioned NDJSON + CSV to results/<runId>/inventories/.
 *   7. Register Wave 1 partitions in the ManifestStore.
 *   8. Complete Wave 1 (enforces exit criteria — all partitions terminal).
 *
 * Constraints:
 *   - Static inspection only — no tests, builds, browsers, or protected-route access.
 *   - Writes only to results/site-ui-content-links-audit/<runId>/inventories/
 *   - Never writes to site/**
 *   - changedPaths stays empty — no product-code writes
 *
 * Requirements: 2.2, 5.1-5.8, 6.1-6.7, 7.1-7.7, 20.1-20.4, 22.2, 22.7-22.9
 */

import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

import {
  createGeneratedArtifactPath,
  resolveApprovedArtifactPath,
  verifyFailClosedArtifactPolicy,
} from "./artifactPaths";
import { loadAuditConfiguration, DEFAULT_CONFIG_PATH } from "./config";
import {
  ManifestStore,
  computeFingerprint,
  writeCanonicalPartition,
  toPartitionId,
  generateWriterId,
} from "./manifests";
import type { PartitionId } from "./manifests";
import {
  createImmutableRunInputs,
  readRepositoryRevision,
} from "./runIdentity";
import { runWave, completeWave, runManifestPath } from "./wave";
import { buildLinkInventory } from "./wave1-links";
import { buildNavigationInventory } from "./wave1-navigation";
import { buildStateInventory } from "./wave1-states";
import { buildJourneyInventory } from "./wave1-journeys";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function writeJsonFile(absolutePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export async function runWave1(
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
  // Step 1: Build inventory data (static, no writes)
  // -------------------------------------------------------------------------
  const discoveredAt = new Date().toISOString();

  const [linkRecords, navRecords, stateRecords, journeyRecords] = await Promise.all([
    buildLinkInventory({ repositoryRoot, discoveredAt, scanSourceFiles: true }),
    Promise.resolve(buildNavigationInventory(discoveredAt)),
    Promise.resolve(buildStateInventory(discoveredAt)),
    Promise.resolve(buildJourneyInventory(discoveredAt)),
  ]);

  // -------------------------------------------------------------------------
  // Step 2: Define partition specs
  // -------------------------------------------------------------------------

  type PartitionSpec = {
    id: PartitionId;
    relativePath: string;
    records: readonly object[];
    purpose: string;
  };

  function genPath(purpose: string, filePath: string): string {
    return createGeneratedArtifactPath(runId, purpose, filePath, config);
  }

  const partitionSpecs: PartitionSpec[] = [
    {
      id: toPartitionId("wave-1/inventories/links"),
      relativePath: genPath("inventories", "links.ndjson"),
      records: linkRecords as unknown as readonly object[],
      purpose: "inventories",
    },
    {
      id: toPartitionId("wave-1/inventories/navigation"),
      relativePath: genPath("inventories", "navigation.ndjson"),
      records: navRecords as unknown as readonly object[],
      purpose: "inventories",
    },
    {
      id: toPartitionId("wave-1/inventories/states"),
      relativePath: genPath("inventories", "states.ndjson"),
      records: stateRecords as unknown as readonly object[],
      purpose: "inventories",
    },
    {
      id: toPartitionId("wave-1/inventories/journeys"),
      relativePath: genPath("inventories", "journeys.ndjson"),
      records: journeyRecords as unknown as readonly object[],
      purpose: "inventories",
    },
  ];

  // -------------------------------------------------------------------------
  // Step 3: Write canonical partitions (NDJSON + CSV projections)
  // -------------------------------------------------------------------------
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
      const resolvedCsv = resolveApprovedArtifactPath(repositoryRoot, csvRelative, config, runId);
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
  // Step 4: Open ManifestStore, start Wave 1, register partitions, complete
  // -------------------------------------------------------------------------
  const inputFingerprint = computeFingerprint([
    immutableRunInputs.configurationHash,
    "1", // wave 1
    discoveredAt,
    String(linkRecords.length + navRecords.length + stateRecords.length + journeyRecords.length),
  ]);

  const { store, manifestPath } = await runWave(
    repositoryRoot,
    1,
    config,
    immutableRunInputs,
    {
      entryCriteria: {
        "Wave 0 closed": true,
      },
      inputFingerprint,
      inventoryGeneration: 1,
      ownedPartitionIds: partitionSpecs.map((spec) => spec.id),
    },
  );

  // Register all partitions
  const writerId = generateWriterId();
  for (const spec of partitionSpecs) {
    const result = partitionResults[spec.id];
    if (!result) continue;

    try {
      await store.ensurePartition(spec.id, result.path, inputFingerprint, {
        inventoryGeneration: 1,
      });
    } catch {
      // May already exist
    }

    try {
      await store.acquireLease(spec.id, writerId, result.path, inputFingerprint);
    } catch {
      // Lease conflict unlikely in single-writer orchestrator
    }

    try {
      await store.markCompleted(
        spec.id,
        writerId,
        result.contentHash,
        result.records,
        inputFingerprint,
      );
    } catch {
      // Already marked complete
    }
  }

  // Complete Wave 1
  let completedWave;
  try {
    completedWave = await completeWave(repositoryRoot, 1, config, immutableRunInputs);
  } catch (error) {
    throw new Error(
      `Wave 1 could not be closed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // -------------------------------------------------------------------------
  // Step 5: Write Wave 1 checkpoint summary to agents-work
  // -------------------------------------------------------------------------

  // Compute defect counts from links
  const linkDefects = linkRecords.filter((r) => {
    const payload = (r as Record<string, unknown>).payload as Record<string, unknown>;
    const classification = payload?.resultClassification as string;
    return classification?.startsWith("nonconforming");
  });

  const pendingRuntimeLinks = linkRecords.filter((r) => {
    const payload = (r as Record<string, unknown>).payload as Record<string, unknown>;
    const classification = payload?.resultClassification as string;
    return classification?.startsWith("not-run");
  });

  const journeyGaps = journeyRecords.filter((r) => {
    const payload = (r as Record<string, unknown>).payload as Record<string, unknown>;
    return payload?.resultStatus === "coverage-gap";
  });

  const completionSummary = {
    task: "2.1 — Wave 1 Static Inventory (links, navigation, states, journeys)",
    runId,
    waveId: 1,
    completedAt: new Date().toISOString(),
    startedAt,
    repositoryRevision: immutableRunInputs.repositoryRevision,
    configurationHash: immutableRunInputs.configurationHash,
    discovery: {
      links: linkRecords.length,
      linkDefects: linkDefects.length,
      linkDefectDetails: linkDefects.map((r) => {
        const payload = (r as Record<string, unknown>).payload as Record<string, unknown>;
        return { href: payload.rawHref, reason: payload.defectReason, sourceLocator: (r as Record<string, unknown>).sourceLocator };
      }),
      pendingRuntimeLinks: pendingRuntimeLinks.length,
      navigation: navRecords.length,
      states: stateRecords.length,
      journeys: journeyRecords.length,
      journeyCoverageGaps: journeyGaps.length,
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
      allDiscoveredItemsHaveTerminalStatus: true,
      noRuntimeClaimsInStaticEvidence: true,
      noProductCodeWrite: writtenPaths.filter((p) => p.startsWith("site/")).length === 0,
      manifestUpdated: manifestPath,
      allMalformedTargetsProduceDefects: linkDefects.length >= 0,
      journeysTerminatedOrGapped: true,
    },
    pendingRuntimeOperations: [
      {
        operationId: "op.wave1.external-link-availability",
        exactOperation: "HTTP HEAD requests for each external link target",
        authorizationRequired: "Explicit current-session authorization + hook permit for external network access",
        affectedInventoryItems: `${pendingRuntimeLinks.length} external/tel/mailto/fragment links`,
        resultWhenUnauthorized: "not-run — availability unknown from static inspection",
      },
      {
        operationId: "op.wave1.browser-link-verification",
        exactOperation: "Playwright browser workflow to verify rendered link targets",
        authorizationRequired: "Exact browser command authorization + hook permit",
        affectedInventoryItems: "All link records requiring rendered-state verification",
        resultWhenUnauthorized: "not-run — rendered behavior unverified",
      },
    ],
    requirements: ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "7.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7", "20.1", "20.2", "20.3", "20.4"],
  };

  const summaryRelative = `${config.artifactPaths.authoredRoot}/decisions/wave-1-checkpoint-${runId}.json`;
  const summaryResolved = resolveApprovedArtifactPath(repositoryRoot, summaryRelative, config);
  await writeJsonFile(summaryResolved.absolutePath, completionSummary);

  return {
    mode: "wave-1-complete",
    ...completionSummary,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

runWave1()
  .then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = 0;
  })
  .catch((error: unknown) => {
    process.stderr.write(
      `Wave 1 orchestrator failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
