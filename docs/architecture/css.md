# FOCSS architecture

This reference describes CSS ownership, zone boundaries, token rules, and the distinction between static and rendered evidence. Use the [FOCSS editing workflow](../../Agents/07-css.md) for procedures; commands listed here are configured validation routes, not observed pass results.

Configured checks are `pnpm run verify:focss`, `pnpm run lint:ui:strict`, `pnpm run check:composer-styles`, and `pnpm run check:style-tokens`. Run only an exact authorized command; no result is asserted here.

## Design systems (live)

| System | Routes | CSS entry | Controls | Chrome |
|--------|--------|-----------|----------|--------|
| **Site** | `(site)/*`, offline | `site/focss/site/entry.css` | `scheme-*`, `.btn-primary`, `home-*` | No shadcn on marketing entry |
| **Admin** | `/admin/*` | `site/focss/admin/entry.css` | Ecru + FOCSS tokens | FOCSS-native (`ShadcnChrome` removed, phase 13) |
| **Planner fork** | `/ooplanner*` | `site/focss/planner/entry.css` | Planner-local UI + FOCSS tokens | dockview themed via `planner/dock.css` |
| **Studio fork** | `/oostudio*` | `site/focss/studio/entry.css` | Studio-local UI + FOCSS tokens | dockview themed via `studio/dock.css` |

**Do not cross-import:** Site entry must never load admin shadcn/tailwind product packs. Planner FOCSS must not import Studio FOCSS (or the reverse). Do not resurrect `focss/zones/` or repo-root `focss/`.

Reference: [`site/focss/README.md`](../../site/focss/README.md) · live board `/admin/design-kit/` when admin auth works.

## Rules

- TSX: structure and behavior. CSS: repeated presentation and surface layout.
- Semantic tokens only — no raw palette values, no inline colors to bypass tokens.
- One global styling home under `site/focss/`. Extract shared primitives only after repeated real use.
- Light product surfaces use the **ecru paper stack** where admin FOCSS defines it (`--color-ecru-*` via `--surface-*` in `base/tokens/` when that tree is the active design system).
- Do **not** thrash token sheets for feature experiments.
- Hardcoding / token drift: prefer gated checks —  
  `pnpm run lint:ui:strict` · `pnpm run check:style-tokens` · `pnpm run ops check:composer-styles`  
  (broad one-shot hardcode auditors were removed 2026-08-02).
- **No `core/` or `core/locked/` as live homes**.

## Zone packages (live)

| Package | Root | Role |
|---|---|---|
| Shared base (site/admin design system) | `focss/base/` | tokens, type, bridges, document |
| Site marketing | `focss/site/` | Public surface |
| Admin | `focss/admin/` | Shell, primitives, pages, svg studio sheets (CSS present even if app routes lag) |
| Cross-feature | **Gone** | `features/product/` is forbidden. Base is inlined in zone entries. |
| Planner fork | `focss/planner/` | Own Tailwind + flat zone base sheets, chrome, controls, one `workspace.css`, dock |
| Studio fork | `focss/studio/` | Same shape as planner (no product/entry / shadcn) |
| Tech-docs | `tech-docs-generator/src/styles/` | Not FOCSS; admin opens via external link only ([`product-map.md`](./product-map.md)) |

**Inventory:** Success = **one canonical path per concern**.  
**Page rule:** tokens + base + one zone entry.  
**File size:** Keep CSS files focused and scoped to a single concern (see [`site/focss/README.md`](../../site/focss/README.md)).

## Layout import barrels

| Layout | Import | Design system |
|--------|--------|---------------|
| Site | `app/(site)/globals.css` → `@focss/site/entry.css` | Site |
| Admin | `@focss/admin/entry.css` | Admin product (FOCSS-native; `ShadcnChrome` removed) |
| Planner workspace | `@focss/planner/entry.css` (own Tailwind, no `base/scan.css`) | Planner fork |
| Studio workspace | `@focss/studio/entry.css` → shared `base/scan.css` (no shadcn) | Studio fork |

## Shell chrome (forked apps)

| Surface | Pattern |
|---|---|
| Planner top bar / dock | `components/Planner/*` + `focss/planner/*` |
| Studio top bar / dock | `components/Studio/*` + `focss/studio/*` |
| Admin shell | `features/admin/ui/*` + `focss/admin/*` |

After shared CSS changes: `pnpm run ops lint:ui` (strict: `pnpm run lint:ui:strict`) and focused browser checks where UI acceptance applies.

## Living design kit (visual contract)

Route: `/admin/design-kit/` (admin auth required).

The design kit is the materials board for admin primitives when that surface is live.

**Verification:** `pnpm run ops test:design-kit` when Playwright harness exists (`config/build/playwright.config.ts`).

## Zone shell contract (anti-drift)

| Layer | Location | Allowed | Forbidden |
|---|---|---|---|
| **1. Tokens** | zone `base/` + shared `focss/base/` | Semantic `--surface-*`, `--text-*`, `--color-*` | Feature-specific raw hex |
| **2. Primitives** | `components/ui/*` (admin) or app-local `ui/*` (forks) | One control system per zone | Fourth button system |
| **3. Zone shells** | `focss/{site,admin,planner,studio}/` | Layout, section rhythm, stages | Cross-zone presentation imports |

**Surface rule:** Light chrome uses ecru/semantic surfaces where admin/site systems apply. Pure `bg-white` shells fail `lint:ui` when that rule is wired.

**Enforcement:** `pnpm run lint:ui:strict` · `pnpm run ops check:composer-styles` · `pnpm run ops check:product-icons` · `pnpm run verify:focss` · forked scans `pnpm run ops scan:tokens` / `pnpm run ops scan:hardcoding`.

Detail for engines/packages: [`stack.md`](./stack.md). Process: [`Agents/INDEX.md`](../../Agents/INDEX.md). Stop-drift: [`focss-stop-drift.md`](../governance/focss-stop-drift.md).

## Interactive target contract

There is no single "40px" rule in this repository. Two separate bars exist and must not be
conflated in a finding, a task, or a review comment:

| Bar | Size | Nature | Source |
|---|---|---|---|
| **Floor** | 24×24 CSS px, both axes | Pass/fail. A control below this is a real accessibility defect. | [WCAG 2.2 SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) |
| **Advisory** | 40×40 CSS px, narrow viewports (≤768) | Design aspiration for primary touch controls. Not a defect on its own. | Repo convention — e.g. `site/focss/planner/controls.css` `.icon-btn` (40×40 fixed) and `.pw-step-bar__btn` (`min-height: 40px`) |

**Exemptions from the floor** (per WCAG 2.2 SC 2.5.8): inline text links within a sentence or
block of body copy, native user-agent controls whose size is not author-set, and any case where
an equivalent same-function control elsewhere on the page already meets the floor.

**What this means in practice:**

- A finding of "target below 24px" is a real defect requiring a fix.
- A finding of "target below 40px advisory" (only raised at ≤768) is a note, not a required fix.
  Fixing it is good practice but is not blocking on its own.
- `site/focss/planner/controls.css`'s `.btn--icon` is 32×32 — it clears the floor but not the
  advisory. That is acceptable; do not treat it as a defect without a specific interaction reason
  to raise it to 40×40.
- The browser audit (`scripts/site-page-audit.mjs`) implements this split as
  `targetFloorFailures` (24px, both axes, inline-link exempt) and `targetAdvisory` (40px, ≤768
  only). See `plans/ref/remediation-unified/audit.md` D4 for how the prior single
  `width < 40 || height < 40` heuristic (either axis, all viewports) produced a false-positive-heavy
  114-finding count by flagging ordinary inline links.

**Enforcement reality check:** `verify:focss`, `lint:ui:strict`, and `check:style-tokens` check
imports, structure, and token usage — none of them measures a rendered box. The floor/advisory
split above is only verifiable by the browser audit or a DOM-level test.

## Migration status (FOCSS)

| Area | Live state |
|---|---|
| CSS home | `site/focss/` (`@focss/*`) |
| Site / admin / base | Present. No `features/product/` |
| Planner + Studio forked zones | Present, self-contained entries |
| `ooshared/` shared package | **Not present** — do not document as live |
| `zones/` transitional paths | **Gone** |

**Verification:** `pnpm run verify:focss` · `pnpm run lint:ui:strict` · `pnpm run ops check:composer-styles` · `pnpm run check:style-tokens`
