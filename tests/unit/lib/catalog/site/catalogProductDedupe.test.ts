import { describe, expect, it } from "vitest";

import {
  catalogProductDedupePriority,
  dedupeCatalogProductsByName,
} from "@/lib/catalog/site/catalogProductDedupe";

describe("catalogProductDedupe", () => {
  it("prefers canonical catalog slug over legacy scrape duplicate", () => {
    const canonical = {
      slug: "arvo",
      name: "Arvo",
      flagshipImage: "/assets/catalog/seating/non-leather/oando-seating--arvo/gallery/image-1.jpg",
    };
    const legacy = {
      slug: "arvo-chair",
      name: "Arvo",
      flagshipImage: "/assets/catalog/products/chair-mesh-office.webp",
    };

    expect(catalogProductDedupePriority(canonical)).toBeGreaterThan(
      catalogProductDedupePriority(legacy),
    );

    const deduped = dedupeCatalogProductsByName([legacy, canonical]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.slug).toBe("arvo");
  });

  it("keeps single legacy slug when no canonical sibling exists", () => {
    const legacy = {
      slug: "phoenix-chair",
      name: "Phoenix",
      flagshipImage: "/assets/catalog/seating/non-leather/oando-seating--phoenix/gallery/image-1.webp",
    };

    const deduped = dedupeCatalogProductsByName([legacy]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.slug).toBe("phoenix-chair");
  });

  it("skips blank names and scores photography path fallbacks", () => {
    expect(
      dedupeCatalogProductsByName([
        { slug: "ghost", name: "   " },
        { slug: "ghost-2", name: null },
      ]),
    ).toEqual([]);

    expect(
      catalogProductDedupePriority({
        slug: "",
        name: "Arvo",
        images: ["/images/catalog/oando-seating--arvo/gallery/image-1.jpg"],
      }),
    ).toBeGreaterThan(0);

    expect(
      catalogProductDedupePriority({
        slug: "legacy-chair",
        images: ["/images/products/chair.webp"],
      }),
    ).toBeLessThan(
      catalogProductDedupePriority({
        slug: "legacy-chair",
        flagshipImage: "/assets/catalog/seating/oando-seating--arvo/image-1.jpg",
      }),
    );

    expect(
      catalogProductDedupePriority({
        slug: "blank-image",
        images: [null],
      }),
    ).toBe(0);
  });

  it("collapses parenthetical name variants", () => {
    const variants = dedupeCatalogProductsByName([
      {
        slug: "phoenix-chair",
        name: "Phoenix",
        flagshipImage: "/assets/catalog/seating/non-leather/oando-seating--phoenix/gallery/image-1.webp",
      },
      {
        slug: "oando-seating--phoenix-with-headrest",
        name: "Phoenix (With Headrest)",
        flagshipImage: "/assets/catalog/seating/non-leather/oando-seating--phoenix/gallery/image-01.webp",
      },
    ]);

    expect(variants).toHaveLength(1);
    expect(variants[0]?.slug).toBe("oando-seating--phoenix-with-headrest");
  });
});
