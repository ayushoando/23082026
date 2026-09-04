// @vitest-environment node
import { describe, expect, it } from "vitest";

import { resolveProductsBackupCredentials } from "../../../scripts/backup_supabase";

describe("backup_supabase credentials", () => {
  it("requires a Products service-role key and does not fall back to anon", () => {
    expect(() =>
      resolveProductsBackupCredentials({
        NODE_ENV: "test",
        NEXT_PUBLIC_SUPABASE_URL: "https://products.example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      }),
    ).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("returns the canonical Products URL and service-role key", () => {
    expect(
      resolveProductsBackupCredentials({
        NODE_ENV: "test",
        NEXT_PUBLIC_SUPABASE_URL: " https://products.example.supabase.co ",
        SUPABASE_SERVICE_ROLE_KEY: " service-role-key ",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      }),
    ).toEqual({
      supabaseUrl: "https://products.example.supabase.co",
      serviceKey: "service-role-key",
    });
  });
});
