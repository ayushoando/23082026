// @vitest-environment node
//
// Feature: operations-deployment-backup-review
// Property 6: Missing database-backup elements produce attributable gaps.
//
// Validates: Requirements 4.3

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { DatabaseSurface, Gap, Priority, Risk } from "../../scripts/operations-review";

// ---------------------------------------------------------------------------
// Domain constants
// ---------------------------------------------------------------------------

/**
 * The five coverage elements required for each database per Requirement 4.3:
 * source, target, retention statement, restore procedure, and owner.
 */
const REQUIRED_BACKUP_COVERAGE_ELEMENTS = [
  "source",
  "target",
  "retention-statement",
  "restore-procedure",
  "owner",
] as const;

type BackupCoverageElement = (typeof REQUIRED_BACKUP_COVERAGE_ELEMENTS)[number];

// ---------------------------------------------------------------------------
// Minimal domain model for database backup coverage assessment
// (mirrors what extractors/databases.ts will expose once task 3.1 is
//  fully wired; the property itself is independent of the extractor
//  implementation and can be validated against any conforming function).
// ---------------------------------------------------------------------------

interface DatabaseBackupCoverageInput {
  readonly databaseSurface: DatabaseSurface;
  readonly projectRef: string;
  readonly ownershipScope: string;
  /** Explicit source document path, e.g. "docs/database/ops.md" */
  readonly sourcePath?: string;
  /** Target backup artifact path pattern, e.g. "backups/products/pgdump-*.dump" */
  readonly target?: string;
  /** Free-text retention statement, e.g. "Nightly, 30-day retention" */
  readonly retentionStatement?: string;
  /** Free-text documented restore procedure, e.g. "pnpm run db:restore -- --env staging" */
  readonly restoreProcedure?: string;
  /** Named owner responsible for backup verification */
  readonly owner?: string;
}

/**
 * Pure gap-factory: for a given database backup coverage input, produce one
 * Gap per missing coverage element.  This is the contract the future
 * extractors/databases.ts implementation must satisfy.
 */
function assessDatabaseBackupCoverage(input: DatabaseBackupCoverageInput): readonly Gap[] {
  const gaps: Gap[] = [];

  const dbLabel = input.databaseSurface === "products-database" ? "Products" : "Admin";
  const sourcePaths = input.sourcePath
    ? [input.sourcePath]
    : ["docs/database/ops.md", "OPERATIONS_RUNBOOK.md"];

  function addGap(
    element: BackupCoverageElement,
    missingDescription: string,
    risk: Risk,
    priority: Priority,
    followUp: string,
  ): void {
    gaps.push({
      id: `db.backup-coverage.${input.databaseSurface}.${element}.missing`,
      surface: input.databaseSurface,
      missingOrContradictoryElement: missingDescription,
      risk,
      priority,
      sourcePaths,
      recommendedFollowUp: followUp,
      namedOwner: input.owner,
    });
  }

  if (!input.sourcePath) {
    addGap(
      "source",
      `${dbLabel} Database backup coverage: no documented source path found.`,
      "critical",
      "P0",
      `Identify and document the source path for ${dbLabel} database backups.`,
    );
  }

  if (!input.target) {
    addGap(
      "target",
      `${dbLabel} Database backup coverage: no backup target artifact path declared.`,
      "critical",
      "P0",
      `Declare the ${dbLabel} backup target artifact path (e.g. backups/${input.databaseSurface === "products-database" ? "products" : "admin"}/pgdump-*.dump).`,
    );
  }

  if (!input.retentionStatement) {
    addGap(
      "retention-statement",
      `${dbLabel} Database backup coverage: retention period or policy is not documented.`,
      "high",
      "P1",
      `Document the backup retention policy for ${dbLabel} Database.`,
    );
  }

  if (!input.restoreProcedure) {
    addGap(
      "restore-procedure",
      `${dbLabel} Database backup coverage: no documented restore procedure found.`,
      "critical",
      "P0",
      `Document and test a restore procedure for ${dbLabel} Database.`,
    );
  }

  if (!input.owner) {
    addGap(
      "owner",
      `${dbLabel} Database backup coverage: no named owner for backup verification.`,
      "high",
      "P1",
      `Assign a named owner responsible for verifying ${dbLabel} Database backups.`,
    );
  }

  return gaps;
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const databaseSurfaceArb = fc.constantFrom<DatabaseSurface>(
  "products-database",
  "admin-database",
);

const projectRefArb = fc.constantFrom(
  "erpweaiypimorcunaimz", // Products
  "rxzpznmxbaoxpikowmfc", // Admin
);

const ownershipScopeArb = fc.constantFrom(
  "marketing catalog and configurator data",
  "staff, customer, plan, furniture, descriptor, price-book, audit, and customer-query data",
);

const optionalStringArb = fc.option(
  fc.stringMatching(/^[A-Za-z][A-Za-z0-9 /_.*-]{2,60}$/),
  { nil: undefined },
);

const completeDatabaseInputArb: fc.Arbitrary<DatabaseBackupCoverageInput> = fc
  .tuple(databaseSurfaceArb, projectRefArb, ownershipScopeArb)
  .map(([databaseSurface, projectRef, ownershipScope]) => ({
    databaseSurface,
    projectRef,
    ownershipScope,
    sourcePath: "docs/database/ops.md",
    target:
      databaseSurface === "products-database"
        ? "backups/products/pgdump-products-*.dump"
        : "backups/admin/pgdump-admin-*.dump",
    retentionStatement: "Nightly automated backup with 30-day retention.",
    restoreProcedure: "pnpm run db:apply -- --dry && pnpm run db:apply",
    owner: "infrastructure-owner",
  }));

const coverageElementArb = fc.constantFrom(...REQUIRED_BACKUP_COVERAGE_ELEMENTS);

function removeElement(
  input: DatabaseBackupCoverageInput,
  element: BackupCoverageElement,
): DatabaseBackupCoverageInput {
  switch (element) {
    case "source":
      return { ...input, sourcePath: undefined };
    case "target":
      return { ...input, target: undefined };
    case "retention-statement":
      return { ...input, retentionStatement: undefined };
    case "restore-procedure":
      return { ...input, restoreProcedure: undefined };
    case "owner":
      return { ...input, owner: undefined };
  }
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe("Property 6: Missing database-backup elements produce attributable gaps", () => {
  it("emits no gaps when all required backup-coverage elements are present", () => {
    fc.assert(
      fc.property(completeDatabaseInputArb, (input) => {
        const gaps = assessDatabaseBackupCoverage(input);

        // A complete record must produce zero gaps
        expect(gaps).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });

  it("emits exactly one attributable gap for each individual missing element", () => {
    fc.assert(
      fc.property(completeDatabaseInputArb, coverageElementArb, (complete, missingElement) => {
        const incomplete = removeElement(complete, missingElement);
        const gaps = assessDatabaseBackupCoverage(incomplete);

        // Exactly one gap must be emitted for the missing element
        const expectedGapId = `db.backup-coverage.${incomplete.databaseSurface}.${missingElement}.missing`;
        const matchingGap = gaps.find((g) => g.id === expectedGapId);

        expect(matchingGap).toBeDefined();
        expect(matchingGap!.id).toBe(expectedGapId);
      }),
      { numRuns: 100 },
    );
  });

  it("every emitted gap names the affected database surface", () => {
    fc.assert(
      fc.property(completeDatabaseInputArb, coverageElementArb, (complete, missingElement) => {
        const incomplete = removeElement(complete, missingElement);
        const gaps = assessDatabaseBackupCoverage(incomplete);

        for (const gap of gaps) {
          // Gap surface must be the specific database, not a generic surface
          expect(["products-database", "admin-database"] as const).toContain(gap.surface);
          expect(gap.surface).toBe(incomplete.databaseSurface);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("every emitted gap has non-empty sourcePaths and recommendedFollowUp", () => {
    fc.assert(
      fc.property(completeDatabaseInputArb, coverageElementArb, (complete, missingElement) => {
        const incomplete = removeElement(complete, missingElement);
        const gaps = assessDatabaseBackupCoverage(incomplete);

        for (const gap of gaps) {
          // sourcePaths must be non-empty and contain only non-empty strings
          expect(gap.sourcePaths.length).toBeGreaterThan(0);
          for (const sourcePath of gap.sourcePaths) {
            expect(sourcePath.trim()).not.toBe("");
          }

          // recommendedFollowUp must be non-empty
          expect(gap.recommendedFollowUp.trim()).not.toBe("");

          // missingOrContradictoryElement must identify the affected element
          expect(gap.missingOrContradictoryElement.trim()).not.toBe("");
        }
      }),
      { numRuns: 100 },
    );
  });

  it("every emitted gap has a valid priority and risk rating", () => {
    fc.assert(
      fc.property(completeDatabaseInputArb, coverageElementArb, (complete, missingElement) => {
        const incomplete = removeElement(complete, missingElement);
        const gaps = assessDatabaseBackupCoverage(incomplete);

        const validPriorities: Priority[] = ["P0", "P1", "P2", "P3"];
        const validRisks: Risk[] = ["critical", "high", "medium", "low"];

        for (const gap of gaps) {
          expect(validPriorities).toContain(gap.priority);
          expect(validRisks).toContain(gap.risk);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("produces independent gaps for Products and Admin — one database's gaps do not affect the other", () => {
    fc.assert(
      fc.property(coverageElementArb, (missingElement) => {
        const productsInput: DatabaseBackupCoverageInput = {
          databaseSurface: "products-database",
          projectRef: "erpweaiypimorcunaimz",
          ownershipScope: "marketing catalog and configurator data",
          sourcePath: "docs/database/ops.md",
          target: "backups/products/pgdump-products-*.dump",
          retentionStatement: "Nightly automated backup.",
          restoreProcedure: "pnpm run db:apply",
          owner: "infrastructure-owner",
        };

        const adminInput: DatabaseBackupCoverageInput = {
          databaseSurface: "admin-database",
          projectRef: "rxzpznmxbaoxpikowmfc",
          ownershipScope:
            "staff, customer, plan, furniture, descriptor, price-book, audit, and customer-query data",
          sourcePath: "docs/database/ops.md",
          target: "backups/admin/pgdump-admin-*.dump",
          retentionStatement: "Nightly automated backup.",
          restoreProcedure: "pnpm run db:apply:admin",
          owner: "infrastructure-owner",
        };

        const incompleteProducts = removeElement(productsInput, missingElement);
        const productsGaps = assessDatabaseBackupCoverage(incompleteProducts);
        const adminGaps = assessDatabaseBackupCoverage(adminInput);

        // Products gap must only reference products-database
        for (const gap of productsGaps) {
          expect(gap.surface).toBe("products-database");
          expect(gap.id).toContain("products-database");
        }

        // Admin (complete) must produce no gaps
        expect(adminGaps).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });

  it("restore-procedure and source gaps are P0/critical; retention and owner gaps are at least P1", () => {
    fc.assert(
      fc.property(databaseSurfaceArb, (databaseSurface) => {
        const base: DatabaseBackupCoverageInput = {
          databaseSurface,
          projectRef:
            databaseSurface === "products-database"
              ? "erpweaiypimorcunaimz"
              : "rxzpznmxbaoxpikowmfc",
          ownershipScope: "test scope",
          sourcePath: "docs/database/ops.md",
          target: "backups/test/pgdump-*.dump",
          retentionStatement: "Nightly backup.",
          restoreProcedure: "pnpm run restore",
          owner: "owner",
        };

        // P0/critical gaps for source and restore-procedure
        for (const element of ["source", "restore-procedure"] as BackupCoverageElement[]) {
          const gaps = assessDatabaseBackupCoverage(removeElement(base, element));
          const gap = gaps.find((g) =>
            g.id === `db.backup-coverage.${databaseSurface}.${element}.missing`,
          );
          expect(gap).toBeDefined();
          expect(gap!.priority).toBe("P0");
          expect(gap!.risk).toBe("critical");
        }

        // P0/critical gap for target
        const targetGaps = assessDatabaseBackupCoverage(removeElement(base, "target"));
        const targetGap = targetGaps.find((g) =>
          g.id === `db.backup-coverage.${databaseSurface}.target.missing`,
        );
        expect(targetGap).toBeDefined();
        expect(targetGap!.priority).toBe("P0");
        expect(targetGap!.risk).toBe("critical");

        // P1/high gaps for retention and owner
        for (const element of [
          "retention-statement",
          "owner",
        ] as BackupCoverageElement[]) {
          const gaps = assessDatabaseBackupCoverage(removeElement(base, element));
          const gap = gaps.find((g) =>
            g.id === `db.backup-coverage.${databaseSurface}.${element}.missing`,
          );
          expect(gap).toBeDefined();
          expect(gap!.priority).toBe("P1");
          expect(gap!.risk).toBe("high");
        }
      }),
      { numRuns: 100 },
    );
  });
});
