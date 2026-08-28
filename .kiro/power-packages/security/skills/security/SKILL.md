---
name: security
description: Route security changes to the correct edge, session, API authorization, and input-control layer in this repository.
---

# Security

## Layers

1. `site/proxy.ts` — cookie-existence prechecks, CSP nonce, security headers. It does not validate sessions.
2. `site/lib/auth/session.ts` — real server session resolution via `getOptionalUser` and `requireAuthUser`.
3. `site/features/shared/api/withAuth.ts` — API rate limiting, optional CSRF, user resolution, and role enforcement.

## Input controls

- Strict untrusted SVG validation: `site/lib/security/svgSanitizer.ts`. Do not substitute the weaker regex sanitizer.
- CSRF double-submit: `site/lib/security/csrf.ts`
- Origin checks: `site/lib/security/requestOrigin.ts`
- Upload limits: `site/lib/security/uploadLimits.ts`
- Rate limiting: `site/lib/rateLimit.ts`. AI-scoped production requests fail closed without distributed limiting.

## Owner-executed checks

`pnpm run scan:secrets`, `pnpm run ops -- lint:secrets`, `pnpm run test:audit:api-routes`, `pnpm run test:audit:eslint-disable`. Provide these commands to the owner instead of running them.
