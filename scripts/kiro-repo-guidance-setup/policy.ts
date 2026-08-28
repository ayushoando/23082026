import {
  DEFAULT_MAX_ACTIVE_AGENTS,
  FEATURE_NAME,
  FEATURE_WAVE_MAX_ACTIVE_AGENTS,
  OWNER_DECISIONS,
  PACKAGE_MANAGER,
  REPOSITORY_ROOT,
  type OwnerDecision,
  type StageResult,
} from "./contracts";
import { validateOwnerDecisions, type OwnerDecisionValidationOutput } from "./owner-decisions";

export type PersistenceMode = "mode-aware" | "raw-disk" | "dual-write";
export type DatabaseRoute = "Admin" | "Products" | "unknown";
export type ApprovalBoundaryStatus = "approved" | "pending" | "rejected" | "expired";

/**
 * Controls that must be recorded before the feature-only OD-04 exception can
 * raise the active-agent ceiling. These are evidence flags, not permissions;
 * this guard never creates reservations, freezes, approvals, or an integration
 * gate.
 */
export interface Od04WaveControls {
  readonly disjointFileOwnership: boolean;
  readonly explicitReadWriteScopes: boolean;
  readonly fileOwnershipReservations: boolean;
  readonly sharedContractFreeze: boolean;
  readonly namedApprovalBoundaries: boolean;
  readonly singleIntegrationValidationGate: boolean;
  readonly sequentialReadOnlyReviewers: boolean;
  readonly sharedGeneratedOutputWrites: boolean;
}

export interface RepositoryPolicyRequest {
  readonly workingDirectory: string;
  readonly packageManager: string;
  readonly activeAgentCount: number;
  readonly featureName?: string;
  readonly featureWaveRequested?: boolean;
  readonly worktreeRequested?: boolean;
  readonly hiddenSpawningRequested?: boolean;
  readonly automaticRetryRequested?: boolean;
  readonly automaticReplanRequested?: boolean;
  readonly autoApprovalRequested?: boolean;
  readonly crewExecutionRequested?: boolean;
  readonly explicitApprovalRecorded: boolean;
  readonly approvalBoundaryStatus?: ApprovalBoundaryStatus;
  readonly productionFilesystemWriteRequested?: boolean;
  readonly productionFilesystemReadOnly?: boolean;
  readonly persistenceRequested?: boolean;
  readonly persistenceMode?: PersistenceMode;
  readonly databaseAccessRequested?: boolean;
  readonly databaseRoute?: DatabaseRoute;
  readonly studioPlannerImportRequested?: boolean;
  readonly agentsMdChangeRequested?: boolean;
  readonly generalRepositoryPolicyChangeRequested?: boolean;
  readonly sharedGeneratedOutputWriteRequested?: boolean;
  readonly od04WaveControls?: Od04WaveControls;
  readonly requiredGates?: readonly string[];
  readonly completedGates?: readonly string[];
  readonly vitestLanes?: { readonly default: boolean; readonly techDocs: boolean };
}

export interface RepositoryPolicyAssessment {
  readonly allowed: boolean;
  readonly generalRepositoryRulePreserved: true;
  readonly od04ExceptionApplied: boolean;
  readonly ownerDecisions: OwnerDecisionValidationOutput;
  readonly blockers: readonly string[];
  readonly preservedPriorState: true;
}

export const REQUIRED_REPOSITORY_GATES = ["check:layout", "gate:fast"] as const;

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function isFiniteNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && Number.isFinite(value) && value >= 0;
}

function isDatabaseRoute(value: DatabaseRoute | undefined): value is Exclude<DatabaseRoute, "unknown"> {
  return value === "Admin" || value === "Products";
}

function requestedGatesAreComplete(request: RepositoryPolicyRequest, blockers: string[]): void {
  // Callers may add gates, but cannot replace the repository minimum.
  const required = unique([
    ...REQUIRED_REPOSITORY_GATES,
    ...(request.requiredGates ?? []),
  ]);
  const completed = new Set(request.completedGates ?? []);
  for (const gate of required) {
    if (!completed.has(gate)) blockers.push(`required repository gate ${gate} was not completed`);
  }

  if (!request.vitestLanes) {
    blockers.push("both default and tech-docs Vitest lanes must be recorded before policy approval");
  } else if (!request.vitestLanes.default || !request.vitestLanes.techDocs) {
    blockers.push("both default and tech-docs Vitest lanes must pass when policy approval is requested");
  }
}

function validateOd04Controls(
  request: RepositoryPolicyRequest,
  blockers: string[],
): void {
  const controls = request.od04WaveControls;
  if (!controls) {
    blockers.push("OD-04 requires recorded disjoint ownership, scopes, reservations, freeze, approvals, reviewers, and integration gate");
    return;
  }

  const requiredControls: readonly [keyof Od04WaveControls, string][] = [
    ["disjointFileOwnership", "disjoint declared file ownership"],
    ["explicitReadWriteScopes", "explicit read/write scopes"],
    ["fileOwnershipReservations", "File_Ownership_Reservation before every mutation"],
    ["sharedContractFreeze", "Shared_Contract_Freeze before dependent work"],
    ["namedApprovalBoundaries", "named approval boundaries"],
    ["singleIntegrationValidationGate", "one post-wave Integration_Validation_Gate"],
    ["sequentialReadOnlyReviewers", "sequential read-only reviewers"],
  ];

  for (const [key, label] of requiredControls) {
    if (controls[key] !== true) blockers.push(`OD-04 requires ${label}`);
  }
  if (controls.sharedGeneratedOutputWrites !== false) {
    blockers.push("OD-04 prohibits shared generated-output writes");
  }
}

/**
 * Evaluates repository invariants without executing commands or changing
 * state. The only multi-agent allowance is the exact, feature-scoped OD-04
 * wave, and even that allowance requires all recorded wave controls.
 */
export function assessRepositoryPolicy(
  request: RepositoryPolicyRequest,
  ownerDecisions: readonly OwnerDecision[] = OWNER_DECISIONS,
): StageResult<RepositoryPolicyAssessment> {
  const decisionValidation = validateOwnerDecisions(ownerDecisions);
  const blockers = [...decisionValidation.blockers];
  const featureWave = request.featureWaveRequested === true;
  const isExactOd04Wave = featureWave && request.featureName === FEATURE_NAME;

  if (!isFiniteNonNegativeInteger(request.activeAgentCount)) {
    blockers.push("active agent count must be a non-negative integer");
  }
  if (request.workingDirectory !== REPOSITORY_ROOT) blockers.push(`commands must run from ${REPOSITORY_ROOT}`);
  if (request.packageManager !== PACKAGE_MANAGER) blockers.push("repository commands must use root-only pnpm");
  if (request.worktreeRequested === true) blockers.push("worktrees are prohibited");
  if (request.hiddenSpawningRequested === true) blockers.push("hidden spawning is prohibited");
  if (request.automaticRetryRequested === true) blockers.push("automatic retries are prohibited");
  if (request.automaticReplanRequested === true) blockers.push("automatic replans are prohibited");
  if (request.autoApprovalRequested === true) blockers.push("auto-approval is prohibited");
  if (request.crewExecutionRequested === true) blockers.push("Crew execution is not authorized by OD-04");
  if (request.productionFilesystemWriteRequested === true) blockers.push("production filesystem writes are prohibited");
  if (request.productionFilesystemReadOnly === false) blockers.push("production filesystem must remain read-only");
  if (request.persistenceMode === "raw-disk") blockers.push("runtime persistence must use mode-aware wrappers");
  if (request.persistenceMode === "dual-write") blockers.push("runtime persistence must not dual-write");
  if (request.persistenceRequested === true && request.persistenceMode !== "mode-aware") {
    blockers.push("requested persistence must explicitly use mode-aware wrappers");
  }
  if (request.studioPlannerImportRequested === true) blockers.push("Studio and Planner must remain isolated");
  if (request.agentsMdChangeRequested === true) blockers.push("OD-04 cannot modify AGENTS.md");
  if (request.generalRepositoryPolicyChangeRequested === true) {
    blockers.push("OD-04 cannot change the general repository policy");
  }
  if (request.sharedGeneratedOutputWriteRequested === true) {
    blockers.push("lane-owned work cannot write shared generated output");
  }
  if (!request.explicitApprovalRecorded) blockers.push("explicit approval is required before the proposed action");
  if (request.approvalBoundaryStatus !== undefined && request.approvalBoundaryStatus !== "approved") {
    blockers.push(`approval boundary is ${request.approvalBoundaryStatus} and blocks the operation`);
  }

  const databaseAccessRequested = request.databaseAccessRequested !== false;
  if (databaseAccessRequested && !isDatabaseRoute(request.databaseRoute)) {
    blockers.push("database routing must select Admin or Products explicitly");
  }

  if (featureWave && !isExactOd04Wave) {
    blockers.push(`the OD-04 exception is limited to ${FEATURE_NAME}`);
  }
  if (!featureWave && request.featureName === FEATURE_NAME) {
    blockers.push("the feature name cannot authorize OD-04 without an explicit feature wave");
  }

  for (const decisionId of decisionValidation.output?.unresolvedDecisionIds ?? []) {
    blockers.push(`${decisionId} is unresolved; its safe fallback must remain in force`);
  }

  if (isExactOd04Wave) {
    const od04 = decisionValidation.output?.decisions.find((decision) => decision.decisionId === "OD-04");
    if (!od04 || od04.unresolvedStatus === "unresolved" || !["owner-approved", "owner-approved-conditional"].includes(od04.approvalStatus)) {
      blockers.push("OD-04 must be approved and resolved before the feature wave can use its exception");
    }
    if (request.activeAgentCount > FEATURE_WAVE_MAX_ACTIVE_AGENTS) {
      blockers.push("the feature-only OD-04 wave permits no more than four active Implementation_Agents");
    }
    validateOd04Controls(request, blockers);
  } else if (request.activeAgentCount > DEFAULT_MAX_ACTIVE_AGENTS) {
    blockers.push("the general repository rule permits no more than one active agent");
  }

  requestedGatesAreComplete(request, blockers);

  const output: RepositoryPolicyAssessment = {
    allowed: blockers.length === 0,
    generalRepositoryRulePreserved: true,
    od04ExceptionApplied: isExactOd04Wave,
    ownerDecisions: decisionValidation.output ?? {
      valid: false,
      decisions: [],
      unresolvedDecisionIds: [],
      safeFallbacks: [],
    },
    blockers: unique(blockers),
    preservedPriorState: true,
  };

  if (output.blockers.length > 0) {
    return { status: "blocked", output, blockers: output.blockers, evidenceRefs: decisionValidation.evidenceRefs };
  }
  return { status: "pass", output, blockers: [], evidenceRefs: decisionValidation.evidenceRefs };
}

export class RepositoryPolicyGuard {
  assess(
    request: RepositoryPolicyRequest,
    ownerDecisions: readonly OwnerDecision[] = OWNER_DECISIONS,
  ): StageResult<RepositoryPolicyAssessment> {
    return assessRepositoryPolicy(request, ownerDecisions);
  }
}

export const repositoryPolicyGuard = new RepositoryPolicyGuard();
