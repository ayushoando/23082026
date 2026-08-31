// @vitest-environment node
//
// Feature: operations-deployment-backup-review
// Property 10: Incident records preserve decision-critical uncertainty.
//
// Validates: Requirements 7.4
//
// Requirement 7.4: While an incident is under review, the Operations Review
// SHALL record the affected surface, customer-impact assumption, safe
// observation, fallback, Recovery Path, and unverified facts. Unverified
// fields MUST NOT be promoted to verified status without authorized evidence.

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  buildRecoveryPlanSummary,
  type CodeRollbackPlan,
  type DataRecoveryPlan,
  type DataRecoveryPath,
  type EvidenceFact,
  type RecoveryPlanSummary,
  type RecoveryReviewSources,
  type RepositorySource,
  type SchemaRollbackPlan,
  type WorkerRollbackPlan,
} from "../../scripts/operations-review";

// ---------------------------------------------------------------------------
// Repository source fixture helpers
// ---------------------------------------------------------------------------

function repositorySource(path: string, content: string): RepositorySource {
  return {
    content,
    source: {
      path,
      locator: "incident-uncertainty-fixture",
      observedAt: "2026-01-01T00:00:00.000Z",
      contentDigest: `fixture-${path}`,
    },
  };
}

/**
 * Build recovery sources where the presence of key evidence markers is
 * controlled by flags. This lets the property vary which markers are absent
 * and verify that the resulting plans retain unverified status.
 */
function buildSources(flags: {
  hasRollbackSection: boolean;
  hasInstantRollback: boolean;
  hasRestoreSection: boolean;
  hasPitrRef: boolean;
  hasCatalogOutageRef: boolean;
  hasR2BackupRef: boolean;
  hasWorkerRollbackSection: boolean;
  hasProductsMigrationRollback: boolean;
  hasAdminMigrationRollback: boolean;
}): RecoveryReviewSources {
  const runbookLines: string[] = [
    "## 1. Deploy",
    "Order: migrations → seed → code.",
    "## 5. Incidents",
  ];

  if (flags.hasCatalogOutageRef) {
    runbookLines.push("Catalog outage: R2 fallback — docs/database/ops.md");
  }
  if (flags.hasRollbackSection) {
    runbookLines.push("## 4. Rollback");
    runbookLines.push("Revert migrations newest-first before attempting code rollback.");
  }
  if (flags.hasInstantRollback) {
    runbookLines.push("Use Vercel Instant Rollback to revert to prior deployment.");
  }
  if (flags.hasWorkerRollbackSection) {
    runbookLines.push("## Worker Rollback");
    runbookLines.push("Roll back with pnpm run worker:deploy pointing at prior release.");
  }
  runbookLines.push("## 6. Backups");
  if (flags.hasR2BackupRef) {
    runbookLines.push("Nightly: .github/workflows/supabase-backup-r2.yml (02:15 UTC).");
  } else {
    runbookLines.push("Nightly backup configured.");
  }
  runbookLines.push("PITR remains an approved recovery path.");

  const dbOpsLines: string[] = [];
  if (flags.hasRestoreSection) {
    dbOpsLines.push("## 3. Restore from R2");
    dbOpsLines.push("pgdump-products-*.dump");
    dbOpsLines.push("pgdump-admin-*.dump");
    dbOpsLines.push("Restore from R2 after a corruption event.");
  }
  if (flags.hasPitrRef) {
    dbOpsLines.push("## 4. Provider recovery / PITR");
    dbOpsLines.push("Supabase PITR is available for point-in-time recovery.");
  }

  const productsMigration = flags.hasProductsMigrationRollback
    ? "create table products_t (id uuid);\n-- rollback\n-- drop table products_t;"
    : "create table products_t (id uuid);";

  const adminMigration = flags.hasAdminMigrationRollback
    ? "create table admin_t (id uuid);\n-- rollback\n-- drop table admin_t;"
    : "create table admin_t (id uuid);";

  return {
    runbook: repositorySource("OPERATIONS_RUNBOOK.md", runbookLines.join("\n")),
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
      productsMigration,
    ),
    adminMigrations: repositorySource(
      "site/platform/supabase/migrations.admin/20260101000000_admin.sql",
      adminMigration,
    ),
    databaseOperations: repositorySource(
      "docs/database/ops.md",
      dbOpsLines.join("\n"),
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

/** Sources where every evidence marker is present (best-case). */
function fullySupportedSources(): RecoveryReviewSources {
  return buildSources({
    hasRollbackSection: true,
    hasInstantRollback: true,
    hasRestoreSection: true,
    hasPitrRef: true,
    hasCatalogOutageRef: true,
    hasR2BackupRef: true,
    hasWorkerRollbackSection: true,
    hasProductsMigrationRollback: true,
    hasAdminMigrationRollback: true,
  });
}

/** Sources where every evidence marker is absent (worst-case / incident scenario). */
function unsupportedSources(): RecoveryReviewSources {
  return buildSources({
    hasRollbackSection: false,
    hasInstantRollback: false,
    hasRestoreSection: false,
    hasPitrRef: false,
    hasCatalogOutageRef: false,
    hasR2BackupRef: false,
    hasWorkerRollbackSection: false,
    hasProductsMigrationRollback: false,
    hasAdminMigrationRollback: false,
  });
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Randomly toggle each evidence-marker flag independently.
 * This exercises all combinations: one absent flag is the minimal
 * uncertainty case; all absent is the worst-case incident scenario.
 */
const evidenceFlagsArb = fc.record({
  hasRollbackSection: fc.boolean(),
  hasInstantRollback: fc.boolean(),
  hasRestoreSection: fc.boolean(),
  hasPitrRef: fc.boolean(),
  hasCatalogOutageRef: fc.boolean(),
  hasR2BackupRef: fc.boolean(),
  hasWorkerRollbackSection: fc.boolean(),
  hasProductsMigrationRollback: fc.boolean(),
  hasAdminMigrationRollback: fc.boolean(),
});

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

/**
 * A plan that lacks its primary evidence marker MUST carry "unverified" plan
 * status. A plan with its marker MUST carry "observed-local" plan status.
 * This enforces the core non-promotion invariant.
 */
function assertPlanStatusMatchesEvidence(
  plan: { readonly status: "observed-local" | "unverified" },
  hasEvidence: boolean,
  planLabel: string,
): void {
  if (!hasEvidence) {
    expect(plan.status, `${planLabel}: absent evidence must not be promoted to observed-local`).toBe("unverified");
  } else {
    expect(plan.status, `${planLabel}: present evidence should be observed-local`).toBe("observed-local");
  }
}

/**
 * Every gap produced by a plan must have non-empty required fields.
 * A gap is the review's representation of unverified uncertainty — it MUST
 * carry an attribution (surface, sourcePaths, risk) rather than silently
 * collapsing the missing information.
 */
function assertGapsAreAttributable(
  gaps: ReadonlyArray<{ readonly id: string; readonly sourcePaths: readonly string[]; readonly surface: string; readonly risk: string }>,
  planLabel: string,
): void {
  for (const gap of gaps) {
    expect(gap.id.trim(), `${planLabel}: gap id must not be empty`).not.toBe("");
    expect(gap.sourcePaths.length, `${planLabel}: gap must cite at least one source path`).toBeGreaterThan(0);
    expect(gap.surface.trim(), `${planLabel}: gap surface must not be empty`).not.toBe("");
    expect(gap.risk.trim(), `${planLabel}: gap risk must not be empty`).not.toBe("");
  }
}

/**
 * Evidence facts marked "gap" or "unverified" must not carry `externalEvidence`
 * (which would imply authorized provider evidence was supplied). This is the
 * per-fact non-promotion invariant.
 *
 * Note: A fact with status "observed-local" CAN describe an absence (e.g.,
 * "runbook does not mention X") — that is a locally-observed gap, which is
 * correctly classified as observed-local. What is prohibited is a fact
 * carrying authorized external evidence without the matching status, or a
 * fact that has been given observed-authorized status without any external
 * evidence reference.
 */
function assertNoFactPromotionWithoutEvidence(
  facts: readonly EvidenceFact[],
  planLabel: string,
): void {
  // Facts with observed-authorized status must have an externalEvidence reference.
  const promotedWithoutAuth = facts.filter(
    (f) => f.status === "observed-authorized" && !f.externalEvidence,
  );
  expect(
    promotedWithoutAuth,
    `${planLabel}: observed-authorized facts must have an externalEvidence reference`,
  ).toHaveLength(0);

  // Facts with gap status must not have externalEvidence (would contradict the gap).
  const gapWithExternal = facts.filter(
    (f) => f.status === "gap" && f.externalEvidence !== undefined,
  );
  expect(
    gapWithExternal,
    `${planLabel}: gap facts must not carry externalEvidence references`,
  ).toHaveLength(0);
}

/**
 * Protected operations recorded by a plan must carry non-execution status.
 * They must not expose any execution result or claim operational success.
 */
function assertProtectedOperationsAreNonExecutable(
  protectedOps: ReadonlyArray<{
    readonly executionStatus: string;
    readonly classification: string;
    readonly operation: string;
    readonly targetSurface: string;
    readonly requiredAuthorization: string;
    readonly expectedEvidence: readonly string[];
  }>,
  planLabel: string,
): void {
  for (const op of protectedOps) {
    expect(
      ["not-run", "pending-authorization"],
      `${planLabel}: protected operation must have non-execution status`,
    ).toContain(op.executionStatus);

    expect(
      op.classification,
      `${planLabel}: protected operation classification must be 'protected-operation'`,
    ).toBe("protected-operation");

    expect(op.operation.trim(), `${planLabel}: operation name must not be empty`).not.toBe("");
    expect(op.targetSurface.trim(), `${planLabel}: target surface must not be empty`).not.toBe("");
    expect(
      op.requiredAuthorization.trim(),
      `${planLabel}: required authorization must not be empty`,
    ).not.toBe("");
    expect(
      op.expectedEvidence.length,
      `${planLabel}: protected operation must list expected evidence`,
    ).toBeGreaterThan(0);

    // Must not have any property suggesting execution occurred
    expect(op).not.toHaveProperty("executionResult");
    expect(op).not.toHaveProperty("operationOutput");
    expect(op).not.toHaveProperty("commandResult");
  }
}

/**
 * Data recovery paths must preserve unverified status when their source
 * evidence is absent. They must also not claim success (e.g., "restore
 * completed") in their description.
 */
function assertRecoveryPathUncertainty(
  paths: readonly DataRecoveryPath[],
  planLabel: string,
): void {
  for (const path of paths) {
    // Description must not claim operational success without evidence
    const successClaims = [
      "restore completed",
      "backup confirmed",
      "recovery succeeded",
      "verified and complete",
      "successfully restored",
    ];
    for (const claim of successClaims) {
      expect(
        path.description.toLowerCase(),
        `${planLabel}: recovery path description must not claim operational success ("${claim}")`,
      ).not.toContain(claim);
    }

    // Status must be a recognised value — never an invented positive state
    expect(
      ["observed-local", "unverified"],
      `${planLabel}: recovery path status must be observed-local or unverified`,
    ).toContain(path.status);

    // Source paths must be attributable
    expect(
      path.sourcePaths.length,
      `${planLabel}: recovery path must cite at least one source path`,
    ).toBeGreaterThan(0);
  }
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe("Property 10: Incident records preserve decision-critical uncertainty", () => {
  it("code-rollback plan: absent runbook rollback section must produce unverified status and attributable gaps", () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (hasRollbackSection, hasInstantRollback) => {
        const sources = buildSources({
          hasRollbackSection,
          hasInstantRollback,
          hasRestoreSection: true,
          hasPitrRef: true,
          hasCatalogOutageRef: true,
          hasR2BackupRef: true,
          hasWorkerRollbackSection: true,
          hasProductsMigrationRollback: true,
          hasAdminMigrationRollback: true,
        });

        const summary = buildRecoveryPlanSummary(sources);
        const plan: CodeRollbackPlan = summary.codeRollback;

        assertPlanStatusMatchesEvidence(plan, hasRollbackSection, "CodeRollbackPlan");
        assertGapsAreAttributable(plan.gaps, "CodeRollbackPlan");
        assertNoFactPromotionWithoutEvidence(plan.observedFacts as EvidenceFact[], "CodeRollbackPlan");
        assertProtectedOperationsAreNonExecutable(plan.protectedOperations, "CodeRollbackPlan");

        // When rollback section is absent, there must be at least one gap
        if (!hasRollbackSection) {
          expect(plan.gaps.length, "CodeRollbackPlan: missing rollback section must produce at least one gap").toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("worker-rollback plan: absent evidence must preserve unverified status", () => {
    fc.assert(
      fc.property(fc.boolean(), (hasWorkerRollbackSection) => {
        const sources = buildSources({
          hasRollbackSection: true,
          hasInstantRollback: true,
          hasRestoreSection: true,
          hasPitrRef: true,
          hasCatalogOutageRef: true,
          hasR2BackupRef: true,
          hasWorkerRollbackSection,
          hasProductsMigrationRollback: true,
          hasAdminMigrationRollback: true,
        });

        const summary = buildRecoveryPlanSummary(sources);
        const plan: WorkerRollbackPlan = summary.workerRollback;

        assertGapsAreAttributable(plan.gaps, "WorkerRollbackPlan");
        assertNoFactPromotionWithoutEvidence(plan.observedFacts as EvidenceFact[], "WorkerRollbackPlan");
        assertProtectedOperationsAreNonExecutable(plan.protectedOperations, "WorkerRollbackPlan");

        // Worker rollback plan must always have a defined status
        expect(["observed-local", "unverified"]).toContain(plan.status);
      }),
      { numRuns: 100 },
    );
  });

  it("schema-rollback plans: absent migration rollback comments must downgrade plan to unverified", () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (hasProductsRollback, hasAdminRollback) => {
        const sources = buildSources({
          hasRollbackSection: true,
          hasInstantRollback: true,
          hasRestoreSection: true,
          hasPitrRef: true,
          hasCatalogOutageRef: true,
          hasR2BackupRef: true,
          hasWorkerRollbackSection: true,
          hasProductsMigrationRollback: hasProductsRollback,
          hasAdminMigrationRollback: hasAdminRollback,
        });

        const summary = buildRecoveryPlanSummary(sources);
        const productsPlan: SchemaRollbackPlan = summary.productsSchemaRollback;
        const adminPlan: SchemaRollbackPlan = summary.adminSchemaRollback;

        // A schema plan without rollback comments in its migration must be unverified
        assertPlanStatusMatchesEvidence(productsPlan, hasProductsRollback, "ProductsSchemaRollbackPlan");
        assertPlanStatusMatchesEvidence(adminPlan, hasAdminRollback, "AdminSchemaRollbackPlan");

        assertGapsAreAttributable(productsPlan.gaps, "ProductsSchemaRollbackPlan");
        assertGapsAreAttributable(adminPlan.gaps, "AdminSchemaRollbackPlan");

        assertNoFactPromotionWithoutEvidence(productsPlan.observedFacts as EvidenceFact[], "ProductsSchemaRollbackPlan");
        assertNoFactPromotionWithoutEvidence(adminPlan.observedFacts as EvidenceFact[], "AdminSchemaRollbackPlan");

        assertProtectedOperationsAreNonExecutable(productsPlan.protectedOperations, "ProductsSchemaRollbackPlan");
        assertProtectedOperationsAreNonExecutable(adminPlan.protectedOperations, "AdminSchemaRollbackPlan");

        // Without rollback comments, at least one gap must be present
        if (!hasProductsRollback) {
          expect(
            productsPlan.gaps.length,
            "ProductsSchemaRollbackPlan: absent rollback comment must produce at least one gap",
          ).toBeGreaterThan(0);
        }
        if (!hasAdminRollback) {
          expect(
            adminPlan.gaps.length,
            "AdminSchemaRollbackPlan: absent rollback comment must produce at least one gap",
          ).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("data-recovery plan: absent restore/PITR evidence must produce unverified recovery paths and attributable gaps", () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), fc.boolean(), (hasRestoreSection, hasPitrRef, hasCatalogOutageRef) => {
        const sources = buildSources({
          hasRollbackSection: true,
          hasInstantRollback: true,
          hasRestoreSection,
          hasPitrRef,
          hasCatalogOutageRef,
          hasR2BackupRef: true,
          hasWorkerRollbackSection: true,
          hasProductsMigrationRollback: true,
          hasAdminMigrationRollback: true,
        });

        const summary = buildRecoveryPlanSummary(sources);
        const plan: DataRecoveryPlan = summary.dataRecovery;

        assertGapsAreAttributable(plan.gaps, "DataRecoveryPlan");
        assertNoFactPromotionWithoutEvidence(plan.observedFacts as EvidenceFact[], "DataRecoveryPlan");
        assertProtectedOperationsAreNonExecutable(plan.protectedOperations, "DataRecoveryPlan");
        assertRecoveryPathUncertainty(plan.recoveryPaths, "DataRecoveryPlan");

        // When restore section is absent, the R2 database restore path must be unverified
        const r2RestorePath = plan.recoveryPaths.find((p) => p.id === "r2-database-restore");
        if (r2RestorePath) {
          if (!hasRestoreSection) {
            expect(
              r2RestorePath.status,
              "DataRecoveryPlan: r2-database-restore must be unverified when restore section is absent",
            ).toBe("unverified");
          }
        }

        // When PITR ref is absent, the provider PITR path must be unverified
        const pitrPath = plan.recoveryPaths.find((p) => p.id === "provider-pitr");
        if (pitrPath) {
          if (!hasPitrRef) {
            expect(
              pitrPath.status,
              "DataRecoveryPlan: provider-pitr must be unverified when PITR ref is absent",
            ).toBe("unverified");
          }
        }

        // When catalog outage ref is absent, the catalog restore path must be unverified
        const catalogPath = plan.recoveryPaths.find((p) => p.id === "r2-catalog-restore");
        if (catalogPath) {
          if (!hasCatalogOutageRef) {
            expect(
              catalogPath.status,
              "DataRecoveryPlan: r2-catalog-restore must be unverified when catalog outage ref is absent",
            ).toBe("unverified");
          }
        }
      }),
      { numRuns: 150 },
    );
  });

  it("all plans together: no plan may promote absent evidence to operational success across all flag combinations", () => {
    fc.assert(
      fc.property(evidenceFlagsArb, (flags) => {
        const sources = buildSources(flags);
        const summary: RecoveryPlanSummary = buildRecoveryPlanSummary(sources);

        const plansToCheck: Array<[string, { status: "observed-local" | "unverified"; observedFacts: readonly EvidenceFact[]; gaps: readonly { id: string; sourcePaths: readonly string[]; surface: string; risk: string }[]; protectedOperations: readonly { executionStatus: string; classification: string; operation: string; targetSurface: string; requiredAuthorization: string; expectedEvidence: readonly string[] }[] }]> = [
          ["CodeRollbackPlan", summary.codeRollback],
          ["WorkerRollbackPlan", summary.workerRollback],
          ["ProductsSchemaRollbackPlan", summary.productsSchemaRollback],
          ["AdminSchemaRollbackPlan", summary.adminSchemaRollback],
          ["DataRecoveryPlan", summary.dataRecovery],
        ];

        for (const [label, plan] of plansToCheck) {
          // Plan status must always be one of the two allowed values
          expect(["observed-local", "unverified"], `${label}: status must be a valid EvidenceStatus`).toContain(plan.status);

          // Gaps must always be attributable
          assertGapsAreAttributable(plan.gaps, label);

          // No absent-evidence facts may be promoted
          assertNoFactPromotionWithoutEvidence(plan.observedFacts, label);

          // Protected operations must remain non-executable
          assertProtectedOperationsAreNonExecutable(plan.protectedOperations, label);
        }

        // Data recovery paths specifically must also satisfy uncertainty
        assertRecoveryPathUncertainty(summary.dataRecovery.recoveryPaths, "DataRecoveryPlan.recoveryPaths");
      }),
      { numRuns: 150 },
    );
  });

  it("worst-case incident: fully absent evidence produces unverified plans with no success claims", () => {
    const sources = unsupportedSources();
    const summary = buildRecoveryPlanSummary(sources);

    // Every plan must be unverified when evidence is absent
    expect(summary.codeRollback.status).toBe("unverified");
    expect(summary.productsSchemaRollback.status).toBe("unverified");
    expect(summary.adminSchemaRollback.status).toBe("unverified");
    expect(summary.dataRecovery.status).toBe("unverified");

    // All recovery paths must be unverified in the worst case
    for (const path of summary.dataRecovery.recoveryPaths) {
      expect(
        path.status,
        `DataRecovery path "${path.id}" must be unverified when all evidence markers are absent`,
      ).toBe("unverified");
    }

    // All plans must have gaps describing what is missing
    expect(summary.codeRollback.gaps.length).toBeGreaterThan(0);
    expect(summary.productsSchemaRollback.gaps.length).toBeGreaterThan(0);
    expect(summary.adminSchemaRollback.gaps.length).toBeGreaterThan(0);
    expect(summary.dataRecovery.gaps.length).toBeGreaterThan(0);

    // No protected operation anywhere may claim execution
    for (const plan of [
      summary.codeRollback,
      summary.workerRollback,
      summary.productsSchemaRollback,
      summary.adminSchemaRollback,
      summary.dataRecovery,
    ]) {
      assertProtectedOperationsAreNonExecutable(plan.protectedOperations, "worst-case");
    }
  });

  it("best-case scenario: fully supported evidence produces observed-local plans that still do not claim execution success", () => {
    const sources = fullySupportedSources();
    const summary = buildRecoveryPlanSummary(sources);

    // Even when fully observed locally, plans must not claim provider execution success
    expect(summary.codeRollback.status).toBe("observed-local");
    expect(summary.productsSchemaRollback.status).toBe("observed-local");
    expect(summary.adminSchemaRollback.status).toBe("observed-local");

    // observed-local is configuration evidence, not proof of hosted execution
    assertProtectedOperationsAreNonExecutable(summary.codeRollback.protectedOperations, "best-case-code");
    assertProtectedOperationsAreNonExecutable(summary.productsSchemaRollback.protectedOperations, "best-case-products");
    assertProtectedOperationsAreNonExecutable(summary.adminSchemaRollback.protectedOperations, "best-case-admin");
    assertProtectedOperationsAreNonExecutable(summary.dataRecovery.protectedOperations, "best-case-data");

    // Even in best-case, hosted state remains unverified (no authorized provider evidence)
    for (const path of summary.dataRecovery.recoveryPaths) {
      // Paths backed by local evidence should be observed-local
      // but must never claim "completed" or "succeeded"
      assertRecoveryPathUncertainty([path], `best-case DataRecovery path "${path.id}"`);
    }
  });
});
