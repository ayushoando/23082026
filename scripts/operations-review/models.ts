/**
 * Read-only operations-review domain model.
 *
 * These types model repository evidence only. They intentionally provide no
 * execution, provider-client, environment, or output-writing capability.
 */

export const PRODUCTS_DATABASE = {
  owner: "products",
  projectRef: "erpweaiypimorcunaimz",
  ownershipScope: "marketing catalog and configurator data",
} as const;

export const ADMIN_DATABASE = {
  owner: "admin",
  projectRef: "rxzpznmxbaoxpikowmfc",
  ownershipScope:
    "staff, customer, plan, furniture, descriptor, price-book, audit, and customer-query data",
} as const;

export type DatabaseOwner = typeof PRODUCTS_DATABASE | typeof ADMIN_DATABASE;
export type DatabaseOwnerId = DatabaseOwner["owner"];
export type DatabaseProjectRef = DatabaseOwner["projectRef"];

export const DATABASE_OWNERS: readonly DatabaseOwner[] = [
  PRODUCTS_DATABASE,
  ADMIN_DATABASE,
];

export type EvidenceStatus =
  | "observed-local"
  | "observed-authorized"
  | "unverified"
  | "gap";

export type Surface =
  | "vercel-application"
  | "cloudflare-worker"
  | "products-database"
  | "admin-database"
  | "r2-backup"
  | "monitoring"
  | "runbook-ci-alignment";

export type ReleaseSurface = "vercel-application" | "cloudflare-worker";
export type DatabaseSurface = "products-database" | "admin-database";
export type Priority = "P0" | "P1" | "P2" | "P3";
export type Risk = "critical" | "high" | "medium" | "low";
export type OperationClass =
  | "repository-read"
  | "protected-operation"
  | "pending-authorization";
export type ProtectedOperationStatus = "not-run" | "pending-authorization";
export type RecoveryPath =
  | "vercel-code-rollback"
  | "worker-code-rollback"
  | "products-schema-rollback"
  | "admin-schema-rollback"
  | "provider-recovery"
  | "point-in-time-recovery"
  | "data-restore"
  | "catalog-restore"
  | "repository-restore";
export type RestoreDrillPath = "products" | "admin" | "catalog" | "repository";

/** Repository path, in-file locator, and content digest for a reviewed fact. */
export interface SourceReference {
  readonly path: string;
  readonly locator: string;
  readonly observedAt: string;
  readonly contentDigest: string;
}

/** User-supplied provider evidence; never holds raw provider output or credentials. */
export interface AuthorizedEvidenceReference {
  readonly suppliedBy: string;
  readonly collectedAt: string;
  readonly authorizationReference: string;
  readonly summary: string;
}

/** Every observed fact requires repository provenance. */
export interface EvidenceFact {
  readonly id: string;
  readonly surface: Surface;
  readonly statement: string;
  readonly status: EvidenceStatus;
  readonly source: SourceReference;
  readonly externalEvidence?: AuthorizedEvidenceReference;
}

export interface ProtectedOperation {
  readonly operation: string;
  readonly targetSurface: Surface;
  readonly classification: "protected-operation";
  readonly requiredAuthorization: string;
  readonly expectedEvidence: readonly string[];
  readonly executionStatus: ProtectedOperationStatus;
}

export interface Gap {
  readonly id: string;
  readonly surface: Surface;
  readonly missingOrContradictoryElement: string;
  readonly risk: Risk;
  readonly priority: Priority;
  readonly sourcePaths: readonly string[];
  readonly recommendedFollowUp: string;
  readonly namedOwner?: string;
}

export interface PersistedDataImpact {
  readonly databaseOwners: readonly DatabaseSurface[];
  readonly migrationImpact: string;
  readonly seedImpact: string;
  readonly backupPrerequisite: string;
  readonly compatibilityHazard: string;
  readonly codeReleaseOrder: string;
}

export interface ReleaseDecision {
  readonly surface: ReleaseSurface;
  readonly approvalPoint: string;
  readonly rollbackOrRecoveryProcedure: string;
  readonly expectedVerificationEvidence: readonly string[];
  readonly persistedDataImpact?: PersistedDataImpact;
}

export interface RestoreDrill {
  readonly recoveryPath: RestoreDrillPath;
  readonly authorizedOperator: string;
  readonly nonProductionTarget: string;
  readonly artifactCategory: string;
  readonly recoveryObjective: string;
  readonly successEvidence: readonly string[];
  readonly dataHandlingBoundary: string;
  readonly cleanupOrRollback: string;
  readonly execution: ProtectedOperation;
}

export interface AlignmentDifference {
  readonly surface: Surface;
  readonly dimension:
    | "command"
    | "owner"
    | "environment"
    | "order"
    | "approval"
    | "recovery";
  readonly sourcePaths: readonly [string, string];
  readonly exactDifference: string;
  readonly recommendedResolution: string;
}

export interface EvidenceRecord {
  readonly metadata: {
    readonly generatedAt: string;
    readonly repositoryRevision?: string;
    readonly scope: string;
  };
  readonly observedConfiguration: readonly EvidenceFact[];
  readonly unverifiedExternalState: readonly EvidenceFact[];
  readonly protectedOperations: readonly ProtectedOperation[];
  readonly gapsAndRecommendations: readonly Gap[];
  readonly ownerDecisions: readonly string[];
  readonly releaseDecisions: readonly ReleaseDecision[];
  readonly restoreDrills: readonly RestoreDrill[];
  readonly alignmentDifferences: readonly AlignmentDifference[];
}
