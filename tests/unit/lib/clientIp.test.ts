import { describe, expect, it } from "vitest";
import { normalizeClientIp, resolveClientIpFromHeaders } from "@/lib/clientIp";

function headersWith(init: Record<string, string>): Headers {
  return new Headers(init);
}

describe("normalizeClientIp", () => {
  it("maps loopback IPs to localhost for stable rate-limit keys", () => {
    expect(normalizeClientIp("127.0.0.1")).toBe("localhost");
    expect(normalizeClientIp("::1")).toBe("localhost");
    expect(normalizeClientIp(" 127.0.0.1 ")).toBe("localhost");
  });

  it("preserves other IPs and trims whitespace", () => {
    expect(normalizeClientIp("203.0.113.10")).toBe("203.0.113.10");
    expect(normalizeClientIp(" 203.0.113.10 ")).toBe("203.0.113.10");
  });
});

describe("resolveClientIpFromHeaders (28.17)", () => {
  it("prefers cf-connecting-ip when Cloudflare fronts the request", () => {
    const ip = resolveClientIpFromHeaders(
      headersWith({
        "cf-connecting-ip": "198.51.100.7",
        "x-forwarded-for": "203.0.113.9, 10.0.0.1",
      }),
    );
    expect(ip).toBe("198.51.100.7");
  });

  it("falls back to the first x-forwarded-for hop", () => {
    const ip = resolveClientIpFromHeaders(
      headersWith({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }),
    );
    expect(ip).toBe("203.0.113.9");
  });

  it("uses x-real-ip when neither CF nor XFF is present (non-CF hosts)", () => {
    const ip = resolveClientIpFromHeaders(headersWith({ "x-real-ip": "203.0.113.4" }));
    expect(ip).toBe("203.0.113.4");
  });

  it("defaults to loopback (normalized) when no proxy headers exist", () => {
    expect(resolveClientIpFromHeaders(headersWith({}))).toBe("localhost");
  });
});
