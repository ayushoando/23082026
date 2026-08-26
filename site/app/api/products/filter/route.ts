import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { buildRequestedCategoryCatalog } from '@/lib/catalog/site/categories';
import { getCatalog, type CompatProduct } from '@/lib/catalog/site/getProducts';
import {
  applyCatalogProductFilters,
  type CatalogAppliedFilters,
} from "@/lib/catalog/site/applyCatalogProductFilters";
import {
  PRICE_RANGES,
  parseEcoMin,
  parseSortOption,
} from '@/lib/catalog/site/filters';
import { dedupeCatalogProductsByName } from "@/lib/catalog/site/catalogProductDedupe";
import { hasVerifiedHeadrest, hasVerifiedHeightAdjustable } from "@/lib/catalog/site/traits";
import { enforcePublicApiRateLimit } from "@/app/api/_lib/public";

export const dynamic = "force-dynamic";

interface FlatProduct extends CompatProduct {
  seriesId: string;
  seriesName: string;
  altText: string;
}

interface AppliedFilters extends CatalogAppliedFilters {
  category: string;
}

interface FilterResponse {
  products: FlatProduct[];
  total: number;
  facets: {
    series: string[];
    subcategory: string[];
    material: string[];
    priceRange: string[];
    ecoMin: { min: number; max: number };
    featureAvailability: {
      hasHeadrest: boolean;
      isHeightAdjustable: boolean;
      bifmaCertified: boolean;
      isStackable: boolean;
    };
  };
  meta: {
    categoryId: string;
    applied: AppliedFilters;
    catalogTotal: number;
  };
}

function productAltText(product: CompatProduct, categoryLabel: string): string {
  const metadata = (product.metadata || {}) as Record<string, unknown>;
  const aiAltText =
    (typeof metadata.ai_alt_text === "string" && metadata.ai_alt_text) ||
    (typeof metadata.aiAltText === "string" && metadata.aiAltText) ||
    "";
  const explicitAlt =
    (product as unknown as { altText?: string; alt_text?: string }).altText ||
    (product as unknown as { altText?: string; alt_text?: string }).alt_text ||
    aiAltText;

  const fallback = `${product.name} ${categoryLabel}`.replace(/\s+/g, " ").trim();
  return (explicitAlt || fallback).replace(/\s+/g, " ").trim().slice(0, 140);
}

function toFlatProduct(categoryLabel: string, seriesId: string, seriesName: string, product: CompatProduct): FlatProduct {
  return {
    ...product,
    seriesId,
    seriesName,
    altText: productAltText(product, categoryLabel),
  };
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

function dedupeProducts(products: FlatProduct[]): FlatProduct[] {
  return dedupeCatalogProductsByName(products);
}

function parseAppliedFilters(request: NextRequest): AppliedFilters {
  const sp = request.nextUrl.searchParams;
  const sub = Array.from(
    new Set(
      [...sp.getAll("sub"), ...sp.getAll("sub[]")]
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  );
  const price = Array.from(
    new Set(
      sp
        .getAll("price")
        .filter((v) => PRICE_RANGES.includes(v as (typeof PRICE_RANGES)[number])),
    ),
  );
  const mat = Array.from(
    new Set(
      [...sp.getAll("mat"), ...sp.getAll("mat[]")]
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  );

  return {
    category: (sp.get("category") || "").trim(),
    q: (sp.get("q") || "").trim(),
    series: (sp.get("series") || "all").trim() || "all",
    sub,
    price,
    mat,
    headrest: sp.get("headrest") === "1",
    heightAdj: sp.get("heightAdj") === "1" || sp.get("height-adj") === "1",
    bifma: sp.get("bifma") === "1" || sp.get("bifmaCertified") === "1",
    stackable: sp.get("stackable") === "1",
    ecoMin: parseEcoMin(sp.get("ecoMin")),
    sort: parseSortOption(sp.get("sort")),
  };
}

function buildFacets(
  categoryId: string,
  products: FlatProduct[],
): FilterResponse["facets"] {
  const series =
    categoryId === "seating"
      ? []
      : uniqueSorted(products.map((product) => product.seriesName || "").filter(Boolean));
  const subcategory = uniqueSorted(
    products.map((product) => product.metadata?.subcategory || "").filter(Boolean),
  );
  const material = uniqueSorted(
    products.flatMap((product) => product.metadata?.material || []).filter(Boolean),
  );
  const priceRange = PRICE_RANGES.filter((range) =>
    products.some((product) => product.metadata?.priceRange === range),
  );

  const ecoScores = products
    .map((product) => product.metadata?.sustainabilityScore)
    .filter((score): score is number => typeof score === "number");
  const ecoMin = ecoScores.length > 0 ? Math.min(...ecoScores) : 0;
  const ecoMax = ecoScores.length > 0 ? Math.max(...ecoScores) : 10;

  const withHeadrest = products.filter((product) => hasVerifiedHeadrest(product)).length;
  const withHeightAdj = products.filter((product) => hasVerifiedHeightAdjustable(product)).length;
  const withBifma = products.filter((product) => Boolean(product.metadata?.bifmaCertified)).length;
  const withStackable = products.filter((product) => Boolean(product.metadata?.isStackable)).length;

  return {
    series,
    subcategory,
    material,
    priceRange,
    ecoMin: { min: ecoMin, max: ecoMax },
    featureAvailability: {
      hasHeadrest: withHeadrest > 0,
      isHeightAdjustable: withHeightAdj > 0,
      bifmaCertified: withBifma > 0,
      isStackable: withStackable > 0,
    },
  };
}

export async function GET(request: NextRequest) {
  const rateError = await enforcePublicApiRateLimit(request, "products-filter:get", 30);
  if (rateError) {return rateError;}

  const filters = parseAppliedFilters(request);
  if (!filters.category) {
    return NextResponse.json(
      {
        products: [],
        total: 0,
        facets: {
          series: [],
          subcategory: [],
          material: [],
          priceRange: [],
          ecoMin: { min: 0, max: 10 },
          featureAvailability: {
            hasHeadrest: false,
            isHeightAdjustable: false,
            bifmaCertified: false,
            isStackable: false,
          },
        },
        meta: { categoryId: "", applied: filters, catalogTotal: 0 },
      } satisfies FilterResponse,
      { status: 400 },
    );
  }

  if (request.signal.aborted) {
    return new NextResponse(null, { status: 499 });
  }

  try {
    const catalog = buildRequestedCategoryCatalog(await getCatalog());
    const category = catalog.find((entry) => entry.id === filters.category);

    if (!category) {
      return NextResponse.json(
        {
          products: [],
          total: 0,
          facets: {
            series: [],
            subcategory: [],
            material: [],
            priceRange: [],
            ecoMin: { min: 0, max: 10 },
            featureAvailability: {
              hasHeadrest: false,
              isHeightAdjustable: false,
              bifmaCertified: false,
              isStackable: false,
            },
          },
          meta: { categoryId: filters.category, applied: filters, catalogTotal: 0 },
        } satisfies FilterResponse,
        { status: 404 },
      );
    }

    const allProducts = category.series.flatMap((series) =>
      series.products.map((product) =>
        toFlatProduct(category.name, series.id, series.name, product),
      ),
    );
    const uniqueProducts = dedupeProducts(allProducts);

    const facets = buildFacets(category.id, uniqueProducts);
    const filtered = applyCatalogProductFilters(category.id, uniqueProducts, filters);

    return NextResponse.json(
      {
        products: filtered,
        total: filtered.length,
        facets,
        meta: {
          categoryId: category.id,
          applied: filters,
          catalogTotal: uniqueProducts.length,
        },
      } satisfies FilterResponse,
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        products: [],
        total: 0,
        facets: {
          series: [],
          subcategory: [],
          material: [],
          priceRange: [],
          ecoMin: { min: 0, max: 10 },
          featureAvailability: {
            hasHeadrest: false,
            isHeightAdjustable: false,
            bifmaCertified: false,
            isStackable: false,
          },
        },
        meta: {
          categoryId: filters.category,
          applied: filters,
          catalogTotal: 0,
        },
      } satisfies FilterResponse,
      { status: 500 },
    );
  }
}
