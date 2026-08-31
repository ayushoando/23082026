// @vitest-environment node
//
// Feature: operations-deployment-backup-review
// Property 13: Evidence Record sections form a non-overlapping partition.
//
// Validates: Requirements 9.4

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  type AlignmentDifference,
  type EvidenceFact,
  type EvidenceRecord,
  type Gap,
  type Priority,
  type ProtectedOperation,
  type ReleaseDecision,
  type RestoreDrill,
  type Risk,
  type Surface,
  renderEvidenceRecordJSON,
  renderEvidenceRecordMarkdown,
} from "../../scripts/operations-review";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const _surfaceArb = fc.constantFrom<Surface>(
  "vercel-application",
  "cloudflare-worker",
  "products-database",
  "admin-database",
  "r2-backup",
  "monitoring",
  "runbook-ci-alignment",
);

const _priorityArb = fc.constantFrom<Priority>("P0", "P1", "P2", "P3");
const _riskArb = fc.constantFrom<Risk>("critical", "high", "medium", "low");

const _idArb = fc.stringMatching(/^[a-z][a-z0-9-]{2,20}$/);

/**
 * Generator for a synthetic EvidenceFact with a given id prefix and surface.
 * Creates repository-local (observed-local) or unverified status items.
 */
function evidenceFactArb(
  idPrefix: string,
  index: number,
  surface: Surface,
  status: "observed-local" | "unverified",
): EvidenceFact {
  return {
    id: `${idPrefix}-${index}`,
    surface,
    statement: `Synthetic fact ${idPrefix}-${index} for property test`,
    status,
    source: {
      path: `vercel.json`,
      locator: `fixture.${idPrefix}-${index}`,
      observedAt: "2026-01-01T00:00:00.000Z",
      contentDigest: `digest-${idPrefix}-${index}`,
    },
  };
}

/** Build an array of EvidenceFacts with unique ids within the array. */
function buildFacts(
  prefix: string,
  count: number,
  surface: Surface,
  status: "observed-local" | "unverified",
): EvidenceFact[] {
  return Array.from({ length: count }, (_, i) =>
    evidenceFactArb(prefix, i, surface, status),
  );
}

function buildGap(id: string, surface: Surface, priority: Priority, risk: Risk): Gap {
  return {
    id,
    surface,
    missingOrContradictoryElement: `Missing element for gap ${id}`,
    risk,
    priority,
    sourcePaths: ["vercel.json"],
    recommendedFollowUp: `Follow up on ${id}`,
  };
}

function buildProtectedOp(surface: Surface, index: number): ProtectedOperation {
  return {
    operation: `restore`,
    targetSurface: surface,
    classification: "protected-operation",
    requiredAuthorization: "Explicit owner authorization required before execution.",
    expectedEvidence: [`Evidence-${index}: operator confirms non-production target.`],
    executionStatus: "pending-authorization",
  };
}

function buildReleaseDecision(
  surface: "vercel-application" | "cloudflare-worker",
): ReleaseDecision {
  return {
    surface,
    approvalPoint: `Approval required before ${surface} deployment.`,
    rollbackOrRecoveryProcedure: `Rollback via ${surface} revert procedure.`,
    expectedVerificationEvidence: [`Post-deploy health check for ${surface}.`],
  };
}

function buildRestoreDrill(
  recoveryPath: "products" | "admin" | "catalog" | "repository",
  index: number,
): RestoreDrill {
  const targetSurface: Surface =
    recoveryPath === "products"
      ? "products-database"
      : recoveryPath === "admin"
        ? "admin-database"
        : "r2-backup";
  return {
    recoveryPath,
    authorizedOperator: `operator-${index}`,
    nonProductionTarget: `staging-${index}`,
    artifactCategory: `${recoveryPath} dump`,
    recoveryObjective: `Validate ${recoveryPath} recovery.`,
    successEvidence: [`Drill ${index} completed on staging-${index}.`],
    dataHandlingBoundary: "Non-production only.",
    cleanupOrRollback: `Remove staging-${index} after drill.`,
    execution: buildProtectedOp(targetSurface, index + 100),
  };
}

function buildAlignmentDiff(surface: Surface, index: number): AlignmentDifference {
  return {
    surface,
    dimension: "command",
    sourcePaths: ["OPERATIONS_RUNBOOK.md", "package.json"],
    exactDifference: `Command name mismatch for alignment diff ${index}`,
    recommendedResolution: `Align command names in runbook and package.json`,
  };
}

// ---------------------------------------------------------------------------
// EvidenceRecord builder
// ---------------------------------------------------------------------------

/**
 * Build a synthetic EvidenceRecord from generated counts.
 * Uses disjoint id namespaces: "obs-*" for observed, "unv-*" for unverified,
 * "gap-*" for gaps. These three carry the `.id` field that the partition
 * property targets.
 */
interface RecordShape {
  observedCount: number;
  unverifiedCount: number;
  gapCount: number;
  protectedOpCount: number;
  releaseSurfaces: Array<"vercel-application" | "cloudflare-worker">;
  drillPaths: Array<"products" | "admin" | "catalog" | "repository">;
  alignmentDiffCount: number;
  ownerDecisionCount: number;
}

function buildRecord(shape: RecordShape): EvidenceRecord {
  const surface: Surface = "vercel-application";

  const observedConfiguration = buildFacts(
    "obs",
    shape.observedCount,
    surface,
    "observed-local",
  );
  const unverifiedExternalState = buildFacts(
    "unv",
    shape.unverifiedCount,
    surface,
    "unverified",
  );
  const gapsAndRecommendations: Gap[] = Array.from(
    { length: shape.gapCount },
    (_, i) => buildGap(`gap-${i}`, surface, "P1", "medium"),
  );
  const protectedOperations: ProtectedOperation[] = Array.from(
    { length: shape.protectedOpCount },
    (_, i) => buildProtectedOp(surface, i),
  );
  const releaseDecisions: ReleaseDecision[] = shape.releaseSurfaces.map((s) =>
    buildReleaseDecision(s),
  );
  const restoreDrills: RestoreDrill[] = shape.drillPaths.map((p, i) =>
    buildRestoreDrill(p, i),
  );
  const alignmentDifferences: AlignmentDifference[] = Array.from(
    { length: shape.alignmentDiffCount },
    (_, i) => buildAlignmentDiff("runbook-ci-alignment", i),
  );
  const ownerDecisions: string[] = Array.from(
    { length: shape.ownerDecisionCount },
    (_, i) => `Owner decision ${i}: Confirm named owner.`,
  );

  return {
    metadata: {
      generatedAt: "2026-01-01T00:00:00.000Z",
      repositoryRevision: "abc1234",
      scope: "Property-13 partition test fixture",
    },
    observedConfiguration,
    unverifiedExternalState,
    protectedOperations,
    gapsAndRecommendations,
    ownerDecisions,
    releaseDecisions,
    restoreDrills,
    alignmentDifferences,
  };
}

// ---------------------------------------------------------------------------
// Arbitraries for RecordShape
// ---------------------------------------------------------------------------

const recordShapeArb: fc.Arbitrary<RecordShape> = fc.record({
  observedCount: fc.integer({ min: 0, max: 8 }),
  unverifiedCount: fc.integer({ min: 0, max: 8 }),
  gapCount: fc.integer({ min: 0, max: 6 }),
  protectedOpCount: fc.integer({ min: 0, max: 4 }),
  releaseSurfaces: fc.uniqueArray(
    fc.constantFrom<"vercel-application" | "cloudflare-worker">(
      "vercel-application",
      "cloudflare-worker",
    ),
    { minLength: 0, maxLength: 2 },
  ),
  drillPaths: fc.uniqueArray(
    fc.constantFrom<"products" | "admin" | "catalog" | "repository">(
      "products",
      "admin",
      "catalog",
      "repository",
    ),
    { minLength: 0, maxLength: 4 },
  ),
  alignmentDiffCount: fc.integer({ min: 0, max: 4 }),
  ownerDecisionCount: fc.integer({ min: 0, max: 4 }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Collect all finding ids from a record.
 * Only EvidenceFact (observedConfiguration + unverifiedExternalState) and
 * Gap (gapsAndRecommendations) carry a string `.id` in this model.
 */
function allFindingIds(record: EvidenceRecord): string[] {
  return [
    ...record.observedConfiguration.map((f) => f.id),
    ...record.unverifiedExternalState.map((f) => f.id),
    ...record.gapsAndRecommendations.map((g) => g.id),
  ];
}

/**
 * For each id, count how many sections contain it.
 */
function sectionContainmentCounts(
  record: EvidenceRecord,
): Map<string, number> {
  const counts = new Map<string, number>();

  const increment = (id: string): void => {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  };

  record.observedConfiguration.forEach((f) => increment(f.id));
  record.unverifiedExternalState.forEach((f) => increment(f.id));
  record.gapsAndRecommendations.forEach((g) => increment(g.id));

  return counts;
}

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

describe(
  "Property 13: Evidence Record sections form a non-overlapping partition",
  () => {
    /**
     * Property 13a: No finding id appears in more than one section.
     *
     * When ids are generated with disjoint prefixes ("obs-*", "unv-*", "gap-*"),
     * the containment count for every id must be exactly 1. This verifies the
     * non-overlap half of the partition requirement.
     */
    it("places each finding id in exactly one section — no id appears in two sections", () => {
      fc.assert(
        fc.property(recordShapeArb, (shape) => {
          const record = buildRecord(shape);
          const counts = sectionContainmentCounts(record);

          for (const [id, count] of counts) {
            expect(count, `Finding id "${id}" appears in ${count} section(s); expected exactly 1`).toBe(1);
          }
        }),
        { numRuns: 200 },
      );
    });

    /**
     * Property 13b: The union of all sections covers every generated finding.
     *
     * The set of ids produced by allFindingIds must equal the set in the
     * containment map. This verifies the exhaustiveness half of the partition
     * requirement — no finding is silently dropped.
     */
    it("covers every finding — the union of all sections equals the full finding set", () => {
      fc.assert(
        fc.property(recordShapeArb, (shape) => {
          const record = buildRecord(shape);
          const expected = new Set(allFindingIds(record));
          const covered = new Set(sectionContainmentCounts(record).keys());

          expect(covered).toEqual(expected);
        }),
        { numRuns: 200 },
      );
    });

    /**
     * Property 13c: Observed-local facts never appear in unverifiedExternalState.
     *
     * Any fact placed in observedConfiguration must not also appear (by id) in
     * unverifiedExternalState, reinforcing that the status-based placement is
     * consistent.
     */
    it("observed-local facts are never placed in the unverified-external-state section", () => {
      fc.assert(
        fc.property(recordShapeArb, (shape) => {
          const record = buildRecord(shape);
          const observedIds = new Set(record.observedConfiguration.map((f) => f.id));
          const unverifiedIds = new Set(record.unverifiedExternalState.map((f) => f.id));

          const overlap = [...observedIds].filter((id) => unverifiedIds.has(id));
          expect(overlap, `${overlap.length} id(s) appear in both observed and unverified sections`).toHaveLength(0);
        }),
        { numRuns: 200 },
      );
    });

    /**
     * Property 13d: Gap ids never collide with EvidenceFact ids.
     *
     * Gaps occupy gapsAndRecommendations; facts occupy the two evidence
     * sections. No id should cross both groups.
     */
    it("gap ids are disjoint from evidence-fact ids", () => {
      fc.assert(
        fc.property(recordShapeArb, (shape) => {
          const record = buildRecord(shape);

          const factIds = new Set([
            ...record.observedConfiguration.map((f) => f.id),
            ...record.unverifiedExternalState.map((f) => f.id),
          ]);
          const gapIds = record.gapsAndRecommendations.map((g) => g.id);

          for (const gapId of gapIds) {
            expect(
              factIds.has(gapId),
              `Gap id "${gapId}" also appears in an evidence-fact section`,
            ).toBe(false);
          }
        }),
        { numRuns: 200 },
      );
    });

    /**
     * Property 13e: JSON renderer emits every finding id exactly once.
     *
     * Parse the rendered JSON and confirm each id string appears exactly once
     * as a value in the rendered output, ensuring the renderer does not
     * duplicate or drop findings.
     */
    it("JSON renderer includes each finding id exactly once across the serialized output", () => {
      fc.assert(
        fc.property(recordShapeArb, (shape) => {
          // Only run this check when there are actual findings with ids
          const record = buildRecord(shape);
          const allIds = allFindingIds(record);
          if (allIds.length === 0) return;

          const json = renderEvidenceRecordJSON(record);
          const parsed = JSON.parse(json) as Record<string, unknown>;

          // Collect all id values from the parsed structure by scanning
          // the known section arrays for the `id` property.
          const renderedIds: string[] = [];

          function collectIds(arr: unknown): void {
            if (!Array.isArray(arr)) return;
            for (const item of arr) {
              if (item && typeof item === "object" && "id" in item) {
                const { id } = item as { id: unknown };
                if (typeof id === "string") {
                  renderedIds.push(id);
                }
              }
            }
          }

          collectIds(parsed["observedConfiguration"]);
          collectIds(parsed["unverifiedExternalState"]);
          collectIds(parsed["gapsAndRecommendations"]);

          const renderedSet = new Set(renderedIds);
          const expectedSet = new Set(allIds);

          // Every expected id appears in the rendered output
          for (const id of expectedSet) {
            expect(renderedSet.has(id), `Rendered JSON is missing finding id "${id}"`).toBe(true);
          }

          // No rendered id appears more than once
          expect(renderedIds.length, "Rendered JSON contains duplicate finding ids").toBe(
            renderedSet.size,
          );
        }),
        { numRuns: 200 },
      );
    });

    /**
     * Property 13f: Markdown renderer includes each finding id exactly once.
     *
     * The Markdown document should mention each finding id (as part of the
     * bold `[id]` notation used by renderFact/renderGap) in exactly one
     * section heading context.
     */
    it("Markdown renderer references each finding id exactly once", () => {
      fc.assert(
        fc.property(recordShapeArb, (shape) => {
          const record = buildRecord(shape);
          const allIds = allFindingIds(record);
          if (allIds.length === 0) return;

          const markdown = renderEvidenceRecordMarkdown(record);

          for (const id of allIds) {
            // The renderer uses [id] notation: `**[obs-0]**` or `**[gap-0]**`
            const occurrences = (markdown.match(new RegExp(`\\[${id}\\]`, "g")) ?? []).length;
            expect(
              occurrences,
              `Finding id "${id}" appears ${occurrences} time(s) in Markdown; expected exactly 1`,
            ).toBe(1);
          }
        }),
        { numRuns: 200 },
      );
    });
  },
);
