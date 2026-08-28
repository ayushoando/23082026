// @vitest-environment node
//
// Feature: kiro-repo-guidance-setup, Property 14: Disposition and handover
// projections are one-to-one.
//
// Property 14 (design.md): "For all audited artifacts, the capability
// disposition table and handover contain exactly one entry, one allowed
// disposition, one canonical path, a resolution for every duplicate,
// evidence/reason, activation condition, owner, and rollback value; no-change
// entries use `no rollback applies`, and incomplete official-family coverage
// marks the handover incomplete."
//
// Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 13.1, 13.2, 13.3, 13.4;
// Design: Correctness Property 14.
//
// SCOPE NOTE (Lane D ownership, test-authoring only): this file writes only
// under tests/kiro-repo-guidance-setup/lane-d/**. It reads the frozen Lane D
// source (handover.ts) and shared contracts.ts. It mutates no source module,
// package.json, or results/. It performs no filesystem, network, command, or
// configuration side effects: the projections under test are pure functions
// over in-memory records, and the HandoverGenerator clock is injected.
//
// The one-to-one / bijection claim is proven over the two Lane D projections in
// handover.ts:
//   - buildCapabilityDispositionTable: audited artifacts/capabilities ->
//     Capability_Disposition_Table entries.
//   - HandoverGeneratorService.generate: Capability_Disposition_Table entries ->
//     Handover_Record.artifactDispositions.
// fast-check drives >= 100 runs per property (numRuns: 200).

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  CAPABILITY_DISPOSITIONS,
  COMPLETE_REVIEW_STATEMENT,
  OWNER_DECISIONS,
  REQUIRED_SURFACE_VERSIONS,
  type ArtifactInventoryRecord,
  type ArtifactKind,
  type CapabilityDisposition,
  type CompatibilityRecord,
  type ConfigurationPrecedenceMap,
  type ConfigurationScope,
  type CoverageMatrix,
  type HandoverInput,
} from "../../contracts.ts";
import {
  buildCapabilityDispositionTable,
  CAPABILITY_DISPOSITION_NO_ROLLBACK,
  HandoverGeneratorService,
} from "../../handover.ts";

const REVIEW_DATE = "2026-08-25";

// Dispositions the projection treats as "no change" — their rollback value must
// collapse to the literal "no rollback applies".
const NO_CHANGE_DISPOSITIONS = new Set<CapabilityDisposition>([
  "retain",
  "observe",
  "defer",
  "exclude",
]);

// Only project-local scopes are used so the projection never derives an
// approval boundary that would require extra evidence; the mapping itself is
// what Property 14 constrains.
const SAFE_SCOPES: readonly ConfigurationScope[] = ["project", "manual"];

// Kinds that do not attract a synthesized approval boundary in the projection,
// keeping generated artifacts individually valid so the bijection can be
// observed without unrelated schema blockers.
const NEUTRAL_KINDS: readonly ArtifactKind[] = [
  "Kiro_Skill",
  "Steering_File",
  "Specification",
  "Ignore_Configuration",
  "Relevant_Setting",
  "Tool_Surface",
];

// -- Generators --------------------------------------------------------------

const dispositionArb: fc.Arbitrary<CapabilityDisposition> = fc.constantFrom(
  ...CAPABILITY_DISPOSITIONS,
);

const idPartArb = fc
  .string({ minLength: 1, maxLength: 8 })
  .map((raw) => raw.replace(/[^a-zA-Z0-9]/g, "") || "x")
  .filter((value) => value.length > 0);

function artifactArb(): fc.Arbitrary<ArtifactInventoryRecord> {
  return fc
    .record({
      id: idPartArb,
      kind: fc.constantFrom(...NEUTRAL_KINDS),
      disposition: dispositionArb,
      scope: fc.constantFrom(...SAFE_SCOPES),
      maintenanceRisk: fc.constantFrom(
        "low" as const,
        "medium" as const,
        "high" as const,
      ),
    })
    .map(({ id, kind, disposition, scope, maintenanceRisk }) => {
      const path = `.kiro/generated/${id}`;
      const record: ArtifactInventoryRecord = {
        artifactId: `artifact:${id}`,
        kind,
        path,
        inventoryStatus: "present and readable",
        owner: "repository owner",
        configurationScope: scope,
        activationCondition: "after exact scope, evidence, validation, owner, and rollback checks",
        canonicalSource: path,
        evidenceState: "Observed",
        disposition,
        maintenanceRisk,
        evidenceRefs: [`observed:${id}`],
        validationRunRefs: [],
        rollbackPath: "restore prior bytes and activation state",
      };
      return record;
    });
}

// A set of artifacts with pairwise-distinct ids (the natural bijection domain).
function distinctArtifactsArb(): fc.Arbitrary<readonly ArtifactInventoryRecord[]> {
  return fc
    .uniqueArray(artifactArb(), {
      minLength: 1,
      maxLength: 8,
      selector: (record) => record.artifactId,
    });
}

// -- Fixed handover scaffolding (Lane A/B/C inputs the handover requires) -----

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

function coverage(complete: boolean): CoverageMatrix {
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

function handoverInputFor(
  artifacts: readonly ArtifactInventoryRecord[],
  complete: boolean,
): HandoverInput {
  const tableResult = buildCapabilityDispositionTable({ artifacts });
  if (tableResult.status !== "pass") {
    throw new Error(`disposition table did not pass: ${tableResult.blockers.join("; ")}`);
  }
  return {
    reviewDateUtc: REVIEW_DATE,
    coverageMatrix: coverage(complete),
    exclusionRegister: { entries: [] },
    officialFamilyStatuses: complete
      ? ["Configuration: reviewed"]
      : ["Configuration: reviewed", "Hooks: incomplete pending exact schema validation"],
    compatibilityRecords: compatibilityRecords(),
    precedenceMap: precedenceMap(),
    dispositionTable: tableResult.output,
    ownerDecisions: OWNER_DECISIONS,
    validationRuns: [],
    knownGaps: [],
    rollbackRecords: [],
  };
}

// ---------------------------------------------------------------------------

describe("Property 14: disposition and handover projections are one-to-one", () => {
  it("projects exactly one disposition entry per audited artifact (bijection, no duplicates, no drops)", () => {
    fc.assert(
      fc.property(distinctArtifactsArb(), (artifacts) => {
        const result = buildCapabilityDispositionTable({ artifacts });
        expect(result.status).toBe("pass");
        if (result.status !== "pass") return;

        // No drops, no duplicates: exactly one entry per audited artifact.
        expect(result.output.entries).toHaveLength(artifacts.length);

        const domainIds = artifacts.map((a) => a.artifactId).sort();
        const rangeIds = result.output.entries.map((e) => e.capabilityId).sort();
        // Bijection on identifiers: domain and range coincide, one-to-one.
        expect(rangeIds).toEqual(domainIds);
        expect(new Set(rangeIds).size).toBe(rangeIds.length);
      }),
      { numRuns: 200 },
    );
  });

  it("gives every entry one allowed disposition, one canonical path, evidence/reason, activation, owner, and a rollback value", () => {
    fc.assert(
      fc.property(distinctArtifactsArb(), (artifacts) => {
        const result = buildCapabilityDispositionTable({ artifacts });
        expect(result.status).toBe("pass");
        if (result.status !== "pass") return;

        const byId = new Map(artifacts.map((a) => [a.artifactId, a]));
        for (const entry of result.output.entries) {
          const source = byId.get(entry.capabilityId);
          expect(source).toBeDefined();
          if (!source) continue;

          // One allowed disposition (from the fixed enum).
          expect(CAPABILITY_DISPOSITIONS).toContain(entry.disposition);
          // One canonical path.
          expect(typeof entry.canonicalSource).toBe("string");
          expect(entry.canonicalSource.length).toBeGreaterThan(0);
          // Evidence and reason present.
          expect(entry.evidenceRefs.length).toBeGreaterThan(0);
          expect(entry.reason.length).toBeGreaterThan(0);
          // Activation condition and owner present.
          expect(entry.activationCondition.length).toBeGreaterThan(0);
          expect(entry.owner.length).toBeGreaterThan(0);
          // A rollback value is always present.
          expect(entry.rollbackPath.length).toBeGreaterThan(0);

          // No-change dispositions collapse to the literal no-rollback value.
          if (NO_CHANGE_DISPOSITIONS.has(source.disposition)) {
            expect(entry.rollbackPath).toBe(CAPABILITY_DISPOSITION_NO_ROLLBACK);
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  it("resolves duplicate artifacts fail-closed instead of dropping or double-counting them", () => {
    fc.assert(
      fc.property(artifactArb(), fc.integer({ min: 1, max: 4 }), (artifact, extras) => {
        const duplicated = [artifact, ...Array.from({ length: extras }, () => artifact)];
        const result = buildCapabilityDispositionTable({ artifacts: duplicated });

        // A duplicate id must be surfaced as a blocker, never silently merged.
        expect(result.status).toBe("blocked");
        if (result.status === "blocked") {
          expect(result.blockers.some((b) => /duplicate/i.test(b))).toBe(true);
        }
        // Even when blocked, the projection keeps at most one entry per id.
        const ids = result.output?.entries.map((e) => e.capabilityId) ?? [];
        expect(new Set(ids).size).toBe(ids.length);
      }),
      { numRuns: 200 },
    );
  });

  it("maps each disposition entry to exactly one handover artifact disposition (one-to-one onto)", () => {
    const generator = new HandoverGeneratorService({ now: () => new Date("2026-08-25T12:00:00.000Z") });
    fc.assert(
      fc.property(distinctArtifactsArb(), (artifacts) => {
        const input = handoverInputFor(artifacts, true);
        const result = generator.generate(input);
        expect(result.status).toBe("pass");
        if (result.status !== "pass") return;

        const dispositionIds = input.dispositionTable.entries.map((e) => e.capabilityId).sort();
        const handoverIds = result.output.artifactDispositions.map((d) => d.artifactId).sort();

        // Exactly one handover entry per disposition entry: no drops, no dups.
        expect(result.output.artifactDispositions).toHaveLength(input.dispositionTable.entries.length);
        expect(handoverIds).toEqual(dispositionIds);
        expect(new Set(handoverIds).size).toBe(handoverIds.length);

        // Each handover entry carries the required fields and one canonical path.
        for (const d of result.output.artifactDispositions) {
          expect(d.canonicalPath.length).toBeGreaterThan(0);
          expect(d.evidenceRefs.length).toBeGreaterThan(0);
          expect(d.reason.length).toBeGreaterThan(0);
          expect(d.activationCondition.length).toBeGreaterThan(0);
          expect(d.owner.length).toBeGreaterThan(0);
          expect(d.rollbackPath.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("marks the handover incomplete when official-family coverage is incomplete", () => {
    const generator = new HandoverGeneratorService({ now: () => new Date("2026-08-25T12:00:00.000Z") });
    fc.assert(
      fc.property(distinctArtifactsArb(), (artifacts) => {
        const input = handoverInputFor(artifacts, false);
        const result = generator.generate(input);

        // Incomplete coverage never yields a clean pass.
        expect(result.status).not.toBe("pass");
        expect(result.output?.completeReviewStatement).toContain("Review incomplete:");

        // The one-to-one projection still holds on the incomplete record.
        const dispositionIds = input.dispositionTable.entries.map((e) => e.capabilityId).sort();
        const handoverIds = (result.output?.artifactDispositions ?? []).map((d) => d.artifactId).sort();
        expect(handoverIds).toEqual(dispositionIds);
      }),
      { numRuns: 200 },
    );
  });
});
