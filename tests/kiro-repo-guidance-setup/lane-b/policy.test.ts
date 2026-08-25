// @vitest-environment node

import { describe, expect, it } from "vitest";

import { OWNER_DECISIONS, type OwnerDecision } from "../../../scripts/kiro-repo-guidance-setup/contracts.ts";
import { validateOwnerDecisions } from "../../../scripts/kiro-repo-guidance-setup/owner-decisions.ts";
import { assessRepositoryPolicy } from "../../../scripts/kiro-repo-guidance-setup/policy.ts";

function compliantRequest() {
  return {
    workingDirectory: "D:\\23082026",
    packageManager: "pnpm",
    activeAgentCount: 1,
    explicitApprovalRecorded: true,
    persistenceMode: "mode-aware" as const,
    databaseRoute: "Admin" as const,
    requiredGates: ["check:layout", "gate:fast"],
    completedGates: ["check:layout", "gate:fast"],
    vitestLanes: { default: true, techDocs: true },
  };
}

describe("RepositoryPolicyGuard and owner decisions", () => {
  it("requires exactly the OD-01 through OD-10 ledger and retains broad conditional approval", () => {
    const result = validateOwnerDecisions(OWNER_DECISIONS);

    expect(result.status).toBe("pass");
    expect(result.output?.decisions).toHaveLength(10);
    expect(result.output?.decisions.map((decision) => decision.decisionId)).toEqual([
      "OD-01", "OD-02", "OD-03", "OD-04", "OD-05",
      "OD-06", "OD-07", "OD-08", "OD-09", "OD-10",
    ]);
    expect(result.output?.decisions.every((decision) => decision.selectedPolicy === "enable after validation")).toBe(true);
  });

  it("fails closed for an incomplete decision ledger and reports unresolved fallbacks", () => {
    const unresolvedOd04 = {
      ...OWNER_DECISIONS[3],
      unresolvedStatus: "unresolved",
      approvalStatus: "pending",
    } as OwnerDecision;
    const result = validateOwnerDecisions([...OWNER_DECISIONS.slice(0, 3), unresolvedOd04]);

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain("required owner decision OD-05 is missing");
    expect(result.output?.unresolvedDecisionIds).toContain("OD-04");
    expect(result.output?.safeFallbacks).toContain("preserve no-worktree, default-one-agent, and explicit-approval safeguards");
  });

  it("permits the OD-04 maximum-four exception only for this feature with all repository safeguards", () => {
    const result = assessRepositoryPolicy(
      {
        ...compliantRequest(),
        featureWaveRequested: true,
        featureName: "kiro-repo-guidance-setup",
        activeAgentCount: 4,
      },
      OWNER_DECISIONS,
    );

    expect(result.status).toBe("pass");
    expect(result.output?.od04ExceptionApplied).toBe(true);
    expect(result.output?.generalRepositoryRulePreserved).toBe(true);
  });

  it("blocks policy violations without changing prior state or extending OD-04 to Crew", () => {
    const result = assessRepositoryPolicy(
      {
        ...compliantRequest(),
        featureWaveRequested: true,
        featureName: "another-feature",
        activeAgentCount: 2,
        crewExecutionRequested: true,
        worktreeRequested: true,
        automaticRetryRequested: true,
        productionFilesystemWriteRequested: true,
        persistenceMode: "dual-write",
        studioPlannerImportRequested: true,
        vitestLanes: { default: true, techDocs: false },
      },
      OWNER_DECISIONS,
    );

    expect(result.status).toBe("blocked");
    expect(result.output?.preservedPriorState).toBe(true);
    expect(result.output?.generalRepositoryRulePreserved).toBe(true);
    expect(result.output?.od04ExceptionApplied).toBe(false);
    expect(result.blockers).toContain("worktrees are prohibited");
    expect(result.blockers).toContain("automatic retries are prohibited");
    expect(result.blockers).toContain("production filesystem writes are prohibited");
    expect(result.blockers).toContain("runtime persistence must not dual-write");
    expect(result.blockers).toContain("Studio and Planner must remain isolated");
    expect(result.blockers).toContain("Crew execution cannot use the feature-only OD-04 exception");
    expect(result.blockers).toContain("the OD-04 exception is limited to kiro-repo-guidance-setup");
    expect(result.blockers).toContain("both default and tech-docs Vitest lanes must pass when Vitest is recorded");
  });
});
