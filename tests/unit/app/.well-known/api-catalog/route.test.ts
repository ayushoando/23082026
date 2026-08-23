import { describe, expect, it } from "vitest";
import { GET, HEAD } from "@/app/.well-known/api-catalog/route";
import { GET as getOpenApi } from "@/app/openapi.json/route";
import { GET as getApiDocs } from "@/app/api-docs/route";
import { API_CATALOG_CONTENT_TYPE } from "@/lib/apiCatalog";

describe("api catalog routes", () => {
  it("serves /.well-known/api-catalog as linkset+json with Link header", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe(API_CATALOG_CONTENT_TYPE);
    expect(res.headers.get("Link")).toContain('rel="api-catalog"');
    const body = (await res.json()) as { linkset: unknown[] };
    expect(Array.isArray(body.linkset)).toBe(true);
    expect(body.linkset.length).toBeGreaterThan(0);
  });

  it("answers HEAD on the catalog", () => {
    const res = HEAD();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe(API_CATALOG_CONTENT_TYPE);
    expect(res.headers.get("Link")).toContain('rel="api-catalog"');
  });

  it("serves OpenAPI and human docs", async () => {
    const specRes = getOpenApi();
    expect(specRes.status).toBe(200);
    const spec = (await specRes.json()) as { openapi?: string };
    expect(spec.openapi).toBe("3.1.0");

    const docsRes = getApiDocs();
    expect(docsRes.status).toBe(200);
    expect(docsRes.headers.get("Content-Type")).toContain("text/markdown");
    const markdown = await docsRes.text();
    expect(markdown).toContain("/api/health");
  });
});
