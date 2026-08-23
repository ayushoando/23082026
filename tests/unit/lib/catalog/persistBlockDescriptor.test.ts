import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import os from "node:os";
import path from "node:path";

const fsSpies = vi.hoisted(() => {
  const existsSync = vi.fn();
  const readFileSync = vi.fn();
  return {
    existsSync,
    readFileSync,
    actual: null as typeof import("node:fs") | null,
  };
});

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  fsSpies.actual = actual;
  fsSpies.existsSync.mockImplementation((target: Parameters<typeof actual.existsSync>[0]) =>
    actual.existsSync(target),
  );
  fsSpies.readFileSync.mockImplementation(
    ((target: Parameters<typeof actual.readFileSync>[0], options?: Parameters<typeof actual.readFileSync>[1]) =>
      actual.readFileSync(target, options)) as typeof actual.readFileSync,
  );
  return {
    ...actual,
    existsSync: fsSpies.existsSync,
    readFileSync: fsSpies.readFileSync,
    default: {
      ...actual,
      existsSync: fsSpies.existsSync,
      readFileSync: fsSpies.readFileSync,
    },
  };
});

import fs from "node:fs";
import { persistBlockDescriptor } from "@/lib/catalog/persistBlockDescriptor";
import { CatalogIsolationError } from "@/lib/catalog/catalogWriteIsolation";

describe("persistBlockDescriptor", () => {
  let dir: string;
  beforeEach(() => {
    vi.stubEnv("DEV_AUTH_BYPASS", "1");
    vi.stubEnv("NODE_ENV", "test");
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "desc-"));
  });
  afterEach(() => {
    const actual = fsSpies.actual;
    if (actual) {
      fsSpies.existsSync.mockImplementation((target: Parameters<typeof actual.existsSync>[0]) =>
        actual.existsSync(target),
      );
      fsSpies.readFileSync.mockImplementation(
        ((target: Parameters<typeof actual.readFileSync>[0], options?: Parameters<typeof actual.readFileSync>[1]) =>
          actual.readFileSync(target, options)) as typeof actual.readFileSync,
      );
    }
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("writes versioned json and latest pointer", async () => {
    const result = await persistBlockDescriptor({
      dir,
      slug: "test-desk",
      descriptor: { name: "Test Desk" },
      allowedRoots: [dir],
    });
    expect(result.version).toBe(1);
    expect(fs.existsSync(path.join(dir, "test-desk.1.json"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "test-desk.latest.json"))).toBe(true);
    const second = await persistBlockDescriptor({
      dir,
      slug: "test-desk",
      descriptor: { name: "Test Desk 2" },
      allowedRoots: [dir],
    });
    expect(second.version).toBe(2);
  });

  it("rejects an invalid slug", async () => {
    await expect(
      persistBlockDescriptor({
        dir,
        slug: "Nope!",
        descriptor: {},
        allowedRoots: [dir],
      }),
    ).rejects.toThrow(/Invalid descriptor slug/);
  });

  it("defaults allowedRoots to the resolved dir", async () => {
    const result = await persistBlockDescriptor({
      dir,
      slug: "plain-slug",
      descriptor: { name: "Plain" },
    });
    expect(result.version).toBe(1);
    expect(fs.existsSync(result.versionPath)).toBe(true);
  });

  it("blocks writes outside the allowed roots", async () => {
    await expect(
      persistBlockDescriptor({
        dir: path.join(os.tmpdir(), "not-allowed-desc"),
        slug: "test-desk",
        descriptor: {},
        allowedRoots: [dir],
      }),
    ).rejects.toBeInstanceOf(CatalogIsolationError);
  });

  it("starts at version 1 when existsSync reports the dir missing", async () => {
    const actual = fsSpies.actual;
    if (!actual) {
      throw new Error("node:fs mock did not capture the original module");
    }
    fsSpies.existsSync.mockImplementation((target: Parameters<typeof actual.existsSync>[0]) => {
      if (path.resolve(String(target)) === path.resolve(dir)) {
        return false;
      }
      return actual.existsSync(target);
    });

    const result = await persistBlockDescriptor({
      dir,
      slug: "fresh-block",
      descriptor: { name: "Fresh" },
      allowedRoots: [dir],
    });
    expect(result.version).toBe(1);
  });

  it("normalizes mixed-case slugs with surrounding whitespace", async () => {
    const result = await persistBlockDescriptor({
      dir,
      slug: "  Test-Desk  ",
      descriptor: { name: "Cased" },
      allowedRoots: [dir],
    });
    expect(result.version).toBe(1);
    expect(result.versionPath).toContain("test-desk.1.json");
    expect(fs.existsSync(path.join(dir, "test-desk.1.json"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "test-desk.latest.json"))).toBe(true);
  });

  it("throws when dual-read verification cannot see the slug", async () => {
    fsSpies.readFileSync.mockReturnValue('{"name":"stripped"}');

    await expect(
      persistBlockDescriptor({
        dir,
        slug: "verify-desk",
        descriptor: { name: "Verify" },
        allowedRoots: [dir],
      }),
    ).rejects.toThrow(/dual-read verification failed/);
  });
});
