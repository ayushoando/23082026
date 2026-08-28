// @vitest-environment node

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { assessCompatibility } from "../../compatibility.ts";
import {
  INITIAL_SKILL_CANDIDATES,
  OWNER_DECISIONS,
  OWNER_DECISION_IDS,
  REQUIRED_SURFACE_VERSIONS,
  type OwnerDecision,
} from "../../contracts.ts";
import { validateOwnerDecisions } from "../../owner-decisions.ts";

const EXPECTED_SKILL_CANDIDATES = [
  "repo-map",
  "graph-impact",
  "verify-and-gate",
  "fork-boundaries",
  "focss-css",
  "db-migrations",
] as const;

const REQUIRED_SEPARATE_CAPABILITIES = [
  "feature specification",
  "bugfix specification",
  "plans",
  "correctness",
  "analysis",
  "best practices",
  "native task graphs",
  "parallel waves",
  "Subagent DAGs",
  "review loops",
  "local compaction",
  "checkpoints/rewind",
  "CLI session persistence",
  "Crew memory",
  "Crew knowledge",
  "LTM capture",
] as const;

function targetKey(target: { readonly surface: string; readonly version: string }): string {
  return `${target.surface}::${target.version}`;
}

describe("Property 4: Fixed candidate and decision sets are exact", () => {
  // Feature: kiro-repo-guidance-setup, Property 4: Fixed candidate and decision sets are exact
  // **Validates: Requirements 2.6, 4.1, 9.1, 9.4, 10.1**
  it("keeps skills, surface records, distinct capability names, and decisions exact across inventory projections", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { maxLength: 24 }),
        fc.shuffledSubarray([...OWNER_DECISIONS] as OwnerDecision[], {
          minLength: OWNER_DECISIONS.length,
          maxLength: OWNER_DECISIONS.length,
        }),
        (unrelatedInventoryNames, shuffledDecisions) => {
          const compatibility = assessCompatibility({
            records: [],
            validationRuns: [],
            requestedSurfaces: [...REQUIRED_SURFACE_VERSIONS],
          });
          const ownerDecisionValidation = validateOwnerDecisions(shuffledDecisions);
          const inventoryProjection = [
            ...INITIAL_SKILL_CANDIDATES,
            ...REQUIRED_SEPARATE_CAPABILITIES,
            ...unrelatedInventoryNames,
          ];

          expect(INITIAL_SKILL_CANDIDATES).toEqual(EXPECTED_SKILL_CANDIDATES);
          expect(new Set(INITIAL_SKILL_CANDIDATES)).toHaveLength(EXPECTED_SKILL_CANDIDATES.length);
          expect(compatibility.output?.records.map(targetKey)).toEqual(
            REQUIRED_SURFACE_VERSIONS.map(targetKey),
          );
          expect(new Set(compatibility.output?.records.map(targetKey))).toHaveLength(
            REQUIRED_SURFACE_VERSIONS.length,
          );
          expect(new Set(REQUIRED_SEPARATE_CAPABILITIES)).toHaveLength(
            REQUIRED_SEPARATE_CAPABILITIES.length,
          );
          expect(new Set(inventoryProjection).size).toBeGreaterThanOrEqual(
            REQUIRED_SEPARATE_CAPABILITIES.length,
          );
          expect(ownerDecisionValidation.status).toBe("pass");
          expect(ownerDecisionValidation.output?.decisions.map((decision) => decision.decisionId).sort()).toEqual(
            [...OWNER_DECISION_IDS].sort(),
          );
          expect(new Set(ownerDecisionValidation.output?.decisions.map((decision) => decision.decisionId))).toHaveLength(
            OWNER_DECISION_IDS.length,
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("rejects every generated decision ledger that replaces one required decision with a duplicate", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: OWNER_DECISIONS.length - 1 }),
        fc.integer({ min: 0, max: OWNER_DECISIONS.length - 1 }),
        (missingIndex, duplicateIndex) => {
          fc.pre(missingIndex !== duplicateIndex);

          const malformedLedger: OwnerDecision[] = OWNER_DECISIONS.map((decision, index) =>
            index === missingIndex
              ? { ...decision, decisionId: OWNER_DECISIONS[duplicateIndex].decisionId }
              : decision,
          );
          const result = validateOwnerDecisions(malformedLedger);

          expect(result.status).toBe("blocked");
          expect(result.output?.valid).toBe(false);
          expect(result.blockers.some((blocker) => blocker.includes("is duplicated"))).toBe(true);
          expect(result.blockers.some((blocker) => blocker.includes("is missing"))).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
