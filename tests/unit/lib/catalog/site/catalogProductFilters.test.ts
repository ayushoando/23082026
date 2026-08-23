import { describe, expect, it } from "vitest";

import {
  filterProductCatalogMedia,
  isProductCatalogMediaPath,
  isPublishableCatalogProduct,
  isProjectOrInstallCatalogEntry,
} from "@/lib/catalog/site/catalogProductFilters";

describe("catalogProductFilters", () => {
  it("flags project catalog entries", () => {
    expect(isProjectOrInstallCatalogEntry({ slug: "project-dmrc", category_id: "projects" })).toBe(
      true,
    );
    expect(isProjectOrInstallCatalogEntry({ slug: "office-chair", name: "Abdul Hai Office" })).toBe(
      true,
    );
    expect(isPublishableCatalogProduct({ slug: "oando-seating--arvo" })).toBe(true);
  });

  it("rejects entries whose media is install photography only", () => {
    expect(
      isPublishableCatalogProduct({
        slug: "office-chair",
        name: "Abdul Hai Office",
        flagshipImage: "/assets/marketing/projects/DMRC/dmrc-office-01.webp",
        images: ["/assets/marketing/projects/Titan/project-gallery-02.webp"],
      }),
    ).toBe(false);
  });

  it("rejects install photography paths for product media", () => {
    expect(isProductCatalogMediaPath("/assets/marketing/projects/DMRC/dmrc-facility.webp")).toBe(false);
    expect(isProductCatalogMediaPath("/assets/catalog/products/fluid-x-chair-1.webp")).toBe(false);
    expect(isProductCatalogMediaPath("/assets/catalog/project-abdul-hai/image-01.jpg")).toBe(
      false,
    );
    expect(
      isProductCatalogMediaPath("/assets/catalog/seating/non-leather/oando-seating--breeze/gallery/image-01.webp"),
    ).toBe(true);
  });

  it("flags project slugs and hides unpublished catalog SKUs", () => {
    expect(isProjectOrInstallCatalogEntry({ slug: "project-titan" })).toBe(true);
    expect(isPublishableCatalogProduct({ slug: "crox" })).toBe(false);
    expect(isPublishableCatalogProduct({ slug: "oando-seating--crox" })).toBe(false);
    expect(isPublishableCatalogProduct({ slug: "oando-seating--arvo" })).toBe(true);
  });

  it("rejects empty paths and install-folder photography", () => {
    expect(isProductCatalogMediaPath("")).toBe(false);
    expect(isProductCatalogMediaPath(null)).toBe(false);
    expect(isProductCatalogMediaPath(undefined)).toBe(false);
    expect(isProductCatalogMediaPath("/assets/catalog/honda-office/floor.jpg")).toBe(false);
    expect(isProductCatalogMediaPath("/assets/catalog/tcs-workspace/bay.jpg")).toBe(false);
    expect(
      isProductCatalogMediaPath("/assets/catalog/686d3b55385e7b905b01d3a5_export/image-1.jpg"),
    ).toBe(false);
    expect(isProductCatalogMediaPath("/assets/marketing/project-gallery-03.webp")).toBe(false);
  });

  it("filters mixed image lists", () => {
    expect(
      filterProductCatalogMedia([
        "/assets/marketing/projects/DMRC/dmrc-office-01.webp",
        "/assets/catalog/seating/non-leather/oando-seating--breeze/gallery/image-1.jpg",
        "/assets/catalog/seating/non-leather/oando-seating--breeze/gallery/image-1.jpg",
      ]),
    ).toEqual(["/assets/catalog/seating/non-leather/oando-seating--breeze/gallery/image-1.jpg"]);
  });

  it("drops null, blank, and non-string media candidates", () => {
    expect(filterProductCatalogMedia(null)).toEqual([]);
    expect(filterProductCatalogMedia(undefined)).toEqual([]);
    expect(filterProductCatalogMedia([null, undefined, "   "])).toEqual([]);
  });
});
