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
import {
  createImmutableRunInputs,
  readRepositoryRevision,
} from "./runIdentity";
import { prepareWaveExecution } from "./wave";

function readOption(argv: readonly string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  return argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function parseWaveId(argv: readonly string[]): number {
  const raw = readOption(argv, "wave");
  if (raw === undefined || !/^\d+$/.test(raw)) {
    throw new Error("wave:plan requires --wave=<0-5>.");
  }
  return Number(raw);
}

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

  if (command === "wave:plan") {
    return prepareWaveExecution(
      repositoryRoot,
      parseWaveId(argv),
      loaded.config,
      immutableRunInputs,
    );
  }

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

  throw new Error(`Unknown audit command: ${command}`);
}

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
