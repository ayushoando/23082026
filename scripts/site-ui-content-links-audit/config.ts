import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const DEFAULT_CONFIG_PATH =
  "scripts/site-ui-content-links-audit/run-config.json";

export interface ArtifactPathConfiguration {
  readonly toolingRoot: string;
  readonly generatedRoot: string;
  readonly authoredRoot: string;
  readonly generatedPurposes: readonly string[];
  readonly authoredReportTypes: readonly string[];
}

export interface AuditWaveConfiguration {
  readonly id: number;
  readonly name: string;
  readonly dependencies: readonly number[];
  readonly entryCriteria: readonly string[];
  readonly exitCriteria: readonly string[];
  readonly ownedOutputs: readonly string[];
  readonly authorization: string;
}

export interface AuditRunConfiguration {
  readonly auditId: string;
  readonly schemaVersion: string;
  readonly specId: string;
  readonly specConfigPath: string;
  readonly artifactPaths: ArtifactPathConfiguration;
  readonly surfacePartitions: Readonly<Record<string, string>>;
  readonly waves: readonly AuditWaveConfiguration[];
}

export interface LoadedAuditConfiguration {
  readonly config: AuditRunConfiguration;
  readonly configPath: string;
  readonly configurationHash: string;
}

export class AuditConfigurationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "AuditConfigurationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(
  value: unknown,
  field: string,
): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new AuditConfigurationError(`${field} must be an object.`);
  }
  return value;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AuditConfigurationError(`${field} must be a non-empty string.`);
  }
  return value;
}

function requireStringArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new AuditConfigurationError(`${field} must be a non-empty string array.`);
  }
  return value.map((item, index) => requireString(item, `${field}[${index}]`));
}

function requireNumberArray(value: unknown, field: string): readonly number[] {
  if (!Array.isArray(value) || value.some((item) => !Number.isInteger(item))) {
    throw new AuditConfigurationError(`${field} must be an integer array.`);
  }
  return value as number[];
}

function assertUnique(values: readonly string[], field: string): void {
  if (new Set(values).size !== values.length) {
    throw new AuditConfigurationError(`${field} must contain unique values.`);
  }
}

function parseArtifactPaths(value: unknown): ArtifactPathConfiguration {
  const record = requireRecord(value, "artifactPaths");
  const generatedPurposes = requireStringArray(
    record.generatedPurposes,
    "artifactPaths.generatedPurposes",
  );
  const authoredReportTypes = requireStringArray(
    record.authoredReportTypes,
    "artifactPaths.authoredReportTypes",
  );
  assertUnique(generatedPurposes, "artifactPaths.generatedPurposes");
  assertUnique(authoredReportTypes, "artifactPaths.authoredReportTypes");

  return {
    toolingRoot: requireString(record.toolingRoot, "artifactPaths.toolingRoot"),
    generatedRoot: requireString(record.generatedRoot, "artifactPaths.generatedRoot"),
    authoredRoot: requireString(record.authoredRoot, "artifactPaths.authoredRoot"),
    generatedPurposes,
    authoredReportTypes,
  };
}

function parseSurfacePartitions(value: unknown): Readonly<Record<string, string>> {
  const record = requireRecord(value, "surfacePartitions");
  const partitions = Object.fromEntries(
    Object.entries(record).map(([key, partition]) => [
      key,
      requireString(partition, `surfacePartitions.${key}`),
    ]),
  );

  for (const required of ["planner", "studio"]) {
    if (!partitions[required]) {
      throw new AuditConfigurationError(
        `surfacePartitions.${required} is required.`,
      );
    }
  }
  if (partitions.planner === partitions.studio) {
    throw new AuditConfigurationError(
      "Planner and Studio must use separate ownership partitions.",
    );
  }
  assertUnique(Object.values(partitions), "surfacePartitions");
  return partitions;
}

function parseWave(value: unknown, index: number): AuditWaveConfiguration {
  const record = requireRecord(value, `waves[${index}]`);
  if (!Number.isInteger(record.id)) {
    throw new AuditConfigurationError(`waves[${index}].id must be an integer.`);
  }
  return {
    id: record.id as number,
    name: requireString(record.name, `waves[${index}].name`),
    dependencies: requireNumberArray(
      record.dependencies,
      `waves[${index}].dependencies`,
    ),
    entryCriteria: requireStringArray(
      record.entryCriteria,
      `waves[${index}].entryCriteria`,
    ),
    exitCriteria: requireStringArray(
      record.exitCriteria,
      `waves[${index}].exitCriteria`,
    ),
    ownedOutputs: requireStringArray(
      record.ownedOutputs,
      `waves[${index}].ownedOutputs`,
    ),
    authorization: requireString(
      record.authorization,
      `waves[${index}].authorization`,
    ),
  };
}

function parseConfiguration(value: unknown): AuditRunConfiguration {
  const record = requireRecord(value, "configuration");
  if (!Array.isArray(record.waves)) {
    throw new AuditConfigurationError("waves must be an array.");
  }
  const waves = record.waves.map(parseWave);
  const waveIds = waves.map((wave) => wave.id);
  if (
    waveIds.length !== 6 ||
    waveIds.some((id, index) => id !== index)
  ) {
    throw new AuditConfigurationError(
      "waves must define each controlled audit wave exactly once in order (0 through 5).",
    );
  }

  const artifactPaths = parseArtifactPaths(record.artifactPaths);
  for (const wave of waves) {
    for (const output of wave.ownedOutputs) {
      if (!artifactPaths.generatedPurposes.includes(output)) {
        throw new AuditConfigurationError(
          `Wave ${wave.id} owns unapproved generated purpose: ${output}`,
        );
      }
    }
    if (wave.dependencies.some((dependency) => dependency >= wave.id)) {
      throw new AuditConfigurationError(
        `Wave ${wave.id} dependencies must reference earlier waves only.`,
      );
    }
  }

  return {
    auditId: requireString(record.auditId, "auditId"),
    schemaVersion: requireString(record.schemaVersion, "schemaVersion"),
    specId: requireString(record.specId, "specId"),
    specConfigPath: requireString(record.specConfigPath, "specConfigPath"),
    artifactPaths,
    surfacePartitions: parseSurfacePartitions(record.surfacePartitions),
    waves,
  };
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export async function loadAuditConfiguration(
  repositoryRoot: string,
  requestedConfigPath = DEFAULT_CONFIG_PATH,
): Promise<LoadedAuditConfiguration> {
  if (path.isAbsolute(requestedConfigPath)) {
    throw new AuditConfigurationError(
      "Audit configuration path must be repository-relative.",
    );
  }
  const normalizedConfigPath = requestedConfigPath.replaceAll("\\", "/");
  if (normalizedConfigPath.split("/").includes("..")) {
    throw new AuditConfigurationError(
      "Audit configuration path cannot escape the repository root.",
    );
  }

  const absolutePath = path.resolve(repositoryRoot, normalizedConfigPath);
  const raw = await readFile(absolutePath, "utf8");
  let untrustedConfiguration: unknown;
  try {
    untrustedConfiguration = JSON.parse(raw) as unknown;
  } catch (error) {
    throw new AuditConfigurationError(
      `Audit configuration is not valid JSON: ${String(error)}`,
    );
  }

  const config = parseConfiguration(untrustedConfiguration);
  const configurationHash = createHash("sha256")
    .update(canonicalJson(config), "utf8")
    .digest("hex");

  return Object.freeze({
    config: Object.freeze(config),
    configPath: normalizedConfigPath,
    configurationHash,
  });
}
