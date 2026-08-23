/**
 * Name-mirror: site/app/sitemap.ts
 * Every URL must use SITE_URL host from env — never hardcoded localhost.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PLANNER_MARKETING_SITEMAP_PATHS,
  PUBLIC_INDEXABLE_STATIC_PATHS,
  SOLUTION_CATEGORY_SITEMAP_PATHS,
} from "@/features/site/data/routeClassification";

vi.mock("@/lib/catalog/productStaticParams", () => ({
  buildProductStaticParams: vi.fn(),
  buildCatalogLastModifiedByPath: vi.fn(async () => new Map()),
}));

describe("app/sitemap.ts", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  async function loadSitemap() {
    const productStaticParams = await import("@/lib/catalog/productStaticParams");
    vi.spyOn(productStaticParams, "buildProductStaticParams").mockRejectedValue(
      new Error("catalog offline"),
    );
    return (await import("@/app/sitemap")).default;
  }

  it("prefixes static + planner + solution paths with default production host", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.SITE_URL;

    const sitemap = await loadSitemap();
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url.startsWith("https://oando.co.in/")).toBe(true);
      expect(url).not.toMatch(/localhost|127\.0\.0\.1/i);
    }

    for (const path of PUBLIC_INDEXABLE_STATIC_PATHS) {
      if (path === "/") {
        expect(urls.some((url) => url === "https://oando.co.in/")).toBe(true);
      } else {
        expect(urls.some((url) => url.includes(`${path}/`) || url.endsWith(path))).toBe(
          true,
        );
      }
    }
    for (const path of PLANNER_MARKETING_SITEMAP_PATHS) {
      expect(urls.some((url) => url.includes(`${path}/`) || url.endsWith(path))).toBe(true);
    }
    for (const path of SOLUTION_CATEGORY_SITEMAP_PATHS) {
      expect(urls.some((url) => url.includes(`${path}/`) || url.endsWith(path))).toBe(true);
    }

    expect(urls.some((url) => url.includes("/quote-cart/"))).toBe(false);
    expect(urls.some((url) => url.includes("/admin/"))).toBe(false);
    expect(urls.some((url) => url.includes("/api/"))).toBe(false);
    expect(urls.some((url) => url.includes("/portal/"))).toBe(false);
    expect(urls.some((url) => url.includes("/dashboard/"))).toBe(false);
    expect(urls.some((url) => url.includes("/access/"))).toBe(false);
    expect(urls.some((url) => url.includes("/ooplanner/"))).toBe(false);
    expect(urls.some((url) => url.includes("/planner/features/3d-view"))).toBe(false);
    expect(urls.some((url) => url.includes("/planner/canvas/"))).toBe(false);
    expect(urls.some((url) => url.includes("/planner/guest/"))).toBe(false);
    expect(urls.some((url) => url.includes("/tools/"))).toBe(false);
    for (const entry of entries) {
      expect(entry.lastModified).toBeUndefined();
    }
  });

  it("uses NEXT_PUBLIC_SITE_URL as the absolute host for every entry", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://seo-host.example.com///";
    delete process.env.SITE_URL;

    const sitemap = await loadSitemap();
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.url.startsWith("https://seo-host.example.com/")).toBe(true);
      expect(entry.url).not.toMatch(/localhost|127\.0\.0\.1/i);
    }
  });

  it("includes catalog product URLs under the same env host when catalog loads", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://catalog-host.example.com";
    delete process.env.SITE_URL;

    const productStaticParams = await import("@/lib/catalog/productStaticParams");
    const catalogUpdated = new Date("2026-04-01T00:00:00.000Z");
    vi.spyOn(productStaticParams, "buildProductStaticParams").mockResolvedValue([
      { category: "seating", product: "mesh-chair" },
      { category: "seating", product: "p2" },
    ]);
    vi.spyOn(productStaticParams, "buildCatalogLastModifiedByPath").mockResolvedValue(
      new Map([["/products/seating/mesh-chair", catalogUpdated]]),
    );

    const sitemap = (await import("@/app/sitemap")).default;
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls.some((url) => url === "https://catalog-host.example.com/products/seating/")).toBe(
      true,
    );
    expect(
      urls.some((url) => url === "https://catalog-host.example.com/products/seating/mesh-chair/"),
    ).toBe(true);
    expect(
      urls.some((url) => url === "https://catalog-host.example.com/products/seating/p2/"),
    ).toBe(true);
    const mesh = entries.find(
      (entry) => entry.url === "https://catalog-host.example.com/products/seating/mesh-chair/",
    );
    expect(mesh?.lastModified).toEqual(catalogUpdated);
    const home = entries.find((entry) => entry.url === "https://catalog-host.example.com/");
    expect(home?.lastModified).toBeUndefined();
  });
});
