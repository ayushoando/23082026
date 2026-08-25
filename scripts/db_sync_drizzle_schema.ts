/**
 * Verify Drizzle tables on both Postgres targets.
 * Schema changes: platform/supabase/migrations* — apply with db:apply / db:apply:admin.
 */
import { createRequire } from "node:module";
import postgres from "postgres";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

export const EXPECTED_PLANNER_TABLES = [
  "oando_plans",
  "audit_events",
  "price_books",
  "price_book_versions",
  "block_descriptors",
] as const;

export const EXPECTED_PRODUCTS_TABLES = [
  "catalog_products",
  "svg_revisions",
  "svg_revision_artifacts",
] as const;

/** @deprecated use EXPECTED_PLANNER_TABLES */
export const EXPECTED_TABLES = EXPECTED_PLANNER_TABLES;

export type SyncDrizzleResult =
  | {
      ok: true;
      planner: string[];
      products: string[];
    }
  | { ok: false; missing?: string[]; message: string; exitCode: number };

type TableCheckFailure = {
  ok: false;
  present: string[];
  missing: string[];
  message: string;
};

type TableCheckResult =
  | { ok: true; present: string[]; missing: string[]; message: string }
  | TableCheckFailure;

async function checkTables(
  label: string,
  url: string | undefined,
  expected: readonly string[],
  applyHint: string,
  sqlFactory: typeof postgres,
  log: typeof console.log,
  error: typeof console.error,
): Promise<TableCheckResult> {
  if (!url) {
    const message = `❌ ${label} URL missing from .env.local`;
    error(message);
    return { ok: false, message, missing: [...expected], present: [] };
  }

  const sql = sqlFactory(url, { max: 1, prepare: false });
  try {
    const rows = await sql<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY(${[...expected]})
      ORDER BY table_name
    `;
    const present = rows.map((row) => row.table_name);
    const presentSet = new Set(present);
    log(`${label} present: ${present.join(", ") || "(none)"}`);

    const missing = expected.filter((name) => !presentSet.has(name));
    if (missing.length > 0) {
      error(`❌ ${label} missing tables: ${missing.join(", ")}`);
      error(`Run: ${applyHint}`);
      return {
        ok: false,
        missing: [...missing],
        message: `${label} missing: ${missing.join(", ")}`,
        present,
      };
    }
    return { ok: true, present, missing: [], message: "" };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function checkDrizzleSchema(
  deps: {
    env?: NodeJS.ProcessEnv;
    sqlFactory?: typeof postgres;
    log?: typeof console.log;
    error?: typeof console.error;
  } = {},
): Promise<SyncDrizzleResult> {
  const env = deps.env ?? process.env;
  const sqlFactory = deps.sqlFactory ?? postgres;
  const log = deps.log ?? console.log;
  const error = deps.error ?? console.error;

  try {
    const planner = await checkTables(
      "Planner/Auth",
      env.SUPABASE_AUTH_DATABASE_URL?.trim(),
      EXPECTED_PLANNER_TABLES,
      "pnpm --filter oando-site run db:apply:admin",
      sqlFactory,
      log,
      error,
    );
    const products = await checkTables(
      "Products",
      env.PRODUCTS_DATABASE_URL?.trim(),
      EXPECTED_PRODUCTS_TABLES,
      "pnpm --filter oando-site run db:apply",
      sqlFactory,
      log,
      error,
    );

    const failures: TableCheckFailure[] = [];
    if (planner.ok === false) failures.push(planner);
    if (products.ok === false) failures.push(products);
    if (failures.length > 0) {
      return {
        ok: false,
        message: failures.map((failure) => failure.message).join(" | "),
        missing: failures.flatMap((failure) => failure.missing),
        exitCode: 1,
      };
    }

    log(
      "✅ Both Drizzle targets present. Use db:apply / db:apply:admin for schema changes.",
    );
    return {
      ok: true,
      planner: planner.present,
      products: products.present,
    };
  } catch (err) {
    error("❌ Drizzle schema check failed:");
    error(err);
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
      exitCode: 1,
    };
  }
}

export async function main(): Promise<void> {
  const result = await checkDrizzleSchema();
  if (result.ok === false) {
    process.exit(result.exitCode);
  }
  process.exit(0);
}

function isMain(): boolean {
  const entry = (process.argv[1] ?? "").replace(/\\/g, "/");
  return (
    entry.endsWith("db_sync_drizzle_schema.ts") ||
    entry.endsWith("db_sync_drizzle_schema.js")
  );
}

if (isMain()) {
  void main();
}
