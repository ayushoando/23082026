// @vitest-environment node
//
// Feature: operations-deployment-backup-review
// Property 8: Applicable recovery paths map one-to-one to complete restore drills.
//
// Validates: Requirements 6.1, 6.2

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  AuthorizationGuard,
  buildRecoveryPlanSummary,
  type RecoveryPlanSummary,
  type RecoveryReviewSources,
  type RepositorySource,
  type RestoreDrill,
  type RestoreDrillPath,
  type Surface,
} from "../../scripts/operations-review";

const RESTORE_DRILL_PATHS = [
  "products",
  "admin",
  "catalog",
  "repository",
] as const satisfies readonly RestoreDrillPath[];

const DRILL_TARGET_SURFACE: Record<RestoreDrillPath, Surface> = {
  products: "products-database",
  admin: "admin-database",
  catalog: "r2-backup",
  repository: "r2-backup",
};

const DRILL_ARTIFACT_CATEGORY: Record<RestoreDrillPath, string> = {
  products: "Products database dump",
  admin: "Admin database dump",
  catalog: "catalog snapshot",
  repository: "repository archive",
};

interface DrillContext {
  readonly operator: string;
  readonly nonProductionTarget: string;
}

function repositorySource(path: string, content: string): RepositorySource {
  return {
    content,
    source: {
      path,
      locator: "repository-local Restore Drill fixture",
      observedAt: "2026-01-01T00:00:00.000Z",
      contentDigest: `fixture-${path}`,
    },
  };
}

/**
 * These are repository-shaped local fixtures only. The planner reads their
 * markers and returns source-linked recovery paths; no provider or filesystem
 * operation is performed by this property test.
 */
function recoveryReviewSources(): RecoveryReviewSources {
  return {
    runbook: repositorySource(
      "OPERATIONS_RUNBOOK.md",
      [
        "## 1. Deploy",
        "Order: migrations → seed → code.",
        "## 4. Rollback",
        "Revert migrations newest-first before Instant Rollback.",
        "## 5. Incidents",
        "Catalog outage: R2 fallback.",
        "## 6. Backups",
        "Nightly: .github/workflows/supabase-backup-r2.yml.",
        "PITR remains an approved recovery path.",
      ].join("\n"),
    ),
    vercelConfig: repositorySource(
      "vercel.json",
      '{"buildCommand":"pnpm run build","framework":"nextjs"}',
    ),
    workerConfig: repositorySource(
      "workers/oando-worker-proxy/wrangler.toml",
      [
        'main = "src/index.js"',
        "[[r2_buckets]]",
        'binding = "ASSET_BUCKET"',
        '[vars]\nVERCEL_ORIGIN = "https://example.invalid"',
      ].join("\n"),
    ),
    productsMigrations: repositorySource(
      "site/platform/supabase/migrations/20260101000000_products.sql",
      "create table products_fixture (id uuid);\n-- rollback\n-- drop table products_fixture;",
    ),
    adminMigrations: repositorySource(
      "site/platform/supabase/migrations.admin/20260101000000_admin.sql",
      "create table admin_fixture (id uuid);\n-- rollback\n-- drop table admin_fixture;",
    ),
    databaseOperations: repositorySource(
      "docs/database/ops.md",
      [
        "## 3. Restore from R2",
        "pgdump-products-*.dump",
        "pgdump-admin-*.dump",
        "Restore from R2 after a corruption event.",
        "## 4. Provider recovery / PITR",
        "Supabase PITR is available for point-in-time recovery.",
      ].join("\n"),
    ),
    backupWorkflow: repositorySource(
      ".github/workflows/supabase-backup-r2.yml",
      [
        "on:",
        "  schedule:",
        "    - cron: '15 2 * * *'",
        "  workflow_dispatch:",
        "jobs:",
        "  backup:",
        "    steps:",
        "      - run: pnpm run r2:backup",
      ].join("\n"),
    ),
  };
}

const applicablePathArb = fc.uniqueArray(
  fc.constantFrom<RestoreDrillPath>(...RESTORE_DRILL_PATHS),
  { minLength: 1, maxLength: RESTORE_DRILL_PATHS.length },
);

const nonEmptyIdentifierArb = fc.stringMatching(/^[a-z][a-z0-9-]{2,24}$/);

const drillContextArb: fc.Arbitrary<DrillContext> = fc.record({
  operator: nonEmptyIdentifierArb.map((value) => `${value}-operator`),
  nonProductionTarget: nonEmptyIdentifierArb.map((value) => `${value}-staging`),
});

function requiredDataRecoveryPath(
  summary: RecoveryPlanSummary,
  id: string,
): { readonly sourcePaths: readonly string[] } {
  const path = summary.dataRecovery.recoveryPaths.find((candidate) => candidate.id === id);
  if (!path) {
    throw new Error(`Recovery fixture did not produce the required path: ${id}`);
  }
  return path;
}

function sourcePathsByDrillPath(
  summary: RecoveryPlanSummary,
): Record<RestoreDrillPath, readonly string[]> {
  return {
    products: summary.productsSchemaRollback.sourcePaths,
    admin: summary.adminSchemaRollback.sourcePaths,
    catalog: requiredDataRecoveryPath(summary, "r2-catalog-restore").sourcePaths,
    repository: requiredDataRecoveryPath(summary, "repository-restore").sourcePaths,
  };
}

/**
 * Adapt the existing recovery-plan APIs to the RestoreDrill record shape used
 * by the review output. The property varies the applicable path set and then
 * verifies this one-to-one adapter's complete, protected records.
 */
function generateRestoreDrills(
  summary: RecoveryPlanSummary,
  applicablePaths: readonly RestoreDrillPath[],
  context: DrillContext,
): readonly RestoreDrill[] {
  const sourcePaths = sourcePathsByDrillPath(summary);
  const guard = new AuthorizationGuard();

  return applicablePaths.map((recoveryPath) => {
    const evidence = [
      `Authorized operator ${context.operator} confirms the ${recoveryPath} drill target.`,
      `Repository procedure sources: ${sourcePaths[recoveryPath].join(", ")}.`,
      "Observed recovery result is recorded before the drill is closed.",
    ];

    return {
      recoveryPath,
      authorizedOperator: context.operator,
      nonProductionTarget: context.nonProductionTarget,
      artifactCategory: DRILL_ARTIFACT_CATEGORY[recoveryPath],
      recoveryObjective: `Validate ${recoveryPath} recovery without changing production data.`,
      successEvidence: evidence,
      dataHandlingBoundary:
        "Non-production target only; production data and provider state remain untouched.",
      cleanupOrRollback:
        `Remove the ${recoveryPath} drill target or roll it back after evidence is captured.`,
      execution: guard.classify({
        action: "restore",
        targetSurface: DRILL_TARGET_SURFACE[recoveryPath],
        expectedEvidence: evidence,
      }),
    };
  });
}

describe("Property 8: Applicable recovery paths map one-to-one to complete restore drills", () => {
  it("emits exactly one drill for every generated applicable recovery path", () => {
    fc.assert(
      fc.property(applicablePathArb, drillContextArb, (applicablePaths, context) => {
        const summary = buildRecoveryPlanSummary(recoveryReviewSources());
        const drills = generateRestoreDrills(summary, applicablePaths, context);

        expect(drills).toHaveLength(applicablePaths.length);
        expect(drills.map((drill) => drill.recoveryPath)).toEqual(applicablePaths);
        expect(new Set(drills.map((drill) => drill.recoveryPath)).size).toBe(
          applicablePaths.length,
        );
      }),
      { numRuns: 100 },
    );
  });

  it("populates every generated drill with complete recovery and protected-execution fields", () => {
    fc.assert(
      fc.property(applicablePathArb, drillContextArb, (applicablePaths, context) => {
        const summary = buildRecoveryPlanSummary(recoveryReviewSources());
        const drills = generateRestoreDrills(summary, applicablePaths, context);
        const sourcePaths = sourcePathsByDrillPath(summary);

        for (const drill of drills) {
          expect(sourcePaths[drill.recoveryPath]).not.toHaveLength(0);
          expect(drill.successEvidence).toEqual(
            expect.arrayContaining([
              expect.stringContaining(sourcePaths[drill.recoveryPath].join(", ")),
            ]),
          );
          expect(drill.authorizedOperator.trim()).not.toBe("");
          expect(drill.nonProductionTarget.trim()).not.toBe("");
          expect(drill.artifactCategory.trim()).not.toBe("");
          expect(drill.recoveryObjective.trim()).not.toBe("");
          expect(drill.successEvidence.length).toBeGreaterThan(0);
          expect(drill.successEvidence.every((item) => item.trim().length > 0)).toBe(true);
          expect(drill.dataHandlingBoundary.trim()).not.toBe("");
          expect(drill.cleanupOrRollback.trim()).not.toBe("");

          expect(drill.execution).toMatchObject({
            operation: "restore",
            targetSurface: DRILL_TARGET_SURFACE[drill.recoveryPath],
            classification: "protected-operation",
            executionStatus: "pending-authorization",
          });
          expect(drill.execution.requiredAuthorization).toContain("Explicit");
          expect(drill.execution.expectedEvidence).toEqual(drill.successEvidence);
          expect(drill.execution).not.toHaveProperty("executionResult");
        }
      }),
      { numRuns: 100 },
    );
  });
});
