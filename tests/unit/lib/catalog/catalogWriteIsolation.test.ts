import { describe, it, expect } from "vitest";
import {
  assertCatalogWriteAllowed,
  CatalogIsolationError,
} from "@/lib/catalog/catalogWriteIsolation";

describe("catalogWriteIsolation", () => {
  it("allows path under root", () => {
    expect(() =>
      assertCatalogWriteAllowed("/tmp/catalog/foo.json", {
        allowedRoots: ["/tmp/catalog"],
      }),
    ).not.toThrow();
  });

  it("blocks path outside root", () => {
    expect(() =>
      assertCatalogWriteAllowed("/etc/passwd", {
        allowedRoots: ["/tmp/catalog"],
      }),
    ).toThrow(CatalogIsolationError);
  });

  it("rejects an empty target path", () => {
    expect(() =>
      assertCatalogWriteAllowed("", { allowedRoots: ["/tmp/catalog"] }),
    ).toThrow(/Empty catalog write path/);
  });

  it("treats a bare slash as an empty normalized path", () => {
    expect(() =>
      assertCatalogWriteAllowed("/", { allowedRoots: ["/tmp/catalog"] }),
    ).toThrow(/Empty catalog write path/);
  });

  it("normalizes backslashes and trailing slashes before matching", () => {
    expect(() =>
      assertCatalogWriteAllowed("C:\\Catalog\\Sub\\", {
        allowedRoots: ["c:/catalog"],
      }),
    ).not.toThrow();
  });
});
