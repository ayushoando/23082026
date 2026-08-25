// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  ENABLEMENT_PREDICATE_KEYS,
  IntegrationOwnedEnablementGateService,
  type FinalEnablementGateInput,
} from "../../../scripts/kiro-repo-guidance-setup/enablement.ts";
import {
  REVIEWER_ITERATION_CEILING,
  REVIEWER_MAXIMUM_CONCURRENCY,
  REVIEWER_ORDER,
  type EnablementPredicates,
  type IntegrationValidationGateRecord,
  type ReviewResult,
  type StageResult,
} from "../../../scripts/kiro-repo-guidance-setup/contracts.ts";
import type { SequentialReviewOutput } from "../../../scripts/kiro-repo-guidance-setup/reviewers.ts";

type ReviewerName = (typeof REVIEWER_ORDER)[number];

const ALL_TRUE_PREDICATES: EnablementPredicates = {
  ownerApproval: true,
  freshExactTargetValidation: true,
  artifactSchemaPass: true,
  repositoryCompatibility: true,
  securityBoundaryConfirmed: true,
  rollbackReady: true,
  noBlockingKnownGap: true,
  policyGuardsPass: true,
  bothReviewerStagesPass: true,
};

function reviewResult(
  reviewer: ReviewerName,
  order: 1 | 2,
  fromStage: "Integration_Validation_Gate" | "EvidenceCompatibilityReviewer",
  toStage: "SafetyRollbackReviewer" | "owner-approved Validation/Enablement gate",
  evidenceRef: string,
): ReviewResult {
  const handoffId = `handoff-${reviewer}`;
  return {
    reviewer,
    stage: {
      reviewer,
      executionLayer: "reviewer_stage",
      maximumConcurrency: REVIEWER_MAXIMUM_CONCURRENCY,
      iterationCeiling: REVIEWER_ITERATION_CEILING,
      readOnly: true,
      inputStageRef: "integration-gate-enablement-test",
      outputFindings: [],
      blocker: "none",
      status: "pass",
      rollbackPath: "no rollback applies",
    },
    handoff: {
      handoffId,
      fromStage,
      toStage,
      order,
      inputRefs: ["integration-gate-enablement-test"],
      outputRefs: [handoffId],
      status: "pass",
      readOnly: true,
      maximumConcurrency: REVIEWER_MAXIMUM_CONCURRENCY,
      iterationCeiling: REVIEWER_ITERATION_CEILING,
      blocker: "none",
    },
    findings: [],
    blockers: [],
    evidenceRefs: [evidenceRef],
  };
}

function passStage(output: ReviewResult): StageResult<ReviewResult> {
  return {
    status: "pass",
    output,
    blockers: [],
    evidenceRefs: output.evidenceRefs,
  };
}

function cleanReviewerOutput(): SequentialReviewOutput {
  const evidence = reviewResult(
    "EvidenceCompatibilityReviewer",
    1,
    "Integration_Validation_Gate",
    "SafetyRollbackReviewer",
    "evidence-review",
  );
  const safety = reviewResult(
    "SafetyRollbackReviewer",
    2,
    "EvidenceCompatibilityReviewer",
    "owner-approved Validation/Enablement gate",
    "safety-review",
  );
  return {
    reviewerStages: REVIEWER_ORDER,
    evidenceReview: passStage(evidence),
    safetyReview: passStage(safety),
    handoffRefs: [evidence.handoff.handoffId, safety.handoff.handoffId],
    bothReviewerStagesPass: true,
    blockedHandoff: false,
  };
}

function integrationGate(
  reviewerHandoffRefs: readonly string[],
  overrides: Partial<IntegrationValidationGateRecord> = {},
): IntegrationValidationGateRecord {
  return {
    gateId: "integration-gate-enablement-test",
    waveId: "wave-enablement-test",
    collectedAgentOutputs: [],
    conflictResolutions: [],
    repositoryValidationRuns: ["validation-enablements-test"],
    reviewerStages: REVIEWER_ORDER,
    sequentialReviewerHandoffRefs: [...reviewerHandoffRefs],
    status: "pass",
    enablementAllowed: true,
    rollbackPath: "restore pre-change state and release reservations",
    ...overrides,
  };
}

function input(
  overrides: Partial<FinalEnablementGateInput> = {},
): FinalEnablementGateInput {
  const reviewerOutput = cleanReviewerOutput();
  const reviewerHandoffRefs = [...reviewerOutput.handoffRefs];
  return {
    predicates: ALL_TRUE_PREDICATES,
    evidenceRefs: ["evidence-owner-approval", "evidence-validation"],
    priorStatePreserved: true,
    target: { surface: "Local_Repository_Surface", version: "repository" },
    limitations: [],
    integrationGate: integrationGate(reviewerHandoffRefs),
    reviewerHandoffRefs,
    reviewerOutput,
    ...overrides,
  };
}

describe("integration-owned EnablementGate", () => {
  it("grants enabled-valid only after both concrete reviewer stages pass", () => {
    const result = new IntegrationOwnedEnablementGateService().evaluate(input());

    expect(result.status).toBe("pass");
    expect(result.output).toMatchObject({
      status: "enabled-valid",
      failedPredicates: [],
      preservedPriorState: true,
    });
    expect(result.output?.evidenceRefs).toEqual(
      expect.arrayContaining([
        "evidence-owner-approval",
        "evidence-validation",
        "evidence-review",
        "safety-review",
      ]),
    );
  });

  it("blocks missing reviewer output even when every predicate is true", () => {
    const candidate = input({ reviewerOutput: undefined, reviewerHandoffRefs: [] });
    const before = JSON.stringify(candidate);
    const result = new IntegrationOwnedEnablementGateService().evaluate(candidate);

    expect(result.status).toBe("blocked");
    expect(result.output?.status).toBe("blocked");
    expect(result.output?.failedPredicates).toContain("bothReviewerStagesPass");
    expect(result.output?.preservedPriorState).toBe(true);
    expect(result.blockers.join(" ")).toContain("both sequential reviewer outputs are required");
    expect(JSON.stringify(candidate)).toBe(before);
  });

  it.each([
    ["partial", "partial" as const],
    ["blocked", "blocked" as const],
  ])("blocks a %s reviewer handoff without enablement", (_label, status) => {
    const clean = cleanReviewerOutput();
    const blockedSafety: SequentialReviewOutput = {
      ...clean,
      safetyReview: {
        ...clean.safetyReview!,
        status,
        output: {
          ...clean.safetyReview!.output!,
          stage: {
            ...clean.safetyReview!.output!.stage,
            status: "blocked",
            blocker: "safety boundary is unresolved",
          },
          blockers: ["safety boundary is unresolved"],
        },
      },
      bothReviewerStagesPass: false,
      blockedHandoff: true,
    };
    const result = new IntegrationOwnedEnablementGateService().evaluate(
      input({ reviewerOutput: blockedSafety }),
    );

    expect(result.status).toBe("blocked");
    expect(result.output?.status).toBe("blocked");
    expect(result.output?.preservedPriorState).toBe(true);
    expect(result.blockers.join(" ")).toContain("both sequential reviewer stages must pass");
    expect(result.blockers.join(" ")).toContain("safety boundary is unresolved");
  });

  it("blocks mismatched reviewer handoff records without changing prior state", () => {
    const clean = cleanReviewerOutput();
    const candidate = input({
      reviewerHandoffRefs: ["handoff-mismatch", clean.handoffRefs[1]],
    });
    const before = JSON.stringify(candidate);
    const result = new IntegrationOwnedEnablementGateService().evaluate(candidate);

    expect(result.status).toBe("blocked");
    expect(result.output?.status).toBe("blocked");
    expect(result.output?.preservedPriorState).toBe(true);
    expect(result.blockers.join(" ")).toContain(
      "integration reviewer handoff references do not match",
    );
    expect(JSON.stringify(candidate)).toBe(before);
  });

  it("blocks integration-gate policy failure and reports every unsatisfied predicate", () => {
    const predicates: EnablementPredicates = {
      ...ALL_TRUE_PREDICATES,
      ownerApproval: false,
      securityBoundaryConfirmed: false,
    };
    const result = new IntegrationOwnedEnablementGateService().evaluate(
      input({
        predicates,
        integrationGate: integrationGate(cleanReviewerOutput().handoffRefs, {
          status: "blocked",
          enablementAllowed: false,
        }),
      }),
    );

    expect(result.status).toBe("blocked");
    expect(result.output?.failedPredicates).toEqual(
      expect.arrayContaining([
        ...ENABLEMENT_PREDICATE_KEYS.filter(
          (predicate) => predicates[predicate] !== true,
        ),
        "repositoryCompatibility",
      ]),
    );
    expect(result.blockers.join(" ")).toContain("Integration_Validation_Gate status is blocked");
    expect(result.output?.preservedPriorState).toBe(true);
  });
});
