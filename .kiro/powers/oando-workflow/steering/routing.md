# OandO Workflow — routing detail

Loaded on demand when the OandO Workflow power is active.

## The loop for any code change
1. `node scripts/graph-impact.mjs --file=<changed-file>` — inspect blast radius and note the `suggestedTestCommand`; do not run it automatically.
2. Tests, coverage, browser-test runners, and gates are user-invoked only. Report the exact suggested command to the user instead of executing it.
3. For explicit non-test verification, use the smallest relevant repository check: `pnpm run scan:boundaries` for Studio/Planner, `pnpm run verify:focss` plus `pnpm run lint:ui:strict` for CSS/FOCSS, and the applicable type or migration check for other domains.
4. Interactive/visual claims require an explicitly requested browser check through `nova-act` or `kane-cli`, using `http://localhost:3000` only.

## Power vs skill (why routing is one-directional)
- A power is active (owns MCP + activation). A skill is passive markdown.
- The power/agent DRAWS ON skills for procedure; skills never call MCP themselves.
- Activation is gated by `~/.kiro/settings/permissions.yaml` (`power:` allowlist).

## Two databases (for db work)
Admin `rxzpznmxbaoxpikowmfc` (plans/staff/furniture/descriptors/audit) vs Products
`erpweaiypimorcunaimz` (marketing catalog/configurator/flags/themes). Confirm which
before any supabase-hosted power operation.
