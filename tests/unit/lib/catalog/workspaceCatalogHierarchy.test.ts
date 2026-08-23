import { describe, expect, it } from "vitest";
import {
  enrichCatalogItem,
  formatCatalogDimensionsLabel,
  formatCatalogSeatFootprint,
} from "@/lib/catalog/catalogHierarchy";
import { MANAGED_CATALOG_SEED } from "@/lib/catalog/managedCatalogSeed";
import { PLANNER_CATALOG_ITEMS } from "@/lib/catalog/workspaceCatalog";
import { workstationV0UnitPriceInr } from "@/lib/catalog/workstationBoqV0";
import { generateWorkstationV0MeshPlan } from "@/lib/catalog/workstationMeshV0";
import {
  createWorkstationConfigV0,
  workstationFootprintMm,
  WORKSTATION_V0_DEFAULT_HEIGHT_MM,
  WORKSTATION_V0_SIZE_GRID,
} from "@/lib/catalog/workstationSystemV0";

describe("catalogHierarchy", () => {
  it("fills shortName and seatCount", () => {
    const item = {
      id: "a",
      name: "Desk",
      category: "tables",
      widthMm: 1200,
      depthMm: 600,
      heightMm: 750,
    };
    expect(enrichCatalogItem(item)).toMatchObject({
      shortName: "Desk",
      seatCount: null,
    });
    expect(enrichCatalogItem({ ...item, shortName: "D", seatCount: 2 }).seatCount).toBe(2);
  });

  it("formats dimensions and footprint", () => {
    const full = { id: "a", name: "A", category: "x", widthMm: 1, depthMm: 2, heightMm: 3 };
    expect(formatCatalogDimensionsLabel(full)).toBe("1 × 2 × 3 mm");
    expect(formatCatalogSeatFootprint(full)).toBe("1 × 2 mm");
    expect(formatCatalogDimensionsLabel({ id: "b", name: "B", category: "x" })).toBe("—");
    expect(formatCatalogSeatFootprint({ id: "b", name: "B", category: "x" })).toBe("—");
    expect(
      formatCatalogDimensionsLabel({ id: "c", name: "C", category: "x", widthMm: 1, depthMm: 2 }),
    ).toBe("1 × 2 mm");
  });
});

describe("workspace + managed seed", () => {
  it("maps furniture seed into planner and managed rows", () => {
    expect(PLANNER_CATALOG_ITEMS.length).toBeGreaterThan(0);
    expect(MANAGED_CATALOG_SEED.length).toBe(PLANNER_CATALOG_ITEMS.length);
    const row = MANAGED_CATALOG_SEED[0];
    expect(row?.slug).toBeTruthy();
    expect(row?.planner_source_slug).toBe(row?.slug);
    expect(row?.description).toContain("(seed)");
  });
});

describe("workstation v0", () => {
  it("defaults desk module and height", () => {
    const size = WORKSTATION_V0_SIZE_GRID[0]!;
    const cfg = createWorkstationConfigV0({ shape: "linear", size });
    expect(cfg.modules).toEqual(["desk"]);
    expect(cfg.heightMm).toBe(WORKSTATION_V0_DEFAULT_HEIGHT_MM);
  });

  it("computes linear vs L footprints and price", () => {
    const size = { lengthMm: 1200, depthMm: 600 };
    const linear = createWorkstationConfigV0({ shape: "linear", size, modules: ["desk", "panel"] });
    const lshape = createWorkstationConfigV0({ shape: "l-shape", size });
    expect(workstationFootprintMm(linear)).toEqual({ widthMm: 1200, depthMm: 600 });
    expect(workstationFootprintMm(lshape)).toEqual({ widthMm: 1800, depthMm: 1200 });
    expect(workstationV0UnitPriceInr(linear)).toBeGreaterThan(0);
    expect(workstationV0UnitPriceInr(lshape)).toBeGreaterThan(workstationV0UnitPriceInr(linear));
  });

  it("builds a mesh with extra modules", () => {
    const cfg = createWorkstationConfigV0({
      shape: "linear",
      size: { lengthMm: 1200, depthMm: 600 },
      modules: ["desk", "pedestal"],
    });
    const plan = generateWorkstationV0MeshPlan(cfg);
    expect(plan.parts.map((p) => p.id)).toEqual(["desk-top", "pedestal"]);
    expect(plan.footprint.widthMm).toBe(1200);
  });
});
