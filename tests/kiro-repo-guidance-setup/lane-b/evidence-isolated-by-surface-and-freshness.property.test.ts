// @vitest-environment node

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { assessCompatibility } from "../../../scripts/kiro-repo-guidance-setup/compatibility.ts";
import {
  REQUIRED_SURFACE_VERSIONS,
  type CompatibilityInput,
  type CompatibilityRecord,
  type KiroSurface,
  type SurfaceVersion,
  type ValidationRun,
} from "../../../scripts/kiro-repo-guidance-setup/contracts.ts";

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
        fc.integer({ min: 0, max: REQUIRED_SURFACE_VERSIONS.length - 1 }),
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
            expect(targetRecord?.enablementStatus).toBe("blocked");
            expect(isExactRunRecorded(targetRecord as CompatibilityRecord, mismatchedRun.validationId)).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
