import Fuse from "fuse.js";

import type { CompatProduct } from "@/lib/catalog/site/getProducts";
import { hasVerifiedHeadrest, hasVerifiedHeightAdjustable } from "@/lib/catalog/site/traits";
import {
  normalizeOptionValue,
  productMatchesSubcategoryFilters,
  type SortOption,
} from "@/lib/catalog/site/filters";

export type CatalogFilterProduct = CompatProduct & {
  seriesName?: string;
};

export interface CatalogAppliedFilters {
  series: string;
  q: string;
  sub: string[];
  price: string[];
  mat: string[];
  headrest: boolean;
  heightAdj: boolean;
  bifma: boolean;
  stackable: boolean;
  ecoMin: number | null;
  sort: SortOption;
}

export function applyCatalogProductFilters<T extends CatalogFilterProduct>(
  categoryId: string,
  products: T[],
  filters: CatalogAppliedFilters,
): T[] {
  let list = [...products];

  if (categoryId !== "seating" && filters.series !== "all") {
    const seriesNeedle = normalizeOptionValue(filters.series);
    list = list.filter(
      (product) => normalizeOptionValue(product.seriesName || "") === seriesNeedle,
    );
  }

  if (filters.q.length > 0) {
    const fuse = new Fuse(list, {
      keys: [
        "name",
        "description",
        "seriesName",
        "metadata.subcategory",
        "metadata.category",
        "metadata.tags",
      ],
      threshold: 0.35,
      ignoreLocation: true,
    });
    const ids = new Set(fuse.search(filters.q).map((result) => result.item.id));
    list = list.filter((product) => ids.has(product.id));
  }

  if (filters.sub.length > 0) {
    list = list.filter((product) =>
      productMatchesSubcategoryFilters(categoryId, product, filters.sub),
    );
  }

  if (filters.price.length > 0) {
    const needles = new Set(filters.price);
    list = list.filter(
      (product) => product.metadata?.priceRange && needles.has(product.metadata.priceRange),
    );
  }

  if (filters.mat.length > 0) {
    const needles = new Set(filters.mat.map((value) => normalizeOptionValue(value)));
    list = list.filter((product) =>
      (product.metadata?.material || []).some((material) =>
        needles.has(normalizeOptionValue(material)),
      ),
    );
  }

  if (filters.headrest) {
    list = list.filter((product) => hasVerifiedHeadrest(product));
  }
  if (filters.heightAdj) {
    list = list.filter((product) => hasVerifiedHeightAdjustable(product));
  }
  if (filters.bifma) {
    list = list.filter((product) => Boolean(product.metadata?.bifmaCertified));
  }
  if (filters.stackable) {
    list = list.filter((product) => Boolean(product.metadata?.isStackable));
  }
  if (typeof filters.ecoMin === "number") {
    list = list.filter(
      (product) => (product.metadata?.sustainabilityScore || 0) >= filters.ecoMin!,
    );
  }

  list.sort((left, right) => {
    if (filters.sort === "za") {return right.name.localeCompare(left.name);}
    if (filters.sort === "ecoDesc") {
      return (right.metadata?.sustainabilityScore || 0) - (left.metadata?.sustainabilityScore || 0);
    }
    if (filters.sort === "ecoAsc") {
      return (left.metadata?.sustainabilityScore || 0) - (right.metadata?.sustainabilityScore || 0);
    }
    return left.name.localeCompare(right.name);
  });

  return list;
}

export function activeFiltersToCatalogApplied(
  filters: {
    series: string;
    query: string;
    sort: SortOption;
    subcategory: string[];
    priceRange: string[];
    material: string[];
    hasHeadrest: boolean;
    isHeightAdjustable: boolean;
    bifmaCertified: boolean;
    isStackable: boolean;
    ecoMin: number | null;
  },
): CatalogAppliedFilters {
  return {
    series: filters.series,
    q: filters.query.trim(),
    sub: filters.subcategory,
    price: filters.priceRange,
    mat: filters.material,
    headrest: filters.hasHeadrest,
    heightAdj: filters.isHeightAdjustable,
    bifma: filters.bifmaCertified,
    stackable: filters.isStackable,
    ecoMin: filters.ecoMin,
    sort: filters.sort,
  };
}
