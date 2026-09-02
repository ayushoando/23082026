/**
 * Feature: ai-implementation-audit
 *
 * Property-based tests for the Finding audit model.
 *
 * Property 1: Remediation ordering is descending by severity
 * Property 2: Approval-gated findings are flagged
 *
 * ≥100 fast-check iterations each.
 */

import * as fc from "fast-check";
import { describe, it, expect } from "vitest";

import {
  type Finding,
  type Severity,
  type AuditDimension,
  type ChangeClass,
  SEVERITY_RANK,
  sequenceBySeverity,
  isApprovalGated,
} from "@/lib/ai/audit/finding";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const severityArb: fc.Arbitrary<Severity> = fc.constantFrom(
  "critical",
  "high",
  "medium",
  "low",
  "info",
);

const dimensionArb: fc.Arbitrary<AuditDimension> = fc.constantFrom(
  "correctness",
  "provider-routing",
  "retrieval-quality",
  "error-handling",
  "observability",
  "route-contract",
  "performance",
);

const changeClassArb: fc.Arbitrary<ChangeClass> = fc.constantFrom(
  "safe",
  "provider-config",
  "prompt-change",
  "retrieval-ranking",
  "auth-rule",
  "db-write",
  "model-id",
);

const findingArb: fc.Arbitrary<Finding> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 64 }),
  dimension: dimensionArb,
  severity: severityArb,
  location: fc.record({
    file: fc.string({ minLength: 1, maxLength: 128 }),
    line: fc.option(fc.nat({ max: 9999 }), { nil: undefined }),
  }),
  evidence: fc.string({ minLength: 1, maxLength: 256 }),
  changeClass: changeClassArb,
  description: fc.string({ minLength: 1, maxLength: 256 }),
});

// ---------------------------------------------------------------------------
// Property 1: Remediation ordering is descending by severity
// ---------------------------------------------------------------------------

describe("Feature: ai-implementation-audit", () => {
  describe("Property 1: Remediation ordering is descending by severity", () => {
    it("sequenceBySeverity returns findings in non-increasing severity rank order", () => {
      fc.assert(
        fc.property(fc.array(findingArb), (findings) => {
          const ordered = sequenceBySeverity(findings);

          // Result must have the same length as input.
          expect(ordered).toHaveLength(findings.length);

          // Each element's rank must be ≥ the rank of every element after it.
          for (let i = 0; i < ordered.length - 1; i++) {
            const currentRank = SEVERITY_RANK[ordered[i]!.severity];
            const nextRank = SEVERITY_RANK[ordered[i + 1]!.severity];
            expect(currentRank).toBeGreaterThanOrEqual(nextRank);
          }
        }),
        { numRuns: 100 },
      );
    });

    it("sequenceBySeverity does not mutate the original array", () => {
      fc.assert(
        fc.property(fc.array(findingArb, { minLength: 1 }), (findings) => {
          const snapshot = findings.map((f) => f.severity);
          sequenceBySeverity(findings);
          const afterIds = findings.map((f) => f.severity);
          expect(afterIds).toEqual(snapshot);
        }),
        { numRuns: 100 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Property 2: Approval-gated findings are flagged
  // -------------------------------------------------------------------------

  describe("Property 2: Approval-gated findings are flagged", () => {
    it("isApprovalGated returns true iff changeClass is not 'safe'", () => {
      fc.assert(
        fc.property(findingArb, (finding) => {
          const gated = isApprovalGated(finding);
          const expected = finding.changeClass !== "safe";
          expect(gated).toBe(expected);
        }),
        { numRuns: 100 },
      );
    });

    it("isApprovalGated returns false for every finding with changeClass 'safe'", () => {
      fc.assert(
        fc.property(
          findingArb.filter((f) => f.changeClass === "safe"),
          (finding) => {
            expect(isApprovalGated(finding)).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("isApprovalGated returns true for every finding with an approval-gated changeClass", () => {
      const gatedArb: fc.Arbitrary<ChangeClass> = fc.constantFrom(
        "provider-config",
        "prompt-change",
        "retrieval-ranking",
        "auth-rule",
        "db-write",
        "model-id",
      );
      fc.assert(
        fc.property(
          findingArb.chain((f) =>
            gatedArb.map((cc) => ({ ...f, changeClass: cc })),
          ),
          (finding) => {
            expect(isApprovalGated(finding)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
