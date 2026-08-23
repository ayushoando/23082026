/**
 * @vitest-environment node
 */

import { describe, expect, it, vi } from "vitest";

const existsSync = vi.hoisted(() => vi.fn());
const readFileSync = vi.hoisted(() => vi.fn());
const statSync = vi.hoisted(() => vi.fn());

vi.mock("node:fs", () => ({
  default: { existsSync, readFileSync, statSync },
  existsSync,
  readFileSync,
  statSync,
}));

vi.mock("@/lib/paths/sitePackageRoot", () => ({
  resolveSvgCatalogDir: () => "/tmp/svg-catalog",
}));

import {
  readSvgArtifactStatus,
  readSvgArtifactStatuses,
  sanitizeCatalogSvgMarkup,
} from "@/lib/catalog/publish/svgArtifactStatus.server";

describe("sanitizeCatalogSvgMarkup", () => {
  it("accepts a plain svg", () => {
    expect(sanitizeCatalogSvgMarkup("<svg></svg>")).toBe("<svg></svg>");
  });

  it("rejects script, handlers, and javascript urls", () => {
    expect(sanitizeCatalogSvgMarkup("<div></div>")).toBeNull();
    expect(sanitizeCatalogSvgMarkup("<svg><script></script></svg>")).toBeNull();
    expect(sanitizeCatalogSvgMarkup('<svg onclick="x"></svg>')).toBeNull();
    expect(sanitizeCatalogSvgMarkup('<svg><a href="javascript:alert(1)"></a></svg>')).toBeNull();
  });
});

describe("readSvgArtifactStatus", () => {
  it("reports missing", () => {
    existsSync.mockReturnValue(false);
    expect(readSvgArtifactStatus("desk")).toMatchObject({
      state: "missing",
      bytes: 0,
      publicUrl: null,
    });
  });

  it("reports invalid when markup fails the gate", () => {
    existsSync.mockReturnValue(true);
    statSync.mockReturnValue({ size: 12, mtimeMs: 1 });
    readFileSync.mockReturnValue("<svg><script></script></svg>");
    expect(readSvgArtifactStatus("desk")).toMatchObject({
      state: "invalid",
      publicUrl: "/svg-catalog/desk.svg",
      markup: null,
    });
  });

  it("reports published for clean svg", () => {
    existsSync.mockReturnValue(true);
    statSync.mockReturnValue({ size: 11, mtimeMs: 2 });
    readFileSync.mockReturnValue("<svg></svg>");
    const status = readSvgArtifactStatus("desk");
    expect(status.state).toBe("published");
    expect(status.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(readSvgArtifactStatuses(["desk"]).desk?.state).toBe("published");
  });
});
