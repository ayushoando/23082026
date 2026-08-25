import { describe, expect, it } from "vitest";

import {
  adaptValidationGate,
  createDefaultGateRequest,
  ValidationRunnerService,
  VALIDATION_GATE_KINDS,
  type ValidationExecutionRequest,
  type ValidationExecutionResult,
  type ValidationGateKind,
} from "../../../scripts/kiro-repo-guidance-setup/validation.ts";
import type { ValidationRequest, VitestLaneResults } from "../../../scripts/kiro-repo-guidance-setup/contracts.ts";

const ROOT = "D:\\23082026";
const STARTED_AT = "2026-08-25T12:34:56.000Z";

function createRequest(
  overrides: Partial<ValidationRequest> = {},
  gate: ValidationGateKind = "artifact",
): ValidationRequest {
  return createDefaultGateRequest({
    gate,
    repositoryRootOrActiveSurface: ROOT,
    surface: "Local_Repository_Surface",
    version: "repository",
    scope: "scripts/kiro-repo-guidance-setup/validation.ts",
    executionLayer: "default_native_task",
    commandOrInteraction: "pnpm exec vitest run --config tests/vitest.config.ts tests/kiro-repo-guidance-setup/lane-d/validation.test.ts",
    ...overrides,
  });
}

function passingExecution(
  overrides: Partial<ValidationExecutionResult> = {},
): ValidationExecutionResult {
  return {
    result: "pass",
    exitCodeOrOutcome: "exit 0",
    evidenceRefs: ["evidence:validation-test"],
    ...overrides,
  };
}

function createRunner(
  execution: ValidationExecutionResult | ((input: ValidationExecutionRequest) => ValidationExecutionResult),
): ValidationRunnerService {
  return new ValidationRunnerService({
    now: () => new Date(STARTED_AT),
    createValidationId: () => "validation-lane-d-test",
    execute: typeof execution === "function" ? execution : () => execution,
  });
}

describe("typed validation gate adapters", () => {
  it("exposes exactly the ten validation gate kinds", () => {
    expect(VALIDATION_GATE_KINDS).toEqual([
      "artifact",
      "repository",
      "focused",
      "fast",
      "two-lane test",
      "ship",
      "surface",
      "security",
      "rollback",
      "handover",
    ]);
  });

  it("maps a typed gate to its action without leaking the adapter discriminator", () => {
    const request = adaptValidationGate({
      gate: "surface",
      repositoryRootOrActiveSurface: "IDE",
      surface: "IDE",
      version: "current",
      scope: ".kiro/skills",
      executionLayer: "surface_validation",
      commandOrInteraction: "open the repository guidance in the selected IDE surface",
    });

    expect(request.action).toBe("surface");
    expect(request).not.toHaveProperty("gate");
    expect(request.executionLayer).toBe("surface_validation");
  });
});

describe("ValidationRunnerService", () => {
  it("records a clean UTC run with evidence and blocker none", () => {
    const runner = createRunner(passingExecution());
    const result = runner.run(createRequest());

    expect(result.status).toBe("pass");
    if (result.status !== "pass") return;

    expect(result.output).toMatchObject({
      validationId: "validation-lane-d-test",
      action: "artifact",
      repositoryRootOrActiveSurface: ROOT,
      surface: "Local_Repository_Surface",
      scope: "scripts/kiro-repo-guidance-setup/validation.ts",
      startedAtUtc: STARTED_AT,
      result: "pass",
      exitCodeOrOutcome: "exit 0",
      blocker: "none",
    });
    expect(result.output.evidenceRefs).toEqual([
      "validation:validation-lane-d-test",
      "evidence:validation-test",
    ]);
  });

  it("records each Vitest lane and blocks an incomplete two-lane result", () => {
    const laneResults: VitestLaneResults = {
      defaultVitest: { result: "pass", total: 12, failed: 0, evidenceRef: "evidence:default" },
      techDocsVitest: { result: "pass", total: 4, failed: 0, evidenceRef: "evidence:tech-docs" },
    };
    const runner = createRunner(passingExecution({ laneResults }));
    const complete = runner.run(
      createRequest({ commandOrInteraction: "pnpm run test" }, "two-lane test"),
    );

    expect(complete.status).toBe("pass");
    if (complete.status === "pass") {
      expect(complete.output.laneResults).toEqual(laneResults);
      expect(complete.output.blocker).toBe("none");
    }

    const incomplete = createRunner(passingExecution()).run(
      createRequest({ commandOrInteraction: "pnpm run test" }, "two-lane test"),
    );
    expect(incomplete.status).toBe("blocked");
    expect(incomplete.output?.result).toBe("blocked");
    expect(incomplete.output?.blocker).toContain("two-lane test is incomplete");
  });

  it("never reports an interrupted executor as PASS", () => {
    const result = createRunner(
      passingExecution({ interrupted: true, exitCodeOrOutcome: "terminated" }),
    ).run(createRequest());

    expect(result.status).toBe("partial");
    expect(result.output?.result).toBe("partial");
    expect(result.output?.blocker).toContain("interrupted");
  });

  it("preserves a failed gate result and identifies the failure", () => {
    const result = createRunner(
      passingExecution({ result: "fail", exitCodeOrOutcome: "exit 1" }),
    ).run(createRequest({}, "focused"));

    expect(result.status).toBe("fail");
    expect(result.output?.result).toBe("fail");
    expect(result.output?.blocker).toContain("validation command failed");
  });

  it("blocks malformed root requests before invoking the executor", () => {
    let invoked = false;
    const runner = createRunner(() => {
      invoked = true;
      return passingExecution();
    });
    const result = runner.run(createRequest({ repositoryRootOrActiveSurface: "D:\\other-repository" }));

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain(`validation must run from repository root ${ROOT}`);
    expect(invoked).toBe(false);
  });

  it("records an executor interruption as partial with a limitation", () => {
    const runner = new ValidationRunnerService({
      now: () => new Date(STARTED_AT),
      createValidationId: () => "validation-thrown-test",
      execute: () => {
        throw new Error("process terminated");
      },
    });
    const result = runner.run(createRequest({ action: "repository" }));

    expect(result.status).toBe("partial");
    expect(result.output?.result).toBe("partial");
    expect(result.output?.limitation).toContain("complete result");
  });
});
