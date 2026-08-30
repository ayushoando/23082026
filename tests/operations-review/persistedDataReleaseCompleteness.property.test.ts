// @vitest-environment node
//
// Feature: operations-deployment-backup-review
// Property 4: Persisted-data release and recovery records are complete.
//
// Validates: Requirements 2.2, 7.2, 7.3

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  extractVercelReview,
  type PersistedDataReleaseInput,
  type RepositorySource,
  type VercelExtractionSources,
} from "../../scripts/operations-review";

function repositorySource(path: string, content: string): RepositorySource {
  return {
    content,
    source: {
      path,
      locator: "generated persisted-data fixture",
      observedAt: "2026-01-01T00:00:00.000Z",
      contentDigest: `generated-${path}`,
    },
  };
}

function validVercelSources(): VercelExtractionSources {
  return {
    vercelConfig: repositorySource(
      "vercel.json",
      JSON.stringify({
        buildCommand: "pnpm run build",
        installCommand: "pnpm install",
        outputDirectory: ".next",
        framework: "nextjs",
        regions: ["sin1"],
      }),
    ),
    packageManifest: repositorySource(
      "package.json",
      JSON.stringify({
        scripts: {
          "vercel:prod": "node scripts/run-ops.mjs vercel:prod",
          "vercel:preview": "node scripts/run-ops.mjs vercel:preview",
        },
      }),
    ),
    operationsRouter: repositorySource(
      "scripts/run-ops.mjs",
      [
        '"vercel:prod": () => execSync("vercel --prod --yes")',
        '"vercel:preview": () => execSync("vercel --yes")',
      ].join("\n"),
    ),
    runbook: repositorySource(
      "OPERATIONS_RUNBOOK.md",
      [
        "Order: **migrations → seed → code.**",
        "Smoke in browser: /ooplanner rail, place, save, reload",
        "§4 Rollback: revert newest-first before Instant Rollback",
      ].join("\n"),
    ),
  };
}

const REQUIRED_FIELDS = [
  "databaseOwners",
  "migrationImpact",
  "seedImpact",
  "backupPrerequisite",
  "compatibilityHazard",
  "codeReleaseOrder",
  "rollbackPath",
] as const;

type FieldName = (typeof REQUIRED_FIELDS)[number];

const databaseSurfaceArb = fc.constantFrom(
  "products-database" as const,
  "admin-database" as const,
);

const completePersistedDataArb: fc.Arbitrary<PersistedDataReleaseInput> = fc.record({
  databaseOwners: fc
    .uniqueArray(databaseSurfaceArb, { minLength: 1, maxLength: 2 })
    .map((arr) => arr as readonly ("products-database" | "admin-database")[]),
  migrationImpact: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{2,40}$/),
  seedImpact: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{2,40}$/),
  backupPrerequisite: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{2,40}$/),
  compatibilityHazard: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{2,40}$/),
  codeReleaseOrder: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{2,40}$/),
  rollbackPath: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{2,40}$/),
});

/**
 * Generate a PersistedDataReleaseInput with exactly the specified fields
 * removed (set to undefined or empty).
 */
function removeField(
  complete: PersistedDataReleaseInput,
  field: FieldName,
): PersistedDataReleaseInput {
  const copy = { ...complete };
  if (field === "databaseOwners") {
    return { ...copy, databaseOwners: [] };
  }
  return { ...copy, [field]: undefined };
}

const GAP_ID_BY_FIELD: Record<FieldName, string> = {
  databaseOwners: "vercel.persisted-data.owner.missing",
  migrationImpact: "vercel.persisted-data.migration-impact.missing",
  seedImpact: "vercel.persisted-data.seed-impact.missing",
  backupPrerequisite: "vercel.persisted-data.backup-prerequisite.missing",
  compatibilityHazard: "vercel.persisted-data.compatibility-hazard.missing",
  codeReleaseOrder: "vercel.persisted-data.code-release-order.missing",
  rollbackPath: "vercel.persisted-data.rollback-path.missing",
};

describe("Property 4: Persisted-data release and recovery records are complete", () => {
  const sources = validVercelSources();

  it("produces a complete persisted-data impact when all fields are supplied", () => {
    fc.assert(
      fc.property(completePersistedDataArb, (input) => {
        const result = extractVercelReview(sources, input);

        // No gaps when all fields are present
        expect(result.gaps).toHaveLength(0);

        // The release decision includes a fully populated persistedDataImpact
        const impact = result.releaseDecision.persistedDataImpact;
        expect(impact).toBeDefined();
        expect(impact!.databaseOwners.length).toBeGreaterThan(0);
        expect(impact!.migrationImpact.trim()).not.toBe("");
        expect(impact!.seedImpact.trim()).not.toBe("");
        expect(impact!.backupPrerequisite.trim()).not.toBe("");
        expect(impact!.compatibilityHazard.trim()).not.toBe("");
        expect(impact!.codeReleaseOrder.trim()).not.toBe("");
      }),
      { numRuns: 100 },
    );
  });

  it("emits an attributable gap for each missing persisted-data field", () => {
    const fieldArb = fc.constantFrom(...REQUIRED_FIELDS);

    fc.assert(
      fc.property(completePersistedDataArb, fieldArb, (complete, missingField) => {
        const incomplete = removeField(complete, missingField);
        const result = extractVercelReview(sources, incomplete);

        // There must be at least one gap matching the removed field
        const matchingGap = result.gaps.find(
          (g) => g.id === GAP_ID_BY_FIELD[missingField],
        );
        expect(matchingGap).toBeDefined();
        expect(matchingGap!.surface).toBe("vercel-application");
        expect(matchingGap!.sourcePaths.length).toBeGreaterThan(0);
        expect(matchingGap!.recommendedFollowUp.trim()).not.toBe("");

        // The release decision must NOT have a persistedDataImpact when incomplete
        expect(result.releaseDecision.persistedDataImpact).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  it("requires a rollback procedure that covers schema-changing releases (Req 7.2)", () => {
    fc.assert(
      fc.property(completePersistedDataArb, (input) => {
        const result = extractVercelReview(sources, input);

        // When complete, the rollback procedure is taken from the input
        const procedure = result.releaseDecision.rollbackOrRecoveryProcedure;
        expect(procedure.trim()).not.toBe("");

        // Verification evidence must include rollback readiness
        expect(result.releaseDecision.expectedVerificationEvidence).toEqual(
          expect.arrayContaining([
            expect.stringContaining("Rollback"),
          ]),
        );
      }),
      { numRuns: 100 },
    );
  });

  it("requires backup prerequisite evidence before recovery can be marked complete (Req 7.3)", () => {
    fc.assert(
      fc.property(completePersistedDataArb, (complete) => {
        const withoutBackup = removeField(complete, "backupPrerequisite");
        const result = extractVercelReview(sources, withoutBackup);

        // A missing backup prerequisite produces a critical/P0 gap
        const backupGap = result.gaps.find(
          (g) => g.id === "vercel.persisted-data.backup-prerequisite.missing",
        );
        expect(backupGap).toBeDefined();
        expect(backupGap!.priority).toBe("P0");
        expect(backupGap!.risk).toBe("critical");

        // The record cannot be complete without backup prerequisite
        expect(result.releaseDecision.persistedDataImpact).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });
});
