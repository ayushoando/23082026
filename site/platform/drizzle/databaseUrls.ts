/**
 * Postgres wire URLs for Drizzle (server-only).
 * HTTP Supabase URLs (NEXT_PUBLIC_*, NEXT_ADMIN_*) are for Auth/REST only.
 */

/**
 * Vercel serverless often CONNECT_TIMEOUT against Supabase session-mode
 * pooler (:5432). Transaction mode on the same host is :6543.
 * Direct `db.*.supabase.co:5432` is left unchanged. Scripts that read
 * PRODUCTS_DATABASE_URL raw (migrations) are not affected.
 */
export function rewriteSupabasePoolerToTransactionPort(
  connectionString: string,
): string {
  const sessionPort =
    /(@(?:[^/@]*\.)?pooler\.supabase\.com):5432(?=[/?]|$)/i;
  if (sessionPort.test(connectionString)) {
    return connectionString.replace(sessionPort, "$1:6543");
  }
  const implicitPort = /(@(?:[^/@]*\.)?pooler\.supabase\.com)(?=[/?]|$)/i;
  if (implicitPort.test(connectionString)) {
    return connectionString.replace(implicitPort, "$1:6543");
  }
  return connectionString;
}

export function resolveProductsDatabaseUrl(): string | null {
  const raw = process.env.PRODUCTS_DATABASE_URL?.trim() || null;
  if (!raw) {
    return null;
  }
  return rewriteSupabasePoolerToTransactionPort(raw);
}

export function isProductsDatabaseConfigured(): boolean {
  return Boolean(resolveProductsDatabaseUrl());
}

/** Primary planner DB: admin Supabase Postgres. */
export function resolvePlannerDatabaseUrl(): string | null {
  return (
    process.env.SUPABASE_AUTH_DATABASE_URL?.trim() ||
    process.env.PLANNER_DATABASE_URL?.trim() ||
    null
  );
}

export function isPlannerDatabaseUrlConfigured(): boolean {
  return Boolean(resolvePlannerDatabaseUrl());
}
