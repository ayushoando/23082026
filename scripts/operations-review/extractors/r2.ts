import { AuthorizationGuard } from "../authorizationGuard";
import type {
  EvidenceFact,
  Gap,
  ProtectedOperation,
  SourceReference,
} from "../models";
import type { RepositorySource } from "../sourceAdapter";

const R2_SURFACE = "r2-backup" as const;

export const R2_ARTIFACT_CATEGORY_IDS = [
  "database-dumps",
  "catalog-snapshots",
  "repository-backups",
  "delivery-assets",
] as const;

export type R2ArtifactCategoryId = (typeof R2_ARTIFACT_CATEGORY_IDS)[number];
export type R2WorkflowTrigger = "scheduled" | "manual";

export interface R2WorkflowMetadata {
  readonly schedule: string;
  readonly triggerModes: readonly R2WorkflowTrigger[];
  readonly timeoutMinutes: number;
  readonly commandRoute: string;
  /** Names only. Credential values are deliberately never admitted to review output. */
  readonly secretNames: readonly string[];
}

export interface R2CommandRoute {
  readonly command: string;
  readonly purpose: string;
  readonly artifactCategories: readonly R2ArtifactCategoryId[];
  readonly source: SourceReference;
}

export interface R2ArtifactCategory {
  readonly id: R2ArtifactCategoryId;
  readonly description: string;
  readonly declaredArtifactPaths: readonly string[];
  readonly status: "observed-local" | "gap";
  readonly sourceReferences: readonly SourceReference[];
}

export interface R2WorkflowReviewSources {
  readonly workflow: RepositorySource;
  readonly rootPackage: RepositorySource;
  readonly operationsRouter: RepositorySource;
  readonly databaseOperations: RepositorySource;
  readonly runbook: RepositorySource;
}

export interface R2WorkflowExtraction {
  readonly workflow: R2WorkflowMetadata;
  readonly observedConfiguration: readonly EvidenceFact[];
  readonly unverifiedExternalState: readonly EvidenceFact[];
  readonly commandRoutes: readonly R2CommandRoute[];
  readonly artifactCategories: readonly R2ArtifactCategory[];
  readonly gaps: readonly Gap[];
  readonly protectedOperations: readonly ProtectedOperation[];
}

function sourceAt(source: RepositorySource, locator: string): SourceReference {
  return { ...source.source, locator };
}

function fact(
  id: string,
  statement: string,
  source: RepositorySource,
  locator: string,
  status: EvidenceFact["status"] = "observed-local",
): EvidenceFact {
  return {
    id,
    surface: R2_SURFACE,
    statement,
    status,
    source: sourceAt(source, locator),
  };
}

function assertContains(source: RepositorySource, expected: string, locator: string): void {
  if (!source.content.includes(expected)) {
    throw new Error(`${source.source.path} does not contain expected ${locator}.`);
  }
}

function parseWorkflowMetadata(source: RepositorySource): R2WorkflowMetadata {
  const scheduleMatch = source.content.match(
    /^\s*-\s*cron:\s*(?:"([^"]+)"|'([^']+)'|([^\s#]+))\s*$/m,
  );
  const schedule = scheduleMatch?.[1] ?? scheduleMatch?.[2] ?? scheduleMatch?.[3];
  const timeoutMatch = source.content.match(/^\s*timeout-minutes:\s*(\d+)\s*$/m);

  if (!schedule) {
    throw new Error(`${source.source.path} does not declare a scheduled workflow cron expression.`);
  }
  if (!/^\s*workflow_dispatch:\s*$/m.test(source.content)) {
    throw new Error(`${source.source.path} does not declare workflow_dispatch.`);
  }
  if (!timeoutMatch) {
    throw new Error(`${source.source.path} does not declare a workflow timeout.`);
  }
  if (!source.content.includes("pnpm run ops backup:supabase:r2")) {
    throw new Error(`${source.source.path} does not declare the Supabase-to-R2 command route.`);
  }

  const secretNames = Array.from(
    source.content.matchAll(
      /^\s*[A-Z][A-Z0-9_]*:\s*\$\{\{\s*secrets\.([A-Z][A-Z0-9_]*)\s*\}\}\s*$/gm,
    ),
    (match) => match[1],
  );
  const uniqueSecretNames = [...new Set(secretNames)].sort();

  if (uniqueSecretNames.length === 0) {
    throw new Error(`${source.source.path} does not declare workflow secret names.`);
  }

  return {
    schedule,
    triggerModes: ["scheduled", "manual"],
    timeoutMinutes: Number(timeoutMatch[1]),
    commandRoute: "pnpm run ops backup:supabase:r2",
    secretNames: uniqueSecretNames,
  };
}

/**
 * Extracts only repository-configured R2 backup workflow evidence.
 *
 * This parser accepts caller-supplied repository text and has no network,
 * environment, process, provider, backup, retrieval, or output-writing code
 * path. It records credential names only and never exposes credential values.
 */
export function extractR2WorkflowReview(
  sources: R2WorkflowReviewSources,
): R2WorkflowExtraction {
  const workflow = parseWorkflowMetadata(sources.workflow);

  assertContains(
    sources.rootPackage,
    '"r2:backup": "node scripts/run-ops.mjs backup:r2"',
    "$.scripts.r2:backup",
  );
  assertContains(
    sources.rootPackage,
    '"r2:catalog-snapshot": "node scripts/run-ops.mjs catalog:snapshot:r2"',
    "$.scripts.r2:catalog-snapshot",
  );
  assertContains(
    sources.rootPackage,
    '"r2:repo-backup": "node scripts/run-ops.mjs repo:backup:r2"',
    "$.scripts.r2:repo-backup",
  );
  assertContains(
    sources.operationsRouter,
    '"backup:supabase:r2": () => runTsx("db_backup_upload_r2.ts")',
    "COMMANDS.backup:supabase:r2",
  );
  assertContains(
    sources.operationsRouter,
    '"catalog:snapshot:r2": () => runTsx("catalog_snapshot_upload_r2.ts")',
    "COMMANDS.catalog:snapshot:r2",
  );
  assertContains(
    sources.operationsRouter,
    '"repo:backup:r2": () => runTsx("repo_backup_upload_r2.ts")',
    "COMMANDS.repo:backup:r2",
  );
  assertContains(
    sources.databaseOperations,
    "| `backups/products/pgdump-products-*.dump` | Products DB |",
    "§1 Nightly backups Products dump declaration",
  );
  assertContains(
    sources.databaseOperations,
    "| `backups/admin/pgdump-admin-*.dump` | Admin DB |",
    "§1 Nightly backups Admin dump declaration",
  );
  assertContains(
    sources.databaseOperations,
    "| `backups/catalog/catalog-latest.json` | Catalog snapshot for degraded reads |",
    "§1 Nightly backups catalog declaration",
  );
  assertContains(
    sources.databaseOperations,
    "| `backups/repo/oofplweb-*.zip` | Git archive |",
    "§1 Nightly backups repository declaration",
  );
  assertContains(
    sources.runbook,
    "Nightly: `.github/workflows/supabase-backup-r2.yml` (02:15 UTC)",
    "§6 Backups nightly workflow declaration",
  );

  const commandRoutes: R2CommandRoute[] = [
    {
      command: workflow.commandRoute,
      purpose: "CI database-dump upload route.",
      artifactCategories: ["database-dumps"],
      source: sourceAt(sources.workflow, "jobs.backup.steps run: pnpm run ops backup:supabase:r2"),
    },
    {
      command: "pnpm run r2:backup",
      purpose: "Root route for the configured database-dump and repository-backup operations.",
      artifactCategories: ["database-dumps", "repository-backups"],
      source: sourceAt(sources.rootPackage, "$.scripts.r2:backup"),
    },
    {
      command: "pnpm run r2:catalog-snapshot",
      purpose: "Root route for the configured catalog snapshot operation.",
      artifactCategories: ["catalog-snapshots"],
      source: sourceAt(sources.rootPackage, "$.scripts.r2:catalog-snapshot"),
    },
    {
      command: "pnpm run r2:repo-backup",
      purpose: "Root route for the configured repository archive operation.",
      artifactCategories: ["repository-backups"],
      source: sourceAt(sources.rootPackage, "$.scripts.r2:repo-backup"),
    },
  ];

  const databaseArtifactReference = sourceAt(
    sources.databaseOperations,
    "§1 Nightly backups: backups/products/pgdump-products-*.dump and backups/admin/pgdump-admin-*.dump",
  );
  const catalogArtifactReference = sourceAt(
    sources.databaseOperations,
    "§1 Nightly backups: backups/catalog/catalog-latest.json",
  );
  const repositoryArtifactReference = sourceAt(
    sources.databaseOperations,
    "§1 Nightly backups: backups/repo/oofplweb-*.zip",
  );
  const deliveryAssetCoverageReference = sourceAt(
    sources.databaseOperations,
    "§1 Nightly backups R2 path inventory does not declare a delivery-asset backup artifact",
  );

  const artifactCategories: R2ArtifactCategory[] = [
    {
      id: "database-dumps",
      description: "Products and Admin PostgreSQL dump artifacts.",
      declaredArtifactPaths: [
        "backups/products/pgdump-products-*.dump",
        "backups/admin/pgdump-admin-*.dump",
      ],
      status: "observed-local",
      sourceReferences: [databaseArtifactReference],
    },
    {
      id: "catalog-snapshots",
      description: "Catalog snapshot artifact for degraded reads.",
      declaredArtifactPaths: ["backups/catalog/catalog-latest.json"],
      status: "observed-local",
      sourceReferences: [catalogArtifactReference],
    },
    {
      id: "repository-backups",
      description: "Repository archive artifact.",
      declaredArtifactPaths: ["backups/repo/oofplweb-*.zip"],
      status: "observed-local",
      sourceReferences: [repositoryArtifactReference],
    },
    {
      id: "delivery-assets",
      description:
        "Delivery assets are a separate R2 artifact category, but no delivery-asset backup artifact is declared by the reviewed workflow, command routes, or R2 path inventory.",
      declaredArtifactPaths: [],
      status: "gap",
      sourceReferences: [deliveryAssetCoverageReference],
    },
  ];

  const observedConfiguration: EvidenceFact[] = [
    fact(
      "r2.workflow.schedule",
      `The Supabase-to-R2 workflow is configured with cron ${workflow.schedule} and supports scheduled and manual dispatch triggers.`,
      sources.workflow,
      "on.schedule[0].cron and on.workflow_dispatch",
    ),
    fact(
      "r2.workflow.timeout",
      `The configured backup job timeout is ${workflow.timeoutMinutes} minutes.`,
      sources.workflow,
      "jobs.backup.timeout-minutes",
    ),
    fact(
      "r2.workflow.command-route",
      `The configured CI backup command route is ${workflow.commandRoute}.`,
      sources.workflow,
      "jobs.backup.steps run: pnpm run ops backup:supabase:r2",
    ),
    fact(
      "r2.workflow.secret-names",
      `The workflow declares only these required secret names in review output: ${workflow.secretNames.join(", ")}. Credential values are redacted.`,
      sources.workflow,
      "jobs.backup.steps.env secret references",
    ),
    fact(
      "r2.command-routes",
      "Root scripts expose distinct R2 routes for combined backup, catalog snapshot, and repository backup; the operations router maps each underlying operation to a repository script.",
      sources.rootPackage,
      "$.scripts.r2:backup, $.scripts.r2:catalog-snapshot, and $.scripts.r2:repo-backup",
    ),
    fact(
      "r2.artifact-categories",
      "Repository documentation declares separate Products/Admin database dumps, catalog snapshots, and repository backups; delivery-asset backup coverage is not declared.",
      sources.databaseOperations,
      "§1 Nightly backups R2 path inventory",
    ),
  ];

  const unverifiedExternalState: EvidenceFact[] = [
    fact(
      "r2.artifact-creation.unverified",
      "Repository configuration does not prove that any R2 backup artifact was created; current authorized provider evidence is required.",
      sources.workflow,
      "Configured workflow schedule and command do not include an observed R2 object result",
      "unverified",
    ),
    fact(
      "r2.artifact-retention.unverified",
      "Repository configuration does not prove R2 backup artifact retention; current authorized provider evidence is required.",
      sources.databaseOperations,
      "§1 Nightly backups declares paths but no observed retention result",
      "unverified",
    ),
    fact(
      "r2.artifact-integrity.unverified",
      "Repository configuration does not prove R2 backup artifact integrity; current authorized provider evidence is required.",
      sources.workflow,
      "Configured workflow schedule and command do not include an observed integrity result",
      "unverified",
    ),
    fact(
      "r2.artifact-retrievability.unverified",
      "Repository configuration does not prove R2 backup artifact retrievability; current authorized provider evidence is required.",
      sources.databaseOperations,
      "§3 Restore from R2 describes a procedure but not an observed retrieval result",
      "unverified",
    ),
  ];

  const gaps: Gap[] = [
    {
      id: "r2.delivery-assets.backup-coverage.missing",
      surface: R2_SURFACE,
      missingOrContradictoryElement:
        "No delivery-asset backup artifact is declared in the reviewed R2 workflow, command routes, or operations documentation.",
      risk: "high",
      priority: "P1",
      sourcePaths: [
        sources.databaseOperations.source.path,
        sources.rootPackage.source.path,
        sources.operationsRouter.source.path,
      ],
      recommendedFollowUp:
        "An R2 backup owner should decide whether delivery assets require a separately declared backup artifact, then document its route, retention, restore procedure, and verification evidence.",
      namedOwner: "R2 backup owner",
    },
  ];

  const authorizationGuard = new AuthorizationGuard();
  const protectedOperations = [
    authorizationGuard.classify({
      action: "r2-write",
      targetSurface: R2_SURFACE,
      expectedEvidence: [
        "Explicit owner authorization naming the R2 backup target and artifact categories.",
        "Authorized workflow or command output identifying the execution and artifact destinations.",
        "Authorized R2 object metadata sufficient to assess creation, retention, and integrity.",
      ],
    }),
    authorizationGuard.classify({
      action: "r2-retrieval",
      targetSurface: R2_SURFACE,
      expectedEvidence: [
        "Explicit owner authorization naming the artifact category and non-production retrieval purpose.",
        "Authorized retrieval evidence identifying the artifact without exposing credentials.",
        "Restore-drill or integrity evidence recorded under the approved recovery procedure.",
      ],
    }),
  ];

  return {
    workflow,
    observedConfiguration,
    unverifiedExternalState,
    commandRoutes,
    artifactCategories,
    gaps,
    protectedOperations,
  };
}
