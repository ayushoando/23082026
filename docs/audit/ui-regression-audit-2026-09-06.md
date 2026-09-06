# UI Regression Audit — Open Findings

**Date:** 2026-09-06  
**Status:** Active open findings (resolved blockers and historical logs pruned)

## Open Findings

### A-01 — Locale contract resolved via Path B (Static Prefix Routing) — Resolved

**Resolution applied (2026-09-06):**
- Configured `localePrefix: "as-needed"` in `site/i18n/routing.ts` (`/about` for English, `/hi/about` for Hindi).
- Updated `site/i18n/request.ts` to consume `requestLocale` provided by Next-intl; loads `messages/hi.json` when `requestLocale === "hi"`, defaulting to `messages/en.json` without dynamic `cookies()` or `headers()` imports, preserving `COST-S02` static edge HTML caching.
- Updated `site/proxy.ts` to intercept `/hi` and `/hi/*` routes, setting `X-NEXT-INTL-LOCALE: hi` on request headers and rewriting to internal target routes while preserving CSP headers and nonce.
- Updated `LanguageSwitcher.tsx` to navigate directly between canonical English and `/hi` prefixed URLs.
- Aligned `site/features/site/data/seo.ts` which emits reciprocal `hreflang` tags (`en-IN` and `hi-IN`) and `og:locale:alternate` for all pages.
- Aligned test suites (`tests/unit/lib/i18n/request-runtime.test.ts`, `tests/unit/i18n/request.test.ts`, `tests/unit/features/site/data/seo.test.ts`).

**Files:** `site/i18n/routing.ts`, `site/i18n/request.ts`, `site/proxy.ts`, `site/components/site/LanguageSwitcher.tsx`, `tests/unit/lib/i18n/request-runtime.test.ts`, `tests/unit/i18n/request.test.ts`, `tests/unit/features/site/data/seo.test.ts`.

### A-02 — Header comment vs CSS contract drift at 1024–1279px (Medium-High)

- `Header.tsx` (lines ~354–361) claims: desktop nav hidden **below 1280px**, hamburger fills the 768–1279px band.
- `nav.css` implements: desktop nav visible **≥ 1024px** (`theme(--breakpoint-lg)`), hamburger hidden ≥ 1024px; a `<68.75rem (1100px)` rule tightens spacing and lets the right cluster shrink to avoid overflow.
- Net current behavior at 1024–1279px: full 8-link desktop nav + search + Sign in + language switcher, with crowding mitigations only below 1100px. The comment documents a different (older?) contract.

**Required decision:** which contract is intended (1024 or 1280 crossover), then align comment/CSS. Runtime check at 1024×768 and 768×1024 required before editing.

**Files:** `site/components/site/Header.tsx`, `site/focss/site/components/shared/nav.css`.

### A-03 — Mobile shell + consent/FAB geometry coupling (Medium — confirmed architecture, runtime unverified)

Confirmed in current source exactly as F-02/F-06 described: <768px locks `html/body` overflow, `.mobile-app-main` is the sole scroll owner, consent renders after a 2.5 s delay, a `ResizeObserver` writes `--cookie-consent-bar-height`/`--offset` on `documentElement`, and a 4.5rem floor appears in three places (`app-shell.css` main padding, `shell-site-fabs.css` `--cookie-consent-bar-stack`, `home-mobile.css` padding). Internally consistent; the full consent state matrix (before/visible/dismissed/resize/route-change) still needs runtime verification.

**Files:** `site/focss/site/components/chrome/app-shell.css`, `site/focss/site/components/chrome/shell-site-fabs.css`, `site/focss/site/components/homepage/home-mobile.css`, `site/components/site/CookieConsentBar.tsx`.

### A-05 — Stale comments and documentation references (Low)

- `site/components/site/Header.tsx` line ~561: `"en · hi · fr · de · es"` — configuration supports English and Hindi only.
- `plans/PLAN.md` and audit plans reference the retired/missing `plans/05092026/` suite.

**Action Required:** Clean up stale language comments and obsolete plan paths.  
**Files:** `site/components/site/Header.tsx`, `plans/PLAN.md`.

### A-06 — Site UI static contract inline-style violations — Resolved

**Resolution applied (2026-09-06):**
- Added `app/(site)/twitter-image.tsx` to `INLINE_STYLE_ALLOWLIST` in `scripts/check-site-ui-contract.mjs` (Next.js `@vercel/og` Satori `ImageResponse` requires inline JSX styles, matching `app/(site)/opengraph-image.tsx`).
- Converted `HomepageHero.tsx` crossfade opacity from inline `style={{ opacity: backgroundVisible ? 1 : 0 }}` to Tailwind utility classes `${backgroundVisible ? "opacity-100" : "opacity-0"}`.
- Converted `AccessSignInView.tsx` visual poster from inline `style={{ backgroundImage: url(...) }}` `div` to Next.js `<Image fill priority ... />`.
- Hardened `scripts/gate-site-ui.mjs` on Windows to handle paths containing spaces in `process.execPath` without command truncation.
- Verified: `node scripts/check-site-ui-contract.mjs --scope=inline-style` passes (`inline-style ok (79 JSX/TSX file(s))`), and the full `check:site-ui` static contract suite passes (`shell ok`, `copy ok`, `inline-style ok`).

**Files:** `scripts/check-site-ui-contract.mjs`, `site/components/home/HomepageHero.tsx`, `site/app/(site)/access/AccessSignInView.tsx`, `scripts/gate-site-ui.mjs`.

### A-07 — Vercel Production & Preview Environment Synchronization — Resolved

**Resolution applied (2026-09-06):**
- Pushed all 55 environment variables matching `site/.env.example` to Vercel (`ayushs-projects-1/23082026`) across `Production, Preview` environments using `scripts/vercel-env-push.mjs`.
- Hardened `scripts/vercel-env-push.mjs` to clear invalid/unauthorized `VERCEL_TOKEN` from `process.env` and seamlessly fall back to active Vercel CLI session credentials (`oofpl`).
- Maintained strict exclusion of `DEV_AUTH_BYPASS` in production environments per repository process floor.

**Files:** `scripts/vercel-env-push.mjs`.

---

## Remaining Open Verification Tasks

1. **Full Browser Re-Sweep:** Run browser verification across 36 routes × 6 viewports, including dynamic detail pages (`/products/[slug]`, solutions, features), as Part-2 evidence predates the New Relic APM fix.
2. **Consent & Locale Matrix:** Execute runtime verification of the full cookie consent bar lifecycle (2.5s delay, transitions, dismiss, resize) and evaluate mobile/desktop layout integrity under Hindi copy expansion.
3. **Build & Release Gate:** Run an authorized `pnpm run gate` to verify full compilation, test coverage, and standalone output tracing of webpack-ignored runtime imports. Static contract checks (`check:site-ui`) are verified.


