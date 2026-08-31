/**
 * Audit program CLI entry point.
 *
 * Commands:
 *   config:dry       — dry load and validate run configuration.
 *   discover         — canonical source inventory (static, no writes).
 *   wave:plan        — static wave execution plan (no ManifestStore).
 *   wave:run         — open ManifestStore and start a wave lifecycle.
 *   wave:checkpoint  — write a wave checkpoint record (no closure).
 *   wave:complete    — enforce exit criteria and close a wave.
 *   wave:invalidate  — invalidate a wave and cascade to owned partitions.
 *   manifest:open    — open (or resume) a run manifest and print summary.
 *
 * Protected commands (test, build, gate, browser, hosted, performance) are
 * NOT wired here. They require separate explicit current-session authorization
 * and an enabled hook permit before execution.
 */

import path from "node:path";

import {
  createSurfacePartitionArtifactPath,
  resolveApprovedArtifactPath,
  verifyFailClosedArtifactPolicy,
} from "./artifactPaths";
import { loadAuditConfiguration } from "./config";
import {
  discoverCanonicalInventory,
  discoveryToAuditRecords,
} from "./discovery";
import { ManifestStore } from "./manifests";
import {
  createImmutableRunInputs,
  readRepositoryRevision,
} from "./runIdentity";
import {
  checkpointWave,
  completeWave,
  invalidateWave,
  prepareWaveExecution,
  runManifestPath,
  runWave,
  waveStatusSummary,
} from "./wave";

// ---------------------------------------------------------------------------
// Argument helpers
// ---------------------------------------------------------------------------

function readOption(argv: readonly string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  return argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function parseWaveId(argv: readonly string[]): number {
  const raw = readOption(argv, "wave");
  if (raw === undefined || !/^\d+$/.test(raw)) {
    throw new Error("This command requires --wave=<0-5>.");
  }
  const id = Number(raw);
  if (id < 0 || id > 5) throw new Error("--wave must be 0–5.");
  return id;
}

// ---------------------------------------------------------------------------
// Command handler
// ---------------------------------------------------------------------------

export async function runAuditCommand(
  argv: readonly string[] = process.argv.slice(2),
  repositoryRoot = process.cwd(),
): Promise<unknown> {
  const [command = "config:dry"] = argv;
  const loaded = await loadAuditConfiguration(
    repositoryRoot,
    readOption(argv, "config"),
  );
  const revision = readRepositoryRevision(repositoryRoot);
  const immutableRunInputs = createImmutableRunInputs(loaded, revision);
  verifyFailClosedArtifactPolicy(repositoryRoot, loaded.config);

  // -------------------------------------------------------------------------
  // config:dry — validate configuration and show approved path templates
  // -------------------------------------------------------------------------
  if (command === "config:dry") {
    const plannerPath = createSurfacePartitionArtifactPath(
      immutableRunInputs.runId,
      "inventories",
      "planner",
      "manifest.json",
      loaded.config,
    );
    const studioPath = createSurfacePartitionArtifactPath(
      immutableRunInputs.runId,
      "inventories",
      "studio",
      "manifest.json",
      loaded.config,
    );

    return {
      mode: "dry-source-configuration-load",
      immutableRunInputs,
      approvedPathTemplates: {
        tooling: `${loaded.config.artifactPaths.toolingRoot}/**`,
        generated: `${loaded.config.artifactPaths.generatedRoot}/${immutableRunInputs.runId}/<approved-purpose>/**`,
        authored: `${loaded.config.artifactPaths.authoredRoot}/<approved-report-type>/**`,
      },
      ownershipPartitions: {
        planner: resolveApprovedArtifactPath(
          repositoryRoot,
          plannerPath,
          loaded.config,
          immutableRunInputs.runId,
        ).relativePath,
        studio: resolveApprovedArtifactPath(
          repositoryRoot,
          studioPath,
          loaded.config,
          immutableRunInputs.runId,
        ).relativePath,
      },
      waves: loaded.config.waves,
      failClosedPolicyVerified: true,
      writesPerformed: 0,
    };
  }

  // -------------------------------------------------------------------------
  // discover — canonical source inventory (static, no writes)
  // -------------------------------------------------------------------------
  if (command === "discover") {
    const result = await discoverCanonicalInventory({
      repositoryRoot,
      discoveredAt: new Date().toISOString(),
    });
    const records = discoveryToAuditRecords(result);
    return {
      mode: "canonical-discovery",
      immutableRunInputs,
      summary: {
        routes: result.routes.length,
        dynamicInstances: result.dynamicInstances.length,
        shells: result.shells.length,
        conflicts: result.conflicts.length,
        coverageGaps: result.coverageGaps.length,
        exclusions: result.exclusions.length,
        totalRecords: records.length,
      },
      discoveredAt: result.discoveredAt,
      writesPerformed: 0,
    };
  }

  // -------------------------------------------------------------------------
  // wave:plan — static execution plan without ManifestStore
  // -------------------------------------------------------------------------
  if (command === "wave:plan") {
    return prepareWaveExecution(
      repositoryRoot,
      parseWaveId(argv),
      loaded.config,
      immutableRunInputs,
    );
  }

  // -------------------------------------------------------------------------
  // manifest:open — open or resume a run manifest and print summary
  // -------------------------------------------------------------------------
  if (command === "manifest:open") {
    const manifestRelative = runManifestPath(repositoryRoot, immutableRunInputs, loaded.config);
    const store = await ManifestStore.open(
      repositoryRoot,
      immutableRunInputs,
      loaded.config,
      path.resolve(repositoryRoot, manifestRelative),
    );
    const manifest = store.getRunManifest();
    return {
      mode: "manifest-open",
      manifestPath: manifestRelative,
      runId: manifest.runId,
      auditId: manifest.auditId,
      schemaVersion: manifest.schemaVersion,
      repositoryRevision: manifest.repositoryRevision,
      configurationHash: manifest.configurationHash,
      inventoryGeneration: manifest.inventoryGeneration,
      partitionCount: manifest.partitions.length,
      waveCount: manifest.waveManifests?.length ?? 0,
      reviewQueueSize: manifest.reviewQueue?.length ?? 0,
      generatedArtifactCount: manifest.generatedArtifactReferences?.length ?? 0,
      authoredWorkCount: manifest.authoredWorkReferences.length,
      changedPathCount: manifest.changedPaths.length,
      supersedesManifestId: manifest.supersedesManifestId,
      createdAt: manifest.createdAt,
      updatedAt: manifest.updatedAt,
    };
  }

  // -------------------------------------------------------------------------
  // wave:run — open ManifestStore and start a wave
  // -------------------------------------------------------------------------
  if (command === "wave:run") {
    const waveId = parseWaveId(argv);
    const { waveManifest, manifestPath } = await runWave(
      repositoryRoot,
      waveId,
      loaded.config,
      immutableRunInputs,
    );
    return {
      mode: "wave-run",
      waveId,
      manifestPath,
      waveManifest,
      immutableRunInputs,
      writesPerformed: 1,
      note: "Wave started. Register partitions via ManifestStore, then call wave:complete.",
    };
  }

  // -------------------------------------------------------------------------
  // wave:checkpoint — snapshot current wave state without closing it
  // -------------------------------------------------------------------------
  if (command === "wave:checkpoint") {
    const waveId = parseWaveId(argv);
    const { checkpoint, manifestPath } = await checkpointWave(
      repositoryRoot,
      waveId,
      loaded.config,
      immutableRunInputs,
    );
    return {
      mode: "wave-checkpoint",
      waveId,
      manifestPath,
      checkpoint,
      immutableRunInputs,
      writesPerformed: 0,
    };
  }

  // -------------------------------------------------------------------------
  // wave:complete — enforce exit criteria and close a wave
  // -------------------------------------------------------------------------
  if (command === "wave:complete") {
    const waveId = parseWaveId(argv);
    const { waveManifest, store, manifestPath } = await completeWave(
      repositoryRoot,
      waveId,
      loaded.config,
      immutableRunInputs,
    );
    const status = waveStatusSummary(store, loaded.config, waveId);
    return {
      mode: "wave-complete",
      waveId,
      manifestPath,
      waveManifest,
      status,
      immutableRunInputs,
      writesPerformed: 1,
    };
  }

  // -------------------------------------------------------------------------
  // wave:invalidate — invalidate a wave and cascade to partitions
  // -------------------------------------------------------------------------
  if (command === "wave:invalidate") {
    const waveId = parseWaveId(argv);
    const reason = readOption(argv, "reason") ?? "Manually invalidated via CLI.";
    const { manifestPath } = await invalidateWave(
      repositoryRoot,
      waveId,
      reason,
      loaded.config,
      immutableRunInputs,
    );
    return {
      mode: "wave-invalidate",
      waveId,
      reason,
      manifestPath,
      immutableRunInputs,
      writesPerformed: 1,
    };
  }

  throw new Error(
    `Unknown audit command: ${command}. Valid commands: config:dry, discover, ` +
    `wave:plan, wave:run, wave:checkpoint, wave:complete, wave:invalidate, manifest:open`,
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

runAuditCommand()
  .then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  })
  .catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
