import { describe, expect, it } from "vitest";

import {
  COMPLETE_REVIEW_STATEMENT,
  OWNER_DECISIONS,
  REQUIRED_SURFACE_VERSIONS,
  type ArtifactInventoryRecord,
  type CapabilityDispositionRecord,
  type CompatibilityRecord,
  type ConfigurationPrecedenceMap,
  type CoverageMatrix,
  type HandoverInput,
} from "../../contracts.ts";
import {
  buildCapabilityDispositionTable,
  buildKnownGapsRegister,
  HandoverGeneratorService,
} from "../../handover.ts";

const REVIEW_DATE = "2026-08-25";

function artifact(overrides: Partial<ArtifactInventoryRecord> = {}): ArtifactInventoryRecord {
  return {
    artifactId: "artifact:skill:repo-map",
    kind: "Kiro_Skill",
    path: ".kiro/skills/repo-map/SKILL.md",
    inventoryStatus: "present and readable",
    owner: "repository owner",
    configurationScope: "project",
    activationCondition: "after OD-08 manifest, prerequisite, and activation validation",
    canonicalSource: ".kiro/skills/repo-map/SKILL.md",
    evidenceState: "Observed",
    disposition: "retained",
    maintenanceRisk: "medium",
    evidenceRefs: ["observed:skill:repo-map"],
    validationRunRefs: [],
    rollbackPath: "restore skill bytes and prior activation state",
    ...overrides,
  };
}

function capability(overrides: Partial<CapabilityDispositionRecord> = {}): CapabilityDispositionRecord {
  return {
    capabilityId: "capability:tool:graph-impact",
    kind: "Tool_Surface",
    name: "graph-impact",
    disposition: "apply",
    configurationScope: "manual",
    canonicalSource: "scripts/graph-impact.mjs",
    surfaceVersionApplicability: [REQUIRED_SURFACE_VERSIONS[6]],
    activationCondition: "after reviewed root command and bounded validation",
    owner: "repository owner",
    approvalBoundaryRef: "no_boundary",
    evidenceRefs: ["observed:tool:graph-impact"],
    validationAction: "run the reviewed graph-impact command from the repository root",
    expectedSideEffects: ["read-only graph inspection"],
    rollbackPath: "remove automation and retain the manual graph-impact loop",
    reason: "manual repository capability is available",
    knownGapRefs: [],
    ...overrides,
  };
}

function compatibilityRecords(): CompatibilityRecord[] {
  return REQUIRED_SURFACE_VERSIONS.map((target) => ({
    ...target,
    status: "Unverified",
    documentedBehavior: [`documented behavior for ${target.surface}`],
    observedBehavior: target.surface === "IDE" ? ["observed IDE session"] : [],
    evidenceFreshness: "historical",
    versionSensitiveClaim: true,
    validationAction: `fresh ${target.surface} validation`,
    validationRunRefs: [],
    enablementStatus: target.surface === "Cloud/Crew" ? "deferred" : "blocked",
    unsupportedClaims: [`${target.surface} remains Unverified without a fresh exact-target run`],
    migrationConstraints: ["do not transfer evidence from another surface or version"],
    rollbackPathRef: `rollback:compatibility:${target.surface}`,
  }));
}

function coverage(complete = true): CoverageMatrix {
  return {
    entries: [{
      coverageId: "coverage:configuration",
      sourceId: "source:configuration",
      url: "https://kiro.dev/docs/configuration/",
      currentTitle: "Configuration",
      family: "Configuration",
      discoveryMethod: "repository_seed",
      reviewDateUtc: REVIEW_DATE,
      surface: "IDE",
      applicability: "applicable",
      keyConvention: "project scope",
      versionSensitiveClaim: true,
      evidenceProvenanceRef: "source:configuration",
      availability: "available",
      disposition: "observe",
      validationAction: "run exact target validation",
      status: "reviewed",
    }],
    completeReviewStatement: complete ? COMPLETE_REVIEW_STATEMENT : "",
    complete,
    unavailableCandidateRefs: complete ? [] : ["source:unavailable-cli-3"],
    blockers: complete ? [] : ["CLI 3.x page is unavailable"],
  };
}

function precedenceMap(): ConfigurationPrecedenceMap {
  return {
    records: [{
      scope: "project",
      surface: "Local_Repository_Surface",
      pathOrService: ".kiro",
      applicability: "applicable",
      access: "read_write",
      actions: ["inspect"],
      documentedPrecedence: ["project"],
      observedPrecedence: ["project"],
      denyOverridesAllow: "observed",
      evidenceRefs: ["observed:scope:project"],
      rollbackPathRef: "no rollback applies",
    }],
    documentedOrder: ["project"],
    observedOrder: ["project"],
    conflicts: [],
    unresolved: [],
    generatedAtUtc: "2026-08-25T00:00:00.000Z",
  };
}

function handoverInput(overrides: Partial<HandoverInput> = {}): HandoverInput {
  const tableResult = buildCapabilityDispositionTable({ artifacts: [artifact()], capabilities: [capability()] });
  expect(tableResult.status).toBe("pass");
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

describe("CapabilityDispositionTable and KnownGapsRegister projections", () => {
  it("projects every audited artifact/capability and uses no rollback applies for retained records", () => {
    const result = buildCapabilityDispositionTable({
      artifacts: [artifact()],
      capabilities: [capability()],
    });

    expect(result.status).toBe("pass");
    if (result.status !== "pass") return;
    expect(result.output.entries).toHaveLength(2);
    expect(result.output.entries[0]).toMatchObject({
      capabilityId: "artifact:skill:repo-map",
      canonicalSource: ".kiro/skills/repo-map/SKILL.md",
      rollbackPath: "no rollback applies",
    });
    expect(result.output.entries[1]).toMatchObject({
      capabilityId: "capability:tool:graph-impact",
      validationAction: expect.any(String),
      expectedSideEffects: expect.arrayContaining(["read-only graph inspection"]),
    });
  });

  it("rejects incomplete gap records and redacts secret-like values in valid gaps", () => {
    const result = buildKnownGapsRegister({
      entries: [{
        gapId: "KG-01",
        kind: "unverified",
        title: "CLI 3.x validation",
        evidenceState: "Unverified",
        evidenceRefs: ["evidence:cli-3"],
        owner: "repository owner",
        nextValidationRun: "validation:cli-3:next",
        blockedAction: "token=should-not-persist CLI 3.x enablement",
        disposition: "defer",
        status: "open",
        limitation: "fresh target validation is required",
      }],
    });

    expect(result.status).toBe("pass");
    if (result.status !== "pass") return;
    expect(result.output.entries[0]?.blockedAction).toContain("token=[REDACTED]");

    const invalid = buildKnownGapsRegister({ entries: [{ ...result.output.entries[0]!, limitation: "" }] });
    expect(invalid.status).toBe("blocked");
    expect(invalid.blockers[0]).toContain("requires a limitation");
  });
});

describe("HandoverGeneratorService", () => {
  it("emits the complete operational handover with seven surfaces, decisions, labels, and maintenance triggers", () => {
    const generator = new HandoverGeneratorService({ now: () => new Date("2026-08-25T12:00:00.000Z") });
    const result = generator.generate(handoverInput());

    expect(result.status).toBe("pass");
    if (result.status !== "pass") return;
    expect(result.output.generatedAtUtc).toBe("2026-08-25T12:00:00.000Z");
    expect(result.output.completeReviewStatement).toBe(COMPLETE_REVIEW_STATEMENT);
    expect(result.output.firstReadPath.slice(0, 5)).toEqual([
      "START.md",
      "AGENTS.md",
      "Agents/*",
      "docs/*",
      ".kiro/skills/repo-map/SKILL.md",
    ]);
    expect(result.output.surfaceCompatibilityStatement.split("\n")).toHaveLength(7);
    expect(result.output.ownerDecisionRefs).toEqual([
      "OD-01", "OD-02", "OD-03", "OD-04", "OD-05",
      "OD-06", "OD-07", "OD-08", "OD-09", "OD-10",
    ]);
    expect(result.output.evidenceStateLegend).toContain("Unverified");
    expect(result.output.maintenanceTriggers.length).toBeGreaterThan(0);
    expect(result.output.artifactDispositions[0]?.rollbackPath).toBe("no rollback applies");
  });

  it("keeps an incomplete review explicitly incomplete and lists unavailable candidates", () => {
    const result = new HandoverGeneratorService({ now: () => new Date("2026-08-25T12:00:00.000Z") }).generate(
      handoverInput({ coverageMatrix: coverage(false) }),
    );

    expect(result.status).toBe("partial");
    expect(result.output?.completeReviewStatement).toContain("Review incomplete:");
    expect(result.output?.limitations).toContain("Unavailable candidates: source:unavailable-cli-3.");
  });
});
