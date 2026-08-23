import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  API_CATALOG_CONTENT_TYPE,
  API_CATALOG_ENTRIES,
  DISK_API_ROUTES,
  apiCatalogLinkHeader,
  buildApiCatalogLinkset,
  buildPublicApiDocsMarkdown,
  buildPublicOpenApiDocument,
} from "@/lib/apiCatalog";

function walkApiRouteFiles(): Array<{ path: string; methods: string[] }> {
  const root = join(process.cwd(), "app", "api");
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(p);
      } else if (ent.name === "route.ts") {
        files.push(p);
      }
    }
  };
  walk(root);
  const methodsRe =
    /export\s+(?:async\s+function|const)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)/g;
  return files
    .map((file) => {
      let rel = relative(root, file).replaceAll("\\", "/");
      if (rel.endsWith("/route.ts")) {
        rel = rel.slice(0, -"/route.ts".length);
      } else if (rel === "route.ts") {
        rel = "";
      }
      const path = rel
        ? `/api/${rel
            .split("/")
            .map((seg) => {
              if (seg.startsWith("[...") && seg.endsWith("]")) {
                return `{${seg.slice(4, -1)}}`;
              }
              if (seg.startsWith("[") && seg.endsWith("]")) {
                return `{${seg.slice(1, -1)}}`;
              }
              return seg;
            })
            .join("/")}`
        : "/api";
      const methods = [
        ...new Set(
          [...readFileSync(file, "utf8").matchAll(methodsRe)].map((m) =>
            m[1].toLowerCase(),
          ),
        ),
      ];
      return { path, methods };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

describe("apiCatalog", () => {
  const origin = "https://oando.co.in";

  it("builds an RFC 9727 linkset for every app API route", () => {
    const catalog = buildApiCatalogLinkset(origin);
    expect(catalog.linkset).toHaveLength(API_CATALOG_ENTRIES.length);
    expect(API_CATALOG_ENTRIES.length).toBeGreaterThan(50);
    for (const [index, entry] of API_CATALOG_ENTRIES.entries()) {
      const item = catalog.linkset[index];
      expect(item.anchor).toBe(`${origin}${entry.path}`);
      expect(item["service-desc"][0]?.href).toBe(`${origin}/openapi.json`);
      expect(item["service-doc"][0]?.href).toBe(`${origin}/api-docs`);
      expect(item.status[0]?.href).toBe(`${origin}/api/health`);
    }
    expect(API_CATALOG_CONTENT_TYPE).toContain("application/linkset+json");
    expect(apiCatalogLinkHeader(origin)).toBe(
      `<${origin}/.well-known/api-catalog>; rel="api-catalog"`,
    );
  });

  it("includes admin, Planner, Studio, tracking, and file APIs", () => {
    const hrefs = JSON.stringify(buildApiCatalogLinkset(origin));
    expect(hrefs).toContain("/api/admin/plans");
    expect(hrefs).toContain("/api/Planner/projects");
    expect(hrefs).toContain("/api/Studio/furniture");
    expect(hrefs).toContain("/api/tracking");
    expect(hrefs).toContain("/api/files/catalog/{path}");
  });

  it("matches every on-disk site/app/api route.ts exactly", () => {
    const disk = walkApiRouteFiles();
    const listed = DISK_API_ROUTES.map((entry) => ({
      path: entry.path,
      methods: [...entry.methods],
    })).sort((a, b) => a.path.localeCompare(b.path));
    expect(listed.map((row) => row.path)).toEqual(disk.map((row) => row.path));
    for (const row of disk) {
      const listedRow = listed.find((item) => item.path === row.path);
      expect(listedRow?.methods.sort()).toEqual(row.methods.sort());
    }
  });

  it("lists the same paths in OpenAPI and docs", () => {
    const spec = buildPublicOpenApiDocument(origin);
    const docs = buildPublicApiDocsMarkdown(origin);
    const paths = spec.paths as Record<string, unknown>;
    expect(Object.keys(paths)).toHaveLength(API_CATALOG_ENTRIES.length);
    for (const entry of API_CATALOG_ENTRIES) {
      expect(paths[entry.path]).toBeTruthy();
      expect(docs).toContain(entry.path);
      const operations = paths[entry.path] as Record<string, unknown>;
      for (const method of entry.methods) {
        expect(operations[method]).toBeTruthy();
      }
    }
  });
});
