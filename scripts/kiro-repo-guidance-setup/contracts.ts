/**
 * Shared, side-effect-free contracts for the kiro-repo-guidance-setup wave.
 *
 * This module is intentionally data-only.  Evaluators, repository guards, and
 * integration stages consume these records; this file does not read the
 * filesystem, invoke commands, contact external services, or enable anything.
 */

export type IsoDate = string;
export type Identifier = string;
export type RepositoryPath = string;
export type UrlOrPath = string;
export type RollbackPath = string;
export type Blocker = string | "none";

export type EvidenceState =
  | "Documented"
  | "Observed"
  | "Unverified"
  | "Owner_Decision"
  | "Approval_Boundary"
  | "Validated";

export const EVIDENCE_STATES = [
  "Documented",
  "Observed",
  "Unverified",
  "Owner_Decision",
  "Approval_Boundary",
  "Validated",
] as const satisfies readonly EvidenceState[];

export type InventoryStatus =
  | "present and readable"
  | "present but unreadable"
  | "absent"
  | "unknown";

export const INVENTORY_STATUSES = [
  "present and readable",
  "present but unreadable",
  "absent",
  "unknown",
] as const satisfies readonly InventoryStatus[];

export type CapabilityDisposition =
  | "apply"
  | "retain"
  | "update"
  | "merge"
  | "add"
  | "observe"
  | "defer"
  | "disable"
  | "retire"
  | "exclude";

export const CAPABILITY_DISPOSITIONS = [
  "apply",
  "retain",
  "update",
  "merge",
  "add",
  "observe",
  "defer",
  "disable",
  "retire",
  "exclude",
] as const satisfies readonly CapabilityDisposition[];

export type HandoverDisposition =
  | "installed"
  | "retained"
  | "updated"
  | "merged"
  | "added"
  | "deferred"
  | "observed"
  | "retired"
  | "excluded"
  | "disabled";

export const HANDOVER_DISPOSITIONS = [
  "installed",
  "retained",
  "updated",
  "merged",
  "added",
  "deferred",
  "observed",
  "retired",
  "excluded",
  "disabled",
] as const satisfies readonly HandoverDisposition[];

export type CompatibilityStatus =
  | "applicable"
  | "not applicable with reason"
  | "Unverified";

export type ValidationResult = "pass" | "fail" | "blocked" | "not_run" | "partial";

export const VALIDATION_RESULTS = [
  "pass",
  "fail",
  "blocked",
  "not_run",
  "partial",
] as const satisfies readonly ValidationResult[];

export type MaintenanceRisk = "low" | "medium" | "high" | "unknown with reason";
export type RepositoryAnswer = "Answered" | "Not_Answered" | "Not_Testable";
export type EvidenceFreshness = "fresh" | "historical" | "none";
export type EnablementStatus = "blocked" | "deferred" | "enabled-valid";
export type DefaultTaskConcurrency = 0 | 1;
export type ReviewerConcurrency = 1;
export type ReviewerIterationCeiling = 0 | 1 | 2 | 3;
export type FeatureWaveAgentCount = 0 | 1 | 2 | 3 | 4;

export const REVIEWER_ITERATION_CEILINGS = [0, 1, 2, 3] as const satisfies readonly ReviewerIterationCeiling[];
export const DEFAULT_TASK_CONCURRENCY_VALUES = [0, 1] as const satisfies readonly DefaultTaskConcurrency[];
export const FEATURE_WAVE_AGENT_COUNTS = [0, 1, 2, 3, 4] as const satisfies readonly FeatureWaveAgentCount[];

export type KiroSurface =
  | "IDE"
  | "CLI 2.x"
  | "CLI 3.x"
  | "Web"
  | "Mobile"
  | "Cloud/Crew"
  | "Local_Repository_Surface";

export type SurfaceVersion =
  | { readonly surface: "IDE"; readonly version: "current" }
  | { readonly surface: "CLI 2.x"; readonly version: "2.x" }
  | { readonly surface: "CLI 3.x"; readonly version: "3.x" }
  | { readonly surface: "Web"; readonly version: "current" }
  | { readonly surface: "Mobile"; readonly version: "current" }
  | { readonly surface: "Cloud/Crew"; readonly version: "current" }
  | { readonly surface: "Local_Repository_Surface"; readonly version: "repository" };

export const REQUIRED_SURFACE_VERSIONS = [
  { surface: "IDE", version: "current" },
  { surface: "CLI 2.x", version: "2.x" },
  { surface: "CLI 3.x", version: "3.x" },
  { surface: "Web", version: "current" },
  { surface: "Mobile", version: "current" },
  { surface: "Cloud/Crew", version: "current" },
  { surface: "Local_Repository_Surface", version: "repository" },
] as const satisfies readonly SurfaceVersion[];

export type SkillCandidate =
  | "repo-map"
  | "graph-impact"
  | "verify-and-gate"
  | "fork-boundaries"
  | "focss-css"
  | "db-migrations";

export const INITIAL_SKILL_CANDIDATES = [
  "repo-map",
  "graph-impact",
  "verify-and-gate",
  "fork-boundaries",
  "focss-css",
  "db-migrations",
] as const satisfies readonly SkillCandidate[];

export type OwnerDecisionId =
  | "OD-01"
  | "OD-02"
  | "OD-03"
  | "OD-04"
  | "OD-05"
  | "OD-06"
  | "OD-07"
  | "OD-08"
  | "OD-09"
  | "OD-10";

export const OWNER_DECISION_IDS = [
  "OD-01",
  "OD-02",
  "OD-03",
  "OD-04",
  "OD-05",
  "OD-06",
  "OD-07",
  "OD-08",
  "OD-09",
  "OD-10",
] as const satisfies readonly OwnerDecisionId[];

export type SelectedOwnerPolicy = "enable after validation";
export type ApprovalStatus =
  | "pending"
  | "owner-approved"
  | "owner-approved-conditional"
  | "rejected"
  | "expired";
export type UnresolvedStatus = "resolved" | "unresolved";

export type Availability =
  | "available"
  | "redirected"
  | "inaccessible"
  | "contradictory"
  | "impossible_to_match";

export type SourceKind = "official_url" | "repository_file" | "command" | "surface_probe";
export type RetrievalMethod = "official_sitemap" | "official_search" | "file_read" | "repository_command" | "surface_interaction";
export type DiscoveryMethod = "sitemap" | "official_search" | "linked_page" | "repository_seed";
export type AuthorityRank =
  | "user"
  | "live_code_or_fresh_command"
  | "AGENTS.md"
  | "Agents/*"
  | "canonical_docs/*"
  | "official_documentation"
  | "active_plan"
  | "handover_note"
  | "historical_evidence";
export type TrustDecision = "trusted" | "untrusted" | "unresolved";
export type DispositionStatus = "reviewed" | "excluded" | "unavailable" | "pending";
export type Applicability = "applicable" | "not_applicable_with_reason" | "unresolved";

export interface EvidenceProvenance {
  readonly observer: string;
  readonly cwdOrSurface: string;
  readonly commandOrPath: string;
  readonly result: string;
  readonly integrityBasis?: string;
}

export interface SourceRecord {
  readonly sourceId: Identifier;
  readonly kind: SourceKind;
  readonly locator: UrlOrPath;
  readonly canonicalLocator?: UrlOrPath;
  readonly title?: string;
  readonly officialDocumentationFamily?: string;
  readonly displayedDate?: IsoDate;
  readonly reviewDateUtc: IsoDate;
  readonly retrievalMethod: RetrievalMethod;
  readonly revisionOrVersion?: string;
  readonly surfaceApplicability: readonly KiroSurface[];
  readonly versionSensitiveClaim: boolean;
  readonly availability: Availability;
  readonly evidenceState: EvidenceState;
  readonly provenance: EvidenceProvenance;
  readonly trustDecision: TrustDecision;
  readonly authorityRank?: AuthorityRank;
  readonly claims: readonly Identifier[];
  readonly validationRunRefs: readonly Identifier[];
  readonly disposition: CapabilityDisposition;
  readonly limitation?: string;
}

export interface SourceInventory {
  readonly reviewDateUtc: IsoDate;
  readonly activeSurfaces: readonly KiroSurface[];
  readonly discoveryMethod: string;
  readonly records: readonly SourceRecord[];
  readonly unavailableFindings: readonly UnverifiedFinding[];
}

export interface UnverifiedFinding {
  readonly findingId: Identifier;
  readonly sourceRef: Identifier;
  readonly attemptedAtUtc: IsoDate;
  readonly surface: KiroSurface;
  readonly limitation: string;
  readonly owner: string;
  readonly nextValidationRun: Identifier;
  readonly evidenceState: "Unverified";
  readonly availability: Exclude<Availability, "available">;
}

export interface CoverageEntry {
  readonly coverageId: Identifier;
  readonly sourceId: Identifier;
  readonly url: UrlOrPath;
  readonly canonicalUrl?: UrlOrPath;
  readonly currentTitle?: string;
  readonly family: string;
  readonly discoveryMethod: DiscoveryMethod;
  readonly reviewDateUtc: IsoDate;
  readonly surface: KiroSurface;
  readonly applicability: Applicability;
  readonly keyConvention: string;
  readonly versionSensitiveClaim: boolean;
  readonly evidenceProvenanceRef: Identifier;
  readonly availability: Availability;
  readonly disposition: CapabilityDisposition;
  readonly validationAction: string;
  readonly status: DispositionStatus;
  readonly limitation?: string;
}

export interface CoverageMatrix {
  readonly entries: readonly CoverageEntry[];
  readonly completeReviewStatement: string;
  readonly complete: boolean;
  readonly unavailableCandidateRefs: readonly Identifier[];
  readonly blockers: readonly string[];
}

export interface ExclusionEntry {
  readonly exclusionId: Identifier;
  readonly candidateRef: Identifier;
  readonly family: string;
  readonly reason: string;
  readonly scopeBoundary: string;
  readonly owner: string;
  readonly reviewDateUtc: IsoDate;
  readonly reconsiderationTrigger: string;
  readonly evidenceRef: Identifier;
  readonly status: "excluded";
}

export interface ExclusionRegister {
  readonly entries: readonly ExclusionEntry[];
}

export interface AuthorityClaim {
  readonly claimId: Identifier;
  readonly sourceRef: Identifier;
  readonly sourceRank: AuthorityRank;
  readonly claim: string;
  readonly evidenceState: EvidenceState;
  readonly surface?: KiroSurface;
  readonly version?: string;
  readonly provenanceRef: Identifier;
  readonly rationale?: string;
  readonly unresolvedImpact?: string;
}

export interface AuthorityResolution {
  readonly resolutionId: Identifier;
  readonly claims: readonly AuthorityClaim[];
  readonly selectedClaimRef?: Identifier;
  readonly losingClaimRefs: readonly Identifier[];
  readonly rationale: string;
  readonly unresolvedImpact?: string;
}

export interface AuthorityResolver {
  resolve(input: AuthorityResolutionInput): StageResult<AuthorityResolution>;
}

export interface AuthorityResolutionInput {
  readonly claims: readonly AuthorityClaim[];
  readonly resolutionId: Identifier;
}

export interface ArtifactInventoryRecord {
  readonly artifactId: Identifier;
  readonly kind: ArtifactKind;
  readonly path: RepositoryPath;
  readonly inventoryStatus: InventoryStatus;
  readonly owner: string;
  readonly configurationScope: ConfigurationScope;
  readonly activationCondition: string;
  readonly canonicalSource: UrlOrPath;
  readonly evidenceState: EvidenceState;
  readonly disposition: CapabilityDisposition;
  readonly maintenanceRisk: MaintenanceRisk;
  readonly evidenceRefs: readonly Identifier[];
  readonly validationRunRefs: readonly Identifier[];
  readonly rollbackPath: RollbackPath;
}

export type ArtifactKind =
  | "Kiro_Skill"
  | "Steering_File"
  | "Hook_Manifest"
  | "Kiro_Power"
  | "Custom_Agent"
  | "MCP_Service"
  | "Tool_Surface"
  | "Subagent"
  | "Specification"
  | "Permission_Configuration"
  | "Ignore_Configuration"
  | "Relevant_Setting";

export interface RepositoryInventory {
  scan(input: InventoryRequest): StageResult<InventoryResult>;
}

export interface InventoryRequest {
  readonly repositoryRoot: RepositoryPath;
  readonly paths: readonly RepositoryPath[];
  readonly reviewDateUtc: IsoDate;
}

export interface InventoryResult {
  readonly canonicalSources: readonly ArtifactInventoryRecord[];
  readonly kiroArtifacts: readonly ArtifactInventoryRecord[];
  readonly missingPaths: readonly RepositoryPath[];
  readonly conflicts: readonly Identifier[];
}

export interface ProvenanceLedger {
  record(input: ProvenanceInput): StageResult<SourceRecord>;
}

export interface ProvenanceInput {
  readonly source: SourceRecord;
  readonly claims: readonly AuthorityClaim[];
}

export interface DiscoveryCollector {
  discover(input: DiscoveryRequest): StageResult<DiscoveryResult>;
}

export interface DiscoveryRequest {
  readonly repositoryRoot: RepositoryPath;
  readonly reviewDateUtc: IsoDate;
  readonly activeSurfaces: readonly KiroSurface[];
  readonly officialDiscoveryApproved: boolean;
}

export interface DiscoveryResult {
  readonly candidates: readonly SourceRecord[];
  readonly sourceInventory: SourceInventory;
  readonly unavailable: readonly UnverifiedFinding[];
  readonly errors: readonly string[];
}

export interface CoverageMatrixBuilder {
  build(input: CoverageInput): StageResult<CoverageResult>;
}

export interface CoverageInput {
  readonly candidates: readonly SourceRecord[];
  readonly exclusions: readonly ExclusionEntry[];
  readonly reviewDateUtc: IsoDate;
}

export interface CoverageResult {
  readonly matrix: CoverageMatrix;
  readonly exclusions: ExclusionRegister;
  readonly blockers: readonly string[];
}

export type CompatibilityRecord = SurfaceVersion & {
  readonly status: CompatibilityStatus;
  readonly documentedBehavior: readonly string[];
  readonly observedBehavior: readonly string[];
  readonly evidenceFreshness: EvidenceFreshness;
  readonly versionSensitiveClaim: boolean;
  readonly validationAction: string;
  readonly validationRunRefs: readonly Identifier[];
  readonly enablementStatus: EnablementStatus;
  readonly unsupportedClaims: readonly string[];
  readonly migrationConstraints: readonly string[];
  readonly rollbackPathRef: Identifier;
};

export interface CompatibilityMatrix {
  assess(input: CompatibilityInput): StageResult<CompatibilityResult>;
}

export interface CompatibilityInput {
  readonly records: readonly CompatibilityRecord[];
  readonly validationRuns: readonly ValidationRun[];
  readonly requestedSurfaces: readonly SurfaceVersion[];
}

export interface CompatibilityResult {
  readonly records: readonly CompatibilityRecord[];
  readonly transferViolations: readonly string[];
  readonly blockers: readonly string[];
}

export type ConfigurationScope =
  | "global"
  | "project"
  | "agent"
  | "file_match"
  | "manual"
  | "workspace_root_permission"
  | "user_permission"
  | "external_service";

export type AccessMode = "read" | "write" | "read_write" | "none";
export type DenyOverridesAllow = "observed" | "Unverified" | "contradicted";

export interface ScopeRecord {
  readonly scope: ConfigurationScope;
  readonly surface: KiroSurface;
  readonly pathOrService: string;
  readonly applicability: Applicability;
  readonly access: AccessMode;
  readonly actions: readonly string[];
  readonly documentedPrecedence: readonly string[];
  readonly observedPrecedence: readonly string[];
  readonly denyOverridesAllow: DenyOverridesAllow;
  readonly evidenceRefs: readonly Identifier[];
  readonly approvalBoundaryRef?: Identifier;
  readonly rollbackPathRef: Identifier;
}

export interface ConfigurationPrecedenceMap {
  readonly records: readonly ScopeRecord[];
  readonly documentedOrder: readonly ConfigurationScope[];
  readonly observedOrder: readonly ConfigurationScope[];
  readonly conflicts: readonly Identifier[];
  readonly unresolved: readonly Identifier[];
  readonly generatedAtUtc: IsoDate;
}

export interface ScopePrecedenceMapper {
  assess(input: ScopeInput): StageResult<ScopeResult>;
}

export interface ScopeInput {
  readonly records: readonly ScopeRecord[];
  readonly generatedAtUtc: IsoDate;
}

export interface ScopeResult {
  readonly map: ConfigurationPrecedenceMap;
  readonly approvalBoundaries: readonly ApprovalBoundary[];
  readonly blockers: readonly string[];
}

export type ApprovalBoundaryStatus = "pending" | "approved" | "rejected" | "expired";
export type PermissionProbeOutcome = "allowed" | "denied" | "prompted" | "restricted";

export interface ApprovalBoundary {
  readonly boundaryId: Identifier;
  readonly scope: ConfigurationScope;
  readonly requestedChange: string;
  readonly targetSurface: KiroSurface;
  readonly owner: string;
  readonly approvalStatus: ApprovalBoundaryStatus;
  readonly approvalDate?: IsoDate;
  readonly preChangeStateRef: Identifier;
  readonly securityBoundary: string;
  readonly expectedSideEffects: readonly string[];
  readonly rollbackPathRef: Identifier;
}

export interface PermissionProbe {
  readonly probeId: Identifier;
  readonly surface: KiroSurface;
  readonly action: string;
  readonly outcome: PermissionProbeOutcome;
  readonly evidenceRef: Identifier;
  readonly limitation?: string;
}

export interface SkillRecord {
  readonly path: RepositoryPath;
  readonly folderName: SkillCandidate;
  readonly manifestName: string;
  readonly description: string;
  readonly inventoryStatus: InventoryStatus;
  readonly disposition: Extract<CapabilityDisposition, "retain" | "update" | "merge" | "add" | "retire" | "observe" | "defer">;
  readonly isPrimaryRepositoryGuidanceSkill: boolean;
  readonly activationScope: string;
  readonly canonicalSources: readonly UrlOrPath[];
  readonly rootCommands: readonly string[];
  readonly constraints: readonly string[];
  readonly prerequisites: readonly string[];
  readonly overlapResolutions: readonly string[];
  readonly owner: string;
  readonly maintenanceRisk: MaintenanceRisk;
  readonly evidenceRefs: readonly Identifier[];
  readonly validationRunRefs: readonly Identifier[];
  readonly rollbackPath: RollbackPath;
}

export interface SteeringRecord {
  readonly path: RepositoryPath;
  readonly inclusion: string;
  readonly inventoryStatus: InventoryStatus;
  readonly ownedRules: readonly string[];
  readonly referencedCanonicalSources: readonly UrlOrPath[];
  readonly overlapResolution: string;
  readonly disposition: CapabilityDisposition;
  readonly evidenceRefs: readonly Identifier[];
  readonly rollbackPath: RollbackPath;
}

export type HookEvent = string;
export type HookActionType = "command" | "agent";
export type HookSchemaResult = "pass" | "fail" | "Unverified";

export interface HookRecord {
  readonly path: RepositoryPath;
  readonly name: string;
  readonly hookEvent: HookEvent;
  readonly matcher: string;
  readonly actionType: HookActionType;
  readonly enabled: boolean;
  readonly hookLevelTimeoutSeconds?: number;
  readonly schemaResult: HookSchemaResult;
  readonly commandOrPromptSummary: string;
  readonly commandInputContract: string;
  readonly dependencies: readonly string[];
  readonly surfaceAvailability: readonly KiroSurface[];
  readonly overlapRefs: readonly Identifier[];
  readonly owner: string;
  readonly maintenanceRisk: MaintenanceRisk;
  readonly disposition: CapabilityDisposition;
  readonly preChangeSnapshotRef: Identifier;
  readonly validationRunRefs: readonly Identifier[];
  readonly disableAction: string;
  readonly expectedSideEffects: readonly string[];
  readonly rollbackPath: RollbackPath;
  readonly rollbackValidationRef?: Identifier;
}

export type PowerFormat = "Legacy_POWER" | "Agent_Plugin" | "Both" | "Neither";
export type SecretBoundary = "none_declared" | "named_boundary";
export type PermissionBoundary = "none_declared" | "named_boundary";

export interface PowerRecord {
  readonly pathOrInstallation: UrlOrPath;
  readonly format: PowerFormat;
  readonly powerManifestPresent: boolean;
  readonly pluginManifestPresent: boolean;
  readonly mcpConfigSummary: string;
  readonly registryObservation?: string;
  readonly repositoryAnswer: RepositoryAnswer;
  readonly migrationOrRetainPath: string;
  readonly provenance: EvidenceProvenance;
  readonly secrets: SecretBoundary;
  readonly permissions: PermissionBoundary;
  readonly surfaceValidationRefs: readonly Identifier[];
  readonly ownerApprovalRef?: Identifier;
  readonly disposition: CapabilityDisposition;
  readonly rollbackPath: RollbackPath;
}

export type ExtensionKind = "MCP_Service" | "Tool_Surface" | "Custom_Agent" | "Subagent";
export type ExecutionLayer =
  | "default_native_task"
  | "reviewer_stage"
  | "implementation_wave"
  | "integration_gate"
  | "surface_validation"
  | "crew";
export type ApprovalBehavior = "explicit" | "prompted" | "implicit" | "unknown";
export type FailureBehavior = "stop" | "preserve_state" | "fail_closed" | "unknown";
export type RepositoryCompatibility = "compatible" | "incompatible" | "Unverified";
export type ResourceUri = string | "None";

export interface ExtensionRecord {
  readonly kind: ExtensionKind;
  readonly executionLayer: ExecutionLayer;
  readonly configurationFormat: string;
  readonly surfaceAvailability: readonly KiroSurface[];
  readonly scope: string;
  readonly activation: string;
  readonly authorityRelationship: string;
  readonly resourceUris: readonly ResourceUri[];
  readonly serviceAndDataBoundary?: string;
  readonly secretBoundary?: string;
  readonly permissionBoundary?: string;
  readonly dagOrReviewGraph?: string;
  readonly maximumConcurrency: DefaultTaskConcurrency;
  readonly iterationCeiling: ReviewerIterationCeiling;
  readonly approvalBehavior: ApprovalBehavior;
  readonly failureBehavior: FailureBehavior;
  readonly repositoryCompatibility: RepositoryCompatibility;
  readonly validationRunRefs: readonly Identifier[];
  readonly owner: string;
  readonly disposition: CapabilityDisposition;
  readonly rollbackPath: RollbackPath;
}

export interface OwnerDecision {
  readonly decisionId: OwnerDecisionId;
  readonly owner: string;
  readonly decisionDate: IsoDate;
  readonly selectedPolicy: SelectedOwnerPolicy;
  readonly scope: string;
  readonly rejectedOptions: readonly string[];
  readonly approvalStatus: ApprovalStatus;
  readonly unresolvedStatus?: UnresolvedStatus;
  readonly requiredValidation: readonly string[];
  readonly rollbackBoundary: string;
  readonly evidenceRef: Identifier;
  readonly limitations: readonly string[];
}

const OWNER_DECISION_BASE = {
  owner: "repository owner",
  decisionDate: "2026-08-25",
  selectedPolicy: "enable after validation",
  rejectedOptions: ["None explicitly rejected"],
  approvalStatus: "owner-approved-conditional",
  unresolvedStatus: "resolved",
  evidenceRef: "requirements:owner-decision-gate",
} as const;

export const OWNER_DECISIONS = [
  {
    ...OWNER_DECISION_BASE,
    decisionId: "OD-01",
    scope: "IDE, CLI 2.x, CLI 3.x, Web, Mobile, Cloud/Crew, Local_Repository_Surface",
    requiredValidation: ["fresh exact-surface/version Validation_Run for each selected target"],
    rollbackBoundary: "restore prior artifact/configuration state without cross-surface claims",
    limitations: ["IDE and CLI 2.x evidence cannot validate another surface or version"],
  },
  {
    ...OWNER_DECISION_BASE,
    decisionId: "OD-02",
    scope: "repository-local hooks",
    requiredValidation: ["standalone JSON/schema, matcher, command, timeout, dependency, overlap, and surface validation"],
    rollbackBoundary: "disable the hook and restore pre-repair bytes",
    limitations: ["the LTM capture hook remains disabled while its implementation is a stub"],
  },
  {
    ...OWNER_DECISION_BASE,
    decisionId: "OD-03",
    scope: "bounded graph-impact automation",
    requiredValidation: ["reviewed root command, explicit approval gate, failure behavior, and maximum three iterations"],
    rollbackBoundary: "remove automation or disable its hook and retain the manual graph-impact loop",
    limitations: ["manual graph-impact remains the fallback"],
  },
  {
    ...OWNER_DECISION_BASE,
    decisionId: "OD-04",
    scope: "feature-only Concurrent_Implementation_Wave",
    requiredValidation: ["disjoint ownership, reservations, shared-contract freeze, no worktrees, and one integration gate"],
    rollbackBoundary: "release reservations, disable the wave, and restore affected artifacts",
    limitations: ["does not modify AGENTS.md or authorize Crew worktrees, retries, replans, hidden spawning, or auto-approval"],
  },
  {
    ...OWNER_DECISION_BASE,
    decisionId: "OD-05",
    scope: "reviewed local and installed powers",
    requiredValidation: ["repository-answer check, format, provenance, permission, loading, and rollback validation"],
    rollbackBoundary: "remove activation or restore prior registration",
    limitations: ["external routing requires a named boundary"],
  },
  {
    ...OWNER_DECISION_BASE,
    decisionId: "OD-06",
    scope: "reviewed external MCP and network capabilities",
    requiredValidation: ["named service/data/secret/permission boundary, target-surface validation, and revocation test"],
    rollbackBoundary: "revoke service or credential and remove the route/configuration",
    limitations: ["no secrets or project data are transmitted by this contract"],
  },
  {
    ...OWNER_DECISION_BASE,
    decisionId: "OD-07",
    scope: "reviewed custom agents and bounded subagents",
    requiredValidation: ["configuration, resources, surface, concurrency, iteration, failure, approval, and rollback validation"],
    rollbackBoundary: "disable the agent or subagent and restore configuration",
    limitations: ["default/native task concurrency remains 0 or 1 and review ceilings remain 0 through 3"],
  },
  {
    ...OWNER_DECISION_BASE,
    decisionId: "OD-08",
    scope: "six repository-local skills",
    requiredValidation: ["all six manifests, primary designation, overlap, prerequisites, activation, and rollback validation"],
    rollbackBoundary: "restore skill/steering files and their prior activation state",
    limitations: ["repo-map is the only primary Repository_Guidance_Skill"],
  },
  {
    ...OWNER_DECISION_BASE,
    decisionId: "OD-09",
    scope: "named user/global Kiro configuration",
    requiredValidation: ["named Approval_Boundary, pre-change backup, permissions, precedence, and rollback validation"],
    rollbackBoundary: "restore the captured user/global backup and leave repository-local artifacts intact",
    limitations: ["unspecified global changes remain out of scope"],
  },
  {
    ...OWNER_DECISION_BASE,
    decisionId: "OD-10",
    scope: "artifact, repository, schema, documentation, surface, security, rollback, and handover gates",
    requiredValidation: ["record each Validation_Run, both Vitest lanes when used, known gaps, limitations, and owner sign-off"],
    rollbackBoundary: "revert the last approved change and mark enabled-valid false",
    limitations: ["no gate result is PASS without evidence and limitations"],
  },
] as const satisfies readonly OwnerDecision[];

export interface ValidationRun {
  readonly validationId: Identifier;
  readonly action: string;
  readonly repositoryRootOrActiveSurface: RepositoryPath | KiroSurface;
  readonly surface: KiroSurface;
  readonly version: string;
  readonly scope: string;
  readonly executionLayer: ExecutionLayer;
  readonly waveId?: Identifier;
  readonly reviewer?: ReviewerName;
  readonly startedAtUtc: IsoDate;
  readonly result: ValidationResult;
  readonly commandOrInteraction: string;
  readonly exitCodeOrOutcome: string;
  readonly evidenceRefs: readonly Identifier[];
  readonly unverifiedItems: readonly string[];
  readonly blocker: Blocker;
  readonly preChangeSnapshotRef?: Identifier;
  readonly postChangeArtifactHash?: string;
  readonly laneResults?: VitestLaneResults;
  readonly limitation?: string;
}

export interface VitestLaneResult {
  readonly result: ValidationResult;
  readonly total: number;
  readonly failed: number;
  readonly evidenceRef: Identifier;
}

export interface VitestLaneResults {
  readonly defaultVitest?: VitestLaneResult;
  readonly techDocsVitest?: VitestLaneResult;
}

export interface RollbackRecord {
  readonly rollbackId: Identifier;
  readonly targetArtifactOrScope: string;
  readonly preChangeStateRef: Identifier;
  readonly rollbackAction: string;
  readonly expectedSuccessSignal: string;
  readonly observedEvidence: string;
  readonly result: Extract<ValidationResult, "pass" | "fail" | "blocked">;
  readonly verificationRunRef: Identifier;
  readonly owner: string;
  readonly limitation?: string;
}

export interface ValidationRunner {
  run(input: ValidationRequest): StageResult<ValidationRun>;
}

export interface ValidationRequest {
  readonly action: string;
  readonly repositoryRootOrActiveSurface: RepositoryPath | KiroSurface;
  readonly surface: KiroSurface;
  readonly version: string;
  readonly scope: string;
  readonly executionLayer: ExecutionLayer;
  readonly commandOrInteraction: string;
  readonly waveId?: Identifier;
  readonly reviewer?: ReviewerName;
}

export interface RollbackManager {
  restore(input: RollbackRequest): StageResult<RollbackRecord>;
}

export interface RollbackRequest {
  readonly rollbackId: Identifier;
  readonly targetArtifactOrScope: string;
  readonly preChangeStateRef: Identifier;
  readonly rollbackAction: string;
  readonly expectedSuccessSignal: string;
  readonly owner: string;
}

export type KnownGapStatus = "open" | "resolved";
export type KnownGapKind = "unverified" | "unavailable" | "contradictory" | "version_sensitive" | "missing_prerequisite" | "policy_conflict";

export interface KnownGap {
  readonly gapId: Identifier;
  readonly kind: KnownGapKind;
  readonly title: string;
  readonly evidenceState: EvidenceState;
  readonly evidenceRefs: readonly Identifier[];
  readonly owner: string;
  readonly nextValidationRun: Identifier;
  readonly blockedAction: string;
  readonly disposition: CapabilityDisposition;
  readonly status: KnownGapStatus;
  readonly limitation: string;
}

export interface KnownGapsRegister {
  readonly entries: readonly KnownGap[];
}

export interface CapabilityDispositionRecord {
  readonly capabilityId: Identifier;
  readonly kind: ArtifactKind | ExtensionKind;
  readonly name: string;
  readonly disposition: CapabilityDisposition;
  readonly configurationScope: ConfigurationScope;
  readonly canonicalSource: UrlOrPath;
  readonly surfaceVersionApplicability: readonly SurfaceVersion[];
  readonly activationCondition: string;
  readonly owner: string;
  readonly approvalBoundaryRef: Identifier | "no_boundary";
  readonly evidenceRefs: readonly Identifier[];
  readonly validationAction: string;
  readonly expectedSideEffects: readonly string[];
  readonly rollbackPath: RollbackPath;
  readonly reason: string;
  readonly knownGapRefs: readonly Identifier[];
}

export interface CapabilityDispositionTable {
  readonly entries: readonly CapabilityDispositionRecord[];
}

export type ReviewerName = "EvidenceCompatibilityReviewer" | "SafetyRollbackReviewer";
export type ReviewerStageStatus = "pending" | "pass" | "fail" | "blocked";

export interface ReviewerStageRecord {
  readonly reviewer: ReviewerName;
  readonly executionLayer: "reviewer_stage";
  readonly maximumConcurrency: ReviewerConcurrency;
  readonly iterationCeiling: ReviewerIterationCeiling;
  readonly readOnly: true;
  readonly inputStageRef: Identifier;
  readonly outputFindings: readonly string[];
  readonly blocker: Blocker;
  readonly status: ReviewerStageStatus;
  readonly rollbackPath: "no rollback applies";
}

export interface ReviewerHandoff {
  readonly handoffId: Identifier;
  readonly fromStage: "Integration_Validation_Gate" | ReviewerName;
  readonly toStage: ReviewerName | "owner-approved Validation/Enablement gate";
  readonly order: 1 | 2 | 3;
  readonly inputRefs: readonly Identifier[];
  readonly outputRefs: readonly Identifier[];
  readonly status: ReviewerStageStatus;
  readonly readOnly: true;
  readonly maximumConcurrency: ReviewerConcurrency;
  readonly iterationCeiling: ReviewerIterationCeiling;
  readonly blocker: Blocker;
}

export interface ReviewResult {
  readonly reviewer: ReviewerName;
  readonly stage: ReviewerStageRecord;
  readonly handoff: ReviewerHandoff;
  readonly findings: readonly string[];
  readonly blockers: readonly string[];
  readonly evidenceRefs: readonly Identifier[];
}

export interface EvidenceReviewRequest {
  readonly inputStageRef: Identifier;
  readonly sourceInventory: SourceInventory;
  readonly coverageMatrix: CoverageMatrix;
  readonly exclusions: ExclusionRegister;
  readonly artifactInventory: readonly ArtifactInventoryRecord[];
  readonly compatibilityRecords: readonly CompatibilityRecord[];
  readonly ownerDecisions: readonly OwnerDecision[];
  readonly validationRuns: readonly ValidationRun[];
}

export interface SafetyReviewRequest {
  readonly evidenceReview: ReviewResult;
  readonly approvalBoundaries: readonly ApprovalBoundary[];
  readonly policyFindings: readonly string[];
  readonly snapshots: readonly Identifier[];
  readonly knownGaps: KnownGapsRegister;
  readonly rollbackRecords: readonly RollbackRecord[];
  readonly proposedHandover?: HandoverRecord;
}

export interface EvidenceCompatibilityReviewer {
  review(input: EvidenceReviewRequest): StageResult<ReviewResult>;
}

export interface SafetyRollbackReviewer {
  review(input: SafetyReviewRequest): StageResult<ReviewResult>;
}

export interface ReadWriteScope {
  readonly scopeId: Identifier;
  readonly agentId: Identifier;
  readonly readPaths: readonly RepositoryPath[];
  readonly writePaths: readonly RepositoryPath[];
  readonly sharedOutputPaths: readonly RepositoryPath[];
}

export interface ImplementationAgentDeclaration {
  readonly agentId: Identifier;
  readonly lane: "Lane A" | "Lane B" | "Lane C" | "Lane D";
  readonly readScope: ReadWriteScope;
  readonly writeScope: ReadWriteScope;
  readonly sharedGeneratedOutputOwnership: "none" | "named_disjoint_outputs";
}

export type ReservationStatus = "active" | "released" | "stale" | "conflicting" | "missing";

export interface FileOwnershipReservation {
  readonly reservationId: Identifier;
  readonly waveId: Identifier;
  readonly agentId: Identifier;
  readonly targetPaths: readonly RepositoryPath[];
  readonly sharedOutputs: readonly RepositoryPath[];
  readonly readScope: readonly RepositoryPath[];
  readonly writeScope: readonly RepositoryPath[];
  readonly acquiredBeforeMutation: boolean;
  readonly status: ReservationStatus;
  readonly conflictRefs: readonly Identifier[];
  readonly releasedAt?: IsoDate;
}

export interface SharedContractFreeze {
  readonly freezeId: Identifier;
  readonly waveId: Identifier;
  readonly contracts: readonly RepositoryPath[];
  readonly contractVersionOrHash: string;
  readonly frozenAtUtc: IsoDate;
  readonly dependentWorkAllowed: boolean;
  readonly owner: string;
  readonly validationRunRef: Identifier;
}

export type WaveStatus = "pending" | "running" | "blocked" | "partial" | "completed" | "rolled_back";
export type WaveConflictPolicy = "stop_affected_agent_or_wave_fail_closed";

export interface AgentOutput {
  readonly agentId: Identifier;
  readonly status: "completed" | "partial" | "failed" | "abandoned";
  readonly changedPaths: readonly RepositoryPath[];
  readonly evidenceRefs: readonly Identifier[];
  readonly blocker: Blocker;
}

export interface WaveConflict {
  readonly conflictId: Identifier;
  readonly agentIds: readonly Identifier[];
  readonly paths: readonly RepositoryPath[];
  readonly reason: string;
  readonly status: "open" | "recorded" | "resolved" | "blocking";
}

export interface ConcurrentImplementationWaveRecord {
  readonly waveId: Identifier;
  readonly featureName: "kiro-repo-guidance-setup";
  readonly scope: "feature_only";
  readonly maxActiveAgents: FeatureWaveAgentCount;
  readonly activeAgentCount: FeatureWaveAgentCount;
  readonly implementationAgents: readonly ImplementationAgentDeclaration[];
  readonly declaredFileOwnership: readonly RepositoryPath[];
  readonly declaredSharedOutputOwnership: "none" | "named_disjoint_outputs";
  readonly readWriteScopes: readonly ReadWriteScope[];
  readonly fileOwnershipReservations: readonly FileOwnershipReservation[];
  readonly sharedContractFreezeRef: Identifier;
  readonly rootWorkingDirectory: "D:\\23082026";
  readonly packageManager: "pnpm";
  readonly worktrees: "prohibited";
  readonly hiddenSpawning: "prohibited";
  readonly automaticRetries: "prohibited";
  readonly automaticReplans: "prohibited";
  readonly approvalBoundaryRefs: readonly Identifier[];
  readonly conflictPolicy: WaveConflictPolicy;
  readonly integrationValidationGateRef: Identifier;
  readonly status: WaveStatus;
  readonly rollbackPath: RollbackPath;
  readonly validationRunRefs: readonly Identifier[];
}

export interface IntegrationValidationGateRecord {
  readonly gateId: Identifier;
  readonly waveId: Identifier;
  readonly collectedAgentOutputs: readonly AgentOutput[];
  readonly conflictResolutions: readonly WaveConflict[];
  readonly repositoryValidationRuns: readonly Identifier[];
  readonly reviewerStages: readonly ["EvidenceCompatibilityReviewer", "SafetyRollbackReviewer"];
  readonly sequentialReviewerHandoffRefs: readonly Identifier[];
  readonly status: "pending" | "pass" | "fail" | "blocked" | "partial";
  readonly enablementAllowed: boolean;
  readonly rollbackPath: RollbackPath;
}

export interface ImplementationWaveCoordinator {
  run(input: ImplementationWaveRequest): StageResult<ConcurrentImplementationWaveRecord>;
}

export interface ImplementationWaveRequest {
  readonly wave: ConcurrentImplementationWaveRecord;
  readonly declarations: readonly ImplementationAgentDeclaration[];
  readonly reservations: readonly FileOwnershipReservation[];
  readonly contractFreeze?: SharedContractFreeze;
}

export interface IntegrationValidationGate {
  run(input: IntegrationValidationRequest): StageResult<IntegrationValidationGateRecord>;
}

export interface IntegrationValidationRequest {
  readonly wave: ConcurrentImplementationWaveRecord;
  readonly outputs: readonly AgentOutput[];
  readonly reservations: readonly FileOwnershipReservation[];
  readonly conflicts: readonly WaveConflict[];
  readonly contractFreeze: SharedContractFreeze;
  readonly validationRuns: readonly ValidationRun[];
}

export interface HandoverRecord {
  readonly generatedAtUtc: IsoDate;
  readonly reviewDateUtc: IsoDate;
  readonly completeReviewStatement: string;
  readonly firstReadPath: readonly RepositoryPath[];
  readonly coverageMatrixRef: Identifier;
  readonly exclusionRegisterRef: Identifier;
  readonly officialFamilyStatuses: readonly string[];
  readonly surfaceCompatibilityStatement: string;
  readonly configurationPrecedenceMapRef: Identifier;
  readonly capabilityDispositionTableRef: Identifier;
  readonly implementationWaveRef?: Identifier;
  readonly integrationValidationGateRef?: Identifier;
  readonly reviewerStageRefs: readonly [Identifier, Identifier];
  readonly ownerDecisionRefs: readonly OwnerDecisionId[];
  readonly evidenceStateLegend: readonly EvidenceState[];
  readonly artifactDispositions: readonly HandoverArtifactDisposition[];
  readonly validationRuns: readonly ValidationRun[];
  readonly knownGaps: readonly KnownGap[];
  readonly rollbackRecords: readonly RollbackRecord[];
  readonly maintenanceTriggers: readonly string[];
  readonly limitations: readonly string[];
}

export interface HandoverArtifactDisposition {
  readonly artifactId: Identifier;
  readonly canonicalPath: RepositoryPath;
  readonly disposition: HandoverDisposition;
  readonly evidenceRefs: readonly Identifier[];
  readonly reason: string;
  readonly activationCondition: string;
  readonly owner: string;
  readonly rollbackPath: RollbackPath;
}

export interface HandoverGenerator {
  generate(input: HandoverInput): StageResult<HandoverRecord>;
}

export interface HandoverInput {
  readonly reviewDateUtc: IsoDate;
  readonly coverageMatrix: CoverageMatrix;
  readonly exclusionRegister: ExclusionRegister;
  readonly officialFamilyStatuses: readonly string[];
  readonly compatibilityRecords: readonly CompatibilityRecord[];
  readonly precedenceMap: ConfigurationPrecedenceMap;
  readonly dispositionTable: CapabilityDispositionTable;
  readonly ownerDecisions: readonly OwnerDecision[];
  readonly validationRuns: readonly ValidationRun[];
  readonly knownGaps: readonly KnownGap[];
  readonly rollbackRecords: readonly RollbackRecord[];
}

export type StageStatus = "pass" | "fail" | "blocked" | "partial" | "not_run";

export type StageResult<TOutput> =
  | {
      readonly status: "pass";
      readonly output: TOutput;
      readonly blockers: readonly [];
      readonly evidenceRefs: readonly Identifier[];
    }
  | {
      readonly status: Exclude<StageStatus, "pass">;
      readonly output?: TOutput;
      readonly blockers: readonly string[];
      readonly evidenceRefs: readonly Identifier[];
    };

export interface EnablementPredicates {
  readonly ownerApproval: boolean;
  readonly freshExactTargetValidation: boolean;
  readonly artifactSchemaPass: boolean;
  readonly repositoryCompatibility: boolean;
  readonly securityBoundaryConfirmed: boolean;
  readonly rollbackReady: boolean;
  readonly noBlockingKnownGap: boolean;
  readonly policyGuardsPass: boolean;
  readonly bothReviewerStagesPass: boolean;
}

export interface EnablementGateResult {
  readonly status: "enabled-valid" | "blocked";
  readonly failedPredicates: readonly (keyof EnablementPredicates)[];
  readonly evidenceRefs: readonly Identifier[];
  readonly preservedPriorState: boolean;
}

export interface EnablementGate {
  evaluate(input: EnablementGateInput): StageResult<EnablementGateResult>;
}

export interface EnablementGateInput {
  readonly predicates: EnablementPredicates;
  readonly evidenceRefs: readonly Identifier[];
  readonly priorStatePreserved: boolean;
}

export interface CapabilityEvaluator {
  evaluate(input: CapabilityInput): StageResult<CapabilityResult>;
}

export interface CapabilityInput {
  readonly artifacts: readonly ArtifactInventoryRecord[];
  readonly extensions: readonly ExtensionRecord[];
  readonly ownerDecisions: readonly OwnerDecision[];
}

export interface CapabilityResult {
  readonly dispositions: readonly CapabilityDispositionRecord[];
  readonly knownGaps: readonly KnownGap[];
  readonly policyViolations: readonly string[];
}

export const COMPLETE_REVIEW_STATEMENT =
  "Complete review covers all relevant current official pages recorded in the Coverage_Matrix; it does not claim that every Kiro webpage was read." as const;

export const FEATURE_NAME = "kiro-repo-guidance-setup" as const;
export const REPOSITORY_ROOT = "D:\\23082026" as const;
export const PACKAGE_MANAGER = "pnpm" as const;
export const FEATURE_WAVE_MAX_ACTIVE_AGENTS = 4 as const;
export const DEFAULT_MAX_ACTIVE_AGENTS = 1 as const;
export const REVIEWER_MAXIMUM_CONCURRENCY: ReviewerConcurrency = 1;
export const REVIEWER_ITERATION_CEILING: ReviewerIterationCeiling = 3;
export const REVIEWER_ORDER = [
  "EvidenceCompatibilityReviewer",
  "SafetyRollbackReviewer",
] as const satisfies readonly ReviewerName[];

export const FEATURE_IMPLEMENTATION_PATHS = [
  "scripts/kiro-repo-guidance-setup/contracts.ts",
  "scripts/kiro-repo-guidance-setup/discovery.ts",
  "scripts/kiro-repo-guidance-setup/inventory.ts",
  "scripts/kiro-repo-guidance-setup/provenance.ts",
  "scripts/kiro-repo-guidance-setup/coverage.ts",
] as const satisfies readonly RepositoryPath[];
