/**
 * Exact active-document contract coverage for the approved Kiro guidance lane.
 *
 * This module is a static, fail-closed checker. It does not load Kiro files,
 * mutate files, or claim that a host has loaded or enforced the inclusion.
 */

export const CANONICAL_INCLUSION =
  "Apply the Kiro Agent Contract at ./.kiro/skills/oando-master/SKILL.md before any action." as const;

/**
 * The approved writable subset of the 36-document active inventory.
 * The five physical Agent definitions are protected and intentionally excluded
 * until their exact files are named in a current owner request.
 */
export const ACTIVE_CONTRACT_TARGETS = [
  "./.kiro/skills/db-migrations/SKILL.md",
  "./.kiro/skills/focss-css/SKILL.md",
  "./.kiro/skills/fork-boundaries/SKILL.md",
  "./.kiro/skills/graph-impact/SKILL.md",
  "./.kiro/skills/oando-master/SKILL.md",
  "./.kiro/skills/planner-studio/SKILL.md",
  "./.kiro/skills/powers-skills-model/SKILL.md",
  "./.kiro/skills/repo-map/SKILL.md",
  "./.kiro/skills/verify-and-gate/SKILL.md",
  "./.kiro/steering/agent-behavior.md",
  "./.kiro/steering/ai.md",
  "./.kiro/steering/api.md",
  "./.kiro/steering/coding-standards.md",
  "./.kiro/steering/database.md",
  "./.kiro/steering/deployment.md",
  "./.kiro/steering/graph-layer.md",
  "./.kiro/steering/INDEX.md",
  "./.kiro/steering/ltm-memory-format.md",
  "./.kiro/steering/ltm-operations.md",
  "./.kiro/steering/nova-act-viewport.md",
  "./.kiro/steering/product.md",
  "./.kiro/steering/seo.md",
  "./.kiro/steering/tech-stack.md",
  "./.kiro/steering/testing.md",
  "./.kiro/steering/ui-css.md",
  "./.kiro/powers/analytics/POWER.md",
  "./.kiro/powers/oando-workflow/POWER.md",
  "./.kiro/powers/observability/POWER.md",
  "./.kiro/powers/security/POWER.md",
  "./.kiro/powers/oando-workflow/steering/routing.md",
  "./.kiro/kiro-repo-guidance-setup/README.md",
] as const;

export const PRESERVED_PROTECTED_AGENT_TARGETS = [
  "./.kiro/agents/capability-powers-author.md",
  "./.kiro/agents/containment-reconciler.md",
  "./.kiro/agents/hook-localizer.md",
  "./.kiro/agents/spec-task-runner.md",
  "./.kiro/agents/spec-task-runner2.md",
] as const;

export type ContractCoverageStatus =
  | "covered"
  | "missing"
  | "duplicate"
  | "denied-target";

export interface ContractCoverageResult {
  readonly targetPath: string;
  readonly status: ContractCoverageStatus;
  readonly occurrenceCount: number;
  readonly reason: string;
  readonly nextOwnerAction: string;
}

function countExactInclusions(content: string): number {
  return content
    .split(/\r?\n/)
    .filter((line) => line === CANONICAL_INCLUSION).length;
}

function includesTarget(targets: readonly string[], targetPath: string): boolean {
  return targets.includes(targetPath as (typeof targets)[number]);
}

/**
 * Evaluate one already-read document. Missing, duplicate, or out-of-scope
 * targets never become covered by implication.
 */
export function evaluateContractCoverage(
  targetPath: string,
  content: string,
): ContractCoverageResult {
  if (!includesTarget(ACTIVE_CONTRACT_TARGETS, targetPath)) {
    return {
      targetPath,
      status: "denied-target",
      occurrenceCount: countExactInclusions(content),
      reason: "target is outside the approved writable active-document set",
      nextOwnerAction:
        "Name the exact target in a new owner request before changing contract coverage.",
    };
  }

  const occurrenceCount = countExactInclusions(content);
  if (occurrenceCount === 1) {
    return {
      targetPath,
      status: "covered",
      occurrenceCount,
      reason: "the exact Canonical Inclusion occurs once",
      nextOwnerAction: "No contract edit is required.",
    };
  }

  if (occurrenceCount > 1) {
    return {
      targetPath,
      status: "duplicate",
      occurrenceCount,
      reason: "the exact Canonical Inclusion occurs more than once",
      nextOwnerAction:
        "Stop and obtain owner authorization before normalizing the duplicate.",
    };
  }

  return {
    targetPath,
    status: "missing",
    occurrenceCount,
    reason: "the exact Canonical Inclusion is absent",
    nextOwnerAction:
      "Apply the exact inclusion once under the approved exclusive write scope.",
  };
}
