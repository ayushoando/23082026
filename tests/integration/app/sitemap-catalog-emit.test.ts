import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { fetchCatalogProductsLive } = vi.hoisted(() => ({
  fetchCatalogProductsLive: vi.fn(),
}));

vi.mock("@/lib/catalog/catalogDrizzle", () => ({
  fetchCatalogProductsLive,
}));

import sitemap from "@/app/sitemap";

describe("sitemap catalog emit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCatalogProductsLive.mockResolvedValue(null);
  });

  it("emits lowercase Crest and never emits Categories from the real catalog index", async () => {
    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    expect(urls.some((url) => /\/products\/tables\/crest\/?$/i.test(url))).toBe(true);
    expect(urls.some((url) => /\/products\/tables\/Crest\//.test(url))).toBe(false);
    expect(urls.some((url) => /\/products\/[^/]+\/Categories\//.test(url))).toBe(false);
    expect(urls.some((url) => /\/products\/[^/]+\/categories\//i.test(url))).toBe(false);
  });
});
