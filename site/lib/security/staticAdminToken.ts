import { createHash, timingSafeEqual } from "crypto";

/**
 * SEC-R07 — deprecated static admin-token fallback for operational endpoints.
 *
 * Session auth (isAppAdmin) is the supported path. The static token remains
 * only while external consumers migrate; it sunsets on the date below, after
 * which token fallback is removed from the accepting routes.
 *
 * Rotation support: `CUSTOMER_QUERIES_ADMIN_TOKENS` (comma-separated) lets a
 * new token be published alongside the old one during rotation. The legacy
 * single-value `CUSTOMER_QUERIES_ADMIN_TOKEN` remains accepted.
 */

export const STATIC_ADMIN_TOKEN_SUNSET = "2026-12-01";

type EnvLike = Record<string, string | undefined>;

/** Accepted static tokens, newest first. Empty when the fallback is disabled. */
export function acceptedStaticAdminTokens(
  env: EnvLike = process.env,
): string[] {
  const list = env.CUSTOMER_QUERIES_ADMIN_TOKENS?.trim();
  if (list) {
    return list
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean);
  }
  const single = env.CUSTOMER_QUERIES_ADMIN_TOKEN?.trim();
  return single ? [single] : [];
}

/** Timing-safe match against any accepted token. */
export function matchesStaticAdminToken(
  provided: string,
  accepted: readonly string[],
): boolean {
  const providedBytes = Buffer.from(provided);
  return accepted.some((token) => {
    const tokenBytes = Buffer.from(token);
    if (providedBytes.length !== tokenBytes.length) {
      return false;
    }
    return timingSafeEqual(providedBytes, tokenBytes);
  });
}

/** Non-secret fingerprint used to identify remaining consumers in logs. */
export function staticAdminTokenFingerprint(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 8);
}

const warnedFingerprints = new Set<string>();

/**
 * Deprecation warning, logged once per distinct token per process so
 * operators can enumerate remaining consumers without log spam. Never
 * includes the token itself.
 */
export function warnStaticAdminTokenUsage(scope: string, token: string): void {
  const fingerprint = staticAdminTokenFingerprint(token);
  if (warnedFingerprints.has(fingerprint)) {
    return;
  }
  warnedFingerprints.add(fingerprint);
  console.warn(
    `[SEC-R07] ${scope}: static admin-token fallback used (token ${fingerprint}). ` +
      `This path is deprecated and will be removed on ${STATIC_ADMIN_TOKEN_SUNSET}; ` +
      `migrate the consumer to Supabase session auth.`,
  );
}

/** Test helper: reset the once-per-token warning suppression. */
export function resetStaticAdminTokenWarnings(): void {
  warnedFingerprints.clear();
}
