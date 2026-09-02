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
