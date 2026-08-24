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

## Fast checks (run on save)
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
Use the Postman power to validate endpoint contracts. Check `.postman.json` for existing collections before creating new ones.

## Graph-layer integration
When CAST Imaging is available, use `object_details(focus="inward")` on API route handlers to identify all callers and ensure auth guards cover every entry path.
