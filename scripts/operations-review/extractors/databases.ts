import { AuthorizationGuard } from "../authorizationGuard";
import {
  ADMIN_DATABASE,
  PRODUCTS_DATABASE,
  type EvidenceFact,
  type Gap,
  type ProtectedOperation,
  type RecoveryPath,
  type SourceReference,
  type Surface,
} from "../models";
import type { RepositorySource } from "../sourceAdapter";

const PRODUCTS_SURFACE: Surface = "products-database";
const ADMIN_SURFACE: Surface = "admin-database";

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface DatabaseReviewSources {
  /** OPERATIONS_RUNBOOK.md */
  readonly runbook: RepositorySource;
  /** Files from site/platform/supabase/migrations/ */
  readonly productsMigrationsDir: readonly RepositorySource[];
  /** Files from site/platform/supabase/migrations.admin/ */
  readonly adminMigrationsDir: readonly RepositorySource[];
  /** docs/database/ops.md */
  readonly databaseOps: RepositorySource;
  /** package.json */
  readonly rootPackage: RepositorySource;
}

export interface RecoveryPathRecord {
  readonly path: RecoveryPath;
  readonly description: string;
  readonly documented: boolean;
  readonly source: SourceReference;
}

export interface DatabaseSurfaceRecord {
  readonly surface: "products-database" | "admin-database";
  /** Hardcoded from PRODUCTS_DATABASE or ADMIN_DATABASE constants — never inferred. */
  readonly projectRef: string;
  readonly ownershipScope: string;
  readonly configuredBackupRoute: string;
  readonly recoveryDocumentation: string;
  readonly migrationFiles: readonly string[];
  /** True only when every migration file in the directory contains "-- rollback". */
  readonly hasRollbackInstruction: boolean;
  readonly recoveryPaths: readonly RecoveryPathRecord[];
  readonly coverageGaps: readonly Gap[];
}

export interface DatabaseReview {
  readonly products: DatabaseSurfaceRecord;
  readonly admin: DatabaseSurfaceRecord;
  readonly protectedOperations: readonly ProtectedOperation[];
  readonly gaps: readonly Gap[];
  readonly observedConfiguration: readonly EvidenceFact[];
  readonly unverifiedExternalState: readonly EvidenceFact[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function sourceAt(source: RepositorySource, locator: string): SourceReference {
  return { ...source.source, locator };
}

function fact(
  id: string,
  surface: Surface,
  statement: string,
  source: RepositorySource,
  locator: string,
  status: EvidenceFact["status"] = "observed-local",
): EvidenceFact {
  return { id, surface, statement, status, source: sourceAt(source, locator) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePackageScripts(source: RepositorySource): Record<string, string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source.content);
  } catch {
    return {};
  }
  if (!isRecord(parsed) || !isRecord(parsed.scripts)) return {};
  return Object.fromEntries(
    Object.entries(parsed.scripts).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

/** Extract the first matching section from Markdown content. */
function markdownSection(content: string, heading: RegExp): string {
  const match = heading.exec(content);
  if (!match || match.index === undefined) return "";
  const nextHeading = content.indexOf("\n## ", match.index + match[0].length);
  return content.slice(match.index, nextHeading === -1 ? content.length : nextHeading);
}

function hasRollback(migrations: readonly RepositorySource[]): boolean {
  if (migrations.length === 0) return false;
  return migrations.every((m) => m.content.includes("-- rollback"));
}

function migrationFileNames(migrations: readonly RepositorySource[]): readonly string[] {
  return migrations.map((m) => m.source.path.split("/").at(-1) ?? m.source.path);
}

// ---------------------------------------------------------------------------
// Recovery path builders
// ---------------------------------------------------------------------------

interface RecoveryPathSpec {
  readonly path: RecoveryPath;
  readonly description: string;
  readonly markerFn: (runbook: string, ops: string) => boolean;
  readonly locator: string;
  readonly preferOps: boolean;
}

const PRODUCTS_RECOVERY_PATH_SPECS: readonly RecoveryPathSpec[] = [
  {
    path: "products-schema-rollback",
    description:
      "Revert the Products database schema to the previous state using the documented migration rollback instruction.",
    markerFn: (runbook) =>
      runbook.includes("Revert migrations") || runbook.includes("schema rollback"),
    locator: "§4 Rollback: schema-before-code ordering",
    preferOps: false,
  },
  {
    path: "provider-recovery",
    description: "Restore Products database service via the Supabase provider recovery procedure.",
    markerFn: (_, ops) =>
      ops.toLowerCase().includes("supabase") && ops.includes("restore"),
    locator: "§3 Restore from R2 / provider recovery procedures",
    preferOps: true,
  },
  {
    path: "point-in-time-recovery",
    description:
      "Restore the Products database to a prior point using Supabase PITR, limited to available retention window.",
    markerFn: (runbook, ops) =>
      runbook.toLowerCase().includes("pitr") ||
      ops.toLowerCase().includes("pitr") ||
      ops.toLowerCase().includes("point-in-time"),
    locator: "§3 Restore from R2: PITR section",
    preferOps: true,
  },
  {
    path: "data-restore",
    description:
      "Restore Products data from a repository-backed R2 dump artifact (pgdump-products-*.dump).",
    markerFn: (_, ops) => ops.includes("pgdump-products"),
    locator: "§1 Nightly backups: backups/products/pgdump-products-*.dump",
    preferOps: true,
  },
];

const ADMIN_RECOVERY_PATH_SPECS: readonly RecoveryPathSpec[] = [
  {
    path: "admin-schema-rollback",
    description:
      "Revert the Admin database schema to the previous state using the documented migration rollback instruction.",
    markerFn: (runbook) =>
      runbook.includes("Revert migrations") || runbook.includes("schema rollback"),
    locator: "§4 Rollback: schema-before-code ordering",
    preferOps: false,
  },
  {
    path: "provider-recovery",
    description: "Restore Admin database service via the Supabase provider recovery procedure.",
    markerFn: (_, ops) =>
      ops.toLowerCase().includes("supabase") && ops.includes("restore"),
    locator: "§3 Restore from R2 / provider recovery procedures",
    preferOps: true,
  },
  {
    path: "point-in-time-recovery",
    description:
      "Restore the Admin database to a prior point using Supabase PITR, limited to available retention window.",
    markerFn: (runbook, ops) =>
      runbook.toLowerCase().includes("pitr") ||
      ops.toLowerCase().includes("pitr") ||
      ops.toLowerCase().includes("point-in-time"),
    locator: "§3 Restore from R2: PITR section",
    preferOps: true,
  },
  {
    path: "data-restore",
    description:
      "Restore Admin data from a repository-backed R2 dump artifact (pgdump-admin-*.dump).",
    markerFn: (_, ops) => ops.includes("pgdump-admin"),
    locator: "§1 Nightly backups: backups/admin/pgdump-admin-*.dump",
    preferOps: true,
  },
];

function buildRecoveryPaths(
  specs: readonly RecoveryPathSpec[],
  runbookSource: RepositorySource,
  opsSource: RepositorySource,
): readonly RecoveryPathRecord[] {
  return specs.map((spec) => {
    const documented = spec.markerFn(runbookSource.content, opsSource.content);
    const anchorSource = spec.preferOps ? opsSource : runbookSource;
    return {
      path: spec.path,
      description: spec.description,
      documented,
      source: sourceAt(anchorSource, spec.locator),
    };
  });
}

// ---------------------------------------------------------------------------
// Coverage-gap builders
// ---------------------------------------------------------------------------

interface CoverageCheckSpec {
  readonly id: string;
  readonly label: string;
  readonly markerFn: (runbook: string, ops: string, scripts: Record<string, string>) => boolean;
  readonly risk: Gap["risk"];
  readonly priority: Gap["priority"];
  readonly recommendation: string;
  readonly sourcePaths: (
    runbook: RepositorySource,
    ops: RepositorySource,
    pkg: RepositorySource,
  ) => readonly string[];
}

function buildCoverageChecks(
  databaseLabel: string,
  projectRef: string,
  backupScript: string,
  dumpPattern: string,
): readonly CoverageCheckSpec[] {
  return [
    {
      id: `${databaseLabel}.backup-route.missing`,
      label: `Configured backup route for ${databaseLabel}`,
      markerFn: (_runbook, _ops, scripts) => typeof scripts[backupScript] === "string",
      risk: "critical",
      priority: "P0",
      recommendation: `Declare and document the backup command route for ${databaseLabel} (${projectRef}) in package.json.`,
      sourcePaths: (_runbook, _ops, pkg) => [pkg.source.path],
    },
    {
      id: `${databaseLabel}.backup-source-documented.missing`,
      label: `Documented R2 dump artifact source for ${databaseLabel}`,
      markerFn: (_runbook, ops) => ops.includes(dumpPattern),
      risk: "critical",
      priority: "P0",
      recommendation: `Declare the R2 artifact path for ${databaseLabel} (${projectRef}) in docs/database/ops.md with pattern ${dumpPattern}.`,
      sourcePaths: (_runbook, ops) => [ops.source.path],
    },
    {
      id: `${databaseLabel}.restore-procedure.missing`,
      label: `Documented restore procedure for ${databaseLabel}`,
      markerFn: (runbook, ops) =>
        ops.includes("restore") || runbook.toLowerCase().includes("restore"),
      risk: "critical",
      priority: "P0",
      recommendation: `Document the restore procedure for ${databaseLabel} (${projectRef}) in OPERATIONS_RUNBOOK.md and docs/database/ops.md with a named operator and non-production target.`,
      sourcePaths: (runbook, ops) => [runbook.source.path, ops.source.path],
    },
    {
      id: `${databaseLabel}.owner.missing`,
      label: `Named owner for ${databaseLabel}`,
      markerFn: (runbook, ops) =>
        runbook.toLowerCase().includes("owner") || ops.toLowerCase().includes("owner"),
      risk: "high",
      priority: "P1",
      recommendation: `Name a role or person responsible for ${databaseLabel} (${projectRef}) backup and recovery authorization.`,
      sourcePaths: (runbook, ops) => [runbook.source.path, ops.source.path],
    },
    {
      id: `${databaseLabel}.retention.missing`,
      label: `Retention statement for ${databaseLabel}`,
      markerFn: (_runbook, ops) =>
        ops.toLowerCase().includes("retention") || ops.includes("days"),
      risk: "high",
      priority: "P1",
      recommendation: `Declare the retention duration for ${databaseLabel} (${projectRef}) R2 backup artifacts in docs/database/ops.md.`,
      sourcePaths: (_runbook, ops) => [ops.source.path],
    },
  ];
}

function evaluateCoverageGaps(
  surface: Surface,
  checks: readonly CoverageCheckSpec[],
  runbook: RepositorySource,
  ops: RepositorySource,
  pkg: RepositorySource,
  scripts: Record<string, string>,
): readonly Gap[] {
  const gaps: Gap[] = [];
  for (const check of checks) {
    if (!check.markerFn(runbook.content, ops.content, scripts)) {
      gaps.push({
        id: `${surface}.${check.id}`,
        surface,
        missingOrContradictoryElement: `${check.label} is absent or not declared in reviewed sources.`,
        risk: check.risk,
        priority: check.priority,
        sourcePaths: check.sourcePaths(runbook, ops, pkg),
        recommendedFollowUp: check.recommendation,
      });
    }
  }
  return gaps;
}

// ---------------------------------------------------------------------------
// Per-database record builder
// ---------------------------------------------------------------------------

function buildDatabaseSurfaceRecord(opts: {
  surface: "products-database" | "admin-database";
  projectRef: string;
  ownershipScope: string;
  backupScript: string;
  dumpPattern: string;
  runbook: RepositorySource;
  ops: RepositorySource;
  pkg: RepositorySource;
  scripts: Record<string, string>;
  migrations: readonly RepositorySource[];
  recoveryPathSpecs: readonly RecoveryPathSpec[];
}): DatabaseSurfaceRecord {
  const {
    surface,
    projectRef,
    ownershipScope,
    backupScript,
    dumpPattern,
    runbook,
    ops,
    pkg,
    scripts,
    migrations,
    recoveryPathSpecs,
  } = opts;

  const configuredBackupRoute =
    typeof scripts[backupScript] === "string"
      ? `pnpm run ${backupScript}`
      : `[gap: ${backupScript} not declared in package.json]`;

  const backupsSection = markdownSection(ops.content, /^## (?:\d+\. )?(?:Nightly )?Backups?\b/im);
  const restoreSection = markdownSection(
    ops.content,
    /^## (?:\d+\. )?Restore(?: from R2)?\b/im,
  );
  const recoveryDocumentation =
    [backupsSection, restoreSection].filter(Boolean).join("\n\n").trim() ||
    "[gap: backup and restore sections not found in docs/database/ops.md]";

  const coverageChecks = buildCoverageChecks(surface, projectRef, backupScript, dumpPattern);
  const coverageGaps = evaluateCoverageGaps(
    surface,
    coverageChecks,
    runbook,
    ops,
    pkg,
    scripts,
  );

  const recoveryPaths = buildRecoveryPaths(recoveryPathSpecs, runbook, ops);

  return {
    surface,
    projectRef,
    ownershipScope,
    configuredBackupRoute,
    recoveryDocumentation,
    migrationFiles: migrationFileNames(migrations),
    hasRollbackInstruction: hasRollback(migrations),
    recoveryPaths,
    coverageGaps,
  };
}

// ---------------------------------------------------------------------------
// Main extractor
// ---------------------------------------------------------------------------

/**
 * Extracts separate Products and Admin evidence and coverage assessments from
 * repository-local sources.
 *
 * This function has no network, provider-client, process-spawn, environment-
 * secret-read, database-access, backup, restore, migration, or seed code path.
 * All database state (backup existence, restore result) is represented as
 * `unverified`; repository configuration is `observed-local`.
 *
 * Products is always `erpweaiypimorcunaimz`. Admin is always `rxzpznmxbaoxpikowmfc`.
 * These records are never merged.
 */
export function extractDatabaseReview(sources: DatabaseReviewSources): DatabaseReview {
  const scripts = parsePackageScripts(sources.rootPackage);

  // ── Products ──────────────────────────────────────────────────────────────
  const products = buildDatabaseSurfaceRecord({
    surface: PRODUCTS_SURFACE,
    projectRef: PRODUCTS_DATABASE.projectRef,
    ownershipScope: PRODUCTS_DATABASE.ownershipScope,
    backupScript: "db:backup:products",
    dumpPattern: "pgdump-products",
    runbook: sources.runbook,
    ops: sources.databaseOps,
    pkg: sources.rootPackage,
    scripts,
    migrations: sources.productsMigrationsDir,
    recoveryPathSpecs: PRODUCTS_RECOVERY_PATH_SPECS,
  });

  // ── Admin ─────────────────────────────────────────────────────────────────
  const admin = buildDatabaseSurfaceRecord({
    surface: ADMIN_SURFACE,
    projectRef: ADMIN_DATABASE.projectRef,
    ownershipScope: ADMIN_DATABASE.ownershipScope,
    backupScript: "db:backup:admin",
    dumpPattern: "pgdump-admin",
    runbook: sources.runbook,
    ops: sources.databaseOps,
    pkg: sources.rootPackage,
    scripts,
    migrations: sources.adminMigrationsDir,
    recoveryPathSpecs: ADMIN_RECOVERY_PATH_SPECS,
  });

  // ── Observed configuration facts ─────────────────────────────────────────
  const observedConfiguration: EvidenceFact[] = [
    fact(
      "db.products.project-ref",
      PRODUCTS_SURFACE,
      `Products database project reference is ${PRODUCTS_DATABASE.projectRef}. Ownership scope: ${PRODUCTS_DATABASE.ownershipScope}.`,
      sources.databaseOps,
      "§0 Database identity: Products project ref erpweaiypimorcunaimz",
    ),
    fact(
      "db.admin.project-ref",
      ADMIN_SURFACE,
      `Admin database project reference is ${ADMIN_DATABASE.projectRef}. Ownership scope: ${ADMIN_DATABASE.ownershipScope}.`,
      sources.databaseOps,
      "§0 Database identity: Admin project ref rxzpznmxbaoxpikowmfc",
    ),
    fact(
      "db.products.migration-files",
      PRODUCTS_SURFACE,
      `Products migration directory contains ${sources.productsMigrationsDir.length} file(s): ${migrationFileNames(sources.productsMigrationsDir).join(", ") || "none"}.`,
      sources.productsMigrationsDir[0] ?? sources.databaseOps,
      "site/platform/supabase/migrations/ directory listing",
    ),
    fact(
      "db.admin.migration-files",
      ADMIN_SURFACE,
      `Admin migration directory contains ${sources.adminMigrationsDir.length} file(s): ${migrationFileNames(sources.adminMigrationsDir).join(", ") || "none"}.`,
      sources.adminMigrationsDir[0] ?? sources.databaseOps,
      "site/platform/supabase/migrations.admin/ directory listing",
    ),
    fact(
      "db.products.rollback-instruction",
      PRODUCTS_SURFACE,
      products.hasRollbackInstruction
        ? "Every Products migration file contains a -- rollback section."
        : `Not all Products migration files contain a -- rollback section. ${sources.productsMigrationsDir.length} file(s) reviewed.`,
      sources.productsMigrationsDir[0] ?? sources.databaseOps,
      "-- rollback annotation in each Products migration file",
      products.hasRollbackInstruction ? "observed-local" : "gap",
    ),
    fact(
      "db.admin.rollback-instruction",
      ADMIN_SURFACE,
      admin.hasRollbackInstruction
        ? "Every Admin migration file contains a -- rollback section."
        : `Not all Admin migration files contain a -- rollback section. ${sources.adminMigrationsDir.length} file(s) reviewed.`,
      sources.adminMigrationsDir[0] ?? sources.databaseOps,
      "-- rollback annotation in each Admin migration file",
      admin.hasRollbackInstruction ? "observed-local" : "gap",
    ),
    fact(
      "db.products.backup-route",
      PRODUCTS_SURFACE,
      `Configured Products backup route: ${products.configuredBackupRoute}.`,
      sources.rootPackage,
      "$.scripts.db:backup:products",
    ),
    fact(
      "db.admin.backup-route",
      ADMIN_SURFACE,
      `Configured Admin backup route: ${admin.configuredBackupRoute}.`,
      sources.rootPackage,
      "$.scripts.db:backup:admin",
    ),
    fact(
      "db.ops.recovery-documentation",
      PRODUCTS_SURFACE,
      "docs/database/ops.md contains backup artifact paths and restore procedure documentation reviewed for both Products and Admin.",
      sources.databaseOps,
      "§1 Nightly backups and §3 Restore from R2 sections",
    ),
    fact(
      "db.runbook.rollback-section",
      PRODUCTS_SURFACE,
      "OPERATIONS_RUNBOOK.md contains a rollback or revert-migrations section reviewed for schema rollback ordering.",
      sources.runbook,
      "§4 Rollback: schema-before-code ordering",
    ),
  ];

  // ── Unverified external state ─────────────────────────────────────────────
  const unverifiedExternalState: EvidenceFact[] = [
    fact(
      "db.products.backup-existence.unverified",
      PRODUCTS_SURFACE,
      "Repository configuration does not prove that a Products backup artifact was created; current authorized provider evidence is required.",
      sources.databaseOps,
      "§1 Nightly backups declares pgdump-products-*.dump path but not an observed artifact",
      "unverified",
    ),
    fact(
      "db.admin.backup-existence.unverified",
      ADMIN_SURFACE,
      "Repository configuration does not prove that an Admin backup artifact was created; current authorized provider evidence is required.",
      sources.databaseOps,
      "§1 Nightly backups declares pgdump-admin-*.dump path but not an observed artifact",
      "unverified",
    ),
    fact(
      "db.products.restore-result.unverified",
      PRODUCTS_SURFACE,
      "Repository documentation describes a restore procedure but does not include an observed restore result; current authorized drill evidence is required.",
      sources.databaseOps,
      "§3 Restore from R2: procedure described without observed result",
      "unverified",
    ),
    fact(
      "db.admin.restore-result.unverified",
      ADMIN_SURFACE,
      "Repository documentation describes a restore procedure but does not include an observed restore result; current authorized drill evidence is required.",
      sources.databaseOps,
      "§3 Restore from R2: procedure described without observed result",
      "unverified",
    ),
    fact(
      "db.products.pitr.unverified",
      PRODUCTS_SURFACE,
      "PITR availability and retention window for Products database remain unverified without current authorized Supabase provider evidence.",
      sources.databaseOps,
      "PITR section — provider availability unverified",
      "unverified",
    ),
    fact(
      "db.admin.pitr.unverified",
      ADMIN_SURFACE,
      "PITR availability and retention window for Admin database remain unverified without current authorized Supabase provider evidence.",
      sources.databaseOps,
      "PITR section — provider availability unverified",
      "unverified",
    ),
  ];

  // ── Rollback-instruction cross-database gaps ──────────────────────────────
  const sharedGaps: Gap[] = [];

  if (!products.hasRollbackInstruction && sources.productsMigrationsDir.length > 0) {
    sharedGaps.push({
      id: "db.products.rollback-annotation.missing",
      surface: PRODUCTS_SURFACE,
      missingOrContradictoryElement:
        "One or more Products migration files do not contain a -- rollback section, violating the migration governance requirement.",
      risk: "critical",
      priority: "P0",
      sourcePaths: sources.productsMigrationsDir.map((m) => m.source.path),
      recommendedFollowUp:
        "Add a -- rollback section to every Products migration file in site/platform/supabase/migrations/. See governance-baseline.json P4_migration_no_rollback.",
    });
  }

  if (!admin.hasRollbackInstruction && sources.adminMigrationsDir.length > 0) {
    sharedGaps.push({
      id: "db.admin.rollback-annotation.missing",
      surface: ADMIN_SURFACE,
      missingOrContradictoryElement:
        "One or more Admin migration files do not contain a -- rollback section, violating the migration governance requirement.",
      risk: "critical",
      priority: "P0",
      sourcePaths: sources.adminMigrationsDir.map((m) => m.source.path),
      recommendedFollowUp:
        "Add a -- rollback section to every Admin migration file in site/platform/supabase/migrations.admin/. See governance-baseline.json P4_migration_no_rollback.",
    });
  }

  const combinedGaps: Gap[] = [
    ...sharedGaps,
    ...products.coverageGaps,
    ...admin.coverageGaps,
  ];

  // ── Protected operations ──────────────────────────────────────────────────
  const authorizationGuard = new AuthorizationGuard();
  const protectedOperations: ProtectedOperation[] = [
    authorizationGuard.classify({
      action: "products-backup",
      targetSurface: PRODUCTS_SURFACE,
      expectedEvidence: [
        "Explicit owner authorization naming the Products database target and artifact category.",
        "Authorized backup command output identifying execution and artifact destination.",
        "Authorized R2 object metadata sufficient to assess creation and integrity.",
      ],
    }),
    authorizationGuard.classify({
      action: "admin-backup",
      targetSurface: ADMIN_SURFACE,
      expectedEvidence: [
        "Explicit owner authorization naming the Admin database target and artifact category.",
        "Authorized backup command output identifying execution and artifact destination.",
        "Authorized R2 object metadata sufficient to assess creation and integrity.",
      ],
    }),
    authorizationGuard.classify({
      action: "restore",
      targetSurface: PRODUCTS_SURFACE,
      expectedEvidence: [
        "Explicit owner authorization naming the artifact category and non-production restore target.",
        "Authorized restore-drill evidence identifying the artifact, procedure version, and observed result.",
        "Confirmation that production data was not mutated by this action.",
      ],
    }),
    authorizationGuard.classify({
      action: "restore",
      targetSurface: ADMIN_SURFACE,
      expectedEvidence: [
        "Explicit owner authorization naming the artifact category and non-production restore target.",
        "Authorized restore-drill evidence identifying the artifact, procedure version, and observed result.",
        "Confirmation that production data was not mutated by this action.",
      ],
    }),
    authorizationGuard.classify({
      action: "migration",
      targetSurface: PRODUCTS_SURFACE,
      expectedEvidence: [
        "Explicit owner authorization for the specific Products migration target and version.",
        "Authorized dry-run output confirming no unintended schema changes.",
        "Rollback instruction reviewed and approved before migration executes.",
      ],
    }),
    authorizationGuard.classify({
      action: "migration",
      targetSurface: ADMIN_SURFACE,
      expectedEvidence: [
        "Explicit owner authorization for the specific Admin migration target and version.",
        "Authorized dry-run output confirming no unintended schema changes.",
        "Rollback instruction reviewed and approved before migration executes.",
      ],
    }),
    authorizationGuard.classify({
      action: "seed",
      targetSurface: PRODUCTS_SURFACE,
      expectedEvidence: [
        "Explicit owner authorization for the Products seed operation and non-production target.",
        "Authorized seed command output confirming rows written and no production-data mutation.",
      ],
    }),
    authorizationGuard.classify({
      action: "seed",
      targetSurface: ADMIN_SURFACE,
      expectedEvidence: [
        "Explicit owner authorization for the Admin seed operation and non-production target.",
        "Authorized seed command output confirming rows written and no production-data mutation.",
      ],
    }),
  ];

  return {
    products,
    admin,
    protectedOperations,
    gaps: combinedGaps,
    observedConfiguration,
    unverifiedExternalState,
  };
}
