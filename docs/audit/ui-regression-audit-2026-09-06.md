# UI Regression Audit — Current-Source Findings

**Date:** 2026-09-06
**Branch:** `main`
**Mode:** Read-only source/history audit (no files changed, no commands beyond read-only `git log`/`git show`)
**Inputs:** [`plans/ui-regression-audit-report.md`](../../plans/ui-regression-audit-report.md), [`plans/ui-regression-audit-and-repair.md`](../../plans/ui-regression-audit-and-repair.md), root [`AGENTS.md`](../../AGENTS.md), `Agents/` handbooks, `docs/governance/rules.md`

## Scope completed

| Audit order step | Depth | Status |
|---|---|---|
| 1. Shared application shell | Full source read (layout, header, nav data, nav.css, app-shell.css, FABs, consent bar, chrome rules) | Source-audited; runtime pending |
| 2. Locale and navigation contracts | Full source read (i18n config/request/routing, proxy, switcher, planner entry) | Source-audited; runtime pending |
| 3. Homepage | Full source read (page, hero, hero messages en+hi) | Source-audited; runtime pending |
| 4. `/access` | Entry route + auth-redirect contract read | Source-audited; runtime pending |
| 5–7. Client-hub / Studio+Planner / Admin | Route inventory + entry-contract level only | Not deep-audited (stopped on user request) |

All runtime/browser checks from the plan's viewport matrix are **not performed** and are not claimed.

## Corrections to `plans/ui-regression-audit-report.md`

That report reviewed head `7b199e1`; current head is `17e256e`. Re-verified against live source:

- **F-01 (header breakpoint conflict):** The described `<1100px` hamburger re-show rule, ninth-link hiding, and "More" menu rules **do not exist in current `nav.css`**. Current `nav.css` is internally consistent (desktop nav ≥ 1024, hamburger < 1024). A *different* contradiction exists (see A-02).
- **F-03 (planner route split):** Current hero CTAs in **both** `en.json` and `hi.json` point to `/planner` (primary) and `/products` (secondary) — consistent with the nav contract. The reported `/ooplanner` hero destination no longer exists (likely fixed by commit `ff7353e`).
- **F-04 (locale-owned CTA hrefs):** Still true structurally (`hero.primaryCta.href` lives in locale JSON), but current values agree across en/hi.
- **F-07 (CSP removed New Relic origins):** Not current — `site/proxy.ts` and `site/next.config.js` static headers **both still include** New Relic script/connect origins (`js-agent.newrelic.com`, `bam.nr-data.net`, `*.nr-data.net`).
- **F-08 (hidden mobile CTA):** Current `MobileAppShell.tsx` renders brand + menu + search only — no CTA element at all. Classifies as current-state minimal chrome, pending runtime confirmation.
- **Plan references stale:** `plans/05092026/` (README + modules 01/02/10) referenced by both plans and `plans/PLAN.md` **does not exist on disk**. `plans/archive/` contains only `cleared-blockers.md`.

## Findings (current source)

### A-01 — Locale contract severed server-side (High) — top i18n regression candidate

`LanguageSwitcher` writes the `NEXT_LOCALE` cookie and hard-reloads, but **nothing server-side ever reads it**:

- `site/i18n/request.ts` unconditionally returns `locale: defaultLocale ("en")` + `en.json` (static, for HTML caching — comment cites COST-S02).
- `site/app/layout.tsx` and `site/lib/layout/siteLayoutContext.ts` call `getLocale()`/`getMessages()` from that config → always `en` / `en.json`. `<html lang>` is always `en-IN`.
- `site/lib/i18n/withLocaleCopy.ts` gates the Hindi patch on `getLocale() !== "hi"` → the gate can never open. All nine `withLocaleCopy` consumers (clients, portfolio, trusted-by, downloads, faq, sustainability, planning, service, showrooms) always render English.
- `routing.ts` uses `localePrefix: "never"` — there are no `/hi` URLs to hit either.
- Grep confirms zero server-side `NEXT_LOCALE` readers (only the client switcher and comments).

**Consequence:** switching to Hindi has no effect on rendered copy anywhere — matches the reported "many i18n behaviors are non-functional or inconsistent."

**Caveat:** the `en` pin exists since initial import (`9c82fec`), so this may be *never-worked* rather than *recently regressed*; `withLocaleCopy` (added later in `f0885df`) was born unreachable. Runtime confirmation still required.

**Files:** `site/i18n/request.ts`, `site/lib/i18n/withLocaleCopy.ts`, `site/components/site/LanguageSwitcher.tsx`, `site/i18n/routing.ts`, `site/lib/layout/siteLayoutContext.ts`, `site/app/layout.tsx`.

### A-02 — Header comment vs CSS contract drift at 1024–1279px (Medium-High)

- `Header.tsx` (lines ~354–361) claims: desktop nav hidden **below 1280px**, hamburger fills the 768–1279px band.
- `nav.css` implements: desktop nav visible **≥ 1024px** (`theme(--breakpoint-lg)`), hamburger hidden ≥ 1024px; a `<68.75rem (1100px)` rule tightens spacing and lets the right cluster shrink to avoid overflow.
- Net current behavior at 1024–1279px: full 8-link desktop nav + search + Sign in + language switcher, with crowding mitigations only below 1100px. The comment documents a different (older?) contract.

**Required decision:** which contract is intended (1024 or 1280 crossover), then align comment/CSS. Runtime check at 1024×768 and 768×1024 required before editing.

**Files:** `site/components/site/Header.tsx`, `site/focss/site/components/shared/nav.css`.

### A-03 — Mobile shell + consent/FAB geometry coupling (Medium — confirmed architecture, runtime unverified)

Confirmed in current source exactly as F-02/F-06 described: <768px locks `html/body` overflow, `.mobile-app-main` is the sole scroll owner, consent renders after a 2.5 s delay, a `ResizeObserver` writes `--cookie-consent-bar-height`/`--offset` on `documentElement`, and a 4.5rem floor appears in three places (`app-shell.css` main padding, `shell-site-fabs.css` `--cookie-consent-bar-stack`, `home-mobile.css` padding). Internally consistent; the full consent state matrix (before/visible/dismissed/resize/route-change) still needs runtime verification.

**Files:** `site/focss/site/components/chrome/app-shell.css`, `site/focss/site/components/chrome/shell-site-fabs.css`, `site/focss/site/components/homepage/home-mobile.css`, `site/components/site/CookieConsentBar.tsx`.

### A-04 — Planner entry contract is documented and self-consistent (Info)

`site/lib/analytics/plannerEntry.ts` + `productSuite.ts` define: nav/footer → `/planner` marketing landing; guest canvas → `/ooplanner` via `/choose-product?mode=guest`; PDP deep links → `/ooplanner?siteProduct=…`. Header/mobile tabs use `PlannerLaunchLink`/`TrackedLink` correctly per that contract. F-03's "two competing entry paths" is not supported by current source. `activeTabFor` accepting both `/planner` and `/ooplanner` is deliberate tab highlighting.

### A-05 — Stale comments/docs that mislead future audits (Low)

- `Header.tsx` line ~561: "en · hi · fr · de · es" — config is en + hi only.
- `plans/PLAN.md` and both audit plans point into the missing `plans/05092026/` suite.
- The prior audit report's F-01/F-03/F-07 no longer match source (see corrections).

## Page audit ledger (plan §Ledger, current status)

| Page/route | 1024×768 | 768×1024 | Mobile | i18n | Status |
|---|---|---|---|---|---|
| Shared shell | source-only | source-only | source-only | source-only | source-audited, runtime pending |
| Homepage `/` | source-only | source-only | source-only | source-only | source-audited, runtime pending |
| `/access` | — | — | — | source-only | source-audited, runtime pending |
| Client-hub routes | — | — | — | — | route inventory only (40 routes under `(site)`) |
| `/planner` / `/ooplanner` | — | — | — | — | entry contract audited only |
| Admin | — | — | — | — | not audited |

## Verified vs not performed

- **Verified:** static source reads listed above; two read-only git commands (`git log`, `git show`) against the local repo. No file was modified, restored, or reverted. No service started, no tests/gates/builds run.
- **Not performed (requires explicit authorization):** the full runtime viewport matrix (1024×768, 768×1024, 390×844, 412×915, 1280×800, 1440×900), consent state matrix, locale-switch runtime behavior, console/CSP error capture, any CSS gate (`verify:focss` etc.), and any repair. Existing `output/` directory was left untouched; generated evidence belongs under `results/` per repo layout.

## Recommended next actions

1. Populate the runtime shared-shell ledger first (plan's "Immediate next action") at 1024×768 and 768×1024.
2. Decide the A-01 contract: either re-couple `NEXT_LOCALE` to request resolution or retire the switcher — this is the highest-leverage fix for the reported i18n symptoms and must be designed against the COST-S02 caching intent before any edit.
3. Resolve A-02 by product decision (1024 vs 1280 crossover), then align `nav.css` and the `Header.tsx` comment in one slice.

---

# PART 2 — Runtime audit results (same day, authorized browser sweep)

**Method:** agent-browser 0.36.0 (Chrome for Testing 152), named session, against the already-running dev server at `http://localhost:3000`. Every route opened at 6 viewports (1920×1080, 1440×900, 1024×768, 768×1024, 450×950, 390×844): load → title/URL/errors/console capture → screenshot. ~370 valid combos. Evidence: `results/ui-audit-2026-09-06/` (screenshots per route × viewport + `summary.jsonl`, `summary-retry.jsonl`, `summary-dynamic.jsonl`).

**Note:** during the sweep, `main` advanced: `4ad56ef` (retired the planning suite — explains the missing `plans/05092026/`) and `62a42ec` (New Relic APM integration), which is now HEAD. Part 1 findings F-01/F-03/F-07 corrections were checked against the pre-`62a42ec` tree; everything below reflects `62a42ec`.

## R-01 — ROOT CAUSE of the "large UI regression": New Relic APM import breaks webpack compilation (Blocker)

- `site/instrumentation.ts:13` does `await import("newrelic")` (introduced in `62a42ec`, gated at **runtime** by `NEW_RELIC_APM_ENABLED === "1"`).
- The env gate does **not** gate **compilation**: webpack bundles the dynamic import; the newrelic package's subscriber loader sweeps `lib/subscribers/*` including `README.md` → `Module parse failed: Unexpected character '' (1:1)` (verified in the captured build-error overlay, `results/ui-audit-2026-09-06/products/1920x1080.png`).
- `NEW_RELIC_APM_ENABLED` is present in **neither** `.env.local` nor `site/.env.local`, so the agent never even runs — the site pays the full compile cost for nothing.
- **Blast radius (observed, all 6 viewports each):** 25 of 36 audited routes render **blank** (empty title/document, build-error overlay): /products, /planner, /planner/features, /planner/help, /ooplanner, /oostudio, /admin, /portal, /portal/guest, /access (1920 only), /portfolio, /trusted-by, /clients-page siblings — full list in ledger below. 11 routes render normally (/, /about, /career, /choose-product, /clients, /contact, /compare, /dashboard, /downloads, /faq, /offline) — consistent with stale webpack cache compiled before `62a42ec`.
- **Severity beyond dev:** `next build` would hard-fail on the same module-parse error → **this is a ship blocker**, not a dev-only artifact.

## R-02 — Header right-cluster overflow at 1024×768 (runtime confirmation of A-02)

At 1024×768 the desktop nav renders (8 links, hamburger hidden — matching `nav.css`, contradicting the `Header.tsx` comment), and the right cluster overflows: the search input collides with "Sign in" and the EN|HI toggle clips at the right edge (`results/ui-audit-2026-09-06/home/1024x768.png`).

## R-03 — Mobile shell healthy on compiling pages

Home @ 390×844: app bar (logo/hamburger/search), 5-tab bar (Products/Planner/Quote/Portfolio/Sign in), FABs, hero underlap all correct. Mobile chrome itself is not the regression; pages only fail where compilation fails.

## R-04 — Console evidence

Zero real client-side page errors on every rendered combo. The only `[error]` console lines are server-side newrelic/grpc agent warnings forwarded by Next dev — consistent with R-01, noise on otherwise-blank pages.

## R-05 — Redirects observed

`/login → /access` (canonical member sign-in) and `/solutions → /products` (canonicalization). Both expected; recorded as behavior, not defects.

## Runtime ledger (36 routes × 6 viewports)

| Status | Routes |
|---|---|
| Renders (title + content) | /, /about, /career, /choose-product, /clients, /contact, /compare, /dashboard, /downloads, /faq, /offline, /login→/access |
| BLANK — R-01 build error | /products, /portfolio, /trusted-by, /planner, /planner/features, /planner/help, /ooplanner, /oostudio, /admin, /portal, /portal/guest, /access (1/6), /privacy, /terms, /refund-and-return-policy, /service, /showrooms, /sitemap, /solutions, /sustainability, /quote-cart, /tools, /tools/meeting-room-capacity-calculator, /tools/office-space-calculator, /planning (3/6) |
| Dynamic detail pages | not swept — script defect (slug resolver returned a string; single-char junk routes captured, excluded from ledger) |

## Proposed repair slice (NOT applied — requires explicit authorization)

Smallest sound change consistent with "no broad revert": externalize the APM agent from the webpack graph in `site/next.config.js` (`serverExternalPackages: ["newrelic"]`) so `instrumentation.ts` keeps its runtime gate but the package is no longer bundled; then re-verify the 25 blank routes at 1024×768 + 390×844 and run an authorized `pnpm run build`. Alternative (product decision): drop the APM loader entirely from `instrumentation.ts`.

## Changed / verified / not done (Part 2)

- **Changed:** only `docs/audit/ui-regression-audit-2026-09-06.md` (this file). No source files touched.
- **Verified:** browser sweep + screenshots + console capture listed above; read-only git inspection (`git log`, `git show`, `git log -S`).
- **Not done:** any repair, `pnpm build`/gates, dynamic detail-page sweep (script defect — noted), HI-locale runtime pass (superseded by R-01 blocking most pages), killing or restarting the user's dev server.

# PART 3 — Resolution verified (same day, post-fix)

## Fix landed (owner-applied)

Commit `ea1345e` resolved R-01 by marking the dynamic import `/* webpackIgnore: true */` in `site/instrumentation.ts` — webpack no longer parses the `newrelic` graph, so the `Module parse failed` overlay and the 25 blank routes are gone. This supersedes the Part-2 proposed slice (`serverExternalPackages` was **never applied**). The same commit flipped `NEW_RELIC_APM_ENABLED=1` in `.env.example`, i.e. APM is now intended on at runtime via the env gate.

## Post-fix verification (HTTP fetch against the dev server, trailing-slash URLs)

| Route | Status | Title |
|---|---|---|
| /products | 200 | "Office furniture | One&Only" — 220 KB content, desktop nav present |
| /planner | 200 | "Workspace Planner \| Design Your Office Layout \| One&Only" |
| /ooplanner | 200 | "Planner" |
| /oostudio | 200 | "Studio — Workspace" |
| /admin | 200 | "Admin \| One&Only" |
| /portfolio | 200 | "Office furniture portfolio \| Workplace projects \| One&Only" |
| /trusted-by | 200 | "Office furniture clients in India \| One&Only" |

Spot-check only (7 of 25 previously-blank routes), not a full re-sweep.

## Dependency remediation (user-approved, same session)

- `@mastra/core` 1.63.2 → **1.64.0** (pinned). 1.63.2 exact-pinned the vulnerable `@ai-sdk/provider-utils@3.0.30` via an npm alias (`@ai-sdk/provider-utils-v5`); no patched 3.x exists; 1.64.0 deletes the alias. `pnpm why` confirms only 4.0.40 / 5.0.13 / 5.0.32 / 5.0.36 remain; **`pnpm audit`: no known vulnerabilities**.
- `@types/newrelic` 9.14.8 added (devDep, pinned) — clears the `TS7016` on `instrumentation.ts`; **`pnpm run typecheck` passes**.

## Remaining open items

1. **Full post-fix re-sweep** — 36 routes × 6 viewports incl. the never-swept dynamic detail pages (`/products/[slug]`, solutions, features); Part-2 evidence predates the fix.
2. **A-01 locale contract** — `request.ts` pins `en` unconditionally; `NEXT_LOCALE` never read server-side; Hindi gate unreachable. Needs the caching-vs-cookie decision before any edit.
3. **R-02 header overflow at 1024×768** — search collides with "Sign in", EN\|HI clipped; needs the 1024-vs-1280 crossover decision, then one CSS slice.
4. **Consent-state matrix + HI-locale runtime pass** — never exercised (2.5 s delay, dismissed/visible transitions, EN→HI switch).
5. **`pnpm run gate`** — not run this session; required before ship. `pnpm build` after the webpackIgnore change is also unverified (standalone output tracing of a webpack-ignored runtime import is unproven).

## Changed / verified / not done (Part 3)

- **Changed:** this file (Part 3) only. Source fix and env flip were the owner's commits (`ea1345e`); `@mastra/core` bump + `@types/newrelic` are in `package.json`/lockfile as approved remediation.
- **Verified:** 7-route post-fix HTTP spot-check; `pnpm why` + `pnpm audit`; `pnpm run typecheck`.
- **Not done:** full re-sweep, dynamic detail pages, consent matrix, HI pass, `pnpm build`/`gate`, New Relic collector connectivity under `NEW_RELIC_APM_ENABLED=1`.
