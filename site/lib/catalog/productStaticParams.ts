import "server-only";

import {
  classifyToRequestedCategory,
  normalizeRequestedCategoryId,
} from "@/lib/catalog/site/categories";
import { fetchCatalogProductsLive } from "./catalogDrizzle";
import { buildLocalCatalogFallbackProducts } from "./fallback";
import { derivePublicProductUrlKey } from "./productUrlKey";

export type ProductStaticParamRow = {
  id?: string;
  slug?: string | null;
  category_id?: string | null;
  name?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  series_name?: string | null;
  images?: string[] | null;
  flagship_image?: string | null;
  updated_at?: string | null;
};

export {
  derivePublicProductUrlKey,
  deriveSourceSlug,
  isPublicCatalogUrlSegment,
  isReservedPublicProductUrlKey,
  isUuidSegment,
} from "./productUrlKey";

function resolveRequestedCategoryId(row: ProductStaticParamRow): string {
  const rawCategoryId = row.category_id || "";
  const normalized = normalizeRequestedCategoryId(rawCategoryId);
  if (normalized) {return normalized;}

  return classifyToRequestedCategory({
    baseCategoryId: rawCategoryId,
    seriesName: row.series_name || "",
    product: {
      id: row.id || row.slug || rawCategoryId,
      slug: row.slug || "",
      name: row.name || "",
      description: row.description || "",
      flagshipImage: row.flagship_image || "",
      sceneImages: [],
      variants: [],
      detailedInfo: {
        overview: "",
        features: [],
        dimensions: "",
        materials: [],
      },
      metadata: row.metadata || {},
      images: Array.isArray(row.images) ? row.images : [],
    },
  });
}

async function loadMergedProductRows(): Promise<ProductStaticParamRow[]> {
  let liveRows: Awaited<ReturnType<typeof fetchCatalogProductsLive>> = null;
  try {
    liveRows = await fetchCatalogProductsLive();
  } catch {
    // Live catalog is optional — disk fallback still has to populate sitemap/SSG.
    liveRows = null;
  }
  const merged = new Map<string, ProductStaticParamRow>();

  for (const product of buildLocalCatalogFallbackProducts()) {
    const slug = typeof product.slug === "string" ? product.slug.trim() : "";
    if (!slug) {continue;}
    merged.set(slug, {
      id: product.id,
      slug: product.slug,
      category_id: product.category_id,
      name: product.name,
      description: product.description,
      metadata: (product.metadata ?? null) as Record<string, unknown> | null,
      series_name: product.series_name ?? null,
      images: product.images ?? null,
      flagship_image: product.flagship_image ?? null,
    });
  }

  for (const product of liveRows ?? []) {
    const slug = typeof product.slug === "string" ? product.slug.trim() : "";
    if (!slug) {continue;}
    const updatedAt =
      typeof (product as { updated_at?: string }).updated_at === "string"
        ? (product as { updated_at?: string }).updated_at
        : product.created_at;
    merged.set(slug, {
      id: product.id,
      slug: product.slug,
      category_id: product.category_id,
      name: product.name,
      description: product.description,
      metadata: (product.metadata ?? null) as Record<string, unknown> | null,
      series_name: product.series_name ?? null,
      images: product.images ?? null,
      flagship_image: product.flagship_image ?? null,
      updated_at: updatedAt ?? null,
    });
  }

  return [...merged.values()];
}

export async function buildProductStaticParams(): Promise<
  Array<{ category: string; product: string }>
> {
  const data = await loadMergedProductRows();
  const seen = new Set<string>();
  const params: Array<{ category: string; product: string }> = [];

  for (const row of data) {
    const category = (resolveRequestedCategoryId(row) || "").toLowerCase();
    const product = derivePublicProductUrlKey(row);
    if (!category || !product) {
      continue;
    }

    const key = `${category}::${product}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    params.push({ category, product });
  }

  return params;
}

function parseCatalogLastModified(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Per public product URL path → lastModified for sitemap (plan 02 / 06). */
export async function buildCatalogLastModifiedByPath(): Promise<Map<string, Date>> {
  const rows = await loadMergedProductRows();
  const map = new Map<string, Date>();
  for (const row of rows) {
    const category = (resolveRequestedCategoryId(row) || "").toLowerCase();
    const product = derivePublicProductUrlKey(row);
    if (!category || !product) continue;
    const last = parseCatalogLastModified(row.updated_at ?? null);
    if (!last) continue;
    map.set(`/products/${category}/${product}`, last);
    const catPath = `/products/${category}`;
    const existing = map.get(catPath);
    if (!existing || last > existing) {
      map.set(catPath, last);
    }
  }
  return map;
}

/** Latest catalog change for a public category listing path. */
export async function getCategoryLastUpdated(
  categoryId: string,
): Promise<Date | undefined> {
  const map = await buildCatalogLastModifiedByPath();
  return map.get(`/products/${categoryId.toLowerCase()}`);
}
