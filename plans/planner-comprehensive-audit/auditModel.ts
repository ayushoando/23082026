export const PLANNER_AUDIT_AUTHORED_ROOT =
  "plans/planner-comprehensive-audit/" as const;
export const PLANNER_AUDIT_MACHINE_EVIDENCE_ROOT =
  "results/planner-comprehensive-audit/" as const;

export type RequirementRef = `${number}.${number}`;
export type EvidenceRef = string;
export type ValidationRef = string;
export type FindingRef = string;
export type WorkflowRef = string;
export type CoverageItemRef = string;

export type CoverageStatus =
  | "wired"
  | "present-but-unverified"
  | "demo/local-only"
  | "generated"
  | "legacy"
  | "unwired/absent"
  | "unreachable";

export type PlannerOwnedArea =
  | "feature"
  | "component"
  | "lib"
  | "hook"
  | "store"
  | "server"
  | "platform";

export type ViewportClass = "desktop" | "tablet" | "phone";
export type InputMethod = "pointer" | "touch" | "keyboard";
export type RequiredState =
  | "default"
  | "loading"
  | "empty"
  | "success"
  | "validation-error"
  | "server-error"
  | "unauthenticated"
  | "forbidden"
  | "rate-limited"
  | "conflict"
  | "stale"
  | "offline"
  | "recovery";
export type SecurityControl =
  | "authentication"
  | "owner-scope"
  | "request-validation"
  | "csrf-origin"
  | "rate-limit"
  | "method-contract"
  | "safe-error"
  | "correlation-id"
  | "revision"
  | "idempotency"
  | "schema-version"
  | "redaction";
export type PersistenceMode = "disk" | "supabase";

export interface CoverageItemBase {
  id: CoverageItemRef;
  path: string;
  status: CoverageStatus;
  evidenceRefs: EvidenceRef[];
  statusNote?: string;
}

export interface RouteCoverageItem extends CoverageItemBase {
  kind: "route";
  routePath: string;
  routeFileKind: "page" | "layout";
}

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";

export interface ApiCoverageItem extends CoverageItemBase {
  kind: "api";
  endpointPath: string;
  methods: HttpMethod[];
}

export interface PlannerSourceCoverageItem extends CoverageItemBase {
  kind: "planner-source";
  area: PlannerOwnedArea;
}

export interface ReachableSharedSourceCoverageItem extends CoverageItemBase {
  kind: "reachable-shared-source";
  reachableFromIds: CoverageItemRef[];
}

export interface FocssCoverageItem extends CoverageItemBase {
  kind: "focss";
  zone: "planner";
}

export interface TestCoverageItem extends CoverageItemBase {
  kind: "test";
  testClass: "unit" | "integration" | "browser" | "static";
  coversItemIds: CoverageItemRef[];
}

export type CoverageItem =
  | RouteCoverageItem
  | ApiCoverageItem
  | PlannerSourceCoverageItem
  | ReachableSharedSourceCoverageItem
  | FocssCoverageItem
  | TestCoverageItem;

export interface CoverageDimensions {
  viewportClasses: ViewportClass[];
  inputMethods: InputMethod[];
  stateIds: RequiredState[];
  securityControlIds: SecurityControl[];
  persistenceModes: PersistenceMode[];
}

export interface CoverageLink extends CoverageDimensions {
  itemId: CoverageItemRef;
  routeIds: CoverageItemRef[];
  workflowIds: WorkflowRef[];
  requirementRefs: RequirementRef[];
  findingIds: FindingRef[];
  verificationRefs: ValidationRef[];
  evidenceRefs: EvidenceRef[];
}

export const WORKFLOW_STAGE_ORDER = [
  "route-entry",
  "feature-view",
  "component-interaction",
  "hook-store-command",
  "browser-api-client",
  "route-handler-middleware",
  "persistence-facade",
  "selected-adapter",
  "response-error-mapping",
  "user-visible-result",
] as const;

export type WorkflowStageKind = (typeof WORKFLOW_STAGE_ORDER)[number];

export interface WorkflowTraceStage {
  id: string;
  kind: WorkflowStageKind;
  sourcePath: string;
  summary: string;
  evidenceRefs: EvidenceRef[];
}

export interface WorkflowTrace {
  id: WorkflowRef;
  name: string;
  routeIds: CoverageItemRef[];
  stages: WorkflowTraceStage[];
  coverage: CoverageDimensions;
  requirementRefs: RequirementRef[];
  evidenceRefs: EvidenceRef[];
}

export type EvidenceClass =
  | "repository"
  | "browser"
  | "integration"
  | "hosted"
  | "deployment";

export type EvidenceArtifact =
  | {
      authorship: "authored";
      path: `${typeof PLANNER_AUDIT_AUTHORED_ROOT}${string}`;
    }
  | {
      authorship: "generated";
      path: `${typeof PLANNER_AUDIT_MACHINE_EVIDENCE_ROOT}${string}`;
    };

export interface EvidenceRecord {
  id: EvidenceRef;
  class: EvidenceClass;
  summary: string;
  sourceRefs: string[];
  limitation: string;
  artifact?: EvidenceArtifact;
}

export type ValidationKind =
  | "static-inspection"
  | "unit"
  | "integration"
  | "browser"
  | "accessibility"
  | "responsive"
  | "touch"
  | "keyboard"
  | "api"
  | "persistence"
  | "migration"
  | "type"
  | "focss"
  | "fork-boundary"
  | "performance"
  | "full-gate";

export type ValidationTarget = EvidenceClass;
export type UserAuthorizationState =
  | "not-requested"
  | "not-authorized"
  | "authorized";
export type HookPermissionState = "not-observed" | "denied" | "permitted";

export interface ValidationRecordBase {
  id: ValidationRef;
  findingIds: FindingRef[];
  kind: ValidationKind;
  target: ValidationTarget;
  repositoryRoot: ".";
  requirementRefs: RequirementRef[];
  verifies: string;
  limitation: string;
}

export interface PendingValidationRecord extends ValidationRecordBase {
  state: "pending";
  exactCommand: string | null;
  pendingOwnerAction: string | null;
  userAuthorization: UserAuthorizationState;
  hookPermission: HookPermissionState;
  exitStatus: null;
  outcome: null;
  evidenceRefs: [];
}

export interface ObservedValidationRecord extends ValidationRecordBase {
  state: "observed";
  exactCommand: string;
  pendingOwnerAction: null;
  userAuthorization: "authorized";
  hookPermission: "permitted";
  exitStatus: number;
  outcome: "acceptable" | "unacceptable";
  evidenceRefs: EvidenceRef[];
}

export type ValidationRecord =
  | PendingValidationRecord
  | ObservedValidationRecord;

export type FindingState =
  | "candidate"
  | "verified"
  | "remediation-approved"
  | "remediated-validation-pending"
  | "remediated-with-evidence"
  | "blocked-with-evidence"
  | "compliant-with-evidence";

export type FindingSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "note";

export interface FindingBlocker {
  evidenceRefs: EvidenceRef[];
  ownerDecision: string;
  acceptedByOwner: boolean;
}

export interface AuditFinding {
  id: FindingRef;
  title: string;
  severity: FindingSeverity;
  state: FindingState;
  routeIds: CoverageItemRef[];
  workflowIds: WorkflowRef[];
  adjacentWorkflowIds: WorkflowRef[];
  sourcePaths: string[];
  requirementRefs: RequirementRef[];
  reproductionEvidenceRefs: EvidenceRef[];
  completionEvidenceRefs: EvidenceRef[];
  expected: string;
  observed: string;
  affectedScope: string[];
  remediationPaths: string[];
  validationIds: ValidationRef[];
  blocker?: FindingBlocker;
}

export const FINDING_TRANSITIONS: Readonly<
  Record<FindingState, readonly FindingState[]>
> = Object.freeze({
  candidate: ["verified", "compliant-with-evidence"],
  verified: ["remediation-approved"],
  "remediation-approved": [
    "remediated-validation-pending",
    "blocked-with-evidence",
  ],
  "remediated-validation-pending": [
    "remediated-with-evidence",
    "blocked-with-evidence",
  ],
  "remediated-with-evidence": [],
  "blocked-with-evidence": [],
  "compliant-with-evidence": [],
});

export interface PlannerAuditDataset {
  coverageItems: CoverageItem[];
  coverageLinks: CoverageLink[];
  workflowTraces: WorkflowTrace[];
  evidence: EvidenceRecord[];
  validations: ValidationRecord[];
  findings: AuditFinding[];
}

export type ValidationIssueCode =
  | "duplicate-id"
  | "duplicate-path"
  | "duplicate-ref"
  | "empty-value"
  | "invalid-artifact-path"
  | "invalid-finding-state"
  | "invalid-reference"
  | "invalid-requirement-ref"
  | "invalid-validation-state"
  | "incomplete-workflow"
  | "missing-evidence"
  | "missing-link"
  | "orphan-requirement";

export interface ValidationIssue {
  code: ValidationIssueCode;
  path: string;
  message: string;
}

export interface AuditValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface AuditValidationOptions {
  requiredRequirementRefs?: RequirementRef[];
}
