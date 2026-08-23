import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildCatalogLastModifiedByPath,
  buildProductStaticParams,
  deriveSourceSlug,
  getCategoryLastUpdated,
} from "@/lib/catalog/productStaticParams";
import { fetchCatalogProductsLive } from "@/lib/catalog/catalogDrizzle";
import { buildLocalCatalogFallbackProducts } from "@/lib/catalog/fallback";
import {
  classifyToRequestedCategory,
  normalizeRequestedCategoryId,
  type RequestedCategoryId,
} from "@/lib/catalog/site/categories";
import type { Product } from "@/lib/catalog/types";

const asRequested = (value: string): RequestedCategoryId | null =>
  (value || null) as RequestedCategoryId | null;

vi.mock("@/lib/catalog/catalogDrizzle", () => ({
  fetchCatalogProductsLive: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/lib/catalog/fallback", () => ({
  buildLocalCatalogFallbackProducts: vi.fn(() => []),
}));

vi.mock("@/lib/catalog/site/categories", () => ({
  normalizeRequestedCategoryId: vi.fn((c: string) => c),
  classifyToRequestedCategory: vi.fn(() => "seating"),
}));

function sampleProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    category_id: "seating",
    series: "Sway",
    name: "Sway Chair",
    slug: "oando-seating--sway",
    images: ["img1.jpg"],
    flagship_image: "img1.jpg",
    specs: {
      dimensions: "600 x 600 mm",
      materials: ["Mesh"],
      features: [],
    },
    series_id: "sway",
    series_name: "Sway",
    created_at: "2024-01-01",
    metadata: { sourceSlug: "sway" },
    ...overrides,
  };
}

describe("productStaticParams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("derives source slug correctly", () => {
    expect(deriveSourceSlug({ slug: "oando-seating--sway" })).toBe("sway");
    expect(deriveSourceSlug({ slug: "simple-slug" })).toBe("simple-slug");
    expect(deriveSourceSlug({ metadata: { sourceSlug: "meta-slug" } })).toBe("meta-slug");
  });

  it("builds static params successfully", async () => {
    const mockProduct = sampleProduct();
    vi.mocked(buildLocalCatalogFallbackProducts).mockReturnValueOnce([mockProduct]);
    vi.mocked(fetchCatalogProductsLive).mockResolvedValueOnce([]);

    const params = await buildProductStaticParams();
    expect(params.length).toBe(1);
    expect(params[0]).toEqual({ category: "seating", product: "sway" });
  });

  it("keeps fallback products when the live catalog throws", async () => {
    vi.mocked(buildLocalCatalogFallbackProducts).mockReturnValueOnce([sampleProduct()]);
    vi.mocked(fetchCatalogProductsLive).mockRejectedValueOnce(new Error("catalog timeout"));

    const params = await buildProductStaticParams();
    expect(params).toEqual([{ category: "seating", product: "sway" }]);
  });

  it("does not emit UUID slugs when a source slug exists", async () => {
    vi.mocked(buildLocalCatalogFallbackProducts).mockReturnValueOnce([]);
    vi.mocked(fetchCatalogProductsLive).mockResolvedValueOnce([
      sampleProduct({
        slug: "00d961b2-63d2-4985-8bca-f4debfba07a2",
        metadata: { sourceSlug: "sway" },
      }),
    ]);

    const params = await buildProductStaticParams();
    expect(params).toEqual([{ category: "seating", product: "sway" }]);
  });

  it("classifies empty category ids and skips rows without a public key", async () => {
    vi.mocked(normalizeRequestedCategoryId).mockImplementation(asRequested);
    vi.mocked(classifyToRequestedCategory).mockReturnValue("seating");

    vi.mocked(buildLocalCatalogFallbackProducts).mockReturnValueOnce([
      sampleProduct({
        slug: 12 as unknown as string,
      }),
      sampleProduct({
        slug: "",
        name: "Blank fallback",
      }),
      sampleProduct({
        id: "",
        slug: "fallback-ok",
        category_id: "",
        name: "",
        description: undefined,
        series_name: undefined as unknown as string,
        images: undefined as unknown as string[],
        flagship_image: undefined,
        metadata: undefined,
      }),
    ]);
    vi.mocked(fetchCatalogProductsLive).mockResolvedValueOnce([
      sampleProduct({ slug: "" }),
      sampleProduct({ slug: 99 as unknown as string }),
      sampleProduct({
        slug: "live-created",
        created_at: "2025-01-02T00:00:00.000Z",
        metadata: undefined,
        series_name: undefined as unknown as string,
        images: undefined as unknown as string[],
        flagship_image: undefined,
      }),
      {
        ...sampleProduct({
          slug: "live-updated",
          metadata: { sourceSlug: "live-updated" },
        }),
        updated_at: "2026-04-01T00:00:00.000Z",
      },
      sampleProduct({
        slug: "00d961b2-63d2-4985-8bca-f4debfba07a2",
        metadata: {},
      }),
    ]);

    const params = await buildProductStaticParams();
    expect(params).toEqual(
      expect.arrayContaining([
        { category: "seating", product: "fallback-ok" },
        { category: "seating", product: "live-created" },
        { category: "seating", product: "live-updated" },
      ]),
    );
    expect(params.some((entry) => entry.product === "")).toBe(false);
    expect(classifyToRequestedCategory).toHaveBeenCalled();
  });

  it("skips a row whose classified category is empty and dedupes identical keys", async () => {
    vi.mocked(normalizeRequestedCategoryId).mockReturnValue(null);
    vi.mocked(classifyToRequestedCategory)
      .mockReturnValueOnce(null as unknown as RequestedCategoryId)
      .mockReturnValue("seating");

    vi.mocked(buildLocalCatalogFallbackProducts).mockReturnValueOnce([]);
    vi.mocked(fetchCatalogProductsLive).mockResolvedValueOnce([
      sampleProduct({ slug: "skip-me", category_id: "" }),
      sampleProduct({ slug: "oando-seating--sway", metadata: { sourceSlug: "sway" } }),
      sampleProduct({
        id: "dup-2",
        slug: "legacy-sway",
        metadata: { sourceSlug: "sway" },
      }),
    ]);

    const params = await buildProductStaticParams();
    expect(params).toEqual([{ category: "seating", product: "sway" }]);
  });

  it("builds last-modified paths and keeps the newest category date", async () => {
    vi.mocked(normalizeRequestedCategoryId).mockImplementation(asRequested);
    vi.mocked(classifyToRequestedCategory).mockReturnValue("seating");
    const liveRows: Product[] = [
      {
        ...sampleProduct({ slug: "alpha", metadata: { sourceSlug: "alpha" } }),
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      {
        ...sampleProduct({ slug: "beta", metadata: { sourceSlug: "beta" } }),
        updated_at: "2026-03-01T00:00:00.000Z",
      },
      {
        ...sampleProduct({ slug: "gamma", metadata: { sourceSlug: "gamma" } }),
        updated_at: "2026-02-01T00:00:00.000Z",
      },
      {
        ...sampleProduct({ slug: "bad-date", metadata: { sourceSlug: "bad-date" } }),
        updated_at: "not-a-date",
      },
      sampleProduct({
        slug: "empty-date",
        created_at: "",
        metadata: { sourceSlug: "empty-date" },
      }),
      sampleProduct({
        slug: "00d961b2-63d2-4985-8bca-f4debfba07a2",
        metadata: {},
        updated_at: "2026-05-01T00:00:00.000Z",
      }),
    ];
    vi.mocked(buildLocalCatalogFallbackProducts).mockReturnValue([]);
    vi.mocked(fetchCatalogProductsLive).mockResolvedValue(liveRows);

    const map = await buildCatalogLastModifiedByPath();
    expect(map.get("/products/seating/alpha")?.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(map.get("/products/seating/beta")?.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(map.get("/products/seating")?.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(map.has("/products/seating/bad-date")).toBe(false);
    expect(map.has("/products/seating/empty-date")).toBe(false);

    await expect(getCategoryLastUpdated("Seating")).resolves.toEqual(
      map.get("/products/seating"),
    );
  });

  it("skips last-modified rows whose classified category is empty", async () => {
    vi.mocked(normalizeRequestedCategoryId).mockReturnValue(null);
    vi.mocked(classifyToRequestedCategory).mockReturnValue(
      null as unknown as RequestedCategoryId,
    );
    vi.mocked(buildLocalCatalogFallbackProducts).mockReturnValue([]);
    vi.mocked(fetchCatalogProductsLive).mockResolvedValue([
      { ...sampleProduct({ slug: "ghost" }), updated_at: "2026-01-01T00:00:00.000Z" },
    ]);

    const map = await buildCatalogLastModifiedByPath();
    expect(map.size).toBe(0);
    await expect(getCategoryLastUpdated("seating")).resolves.toBeUndefined();
  });
});
