import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const maybeSingle = vi.fn();
const selectAfterDelete = vi.fn();
const upsert = vi.fn();
const orderName = vi.fn();
const orderCustom = vi.fn();
const eq = vi.fn();
const select = vi.fn();
const from = vi.fn();

vi.mock("@/platform/supabase/auth-admin", () => ({
  createSupabaseAuthAdminClient: () => ({ from }),
}));

vi.mock("@/features/shared/catalog/catalogAssetStorage.server", () => ({
  furnitureLibraryAssetPath: (id: string, name: string) => `${id}/${name}`,
  uploadCatalogAssetBinary: vi.fn(async () => ({
    ok: true,
    publicUrl: "https://cdn.example/desk.png",
  })),
}));

import {
  deleteFurnitureFromSupabase,
  listFurnitureFromSupabase,
  loadFurnitureFromSupabase,
  writeFurnitureToSupabase,
} from "@/lib/catalog/furnitureCatalogStore.supabase";

function row() {
  return {
    id: "desk-1",
    name: "Desk",
    category: "desks",
    subcategory: null,
    tags: ["wood"],
    dimensions: { width_mm: 1200 },
    notes: null,
    is_custom: false,
    thumbnail_url: null,
    top_png_url: null,
    top_svg_url: null,
    front_png_url: null,
    side_png_url: null,
    top_png_checksum: null,
    top_fabric_json: null,
    front_fabric_json: null,
    side_fabric_json: null,
    created_by: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

beforeEach(() => {
  from.mockReturnValue({
    select,
    upsert,
    delete: () => ({ eq: () => ({ select: selectAfterDelete }) }),
  });
  select.mockReturnValue({ order: orderCustom, eq });
  orderCustom.mockReturnValue({ order: orderName });
  orderName.mockResolvedValue({ data: [row()], error: null });
  eq.mockReturnValue({ maybeSingle });
  maybeSingle.mockResolvedValue({ data: row(), error: null });
  upsert.mockResolvedValue({ error: null });
  selectAfterDelete.mockResolvedValue({ data: [{ id: "desk-1" }], error: null });
});

describe("furnitureCatalogStore.supabase (mocked)", () => {
  it("lists and maps rows", async () => {
    const items = await listFurnitureFromSupabase();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: "desk-1", tags: ["wood"] });
  });

  it("loads one item or null", async () => {
    await expect(loadFurnitureFromSupabase("desk-1")).resolves.toMatchObject({
      name: "Desk",
    });
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(loadFurnitureFromSupabase("missing")).resolves.toBeNull();
  });

  it("upserts and deletes", async () => {
    await writeFurnitureToSupabase({ id: "desk-1", name: "Desk", category: "desks" });
    expect(upsert).toHaveBeenCalled();
    await expect(deleteFurnitureFromSupabase("desk-1")).resolves.toBe(true);
  });

  it("throws when list fails", async () => {
    orderName.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    await expect(listFurnitureFromSupabase()).rejects.toThrow(/list failed/);
  });
});
