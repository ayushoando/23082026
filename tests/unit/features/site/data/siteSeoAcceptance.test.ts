/**
 * SITE-SEO-01, SITE-SEO-03, SITE-SEO-04 — unit contracts.
 * Browser/prod recheck still required before checklist PASS.
 */

import { describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

/**
 * Hermeticity: `sitemap()` → `buildProductStaticParams()` →
 * `fetchCatalogProductsLive()`. With a real `PRODUCTS_DATABASE_URL` in
 * `.env.local` the unmocked call opens a live Postgres connection and
 * exceeded the vitest timeout (deterministic red). Mock it like every
 * sibling catalog test; `null` keeps the disk-fallback merge path.
 */
vi.mock("@/lib/catalog/catalogDrizzle", () => ({
  fetchCatalogProductsLive: vi.fn().mockResolvedValue(null),
}));
import {
  PLANNER_MARKETING_SITEMAP_PATHS,
  PUBLIC_INDEXABLE_STATIC_PATHS,
  SITE_ROUTE_CLASSIFICATION,
  getRouteClassification,
} from "@/features/site/data/routeClassification";
import {
  SEO01_STATIC_METADATA,
  expectedStaticSitemapPaths,
  indexableStaticPathsMissingMetadata,
  listDuplicateTitles,
  metadataTitleString,
  productJsonLdMatchesVisible,
  publicNoindexRoutes,
  sitemapMustExcludePaths,
} from "@/features/site/data/siteSeoContract";
import {
  buildClientsItemListJsonLd,
  buildPageMetadata,
  buildProductJsonLd,
  countBrandPipeSegments,
  resolveDocumentTitle,
} from "@/features/site/data/seo";
import { getPublishedRecords } from "@/lib/clients/clientRegistry";
import { SITE_NAV_LINKS, SITE_FOOTER_NAV } from "@/features/site/data/navigation";
import { buildSitemapSections } from "@/features/site/data/htmlSitemap";
import {
  ACCESS_PAGE_METADATA,
  CHOOSE_PRODUCT_PAGE_METADATA,
  QUOTE_CART_PAGE_METADATA,
} from "@/features/site/data/routeMetadata";
import { SITE_URL } from "@/lib/siteUrl";
import { SITE_BRAND } from "@/features/site/data/brand";

function normalizeSitemapPathname(path: string): string {
  if (path === "/") {
    return "/";
  }
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

function sitemapUrlsIncludeExactPath(urls: readonly string[], path: string): boolean {
  const target = normalizeSitemapPathname(path);
  return urls.some((url) => normalizeSitemapPathname(new URL(url).pathname) === target);
}

describe("SITE-SEO-01 unique title, description, canonical", () => {
  it("registers metadata for every static indexable public path", () => {
    expect(indexableStaticPathsMissingMetadata()).toEqual([]);
  });

  it("gives each static marketing page a unique non-empty title and description", () => {
    const dups = listDuplicateTitles(SEO01_STATIC_METADATA);
    expect(dups).toEqual([]);

    for (const entry of SEO01_STATIC_METADATA) {
      const title = metadataTitleString(entry.metadata);
      expect(title.length, entry.path).toBeGreaterThan(3);
      expect(String(entry.metadata.description ?? "").length, entry.path).toBeGreaterThan(
        20,
      );
      const canonical = entry.metadata.alternates?.canonical;
      expect(canonical, entry.path).toBeDefined();
      expect(String(canonical), entry.path).toContain(entry.path === "/" ? "" : entry.path);
    }
  });

  it("SF-02: static titles are absolute and never double the brand suffix", () => {
    for (const entry of SEO01_STATIC_METADATA) {
      const raw = entry.metadata.title;
      expect(raw && typeof raw === "object" && "absolute" in raw, entry.path).toBe(true);
      const title = metadataTitleString(entry.metadata);
      expect(countBrandPipeSegments(title), entry.path).toBeLessThanOrEqual(1);
      expect(title, entry.path).not.toMatch(
        new RegExp(
          `${SITE_BRAND.titleSuffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[|–—-]\\s*${SITE_BRAND.titleSuffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
          "i",
        ),
      );
      // resolveDocumentTitle is idempotent on absolute page titles
      expect(resolveDocumentTitle(title), entry.path).toBe(title);
    }
  });

  it("host honesty: static canonicals use SITE_URL origin, never localhost", () => {
    const origin = new URL(SITE_URL).origin;
    for (const entry of SEO01_STATIC_METADATA) {
      const canonical = String(entry.metadata.alternates?.canonical ?? "");
      expect(canonical, entry.path).toMatch(new RegExp(`^${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
      expect(canonical, entry.path).not.toMatch(/localhost|127\.0\.0\.1/i);
    }
  });

  it("covers the same set as PUBLIC_INDEXABLE_STATIC_PATHS", () => {
    expect([...expectedStaticSitemapPaths()].sort()).toEqual(
      [...PUBLIC_INDEXABLE_STATIC_PATHS].sort(),
    );
  });
});

describe("SITE-SEO-03 sitemap, robots, classification agreement", () => {
  it("classifies brochure aliases as redirects (not indexable documents)", () => {
    expect(getRouteClassification("/brochure")?.classification).toBe("redirect");
    expect(getRouteClassification("/brochure")?.indexable).toBe(false);
    expect(getRouteClassification("/download-brochure")?.classification).toBe(
      "redirect",
    );
    expect(getRouteClassification("/download-brochure")?.indexable).toBe(false);
  });

  it("marks auth and cart utilities noindex in classification", () => {
    for (const route of [
      "/quote-cart",
      "/tracking",
      "/access",
      "/choose-product",
    ]) {
      expect(getRouteClassification(route)?.indexable, route).toBe(false);
    }
  });

  it("emits robots noindex on utility page metadata", () => {
    for (const meta of [
      QUOTE_CART_PAGE_METADATA,
      ACCESS_PAGE_METADATA,
      CHOOSE_PRODUCT_PAGE_METADATA,
    ]) {
      expect(meta.robots).toEqual({
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
      });
    }
  });

  it("classifies retired portal SVG catalog as redirect + noindex", () => {
    expect(getRouteClassification("/portal/svg-catalog")?.classification).toBe(
      "redirect",
    );
    expect(getRouteClassification("/portal/svg-catalog")?.indexable).toBe(false);
    expect(getRouteClassification("/portal/svg-catalog/[slug]")?.classification).toBe(
      "redirect",
    );
    expect(getRouteClassification("/portal/svg-catalog/[slug]")?.indexable).toBe(
      false,
    );
    expect(getRouteClassification("/portal/svg-catalog")?.canonicalUrl).toContain(
      "/products",
    );
  });

  it("robots.txt allows crawl access without disallow blocks", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    for (const rule of rules) {
      expect(rule?.disallow).toBeUndefined();
    }
  });

  it("sitemap includes only indexable static + planner marketing paths", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    for (const path of PUBLIC_INDEXABLE_STATIC_PATHS) {
      if (path === "/") {
        expect(urls.some((url) => /^https?:\/\/[^/]+\/$/.test(url)), "missing /").toBe(true);
      } else {
        expect(sitemapUrlsIncludeExactPath(urls, path), `missing ${path}`).toBe(true);
      }
    }
    for (const path of PLANNER_MARKETING_SITEMAP_PATHS) {
      expect(sitemapUrlsIncludeExactPath(urls, path), `missing planner ${path}`).toBe(true);
    }

    for (const path of sitemapMustExcludePaths()) {
      if (path === "/_not-found") continue;
      expect(sitemapUrlsIncludeExactPath(urls, path), `must exclude ${path}`).toBe(false);
    }
  });

  it("does not list redirect-only or noindex utilities as public indexable", () => {
    expect(PUBLIC_INDEXABLE_STATIC_PATHS).not.toContain("/brochure");
    expect(PUBLIC_INDEXABLE_STATIC_PATHS).not.toContain("/download-brochure");
    expect(PUBLIC_INDEXABLE_STATIC_PATHS).not.toContain("/choose-product");
    expect(publicNoindexRoutes()).toContain("/quote-cart");
  });

  it("buildPageMetadata defaults indexable and can force noindex", () => {
    const indexed = buildPageMetadata("https://example.com", {
      title: "A",
      description: "A long enough description for SEO tests.",
      path: "/a",
    });
    expect(indexed.robots).toEqual({
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    });

    const blocked = buildPageMetadata("https://example.com", {
      title: "B",
      description: "A long enough description for SEO tests.",
      path: "/b",
      indexable: false,
    });
    expect(blocked.robots).toEqual({
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    });
  });
});

describe("SITE-SEO-04 structured data matches visible product fields", () => {
  it("buildProductJsonLd copies name, description, url, sku and invents no offers", () => {
    const visible = {
      name: "Desk Pro X",
      description: "Modular workstation for open offices.",
      url: "https://example.com/products/workstations/desk-pro-x",
      image: "/assets/catalog/desk.webp",
      sku: "desk-pro-x",
    };
    expect(productJsonLdMatchesVisible("https://example.com", visible)).toBe(
      true,
    );
    const ld = buildProductJsonLd("https://example.com", visible);
    expect(ld["@type"]).toBe("Product");
    expect(ld["@id"]).toBe(
      "https://example.com/products/workstations/desk-pro-x#product",
    );
    expect(ld.image).toBe("https://example.com/assets/catalog/desk.webp");
    expect(ld).not.toHaveProperty("offers");
  });

  it("classifies every (site) route with an access decision", () => {
    expect(SITE_ROUTE_CLASSIFICATION.length).toBeGreaterThan(20);
    for (const meta of SITE_ROUTE_CLASSIFICATION) {
      expect(["public", "protected", "redirect", "not-found", "removed"]).toContain(
        meta.classification,
      );
      expect(typeof meta.indexable).toBe("boolean");
    }
  });
});

describe("SITE-SEO-05 /clients Schema.org ItemList with 116 published clients", () => {
  it("buildClientsItemListJsonLd produces valid Schema.org ItemList with 116 ListItem items", () => {
    const clients = getPublishedRecords();
    expect(clients.length).toBe(116);

    const itemList = buildClientsItemListJsonLd(SITE_URL, clients);
    expect(itemList["@context"]).toBe("https://schema.org");
    expect(itemList["@type"]).toBe("ItemList");
    expect(itemList["@id"]).toContain("/clients/#clients-directory");
    expect(itemList.numberOfItems).toBe(116);
    expect(itemList.itemListElement).toHaveLength(116);

    for (let i = 0; i < itemList.itemListElement.length; i++) {
      const el = itemList.itemListElement[i];
      expect(el["@type"]).toBe("ListItem");
      expect(el.position).toBe(i + 1);

      const org = el.item;
      expect(org["@type"]).toBe("Organization");
      expect(org["@id"]).toContain(`/clients/#${clients[i].canonicalId}-org`);
      expect(org.url).toContain(`/clients/#${clients[i].canonicalId}`);
      expect(org.name).toBe(clients[i].displayName);
      expect(org.logo).toMatch(/^https?:\/\/.+\/assets\/marketing\/client-logos\/.+/);
      expect(org.image).toBe(org.logo);
    }
  });
});

describe("SITE-SEO-06 100% Navigation, Footer & Sitemap Synchronization", () => {
  it("every header nav link points to a canonical route that is indexed in sitemaps with zero redirects", async () => {
    const sitemapEntries = await sitemap();
    const sitemapUrls = sitemapEntries.map((e) => e.url);

    for (const link of SITE_NAV_LINKS) {
      const classification = getRouteClassification(link.href);
      expect(
        classification?.classification,
        `Header link ${link.href} must be classified as public`,
      ).toBe("public");
      expect(
        classification?.indexable,
        `Header link ${link.href} must be indexable`,
      ).toBe(true);

      expect(
        sitemapUrlsIncludeExactPath(sitemapUrls, link.href),
        `Header link ${link.href} must be present in XML sitemap`,
      ).toBe(true);
    }
  });

  it("every footer link points to a canonical public route with zero redirects or 404s", async () => {
    const sitemapEntries = await sitemap();
    const sitemapUrls = sitemapEntries.map((e) => e.url);

    const footerHrefs = SITE_FOOTER_NAV.flatMap((col) => col.links).map((l) => l.href);
    const legalHrefs = ["/refund-and-return-policy", "/privacy", "/terms", "/sitemap"];
    const allFooterHrefs = [...footerHrefs, ...legalHrefs];

    for (const href of allFooterHrefs) {
      const classification = getRouteClassification(href);
      expect(
        classification?.classification,
        `Footer link ${href} must be classified as public`,
      ).toBe("public");
      expect(
        classification?.indexable,
        `Footer link ${href} must be indexable`,
      ).toBe(true);

      expect(
        sitemapUrlsIncludeExactPath(sitemapUrls, href),
        `Footer link ${href} must be present in XML sitemap`,
      ).toBe(true);
    }
  });

  it("HTML sitemap and XML sitemap have zero redirect sources and zero 404 targets", () => {
    const htmlSections = buildSitemapSections();
    const htmlHrefs = htmlSections.flatMap((s) => s.links).map((l) => l.href);

    for (const href of htmlHrefs) {
      if (href === "/sitemap.xml") continue;
      const classification = getRouteClassification(href);
      expect(
        classification?.classification,
        `HTML sitemap link ${href} must not be a redirect or private route`,
      ).toBe("public");
      expect(
        classification?.indexable,
        `HTML sitemap link ${href} must be indexable`,
      ).toBe(true);
    }
  });
});

