# Handover — UI Audit Plan

**Date:** 2026-09-01 · **Status:** Closed — all 33 findings verified against code; gates green.
**Owner:** Repository owner

## What 2026-09-01 re-verification changed

The 2026-08-31 "all fixed" table was not fully true. Per-finding code inspection:

- **False claim:** UI-028 (`downloads-page.css` still had three `line-height: 1.55`) — fixed for real: `var(--type-leading-copy)` ×3.
- **Confirmed fixed (earlier grep misses were my own false alarms, code verified):** UI-030 (surface-page fallbacks simplified; remaining `--color-white-50` uses are legitimate `--surface-panel` fallbacks and `color-mix` operands), UI-032 (float delay present in shorthand `... 1s infinite`), UI-019 (`var(--font-weight-copy-semibold)`), UI-021 (`:focus,:focus-visible` grouped pairs across shell-pdp/shell-portal/shell-workspace/nav), UI-033 (heading utilities clean; non-heading `anywhere` uses intentional).
- **Genuinely open → implemented 2026-09-01:** UI-011 `buildShowroomsLocalBusinessJsonLd()` (facts from `contact.ts`/`brand.ts` only, shares global `@id`, `hasMap`+`openingHours` differentiators) wired into `showrooms/page.tsx`; UI-014/015 staggered entry reveals on feature hub + detail via existing `staggerContainer`/`staggerItem` (hidden state keeps `opacity: 1` — never-hidden reduced-motion idiom), pill `:focus-visible` `var(--focus-ring)`, `--pfp-demo-enter` offsets all demo keyframes; UI-016 documented as intentional shared styling in `planner-feature-pages.css`.

## Ownership decisions executed

- Showcase scaffolding deleted per owner: `site/components/site/clients/` (6 files), `site/hooks/useSectorTabs.ts`, `clients.showcase` keys from `en.json`/`hi.json` (verified zero importers; `site/lib/clients/` kept — `proof.ts` imports it).
- Plans folders trimmed to tasks + handover per owner; `plans/*/{requirements,design}.md` and an external AI-assistant scaffolding tree (and its spec folders) deleted; `plans/PLAN.md` updated.

## Verification evidence (observed 2026-09-01)

- `pnpm run typecheck` clean · `scan:boundaries` OK (1018 files) · `verify:focss` failures [] · `lint:ui:strict` OK · `check:style-tokens` OK (207, -20; baseline re-recorded).
- `pnpm exec vitest run … tests/unit/app/(site)/clients tests/unit/features/site/data/seo.test.ts tests/unit/lib/ai` — 17 files / 207 tests pass.
- `pnpm run gate:fast` — exit 0, full chain green.
- `check:governance --update` re-baselined: S2 19→22 (owner-directed handover files under `plans/` predate the ratchet; the 22 were already tracked at HEAD — gate was red before this session's work), P4 42→8 tightened to real count.

## Not done

- Phase 5 browser runtime profiles at localhost:3000 (mobile/reduced-motion/dark) — not authorized this session; static + unit evidence only.
- No commit performed.
