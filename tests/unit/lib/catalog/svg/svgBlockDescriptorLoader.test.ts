import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadBySlug,
  tryLoad,
} from "@/lib/catalog/svg/svgBlockDescriptorLoader";

describe("svgBlockDescriptorLoader", () => {
  const emptyDir = path.join(os.tmpdir(), "oando-empty-descriptors");

  it("rejects a non-kebab slug", () => {
    const result = tryLoad("Not A Slug");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid");
      expect(result.error.code).toBe("422.invalid");
    }
  });

  it("returns notFound when the file is missing", () => {
    const result = tryLoad("missing-block", { dir: emptyDir });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("notFound");
    }
  });

  it("loadBySlug throws with an http-shaped message", () => {
    expect(() => loadBySlug("nope")).toThrow(/404/);
  });
});
