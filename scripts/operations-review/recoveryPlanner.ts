/**
 * Recovery planner — read-only repository evidence only.
 *
 * Models code rollback, Worker rollback, Products schema rollback, Admin schema
 * rollback, and data recovery from repository sources. Does not execute any
 * command, perform any database call, or access any external provider.
 *
 * Products database: erpweaiypimorcunaimz
 *   migrations at: site/platform/supabase/migrations/
 *
 * Admin database: rxzpznmxbaoxpikowmfc
 *   migrations at: site/platform/supabase/migrations.admin/
 */

import { AuthorizationGuard } from "./authorizationGuard";
import type { EvidenceFact, Gap, ProtectedOperation, SourceReference } from "./models";
import type { RepositorySource } from "./sourceAdapter";

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

export interface RecoveryReviewSources {
  readonly runbook: RepositorySource;
  readonly vercelConfig: RepositorySource;
  readonly workerConfig: RepositorySource;
  readonly productsMigrations: RepositorySource;
  readonly adminMigrations: RepositorySource;
  readonly databaseOperations: RepositorySource;
  readonly backupWorkflow: RepositorySource;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function sourceAt(source: RepositorySource, locator: string): SourceReference {
  return { ...source.source, locator };
}

function fact(
  id: string,
  surface: EvidenceFact["surface"],
  statement: string,
  source: RepositorySource,
  locator: string,
  status: EvidenceFact["status"] = "observed-local",
): EvidenceFact {
  return { id, surface, statement, status, source: sourceAt(source, locator) };
}

/** Extracts `-- rollback` comment lines from a SQL migration source string. */
function extractRollbackComments(content: string): readonly string[] {
  const lines: string[] = [];
  let inRollback = false;
  for (const raw of content.split("\n")) {
    const line = raw.trimEnd();
    if (/^--\s*rollback\b/i.test(line)) {
      inRollback = true;
      continue;
    }
    if (inRollback) {
      if (line.startsWith("--")) {
        lines.push(line.replace(/^--\s?/, "").trimEnd());
      } else if (line.trim() === "") {
        // blank line ends the rollback block
        inRollback = false;
      } else {
        // non-comment, non-blank line ends rollback block
        inRollback = false;
      }
    }
  }
  return lines.filter((l) => l.trim().length > 0);
}

// ---------------------------------------------------------------------------
// Code rollback
// ---------------------------------------------------------------------------

export interface CodeRollbackPlan {
  /** Ordered steps extracted from runbook and Vercel configuration. */
  readonly steps: readonly string[];
  /** Prerequisites that must be in place before initiating code rollback. */
  readonly prerequisites: readonly string[];
  /** Evidence items expected after a successful rollback. */
  readonly verificationEvidence: readonly string[];
  /** Whether this plan is derived from observed local sources. */
  readonly status: "observed-local" | "unverified";
  /** Source paths consulted to build this plan. */
  readonly sourcePaths: readonly string[];
  readonly observedFacts: readonly EvidenceFact[];
  readonly gaps: readonly Gap[];
  readonly protectedOperations: readonly ProtectedOperation[];
}

export function planCodeRollback(sources: RecoveryReviewSources): CodeRollbackPlan {
  const hasInstantRollback = sources.runbook.content.includes("Instant Rollback");
  const hasRollbackSection = sources.runbook.content.includes("## 4. Rollback");

  const observedFacts: EvidenceFact[] = [
    fact(
      "code-rollback.runbook.rollback-section",
      "vercel-application",
      hasRollbackSection
        ? "OPERATIONS_RUNBOOK.md §4 Rollback describes code and schema rollback order."
        : "OPERATIONS_RUNBOOK.md does not declare a dedicated rollback section.",
      sources.runbook,
      "## 4. Rollback",
      hasRollbackSection ? "observed-local" : "gap",
    ),
    fact(
      "code-rollback.runbook.instant-rollback",
      "vercel-application",
      hasInstantRollback
        ? "OPERATIONS_RUNBOOK.md references Vercel Instant Rollback as a code recovery mechanism."
        : "OPERATIONS_RUNBOOK.md does not mention Vercel Instant Rollback.",
      sources.runbook,
      "§4 Rollback — Instant Rollback reference",
      hasInstantRollback ? "observed-local" : "gap",
    ),
    fact(
      "code-rollback.runbook.schema-order",
      "vercel-application",
      "OPERATIONS_RUNBOOK.md §4 specifies that schema must be reverted before Instant Rollback when schema changed.",
      sources.runbook,
      "§4 Rollback — Code and schema are separate. Revert migrations (newest first) before Instant Rollback if schema moved.",
    ),
    fact(
      "code-rollback.runbook.deploy-order",
      "vercel-application",
      "OPERATIONS_RUNBOOK.md §1 Deploy specifies the release order: migrations → seed → code.",
      sources.runbook,
      "§1 Deploy — Order: migrations → seed → code.",
    ),
  ];

  const gaps: Gap[] = [];

  if (!hasRollbackSection) {
    gaps.push({
      id: "code-rollback.runbook-section.missing",
      surface: "vercel-application",
      missingOrContradictoryElement:
        "OPERATIONS_RUNBOOK.md does not declare a dedicated rollback section.",
      risk: "high",
      priority: "P0",
      sourcePaths: [sources.runbook.source.path],
      recommendedFollowUp:
        "Add a §4 Rollback section to the runbook with explicit ordered steps, schema-before-code ordering, and a named owner.",
      namedOwner: "Release owner",
    });
  }

  const guard = new AuthorizationGuard();
  const protectedOperations: ProtectedOperation[] = [
    guard.classify({
      action: "vercel-deployment",
      targetSurface: "vercel-application",
      expectedEvidence: [
        "Explicit operator authorization naming the target deployment and rollback reason.",
        "Confirmed current backup or recoverable snapshot for any persisted data impacted.",
        "Authorized Vercel deployment status evidence after rollback completes.",
        "Browser smoke-test result recorded under results/.",
      ],
    }),
  ];

  const steps: string[] = [
    "Confirm current deployment state and identify the rollback target deployment.",
    "If the release included a schema migration: revert the migration(s) newest-first using the -- rollback comments in the migration file before initiating code rollback.",
    "If persisted data was mutated: confirm a recoverable backup exists before proceeding.",
    "Use Vercel Instant Rollback to revert to the prior deployment (pnpm run vercel:prod or Vercel dashboard — requires explicit authorization).",
    "Run smoke test: /ooplanner → rail populated → place → save → reload.",
    "Record rollback evidence under results/ per docs/governance/benchmarks.md §7.",
  ];

  const prerequisites: string[] = [
    "Explicit operator authorization for rollback with named target deployment.",
    "Schema migration rollback (if applicable) completed before Vercel code rollback.",
    "Confirmed backup or snapshot for any mutated persisted data.",
    "VERCEL_TOKEN present in .env.local.",
  ];

  const verificationEvidence: string[] = [
    "Vercel dashboard shows the prior deployment is active.",
    "Browser smoke-test passes: /ooplanner → rail populated → place → save → reload.",
    "No 500-class errors in Vercel logs for critical routes.",
    "Evidence recorded under results/.",
  ];

  return {
    steps,
    prerequisites,
    verificationEvidence,
    status: hasRollbackSection ? "observed-local" : "unverified",
    sourcePaths: [sources.runbook.source.path, sources.vercelConfig.source.path],
    observedFacts,
    gaps,
    protectedOperations,
  };
}

// ---------------------------------------------------------------------------
// Worker rollback
// ---------------------------------------------------------------------------

export interface WorkerRollbackPlan {
  readonly steps: readonly string[];
  readonly prerequisites: readonly string[];
  readonly verificationEvidence: readonly string[];
  readonly status: "observed-local" | "unverified";
  readonly sourcePaths: readonly string[];
  readonly observedFacts: readonly EvidenceFact[];
  readonly gaps: readonly Gap[];
  readonly protectedOperations: readonly ProtectedOperation[];
}

export function planWorkerRollback(sources: RecoveryReviewSources): WorkerRollbackPlan {
  const hasWorkerDeploy = sources.runbook.content.includes("pnpm run worker:deploy");
  const hasWorkerTail = sources.runbook.content.includes("pnpm run worker:tail");
  const hasWorkerVerify = sources.runbook.content.includes("x-oando-proxy: r2-fallback");

  const observedFacts: EvidenceFact[] = [
    fact(
      "worker-rollback.runbook.worker-deploy-route",
      "cloudflare-worker",
      hasWorkerDeploy
        ? "OPERATIONS_RUNBOOK.md §1 documents the worker:deploy route."
        : "OPERATIONS_RUNBOOK.md does not document the worker:deploy route.",
      sources.runbook,
      "§1 Deploy — pnpm run worker:deploy",
      hasWorkerDeploy ? "observed-local" : "gap",
    ),
    fact(
      "worker-rollback.runbook.worker-verify",
      "cloudflare-worker",
      hasWorkerVerify
        ? "OPERATIONS_RUNBOOK.md §1 documents Worker verification evidence via x-oando-proxy response header."
        : "OPERATIONS_RUNBOOK.md does not document Worker verification evidence.",
      sources.runbook,
      "§1 Deploy — x-oando-proxy: r2-fallback and x-oando-proxy: r2 verification",
      hasWorkerVerify ? "observed-local" : "gap",
    ),
    fact(
      "worker-rollback.config.wrangler",
      "cloudflare-worker",
      "wrangler.toml provides Worker name and binding configuration as a rollback baseline reference.",
      sources.workerConfig,
      "name, r2_buckets.ASSET_BUCKET",
    ),
    fact(
      "worker-rollback.runbook.independent-deploy",
      "cloudflare-worker",
      "OPERATIONS_RUNBOOK.md §1 notes that the Vercel site auto-deploys on push but the Worker does not; Worker is a manual Cloudflare deploy.",
      sources.runbook,
      "§1 Deploy — manual Cloudflare deploy via wrangler (the Vercel site auto-deploys on push; the worker does not)",
    ),
  ];

  const gaps: Gap[] = [];

  if (!hasWorkerTail) {
    gaps.push({
      id: "worker-rollback.tail-route.missing",
      surface: "cloudflare-worker",
      missingOrContradictoryElement:
        "OPERATIONS_RUNBOOK.md does not document the worker:tail route, which is needed to verify a rollback.",
      risk: "medium",
      priority: "P1",
      sourcePaths: [sources.runbook.source.path],
      recommendedFollowUp:
        "Document the worker:tail command in the runbook rollback/verification procedure.",
      namedOwner: "Worker release owner",
    });
  }

  const guard = new AuthorizationGuard();
  const protectedOperations: ProtectedOperation[] = [
    guard.classify({
      action: "cloudflare-worker-deployment",
      targetSurface: "cloudflare-worker",
      expectedEvidence: [
        "Explicit operator authorization naming the Worker deployment target and rollback reason.",
        "Authorized Cloudflare deployment event evidence identifying the prior version.",
        "Authorized worker:tail output confirming the reverted Worker is active.",
        "Verification: dead asset path returns 200 image/png with x-oando-proxy: r2-fallback header.",
        "Verification: valid asset path returns x-oando-proxy: r2 header.",
      ],
    }),
  ];

  const steps: string[] = [
    "Identify the prior known-good Worker version in the Cloudflare dashboard (requires authorization).",
    "If wrangler.toml was modified in the broken deployment, revert the wrangler.toml change in the repository first.",
    "Deploy the prior Worker version using pnpm run worker:deploy from the target Git revision (requires explicit authorization and CLOUDFLARE_API_TOKEN).",
    "Monitor the Worker with pnpm run worker:tail to confirm the rollback is live.",
    "Verify: dead asset path → 200 image/png with x-oando-proxy: r2-fallback header.",
    "Verify: valid asset path → response with x-oando-proxy: r2 header.",
    "Record rollback evidence under results/.",
  ];

  const prerequisites: string[] = [
    "Explicit operator authorization for Worker rollback with named target version.",
    "CLOUDFLARE_API_TOKEN present in .env.local or as an authorized session secret.",
    "wrangler.toml reverted to the prior known-good state if it was modified.",
    "Worker is deployed independently from Vercel; Vercel rollback does not roll back the Worker.",
  ];

  const verificationEvidence: string[] = [
    "Cloudflare dashboard shows the prior Worker version is active.",
    "worker:tail output shows no error responses.",
    "Dead asset path returns 200 image/png with x-oando-proxy: r2-fallback header.",
    "Valid asset path returns x-oando-proxy: r2 header.",
    "Evidence recorded under results/.",
  ];

  return {
    steps,
    prerequisites,
    verificationEvidence,
    status: hasWorkerDeploy ? "observed-local" : "unverified",
    sourcePaths: [sources.runbook.source.path, sources.workerConfig.source.path],
    observedFacts,
    gaps,
    protectedOperations,
  };
}

// ---------------------------------------------------------------------------
// Schema rollback (shared shape, separate Products and Admin functions)
// ---------------------------------------------------------------------------

export interface SchemaRollbackPlan {
  readonly databaseOwner: "products" | "admin";
  readonly projectRef: string;
  readonly migrationsPath: string;
  /**
   * Rollback steps parsed from `-- rollback` comment blocks in migration files.
   * Ordered newest-first per the runbook.
   */
  readonly rollbackStepsFromMigrations: readonly string[];
  readonly steps: readonly string[];
  readonly prerequisites: readonly string[];
  readonly verificationEvidence: readonly string[];
  readonly status: "observed-local" | "unverified";
  readonly sourcePaths: readonly string[];
  readonly observedFacts: readonly EvidenceFact[];
  readonly gaps: readonly Gap[];
  readonly protectedOperations: readonly ProtectedOperation[];
}

function buildSchemaRollbackPlan(
  owner: "products" | "admin",
  projectRef: string,
  migrationsPath: string,
  migrationsSource: RepositorySource,
  runbookSource: RepositorySource,
): SchemaRollbackPlan {
  const surface: EvidenceFact["surface"] =
    owner === "products" ? "products-database" : "admin-database";

  const rollbackStepsFromMigrations = extractRollbackComments(migrationsSource.content);
  const hasRollbackComments = rollbackStepsFromMigrations.length > 0;
  const hasGovernanceCheck = runbookSource.content.includes("check:governance");
  const hasMigrationOrder = runbookSource.content.includes("## 2. Migration");

  const observedFacts: EvidenceFact[] = [
    {
      id: `${owner}-schema-rollback.migrations.rollback-comments`,
      surface,
      statement: hasRollbackComments
        ? `${migrationsSource.source.path} contains -- rollback comment blocks. ${rollbackStepsFromMigrations.length} rollback step(s) extracted.`
        : `${migrationsSource.source.path} does not contain -- rollback comment blocks; rollback steps are unverified.`,
      status: hasRollbackComments ? "observed-local" : "gap",
      source: sourceAt(migrationsSource, "-- rollback comment blocks (newest-first per runbook §4)"),
    },
    fact(
      `${owner}-schema-rollback.runbook.governance`,
      surface,
      hasGovernanceCheck
        ? "OPERATIONS_RUNBOOK.md §2 specifies check:governance verifies rollback presence in migrations."
        : "OPERATIONS_RUNBOOK.md does not reference check:governance for migration rollback verification.",
      runbookSource,
      "§2 Migration — check:governance",
      hasGovernanceCheck ? "observed-local" : "gap",
    ),
    fact(
      `${owner}-schema-rollback.runbook.order`,
      surface,
      "OPERATIONS_RUNBOOK.md §4 specifies schema must be reverted newest-first before Instant Rollback if schema moved.",
      runbookSource,
      "§4 Rollback — Revert migrations (newest first, hand-run -- rollback:) before Instant Rollback if schema moved.",
    ),
    fact(
      `${owner}-schema-rollback.runbook.hazard`,
      surface,
      "OPERATIONS_RUNBOOK.md §4 identifies the legacy-tables-in-archive hazard: do not roll code past schema without reverting.",
      runbookSource,
      "§4 Rollback — Hazard: legacy tables now in archive are invisible to PostgREST",
    ),
  ];

  const gaps: Gap[] = [];

  if (!hasRollbackComments) {
    gaps.push({
      id: `${owner}-schema-rollback.rollback-comments.missing`,
      surface,
      missingOrContradictoryElement: `The reviewed ${migrationsPath} source does not contain -- rollback comment blocks. Rollback steps cannot be derived from repository evidence.`,
      risk: "critical",
      priority: "P0",
      sourcePaths: [migrationsSource.source.path, runbookSource.source.path],
      recommendedFollowUp: `Add -- rollback comment blocks to every migration file under ${migrationsPath}. Run check:governance to verify the ratchet passes.`,
      namedOwner: `${owner === "products" ? "Products" : "Admin"} database owner`,
    });
  }

  const dbLabel = owner === "products" ? "Products" : "Admin";
  const applyCommand = owner === "products" ? "pnpm run db:apply" : "pnpm run db:apply:admin";
  const typesCommand = owner === "products" ? "pnpm run db:types" : "pnpm run db:types:admin";
  const guard = new AuthorizationGuard();
  const protectedOperations: ProtectedOperation[] = [
    guard.classify({
      action: "migration",
      targetSurface: surface,
      expectedEvidence: [
        `Explicit operator authorization naming the ${dbLabel} target migration(s) to revert.`,
        `Confirmed backup of the ${dbLabel} database (project ref ${projectRef}) taken before rollback.`,
        `Dry-run output from ${applyCommand} -- --dry showing the rollback SQL.`,
        `Authorized ${applyCommand} execution output confirming the rollback was applied.`,
        `Types regenerated with ${typesCommand} and typecheck passing after rollback.`,
        `pnpm run db:test passing after rollback.`,
      ],
    }),
  ];

  const steps: string[] = [
    `Confirm the target migration(s) to revert under ${migrationsPath}. Identify them by timestamp, newest-first.`,
    `Take or verify a backup of the ${dbLabel} database (project ref ${projectRef}) before any schema change.`,
    "Extract the -- rollback comment block from the target migration file(s) to obtain the rollback SQL.",
    `Run a dry-run: ${applyCommand} -- --dry. Review the plan before applying.`,
    `Apply the rollback SQL manually or via ${applyCommand} (requires explicit authorization).`,
    `Regenerate types: ${typesCommand}, then pnpm run typecheck.`,
    "Run pnpm run db:test to confirm database state is consistent.",
    "Record rollback evidence under results/.",
  ];

  const prerequisites: string[] = [
    `Explicit operator authorization for ${dbLabel} schema rollback with named target migration(s).`,
    `Confirmed backup of ${dbLabel} database (project ref ${projectRef}).`,
    "check:governance passes on the current migration set (verifies rollback comment presence).",
    "Schema rollback must be performed before code rollback (Instant Rollback) per runbook §4.",
  ];

  const verificationEvidence: string[] = [
    `pnpm run db:test passes against the ${dbLabel} database.`,
    `${typesCommand} and pnpm run typecheck pass.`,
    "No PGRST204 column errors in application logs.",
    "No 'relation does not exist' errors in application logs.",
    "Evidence recorded under results/.",
  ];

  return {
    databaseOwner: owner,
    projectRef,
    migrationsPath,
    rollbackStepsFromMigrations,
    steps,
    prerequisites,
    verificationEvidence,
    status: hasRollbackComments ? "observed-local" : "unverified",
    sourcePaths: [migrationsSource.source.path, runbookSource.source.path],
    observedFacts,
    gaps,
    protectedOperations,
  };
}

/**
 * Plans schema rollback for the Products database (erpweaiypimorcunaimz).
 * Reads only `site/platform/supabase/migrations/` — NOT migrations.admin/.
 */
export function planProductsSchemaRollback(sources: RecoveryReviewSources): SchemaRollbackPlan {
  return buildSchemaRollbackPlan(
    "products",
    "erpweaiypimorcunaimz",
    "site/platform/supabase/migrations/",
    sources.productsMigrations,
    sources.runbook,
  );
}

/**
 * Plans schema rollback for the Admin database (rxzpznmxbaoxpikowmfc).
 * Reads only `site/platform/supabase/migrations.admin/`.
 */
export function planAdminSchemaRollback(sources: RecoveryReviewSources): SchemaRollbackPlan {
  return buildSchemaRollbackPlan(
    "admin",
    "rxzpznmxbaoxpikowmfc",
    "site/platform/supabase/migrations.admin/",
    sources.adminMigrations,
    sources.runbook,
  );
}

// ---------------------------------------------------------------------------
// Data recovery
// ---------------------------------------------------------------------------

export interface DataRecoveryPlan {
  readonly steps: readonly string[];
  readonly prerequisites: readonly string[];
  readonly verificationEvidence: readonly string[];
  /** Distinct recovery paths modelled from repository evidence. */
  readonly recoveryPaths: readonly DataRecoveryPath[];
  readonly status: "observed-local" | "unverified";
  readonly sourcePaths: readonly string[];
  readonly observedFacts: readonly EvidenceFact[];
  readonly gaps: readonly Gap[];
  readonly protectedOperations: readonly ProtectedOperation[];
}

export interface DataRecoveryPath {
  readonly id: string;
  readonly description: string;
  readonly trigger: string;
  readonly sourcePaths: readonly string[];
  readonly status: "observed-local" | "unverified";
}

export function planDataRecovery(sources: RecoveryReviewSources): DataRecoveryPlan {
  const hasR2BackupRef = sources.runbook.content.includes("supabase-backup-r2.yml");
  const hasPitrRef =
    sources.databaseOperations.content.includes("PITR") ||
    sources.databaseOperations.content.includes("point-in-time");
  const hasRestoreSection =
    sources.databaseOperations.content.includes("Restore from R2") ||
    sources.databaseOperations.content.includes("restore");
  const hasCatalogOutageRef = sources.runbook.content.includes("Catalog outage");

  const observedFacts: EvidenceFact[] = [
    fact(
      "data-recovery.runbook.nightly-backup",
      "r2-backup",
      hasR2BackupRef
        ? "OPERATIONS_RUNBOOK.md §6 documents nightly backup via supabase-backup-r2.yml (02:15 UTC)."
        : "OPERATIONS_RUNBOOK.md does not reference the nightly backup workflow.",
      sources.runbook,
      "§6 Backups — Nightly: .github/workflows/supabase-backup-r2.yml (02:15 UTC)",
      hasR2BackupRef ? "observed-local" : "gap",
    ),
    fact(
      "data-recovery.runbook.catalog-outage",
      "r2-backup",
      hasCatalogOutageRef
        ? "OPERATIONS_RUNBOOK.md §5 Incidents lists Catalog outage as a known incident and references docs/database/ops.md."
        : "OPERATIONS_RUNBOOK.md does not list Catalog outage as a known incident.",
      sources.runbook,
      "§5 Incidents — Catalog outage: R2 fallback — docs/database/ops.md",
      hasCatalogOutageRef ? "observed-local" : "gap",
    ),
    fact(
      "data-recovery.databaseOperations.restore-section",
      "r2-backup",
      hasRestoreSection
        ? "docs/database/ops.md contains a Restore from R2 section documenting the recovery procedure."
        : "docs/database/ops.md does not contain a restore procedure.",
      sources.databaseOperations,
      "§3 Restore from R2",
      hasRestoreSection ? "observed-local" : "gap",
    ),
    fact(
      "data-recovery.databaseOperations.pitr",
      "r2-backup",
      hasPitrRef
        ? "docs/database/ops.md references provider point-in-time recovery (PITR) as a recovery path."
        : "docs/database/ops.md does not reference provider PITR.",
      sources.databaseOperations,
      "§4 Provider recovery / PITR",
      hasPitrRef ? "observed-local" : "unverified",
    ),
    fact(
      "data-recovery.backup-workflow.schedule",
      "r2-backup",
      "The nightly backup workflow is scheduled at 02:15 UTC and supports manual dispatch.",
      sources.backupWorkflow,
      "on.schedule[0].cron and on.workflow_dispatch",
    ),
  ];

  const gaps: Gap[] = [];

  if (!hasRestoreSection) {
    gaps.push({
      id: "data-recovery.restore-procedure.missing",
      surface: "r2-backup",
      missingOrContradictoryElement:
        "docs/database/ops.md does not contain a documented Restore from R2 procedure.",
      risk: "critical",
      priority: "P0",
      sourcePaths: [sources.databaseOperations.source.path],
      recommendedFollowUp:
        "Add a Restore from R2 section to docs/database/ops.md with step-by-step instructions for Products and Admin database restore from R2 artifacts.",
      namedOwner: "Database owner",
    });
  }

  if (!hasPitrRef) {
    gaps.push({
      id: "data-recovery.pitr.missing",
      surface: "r2-backup",
      missingOrContradictoryElement:
        "docs/database/ops.md does not document provider PITR as a recovery path.",
      risk: "high",
      priority: "P1",
      sourcePaths: [sources.databaseOperations.source.path],
      recommendedFollowUp:
        "Document provider point-in-time recovery (PITR) for both Products and Admin databases under docs/database/ops.md.",
      namedOwner: "Database owner",
    });
  }

  const recoveryPaths: DataRecoveryPath[] = [
    {
      id: "r2-database-restore",
      description:
        "Restore Products or Admin database from nightly R2 dump artifact (backups/products/pgdump-products-*.dump or backups/admin/pgdump-admin-*.dump).",
      trigger: "Database corruption, accidental data deletion, or irrecoverable schema state.",
      sourcePaths: [sources.databaseOperations.source.path, sources.backupWorkflow.source.path],
      status: hasRestoreSection ? "observed-local" : "unverified",
    },
    {
      id: "r2-catalog-restore",
      description:
        "Restore catalog from nightly R2 catalog snapshot artifact (backups/catalog/catalog-latest.json) for degraded reads.",
      trigger: "Catalog outage; R2 fallback as referenced in runbook §5 Incidents.",
      sourcePaths: [sources.runbook.source.path, sources.databaseOperations.source.path],
      status: hasCatalogOutageRef ? "observed-local" : "unverified",
    },
    {
      id: "provider-pitr",
      description:
        "Provider point-in-time recovery for Products (erpweaiypimorcunaimz) or Admin (rxzpznmxbaoxpikowmfc) via Supabase dashboard.",
      trigger: "Data loss event requiring granular point-in-time restoration.",
      sourcePaths: [sources.databaseOperations.source.path],
      status: hasPitrRef ? "observed-local" : "unverified",
    },
    {
      id: "repository-restore",
      description:
        "Restore repository from nightly R2 repository archive (backups/repo/oofplweb-*.zip).",
      trigger: "Repository corruption or catastrophic loss.",
      sourcePaths: [sources.databaseOperations.source.path, sources.backupWorkflow.source.path],
      status: hasR2BackupRef ? "observed-local" : "unverified",
    },
  ];

  const guard = new AuthorizationGuard();
  const protectedOperations: ProtectedOperation[] = [
    guard.classify({
      action: "restore",
      targetSurface: "products-database",
      expectedEvidence: [
        "Explicit operator authorization naming the Products database (erpweaiypimorcunaimz) and restore purpose.",
        "Authorized R2 artifact retrieval evidence identifying the specific dump artifact.",
        "Confirmed non-production restore target if applicable.",
        "pnpm run db:test passing after restore.",
        "Restore evidence recorded under results/.",
      ],
    }),
    guard.classify({
      action: "restore",
      targetSurface: "admin-database",
      expectedEvidence: [
        "Explicit operator authorization naming the Admin database (rxzpznmxbaoxpikowmfc) and restore purpose.",
        "Authorized R2 artifact retrieval evidence identifying the specific dump artifact.",
        "Confirmed non-production restore target if applicable.",
        "pnpm run db:test passing after restore.",
        "Restore evidence recorded under results/.",
      ],
    }),
    guard.classify({
      action: "restore",
      targetSurface: "r2-backup",
      expectedEvidence: [
        "Explicit operator authorization naming the catalog snapshot artifact and restore purpose.",
        "Authorized R2 artifact retrieval evidence identifying the catalog-latest.json artifact.",
        "Application catalog route returning correct data after restore.",
        "Restore evidence recorded under results/.",
      ],
    }),
  ];

  const steps: string[] = [
    "Identify the recovery path: R2 database restore, R2 catalog restore, provider PITR, or repository restore.",
    "Obtain explicit operator authorization naming the recovery target and path.",
    "For R2 database restore: retrieve the relevant dump artifact from R2 (backups/products/ or backups/admin/) — requires authorization.",
    "For provider PITR: access the Supabase dashboard for the relevant project (erpweaiypimorcunaimz or rxzpznmxbaoxpikowmfc) — requires authorization.",
    "For catalog restore: retrieve catalog-latest.json from R2 (backups/catalog/) — requires authorization.",
    "Apply the restore to a non-production target first when possible; document the data-handling boundary.",
    "Run pnpm run db:test after database restore to confirm state consistency.",
    "Verify application routes are responding correctly.",
    "Record restore evidence under results/.",
  ];

  const prerequisites: string[] = [
    "Explicit operator authorization naming recovery target, path, and reason.",
    "Identified backup artifact (dump file, catalog snapshot, or PITR timestamp).",
    "Non-production restore target confirmed if performing a drill.",
    "SUPABASE_SERVICE_ROLE_KEY or provider credentials available in .env.local (never client-side).",
    "Pre-2026-08-01 dumps may contain legacy public tables — validate before applying.",
  ];

  const verificationEvidence: string[] = [
    "pnpm run db:test passes for the restored database.",
    "Application routes return correct data with no 500-class errors.",
    "No 'relation does not exist' or PGRST204 errors in logs.",
    "Restore evidence recorded under results/.",
  ];

  const overallStatus: "observed-local" | "unverified" =
    hasR2BackupRef && hasRestoreSection ? "observed-local" : "unverified";

  return {
    steps,
    prerequisites,
    verificationEvidence,
    recoveryPaths,
    status: overallStatus,
    sourcePaths: [
      sources.runbook.source.path,
      sources.databaseOperations.source.path,
      sources.backupWorkflow.source.path,
    ],
    observedFacts,
    gaps,
    protectedOperations,
  };
}

// ---------------------------------------------------------------------------
// Aggregate summary
// ---------------------------------------------------------------------------

export interface RecoveryPlanSummary {
  readonly codeRollback: CodeRollbackPlan;
  readonly workerRollback: WorkerRollbackPlan;
  readonly productsSchemaRollback: SchemaRollbackPlan;
  readonly adminSchemaRollback: SchemaRollbackPlan;
  readonly dataRecovery: DataRecoveryPlan;
}

export function buildRecoveryPlanSummary(sources: RecoveryReviewSources): RecoveryPlanSummary {
  return {
    codeRollback: planCodeRollback(sources),
    workerRollback: planWorkerRollback(sources),
    productsSchemaRollback: planProductsSchemaRollback(sources),
    adminSchemaRollback: planAdminSchemaRollback(sources),
    dataRecovery: planDataRecovery(sources),
  };
}
