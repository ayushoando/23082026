# Plan — Architecture & Routes

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Eliminate docs drift and give non-marketing route groups local error/loading recovery, keeping the already-consistent route structure intact.

## Actions (prioritized)
1. **Med** Update `docs/architecture/routes.md` to reflect the actual 37 `(site)` pages — add the missing `tools/meeting-room-capacity-calculator` and `tools/office-space-calculator` entries.
2. **Low** Add route-level `error.tsx` (and `loading.tsx` where useful) under `site/app/admin/`, `site/app/ooplanner/`, `site/app/oostudio/` — crashes there currently rely solely on root `site/app/global-error.tsx`.
3. **Low (style)** No action: capitalized API namespaces (`site/app/api/Studio/…`) are documented as intentional in `docs/architecture/routes.md:165` — leave as is.

## Verification
- `pnpm run typecheck`, `pnpm run test`, `pnpm run gate:fast` — gate runs require owner authorization.
