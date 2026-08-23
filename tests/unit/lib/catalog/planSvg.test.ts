import { describe, expect, it } from "vitest";

import {
  SVG_CATALOG_PUBLIC_PATH,
  buildSvgCatalogPublicUrl,
  isPublishedPlanSymbolUrl,
  isPublishedPngPlanUrl,
  resolvePlanSvgUrl,
} from "@/lib/catalog/planSvg";

describe("planSvg URL helpers", () => {
  it("builds a public svg-catalog path from a trimmed slug", () => {
    expect(SVG_CATALOG_PUBLIC_PATH).toBe("/svg-catalog");
    expect(buildSvgCatalogPublicUrl("  breeze-task-chair  ")).toBe(
      "/svg-catalog/breeze-task-chair.svg",
    );
  });

  it("resolves a published SVG revision id and rejects blank ids", () => {
    expect(resolvePlanSvgUrl({ publishedSvgRevisionId: " rev-9 " })).toBe(
      "/api/files/svg-revisions/rev-9",
    );
    expect(resolvePlanSvgUrl({ publishedSvgRevisionId: "a/b c" })).toBe(
      "/api/files/svg-revisions/a%2Fb%20c",
    );
    expect(resolvePlanSvgUrl({ publishedSvgRevisionId: null })).toBeNull();
    expect(resolvePlanSvgUrl({ publishedSvgRevisionId: undefined })).toBeNull();
    expect(resolvePlanSvgUrl({ publishedSvgRevisionId: "" })).toBeNull();
    expect(resolvePlanSvgUrl({ publishedSvgRevisionId: "   " })).toBeNull();
    expect(resolvePlanSvgUrl({})).toBeNull();
  });

  it("allowlists published plan-symbol URLs", () => {
    expect(isPublishedPlanSymbolUrl("/svg-catalog/chair.svg")).toBe(true);
    expect(isPublishedPlanSymbolUrl("/api/files/svg-revisions/rev-1")).toBe(true);
    expect(isPublishedPlanSymbolUrl("/png-catalog/chair.png")).toBe(true);
    expect(isPublishedPlanSymbolUrl("https://cdn.example/planner-symbols/chair.png")).toBe(true);
    expect(isPublishedPlanSymbolUrl("")).toBe(false);
    expect(isPublishedPlanSymbolUrl("   ")).toBe(false);
    expect(isPublishedPlanSymbolUrl("/assets/chair.svg")).toBe(false);
  });

  it("allowlists published PNG plan URLs including absolute png-catalog hosts", () => {
    expect(isPublishedPngPlanUrl("/png-catalog/chair.png")).toBe(true);
    expect(isPublishedPngPlanUrl("https://cdn.example/planner-symbols/chair.png")).toBe(true);
    expect(isPublishedPngPlanUrl("https://cdn.example/png-catalog/chair.png")).toBe(true);
    expect(isPublishedPngPlanUrl("https://cdn.example/other/chair.png")).toBe(false);
    expect(isPublishedPngPlanUrl("/svg-catalog/chair.svg")).toBe(false);
    expect(isPublishedPngPlanUrl("")).toBe(false);
    expect(isPublishedPngPlanUrl("   ")).toBe(false);
  });
});
