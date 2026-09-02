type PublicSupabaseEnv = {
  url: string;
  anonKey: string;
};

function readEnv(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return trimmed;
}

/**
 * 9.3 misuse guard: the publishable/anon-key slots are named `NEXT_ADMIN_*`
 * (historical), which invites someone to paste a **service-role** key there.
 * A service-role JWT in an anon-key slot bypasses RLS everywhere it is used —
 * fail closed with an explicit error instead.
 */
function assertNotServiceRoleKey(sourceVar: string, value: string): void {
  const parts = value.split(".");
  if (parts.length !== 3) {
    return; // Not a Supabase JWT (e.g. new-style `sb_publishable_…`) — nothing to check.
  }
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof atob === "function"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf8");
    const payload = JSON.parse(json) as { role?: unknown };
    if (payload?.role === "service_role") {
      throw new Error(
        `${sourceVar} holds a service-role key (JWT role=service_role). ` +
          "Publishable/anon-key slots must never contain service-role credentials — " +
          "set the anon/publishable key instead (finding 9.3).",
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("service-role key")) {
      throw error;
    }
    // Undecodable token: treat as non-JWT and allow (readEnv handles emptiness).
  }
}

function authAnonKeyFromEnv(): string | undefined {
  const anonKey =
    process.env.NEXT_ADMIN_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_ADMIN_PUBLISHABLE_KEY?.trim();
  if (anonKey) {
    assertNotServiceRoleKey("NEXT_ADMIN_SUPABASE_ANON_KEY", anonKey);
  }
  return anonKey;
}

function publicAnonKeyFromEnv(): string | undefined {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (anonKey) {
    assertNotServiceRoleKey("NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey);
  }
  return anonKey;
}

export function getOptionalPublicSupabaseEnv(): PublicSupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = publicAnonKeyFromEnv();

  return url && anonKey ? { url, anonKey } : null;
}

/** Auth / planner Supabase project (users, profiles, plans) — not the products catalog project. */
export function getOptionalAuthSupabaseEnv(): PublicSupabaseEnv | null {
  const url =
    process.env.NEXT_ADMIN_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_AUTH_URL?.trim();
  const anonKey = authAnonKeyFromEnv();

  return url && anonKey ? { url, anonKey } : null;
}

export function hasPublicSupabaseEnv(): boolean {
  try {
    return Boolean(getOptionalPublicSupabaseEnv());
  } catch (error) {
    // 9.3 guard: a service-role key in a publishable slot means "not usable",
    // not "crash every page probe" — constructing clients still throws loudly.
    if (error instanceof Error && error.message.includes("service-role key")) {
      return false;
    }
    throw error;
  }
}

export function hasAuthSupabaseEnv(): boolean {
  try {
    return Boolean(getOptionalAuthSupabaseEnv());
  } catch (error) {
    if (error instanceof Error && error.message.includes("service-role key")) {
      return false;
    }
    throw error;
  }
}

/** Safe to call in server components or middleware without throwing. */
export function isSupabaseConfigAvailable(): boolean {
  return hasPublicSupabaseEnv();
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  return {
    url: readEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", publicAnonKeyFromEnv()),
  };
}

export function getAuthSupabaseEnv(): PublicSupabaseEnv {
  const optional = getOptionalAuthSupabaseEnv();
  if (optional) {
    return optional;
  }

  return {
    url: readEnv(
      "NEXT_ADMIN_SUPABASE_URL",
      process.env.NEXT_ADMIN_SUPABASE_URL ?? process.env.SUPABASE_AUTH_URL,
    ),
    anonKey: readEnv("NEXT_ADMIN_SUPABASE_ANON_KEY", authAnonKeyFromEnv()),
  };
}