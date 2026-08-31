/**
 * Exact-Line Rule rollout for the explicitly approved writable Kiro guidance
 * targets. This module is pure: callers must persist the returned content only
 * after their own host/path gate has allowed the exact target.
 */

export const EXACT_LINE =
  "Before any action, read the current user request and applicable repository standard, declare exact scope and permissions, and stop on denial, conflict, or missing authorization." as const;

/**
 * Exact targets selected for this rollout. Protected root/Agents candidates are
 * listed separately and remain unchanged until individually owner-authorized.
 */
export const EXACT_LINE_TARGETS = [
  "./.kiro/skills/oando-master/SKILL.md",
  "./.kiro/steering/agent-behavior.md",
  "./.kiro/kiro-repo-guidance-setup/README.md",
] as const;

export const PROTECTED_EXACT_LINE_CANDIDATES = [
  "./AGENTS.md",
  "./Agents/01-standard.md",
] as const;

export type ExactLineStatus = "inserted" | "retained" | "denied";

export interface ExactLineDecision {
  readonly targetPath: string;
  readonly status: ExactLineStatus;
  readonly beforeCount: number;
  readonly afterCount: number;
  readonly content: string;
  readonly reason: string;
  readonly nextOwnerAction: string;
}

function countExactLines(content: string): number {
  return content
    .split(/\r?\n/)
    .filter((line) => line === EXACT_LINE).length;
}

function isSelectedTarget(targetPath: string): boolean {
  return EXACT_LINE_TARGETS.includes(targetPath as (typeof EXACT_LINE_TARGETS)[number]);
}

function denied(
  targetPath: string,
  content: string,
  beforeCount: number,
  reason: string,
  nextOwnerAction: string,
): ExactLineDecision {
  return {
    targetPath,
    status: "denied",
    beforeCount,
    afterCount: beforeCount,
    content,
    reason,
    nextOwnerAction,
  };
}

/**
 * Apply-or-retain the exact line in memory. Duplicate, unselected, or
 * post-insertion-invalid states fail closed and return the original content.
 */
export function applyExactLine(
  targetPath: string,
  content: string,
): ExactLineDecision {
  const beforeCount = countExactLines(content);
  if (!isSelectedTarget(targetPath)) {
    return denied(
      targetPath,
      content,
      beforeCount,
      "target is not in the explicitly selected Exact-Line rollout set",
      "Name the exact target in a new owner request before changing it.",
    );
  }

  if (beforeCount > 1) {
    return denied(
      targetPath,
      content,
      beforeCount,
      "the Exact-Line Rule already occurs more than once",
      "Stop and obtain owner authorization before normalizing the duplicate.",
    );
  }

  if (beforeCount === 1) {
    return {
      targetPath,
      status: "retained",
      beforeCount,
      afterCount: 1,
      content,
      reason: "the Exact-Line Rule already occurs exactly once",
      nextOwnerAction: "No insertion is required.",
    };
  }

  const separator = content.length === 0 || content.endsWith("\n") ? "" : "\n";
  const nextContent = `${content}${separator}${EXACT_LINE}\n`;
  const afterCount = countExactLines(nextContent);
  if (afterCount !== 1) {
    return denied(
      targetPath,
      content,
      beforeCount,
      "the proposed insertion did not produce exactly one Exact-Line occurrence",
      "Stop the rollout and record the insertion failure for owner review.",
    );
  }

  return {
    targetPath,
    status: "inserted",
    beforeCount,
    afterCount,
    content: nextContent,
    reason: "the Exact-Line Rule was inserted once",
    nextOwnerAction: "Persist only after the host/path gate allows this exact target.",
  };
}
