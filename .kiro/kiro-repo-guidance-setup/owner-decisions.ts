import {
  OWNER_DECISION_IDS,
  OWNER_DECISIONS,
  type ApprovalStatus,
  type OwnerDecision,
  type OwnerDecisionId,
  type SelectedOwnerPolicy,
  type StageResult,
  type UnresolvedStatus,
} from "./contracts";

export interface OwnerDecisionValidationOutput {
  readonly valid: boolean;
  readonly decisions: readonly OwnerDecision[];
  readonly unresolvedDecisionIds: readonly OwnerDecisionId[];
  readonly safeFallbacks: readonly string[];
}

export const OWNER_DECISION_SAFE_FALLBACKS: Readonly<Record<OwnerDecisionId, string>> = {
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

const APPROVAL_STATUSES = new Set<ApprovalStatus>([
  "pending",
  "owner-approved",
  "owner-approved-conditional",
  "rejected",
  "expired",
]);
const UNRESOLVED_STATUSES = new Set<UnresolvedStatus>(["resolved", "unresolved"]);
const SELECTED_POLICIES = new Set<SelectedOwnerPolicy>(["enable after validation"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function isOwnerDecisionId(value: unknown): value is OwnerDecisionId {
  return typeof value === "string" && OWNER_DECISION_IDS.includes(value as OwnerDecisionId);
}

function isApprovalStatus(value: unknown): value is ApprovalStatus {
  return typeof value === "string" && APPROVAL_STATUSES.has(value as ApprovalStatus);
}

function isUnresolvedStatus(value: unknown): value is UnresolvedStatus {
  return typeof value === "string" && UNRESOLVED_STATUSES.has(value as UnresolvedStatus);
}

function isSelectedPolicy(value: unknown): value is SelectedOwnerPolicy {
  return typeof value === "string" && SELECTED_POLICIES.has(value as SelectedOwnerPolicy);
}

function isStringArray(value: unknown, requireValues = false): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && (!requireValues || item.trim().length > 0)) &&
    (!requireValues || value.length > 0)
  );
}

function isApproved(status: unknown): boolean {
  return status === "owner-approved" || status === "owner-approved-conditional";
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

/**
 * Validates the owner-decision ledger without granting enablement.
 *
 * The ledger is exact: it must contain each of OD-01 through OD-10 once and
 * no other decision. A structurally valid but unresolved decision remains in
 * the output and receives its deterministic fail-closed fallback. This keeps
 * the broad `enable after validation` selection intact without treating owner
 * intent, historical evidence, or a pending approval as validation.
 */
export function validateOwnerDecisions(
  decisions: readonly OwnerDecision[] = OWNER_DECISIONS,
): StageResult<OwnerDecisionValidationOutput> {
  const supplied = Array.isArray(decisions) ? decisions : [];
  const blockers: string[] = [];
  const seen = new Set<OwnerDecisionId>();
  const unresolved = new Set<OwnerDecisionId>();
  const validDecisions: OwnerDecision[] = [];

  if (supplied.length !== OWNER_DECISION_IDS.length) {
    blockers.push(`exactly ${OWNER_DECISION_IDS.length} owner decisions are required (OD-01 through OD-10)`);
  }

  for (const candidate of supplied as readonly unknown[]) {
    if (!isRecord(candidate)) {
      blockers.push("owner decision entry is malformed");
      continue;
    }

    const decisionId = candidate.decisionId;
    if (!isOwnerDecisionId(decisionId)) {
      blockers.push(`owner decision ${String(decisionId)} is not one of OD-01 through OD-10`);
      continue;
    }
    if (seen.has(decisionId)) {
      blockers.push(`owner decision ${decisionId} is duplicated`);
      continue;
    }
    seen.add(decisionId);

    const decision = candidate as unknown as OwnerDecision;
    validDecisions.push(decision);

    if (!hasText(candidate.owner)) blockers.push(`${decisionId} requires an owner`);
    if (!isIsoDate(candidate.decisionDate)) blockers.push(`${decisionId} requires an ISO decision date`);
    if (!isSelectedPolicy(candidate.selectedPolicy)) {
      blockers.push(`${decisionId} must preserve the enable after validation policy`);
    }
    if (!hasText(candidate.scope)) blockers.push(`${decisionId} requires a scope`);
    if (!isStringArray(candidate.rejectedOptions, true)) {
      blockers.push(`${decisionId} requires rejected options`);
    }
    if (!isApprovalStatus(candidate.approvalStatus)) {
      blockers.push(`${decisionId} requires a known approval status`);
    }
    if (candidate.unresolvedStatus !== undefined && !isUnresolvedStatus(candidate.unresolvedStatus)) {
      blockers.push(`${decisionId} requires a known unresolved status`);
    }
    if (!isStringArray(candidate.requiredValidation, true)) {
      blockers.push(`${decisionId} requires validation actions`);
    }
    if (!hasText(candidate.rollbackBoundary)) blockers.push(`${decisionId} requires a rollback boundary`);
    if (!hasText(candidate.evidenceRef)) blockers.push(`${decisionId} requires evidence`);
    if (!isStringArray(candidate.limitations, true)) blockers.push(`${decisionId} requires limitations`);

    const decisionIsUnresolved =
      candidate.unresolvedStatus === "unresolved" || !isApproved(candidate.approvalStatus);
    if (decisionIsUnresolved) unresolved.add(decisionId);
  }

  for (const decisionId of OWNER_DECISION_IDS) {
    if (!seen.has(decisionId)) {
      blockers.push(`required owner decision ${decisionId} is missing`);
      unresolved.add(decisionId);
    }
  }

  const unresolvedDecisionIds = OWNER_DECISION_IDS.filter((decisionId) => unresolved.has(decisionId));
  const safeFallbacks = unresolvedDecisionIds.map((decisionId) => OWNER_DECISION_SAFE_FALLBACKS[decisionId]);
  const output: OwnerDecisionValidationOutput = {
    valid: blockers.length === 0,
    decisions: validDecisions,
    unresolvedDecisionIds,
    safeFallbacks: unique(safeFallbacks),
  };
  const evidenceRefs = unique(
    validDecisions
      .map((decision) => decision.evidenceRef)
      .filter((value): value is string => typeof value === "string"),
  );

  if (blockers.length > 0) {
    return { status: "blocked", output, blockers: unique(blockers), evidenceRefs };
  }
  return { status: "pass", output, blockers: [], evidenceRefs };
}

export const assessOwnerDecisions = validateOwnerDecisions;
