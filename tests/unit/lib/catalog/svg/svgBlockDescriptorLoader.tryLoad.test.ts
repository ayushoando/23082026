// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearLoaderCache,
  loadAll,
  loadBySlug,
  tryLoad,
} from "@/lib/catalog/svg/svgBlockDescriptorLoader";
import {
  BLOCK_DESCRIPTOR_SCHEMA_VERSION,
  freezeFreshDescriptor,
  type BlockDescriptor,
} from "@/lib/catalog/svg/svgTypes";

const UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee01";

function makeDescriptor(slug: string): BlockDescriptor {
  const result = freezeFreshDescriptor(
    {
      schemaVersion: BLOCK_DESCRIPTOR_SCHEMA_VERSION,
      id: UUID,
      slug,
      sku: "LOADER-1",
      sourceProvenance: "native",
      createdBy: "loader-tryload-test",
      geometry: { widthMm: 800, depthMm: 400, heightMm: 720 },
      viewBox: { x: 0, y: 0, width: 800, height: 400 },
      mounting: ["floor"],
      themeTokens: { currentColor: "currentColor" },
      rovingFocus: [],
      liveAnnouncementCategories: ["status"],
      variant: "fixed",
      fixed: { sizingType: "fixed" },
      generatedAt: 1_752_000_200,
    },
    () => 1_752_000_200,
  );
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.value;
}

function writeJson(dir: string, filename: string, value: unknown): void {
  fs.writeFileSync(path.join(dir, filename), `${JSON.stringify(value)}\n`, "utf8");
}

describe("svgBlockDescriptorLoader tryLoad / loadAll", () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "oando-loader-"));
    clearLoaderCache();
  });

  afterEach(() => {
    clearLoaderCache();
    fs.rmSync(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("loads a valid legacy descriptor from a temp dir", () => {
    const descriptor = makeDescriptor("tiny-desk");
    writeJson(dir, "tiny-desk.json", descriptor);

    const result = tryLoad("tiny-desk", { dir });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.slug).toBe("tiny-desk");
      expect(result.value.checksum).toBe(descriptor.checksum);
    }
    expect(loadBySlug("tiny-desk", { dir }).slug).toBe("tiny-desk");
  });

  it("returns invalid when the file is malformed JSON", () => {
    fs.writeFileSync(path.join(dir, "bad-json.json"), "{not-json", "utf8");
    const result = tryLoad("bad-json", { dir });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid");
      expect(result.error.message).toMatch(/malformed JSON/);
      expect(result.error.fieldPath).toBe("slug:bad-json");
    }
  });

  it("surfaces parse errors from well-formed but invalid JSON", () => {
    writeJson(dir, "old-pin.json", {
      schemaVersion: "1999-01-01.v0",
      slug: "old-pin",
    });
    const result = tryLoad("old-pin", { dir });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("versionMismatch");
    }
  });

  it("rejects a path that exists but is not a regular file", () => {
    fs.mkdirSync(path.join(dir, "not-a-file.json"));
    const result = tryLoad("not-a-file", { dir });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid");
      expect(result.error.message).toMatch(/not a regular file/);
    }
  });

  it("rejects a non-string slug", () => {
    const result = tryLoad(12 as unknown as string, { dir });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid");
      expect(result.error.message).toMatch(/slug must be a string/);
    }
  });

  it("reports malformed JSON when parse throws a non-Error with a message", () => {
    writeJson(dir, "throw-shape.json", { schemaVersion: "x" });
    const spy = vi.spyOn(JSON, "parse").mockImplementation(() => {
      throw { message: "weird reject" };
    });
    const result = tryLoad("throw-shape", { dir });
    spy.mockRestore();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/weird reject/);
    }
  });

  it("loadAll returns [] for a missing dir and caches that miss", () => {
    const missing = path.join(dir, "no-such-dir");
    expect(loadAll({ dir: missing })).toEqual([]);
    fs.mkdirSync(missing);
    writeJson(missing, "late-desk.json", makeDescriptor("late-desk"));
    expect(loadAll({ dir: missing })).toEqual([]);
    expect(loadAll({ dir: missing, forceReload: true })).toHaveLength(1);
  });

  it("loadAll caches by dir until forceReload or clearLoaderCache", () => {
    writeJson(dir, "alpha-desk.json", makeDescriptor("alpha-desk"));
    expect(loadAll({ dir })).toHaveLength(1);

    writeJson(dir, "beta-desk.json", makeDescriptor("beta-desk"));
    expect(loadAll({ dir })).toHaveLength(1);

    expect(loadAll({ dir, forceReload: true }).map((d) => d.slug).sort()).toEqual(
      ["alpha-desk", "beta-desk"],
    );

    writeJson(dir, "gamma-desk.json", makeDescriptor("gamma-desk"));
    clearLoaderCache();
    expect(loadAll({ dir })).toHaveLength(3);
  });

  it("loadAll follows latest pointers, skips malformed files, and ignores version-only names", () => {
    const pointed = makeDescriptor("pointed-desk");
    writeJson(dir, "pointed-desk.1.json", pointed);
    writeJson(dir, "pointed-desk.latest.json", {
      slug: "pointed-desk",
      n: 1,
      checksum: pointed.checksum,
      schemaVersion: BLOCK_DESCRIPTOR_SCHEMA_VERSION,
    });
    writeJson(dir, "legacy-desk.json", makeDescriptor("legacy-desk"));
    fs.writeFileSync(path.join(dir, "broken-desk.json"), "{", "utf8");
    writeJson(dir, "orphan-desk.2.json", makeDescriptor("orphan-desk"));
    fs.writeFileSync(path.join(dir, "notes.txt"), "ignore", "utf8");

    const loaded = loadAll({ dir });
    const slugs = loaded.map((d) => d.slug).sort();
    expect(slugs).toEqual(["legacy-desk", "pointed-desk"]);
  });
});
