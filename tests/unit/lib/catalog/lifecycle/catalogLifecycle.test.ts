// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  readLifecycleManifest,
  setCatalogLifecycle,
  isBuyerVisibleSlugInDir,
} from "@/lib/catalog/lifecycle/catalogLifecycle";

describe("catalogLifecycle", () => {
  let dir: string;
  beforeEach(() => {
    vi.stubEnv("DEV_AUTH_BYPASS", "1");
    vi.stubEnv("NODE_ENV", "test");
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "life-"));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("defaults missing slug as buyer-visible (legacy)", () => {
    expect(isBuyerVisibleSlugInDir(dir, "missing")).toBe(true);
  });

  it("set live then retire", () => {
    setCatalogLifecycle(dir, "desk-a", "live");
    expect(readLifecycleManifest(dir)["desk-a"]?.state).toBe("live");
    expect(isBuyerVisibleSlugInDir(dir, "desk-a")).toBe(true);
    setCatalogLifecycle(dir, "desk-a", "retired");
    expect(isBuyerVisibleSlugInDir(dir, "desk-a")).toBe(false);
  });
});
