# SEO & Security Remedy Plan

**Date:** 2026-08-31
**Priority:** Ordered by severity and impact
**Estimated total effort:** ~40-60 hours across 4 waves

---

## Wave 1: Critical Security (Week 1) — Est. 12-16 hours

### SEC-R01: Add Next.js Middleware for Defense-in-Depth Auth

**Finding:** SEC-C01 — No middleware.ts exists
**Priority:** P0 — Critical
**Effort:** 4-6 hours
**Owner:** Core team
**Risk if skipped:** Any new route added without `withAuth` is silently public

**Approach:**

Create `site/middleware.ts` that enforces route-level access control as a first gate:

```typescript
// site/middleware.ts
import { NextResponse, type NextRequest } from "next/server";

// Routes that require authentication at the middleware level
const PROTECTED_PREFIXES = [
  "/admin",
  "/api/admin",
  "/api/Studio",
  "/api/Planner",
  "/api/plans",
  "/api/audit",
  "/api/exports",
  "/api/files/exports",
  "/api/files/projects",
  "/api/files/uploads",
  "/oostudio",
  "/ooplanner",
  "/dashboard",
  "/crm",
  "/ops",
];

// Routes that are always public (no middleware auth check)
const PUBLIC_PREFIXES = [
  "/api/health",
  "/api/csrf",
  "/api/route",
  "/api/products",
  "/api/categories",
  "/api/nav-",
  "/api/filter",
  "/api/business-stats",
  "/api/theme/active",
  "/api/customer-queries",
  "/api/tracking",
  "/api/log-error",
  "/api/generate-alt",
  "/api/files/catalog",
  "/_next",
  "/favicon",
  "/icon",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes: pass through
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Protected routes: check for session cookie
  if (isProtectedRoute(pathname)) {
    const hasSession =
      request.cookies.has("sb-rxzpznmxbaoxpikowmfc-auth-token") ||
      request.cookies.has("sb-rxzpznmxbaoxpikowmfc-auth-token.0");

    // Dev bypass
    if (process.env.NODE_ENV !== "production" &&
        process.env.DEV_AUTH_BYPASS === "1") {
      return NextResponse.next();
    }

    if (!hasSession) {
      // API routes: return 401
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "AUTH_REQUIRED", message: "Authentication required" },
          { status: 401 }
        );
      }
      // Page routes: redirect to login
      const url = request.nextUrl.clone();
      url.pathname = "/access";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|site.webmanifest|assets).*)",
  ],
};
```

**Implementation steps:**
1. Create `site/middleware.ts` with the pattern above
2. Read Next.js 16 middleware docs from `node_modules/next/dist/docs/` before implementation
3. Verify with `pnpm run typecheck`
4. Test: existing auth still works, public routes remain accessible, protected routes redirect
5. Run `pnpm run test:audit:api-routes` to cross-check

**Important:** This is defense-in-depth only. The existing `withAuth` per-route guards remain the primary auth layer. Middleware provides a fast-rejection first gate.

---

### SEC-R02: Add Content Security Policy to HTML Pages

**Finding:** SEC-C02 — No CSP on HTML pages
**Priority:** P0 — Critical
**Effort:** 4-6 hours
**Owner:** Core team

**Approach:**

Add CSP headers to the site's HTML responses in `next.config.js`. Use the existing nonce infrastructure in `site/app/(site)/layout.tsx`.

**Step 1:** Add CSP header to `config/build/next.config.js` `headers()`:

```javascript
{
  source: "/((?!api/).*)",  // All non-API routes
  headers: [
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        "script-src 'self' 'nonce-{NONCE}' https://va.vercel-scripts.com",
        "style-src 'self' 'unsafe-inline'",  // Tailwind needs inline styles
        "img-src 'self' data: blob: https://oando.co.in https://*.supabase.co",
        "font-src 'self'",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai",
        "frame-ancestors 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ].join("; "),
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-Frame-Options",
      value: "SAMEORIGIN",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
  ],
},
```

**Step 2:** Since Next.js doesn't support nonce substitution in static headers, implement CSP via the middleware created in SEC-R01 using the nonce from the layout:

```typescript
// In middleware.ts, add response headers
const nonce = crypto.randomUUID();
const response = NextResponse.next();
response.headers.set("x-nonce", nonce);
response.headers.set("Content-Security-Policy",
  `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://va.vercel-scripts.com; ...`
);
```

**Step 3:** Verify the layout's `getRequestNonce()` reads the nonce from the middleware's header.

**Implementation steps:**
1. Add CSP headers to middleware (not next.config.js — nonce requires per-request generation)
2. Test locally that all pages render without CSP violations
3. Start in report-only mode: `Content-Security-Policy-Report-Only` header
4. Monitor for violations for 1 week
5. Switch to enforcement mode
6. Run `pnpm run gate:fast` to verify no regressions

---

### SEC-R03: Add Rate Limiting to File Serving Routes

**Finding:** SEC-H01 + SEC-H04 — File routes lack auth and rate limiting
**Priority:** P1 — High
**Effort:** 2-3 hours
**Owner:** Core team

**Approach:**

Add `enforcePublicApiRateLimit` to all file serving routes:

```typescript
// site/app/api/files/catalog/[...path]/route.ts
import { enforcePublicApiRateLimit } from "@/app/api/_lib/public";

export async function GET(request: Request, context: Ctx) {
  const rateError = await enforcePublicApiRateLimit(request, "files-catalog:get", 60);
  if (rateError) return rateError;

  // ... existing logic
}
```

**Apply to:**
- `site/app/api/files/catalog/[...path]/route.ts` — 60 req/min (public catalog assets)
- `site/app/api/files/exports/[filename]/route.ts` — 20 req/min (verify auth exists)
- `site/app/api/files/furniture/[filename]/route.ts` — 20 req/min (verify auth exists)
- `site/app/api/files/projects/[filename]/route.ts` — 20 req/min (verify auth exists)
- `site/app/api/files/uploads/[filename]/route.ts` — 20 req/min (verify auth exists)

Also verify path traversal safety in `readCatalogAssetBytes`.

---

### SEC-R04: Secure Metrics Endpoint

**Finding:** SEC-H02 — Metrics endpoint has no auth when enabled
**Priority:** P1 — High
**Effort:** 1-2 hours
**Owner:** Core team

**Approach:**

Add token-based auth or restrict to internal network:

```typescript
// site/app/api/metrics/route.ts
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production" &&
      process.env.OBSERVABILITY_METRICS_ENABLED !== "1") {
    return new Response("Not Found", { status: 404 });
  }

  // Add auth: Bearer token or internal-only check
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.METRICS_AUTH_TOKEN;
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // ... existing logic
}
```

Add `METRICS_AUTH_TOKEN` to `.env.example`.

---

## Wave 2: High Security + Critical SEO (Week 2) — Est. 10-14 hours

### SEC-R05: Tighten Origin Check

**Finding:** SEC-H03 — Origin check allows missing headers
**Priority:** P1 — High
**Effort:** 2 hours

**Approach:**

Modify `isAllowedBrowserOrigin` to reject when both headers are missing in production:

```typescript
export function isAllowedBrowserOrigin(req, options?: { allowMissing?: boolean }): boolean {
  const originHeader = req.headers.get("origin");
  const refererHeader = req.headers.get("referer");

  if (!originHeader && !refererHeader) {
    // In production, require at least one header for browser requests
    if (options?.allowMissing === true) return true;
    if (process.env.NODE_ENV === "production") return false;
    return true; // Dev: allow for curl/tests
  }
  // ... rest unchanged
}
```

Update call sites to pass `{ allowMissing: true }` only for routes that intentionally accept server-to-server requests.

---

### SEO-R01: Fix 59 Pages Returning 404

**Finding:** SEO-C01 — 59 not-found URLs in Google Search Console
**Priority:** P0 — Critical
**Effort:** 4-6 hours

**Step 1: Identify the 404 URLs**
- Request full URL list from Google Search Console → Page Indexing → "Not found (404)" drill-down
- Alternatively, run a site crawl with Screaming Frog or `pnpm run audit:site-pages`

**Step 2: Categorize and fix**

| Category | Fix |
|---|---|
| Old product URLs with changed slugs | Add redirects in `next.config.js` redirects() |
| Deleted content pages | Add redirects to closest relevant page |
| External backlinks to wrong URLs | Add redirects; request link updates if possible |
| Sitemap including dead URLs | Fix sitemap generation to exclude stale entries |
| Dynamic product URLs for deleted products | Ensure `buildProductStaticParams()` excludes unlisted products |

**Step 3: Submit fixed URLs for revalidation in Google Search Console**

**Step 4: Set up a monitoring script** to periodically check all sitemap URLs return 200:
```bash
# Add to package.json scripts
"audit:sitemap-health": "node scripts/general/audit-sitemap-health.mjs"
```

---

### SEO-R02: Review 47 Robots-Blocked Pages

**Finding:** SEO-C02 — 47 pages blocked by robots.txt
**Priority:** P1 — High
**Effort:** 2 hours

**Step 1:** Get the full URL list from Google Search Console

**Step 2:** Cross-reference against `ROBOTS_DISALLOW_PREFIXES`:
- If URLs match disallowed prefixes (admin, API, app shells) → Expected, no action
- If URLs are public-facing content pages → Fix immediately by either:
  - Removing the prefix from `ROBOTS_DISALLOW_PREFIXES`
  - Adding a more specific `allow` rule

**Step 3:** Check for internal links pointing to blocked pages. If the site links to admin URLs from public pages, those links should be removed or nofollow'd.

**Step 4:** If all 47 are correctly blocked, the finding is informational. Remove them from the sitemap if present, and use `noindex` meta tags as belt-and-suspenders.

---

### SEO-R03: Resolve 22 Redirect Issues

**Finding:** SEO-C03 — 22 pages with redirect problems
**Priority:** P1 — Medium
**Effort:** 2-3 hours

**Step 1:** Get the full URL list from Google Search Console

**Step 2:** Test each URL with:
```bash
curl -I -L "https://oando.co.in/problematic-url"
```
Look for:
- Redirect chains (>1 hop) → Collapse to single redirect
- Redirect loops → Fix destination
- Mixed HTTP/HTTPS redirects → Ensure all redirects go to HTTPS
- Redirects to 404 → Fix destination

**Step 3:** Fix in `config/build/next.config.js` `redirects()` or add new entries.

**Step 4:** The Cloudflare Worker www→apex redirect should be tested separately:
```bash
curl -I "https://www.oando.co.in/some-page"
# Should 308 to https://oando.co.in/some-page (single hop)
```

---

## Wave 3: Medium Issues (Week 3-4) — Est. 12-16 hours

### SEO-R04: Fix 18 Crawled-but-Not-Indexed Pages

**Finding:** SEO-C04 — Content quality issues
**Priority:** P2 — Medium
**Effort:** 4-6 hours

**Step 1:** Identify the 18 URLs from Google Search Console

**Step 2:** For each page, assess:

| Issue | Fix |
|---|---|
| Thin content (<300 words) | Add meaningful unique content |
| Duplicate/near-duplicate | Set canonical to the primary version; noindex the duplicate |
| Empty product categories | Add category descriptions, related products, FAQs |
| JS-heavy pages Googlebot can't render | Add static SSR content; verify with `site:oando.co.in/path` |
| Paginated content | Implement proper rel=prev/next or consolidate |

**Step 3:** For category pages that are thin:
- The `buildFaqJsonLd()` on category pages is good — ensure every category has FAQ content
- Add category descriptions with keyword-rich text
- Ensure at least 3-5 products per category page

**Step 4:** Resubmit URLs via Google Search Console → URL Inspection → Request Indexing

---

### SEO-R05: Fix 3 Soft 404 Pages

**Finding:** SEO-C05 — Pages returning 200 but looking like error pages
**Priority:** P2 — Medium
**Effort:** 2 hours

**Step 1:** Identify the 3 URLs from Google Search Console

**Step 2:** For each page:
- Check if it renders empty state (no products, no content)
- If legitimately empty: return actual 404 status (use `notFound()` from `next/navigation`)
- If should have content: fix the data loading issue

**Step 3:** Add a check in page components:
```typescript
// In product listing pages
if (products.length === 0) {
  notFound(); // Returns real 404, not soft 404
}
```

---

### SEC-R06: Define CORS Policy

**Finding:** SEC-M01 — No CORS headers on API routes
**Priority:** P2 — Medium
**Effort:** 2-3 hours

**Approach:** If cross-origin access is not needed (current state), add explicit `Access-Control-Allow-Origin: same-origin` headers. If future mobile apps or third-party integrations need CORS:

```typescript
// site/app/api/_lib/cors.ts
const ALLOWED_ORIGINS = new Set([
  "https://oando.co.in",
  "http://localhost:3000",
]);

export function corsHeaders(origin: string | null): HeadersInit {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}
```

---

### SEC-R07: Deprecate Static Admin Token

**Finding:** SEC-M02 — Static token auth fallback
**Priority:** P2 — Medium
**Effort:** 2 hours

**Approach:**
1. Add a deprecation warning log when token auth is used
2. Set a deadline to remove token fallback (e.g., 2026-12-01)
3. Migrate any external consumers to Supabase session auth
4. Add token rotation support if the token must stay

---

### SEC-R08: Use Anon Key for Public Tracking

**Finding:** SEC-M03 — Tracking route uses service role key for anonymous users
**Priority:** P2 — Medium
**Effort:** 3-4 hours

**Approach:**

Create the `user_viewed_products` table with RLS policies that allow anonymous writes (using `anon` key) scoped to the anonymous user's ID:

```sql
-- RLS policy for user_viewed_products
CREATE POLICY "Users can manage their own viewing history"
ON user_viewed_products
FOR ALL
USING (user_id = auth.uid() OR user_id = current_setting('request.jwt.claims', true)::json->>'sub')
WITH CHECK (user_id = auth.uid() OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');
```

Then switch from `createSupabaseAuthAdminClient()` to `createAuthServerClient()` (anon key) in the tracking route.

---

### SEC-R09: Add Content-Length Pre-Check for Uploads

**Finding:** SEC-M05 — Upload size validated after parsing
**Priority:** P3 — Low
**Effort:** 1 hour

**Approach:**

Add a content-length header check before parsing the multipart body:

```typescript
// In upload route handlers
const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
if (contentLength > MAX_MULTIPART_UPLOAD_BYTES) {
  return error(ApiError.fromCode(API_ERROR_CODES.VALIDATION_ERROR, "File too large"));
}
```

---

## Wave 4: SEO Growth + Monitoring (Ongoing) — Est. 8-12 hours

### SEO-R06: Investigate Jun 6-9 Indexing Crash

**Priority:** P1 — Important for prevention
**Effort:** 2-3 hours

**Steps:**
1. Check Vercel deploy logs for Jun 6-9 period — was there a bad deploy?
2. Check Cloudflare Worker logs — did X-Robots-Tag logic break?
3. Check Google Search Console → Security & Manual Actions for any penalties
4. Review git history for changes deployed around Jun 6
5. Document the root cause in `Failures.md` to prevent recurrence

---

### SEO-R07: Enable Image Optimization (Cost Analysis)

**Priority:** P2 — Medium impact on Core Web Vitals
**Effort:** 4-6 hours

**Options:**

| Option | Cost | Impact |
|---|---|---|
| **A: Vercel Image Optimization** | ~$5/1000 optimizations | Best integration, automatic |
| **B: Cloudflare Image Resizing** | Included in Pro plan | Good, Worker already handles assets |
| **C: Pre-optimize at build/upload** | Free (one-time script cost) | Good for static assets, no runtime cost |
| **D: Self-hosted Sharp** | Free (CPU cost) | Complex, needs server resources |

**Recommendation:** Option C for catalog images (pre-optimize to AVIF/WebP at upload via R2 pipeline), Option B for dynamic/user images if on Cloudflare Pro.

**Implementation for Option C:**
1. Add image optimization to the R2 upload script (`mirror-assets-to-r2.mjs`)
2. Generate AVIF + WebP variants at upload time
3. Serve optimized variants from Worker based on `Accept` header
4. Keep `unoptimized: true` in Next.js config to avoid Vercel billing

---

### SEO-R08: Add Internal Linking Strategy

**Priority:** P2 — Helps indexing of new pages
**Effort:** 2-3 hours

**Steps:**
1. Add "Related Products" section to product detail pages (cross-link within category)
2. Add "Popular Categories" section to category pages (cross-link between categories)
3. Add breadcrumb navigation on all pages (already has JSON-LD, ensure visible breadcrumbs)
4. Add "Recently Viewed Products" section (uses tracking data) to product pages
5. Ensure footer has links to all major sections

---

### SEO-R09: Set Up Ongoing Monitoring

**Priority:** P2 — Prevents future regressions
**Effort:** 2-3 hours

**Steps:**

1. **Sitemap health check** — Weekly script that fetches all sitemap URLs and reports non-200s:
```bash
"audit:sitemap-health": "node scripts/general/audit-sitemap-health.mjs"
```

2. **Indexing alerts** — Set up Google Search Console email alerts for:
   - Sudden drop in indexed pages (>10% in a week)
   - New 404 errors
   - New soft 404s

3. **Core Web Vitals monitoring** — Already have Vercel Speed Insights; ensure it's active and check monthly

4. **Structured data validation** — Monthly check with Google Rich Results Test for key pages

5. **Add to release gate** — Consider adding sitemap health check to `pnpm run gate:fast`

---

## Summary Timeline

| Week | Wave | Key deliverables |
|---|---|---|
| Week 1 | Wave 1: Critical Security | middleware.ts, CSP headers, file route rate limits, metrics auth |
| Week 2 | Wave 2: High Security + Critical SEO | Origin check fix, 404 URL fixes, robots review, redirect fixes |
| Week 3-4 | Wave 3: Medium Issues | Content quality fixes, CORS policy, token deprecation, tracking auth |
| Ongoing | Wave 4: SEO Growth | Image optimization, internal linking, monitoring setup |

---

## Validation Commands (Pending User Authorization)

| Command | Verifies |
|---|---|
| `pnpm audit` | Dependency CVEs |
| `pnpm run scan:secrets` | Leaked secrets in codebase |
| `pnpm run test:audit:api-routes` | API route safety patterns |
| `pnpm run typecheck` | Type safety after changes |
| `pnpm run gate:fast` | Full dev-loop validation |
| `pnpm run test:priority-8` | SEO + security test suite |

---

## References

- [OWASP Top 10 2025](https://owasp.org/Top10/2025/) — A01 Broken Access Control, A02 Security Misconfiguration
- [Next.js Security Best Practices](https://nextjs.org/blog/security-nextjs-server-components-actions) — Zero Trust model for Server Components
- [Supabase Security Best Practices](https://bastion.tech/blog/supabase-security-best-practices/) — RLS, service role key isolation
- [Next.js Security Checklist (Arcjet)](https://arcjet.com/learn/nextjs-security-checklist) — Comprehensive checklist for App Router apps
- [CVE-2025-29927](https://workos.com/blog/nextjs-app-router-authentication-guide-2026) — Middleware bypass vulnerability

Content was rephrased for compliance with licensing restrictions.

---

*Plan generated from static code analysis and Google Search Console data. Implementation should be validated with the commands listed above.*
