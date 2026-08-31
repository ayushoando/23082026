// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  assessCompatibility,
  compatibilityMatrix,
  OBSERVED_CLI_2_VERSION,
  OBSERVED_IDE_SESSION,
} from "../../compatibility.ts";
import {
  REQUIRED_SURFACE_VERSIONS,
  type CompatibilityInput,
  type CompatibilityRecord,
  type KiroSurface,
  type SurfaceVersion,
  type ValidationRun,
} from "../../contracts.ts";

function createInput(overrides: Partial<CompatibilityInput> = {}): CompatibilityInput {
  return {
    records: [],
    validationRuns: [],
    requestedSurfaces: [...REQUIRED_SURFACE_VERSIONS],
    ...overrides,
  };
}

function createValidationRun(
  validationId: string,
  surface: KiroSurface,
  version: string,
  overrides: Partial<ValidationRun> = {},
): ValidationRun {
  return {
    validationId,
    action: "validate compatibility target",
    repositoryRootOrActiveSurface:
      surface === "Local_Repository_Surface" ? "D:\\23082026" : surface,
    surface,
    version,
    scope: "repository-local compatibility artifact",
    executionLayer: "surface_validation",
    startedAtUtc: "2026-08-25T12:00:00Z",
    result: "pass",
    commandOrInteraction: "bounded target validation",
    exitCodeOrOutcome: "exit 0",
    evidenceRefs: [validationId],
    unverifiedItems: [],
    blocker: "none",
    ...overrides,
  };
}

function createRecord(
  target: SurfaceVersion,
  overrides: Partial<CompatibilityRecord> = {},
): CompatibilityRecord {
  return {
    ...target,
    status: "applicable",
    documentedBehavior: [],
    observedBehavior: [],
    evidenceFreshness: "fresh",
    versionSensitiveClaim: true,
    validationAction: "validate exact target",
    validationRunRefs: [],
    enablementStatus: "enabled-valid",
    unsupportedClaims: [],
    migrationConstraints: [],
    rollbackPathRef: "rollback:test",
    ...overrides,
  } as unknown as CompatibilityRecord;
}

describe("CompatibilityMatrix", () => {
  it("always projects exactly seven records and preserves the supplied baseline boundaries", () => {
    const result = compatibilityMatrix.assess(createInput());

    expect(result.status).toBe("partial");
    expect(result.output?.records).toHaveLength(7);
    expect(result.output?.records.map(({ surface, version }) => ({ surface, version }))).toEqual(
      REQUIRED_SURFACE_VERSIONS,
    );

    const records = result.output?.records ?? [];
    const ide = records.find((record) => record.surface === "IDE");
    const cli2 = records.find((record) => record.surface === "CLI 2.x");
    const cli3 = records.find((record) => record.surface === "CLI 3.x");
    const web = records.find((record) => record.surface === "Web");
    const mobile = records.find((record) => record.surface === "Mobile");
    const cloud = records.find((record) => record.surface === "Cloud/Crew");
    const local = records.find((record) => record.surface === "Local_Repository_Surface");

    expect(ide?.observedBehavior).toContain(OBSERVED_IDE_SESSION);
    expect(cli2?.observedBehavior).toContain(OBSERVED_CLI_2_VERSION);
    expect(cli3?.observedBehavior).not.toContain(OBSERVED_CLI_2_VERSION);
    expect(cli3?.status).toBe("Unverified");
    expect(web?.status).toBe("Unverified");
    expect(mobile?.status).toBe("Unverified");
    expect(cloud?.enablementStatus).toBe("deferred");
    expect(local?.observedBehavior.some((value) => value.includes("D:\\23082026"))).toBe(true);
    expect(records.every((record) => record.rollbackPathRef.length > 0)).toBe(true);
    expect(records.every((record) => record.versionSensitiveClaim)).toBe(true);
  });

  it("uses a fresh CLI 2.x run only for CLI 2.x, including the observed 2.19.1 version", () => {
    const result = assessCompatibility(
      createInput({
        validationRuns: [createValidationRun("validation-cli-2", "CLI 2.x", "2.19.1")],
      }),
    );

    const records = result.output?.records ?? [];
    const cli2 = records.find((record) => record.surface === "CLI 2.x");
    const cli3 = records.find((record) => record.surface === "CLI 3.x");

    expect(cli2?.status).toBe("applicable");
    expect(cli2?.evidenceFreshness).toBe("fresh");
    expect(cli2?.validationRunRefs).toEqual(["validation-cli-2"]);
    expect(cli3?.status).toBe("Unverified");
    expect(cli3?.validationRunRefs).toEqual([]);
    expect(cli3?.unsupportedClaims.some((claim) => claim.includes("2.19.1"))).toBe(true);
    expect(cli3?.enablementStatus).toBe("blocked");
  });

  it("does not transfer a CLI 2.x validation reference or observed claim to CLI 3.x", () => {
    const cli3Target = REQUIRED_SURFACE_VERSIONS.find((target) => target.surface === "CLI 3.x");
    if (!cli3Target) throw new Error("CLI 3.x target is missing from the frozen contract");

    const result = assessCompatibility(
      createInput({
        records: [
          createRecord(cli3Target, {
            observedBehavior: [OBSERVED_CLI_2_VERSION],
            evidenceFreshness: "fresh",
            validationRunRefs: ["validation-cli-2"],
          }),
        ],
        validationRuns: [createValidationRun("validation-cli-2", "CLI 2.x", "2.19.1")],
      }),
    );

    const cli3 = result.output?.records.find((record) => record.surface === "CLI 3.x");

    expect(result.output?.records).toHaveLength(7);
    expect(result.output?.transferViolations.some((value) => value.includes("cannot satisfy CLI 3.x"))).toBe(
      true,
    );
    expect(cli3?.observedBehavior).not.toContain(OBSERVED_CLI_2_VERSION);
    expect(cli3?.validationRunRefs).toEqual([]);
    expect(cli3?.status).toBe("Unverified");
    expect(cli3?.enablementStatus).toBe("blocked");
  });

  it("accepts a fresh CLI 3.x run only when its version remains in the 3.x target", () => {
    const result = assessCompatibility(
      createInput({
        validationRuns: [createValidationRun("validation-cli-3", "CLI 3.x", "3.0.0")],
      }),
    );

    const cli2 = result.output?.records.find((record) => record.surface === "CLI 2.x");
    const cli3 = result.output?.records.find((record) => record.surface === "CLI 3.x");

    expect(cli3?.status).toBe("applicable");
    expect(cli3?.evidenceFreshness).toBe("fresh");
    expect(cli3?.validationRunRefs).toEqual(["validation-cli-3"]);
    expect(cli2?.validationRunRefs).toEqual([]);
    expect(cli2?.observedBehavior).toContain(OBSERVED_CLI_2_VERSION);
  });
});
