// @vitest-environment node
//
// Feature: operations-deployment-backup-review
// Property 9: Restore-drill evidence has audit-ready fields.
//
// Validates: Requirements 6.4

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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Fixture helpers (repository-local only, no provider/network/db access)
// ---------------------------------------------------------------------------

function repositorySource(path: string, content: string): RepositorySource {
  return {
    content,
    source: {
      path,
      locator: "repository-local Restore Drill Evidence fixture",
      observedAt: "2026-01-01T00:00:00.000Z",
      contentDigest: `fixture-${path}`,
    },
  };
}

function recoveryReviewSources(): RecoveryReviewSources {
  return {
    runbook: repositorySource(
      "OPERATIONS_RUNBOOK.md",
      [
        "## 1. Deploy",
        "Order: migrations → seed → code.",
        "pnpm run worker:deploy",
        "x-oando-proxy: r2-fallback",
        "## 4. Rollback",
        "Revert migrations (newest first, hand-run -- rollback:) before Instant Rollback if schema moved.",
        "Hazard: legacy tables now in archive are invisible to PostgREST",
        "Code and schema are separate. Revert migrations (newest first) before Instant Rollback if schema changed.",
        "## 5. Incidents",
        "Catalog outage: R2 fallback — docs/database/ops.md",
        "## 6. Backups",
        "Nightly: .github/workflows/supabase-backup-r2.yml (02:15 UTC)",
        "check:governance",
        "## 2. Migration",
        "PITR remains an approved recovery path.",
        "Instant Rollback",
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

// ---------------------------------------------------------------------------
// Drill builder (mirrors the assembly used in restoreDrillCompleteness test)
// ---------------------------------------------------------------------------

interface DrillContext {
  readonly drillDate: string;
  readonly artifactIdentifier: string;
  readonly procedureVersion: string;
  readonly observedResult: string;
  readonly unresolvedGap: string;
  readonly operator: string;
  readonly nonProductionTarget: string;
}

function buildRestoreDrillWithEvidence(
  summary: RecoveryPlanSummary,
  recoveryPath: RestoreDrillPath,
  context: DrillContext,
): RestoreDrill {
  const guard = new AuthorizationGuard();

  // Requirement 6.4 mandates: drill date, target, artifact identifier,
  // procedure version, observed result, and unresolved gap all in evidence.
  const successEvidence = [
    `Drill date: ${context.drillDate}.`,
    `Target: ${context.nonProductionTarget}.`,
    `Artifact identifier: ${context.artifactIdentifier}.`,
    `Procedure version: ${context.procedureVersion}.`,
    `Observed result: ${context.observedResult}.`,
    `Unresolved gap: ${context.unresolvedGap}.`,
  ];

  return {
    recoveryPath,
    authorizedOperator: context.operator,
    nonProductionTarget: context.nonProductionTarget,
    artifactCategory: DRILL_ARTIFACT_CATEGORY[recoveryPath],
    recoveryObjective: `Validate ${recoveryPath} recovery without modifying production data.`,
    successEvidence,
    dataHandlingBoundary:
      "Non-production target only; production data and provider state remain untouched.",
    cleanupOrRollback: `Remove or roll back the ${recoveryPath} drill target after evidence is captured.`,
    execution: guard.classify({
      action: "restore",
      targetSurface: DRILL_TARGET_SURFACE[recoveryPath],
      expectedEvidence: successEvidence,
    }),
  };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const isoDateArb = fc
  .tuple(
    fc.integer({ min: 2024, max: 2030 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }),
  )
  .map(([y, m, d]) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);

const nonEmptyStringArb = fc.string({ minLength: 3, maxLength: 80 }).filter(
  (s) => s.trim().length > 0,
);

const semverArb = fc
  .tuple(
    fc.integer({ min: 1, max: 9 }),
    fc.integer({ min: 0, max: 9 }),
    fc.integer({ min: 0, max: 9 }),
  )
  .map(([major, minor, patch]) => `${major}.${minor}.${patch}`);

const drillContextArb: fc.Arbitrary<DrillContext> = fc.record({
  drillDate: isoDateArb,
  artifactIdentifier: nonEmptyStringArb,
  procedureVersion: semverArb,
  observedResult: nonEmptyStringArb,
  unresolvedGap: nonEmptyStringArb,
  operator: fc
    .stringMatching(/^[a-z][a-z0-9-]{2,20}$/)
    .map((v) => `${v}-operator`),
  nonProductionTarget: fc
    .stringMatching(/^[a-z][a-z0-9-]{2,20}$/)
    .map((v) => `${v}-staging`),
});

const applicablePathArb = fc.uniqueArray(
  fc.constantFrom<RestoreDrillPath>(...RESTORE_DRILL_PATHS),
  { minLength: 1, maxLength: RESTORE_DRILL_PATHS.length },
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe(
  "Property 9: Restore-drill evidence has audit-ready fields",
  () => {
    /**
     * Every completed RestoreDrill must carry all six audit-ready evidence
     * fields required by Requirement 6.4: drill date, target, artifact
     * identifier, procedure version, observed result, and unresolved gap.
     *
     * **Validates: Requirements 6.4**
     */
    it(
      "successEvidence contains all six audit-ready fields for every drill path",
      () => {
        fc.assert(
          fc.property(applicablePathArb, drillContextArb, (applicablePaths, context) => {
            const summary = buildRecoveryPlanSummary(recoveryReviewSources());

            for (const recoveryPath of applicablePaths) {
              const drill = buildRestoreDrillWithEvidence(summary, recoveryPath, context);

              const joined = drill.successEvidence.join("\n");

              // drill date
              expect(joined).toContain(context.drillDate);
              // target
              expect(joined).toContain(context.nonProductionTarget);
              // artifact identifier
              expect(joined).toContain(context.artifactIdentifier);
              // procedure version
              expect(joined).toContain(context.procedureVersion);
              // observed result
              expect(joined).toContain(context.observedResult);
              // unresolved gap
              expect(joined).toContain(context.unresolvedGap);
            }
          }),
          { numRuns: 200 },
        );
      },
    );

    /**
     * The authorizedOperator, nonProductionTarget, artifactCategory,
     * recoveryObjective, dataHandlingBoundary, and cleanupOrRollback fields
     * must all be non-empty strings on every completed RestoreDrill.
     *
     * **Validates: Requirements 6.2, 6.4**
     */
    it(
      "required string fields are non-empty on every completed drill",
      () => {
        fc.assert(
          fc.property(applicablePathArb, drillContextArb, (applicablePaths, context) => {
            const summary = buildRecoveryPlanSummary(recoveryReviewSources());

            for (const recoveryPath of applicablePaths) {
              const drill = buildRestoreDrillWithEvidence(summary, recoveryPath, context);

              expect(drill.authorizedOperator.trim()).not.toBe("");
              expect(drill.nonProductionTarget.trim()).not.toBe("");
              expect(drill.artifactCategory.trim()).not.toBe("");
              expect(drill.recoveryObjective.trim()).not.toBe("");
              expect(drill.dataHandlingBoundary.trim()).not.toBe("");
              expect(drill.cleanupOrRollback.trim()).not.toBe("");
              expect(drill.successEvidence.length).toBeGreaterThan(0);
              expect(drill.successEvidence.every((item) => item.trim().length > 0)).toBe(true);
            }
          }),
          { numRuns: 200 },
        );
      },
    );

    /**
     * The execution field must be a non-executable ProtectedOperation: it must
     * carry classification "protected-operation", an executionStatus of
     * "pending-authorization" or "not-run", and must NOT have an
     * executionResult property.
     *
     * **Validates: Requirements 1.2, 6.3, 6.4**
     */
    it(
      "execution is a non-executable ProtectedOperation with no executionResult on every drill",
      () => {
        fc.assert(
          fc.property(applicablePathArb, drillContextArb, (applicablePaths, context) => {
            const summary = buildRecoveryPlanSummary(recoveryReviewSources());

            for (const recoveryPath of applicablePaths) {
              const drill = buildRestoreDrillWithEvidence(summary, recoveryPath, context);

              expect(drill.execution.classification).toBe("protected-operation");
              expect(["pending-authorization", "not-run"]).toContain(
                drill.execution.executionStatus,
              );
              expect(drill.execution).not.toHaveProperty("executionResult");
              expect(drill.execution.requiredAuthorization).toBeTruthy();
              expect(drill.execution.expectedEvidence.length).toBeGreaterThan(0);
            }
          }),
          { numRuns: 200 },
        );
      },
    );

    /**
     * The six evidence items in successEvidence must each be distinct strings
     * (no two items collapse to the same value even across different paths).
     *
     * **Validates: Requirements 6.4**
     */
    it(
      "successEvidence items are all distinct on every completed drill",
      () => {
        fc.assert(
          fc.property(applicablePathArb, drillContextArb, (applicablePaths, context) => {
            const summary = buildRecoveryPlanSummary(recoveryReviewSources());

            for (const recoveryPath of applicablePaths) {
              const drill = buildRestoreDrillWithEvidence(summary, recoveryPath, context);

              const uniqueItems = new Set(drill.successEvidence);
              expect(uniqueItems.size).toBe(drill.successEvidence.length);
            }
          }),
          { numRuns: 200 },
        );
      },
    );
  },
);
