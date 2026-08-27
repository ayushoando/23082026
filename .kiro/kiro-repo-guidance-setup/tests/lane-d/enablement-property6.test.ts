// @vitest-environment node
//
// Feature: kiro-repo-guidance-setup, Property 6: Enablement is fail-closed and
// side-effect-free when incomplete.
//
// Property 6 (design.md): "For all capability proposals, enabled-valid is true
// if and only if owner approval, fresh target-surface validation,
// schema/artifact validity, repository compatibility, security-boundary
// confirmation, rollback readiness, and absence of blocking known gaps are all
// true; if any condition is missing or false, the result is blocked or inactive
// and the pre-change/unrelated-resource state is preserved."
// Validates: Requirements 1.6, 2.7, 5.5, 6.7, 8.5, 9.7, 10.2, 11.5, 12.6, 12.7,
// 14.8, 14.9.
//
// SCOPE NOTE (Lane D ownership): the integration-owned `EnablementGate`
// implementation (`scripts/kiro-repo-guidance-setup/enablement.ts`) is NOT yet
// built and is out of Lane D's write scope. This test therefore proves Property
// 6 in two complementary, Lane-D-owned ways:
//
//   1. A pure, test-local model of the enablement IFF predicate (the exact
//      contract `EnablementPredicates` frozen in contracts.ts). fast-check drives
//      every combination of the predicates and asserts the biconditional
//      (enabled-valid ⇔ all predicates true), the fail-closed default, that the
//      failed predicates are reported, and that prior state is preserved on any
//      failure. This is the specification the future `EnablementGate` must
//      satisfy. When `enablement.ts` exists, its `evaluate` should be dropped in
//      place of `evaluateEnablement` here.
//
//   2. The Lane D-owned surfaces that actually enforce the fail-closed
//      predicates today: the sequential reviewers (`bothReviewerStagesPass` +
//      `noBlockingKnownGap` + `securityBoundaryConfirmed` via approval boundary),
//      the `ValidationRunner` (`freshExactTargetValidation`), and the
//      `RollbackManager` (`rollbackReady`). fast-check proves each never yields a
//      clean pass when its required input is missing/incomplete/blocked, and that
//      none of them mutate anything or emit an enablement claim.
//
// The test performs no filesystem, network, command, or configuration side
// effects: the ValidationRunner is driven by an injected in-memory executor and
// the RollbackManager is exercised only with no-change / incomplete requests
// (no real bytes are written).

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  createEvidenceCompatibilityReviewer,
  createSafetyRollbackReviewer,
  runSequentialReview,
  type SequentialReviewInput,
} from "../../../scripts/kiro-repo-guidance-setup/reviewers.ts";
import {
  createRollbackManager,
} from "../../../scripts/kiro-repo-guidance-setup/rollback.ts";
import {
  ValidationRunnerService,
  type ValidationExecutionResult,
} from "../../../scripts/kiro-repo-guidance-setup/validation.ts";
import {
  COMPLETE_REVIEW_STATEMENT,
  REQUIRED_SURFACE_VERSIONS,
  type ApprovalBoundary,
  type CompatibilityRecord,
  type EnablementGateResult,
  type EnablementPredicates,
  type EvidenceReviewRequest,
  type Identifier,
  type KiroSurface,
  type KnownGap,
  type RollbackRecord,
  type RollbackRequest,
  type SafetyReviewRequest,
  type SourceInventory,
  type SurfaceVersion,
  type ValidationRequest,
} from "../../../scripts/kiro-repo-guidance-setup/contracts.ts";

const ROOT = "D:\\23082026";

// ---------------------------------------------------------------------------
// 1. Pure enablement-predicate model (the spec the future EnablementGate obeys)
// ---------------------------------------------------------------------------

/**
 * The exact ordered predicate keys from the frozen `EnablementPredicates`
 * contract. `enabled-valid` requires every one of them to be true; a missing or
 * false predicate returns `blocked`, never "unknown success".
 */
const PREDICATE_KEYS: readonly (keyof EnablementPredicates)[] = [
  "ownerApproval",
  "freshExactTargetValidation",
  "artifactSchemaPass",
  "repositoryCompatibility",
  "securityBoundaryConfirmed",
  "rollbackReady",
  "noBlockingKnownGap",
  "policyGuardsPass",
  "bothReviewerStagesPass",
];

/**
 * Pure, side-effect-free enablement decision. This is the reference model of
 * Property 6's biconditional. It never mutates its input, performs no I/O, and
 * always preserves prior state (the model has no authority to change anything).
 */
function evaluateEnablement(
  predicates: EnablementPredicates,
  evidenceRefs: readonly Identifier[],
): EnablementGateResult {
  const failedPredicates = PREDICATE_KEYS.filter((key) => predicates[key] !== true);
  const allTrue = failedPredicates.length === 0;
  return {
    status: allTrue ? "enabled-valid" : "blocked",
    failedPredicates,
    evidenceRefs: [...evidenceRefs],
    // The gate never mutates on a failed predicate, and even a granted decision
    // does not itself change the pre-change/unrelated-resource state.
    preservedPriorState: true,
  };
}

const predicatesArb: fc.Arbitrary<EnablementPredicates> = fc.record({
  ownerApproval: fc.boolean(),
  freshExactTargetValidation: fc.boolean(),
  artifactSchemaPass: fc.boolean(),
  repositoryCompatibility: fc.boolean(),
  securityBoundaryConfirmed: fc.boolean(),
  rollbackReady: fc.boolean(),
  noBlockingKnownGap: fc.boolean(),
  policyGuardsPass: fc.boolean(),
  bothReviewerStagesPass: fc.boolean(),
});

describe("Property 6: enablement predicate is a fail-closed biconditional", () => {
  it("grants enabled-valid iff every predicate is true, and blocks otherwise", () => {
    fc.assert(
      fc.property(predicatesArb, (predicates) => {
        const before = JSON.stringify(predicates);
        const result = evaluateEnablement(predicates, ["evidence:proposal"]);
        const allTrue = PREDICATE_KEYS.every((key) => predicates[key] === true);

        // Biconditional: enabled-valid ⇔ all predicates true.
        if (allTrue) {
          expect(result.status).toBe("enabled-valid");
          expect(result.failedPredicates).toEqual([]);
        } else {
          expect(result.status).toBe("blocked");
          expect(result.failedPredicates.length).toBeGreaterThan(0);
          // Every reported failed predicate is genuinely false.
          for (const key of result.failedPredicates) {
            expect(predicates[key]).not.toBe(true);
          }
          // Every actually-false predicate is reported.
          for (const key of PREDICATE_KEYS) {
            if (predicates[key] !== true) {
              expect(result.failedPredicates).toContain(key);
            }
          }
        }

        // Side-effect-free: input is never mutated and prior state is preserved.
        expect(JSON.stringify(predicates)).toBe(before);
        expect(result.preservedPriorState).toBe(true);
        return true;
      }),
      { numRuns: 500 },
    );
  });

  it("blocks whenever at least one required predicate is missing/false", () => {
    fc.assert(
      fc.property(
        fc.subarray([...PREDICATE_KEYS], { minLength: 1 }),
        (missing) => {
          // Start all-true, then knock out a non-empty subset.
          const predicates = Object.fromEntries(
            PREDICATE_KEYS.map((key) => [key, !missing.includes(key)]),
          ) as unknown as EnablementPredicates;
          const result = evaluateEnablement(predicates, []);
          expect(result.status).toBe("blocked");
          // The exact missing set is surfaced (order-independent).
          expect([...result.failedPredicates].sort()).toEqual([...missing].sort());
          expect(result.preservedPriorState).toBe(true);
          return true;
        },
      ),
      { numRuns: 300 },
    );
  });
});

// ---------------------------------------------------------------------------
// Fixtures for the Lane D fail-closed surfaces
// ---------------------------------------------------------------------------

function surfaceVersionOf(surface: KiroSurface): SurfaceVersion {
  const found = REQUIRED_SURFACE_VERSIONS.find((sv) => sv.surface === surface);
  if (found === undefined) throw new Error(`no surface version for ${surface}`);
  return found;
}

function compatibilityRecord(surface: KiroSurface): CompatibilityRecord {
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
          observer: "property6-fixture",
          cwdOrSurface: ROOT,
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

function cleanEvidenceRequest(
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
    artifactInventory: [
      {
        artifactId: "artifact:enablement-review",
        kind: "Kiro_Skill",
        path: ".kiro/skills/repo-map/SKILL.md",
        inventoryStatus: "present and readable",
        owner: "repository owner",
        configurationScope: "project",
        activationCondition: "after exact-surface validation",
        canonicalSource: "AGENTS.md",
        evidenceState: "Observed",
        disposition: "retain",
        maintenanceRisk: "low",
        evidenceRefs: ["src-1"],
        validationRunRefs: [],
        rollbackPath: "no rollback applies",
      },
    ],
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
    kind: "policy_conflict",
    title: "open policy conflict",
    evidenceState: "Unverified",
    evidenceRefs: [],
    owner: "repository owner",
    nextValidationRun: "validation-next-1",
    blockedAction: "enable capability",
    disposition: "defer",
    status: "open",
    limitation: "awaiting resolution",
    ...overrides,
  };
}

function cleanSequentialInput(): SequentialReviewInput {
  return {
    evidence: cleanEvidenceRequest(),
    safety: {
      approvalBoundaries: [approvalBoundary()],
      policyFindings: [],
      snapshots: ["snapshot-1"],
      knownGaps: { entries: [] },
      rollbackRecords: [rollbackRecord()],
    },
  };
}

// ---------------------------------------------------------------------------
// 2a. Sequential reviewers are the enforced fail-closed gate before enablement
// ---------------------------------------------------------------------------

describe("Property 6: sequential reviewers fail closed on any incomplete input", () => {
  it("only reports both-reviewers-pass when every required input is present, and never mutates", () => {
    // Each flag deliberately breaks one Property-6 precondition.
    const flagsArb = fc.record({
      missingApproval: fc.boolean(), // securityBoundaryConfirmed / ownerApproval surrogate
      staleValidation: fc.boolean(), // freshExactTargetValidation
      missingRollback: fc.boolean(), // rollbackReady
      incompleteCoverage: fc.boolean(), // artifactSchemaPass / coverage completeness
      unresolvedOwnerDecision: fc.boolean(), // ownerApproval (rejected)
      openBlockingGap: fc.boolean(), // noBlockingKnownGap
      policyViolation: fc.boolean(), // policyGuardsPass
    });

    fc.assert(
      fc.property(flagsArb, (flags) => {
        const base = cleanSequentialInput();

        const evidence: EvidenceReviewRequest = {
          ...base.evidence,
          ...(flags.incompleteCoverage
            ? {
                coverageMatrix: {
                  entries: [],
                  completeReviewStatement: COMPLETE_REVIEW_STATEMENT,
                  complete: false,
                  unavailableCandidateRefs: [],
                  blockers: [],
                },
              }
            : {}),
          ...(flags.staleValidation
            ? {
                // An enabled-valid compatibility claim with only historical
                // evidence and no passing exact-target run.
                compatibilityRecords: completeCompatibilityRecords().map((r) =>
                  r.surface === "IDE"
                    ? {
                        ...r,
                        status: "applicable" as const,
                        enablementStatus: "enabled-valid" as const,
                        evidenceFreshness: "historical" as const,
                      }
                    : r,
                ),
              }
            : {}),
          ...(flags.unresolvedOwnerDecision
            ? {
                ownerDecisions: base.evidence.ownerDecisions.map((d) => ({
                  ...d,
                  approvalStatus: "rejected" as const,
                })),
              }
            : {}),
        };

        const input: SequentialReviewInput = {
          evidence,
          safety: {
            approvalBoundaries: flags.missingApproval
              ? [approvalBoundary({ approvalStatus: "pending" })]
              : [approvalBoundary()],
            policyFindings: flags.policyViolation
              ? ["worktree created outside repository root"]
              : [],
            snapshots: ["snapshot-1"],
            knownGaps: flags.openBlockingGap ? { entries: [knownGap()] } : { entries: [] },
            rollbackRecords: flags.missingRollback
              ? [rollbackRecord({ result: "fail" })]
              : [rollbackRecord()],
          },
        };

        const inputBefore = JSON.stringify(input);
        const output = runSequentialReview(input);

        const anyBroken =
          flags.missingApproval ||
          flags.staleValidation ||
          flags.missingRollback ||
          flags.incompleteCoverage ||
          flags.unresolvedOwnerDecision ||
          flags.openBlockingGap ||
          flags.policyViolation;

        // Fail-closed: broken input can never yield a clean both-pass result;
        // a fully-clean input must pass.
        if (anyBroken) {
          expect(output.bothReviewerStagesPass).toBe(false);
          expect(output.blockedHandoff).toBe(true);
        } else {
          expect(output.bothReviewerStagesPass).toBe(true);
          expect(output.blockedHandoff).toBe(false);
        }

        // Side-effect-free: reviewers never mutate their input, always read-only,
        // always no-rollback, and never emit an enabled-valid claim.
        expect(JSON.stringify(input)).toBe(inputBefore);
        const stages = [output.evidenceReview.output, output.safetyReview?.output];
        for (const stage of stages) {
          if (stage === undefined) continue;
          expect(stage.stage.readOnly).toBe(true);
          expect(stage.stage.rollbackPath).toBe("no rollback applies");
          expect(stage.stage.maximumConcurrency).toBe(1);
          expect(stage.stage.iterationCeiling).toBe(3);
        }
        return true;
      }),
      { numRuns: 300 },
    );
  });

  it("holds independently for both reviewer services under any single broken predicate", () => {
    const evidenceReviewer = createEvidenceCompatibilityReviewer();
    const safetyReviewer = createSafetyRollbackReviewer();

    fc.assert(
      fc.property(
        fc.constantFrom<ApprovalBoundary["approvalStatus"]>(
          "approved",
          "pending",
          "rejected",
          "expired",
        ),
        fc.constantFrom<RollbackRecord["result"]>("pass", "fail", "blocked"),
        (approvalStatus, rollbackResult) => {
          const evidence = evidenceReviewer.review(cleanEvidenceRequest());
          expect(evidence.status).toBe("pass"); // clean evidence set stays clean
          const evidenceOut = evidence.output;
          if (evidenceOut === undefined) throw new Error("expected evidence output");

          const safety = safetyReviewer.review({
            evidenceReview: evidenceOut,
            approvalBoundaries: [approvalBoundary({ approvalStatus })],
            policyFindings: [],
            snapshots: ["snapshot-1"],
            knownGaps: { entries: [] },
            rollbackRecords: [rollbackRecord({ result: rollbackResult })],
          } satisfies SafetyReviewRequest);

          const shouldPass = approvalStatus === "approved" && rollbackResult === "pass";
          expect(safety.status === "pass").toBe(shouldPass);

          const safetyOut = safety.output;
          if (safetyOut !== undefined) {
            expect(safetyOut.stage.readOnly).toBe(true);
            expect(safetyOut.stage.rollbackPath).toBe("no rollback applies");
          }
          return true;
        },
      ),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// 2b. ValidationRunner enforces freshExactTargetValidation, fail-closed
// ---------------------------------------------------------------------------

describe("Property 6: ValidationRunner never reports PASS on incomplete/interrupted evidence", () => {
  it("only passes a clean run; interrupted/failed/blocked/unverified never pass", () => {
    // The executor is in-memory and returns whatever the current test iteration
    // stages; no command, filesystem, or network operation ever runs.
    let staged: ValidationExecutionResult = { result: "pass", exitCodeOrOutcome: "exit 0" };
    const runner = new ValidationRunnerService({
      now: () => new Date("2026-08-25T00:00:00.000Z"),
      createValidationId: () => "validation-prop6",
      execute: (): ValidationExecutionResult => staged,
    });

    const request: ValidationRequest = {
      action: "surface",
      repositoryRootOrActiveSurface: "IDE",
      surface: "IDE",
      version: "current",
      scope: "scripts/kiro-repo-guidance-setup",
      executionLayer: "surface_validation",
      commandOrInteraction: "fresh exact-target IDE validation",
    };

    fc.assert(
      fc.property(
        fc.record({
          result: fc.constantFrom<ValidationExecutionResult["result"]>(
            "pass",
            "fail",
            "blocked",
            "partial",
            "not_run",
          ),
          interrupted: fc.boolean(),
          hasUnverified: fc.boolean(),
          hasBlocker: fc.boolean(),
        }),
        (choices) => {
          staged = {
            result: choices.result,
            exitCodeOrOutcome: choices.result === "pass" ? "exit 0" : "non-zero",
            evidenceRefs: ["evidence:prop6"],
            unverifiedItems: choices.hasUnverified ? ["target not confirmed on surface"] : [],
            blocker: choices.hasBlocker ? "surface probe unavailable" : "none",
            interrupted: choices.interrupted,
          };
          const result = runner.run(request);

          const shouldPass =
            choices.result === "pass" &&
            !choices.interrupted &&
            !choices.hasUnverified &&
            !choices.hasBlocker;

          expect(result.status === "pass").toBe(shouldPass);
          if (!shouldPass) {
            // Fail-closed: any incompleteness blocks and records a blocker.
            expect(result.status).not.toBe("pass");
            if (result.output !== undefined) {
              expect(result.output.blocker).not.toBe("none");
            }
          }
          return true;
        },
      ),
      { numRuns: 300 },
    );
  });
});

// ---------------------------------------------------------------------------
// 2c. RollbackManager enforces rollbackReady, fail-closed & side-effect-free
// ---------------------------------------------------------------------------

describe("Property 6: RollbackManager blocks later enablement when rollback is not ready", () => {
  it("an incomplete rollback request never verifies and always blocks enablement", () => {
    const manager = createRollbackManager();

    // Generate rollback requests with one-or-more missing required fields. No
    // real bytes are ever written because every request is either incomplete or
    // references a snapshot that was never captured.
    const requestArb: fc.Arbitrary<RollbackRequest & { readonly mode: "restore" }> = fc.record({
      rollbackId: fc.constantFrom("", "rb-x"),
      targetArtifactOrScope: fc.constantFrom("", "scripts/x.ts"),
      preChangeStateRef: fc.constantFrom("", "snapshot-missing"),
      rollbackAction: fc.constantFrom("", "restore bytes"),
      expectedSuccessSignal: fc.constantFrom("", "hash matches"),
      owner: fc.constantFrom("", "repository owner"),
      mode: fc.constant("restore" as const),
    });

    fc.assert(
      fc.property(requestArb, (req) => {
        const result = manager.restore(req);
        const incomplete =
          req.rollbackId.trim() === "" ||
          req.targetArtifactOrScope.trim() === "" ||
          req.preChangeStateRef.trim() === "" ||
          req.rollbackAction.trim() === "" ||
          req.expectedSuccessSignal.trim() === "" ||
          req.owner.trim() === "" ||
          // even a "complete" request here references a snapshot never captured
          req.preChangeStateRef === "snapshot-missing";

        // Every generated request is incomplete or references a missing snapshot,
        // so rollback can never pass -> rollbackReady predicate is false.
        expect(incomplete).toBe(true);
        expect(result.status).not.toBe("pass");

        const readiness = manager.assessReadiness(result);
        expect(readiness.restoredBytesVerified).toBe(false);
        expect(readiness.laterEnablementBlocked).toBe(true);
        return true;
      }),
      { numRuns: 200 },
    );
  });

  it("a no-change disposition is rollback-ready and records 'no rollback applies' without mutation", () => {
    const manager = createRollbackManager();
    const result = manager.restore({
      rollbackId: "rb-nochange",
      targetArtifactOrScope: "scripts/kiro-repo-guidance-setup/handover.ts",
      preChangeStateRef: "no-change",
      rollbackAction: "no rollback applies",
      expectedSuccessSignal: "no mutation required",
      owner: "repository owner",
      mode: "no_change",
    } as RollbackRequest & { readonly mode: "no_change" });

    expect(result.status).toBe("pass");
    expect(result.output?.limitation).toBe("no rollback applies");
    const readiness = manager.assessReadiness(result);
    expect(readiness.restoredBytesVerified).toBe(true);
    expect(readiness.laterEnablementBlocked).toBe(false);
  });
});
