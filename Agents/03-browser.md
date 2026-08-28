# Browser validation

Use this workflow to support UI claims with fresh browser evidence from `http://localhost:3000`. Browser runners and checks require exact current-session authorization and enabled-hook permission; unit or static evidence is not browser proof.

## Bar
- UI truth: fresh browser at **`http://localhost:3000` only** (never `127.0.0.1`).
- Unit tests are not browser proof.
- Playwright config: `config/build/playwright.config.ts` (present).
- E2E/a11y gates: `pnpm run test:planner-catalog` · `pnpm run test:a11y` · security/CSP: [`../docs/governance/rules.md`](../docs/governance/rules.md).

## Surfaces
- Marketing: `/`
- Member suite: `/dashboard`, `/portal/*` (`PortalShell` + `shell-global-nav`)
- Studio: `/oostudio`
- Planner: `/ooplanner`
- Admin: `/admin/*` (auth / local bypass only when configured)

## Browser evidence tools

Use root `package.json` and `pnpm run ops:list` to select an authorized browser or audit route. Session scratch scripts and historical output directories are not validation authorities; record route, viewport, journey, console, failed requests, accessibility observations, and trace identity for every observed browser claim.

Local dev often runs `DEV_AUTH_BYPASS=1`, which switches Planner projects and the
furniture catalog to **disk** and skips CSRF in `withAuth`. That does **not** prove
the production member path: set `DEV_AUTH_BYPASS=0` (or unset), sign in with a real
Supabase session, and use Planner load/save via `plannerApi` → `browserApiFetch`
(cookies + CSRF + trailingSlash).
