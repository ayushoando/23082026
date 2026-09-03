import { describe, it, expect } from "vitest";
import {
  buildSecureCookieOptions,
  formatSecureCookieHeader,
  DEFAULT_SECURE_COOKIE_OPTIONS,
  STRICT_SECURE_COOKIE_OPTIONS,
} from "@/lib/security/cookies";

describe("cookies security utilities", () => {
  describe("DEFAULT_SECURE_COOKIE_OPTIONS", () => {
    it("enforces httpOnly, sameSite lax, and path /", () => {
      expect(DEFAULT_SECURE_COOKIE_OPTIONS.httpOnly).toBe(true);
      expect(DEFAULT_SECURE_COOKIE_OPTIONS.sameSite).toBe("lax");
      expect(DEFAULT_SECURE_COOKIE_OPTIONS.path).toBe("/");
    });
  });

  describe("STRICT_SECURE_COOKIE_OPTIONS", () => {
    it("enforces strict sameSite for sensitive contexts", () => {
      expect(STRICT_SECURE_COOKIE_OPTIONS.httpOnly).toBe(true);
      expect(STRICT_SECURE_COOKIE_OPTIONS.sameSite).toBe("strict");
    });
  });

  describe("buildSecureCookieOptions", () => {
    it("defaults to secure options when overrides are empty", () => {
      const opts = buildSecureCookieOptions();
      expect(opts.httpOnly).toBe(true);
      expect(opts.sameSite).toBe("lax");
      expect(opts.path).toBe("/");
    });

    it("merges custom maxAge while preserving httpOnly and sameSite", () => {
      const opts = buildSecureCookieOptions({ maxAge: 3600 });
      expect(opts.maxAge).toBe(3600);
      expect(opts.httpOnly).toBe(true);
      expect(opts.sameSite).toBe("lax");
    });

    it("allows overriding sameSite to strict", () => {
      const opts = buildSecureCookieOptions({ sameSite: "strict" });
      expect(opts.sameSite).toBe("strict");
    });
  });

  describe("formatSecureCookieHeader", () => {
    it("formats standard secure cookie header string", () => {
      const header = formatSecureCookieHeader("session_id", "abc-123", {
        maxAge: 3600,
        sameSite: "lax",
      });
      expect(header).toContain("session_id=abc-123");
      expect(header).toContain("Path=/");
      expect(header).toContain("Max-Age=3600");
      expect(header).toContain("HttpOnly");
      expect(header).toContain("SameSite=Lax");
    });

    it("formats strict secure cookie header string", () => {
      const header = formatSecureCookieHeader("csrf_token", "token-xyz", {
        sameSite: "strict",
      });
      expect(header).toContain("csrf_token=token-xyz");
      expect(header).toContain("HttpOnly");
      expect(header).toContain("SameSite=Strict");
    });
  });
});

