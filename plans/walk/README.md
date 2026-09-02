# Phase 4 — Walk

Browser at `http://localhost:3000`. Not Markdown. Desktop and phone.

**2026-09-02 walk (Chrome, localhost:3000):**

Desktop 1440: header Products / Solutions / Clients / Planner `/planner` / About / Contact / Sign in `/access`. Footer has no dashboard/portal/ooplanner.

Phone 390: Get Quote + hamburger; tabs Home, All Products, Planner `/planner`, About, Sign in.

Home: proof → `/trusted-by/`; categories → six product pages; Launch planner → `/planner/`; floorplan demo still → `/ooplanner/?siteSource=/`.

Fixed this walk: trust logos now use kebab-case files from `clientLogos.ts` (old `Titan.png` etc. 404ed). Showcase slides now `/clients` not `/portfolio`.

Still open: contact-band image goes through `/_next/image/` in dev; client-logo PNGs also via `/_next/image/` (R2 is the production optimizer). `/planner` “Start free” → `/choose-product/?mode=guest` (utility, journey 7). Catalog product images load from `https://oando.co.in/assets/catalog/...`.

1. `/` → products → category → product → contact
2. `/trusted-by` and `/clients` as siblings
3. `/planning` and `/planner` → `/ooplanner` only when launching the app
4. `/access` from Sign in / Account only

Hunt leaks to `/ooplanner`, `/portal`, `/dashboard`, `/admin`.

From [`../ui-audit/`](../ui-audit/) and [`../seosec/`](../seosec/): only a failure you see on this walk. No second audit dump.

## Prior static inventory (2026-08-31, not a browser result)

Wave 1 checkpoint under `.archive/agents-work/site-ui-content-links-audit/`: 70 links, 0 recorded link defects, **5 pending runtime links**, 57 nav records, 23 states, **9 journeys / 3 coverage gaps**. The NDJSON inventories it pointed at (`results/site-ui-content-links-audit/…`) are not on disk. Use the client-hub map and this walk; do not rerun that wave programme.

