// @vitest-environment node

// Feature: kiro-repo-guidance-setup, Property 11: Incompatible Crew behavior is blocked
//
// This Lane C property test exercises only the side-effect-free continuity/Crew
// evaluator. It does not run Crew, invoke external routing, write repository
// artifacts, or mutate the generated input metadata.

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  CREW_INCOMPATIBLE_BEHAVIORS,
  evaluateContinuity,
  type ContinuityCapabilityInput,
  type CrewBehaviorFlags,
} from "../../continuity.ts";
import {
  OWNER_DECISIONS,
  type ApprovalStatus,
  type OwnerDecision,
  type UnresolvedStatus,
} from "../../contracts.ts";

const repositoryRoot = "D:\\23082026";
const crewKinds = ["crew_memory", "crew_knowledge", "crew_task_runner"] as const;
type CrewKind = (typeof crewKinds)[number];

const safeTextArb = fc.stringMatching(/^[A-Za-z][A-Za-z0-9 _-]{0,32}$/);

const approvalStatusArb = fc.constantFrom<ApprovalStatus>(
  "pending",
  "owner-approved",
  "owner-approved-conditional",
  "rejected",
  "expired",
);

const unresolvedStatusArb = fc.constantFrom<UnresolvedStatus | undefined>(
  undefined,
  "resolved",
  "unresolved",
);

const crewFlagsArb: fc.Arbitrary<CrewBehaviorFlags> = fc.record({
  worktrees: fc.boolean(),
  concurrencyAboveOne: fc.boolean(),
  automaticRetries: fc.boolean(),
  automaticReplans: fc.boolean(),
  hiddenSpawning: fc.boolean(),
  autoApproval: fc.boolean(),
  usesOd04Exception: fc.boolean(),
});

interface CrewCase {
  readonly kind: CrewKind;
  readonly incompatibleBehavior: keyof CrewBehaviorFlags;
  readonly documentedBehavior: readonly string[];
  readonly observedBehavior: readonly string[];
  readonly ownerDecisions: readonly OwnerDecision[];
  readonly crewBehaviorFlags: CrewBehaviorFlags;
}

/** Vary owner approval and documentation without changing the repository rule. */
const ownerDecisionsArb: fc.Arbitrary<readonly OwnerDecision[]> = fc.oneof(
  fc.constant<readonly OwnerDecision[]>([]),
  fc.record({ approvalStatus: approvalStatusArb, unresolvedStatus: unresolvedStatusArb }).map(
    ({ approvalStatus, unresolvedStatus }) =>
      OWNER_DECISIONS.map((decision) => {
        if (decision.decisionId !== "OD-04") return decision;
        if (unresolvedStatus === undefined) return { ...decision, approvalStatus };
        return { ...decision, approvalStatus, unresolvedStatus };
      }),
  ),
);

/** Every generated case forces one specific prohibited behavior to be present. */
const incompatibleCrewCaseArb: fc.Arbitrary<CrewCase> = fc
  .record({
    kind: fc.constantFrom<CrewKind>(...crewKinds),
    incompatibleBehavior: fc.constantFrom<keyof CrewBehaviorFlags>(...CREW_INCOMPATIBLE_BEHAVIORS),
    documentedBehavior: fc.array(safeTextArb, { maxLength: 3 }),
    observedBehavior: fc.array(safeTextArb, { maxLength: 3 }),
    ownerDecisions: ownerDecisionsArb,
    crewBehaviorFlags: crewFlagsArb,
  })
  .map((fixture) => ({
    ...fixture,
    crewBehaviorFlags: {
      ...fixture.crewBehaviorFlags,
      [fixture.incompatibleBehavior]: true,
    },
  }));

function buildInput(fixture: CrewCase): {
  readonly kind: CrewKind;
  readonly input: {
    readonly repositoryRoot: string;
    readonly ownerDecisions: readonly OwnerDecision[];
    readonly capabilities: readonly ContinuityCapabilityInput[];
  };
} {
  const capability: ContinuityCapabilityInput = {
    kind: fixture.kind,
    name: `generated ${fixture.kind}`,
    documentedBehavior: fixture.documentedBehavior,
    observedBehavior: fixture.observedBehavior,
    crewBehaviorFlags: fixture.crewBehaviorFlags,
    validationRunRefs: ["validation:crew:documentation-only"],
    ownerApprovalRef: "owner-approval:generated",
    rollbackPath: "disable Crew behavior and restore prior state",
  };

  return {
    kind: fixture.kind,
    input: {
      repositoryRoot,
      ownerDecisions: fixture.ownerDecisions,
      capabilities: [capability],
    },
  };
}

describe("Property 11: Incompatible Crew behavior is blocked", () => {
  // **Validates: Requirements 9.3, 10.6, 10.11, 14.5**

  it("defers or excludes every incompatible Crew behavior despite OD-04 approval or documentation", () => {
    fc.assert(
      fc.property(incompatibleCrewCaseArb, (fixture) => {
        const { input, kind } = buildInput(fixture);
        const inputSnapshot = JSON.stringify(input);
        const result = evaluateContinuity(input);
        const output = result.output;

        expect(output).toBeDefined();
        if (!output) throw new Error("continuity evaluation did not produce output");

        const record = output.records.find((candidate) => candidate.kind === kind);
        expect(record).toBeDefined();
        if (!record) throw new Error(`missing Crew record for ${kind}`);

        // The evaluator is pure and never routes to Cloud/Crew.
        expect(JSON.stringify(input)).toBe(inputSnapshot);
        expect(output.externalRoutingAttempted).toBe(false);

        // Every forced prohibited behavior is surfaced and remains inactive;
        // neither owner approval nor supplied documentation can make it valid.
        expect(record.crewBehaviorFlags?.[fixture.incompatibleBehavior]).toBe(true);
        expect(record.incompatibleBehaviors).toContain(fixture.incompatibleBehavior);
        expect(["defer", "exclude"]).toContain(record.disposition);
        expect(record.disposition).not.toBe("retain");
        expect(record.disposition).not.toBe("apply");
        expect(["deferred", "excluded"]).toContain(record.status);
        expect(record.blockers.length).toBeGreaterThan(0);
        expect(record.blockers.some((blocker) => blocker.includes("incompatible Crew behavior"))).toBe(true);

        // The policy conflict is retained in both aggregate evaluator output
        // and the capability disposition projection.
        expect(result.status).toBe("partial");
        expect(
          output.policyViolations.some(
            (violation) =>
              violation.includes("incompatible Crew behavior") &&
              violation.includes(fixture.incompatibleBehavior) &&
              violation.includes("OD-04"),
          ),
        ).toBe(true);
        expect(
          output.knownGaps.some(
            (gap) => gap.kind === "policy_conflict" && gap.disposition === record.disposition,
          ),
        ).toBe(true);

        const disposition = output.dispositions.find((entry) => entry.capabilityId === record.capabilityId);
        expect(disposition).toBeDefined();
        expect(disposition?.disposition).toBe(record.disposition);
        expect(disposition?.reason).toContain("incompatible Crew behavior");
        expect(disposition?.knownGapRefs.length).toBeGreaterThan(0);
      }),
      { numRuns: 200 },
    );
  });
});
