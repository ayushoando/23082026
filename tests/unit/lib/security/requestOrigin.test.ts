import { describe, expect, it } from "vitest";
import { isAllowedBrowserOrigin } from "@/lib/security/requestOrigin";

function mockReq(headers: Record<string, string>, url = "http://localhost:3000/api/customer-queries/") {
  return {
    headers: {
      get(name: string) {
        return headers[name.toLowerCase()] ?? headers[name] ?? null;
      },
    },
    nextUrl: { origin: new URL(url).origin },
    url,
  };
}

describe("isAllowedBrowserOrigin", () => {
  it("allows requests with no Origin or Referer outside production (non-browser)", () => {
    expect(isAllowedBrowserOrigin(mockReq({}), { NODE_ENV: "test" })).toBe(true);
    expect(isAllowedBrowserOrigin(mockReq({}), { NODE_ENV: "development" })).toBe(true);
  });

  it("rejects requests with no Origin or Referer in production (SEC-H03)", () => {
    expect(isAllowedBrowserOrigin(mockReq({}), { NODE_ENV: "production" })).toBe(false);
  });

  it("allows same-origin Origin header", () => {
    expect(
      isAllowedBrowserOrigin(
        mockReq({ origin: "http://localhost:3000" }, "http://localhost:3000/api/x/"),
      ),
    ).toBe(true);
  });

  it("rejects cross-site Origin", () => {
    expect(
      isAllowedBrowserOrigin(
        mockReq({ origin: "https://evil.example" }, "http://localhost:3000/api/x/"),
      ),
    ).toBe(false);
  });

  it("allows same-origin Referer when Origin absent", () => {
    expect(
      isAllowedBrowserOrigin(
        mockReq(
          { referer: "http://localhost:3000/contact/" },
          "http://localhost:3000/api/x/",
        ),
      ),
    ).toBe(true);
  });

  it("rejects cross-site Referer", () => {
    expect(
      isAllowedBrowserOrigin(
        mockReq(
          { referer: "https://evil.example/page" },
          "http://localhost:3000/api/x/",
        ),
      ),
    ).toBe(false);
  });
});
