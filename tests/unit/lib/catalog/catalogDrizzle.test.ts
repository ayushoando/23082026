import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { isProductsDatabaseConfigured, mockSelect, createOptionalSupabaseAdminClient } =
  vi.hoisted(() => ({
    isProductsDatabaseConfigured: vi.fn(),
    mockSelect: vi.fn(),
    createOptionalSupabaseAdminClient: vi.fn(() => null),
  }));

vi.mock("@/platform/drizzle/databaseUrls", () => ({
  isProductsDatabaseConfigured,
}));

vi.mock("@/platform/drizzle/productsDb", () => ({
  productsDb: {
    select: mockSelect,
  },
}));

vi.mock("@/platform/supabase/supabaseAdmin", () => ({
  createOptionalSupabaseAdminClient,
}));

import {
  canQueryCatalogDatabase,
  fetchBusinessStatsActiveLive,
  fetchCatalogCategoriesLive,
  fetchCatalogCategoryIdsLive,
  fetchCatalogProductBySlugLive,
  fetchCatalogProductImageRowsLive,
  fetchCatalogProductSpecsRowsLive,
  fetchCatalogProductsByCategoryLive,
  fetchCatalogProductsLive,
  fetchCatalogProductsSlugFieldsByCategoryLive,
  fetchCatalogSlugAliasLive,
} from "@/lib/catalog/catalogDrizzle";

type Row = Record<string, unknown>;

type Terminal = "from" | "where" | "orderBy" | "limit";

function mockDbQuery(
  rows: Row[] | Row | null,
  opts?: { terminal?: Terminal; reject?: unknown },
) {
  const data = rows === null ? [] : Array.isArray(rows) ? rows : [rows];
  const result =
    opts && Object.prototype.hasOwnProperty.call(opts, "reject")
      ? Promise.reject(opts.reject)
      : Promise.resolve(data);
  const terminal = opts?.terminal ?? "orderBy";

  const chain = {
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  };

  chain.where.mockImplementation(() => (terminal === "where" ? result : chain));
  chain.orderBy.mockImplementation(() => (terminal === "orderBy" ? result : chain));
  chain.limit.mockImplementation(() => (terminal === "limit" ? result : chain));

  mockSelect.mockReturnValueOnce({
    from: vi.fn().mockImplementation(() => (terminal === "from" ? result : chain)),
  });

  return chain;
}

const productRowA: Row = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  name: "Chair Alpha",
  slug: "chair-alpha",
  category_id: "chairs",
  model_3d: "chair-alpha.glb",
};

const productRowB: Row = {
  id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
  name: "Desk Beta",
  slug: "desk-beta",
  category_id: "desks",
  model_3d: null,
};

describe("catalogDrizzle", () => {
  const originalVercel = process.env.VERCEL;

  beforeEach(() => {
    vi.clearAllMocks();
    isProductsDatabaseConfigured.mockReturnValue(true);
    createOptionalSupabaseAdminClient.mockReturnValue(null);
    delete process.env.VERCEL;
  });

  afterEach(() => {
    if (originalVercel === undefined) {
      delete process.env.VERCEL;
    } else {
      process.env.VERCEL = originalVercel;
    }
  });

  describe("canQueryCatalogDatabase", () => {
    it("reflects products database configuration", () => {
      isProductsDatabaseConfigured.mockReturnValue(false);
      expect(canQueryCatalogDatabase()).toBe(false);

      isProductsDatabaseConfigured.mockReturnValue(true);
      expect(canQueryCatalogDatabase()).toBe(true);
    });
  });

  describe("fetchCatalogProductsLive", () => {
    it("returns null when database is not configured", async () => {
      isProductsDatabaseConfigured.mockReturnValue(false);
      await expect(fetchCatalogProductsLive()).resolves.toBeNull();
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it("maps rows to normalized product shape", async () => {
      mockDbQuery([productRowA, productRowB]);
      const products = await fetchCatalogProductsLive();

      expect(products).toHaveLength(2);
      expect(products?.[0]).toMatchObject({
        name: "Chair Alpha",
        slug: "chair-alpha",
        category_id: "chairs",
        "3d_model": "chair-alpha.glb",
      });
      expect(products?.[0]?.id).toBe(productRowA.id);
    });

    it("changes output when fixture fields change", async () => {
      mockDbQuery([{ ...productRowA, name: "Chair Gamma" }]);
      const products = await fetchCatalogProductsLive();
      expect(products?.[0]?.name).toBe("Chair Gamma");
    });

    it("returns null on missing relation error", async () => {
      mockDbQuery([], {
        reject: new Error('relation "catalog_products" does not exist'),
      });
      await expect(fetchCatalogProductsLive()).resolves.toBeNull();
    });

    it("rethrows non-relation database errors", async () => {
      mockDbQuery([], {
        reject: new Error("permission denied for table catalog_products"),
      });
      await expect(fetchCatalogProductsLive()).rejects.toThrow("permission denied");
    });

    it("treats a raw missing-table string as unavailable and rethrows other rejects", async () => {
      mockDbQuery([], { reject: "could not find the table" });
      await expect(fetchCatalogProductsLive()).resolves.toBeNull();

      mockDbQuery([], { reject: "permission denied" });
      await expect(fetchCatalogProductsLive()).rejects.toBe("permission denied");
    });

    it("rethrows a relation error that is not a missing table", async () => {
      mockDbQuery([], { reject: new Error("relation catalog_products is locked") });
      await expect(fetchCatalogProductsLive()).rejects.toThrow("is locked");
    });

    it("treats a nullish reject as a non-missing-table error", async () => {
      mockDbQuery([], { reject: null });
      await expect(fetchCatalogProductsLive()).rejects.toBeNull();

      mockDbQuery([], { reject: undefined });
      await expect(fetchCatalogProductsLive()).rejects.toBeUndefined();
    });

    it("normalizes a missing slug to an empty string", async () => {
      mockDbQuery([{ ...productRowA, slug: null, model_3d: null }]);
      const products = await fetchCatalogProductsLive();
      expect(products?.[0]?.slug).toBe("");
      expect(products?.[0]?.["3d_model"]).toBeUndefined();
    });
  });

  describe("fetchCatalogProductsByCategoryLive", () => {
    it("filters by category_id via where clause", async () => {
      const chain = mockDbQuery([productRowA], { terminal: "orderBy" });
      const products = await fetchCatalogProductsByCategoryLive("chairs");

      expect(chain.where).toHaveBeenCalled();
      expect(products?.[0]?.category_id).toBe("chairs");
    });

    it("returns null when database is not configured", async () => {
      isProductsDatabaseConfigured.mockReturnValue(false);
      await expect(fetchCatalogProductsByCategoryLive("chairs")).resolves.toBeNull();
    });

    it("returns null when the category query throws", async () => {
      mockDbQuery([], { reject: new Error("connection reset") });
      await expect(fetchCatalogProductsByCategoryLive("chairs")).resolves.toBeNull();
    });
  });

  describe("fetchCatalogProductBySlugLive", () => {
    it("returns a single product when slug matches", async () => {
      mockDbQuery(productRowA, { terminal: "limit" });
      const product = await fetchCatalogProductBySlugLive("chair-alpha");
      expect(product?.slug).toBe("chair-alpha");
    });

    it("returns null when slug is not found", async () => {
      mockDbQuery([], { terminal: "limit" });
      await expect(fetchCatalogProductBySlugLive("missing")).resolves.toBeNull();
    });

    it("returns null when database is not configured", async () => {
      isProductsDatabaseConfigured.mockReturnValue(false);
      await expect(fetchCatalogProductBySlugLive("chair-alpha")).resolves.toBeNull();
    });

    it("returns null when the slug query throws", async () => {
      mockDbQuery([], { terminal: "limit", reject: new Error("timeout") });
      await expect(fetchCatalogProductBySlugLive("chair-alpha")).resolves.toBeNull();
    });
  });

  describe("fetchCatalogCategoriesLive", () => {
    it("returns category rows from catalog_categories", async () => {
      mockDbQuery([{ id: "chairs", name: "Chairs" }], { terminal: "from" });
      const categories = await fetchCatalogCategoriesLive();
      expect(categories).toEqual([{ id: "chairs", name: "Chairs" }]);
    });

    it("returns null on 42P01 missing relation", async () => {
      mockDbQuery([], {
        terminal: "from",
        reject: new Error("42P01 undefined_table"),
      });
      await expect(fetchCatalogCategoriesLive()).resolves.toBeNull();
    });

    it("returns null when database is not configured", async () => {
      isProductsDatabaseConfigured.mockReturnValue(false);
      await expect(fetchCatalogCategoriesLive()).resolves.toBeNull();
    });
  });

  describe("fetchCatalogSlugAliasLive", () => {
    it("returns alias row when active alias exists", async () => {
      mockDbQuery(
        {
          alias_slug: "old-chair",
          canonical_slug: "chair-alpha",
        },
        { terminal: "limit" },
      );
      const alias = await fetchCatalogSlugAliasLive("old-chair");
      expect(alias).toEqual({
        alias_slug: "old-chair",
        canonical_slug: "chair-alpha",
      });
    });

    it("returns null when no alias row matches", async () => {
      mockDbQuery([], { terminal: "limit" });
      await expect(fetchCatalogSlugAliasLive("missing")).resolves.toBeNull();
    });

    it("returns null when database is not configured", async () => {
      isProductsDatabaseConfigured.mockReturnValue(false);
      await expect(fetchCatalogSlugAliasLive("old-chair")).resolves.toBeNull();
    });

    it("returns null when the alias query throws", async () => {
      mockDbQuery([], { terminal: "limit", reject: new Error("alias down") });
      await expect(fetchCatalogSlugAliasLive("old-chair")).resolves.toBeNull();
    });
  });

  describe("fetchCatalogCategoryIdsLive", () => {
    it("returns deduplicated category ids", async () => {
      mockDbQuery(
        [{ category_id: "chairs" }, { category_id: "chairs" }, { category_id: "desks" }],
        { terminal: "orderBy" },
      );
      const ids = await fetchCatalogCategoryIdsLive();
      expect(ids).toEqual(["chairs", "desks"]);
    });

    it("returns null when database is not configured", async () => {
      isProductsDatabaseConfigured.mockReturnValue(false);
      await expect(fetchCatalogCategoryIdsLive()).resolves.toBeNull();
    });

    it("returns null on missing relation", async () => {
      mockDbQuery([], {
        terminal: "orderBy",
        reject: new Error('relation "catalog_products" does not exist'),
      });
      await expect(fetchCatalogCategoryIdsLive()).resolves.toBeNull();
    });

    it("drops empty and non-string category ids", async () => {
      mockDbQuery(
        [
          { category_id: "chairs" },
          { category_id: "" },
          { category_id: null },
          { category_id: 12 },
        ],
        { terminal: "orderBy" },
      );
      await expect(fetchCatalogCategoryIdsLive()).resolves.toEqual(["chairs"]);
    });
  });

  describe("fetchCatalogProductsSlugFieldsByCategoryLive", () => {
    it("projects slug fields for a category", async () => {
      mockDbQuery(
        [
          {
            slug: "chair-alpha",
            name: "Chair Alpha",
            category_id: "chairs",
            metadata: { tier: "flagship" },
          },
        ],
        { terminal: "where" },
      );
      const rows = await fetchCatalogProductsSlugFieldsByCategoryLive("chairs");
      expect(rows?.[0]).toEqual({
        slug: "chair-alpha",
        name: "Chair Alpha",
        category_id: "chairs",
        metadata: { tier: "flagship" },
      });
    });

    it("returns null on missing relation", async () => {
      mockDbQuery([], {
        terminal: "where",
        reject: new Error("42P01"),
      });
      await expect(fetchCatalogProductsSlugFieldsByCategoryLive("chairs")).resolves.toBeNull();
    });

    it("returns null when database is not configured", async () => {
      isProductsDatabaseConfigured.mockReturnValue(false);
      await expect(fetchCatalogProductsSlugFieldsByCategoryLive("chairs")).resolves.toBeNull();
    });

    it("coalesces null slug fields to empty strings", async () => {
      mockDbQuery(
        [{ slug: null, name: null, category_id: null, metadata: null }],
        { terminal: "where" },
      );
      const rows = await fetchCatalogProductsSlugFieldsByCategoryLive("chairs");
      expect(rows?.[0]).toEqual({
        slug: "",
        name: "",
        category_id: "",
        metadata: null,
      });
    });
  });

  describe("fetchBusinessStatsActiveLive", () => {
    it("maps active business stats row", async () => {
      mockDbQuery(
        {
          projects_delivered: 120,
          client_organisations: 45,
          sectors_served: 8,
          locations_served: 12,
          years_experience: 25,
          as_of_date: "2026-01-01",
        },
        { terminal: "limit" },
      );
      const stats = await fetchBusinessStatsActiveLive();
      expect(stats).toEqual({
        projects_delivered: 120,
        client_organisations: 45,
        sectors_served: 8,
        locations_served: 12,
        years_experience: 25,
        as_of_date: "2026-01-01",
      });
    });

    it("returns null when no active stats row exists", async () => {
      mockDbQuery([], { terminal: "limit" });
      await expect(fetchBusinessStatsActiveLive()).resolves.toBeNull();
    });

    it("returns null when database is not configured", async () => {
      isProductsDatabaseConfigured.mockReturnValue(false);
      await expect(fetchBusinessStatsActiveLive()).resolves.toBeNull();
    });

    it("returns null when the stats query throws", async () => {
      mockDbQuery([], { terminal: "limit", reject: new Error("stats down") });
      await expect(fetchBusinessStatsActiveLive()).resolves.toBeNull();
    });

    it("coalesces null numeric stats and a missing as-of date", async () => {
      mockDbQuery(
        {
          projects_delivered: null,
          client_organisations: null,
          sectors_served: null,
          locations_served: null,
          years_experience: null,
          as_of_date: null,
        },
        { terminal: "limit" },
      );
      await expect(fetchBusinessStatsActiveLive()).resolves.toEqual({
        projects_delivered: 0,
        client_organisations: 0,
        sectors_served: 0,
        locations_served: 0,
        years_experience: 0,
        as_of_date: "",
      });
    });
  });

  describe("fetchCatalogProductSpecsRowsLive", () => {
    it("returns null when productIds is empty", async () => {
      await expect(fetchCatalogProductSpecsRowsLive([])).resolves.toBeNull();
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it("returns specs rows for product ids", async () => {
      mockDbQuery([{ product_id: productRowA.id, specs: { width_mm: 600 } }], {
        terminal: "where",
      });
      const rows = await fetchCatalogProductSpecsRowsLive([String(productRowA.id)]);
      expect(rows?.[0]?.specs).toEqual({ width_mm: 600 });
    });

    it("returns null on missing relation", async () => {
      mockDbQuery([], {
        terminal: "where",
        reject: new Error("does not exist"),
      });
      await expect(fetchCatalogProductSpecsRowsLive([String(productRowA.id)])).resolves.toBeNull();
    });

    it("returns null when database is not configured", async () => {
      isProductsDatabaseConfigured.mockReturnValue(false);
      await expect(fetchCatalogProductSpecsRowsLive([String(productRowA.id)])).resolves.toBeNull();
    });

    it("coalesces a null specs payload", async () => {
      mockDbQuery([{ product_id: productRowA.id, specs: null }], { terminal: "where" });
      const rows = await fetchCatalogProductSpecsRowsLive([String(productRowA.id)]);
      expect(rows?.[0]).toEqual({ product_id: productRowA.id, specs: null });
    });
  });

  describe("fetchCatalogProductImageRowsLive", () => {
    it("returns null when productIds is empty", async () => {
      await expect(fetchCatalogProductImageRowsLive([])).resolves.toBeNull();
    });

    it("returns ordered image rows", async () => {
      mockDbQuery(
        [
          {
            product_id: productRowA.id,
            image_url: "https://cdn.example/chair.jpg",
            image_kind: "hero",
            sort_order: 1,
          },
        ],
        { terminal: "orderBy" },
      );
      const rows = await fetchCatalogProductImageRowsLive([String(productRowA.id)]);
      expect(rows?.[0]?.image_url).toBe("https://cdn.example/chair.jpg");
    });

    it("returns null on missing relation", async () => {
      mockDbQuery([], {
        terminal: "orderBy",
        reject: new Error("42P01"),
      });
      await expect(fetchCatalogProductImageRowsLive([String(productRowA.id)])).resolves.toBeNull();
    });

    it("returns null when database is not configured", async () => {
      isProductsDatabaseConfigured.mockReturnValue(false);
      await expect(fetchCatalogProductImageRowsLive([String(productRowA.id)])).resolves.toBeNull();
    });
  });

  describe("Vercel REST transport", () => {
    it("reads catalog_products over HTTPS and never opens drizzle", async () => {
      process.env.VERCEL = "1";
      const restRow = {
        ...productRowA,
        "3d_model": "chair-alpha.glb",
        model_3d: undefined,
      };
      const inFn = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: [restRow], error: null }),
      });
      createOptionalSupabaseAdminClient.mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ in: inFn }),
        }),
      });

      const product = await fetchCatalogProductBySlugLive("chair-alpha");
      expect(product?.slug).toBe("chair-alpha");
      expect(product?.["3d_model"]).toBe("chair-alpha.glb");
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it("returns null without drizzle when REST client is missing", async () => {
      process.env.VERCEL = "1";
      createOptionalSupabaseAdminClient.mockReturnValue(null);
      await expect(fetchCatalogProductBySlugLive("chair-alpha")).resolves.toBeNull();
      expect(mockSelect).not.toHaveBeenCalled();
    });
  });
});
