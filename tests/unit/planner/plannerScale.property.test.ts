import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  PLANNER_SCALE_PX_PER_MM,
  plannerMmToPx,
  plannerPxToMm,
} from "@planner/lib/plannerGeometryContract";

/**
 * Feature: planner-comprehensive-audit, Property 4: Planner scale conversion
 *
 * Generate finite representable millimetre values and verify `mm × 0.05` and
 * inverse conversion within stored precision. At least 100 generated cases.
 *
 * **Validates: Requirements 3.3, 3.4**
 */
describe("Feature: planner-comprehensive-audit, Property 4: Planner scale conversion", () => {
  /** Arbitrary for finite representable millimetre values within stored geometry range. */
  const finiteMm = fc.double({
    min: -1_000_000,
    max: 1_000_000,
    noNaN: true,
    noDefaultInfinity: true,
  });

  /**
   * Small-magnitude millimetre values that stress the precision boundary where
   * IEEE 754 double multiply/divide round-trip fidelity matters most.
   */
  const smallMm = fc.double({
    min: -1,
    max: 1,
    noNaN: true,
    noDefaultInfinity: true,
  });

  /**
   * Large-magnitude millimetre values that test the upper range of geometry
   * coordinates (e.g. large floor plans in mm).
   */
  const largeMm = fc.double({
    min: -1_000_000,
    max: 1_000_000,
    noNaN: true,
    noDefaultInfinity: true,
  }).filter((v) => Math.abs(v) >= 1_000);

  /**
   * Normal (non-subnormal, non-zero) finite millimetre values. Subnormal
   * doubles like 5e-324 collapse to zero when multiplied by any scale factor
   * smaller than 1, making both 0.05 and 0.2 produce the same result. We
   * exclude them from the "never applies Studio scale" property because the
   * property concerns distinguishable conversion results.
   */
  const normalFiniteMm = fc.double({
    min: -1_000_000,
    max: 1_000_000,
    noNaN: true,
    noDefaultInfinity: true,
  }).filter((v) => v !== 0 && Math.abs(v) > Number.MIN_VALUE * 16);

  const NUM_RUNS = 150;

  it("canonical scale constant is exactly 0.05 px/mm", () => {
    /** Validates: Requirements 3.3 */
    expect(PLANNER_SCALE_PX_PER_MM).toBe(0.05);
  });

  it("mm → px produces exactly mm × 0.05 for all finite representable values", () => {
    /** Validates: Requirements 3.3, 3.4 */
    fc.assert(
      fc.property(finiteMm, (millimetres) => {
        const pixels = plannerMmToPx(millimetres);

        // Forward conversion must be exact multiplication by the Planner scale
        expect(pixels).toBe(millimetres * 0.05);

        // Result must remain finite (no overflow to Infinity)
        expect(Number.isFinite(pixels)).toBe(true);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("px → mm inverts mm → px within stored numeric precision", () => {
    /** Validates: Requirements 3.3, 3.4 */
    fc.assert(
      fc.property(finiteMm, (millimetres) => {
        const pixels = plannerMmToPx(millimetres);
        const recovered = plannerPxToMm(pixels);

        // IEEE 754 double division by 0.05 (= multiply by 20) introduces up
        // to ~1 ULP of error at large magnitudes. 8 decimal places covers
        // stored geometry precision (sub-micrometre for mm values up to 1e6).
        expect(recovered).toBeCloseTo(millimetres, 8);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("round-trip preserves value through JSON serialization (stored precision)", () => {
    /** Validates: Requirements 3.3, 3.4 */
    fc.assert(
      fc.property(finiteMm, (millimetres) => {
        const pixels = plannerMmToPx(millimetres);

        // Simulate persistence: JSON round-trip the pixel value
        const storedPx = JSON.parse(JSON.stringify(pixels)) as number;
        const recovered = plannerPxToMm(storedPx);

        // Simulate persistence: JSON round-trip the original mm value
        const storedMm = JSON.parse(JSON.stringify(millimetres)) as number;

        // Recovered value through JSON-stored pixel must match the
        // JSON-stored original millimetres within stored geometry precision.
        // 8 decimal places allows for IEEE 754 multiply/divide round-trip
        // error at the extremes of the geometry range.
        expect(recovered).toBeCloseTo(storedMm, 8);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("handles small-magnitude values near precision boundary", () => {
    /** Validates: Requirements 3.3, 3.4 */
    fc.assert(
      fc.property(smallMm, (millimetres) => {
        const pixels = plannerMmToPx(millimetres);
        expect(pixels).toBe(millimetres * 0.05);

        const recovered = plannerPxToMm(pixels);
        expect(recovered).toBeCloseTo(millimetres, 8);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("handles large-magnitude geometry coordinates", () => {
    /** Validates: Requirements 3.3, 3.4 */
    fc.assert(
      fc.property(largeMm, (millimetres) => {
        const pixels = plannerMmToPx(millimetres);
        expect(pixels).toBe(millimetres * 0.05);

        const recovered = plannerPxToMm(pixels);
        expect(recovered).toBeCloseTo(millimetres, 8);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("never applies Studio scale 0.2 px/mm for normal finite values", () => {
    /** Validates: Requirements 3.3, 3.4 */
    fc.assert(
      fc.property(normalFiniteMm, (millimetres) => {
        const plannerPixels = plannerMmToPx(millimetres);
        const studioPixels = millimetres * 0.2;

        // For normal non-zero doubles the two scales must produce different results
        expect(plannerPixels).not.toBe(studioPixels);

        // Forward conversion must use 0.05, not 0.2
        expect(plannerPixels).toBe(millimetres * PLANNER_SCALE_PX_PER_MM);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("rejects non-finite inputs", () => {
    /** Validates: Requirements 3.3 */
    expect(() => plannerMmToPx(NaN)).toThrow();
    expect(() => plannerMmToPx(Infinity)).toThrow();
    expect(() => plannerMmToPx(-Infinity)).toThrow();
    expect(() => plannerPxToMm(NaN)).toThrow();
    expect(() => plannerPxToMm(Infinity)).toThrow();
    expect(() => plannerPxToMm(-Infinity)).toThrow();
  });

  it("converts zero correctly", () => {
    /** Validates: Requirements 3.3, 3.4 */
    expect(plannerMmToPx(0)).toBe(0);
    expect(plannerPxToMm(0)).toBe(0);
    // -0 × 0.05 = -0 per IEEE 754; JSON.stringify normalizes to 0
    const jsonNormalized = JSON.parse(JSON.stringify(plannerMmToPx(-0))) as number;
    expect(jsonNormalized).toBe(0);
    expect(Object.is(jsonNormalized, 0)).toBe(true);
  });
});
