# 37 — Deployed Preview Check (https://23082026.vercel.app/)

**Date:** 2026-09-01 · **Method:** live fetches (homepage, sitemap.xml, /tools page, /portfolio, asset) — no browser/console run yet.

## Observed

| Check | Result | Evidence |
|---|---|---|
| Homepage | 200, renders fully | Title, hero, categories, contact form all present |
| /tools/office-space-calculator | 200, fully rendered | New tools pages ARE deployed |
| /portfolio/ (linked from "Recent installs" cards) | 200 via redirect → `/clients/` | Not a 404 |
| Brand logo asset `/assets/marketing/brand/logos/logo-sharp.png` | 200 (PNG bytes) | At least brand assets serve on preview |
| sitemap.xml | 200, but **missing routes that exist on disk**: `/tools/meeting-room-capacity-calculator`, `/tools/office-space-calculator`, `/choose-product`, `/quote-cart` | `/dashboard`, `/login`, `/portal*` exclusion is plausibly intentional (private) |
| **Navbar** | **Primary nav links missing — only "Get Quote" renders.** No Products / Solutions / Planner / About / Contact links in the served header | Matches user report "navbar missing two important links" |

## Likely causes (to verify in code, not yet confirmed)

- Navbar: the nav is either conditioned on something that fails on the preview (e.g. `MobileNavDrawer`/`SiteHeader` changes — note `site/components/site/MobileNavDrawer.tsx` has uncommitted local modifications) or the desktop nav links list was regressed in the deployed commit.
- Sitemap: `site/app/sitemap.ts` (or sitemap lib) enumerates routes from a static list that predates the tools pages — needs to include the new routes (and a decision on choose-product/quote-cart).
- 404s / R2 / console errors: brand assets serve 200 on preview; the R2 fallback path is a CF-worker behavior that only applies in front of the production domain, NOT on `*.vercel.app` previews — product-image 404s on this preview are expected where assets live only in R2. Needs a browser run (agent-browser) for the full console-error + 404 list to separate real breakage from preview-domain artifacts.

## Remaining (this area)

- [ ] Browser pass (console errors + full 404 list + R2 asset sampling) — needs dev-browser authorization or production domain.
- [ ] Fix navbar link rendering (inspect SiteHeader/MobileNavDrawer; commit or fix the deployed regression).
- [ ] Add missing routes to sitemap generation (tools ×2, decide choose-product/quote-cart).
- [ ] Re-check on production domain (worker HSTS/R2 paths) once CF-TOKEN-01 deploy is done.
