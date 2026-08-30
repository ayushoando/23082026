import { createHash } from "node:crypto";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal } from "../../scripts/general/loadEnvLocal.cjs";

loadEnvLocal();

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "undefined";
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
    .join(",")}}`;
}

function boundedFingerprint(command: unknown): string {
  const fingerprint = canonical(command);
  if (Array.from(fingerprint).length <= 256) return fingerprint;
  return createHash("sha256").update(fingerprint, "utf8").digest("hex");
}

async function main(): Promise<void> {
  const databaseUrl = process.env.SUPABASE_AUTH_DATABASE_URL?.trim();
  const adminUrl = process.env.NEXT_ADMIN_SUPABASE_URL?.trim();
  const adminKey = process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim();
  if (!databaseUrl || !adminUrl || !adminKey) {
    throw new Error("Admin database and Supabase credentials are required");
  }

  const ownerId = crypto.randomUUID();
  const projectId = crypto.randomUUID();
  const idempotencyKey = `diagnostic-${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
  const project = {
    id: projectId,
    name: "Planner replay diagnostic",
    status: "draft",
    geometry: {
      contractVersion: 1,
      schemaVersion: 1,
      unit: "mm",
      scalePxPerMm: 0.05,
      geometry: { furniture: [], walls: [], doors: [], windows: [] },
    },
    sheet: { widthMm: 12000, depthMm: 8000 },
    layers: [],
    thumbnailUrl: null,
  };
  const command = {
    operation: "create",
    projectId,
    request: {
      contractVersion: 1,
      project,
      expectedRevision: 0,
      idempotencyKey,
    },
  };
  const fingerprint = boundedFingerprint(command);
  const rpcArgs = {
    p_owner_id: ownerId,
    p_operation: "create",
    p_project_id: projectId,
    p_expected_revision: 0,
    p_idempotency_key: idempotencyKey,
    p_request_fingerprint: fingerprint,
    p_name: project.name,
    p_payload: {
      contractVersion: 1,
      schemaVersion: 1,
      geometry: project.geometry,
      sheet: project.sheet,
      layers: project.layers,
    },
    p_thumbnail_url: null,
    p_status: project.status,
    p_schema_version: 1,
  };
  const sql = postgres(databaseUrl, {
    prepare: false,
    ssl: "require",
    max: 1,
  });
  const admin = createClient(adminUrl, adminKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: profileError } = await admin.from("profiles").upsert(
    { id: ownerId, display_name: ownerId.slice(0, 8) },
    { onConflict: "id" },
  );
  if (profileError) throw new Error(`Profile setup failed: ${profileError.message}`);

  try {
    const first = await admin.rpc("planner_mutate_plan_v1", rpcArgs);
    console.log("first RPC result:", JSON.stringify(first));

    const receiptBefore = await sql<{
      request_fingerprint: string;
      response_status: string;
      fingerprint_length: number;
    }[]>`
      select request_fingerprint, response_status,
             char_length(request_fingerprint)::integer as fingerprint_length
      from public.planner_operation_idempotency
      where owner_id = ${ownerId}
        and operation = 'create'
        and project_id = ${projectId}
        and idempotency_key = ${idempotencyKey}
    `;
    console.log("expected fingerprint:", fingerprint);
    console.log("receipt before replay:", JSON.stringify(receiptBefore));
    console.log(
      "fingerprint equality:",
      receiptBefore[0]?.request_fingerprint === fingerprint,
    );

    const replay = await admin.rpc("planner_mutate_plan_v1", rpcArgs);
    console.log("second RPC result:", JSON.stringify(replay));

    const receiptAfter = await sql<{
      request_fingerprint: string;
      response_status: string;
    }[]>`
      select request_fingerprint, response_status
      from public.planner_operation_idempotency
      where owner_id = ${ownerId}
        and operation = 'create'
        and project_id = ${projectId}
        and idempotency_key = ${idempotencyKey}
    `;
    console.log("receipt after replay:", JSON.stringify(receiptAfter));
  } finally {
    await sql`
      delete from public.planner_operation_idempotency
      where owner_id = ${ownerId}
        and project_id = ${projectId}
    `;
    await sql`
      delete from public.oando_plans
      where user_id = ${ownerId}
        and id = ${projectId}
    `;
    await sql`
      delete from public.profiles
      where id = ${ownerId}
    `;
    await sql.end({ timeout: 5 });
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
