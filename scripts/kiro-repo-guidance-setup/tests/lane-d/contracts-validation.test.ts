import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAX_ACTIVE_AGENTS,
  DEFAULT_TASK_CONCURRENCY_VALUES,
  FEATURE_NAME,
  FEATURE_WAVE_MAX_ACTIVE_AGENTS,
  PACKAGE_MANAGER,
  REPOSITORY_ROOT,
  REVIEWER_ITERATION_CEILING,
  REVIEWER_MAXIMUM_CONCURRENCY,
  REVIEWER_ORDER,
  VALIDATION_RESULTS,
  type ConcurrentImplementationWaveRecord,
  type ImplementationAgentDeclaration,
  type ValidationRequest,
  type ValidationResult,
} from "../../contracts.ts";
import { LANE_OWNERSHIP_DECLARATIONS, validateOwnership } from "../../ownership.ts";
import { waveManifest } from "../../wave-manifest.ts";
import {
  adaptValidationGate,
  createDefaultGateRequest,
  ValidationRunnerService,
  VALIDATION_GATE_KINDS,
  type ValidationExecutionResult,
} from "../../validation.ts";
import { preflightWave } from "../../wave-guard.ts";

const ROOT = REPOSITORY_ROOT;
const STARTED_AT = "2026-08-25T12:34:56.000Z";

function createWave(
  overrides: Partial<ConcurrentImplementationWaveRecord> = {},
): ConcurrentImplementationWaveRecord {
  return {
    waveId: "wave-contracts-validation-test",
    featureName: FEATURE_NAME,
    scope: "feature_only",
    maxActiveAgents: FEATURE_WAVE_MAX_ACTIVE_AGENTS,
    activeAgentCount: 0,
    implementationAgents: LANE_OWNERSHIP_DECLARATIONS,
    declaredFileOwnership: LANE_OWNERSHIP_DECLARATIONS.flatMap((agent) => agent.writeScope.writePaths),
    declaredSharedOutputOwnership: "none",
    readWriteScopes: LANE_OWNERSHIP_DECLARATIONS.flatMap((agent) => [agent.readScope, agent.writeScope]),
    fileOwnershipReservations: [],
    sharedContractFreezeRef: "freeze-contracts-validation-test",
    rootWorkingDirectory: ROOT,
    packageManager: PACKAGE_MANAGER,
    worktrees: "prohibited",
    hiddenSpawning: "prohibited",
    automaticRetries: "prohibited",
    automaticReplans: "prohibited",
    approvalBoundaryRefs: ["approval-boundary:OD-04"],
    conflictPolicy: "stop_affected_agent_or_wave_fail_closed",
    integrationValidationGateRef: "integration-gate-contracts-validation-test",
    status: "pending",
    rollbackPath: "release reservations and restore pre-wave snapshots",
    validationRunRefs: [],
    ...overrides,
  };
}

function createValidationRequest(overrides: Partial<ValidationRequest> = {}): ValidationRequest {
  return {
    action: "artifact",
    repositoryRootOrActiveSurface: ROOT,
    surface: "Local_Repository_Surface",
    version: "repository",
    scope: "tests/kiro-repo-guidance-setup/lane-d/contracts-validation.test.ts",
    executionLayer: "default_native_task",
    commandOrInteraction: "pnpm exec vitest run --config tests/vitest.config.ts",
    ...overrides,
  };
}

function createRunner(
  execution: ValidationExecutionResult,
): ValidationRunnerService {
  return new ValidationRunnerService({
    now: () => new Date(STARTED_AT),
    createValidationId: () => "validation-contracts-validation-test",
    execute: () => execution,
  });
}

describe("Lane D execution contracts", () => {
  it("keeps default/native concurrency at zero or one and reserves the four-agent exception for this feature wave", () => {
    expect(DEFAULT_TASK_CONCURRENCY_VALUES).toEqual([0, 1]);
    expect(DEFAULT_MAX_ACTIVE_AGENTS).toBe(1);
    expect(waveManifest.concurrency.defaultRepositoryMaximumActiveAgents).toBe(1);
    expect(waveManifest.concurrency.featureWaveMaximumActiveAgents).toBe(4);
    expect(waveManifest.concurrency.featureWaveScope).toBe("feature-only");
    expect(waveManifest.rootExecution.packageManager).toBe("pnpm");
    expect(waveManifest.rootExecution.workingDirectory).toBe(ROOT);
  });

  it("allows an idle zero-agent wave to be inspected without a freeze, while preserving the four-agent ceiling", () => {
    const result = preflightWave({
      wave: createWave({ activeAgentCount: 0, maxActiveAgents: FEATURE_WAVE_MAX_ACTIVE_AGENTS }),
      execution: { repositoryRoot: ROOT, packageManager: PACKAGE_MANAGER },
    });

    expect(result.status).toBe("pass");
    expect(result.output).toMatchObject({
      allowed: true,
      sharedContractFreezeValidated: false,
      preservedPriorState: true,
    });
    expect(result.output?.wave.maxActiveAgents).toBe(FEATURE_WAVE_MAX_ACTIVE_AGENTS);
  });

  it("records ownership conflicts instead of resolving duplicate lanes or shared generated output", () => {
    const duplicateDeclarations = [
      ...LANE_OWNERSHIP_DECLARATIONS,
      LANE_OWNERSHIP_DECLARATIONS[0],
    ];
    const duplicate = validateOwnership({ declarations: duplicateDeclarations });

    expect(duplicate.status).toBe("blocked");
    expect(duplicate.blockers.some((blocker) => blocker.includes("declared more than once"))).toBe(true);
    expect(duplicate.output?.valid).toBe(false);

    const sharedOutputDeclarations: readonly ImplementationAgentDeclaration[] =
      LANE_OWNERSHIP_DECLARATIONS.map((agent, index) =>
        index === 0
          ? { ...agent, sharedGeneratedOutputOwnership: "named_disjoint_outputs" as const }
          : agent,
      );
    const sharedOutput = validateOwnership({ declarations: sharedOutputDeclarations });

    expect(sharedOutput.status).toBe("blocked");
    expect(sharedOutput.blockers.some((blocker) => blocker.includes("shared generated output"))).toBe(true);
    expect(sharedOutput.output?.sharedGeneratedOutputOwnership).toBe("none");
  });

  it("rejects automatic retry and replan requests without changing the wave contract", () => {
    const invalidWave = {
      ...createWave(),
      automaticRetries: "allowed",
      automaticReplans: "allowed",
    } as unknown as ConcurrentImplementationWaveRecord;
    const result = preflightWave({ wave: invalidWave });

    expect(result.status).toBe("blocked");
    expect(result.output?.allowed).toBe(false);
    expect(result.output?.preservedPriorState).toBe(true);
    expect(result.blockers.some((blocker) => blocker.includes("automatic retries"))).toBe(true);
    expect(result.blockers.some((blocker) => blocker.includes("automatic replans"))).toBe(true);
    expect(result.output?.wave.automaticRetries).toBe("allowed");
    expect(result.output?.wave.automaticReplans).toBe("allowed");
  });

  it("keeps the reviewer contract sequential, read-only, and bounded", () => {
    expect(REVIEWER_ORDER).toEqual([
      "EvidenceCompatibilityReviewer",
      "SafetyRollbackReviewer",
    ]);
    expect(REVIEWER_MAXIMUM_CONCURRENCY).toBe(1);
    expect(REVIEWER_ITERATION_CEILING).toBe(3);
  });
});

describe("typed validation gate adapters", () => {
  it("maps every typed gate kind to its matching validation action", () => {
    for (const gate of VALIDATION_GATE_KINDS) {
      const request = adaptValidationGate({
        gate,
        repositoryRootOrActiveSurface: ROOT,
        surface: "Local_Repository_Surface",
        version: "repository",
        scope: `scope/${gate}`,
        executionLayer: "default_native_task",
        commandOrInteraction: `run ${gate}`,
      });

      expect(request.action).toBe(gate);
      expect(request).not.toHaveProperty("gate");
      expect(request.scope).toBe(`scope/${gate}`);
    }
  });

  it("selects the execution layer from the typed gate when the caller omits it", () => {
    const security = createDefaultGateRequest({
      gate: "security",
      repositoryRootOrActiveSurface: "IDE",
      surface: "IDE",
      version: "current",
      scope: "security-boundary",
      commandOrInteraction: "inspect approval boundary",
    });
    const repository = createDefaultGateRequest({
      gate: "repository",
      repositoryRootOrActiveSurface: ROOT,
      surface: "Local_Repository_Surface",
      version: "repository",
      scope: "repository-policy",
      commandOrInteraction: "inspect repository policy",
    });

    expect(security.action).toBe("security");
    expect(security.executionLayer).toBe("surface_validation");
    expect(repository.action).toBe("repository");
    expect(repository.executionLayer).toBe("default_native_task");
  });
});

describe("ValidationRunnerService controlled outcomes", () => {
  it.each([
    ["failed", "fail" as const, "exit 1", false],
    ["partial", "partial" as const, "partial output", false],
    ["interrupted", "pass" as const, "terminated", true],
  ] as const)("records a %s outcome and never upgrades it to PASS", (_name, executionResult, outcome, interrupted) => {
    const result = createRunner({
      result: executionResult,
      exitCodeOrOutcome: outcome,
      evidenceRefs: ["evidence:controlled-validation"],
      ...(interrupted ? { interrupted: true } : {}),
    }).run(createValidationRequest());

    expect(result.status).toBe(executionResult === "pass" ? "partial" : executionResult);
    expect(result.output?.result).toBe(executionResult === "pass" ? "partial" : executionResult);
    expect(result.output?.blocker).not.toBe("none");
    expect(result.output?.evidenceRefs).toContain("validation:validation-contracts-validation-test");
  });

  it("derives a failed two-lane result from either lane and keeps both lane records", () => {
    const result = createRunner({
      result: "pass",
      exitCodeOrOutcome: "exit 0",
      laneResults: {
        defaultVitest: { result: "pass", total: 10, failed: 0, evidenceRef: "evidence:default" },
        techDocsVitest: { result: "fail", total: 4, failed: 1, evidenceRef: "evidence:tech-docs" },
      },
    }).run(createValidationRequest({ action: "two-lane test", commandOrInteraction: "pnpm run test" }));

    expect(result.status).toBe("fail");
    expect(result.output?.result).toBe("fail");
    expect(result.output?.laneResults?.defaultVitest?.result).toBe("pass");
    expect(result.output?.laneResults?.techDocsVitest?.result).toBe("fail");
    expect(result.output?.blocker).toContain("at least one Vitest lane did not pass");
    expect(VALIDATION_RESULTS).toContain(result.output?.result as ValidationResult);
  });
});
