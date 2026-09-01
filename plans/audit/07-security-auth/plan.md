# Plan — Security: Auth

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Contain the non-production dev-auth-bypass exposure while preserving the verified layered auth (edge proxy → handler → layout) untouched.

## Actions (prioritized)
1. **Low** Add an allowed-host guard to `site/lib/auth/devAuthBypass.ts` (bypass condition at lines 40–49) so `DEV_AUTH_BYPASS=1` on any exposed non-production host (staging container, networked `next dev`) cannot grant the fixed admin `DEV_BYPASS_USER` full admin access — restrict to localhost/loopback request origins.
2. **Low** Change the `DEV_AUTH_BYPASS=1` template default in `.env.example:90` to blank/commented so verbatim copies to non-prod hosts don't recreate the bypass posture.

## Verification
- `pnpm run typecheck`, `pnpm run test`, `pnpm run gate:fast` (includes the api-route-safety auth-marker audit) — gate runs require owner authorization.
