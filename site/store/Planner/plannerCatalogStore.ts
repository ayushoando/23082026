"use client";
import { create } from "zustand";
import { listFurniture } from "@planner/lib/plannerApi";
import type { FurnitureItem } from "@planner/lib/plannerTypes";

type CatalogStore = {
  items: FurnitureItem[];
  loading: boolean;
  error: string | null;
  categories: string[];
  selectedItem: FurnitureItem | null;
  refresh: () => Promise<void>;
  addItem: (item: FurnitureItem) => void;
  selectItem: (item: FurnitureItem) => void;
};

/** Keep guest catalog state limited to the fields required for browsing and placement. */
export function toPublicPlannerFurniture(item: FurnitureItem): FurnitureItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    subcategory: item.subcategory ?? null,
    tags: Array.isArray(item.tags) ? [...item.tags] : [],
    dimensions: {
      width_mm: item.dimensions.width_mm,
      depth_mm: item.dimensions.depth_mm,
      height_mm: item.dimensions.height_mm,
    },
    top_png_url: item.top_png_url ?? null,
    top_svg_url: item.top_svg_url ?? null,
    thumb_url: item.thumb_url ?? null,
    thumbnail_url: item.thumbnail_url ?? null,
    is_custom: Boolean(item.is_custom),
  };
}

export const useCatalogStore = create<CatalogStore>((set) => ({
  items: [],
  loading: false,
  error: null,
  categories: ["all"],
  selectedItem: null,
  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const items = (await listFurniture()).map(toPublicPlannerFurniture);
      const cats = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));
      set((state) => ({
        items,
        categories: ["all", ...cats.sort()],
        loading: false,
        selectedItem:
          items.find((item) => item.id === state.selectedItem?.id) ??
          state.selectedItem,
      }));
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to load catalog",
        loading: false,
      });
    }
  },
  addItem: (item) =>
    set((state) => ({ items: [toPublicPlannerFurniture(item), ...state.items] })),
  selectItem: (item) => set({ selectedItem: toPublicPlannerFurniture(item) }),
}));
