# Security Audit Report

**Date:** 2026-08-31
**Scope:** Full endpoint, authentication, and application security audit
**Repository:** oando1408 (One&Only office furniture platform)
**Framework:** Next.js 16 App Router + Supabase + Cloudflare Worker
**Methodology:** OWASP Top 10 2025, Next.js security best practices, Supabase security checklist

---

## Executive Summary

The application demonstrates **strong security fundamentals** with a well-designed auth wrapper (`withAuth`), comprehensive rate limiting, CSRF protection, and proper secret isolation. However, there are **6 critical/high findings** and **9 medium/low findings** that need attention. The most impactful gap is the absence of a Next.js `middleware.ts` for defense-in-depth auth enforcement, and missing Content Security Policy on HTML pages.

### Severity Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 2 | Needs immediate action |
| High | 4 | Needs action within 2 weeks |
| Medium | 5 | Planned remediation |
| Low | 4 | Best-practice hardening |
| Informational | 3 | Acknowledged strengths |

---

## OWASP Top 10 2025 Mapping

| OWASP Category | Applicability | Finding |
|---|---|---|
| A01 Broken Access Control | **Medium risk** | No middleware-level auth; per-route guards only |
| A02 Security Misconfiguration | **Medium risk** | No CSP on HTML pages; metrics endpoint exposure |
| A03 Cryptographic Failures | **Low risk** | CSRF uses crypto.randomUUID + timingSafeEqual |
| A04 Insecure Design | **Low risk** | Auth architecture is sound, defense-in-depth partially missing |
| A05 Vulnerable Components | **Unverified** | Dependency audit not authorized to run |
| A06 Identification & Auth Failures | **Low risk** | DEV_AUTH_BYPASS properly gated; Supabase auth solid |
| A07 Software Supply Chain | **Unverified** | npm audit not authorized to run |
| A08 Data Integrity Failures | **Low risk** | CSRF protection on mutations; signed cookies |
| A09 Logging & Monitoring | **Low risk** | OpenTelemetry + Prometheus configured |
| A10 SSRF | **Low risk** | No user-controlled URL fetching detected |

---

## Critical Findings

### SEC-C01: No Next.js Middleware for Auth Enforcement

**Severity:** CRITICAL
**OWASP:** A01 Broken Access Control
**Location:** Project root — `middleware.ts` is absent

**Finding:** There is no `middleware.ts` at the project or site root. All authentication and authorization is enforced per-route-handler via the `withAuth` HOF (`site/features/shared/api/withAuth.ts`) or inline `requireAdminSession`/`enforceAdminRateLimit` calls.

**Risk:** If a developer adds a new API route or page and forgets to wrap it with auth, it is **silently open to the public**. This is the #1 OWASP 2025 risk category. The CVE-2025-29927 vulnerability demonstrated that even middleware-based auth can be bypassed, but having no middleware at all means there is zero defense-in-depth at the routing layer.

**Evidence:**
- No `middleware.ts` anywhere outside `node_modules/`
- `site/app/api/files/catalog/[...path]/route.ts` — serves R2 catalog assets with **no auth and no rate limiting**
- `site/app/api/route.ts` — health-style endpoint, intentionally open (acceptable)
- `site/app/api/health/route.ts` — liveness probe, intentionally open (acceptable)

**Current mitigations:**
- `withAuth` HOF is well-implemented and consistently used on protected routes
- Admin routes consistently use `enforceAdminMutationGuard`
- Test script `test:audit:api-routes` exists to audit route safety

**Remediation:** See remedy plan SEC-R01.

---

### SEC-C02: No Content Security Policy on HTML Pages

**Severity:** CRITICAL
**OWASP:** A02 Security Misconfiguration
**Location:** `config/build/next.config.js` → `headers()`

**Finding:** The `Content-Security-Policy` header is only set on `/api/:path*` responses (`default-src 'self'`). The main HTML pages served to browsers have **no CSP header**. A `getRequestNonce()` utility exists in the site layout, suggesting CSP was planned, but the response-level header is never configured.

**Risk:** Without CSP, any XSS vulnerability (even via a third-party script or CDN compromise) can execute arbitrary JavaScript, steal cookies, and exfiltrate data. CSP is the last line of defense against XSS.

**Evidence:**
- `config/build/next.config.js` headers section only targets `/api/:path*`
- `site/app/(site)/layout.tsx` line 46: uses `nonce={nonce}` on script tags (CSP nonce infrastructure exists)
- No CSP header on `/(.*)`  or `/:path*` in next.config.js or vercel.json

**Current mitigations:**
- All `dangerouslySetInnerHTML` usage is wrapped with `sanitizeJsonForScript()` (good)
- No `eval()` or raw `innerHTML` in application code
- Nonce infrastructure partially built

**Remediation:** See remedy plan SEC-R02.

---

## High Findings

### SEC-H01: File Serving Routes Lack Auth and Rate Limiting

**Severity:** HIGH
**OWASP:** A01 Broken Access Control
**Location:** `site/app/api/files/catalog/[...path]/route.ts`

**Finding:** The catalog file serving route has **no authentication** and **no rate limiting**. It reads from R2 storage and serves binary assets directly. An attacker could enumerate all catalog assets or use the endpoint for resource exhaustion.

**Evidence:**
```typescript
// site/app/api/files/catalog/[...path]/route.ts
export async function GET(_request: Request, context: Ctx) {
  const { path } = await context.params;
  // NO auth check
  // NO rate limit
  const webPath = `/assets/catalog/${segments.join("/")}`;
  const asset = await readCatalogAssetBytes(webPath);
  // ...serves binary directly
}
```

Other file routes under `site/app/api/files/` (exports, furniture, projects, uploads) should also be verified.

**Risk:** Resource exhaustion, unauthorized asset scraping, potential path traversal if `readCatalogAssetBytes` doesn't sanitize.

**Remediation:** See remedy plan SEC-R03.

---

### SEC-H02: Metrics Endpoint Exposure

**Severity:** HIGH
**OWASP:** A02 Security Misconfiguration
**Location:** `site/app/api/metrics/route.ts`

**Finding:** The Prometheus metrics endpoint is gated by an environment flag (`OBSERVABILITY_METRICS_ENABLED`) in production, but when enabled, it has **no authentication**. Prometheus metrics can leak request counts, error rates, response times, and internal service topology.

**Evidence:**
```typescript
export async function GET() {
  if (process.env.NODE_ENV === "production" &&
      process.env.OBSERVABILITY_METRICS_ENABLED !== "1") {
    return new Response("Not Found", { status: 404 });
  }
  // No auth check — anyone can scrape metrics
  const registry = getMetricsRegistry();
  return new Response(await registry.metrics(), { ... });
}
```

**Remediation:** See remedy plan SEC-R04.

---

### SEC-H03: Origin Check Allows Missing Origin/Referer

**Severity:** HIGH
**OWASP:** A01 Broken Access Control
**Location:** `site/lib/security/requestOrigin.ts`

**Finding:** The `isAllowedBrowserOrigin()` function returns `true` when both `Origin` and `Referer` headers are absent. While the comment says "non-browser callers (curl, unit tests) often omit both," this also means any tool or script that omits these headers bypasses the origin check entirely.

**Evidence:**
```typescript
export function isAllowedBrowserOrigin(req): boolean {
  const originHeader = req.headers.get("origin");
  const refererHeader = req.headers.get("referer");
  // Non-browser callers (curl, unit tests) often omit both.
  if (!originHeader && !refererHeader) {
    return true;  // ← allows bypassing origin check
  }
  // ...
}
```

**Risk:** Any script can POST to `/api/customer-queries` without Origin/Referer and bypass the origin check. The honeypot field and rate limiting partially mitigate this, but it's still a gap.

**Remediation:** See remedy plan SEC-R05.

---

### SEC-H04: Missing Rate Limiting on Several Public Endpoints

**Severity:** HIGH
**OWASP:** A04 Insecure Design
**Location:** Multiple route files

**Finding:** While most routes have rate limiting, the following lack it:

| Route | Method | Rate Limit | Auth |
|---|---|---|---|
| `/api/files/catalog/[...path]` | GET | ❌ None | ❌ None |
| `/api/files/exports/[filename]` | GET | ❌ Not verified | Varies |
| `/api/files/furniture/[filename]` | GET | ❌ Not verified | Varies |
| `/api/files/projects/[filename]` | GET | ❌ Not verified | Varies |
| `/api/files/uploads/[filename]` | GET | ❌ Not verified | Varies |
| `/api/route.ts` (root) | GET | ❌ None | ❌ None (intentional) |
| `/api/health` | GET | ❌ None | ❌ None (intentional) |

**Remediation:** See remedy plan SEC-R03.

---

## Medium Findings

### SEC-M01: No CORS Headers on API Routes

**Severity:** MEDIUM
**Location:** All Next.js API routes

**Finding:** No CORS headers are set on any Next.js API route. The only CORS implementation is in the Supabase Edge Function (`assistant-chat`). If any API route is intended for cross-origin consumption (e.g., mobile app, third-party integration), requests will fail. Additionally, preflight requests (`OPTIONS`) are not handled.

**Current mitigations:** Same-origin browser enforcement is the default. The customer-queries route also uses `isAllowedBrowserOrigin()`.

**Remediation:** See remedy plan SEC-R06.

---

### SEC-M02: Admin Token Auth Fallback in Customer Queries Management

**Severity:** MEDIUM
**OWASP:** A07 Identification & Auth Failures
**Location:** `site/app/api/customer-queries/manage/route.ts`

**Finding:** The manage route accepts auth via either Supabase admin session OR a static `x-admin-token` header compared to `CUSTOMER_QUERIES_ADMIN_TOKEN` env var. Static tokens are less secure than session-based auth (no expiry, no rotation, no per-user attribution).

**Evidence:**
```typescript
async function isAuthorized(req: NextRequest): Promise<boolean> {
  if (await hasAdminSession()) return true;
  const required = process.env.CUSTOMER_QUERIES_ADMIN_TOKEN?.trim();
  const provided = req.headers.get("x-admin-token")?.trim() || "";
  return provided.length > 0 && safeTokenEquals(provided, required);
}
```

**Mitigations:** Token comparison uses `timingSafeEqual` (good). Token is server-side only.

**Remediation:** See remedy plan SEC-R07.

---

### SEC-M03: Tracking Route Uses Admin Service Client for Anonymous Users

**Severity:** MEDIUM
**OWASP:** A01 Broken Access Control
**Location:** `site/app/api/tracking/route.ts`

**Finding:** The tracking route uses `createSupabaseAuthAdminClient()` (service role key) to read/write `user_viewed_products` for anonymous cookie-based users. This means the service role key is used for public-facing unauthenticated traffic, increasing its exposure surface.

**Risk:** If there's a vulnerability in the tracking logic, it could be leveraged to perform operations with the service role key's elevated privileges.

**Remediation:** See remedy plan SEC-R08.

---

### SEC-M04: Dev Auth Bypass User Has Hardcoded UUID

**Severity:** MEDIUM
**Location:** `site/lib/auth/devAuthBypass.ts`

**Finding:** The dev bypass user has a fixed UUID (`00000000-0000-4000-8000-0000000000d1`). While correctly gated to non-production, if any test data or migrations reference this UUID, it could create confusion or test pollution.

**Evidence:**
```typescript
export const DEV_BYPASS_USER: DevBypassUser = {
  id: "00000000-0000-4000-8000-0000000000d1",
  email: "dev-bypass@localhost",
  role: "admin",
};
```

**Mitigations:** `isDevAuthBypassEnabled()` returns `false` when `NODE_ENV === "production"`.

---

### SEC-M05: Upload Size Validation Only Client-Side Check

**Severity:** MEDIUM
**OWASP:** A04 Insecure Design
**Location:** `site/lib/security/uploadLimits.ts`

**Finding:** The upload limit check (`isOversizedUpload(file)`) operates on a `File` object, which suggests it runs on the parsed multipart form data. The 10MB limit is reasonable, but there's no server-side `content-length` pre-check to reject oversized requests before parsing the body (which consumes memory).

```typescript
export const MAX_MULTIPART_UPLOAD_BYTES = 10 * 1024 * 1024;
export function isOversizedUpload(file: File): boolean {
  return file.size > MAX_MULTIPART_UPLOAD_BYTES;
}
```

**Remediation:** See remedy plan SEC-R09.

---

## Low Findings

### SEC-L01: Security.txt Contact Is Sales Email

**Severity:** LOW
**Location:** `workers/oando-worker-proxy/src/index.js`

**Finding:** The RFC 9116 `security.txt` lists `sales@oando.co.in` as the security contact. This is a sales email, not a dedicated security contact. Vulnerability reports may be missed or delayed.

**Remediation:** Create a dedicated `security@oando.co.in` alias or use a form URL.

---

### SEC-L02: Error Responses May Leak Internal Details

**Severity:** LOW
**Location:** Various route handlers

**Finding:** Some error handlers use `console.error` with full stack traces. While these don't leak to the client (the API response envelope only includes error codes/messages), the server logs may contain sensitive context.

**Mitigations:** The `toApiError()` function sanitizes errors for client responses. This is informational.

---

### SEC-L03: No Dependency Security Audit Results Available

**Severity:** LOW
**OWASP:** A05 Vulnerable Components / A07 Software Supply Chain

**Finding:** Running `pnpm audit` was not authorized in this session. The repository uses `pnpm` with a lockfile, which is good for reproducibility. The `package.json` references standard, well-known packages. A `dependabot.yml` is configured.

**Pending user validation:** `pnpm audit` should be run to check for known CVEs.

---

### SEC-L04: Vercel Preview Deployments Indexing Protection

**Severity:** LOW (already mitigated)
**Location:** `vercel.json`, `workers/oando-worker-proxy/src/index.js`

**Finding:** Preview deployments are properly protected from indexing:
- `vercel.json` sets `X-Robots-Tag: noindex, nofollow` on `*.vercel.app` hosts
- Cloudflare Worker strips Vercel's `X-Robots-Tag` for public apex and enforces `noindex, nofollow` on `*.vercel.app` and `*.workers.dev`

**Status:** Properly mitigated. No action needed.

---

## Acknowledged Strengths

### AUTH-S01: Well-Designed Auth Wrapper

The `withAuth` HOF at `site/features/shared/api/withAuth.ts` is excellent:
- Rate limiting → CSRF validation → Auth resolution → Error handling pipeline
- Three-tier role system: `guest`, `member`, `admin`
- Admin role checked via `app_metadata.role`/`roles` (server-side set, not user-editable)
- Dev bypass properly gated with `NODE_ENV !== "production"` check

### AUTH-S02: CSRF Protection

Double-submit cookie pattern with:
- `crypto.randomUUID()` for token generation
- `crypto.timingSafeEqual()` for comparison (prevents timing attacks)
- HttpOnly, Secure (prod), SameSite=strict cookie
- Automatic retry with new token on CSRF rejection (`site/lib/api/browserApi.ts`)

### AUTH-S03: Rate Limiting Architecture

Dual-backend system:
- In-memory map for development/fallback (10K key cap with LRU eviction)
- Supabase `rate_limits` table for distributed production limiting
- **Fail-closed for AI routes** in production when distributed backend unavailable
- Per-IP keying via `cf-connecting-ip` → `x-forwarded-for` → fallback chain

---

## Files Audited

| File | Role | Finding |
|---|---|---|
| `site/features/shared/api/withAuth.ts` | Central auth HOF | Strong ✓ |
| `site/lib/rateLimit.ts` | Rate limiting | Strong ✓ |
| `site/lib/security/csrf.ts` | CSRF protection | Strong ✓ |
| `site/lib/security/requestOrigin.ts` | Origin checking | SEC-H03 |
| `site/lib/security/uploadLimits.ts` | Upload validation | SEC-M05 |
| `site/lib/auth/session.ts` | Server auth | Strong ✓ |
| `site/lib/auth/devAuthBypass.ts` | Dev bypass | Properly gated ✓ |
| `site/app/api/customer-queries/route.ts` | Public form | Rate-limited + honeypot ✓ |
| `site/app/api/customer-queries/manage/route.ts` | Admin management | SEC-M02 |
| `site/app/api/tracking/route.ts` | Product tracking | SEC-M03 |
| `site/app/api/audit/route.ts` | Audit logging | Auth + CSRF + rate limit ✓ |
| `site/app/api/files/catalog/[...path]/route.ts` | Asset serving | SEC-H01 |
| `site/app/api/metrics/route.ts` | Prometheus metrics | SEC-H02 |
| `site/app/api/health/route.ts` | Liveness probe | Intentionally open ✓ |
| `site/app/api/log-error/route.ts` | Client error log | Zod validation + rate limit ✓ |
| `config/build/next.config.js` | Security headers | SEC-C02 |
| `vercel.json` | Deploy config | Preview protection ✓ |
| `workers/oando-worker-proxy/src/index.js` | CF Worker proxy | Strong ✓ |
| `.env.example` | Env template | Well-structured ✓ |
| `site/app/robots.ts` | Robots config | Proper disallows ✓ |

---

## Pending User Validation

The following commands were not authorized to run in this session:

| Command | Purpose |
|---|---|
| `pnpm audit` | Check npm dependencies for known CVEs |
| `pnpm run scan:secrets` | Scan for leaked secrets in codebase |
| `pnpm run test:audit:api-routes` | Audit API route safety patterns |
| `pnpm run gate:fast` | Full dev-loop validation |

---

*Report generated by codebase static analysis. Runtime behavior, Supabase RLS policies, and dependency CVEs require separate verification.*
