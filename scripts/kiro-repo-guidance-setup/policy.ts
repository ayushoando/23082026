import {
  DEFAULT_MAX_ACTIVE_AGENTS,
  FEATURE_NAME,
  FEATURE_WAVE_MAX_ACTIVE_AGENTS,
  PACKAGE_MANAGER,
  REPOSITORY_ROOT,
  type OwnerDecision,
  type StageResult,
} from "./contracts";
import { validateOwnerDecisions, type OwnerDecisionValidationOutput } from "./owner-decisions";

export type PersistenceMode = "mode-aware" | "raw-disk" | "dual-write";
export type DatabaseRoute = "Admin" | "Products" | "unknown";

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
  readonly productionFilesystemWriteRequested?: boolean;
  readonly persistenceMode?: PersistenceMode;
  readonly databaseRoute?: DatabaseRoute;
  readonly studioPlannerImportRequested?: boolean;
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
  return [...new Set(values)];
}

function requestedGatesAreComplete(request: RepositoryPolicyRequest, blockers: string[]): void {
  const required = request.requiredGates ?? REQUIRED_REPOSITORY_GATES;
  const completed = new Set(request.completedGates ?? []);
  for (const gate of required) {
    if (!completed.has(gate)) blockers.push(`required repository gate ${gate} was not completed`);
  }
  if (request.vitestLanes && (!request.vitestLanes.default || !request.vitestLanes.techDocs)) {
    blockers.push("both default and tech-docs Vitest lanes must pass when Vitest is recorded");
  }
}

/**
 * Evaluates repository invariants without executing commands or changing state.
 * The OD-04 exception applies only to this feature's bounded local wave; it
 * cannot relax the general one-agent/no-worktree policy or Crew restrictions.
 */
export function assessRepositoryPolicy(
  request: RepositoryPolicyRequest,
  ownerDecisions: readonly OwnerDecision[],
): StageResult<RepositoryPolicyAssessment> {
  const decisionValidation = validateOwnerDecisions(ownerDecisions);
  const blockers = [...decisionValidation.blockers];
  const featureWave = request.featureWaveRequested === true;
  const isExactOd04Wave = featureWave && request.featureName === FEATURE_NAME;

  if (request.workingDirectory !== REPOSITORY_ROOT) blockers.push(`commands must run from ${REPOSITORY_ROOT}`);
  if (request.packageManager !== PACKAGE_MANAGER) blockers.push("repository commands must use root-only pnpm");
  if (request.worktreeRequested === true) blockers.push("worktrees are prohibited");
  if (request.hiddenSpawningRequested === true) blockers.push("hidden spawning is prohibited");
  if (request.automaticRetryRequested === true) blockers.push("automatic retries are prohibited");
  if (request.automaticReplanRequested === true) blockers.push("automatic replans are prohibited");
  if (request.autoApprovalRequested === true) blockers.push("auto-approval is prohibited");
  if (request.productionFilesystemWriteRequested === true) blockers.push("production filesystem writes are prohibited");
  if (request.persistenceMode === "raw-disk") blockers.push("runtime persistence must use mode-aware wrappers");
  if (request.persistenceMode === "dual-write") blockers.push("runtime persistence must not dual-write");
  if (request.databaseRoute === "unknown") blockers.push("database routing must select Admin or Products explicitly");
  if (request.studioPlannerImportRequested === true) blockers.push("Studio and Planner must remain isolated");
  if (!request.explicitApprovalRecorded) blockers.push("explicit approval is required before the proposed action");

  if (request.crewExecutionRequested === true) {
    blockers.push("Crew execution cannot use the feature-only OD-04 exception");
  }

  if (isExactOd04Wave) {
    const od04 = ownerDecisions.find((decision) => decision.decisionId === "OD-04");
    if (!od04 || od04.unresolvedStatus === "unresolved" || !["owner-approved", "owner-approved-conditional"].includes(od04.approvalStatus)) {
      blockers.push("OD-04 must be approved and resolved before the feature wave can use more than one agent");
    }
    if (request.activeAgentCount < 0 || request.activeAgentCount > FEATURE_WAVE_MAX_ACTIVE_AGENTS) {
      blockers.push("the feature-only OD-04 wave permits no more than four active Implementation_Agents");
    }
  } else if (request.activeAgentCount < 0 || request.activeAgentCount > DEFAULT_MAX_ACTIVE_AGENTS) {
    blockers.push("the general repository rule permits no more than one active agent");
  }

  if (featureWave && !isExactOd04Wave) blockers.push("the OD-04 exception is limited to kiro-repo-guidance-setup");
  requestedGatesAreComplete(request, blockers);

  const output: RepositoryPolicyAssessment = {
    allowed: blockers.length === 0,
    generalRepositoryRulePreserved: true,
    od04ExceptionApplied: isExactOd04Wave,
    ownerDecisions: decisionValidation.output ?? {
      valid: false,
      decisions: ownerDecisions,
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
    ownerDecisions: readonly OwnerDecision[],
  ): StageResult<RepositoryPolicyAssessment> {
    return assessRepositoryPolicy(request, ownerDecisions);
  }
}

export const repositoryPolicyGuard = new RepositoryPolicyGuard();
