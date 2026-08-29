/**
 * Planner project persistence — exclusive mode (never dual-write).
 *
 * - `DEV_AUTH_BYPASS=1` + non-production → **disk only** (`pnpm run dev`)
 * - otherwise → **admin Supabase only** (`public.oando_plans`)
 *
 * R2 is backup/ops only — not a live write path.
 */

import { isDevAuthBypassEnabled } from "@/lib/auth/devAuthBypass";

export type PlannerPersistenceMode = "disk" | "supabase";

export class PlannerPersistenceConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlannerPersistenceConfigurationError";
  }
}

function assertUnambiguousBypassFlag(env: NodeJS.ProcessEnv): void {
  const value = env.DEV_AUTH_BYPASS;
  if (value !== undefined && value !== "" && value !== "0" && value !== "1") {
    throw new PlannerPersistenceConfigurationError(
      "DEV_AUTH_BYPASS must be unset, 0, or 1 for Planner persistence",
    );
  }
}

export function getPlannerPersistenceMode(
  env: NodeJS.ProcessEnv = process.env,
): PlannerPersistenceMode {
  assertUnambiguousBypassFlag(env);
  if (env.NODE_ENV !== "production" && isDevAuthBypassEnabled(env)) {
    return "disk";
  }
  return "supabase";
}

/** Whether the active exclusive mode can serve traffic. */
export function isPlannerPersistenceConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const mode = getPlannerPersistenceMode(env);
  if (mode === "disk") return true;
  return Boolean(
    env.NEXT_ADMIN_SUPABASE_URL?.trim() &&
      env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim(),
  );
}

export interface PlannerPersistenceOperations<T> {
  disk: () => Promise<T>;
  supabase: () => Promise<T>;
}

/** Select exactly one backend for an operation. Selected failures are never retried elsewhere. */
export async function runPlannerPersistenceOperation<T>(
  operations: PlannerPersistenceOperations<T>,
  env: NodeJS.ProcessEnv = process.env,
): Promise<T> {
  const mode = getPlannerPersistenceMode(env);
  if (
    mode === "supabase" &&
    !(
      env.NEXT_ADMIN_SUPABASE_URL?.trim() &&
      env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim()
    )
  ) {
    throw new PlannerPersistenceConfigurationError(
      "Planner Supabase mode requires NEXT_ADMIN_SUPABASE_URL and SUPABASE_ADMIN_SERVICE_ROLE_KEY",
    );
  }
  return operations[mode]();
}
