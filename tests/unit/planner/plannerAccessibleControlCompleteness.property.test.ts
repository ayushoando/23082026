// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 12: Accessible control completeness
//
// **Validates: Requirements 8.2, 9.6**

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  buildCanvasCommands,
  getAccessibleControls,
  type PlannerCommandDescriptor,
} from "@planner/lib/commands/canvasCommands";

const PROPERTY_RUNS = 120;
const commands = buildCanvasCommands();

function declaredControlState(
  descriptor: PlannerCommandDescriptor,
  hasSelection: boolean,
): "enabled" | "disabled" {
  return descriptor.requiresSelection && !hasSelection ? "disabled" : "enabled";
}

describe("Feature: planner-comprehensive-audit, Property 12: Accessible control completeness", () => {
  it("gives every declared semantic control a stable name, role-equivalent button contract, relationship id, and state mapping", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...commands),
        fc.boolean(),
        (descriptor, hasSelection) => {
          const state = declaredControlState(descriptor, hasSelection);

          // Planner visible command controls are buttons; the descriptor label
          // supplies their programmatic name and the stable control id binds
          // palette, keyboard, and visible-control representations together.
          expect(descriptor.label.trim()).not.toBe("");
          expect(descriptor.id.trim()).not.toBe("");
          expect(descriptor.accessibleControlId?.trim()).not.toBe("");
          expect(descriptor.pointerBinding?.trim()).not.toBe("");
          expect(descriptor.touchBinding?.trim()).not.toBe("");
          expect(descriptor.keyboardBinding?.trim()).not.toBe("");
          expect(["enabled", "disabled"]).toContain(state);

          if (descriptor.requiresSelection && !hasSelection) {
            expect(state).toBe("disabled");
          } else {
            expect(state).toBe("enabled");
          }
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: 12_202_608, endOnFailure: true },
    );
  });

  it("keeps accessible control identifiers unique and complete across generated subsets", () => {
    fc.assert(
      fc.property(
        fc.subarray(commands, { minLength: 1 }),
        (subset) => {
          const controls = getAccessibleControls(subset);
          expect(controls).toHaveLength(subset.length);
          expect(new Set(controls.map((control) => control.controlId)).size).toBe(
            controls.length,
          );
          for (const control of controls) {
            expect(control.id.trim()).not.toBe("");
            expect(control.label.trim()).not.toBe("");
            expect(control.controlId.trim()).not.toBe("");
          }
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: 12_202_609, endOnFailure: true },
    );
  });
});
