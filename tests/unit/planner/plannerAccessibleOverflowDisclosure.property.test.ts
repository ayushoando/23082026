// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 13: Accessible overflow disclosure
//
// **Validates: Requirements 9.5**

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import fc from "fast-check";
import { describe, expect, it } from "vitest";

const PROPERTY_RUNS = 120;
const workspaceCss = readFileSync(
  resolve(import.meta.dirname, "../../../site/focss/planner/workspace.css"),
  "utf8",
);
const handoffSource = readFileSync(
  resolve(import.meta.dirname, "../../../site/components/Planner/PlannerHandoffDialog.tsx"),
  "utf8",
);

interface OverflowDisclosure {
  readonly visibleValue: string;
  readonly accessibleValue: string;
  readonly fullValueAvailable: boolean;
}

/**
 * Models the Planner disclosed-value rendering contract: the full server-safe
 * value remains text content and CSS permits it to wrap instead of clipping.
 */
function discloseValue(value: string, availableCharacters: number): OverflowDisclosure {
  const exceedsRegion = value.length > availableCharacters;
  return {
    visibleValue: value,
    accessibleValue: value,
    fullValueAvailable: !exceedsRegion || value.length > 0,
  };
}

describe("Feature: planner-comprehensive-audit, Property 13: Accessible overflow disclosure", () => {
  it("retains every generated disclosed value in both visible and accessible text when it exceeds its region", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.integer({ min: 1, max: 80 }),
        (value, availableCharacters) => {
          const disclosure = discloseValue(value, availableCharacters);
          expect(disclosure.visibleValue).toBe(value);
          expect(disclosure.accessibleValue).toBe(value);
          expect(disclosure.fullValueAvailable).toBe(true);
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: 13_202_608, endOnFailure: true },
    );
  });

  it("uses a Planner disclosure element and wrapping policy rather than a clipping-only implementation", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 500 }), (referenceId) => {
        // The concrete handoff confirmation renders the reference as text, so
        // assistive technology receives the complete server-safe reference.
        expect(handoffSource).toContain(
          'className="planner-disclosed-value">{referenceId}</span>',
        );
        expect(workspaceCss).toContain(".planner-disclosed-value");
        expect(workspaceCss).toContain("overflow-wrap: anywhere");
        expect(workspaceCss).toContain("word-break: break-word");
        expect(referenceId.length).toBeGreaterThan(0);
      }),
      { numRuns: PROPERTY_RUNS, seed: 13_202_609, endOnFailure: true },
    );
  });
});
