import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getOptionalPublicSupabaseEnv,
  getOptionalAuthSupabaseEnv,
  hasPublicSupabaseEnv,
  hasAuthSupabaseEnv,
  isSupabaseConfigAvailable,
  getPublicSupabaseEnv,
  getAuthSupabaseEnv,
} from "@/platform/supabase/env";

describe("supabase env utilities", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getOptionalPublicSupabaseEnv", () => {
    it("should return null if env values are missing", () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(getOptionalPublicSupabaseEnv()).toBeNull();
    });

    it("should return credentials if both are present", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";

      expect(getOptionalPublicSupabaseEnv()).toEqual({
        url: "https://test.supabase.co",
        anonKey: "test-key",
      });
    });
  });

  describe("hasPublicSupabaseEnv", () => {
    it("should return false if missing credentials", () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      expect(hasPublicSupabaseEnv()).toBe(false);
    });

    it("should return true if credentials are set", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      expect(hasPublicSupabaseEnv()).toBe(true);
    });
  });

  describe("isSupabaseConfigAvailable", () => {
    it("should behave identically to hasPublicSupabaseEnv", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      expect(isSupabaseConfigAvailable()).toBe(true);
    });
  });

  describe("getOptionalAuthSupabaseEnv", () => {
    it("should return null if admin auth env values are missing", () => {
      delete process.env.NEXT_ADMIN_SUPABASE_URL;
      delete process.env.SUPABASE_AUTH_URL;
      delete process.env.NEXT_ADMIN_SUPABASE_ANON_KEY;
      delete process.env.NEXT_ADMIN_PUBLISHABLE_KEY;

      expect(getOptionalAuthSupabaseEnv()).toBeNull();
    });

    it("should return admin credentials when present", () => {
      process.env.NEXT_ADMIN_SUPABASE_URL = "https://auth.supabase.co";
      process.env.NEXT_ADMIN_SUPABASE_ANON_KEY = "admin-key";
      delete process.env.SUPABASE_AUTH_URL;
      delete process.env.NEXT_ADMIN_PUBLISHABLE_KEY;

      expect(getOptionalAuthSupabaseEnv()).toEqual({
        url: "https://auth.supabase.co",
        anonKey: "admin-key",
      });
    });
  });

  describe("hasAuthSupabaseEnv", () => {
    it("should return false if admin credentials are missing", () => {
      delete process.env.NEXT_ADMIN_SUPABASE_URL;
      delete process.env.SUPABASE_AUTH_URL;
      delete process.env.NEXT_ADMIN_SUPABASE_ANON_KEY;
      delete process.env.NEXT_ADMIN_PUBLISHABLE_KEY;
      expect(hasAuthSupabaseEnv()).toBe(false);
    });

    it("should return true if admin credentials are set", () => {
      process.env.NEXT_ADMIN_SUPABASE_URL = "https://auth.supabase.co";
      process.env.NEXT_ADMIN_SUPABASE_ANON_KEY = "admin-key";
      delete process.env.SUPABASE_AUTH_URL;
      delete process.env.NEXT_ADMIN_PUBLISHABLE_KEY;
      expect(hasAuthSupabaseEnv()).toBe(true);
    });
  });

  describe("getAuthSupabaseEnv", () => {
    it("should throw error if admin URL is missing", () => {
      delete process.env.NEXT_ADMIN_SUPABASE_URL;
      delete process.env.SUPABASE_AUTH_URL;
      delete process.env.NEXT_ADMIN_PUBLISHABLE_KEY;
      process.env.NEXT_ADMIN_SUPABASE_ANON_KEY = "admin-key";

      expect(() => getAuthSupabaseEnv()).toThrow("Missing required env var: NEXT_ADMIN_SUPABASE_URL");
    });

    it("should return admin object if both are set", () => {
      process.env.NEXT_ADMIN_SUPABASE_URL = "https://auth.supabase.co";
      process.env.NEXT_ADMIN_SUPABASE_ANON_KEY = "admin-key";
      delete process.env.SUPABASE_AUTH_URL;
      delete process.env.NEXT_ADMIN_PUBLISHABLE_KEY;

      expect(getAuthSupabaseEnv()).toEqual({
        url: "https://auth.supabase.co",
        anonKey: "admin-key",
      });
    });
  });

  describe("getPublicSupabaseEnv", () => {
    it("should throw error if URL is missing", () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";

      expect(() => getPublicSupabaseEnv()).toThrow("Missing required env var: NEXT_PUBLIC_SUPABASE_URL");
    });

    it("should throw error if anonKey is missing", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => getPublicSupabaseEnv()).toThrow("Missing required env var: NEXT_PUBLIC_SUPABASE_ANON_KEY");
    });

    it("should return object if both are set", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";

      expect(getPublicSupabaseEnv()).toEqual({
        url: "https://test.supabase.co",
        anonKey: "test-key",
      });
    });
  });

  // 9.3 misuse guard: service-role JWTs are rejected in publishable/anon slots.
  const b64url = (obj: object) =>
    Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");
  const serviceRoleJwt = `header.${b64url({ role: "service_role" })}.sig`;
  const anonRoleJwt = `header.${b64url({ role: "anon" })}.sig`;

  describe("9.3 service-role misuse guard", () => {
    it("rejects a service-role JWT in NEXT_ADMIN_SUPABASE_ANON_KEY", () => {
      process.env.NEXT_ADMIN_SUPABASE_URL = "https://auth.supabase.co";
      process.env.NEXT_ADMIN_SUPABASE_ANON_KEY = serviceRoleJwt;

      expect(() => getOptionalAuthSupabaseEnv()).toThrow(
        /service-role key/,
      );
      expect(() => getAuthSupabaseEnv()).toThrow(/service-role key/);
      expect(hasAuthSupabaseEnv()).toBe(false);
    });

    it("rejects a service-role JWT in NEXT_PUBLIC_SUPABASE_ANON_KEY", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = serviceRoleJwt;

      expect(() => getOptionalPublicSupabaseEnv()).toThrow(/service-role key/);
    });

    it("accepts anon-role JWTs and non-JWT keys", () => {
      process.env.NEXT_ADMIN_SUPABASE_URL = "https://auth.supabase.co";
      process.env.NEXT_ADMIN_SUPABASE_ANON_KEY = anonRoleJwt;
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_plain_token";

      expect(getOptionalAuthSupabaseEnv()?.anonKey).toBe(anonRoleJwt);
      expect(getOptionalPublicSupabaseEnv()?.anonKey).toBe("sb_publishable_plain_token");
    });
  });
});
