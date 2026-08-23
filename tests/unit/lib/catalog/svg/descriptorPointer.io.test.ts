import { beforeEach, describe, expect, it, vi } from "vitest";

const { existsSync, readFileSync, writeFileSync, renameSync } = vi.hoisted(() => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  renameSync: vi.fn(),
}));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    existsSync,
    readFileSync,
    writeFileSync,
    renameSync,
    default: {
      ...actual,
      existsSync,
      readFileSync,
      writeFileSync,
      renameSync,
    },
  };
});

import {
  buildPointer,
  readLatestPointer,
  resolveCurrentVersion,
  resolveDescriptorReadPath,
  writeLatestPointer,
} from "@/lib/catalog/svg/descriptorPointer";
import { BLOCK_DESCRIPTOR_SCHEMA_VERSION } from "@/lib/catalog/svg/svgTypes";

const DIR = "/tmp/descriptors";

describe("descriptorPointer io", () => {
  beforeEach(() => {
    vi.stubEnv("DEV_AUTH_BYPASS", "1");
    vi.stubEnv("NODE_ENV", "test");
    vi.clearAllMocks();
  });

  describe("readLatestPointer", () => {
    it("returns null when the pointer file is missing", () => {
      existsSync.mockReturnValue(false);
      expect(readLatestPointer("mesh-chair", DIR)).toBeNull();
      expect(readFileSync).not.toHaveBeenCalled();
    });

    it("returns null for invalid JSON", () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue("{not-json");
      expect(readLatestPointer("mesh-chair", DIR)).toBeNull();
    });

    it("returns null when the payload is not an object", () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue("null");
      expect(readLatestPointer("mesh-chair", DIR)).toBeNull();
      readFileSync.mockReturnValue("5");
      expect(readLatestPointer("mesh-chair", DIR)).toBeNull();
    });

    it("returns null when required fields are missing or mistyped", () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(
        JSON.stringify({ slug: "mesh-chair", n: "2", checksum: "abc", schemaVersion: "v" }),
      );
      expect(readLatestPointer("mesh-chair", DIR)).toBeNull();
    });

    it("returns null when the slug does not match or n is below 1", () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(
        JSON.stringify({
          slug: "other-chair",
          n: 2,
          checksum: "abc",
          schemaVersion: BLOCK_DESCRIPTOR_SCHEMA_VERSION,
        }),
      );
      expect(readLatestPointer("mesh-chair", DIR)).toBeNull();

      readFileSync.mockReturnValue(
        JSON.stringify({
          slug: "mesh-chair",
          n: 0,
          checksum: "abc",
          schemaVersion: BLOCK_DESCRIPTOR_SCHEMA_VERSION,
        }),
      );
      expect(readLatestPointer("mesh-chair", DIR)).toBeNull();
    });

    it("returns a valid pointer", () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(
        JSON.stringify({
          slug: "mesh-chair",
          n: 3,
          checksum: "deadbeef",
          schemaVersion: BLOCK_DESCRIPTOR_SCHEMA_VERSION,
        }),
      );
      expect(readLatestPointer("mesh-chair", DIR)).toEqual({
        slug: "mesh-chair",
        n: 3,
        checksum: "deadbeef",
        schemaVersion: BLOCK_DESCRIPTOR_SCHEMA_VERSION,
      });
    });
  });

  describe("writeLatestPointer", () => {
    it("writes atomically then renames onto the latest path", () => {
      const pointer = buildPointer("mesh-chair", 4, "abc123");
      writeLatestPointer(pointer, DIR);

      expect(writeFileSync).toHaveBeenCalledTimes(1);
      const [tempPath, body, flags] = writeFileSync.mock.calls[0] as [
        string,
        string,
        { encoding: string; flag: string },
      ];
      expect(String(tempPath)).toMatch(/mesh-chair\.latest\.tmp-/);
      expect(body).toBe(`${JSON.stringify(pointer)}\n`);
      expect(flags).toEqual({ encoding: "utf8", flag: "wx" });

      expect(renameSync).toHaveBeenCalledTimes(1);
      const [from, to] = renameSync.mock.calls[0] as [string, string];
      expect(from).toBe(tempPath);
      expect(String(to)).toMatch(/mesh-chair\.latest\.json$/);
    });
  });

  describe("resolveCurrentVersion", () => {
    it("returns the pointer version when a valid pointer exists", () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(
        JSON.stringify({
          slug: "mesh-chair",
          n: 7,
          checksum: "ff",
          schemaVersion: BLOCK_DESCRIPTOR_SCHEMA_VERSION,
        }),
      );
      expect(resolveCurrentVersion("mesh-chair", DIR)).toBe(7);
    });

    it("returns 1 when only a legacy descriptor exists", () => {
      existsSync.mockImplementation((target: unknown) => String(target).endsWith("mesh-chair.json"));
      expect(resolveCurrentVersion("mesh-chair", DIR)).toBe(1);
    });

    it("returns 0 when neither pointer nor legacy exists", () => {
      existsSync.mockReturnValue(false);
      expect(resolveCurrentVersion("mesh-chair", DIR)).toBe(0);
    });
  });

  describe("resolveDescriptorReadPath", () => {
    it("prefers the versioned file named by the pointer", () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(
        JSON.stringify({
          slug: "mesh-chair",
          n: 2,
          checksum: "aa",
          schemaVersion: BLOCK_DESCRIPTOR_SCHEMA_VERSION,
        }),
      );
      const resolved = resolveDescriptorReadPath("mesh-chair", DIR);
      expect(resolved).toMatch(/mesh-chair\.2\.json$/);
    });

    it("falls back to the legacy file when the versioned path is missing", () => {
      readFileSync.mockReturnValue(
        JSON.stringify({
          slug: "mesh-chair",
          n: 2,
          checksum: "aa",
          schemaVersion: BLOCK_DESCRIPTOR_SCHEMA_VERSION,
        }),
      );
      existsSync.mockImplementation((target: unknown) => {
        const value = String(target);
        return value.endsWith("mesh-chair.latest.json") || value.endsWith("mesh-chair.json");
      });
      const resolved = resolveDescriptorReadPath("mesh-chair", DIR);
      expect(resolved).toMatch(/mesh-chair\.json$/);
      expect(resolved).not.toMatch(/mesh-chair\.2\.json$/);
    });

    it("returns null when no versioned or legacy file exists", () => {
      existsSync.mockReturnValue(false);
      expect(resolveDescriptorReadPath("mesh-chair", DIR)).toBeNull();
    });
  });

  describe("buildPointer", () => {
    it("pins the schema version", () => {
      expect(buildPointer("mesh-chair", 1, "sum")).toEqual({
        slug: "mesh-chair",
        n: 1,
        checksum: "sum",
        schemaVersion: BLOCK_DESCRIPTOR_SCHEMA_VERSION,
      });
    });
  });
});
