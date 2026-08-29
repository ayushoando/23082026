export const PLANNER_ITEM_OWNER_POLICY = "non-disclosing-not-found" as const;

/**
 * Keys that a client payload might use to supply an owner identifier.
 * The pipeline rejects or ignores all of them in favor of the server session.
 */
export const CLIENT_OWNER_IDENTIFIER_KEYS = [
  "user_id",
  "userId",
  "ownerId",
  "owner_id",
  "owner",
] as const;

export interface PlannerVerifiedOwnerSession {
  readonly ownerId: string;
}

export interface PlannerOwnedRecord {
  readonly ownerId: string;
}

export interface PlannerOwnerScope {
  readonly ownerId: string;
  readonly source: "verified-server-session";
}

// ---------------------------------------------------------------------------
// Session-expiry handoff contract — typed for workstream 3 UI consumption
// ---------------------------------------------------------------------------

/**
 * Recovery hint returned as part of 401 responses when the session expires.
 * Workstream 3 UI components match this literal to trigger unsaved-state
 * preservation and reauthentication flow.
 */
export const PLANNER_SESSION_EXPIRY_RECOVERY =
  "reauthenticate-preserve-unsaved" as const;

export type PlannerSessionExpiryRecovery =
  typeof PLANNER_SESSION_EXPIRY_RECOVERY;

/**
 * Typed contract consumed by workstream 3 UI for session-expiry handling.
 *
 * When the API returns 401 with this recovery hint, the UI must:
 * 1. Preserve unsaved in-memory project state (do not discard edits).
 * 2. Present a reauthentication prompt.
 * 3. On successful reauth, allow the user to retry the failed operation.
 * 4. On reauth cancellation, keep the unsaved state available.
 */
export interface PlannerSessionExpiryHandoff {
  /** The error code from the API response. */
  readonly code: "AUTH_REQUIRED";
  /** The recovery action the UI must take. */
  readonly recovery: PlannerSessionExpiryRecovery;
  /** The correlation ID for the failed request. */
  readonly correlationId: string;
}

/**
 * Type guard for detecting a session-expiry response in the UI layer.
 * Workstream 3 uses this to distinguish session expiry from other auth failures.
 */
export function isPlannerSessionExpiryResponse(
  response: Readonly<{ code?: string; recovery?: string }>,
): response is PlannerSessionExpiryHandoff {
  return (
    response.code === "AUTH_REQUIRED" &&
    response.recovery === PLANNER_SESSION_EXPIRY_RECOVERY
  );
}

// ---------------------------------------------------------------------------
// Owner scope derivation — server session only
// ---------------------------------------------------------------------------

/** Client payloads are deliberately absent: only a verified session can create scope. */
export function derivePlannerOwnerScope(
  session: PlannerVerifiedOwnerSession,
): PlannerOwnerScope {
  return {
    ownerId: session.ownerId,
    source: "verified-server-session",
  };
}

// ---------------------------------------------------------------------------
// Client-supplied owner identifier rejection (Req 10.7)
// ---------------------------------------------------------------------------

/**
 * Checks whether a request body/payload contains any client-supplied owner
 * identifier. These must be rejected or ignored — owner scope is always
 * derived from the verified server session.
 *
 * Returns the list of offending key names, or an empty array if none found.
 */
export function detectClientOwnerIdentifiers(
  body: unknown,
): readonly string[] {
  if (!body || typeof body !== "object" || Array.isArray(body)) return [];
  const record = body as Record<string, unknown>;
  return CLIENT_OWNER_IDENTIFIER_KEYS.filter(
    (key) => record[key] !== undefined && record[key] !== null,
  );
}

// ---------------------------------------------------------------------------
// Owner-scoped record filtering
// ---------------------------------------------------------------------------

export function listPlannerOwnedRecords<TRecord extends PlannerOwnedRecord>(
  records: readonly TRecord[],
  scope: PlannerOwnerScope,
): TRecord[] {
  return records.filter((record) => record.ownerId === scope.ownerId);
}

/** A miss and a cross-owner item are intentionally indistinguishable. */
export function findPlannerOwnedRecord<TRecord extends PlannerOwnedRecord>(
  records: readonly TRecord[],
  id: string,
  scope: PlannerOwnerScope,
  getId: (record: TRecord) => string,
): TRecord | null {
  return (
    records.find(
      (record) => record.ownerId === scope.ownerId && getId(record) === id,
    ) ?? null
  );
}
