import { describe, expect, it } from "vitest";
import {
  filterUrlKeys,
  toActiveFilters,
  type FilterQueryState,
} from "@/lib/catalog/site/filterSearchParams";

describe("toActiveFilters", () => {
  it("dedupes arrays and keeps flags", () => {
    const state = {
      series: "mesh",
      query: "chair",
      sort: "az",
      subcategory: ["task", "task", "exec"],
      priceRange: ["0-20k", "0-20k"],
      material: ["mesh"],
      hasHeadrest: true,
      isHeightAdjustable: false,
      bifmaCertified: true,
      isStackable: false,
      ecoMin: 7,
    } as unknown as FilterQueryState;
    const filters = toActiveFilters(state);
    expect(filters.subcategory).toEqual(["task", "exec"]);
    expect(filters.priceRange).toEqual(["0-20k"]);
    expect(filters.hasHeadrest).toBe(true);
    expect(filters.ecoMin).toBe(7);
    expect(filterUrlKeys.query).toBe("q");
    expect(filterUrlKeys.hasHeadrest).toBe("headrest");
  });
});
