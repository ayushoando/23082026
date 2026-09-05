# Quick Execution Plan: Homepage UI Alignment & Auth Remediation

**Date:** 2026-09-05  
**Directory:** `plans/05092026/`  
**Governing Authority:** [`AGENTS.md`](../../AGENTS.md) (`User instruction > live code / fresh commands > AGENTS.md > Agents/ > docs/`)  
**Input Audits:**  
- [`docs/audit 05092026/homepage-and-auth-audit.md`](../../docs/audit%2005092026/homepage-and-auth-audit.md)  
- [`01-ui-focss-and-mobile-chrome.md`](./01-ui-focss-and-mobile-chrome.md)  
- [`02-route-contracts-seo-and-i18n.md`](./02-route-contracts-seo-and-i18n.md)  
**Ledger Blocker:** `AUTH-LOOP-03` in [`Failures.md`](../../Failures.md)  

---

## 1. Executive Summary

This focused plan translates the empirical findings from the multi-viewport homepage audit and the authentication forensic analysis into immediate, surgically scoped implementation steps. Changes are strictly limited to alignment, contract fixes, and blocker clearance without visual redesign or unapproved refactoring.

```
┌────────────────────────────────────────────────────────────────────────┐
│                     QUICK REMEDIATION EXECUTION ROADMAP                │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 1: Authentication Loop Fix & Client Sign-Out (AUTH-LOOP-03)      │
│   • site/proxy.ts: Eliminate superficial cookie bounce on /access      │
│   • site/features/shared/dashboard/DashboardClient.tsx: Server signOut │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 2: Multi-Viewport Homepage Alignment (1920, 1440, 1080, 768, 390)│
│   • site/components/home/HomepageHero.tsx: Restore .home-actions CTAs  │
│   • site/focss/site/components/homepage/home-type.css: Relax 11ch clamp│
│   • site/components/home/WhyChooseUs.tsx: Lower grid threshold to lg   │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 3: Cloud Telemetry & 3-Way Environment Discipline                │
│   • Retain .env.local, site/.env.example, tech-docs-generator/.env.ex  │
│   • Maintain lean telemetry: GA4, Vercel, OpenTelemetry (OBSERVABILITY)│
├────────────────────────────────────────────────────────────────────────┤
│ Phase 4: Verification & Blocker Clearance                              │
│   • Run check:docs-all, verify:focss, scan:boundaries                 │
│   • Verify /access and homepage viewports on http://localhost:3000     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Phase 1: Authentication & Sign-Out Remediation (`AUTH-LOOP-03`)

### Task 1.1: Break `/access` 307 Redirect Loop
- **File:** `site/proxy.ts` (lines 442–454)
- **Problem:** `hasSessionAuthCookies()` inspects cookie names for `sb-*-auth-token`. When a visitor has an expired or invalid Supabase cookie, the proxy immediately redirects them to `/dashboard`. The server layout at `site/lib/auth/session.ts` rejects the invalid token and bounces the user back to `/access?next=/dashboard`, creating an infinite HTTP 307 loop (`ERR_TOO_MANY_REDIRECTS`).
- **Fix:** 
  1. Do not auto-redirect visits targeting `/access` or `/login` based solely on unverified cookie presence. Allow `/access` to render so the user can re-authenticate.
  2. In `devAuthBypass.ts` / `proxy.ts`, add an explicit escape so `DEV_AUTH_BYPASS=1` on localhost does not forcibly lock out developers from testing the `/access` interface.

### Task 1.2: Fix Browser Client Sign-Out Crash
- **File:** `site/features/shared/dashboard/DashboardClient.tsx` (line 142)
- **Problem:** `createAuthClient().auth.signOut()` tries to instantiate a Supabase client in the browser requiring `NEXT_ADMIN_SUPABASE_URL`, which is server-only and undefined in browser bundles, throwing an unhandled runtime error.
- **Fix:** Replace client-side direct sign-out with the Server Action `signOutFromSupabase()` in `site/features/shared/auth/actions.ts`.

---

## 3. Phase 2: Multi-Viewport Homepage Alignment

### Task 2.1: Restore Primary Hero CTAs (1920px & 1440px)
- **File:** `site/components/home/HomepageHero.tsx`
- **Problem:** The primary conversion container `.home-actions` ("Explore Catalog" and "Launch Planner") was inadvertently missing, leaving desktop visitors without immediate entry points.
- **Fix:** Restore the `.home-actions` block with proper FOCSS button tokens and accessible links to `/products` and `/ooplanner`.

### Task 2.2: Relax Hero Title Typography Clamp
- **File:** `site/focss/site/components/homepage/home-type.css` (line 35)
- **Problem:** `.home-hero-title-homepage` has `max-width: 11ch`, forcing an aggressive, awkward 3-line word wrap on large screens.
- **Fix:** Relax the clamp to `max-width: 18ch` or `max-content` with container query responsiveness to permit balanced 2-line desktop rendering.

### Task 2.3: Lower 1080px Grid Threshold on `WhyChooseUs`
- **File:** `site/components/home/WhyChooseUs.tsx` (line 48)
- **Problem:** Card grid uses `xl:grid-cols-4` (1280px barrier). On standard 1080px desktop displays, it collapses into 2 wide horizontal slabs.
- **Fix:** Change class to `lg:grid-cols-4` so 1080px displays render a balanced 4-column row.

### Task 2.4: Mobile Chrome & Bottom Dock Clearance (768px & 390px)
- **Files:** `site/focss/site/app-shell.css`, `site/components/home/CookieConsent.tsx`
- **Problem:** At 390px, fixed bottom navigation dock (56px) + cookie consent bar occlude touch targets.
- **Fix:** Ensure proper CSS safe-area bottom padding and offset stacking (`z-index` and `padding-bottom: 4.5rem`).

---

## 4. Phase 3: Telemetry & Environment Discipline

1. **Environment Structure:** Maintain the clean 3-way split:
   - Root `.env.local` & `.env.example`: Central 7-section developer workstation configuration.
   - Next.js Site `site/.env.example`: Lean template for Next.js runtime.
   - Tech-Docs Vite SPA `tech-docs-generator/.env.example`: Minimal public configuration for `:3001`.
2. **Observability:** Maintain cloud-first posture per [`OBSERVABILITY.md`](../../OBSERVABILITY.md):
   - Google Analytics 4 (`@next/third-parties/google`)
   - Vercel Web Analytics & Speed Insights (`@vercel/analytics`, `@vercel/speed-insights`)
   - OpenTelemetry native instrumentation (`site/instrumentation.ts`)
   - Optional local `/api/metrics` Prometheus scraping.

---

## 5. Phase 4: Verification Protocol

Before declaring completion:
1. `pnpm run check:layout` — verify repository shape.
2. `node scripts/general/check-root-markdown-links.mjs` — verify doc links.
3. `pnpm run check:governance` — verify no ratchet regressions.
4. `pnpm run scan:boundaries` — verify Studio ↔ Planner isolation.
5. In browser at `http://localhost:3000`:
   - Visit `/access` with and without session cookies; confirm clean rendering and no 307 loops.
   - Trigger sign-out from `/dashboard`; confirm smooth redirection to `/access` without console errors.
   - Check homepage across 1920px, 1440px, 1080px, 768px, and 390px viewports.
6. Once verified, delete `AUTH-LOOP-03` row from [`Failures.md`](../../Failures.md).
