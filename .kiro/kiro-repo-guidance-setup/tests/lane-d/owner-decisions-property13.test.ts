// @vitest-environment node
//
// Feature: kiro-repo-guidance-setup, Property 13: Unresolved owner decisions
// preserve safe fallbacks.
//
// Property 13 (design.md): "For all owner-decision records marked unresolved,
// OD-01 limits claims to the observed IDE session, OD-02 preserves hook states
// and blocks automatic execution, OD-03 preserves the manual graph loop, OD-04
// preserves no-worktree/default-one-agent/explicit-approval safeguards and does
// not start the feature wave or use the four-agent exception, OD-05 through
// OD-07 keep extensions inactive, OD-08 makes no activation-scope claim, OD-09
// leaves global settings unchanged, and OD-10 labels the final gate as an owner
// decision without enabled-valid status."
//
// Validates: Requirements 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10;
// Design: Correctness Property 13.
//
// SCOPE NOTE (Lane D ownership, test-authoring only): this test writes only
// under .kiro/kiro-repo-guidance-setup/tests/lane-d/ and mutates no source module. It
// drives fast-check generators over owner-decision states (pending / rejected /
// expired / unresolved) exactly as those states are consumed by the two
// Lane-D-owned reviewer surfaces (`reviewers.ts`:
// `EvidenceCompatibilityReviewer` and `runSequentialReview`) and cross-checks
// the readable Lane B owner-decision validator (`owner-decisions.ts`:
// `validateOwnerDecisions`) that projects the same records into their
// fail-closed fallbacks. No filesystem, network, command, or configuration side
// effect occurs: every input is an in-memory record and every surface is a pure
// evaluator.

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  createEvidenceCompatibilityReviewer,
  runSequentialReview,
  type SequentialReviewInput,
} from "../../reviewers.ts";
import {
  validateOwnerDecisions,
} from "../../owner-decisions.ts";
import {
  COMPLETE_REVIEW_STATEMENT,
  OWNER_DECISION_IDS,
  OWNER_DECISIONS,
  REQUIRED_SURFACE_VERSIONS,
  type ApprovalBoundary,
  type ApprovalStatus,
  type CompatibilityRecord,
  type EvidenceReviewRequest,
  type HandoverRecord,
  type KiroSurface,
  type OwnerDecision,
  type OwnerDecisionId,
  type RollbackRecord,
  type ReviewResult,
  type SourceInventory,
  type SurfaceVersion,
  type UnresolvedStatus,
  type ValidationRun,
} from "../../contracts.ts";

const ROOT = "D:\\23082026";

// ---------------------------------------------------------------------------
// The exact fail-closed safe fallback each owner decision must preserve while
// unresolved. This mirrors requirements 10.3-10.10 / design Property 13 and is
// the specification the source projections must satisfy.
// ---------------------------------------------------------------------------

const SAFE_FALLBACKS: Readonly<Record<OwnerDecisionId, string>> = {
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

// An "unresolved" record for Property 13 purposes is any decision that is not a
// clean owner-approved + resolved entry: unresolvedStatus === "unresolved", or a
// non-approved approvalStatus (pending / rejected / expired).
const UNRESOLVED_APPROVAL_STATUSES: readonly ApprovalStatus[] = [
  "pending",
  "rejected",
  "expired",
];
const APPROVED_APPROVAL_STATUSES: readonly ApprovalStatus[] = [
  "owner-approved",
  "owner-approved-conditional",
];

/** Clone the frozen OD ledger into a plain, mutable-for-fixtures array. */
function baseDecisions(): OwnerDecision[] {
  return OWNER_DECISIONS.map((decision) => ({ ...decision }));
}

function isUnresolved(decision: OwnerDecision): boolean {
  const approved =
    decision.approvalStatus === "owner-approved" ||
    decision.approvalStatus === "owner-approved-conditional";
  return decision.unresolvedStatus === "unresolved" || !approved;
}

// ---------------------------------------------------------------------------
// Generators over owner-decision resolution states
// ---------------------------------------------------------------------------

const approvalStatusArb: fc.Arbitrary<ApprovalStatus> = fc.constantFrom<ApprovalStatus>(
  "pending",
  "owner-approved",
  "owner-approved-conditional",
  "rejected",
  "expired",
);

const unresolvedStatusArb: fc.Arbitrary<UnresolvedStatus | undefined> = fc.constantFrom<
  UnresolvedStatus | undefined
>("resolved", "unresolved", undefined);

/**
 * Produce the full OD-01..OD-10 ledger where each decision independently draws
 * a resolution state. The selectedPolicy is always preserved so the ledger
 * remains schema-valid (the default conservative policy stays in effect); only
 * the resolution/approval status varies.
 */
const decisionLedgerArb: fc.Arbitrary<OwnerDecision[]> = fc
  .tuple(
    ...OWNER_DECISION_IDS.map((id) =>
      fc.record({
        id: fc.constant(id),
        approvalStatus: approvalStatusArb,
        unresolvedStatus: unresolvedStatusArb,
      }),
    ),
  )
  .map((states) => {
    const base = baseDecisions();
    return base.map((decision) => {
      const state = states.find((candidate) => candidate.id === decision.decisionId);
      if (state === undefined) return decision;
      return {
        ...decision,
        approvalStatus: state.approvalStatus,
        ...(state.unresolvedStatus === undefined
          ? {}
          : { unresolvedStatus: state.unresolvedStatus }),
      };
    });
  });

// ---------------------------------------------------------------------------
// Property 13a: the Lane B owner-decision projection (readable source) emits the
// exact safe fallback for every unresolved decision and never mutates input.
// ---------------------------------------------------------------------------

describe("Property 13: unresolved owner decisions project their safe fallbacks", () => {
  it("emits exactly one safe fallback per unresolved decision, preserves policy, and never mutates", () => {
    fc.assert(
      fc.property(decisionLedgerArb, (decisions) => {
        const before = JSON.stringify(decisions);
        const result = validateOwnerDecisions(decisions);
        const output = result.output;
        if (output === undefined) throw new Error("expected owner-decision output");

        const expectedUnresolved = decisions
          .filter((decision) => isUnresolved(decision))
          .map((decision) => decision.decisionId);

        // Every unresolved decision is surfaced (order-independent) ...
        expect([...output.unresolvedDecisionIds].sort()).toEqual(
          [...expectedUnresolved].sort(),
        );

        // ... and each unresolved decision contributes exactly its safe fallback.
        const expectedFallbacks = expectedUnresolved.map((id) => SAFE_FALLBACKS[id]);
        expect([...output.safeFallbacks].sort()).toEqual([...expectedFallbacks].sort());

        // The default conservative policy remains in effect for every decision:
        // no unresolved decision flips selectedPolicy away from the safe default.
        for (const decision of output.decisions) {
          expect(decision.selectedPolicy).toBe("enable after validation");
        }

        // The ledger itself stays schema-valid (all ten IDs, policy preserved),
        // so unresolved status never degrades the record set into a blocker.
        expect(result.status).toBe("pass");
        expect(result.blockers).toEqual([]);

        // Side-effect-free: the input records are never mutated.
        expect(JSON.stringify(decisions)).toBe(before);
        return true;
      }),
      { numRuns: 300 },
    );
  });

  it("covers all ten decisions' fallbacks when the entire ledger is unresolved", () => {
    const allUnresolved = baseDecisions().map((decision) => ({
      ...decision,
      approvalStatus: "pending" as const,
      unresolvedStatus: "unresolved" as const,
    }));
    const result = validateOwnerDecisions(allUnresolved);
    const output = result.output;
    if (output === undefined) throw new Error("expected owner-decision output");

    expect([...output.unresolvedDecisionIds].sort()).toEqual([...OWNER_DECISION_IDS].sort());
    for (const id of OWNER_DECISION_IDS) {
      expect(output.safeFallbacks).toContain(SAFE_FALLBACKS[id]);
    }
  });
});

// ---------------------------------------------------------------------------
// Fixtures for the Lane D reviewer surfaces (kept clean apart from the owner
// decisions, so that only owner-decision resolution drives the outcome).
// ---------------------------------------------------------------------------

function surfaceVersionOf(surface: KiroSurface): SurfaceVersion {
  const found = REQUIRED_SURFACE_VERSIONS.find((sv) => sv.surface === surface);
  if (found === undefined) throw new Error(`no surface version for ${surface}`);
  return found;
}

type CompatibilityOverrides = Omit<Partial<CompatibilityRecord>, "surface" | "version">;

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

function passingRun(surface: KiroSurface): ValidationRun {
  const sv = REQUIRED_SURFACE_VERSIONS.find((s) => s.surface === surface);
  if (!sv) throw new Error(`no sv for ${surface}`);
  return {
    validationId: `validation-${surface}-${sv.version}`,
    action: "surface",
    repositoryRootOrActiveSurface: surface,
    surface,
    version: sv.version,
    scope: "property-13-fixture",
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

function completeCompatibilityRecords(): CompatibilityRecord[] {
  return REQUIRED_SURFACE_VERSIONS.map((sv) => {
    const run = passingRun(sv.surface);
    return compatibilityRecord(sv.surface, {
      status: "applicable",
      enablementStatus: "enabled-valid",
      evidenceFreshness: "fresh",
      validationRunRefs: [run.validationId],
    });
  });
}

function completeValidationRuns(): ValidationRun[] {
  return REQUIRED_SURFACE_VERSIONS.map((sv) => passingRun(sv.surface));
}

function sourceInventory(): SourceInventory {
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
          observer: "property13-fixture",
          cwdOrSurface: ROOT,
          commandOrPath: "AGENTS.md",
          result: "read",
        },
        trustDecision: "trusted",
        claims: [],
        validationRunRefs: [],
        disposition: "retained",
      },
    ],
    unavailableFindings: [],
  };
}

function cleanEvidenceRequest(decisions: readonly OwnerDecision[]): EvidenceReviewRequest {
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
          disposition: "retained",
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
        artifactId: "artifact:owner-decisions-review",
        kind: "Kiro_Skill",
        path: ".kiro/skills/repo-map/SKILL.md",
        inventoryStatus: "present and readable",
        owner: "repository owner",
        configurationScope: "project",
        activationCondition: "after exact-surface validation",
        canonicalSource: "AGENTS.md",
        evidenceState: "Observed",
        disposition: "retained",
        maintenanceRisk: "low",
        evidenceRefs: ["src-1"],
        validationRunRefs: [],
        rollbackPath: "no rollback applies",
      },
    ],
    compatibilityRecords: completeCompatibilityRecords(),
    ownerDecisions: decisions,
    validationRuns: completeValidationRuns(),
  };
}

function buildHandover(evidenceReview: ReviewResult): HandoverRecord {
  const evidenceHandoffId = evidenceReview.handoff.handoffId;
  return {
    generatedAtUtc: "2026-08-25T00:00:00.000Z",
    reviewDateUtc: "2026-08-25",
    completeReviewStatement: COMPLETE_REVIEW_STATEMENT,
    firstReadPath: ["AGENTS.md"],
    coverageMatrixRef: "cov-1",
    exclusionRegisterRef: "exclusions-1",
    officialFamilyStatuses: [],
    surfaceCompatibilityStatement: "all required surface/version targets reviewed",
    configurationPrecedenceMapRef: "precedence-1",
    capabilityDispositionTableRef: "disposition-1",
    reviewerStageRefs: [evidenceHandoffId, "handoff-SafetyRollbackReviewer"],
    ownerDecisionRefs: [...OWNER_DECISION_IDS],
    evidenceStateLegend: [],
    artifactDispositions: [
      {
        artifactId: "artifact:reviewer-fixture",
        canonicalPath: ".kiro/skills/repo-map/SKILL.md",
        disposition: "retained",
        evidenceRefs: ["src-1"],
        reason: "reviewer fixture",
        activationCondition: "after exact-surface validation",
        owner: "repository owner",
        rollbackPath: "no rollback applies",
      },
    ],
    validationRuns: completeValidationRuns(),
    knownGaps: [],
    rollbackRecords: [rollbackRecord()],
    maintenanceTriggers: [],
    limitations: [],
  };
}

function approvalBoundary(): ApprovalBoundary {
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
    expectedSideEffects: ["read-only inspection"],
    rollbackPathRef: "rollback-1",
  };
}

function rollbackRecord(): RollbackRecord {
  return {
    rollbackId: "rb-1",
    targetArtifactOrScope: ".kiro/kiro-repo-guidance-setup/reviewers.ts",
    preChangeStateRef: "snapshot-1",
    rollbackAction: "restore bytes",
    expectedSuccessSignal: "hash matches",
    observedEvidence: "hash matched",
    result: "pass",
    verificationRunRef: "validation-rollback-1",
    owner: "repository owner",
  };
}

// ---------------------------------------------------------------------------
// Property 13b: the Lane D EvidenceCompatibilityReviewer surfaces unresolved
// decisions, never emits an enabled-valid claim depending on them, blocks
// dependent enablement for rejected/expired, and never mutates its input.
// ---------------------------------------------------------------------------

describe("Property 13: EvidenceCompatibilityReviewer keeps unresolved decisions fail-closed", () => {
  const reviewer = createEvidenceCompatibilityReviewer();

  it("reports every unresolved decision, blocks rejected/expired, and stays read-only", () => {
    fc.assert(
      fc.property(decisionLedgerArb, (decisions) => {
        const request = cleanEvidenceRequest(decisions);
        const before = JSON.stringify(request);

        const result = reviewer.review(request);

        const unresolved = decisions.filter(isUnresolved);

        // Every pending, rejected, expired, or explicitly unresolved decision
        // blocks dependent enablement. A fully approved and resolved ledger
        // is the sole case that can pass this complete fixture.
        expect(result.status).toBe(unresolved.length === 0 ? "pass" : "blocked");
        if (unresolved.length > 0) {
          expect(result.blockers.length).toBeGreaterThan(0);
          for (const decision of unresolved) {
            expect(
              result.blockers.some((blocker) => blocker.includes(decision.decisionId)),
            ).toBe(true);
          }
        }

        // Every unresolved-status decision is surfaced as a finding so that no
        // enabled-valid claim silently relies on it.
        const output = result.output;
        if (output !== undefined) {
          const findings = output.stage.outputFindings;
          for (const decision of decisions) {
            if (decision.unresolvedStatus === "unresolved") {
              expect(
                findings.some((finding) => finding.includes(decision.decisionId)),
              ).toBe(true);
            }
          }
          // The reviewer is read-only and carries no rollback (side-effect-free).
          expect(output.stage.readOnly).toBe(true);
          expect(output.stage.rollbackPath).toBe("no rollback applies");
          expect(output.stage.maximumConcurrency).toBe(1);
          expect(output.stage.iterationCeiling).toBe(3);
        }

        // Side-effect-free: the reviewer never mutates its input request.
        expect(JSON.stringify(request)).toBe(before);
        return true;
      }),
      { numRuns: 300 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 13c: the sequential Lane D handoff surface never allows a clean
// both-reviewer pass while any single owner decision is unresolved (pending,
// rejected, expired, or unresolvedStatus). Unrelated / prior state is preserved.
// ---------------------------------------------------------------------------

describe("Property 13: sequential review never passes while an owner decision is unresolved", () => {
  it("blocks the handoff for any single unresolved decision and preserves prior state", () => {
    fc.assert(
      fc.property(
        // Pick one decision to knock out of the otherwise fully-resolved ledger.
        fc.constantFrom(...OWNER_DECISION_IDS),
        fc.constantFrom<ApprovalStatus>("pending", "rejected", "expired"),
        fc.constantFrom<UnresolvedStatus>("resolved", "unresolved"),
        (targetId, approvalStatus, unresolvedStatus) => {
          const decisions = baseDecisions().map((decision) =>
            decision.decisionId === targetId
              ? { ...decision, approvalStatus, unresolvedStatus }
              : decision,
          );

          const evidence = cleanEvidenceRequest(decisions);
          const evidenceResult = createEvidenceCompatibilityReviewer().review(evidence);
          const evidenceReview = evidenceResult.output;
          if (evidenceReview === undefined) {
            throw new Error("unresolved owner-decision fixture must produce an evidence review");
          }
          const input: SequentialReviewInput = {
            evidence,
            safety: {
              approvalBoundaries: [approvalBoundary()],
              policyFindings: [],
              snapshots: ["snapshot-1"],
              knownGaps: { entries: [] },
              rollbackRecords: [rollbackRecord()],
              proposedHandover: buildHandover(evidenceReview),
            },
          };
          const before = JSON.stringify(input);

          const output = runSequentialReview(input);

          const target = decisions.find((decision) => decision.decisionId === targetId);
          if (target === undefined) throw new Error("target decision missing");

          // Every pending, rejected, expired, or explicitly unresolved decision
          // is a hard blocker: no both-pass handoff is allowed. The reviewers
          // remain read-only and emit no rollback path in every case.
          expect(output.bothReviewerStagesPass).toBe(false);
          expect(output.blockedHandoff).toBe(true);

          const stages = [output.evidenceReview.output, output.safetyReview?.output];
          for (const stage of stages) {
            if (stage === undefined) continue;
            expect(stage.stage.readOnly).toBe(true);
            expect(stage.stage.rollbackPath).toBe("no rollback applies");
            expect(stage.stage.maximumConcurrency).toBe(1);
            expect(stage.stage.iterationCeiling).toBe(3);
          }

          // Prior / unrelated state is preserved: the review never mutates input.
          expect(JSON.stringify(input)).toBe(before);
          return true;
        },
      ),
      { numRuns: 200 },
    );
  });

  it("a fully resolved & owner-approved ledger allows the clean handoff", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ApprovalStatus>(...APPROVED_APPROVAL_STATUSES),
        (approvalStatus) => {
          const decisions = baseDecisions().map((decision) => ({
            ...decision,
            approvalStatus,
            unresolvedStatus: "resolved" as const,
          }));
          const evidence = cleanEvidenceRequest(decisions);
          const evidenceResult = createEvidenceCompatibilityReviewer().review(evidence);
          const evidenceReview = evidenceResult.output;
          if (evidenceReview === undefined) {
            throw new Error("resolved owner-decision fixture must produce an evidence review");
          }
          const input: SequentialReviewInput = {
            evidence,
            safety: {
              approvalBoundaries: [approvalBoundary()],
              policyFindings: [],
              snapshots: ["snapshot-1"],
              knownGaps: { entries: [] },
              rollbackRecords: [rollbackRecord()],
              proposedHandover: buildHandover(evidenceReview),
            },
          };
          const output = runSequentialReview(input);
          expect(output.bothReviewerStagesPass).toBe(true);
          expect(output.blockedHandoff).toBe(false);
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Sanity: the unresolved-approval status list is disjoint from the approved one
// so the generators above genuinely exercise both branches.
describe("Property 13: generator status partitions are disjoint", () => {
  it("no approval status is both approved and unresolved", () => {
    for (const status of UNRESOLVED_APPROVAL_STATUSES) {
      expect(APPROVED_APPROVAL_STATUSES).not.toContain(status);
    }
  });
});

