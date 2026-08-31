// @vitest-environment node

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { assessCompatibility } from "../../compatibility.ts";
import {
  REQUIRED_SURFACE_VERSIONS,
  type CompatibilityInput,
  type CompatibilityRecord,
  type SurfaceVersion,
  type ValidationResult,
  type ValidationRun,
} from "../../contracts.ts";

// Cloud/Crew is never enabled-valid from this local matrix (it defers), so the
// "fresh passing exact-target run yields applicable" branch is asserted only for
// the six non-Crew targets. Crew isolation is covered by its own assertions below.
const NON_CREW_TARGET_INDEXES = REQUIRED_SURFACE_VERSIONS.map((target, index) => ({ target, index }))
  .filter(({ target }) => target.surface !== "Cloud/Crew")
  .map(({ index }) => index);

// A fresh exact-target run only satisfies the predicate when it actually passes:
// result "pass", blocker "none", and no unverified items. Every other shape is a
// non-passing run that must leave the target Unverified.
const NON_PASSING_RESULTS = ["fail", "blocked", "not_run", "partial"] as const satisfies readonly ValidationResult[];

const EVIDENCE_KINDS = [
  "historical document",
  "official URL",
  "registration entry",
  "historical validation run",
] as const;

function targetKey(target: SurfaceVersion): string {
  return `${target.surface}::${target.version}`;
}

function createValidationRun(
  validationId: string,
  target: SurfaceVersion,
  overrides: Partial<ValidationRun> = {},
): ValidationRun {
  return {
    validationId,
    action: "post-change target validation",
    repositoryRootOrActiveSurface:
      target.surface === "Local_Repository_Surface" ? "D:\\23082026" : target.surface,
    surface: target.surface,
    version: target.version,
    scope: "changed repository-local guidance artifact",
    executionLayer: "surface_validation",
    startedAtUtc: "2026-08-25T12:00:00Z",
    result: "pass",
    commandOrInteraction: "bounded exact-target validation",
    exitCodeOrOutcome: "exit 0",
    evidenceRefs: [validationId],
    unverifiedItems: [],
    blocker: "none",
    ...overrides,
  };
}

function createCandidate(
  target: SurfaceVersion,
  evidence: string,
  validationRunRefs: readonly string[],
): CompatibilityRecord {
  return {
    ...target,
    status: "applicable",
    documentedBehavior: [evidence],
    observedBehavior: [evidence],
    evidenceFreshness: "fresh",
    versionSensitiveClaim: true,
    validationAction: "run a post-change validation for the exact target",
    validationRunRefs,
    enablementStatus: "enabled-valid",
    unsupportedClaims: [],
    migrationConstraints: ["changed artifacts require a post-change validation"],
    rollbackPathRef: "rollback:property-5",
  };
}

function isExactRunRecorded(record: CompatibilityRecord, validationId: string): boolean {
  return record.validationRunRefs.includes(validationId);
}

describe("Property 5: Evidence is isolated by surface and freshness", () => {
  // Feature: kiro-repo-guidance-setup, Property 5: Evidence is isolated by surface and freshness
  // **Validates: Requirements 3.2, 4.2, 4.3, 4.4, 4.5, 4.6, 12.5, 12.8, 13.7**
  it("accepts only a fresh passing post-change Validation_Run for the exact surface and version", () => {
    fc.assert(
      fc.property(
        // The target draws from non-Crew surfaces: a passing exact-target run makes
        // those surfaces "applicable", whereas Cloud/Crew always defers regardless of
        // a local run and is asserted separately below.
        fc.constantFrom(...NON_CREW_TARGET_INDEXES),
        fc.integer({ min: 0, max: REQUIRED_SURFACE_VERSIONS.length - 1 }),
        fc.constantFrom(...EVIDENCE_KINDS),
        fc.boolean(),
        (targetIndex, evidenceIndex, evidenceKind, includeExactPostChangeRun) => {
          fc.pre(targetIndex !== evidenceIndex);

          const target = REQUIRED_SURFACE_VERSIONS[targetIndex];
          const mismatchedTarget = REQUIRED_SURFACE_VERSIONS[evidenceIndex];
          const mismatchedRun = createValidationRun("validation-mismatched", mismatchedTarget);
          const exactRun = createValidationRun("validation-exact", target);
          const historicalEvidence = `${evidenceKind} for ${targetKey(mismatchedTarget)}`;
          const result = assessCompatibility({
            records: [
              createCandidate(target, historicalEvidence, [mismatchedRun.validationId]),
            ],
            validationRuns: includeExactPostChangeRun ? [mismatchedRun, exactRun] : [mismatchedRun],
            requestedSurfaces: [...REQUIRED_SURFACE_VERSIONS],
          } satisfies CompatibilityInput);
          const targetRecord = result.output?.records.find(
            (record) => record.surface === target.surface && record.version === target.version,
          );

          expect(targetRecord).toBeDefined();
          expect(result.output?.transferViolations.some((violation) => violation.includes("cannot satisfy"))).toBe(
            true,
          );

          if (includeExactPostChangeRun) {
            expect(targetRecord?.status).toBe("applicable");
            expect(targetRecord?.evidenceFreshness).toBe("fresh");
            expect(isExactRunRecorded(targetRecord as CompatibilityRecord, exactRun.validationId)).toBe(true);
          } else {
            expect(targetRecord?.status).toBe("Unverified");
            expect(["blocked", "deferred"]).toContain(targetRecord?.enablementStatus);
            expect(isExactRunRecorded(targetRecord as CompatibilityRecord, mismatchedRun.validationId)).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: kiro-repo-guidance-setup, Property 5: Evidence is isolated by surface and freshness
  // **Validates: Requirements 3.2, 4.2, 4.3, 4.4, 4.5, 4.6, 12.5, 12.8, 13.7**
  it("requires the exact-target Validation_Run to pass; a non-passing fresh run leaves the target Unverified", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...NON_CREW_TARGET_INDEXES),
        fc.constantFrom(...NON_PASSING_RESULTS),
        fc.boolean(),
        fc.boolean(),
        (targetIndex, nonPassingResult, addUnverifiedItem, addBlocker) => {
          const target = REQUIRED_SURFACE_VERSIONS[targetIndex];
          // A run for the exact target that does not clear the passing predicate:
          // its result is not "pass", or it carries a blocker/unverified item.
          const nonPassingRun = createValidationRun("validation-nonpassing", target, {
            result: nonPassingResult,
            unverifiedItems: addUnverifiedItem ? ["exact-target artifact not confirmed"] : [],
            blocker: addBlocker ? "exact-target run did not clear the gate" : "none",
          });
          const result = assessCompatibility({
            records: [createCandidate(target, `evidence for ${targetKey(target)}`, [])],
            validationRuns: [nonPassingRun],
            requestedSurfaces: [...REQUIRED_SURFACE_VERSIONS],
          } satisfies CompatibilityInput);
          const targetRecord = result.output?.records.find(
            (record) => record.surface === target.surface && record.version === target.version,
          );

          expect(targetRecord).toBeDefined();
          // A changed artifact stays Unverified until a passing exact-target run exists.
          expect(targetRecord?.status).toBe("Unverified");
          expect(["blocked", "deferred"]).toContain(targetRecord?.enablementStatus);
          expect(
            targetRecord?.unsupportedClaims.some((claim) => claim.includes("did not pass")),
          ).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: kiro-repo-guidance-setup, Property 5: Evidence is isolated by surface and freshness
  // **Validates: Requirements 3.2, 4.2, 4.3, 4.4, 4.5, 4.6, 12.5, 12.8, 13.7**
  it("never transfers a candidate reference to a run for another surface/version or to an unavailable run", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: REQUIRED_SURFACE_VERSIONS.length - 1 }),
        fc.integer({ min: 0, max: REQUIRED_SURFACE_VERSIONS.length - 1 }),
        fc.boolean(),
        (targetIndex, otherIndex, referenceUnavailableRun) => {
          fc.pre(targetIndex !== otherIndex);

          const target = REQUIRED_SURFACE_VERSIONS[targetIndex];
          const otherTarget = REQUIRED_SURFACE_VERSIONS[otherIndex];
          // A passing run that belongs to a different surface/version.
          const foreignRun = createValidationRun("validation-foreign", otherTarget);
          // The candidate for `target` points at the foreign run and, optionally,
          // at a reference that has no matching run at all.
          const candidateRefs = referenceUnavailableRun
            ? [foreignRun.validationId, "validation-does-not-exist"]
            : [foreignRun.validationId];
          const result = assessCompatibility({
            records: [
              createCandidate(target, `evidence for ${targetKey(otherTarget)}`, candidateRefs),
            ],
            validationRuns: [foreignRun],
            requestedSurfaces: [...REQUIRED_SURFACE_VERSIONS],
          } satisfies CompatibilityInput);
          const targetRecord = result.output?.records.find(
            (record) => record.surface === target.surface && record.version === target.version,
          );
          const violations = result.output?.transferViolations ?? [];

          expect(targetRecord).toBeDefined();
          // The foreign run must never be recorded against the target.
          expect(isExactRunRecorded(targetRecord as CompatibilityRecord, foreignRun.validationId)).toBe(false);
          expect(targetRecord?.validationRunRefs).toEqual([]);
          expect(targetRecord?.status).toBe("Unverified");
          // The mismatch is reported as a transfer violation rather than silently applied.
          expect(violations.some((violation) => violation.includes("cannot satisfy"))).toBe(true);
          if (referenceUnavailableRun) {
            expect(
              violations.some((violation) => violation.includes("unavailable validation run")),
            ).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: kiro-repo-guidance-setup, Property 5: Evidence is isolated by surface and freshness
  // **Validates: Requirements 3.2, 4.2, 4.3, 4.4, 4.5, 4.6, 12.5, 12.8, 13.7**
  it("keeps Cloud/Crew deferred and never enabled-valid even with a fresh passing exact-target run", () => {
    const crewTarget = REQUIRED_SURFACE_VERSIONS.find((target) => target.surface === "Cloud/Crew");
    if (!crewTarget) throw new Error("Cloud/Crew target is missing from the frozen contract");

    fc.assert(
      fc.property(fc.boolean(), (includeExactPassingRun) => {
        const exactRun = createValidationRun("validation-crew-exact", crewTarget);
        const result = assessCompatibility({
          records: [createCandidate(crewTarget, `evidence for ${targetKey(crewTarget)}`, [])],
          validationRuns: includeExactPassingRun ? [exactRun] : [],
          requestedSurfaces: [...REQUIRED_SURFACE_VERSIONS],
        } satisfies CompatibilityInput);
        const crewRecord = result.output?.records.find((record) => record.surface === "Cloud/Crew");

        expect(crewRecord).toBeDefined();
        // A passing local run cannot make Cloud/Crew applicable or enabled-valid; it defers
        // pending a separate approved Crew compatibility design and validation.
        expect(crewRecord?.status).toBe("Unverified");
        expect(crewRecord?.enablementStatus).toBe("deferred");
        expect(crewRecord?.enablementStatus).not.toBe("enabled-valid");
      }),
      { numRuns: 100 },
    );
  });
});
