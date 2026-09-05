import { describe, expect, it } from "vitest";

import {
  PLAN_SYMBOL_MIME,
  PLAN_SYMBOL_PAD_MM,
  PLAN_SYMBOL_PNG_FIELD,
  PLAN_SYMBOL_PX_PER_MM,
  PNG_CATALOG_PUBLIC_PATH,
  PLANNER_SYMBOLS_STORAGE_PREFIX,
  PlanSymbolPngPointerFieldsSchema,
  buildPlanSymbolPngPublicUrl,
  planSymbolCorePx,
  planSymbolPadPx,
  planSymbolRasterBox,
  plannerSymbolPngStorageKey,
} from "@/lib/catalog/planSymbolPngContract";

describe("planSymbolPngContract", () => {
  it("locks scale, pad, mime, catalog prefix, and descriptor field names", () => {
    expect(PLAN_SYMBOL_PX_PER_MM).toBe(2);
    expect(PLAN_SYMBOL_PAD_MM).toBe(40);
    expect(PLAN_SYMBOL_MIME).toBe("image/png");
    expect(PNG_CATALOG_PUBLIC_PATH).toBe("/png-catalog");
    expect(PLANNER_SYMBOLS_STORAGE_PREFIX).toBe("planner-symbols");
    expect(PLAN_SYMBOL_PNG_FIELD).toEqual({
      url: "planSymbolPngUrl",
      checksum: "planSymbolPngChecksum",
      mime: "planSymbolMime",
    });
  });

  it("computes core and raster boxes at 2 px/mm with 40 mm pad on each side", () => {
    expect(planSymbolPadPx()).toBe(80);
    expect(planSymbolCorePx(1000, 600)).toEqual({ widthPx: 2000, heightPx: 1200 });

    const desk = planSymbolRasterBox(1000, 600);
    expect(desk).toMatchObject({
      widthMm: 1000,
      depthMm: 600,
      coreWidthPx: 2000,
      coreHeightPx: 1200,
      rasterWidthPx: 2160,
      rasterHeightPx: 1360,
      padMm: 40,
      padPx: 80,
      pxPerMm: 2,
    });

    const executive = planSymbolRasterBox(1600, 800);
    expect(executive.coreWidthPx).toBe(3200);
    expect(executive.coreHeightPx).toBe(1600);
    expect(executive.rasterWidthPx).toBe(3360);
    expect(executive.rasterHeightPx).toBe(1760);
  });

  it("builds public URL and storage key shapes", () => {
    expect(buildPlanSymbolPngPublicUrl(" executive-desk ")).toBe(
      "/png-catalog/executive-desk.png",
    );
    expect(plannerSymbolPngStorageKey(" executive-desk ")).toBe(
      "planner-symbols/executive-desk/symbol.png",
    );
  });

  it("accepts sha256 hex checksums and rejects other pointer shapes", () => {
    const checksum = "a".repeat(64);
    expect(
      PlanSymbolPngPointerFieldsSchema.parse({
        planSymbolPngUrl: "/png-catalog/desk.png",
        planSymbolPngChecksum: checksum,
        planSymbolMime: "image/png",
      }),
    ).toEqual({
      planSymbolPngUrl: "/png-catalog/desk.png",
      planSymbolPngChecksum: checksum,
      planSymbolMime: "image/png",
    });

    expect(() =>
      PlanSymbolPngPointerFieldsSchema.parse({
        planSymbolPngChecksum: "not-a-sha256",
      }),
    ).toThrow(/sha256 hex/);

    expect(() =>
      PlanSymbolPngPointerFieldsSchema.parse({
        planSymbolMime: "image/svg+xml",
      }),
    ).toThrow();
  });
});
