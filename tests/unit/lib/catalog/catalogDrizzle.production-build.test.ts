import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NEXT_PHASE = "phase-production-build";
});

const { isProductsDatabaseConfigured, mockSelect } = vi.hoisted(() => ({
  isProductsDatabaseConfigured: vi.fn(() => true),
  mockSelect: vi.fn(),
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
  createOptionalSupabaseAdminClient: vi.fn(() => null),
}));

vi.mock("server-only", () => ({}));

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

describe("catalogDrizzle during Next production build", () => {
  it("refuses every live catalog query even when the products DB is configured", async () => {
    expect(isProductsDatabaseConfigured()).toBe(true);
    expect(canQueryCatalogDatabase()).toBe(false);

    await expect(fetchCatalogProductsLive()).resolves.toBeNull();
    await expect(fetchCatalogProductsByCategoryLive("chairs")).resolves.toBeNull();
    await expect(fetchCatalogProductBySlugLive("chair-alpha")).resolves.toBeNull();
    await expect(fetchCatalogCategoryIdsLive()).resolves.toBeNull();
    await expect(fetchCatalogCategoriesLive()).resolves.toBeNull();
    await expect(fetchCatalogSlugAliasLive("old-chair")).resolves.toBeNull();
    await expect(fetchCatalogProductsSlugFieldsByCategoryLive("chairs")).resolves.toBeNull();
    await expect(fetchBusinessStatsActiveLive()).resolves.toBeNull();
    await expect(fetchCatalogProductSpecsRowsLive(["id"])).resolves.toBeNull();
    await expect(fetchCatalogProductImageRowsLive(["id"])).resolves.toBeNull();
    expect(mockSelect).not.toHaveBeenCalled();
  });
});
