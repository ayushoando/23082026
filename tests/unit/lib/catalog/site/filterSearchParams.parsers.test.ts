import { describe, expect, it } from "vitest";
import { createLoader, createSerializer } from "nuqs/server";

import {
  filterSearchParams,
  filterUrlKeys,
} from "@/lib/catalog/site/filterSearchParams";

const loadFilters = createLoader(filterSearchParams, {
  urlKeys: filterUrlKeys,
});

const serializeFilters = createSerializer(filterSearchParams, {
  urlKeys: filterUrlKeys,
  clearOnDefault: false,
});

describe("filterSearchParams parsers", () => {
  it("parses presence flags, eco min, and remapped URL keys", () => {
    const state = loadFilters(
      "?headrest=1&heightAdj=1&bifma=1&stackable=1&ecoMin=6&q=chair&sub=mesh&price=mid&mat=fabric&sort=za",
    );

    expect(state.hasHeadrest).toBe(true);
    expect(state.isHeightAdjustable).toBe(true);
    expect(state.bifmaCertified).toBe(true);
    expect(state.isStackable).toBe(true);
    expect(state.ecoMin).toBe(6);
    expect(state.query).toBe("chair");
    expect(state.subcategory).toEqual(["mesh"]);
    expect(state.priceRange).toEqual(["mid"]);
    expect(state.material).toEqual(["fabric"]);
    expect(state.sort).toBe("za");
  });

  it("rejects invalid eco scores, price ranges, and empty facet tokens", () => {
    const state = loadFilters(
      "?ecoMin=abc&price=ultra&sub=%20%20&mat=&headrest=0&ecoMin=-1",
    );

    expect(state.ecoMin).toBeNull();
    expect(state.priceRange).toEqual([]);
    expect(state.subcategory).toEqual([]);
    expect(state.material).toEqual([]);
    expect(state.hasHeadrest).toBe(false);
  });

  it("rejects eco scores outside 0-10 and unknown sort literals", () => {
    expect(loadFilters("?ecoMin=11").ecoMin).toBeNull();
    expect(loadFilters("?ecoMin=-1").ecoMin).toBeNull();
    expect(loadFilters("?ecoMin=0").ecoMin).toBe(0);
    expect(loadFilters("?ecoMin=10").ecoMin).toBe(10);
    expect(loadFilters("?sort=popular").sort).toBe("az");
  });

  it("parses and serializes flag and eco parsers directly", () => {
    expect(filterSearchParams.hasHeadrest.parse("1")).toBe(true);
    expect(filterSearchParams.hasHeadrest.parse("0")).toBeNull();
    expect(filterSearchParams.hasHeadrest.serialize(true)).toBe("1");
    expect(filterSearchParams.hasHeadrest.serialize(false)).toBe("0");

    expect(filterSearchParams.ecoMin.parse("7")).toBe(7);
    expect(filterSearchParams.ecoMin.parse("nope")).toBeNull();
    expect(filterSearchParams.ecoMin.serialize(4)).toBe("4");
  });

  it("serializes false flags as 0 when defaults are kept", () => {
    const qs = serializeFilters({
      hasHeadrest: false,
      isHeightAdjustable: false,
      bifmaCertified: false,
      isStackable: false,
      ecoMin: 3,
    });
    const params = new URLSearchParams(qs.replace(/^\?/, ""));
    expect(params.get("headrest")).toBe("0");
    expect(params.get("heightAdj")).toBe("0");
    expect(params.get("bifma")).toBe("0");
    expect(params.get("stackable")).toBe("0");
    expect(params.get("ecoMin")).toBe("3");
  });
});
