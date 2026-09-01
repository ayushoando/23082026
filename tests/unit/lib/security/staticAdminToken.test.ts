import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  acceptedStaticAdminTokens,
  matchesStaticAdminToken,
  resetStaticAdminTokenWarnings,
  staticAdminTokenFingerprint,
  warnStaticAdminTokenUsage,
} from "@/lib/security/staticAdminToken";

describe("staticAdminToken (SEC-R07)", () => {
  const TOKEN_A = "a".repeat(32);
  const TOKEN_B = "b".repeat(32);

  describe("acceptedStaticAdminTokens", () => {
    it("prefers the comma-separated rotation list", () => {
      const tokens = acceptedStaticAdminTokens({
        CUSTOMER_QUERIES_ADMIN_TOKEN: TOKEN_A,
        CUSTOMER_QUERIES_ADMIN_TOKENS: `${TOKEN_B},${TOKEN_A}`,
      });
      expect(tokens).toEqual([TOKEN_B, TOKEN_A]);
    });

    it("falls back to the legacy single token", () => {
      expect(acceptedStaticAdminTokens({ CUSTOMER_QUERIES_ADMIN_TOKEN: TOKEN_A })).toEqual([TOKEN_A]);
    });

    it("returns empty when nothing is configured (fallback disabled)", () => {
      expect(acceptedStaticAdminTokens({})).toEqual([]);
      expect(acceptedStaticAdminTokens({ CUSTOMER_QUERIES_ADMIN_TOKENS: "  " })).toEqual([]);
    });

    it("drops blank entries from the rotation list", () => {
      expect(acceptedStaticAdminTokens({ CUSTOMER_QUERIES_ADMIN_TOKENS: `${TOKEN_A},,${TOKEN_B},` })).toEqual([
        TOKEN_A,
        TOKEN_B,
      ]);
    });
  });

  describe("matchesStaticAdminToken", () => {
    it("matches any accepted token exactly", () => {
      expect(matchesStaticAdminToken(TOKEN_A, [TOKEN_B, TOKEN_A])).toBe(true);
    });

    it("rejects wrong or empty tokens", () => {
      expect(matchesStaticAdminToken("c".repeat(32), [TOKEN_A])).toBe(false);
      expect(matchesStaticAdminToken("", [TOKEN_A])).toBe(false);
      expect(matchesStaticAdminToken("short", [TOKEN_A])).toBe(false);
    });
  });

  describe("staticAdminTokenFingerprint", () => {
    it("is stable, short, and never contains the token", () => {
      const fp = staticAdminTokenFingerprint(TOKEN_A);
      expect(fp).toHaveLength(8);
      expect(fp).toBe(staticAdminTokenFingerprint(TOKEN_A));
      expect(fp).not.toContain("a".repeat(8));
      expect(staticAdminTokenFingerprint(TOKEN_B)).not.toBe(fp);
    });
  });

  describe("warnStaticAdminTokenUsage", () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      resetStaticAdminTokenWarnings();
      warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it("logs once per distinct token and never leaks the secret", () => {
      warnStaticAdminTokenUsage("test-scope", TOKEN_A);
      warnStaticAdminTokenUsage("test-scope", TOKEN_A);
      expect(warnSpy).toHaveBeenCalledTimes(1);

      const message = warnSpy.mock.calls[0][0] as string;
      expect(message).toContain("SEC-R07");
      expect(message).toContain("test-scope");
      expect(message).not.toContain(TOKEN_A);
    });

    it("warns separately for a second rotated token", () => {
      warnStaticAdminTokenUsage("test-scope", TOKEN_A);
      warnStaticAdminTokenUsage("test-scope", TOKEN_B);
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });
  });
});
