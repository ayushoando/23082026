import { describe, expect, it } from "vitest";
import {
  apexRedirectLocation,
  cacheControlForPath,
  pathIsPrivate,
  requestHasSessionCookie,
  shouldCacheResponse,
} from "../../../workers/oando-worker-proxy/src/cachePolicy.js";

describe("www to apex", () => {
  it("308s www to the same path on oando.co.in", () => {
    expect(apexRedirectLocation("https://www.oando.co.in/products/tables/")).toBe(
      "https://oando.co.in/products/tables/",
    );
    expect(apexRedirectLocation("https://oando.co.in/products/tables/")).toBeNull();
  });
});

describe("worker cache policy", () => {
  it("skips private prefixes", () => {
    expect(pathIsPrivate("/api/products/")).toBe(true);
    expect(pathIsPrivate("/admin")).toBe(true);
    expect(pathIsPrivate("/ooplanner/projects/")).toBe(true);
    expect(pathIsPrivate("/")).toBe(false);
    expect(pathIsPrivate("/products/tables/crest/")).toBe(false);
  });

  it("detects supabase session cookies", () => {
    expect(requestHasSessionCookie("sb-abc-auth-token=x")).toBe(true);
    expect(requestHasSessionCookie("theme=light")).toBe(false);
  });

  it("caches public GET 200s without session or Set-Cookie", () => {
    expect(
      shouldCacheResponse({
        method: "GET",
        pathname: "/",
        cookieHeader: "",
        status: 200,
        setCookie: false,
      }),
    ).toBe(true);
    expect(
      shouldCacheResponse({
        method: "POST",
        pathname: "/",
        cookieHeader: "",
        status: 200,
        setCookie: false,
      }),
    ).toBe(false);
    expect(
      shouldCacheResponse({
        method: "GET",
        pathname: "/api/products/",
        cookieHeader: "",
        status: 200,
        setCookie: false,
      }),
    ).toBe(false);
  });

  it("sets static vs HTML cache-control", () => {
    expect(cacheControlForPath("/_next/static/chunks/app.js")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(cacheControlForPath("/")).toBe(
      "public, s-maxage=300, stale-while-revalidate=3600",
    );
  });
});
