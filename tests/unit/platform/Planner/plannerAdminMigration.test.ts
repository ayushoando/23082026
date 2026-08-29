// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Tasks 4.9-4.11
// Repository-only evidence for the required Admin migration branch.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION_PATH = path.join(
  process.cwd(),
  "site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql",
);

const DRIZZLE_PATH = path.join(
  process.cwd(),
  "site/platform/drizzle/schema/planner.ts",
);

export const PLANNER_SCHEMA_GAP_DECISION = {
  branch: "migration-required",
  database: "Admin",
  evidence: [
    "site/platform/supabase/migrations.admin/20260628100000_planner_plans_and_audit.sql",
    "site/platform/drizzle/schema/planner.ts",
    "site/platform/types/database.admin.types.ts",
    "site/server/Planner/plannerProjectSupabaseAdapter.ts",
  ],
  defects: [
    "oando_plans revision and schema_version columns absent",
    "owner-scoped idempotency relation and atomic mutation function absent",
    "authenticated owner grants and RLS policies absent",
  ],
} as const;

export const PENDING_PLANNER_ADMIN_COMMANDS = [
  "pnpm run db:apply:admin -- --dry",
  "pnpm run db:types:admin",
] as const;

async function migrationParts(): Promise<{ forward: string; rollback: string }> {
  const sql = await readFile(MIGRATION_PATH, "utf8");
  const marker = "-- rollback:";
  const markerIndex = sql.indexOf(marker);
  expect(markerIndex).toBeGreaterThan(0);
  return {
    forward: sql.slice(0, markerIndex),
    rollback: sql.slice(markerIndex + marker.length),
  };
}

describe("Planner Admin schema-gap decision", () => {
  it("binds the required migration branch to repository-local evidence", () => {
    expect(PLANNER_SCHEMA_GAP_DECISION.branch).toBe("migration-required");
    expect(PLANNER_SCHEMA_GAP_DECISION.database).toBe("Admin");
    expect(PLANNER_SCHEMA_GAP_DECISION.evidence).toHaveLength(4);
    expect(PENDING_PLANNER_ADMIN_COMMANDS).toEqual([
      "pnpm run db:apply:admin -- --dry",
      "pnpm run db:types:admin",
    ]);
  });
});

describe("Planner revision/idempotency Admin migration", () => {
  it("uses deterministic compatibility backfills and bounded constraints", async () => {
    const { forward } = await migrationParts();
    expect(forward).toContain("add column if not exists revision bigint");
    expect(forward).toContain("add column if not exists schema_version integer");
    expect(forward).toContain("jsonb_typeof(payload -> 'revision') = 'number'");
    expect(forward).toContain("payload -> 'schemaVersion'");
    expect(forward).toContain("payload -> 'schema_version'");
    expect(forward).toContain("else 1");
    expect(forward).toContain("else 0");
    expect(forward).toContain("oando_plans_revision_check check (revision >= 1)");
    expect(forward).toContain("oando_plans_schema_version_check check (schema_version >= 0)");
  });

  it("defines owner/operation/project/key idempotency without a project foreign key", async () => {
    const { forward } = await migrationParts();
    expect(forward).toContain("create table if not exists public.planner_operation_idempotency");
    expect(forward).toContain("unique (owner_id, operation, project_id, idempotency_key)");
    expect(forward).toContain("planner_operation_idempotency_created_at_idx");
    expect(forward).not.toMatch(/project_id uuid[^\n]*references public\.oando_plans/);
  });

  it("provides one guarded transaction-safe mutation function", async () => {
    const { forward } = await migrationParts();
    expect(forward).toContain("create or replace function public.planner_mutate_plan_v1");
    expect(forward).toContain("security definer");
    expect(forward).toContain("set search_path = ''");
    expect(forward).toContain("auth.uid() is distinct from p_owner_id");
    expect(forward).toContain("on conflict (owner_id, operation, project_id, idempotency_key) do nothing");
    expect(forward).toContain("and plan.revision = p_expected_revision");
    expect(forward).toContain("revision = plan.revision + 1");
  });

  it("combines owner RLS with least-privilege grants and no anonymous access", async () => {
    const { forward } = await migrationParts();
    expect(forward).toContain("auth.uid() = user_id");
    expect(forward).toContain("auth.uid() = owner_id");
    expect(forward).toContain("revoke all on table public.oando_plans from public, anon");
    expect(forward).toContain("grant select on table public.oando_plans to authenticated");
    expect(forward).toContain("grant execute on function public.planner_mutate_plan_v1");
    expect(forward).not.toContain("grant all on table");
  });

  it("keeps repository-side Drizzle support aligned pending generated Admin types", async () => {
    const schema = await readFile(DRIZZLE_PATH, "utf8");
    expect(schema).toContain('bigint("revision", { mode: "number" })');
    expect(schema).toContain('integer("schema_version")');
    expect(schema).toContain('pgTable("planner_operation_idempotency"');
    expect(schema).toContain('uniqueIndex("planner_operation_idempotency_identity_key")');
  });

  it("contains dependency-safe rollback for every introduced object", async () => {
    const { rollback } = await migrationParts();
    const functionDrop = rollback.indexOf("drop function if exists public.planner_mutate_plan_v1");
    const tableDrop = rollback.indexOf("drop table if exists public.planner_operation_idempotency");
    const constraintDrop = rollback.indexOf("drop constraint if exists oando_plans_schema_version_check");
    const columnDrop = rollback.indexOf("drop column if exists schema_version");
    expect(functionDrop).toBeGreaterThan(0);
    expect(tableDrop).toBeGreaterThan(functionDrop);
    expect(constraintDrop).toBeGreaterThan(tableDrop);
    expect(columnDrop).toBeGreaterThan(constraintDrop);
  });
});
