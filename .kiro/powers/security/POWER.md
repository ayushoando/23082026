---
name: security
displayName: Security
description: Route security work through the repository's distinct edge precheck, server-session, API-authorization, input-control, and owner-executed audit layers.
keywords: ["security", "auth", "session", "api authorization", "csrf", "origin", "upload", "svg", "rate limit", "secrets"]
author: "workspace"
---

# Security Power

Use this power to select the correct security layer before changing behavior. It is routing documentation only, bundles no MCP server, and does not grant permission to execute audits.

## Authentication and authorization layers

Keep these responsibilities distinct:

1. **Proxy prechecks and response headers — `site/proxy.ts`:** performs fast cookie-existence redirects/rejections, guest/member mutation prechecks, maintenance controls, CSP nonce forwarding, and security headers. It explicitly does not validate a session; handler/layout checks remain authoritative.
2. **Server session validation — `site/lib/auth/session.ts`:** `getOptionalUser()` calls server-side Supabase `auth.getUser()` and maps the live user/role; `requireAuthUser()` enforces authenticated surface and owner/admin routing. The non-production dev bypass is isolated in the auth helper.
3. **API authorization — `site/features/shared/api/withAuth.ts`:** rate-limits first, optionally validates CSRF on mutations, resolves the server session, enforces `guest`/`member`/`admin`, and serializes failures. API routes must choose an explicit role, scope, and CSRF requirement rather than relying on proxy cookie presence.

## Input and abuse controls

- **SVG:** route imported or user-provided SVG through `site/lib/security/svgSanitizer.ts`. It fail-closes on oversized input, malformed roots, scripts, `foreignObject`, active/embedded elements, event handlers, unsafe protocols, external URL references, oversized attributes, doctype, and entities. A missing namespace is currently reported but not blocking; do not overstate that rule. The Planner/Studio multipart upload handlers do not call this sanitizer, so do not claim uploaded SVG content is sanitized merely because it is classified as SVG.
- **CSRF:** `site/lib/security/csrf.ts` implements a double-submit cookie/header check with timing-safe comparison and a secure, HttpOnly, SameSite=Strict cookie in production. `withAuth({ requireCsrf: true })` applies it to POST/PUT/PATCH/DELETE outside the dev bypass.
- **Origin:** `site/lib/security/requestOrigin.ts` checks same-origin `Origin`/`Referer` for public browser mutators. It deliberately allows callers with both headers absent; use it as an origin control, not as session authentication.
- **Uploads:** `site/lib/security/uploadLimits.ts` caps multipart furniture/catalog files at 10 MiB. `site/app/api/Planner/catalog/upload/route.ts` and `site/app/api/Studio/furniture/upload/route.ts` require member auth, CSRF, a 15-request rate limit, valid multipart parsing, a `File`, and the size cap. Preserve these controls and validate content separately.
- **Rate limits:** `site/lib/rateLimit.ts` supports bounded in-memory limiting and an Admin Supabase backend when configured. Production AI-scoped requests fail closed if distributed rate limiting is unavailable; other fallback paths use the in-memory limiter. `withAuth.ts` scopes limits by normalized client IP.

## Owner-executed security commands

These commands remain owner-owned. Do not run them unless the owner explicitly authorizes execution in the current session and the active execution policy permits it:

- `pnpm run scan:secrets`
- `pnpm run ops -- lint:secrets`
- `pnpm run test:audit:api-routes`
- `pnpm run test:audit:eslint-disable`

Static inspection is not a behavioral pass, and an unexecuted command must not be reported as passing.

## MCP status vocabulary

Use only `.kiro/mcp/**` for schema references. **Schema present** means the snapshot exists there; it does not mean **workspace configured** or **runtime installed**. `.kiro/settings/mcp.json` has an empty `mcpServers` object, so no security server is workspace-configured. No direct installed-power/server registry evidence was established, so runtime availability is not verified.

Do not install, configure, or invent a security MCP server from this power.
