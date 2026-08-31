/**
 * Browser-origin checks for public mutators (no session cookie CSRF).
 * Allows same-host requests and rejects unexpected cross-site POSTs.
 */

function parseOrigin(value: string | null): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * True when Origin/Referer matches the request host.
 *
 * Missing Origin+Referer is allowed in non-production (curl, unit tests,
 * server-to-server calls in dev) but fails closed in production: a fetch/XHR
 * POST from a real browser always carries Origin, so an unauthenticated
 * mutation with neither header in production is treated as untrusted
 * (SEC-H03 — previously allowed unconditionally).
 */
export function isAllowedBrowserOrigin(
  req: {
    headers: { get(name: string): string | null };
    nextUrl?: { origin: string };
    url?: string;
  },
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const originHeader = req.headers.get("origin");
  const refererHeader = req.headers.get("referer");

  if (!originHeader && !refererHeader) {
    return env.NODE_ENV !== "production";
  }

  let requestOrigin: string;
  try {
    requestOrigin =
      req.nextUrl?.origin ??
      new URL(req.url ?? "http://localhost").origin;
  } catch {
    return false;
  }

  const origin = parseOrigin(originHeader);
  if (origin) {
    return origin.origin === requestOrigin;
  }

  const referer = parseOrigin(refererHeader);
  if (referer) {
    return referer.origin === requestOrigin;
  }

  return false;
}
