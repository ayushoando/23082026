import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  PLANNER_SCALE_PX_PER_MM,
  plannerMmToPx,
  plannerPxToMm,
} from "@planner/lib/plannerGeometryContract";

// Property 4: Planner scale conversion. Authored for Gate B; execution is owner-controlled.
describe("Property 4: Planner scale conversion", () => {
  it("uses exactly 0.05 px/mm and preserves finite physical values", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1_000_000, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        (millimetres) => {
          const pixels = plannerMmToPx(millimetres);
          expect(PLANNER_SCALE_PX_PER_MM).toBe(0.05);
          expect(pixels).toBe(millimetres * 0.05);
          expect(plannerPxToMm(pixels)).toBeCloseTo(millimetres, 10);
        },
      ),
    );
  });
});
