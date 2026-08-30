/**
 * Feature: ai-implementation-audit
 *
 * Unit tests for the AI_STACK_FINDINGS dataset invariants.
 *
 * Validates:
 *   - Every finding has a non-empty id, evidence, description
 *   - Every finding has a non-empty location.file
 *   - Every finding has a valid severity (one of the 5 values)
 *   - Every finding has a valid changeClass (one of the 7 values)
 *   - Every finding has a valid dimension (one of the 7 values)
 *   - sequenceBySeverity(AI_STACK_FINDINGS) produces descending severity rank
 *   - routing-001 is approval-gated; all other findings are safe (non-gated)
 *
 * Requirements: 1.2, 1.4
 */

import { describe, it, expect } from "vitest";

import { AI_STACK_FINDINGS } from "@/lib/ai/audit/findings";
import {
  isApprovalGated,
  sequenceBySeverity,
  SEVERITY_RANK,
  type Severity,
  type AuditDimension,
  type ChangeClass,
} from "@/lib/ai/audit/finding";

// ---------------------------------------------------------------------------
// Allowed value sets
// ---------------------------------------------------------------------------

const VALID_SEVERITIES: readonly Severity[] = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
];

const VALID_CHANGE_CLASSES: readonly ChangeClass[] = [
  "safe",
  "provider-config",
  "prompt-change",
  "retrieval-ranking",
  "auth-rule",
  "db-write",
  "model-id",
];

const VALID_DIMENSIONS: readonly AuditDimension[] = [
  "correctness",
  "provider-routing",
  "retrieval-quality",
  "error-handling",
  "observability",
  "route-contract",
  "performance",
];

// ---------------------------------------------------------------------------
// Dataset presence guard
// ---------------------------------------------------------------------------

describe("AI_STACK_FINDINGS dataset", () => {
  it("is a non-empty readonly array", () => {
    expect(Array.isArray(AI_STACK_FINDINGS)).toBe(true);
    expect(AI_STACK_FINDINGS.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Per-finding structural invariants
  // -------------------------------------------------------------------------

  describe("every finding has required non-empty string fields", () => {
    it("id is a non-empty string", () => {
      for (const finding of AI_STACK_FINDINGS) {
        expect(typeof finding.id).toBe("string");
        expect(finding.id.trim().length).toBeGreaterThan(0);
      }
    });

    it("evidence is a non-empty string", () => {
      for (const finding of AI_STACK_FINDINGS) {
        expect(typeof finding.evidence).toBe("string");
        expect(finding.evidence.trim().length).toBeGreaterThan(0);
      }
    });

    it("description is a non-empty string", () => {
      for (const finding of AI_STACK_FINDINGS) {
        expect(typeof finding.description).toBe("string");
        expect(finding.description.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe("every finding has a valid location", () => {
    it("location.file is a non-empty string", () => {
      for (const finding of AI_STACK_FINDINGS) {
        expect(typeof finding.location.file).toBe("string");
        expect(finding.location.file.trim().length).toBeGreaterThan(0);
      }
    });

    it("location.line, if present, is a positive integer", () => {
      for (const finding of AI_STACK_FINDINGS) {
        if (finding.location.line !== undefined) {
          expect(Number.isInteger(finding.location.line)).toBe(true);
          expect(finding.location.line).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("every finding has a valid severity", () => {
    it("severity is one of the 5 defined values", () => {
      for (const finding of AI_STACK_FINDINGS) {
        expect(VALID_SEVERITIES).toContain(finding.severity);
      }
    });
  });

  describe("every finding has a valid changeClass", () => {
    it("changeClass is one of the 7 defined values", () => {
      for (const finding of AI_STACK_FINDINGS) {
        expect(VALID_CHANGE_CLASSES).toContain(finding.changeClass);
      }
    });
  });

  describe("every finding has a valid dimension", () => {
    it("dimension is one of the 7 defined values", () => {
      for (const finding of AI_STACK_FINDINGS) {
        expect(VALID_DIMENSIONS).toContain(finding.dimension);
      }
    });
  });

  // -------------------------------------------------------------------------
  // id uniqueness
  // -------------------------------------------------------------------------

  it("all finding ids are unique", () => {
    const ids = AI_STACK_FINDINGS.map((f) => f.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  // -------------------------------------------------------------------------
  // sequenceBySeverity produces descending rank order
  // -------------------------------------------------------------------------

  describe("sequenceBySeverity(AI_STACK_FINDINGS)", () => {
    it("produces a non-increasing severity rank sequence", () => {
      const ordered = sequenceBySeverity(AI_STACK_FINDINGS);

      expect(ordered).toHaveLength(AI_STACK_FINDINGS.length);

      for (let i = 0; i < ordered.length - 1; i++) {
        const currentRank = SEVERITY_RANK[ordered[i]!.severity];
        const nextRank = SEVERITY_RANK[ordered[i + 1]!.severity];
        expect(currentRank).toBeGreaterThanOrEqual(nextRank);
      }
    });

    it("does not mutate the original AI_STACK_FINDINGS array", () => {
      const snapshotIds = AI_STACK_FINDINGS.map((f) => f.id);
      sequenceBySeverity(AI_STACK_FINDINGS);
      const afterIds = AI_STACK_FINDINGS.map((f) => f.id);
      expect(afterIds).toEqual(snapshotIds);
    });

    it("contains all the same findings (same ids, possibly reordered)", () => {
      const ordered = sequenceBySeverity(AI_STACK_FINDINGS);
      const originalIds = new Set(AI_STACK_FINDINGS.map((f) => f.id));
      const orderedIds = new Set(ordered.map((f) => f.id));
      expect(orderedIds).toEqual(originalIds);
    });
  });

  // -------------------------------------------------------------------------
  // Gated vs non-gated split
  // -------------------------------------------------------------------------

  describe("approval-gating split", () => {
    it("routing-001 is approval-gated (changeClass !== 'safe')", () => {
      const routing001 = AI_STACK_FINDINGS.find((f) => f.id === "routing-001");
      expect(routing001).toBeDefined();
      expect(isApprovalGated(routing001!)).toBe(true);
    });

    it("all findings other than routing-001 are not approval-gated (changeClass === 'safe')", () => {
      const others = AI_STACK_FINDINGS.filter((f) => f.id !== "routing-001");
      expect(others.length).toBeGreaterThan(0);
      for (const finding of others) {
        expect(isApprovalGated(finding)).toBe(
          false,
          `Expected finding '${finding.id}' to be safe (non-gated) but got changeClass='${finding.changeClass}'`,
        );
      }
    });

    it("the gated count is exactly 1 (routing-001 only)", () => {
      const gated = AI_STACK_FINDINGS.filter((f) => isApprovalGated(f));
      expect(gated).toHaveLength(1);
      expect(gated[0]!.id).toBe("routing-001");
    });

    it("the safe (non-gated) count equals total findings minus 1", () => {
      const safe = AI_STACK_FINDINGS.filter((f) => !isApprovalGated(f));
      expect(safe).toHaveLength(AI_STACK_FINDINGS.length - 1);
    });
  });
});
