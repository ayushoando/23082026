// @vitest-environment node

// Feature: kiro-repo-guidance-setup, Property 12: Continuity evidence does not cross data boundaries
//
// This is a pure Lane C property test. It supplies generated metadata to the
// side-effect-free ContinuityEvaluator only; it does not read or write files,
// execute hooks, route to Crew, invoke LTM, or contact an external service.

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  CONTINUITY_CAPABILITY_KINDS,
  LTM_CAPTURE_COMMAND,
  evaluateContinuity,
  type ContinuityCapabilityInput,
  type CrewBehaviorFlags,
} from "../../continuity.ts";
import { OWNER_DECISIONS } from "../../contracts.ts";

const repositoryRoot = "D:\\23082026";

const safeTextArb = fc.stringMatching(/^[A-Za-z][A-Za-z0-9 _-]{0,20}$/);
const identifierSuffixArb = fc.stringMatching(/^[a-z][a-z0-9-]{2,12}$/);

const crewFlagsArb: fc.Arbitrary<Partial<CrewBehaviorFlags>> = fc.record({
  worktrees: fc.boolean(),
  concurrencyAboveOne: fc.boolean(),
  automaticRetries: fc.boolean(),
  automaticReplans: fc.boolean(),
  hiddenSpawning: fc.boolean(),
  autoApproval: fc.boolean(),
  usesOd04Exception: fc.boolean(),
});

interface ContinuityFixture {
  readonly capabilities: readonly ContinuityCapabilityInput[];
  readonly crewEvidenceRefs: readonly string[];
  readonly crewEvidenceMarker: string;
}

/**
 * Generate all six continuity families together, while keeping each family’s
 * validation references and evidence marker private to its own boundary.
 */
const continuityFixtureArb: fc.Arbitrary<ContinuityFixture> = fc
  .record({
    suffix: identifierSuffixArb,
    localRetention: safeTextArb,
    checkpointRetention: safeTextArb,
    cliRetention: safeTextArb,
    ltmRetention: safeTextArb,
    crewMemoryBehavior: safeTextArb,
    crewKnowledgeBehavior: safeTextArb,
    crewMemoryFlags: crewFlagsArb,
    crewKnowledgeFlags: crewFlagsArb,
  })
  .map(
    ({
      suffix,
      localRetention,
      checkpointRetention,
      cliRetention,
      ltmRetention,
      crewMemoryBehavior,
      crewKnowledgeBehavior,
      crewMemoryFlags,
      crewKnowledgeFlags,
    }): ContinuityFixture => {
      const validationRefs = (kind: string): readonly string[] => [
        `validation:continuity:${suffix}:${kind}:surface`,
        `validation:continuity:${suffix}:${kind}:rollback`,
      ];
      const crewMemoryRefs = validationRefs("crew-memory");
      const crewKnowledgeRefs = validationRefs("crew-knowledge");
      const crewEvidenceMarker = `crew-evidence:${suffix}`;

      const capabilities: readonly ContinuityCapabilityInput[] = [
        {
          kind: "local_compaction",
          retentionOrContinuityLimit: localRetention,
          validationRunRefs: validationRefs("local-compaction"),
          rollbackPath: `disable local compaction fixture ${suffix}`,
        },
        {
          kind: "checkpoints_rewind",
          retentionOrContinuityLimit: checkpointRetention,
          validationRunRefs: validationRefs("checkpoints-rewind"),
          rollbackPath: `restore checkpoint fixture ${suffix}`,
        },
        {
          kind: "cli_session_persistence",
          retentionOrContinuityLimit: cliRetention,
          validationRunRefs: validationRefs("cli-session"),
          rollbackPath: `remove CLI session fixture ${suffix}`,
        },
        {
          kind: "crew_memory",
          documentedBehavior: [crewEvidenceMarker, crewMemoryBehavior],
          validationRunRefs: crewMemoryRefs,
          crewBehaviorFlags: crewMemoryFlags,
          rollbackPath: `revoke Crew memory fixture ${suffix}`,
        },
        {
          kind: "crew_knowledge",
          documentedBehavior: [crewEvidenceMarker, crewKnowledgeBehavior],
          validationRunRefs: crewKnowledgeRefs,
          crewBehaviorFlags: crewKnowledgeFlags,
          rollbackPath: `revoke Crew knowledge fixture ${suffix}`,
        },
        {
          kind: "ltm_capture",
          // This is the required stubbed state. Crew evidence is present, but
          // no LTM validation reference is supplied and the capture remains
          // disabled regardless of the owner decision set.
          captureCommandIsStub: true,
          retentionOrContinuityLimit: ltmRetention,
          validationRunRefs: [],
          rollbackPath: `disable LTM fixture ${suffix}`,
        },
      ];

      return { capabilities, crewEvidenceRefs: [...crewMemoryRefs, ...crewKnowledgeRefs], crewEvidenceMarker };
    },
  );

const EXPECTED_BOUNDARIES = {
  local_compaction: {
    dataBoundary: "local_session",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Local_Repository_Surface"],
  },
  checkpoints_rewind: {
    dataBoundary: "local_artifact_or_session_state",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Local_Repository_Surface"],
  },
  cli_session_persistence: {
    dataBoundary: "cli_version_session_store",
    surfaces: ["CLI 2.x", "CLI 3.x"],
  },
  crew_memory: {
    dataBoundary: "cloud_crew_memory",
    surfaces: ["Cloud/Crew"],
  },
  crew_knowledge: {
    dataBoundary: "cloud_crew_knowledge",
    surfaces: ["Cloud/Crew"],
  },
  ltm_capture: {
    dataBoundary: "local_repository_capture",
    surfaces: ["Local_Repository_Surface"],
  },
} as const;

describe("Property 12: Continuity evidence does not cross data boundaries", () => {
  // **Validates: Requirements 9.4, 9.5, 9.6**

  it("keeps generated local, CLI, Crew, and stubbed LTM records isolated and fail-closed", () => {
    fc.assert(
      fc.property(continuityFixtureArb, (fixture) => {
        const inputSnapshot = JSON.stringify(fixture.capabilities);
        const result = evaluateContinuity({
          repositoryRoot,
          ownerDecisions: OWNER_DECISIONS,
          capabilities: fixture.capabilities,
          ltmCaptureIsStub: true,
        });
        const output = result.output;

        expect(output).toBeDefined();
        if (!output) throw new Error("continuity evaluation did not produce output");

        // The evaluator is pure: no input record is mutated and no external
        // routing or Cloud/Crew operation is attempted.
        expect(JSON.stringify(fixture.capabilities)).toBe(inputSnapshot);
        expect(output.externalRoutingAttempted).toBe(false);

        // Every required continuity capability is present exactly once and
        // remains a separate record, rather than being merged by evidence type.
        expect(output.continuityRecords).toHaveLength(CONTINUITY_CAPABILITY_KINDS.length);
        expect(output.continuityRecords.map((record) => record.kind)).toEqual([...CONTINUITY_CAPABILITY_KINDS]);
        expect(new Set(output.continuityRecords.map((record) => record.dataBoundary)).size).toBe(
          CONTINUITY_CAPABILITY_KINDS.length,
        );

        for (const kind of CONTINUITY_CAPABILITY_KINDS) {
          const record = output.continuityRecords.find((candidate) => candidate.kind === kind);
          expect(record).toBeDefined();
          if (!record) throw new Error(`missing continuity record for ${kind}`);

          const expected = EXPECTED_BOUNDARIES[kind];
          expect(record.dataBoundary).toBe(expected.dataBoundary);
          expect(record.surfaces).toEqual(expected.surfaces);
          expect(record.surfaceVersionApplicability.map((entry) => entry.surface)).toEqual(expected.surfaces);

          // A record can only describe its own boundary and never claims an
          // enabled/active disposition from another surface's evidence.
          expect(new Set(record.surfaces).size).toBe(record.surfaces.length);
          expect(["observe", "defer", "disable", "exclude"]).toContain(record.disposition);
          expect(record.disposition).not.toBe("retained");
          expect(record.disposition).not.toBe("apply");

          const disposition = output.dispositions.find((entry) => entry.capabilityId === record.capabilityId);
          expect(disposition).toBeDefined();
          expect(disposition?.disposition).toBe(record.disposition);
          expect(disposition?.surfaceVersionApplicability.map((entry) => entry.surface)).toEqual(expected.surfaces);
        }

        const localCompaction = output.continuityRecords.find((record) => record.kind === "local_compaction");
        const checkpoints = output.continuityRecords.find((record) => record.kind === "checkpoints_rewind");
        const cliSessions = output.continuityRecords.find((record) => record.kind === "cli_session_persistence");
        const crewMemory = output.continuityRecords.find((record) => record.kind === "crew_memory");
        const crewKnowledge = output.continuityRecords.find((record) => record.kind === "crew_knowledge");
        const ltm = output.continuityRecords.find((record) => record.kind === "ltm_capture");

        expect(localCompaction?.surfaces).not.toContain("Cloud/Crew");
        expect(checkpoints?.surfaces).not.toContain("Cloud/Crew");
        expect(cliSessions?.surfaces).not.toContain("Cloud/Crew");
        expect(crewMemory?.surfaces).toEqual(["Cloud/Crew"]);
        expect(crewKnowledge?.surfaces).toEqual(["Cloud/Crew"]);
        expect(ltm?.surfaces).toEqual(["Local_Repository_Surface"]);
        expect(ltm?.surfaces).not.toContain("Cloud/Crew");

        // Crew validation/documentation evidence stays attached to Crew records;
        // it is not copied into local LTM capture or used as its execution proof.
        expect(crewMemory?.validationRunRefs).toEqual(expect.arrayContaining(fixture.crewEvidenceRefs.slice(0, 2)));
        expect(crewKnowledge?.validationRunRefs).toEqual(expect.arrayContaining(fixture.crewEvidenceRefs.slice(2)));
        expect(ltm?.validationRunRefs).toEqual([]);
        expect(ltm?.documentedBehavior).not.toContain(fixture.crewEvidenceMarker);
        expect(ltm?.observedBehavior).not.toContain(fixture.crewEvidenceMarker);
        expect(ltm?.knownGapRefs).not.toEqual(expect.arrayContaining([...fixture.crewEvidenceRefs]));

        // Even with every owner decision supplied, the stubbed local capture is
        // disabled and carries its own local boundary, blocker, and known gap.
        expect(ltm?.dataBoundary).toBe("local_repository_capture");
        expect(ltm?.disposition).toBe("disable");
        expect(ltm?.status).toBe("disabled");
        expect(ltm?.evidenceState).toBe("Unverified");
        expect(ltm?.blockers.some((blocker) => blocker.includes(LTM_CAPTURE_COMMAND))).toBe(true);
        expect(ltm?.knownGapRefs.length).toBeGreaterThan(0);

        // No cross-boundary activation claim is emitted through either the
        // record projection or the disposition projection.
        expect(output.continuityRecords.every((record) => record.disposition !== "retained")).toBe(true);
        expect(output.dispositions.every((entry) => entry.disposition !== "retained")).toBe(true);
      }),
      { numRuns: 200 },
    );
  });
});
