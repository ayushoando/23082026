import { NextResponse, type NextRequest } from "next/server";
import { PLANNER_GUEST_COOKIE } from "./lib/auth/constants";
import { isDevAuthBypassActiveForRequest } from "./lib/auth/devAuthBypass";
import { isMaintenanceReadonly } from "./lib/platform/maintenanceMode";
import { SITE_URL } from "./lib/siteUrl";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Maintenance policy **A** (browse-only member hubs): only offline these admin
 * shells. `/dashboard` and member `/portal` stay open for browsing; API mutations
 * are fail-closed separately. `/portal/guest` is never offline.
 * Top-level `/crm` and `/ops` are not app routes — short-circuited to admin below.
 */
const MAINTENANCE_OFFLINE_PAGE_PREFIXES = ["/admin"] as const;

/** Product shells that guests may open without a member session. */
const GUEST_PRODUCT_SURFACE_PREFIXES = ["/ooplanner", "/oostudio"] as const;

/**
 * Surfaces that load Fabric (or other eval-using canvas runtimes) in production.
 * Keep this tight — every extra prefix widens script-src 'unsafe-eval'.
 */
const CANVAS_HEAVY_PREFIXES = ["/ooplanner", "/oostudio"] as const;

/**
 * Maintenance read-only: allow mutating methods only on these API prefixes.
 * Everything else under `/api` that uses POST/PUT/PATCH/DELETE returns 503.
 * Keep this list tiny — prefer fail-closed over missing a mutator.
 */
const MAINTENANCE_MUTATION_ALLOW_API_PREFIXES = [
  "/api/log-error", // client crash reports still useful in readonly
] as const;

/**
 * Explicit member/account write prefixes — unauthenticated traffic must never
 * hit these. Fork disk APIs (`/api/Planner`, `/api/Studio`) stay guest-usable
 * at the edge with handler `withAuth({ role: "guest", requireCsrf: true })`.
 */
const MEMBER_ONLY_WRITE_PREFIXES = [
  "/api/plans",
  "/api/admin",
  "/api/customer-queries/manage",
  "/api/theme/manage",
  "/api/exports",
] as const;

/**
 * Full path *segments* (not substrings) that mark member-only write endpoints.
 * Avoids false positives like a slug containing the letters "export".
 */
const MEMBER_ONLY_WRITE_SEGMENTS = new Set([
  "export",
  "exports",
  "import",
  "publish",
  "share",
  "persist",
]);

function pathMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isApiPath(pathname: string): boolean {
  return pathMatchesPrefix(pathname, "/api");
}

/** True when a mutating request may proceed during maintenance readonly. */
export function isMaintenanceMutationAllowed(pathname: string): boolean {
  const p = normalizePathname(pathname);
  return MAINTENANCE_MUTATION_ALLOW_API_PREFIXES.some((prefix) =>
    pathMatchesPrefix(p, prefix),
  );
}

/**
 * Member/account write surfaces — unauthenticated traffic must never hit these.
 * Fork disk APIs (`/api/Planner`, `/api/Studio`) stay guest-usable with handler
 * `withAuth({ role: "guest", requireCsrf: true })` + rate limits.
 */
export function isMemberOnlyWriteApi(pathname: string): boolean {
  const p = normalizePathname(pathname);
  if (MEMBER_ONLY_WRITE_PREFIXES.some((prefix) => pathMatchesPrefix(p, prefix))) {
    return true;
  }
  // Segment match only — never raw includes() on the full path string.
  const segments = p.split("/").filter(Boolean);
  return segments.some((segment) => MEMBER_ONLY_WRITE_SEGMENTS.has(segment));
}

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/** Plan 02 module 5 — apex canonical host; redirect www → apex preserving path. */
export function shouldRedirectWwwToApex(
  hostHeader: string | null,
  siteUrl: string = SITE_URL,
): boolean {
  const host = (hostHeader ?? "").toLowerCase().split(":")[0];
  try {
    const canonical = new URL(siteUrl).hostname.toLowerCase();
    return host === `www.${canonical}`;
  } catch {
    return host.startsWith("www.");
  }
}

/** True for /ooplanner and /oostudio product shells (and nested paths). */
export function isGuestProductSurfacePath(pathname: string): boolean {
  const p = normalizePathname(pathname);
  return GUEST_PRODUCT_SURFACE_PREFIXES.some((prefix) => pathMatchesPrefix(p, prefix));
}

/**
 * Planner guest-pass cookie is only meaningful on planner product paths.
 * (Does not unlock admin/crm/ops — those use isProtectedPath + session cookies.)
 */
export function isPlannerGuestAllowedPath(pathname: string): boolean {
  const p = normalizePathname(pathname);
  return pathMatchesPrefix(p, "/ooplanner");
}

/**
 * True when request looks like guest product traffic (no member session).
 * Cookie + product path are primary; Referer is a weak secondary signal only
 * (server-action block still requires isGuestProductSurfacePath).
 */
export function isGuestProductContext(
  pathname: string,
  hasPlannerGuestPass: boolean,
  referer: string | null,
): boolean {
  if (hasPlannerGuestPass) return true;
  if (isGuestProductSurfacePath(pathname)) return true;
  const ref = referer ?? "";
  return (
    ref.includes("/ooplanner") ||
    ref.includes("/oostudio") ||
    ref.includes("/guest") ||
    ref.includes("/choose-product")
  );
}

/** Fabric planner/studio surfaces need eval at runtime; React Refresh needs it on every route in dev. */
function allowsUnsafeEval(pathname: string): boolean {
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  return isCanvasHeavyPath(pathname);
}

export function isCanvasHeavyPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return CANVAS_HEAVY_PREFIXES.some((prefix) => pathMatchesPrefix(normalized, prefix));
}

/**
 * Third-party script/beacon origins actually mounted by the app
 * (SiteAnalytics → Vercel Analytics / Speed Insights; optional CF beacon;
 * Cloudflare Zaraz GA4 tag → Google Analytics endpoints).
 */
const CSP_ANALYTICS_ORIGINS =
  "https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live https://static.cloudflareinsights.com";

/** Google Analytics 4 collection endpoints (Zaraz GA4 tag beacons). */
const CSP_GA4_ORIGINS =
  "https://www.google-analytics.com https://region1.google-analytics.com https://stats.g.doubleclick.net https://analytics.google.com https://www.google.com";


/** Google Tag Manager / Analytics script origin (mounted when GA measurement ID is present outside test suite). */
function getGtmScriptOrigin(): string {
  if (process.env.NODE_ENV !== "test" && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    return " https://www.googletagmanager.com";
  }
  return "";
}

export type CspBuildOptions = {
  /**
   * Per-request nonce (base64). Stamped on inline / framework script tags.
   * Used as script-src 'nonce-…' with 'self' — **not** strict-dynamic (Next 16
   * webpack does not stamp the nonce on /_next/static/chunks/*).
   */
  nonce?: string;
};

/** Fresh CSP nonce for each document request (PX-S09). */
export function createCspNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

export function buildContentSecurityPolicy(
  pathname: string,
  options: CspBuildOptions = {},
): string {
  // No esm.sh / unpkg / tldraw CDN — not used by live app bundles.
  // No GTM until a real marketing tag is mounted (avoids idle script surface).
  // PX-S09: block bare inline scripts with a per-request nonce.
  // Do not use 'strict-dynamic' here: Next 16 webpack does not stamp that
  // nonce on `/_next/static/chunks/*`, so strict-dynamic disables 'self'
  // and the live console blocks the whole app.
  const noncePart = options.nonce ? `'nonce-${options.nonce}' ` : "";
  const evalPart = allowsUnsafeEval(pathname) ? " 'unsafe-eval'" : "";
  const scriptSrc = `script-src 'self' ${noncePart}${evalPart} blob: ${CSP_ANALYTICS_ORIGINS}${getGtmScriptOrigin()}`;

  return [
    "default-src 'self'",
    scriptSrc,
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' data: https://fonts.googleapis.com",
    // https only — no bare http: images
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' blob: https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.openai.com https://openrouter.ai ${CSP_ANALYTICS_ORIGINS} ${CSP_GA4_ORIGINS}`,
    "frame-src 'self' https://www.google.com https://maps.google.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/**
 * Retired paths short-circuit **before** the auth gate (308 permanent).
 * next.config.js keeps matching 308s for crawlers / non-proxy hits.
 */
const PORTAL_RETIRED_SVG_CATALOG_PREFIX = "/portal/svg-catalog";

/** Guest portal entry + shared guest plan view — no member session required. */
const PORTAL_PUBLIC_GUEST_PREFIX = "/portal/guest";

export function isRetiredPortalSvgCatalogPath(pathname: string): boolean {
  return pathMatchesPrefix(normalizePathname(pathname), PORTAL_RETIRED_SVG_CATALOG_PREFIX);
}

/** Legacy Product Studio URLs under /admin — live app is /oostudio. */
export function isRetiredAdminStudioPath(pathname: string): boolean {
  const p = normalizePathname(pathname);
  return (
    pathMatchesPrefix(p, "/admin/svg-editor") ||
    pathMatchesPrefix(p, "/admin/product-studio")
  );
}

/** Dead top-level CRM/ops shells — canonical CRM is under /admin/crm. */
export function resolveLegacyMemberShellRedirect(
  pathname: string,
): string | null {
  const p = normalizePathname(pathname);
  if (pathMatchesPrefix(p, "/crm")) return "/admin/crm/";
  if (pathMatchesPrefix(p, "/ops")) return "/admin/";
  return null;
}

export function isPublicPortalGuestPath(pathname: string): boolean {
  return pathMatchesPrefix(normalizePathname(pathname), PORTAL_PUBLIC_GUEST_PREFIX);
}

export function isProtectedPath(pathname: string): boolean {
  const normalizedPathname = normalizePathname(pathname);

  // Guest portal shell must stay public so it never hangs behind auth/DB gates.
  if (isPublicPortalGuestPath(normalizedPathname)) {
    return false;
  }

  // Retired admin studio paths are not "login walls" — short-circuited to /oostudio.
  if (isRetiredAdminStudioPath(normalizedPathname)) {
    return false;
  }

  if (
    pathMatchesPrefix(normalizedPathname, "/dashboard") ||
    pathMatchesPrefix(normalizedPathname, "/portal") ||
    pathMatchesPrefix(normalizedPathname, "/admin")
  ) {
    return true;
  }

  return false;
}

/**
 * Fast edge check: Supabase SSR session cookies only.
 * Appwrite `a_session_*` removed (D3) — no longer a trust signal.
 */
export function hasSessionAuthCookies(
  cookies: Array<{ name: string; value: string }>,
): boolean {
  return cookies.some((cookie) => {
    const name = cookie.name;
    return name.startsWith("sb-") && name.includes("auth-token");
  });
}

function applyMaintenanceHeader(response: NextResponse) {
  response.headers.set("x-site-maintenance", "readonly");
  return response;
}

function permanentRedirect(
  request: NextRequest,
  fromPathname: string,
  destPathname: string,
  maintenanceReadonly: boolean,
  nonce: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = destPathname;
  url.search = "";
  return finalizeResponse(
    NextResponse.redirect(url, 308),
    fromPathname,
    maintenanceReadonly,
    nonce,
  );
}

function finalizeResponse(
  response: NextResponse,
  pathname: string,
  maintenanceReadonly: boolean,
  nonce: string,
) {
  const finalized = maintenanceReadonly
    ? applyMaintenanceHeader(response)
    : response;
  return applySecurityHeaders(finalized, pathname, nonce);
}

function applySecurityHeaders(
  response: NextResponse,
  pathname: string,
  nonce: string,
) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(), usb=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  // allow-popups: Supabase/OAuth-style flows; tighten to same-origin only if login never pops.
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");
  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(pathname, { nonce }),
  );
  return response;
}

/**
 * NEXT.JS 16 PROXY
 * Must be named 'proxy' and placed at the root of the project.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const nonce = createCspNonce();
  // 7.1 allowed-host guard: dev bypass unlocks protected paths only for
  // loopback request hosts (or explicit DEV_AUTH_BYPASS_ALLOW_HOSTS entries).
  const devAuthBypass = isDevAuthBypassActiveForRequest(
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      request.headers.get("host") ||
      request.nextUrl.host,
  );
  // Workstation .env often copies prod maintenance=readonly; local dev bypass must
  // still reach /admin for catalog/CRM work (pnpm dev sets DEV_AUTH_BYPASS=1).
  const maintenanceReadonly = isMaintenanceReadonly() && !devAuthBypass;

  if (shouldRedirectWwwToApex(request.headers.get("host"))) {
    const url = request.nextUrl.clone();
    try {
      url.hostname = new URL(SITE_URL).hostname;
    } catch {
      url.hostname = url.hostname.replace(/^www\./i, "");
    }
    return finalizeResponse(NextResponse.redirect(url, 308), pathname, maintenanceReadonly, nonce);
  }

  // Retired paths before auth (308). next.config mirrors SEO permanence.
  if (isRetiredPortalSvgCatalogPath(pathname)) {
    return permanentRedirect(request, pathname, "/products/", maintenanceReadonly, nonce);
  }
  if (isRetiredAdminStudioPath(pathname)) {
    return permanentRedirect(request, pathname, "/oostudio/", maintenanceReadonly, nonce);
  }
  const legacyShellDest = resolveLegacyMemberShellRedirect(pathname);
  if (legacyShellDest) {
    return permanentRedirect(request, pathname, legacyShellDest, maintenanceReadonly, nonce);
  }

  if (maintenanceReadonly) {
    // Policy A: offline admin only — not dashboard/portal (browse-only member hubs).
    if (
      MAINTENANCE_OFFLINE_PAGE_PREFIXES.some((prefix) =>
        pathMatchesPrefix(normalizePathname(pathname), prefix),
      )
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/offline";
      url.searchParams.set("reason", "maintenance");
      return finalizeResponse(NextResponse.redirect(url), pathname, true, nonce);
    }

    // Fail-closed: any API mutation outside the tiny allowlist → 503.
    if (
      WRITE_METHODS.has(request.method) &&
      isApiPath(pathname) &&
      !isMaintenanceMutationAllowed(pathname)
    ) {
      return finalizeResponse(
        NextResponse.json(
          { error: "Service temporarily in read-only maintenance mode." },
          {
            status: 503,
            headers: { "Retry-After": "300" },
          },
        ),
        pathname,
        true,
        nonce,
      );
    }
  }

  const isProtected = isProtectedPath(pathname);
  const hasPlannerGuestPass = request.cookies.has(PLANNER_GUEST_COOKIE);

  // Fast cookie existence check — avoids network calls for anonymous traffic.
  // Session validation still happens in layouts via getOptionalUser().
  // Guest planner cookie never unlocks isProtectedPath pages (admin/crm/ops/…).
  const hasAuthCookies = hasSessionAuthCookies(request.cookies.getAll());

  // Unverified cookie redirect for /access removed (AUTH-LOOP-03):
  // Let /access render so expired/invalid tokens show the sign-in form instead of a 307 loop.
  // Session validation and verified redirects are handled downstream in page components.

  // Short-circuit: no auth cookies on a protected page → /access.
  // Dev bypass (DEV_AUTH_BYPASS=1, non-prod) skips this for local admin work.
  if (!devAuthBypass && !hasAuthCookies && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/access";
    redirectUrl.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return finalizeResponse(
      NextResponse.redirect(redirectUrl),
      pathname,
      maintenanceReadonly,
      nonce,
    );
  }

  // Defense-in-depth: member-only write APIs never for unauthenticated callers.
  // Handler-layer withAuth(member/admin) is the real gate; edge rejects early.
  // Guest product may still use /api/Planner + /api/Studio (handler CSRF + rate limit).
  if (!devAuthBypass && !hasAuthCookies) {
    const isMutationMethod = WRITE_METHODS.has(request.method);
    const isServerAction = request.headers.has("next-action");
    const referer = request.headers.get("referer");
    const guestCtx = isGuestProductContext(pathname, hasPlannerGuestPass, referer);

    if (isMutationMethod && isMemberOnlyWriteApi(pathname)) {
      const response = NextResponse.json(
        {
          error:
            "Authentication required. Guest users cannot perform save, import, export, publish, or share actions.",
        },
        { status: 403 },
      );
      return finalizeResponse(response, pathname, maintenanceReadonly, nonce);
    }

    // Block server actions on guest product shells (page POSTs with next-action).
    if (
      guestCtx &&
      isMutationMethod &&
      isServerAction &&
      isGuestProductSurfacePath(pathname)
    ) {
      const response = NextResponse.json(
        {
          error:
            "Guest users cannot perform save, import, export, publish, or share actions.",
        },
        { status: 403 },
      );
      return finalizeResponse(response, pathname, maintenanceReadonly, nonce);
    }
  }

  // Forward CSP + nonce on the request so Next.js can tag framework scripts
  // during SSR (see next/dist/docs content-security-policy guide).
  const csp = buildContentSecurityPolicy(pathname, { nonce });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("Content-Security-Policy", csp);

  // The actual session validation is handled by getOptionalUser() in session.ts
  // at the page/layout level. The edge proxy just does a fast cookie existence check.
  // Locales are prefixless (`localePrefix: "never"`). HTML locale is NEXT_LOCALE.
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // ── Security Headers ──────────────────────────────────────────────────────
  return finalizeResponse(response, pathname, maintenanceReadonly, nonce);
}

/**
 * Next.js 16 proxy lives at the Next app root (`site/proxy.ts` in this monorepo).
 * Matcher OR-list: any hit runs proxy. Prefer skipping static/platform noise.
 * Locales are prefixless — do not list /hi|/fr|/de|/es here.
 */
export const config = {
  matcher: [
    "/",
    "/api/:path*",
    /*
     * Match all request paths except:
     * - _next (static / image / HMR)
     * - _vercel (platform)
     * - api (covered above)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public static assets (images, fonts, media, source maps, etc.)
     */
    "/((?!_next|_vercel|api|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|otf|eot|css|js|map|json|txt|xml|webmanifest|mp4|webm|pdf|wasm)$).*)",
  ],
};
