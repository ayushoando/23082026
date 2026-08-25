# OandO Workflow — routing detail

Loaded on demand when the OandO Workflow power is active.

## The loop for any code change
1. `node scripts/graph-impact.mjs --file=<changed-file>` — get blast radius + the
   suggestedTestCommand.
2. Run that scoped vitest command. Fix, re-run (max 3 iterations).
3. If Studio/Planner tree: `pnpm run scan:boundaries`.
4. If CSS/FOCSS: `pnpm run verify:focss` + `pnpm run lint:ui:strict`.
5. Finish with `pnpm run gate:fast` (dev bar) or `pnpm run gate` (ship bar).
6. Interactive/visual claim -> browser power (nova-act / kane-cli), localhost only.

## Power vs skill (why routing is one-directional)
- A power is active (owns MCP + activation). A skill is passive markdown.
- The power/agent DRAWS ON skills for procedure; skills never call MCP themselves.
- Activation is gated by `~/.kiro/settings/permissions.yaml` (`power:` allowlist).

## Two databases (for db work)
Admin `rxzpznmxbaoxpikowmfc` (plans/staff/furniture/descriptors/audit) vs Products
`erpweaiypimorcunaimz` (marketing catalog/configurator/flags/themes). Confirm which
before any supabase-hosted power operation.
