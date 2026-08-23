import { describe, it, expect } from "vitest";
import { workstationV0UnitPriceInr } from "@/lib/catalog/workstationBoqV0";
import { generateWorkstationV0MeshPlan } from "@/lib/catalog/workstationMeshV0";
import {
  createWorkstationConfigV0,
  type WorkstationConfigV0,
  type WorkstationModuleKindV0,
} from "@/lib/catalog/workstationSystemV0";

describe("workstationV0UnitPriceInr", () => {
  it("prices a base linear desk at the base rate rounded to 100s", () => {
    const config = createWorkstationConfigV0({
      shape: "linear",
      size: { lengthMm: 1200, depthMm: 600 },
    });
    // areaFactor 1, shapeFactor 1, no priced modules -> BASE_INR (12_500).
    expect(workstationV0UnitPriceInr(config)).toBe(12_500);
  });

  it("adds priced modules and the l-shape multiplier", () => {
    const config = createWorkstationConfigV0({
      shape: "l-shape",
      size: { lengthMm: 1200, depthMm: 600 },
      modules: ["desk", "panel", "pedestal", "overhead"],
    });
    // 12_500 * 1 * 1.65 + (0 + 2_800 + 4_200 + 5_500) = 20_625 + 12_500 = 33_125 -> 33_100.
    expect(workstationV0UnitPriceInr(config)).toBe(33_100);
  });

  it("treats unknown module kinds as zero-priced (defensive guard)", () => {
    const config = {
      shape: "linear",
      size: { lengthMm: 1200, depthMm: 600 },
      modules: ["desk", "mystery"] as unknown as WorkstationModuleKindV0[],
      heightMm: 750,
    } satisfies WorkstationConfigV0;
    expect(workstationV0UnitPriceInr(config)).toBe(12_500);
  });
});

describe("generateWorkstationV0MeshPlan", () => {
  it("emits a desk top plus a part per non-desk module with panel height override", () => {
    const config = createWorkstationConfigV0({
      shape: "linear",
      size: { lengthMm: 1500, depthMm: 750 },
      modules: ["desk", "panel", "pedestal"],
      heightMm: 720,
    });

    const plan = generateWorkstationV0MeshPlan(config);

    expect(plan.parts.map((p) => p.id)).toEqual(["desk-top", "panel", "pedestal"]);

    const deskTop = plan.parts.find((p) => p.id === "desk-top");
    expect(deskTop).toMatchObject({ widthMm: 1500, depthMm: 750, heightMm: 25 });

    const panel = plan.parts.find((p) => p.id === "panel");
    expect(panel).toMatchObject({ widthMm: 600, depthMm: 400, heightMm: 400 });

    const pedestal = plan.parts.find((p) => p.id === "pedestal");
    // Non-panel modules inherit the configured height, not the 400mm panel override.
    expect(pedestal?.heightMm).toBe(720);
    expect(plan.footprint).toEqual({ widthMm: 1500, depthMm: 750 });
  });
});
