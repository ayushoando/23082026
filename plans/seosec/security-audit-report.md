# Security Audit Report

**Date:** 2026-08-31
**Scope:** Full endpoint, authentication, and application security audit
**Repository:** oando1408 (One&Only office furniture platform)
**Framework:** Next.js 16 App Router + Supabase + Cloudflare Worker
**Methodology:** OWASP Top 10 2025, Next.js security best practices, Supabase security checklist

---

## Executive Summary

The application demonstrates **strong security fundamentals** with a well-designed auth wrapper (`withAuth`), comprehensive rate limiting, CSRF protection, proper secret isolation, and (as corrected below) a thorough edge-layer proxy providing defense-in-depth auth and CSP. Of the original 6 critical/high findings, **2 were false positives** (the audit searched for `middleware.ts` by name and missed that Next.js 16 renamed the convention to `proxy.ts`; `site/proxy.ts` already implements both defense-in-depth auth and full CSP with per-request nonces). The remaining findings — file route rate limiting, metrics endpoint auth, and the origin-check fail-open gap — have been fixed this session.

### Severity Summary (updated post-remediation)

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 (was 2) | Both closed as false positives — see SEC-C01/C02 correction below |
| High | 4 | 3 fixed this session (SEC-H01, SEC-H02, SEC-H03); 1 remaining (SEC-H04, see below) |
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

## Critical Findings — CORRECTED (both closed as false positives)

### SEC-C01 / SEC-C02: CLOSED — proxy.ts already covers both

**Original claim:** No `middleware.ts` exists, so there's no defense-in-depth auth or CSP on HTML pages.

**Correction:** Next.js 16 renamed `middleware.ts` to `proxy.ts` (file must be named `proxy`, live at the app root). This repo has a comprehensive `site/proxy.ts` — the original audit's file-name search missed it. Verified by:
- `site/proxy.ts` contains a header comment: `NEXT.JS 16 PROXY — Must be named 'proxy' and placed at the root of the project`
- No `middleware` doc page exists anywhere in `node_modules/next/dist/docs/`
- `tests/unit/proxy.test.ts` has 54 passing tests covering this exact file

**What `site/proxy.ts` actually implements:**
- `isProtectedPath()` blocks `/admin`, `/dashboard`, `/portal` at the edge via `hasSessionAuthCookies()`, before any handler or layout runs — this **is** defense-in-depth auth
- `buildContentSecurityPolicy()` generates a fresh nonce per request and sets `script-src 'self' 'nonce-...'` on every non-static-asset request (see `matcher` config) — this **is** CSP on HTML pages, with the nonce forwarded via `x-nonce` header and consumed by `getRequestNonce()` in `site/app/(site)/layout.tsx`
- HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP — all set in `applySecurityHeaders()`
- Member-only write API blocking (`isMemberOnlyWriteApi()`) returns 403 for unauthenticated mutations on `/api/plans`, `/api/admin`, etc.
- Maintenance-mode fail-closed for mutations outside a tiny allowlist

**Residual scope note:** `isProtectedPath()` deliberately excludes `/oostudio` and `/ooplanner` — these are guest-accessible product surfaces by design, with auth enforced at the layout level instead. `/oostudio` was missing that layout-level auth call; this was fixed separately this session (see `plans/studio-audit/`) and is unrelated to the proxy/middleware question.

**Status: No further action.** See `plans/seosec/remedy-plan.md` for the full correction writeup.

---

## High Findings

### SEC-H01: File Serving Routes Lack Auth and Rate Limiting — ✅ FIXED

**Severity:** HIGH
**OWASP:** A01 Broken Access Control
**Location:** `site/app/api/files/catalog/[...path]/route.ts`

**Finding:** The catalog file serving route had **no rate limiting** (auth correctly absent — it's a public catalog asset endpoint). It reads from R2 storage and serves binary assets directly.

**Verification of the other 4 file routes:** `exports`, `furniture`, `projects`, `uploads` all already had `withAuth` with role + rate limit configured — the original finding's blanket claim about all 5 routes was only accurate for `catalog`.

**Fix applied:** Added `enforcePublicApiRateLimit(request, "files-catalog:get", 60)` to the top of the handler.

**Risk (resolved):** Resource exhaustion via unbounded scraping is now rate-limited at 60 req/min per IP.

**Remediation:** See remedy plan SEC-R03.

---

### SEC-H02: Metrics Endpoint Exposure — ✅ FIXED

**Severity:** HIGH
**OWASP:** A02 Security Misconfiguration
**Location:** `site/app/api/metrics/route.ts`

**Finding:** The Prometheus metrics endpoint was gated by an environment flag (`OBSERVABILITY_METRICS_ENABLED`) in production, but when enabled, it had **no authentication**.

**Fix applied:** Added `isAuthorizedMetricsRequest()` — when `METRICS_AUTH_TOKEN` is configured, every request must present `Authorization: Bearer <token>`, compared with `timingSafeEqual`. Unset token = open (preserves the dev default). Documented in `.env.example`.

---

### SEC-H03: Origin Check Allows Missing Origin/Referer — ✅ FIXED

**Severity:** HIGH
**OWASP:** A01 Broken Access Control
**Location:** `site/lib/security/requestOrigin.ts`

**Finding:** The `isAllowedBrowserOrigin()` function returned `true` unconditionally when both `Origin` and `Referer` headers were absent, in every environment.

**Fix applied:** The function now takes an injectable `env` parameter and returns `env.NODE_ENV !== "production"` for the missing-headers case — fails closed in production, stays permissive in dev/test/CI for curl and server-to-server calls. `tests/unit/lib/security/requestOrigin.test.ts` updated with a new production-mode assertion; all 6 cases pass.

---

### SEC-H04: Missing Rate Limiting on Several Public Endpoints — MOSTLY RESOLVED

**Severity:** HIGH → LOW (revised after verification)
**OWASP:** A04 Insecure Design
**Location:** Multiple route files

**Finding (revised):** The original claim that 4 file routes "lack rate limiting" was inaccurate — verification found `exports`, `furniture`, `projects`, and `uploads` all already use `withAuth` with role + explicit `rateLimit` values (60-120/min). Only `catalog/[...path]` was genuinely unprotected, and that's now fixed (see SEC-H01).

`/api/route.ts` and `/api/health` remain intentionally open with no rate limit — both are minimal liveness/status probes with no data exposure or resource cost, consistent with standard practice for health-check endpoints.

**Status:** No further action needed.

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
