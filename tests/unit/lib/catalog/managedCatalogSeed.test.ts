import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/catalog/catalogData", () => ({
  furnitureCatalog: [
    {
      id: "desk-full",
      name: "Full Desk",
      category: "workstations",
      shape: "straight",
      priceInr: 25000,
      iconPath: "/icons/desk-full.svg",
      widthMm: 1200,
      depthMm: 600,
      heightMm: 750,
    },
    {
      id: "chair-bare",
      name: "Bare Chair",
      category: "seating",
      // shape / priceInr / iconPath intentionally missing to exercise fallbacks.
      widthMm: 500,
      depthMm: 500,
      heightMm: 900,
    },
  ],
}));

describe("MANAGED_CATALOG_SEED", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps a fully populated furniture item without hitting fallbacks", async () => {
    const { MANAGED_CATALOG_SEED } = await import("@/lib/catalog/managedCatalogSeed");
    const row = MANAGED_CATALOG_SEED.find((r) => r.slug === "desk-full");

    expect(row).toBeDefined();
    expect(row).toMatchObject({
      slug: "desk-full",
      planner_source_slug: "desk-full",
      name: "Full Desk",
      description: "Full Desk (seed)",
      category: "workstations",
      category_id: "workstations",
      category_name: "workstations",
      series_id: "straight",
      series_name: "straight",
      price: 25000,
      flagship_image: "/icons/desk-full.svg",
      images: ["/icons/desk-full.svg"],
    });
    expect(row?.specs).toMatchObject({
      widthMm: 1200,
      depthMm: 600,
      heightMm: 750,
      meshType: "straight",
      priceInr: 25000,
    });
  });

  it("applies default series, price, and image fallbacks when fields are missing", async () => {
    const { MANAGED_CATALOG_SEED } = await import("@/lib/catalog/managedCatalogSeed");
    const row = MANAGED_CATALOG_SEED.find((r) => r.slug === "chair-bare");

    expect(row).toBeDefined();
    expect(row?.series_id).toBe("general");
    expect(row?.series_name).toBe("General");
    expect(row?.price).toBe(0);
    expect(row?.flagship_image).toBe("");
    expect(row?.images).toEqual([]);
    expect(row?.specs).toMatchObject({ meshType: undefined, priceInr: undefined });
  });
});
