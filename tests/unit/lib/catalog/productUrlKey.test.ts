import { describe, expect, it } from "vitest";
import {
  derivePublicProductUrlKey,
  deriveSourceSlug,
  isPublicCatalogUrlSegment,
  isReservedPublicProductUrlKey,
  isUuidSegment,
} from "@/lib/catalog/productUrlKey";

describe("productUrlKey", () => {
  it("detects UUID path segments", () => {
    expect(isUuidSegment("00d961b2-63d2-4985-8bca-f4debfba07a2")).toBe(true);
    expect(isUuidSegment("crest")).toBe(false);
    expect(isPublicCatalogUrlSegment("crest")).toBe(true);
    expect(isPublicCatalogUrlSegment("00d961b2-63d2-4985-8bca-f4debfba07a2")).toBe(
      false,
    );
    expect(isPublicCatalogUrlSegment("oando-tables--crest")).toBe(false);
    expect(isReservedPublicProductUrlKey("Categories")).toBe(true);
    expect(isReservedPublicProductUrlKey("crest")).toBe(false);
  });

  it("derives source slug from metadata then folder suffix", () => {
    expect(deriveSourceSlug({ metadata: { sourceSlug: "  crest  " } })).toBe("crest");
    expect(deriveSourceSlug({ slug: "oando-tables--crest" })).toBe("crest");
    expect(deriveSourceSlug({ slug: "plain-slug" })).toBe("plain-slug");
  });

  it("emits the public PDP key crawlers should index", () => {
    expect(
      derivePublicProductUrlKey({
        slug: "00d961b2-63d2-4985-8bca-f4debfba07a2",
        metadata: { sourceSlug: "crest" },
      }),
    ).toBe("crest");
    expect(derivePublicProductUrlKey({ slug: "oando-tables--crest" })).toBe("crest");
    expect(derivePublicProductUrlKey({ slug: "crest" })).toBe("crest");
    expect(
      derivePublicProductUrlKey({
        slug: "00d961b2-63d2-4985-8bca-f4debfba07a2",
      }),
    ).toBe("");
    expect(derivePublicProductUrlKey({ slug: "Crest" })).toBe("crest");
    expect(
      derivePublicProductUrlKey({
        slug: "00d961b2-63d2-4985-8bca-f4debfba07a2",
        metadata: { sourceSlug: "Crest" },
      }),
    ).toBe("crest");
    expect(derivePublicProductUrlKey({ slug: "categories" })).toBe("");
    expect(
      derivePublicProductUrlKey({
        slug: "categories",
        metadata: { sourceSlug: "Categories" },
      }),
    ).toBe("");
  });
});
