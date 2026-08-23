# FOCSS (site/focss)

Alias `@focss/*` → `site/focss/*`. Plain CSS tree — **not** an npm package.  
FOCSS governance: [`docs/governance/focss-stop-drift.md`](../../docs/governance/focss-stop-drift.md). Active programme plan: [`plans/PLAN.md`](../../plans/PLAN.md).

## Live tree

```
site/focss/
  base/          shared tokens, type, scan, document (site + admin + studio)
  site/          marketing entry
  admin/         admin entry
  planner/       self-contained fork (own Tailwind + zone base/)
  studio/        product-base fork (scan/runtime/index/document + zone base/)
```

There is **no** `features/product/`. Foundation is inlined in zone entries. Do not add it back.

## Entries

| Zone | Entry | Import rule |
|------|-------|-------------|
| Site | `site/entry.css` | `base/scan` → runtime → document → index → marketing |
| Admin | `admin/entry.css` | product base, then `admin/base/*` + components |
| Planner | `planner/entry.css` | own `@import "tailwindcss"` + palette + flat `planner/base/{palette,semantic,layout,document}.css` + chrome. **No** `base/scan.css`. |
| Studio | `studio/entry.css` | product base + `studio/base/index.css` + chrome |

Planner must not import Studio (or reverse). Site must not import admin.

## Type

Canonical utilities: `base/type/typography.css` + `base/type/type.css` (`typ-*` only).  
Homepage page classes: `site/components/homepage/home-type.css`. Display-light is 300 (Plan 06a).

## Verify

```powershell
pnpm run verify:focss
pnpm run lint:ui:strict
pnpm run check:style-tokens
```
