import { describe, it, expect } from "vitest";
import { assertNoDesignerStaticGlb } from "@/lib/catalog/glbAssetPolicy";

describe("assertNoDesignerStaticGlb", () => {
  it("ignores nullish and blank values", () => {
    expect(() => assertNoDesignerStaticGlb(null)).not.toThrow();
    expect(() => assertNoDesignerStaticGlb(undefined)).not.toThrow();
    expect(() => assertNoDesignerStaticGlb("   ")).not.toThrow();
  });

  it("allows generated catalog assets", () => {
    expect(() =>
      assertNoDesignerStaticGlb("/catalog-assets/generated/desk.glb"),
    ).not.toThrow();
  });

  it("allows planner-owned uploads served from the files API", () => {
    expect(() =>
      assertNoDesignerStaticGlb("/api/files/uploads/chair.glb"),
    ).not.toThrow();
  });

  it("allows in-memory blob URLs during authoring", () => {
    expect(() =>
      assertNoDesignerStaticGlb("blob:https://app.example/abc-123.glb"),
    ).not.toThrow();
  });

  it("allows non-model URLs", () => {
    expect(() =>
      assertNoDesignerStaticGlb("/catalog-assets/thumb.png"),
    ).not.toThrow();
  });

  it("rejects designer-static vendor GLB paths", () => {
    expect(() =>
      assertNoDesignerStaticGlb("/vendor/models/office-chair.glb"),
    ).toThrow(/designer static GLB\/GLTF URLs are not allowed/);
  });

  it("rejects bare static GLTF paths and surfaces the field label", () => {
    expect(() =>
      assertNoDesignerStaticGlb("https://cdn.example/assets/desk.gltf", "model_url"),
    ).toThrow(/^model_url:/);
  });
});
