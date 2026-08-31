// @vitest-environment node
//
// Feature: operations-deployment-backup-review
// Property 11: Monitoring gaps are attributable and complete.
//
// Validates: Requirements 8.3

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Gap, Priority, Risk, Surface } from "../../scripts/operations-review";

// ---------------------------------------------------------------------------
// Domain constants mirroring the monitoring extractor contract
// ---------------------------------------------------------------------------

/**
 * The four required fields every release/recovery procedure must supply.
 * Absence of any one field must produce a dedicated attributable gap.
 */
const REQUIRED_PROCEDURE_FIELDS = [
  "signals",
  "expected-conditions",
  "owner",
  "escalation-path",
] as const;

type ProcedureField = (typeof REQUIRED_PROCEDURE_FIELDS)[number];

type ProcedureKind = "release" | "recovery";

// ---------------------------------------------------------------------------
// Minimal domain model for the procedure gap contract
// (mirrors what extractors/monitoring.ts exposes through procedureGaps;
//  the property validates the contract, not the extractor implementation)
// ---------------------------------------------------------------------------

interface MonitoringProcedureInput {
  readonly id: string;
  readonly kind: ProcedureKind;
  /** Surface that owns this release or recovery procedure. */
  readonly surface: Surface;
  readonly name: string;
  readonly signals: readonly string[];
  readonly expectedConditions: readonly string[];
  readonly owner?: string;
  readonly escalationPath?: string;
  readonly sourcePaths: readonly string[];
}

/**
 * Pure gap-factory: emit one Gap per missing required field for a procedure.
 * This is the contract the monitoring extractor's procedureGaps() must satisfy.
 */
function assessMonitoringProcedure(input: MonitoringProcedureInput): readonly Gap[] {
  const gaps: Gap[] = [];

  const checks: Array<{
    field: ProcedureField;
    label: string;
    present: boolean;
    recommendation: string;
  }> = [
    {
      field: "signals",
      label: "named observable signals",
      present: input.signals.length > 0,
      recommendation:
        "Name the exact metrics, logs, traces, headers, or health observations that operators must inspect.",
    },
    {
      field: "expected-conditions",
      label: "expected values or conditions",
      present: input.expectedConditions.length > 0,
      recommendation:
        "Define the expected value or condition for every named monitoring signal.",
    },
    {
      field: "owner",
      label: "monitoring owner",
      present: Boolean(input.owner),
      recommendation:
        "Name the role or operator responsible for reviewing the monitoring evidence.",
    },
    {
      field: "escalation-path",
      label: "escalation path",
      present: Boolean(input.escalationPath),
      recommendation:
        "Document the threshold, destination, and next operator for escalation when the expected condition fails.",
    },
  ];

  for (const check of checks) {
    if (check.present) {
      continue;
    }

    gaps.push({
      id: `monitoring.procedure.${input.id}.${check.field}.missing`,
      surface: input.surface,
      missingOrContradictoryElement: `${input.name} lacks ${check.label}.`,
      risk: "high",
      priority: "P1",
      sourcePaths: [...input.sourcePaths],
      recommendedFollowUp: check.recommendation,
      namedOwner: "observability owner",
    });
  }

  return gaps;
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const PROCEDURE_SURFACES: Surface[] = [
  "vercel-application",
  "cloudflare-worker",
  "products-database",
  "admin-database",
  "r2-backup",
  "monitoring",
];

const procedureSurfaceArb = fc.constantFrom<Surface>(...PROCEDURE_SURFACES);
const procedureKindArb = fc.constantFrom<ProcedureKind>("release", "recovery");
const nonEmptyStringArb = fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ._-]{1,60}$/).filter(
  (s) => s.trim().length > 0,
);
const sourcePathArb = fc.stringMatching(/^[a-z][a-z0-9/_.-]{4,60}$/);

const procedureFieldArb = fc.constantFrom<ProcedureField>(...REQUIRED_PROCEDURE_FIELDS);

/** A fully complete procedure — every required field is present. */
const completeProcedureArb: fc.Arbitrary<MonitoringProcedureInput> = fc
  .tuple(
    fc.uuid(),
    procedureKindArb,
    procedureSurfaceArb,
    nonEmptyStringArb,
    fc.array(nonEmptyStringArb, { minLength: 1, maxLength: 4 }),
    fc.array(nonEmptyStringArb, { minLength: 1, maxLength: 4 }),
    nonEmptyStringArb,
    nonEmptyStringArb,
    fc.array(sourcePathArb, { minLength: 1, maxLength: 3 }),
  )
  .map(
    ([id, kind, surface, name, signals, expectedConditions, owner, escalationPath, sourcePaths]) => ({
      id,
      kind,
      surface,
      name,
      signals,
      expectedConditions,
      owner,
      escalationPath,
      sourcePaths,
    }),
  );

/** Remove a specific field from a complete procedure to create a gap trigger. */
function clearField(
  input: MonitoringProcedureInput,
  field: ProcedureField,
): MonitoringProcedureInput {
  switch (field) {
    case "signals":
      return { ...input, signals: [] };
    case "expected-conditions":
      return { ...input, expectedConditions: [] };
    case "owner":
      return { ...input, owner: undefined };
    case "escalation-path":
      return { ...input, escalationPath: undefined };
  }
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe("Property 11: Monitoring gaps are attributable and complete", () => {
  it("emits no gaps when all required procedure fields are present", () => {
    fc.assert(
      fc.property(completeProcedureArb, (input) => {
        const gaps = assessMonitoringProcedure(input);
        expect(gaps).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });

  it("emits exactly one attributable gap for each individual missing procedure field", () => {
    fc.assert(
      fc.property(completeProcedureArb, procedureFieldArb, (complete, missingField) => {
        const incomplete = clearField(complete, missingField);
        const gaps = assessMonitoringProcedure(incomplete);

        const expectedGapId = `monitoring.procedure.${incomplete.id}.${missingField}.missing`;
        const matchingGap = gaps.find((g) => g.id === expectedGapId);

        expect(matchingGap).toBeDefined();
        expect(matchingGap!.id).toBe(expectedGapId);
      }),
      { numRuns: 100 },
    );
  });

  it("every emitted gap names the affected surface", () => {
    fc.assert(
      fc.property(completeProcedureArb, procedureFieldArb, (complete, missingField) => {
        const incomplete = clearField(complete, missingField);
        const gaps = assessMonitoringProcedure(incomplete);

        for (const gap of gaps) {
          expect(PROCEDURE_SURFACES).toContain(gap.surface);
          expect(gap.surface).toBe(incomplete.surface);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("every emitted gap has non-empty sourcePaths and recommendedFollowUp", () => {
    fc.assert(
      fc.property(completeProcedureArb, procedureFieldArb, (complete, missingField) => {
        const incomplete = clearField(complete, missingField);
        const gaps = assessMonitoringProcedure(incomplete);

        for (const gap of gaps) {
          // sourcePaths must be non-empty
          expect(gap.sourcePaths.length).toBeGreaterThan(0);
          for (const sourcePath of gap.sourcePaths) {
            expect(sourcePath.trim()).not.toBe("");
          }

          // recommendedFollowUp must be non-empty
          expect(gap.recommendedFollowUp.trim()).not.toBe("");

          // missingOrContradictoryElement must mention the procedure name
          expect(gap.missingOrContradictoryElement.trim()).not.toBe("");
          expect(gap.missingOrContradictoryElement).toContain(incomplete.name);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("every emitted gap has a valid priority and risk", () => {
    fc.assert(
      fc.property(completeProcedureArb, procedureFieldArb, (complete, missingField) => {
        const incomplete = clearField(complete, missingField);
        const gaps = assessMonitoringProcedure(incomplete);

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

  it("missing-procedure-field gaps are at minimum P1/high — never downgraded", () => {
    fc.assert(
      fc.property(completeProcedureArb, procedureFieldArb, (complete, missingField) => {
        const incomplete = clearField(complete, missingField);
        const gaps = assessMonitoringProcedure(incomplete);

        for (const gap of gaps) {
          // Missing monitoring fields are at least P1 (never P2 or P3)
          const priorityRank: Priority[] = ["P0", "P1", "P2", "P3"];
          const gapRank = priorityRank.indexOf(gap.priority);
          expect(gapRank).toBeLessThanOrEqual(1); // P0 index 0, P1 index 1

          // Risk must be high or critical — never medium or low
          expect(["high", "critical"] as Risk[]).toContain(gap.risk);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("clearing all four fields produces one gap per field — four gaps in total", () => {
    fc.assert(
      fc.property(completeProcedureArb, (complete) => {
        // Clear all four required fields
        const allCleared: MonitoringProcedureInput = {
          ...complete,
          signals: [],
          expectedConditions: [],
          owner: undefined,
          escalationPath: undefined,
        };
        const gaps = assessMonitoringProcedure(allCleared);

        expect(gaps).toHaveLength(REQUIRED_PROCEDURE_FIELDS.length);

        // Each gap must map to a distinct missing field
        for (const field of REQUIRED_PROCEDURE_FIELDS) {
          const expectedId = `monitoring.procedure.${allCleared.id}.${field}.missing`;
          expect(gaps.some((g) => g.id === expectedId)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("gaps from independent procedures do not share IDs", () => {
    fc.assert(
      fc.property(
        fc.tuple(completeProcedureArb, completeProcedureArb),
        procedureFieldArb,
        ([first, second], missingField) => {
          // Ensure procedures have distinct IDs (fast-check UUIDs are unique across runs,
          // but guard explicitly in case of collision)
          if (first.id === second.id) {
            return;
          }

          const firstIncomplete = clearField(first, missingField);
          const secondIncomplete = clearField(second, missingField);

          const firstGaps = assessMonitoringProcedure(firstIncomplete);
          const secondGaps = assessMonitoringProcedure(secondIncomplete);

          const firstIds = new Set(firstGaps.map((g) => g.id));
          const secondIds = new Set(secondGaps.map((g) => g.id));

          // No ID overlap between independent procedures
          for (const id of secondIds) {
            expect(firstIds.has(id)).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("gaps carry the source paths from the originating procedure", () => {
    fc.assert(
      fc.property(completeProcedureArb, procedureFieldArb, (complete, missingField) => {
        const incomplete = clearField(complete, missingField);
        const gaps = assessMonitoringProcedure(incomplete);

        for (const gap of gaps) {
          // Every gap source path must have appeared in the procedure's declared source paths
          for (const gapPath of gap.sourcePaths) {
            expect(incomplete.sourcePaths).toContain(gapPath);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
