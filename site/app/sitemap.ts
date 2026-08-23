import type { MetadataRoute } from "next";
import { buildProductStaticParams, buildCatalogLastModifiedByPath } from "@/lib/catalog/productStaticParams";
import {
  PLANNER_MARKETING_SITEMAP_PATHS,
  PUBLIC_INDEXABLE_STATIC_PATHS,
  SOLUTION_CATEGORY_SITEMAP_PATHS,
} from "@/features/site/data/routeClassification";
import { buildCanonicalUrl, sanitizeCanonicalPath } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";

const BASE_URL = SITE_URL.replace(/\/+$/, "");

/** Public marketing/product paths only — never admin/api/private shells. */
const STATIC_SITEMAP_PATHS = Array.from(
  new Set<string>([
    ...PUBLIC_INDEXABLE_STATIC_PATHS,
    ...PLANNER_MARKETING_SITEMAP_PATHS,
    ...SOLUTION_CATEGORY_SITEMAP_PATHS,
  ]),
);

function isUuidSegment(segment: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    segment,
  );
}

/** Catalog id/slug segments — reject host injection, UUIDs, Title Case, and junk. */
function isSafeSitemapSegment(segment: unknown): segment is string {
  return (
    typeof segment === "string" &&
    /^[a-z0-9][a-z0-9._~-]*$/.test(segment) &&
    !segment.includes("--") &&
    segment !== "categories" &&
    !isUuidSegment(segment)
  );
}

function sitemapUrl(path: string): string {
  // Same host-safe builder as page canonicals — never emit foreign origins.
  return buildCanonicalUrl(BASE_URL, path);
}

function isPublicProductSitemapPath(path: string): boolean {
  const safe = sanitizeCanonicalPath(path);
  if (safe === "/") {
    return false;
  }
  // Only /products/{category}/ and /products/{category}/{slug}/ from catalog.
  return /^\/products\/[a-zA-Z0-9][a-zA-Z0-9._~-]*(\/[a-zA-Z0-9][a-zA-Z0-9._~-]*)?\/$/.test(
    safe,
  );
}

/** Higher priority = stronger crawl signal for commercial / conversion URLs. */
function staticPathPriority(path: string): number {
  if (path === "/") return 1;
  if (path === "/products" || path.startsWith("/products/")) return 0.95;
  if (path === "/solutions" || path.startsWith("/solutions/")) return 0.9;
  if (path === "/planning" || path === "/planner" || path.startsWith("/planner/")) {
    return 0.85;
  }
  if (path === "/contact" || path === "/showrooms" || path === "/downloads") {
    return 0.85;
  }
  if (path === "/clients" || path === "/trusted-by" || path === "/about") return 0.75;
  if (path === "/privacy" || path === "/terms" || path === "/refund-and-return-policy") {
    return 0.3;
  }
  return 0.65;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalogLastMod = await buildCatalogLastModifiedByPath();
  const entries: MetadataRoute.Sitemap = STATIC_SITEMAP_PATHS.map((path) => {
    const lastModified = catalogLastMod.get(path);
    return {
      url: sitemapUrl(path),
      ...(lastModified ? { lastModified } : {}),
      changeFrequency:
        path === "/" || path === "/products"
          ? "daily"
          : path.startsWith("/products/")
            ? "weekly"
            : "weekly",
      priority: staticPathPriority(path),
    };
  });

  try {
    const params = await buildProductStaticParams();
    const categoryIds = new Set<string>();
    for (const { category, product } of params) {
      if (!isSafeSitemapSegment(category) || !isSafeSitemapSegment(product)) {
        continue;
      }
      categoryIds.add(category);
      const productPath = `/products/${category}/${product}`;
      if (!isPublicProductSitemapPath(productPath)) {
        continue;
      }
      const productLastMod = catalogLastMod.get(productPath);
      entries.push({
        url: sitemapUrl(productPath),
        ...(productLastMod ? { lastModified: productLastMod } : {}),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    for (const category of categoryIds) {
      const categoryPath = `/products/${category}`;
      if (!isPublicProductSitemapPath(categoryPath)) {
        continue;
      }
      const categoryLastMod = catalogLastMod.get(categoryPath);
      entries.push({
        url: sitemapUrl(categoryPath),
        ...(categoryLastMod ? { lastModified: categoryLastMod } : {}),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // Keep static sitemap if catalog fetch fails.
  }

  // Dedupe by canonical URL (static lists can overlap; catalog may re-emit categories).
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}