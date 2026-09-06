/** Preferred public host. www is a duplicate and must 308 here. */
export function apexRedirectLocation(requestUrl) {
  const url = typeof requestUrl === "string" ? new URL(requestUrl) : requestUrl;
  const host = url.hostname.toLowerCase();
  if (host === "oando.in" || host.endsWith(".oando.in")) {
    const apex = new URL(url.toString());
    apex.hostname = "oando.co.in";
    apex.protocol = "https:";
    return apex.toString();
  }
  if (!host.startsWith("www.")) {
    return null;
  }
  const apex = new URL(url.toString());
  apex.hostname = host.slice(4);
  apex.protocol = "https:";
  return apex.toString();
}

const PRIVATE_PREFIXES = [
  "/api/",
  "/admin/",
  "/ooplanner/",
  "/oostudio/",
  "/portal/",
  "/dashboard/",
  "/login/",
  "/access/",
];

export function requestHasSessionCookie(cookieHeader) {
  if (!cookieHeader) return false;
  // Supabase SSR splits larger sessions into `.0`, `.1`, etc. cookies. Those
  // chunks are authenticated requests too and must never enter the public cache.
  return /(?:^|;\s*)sb-[^=;\s]+-auth-token(?:\.\d+)?=/.test(cookieHeader);
}

export function pathIsPrivate(pathname) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const trimmed = normalized.replace(/\/+$/, "") || "/";
  if (
    PRIVATE_PREFIXES.some(
      (prefix) => trimmed === prefix.slice(0, -1) || normalized.startsWith(prefix),
    )
  ) {
    return true;
  }
  return false;
}

export function shouldCacheResponse({
  method,
  pathname,
  cookieHeader,
  status,
  setCookie,
}) {
  if (method !== "GET" && method !== "HEAD") return false;
  if (status !== 200) return false;
  if (setCookie) return false;
  if (requestHasSessionCookie(cookieHeader)) return false;
  if (pathIsPrivate(pathname)) return false;
  return true;
}

export function cacheControlForPath(pathname) {
  if (pathname.startsWith("/_next/static/")) {
    return "public, max-age=31536000, immutable";
  }
  return "public, s-maxage=300, stale-while-revalidate=3600";
}

