// @vitest-environment node

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  createEvidenceCompatibilityReviewer,
  createSafetyRollbackReviewer,
  EvidenceCompatibilityReviewerService,
  runSequentialReview,
  REVIEWER_STAGE_DEFAULTS,
  SafetyRollbackReviewerService,
  type SequentialReviewInput,
} from "../../../scripts/kiro-repo-guidance-setup/reviewers.ts";
import {
  COMPLETE_REVIEW_STATEMENT,
  REQUIRED_SURFACE_VERSIONS,
  type ApprovalBoundary,
  type CompatibilityRecord,
  type EvidenceReviewRequest,
  type KnownGap,
  type KiroSurface,
  type ReviewResult,
  type RollbackRecord,
  type SafetyReviewRequest,
  type SourceInventory,
  type SurfaceVersion,
  type ValidationRun,
} from "../../../scripts/kiro-repo-guidance-setup/contracts.ts";

type CompatibilityOverrides = Omit<Partial<CompatibilityRecord>, "surface" | "version">;

function surfaceVersionOf(surface: KiroSurface): SurfaceVersion {
  const found = REQUIRED_SURFACE_VERSIONS.find((sv) => sv.surface === surface);
  if (found === undefined) throw new Error(`no surface version for ${surface}`);
  return found;
}

function passingValidationRun(surface: KiroSurface): ValidationRun {
  const sv = surfaceVersionOf(surface);
  return {
    validationId: `validation-${surface}-${sv.version}`,
    action: "surface",
    repositoryRootOrActiveSurface: surface,
    surface,
    version: sv.version,
    scope: "reviewer-fixture",
    executionLayer: "surface_validation",
    startedAtUtc: "2026-08-25T00:00:00.000Z",
    result: "pass",
    commandOrInteraction: "fresh exact-target validation",
    exitCodeOrOutcome: "exit 0",
    evidenceRefs: [`evidence-${surface}`],
    unverifiedItems: [],
    blocker: "none",
  };
}

function compatibilityRecord(
  surface: KiroSurface,
  overrides: CompatibilityOverrides = {},
): CompatibilityRecord {
  const sv = surfaceVersionOf(surface);
  return {
    ...sv,
    status: "Unverified",
    documentedBehavior: [],
    observedBehavior: [],
    evidenceFreshness: "none",
    versionSensitiveClaim: false,
    validationAction: "run fresh exact-target validation",
    validationRunRefs: [],
    enablementStatus: "blocked",
    unsupportedClaims: [],
    migrationConstraints: [],
    rollbackPathRef: `rollback-${surface}`,
    ...overrides,
  };
}

function completeCompatibilityRecords(): CompatibilityRecord[] {
  return REQUIRED_SURFACE_VERSIONS.map((sv) => compatibilityRecord(sv.surface));
}

function sourceInventory(overrides: Partial<SourceInventory> = {}): SourceInventory {
  return {
    reviewDateUtc: "2026-08-25",
    activeSurfaces: ["Local_Repository_Surface"],
    discoveryMethod: "file_read",
    records: [
      {
        sourceId: "src-1",
        kind: "repository_file",
        locator: "AGENTS.md",
        reviewDateUtc: "2026-08-25",
        retrievalMethod: "file_read",
        surfaceApplicability: ["Local_Repository_Surface"],
        versionSensitiveClaim: false,
        availability: "available",
        evidenceState: "Documented",
        provenance: {
          observer: "reviewer-fixture",
          cwdOrSurface: "D:\\23082026",
          commandOrPath: "AGENTS.md",
          result: "read",
        },
        trustDecision: "trusted",
        claims: [],
        validationRunRefs: [],
        disposition: "retain",
      },
    ],
    unavailableFindings: [],
    ...overrides,
  };
}

function evidenceRequest(
  overrides: Partial<EvidenceReviewRequest> = {},
): EvidenceReviewRequest {
  return {
    inputStageRef: "integration-gate-1",
    sourceInventory: sourceInventory(),
    coverageMatrix: {
      entries: [
        {
          coverageId: "cov-1",
          sourceId: "src-1",
          url: "https://kiro.dev/docs",
          family: "docs",
          discoveryMethod: "sitemap",
          reviewDateUtc: "2026-08-25",
          surface: "Local_Repository_Surface",
          applicability: "applicable",
          keyConvention: "guidance",
          versionSensitiveClaim: false,
          evidenceProvenanceRef: "prov-1",
          availability: "available",
          disposition: "retain",
          validationAction: "none",
          status: "reviewed",
        },
      ],
      completeReviewStatement: COMPLETE_REVIEW_STATEMENT,
      complete: true,
      unavailableCandidateRefs: [],
      blockers: [],
    },
    exclusions: { entries: [] },
    artifactInventory: [],
    compatibilityRecords: completeCompatibilityRecords(),
    ownerDecisions: [
      {
        decisionId: "OD-01",
        owner: "repository owner",
        decisionDate: "2026-08-25",
        selectedPolicy: "enable after validation",
        scope: "surfaces",
        rejectedOptions: [],
        approvalStatus: "owner-approved-conditional",
        unresolvedStatus: "resolved",
        requiredValidation: ["fresh exact-surface validation"],
        rollbackBoundary: "restore prior state",
        evidenceRef: "req:od-01",
        limitations: [],
      },
    ],
    validationRuns: [],
    ...overrides,
  };
}

function evidenceReviewFixture(status: "pass" | "blocked" = "pass"): ReviewResult {
  const reviewer = new EvidenceCompatibilityReviewerService();
  const request =
    status === "pass"
      ? evidenceRequest()
      : evidenceRequest({
          coverageMatrix: {
            entries: [],
            completeReviewStatement: COMPLETE_REVIEW_STATEMENT,
            complete: false,
            unavailableCandidateRefs: [],
            blockers: [],
          },
        });
  const result = reviewer.review(request);
  if (result.output === undefined) throw new Error("evidence fixture produced no output");
  return result.output;
}

function approvalBoundary(overrides: Partial<ApprovalBoundary> = {}): ApprovalBoundary {
  return {
    boundaryId: "ab-1",
    scope: "project",
    requestedChange: "enable local skill",
    targetSurface: "Local_Repository_Surface",
    owner: "repository owner",
    approvalStatus: "approved",
    approvalDate: "2026-08-25",
    preChangeStateRef: "snapshot-1",
    securityBoundary: "repository-local, no secrets",
    expectedSideEffects: [],
    rollbackPathRef: "rollback-1",
    ...overrides,
  };
}

function rollbackRecord(overrides: Partial<RollbackRecord> = {}): RollbackRecord {
  return {
    rollbackId: "rb-1",
    targetArtifactOrScope: "scripts/kiro-repo-guidance-setup/reviewers.ts",
    preChangeStateRef: "snapshot-1",
    rollbackAction: "restore bytes",
    expectedSuccessSignal: "hash matches",
    observedEvidence: "hash matched",
    result: "pass",
    verificationRunRef: "validation-rollback-1",
    owner: "repository owner",
    ...overrides,
  };
}

function knownGap(overrides: Partial<KnownGap> = {}): KnownGap {
  return {
    gapId: "gap-1",
    kind: "unverified",
    title: "surface unverified",
    evidenceState: "Unverified",
    evidenceRefs: [],
    owner: "repository owner",
    nextValidationRun: "validation-next-1",
    blockedAction: "enable surface",
    disposition: "defer",
    status: "open",
    limitation: "awaiting fresh validation",
    ...overrides,
  };
}

function safetyRequest(overrides: Partial<SafetyReviewRequest> = {}): SafetyReviewRequest {
  return {
    evidenceReview: evidenceReviewFixture("pass"),
    approvalBoundaries: [approvalBoundary()],
    policyFindings: [],
    snapshots: ["snapshot-1"],
    knownGaps: { entries: [] },
    rollbackRecords: [rollbackRecord()],
    ...overrides,
  };
}

describe("reviewer stage defaults", () => {
  it("fixes sequential order, concurrency 1, ceiling 3, read-only, and no rollback", () => {
    expect(REVIEWER_STAGE_DEFAULTS.order).toEqual([
      "EvidenceCompatibilityReviewer",
      "SafetyRollbackReviewer",
    ]);
    expect(REVIEWER_STAGE_DEFAULTS.maximumConcurrency).toBe(1);
    expect(REVIEWER_STAGE_DEFAULTS.iterationCeiling).toBe(3);
    expect(REVIEWER_STAGE_DEFAULTS.readOnly).toBe(true);
    expect(REVIEWER_STAGE_DEFAULTS.rollbackPath).toBe("no rollback applies");
  });
});

describe("EvidenceCompatibilityReviewer", () => {
  it("passes a clean, complete, fresh evidence set with read-only bounded stage record", () => {
    const reviewer = createEvidenceCompatibilityReviewer();
    const result = reviewer.review(evidenceRequest());
    expect(result.status).toBe("pass");
    const output = result.output;
    if (output === undefined) throw new Error("expected review output");
    expect(output.stage.readOnly).toBe(true);
    expect(output.stage.maximumConcurrency).toBe(1);
    expect(output.stage.iterationCeiling).toBe(3);
    expect(output.stage.rollbackPath).toBe("no rollback applies");
    expect(output.handoff.fromStage).toBe("Integration_Validation_Gate");
    expect(output.handoff.toStage).toBe("SafetyRollbackReviewer");
    expect(output.handoff.order).toBe(1);
  });

  it("blocks when the coverage matrix is incomplete", () => {
    const reviewer = createEvidenceCompatibilityReviewer();
    const result = reviewer.review(
      evidenceRequest({
        coverageMatrix: {
          entries: [],
          completeReviewStatement: COMPLETE_REVIEW_STATEMENT,
          complete: false,
          unavailableCandidateRefs: [],
          blockers: [],
        },
      }),
    );
    expect(result.status).toBe("blocked");
    expect(result.blockers.join(" ")).toContain("coverage matrix");
  });

  it("blocks a missing surface/version compatibility record", () => {
    const reviewer = createEvidenceCompatibilityReviewer();
    const records = completeCompatibilityRecords().filter((r) => r.surface !== "Mobile");
    const result = reviewer.review(evidenceRequest({ compatibilityRecords: records }));
    expect(result.status).toBe("blocked");
    expect(result.blockers.join(" ")).toContain("Mobile");
  });

  it("blocks an enabled-valid claim that has no fresh exact-target validation run", () => {
    const reviewer = createEvidenceCompatibilityReviewer();
    const records = completeCompatibilityRecords().map((r) =>
      r.surface === "IDE"
        ? compatibilityRecord("IDE", {
            status: "applicable",
            enablementStatus: "enabled-valid",
            evidenceFreshness: "historical",
          })
        : r,
    );
    const result = reviewer.review(evidenceRequest({ compatibilityRecords: records }));
    expect(result.status).toBe("blocked");
    expect(result.blockers.join(" ")).toContain("fresh");
  });

  it("accepts an enabled-valid claim only with a passing exact-target run", () => {
    const reviewer = createEvidenceCompatibilityReviewer();
    const run = passingValidationRun("IDE");
    const records = completeCompatibilityRecords().map((r) =>
      r.surface === "IDE"
        ? compatibilityRecord("IDE", {
            status: "applicable",
            enablementStatus: "enabled-valid",
            evidenceFreshness: "fresh",
            validationRunRefs: [run.validationId],
          })
        : r,
    );
    const result = reviewer.review(
      evidenceRequest({ compatibilityRecords: records, validationRuns: [run] }),
    );
    expect(result.status).toBe("pass");
  });

  it("blocks when a candidate is both excluded and unavailable", () => {
    const reviewer = createEvidenceCompatibilityReviewer();
    const result = reviewer.review(
      evidenceRequest({
        exclusions: {
          entries: [
            {
              exclusionId: "ex-1",
              candidateRef: "src-dup",
              family: "billing",
              reason: "out of scope",
              scopeBoundary: "billing",
              owner: "repository owner",
              reviewDateUtc: "2026-08-25",
              reconsiderationTrigger: "n/a",
              evidenceRef: "ev-1",
              status: "excluded",
            },
          ],
        },
        sourceInventory: sourceInventory({
          unavailableFindings: [
            {
              findingId: "uf-1",
              sourceRef: "src-dup",
              attemptedAtUtc: "2026-08-25",
              surface: "Web",
              limitation: "inaccessible",
              owner: "repository owner",
              nextValidationRun: "validation-next-web",
              evidenceState: "Unverified",
              availability: "inaccessible",
            },
          ],
        }),
      }),
    );
    expect(result.status).toBe("blocked");
    expect(result.blockers.join(" ")).toContain("distinct");
  });
});

describe("SafetyRollbackReviewer", () => {
  it("passes a clean safety review with read-only bounded stage record", () => {
    const reviewer = createSafetyRollbackReviewer();
    const result = reviewer.review(safetyRequest());
    expect(result.status).toBe("pass");
    const output = result.output;
    if (output === undefined) throw new Error("expected review output");
    expect(output.stage.readOnly).toBe(true);
    expect(output.stage.rollbackPath).toBe("no rollback applies");
    expect(output.handoff.fromStage).toBe("EvidenceCompatibilityReviewer");
    expect(output.handoff.toStage).toBe("owner-approved Validation/Enablement gate");
    expect(output.handoff.order).toBe(2);
  });

  it("blocks a pending approval boundary", () => {
    const reviewer = createSafetyRollbackReviewer();
    const result = reviewer.review(
      safetyRequest({ approvalBoundaries: [approvalBoundary({ approvalStatus: "pending" })] }),
    );
    expect(result.status).toBe("blocked");
    expect(result.blockers.join(" ")).toContain("pending");
  });

  it("blocks a failed rollback record", () => {
    const reviewer = createSafetyRollbackReviewer();
    const result = reviewer.review(
      safetyRequest({ rollbackRecords: [rollbackRecord({ result: "fail" })] }),
    );
    expect(result.status).toBe("blocked");
    expect(result.blockers.join(" ")).toContain("rollback");
  });

  it("blocks a repository policy violation", () => {
    const reviewer = createSafetyRollbackReviewer();
    const result = reviewer.review(
      safetyRequest({ policyFindings: ["worktree created outside repository root"] }),
    );
    expect(result.status).toBe("blocked");
    expect(result.blockers.join(" ")).toContain("policy");
  });

  it("blocks an open policy-conflict known gap", () => {
    const reviewer = createSafetyRollbackReviewer();
    const result = reviewer.review(
      safetyRequest({ knownGaps: { entries: [knownGap({ kind: "policy_conflict" })] } }),
    );
    expect(result.status).toBe("blocked");
  });

  it("cannot start on a failed evidence review that is not represented as a recorded blocker", () => {
    const reviewer = createSafetyRollbackReviewer();
    const evidence = evidenceReviewFixture("pass");
    // Force an inconsistent handoff: status fail but no recorded blocker.
    const tampered: ReviewResult = {
      ...evidence,
      blockers: [],
      handoff: { ...evidence.handoff, status: "fail", blocker: "none" },
    };
    const result = reviewer.review(safetyRequest({ evidenceReview: tampered }));
    expect(result.status).toBe("blocked");
    expect(result.blockers.join(" ")).toContain("cannot start");
  });

  it("may proceed on a failed evidence review when the failure is a recorded blocker", () => {
    const reviewer = createSafetyRollbackReviewer();
    const evidence = evidenceReviewFixture("blocked");
    const result = reviewer.review(safetyRequest({ evidenceReview: evidence }));
    // It starts (no precondition blocker about "cannot start"), even if it then
    // records other findings.
    expect(result.blockers.join(" ")).not.toContain("cannot start on partial or failed");
  });
});

describe("runSequentialReview", () => {
  function cleanInput(): SequentialReviewInput {
    return {
      evidence: evidenceRequest(),
      safety: {
        approvalBoundaries: [approvalBoundary()],
        policyFindings: [],
        snapshots: ["snapshot-1"],
        knownGaps: { entries: [] },
        rollbackRecords: [rollbackRecord()],
      },
    };
  }

  it("runs both reviewers in order and reports both passing", () => {
    const output = runSequentialReview(cleanInput());
    expect(output.reviewerStages).toEqual([
      "EvidenceCompatibilityReviewer",
      "SafetyRollbackReviewer",
    ]);
    expect(output.evidenceReview.status).toBe("pass");
    expect(output.safetyReview?.status).toBe("pass");
    expect(output.bothReviewerStagesPass).toBe(true);
    expect(output.blockedHandoff).toBe(false);
    expect(output.handoffRefs.length).toBe(2);
  });

  it("records a blocked handoff when the evidence stage fails", () => {
    const input = cleanInput();
    const output = runSequentialReview({
      ...input,
      evidence: evidenceRequest({
        coverageMatrix: {
          entries: [],
          completeReviewStatement: COMPLETE_REVIEW_STATEMENT,
          complete: false,
          unavailableCandidateRefs: [],
          blockers: [],
        },
      }),
    });
    expect(output.evidenceReview.status).toBe("blocked");
    expect(output.bothReviewerStagesPass).toBe(false);
    expect(output.blockedHandoff).toBe(true);
  });
});

describe("Property: reviewer stages are read-only and bounded regardless of input", () => {
  it("never emits a mutating rollback path and always fixes concurrency/ceiling", () => {
    fc.assert(
      fc.property(
        fc.record({
          complete: fc.boolean(),
          statement: fc.boolean(),
          dropSurface: fc.boolean(),
        }),
        (choices) => {
          const reviewer = new EvidenceCompatibilityReviewerService();
          const records = choices.dropSurface
            ? completeCompatibilityRecords().filter((r) => r.surface !== "Web")
            : completeCompatibilityRecords();
          const result = reviewer.review(
            evidenceRequest({
              compatibilityRecords: records,
              coverageMatrix: {
                entries: choices.complete
                  ? evidenceRequest().coverageMatrix.entries
                  : [],
                completeReviewStatement: choices.statement
                  ? COMPLETE_REVIEW_STATEMENT
                  : "wrong statement",
                complete: choices.complete,
                unavailableCandidateRefs: [],
                blockers: [],
              },
            }),
          );
          const output = result.output;
          if (output === undefined) return false;
          // Read-only, bounded, sequential invariants always hold.
          return (
            output.stage.readOnly === true &&
            output.stage.maximumConcurrency === 1 &&
            output.stage.iterationCeiling === 3 &&
            output.stage.rollbackPath === "no rollback applies" &&
            output.handoff.readOnly === true &&
            output.handoff.order === 1 &&
            // An incomplete or mis-stated coverage matrix is never a clean pass.
            ((choices.complete && choices.statement && !choices.dropSurface) ||
              result.status !== "pass")
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("safety reviewer blocks any non-approved boundary and always records no-rollback", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ApprovalBoundary["approvalStatus"]>(
          "approved",
          "pending",
          "rejected",
          "expired",
        ),
        (approvalStatus) => {
          const reviewer = new SafetyRollbackReviewerService();
          const result = reviewer.review(
            safetyRequest({ approvalBoundaries: [approvalBoundary({ approvalStatus })] }),
          );
          const output = result.output;
          if (output === undefined) return false;
          const readOnlyBounded =
            output.stage.readOnly === true &&
            output.stage.rollbackPath === "no rollback applies" &&
            output.stage.maximumConcurrency === 1 &&
            output.stage.iterationCeiling === 3;
          const gate =
            approvalStatus === "approved" ? result.status === "pass" : result.status === "blocked";
          return readOnlyBounded && gate;
        },
      ),
      { numRuns: 100 },
    );
  });
});
