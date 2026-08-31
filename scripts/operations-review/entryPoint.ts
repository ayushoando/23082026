/**
 * Command integration entry point — pending owner approval.
 *
 * The root `package.json` command integration for the operations-review tool
 * has NOT been wired. Separate explicit owner approval of the exact
 * `package.json` and script changes is required before that step proceeds.
 *
 * This file:
 *   - Exports the P1 Gap record documenting the pending owner decision.
 *   - Exports a human-readable note constant summarising the pending status.
 *   - Provides the `runReview` skeleton that WOULD be invoked if the owner
 *     approves the command route.
 *
 * FORBIDDEN — this file must never contain:
 *   - Any provider SDK import or call.
 *   - Any child_process / exec / spawn usage.
 *   - Any fs / path write operation.
 *   - Any database client.
 *   - Any process.env credential read.
 *   - Any deployment, backup, restore, migration, or infrastructure action.
 */

import type { Gap } from "./models";

// ---------------------------------------------------------------------------
// P1 owner-decision record
// ---------------------------------------------------------------------------

/**
 * Returns the Gap record that documents the pending owner decision for wiring
 * the root command entry point. Include this in the `gapsAndRecommendations`
 * section of any generated EvidenceRecord until the owner explicitly approves
 * the `package.json` and script changes.
 *
 * Requirements: 1.1, 1.2, 9.1, 9.4
 */
export function getCommandIntegrationDecision(): Gap {
  return {
    id: "command-integration.owner-decision.pending",
    surface: "runbook-ci-alignment",
    missingOrContradictoryElement:
      "The root command entry point for the operations-review tool has not been " +
      "wired into package.json. Separate explicit owner approval of the exact " +
      "package.json and script changes is required before adding the command route.",
    risk: "medium",
    priority: "P1",
    sourcePaths: ["package.json", "scripts/operations-review/index.ts"],
    recommendedFollowUp:
      "Request owner approval for: " +
      "(1) adding a `pnpm run ops:review` script to root package.json, " +
      "(2) creating scripts/operations-review/run.ts as the command entry, " +
      "(3) confirming the entry point has no provider client, child-process, " +
      "or mutable infrastructure code path.",
    namedOwner: "repository-owner",
  } as const;
}

// ---------------------------------------------------------------------------
// Human-readable note constant
// ---------------------------------------------------------------------------

/**
 * Plain-language summary of the pending command-integration status.
 * Embed this in any rendered review summary until the owner decision is made.
 */
export const COMMAND_INTEGRATION_NOTE =
  "The operations-review library is complete and available for programmatic use " +
  "via scripts/operations-review/index.ts. The root pnpm command integration " +
  "(ops:review) is a P1 owner decision pending separate explicit authorization " +
  "of the exact package.json and script changes. No deployment, provider " +
  "inspection, backup, restore, migration, seed, or local-service action will be " +
  "introduced by the command entry point when it is approved.";

// ---------------------------------------------------------------------------
// Skeleton entry point — only callable after owner approval is recorded
// ---------------------------------------------------------------------------

/**
 * Thin review runner that would be wired to the approved root command.
 *
 * This function is intentionally a pure-TypeScript skeleton with no side
 * effects. It is present so a future owner-approved `run.ts` shim can import
 * and invoke it without touching the library internals.
 *
 * Static-inspection acceptance criteria (Requirements 1.1, 1.2):
 *   ✓ No provider SDK imported or called.
 *   ✓ No child_process / exec / spawn.
 *   ✓ No fs/path write.
 *   ✓ No database client.
 *   ✓ No process.env credential access.
 *   ✓ No deployment, backup, restore, migration, or infrastructure call.
 */
export function runReview(options?: {
  /** Absolute repository root path — read-only access only. */
  repositoryRoot: string;
  /** Explicitly selected output directory path. */
  outputPath: string;
}): { pendingDecision: Gap; note: string } {
  // Until owner approval is recorded, return the pending decision record.
  // Callers must gate any further execution on an affirmative owner decision.
  return {
    pendingDecision: getCommandIntegrationDecision(),
    note: COMMAND_INTEGRATION_NOTE,
  };
}
