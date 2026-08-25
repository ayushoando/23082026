import {
  OWNER_DECISION_IDS,
  OWNER_DECISIONS,
  type OwnerDecision,
  type OwnerDecisionId,
  type StageResult,
} from "./contracts";

export interface OwnerDecisionValidationOutput {
  readonly valid: boolean;
  readonly decisions: readonly OwnerDecision[];
  readonly unresolvedDecisionIds: readonly OwnerDecisionId[];
  readonly safeFallbacks: readonly string[];
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function fallbackFor(decisionId: OwnerDecisionId): string {
  const fallbacks: Readonly<Record<OwnerDecisionId, string>> = {
    "OD-01": "limit compatibility claims to the observed IDE session and keep other surfaces Unverified",
    "OD-02": "preserve current hook states and block automatic command execution",
    "OD-03": "preserve the manual graph-impact loop and block automation",
    "OD-04": "preserve no-worktree, default-one-agent, and explicit-approval safeguards",
    "OD-05": "keep powers inactive",
    "OD-06": "keep external MCP and network capabilities inactive",
    "OD-07": "keep custom agents and subagents inactive",
    "OD-08": "make no skill activation-scope claim",
    "OD-09": "leave global and user configuration unchanged",
    "OD-10": "retain the final gate as an owner decision without enabled-valid status",
  };
  return fallbacks[decisionId];
}

/**
 * Validates the required owner-decision ledger without granting enablement.
 * Unresolved decisions remain valid ledger entries but always emit their
 * corresponding fail-closed fallback.
 */
export function validateOwnerDecisions(
  decisions: readonly OwnerDecision[] = OWNER_DECISIONS,
): StageResult<OwnerDecisionValidationOutput> {
  const blockers: string[] = [];
  const seen = new Set<OwnerDecisionId>();
  const unresolvedDecisionIds: OwnerDecisionId[] = [];
  const safeFallbacks: string[] = [];

  for (const decision of decisions) {
    if (!OWNER_DECISION_IDS.includes(decision.decisionId)) {
      blockers.push(`owner decision ${decision.decisionId} is not one of OD-01 through OD-10`);
      continue;
    }
    if (seen.has(decision.decisionId)) {
      blockers.push(`owner decision ${decision.decisionId} is duplicated`);
      continue;
    }
    seen.add(decision.decisionId);

    if (!hasText(decision.owner)) blockers.push(`${decision.decisionId} requires an owner`);
    if (!isIsoDate(decision.decisionDate)) blockers.push(`${decision.decisionId} requires an ISO decision date`);
    if (decision.selectedPolicy !== "enable after validation") {
      blockers.push(`${decision.decisionId} must preserve the enable after validation policy`);
    }
    if (!hasText(decision.scope)) blockers.push(`${decision.decisionId} requires a scope`);
    if (!Array.isArray(decision.rejectedOptions)) blockers.push(`${decision.decisionId} requires rejected options`);
    if (!Array.isArray(decision.requiredValidation) || decision.requiredValidation.length === 0) {
      blockers.push(`${decision.decisionId} requires validation actions`);
    }
    if (!hasText(decision.rollbackBoundary)) blockers.push(`${decision.decisionId} requires a rollback boundary`);
    if (!hasText(decision.evidenceRef)) blockers.push(`${decision.decisionId} requires evidence`);

    const approved = decision.approvalStatus === "owner-approved" || decision.approvalStatus === "owner-approved-conditional";
    const unresolved = decision.unresolvedStatus === "unresolved" || !approved;
    if (unresolved) {
      unresolvedDecisionIds.push(decision.decisionId);
      safeFallbacks.push(fallbackFor(decision.decisionId));
    }
  }

  for (const decisionId of OWNER_DECISION_IDS) {
    if (!seen.has(decisionId)) blockers.push(`required owner decision ${decisionId} is missing`);
  }

  const output: OwnerDecisionValidationOutput = {
    valid: blockers.length === 0,
    decisions,
    unresolvedDecisionIds,
    safeFallbacks,
  };
  if (blockers.length > 0) {
    return { status: "blocked", output, blockers, evidenceRefs: decisions.map((decision) => decision.evidenceRef) };
  }
  return { status: "pass", output, blockers: [], evidenceRefs: decisions.map((decision) => decision.evidenceRef) };
}

export const assessOwnerDecisions = validateOwnerDecisions;
