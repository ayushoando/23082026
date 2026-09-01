import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database as AuthDatabase } from "@/types/database.admin.types";
import { getAuthSupabaseEnv } from "./env";

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

/**
 * Server-side client for the admin/auth Supabase project.
 *
 * Owns: auth.users, profiles, user_history, customer_queries, plans,
 *       plan_versions, plan_comments, plan_shares, planner_settings,
 *       projects, clients, quotes, teams, team_members, invites, offices,
 *       templates, users.
 *
 * Use this for any server route that touches user-scoped or CRM-ish data.
 * For catalog data use createSupabaseAdminClient() in @/platform/supabase/supabaseAdmin.
 */
export function createSupabaseAuthAdminClient() {
  const supabaseUrl = process.env.NEXT_ADMIN_SUPABASE_URL?.trim() ?? "";
  if (!supabaseUrl) {
    throw new Error("Missing required env var: NEXT_ADMIN_SUPABASE_URL");
  }

  const serviceRoleKey = getEnv("SUPABASE_ADMIN_SERVICE_ROLE_KEY");

  return createClient<AuthDatabase>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Server-side ANON-key client for the admin/auth Supabase project.
 *
 * SEC-R08: public-facing routes must not exercise the service-role key where
 * row-level security can carry the authorization instead. When an
 * `accessToken` (the caller's own bearer JWT) is supplied, PostgREST applies
 * RLS as that authenticated user, so the owner-scoped `user_history` policy
 * governs the read/write. Without a token the client runs as `anon` (no
 * per-row ownership can be proven for cookie-only visitors, so anonymous
 * tracking intentionally remains server-mediated with the service-role key).
 *
 * Reads that genuinely need to bypass RLS (admin listings) must keep using
 * createSupabaseAuthAdminClient().
 */
export function createSupabaseAuthAnonClient(accessToken?: string | null) {
  const { url, anonKey } = getAuthSupabaseEnv();

  const headers: Record<string, string> = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};

  return createClient<AuthDatabase>(url, anonKey, {
    global: { headers },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
