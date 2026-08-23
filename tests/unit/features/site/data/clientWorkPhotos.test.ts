import { beforeEach, describe, expect, it, vi } from "vitest";

const { readdir, listR2ObjectKeys } = vi.hoisted(() => ({
  readdir: vi.fn(),
  listR2ObjectKeys: vi.fn(async () => [] as string[]),
}));

vi.mock("node:fs/promises", () => ({
  default: { readdir },
  readdir,
}));

vi.mock("@/lib/storage/r2Catalog", () => ({
  listR2ObjectKeys,
}));

import {
  buildClientWorkWithPhotos,
  getClientWorkPhotos,
  projectFolderCandidates,
} from "@/features/site/data/clientWorkPhotos";

function normalizeDir(dir: unknown): string {
  return String(dir).replace(/\\/g, "/");
}

function mockReaddirByPath(handler: (normalized: string) => string[] | "missing"): void {
  readdir.mockImplementation(async (dir: unknown) => {
    const result = handler(normalizeDir(dir));
    if (result === "missing") {
      throw new Error("missing");
    }
    return result;
  });
}

function photoFileName(url: string): string {
  const decoded = decodeURI(url);
  return decoded.slice(decoded.lastIndexOf("/") + 1);
}

describe("clientWorkPhotos", () => {
  beforeEach(() => {
    readdir.mockReset();
    listR2ObjectKeys.mockReset();
    listR2ObjectKeys.mockResolvedValue([]);
  });

  it("lists client and legacy project folders", () => {
    const paths = projectFolderCandidates("DMRC");
    expect(paths).toHaveLength(6);
    expect(paths.some((p) => p.includes("marketing") && p.includes("clients"))).toBe(true);
    expect(paths.some((p) => p.includes("projects"))).toBe(true);
    expect(paths.every((p) => p.endsWith("DMRC") || p.replace(/\\/g, "/").endsWith("DMRC"))).toBe(
      true,
    );
  });

  it("returns ranked web paths from the first folder with photos", async () => {
    mockReaddirByPath((dir) => {
      if (dir.includes("/marketing/clients/")) {
        return ["hero.webp", "office-1.webp", "notes.txt", "dmrc-facility.webp"];
      }
      return "missing";
    });
    const photos = await getClientWorkPhotos("DMRC");
    expect(photos.some((p) => p.includes("office-1"))).toBe(true);
    expect(photos.some((p) => p.includes("dmrc-facility"))).toBe(false);
    expect(photos[0]).toMatch(/office-1/);
    expect(readdir).toHaveBeenCalled();
  });

  it("ranks folder-specific hero, gallery, office/workspace, dsc, then leftover stills", async () => {
    const folder = "__rank_sort_fixture__";
    mockReaddirByPath((dir) => {
      if (dir.includes(`/marketing/clients/${folder}`)) {
        return [
          "zebra.webp",
          "DSC_0002.jpg",
          "office-hero.webp",
          "gallery-2.webp",
          "workspace-1.webp",
          "office-1.webp",
          "DSC_0001.jpg",
          "hero.webp",
          "edit this.webp",
          "ai-editor.png",
          "notes.txt",
        ];
      }
      return "missing";
    });

    const photos = await getClientWorkPhotos(folder);
    expect(photos.map(photoFileName)).toEqual([
      "office-hero.webp",
      "gallery-2.webp",
      "office-1.webp",
      "workspace-1.webp",
      "DSC_0001.jpg",
      "DSC_0002.jpg",
      "zebra.webp",
    ]);
    expect(photos.every((url) => url.includes(`/assets/marketing/clients/${folder}/`))).toBe(
      true,
    );
  });

  it("uses the legacy projects URL when only a projects folder has photos", async () => {
    const folder = "__projects_legacy_fixture__";
    mockReaddirByPath((dir) => {
      if (dir.includes("/marketing/projects/")) {
        return ["gallery-shot.webp"];
      }
      return "missing";
    });

    const photos = await getClientWorkPhotos(folder);
    expect(photos).toHaveLength(1);
    expect(photos[0]).toContain("/assets/marketing/projects/");
    expect(photoFileName(photos[0])).toBe("gallery-shot.webp");
  });

  it("skips an empty candidate and reads the next folder that has photos", async () => {
    const folder = "__empty_then_photos__";
    let clientReads = 0;
    mockReaddirByPath((dir) => {
      if (dir.includes("/marketing/clients/")) {
        clientReads += 1;
        return clientReads === 1 ? [] : ["gallery-1.webp"];
      }
      return "missing";
    });

    const photos = await getClientWorkPhotos(folder);
    expect(photos.map(photoFileName)).toEqual(["gallery-1.webp"]);
    expect(clientReads).toBeGreaterThan(1);
  });

  it("prefers R2 object keys over disk", async () => {
    listR2ObjectKeys.mockResolvedValue([
      "marketing/clients/DMRC/dmrc-office-01.webp",
      "marketing/clients/DMRC/hero.webp",
    ]);
    mockReaddirByPath(() => ["office-disk.webp"]);
    const photos = await getClientWorkPhotos("DMRC");
    expect(photos[0]).toBe("/assets/marketing/clients/DMRC/dmrc-office-01.webp");
    expect(photos.some((p) => p.includes("hero.webp"))).toBe(false);
    expect(photos.some((p) => p.includes("office-disk"))).toBe(false);
    expect(listR2ObjectKeys).toHaveBeenCalled();
  });

  it("drops items with no photos and keeps items that resolve at least one still", async () => {
    mockReaddirByPath((dir) => {
      if (dir.includes("/marketing/clients/Usha")) {
        return ["office-floor.webp"];
      }
      return "missing";
    });
    const rows = await buildClientWorkWithPhotos([
      { folder: "empty", name: "Empty" },
      { folder: "Usha", name: "Usha" },
    ]);
    expect(rows).toEqual([
      {
        folder: "Usha",
        name: "Usha",
        photos: expect.arrayContaining([expect.stringContaining("office-floor")]),
      },
    ]);
  });
});
