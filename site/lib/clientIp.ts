/**
 * Normalize loopback IPs so rate-limit keys match across `localhost` and `127.0.0.1`.
 * Browser tests must use http://localhost:3000 (AGENTS.md); proxy fallbacks often emit 127.0.0.1.
 */
export function normalizeClientIp(ip: string): string {
  const trimmed = ip.trim().toLowerCase();
  if (trimmed === "127.0.0.1" || trimmed === "::1") {
    return "localhost";
  }
  return ip.trim();
}

/**
 * Resolve the client IP for rate-limit keying from edge/proxy headers.
 *
 * Order (28.17): `cf-connecting-ip` is authoritative when Cloudflare fronts
 * the request (CF overwrites it; a client value cannot survive). Otherwise
 * the platform/proxy-authored `x-forwarded-for` first hop is used, with
 * `x-real-ip` as an extra fallback so non-CF hosts without an XFF still key
 * per-client. The fallback chain intentionally mirrors
 * `getPublicApiIp` (site/app/api/_lib/public.ts) so server actions and REST
 * routes key the same way.
 *
 * NOTE: on a self-hosted reverse proxy that *appends* to client-supplied
 * XFF, the first hop remains client-chosen — fully spoof-proof resolution
 * needs a trusted-proxy allowlist decision at the platform level.
 */
export function resolveClientIpFromHeaders(headerStore: Headers): string {
  const raw =
    headerStore.get("cf-connecting-ip") ||
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip")?.trim() ||
    "127.0.0.1";
  return normalizeClientIp(raw);
}
