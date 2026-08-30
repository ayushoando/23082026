// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FurnitureItem } from "@planner/lib/plannerTypes";

const { listFurniture } = vi.hoisted(() => ({
  listFurniture: vi.fn<() => Promise<FurnitureItem[]>>(),
}));

vi.mock("@planner/lib/plannerApi", () => ({
  listFurniture,
}));

import {
  toPublicPlannerFurniture,
  useCatalogStore,
} from "@planner/store/plannerCatalogStore";

const furniture = (overrides: Partial<FurnitureItem> = {}): FurnitureItem => ({
  id: "chair-1",
  name: "Task Chair",
  category: "Seating",
  subcategory: "Task",
  tags: ["ergonomic"],
  dimensions: { width_mm: 600, depth_mm: 600, height_mm: 900 },
  thumbnail_url: "/catalog/chair.png",
  is_custom: false,
  ownerId: "owner-private",
  projectOperationCapability: "save-project",
  ...overrides,
});

describe("plannerCatalogStore guest catalog boundary", () => {
  beforeEach(() => {
    listFurniture.mockReset();
    useCatalogStore.setState({
      items: [],
      loading: false,
      error: null,
      categories: ["all"],
      selectedItem: null,
    });
  });

  it("retains a minimized selection across catalog refreshes", async () => {
    const first = furniture();
    const refreshed = furniture({ name: "Task Chair Updated" });
    listFurniture.mockResolvedValueOnce([first]).mockResolvedValueOnce([refreshed]);

    await useCatalogStore.getState().refresh();
    useCatalogStore.getState().selectItem(first);
    await useCatalogStore.getState().refresh();

    const state = useCatalogStore.getState();
    expect(state.selectedItem).toEqual(toPublicPlannerFurniture(refreshed));
    expect(state.selectedItem).not.toHaveProperty("ownerId");
    expect(state.selectedItem).not.toHaveProperty("projectOperationCapability");
  });

  it("preserves guest planning context when refresh fails", async () => {
    const selected = furniture();
    useCatalogStore.getState().selectItem(selected);
    listFurniture.mockRejectedValueOnce(new Error("catalog offline"));

    await useCatalogStore.getState().refresh();

    expect(useCatalogStore.getState().selectedItem).toEqual(
      toPublicPlannerFurniture(selected),
    );
    expect(useCatalogStore.getState().error).toBe("catalog offline");
  });

  it("minimizes uploaded additions before storing or selecting them", () => {
    const uploaded = furniture({ id: "custom-1", is_custom: true });

    useCatalogStore.getState().addItem(uploaded);
    useCatalogStore.getState().selectItem(uploaded);

    const state = useCatalogStore.getState();
    expect(state.items[0]).toEqual(toPublicPlannerFurniture(uploaded));
    expect(state.items[0]).not.toHaveProperty("ownerId");
    expect(state.selectedItem).not.toHaveProperty("projectOperationCapability");
  });
});
