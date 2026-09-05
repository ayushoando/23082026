# Quick Execution Plan: Homepage UI Alignment & Auth Remediation

**Date:** 2026-09-05  
**Directory:** `plans/05092026/`  
**Governing Authority:** [`AGENTS.md`](../../AGENTS.md) (`User instruction > live code / fresh commands > AGENTS.md > Agents/ > docs/`)  
**Input Audits:**  
- [`docs/audit 05092026/homepage-and-auth-audit.md`](../../docs/audit%2005092026/homepage-and-auth-audit.md)  
- [`01-ui-focss-and-mobile-chrome.md`](./01-ui-focss-and-mobile-chrome.md)  
- [`02-route-contracts-seo-and-i18n.md`](./02-route-contracts-seo-and-i18n.md)  
**Ledger:** [`Failures.md`](../../Failures.md) only. Empty table is valid. Do not re-add AUTH-LOOP-03 without a bypass-off `/access` repro.  

## Execution checklist (leave open)

This is Plan 16. Unchecked = not finished.

- [x] `/access` proxy no longer 307s on cookie names (`site/proxy.ts`)
- [x] Dashboard sign-out does not call `createAuthClient` (`signOutFromSupabase` only)
- [ ] `/access` cookie-loop proof on `http://localhost:3000` with **bypass off**
- [ ] Dashboard sign-out lands on `/access` with bypass off (bypass run hung; not production auth)
- [x] Hero `.home-actions` — live hrefs `/ooplanner` + `/products`
- [x] Hero title clamp `18ch` at `lg+`
- [x] WhyChooseUs `lg:grid-cols-4` (4 columns observed at 1080)
- [ ] Mobile 390 cookie + dock + FAB overlap with cookie bar visible
- [ ] Do not write AUTH-LOOP-03 into `Failures.md` unless a bypass-off repro exists

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

### Task 1.1: `/access` proxy (source current)
- **File:** `site/proxy.ts`
- **Live:** Unauthenticated **protected** paths 307 **to** `/access`. `/access` itself is not bounced on `sb-*-auth-token` cookie names. `?direct=true` exists on `access/page.tsx` for bypass UI.
- **Open:** Bypass-off cookie-loop browser proof on `http://localhost:3000`.

### Task 1.2: Dashboard sign-out (source current)
- **File:** `site/features/shared/dashboard/DashboardClient.tsx`
- **Live:** `signOutFromSupabase()` from `site/lib/auth/supabaseServerActions.ts`. No `createAuthClient`. Navigates to `/access?direct=true` with an 8s race. `site/features/shared/auth/actions.ts` does not exist.
- **Open:** Sign-out landing with **bypass off**.

---

## 3. Phase 2: Multi-Viewport Homepage Alignment

### Task 2.1: Hero CTAs (source current)
- **File:** `site/components/home/HomepageHero.tsx`
- **Live:** `.home-actions` exists. Links are `/ooplanner` and `/products`. Labels from i18n (`Get your layout plan` / `Browse products`). Not “Explore Catalog / Launch Planner”. `en.json` `primaryCta.href` is `/planner` and is **not** what the component uses.

### Task 2.2: Title clamp (source current)
- **File:** `site/focss/site/components/homepage/home-type.css`
- **Live:** `lg+` `max-width: 18ch` (not 11ch).

### Task 2.3: WhyChooseUs (source current)
- **File:** `site/components/home/WhyChooseUs.tsx`
- **Live:** `lg:grid-cols-4` (not `xl:grid-cols-4`).

### Task 2.4: Mobile Chrome & Bottom Dock Clearance (768px & 390px)
- **Files:** `site/focss/site/app-shell.css`, `site/components/home/CookieConsent.tsx`
- **Problem:** At 390px, fixed bottom navigation dock (56px) + cookie consent bar occlude touch targets.
- **Fix:** Ensure proper CSS safe-area bottom padding and offset stacking (`z-index` and `padding-bottom: 4.5rem`).

---

## 4. Phase 3: Telemetry & Environment Discipline

1. **Environment Structure:** Three live templates:
   - [`.env.example`](../../.env.example) → `.env.local` and `site/.env.local`. Default `DEV_AUTH_BYPASS=1`.
   - [`site/.env.example`](../../site/.env.example) Next runtime. Default `DEV_AUTH_BYPASS=0`. Prod host `https://oando.co.in`.
   - [`tech-docs-generator/.env.example`](../../tech-docs-generator/.env.example) public Admin anon keys only, port `3001`, prod `https://oando23.vercel.app`.
2. **Observability:** Cloud-first per [`OBSERVABILITY.md`](../../OBSERVABILITY.md):
   - Google Analytics 4 (`NEXT_PUBLIC_GA_MEASUREMENT_ID`; live loader is `site/components/analytics/GoogleAnalytics.tsx`, not `@next/third-parties/google`)
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
6. Do not write an AUTH-LOOP row into [`Failures.md`](../../Failures.md) unless a bypass-off repro exists. The table is currently empty.
## Test reconciliation update (2026-09-05)

## Smallest executable follow-up, once authorized

1. Pick one observed homepage or access defect; do not combine desktop polish, auth changes and mobile chrome merely because they share this document.
2. Capture its current revision, rendered owner or redirect chain, expected result and reproduction state. Earlier audit descriptions are hypotheses until reproduced.
3. For mobile chrome, decide consent/FAB behavior, identify the actual visible button owner and restrict the proposed CSS batch to the requested breakpoint. Use Plans 01 and 13 for state coverage.
4. For access, use Plan 11's actor/session matrix; a bypass-backed page load does not reproduce or clear production authentication behavior.
5. Propose exact changed files and affected checks, obtain the needed execution authorization, and record only observed results. Do not regenerate baselines as a shortcut to approval.
6. Stop after the selected batch's evidence is reviewed. Refer wider test-folder work to Plan 06 and report-generation accuracy to Plan 05.

Acceptance: one defect has a traceable cause, bounded change and matching evidence; unresolved cases remain pending. This short plan does not authorize implementing the older desktop proposals or deploying the result.

Coordinate the test cleanup through Plan 06: classify each file, move bounded ownership groups, repair assertions/baselines, then verify discovery and authorized execution. All thirteen domain plans retain ownership of their behavior contracts; historical counts and results are not current clearance evidence.

Acceptance: record current path, owner, destination/disposition, preserved assertions, affected commands, and evidence. A filename or age alone is insufficient grounds for retirement. Runtime validation remains pending; this update changes planning documents only.
