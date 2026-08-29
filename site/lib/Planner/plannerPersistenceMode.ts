/**
 * Planner project persistence — exclusive mode (never dual-write).
 *
 * Mode rules (Requirements 12.1–12.8):
 * - `DEV_AUTH_BYPASS=1` AND `NODE_ENV !== "production"` → **disk only**
 * - `DEV_AUTH_BYPASS` inactive OR absent → **Admin Supabase only** (`oando_plans`)
 * - `NODE_ENV === "production"` → **Admin Supabase only**, regardless of bypass flag
 * - Invalid or ambiguous configuration → **reject** (no adapter call)
 * - Selected adapter failure → **report** (never fallback-write to the other backend)
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

/**
 * Reject any DEV_AUTH_BYPASS value that is not exactly "0", "1", empty, or absent.
 * This prevents ambiguous configuration from silently selecting an unintended backend.
 */
function assertUnambiguousBypassFlag(env: NodeJS.ProcessEnv): void {
  const value = env.DEV_AUTH_BYPASS;
  if (value !== undefined && value !== "" && value !== "0" && value !== "1") {
    throw new PlannerPersistenceConfigurationError(
      "DEV_AUTH_BYPASS must be unset, empty, '0', or '1' for Planner persistence; " +
        `received '${String(value).slice(0, 20)}'`,
    );
  }
}

/**
 * Production safety: disk mode is never valid in production. Even if bypass
 * flag handling changes, this explicit post-selection guard prevents a
 * production filesystem write. (Requirement 12.1, 12.3, 12.7)
 */
function assertNoDiskInProduction(
  mode: PlannerPersistenceMode,
  env: NodeJS.ProcessEnv,
): void {
  if (mode === "disk" && env.NODE_ENV === "production") {
    throw new PlannerPersistenceConfigurationError(
      "Planner disk persistence is not permitted in production (production FS is read-only)",
    );
  }
}

/**
 * Select the exclusive persistence mode for the current runtime.
 * Throws PlannerPersistenceConfigurationError for ambiguous configuration.
 */
export function getPlannerPersistenceMode(
  env: NodeJS.ProcessEnv = process.env,
): PlannerPersistenceMode {
  assertUnambiguousBypassFlag(env);
  if (env.NODE_ENV !== "production" && isDevAuthBypassEnabled(env)) {
    return "disk";
  }
  return "supabase";
}

/**
 * Validate that the selected mode is fully configured for the current runtime.
 * Production always requires Supabase credentials; disk is self-contained.
 */
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

export interface PlannerContextualPersistenceOperations<TContext, TResult> {
  disk: (context: TContext) => Promise<TResult>;
  supabase: (context: TContext) => Promise<TResult>;
}

/**
 * Assert that the selected mode has all required runtime credentials/config.
 * Supabase mode requires both URL and service role key.
 */
function assertSelectedModeConfigured(
  mode: PlannerPersistenceMode,
  env: NodeJS.ProcessEnv,
): void {
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
}

/**
 * Resolve and validate the persistence mode for one operation. The returned mode
 * is the single backend that will be called; no other backend is tried regardless
 * of outcome. (Requirements 12.4, 12.5, 12.6, 12.8)
 */
function resolveExclusiveMode(env: NodeJS.ProcessEnv): PlannerPersistenceMode {
  const mode = getPlannerPersistenceMode(env);
  assertNoDiskInProduction(mode, env);
  assertSelectedModeConfigured(mode, env);
  return mode;
}

/**
 * Select exactly one backend for an operation. The selected adapter's result
 * or failure is returned directly — the other backend is never consulted.
 */
export async function runPlannerPersistenceOperation<T>(
  operations: PlannerPersistenceOperations<T>,
  env: NodeJS.ProcessEnv = process.env,
): Promise<T> {
  const mode = resolveExclusiveMode(env);
  return operations[mode]();
}

/**
 * Pass verified owner/correlation context to exactly one selected adapter.
 * Selected-adapter failures propagate directly; the non-selected adapter
 * is never invoked as a fallback. (Requirements 12.4–12.8, 17.4)
 */
export async function runContextualPlannerPersistenceOperation<TContext, TResult>(
  context: TContext,
  operations: PlannerContextualPersistenceOperations<TContext, TResult>,
  env: NodeJS.ProcessEnv = process.env,
): Promise<TResult> {
  const mode = resolveExclusiveMode(env);
  return operations[mode](context);
}

/**
 * Returns the resolved persistence mode as a string label for observability
 * and structured event context. Throws on ambiguous configuration.
 */
export function getPlannerPersistenceModeLabel(
  env: NodeJS.ProcessEnv = process.env,
): "disk" | "supabase" {
  return getPlannerPersistenceMode(env);
}
