import "server-only";

import { insertEvent } from "@/lib/audit/auditRepository";

/**
 * Fire-and-forget admin action audit log entry.
 * Never throws — errors are swallowed so audit logging never blocks the response.
 *
 * @param actorId  Supabase user id of the acting admin (auth.user.id from withAuth).
 * @param action   Verb string: "catalog:create", "catalog:update", "catalog:delete",
 *                 "feature_flag:update", "theme:publish", "plan:status_change", etc.
 * @param target   Logical target identifier (item id, flag name, theme name…).
 * @param metadata Optional extra context (type, old/new values, etc.).
 */
export async function logAdminAction(
  actorId: string,
  action: string,
  target: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await insertEvent({
      team_id: "admin",
      actor_id: actorId.slice(0, 120),
      action,
      target_type: target ? action.split(":")[0] ?? null : null,
      target_id: target,
      metadata: metadata ?? {},
    });
  } catch {
    // Audit logging must never break the primary action.
  }
}
