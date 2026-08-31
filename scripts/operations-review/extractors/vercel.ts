import type {
  DatabaseSurface,
  EvidenceFact,
  Gap,
  PersistedDataImpact,
  ReleaseDecision,
  SourceReference,
} from "../models";
import type { RepositorySource } from "../sourceAdapter";

const VERCEL_SURFACE = "vercel-application" as const;

export interface VercelExtractionSources {
  readonly vercelConfig: RepositorySource;
  readonly packageManifest: RepositorySource;
  readonly operationsRouter: RepositorySource;
  readonly runbook: RepositorySource;
}

export interface PersistedDataReleaseInput {
  readonly databaseOwners?: readonly DatabaseSurface[];
  readonly migrationImpact?: string;
  readonly seedImpact?: string;
  readonly backupPrerequisite?: string;
  readonly compatibilityHazard?: string;
  readonly codeReleaseOrder?: string;
  readonly rollbackPath?: string;
}

export interface AttributableVercelGap extends Gap {
  readonly sources: readonly SourceReference[];
}

export interface VercelReleaseDecision extends ReleaseDecision {
  readonly sources: readonly SourceReference[];
}

export interface VercelExtractionResult {
  readonly observedConfiguration: readonly EvidenceFact[];
  readonly unverifiedExternalState: readonly EvidenceFact[];
  readonly releaseDecision: VercelReleaseDecision;
  readonly gaps: readonly AttributableVercelGap[];
}

interface VercelConfig {
  readonly buildCommand?: unknown;
  readonly installCommand?: unknown;
  readonly outputDirectory?: unknown;
  readonly framework?: unknown;
  readonly regions?: unknown;
}

function reference(source: RepositorySource, locator: string): SourceReference {
  return { ...source.source, locator };
}

function fact(
  id: string,
  statement: string,
  status: EvidenceFact["status"],
  source: RepositorySource,
  locator: string,
): EvidenceFact {
  return {
    id,
    surface: VERCEL_SURFACE,
    statement,
    status,
    source: reference(source, locator),
  };
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`vercel.json requires a non-empty ${field} string.`);
  }
  return value;
}

function requireStringArray(value: unknown, field: string): readonly string[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((item) => typeof item !== "string")
  ) {
    throw new Error(`vercel.json requires a non-empty ${field} string array.`);
  }
  return value;
}

function parseVercelConfig(source: RepositorySource): Required<VercelConfig> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source.content);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown parse error";
    throw new Error(`Cannot parse vercel.json: ${message}`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("vercel.json must contain an object.");
  }

  const config = parsed as VercelConfig;
  return {
    buildCommand: requireString(config.buildCommand, "buildCommand"),
    installCommand: requireString(config.installCommand, "installCommand"),
    outputDirectory: requireString(config.outputDirectory, "outputDirectory"),
    framework: requireString(config.framework, "framework"),
    regions: requireStringArray(config.regions, "regions"),
  };
}

function assertContains(
  source: RepositorySource,
  expected: string,
  locator: string,
): void {
  if (source.content.includes(expected)) {
    return;
  }
  const noSpace = expected.replace(/":\s+"/g, '":"');
  if (source.content.includes(noSpace)) {
    return;
  }
  throw new Error(
    `${source.source.path} does not contain expected ${locator}: ${expected}`,
  );
}

function isPresent(value: string | undefined): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function persistedDataGaps(
  input: PersistedDataReleaseInput | undefined,
  sources: VercelExtractionSources,
): readonly AttributableVercelGap[] {
  if (!input) {
    return [];
  }

  const runbookRelease = reference(
    sources.runbook,
    "§1 Deploy: order and production command sequence",
  );
  const runbookRollback = reference(
    sources.runbook,
    "§4 Rollback: code/schema separation and compatibility hazard",
  );
  const gaps: AttributableVercelGap[] = [];

  const addGap = (
    id: string,
    element: string,
    priority: "P0" | "P1",
    risk: "critical" | "high",
    recommendation: string,
    evidence: readonly SourceReference[],
  ): void => {
    gaps.push({
      id,
      surface: VERCEL_SURFACE,
      missingOrContradictoryElement: element,
      priority,
      risk,
      sourcePaths: evidence.map((item) => item.path),
      sources: evidence,
      recommendedFollowUp: recommendation,
    });
  };

  if (!input.databaseOwners || input.databaseOwners.length === 0) {
    addGap(
      "vercel.persisted-data.owner.missing",
      "Persisted-data release has no named Products/Admin database owner.",
      "P0",
      "critical",
      "Name Products, Admin, or both as release owners before approval.",
      [runbookRelease],
    );
  }
  if (!isPresent(input.migrationImpact)) {
    addGap(
      "vercel.persisted-data.migration-impact.missing",
      "Migration impact is not recorded for the persisted-data release.",
      "P0",
      "critical",
      "Record affected migration paths, database targets, and rollback instructions.",
      [runbookRelease, runbookRollback],
    );
  }
  if (!isPresent(input.seedImpact)) {
    addGap(
      "vercel.persisted-data.seed-impact.missing",
      "Seed impact is not recorded for the persisted-data release.",
      "P1",
      "high",
      "Record whether seeds are required, prohibited, or unchanged for each target.",
      [runbookRelease],
    );
  }
  if (!isPresent(input.backupPrerequisite)) {
    addGap(
      "vercel.persisted-data.backup-prerequisite.missing",
      "No recoverable-backup prerequisite is recorded for the persisted-data release.",
      "P0",
      "critical",
      "Name the backup artifact/category and evidence required before release.",
      [
        reference(
          sources.runbook,
          "opening production-impact warning; §6 Backups",
        ),
      ],
    );
  }
  if (!isPresent(input.compatibilityHazard)) {
    addGap(
      "vercel.persisted-data.compatibility-hazard.missing",
      "Schema/code compatibility hazard is not recorded.",
      "P0",
      "critical",
      "Document forward/backward compatibility and the unsafe version combinations.",
      [runbookRollback],
    );
  }
  if (!isPresent(input.codeReleaseOrder)) {
    addGap(
      "vercel.persisted-data.code-release-order.missing",
      "Code, migration, and seed release order is not recorded.",
      "P0",
      "critical",
      "Record the release-specific order and approval checkpoints.",
      [runbookRelease],
    );
  }
  if (!isPresent(input.rollbackPath)) {
    addGap(
      "vercel.persisted-data.rollback-path.missing",
      "Code and schema rollback path is not recorded for the release.",
      "P0",
      "critical",
      "Name the code rollback and migration rollback sequence before approval.",
      [runbookRollback],
    );
  }

  return gaps;
}

/**
 * Extracts repository-configured Vercel behavior only.
 *
 * Callers must supply content through RepositorySourceAdapter. This function is
 * pure: it performs no filesystem, environment, process, network, provider, or
 * deployment operation and never upgrades configured behavior to hosted state.
 */
export function extractVercelReview(
  sources: VercelExtractionSources,
  persistedDataRelease?: PersistedDataReleaseInput,
): VercelExtractionResult {
  const config = parseVercelConfig(sources.vercelConfig);

  assertContains(
    sources.packageManifest,
    '"vercel:prod": "node scripts/run-ops.mjs vercel:prod"',
    "scripts.vercel:prod",
  );
  assertContains(
    sources.packageManifest,
    '"vercel:preview": "node scripts/run-ops.mjs vercel:preview"',
    "scripts.vercel:preview",
  );
  assertContains(
    sources.operationsRouter,
    '"vercel:prod": () =>',
    "COMMANDS[vercel:prod]",
  );
  assertContains(
    sources.operationsRouter,
    '"vercel:preview": () =>',
    "COMMANDS[vercel:preview]",
  );
  assertContains(
    sources.runbook,
    "Order: **migrations → seed → code.**",
    "§1 Deploy order",
  );
  assertContains(
    sources.runbook,
    "Smoke in browser:",
    "§1 post-deployment smoke expectation",
  );

  const observedConfiguration: EvidenceFact[] = [
    fact(
      "vercel.build.configuration",
      `Vercel is configured for ${config.framework} with install command ${config.installCommand}, build command ${config.buildCommand}, and output directory ${config.outputDirectory}.`,
      "observed-local",
      sources.vercelConfig,
      "$.framework, $.installCommand, $.buildCommand, $.outputDirectory",
    ),
    fact(
      "vercel.target.region",
      `The configured Vercel region list is ${Array.isArray(config.regions) ? config.regions.join(", ") : String(config.regions)}.`,
      "observed-local",
      sources.vercelConfig,
      "$.regions",
    ),
    fact(
      "vercel.deploy.routes",
      "Root routes expose pnpm run vercel:preview and pnpm run vercel:prod through scripts/run-ops.mjs.",
      "observed-local",
      sources.packageManifest,
      "$.scripts.vercel:preview and $.scripts.vercel:prod",
    ),
    fact(
      "vercel.prod.route.behavior",
      "The configured production route runs release:gate before invoking Vercel with --prod --yes; the preview route invokes Vercel with --yes and no --prod flag.",
      "observed-local",
      sources.operationsRouter,
      "COMMANDS entries vercel:prod and vercel:preview",
    ),
    fact(
      "vercel.environment.assumptions",
      "The runbook assumes production uses Supabase persistence on a read-only filesystem and DEV_AUTH_BYPASS is never enabled.",
      "observed-local",
      sources.runbook,
      "§0 Environments: Prod row and DEV_AUTH_BYPASS note",
    ),
    fact(
      "vercel.release.order",
      "The documented release order is migrations, then seed, then code, with migration dry-runs and a release gate before the production deploy route.",
      "observed-local",
      sources.runbook,
      "§1 Deploy: Order and command block",
    ),
    fact(
      "vercel.post-deploy.evidence",
      "Documented post-deployment evidence expects db:test plus a browser smoke of /ooplanner showing a populated rail and successful place, save, and reload behavior.",
      "observed-local",
      sources.runbook,
      "§1 Deploy: command block and Smoke in browser line",
    ),
    fact(
      "vercel.rollback.configuration",
      "The runbook separates code and schema rollback, requires newest-first migration rollback before Instant Rollback when schema moved, and identifies archived-table/PostgREST compatibility risk.",
      "observed-local",
      sources.runbook,
      "§4 Rollback",
    ),
  ];

  const unverifiedExternalState = [
    fact(
      "vercel.hosted-state.unverified",
      "No current authorized provider evidence was supplied; deployment completion, hosted revision, runtime health, region placement, and post-deployment smoke results remain unverified.",
      "unverified",
      sources.runbook,
      "§1 Deploy documents commands and expected smoke evidence, not an observed hosted result",
    ),
  ];

  const gaps = persistedDataGaps(persistedDataRelease, sources);
  const completePersistedImpact =
    persistedDataRelease && gaps.length === 0
      ? ({
          databaseOwners: persistedDataRelease.databaseOwners!,
          migrationImpact: persistedDataRelease.migrationImpact!,
          seedImpact: persistedDataRelease.seedImpact!,
          backupPrerequisite: persistedDataRelease.backupPrerequisite!,
          compatibilityHazard: persistedDataRelease.compatibilityHazard!,
          codeReleaseOrder: persistedDataRelease.codeReleaseOrder!,
        } satisfies PersistedDataImpact)
      : undefined;

  const releaseDecision: VercelReleaseDecision = {
    surface: VERCEL_SURFACE,
    approvalPoint:
      "A release owner must approve the target, release-specific persisted-data prerequisites, and protected production deployment before pnpm run vercel:prod is executed.",
    rollbackOrRecoveryProcedure:
      persistedDataRelease?.rollbackPath?.trim() ||
      "OPERATIONS_RUNBOOK.md §4: revert schema migrations newest first before Vercel Instant Rollback when schema moved; release-specific rollback remains required.",
    expectedVerificationEvidence: [
      "Authorized Vercel deployment output identifying target and revision",
      "Observed pnpm run db:test result for the intended environment",
      "Observed /ooplanner rail, place, save, and reload smoke result",
      "Rollback readiness evidence for every persisted-data change",
    ],
    ...(completePersistedImpact
      ? { persistedDataImpact: completePersistedImpact }
      : {}),
    sources: [
      reference(sources.packageManifest, "$.scripts.vercel:prod"),
      reference(sources.operationsRouter, "COMMANDS[vercel:prod]"),
      reference(sources.runbook, "§1 Deploy and §4 Rollback"),
    ],
  };

  return {
    observedConfiguration,
    unverifiedExternalState,
    releaseDecision,
    gaps,
  };
}
