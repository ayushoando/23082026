import type {
  ProtectedOperation,
  ProtectedOperationStatus,
  Surface,
} from "./models";

/**
 * Protected actions that the review may describe but must never execute.
 *
 * The list deliberately covers operational routes from the approved review
 * scope. Adding an action here grants no capability; classification produces
 * metadata only.
 */
export const PROTECTED_ACTIONS = [
  "vercel-deployment",
  "cloudflare-worker-deployment",
  "provider-inspection",
  "products-backup",
  "admin-backup",
  "r2-write",
  "r2-retrieval",
  "restore",
  "migration",
  "seed",
  "local-observability-startup",
  "provider-log-access",
] as const;

export type ProtectedAction = (typeof PROTECTED_ACTIONS)[number];

export interface ProtectedActionProposal {
  readonly action: ProtectedAction;
  readonly targetSurface: Surface;
  readonly expectedEvidence: readonly string[];
  readonly executionStatus?: ProtectedOperationStatus;
}

const REQUIRED_AUTHORIZATION =
  "Explicit current-session owner authorization and enabled-hook permission are required before this protected operation may run.";

const ACTION_TARGETS: Readonly<Record<ProtectedAction, readonly Surface[]>> = {
  "vercel-deployment": ["vercel-application"],
  "cloudflare-worker-deployment": ["cloudflare-worker"],
  "provider-inspection": [
    "vercel-application",
    "cloudflare-worker",
    "products-database",
    "admin-database",
    "r2-backup",
    "monitoring",
  ],
  "products-backup": ["products-database"],
  "admin-backup": ["admin-database"],
  "r2-write": ["r2-backup"],
  "r2-retrieval": ["r2-backup"],
  restore: ["products-database", "admin-database", "r2-backup"],
  migration: ["products-database", "admin-database"],
  seed: ["products-database", "admin-database"],
  "local-observability-startup": ["monitoring"],
  "provider-log-access": [
    "vercel-application",
    "cloudflare-worker",
    "products-database",
    "admin-database",
    "r2-backup",
    "monitoring",
  ],
};

/**
 * Pure authorization boundary for review findings.
 *
 * It has no provider, network, process, backup, restore, or deployment
 * dependencies. One proposal always maps to one pending record.
 */
export class AuthorizationGuard {
  public classify(proposal: ProtectedActionProposal): ProtectedOperation {
    this.assertValidProposal(proposal);

    return {
      operation: proposal.action,
      targetSurface: proposal.targetSurface,
      classification: "protected-operation",
      requiredAuthorization: REQUIRED_AUTHORIZATION,
      expectedEvidence: proposal.expectedEvidence.map((evidence) => evidence.trim()),
      executionStatus: proposal.executionStatus ?? "pending-authorization",
    };
  }

  private assertValidProposal(proposal: ProtectedActionProposal): void {
    const allowedTargets = ACTION_TARGETS[proposal.action];

    if (!allowedTargets.includes(proposal.targetSurface)) {
      throw new Error(
        `Protected action ${proposal.action} cannot target ${proposal.targetSurface}.`,
      );
    }

    if (
      proposal.expectedEvidence.length === 0 ||
      proposal.expectedEvidence.some((evidence) => !evidence.trim())
    ) {
      throw new Error(
        "Protected operations require at least one non-empty expected-evidence item.",
      );
    }
  }
}
