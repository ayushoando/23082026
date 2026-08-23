// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { uploadCatalogAssetBinary } = vi.hoisted(() => ({
  uploadCatalogAssetBinary: vi.fn(),
}));

vi.mock("@/platform/supabase/auth-admin", () => ({
  createSupabaseAuthAdminClient: () => ({ from: vi.fn() }),
}));

vi.mock("@/features/shared/catalog/catalogAssetStorage.server", () => ({
  furnitureLibraryAssetPath: (id: string, name: string) => `${id}/${name}`,
  uploadCatalogAssetBinary,
}));

import {
  persistFurnitureAssetsToSupabase,
  persistFurnitureUploadToSupabase,
  uploadFurnitureAsset,
} from "@/lib/catalog/furnitureCatalogStore.supabase";

const PNG_1PX_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const PNG_1PX_DATA = `data:image/png;base64,${PNG_1PX_B64}`;

beforeEach(() => {
  uploadCatalogAssetBinary.mockReset();
  uploadCatalogAssetBinary.mockImplementation(
    async (args: { path: string }) => ({
      ok: true as const,
      path: args.path,
      publicUrl: `https://cdn.example/${args.path}`,
    }),
  );
});

describe("uploadFurnitureAsset", () => {
  it("returns the public URL on success", async () => {
    await expect(
      uploadFurnitureAsset({
        itemId: "desk-1",
        filename: "top.png",
        body: Buffer.from("png"),
        contentType: "image/png",
      }),
    ).resolves.toBe("https://cdn.example/desk-1/top.png");
    expect(uploadCatalogAssetBinary).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "desk-1/top.png",
        contentType: "image/png",
        upsert: true,
      }),
    );
  });

  it("throws when the bucket write fails", async () => {
    uploadCatalogAssetBinary.mockResolvedValueOnce({
      ok: false,
      reason: "bucket missing",
    });
    await expect(
      uploadFurnitureAsset({
        itemId: "desk-1",
        filename: "top.png",
        body: Buffer.from("png"),
        contentType: "image/png",
      }),
    ).rejects.toThrow(/furniture asset upload failed \(desk-1\/top.png\): bucket missing/);
  });
});

describe("persistFurnitureAssetsToSupabase", () => {
  it("skips empty and non-string payload keys", async () => {
    const urls = await persistFurnitureAssetsToSupabase("desk-1", {
      top_png: "",
      front_png: 12,
      side_png: null,
    });
    expect(urls).toEqual({});
    expect(uploadCatalogAssetBinary).not.toHaveBeenCalled();
  });

  it("uploads mapped assets and a thumbnail for top_png", async () => {
    const urls = await persistFurnitureAssetsToSupabase("desk-1", {
      top_png: PNG_1PX_DATA,
      front_png: PNG_1PX_DATA,
      side_png: PNG_1PX_DATA,
      top_svg: "data:image/svg+xml,%3Csvg%3E%3C%2Fsvg%3E",
    });
    expect(urls).toEqual({
      top_png_url: "https://cdn.example/desk-1/top.png",
      thumbnail_url: "https://cdn.example/desk-1/thumb.png",
      front_png_url: "https://cdn.example/desk-1/front.png",
      side_png_url: "https://cdn.example/desk-1/side.png",
      top_svg_url: "https://cdn.example/desk-1/top.svg",
    });
    const paths = uploadCatalogAssetBinary.mock.calls.map(
      (call) => (call[0] as { path: string }).path,
    );
    expect(paths).toEqual([
      "desk-1/top.png",
      "desk-1/thumb.png",
      "desk-1/front.png",
      "desk-1/side.png",
      "desk-1/top.svg",
    ]);
  });

  it("rejects a payload that is not a data: URL", async () => {
    await expect(
      persistFurnitureAssetsToSupabase("desk-1", {
        top_png: "https://cdn.example/top.png",
      }),
    ).rejects.toThrow(/Expected a data: URL/);
  });

  it("decodes a non-base64 data URL", async () => {
    await persistFurnitureAssetsToSupabase("desk-1", {
      top_svg: "data:image/svg+xml,hello%20world",
    });
    const first = uploadCatalogAssetBinary.mock.calls[0]?.[0] as {
      body: Buffer;
      contentType: string;
    };
    expect(first.contentType).toBe("image/svg+xml");
    expect(first.body.toString("utf8")).toBe("hello world");
  });
});

describe("persistFurnitureUploadToSupabase", () => {
  it("stores an SVG as the top view and reuses it as the thumbnail", async () => {
    const urls = await persistFurnitureUploadToSupabase({
      itemId: "desk-1",
      bytes: Buffer.from("<svg/>"),
      isSvg: true,
    });
    expect(urls).toEqual({
      top_svg_url: "https://cdn.example/desk-1/top.svg",
      thumbnail_url: "https://cdn.example/desk-1/top.svg",
    });
    expect(uploadCatalogAssetBinary).toHaveBeenCalledTimes(1);
  });

  it("stores a PNG and uploads a thumbnail (falls back when sharp cannot read it)", async () => {
    const urls = await persistFurnitureUploadToSupabase({
      itemId: "desk-1",
      bytes: Buffer.from("not-a-png"),
      isSvg: false,
    });
    expect(urls).toEqual({
      top_png_url: "https://cdn.example/desk-1/top.png",
      thumbnail_url: "https://cdn.example/desk-1/thumb.png",
    });
    const thumb = uploadCatalogAssetBinary.mock.calls[1]?.[0] as {
      body: Buffer;
      path: string;
    };
    expect(thumb.path).toBe("desk-1/thumb.png");
    expect(thumb.body.toString("utf8")).toBe("not-a-png");
  });

  it("thumbnails a real PNG through sharp when available", async () => {
    const urls = await persistFurnitureUploadToSupabase({
      itemId: "desk-1",
      bytes: Buffer.from(PNG_1PX_B64, "base64"),
      isSvg: false,
    });
    expect(urls.top_png_url).toBe("https://cdn.example/desk-1/top.png");
    expect(urls.thumbnail_url).toBe("https://cdn.example/desk-1/thumb.png");
    expect(uploadCatalogAssetBinary).toHaveBeenCalledTimes(2);
  });
});
