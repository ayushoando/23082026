// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

vi.mock("next-intl/plugin", () => {
  const mockPlugin = () => (config: object) => ({ ...config });
  return { default: mockPlugin };
});

import nextConfig from "../../../site/next.config.js";

describe("Security Headers Configuration", () => {
  it("site/next.config.js headers() returns hardened security headers for all routes", async () => {
    expect(typeof nextConfig.headers).toBe("function");
    if (!nextConfig.headers) {
      throw new Error("nextConfig.headers is not defined");
    }
    const configuredHeaders = await nextConfig.headers();

    const rootHeadersConfig = configuredHeaders.find(
      (entry: { source: string }) => entry.source === "/:path*",
    );
    expect(rootHeadersConfig).toBeDefined();
    if (!rootHeadersConfig) {
      throw new Error("rootHeadersConfig is not defined");
    }

    const headersMap = new Map(
      rootHeadersConfig.headers.map((h: { key: string; value: string }) => [h.key, h.value]),
    );

    expect(headersMap.get("X-Frame-Options")).toBe("DENY");
    expect(headersMap.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headersMap.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headersMap.get("Permissions-Policy")).toContain("camera=()");
    expect(headersMap.get("Strict-Transport-Security")).toBe(
      "max-age=31536000; includeSubDomains; preload",
    );

    const apiHeadersConfig = configuredHeaders.find(
      (entry: { source: string }) => entry.source === "/api/:path*",
    );
    expect(apiHeadersConfig).toBeDefined();
    if (!apiHeadersConfig) {
      throw new Error("apiHeadersConfig is not defined");
    }
    const apiHeadersMap = new Map(
      apiHeadersConfig.headers.map((h: { key: string; value: string }) => [h.key, h.value]),
    );
    expect(apiHeadersMap.get("X-Frame-Options")).toBe("DENY");
    expect(apiHeadersMap.get("X-Content-Type-Options")).toBe("nosniff");
  });
});
