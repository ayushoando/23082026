# SEO & Security Remedy Plan

**Date:** 2026-08-31
**Priority:** Ordered by severity and impact
**Estimated total effort:** ~40-60 hours across 4 waves

---

## Wave 1: Critical Security (Week 1) — Est. 2-5 hours (revised)

### CORRECTION — SEC-R01 and SEC-R02 were based on a false premise

The original security audit searched for `middleware.ts` and found none, concluding there was no defense-in-depth auth layer or CSP on HTML pages. **This was a miss, not a real gap.**

Next.js 16 renamed `middleware.ts` → `proxy.ts` (must be named `proxy`, live at the app root). This project already has a comprehensive `site/proxy.ts` (verified against its own `NEXT.JS 16 PROXY` header comment, the absence of any `middleware` doc page in `node_modules/next/dist/docs/`, and the existing `tests/unit/proxy.test.ts` coverage). It already implements:

- **Defense-in-depth auth** — `isProtectedPath()` blocks `/admin`, `/dashboard`, `/portal` at the edge via session cookie check, before any handler runs. Dev bypass respected. Member-only write APIs (`/api/plans`, `/api/admin`, etc.) return 403 for unauthenticated mutation attempts.
- **Full CSP with per-request nonce** — `buildContentSecurityPolicy()` generates a fresh nonce per request (`createCspNonce()`), forwards it via `x-nonce` header (read by `getRequestNonce()` in `site/app/(site)/layout.tsx`), and sets `script-src 'self' 'nonce-...' blob: <analytics origins>`. Canvas-heavy routes (`/ooplanner`, `/oostudio`) get `'unsafe-eval'` scoped only to those paths.
- **HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP** — all set in `applySecurityHeaders()`.
- **Maintenance mode fail-closed for mutations** — write methods outside a tiny allowlist get 503 during readonly maintenance.
- **www→apex redirect, retired-path redirects** — all handled before the auth gate.

**No action needed.** SEC-R01 and SEC-R02 are closed as false positives. See `SEC-R01-CLOSED` below for the verification evidence.

---

### SEC-R01-CLOSED: Verification Evidence

| Claim in original audit | Actual state |
|---|---|
| No middleware.ts exists | Correct — but irrelevant. Next 16 uses `proxy.ts`, confirmed present at `site/proxy.ts` |
| No middleware-level auth | False — `isProtectedPath()` + `hasSessionAuthCookies()` gate `/admin`, `/dashboard`, `/portal` at the edge |
| No CSP on HTML pages | False — `buildContentSecurityPolicy()` sets CSP with nonce on every non-static request via the `matcher` config |
| Any new route without `withAuth` is silently public | Partially true only for API routes not covered by `MEMBER_ONLY_WRITE_PREFIXES`; page routes under `/admin`, `/dashboard`, `/portal` ARE covered by `isProtectedPath()` |

**Residual gap:** `isProtectedPath()` does not cover `/oostudio` or `/ooplanner` — these are intentionally treated as guest-accessible product surfaces (`GUEST_PRODUCT_SURFACE_PREFIXES`) with auth enforced at the layout level instead (see STU-FIX-01, already applied this session: `requireAuthUser("/oostudio", "admin")`). This is a deliberate design choice, not an oversight — documented in `site/proxy.ts` comments.

---

### SEC-R03: Add Rate Limiting to File Serving Routes (REVISED — narrower scope)

**Finding:** SEC-H01 + SEC-H04 — File routes lack auth and rate limiting
**Priority:** P1 — High
**Effort:** 15 minutes (revised down from 2-3 hours after verification)
**Owner:** Core team

**Verification result:** 4 of 5 file routes already have `withAuth` + rate limiting:
- `exports/[filename]/route.ts` — `role: "member"`, 60/min ✓
- `furniture/[filename]/route.ts` — `role: "guest"`, 120/min ✓
- `projects/[filename]/route.ts` — `role: "member"`, 60/min ✓
- `uploads/[filename]/route.ts` — `role: "member"`, 60/min ✓

**Only `catalog/[...path]/route.ts` is genuinely unprotected** — no auth (correct, it's public catalog imagery) but no rate limit either.

**Fix applied:**
```typescript
// site/app/api/files/catalog/[...path]/route.ts
import { enforcePublicApiRateLimit } from "@/app/api/_lib/public";

export async function GET(_request: Request, context: Ctx) {
  const rateError = await enforcePublicApiRateLimit(_request, "files-catalog:get", 60);
  if (rateError) return rateError;
  // ... existing logic unchanged
}
```

**Status: ✅ Applied.**

---

### SEC-R04: Secure Metrics Endpoint

**Finding:** SEC-H02 — Metrics endpoint has no auth when enabled
**Priority:** P1 — High
**Effort:** 1-2 hours
**Owner:** Core team

**Approach:**

Add token-based auth. **Status: ✅ Applied** — `site/app/api/metrics/route.ts` now requires `METRICS_AUTH_TOKEN` (via timing-safe comparison) whenever the token is configured. `.env.example` documents the new var.

---

## Wave 2: High Security + Critical SEO (Week 2) — Est. 10-14 hours

### SEC-R05: Tighten Origin Check

**Finding:** SEC-H03 — Origin check allows missing headers
**Priority:** P1 — High
**Effort:** 30 minutes (revised down)
**Status: ✅ Applied**

`isAllowedBrowserOrigin()` now takes an injectable `env` parameter (matching the codebase's existing pattern in `devAuthBypass.ts`) and fails closed when both `Origin` and `Referer` are absent **in production only**. Non-production (dev, test, CI) keeps the permissive behavior for curl/server-to-server calls. Only caller (`customer-queries/route.ts`) needed no changes — it calls with the default `process.env`. Test file updated with a new production-mode case.

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

**Status (2026-09-01): Step 4 shipped.** `scripts/general/audit-sitemap-health.mjs` walks `sitemap.xml` (index or url-set) and every `<loc>`, flagging non-200 statuses, redirects (with `location`), `X-Robots-Tag: noindex`, and missing `<title>`/meta-robots noindex; exits 1 on findings. Registered as `pnpm run audit:sitemap-health`; tested by `tests/unit/scripts/audit-sitemap-health.test.ts`. Steps 1-3 (the actual 404 URL list) remain open — GSC export required.

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
**Status (2026-09-02): ❌ OPEN — unchanged.** Remains pending a product decision on whether cross-origin consumers (mobile app, third-party integration) are planned. No CORS layer exists; same-origin browser enforcement remains the posture.

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
**Status (2026-09-01): ✅ Warning + rotation shipped — consumer removal still pending.**

**Approach:**
1. Add a deprecation warning log when token auth is used
2. Set a deadline to remove token fallback (e.g., 2026-12-01)
3. Migrate any external consumers to Supabase session auth
4. Add token rotation support if the token must stay

**Fix applied (steps 1, 2, 4):** New shared module `site/lib/security/staticAdminToken.ts` — one-per-token fingerprinted deprecation warning (SHA-256 prefix, never the token itself, deduped per process via `warnStaticAdminTokenUsage`), rotation via `CUSTOMER_QUERIES_ADMIN_TOKENS` (comma-separated list, newest first; legacy single `CUSTOMER_QUERIES_ADMIN_TOKEN` still accepted), sunset `STATIC_ADMIN_TOKEN_SUNSET = "2026-12-01"`. Wired into `site/app/api/customer-queries/manage/route.ts` (`isAuthorized` now matches against `acceptedStaticAdminTokens()` and calls `warnStaticAdminTokenUsage`). `.env.example` documents `CUSTOMER_QUERIES_ADMIN_TOKENS` with the deprecation note. Tests: `tests/unit/lib/security/staticAdminToken.test.ts` (9 cases).

**Step 3 remains open:** external-consumer migration to Supabase session auth is an external-coordination item — the fallback itself is only removed once consumers retire, per the sunset date.

---

### SEC-R08: Use Anon Key for Public Tracking

**Finding:** SEC-M03 — Tracking route uses service role key for anonymous users
**Priority:** P2 — Medium
**Effort:** 3-4 hours
**Status (2026-09-01): ✅ Fixed in code — RLS migration authored, not yet applied.**

**Original approach (superseded):**

Create the `user_viewed_products` table with RLS policies that allow anonymous writes (using `anon` key) scoped to the anonymous user's ID:

```sql
-- RLS policy for user_viewed_products
CREATE POLICY "Users can manage their own viewing history"
ON user_viewed_products
FOR ALL
USING (user_id = auth.uid() OR user_id = current_setting('request.jwt.claims', true)::json->>'sub')
WITH CHECK (user_id = auth.uid() OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');
```

**Fix applied:** `site/app/api/tracking/route.ts` now verifies the caller's bearer token via a new `createSupabaseAuthAnonClient(token)` factory in `site/platform/supabase/auth-admin.ts` (token forwarded through Supabase client `global.headers`), and persists authenticated writes through that anon-key client so RLS — not the service-role key — governs the row. The owner-scoped policy is `site/platform/supabase/migrations.admin/20260901120000_user_history_owner_rls.sql` (`grant select, insert, update ... to authenticated` + `user_history_owner_dml` policy with `user_id = coalesce(auth.jwt() ->> 'sub', '')`; `-- rollback` section included, governance-compliant). Cookie-only anonymous writes intentionally remain server-mediated via the service-role path — no JWT exists to prove row ownership for them. Route tests updated: `tests/unit/app/api/tracking/route.test.ts` (10 pass).

**Application status:** the migration is authored only; application to the Admin DB happens in the deploy-prep phase via authorized `pnpm run db:apply:admin -- --dry` then `db:apply:admin`. Do not treat the policy as live until then.

---

### SEC-R09: Add Content-Length Pre-Check for Uploads

**Finding:** SEC-M05 — Upload size validated after parsing
**Priority:** P3 — Low
**Effort:** 1 hour
**Status (2026-09-01): ✅ Fixed in code.**

**Original approach:**

Add a content-length header check before parsing the multipart body:

```typescript
// In upload route handlers
const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
if (contentLength > MAX_MULTIPART_UPLOAD_BYTES) {
  return error(ApiError.fromCode(API_ERROR_CODES.VALIDATION_ERROR, "File too large"));
}
```

**Fix applied:** `isOversizedRequestBody(headers, limitBytes)` added to `site/lib/security/uploadLimits.ts` — rejects declared `Content-Length` above `MAX_MULTIPART_UPLOAD_BYTES` (10 MiB) plus a 64 KiB multipart boundary/text-field margin; when the header is absent or unparsable it returns `false` and defers to the existing post-parse `isOversizedUpload` backstop. Wired into `site/app/api/Studio/furniture/upload/route.ts` (413 returned **before** `formData()`) and the multipart branch of `readRequestBody` in `site/lib/Planner/plannerRequestPipeline.ts` (rejects before `formData()` materializes the body). Tests: `tests/unit/lib/security/uploadLimits.test.ts`.

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
   **Status (2026-09-01): script shipped** — see SEO-R01 step 4. Scheduling/alerting remains open.

2. **Indexing alerts** — Set up Google Search Console email alerts for:
   - Sudden drop in indexed pages (>10% in a week)
   - New 404 errors
   - New soft 404s

3. **Core Web Vitals monitoring** — Already have Vercel Speed Insights; ensure it's active and check monthly

4. **Structured data validation** — Monthly check with Google Rich Results Test for key pages

5. **Add to release gate** — Consider adding sitemap health check to `pnpm run gate:fast`

---

## Summary Timeline

| Week | Wave | Key deliverables | Status |
|---|---|---|---|
| — | Wave 1 (corrected) | SEC-R01/R02 closed as false positives (proxy.ts already covers this); SEC-R03 file-route rate limit; SEC-R04 metrics auth | ✅ Done this session |
| — | Wave 2 (security part) | SEC-R05 origin check fail-closed in production | ✅ Done this session |
| Week 2 | Wave 2 (SEO part) | 404 URL fixes, robots review, redirect fixes | Pending — needs live Search Console export (monitoring script shipped 2026-09-01) |
| — | Wave 3: Medium Issues | SEC-R07 warning+rotation, SEC-R08 anon-key + owner RLS, SEC-R09 content-length pre-check | ✅ Fixed in code 2026-09-01 (SEC-R07 consumer removal pending sunset; SEC-R08 migration awaiting deploy-prep apply). SEC-R06 CORS still open pending product decision; content-quality (SEO-R04/R05) still needs GSC |
| Ongoing | Wave 4: SEO Growth | Image optimization, internal linking, monitoring setup | Partially shipped 2026-09-01 — `audit:sitemap-health` script done; GSC-dependent items pending |

**Session correction:** The original audit's two "Critical" findings (SEC-C01 no middleware, SEC-C02 no CSP) were false positives — it missed that Next.js 16 renamed `middleware.ts` to `proxy.ts`, and `site/proxy.ts` already implements both. Actual Wave 1/2 security work this session totaled ~1 hour (3 small fixes) instead of the originally estimated 14-20 hours.

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
