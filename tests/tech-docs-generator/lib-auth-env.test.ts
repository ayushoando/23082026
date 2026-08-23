import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAdminSupabaseEnv,
  isAdminSupabaseConfigured,
} from "../../tech-docs-generator/src/lib/authEnv";
import {
  getAuthSupabaseClient,
  resetAuthSupabaseClientForTests,
} from "../../tech-docs-generator/src/lib/supabaseClient";

describe("tech-docs auth env + supabase client", () => {
  afterEach(() => {
    resetAuthSupabaseClientForTests();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("getAdminSupabaseEnv and isAdminSupabaseConfigured stay aligned", () => {
    const env = getAdminSupabaseEnv();
    expect(isAdminSupabaseConfigured()).toBe(env !== null);
    if (env) {
      expect(env.url.length).toBeGreaterThan(0);
      expect(env.anonKey.length).toBeGreaterThan(0);
    }
  });

  it("getAuthSupabaseClient throws when admin Supabase is not configured", () => {
    const env = getAdminSupabaseEnv();
    if (env) {
      const client = getAuthSupabaseClient();
      expect(client).toBeTruthy();
      resetAuthSupabaseClientForTests();
      const again = getAuthSupabaseClient();
      expect(again).toBeTruthy();
      return;
    }
    expect(() => getAuthSupabaseClient()).toThrow(/not configured/i);
  });

  it("returns null when build-time admin env defines are empty", async () => {
    vi.stubGlobal("__TECH_DOCS_ADMIN_SUPABASE_URL__", "");
    vi.stubGlobal("__TECH_DOCS_ADMIN_SUPABASE_ANON_KEY__", "");
    vi.resetModules();
    const authEnv = await import("../../tech-docs-generator/src/lib/authEnv");
    expect(authEnv.getAdminSupabaseEnv()).toBeNull();
    expect(authEnv.isAdminSupabaseConfigured()).toBe(false);
    const clientMod = await import("../../tech-docs-generator/src/lib/supabaseClient");
    expect(() => clientMod.getAuthSupabaseClient()).toThrow(/not configured/i);
  });
});
