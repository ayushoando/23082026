# Phase 2 — Homepage

`/` starts journeys 1–2 on the client-hub map. It is not a dump of every section we still have files for.

## Product

- CTAs: `/products`, proof (`/trusted-by` or `/clients`), `/planner`, `/contact` or `/planning`.
- Do not deep-link the hero into `/ooplanner`. Tools primary CTA stays `/planner`.
- Marketing images: R2 webp, `unoptimized`. Not Vercel `/_next/image`.
- Leftover `site/components/home/Hero.tsx` is test-only. Delete only with `tests/unit/components/home/Hero.test.tsx` in the same change.
- Do not paste `D:\23082026 - Copy` CSS over live. Live already split `home-tool-cards.css`.

## CSS (was cut from the sequence — it belongs here)

Read [`../ui-audit/`](../ui-audit/) before changing homepage look.

- Tokens and FOCSS: `site/focss/site/components/homepage/`, `docs/architecture/css.md`, `Agents/07-css.md`.
- Open ui-audit items that hit `/`: title length (UI-001), color collision (UI-006), token leftovers (UI-019, UI-025–030, UI-033), reduced-motion / focus (UI-020–022) if they show on home.
- `pnpm run verify:focss` and `pnpm run lint:ui:strict` only with current-session authorization.

Verify `http://localhost:3000` desktop and phone before calling this phase done.

## Verified in source (2026-09-02) — do not re-guess

- **UI-005 is already fixed.** `typography.css`: `--font-weight-medium: 500`, `--font-weight-semibold: 600`. The ui-audit line that both are 500 is stale.
- **Hero CTAs are data-only.** `HOMEPAGE_HERO_CONTENT` and `en.json` still have primary `/planner` and secondary `/products`. `HomepageHero` does not render them. `HomepageHero.test.tsx` asserts those links are absent. The visible hero action is glass proof → `/trusted-by/`. Products sit in Collections; planner launch sits in InteractiveTools (`/planner`). Do not put the two buttons back without a design pass and a test change.
- **Hero images are R2 path + `unoptimized`.** Poster and slides under `/assets/marketing/hero/`.
- **`Hero.tsx` is unused by pages.** Only `tests/unit/components/home/Hero.test.tsx` imports it. Leave it until we delete test + component together.
- **`demoHref="/ooplanner"`** on InteractiveTools is the floorplan demo, not the primary CTA (`launchHref` is `/planner`). Leave until we see it in the browser.
- **`loginHref: /login/?next=/planner/canvas/`** lives in `homepage.ts` but is used by `PlannerSuite` on the **planner landing**, not `/`. `/login` 308s to `/access`; `/planner/canvas` 308s to `/ooplanner`. Sloppy, not a homepage bug. Touch in Phase 3 or planner marketing, not here.
