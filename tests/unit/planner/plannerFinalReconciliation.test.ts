// @vitest-environment node
//
// Closes the planner-comprehensive-audit final-checkpoint gap (task 6): the
// reconciliation module carries load-time assertions (it throws unless the
// dataset has terminal findings and repository remediation is complete while
// full validation stays pending) but had no test importing it, so those
// guards never executed. This test imports the module (running its guards)
// and additionally asserts every recorded path exists on disk — the class of
// drift that let stale external-spec-tree references survive unnoticed.

import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  FINAL_COMPLETION_RECORD,
  FINAL_OWNERSHIP_LEDGER,
  FINAL_PENDING_VALIDATIONS,
  FINAL_RECONCILIATION_VALIDATION,
  IS_COMPREHENSIVE_REMEDIATION_COMPLETE,
  IS_FULL_VALIDATION_COMPLETE,
} from "../../../plans/planner-comprehensive-audit/finalReconciliation";

const REPO_ROOT = path.resolve(__dirname, "../../..");

describe("planner final reconciliation (task 6 checkpoint)", () => {
  it("imports without tripping its load-time guards", () => {
    // Reaching this assertion means the module-level throws accepted the
    // dataset: remediation complete, full validation honestly pending.
    expect(FINAL_RECONCILIATION_VALIDATION.valid).toBe(true);
    expect(IS_COMPREHENSIVE_REMEDIATION_COMPLETE).toBe(true);
    expect(IS_FULL_VALIDATION_COMPLETE).toBe(false);
  });

  it("keeps the completion record lanes consistent with the dataset", () => {
    expect(FINAL_COMPLETION_RECORD.repositoryRemediation.complete).toBe(true);
    expect(FINAL_COMPLETION_RECORD.fullValidation.complete).toBe(false);
    expect(FINAL_COMPLETION_RECORD.fullValidation.pendingCommands.length)
      .toBeGreaterThan(0);
    expect(FINAL_COMPLETION_RECORD.findingCount).toBeGreaterThan(0);
  });

  it("records exactly the pending validations derived from protected commands", () => {
    expect(
      FINAL_PENDING_VALIDATIONS.every((validation) =>
        validation.exactCommand === null
          ? Boolean(validation.pendingOwnerAction)
          : true,
      ),
    ).toBe(true);
  });

  it("every path named by the ledger and completion record exists on disk", () => {
    const referenced = new Set<string>([
      ...FINAL_OWNERSHIP_LEDGER.writablePaths,
      ...FINAL_COMPLETION_RECORD.preservedUnrelatedPaths,
      ...FINAL_COMPLETION_RECORD.preservedOutOfScopePaths,
    ]);

    const missing = [...referenced].filter(
      (relativePath) => !existsSync(path.join(REPO_ROOT, relativePath)),
    );

    expect(missing, `reconciliation references missing paths: ${missing.join(", ")}`).toEqual([]);
  });

  it("keeps every preserved reconciliation path inside an allowlisted repository root", () => {
    // Protective intent: preserved paths must live under real, tracked
    // repository roots — never under the removed external spec tree or any
    // other hidden scaffolding directory.
    const allowedRoots = ["plans/", "site/", "tests/", "scripts/"];
    const offenders = [
      ...FINAL_COMPLETION_RECORD.preservedUnrelatedPaths,
      ...FINAL_COMPLETION_RECORD.preservedOutOfScopePaths,
    ].filter((p) => !allowedRoots.some((root) => p.startsWith(root)));
    expect(offenders).toEqual([]);
  });
});
