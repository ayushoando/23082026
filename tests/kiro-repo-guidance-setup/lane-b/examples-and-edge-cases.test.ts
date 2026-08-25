// @vitest-environment node

// Feature: kiro-repo-guidance-setup — Lane B example and edge-case tests (task 3.8).
//
// These example-based, deterministic tests complement the Lane B property tests
// (Properties 4, 5, and 7). They pin the specific fixed facts from the design
// (the seven surface/version records, the ten owner decisions, the CLI 2.19.1
// observation not validating other surfaces, Web/Mobile non-applicability, and
// the Crew guard) and cover boundary/edge inputs — empty inputs, missing
// fields, duplicate records, and out-of-range values — that the randomized
// property tests do not assert by construction.
//
// **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 5.2, 5.3, 5.4, 5.5, 9.2, 9.3,
// 9.8, 9.9, 9.10, 9.11, 9.12, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10,
// 10.11, 10.12, 10.13; Design: Surface/version model, Crew compatibility guard,
// Error handling**

import { describe, expect, it } from "vitest";

import {
  assessCompatibility,
  assessScopePrecedence,
  compatibilityMatrix,
  DOCUMENTED_SCOPE_ORDER,
  OBSERVED_CLI_2_VERSION,
  OBSERVED_IDE_SESSION,
} from "../../../scripts/kiro-repo-guidance-setup/compatibility.ts";
import { assessApprovalBoundaryOperation } from "../../../scripts/kiro-repo-guidance-setup/scope.ts";
import { validateOwnerDecisions } from "../../../scripts/kiro-repo-guidance-setup/owner-decisions.ts";
import { assessRepositoryPolicy } from "../../../scripts/kiro-repo-guidance-setup/policy.ts";
import {
  OWNER_DECISION_IDS,
  OWNER_DECISIONS,
  REQUIRED_SURFACE_VERSIONS,
  type ApprovalBoundary,
  type CompatibilityInput,
  type ConfigurationScope,
  type KiroSurface,
  type OwnerDecision,
  type OwnerDecisionId,
  type ScopeInput,
  type ScopeRecord,
  type SurfaceVersion,
  type ValidationRun,
} from "../../../scripts/kiro-repo-guidance-setup/contracts.ts";

// --- helpers -----------------------------------------------------------------

function compatibilityInput(overrides: Partial<CompatibilityInput> = {}): CompatibilityInput {
  return {
    records: [],
    validationRuns: [],
    requestedSurfaces: [...REQUIRED_SURFACE_VERSIONS],
    ...overrides,
  };
}

function passingRun(
  validationId: string,
  surface: KiroSurface,
  version: string,
  overrides: Partial<ValidationRun> = {},
): ValidationRun {
  return {
    validationId,
    action: "validate compatibility target",
    repositoryRootOrActiveSurface: surface === "Local_Repository_Surface" ? "D:\\23082026" : surface,
    surface,
    version,
    scope: "repository-local compatibility artifact",
    executionLayer: "surface_validation",
    startedAtUtc: "2026-08-25T12:00:00Z",
    result: "pass",
    commandOrInteraction: "bounded target validation",
    exitCodeOrOutcome: "exit 0",
    evidenceRefs: [validationId],
    unverifiedItems: [],
    blocker: "none",
    ...overrides,
  };
}

function scopeRecord(scope: ConfigurationScope, overrides: Partial<ScopeRecord> = {}): ScopeRecord {
  return {
    scope,
    surface: "Local_Repository_Surface",
    pathOrService: `.kiro/${scope}`,
    applicability: "applicable",
    access: "read",
    actions: ["record scope"],
    documentedPrecedence: [...DOCUMENTED_SCOPE_ORDER],
    observedPrecedence: [...DOCUMENTED_SCOPE_ORDER],
    denyOverridesAllow: "observed",
    evidenceRefs: [`evidence:${scope}`],
    rollbackPathRef: `rollback:${scope}`,
    ...overrides,
  };
}

function scopeInput(overrides: Partial<ScopeInput> = {}): ScopeInput {
  return {
    records: DOCUMENTED_SCOPE_ORDER.map((scope) => scopeRecord(scope)),
    generatedAtUtc: "2026-08-25T12:00:00Z",
    ...overrides,
  };
}

function approvedBoundary(overrides: Partial<ApprovalBoundary> = {}): ApprovalBoundary {
  return {
    boundaryId: "boundary-example",
    scope: "workspace_root_permission",
    requestedChange: "Record a bounded permission probe on the workspace-root scope.",
    targetSurface: "IDE",
    owner: "repository owner",
    approvalStatus: "approved",
    approvalDate: "2026-08-25",
    preChangeStateRef: "snapshot:before-change",
    securityBoundary: "Repository-local scope; no credentials or project data are included.",
    expectedSideEffects: ["No side effect until validation and explicit approval."],
    rollbackPathRef: "rollback:restore-snapshot",
    ...overrides,
  };
}

function target(surface: KiroSurface): SurfaceVersion {
  const found = REQUIRED_SURFACE_VERSIONS.find((entry) => entry.surface === surface);
  if (!found) throw new Error(`${surface} is missing from the frozen contract`);
  return found;
}

function compliantPolicyRequest() {
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

// --- CompatibilityMatrix examples & edges -----------------------------------

describe("CompatibilityMatrix — example and edge cases", () => {
  it("produces exactly seven records for each of the fixed surface/version targets", () => {
    const result = compatibilityMatrix.assess(compatibilityInput());

    expect(result.output?.records).toHaveLength(7);
    expect(result.output?.records.map((record) => record.surface)).toEqual([
      "IDE",
      "CLI 2.x",
      "CLI 3.x",
      "Web",
      "Mobile",
      "Cloud/Crew",
      "Local_Repository_Surface",
    ]);
    // Duplicate surface entries never appear despite there being seven records.
    const surfaces = result.output?.records.map((record) => record.surface) ?? [];
    expect(new Set(surfaces).size).toBe(7);
  });

  it("fails closed on an empty requested-surface list without inventing evidence", () => {
    const result = assessCompatibility(compatibilityInput({ requestedSurfaces: [] }));

    expect(result.status).toBe("partial");
    expect(result.output?.records).toHaveLength(7);
    expect(result.blockers).toContain("at least one requested surface/version target is required");
    // Nothing becomes applicable without an exact-target run.
    expect(result.output?.records.every((record) => record.status === "Unverified")).toBe(true);
  });

  it("does not let the CLI 2.19.1 observation validate CLI 3.x, IDE, Web, Mobile, or Cloud/Crew", () => {
    const result = assessCompatibility(
      compatibilityInput({
        validationRuns: [passingRun("run-cli-2", "CLI 2.x", "2.19.1")],
      }),
    );

    const records = result.output?.records ?? [];
    const cli2 = records.find((record) => record.surface === "CLI 2.x");
    expect(cli2?.status).toBe("applicable");
    expect(cli2?.observedBehavior).toContain(OBSERVED_CLI_2_VERSION);

    for (const surface of ["CLI 3.x", "IDE", "Web", "Mobile", "Cloud/Crew"] as const) {
      const record = records.find((entry) => entry.surface === surface);
      expect(record?.status).toBe("Unverified");
      expect(record?.validationRunRefs).toEqual([]);
      expect(record?.observedBehavior).not.toContain(OBSERVED_CLI_2_VERSION);
    }
  });

  it("keeps Web and Mobile Unverified and records their non-applicability of global config and hooks", () => {
    const result = assessCompatibility(compatibilityInput());
    const records = result.output?.records ?? [];

    for (const surface of ["Web", "Mobile"] as const) {
      const record = records.find((entry) => entry.surface === surface);
      expect(record?.status).toBe("Unverified");
      expect(record?.enablementStatus).toBe("blocked");
      // No global-config or hook support is claimed for Web/Mobile.
      expect(
        record?.unsupportedClaims.some((claim) => /global configuration and hook/i.test(claim)),
      ).toBe(true);
      // No observed evidence was transferred from the IDE/CLI observations.
      expect(record?.observedBehavior).not.toContain(OBSERVED_IDE_SESSION);
      expect(record?.observedBehavior).not.toContain(OBSERVED_CLI_2_VERSION);
    }
  });

  it("keeps Cloud/Crew deferred and blocks a Crew run even with a fresh passing exact-target run", () => {
    const result = assessCompatibility(
      compatibilityInput({
        validationRuns: [passingRun("run-crew", "Cloud/Crew", "current")],
      }),
    );

    const crew = result.output?.records.find((record) => record.surface === "Cloud/Crew");
    expect(crew?.enablementStatus).toBe("deferred");
    // Even a fresh passing run does not make Cloud/Crew applicable — it is deferred.
    expect(crew?.status).toBe("Unverified");
    expect(
      crew?.unsupportedClaims.some((claim) => /Crew worktrees|OD-04 implementation wave/i.test(claim)),
    ).toBe(true);
  });

  it("records a transfer violation and does not consume a duplicate compatibility record", () => {
    const cli2 = target("CLI 2.x");
    const duplicateRecord = {
      ...cli2,
      status: "applicable",
      documentedBehavior: [],
      observedBehavior: [],
      evidenceFreshness: "fresh",
      versionSensitiveClaim: true,
      validationAction: "validate",
      validationRunRefs: [],
      enablementStatus: "enabled-valid",
      unsupportedClaims: [],
      migrationConstraints: [],
      rollbackPathRef: "rollback:dup",
    };

    const result = assessCompatibility(
      compatibilityInput({
        records: [duplicateRecord, duplicateRecord] as unknown as CompatibilityInput["records"],
      }),
    );

    expect(result.status).toBe("partial");
    expect(
      result.output?.transferViolations.some((value) => value.includes("duplicate compatibility records")),
    ).toBe(true);
  });

  it("rejects an unknown surface/version target in requestedSurfaces", () => {
    const result = assessCompatibility(
      compatibilityInput({
        requestedSurfaces: [
          { surface: "Nonexistent", version: "9.x" },
        ] as unknown as CompatibilityInput["requestedSurfaces"],
      }),
    );

    expect(result.status).toBe("partial");
    expect(result.blockers).toContain("requestedSurfaces contains an unknown surface/version target");
  });
});

// --- ScopePrecedenceMapper edges --------------------------------------------

describe("ScopePrecedenceMapper — example and edge cases", () => {
  it("fails closed on an empty record set by reporting every required scope missing", () => {
    const result = assessScopePrecedence(scopeInput({ records: [] }));

    expect(result.status).toBe("partial");
    for (const scope of DOCUMENTED_SCOPE_ORDER) {
      expect(result.blockers).toContain(`required configuration scope ${scope} is missing`);
    }
    expect(result.output?.map.records).toHaveLength(0);
  });

  it("blocks a scope missing its documented precedence without inferring an order", () => {
    const records = DOCUMENTED_SCOPE_ORDER.map((scope) =>
      scopeRecord(scope, scope === "agent" ? { documentedPrecedence: [] } : {}),
    );

    const result = assessScopePrecedence(scopeInput({ records }));

    expect(result.status).toBe("partial");
    expect(result.blockers).toContain("agent has no documented precedence evidence");
    expect(result.output?.map.unresolved).toContain("evidence:agent");
  });

  it("treats a contradicted deny-overrides-allow flag as a blocker, not an allow", () => {
    const records = DOCUMENTED_SCOPE_ORDER.map((scope) =>
      scopeRecord(scope, scope === "workspace_root_permission" ? { denyOverridesAllow: "contradicted" } : {}),
    );

    const result = assessScopePrecedence(scopeInput({ records }));

    expect(result.status).toBe("partial");
    expect(
      result.blockers.some((blocker) =>
        blocker.includes("workspace_root_permission deny-overrides-allow is contradicted"),
      ),
    ).toBe(true);
  });
});

// --- Approval boundaries edges ----------------------------------------------

describe("approval-boundary records — example and edge cases", () => {
  it("blocks a rejected boundary and preserves prior state", () => {
    const result = assessApprovalBoundaryOperation({
      boundary: approvedBoundary({ approvalStatus: "rejected", approvalDate: undefined }),
    });

    expect(result.status).toBe("blocked");
    expect(result.output?.canProceed).toBe(false);
    expect(result.output?.preservedPriorState).toBe(true);
    expect(result.blockers).toContain("approval boundary is rejected and blocks the operation");
  });

  it("blocks an expired boundary without mutation", () => {
    const result = assessApprovalBoundaryOperation({
      boundary: approvedBoundary({ approvalStatus: "expired", approvalDate: undefined }),
    });

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain("approval boundary is expired and blocks the operation");
  });

  it("blocks an approved boundary that is missing its ISO approval date", () => {
    const result = assessApprovalBoundaryOperation({
      boundary: approvedBoundary({ approvalDate: undefined }),
    });

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain("an approved approval boundary requires an ISO approval date");
  });

  it("flags a duplicate permission probe id", () => {
    const probe = {
      probeId: "probe-dup",
      surface: "IDE" as const,
      action: "Record a bounded probe outcome without executing the protected operation.",
      outcome: "allowed" as const,
      evidenceRef: "evidence:probe-dup",
    };
    const result = assessApprovalBoundaryOperation({
      boundary: approvedBoundary(),
      permissionProbes: [probe, probe],
    });

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain("permission probe probe-dup is duplicated");
  });
});

// --- Owner decisions: every unresolved fallback ------------------------------

describe("owner-decision validation — unresolved fallbacks (OD-01..OD-10)", () => {
  const expectedFallbacks: Readonly<Record<OwnerDecisionId, string>> = {
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

  it("validates exactly OD-01 through OD-10 with no more and no fewer", () => {
    const result = validateOwnerDecisions(OWNER_DECISIONS);

    expect(result.status).toBe("pass");
    expect(result.output?.decisions.map((decision) => decision.decisionId)).toEqual([
      ...OWNER_DECISION_IDS,
    ]);
    expect(result.output?.unresolvedDecisionIds).toEqual([]);
    expect(result.output?.safeFallbacks).toEqual([]);
  });

  for (const decisionId of OWNER_DECISION_IDS) {
    it(`emits the fail-closed fallback when ${decisionId} is unresolved`, () => {
      const decisions = OWNER_DECISIONS.map((decision) =>
        decision.decisionId === decisionId
          ? ({ ...decision, unresolvedStatus: "unresolved", approvalStatus: "pending" } as OwnerDecision)
          : decision,
      );

      const result = validateOwnerDecisions(decisions);

      // The ledger is still structurally valid — being unresolved is not a blocker.
      expect(result.status).toBe("pass");
      expect(result.output?.unresolvedDecisionIds).toContain(decisionId);
      expect(result.output?.safeFallbacks).toContain(expectedFallbacks[decisionId]);
    });
  }

  it("blocks a decision id outside OD-01..OD-10", () => {
    const decisions = [
      ...OWNER_DECISIONS.slice(1),
      { ...OWNER_DECISIONS[0], decisionId: "OD-11" } as unknown as OwnerDecision,
    ];

    const result = validateOwnerDecisions(decisions);

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain("owner decision OD-11 is not one of OD-01 through OD-10");
  });

  it("blocks a decision that abandons the enable-after-validation policy", () => {
    const decisions = OWNER_DECISIONS.map((decision) =>
      decision.decisionId === "OD-05"
        ? ({ ...decision, selectedPolicy: "enable immediately" } as unknown as OwnerDecision)
        : decision,
    );

    const result = validateOwnerDecisions(decisions);

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain("OD-05 must preserve the enable after validation policy");
  });
});

// --- RepositoryPolicyGuard: agent-count boundaries & preserved general rule ---

describe("RepositoryPolicyGuard — agent-count boundaries and preserved defaults", () => {
  it("rejects a fifth active agent even for the exact OD-04 feature wave (out-of-range value)", () => {
    const result = assessRepositoryPolicy(
      {
        ...compliantPolicyRequest(),
        featureWaveRequested: true,
        featureName: "kiro-repo-guidance-setup",
        activeAgentCount: 5,
      },
      OWNER_DECISIONS,
    );

    expect(result.status).toBe("blocked");
    expect(result.output?.preservedPriorState).toBe(true);
    expect(result.blockers).toContain(
      "the feature-only OD-04 wave permits no more than four active Implementation_Agents",
    );
  });

  it("accepts exactly four active agents on the OD-04 feature wave (upper boundary)", () => {
    const result = assessRepositoryPolicy(
      {
        ...compliantPolicyRequest(),
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

  it("preserves the general one-agent rule off the feature wave and rejects a second agent", () => {
    const result = assessRepositoryPolicy(
      {
        ...compliantPolicyRequest(),
        activeAgentCount: 2,
      },
      OWNER_DECISIONS,
    );

    expect(result.status).toBe("blocked");
    expect(result.output?.od04ExceptionApplied).toBe(false);
    expect(result.output?.generalRepositoryRulePreserved).toBe(true);
    expect(result.blockers).toContain("the general repository rule permits no more than one active agent");
  });

  it("rejects a negative active-agent count (out-of-range value)", () => {
    const result = assessRepositoryPolicy(
      {
        ...compliantPolicyRequest(),
        activeAgentCount: -1,
      },
      OWNER_DECISIONS,
    );

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain("the general repository rule permits no more than one active agent");
  });

  it("allows a zero-agent plan under the general default without applying the OD-04 exception", () => {
    const result = assessRepositoryPolicy(
      {
        ...compliantPolicyRequest(),
        activeAgentCount: 0,
      },
      OWNER_DECISIONS,
    );

    expect(result.status).toBe("pass");
    expect(result.output?.od04ExceptionApplied).toBe(false);
    expect(result.output?.generalRepositoryRulePreserved).toBe(true);
  });

  it("blocks a Crew execution request from borrowing the OD-04 exception", () => {
    const result = assessRepositoryPolicy(
      {
        ...compliantPolicyRequest(),
        featureWaveRequested: true,
        featureName: "kiro-repo-guidance-setup",
        activeAgentCount: 2,
        crewExecutionRequested: true,
      },
      OWNER_DECISIONS,
    );

    expect(result.status).toBe("blocked");
    expect(result.output?.generalRepositoryRulePreserved).toBe(true);
    expect(result.blockers).toContain("Crew execution cannot use the feature-only OD-04 exception");
  });

  it("blocks the OD-04 wave when OD-04 is unresolved, keeping the default rule intact", () => {
    const decisions = OWNER_DECISIONS.map((decision) =>
      decision.decisionId === "OD-04"
        ? ({ ...decision, unresolvedStatus: "unresolved", approvalStatus: "pending" } as OwnerDecision)
        : decision,
    );

    const result = assessRepositoryPolicy(
      {
        ...compliantPolicyRequest(),
        featureWaveRequested: true,
        featureName: "kiro-repo-guidance-setup",
        activeAgentCount: 3,
      },
      decisions,
    );

    expect(result.status).toBe("blocked");
    expect(result.output?.generalRepositoryRulePreserved).toBe(true);
    expect(result.blockers).toContain(
      "OD-04 must be approved and resolved before the feature wave can use more than one agent",
    );
  });
});
