# Module 02 - authentication and security

## Summary

Security is implemented as several cooperating layers rather than one universal middleware decision. The Proxy handles fast request policy; server layouts and API handlers perform actual session checks; shared wrappers add roles, rate limits, CSRF, and response normalization; domain code derives ownership from the verified session.

This is one of the stronger parts of the codebase. The main known debt is the explicitly deprecated static admin-token fallback for customer-query management, plus the normal need to re-run authorized validation after security-sensitive changes.

## Request security flow

The intended flow is:

1. [`site/proxy.ts`](../site/proxy.ts) normalizes host/path, applies maintenance and fast cookie checks, generates a request correlation value, and attaches CSP/security headers.
2. The relevant layout or route handler performs real Supabase `getUser` validation.
3. [`withAuth.ts`](../site/features/shared/api/withAuth.ts) applies route rate limits, resolves `admin`, `member`, or `guest`, and optionally checks CSRF for mutations.
4. Planner routes additionally validate schema, origin, expected revision, idempotency, owner scope, and safe response shape.
5. Admin handlers use the Admin-specific session helper and require an admin role.

The Proxy itself intentionally uses cookie presence as a fast path; it does not treat a cookie as proof of identity.

## Identity and roles

[`site/lib/auth/session.ts`](../site/lib/auth/session.ts) uses a server-only Supabase client and maps the verified user to the application owner/member model. [`site/lib/auth/roles.ts`](../site/lib/auth/roles.ts) derives admin privilege from Supabase `app_metadata`, preventing user-editable metadata from granting admin access.

The development bypass in [`devAuthBypass.ts`](../site/lib/auth/devAuthBypass.ts) is enabled only when `DEV_AUTH_BYPASS=1` and the runtime is not production. It uses a synthetic admin identity and restricts requests to loopback or hosts listed in `DEV_AUTH_BYPASS_ALLOW_HOSTS`. Production bypass is disabled by design.

## Browser request protections

[`requestOrigin.ts`](../site/lib/security/requestOrigin.ts) checks same-origin behavior, failing closed in production when origin information is missing. Mutation routes can also require CSRF tokens. Rate limiting is applied before authentication in the shared wrapper to reduce abuse of unauthenticated endpoints.

The Proxy CSP uses a request nonce, self sources, limited development allowances, worker/blob support, and explicit external connect/image/frame hosts. The configuration does not use `strict-dynamic`; this is a deliberate policy detail that should stay synchronized with script loading.

## Endpoint-specific controls

The public customer-query route combines validation, same-origin browser origin checks, an IP rate limit, and a honeypot before inserting through the Admin service-role client. Notification is sent after the database insert. Customer-query management has a custom admin-session path because it predates the shared wrapper.

Exports are intentionally disk-only in development and refuse production disk writes. The raw filesystem helper is guarded by [`assertDevDiskWritable.ts`](../site/lib/persistence/assertDevDiskWritable.ts).

Planner responses are allowlisted by [`plannerApiResponse.ts`](../site/lib/Planner/plannerApiResponse.ts), excluding owner IDs, credentials, filesystem paths, and raw internal errors. Asset paths are sanitized and generated GLBs are namespaced by owner/guest context.

## Findings

### Accepted debt: static admin token

[`staticAdminToken.ts`](../site/lib/security/staticAdminToken.ts) documents a sunset of 2026-12-01 for the `x-admin-token` fallback used by [`customer-queries/manage/route.ts`](<../site/app/api/customer-queries/manage/route.ts>). The comparison is timing-safe and warnings are logged, so this is contained but should be removed on schedule.

### Active defect: Edge proxy /access 307 redirect loop & client sign-out crash

Forensic analysis confirmed that `site/proxy.ts:442` performs a superficial cookie check (`hasSessionAuthCookies()`) that automatically redirects `/access` visits to `/dashboard`. When a visitor has an expired or invalid `sb-*-auth-token`, the server layout guard in `site/lib/auth/session.ts` rejects the session and redirects back to `/access`, triggering an infinite HTTP 307 loop. Additionally, `DashboardClient.tsx:142` calls client `createAuthClient().auth.signOut()`, which crashes in the browser due to missing `NEXT_ADMIN_SUPABASE_URL` in client bundles. Remediation requires allowing `/access` to render without unverified cookie bounce and delegating sign-out to the `signOutFromSupabase()` server action.

### Operational gap: security posture is not currently certified

The repository has security-focused source tests and gate scripts, but this research session did not execute them. No conclusion about current runtime CSP, auth, CSRF, or rate-limit behavior should be treated as a release result.

## Recommended checks

1. Run the exact authorized security/test lanes after the next auth or Proxy change.
2. Exercise protected page redirects and mutating API behavior on `http://localhost:3000` when browser validation is authorized.
3. Remove the static token fallback before its sunset and confirm no deployment still supplies the old token.
4. Keep service-role clients server-only and continue rejecting service keys in anonymous environment slots.

## Evidence

- [`site/proxy.ts`](../site/proxy.ts)
- [`site/lib/auth/session.ts`](../site/lib/auth/session.ts)
- [`site/lib/auth/devAuthBypass.ts`](../site/lib/auth/devAuthBypass.ts)
- [`site/lib/auth/roles.ts`](../site/lib/auth/roles.ts)
- [`site/features/shared/api/withAuth.ts`](../site/features/shared/api/withAuth.ts)
- [`site/lib/security/requestOrigin.ts`](../site/lib/security/requestOrigin.ts)
- [`site/lib/security/staticAdminToken.ts`](../site/lib/security/staticAdminToken.ts)
- [`site/lib/persistence/assertDevDiskWritable.ts`](../site/lib/persistence/assertDevDiskWritable.ts)
- [`site/platform/supabase/env.ts`](../site/platform/supabase/env.ts)

