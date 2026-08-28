---
inclusion: fileMatch
fileMatchPattern: "site/app/api/**,site/lib/api/**,site/lib/auth/**,site/lib/security/**,site/lib/rateLimit*,**/*safe-action*"
---

# API Domain

## Stack
- Next.js Route Handlers (`site/app/api/`)
- `next-safe-action` for type-safe server actions
- Auth: Supabase SSR (`@supabase/ssr`)
- Rate limiting: `site/lib/rateLimit.ts`
- CSRF: `site/lib/security/csrf.ts`
- Zod v4 for validation

## Conventions
- Every API route must validate input with Zod schemas.
- Auth-protected routes use `withAuth` wrapper or equivalent guard.
- Rate limiting applied to all public-facing endpoints.
- CSRF token required for state-mutating requests from browser.
- Use `next-safe-action` for form submissions; raw route handlers for webhooks/external APIs.

## Checks (user-invoked only)
For an explicit validation request, run the smallest applicable checks; do not run tests or gates automatically.
```
pnpm run typecheck
pnpm run test:audit:api-routes
pnpm run p0:unit
```

## Security checklist
- [ ] No unvalidated input passes to DB queries
- [ ] Auth guard present on all non-public routes
- [ ] Rate limit configured
- [ ] CSRF protection on mutations
- [ ] Error responses don't leak internal state

## Postman integration
Use the Postman power only for an explicit API-resource request. Inspect `.postman.json` first and never run collections or create duplicates without confirmation.

## Graph-layer integration
Inspect imports and dependents directly from the live source tree before optional validation.
