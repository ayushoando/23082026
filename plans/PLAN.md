# Client-hub plan (one sequence)

Spine: `agents-work/client-hub/flowcharts/clients-hub-flow.md`.  
This is the only active plan.

R2 is the image optimizer. `D:\23082026 - Copy` is reference only. Studio, Admin, APIs, worker deploy, and `CF-TOKEN-01` are out.

## Already done

Footer, mobile Planner tab, and header labels match the map. Client-hub flattened. Do not redo.

## Keep here

- This file
- `README.md`
- `planner-comprehensive-audit/*.ts` (tests import these)

Closed audit packets live under `.archive/plans/`. Do not resurrect `plans/audit/01–37`.

---

## Phase 0 — Slim `plans/`

Archive leftover packets. Index this file only.

## Phase 1 — Chrome

`site/features/site/data/navigation.ts` is the public chrome contract.

- Header: Products, Solutions, Clients, Planner `/planner`, About, Contact. Sign in stays a utility.
- Footer: no `/dashboard`, `/portal`, `/ooplanner`, `/admin`.
- Mobile Planner tab stays `/planner`.
- Check ≥1280 nav and `<768` Get Quote + tabs.

## Phase 2 — Homepage

`/` starts journeys 1–2. CTAs: `/products`, proof, `/planner`, `/contact` or `/planning`. No hero deep-link to `/ooplanner`. Marketing images stay `unoptimized` (R2). Delete leftover `Hero.tsx` only with its test. Do not paste Copy CSS over live. Verify `http://localhost:3000` desktop + phone.

## Phase 3 — Map equals code

- Redirects: map §4 must match `config/build/next.config.js` (live wins).
- Calculators: one indexability story in map, `routeClassification.ts`, and sitemap.
- `/compare`, `/quote-cart`, `/choose-product`, `/tools/*` stay out of chrome.

## Phase 4 — Walk

Browser, not Markdown. Hunt leaks into `/ooplanner`, `/portal`, `/dashboard`, `/admin`.

1. `/` → products → category → product → contact
2. `/trusted-by` and `/clients` as siblings
3. `/planning` and `/planner` → app only when launching
4. `/access` from Sign in / Account only

## Done when

A stranger can follow the map using header, footer, and tabs. Public chrome has no client-access or admin URLs. Redirects and calculator indexability match the map. Homepage does not skip to the app. Images come from R2. Home, products, clients, `/planner`, `/access` checked on localhost, desktop and phone.

Order: 0 → 1 → 2 → 3 → 4. Commit when a phase is actually done.
