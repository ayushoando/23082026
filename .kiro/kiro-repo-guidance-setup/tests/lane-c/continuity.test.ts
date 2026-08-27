// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  CONTINUITY_CAPABILITY_KINDS,
  CREW_INCOMPATIBLE_BEHAVIORS,
  ContinuityEvaluator,
  GRAPH_IMPACT_MAX_ITERATIONS,
  LTM_CAPTURE_COMMAND,
  evaluateContinuity,
  type ContinuityCapabilityKind,
} from "../../continuity.ts";
import {
  OWNER_DECISIONS,
  type OwnerDecision,
  type ValidationRun,
} from "../../contracts.ts";

const repositoryRoot = "D:\\23082026";

function recordFor(kind: ContinuityCapabilityKind, input = {}) {
  const result = evaluateContinuity({ repositoryRoot, ...input });
  return result.output?.records.find((record) => record.kind === kind);
}

function surfaceValidationRun(validationId: string): ValidationRun {
  return {
    validationId,
    action: "fresh surface validation",
    repositoryRootOrActiveSurface: "Local_Repository_Surface",
    surface: "Local_Repository_Surface",
    version: "repository",
    scope: "continuity capability",
    executionLayer: "surface_validation",
    startedAtUtc: "2026-08-25T00:00:00Z",
    result: "pass",
    commandOrInteraction: "surface probe",
    exitCodeOrOutcome: "pass",
    evidenceRefs: [],
    unverifiedItems: [],
    blocker: "none",
  };
}

describe("ContinuityEvaluator", () => {
  it("always emits the six continuity families as separate records", () => {
    const result = evaluateContinuity({ repositoryRoot });
    const kinds = (result.output?.continuityRecords ?? []).map((record) => record.kind);
    for (const kind of CONTINUITY_CAPABILITY_KINDS) {
      expect(kinds).toContain(kind);
    }
    // Each continuity family carries its own data boundary — never merged.
    const boundaries = new Set(result.output?.continuityRecords.map((record) => record.dataBoundary));
    expect(boundaries.size).toBe(CONTINUITY_CAPABILITY_KINDS.length);
  });

  it("keeps local, CLI-session, and Crew evidence isolated by data boundary", () => {
    const compaction = recordFor("local_compaction");
    const cli = recordFor("cli_session_persistence");
    const crewMemory = recordFor("crew_memory");

    expect(compaction?.dataBoundary).toBe("local_session");
    expect(cli?.dataBoundary).toBe("cli_version_session_store");
    expect(crewMemory?.dataBoundary).toBe("cloud_crew_memory");

    // Crew memory is a Cloud surface only; local compaction never claims Cloud.
    expect(crewMemory?.surfaces).toEqual(["Cloud/Crew"]);
    expect(compaction?.surfaces).not.toContain("Cloud/Crew");
  });

  it("keeps LTM disabled while the capture command is a stub", () => {
    const ltm = recordFor("ltm_capture");
    expect(ltm?.disposition).toBe("disable");
    expect(ltm?.status).toBe("disabled");
    expect(ltm?.evidenceState).toBe("Unverified");
    expect(ltm?.blockers.join(" ")).toContain(LTM_CAPTURE_COMMAND);
    expect(ltm?.knownGapRefs.length).toBeGreaterThan(0);
  });

  it("does not enable LTM even when the stub is claimed removed without a fresh run", () => {
    const result = evaluateContinuity({
      repositoryRoot,
      capabilities: [{ kind: "ltm_capture", captureCommandIsStub: false }],
    });
    const ltm = result.output?.records.find((record) => record.kind === "ltm_capture");
    expect(ltm?.disposition).toBe("disable");
    expect(ltm?.blockers.some((blocker) => blocker.includes("fresh execution Validation_Run"))).toBe(true);
  });

  it("does not treat Crew memory/knowledge documentation as LTM execution evidence", () => {
    const result = evaluateContinuity({
      repositoryRoot,
      capabilities: [
        { kind: "crew_memory", documentedBehavior: ["Crew memory persists knowledge"] },
        { kind: "ltm_capture" },
      ],
    });
    const ltm = result.output?.records.find((record) => record.kind === "ltm_capture");
    const crew = result.output?.records.find((record) => record.kind === "crew_memory");
    expect(ltm?.disposition).toBe("disable");
    // The Crew record stays on its own Cloud boundary and cannot cross into local capture.
    expect(crew?.dataBoundary).toBe("cloud_crew_memory");
    expect(ltm?.dataBoundary).toBe("local_repository_capture");
  });

  it("preserves the manual graph-impact loop and caps automation at three iterations", () => {
    const graph = recordFor("graph_impact_automation", {
      capabilities: [{ kind: "graph_impact_automation" }],
    });
    expect(graph?.manualFallback).toContain("manual graph-impact loop");
    expect(graph?.iterationCeiling).toBeLessThanOrEqual(GRAPH_IMPACT_MAX_ITERATIONS);

    const overreach = evaluateContinuity({
      repositoryRoot,
      ownerDecisions: [...OWNER_DECISIONS],
      capabilities: [{ kind: "graph_impact_automation", proposedIterations: 7, validationRunRefs: ["validation:graph"] }],
    });
    const record = overreach.output?.records.find((r) => r.kind === "graph_impact_automation");
    expect(record?.iterationCeiling).toBe(3);
    expect(overreach.output?.policyViolations.join(" ")).toContain("exceeds the ceiling of three");
  });

  it("defers graph-impact automation when OD-03 is unresolved", () => {
    const unresolvedOd03: OwnerDecision[] = OWNER_DECISIONS.map((decision) =>
      decision.decisionId === "OD-03" ? { ...decision, unresolvedStatus: "unresolved" } : decision,
    );
    const result = evaluateContinuity({
      repositoryRoot,
      ownerDecisions: unresolvedOd03,
      capabilities: [{ kind: "graph_impact_automation", validationRunRefs: ["validation:graph"] }],
    });
    const record = result.output?.records.find((r) => r.kind === "graph_impact_automation");
    expect(record?.disposition).toBe("defer");
    expect(record?.blockers.some((b) => b.includes("OD-03"))).toBe(true);
  });

  it("keeps default/native task and wave concurrency at zero or one", () => {
    const result = evaluateContinuity({
      repositoryRoot,
      capabilities: [
        { kind: "native_task_graph", proposedMaximumConcurrency: 4 },
        { kind: "parallel_task_wave", proposedMaximumConcurrency: 1 },
      ],
    });
    const graph = result.output?.records.find((r) => r.kind === "native_task_graph");
    const wave = result.output?.records.find((r) => r.kind === "parallel_task_wave");
    expect(graph?.maximumConcurrency).toBe(0);
    expect(wave?.maximumConcurrency).toBe(1);
    expect(result.output?.policyViolations.join(" ")).toContain("exceeds the default one-agent ceiling");
  });

  it("bounds review-loop iteration ceilings to 0..3", () => {
    const result = evaluateContinuity({
      repositoryRoot,
      capabilities: [{ kind: "review_loop", proposedIterationCeiling: 9 }],
    });
    const record = result.output?.records.find((r) => r.kind === "review_loop");
    expect(record?.iterationCeiling).toBe(3);
    expect(result.output?.policyViolations.join(" ")).toContain("out of the 0-3 range");
  });

  it("excludes Crew Task Runner and classifies incompatible behaviors", () => {
    const runner = recordFor("crew_task_runner", {
      capabilities: [{ kind: "crew_task_runner" }],
    });
    expect(runner?.disposition).toBe("exclude");
    expect(runner?.status).toBe("excluded");
    // Worktrees/concurrency/retries/replans/auto-approval are present by default.
    expect(runner?.incompatibleBehaviors).toEqual(
      expect.arrayContaining(["worktrees", "concurrencyAboveOne", "automaticRetries", "automaticReplans", "autoApproval"]),
    );
  });

  it("blocks Crew that attempts the feature-only OD-04 exception", () => {
    const result = evaluateContinuity({
      repositoryRoot,
      capabilities: [
        {
          kind: "crew_memory",
          crewBehaviorFlags: { worktrees: true, usesOd04Exception: true },
        },
      ],
    });
    const record = result.output?.records.find((r) => r.kind === "crew_memory");
    expect(record?.disposition).toBe("exclude");
    expect(result.output?.policyViolations.join(" ")).toContain("OD-04");
    expect(result.output?.policyViolations.join(" ")).toContain("feature-only");
  });

  it("retains the local specification workflow", () => {
    const spec = recordFor("specification_workflow", {
      capabilities: [{ kind: "specification_workflow" }],
    });
    expect(spec?.disposition).toBe("retain");
    expect(spec?.status).toBe("observed");
  });

  it("produces one disposition per record with allowed dispositions", () => {
    const result = evaluateContinuity({ repositoryRoot });
    const records = result.output?.records ?? [];
    const dispositions = result.output?.dispositions ?? [];
    expect(dispositions.length).toBe(records.length);
    const ids = new Set(dispositions.map((d) => d.capabilityId));
    expect(ids.size).toBe(dispositions.length);
    for (const disposition of dispositions) {
      expect(disposition.rollbackPath.length).toBeGreaterThan(0);
      expect(disposition.name.length).toBeGreaterThan(0);
    }
  });

  it("reports crew incompatible behavior list constant", () => {
    expect(CREW_INCOMPATIBLE_BEHAVIORS).toContain("worktrees");
    expect(CREW_INCOMPATIBLE_BEHAVIORS).toContain("autoApproval");
  });

  it("exposes a class evaluator with the same behavior", () => {
    const evaluator = new ContinuityEvaluator();
    const result = evaluator.evaluate({ repositoryRoot });
    expect(result.output?.records.length).toBeGreaterThanOrEqual(CONTINUITY_CAPABILITY_KINDS.length);
    expect(result.output?.externalRoutingAttempted).toBe(false);
  });

  it("marks a validated local continuity capability without a missing-validation gap", () => {
    const result = evaluateContinuity({
      repositoryRoot,
      capabilities: [
        { kind: "checkpoints_rewind", validationRunRefs: [surfaceValidationRun("validation:checkpoints").validationId] },
      ],
    });
    const record = result.output?.records.find((r) => r.kind === "checkpoints_rewind");
    expect(record?.validationRunRefs).toContain("validation:checkpoints");
    const gap = result.output?.knownGaps.find(
      (g) => g.gapId.includes("checkpoints") && g.title.includes("fresh surface validation"),
    );
    expect(gap).toBeUndefined();
  });
});
