import { describe, it, expect } from "vitest";
import { buildValidationFloorFromCanvas } from "@/lib/Planner/buildValidationFloor";
import { PLANNER_SCALE_PX_PER_MM } from "@planner/lib/plannerGeometryContract";

describe("buildValidationFloorFromCanvas", () => {
  const scale = PLANNER_SCALE_PX_PER_MM; // 0.05 px/mm → 1 px = 20 mm
  const sheet = { width_mm: 10000, height_mm: 8000 };

  it("maps walls, furniture (center-origin), and attached openings", () => {
    const floor = buildValidationFloorFromCanvas(
      [
        {
          left: 10,
          top: 20,
          width: 12,
          height: 6,
          data: { kind: "furniture", id: "f1" },
        },
        {
          x1: 0,
          y1: 0,
          x2: 50,
          y2: 0,
          strokeWidth: 1,
          data: { kind: "wall", id: "w1" },
        },
        {
          left: 5,
          top: 0,
          width: 9,
          height: 1,
          data: {
            kind: "door",
            id: "d1",
            wallId: "w1",
            position: 0.4,
          },
        },
        {
          left: 20,
          top: 0,
          width: 12,
          height: 1,
          data: {
            kind: "window",
            id: "win1",
            wallId: "w1",
            position: 0.7,
          },
        },
      ],
      scale,
      sheet,
    );

    expect(floor.sheet).toEqual({ widthMm: 10000, depthMm: 8000 });
    expect(floor.walls).toHaveLength(1);
    // 50 px / 0.05 = 1000 mm
    expect(floor.walls[0]).toMatchObject({
      id: "w1",
      start: { x: 0, y: 0 },
      end: { x: 1000, y: 0 },
    });

    // furnitureFromFabric top-left → furnitureToCenterOrigin
    // left=10 → 200mm, top=20 → 400mm, width=12 → 240mm, height=6 → 120mm
    // center: x = 200 + 240/2 = 320, y = 400 + 120/2 = 460
    expect(floor.furniture).toHaveLength(1);
    expect(floor.furniture[0]?.id).toBe("f1");
    expect(floor.furniture[0]?.xMm).toBe(10 / scale + (12 / scale) / 2); // 200 + 120 = 320
    expect(floor.furniture[0]?.yMm).toBe(20 / scale + (6 / scale) / 2); // 400 + 60 = 460

    expect(floor.doors).toHaveLength(1);
    // 9 px / 0.05 = 180 mm
    expect(floor.doors[0]).toMatchObject({
      id: "d1",
      wallId: "w1",
      position: 0.4,
      kind: "door",
      width: 180,
    });

    expect(floor.windows).toHaveLength(1);
    // 12 px / 0.05 = 240 mm
    expect(floor.windows[0]).toMatchObject({
      id: "win1",
      wallId: "w1",
      position: 0.7,
      kind: "window",
      width: 240,
    });
  });

  it("filters doors/windows without wallId or position", () => {
    const floor = buildValidationFloorFromCanvas(
      [
        {
          x1: 0,
          y1: 0,
          x2: 40,
          y2: 0,
          strokeWidth: 1,
          data: { kind: "wall", id: "w1" },
        },
        {
          left: 1,
          top: 0,
          width: 9,
          height: 1,
          data: { kind: "door", id: "orphan-door" },
        },
        {
          left: 2,
          top: 0,
          width: 9,
          height: 1,
          data: { kind: "door", id: "no-pos", wallId: "w1" },
        },
        {
          left: 3,
          top: 0,
          width: 10,
          height: 1,
          data: { kind: "window", id: "orphan-win", position: 0.5 },
        },
      ],
      scale,
      sheet,
    );

    expect(floor.doors).toEqual([]);
    expect(floor.windows).toEqual([]);
  });

  it("defaults door/window widths when fabric width is zero", () => {
    const floor = buildValidationFloorFromCanvas(
      [
        {
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 0,
          strokeWidth: 1,
          data: { kind: "wall", id: "w1" },
        },
        {
          left: 10,
          top: 0,
          width: 0,
          height: 1,
          data: {
            kind: "door",
            id: "d-zero",
            wallId: "w1",
            position: 0.3,
          },
        },
        {
          left: 40,
          top: 0,
          width: 0,
          height: 1,
          data: {
            kind: "window",
            id: "win-zero",
            wallId: "w1",
            position: 0.6,
          },
        },
      ],
      scale,
      sheet,
    );

    expect(floor.doors[0]?.width).toBe(900);
    expect(floor.windows[0]?.width).toBe(1200);
  });

  it("accepts null canvas and empty scene", () => {
    const floor = buildValidationFloorFromCanvas(null, scale, sheet);
    expect(floor.furniture).toEqual([]);
    expect(floor.walls).toEqual([]);
    expect(floor.doors).toEqual([]);
    expect(floor.windows).toEqual([]);
    expect(floor.sheet.widthMm).toBe(10000);
  });
});
