import { describe, expect, it } from "vitest";

import {
  calculateSpaceEstimate,
  type SpaceCalculatorPreset,
} from "@/components/tools/SpaceCalculator";

const OPEN_WORKSPACE: SpaceCalculatorPreset = {
  id: "open-workspace",
  label: "Open workspace",
  description: "Shared workstations with planning circulation.",
  circulationFraction: 0.32,
  areaPerPersonSqm: 6,
};

describe("calculateSpaceEstimate", () => {
  it("derives gross, circulation, usable area, and conservative workstation capacity", () => {
    const estimate = calculateSpaceEstimate(10, 8, OPEN_WORKSPACE);

    expect(estimate.grossAreaSqm).toBe(80);
    expect(estimate.circulationAreaSqm).toBeCloseTo(25.6);
    expect(estimate.usableAreaSqm).toBeCloseTo(54.4);
    expect(estimate.recommendedCapacity).toBe(9);
  });

  it("never overstates capacity when the usable area is smaller than one planning position", () => {
    const estimate = calculateSpaceEstimate(1, 1, OPEN_WORKSPACE);

    expect(estimate.recommendedCapacity).toBe(0);
  });
});
