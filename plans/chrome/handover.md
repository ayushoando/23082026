# Chrome handover (2026-09-02)

Owner sequence: [`../PLAN.md`](../PLAN.md). Blockers: [`../../Failures.md`](../../Failures.md). Do not copy blocker IDs elsewhere.

## What is live in code

- Public name **Portfolio** at `/portfolio`. `/clients` is a 308 only (`indexable: false`).
- Header cap **9**: Products, Solutions, Portfolio, Planner, About, Contact, Trusted By, Sustainability, FAQ. No More. Planning, Showrooms, Careers, After Sales, Downloads are footer-only.
- Mobile tabs: Products, Planner, Quote (`/contact`), Portfolio, Account. No Home, no About tab.
- Header EN|HI is compact (1.75rem). Drawer EN|HI stays 44px. Search bar is width-locked (no `flex-1`).
- FAQ `<summary>` is block + body type, not flex + display-title.
- `/faq` is in static SEO metadata and the HTML sitemap.
- Marketing type **tokens** exist; **page CSS still reclamps** (see open list).

## Tests observed this session

Targeted vitest (`tests/vitest.config.ts`) on the former gate-red files: **126 passed** (SEO, portfolio, drawer, planner adapter, withAuth, auth-bypass-status, proxy, exports, plannerFinalReconciliation).

**Full `pnpm run gate` was not re-run after those fixes.** Last full gate: exit 1 at vitest. See Failures.md.

`lint`, `lint:ui:strict`, `typecheck` passed earlier in the session (before the last test edits).

## Do not redo

- `/clients` as an indexable page.
- Home in the mobile tab bar.
- Careers / After Sales / Downloads in the header.
- Planning next to Planner in header More.

## Next (in order)

1. Re-run `pnpm run gate` and record the result (required before claiming ship).
2. Header at **1078px** — nine links plus search + EN|HI will crowd; overflow or cut.
3. Strip leftover `font-size: clamp(...)` in `site/focss/site/` (start `editorial-hero.css`).
4. `unoptimized` on remaining `next/image` (contact teaser, showcase, partnership, about/solutions/sustainability stories, footer marquee).
5. Phase 4 walk: 1920 / 1440 / 1078 / 390 on `http://localhost:3000` (not `127.0.0.1`).
6. Calculators stay noindex until they are real tools.

## Open product list (not Failures.md)

These are unfinished work, not hard blockers:

- Homepage / editorial / catalog / planner-landing still size type locally.
- FAQ H1 split (“Frequently asked” + “questions”) can concatenate for AT.
- Duplicate Quote: app-bar Get Quote + tab Quote.
- `planner-comprehensive-audit` is dated; tests still import it. Paths were pointed at live files; `.kiro/` refs removed.
- `next-env.d.ts` imports `.next/dev/types` (Next generator).
- `pnpm dev` was restarted after a crash; confirm `http://localhost:3000`.
