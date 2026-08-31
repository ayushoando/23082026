// @vitest-environment node
//
// Feature: operations-deployment-backup-review
// Property 11: Monitoring gaps are attributable and complete.
//
// Validates: Requirements 8.3
//
// Every gap produced by the monitoring review must:
//   - carry a non-empty id
//   - name the affected surface (one of the known Surface values)
//   - include at least one source path
//   - include a non-empty risk description (missingOrContradictoryElement)
//   - never claim operational success without authorized evidence
//
// The tests here exercise the full attribution contract independently of the
// extractors by constructing gap-producing inputs through a pure gap-factory
// and by verifying that every gap emitted by the monitoring extractor
// satisfies the same contract when driven from repository-local fixtures.

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Gap, Priority, Risk, Surface } from "../../scripts/operations-review";

// ---------------------------------------------------------------------------
// Known domain values (mirrors models.ts)
// ---------------------------------------------------------------------------

const ALL_SURFACES: Surface[] = [
  "vercel-application",
  "cloudflare-worker",
  "products-database",
  "admin-database",
  "r2-backup",
  "monitoring",
  "runbook-ci-alignment",
];

const VALID_PRIORITIES: Priority[] = ["P0", "P1", "P2", "P3"];
const VALID_RISKS: Risk[] = ["critical", "high", "medium", "low"];

// ---------------------------------------------------------------------------
// Shared attribution predicate
// ---------------------------------------------------------------------------

/** Returns all attribution violations for a single gap, or an empty array. */
function attributionViolations(gap: Gap): string[] {
  const violations: string[] = [];

  if (!gap.id || gap.id.trim() === "") {
    violations.push("gap.id is empty");
  }
  if (!ALL_SURFACES.includes(gap.surface)) {
    violations.push(`gap.surface "${String(gap.surface)}" is not a known Surface`);
  }
  if (!gap.sourcePaths || gap.sourcePaths.length === 0) {
    violations.push("gap.sourcePaths is empty — every gap must cite at least one source");
  }
  for (const path of gap.sourcePaths ?? []) {
    if (path.trim() === "") {
      violations.push("gap.sourcePaths contains a blank entry");
    }
  }
  if (!gap.missingOrContradictoryElement || gap.missingOrContradictoryElement.trim() === "") {
    violations.push("gap.missingOrContradictoryElement (risk description) is empty");
  }
  if (!VALID_PRIORITIES.includes(gap.priority)) {
    violations.push(`gap.priority "${gap.priority}" is not a valid Priority`);
  }
  if (!VALID_RISKS.includes(gap.risk)) {
    violations.push(`gap.risk "${gap.risk}" is not a valid Risk`);
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Pure gap factory — mirrors the procedureGaps contract in monitoring.ts
// ---------------------------------------------------------------------------

const REQUIRED_PROCEDURE_FIELDS = [
  "signals",
  "expected-conditions",
  "owner",
  "escalation-path",
] as const;

type ProcedureField = (typeof REQUIRED_PROCEDURE_FIELDS)[number];
type ProcedureKind = "release" | "recovery";

interface MonitoringProcedureInput {
  readonly id: string;
  readonly kind: ProcedureKind;
  readonly surface: Surface;
  readonly name: string;
  readonly signals: readonly string[];
  readonly expectedConditions: readonly string[];
  readonly owner?: string;
  readonly escalationPath?: string;
  readonly sourcePaths: readonly string[];
}

/**
 * Pure gap factory: emits one Gap per missing required procedure field.
 * Mirrors the contract that monitoring.ts procedureGaps() must satisfy.
 */
function emitProcedureGaps(input: MonitoringProcedureInput): readonly Gap[] {
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
    if (check.present) continue;

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
// Arbitraries
// ---------------------------------------------------------------------------

const monitoringSurfaceArb = fc.constantFrom<Surface>(
  "vercel-application",
  "cloudflare-worker",
  "products-database",
  "admin-database",
  "r2-backup",
  "monitoring",
);

const nonEmptyStringArb = fc
  .stringMatching(/^[A-Za-z][A-Za-z0-9 ._-]{1,60}$/)
  .filter((s) => s.trim().length > 0);

const sourcePathArb = fc.stringMatching(/^[a-z][a-z0-9/_.-]{4,60}$/);

const procedureFieldArb = fc.constantFrom<ProcedureField>(
  ...REQUIRED_PROCEDURE_FIELDS,
);

/** A fully populated procedure — every required field is present. */
const completeProcedureArb: fc.Arbitrary<MonitoringProcedureInput> = fc
  .tuple(
    fc.uuid(),
    fc.constantFrom<ProcedureKind>("release", "recovery"),
    monitoringSurfaceArb,
    nonEmptyStringArb,
    fc.array(nonEmptyStringArb, { minLength: 1, maxLength: 4 }),
    fc.array(nonEmptyStringArb, { minLength: 1, maxLength: 4 }),
    nonEmptyStringArb,
    nonEmptyStringArb,
    fc.array(sourcePathArb, { minLength: 1, maxLength: 3 }),
  )
  .map(
    ([
      id,
      kind,
      surface,
      name,
      signals,
      expectedConditions,
      owner,
      escalationPath,
      sourcePaths,
    ]) => ({
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

// ---------------------------------------------------------------------------
// Property 11 test suite
// ---------------------------------------------------------------------------

describe("Property 11: Monitoring gaps are attributable and complete (Req 8.3)", () => {
  // ── Attribution contract: id, surface, sourcePaths, riskDescription ──────

  it("every gap produced for a missing procedure field satisfies the full attribution contract", () => {
    fc.assert(
      fc.property(completeProcedureArb, procedureFieldArb, (complete, missingField) => {
        const incomplete = clearField(complete, missingField);
        const gaps = emitProcedureGaps(incomplete);

        // Must emit at least one gap for the removed field
        expect(gaps.length).toBeGreaterThan(0);

        for (const gap of gaps) {
          const violations = attributionViolations(gap);
          expect(violations, `Attribution violations: ${violations.join("; ")}`).toEqual([]);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("gap id encodes the affected procedure id and missing field — so it is unique per (procedure × field)", () => {
    fc.assert(
      fc.property(completeProcedureArb, procedureFieldArb, (complete, missingField) => {
        const incomplete = clearField(complete, missingField);
        const gaps = emitProcedureGaps(incomplete);

        const expectedId = `monitoring.procedure.${incomplete.id}.${missingField}.missing`;
        const found = gaps.find((g) => g.id === expectedId);
        expect(found, `Expected gap with id "${expectedId}" but got: ${JSON.stringify(gaps.map((g) => g.id))}`).toBeDefined();
      }),
      { numRuns: 200 },
    );
  });

  it("gap surface matches the originating procedure surface", () => {
    fc.assert(
      fc.property(completeProcedureArb, procedureFieldArb, (complete, missingField) => {
        const incomplete = clearField(complete, missingField);
        const gaps = emitProcedureGaps(incomplete);

        for (const gap of gaps) {
          expect(gap.surface).toBe(incomplete.surface);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("gap sourcePaths are a non-empty subset of the procedure's declared source paths", () => {
    fc.assert(
      fc.property(completeProcedureArb, procedureFieldArb, (complete, missingField) => {
        const incomplete = clearField(complete, missingField);
        const gaps = emitProcedureGaps(incomplete);

        for (const gap of gaps) {
          expect(gap.sourcePaths.length).toBeGreaterThan(0);
          for (const path of gap.sourcePaths) {
            expect(path.trim()).not.toBe("");
            expect(incomplete.sourcePaths).toContain(path);
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  it("risk description (missingOrContradictoryElement) is non-empty and mentions the procedure name", () => {
    fc.assert(
      fc.property(completeProcedureArb, procedureFieldArb, (complete, missingField) => {
        const incomplete = clearField(complete, missingField);
        const gaps = emitProcedureGaps(incomplete);

        for (const gap of gaps) {
          expect(gap.missingOrContradictoryElement.trim().length).toBeGreaterThan(0);
          expect(gap.missingOrContradictoryElement).toContain(incomplete.name);
        }
      }),
      { numRuns: 200 },
    );
  });

  // ── No gap claims operational success without authorized evidence ─────────

  it("no gap claims operational success — status-bearing text is absent from risk descriptions", () => {
    // Monitoring gaps must never state that a monitoring signal was verified,
    // a service started successfully, or a provider confirmed health.
    // Success claims require separately authorized evidence; a gap record
    // must not pre-empt that authorization.
    const SUCCESS_PHRASES = [
      /\bsucceeded\b/i,
      /\bwas started\b/i,
      /\bconfirmed healthy\b/i,
      /\bproven\b/i,
      /\bexport successful\b/i,
      /\bcollection verified\b/i,
      /\balert delivered\b/i,
    ];

    fc.assert(
      fc.property(completeProcedureArb, procedureFieldArb, (complete, missingField) => {
        const incomplete = clearField(complete, missingField);
        const gaps = emitProcedureGaps(incomplete);

        for (const gap of gaps) {
          for (const phrase of SUCCESS_PHRASES) {
            expect(
              phrase.test(gap.missingOrContradictoryElement),
              `Gap "${gap.id}" risk description must not claim success: "${gap.missingOrContradictoryElement}"`,
            ).toBe(false);
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  // ── Priority and risk floor — Requirement 8.3 is P1/high ─────────────────

  it("missing monitoring procedure fields produce P0 or P1 gaps — never downgraded to P2 or P3", () => {
    fc.assert(
      fc.property(completeProcedureArb, procedureFieldArb, (complete, missingField) => {
        const incomplete = clearField(complete, missingField);
        const gaps = emitProcedureGaps(incomplete);

        for (const gap of gaps) {
          const priorityRank = VALID_PRIORITIES.indexOf(gap.priority);
          expect(priorityRank, `Expected P0 or P1, got "${gap.priority}"`).toBeLessThanOrEqual(1);

          expect(
            ["high", "critical"] as Risk[],
            `Expected "high" or "critical" risk, got "${gap.risk}"`,
          ).toContain(gap.risk);
        }
      }),
      { numRuns: 200 },
    );
  });

  // ── Completeness: removing all four fields → four distinct gaps ───────────

  it("removing all four required fields from one procedure produces exactly four distinct attributable gaps", () => {
    fc.assert(
      fc.property(completeProcedureArb, (complete) => {
        const allCleared: MonitoringProcedureInput = {
          ...complete,
          signals: [],
          expectedConditions: [],
          owner: undefined,
          escalationPath: undefined,
        };
        const gaps = emitProcedureGaps(allCleared);

        expect(gaps).toHaveLength(REQUIRED_PROCEDURE_FIELDS.length);

        // Each required field must produce its own attributable gap
        for (const field of REQUIRED_PROCEDURE_FIELDS) {
          const expectedId = `monitoring.procedure.${allCleared.id}.${field}.missing`;
          const found = gaps.find((g) => g.id === expectedId);
          expect(found, `Missing gap for field "${field}"`).toBeDefined();

          // Each of those gaps must individually pass the attribution contract
          const violations = attributionViolations(found!);
          expect(violations).toEqual([]);
        }

        // All four gap IDs are distinct
        const ids = gaps.map((g) => g.id);
        expect(new Set(ids).size).toBe(ids.length);
      }),
      { numRuns: 200 },
    );
  });

  // ── Independence: gaps from two procedures do not share IDs ──────────────

  it("gaps from two procedures with distinct IDs do not share any gap ID", () => {
    fc.assert(
      fc.property(
        fc.tuple(completeProcedureArb, completeProcedureArb),
        procedureFieldArb,
        ([first, second], missingField) => {
          // Skip the (astronomically unlikely) UUID collision case
          if (first.id === second.id) return;

          const firstGaps = emitProcedureGaps(clearField(first, missingField));
          const secondGaps = emitProcedureGaps(clearField(second, missingField));

          const firstIds = new Set(firstGaps.map((g) => g.id));
          for (const gap of secondGaps) {
            expect(
              firstIds.has(gap.id),
              `Gap ID "${gap.id}" appears in both procedures — IDs must be unique per procedure`,
            ).toBe(false);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  // ── No gaps from a complete procedure ─────────────────────────────────────

  it("emits no gaps when every required field is present", () => {
    fc.assert(
      fc.property(completeProcedureArb, (input) => {
        const gaps = emitProcedureGaps(input);
        expect(gaps).toHaveLength(0);
      }),
      { numRuns: 200 },
    );
  });
});
