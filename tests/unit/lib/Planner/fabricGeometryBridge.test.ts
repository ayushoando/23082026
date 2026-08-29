import { describe, it, expect } from "vitest";
import {
  furnitureFromFabric,
  wallFromFabric,
  collectSceneGeometry,
  furnitureToCenterOrigin,
  pxToMm,
  mmToPx,
} from "@/lib/Planner/fabricGeometryBridge";
import { PLANNER_SCALE_PX_PER_MM } from "@planner/lib/plannerGeometryContract";

describe("fabricGeometryBridge", () => {
  const scale = PLANNER_SCALE_PX_PER_MM; // 0.05 px/mm → 1 px = 20 mm

  it("maps furniture data + left/top/width/height to mm rect", () => {
    const rect = furnitureFromFabric(
      {
        left: 10,
        top: 20,
        width: 5,
        height: 3,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        data: { kind: "furniture", id: "f1", furniture_id: "desk-a" },
      },
      scale,
    );
    expect(rect).toEqual({
      id: "f1",
      xMm: 200,
      yMm: 400,
      widthMm: 100,
      depthMm: 60,
      rotationDeg: 0,
      catalogId: "desk-a",
      label: undefined,
    });
  });

  it("returns null for non-furniture", () => {
    expect(
      furnitureFromFabric({ left: 0, top: 0, data: { kind: "wall" } }, scale),
    ).toBeNull();
    expect(furnitureFromFabric({ left: 0, top: 0, data: null }, scale)).toBeNull();
  });

  it("prefers catalog dimensions over scaled pixel size", () => {
    const rect = furnitureFromFabric(
      {
        left: 0,
        top: 0,
        width: 1,
        height: 1,
        scaleX: 2,
        scaleY: 3,
        angle: 15,
        data: {
          kind: "furniture",
          id: "f-dim",
          label: "Desk",
          furniture_id: "cat-1",
          dimensions: { width_mm: 1400, depth_mm: 700 },
        },
      },
      scale,
    );
    expect(rect?.widthMm).toBe(1400);
    expect(rect?.depthMm).toBe(700);
    expect(rect?.label).toBe("Desk");
    expect(rect?.rotationDeg).toBe(15);
  });

  it("ignores non-positive dimension overrides", () => {
    const rect = furnitureFromFabric(
      {
        left: 0,
        top: 0,
        width: 4,
        height: 2,
        data: {
          kind: "furniture",
          id: "f-bad-dim",
          dimensions: { width_mm: 0, depth_mm: -5 },
        },
      },
      scale,
    );
    // 4 px / 0.05 = 80 mm, 2 px / 0.05 = 40 mm
    expect(rect?.widthMm).toBe(80);
    expect(rect?.depthMm).toBe(40);
  });

  it("maps wall line endpoints to mm", () => {
    const wall = wallFromFabric(
      {
        x1: 0,
        y1: 0,
        x2: 50,
        y2: 0,
        strokeWidth: 1.5,
        data: { kind: "wall", id: "w1" },
      },
      scale,
    );
    expect(wall).toEqual({
      id: "w1",
      x1Mm: 0,
      y1Mm: 0,
      x2Mm: 1000,
      y2Mm: 0,
      thicknessMm: 30,
    });
  });

  it("falls back to rect-like wall when endpoints missing", () => {
    const wall = wallFromFabric(
      {
        left: 10,
        top: 20,
        width: 40,
        height: 2,
        scaleX: 1,
        scaleY: 1,
        strokeWidth: 2,
        data: { kind: "wall", id: "w-rect" },
      },
      scale,
    );
    expect(wall).toEqual({
      id: "w-rect",
      x1Mm: 200,
      y1Mm: 400,
      x2Mm: 1000,
      y2Mm: 440,
      thicknessMm: 40,
    });
  });

  it("returns null for non-wall objects in wallFromFabric", () => {
    expect(
      wallFromFabric({ left: 0, top: 0, data: { kind: "furniture" } }, scale),
    ).toBeNull();
  });

  it("collects mixed scene objects including windows", () => {
    const scene = collectSceneGeometry(
      [
        {
          left: 0,
          top: 0,
          width: 10,
          height: 10,
          data: { kind: "furniture", id: "f1" },
        },
        {
          x1: 0,
          y1: 0,
          x2: 20,
          y2: 0,
          strokeWidth: 1,
          data: { kind: "wall", id: "w1" },
        },
        {
          left: 5,
          top: 5,
          width: 9,
          height: 1,
          data: { kind: "door", id: "d1", wallId: "w1", position: 0.5 },
        },
        {
          left: 12,
          top: 5,
          width: 12,
          height: 1,
          data: { kind: "window", id: "win1", wallId: "w1", position: 0.8 },
        },
        { left: 0, top: 0, data: { kind: "furniture", isGridLine: true } },
        { left: 0, top: 0, data: { kind: "furniture", isSheet: true } },
        { left: 0, top: 0, data: { kind: "furniture", isGuide: true } },
        { left: 0, top: 0, data: { kind: "door", isPreview: true } },
      ],
      scale,
    );
    expect(scene.furniture).toHaveLength(1);
    expect(scene.walls).toHaveLength(1);
    expect(scene.doors).toHaveLength(1);
    expect(scene.doors[0]?.wallId).toBe("w1");
    expect(scene.windows).toHaveLength(1);
    expect(scene.windows[0]?.id).toBe("win1");
    expect(scene.windows[0]?.kind).toBe("window");
  });

  it("collects from canvas getObjects() and assigns fallback ids", () => {
    const scene = collectSceneGeometry(
      {
        getObjects: () => [
          {
            left: 1,
            top: 2,
            width: 3,
            height: 4,
            data: { kind: "furniture" },
          },
          {
            x1: 0,
            y1: 0,
            x2: 10,
            y2: 0,
            strokeWidth: 1,
            data: { kind: "wall" },
          },
          {
            left: 0,
            top: 0,
            width: 5,
            height: 1,
            data: { kind: "door" },
          },
          {
            left: 0,
            top: 0,
            width: 6,
            height: 1,
            data: { kind: "window" },
          },
        ],
      },
      scale,
    );
    expect(scene.furniture[0]?.id).toBe("furniture_0");
    expect(scene.walls[0]?.id).toBe("wall_1");
    expect(scene.doors[0]?.id).toBe("door_2");
    expect(scene.windows[0]?.id).toBe("window_3");
  });

  it("collects from canvas.objects when getObjects is absent", () => {
    const scene = collectSceneGeometry(
      {
        objects: [
          {
            left: 0,
            top: 0,
            width: 2,
            height: 2,
            data: { kind: "furniture", id: "via-objects" },
          },
        ],
      },
      scale,
    );
    expect(scene.furniture[0]?.id).toBe("via-objects");
  });

  it("returns empty scene for null/undefined canvas", () => {
    expect(collectSceneGeometry(null, scale)).toEqual({
      furniture: [],
      walls: [],
      doors: [],
      windows: [],
    });
    expect(collectSceneGeometry(undefined, scale)).toEqual({
      furniture: [],
      walls: [],
      doors: [],
      windows: [],
    });
  });

  it("converts top-left furniture to center origin", () => {
    const c = furnitureToCenterOrigin({
      id: "a",
      xMm: 0,
      yMm: 0,
      widthMm: 100,
      depthMm: 40,
      rotationDeg: 0,
    });
    expect(c.xMm).toBe(50);
    expect(c.yMm).toBe(20);
  });

  it("pxToMm converts at the Planner scale and rejects non-Planner scales", () => {
    // Planner scale: 0.05 px/mm → 5 px / 0.05 = 100 mm
    expect(pxToMm(5, PLANNER_SCALE_PX_PER_MM)).toBe(100);
    expect(pxToMm(0, PLANNER_SCALE_PX_PER_MM)).toBe(0);

    // Non-Planner scales are rejected
    expect(() => pxToMm(5, 0.1)).toThrow(/Unsupported Planner scale/);
    expect(() => pxToMm(5, 0)).toThrow(/Unsupported Planner scale/);
    expect(() => pxToMm(5, -1)).toThrow(/Unsupported Planner scale/);
  });

  it("mmToPx converts at the Planner scale", () => {
    expect(mmToPx(100, PLANNER_SCALE_PX_PER_MM)).toBe(5);
    expect(mmToPx(1000, PLANNER_SCALE_PX_PER_MM)).toBe(50);

    // Non-Planner scales are rejected
    expect(() => mmToPx(50, 0.1)).toThrow(/Unsupported Planner scale/);
  });
});
