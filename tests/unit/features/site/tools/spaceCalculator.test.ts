import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  calculateSpace,
  calculateSpaceFromDims,
  DENSITY_PRESETS,
  grossAreaSqm,
  isDensityPresetId,
  MEETING_ROOM_PRESET_IDS,
  OFFICE_SPACE_PRESET_IDS,
  seatsByDensity,
  usableAreaSqm,
} from "@/features/site/tools/spaceCalculator";

describe("spaceCalculator", () => {
  it("is a single engine for office and meeting presets", () => {
    expect(OFFICE_SPACE_PRESET_IDS).toEqual([
      "open-office",
      "cubicle",
      "meeting",
      "classroom",
      "clinic-waiting",
    ]);
    expect(MEETING_ROOM_PRESET_IDS).toEqual(["meeting", "classroom", "open-office"]);
    expect(isDensityPresetId("meeting")).toBe(true);
    expect(isDensityPresetId("budget")).toBe(false);
  });

  it("computes NBC open-office 10x8 as 80 gross / 54.4 usable / 9 seats", () => {
    const result = calculateSpaceFromDims(10, 8, "open-office");
    expect(result.grossSqm).toBe(80);
    expect(result.usableSqm).toBeCloseTo(54.4, 5);
    expect(result.seats).toBe(9);
    expect(result.sqmPerSeat).toBe(DENSITY_PRESETS["open-office"].sqmPerSeat);
  });

  it("computes meeting 6x4 as 24 gross / 18 usable / 8 seats", () => {
    const result = calculateSpace({
      dims: { lengthM: 6, widthM: 4 },
      presetId: "meeting",
    });
    expect(result.grossSqm).toBe(24);
    expect(result.usableSqm).toBe(18);
    expect(result.seats).toBe(8);
  });

  it("guards non-positive dims", () => {
    expect(grossAreaSqm({ lengthM: 0, widthM: 5 })).toBe(0);
    expect(usableAreaSqm(0, 0.32)).toBe(0);
    expect(seatsByDensity(0, 6)).toBe(0);
    expect(calculateSpaceFromDims(0, 5, "open-office").seats).toBe(0);
  });

  it("does not import Planner or Studio (path contract)", () => {
    const srcPath = [
      path.resolve(process.cwd(), "site/features/site/tools/spaceCalculator.ts"),
      path.resolve(process.cwd(), "features/site/tools/spaceCalculator.ts"),
    ].find((candidate) => existsSync(candidate));
    expect(srcPath).toBeTruthy();
    const src = readFileSync(srcPath!, "utf8");
    expect(src).not.toMatch(/lib\/Planner|lib\/Studio|@planner|@studio/);
  });
});
