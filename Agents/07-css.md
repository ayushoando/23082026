# CSS

## Bar
- CSS home: **`site/focss/`** as `@focss/*` — plain tree, not an npm package.
- After FOCSS edits, re-run the CSS gates: `verify:focss` · `lint:ui:strict` · `check:style-tokens` (see [`../docs/architecture/css.md`](../docs/architecture/css.md)).
- Read `docs/architecture/css.md` before style changes.
- Read `docs/governance/focss-stop-drift.md` for allow/forbid + debt ratchet.

## Zone entries

| Surface | Entry |
|---------|--------|
| Site | `@focss/site/entry.css` |
| Admin | `@focss/admin/entry.css` only (FOCSS + React Aria controls) |
| Planner | `@focss/planner/entry.css` |
| Studio | `@focss/studio/entry.css` |
| Tokens | `@focss/base/*` |

No Studio↔Planner FOCSS cross-import. No shadcn chrome resurrection.

## Marketing type scale (site zone)

Defined in `site/focss/base/type/typography.css`. `--font-weight-light` is **300**.
Kickers use `--type-label-size`. Nav uses `--type-body-size` or OO raw rem in `shell-nav.css`.
Planner owns a second `@import "tailwindcss"` in `planner/entry.css`. Site/admin/studio use `base/scan.css`.

Suite chrome: `shell-global-nav.css` (dashboard/portal header), `shell-portal.css` (portal page frame).

## Hard rules
- Colour/density via semantic tokens.
- Forbidden: raw hex/rgb in product TSX; parallel CSS trees; nested `focss` packages.
- Fix structure before adding sheets.

## Verify
```powershell
pnpm run verify:focss
pnpm run lint:ui:strict
pnpm run check:composer-styles
pnpm run check:style-tokens
```

`verify:focss` is five checks in one script — import graph, site CSS, fences,
module imports, structure. A failure names which one; fix that, not the whole tree.

`site/focss/base/` is the site/admin/studio scan engine. Planner does **not** import it.

## VS Code Customization

When editing CSS files under `site/focss/`, VS Code Copilot automatically loads
[`.github/instructions/focss.instructions.md`](../.github/instructions/focss.instructions.md)
with zone boundaries, token rules, and verification commands.
