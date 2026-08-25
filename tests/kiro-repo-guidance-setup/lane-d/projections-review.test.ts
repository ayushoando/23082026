import { describe, expect, it } from "vitest";

import {
  COMPLETE_REVIEW_STATEMENT,
  OWNER_DECISIONS,
  REQUIRED_SURFACE_VERSIONS,
  type ApprovalBoundary,
  type CapabilityDispositionRecord,
  type CompatibilityRecord,
  type ConfigurationPrecedenceMap,
  type CoverageMatrix,
  type EvidenceReviewRequest,
  type HandoverInput,
  type KnownGap,
  type RollbackRecord,
  type SafetyReviewRequest,
  type SourceInventory,
} from "../../../scripts/kiro-repo-guidance-setup/contracts.ts";
import {
  buildCapabilityDispositionTable,
  buildKnownGapsRegister,
  HandoverGeneratorService,
} from "../../../scripts/kiro-repo-guidance-setup/handover.ts";
import {
  createEvidenceCompatibilityReviewer,
  createSafetyRollbackReviewer,
  runSequentialReview,
} from "../../../scripts/kiro-repo-guidance-setup/reviewers.ts";

const REVIEW_DATE = "2026-08-25";

function capability(overrides: Partial<CapabilityDispositionRecord> = {}): CapabilityDispositionRecord {
  return {
    capabilityId: "capability:lane-d-example",
    kind: "Tool_Surface",
    name: "lane-d-example",
    disposition: "observe",
    configurationScope: "manual",
    canonicalSource: "scripts/kiro-repo-guidance-setup/example.ts",
    surfaceVersionApplicability: [...REQUIRED_SURFACE_VERSIONS],
    activationCondition: "after exact-surface validation and owner approval",
    owner: "repository owner",
    approvalBoundaryRef: "no_boundary",
    evidenceRefs: ["evidence:lane-d-example"],
    validationAction: "run the exact repository validation command",
    expectedSideEffects: ["read-only inspection"],
    rollbackPath: "restore the prior activation state",
    reason: "observed capability remains inactive until validation",
    knownGapRefs: [],
    ...overrides,
  };
}

function knownGap(overrides: Partial<KnownGap> = {}): KnownGap {
  return {
    gapId: "gap:lane-d-example",
    kind: "unverified",
    title: "exact surface validation is pending",
    evidenceState: "Unverified",
    evidenceRefs: ["evidence:lane-d-gap"],
    owner: "repository owner",
    nextValidationRun: "validation:lane-d-next",
    blockedAction: "enable the unverified capability",
    disposition: "defer",
    status: "open",
    limitation: "the selected surface has not been freshly validated",
    ...overrides,
  };
}

function compatibilityRecords(): CompatibilityRecord[] {
  return REQUIRED_SURFACE_VERSIONS.map((surface) => ({
    ...surface,
    status: "Unverified",
    documentedBehavior: [`documented behavior for ${surface.surface}`],
    observedBehavior: [],
    evidenceFreshness: "none",
    versionSensitiveClaim: true,
    validationAction: `fresh ${surface.surface} validation`,
    validationRunRefs: [],
    enablementStatus: surface.surface === "Cloud/Crew" ? "deferred" : "blocked",
    unsupportedClaims: [`${surface.surface} remains unverified`],
    migrationConstraints: ["do not transfer evidence across surfaces"],
    rollbackPathRef: `rollback:${surface.surface}`,
  }));
}

function coverage(complete = true): CoverageMatrix {
  return {
    entries: [
      {
        coverageId: "coverage:lane-d-example",
        sourceId: "source:lane-d-review",
        url: "https://kiro.dev/docs/configuration/",
        currentTitle: "Configuration",
        family: "Configuration",
        discoveryMethod: "repository_seed",
        reviewDateUtc: REVIEW_DATE,
        surface: "Local_Repository_Surface",
        applicability: "applicable",
        keyConvention: "repository-local project scope",
        versionSensitiveClaim: true,
        evidenceProvenanceRef: "source:lane-d-review",
        availability: "available",
        disposition: "observe",
        validationAction: "fresh exact-surface validation",
        status: "reviewed",
      },
    ],
    completeReviewStatement: complete ? COMPLETE_REVIEW_STATEMENT : "",
    complete,
    unavailableCandidateRefs: complete ? [] : ["source:lane-d-unavailable"],
    blockers: complete ? [] : ["the selected documentation candidate is unavailable"],
  };
}

function precedenceMap(): ConfigurationPrecedenceMap {
  return {
    records: [
      {
        scope: "project",
        surface: "Local_Repository_Surface",
        pathOrService: ".kiro",
        applicability: "applicable",
        access: "read_write",
        actions: ["inspect"],
        documentedPrecedence: ["project"],
        observedPrecedence: ["project"],
        denyOverridesAllow: "observed",
        evidenceRefs: ["evidence:lane-d-scope"],
        rollbackPathRef: "no rollback applies",
      },
    ],
    documentedOrder: ["project"],
    observedOrder: ["project"],
    conflicts: [],
    unresolved: [],
    generatedAtUtc: "2026-08-25T00:00:00.000Z",
  };
}

function handoverInput(overrides: Partial<HandoverInput> = {}): HandoverInput {
  const tableResult = buildCapabilityDispositionTable({ capabilities: [capability()] });
  if (tableResult.status !== "pass") throw new Error(tableResult.blockers.join("; "));

  return {
    reviewDateUtc: REVIEW_DATE,
    coverageMatrix: coverage(),
    exclusionRegister: { entries: [] },
    officialFamilyStatuses: ["Configuration: reviewed", "Hooks: Unverified pending exact schema validation"],
    compatibilityRecords: compatibilityRecords(),
    precedenceMap: precedenceMap(),
    dispositionTable: tableResult.output,
    ownerDecisions: OWNER_DECISIONS,
    validationRuns: [],
    knownGaps: [],
    rollbackRecords: [],
    ...overrides,
  };
}

function sourceInventory(): SourceInventory {
  return {
    reviewDateUtc: REVIEW_DATE,
    activeSurfaces: ["Local_Repository_Surface"],
    discoveryMethod: "file_read",
    records: [
      {
        sourceId: "source:lane-d-review",
        kind: "repository_file",
        locator: "AGENTS.md",
        reviewDateUtc: REVIEW_DATE,
        retrievalMethod: "file_read",
        surfaceApplicability: ["Local_Repository_Surface"],
        versionSensitiveClaim: false,
        availability: "available",
        evidenceState: "Documented",
        provenance: {
          observer: "lane-d-test",
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
  };
}

function evidenceRequest(overrides: Partial<EvidenceReviewRequest> = {}): EvidenceReviewRequest {
  return {
    inputStageRef: "integration-gate:lane-d-review",
    sourceInventory: sourceInventory(),
    coverageMatrix: coverage(),
    exclusions: { entries: [] },
    artifactInventory: [
      {
        artifactId: "artifact:lane-d-review",
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
        evidenceRefs: ["source:lane-d-review"],
        validationRunRefs: [],
        rollbackPath: "no rollback applies",
      },
    ],
    compatibilityRecords: compatibilityRecords(),
    ownerDecisions: [OWNER_DECISIONS[0]],
    validationRuns: [],
    ...overrides,
  };
}

function approvalBoundary(overrides: Partial<ApprovalBoundary> = {}): ApprovalBoundary {
  return {
    boundaryId: "approval-boundary:lane-d-review",
    scope: "project",
    requestedChange: "inspect repository-local guidance",
    targetSurface: "Local_Repository_Surface",
    owner: "repository owner",
    approvalStatus: "approved",
    approvalDate: REVIEW_DATE,
    preChangeStateRef: "snapshot:lane-d-review",
    securityBoundary: "repository-local, no secrets or external data",
    expectedSideEffects: [],
    rollbackPathRef: "rollback:lane-d-review",
    ...overrides,
  };
}

function rollbackRecord(overrides: Partial<RollbackRecord> = {}): RollbackRecord {
  return {
    rollbackId: "rollback:lane-d-review",
    targetArtifactOrScope: "repository-local guidance",
    preChangeStateRef: "snapshot:lane-d-review",
    rollbackAction: "restore the captured bytes",
    expectedSuccessSignal: "captured bytes match",
    observedEvidence: "captured bytes match",
    result: "pass",
    verificationRunRef: "validation:lane-d-review-rollback",
    owner: "repository owner",
    ...overrides,
  };
}

function cleanSafetyRequest(overrides: Partial<SafetyReviewRequest> = {}): SafetyReviewRequest {
  const evidence = createEvidenceCompatibilityReviewer().review(evidenceRequest());
  if (evidence.output === undefined) throw new Error("expected evidence review output");
  return {
    evidenceReview: evidence.output,
    approvalBoundaries: [approvalBoundary()],
    policyFindings: [],
    snapshots: ["snapshot:lane-d-review"],
    knownGaps: { entries: [] },
    rollbackRecords: [rollbackRecord()],
    ...overrides,
  };
}

describe("CapabilityDispositionTable and KnownGapsRegister controlled projections", () => {
  it("requires disposition fields and uses no rollback applies for no-change dispositions", () => {
    const valid = buildCapabilityDispositionTable({
      capabilities: [capability({ disposition: "observe", rollbackPath: "do not mutate" })],
    });
    expect(valid.status).toBe("pass");
    expect(valid.output?.entries[0]).toMatchObject({
      capabilityId: "capability:lane-d-example",
      canonicalSource: "scripts/kiro-repo-guidance-setup/example.ts",
      rollbackPath: "no rollback applies",
      validationAction: expect.any(String),
      reason: expect.any(String),
    });

    const incomplete = buildCapabilityDispositionTable({
      capabilities: [
        capability({
          name: "",
          canonicalSource: "",
          surfaceVersionApplicability: [],
          evidenceRefs: [],
          expectedSideEffects: [],
          validationAction: "",
          reason: "",
          rollbackPath: "",
        }),
      ],
    });
    expect(incomplete.status).toBe("blocked");
    expect(incomplete.blockers).toEqual(
      expect.arrayContaining([
        expect.stringContaining("requires a non-empty name"),
        expect.stringContaining("requires a canonical source/path"),
        expect.stringContaining("requires surface/version applicability"),
        expect.stringContaining("requires evidence references"),
        expect.stringContaining("requires expected side effects"),
        expect.stringContaining("requires a validation action"),
        expect.stringContaining("requires a disposition reason"),
      ]),
    );
    expect(incomplete.output?.entries).toEqual([]);
  });

  it("rejects duplicate disposition records without silently merging them", () => {
    const result = buildCapabilityDispositionTable({
      capabilities: [capability(), capability()],
    });

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain("duplicate capability disposition capability:lane-d-example");
    expect(result.output?.entries).toHaveLength(1);
  });

  it("rejects duplicate and incomplete known gaps while preserving the valid projection", () => {
    const duplicate = buildKnownGapsRegister({ entries: [knownGap(), knownGap()] });
    expect(duplicate.status).toBe("blocked");
    expect(duplicate.blockers).toContain("duplicate known gap gap:lane-d-example");
    expect(duplicate.output?.entries).toHaveLength(2);

    const incomplete = buildKnownGapsRegister({ entries: [knownGap({ limitation: "" })] });
    expect(incomplete.status).toBe("blocked");
    expect(incomplete.blockers).toContain("gap:lane-d-example requires a limitation");
    expect(incomplete.output?.entries).toEqual([]);
  });
});

describe("HandoverGenerator controlled review projections", () => {
  it("keeps the handover partial when official-family coverage is incomplete", () => {
    const result = new HandoverGeneratorService({
      now: () => new Date("2026-08-25T12:00:00.000Z"),
    }).generate(handoverInput({ coverageMatrix: coverage(false) }));

    expect(result.status).toBe("partial");
    expect(result.output?.completeReviewStatement).toBe(
      `Review incomplete: ${COMPLETE_REVIEW_STATEMENT}`,
    );
    expect(result.output?.limitations).toEqual(
      expect.arrayContaining([
        "Unavailable candidates: source:lane-d-unavailable.",
        "the selected documentation candidate is unavailable",
      ]),
    );
    expect(result.output?.artifactDispositions).toHaveLength(1);
  });

  it("blocks a handover with an empty disposition table instead of emitting an incomplete success", () => {
    const result = new HandoverGeneratorService({
      now: () => new Date("2026-08-25T12:00:00.000Z"),
    }).generate(handoverInput({ dispositionTable: { entries: [] } }));

    expect(result.status).toBe("partial");
    expect(result.blockers).toContain("handover requires a non-empty Capability_Disposition_Table");
    expect(result.output?.artifactDispositions).toEqual([]);
  });
});

describe("sequential review-only handoffs", () => {
  it("runs the two roles in order, preserves input, and records bounded read-only handoffs", () => {
    const input = {
      evidence: evidenceRequest(),
      safety: {
        approvalBoundaries: [approvalBoundary()],
        policyFindings: [],
        snapshots: ["snapshot:lane-d-review"],
        knownGaps: { entries: [] },
        rollbackRecords: [rollbackRecord()],
      },
    };
    const before = JSON.stringify(input);
    const output = runSequentialReview(input);

    expect(output.reviewerStages).toEqual([
      "EvidenceCompatibilityReviewer",
      "SafetyRollbackReviewer",
    ]);
    expect(output.bothReviewerStagesPass).toBe(true);
    expect(output.blockedHandoff).toBe(false);
    expect(output.evidenceReview.output?.handoff).toMatchObject({
      fromStage: "Integration_Validation_Gate",
      toStage: "SafetyRollbackReviewer",
      order: 1,
      readOnly: true,
      maximumConcurrency: 1,
      iterationCeiling: 3,
      blocker: "none",
    });
    expect(output.safetyReview?.output?.handoff).toMatchObject({
      fromStage: "EvidenceCompatibilityReviewer",
      toStage: "owner-approved Validation/Enablement gate",
      order: 2,
      readOnly: true,
      maximumConcurrency: 1,
      iterationCeiling: 3,
      blocker: "none",
    });
    expect(output.evidenceReview.output?.stage).toMatchObject({
      readOnly: true,
      maximumConcurrency: 1,
      iterationCeiling: 3,
      rollbackPath: "no rollback applies",
    });
    expect(output.safetyReview?.output?.stage).toMatchObject({
      readOnly: true,
      maximumConcurrency: 1,
      iterationCeiling: 3,
      rollbackPath: "no rollback applies",
    });
    expect(JSON.stringify(input)).toBe(before);
  });

  it("records a blocked handoff when evidence is incomplete and never treats the safety stage as an approval substitute", () => {
    const output = runSequentialReview({
      evidence: evidenceRequest({ coverageMatrix: coverage(false) }),
      safety: {
        approvalBoundaries: [approvalBoundary()],
        policyFindings: [],
        snapshots: ["snapshot:lane-d-review"],
        knownGaps: { entries: [] },
        rollbackRecords: [rollbackRecord()],
      },
    });

    expect(output.evidenceReview.status).toBe("blocked");
    expect(output.safetyReview).toBeDefined();
    expect(output.bothReviewerStagesPass).toBe(false);
    expect(output.blockedHandoff).toBe(true);
    expect(output.safetyReview?.output?.stage.readOnly).toBe(true);
    expect(output.safetyReview?.output?.stage.rollbackPath).toBe("no rollback applies");
  });

  it("blocks an approved boundary that lacks a pre-change snapshot reference", () => {
    const reviewer = createSafetyRollbackReviewer();
    const result = reviewer.review(
      cleanSafetyRequest({ approvalBoundaries: [approvalBoundary({ preChangeStateRef: "" })] }),
    );

    expect(result.status).toBe("blocked");
    expect(result.blockers.some((blocker) => blocker.includes("pre-change state reference"))).toBe(true);
    expect(result.output?.stage.readOnly).toBe(true);
    expect(result.output?.stage.maximumConcurrency).toBe(1);
    expect(result.output?.stage.iterationCeiling).toBe(3);
  });

  it("blocks a proposed handover with duplicate artifact dispositions", () => {
    const handover = new HandoverGeneratorService({
      now: () => new Date("2026-08-25T12:00:00.000Z"),
    }).generate(handoverInput());
    if (handover.output === undefined) throw new Error("expected a handover output");

    const duplicateDisposition = handover.output.artifactDispositions[0];
    if (duplicateDisposition === undefined) throw new Error("expected an artifact disposition");
    const proposedHandover = {
      ...handover.output,
      artifactDispositions: [duplicateDisposition, duplicateDisposition],
    };
    const result = createSafetyRollbackReviewer().review(
      cleanSafetyRequest({ proposedHandover }),
    );

    expect(result.status).toBe("blocked");
    expect(result.blockers.some((blocker) => blocker.includes("more than one disposition"))).toBe(true);
  });
});
