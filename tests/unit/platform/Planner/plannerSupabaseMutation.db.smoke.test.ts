/**
 * @vitest-environment node
 *
 * Live Admin smoke coverage for the atomic Planner Supabase contract.
 *
 * This deliberately uses a synthetic profile/project and service-role server
 * clients. It verifies the RPC-backed mutation behavior and the live policy/
 * privilege shape; authenticated-user RLS behavior still requires a real user
 * session because service-role clients bypass RLS.
 */
import { createHash } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";
import postgres from "postgres";

import { createSupabaseAuthAdminClient } from "@/platform/supabase/auth-admin";
import {
  PLANNER_REPOSITORY_CONTRACT_VERSION,
  type PlannerGeometrySnapshotV1,
  type PlannerProjectWriteV1,
  type SavePlannerProjectRequestV1,
} from "@planner/lib/plannerProjectRepository";
import { plannerProjectSupabaseAdapter } from "@planner/server/plannerProjectSupabaseAdapter";
import { fingerprintPlannerMutation } from "@planner/lib/plannerProjectOperations";

const adminDatabaseUrl = process.env.SUPABASE_AUTH_DATABASE_URL?.trim() ?? "";
const hasAdminCredentials =
  Boolean(adminDatabaseUrl) &&
  Boolean(process.env.NEXT_ADMIN_SUPABASE_URL?.trim()) &&
  Boolean(process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim());

const TEST_OWNER_ID = crypto.randomUUID();
const TEST_PROJECT_ID = crypto.randomUUID();
const TEST_KEY_PREFIX = `smoke-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
const TEST_CORRELATION_ID = `${TEST_KEY_PREFIX}-correlation`;

function idempotencyKey(operation: string): string {
  return `${TEST_KEY_PREFIX}-${operation}`;
}

function boundedFingerprint(command: Parameters<typeof fingerprintPlannerMutation>[0]): string {
  const fingerprint = fingerprintPlannerMutation(command);
  if (Array.from(fingerprint).length <= 256) return fingerprint;
  return createHash("sha256").update(fingerprint).digest("hex");
}

const geometry: PlannerGeometrySnapshotV1 = {
  contractVersion: 1,
  schemaVersion: 1,
  unit: "mm",
  scalePxPerMm: 0.05,
  geometry: {
    furniture: [
      {
        id: "smoke-desk",
        xMm: 1000,
        yMm: 1000,
        widthMm: 1200,
        depthMm: 700,
        rotationDeg: 0,
      },
    ],
    walls: [
      {
        id: "smoke-wall",
        x1Mm: 0,
        y1Mm: 0,
        x2Mm: 12000,
        y2Mm: 0,
        thicknessMm: 100,
      },
    ],
    doors: [],
    windows: [],
  },
};

const baseProject: PlannerProjectWriteV1 = {
  id: TEST_PROJECT_ID,
  name: "Planner Admin RPC smoke",
  status: "draft",
  geometry,
  sheet: { widthMm: 12000, depthMm: 8000 },
  layers: [],
  thumbnailUrl: null,
};

function saveRequest(
  project: PlannerProjectWriteV1,
  expectedRevision: number,
  idempotencyKey: string,
): SavePlannerProjectRequestV1 {
  return {
    contractVersion: PLANNER_REPOSITORY_CONTRACT_VERSION,
    project,
    expectedRevision,
    idempotencyKey,
  };
}

async function cleanupSyntheticRecords(): Promise<void> {
  if (!hasAdminCredentials) return;
  const client = createSupabaseAuthAdminClient();
  const { error: planError } = await client
    .from("oando_plans")
    .delete()
    .eq("id", TEST_PROJECT_ID);
  if (planError) throw new Error(`Planner smoke plan cleanup failed: ${planError.message}`);
  const { error: profileError } = await client
    .from("profiles")
    .delete()
    .eq("id", TEST_OWNER_ID);
  if (profileError) throw new Error(`Planner smoke profile cleanup failed: ${profileError.message}`);
}

describe.runIf(hasAdminCredentials)("Planner Supabase atomic mutation (live Admin)", () => {
  afterAll(async () => {
    await cleanupSyntheticRecords();
  });

  it("enforces create replay, fingerprint conflict, CAS, delete, and list/load exclusion", async () => {
    await cleanupSyntheticRecords();

    const context = {
      ownerId: TEST_OWNER_ID,
      correlationId: TEST_CORRELATION_ID,
    };
    const createCommand = {
      operation: "create" as const,
      projectId: TEST_PROJECT_ID,
      request: saveRequest(baseProject, 0, idempotencyKey("create")),
    };

    const created = await plannerProjectSupabaseAdapter.mutate(context, createCommand);
    expect(created.effect).toBe("created");
    expect(created.result).toMatchObject({
      ok: true,
      value: { id: TEST_PROJECT_ID, revision: 1 },
    });

    const receiptSql = postgres(adminDatabaseUrl, {
      prepare: false,
      ssl: "require",
      max: 1,
    });
    try {
      const receipts = await receiptSql<Array<{
        response_status: string;
        response_revision: number | null;
        fingerprint_matches: boolean;
      }>>`
        select
          response_status,
          response_revision::integer as response_revision,
          request_fingerprint = ${boundedFingerprint(createCommand)} as fingerprint_matches
        from public.planner_operation_idempotency
        where owner_id = ${TEST_OWNER_ID}
          and operation = 'create'
          and project_id = ${TEST_PROJECT_ID}
          and idempotency_key = ${idempotencyKey("create")}
      `;
      expect(receipts).toEqual([
        { response_status: "success", response_revision: 1, fingerprint_matches: true },
      ]);

      const rpcReplay = await receiptSql<Array<{
        response_status: string;
        replayed: boolean;
      }>>`
        select response_status, replayed
        from public.planner_mutate_plan_v1(
          ${TEST_OWNER_ID}::uuid,
          'create'::text,
          ${TEST_PROJECT_ID}::uuid,
          0::bigint,
          ${idempotencyKey("create")}::text,
          ${boundedFingerprint(createCommand)}::text,
          ${baseProject.name}::text,
          ${JSON.stringify({
            contractVersion: 1,
            schemaVersion: 1,
            geometry: baseProject.geometry,
            sheet: baseProject.sheet,
            layers: baseProject.layers,
          })}::jsonb,
          null::text,
          ${baseProject.status}::text,
          1::integer
        )
      `;
      expect(rpcReplay).toEqual([{ response_status: "success", replayed: true }]);
    } finally {
      await receiptSql.end({ timeout: 5 });
    }

    const replayedCreate = await plannerProjectSupabaseAdapter.mutate(context, createCommand);
    expect(replayedCreate.effect).toBe("none");
    expect(replayedCreate.result).toMatchObject({
      ok: true,
      replayed: true,
      value: { revision: 1 },
    });

    const fingerprintConflict = await plannerProjectSupabaseAdapter.mutate(context, {
      ...createCommand,
      request: saveRequest(
        { ...baseProject, name: "different fingerprint" },
        0,
        idempotencyKey("create"),
      ),
    });
    expect(fingerprintConflict.result).toMatchObject({
      ok: false,
      code: "CONFLICT",
    });

    const savedProject = { ...baseProject, name: "Planner Admin RPC smoke saved" };
    const saved = await plannerProjectSupabaseAdapter.mutate(context, {
      operation: "save",
      projectId: TEST_PROJECT_ID,
      request: saveRequest(savedProject, 1, idempotencyKey("save")),
    });
    expect(saved.effect).toBe("saved");
    expect(saved.result).toMatchObject({
      ok: true,
      value: { revision: 2, name: savedProject.name },
    });

    const staleSave = await plannerProjectSupabaseAdapter.mutate(context, {
      operation: "save",
      projectId: TEST_PROJECT_ID,
      request: saveRequest(
        { ...savedProject, name: "must not overwrite" },
        1,
        idempotencyKey("stale"),
      ),
    });
    expect(staleSave.result).toMatchObject({
      ok: false,
      code: "CONFLICT",
      currentRevision: 2,
    });

    const current = await plannerProjectSupabaseAdapter.load(TEST_OWNER_ID, TEST_PROJECT_ID);
    expect(current).not.toBeNull();
    expect(current).toMatchObject({
      id: TEST_PROJECT_ID,
      name: savedProject.name,
      revision: 2,
    });

    const deleted = await plannerProjectSupabaseAdapter.mutate(context, {
      operation: "delete",
      projectId: TEST_PROJECT_ID,
      expectedRevision: 2,
      idempotencyKey: idempotencyKey("delete"),
    });
    expect(deleted.effect).toBe("deleted");
    expect(deleted.result).toMatchObject({
      ok: true,
      value: { id: TEST_PROJECT_ID, deleted: true },
    });

    const replayedDelete = await plannerProjectSupabaseAdapter.mutate(context, {
      operation: "delete",
      projectId: TEST_PROJECT_ID,
      expectedRevision: 2,
      idempotencyKey: idempotencyKey("delete"),
    });
    expect(replayedDelete.result).toMatchObject({
      ok: true,
      replayed: true,
      value: { id: TEST_PROJECT_ID, deleted: true },
    });

    expect(await plannerProjectSupabaseAdapter.load(TEST_OWNER_ID, TEST_PROJECT_ID)).toBeNull();
    const listed = await plannerProjectSupabaseAdapter.list(TEST_OWNER_ID);
    expect(listed.some((project) => {
      return typeof project === "object" && project !== null &&
        (project as { id?: unknown }).id === TEST_PROJECT_ID;
    })).toBe(false);
  }, 60_000);

  it("matches live Planner RLS, table grants, and RPC execute privileges", async () => {
    const sql = postgres(adminDatabaseUrl, {
      prepare: false,
      ssl: "require",
      max: 1,
    });
    try {
      const rlsRows = await sql<Array<{ table_name: string; rls_enabled: boolean }>>`
        select c.relname as table_name, c.relrowsecurity as rls_enabled
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname in ('oando_plans', 'planner_operation_idempotency')
        order by c.relname
      `;
      expect(rlsRows).toEqual([
        { table_name: "oando_plans", rls_enabled: true },
        { table_name: "planner_operation_idempotency", rls_enabled: true },
      ]);

      const policyRows = await sql<Array<{
        table_name: string;
        policy_name: string;
        qual: string | null;
        with_check: string | null;
      }>>`
        select
          p.polrelid::regclass::text as table_name,
          p.polname as policy_name,
          pg_get_expr(p.polqual, p.polrelid) as qual,
          pg_get_expr(p.polwithcheck, p.polrelid) as with_check
        from pg_policy p
        where p.polrelid in (
          'public.oando_plans'::regclass,
          'public.planner_operation_idempotency'::regclass
        )
          and p.polname in (
            'oando_plans_authenticated_select_own',
            'oando_plans_authenticated_insert_own',
            'oando_plans_authenticated_update_own',
            'oando_plans_authenticated_delete_own',
            'planner_operation_idempotency_authenticated_select_own',
            'planner_operation_idempotency_authenticated_insert_own',
            'planner_operation_idempotency_authenticated_update_own',
            'planner_operation_idempotency_authenticated_delete_own'
          )
        order by table_name, policy_name
      `;
      expect(policyRows).toHaveLength(8);
      for (const policy of policyRows) {
        const expression = `${policy.qual ?? ""} ${policy.with_check ?? ""}`;
        expect(expression).toContain(
          policy.table_name === "oando_plans" ? "auth.uid()" : "auth.uid()",
        );
        expect(expression).not.toContain("is null");
      }

      const privileges = await sql<Array<{
        authenticated_plan_select: boolean;
        authenticated_receipt_select: boolean;
        anon_plan_select: boolean;
        anon_receipt_select: boolean;
        authenticated_rpc_execute: boolean;
        anon_rpc_execute: boolean;
      }>>`
        select
          has_table_privilege('authenticated', 'public.oando_plans', 'SELECT') as authenticated_plan_select,
          has_table_privilege('authenticated', 'public.planner_operation_idempotency', 'SELECT') as authenticated_receipt_select,
          has_table_privilege('anon', 'public.oando_plans', 'SELECT') as anon_plan_select,
          has_table_privilege('anon', 'public.planner_operation_idempotency', 'SELECT') as anon_receipt_select,
          has_function_privilege(
            'authenticated',
            'public.planner_mutate_plan_v1(uuid,text,uuid,bigint,text,text,text,jsonb,text,text,integer)',
            'EXECUTE'
          ) as authenticated_rpc_execute,
          has_function_privilege(
            'anon',
            'public.planner_mutate_plan_v1(uuid,text,uuid,bigint,text,text,text,jsonb,text,text,integer)',
            'EXECUTE'
          ) as anon_rpc_execute
      `;
      expect(privileges).toEqual([
        {
          authenticated_plan_select: true,
          authenticated_receipt_select: true,
          anon_plan_select: false,
          anon_receipt_select: false,
          authenticated_rpc_execute: true,
          anon_rpc_execute: false,
        },
      ]);
    } finally {
      await sql.end({ timeout: 5 });
    }
  }, 30_000);
});

