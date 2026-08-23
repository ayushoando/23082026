/** Preferred public host. www is a duplicate and must 308 here. */
export function apexRedirectLocation(requestUrl) {
  const url = typeof requestUrl === "string" ? new URL(requestUrl) : requestUrl;
  const host = url.hostname.toLowerCase();
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
  return /(?:^|;\s*)sb-[^=;\s]+-auth-token=/.test(cookieHeader);
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

export function cfCacheTtlForPath(pathname) {
  if (pathname.startsWith("/_next/static/")) {
    return 31536000;
  }
  return 300;
}
