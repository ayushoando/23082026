# UI Regression Audit Report

**Repository:** `ayushoando/23082026`  
**Branch reviewed:** `main`  
**Current branch head reviewed:** `7b199e1928c5362435ddd2cd5fed2b14715145eb`  
**Audit date:** 2026-09-06  
**Audit mode:** Read-only source and Git history review

## Executive conclusion

The regression surface is concentrated in the shared public chrome and route/locale contracts rather than in one isolated page. The strongest current findings are:

1. The header has a conflicting breakpoint contract around 1024px.
2. Planner navigation has two intentional-looking entry paths, `/planner` and `/ooplanner`, but different surfaces choose different paths.
3. Homepage CTA destinations are controlled by locale message JSON, so navigation correctness depends on translation data as well as components.
4. The mobile shell, fixed tab bar, consent bar, FAB clearance, safe-area offsets, and inner scrolling were changed together in several adjacent commits.
5. The current source does not yet prove a single bad commit or prove the exact visual failure at runtime; browser evidence at 1024px and 768px is still required.

This report records source/history findings. It is not a claim that every item below has already been observed in a running browser.

## Constraints preserved

- Audit before implementation.
- Repair page by page.
- Do not restore files or perform a broad rollback.
- Preserve unrelated backend, data, documentation, and platform work.
- Treat historical reports and commit messages as evidence leads, not as proof of current runtime behavior.

## Evidence reviewed

- Repository process floor: `AGENTS.md`.
- Current `main` branch metadata and source files.
- Commit history from 2026-09-02 through 2026-09-05.
- Current navigation, planner route, homepage, locale-message, mobile-shell, consent-bar, and CSS files.

No code, test, or source file was changed during this audit. No file was restored.

## Findings

### F-01 — Header breakpoint and overflow rules conflict at 1024px

**Severity:** High  
**Confidence:** Confirmed source contradiction; runtime impact unverified

Current `site/focss/site/components/shared/nav.css` declares the desktop header at `>= 1024px`, hides the hamburger at that breakpoint, and then has a separate `<1100px` rule that re-shows the hamburger. The same file describes a “More” menu and hides a ninth primary link in the 1024–1099px band.

Current `site/features/site/data/navigation.ts`, however, defines eight primary links and an empty `SITE_HEADER_MORE_LINKS` list. The source therefore contains competing assumptions about:

- whether 1024px is desktop or mobile navigation;
- whether a More menu exists;
- whether there is a ninth primary link to hide;
- whether the hamburger should be visible alongside desktop navigation.

This is the most direct source-level explanation for the reported strange behavior around 1024px. It must be verified at 1024×768, 1024×900, and just below/above the breakpoint before editing.

Evidence:

- [Current navigation CSS](https://github.com/ayushoando/23082026/blob/main/site/focss/site/components/shared/nav.css)
- [Current navigation data](https://github.com/ayushoando/23082026/blob/main/site/features/site/data/navigation.ts)
- [Commit that moved desktop navigation to 1024px](https://github.com/ayushoando/23082026/commit/72875451f7be7b62e1d65be7a25eef6d75976d47)

### F-02 — Mobile shell uses nested scrolling plus runtime overlay geometry

**Severity:** High  
**Confidence:** Confirmed source architecture; runtime impact unverified

For widths below the mobile breakpoint, the current app shell:

- locks `html` and `body` with `overflow: hidden`;
- sets the shell to `100dvh`;
- makes `.mobile-app-main` the inner vertical scroll owner;
- reserves space for a fixed tab bar;
- moves the consent bar above the tab bar;
- adds extra bottom padding while consent is mounted;
- depends on JavaScript `ResizeObserver` updates to set consent-bar height variables.

This is a high-risk interaction boundary because safe-area values, browser UI, delayed consent rendering, and dynamic bar height all change the available scroll area. A stale or missing CSS variable can produce covered content, excess blank space, inaccessible controls, or different behavior at different viewport heights.

Evidence:

- [Current mobile app-shell CSS](https://github.com/ayushoando/23082026/blob/main/site/focss/site/components/chrome/app-shell.css)
- [Current consent bar](https://github.com/ayushoando/23082026/blob/main/site/components/site/CookieConsentBar.tsx)
- [Mobile shell and consent interaction change](https://github.com/ayushoando/23082026/commit/57d1b4acd38d92219249c3f1dcdd4a6d7bd8b5ad)
- [Dynamic consent height change](https://github.com/ayushoando/23082026/commit/31ef7ac16d7c6a579a312d2466578371f291f53f)

Required runtime checks: 390×844, 412×915, 768×1024, and a consent-visible/dismissed comparison at each relevant width.

### F-03 — Planner entry points use two different route contracts

**Severity:** High  
**Confidence:** Confirmed source contract split; product intent and runtime impact unverified

`site/features/site/data/productSuite.ts` defines:

- landing/onboarding: `/planner`;
- guest/canvas/shared workspace: `/ooplanner`.

The current mobile tab uses the landing route, while the homepage hero reads its primary CTA destination from locale messages and currently points to `/ooplanner` in both English and Hindi. `activeTabFor` accepts both paths, which masks the split instead of resolving it.

This can create different experiences depending on whether a visitor enters through the header/mobile tab or the homepage CTA. It may be intentional, but the contract is not explicit at the consuming surfaces and must be decided before page repairs.

Evidence:

- [Current planner route definitions](https://github.com/ayushoando/23082026/blob/main/site/features/site/data/productSuite.ts)
- [Current navigation data](https://github.com/ayushoando/23082026/blob/main/site/features/site/data/navigation.ts)
- [Current homepage hero](https://github.com/ayushoando/23082026/blob/main/site/components/home/HomepageHero.tsx)
- [Current English homepage messages](https://github.com/ayushoando/23082026/blob/main/site/i18n/messages/en.json)
- [Current Hindi homepage messages](https://github.com/ayushoando/23082026/blob/main/site/i18n/messages/hi.json)
- [Commit that changed public chrome and the mobile Planner destination](https://github.com/ayushoando/23082026/commit/5a65f3b9ed2e251e90c9bf2b7f7f7b346d4e0f2f)

### F-04 — Homepage link behavior was moved from component constants into locale data

**Severity:** High  
**Confidence:** Confirmed source change; locale-specific failure unverified

`HomepageHero.tsx` now renders CTA destinations with `t("hero.primaryCta.href")` and `t("hero.secondaryCta.href")` rather than component-owned constants. This means a translation file can change navigation behavior, not only visible copy.

The change history shows the English and Hindi CTA href values being edited during the same regression window. This creates a direct failure mode where:

- a missing or stale locale key breaks a CTA;
- English and Hindi route to different product flows;
- a translation review can unintentionally change routing;
- route changes are not caught by visual checks alone.

The current English and Hindi values are both present, but their correctness must be checked against the agreed Planner contract and every supported locale.

Evidence:

- [Homepage i18n-link change](https://github.com/ayushoando/23082026/commit/4915f0d9d68a68bce7de876e13f5318040d50e14)
- [Current homepage hero](https://github.com/ayushoando/23082026/blob/main/site/components/home/HomepageHero.tsx)
- [Current English messages](https://github.com/ayushoando/23082026/blob/main/site/i18n/messages/en.json)
- [Current Hindi messages](https://github.com/ayushoando/23082026/blob/main/site/i18n/messages/hi.json)

### F-05 — Shared public chrome changed across a tightly coupled commit cluster

**Severity:** High investigation priority  
**Confidence:** Confirmed history pattern; causality unproven

Within a short window, the repository changed several shared contracts:

- public header/footer destinations and translated labels;
- mobile tab destinations and drawer variants;
- desktop navigation breakpoint and header overflow handling;
- homepage i18n-owned links;
- CSS type tokens and homepage typography;
- consent-bar height/offset handling;
- mobile tab-bar/FAB/scroll-pane geometry;
- CSP and third-party script/connect origins.

The changes touch shared components used by many pages, so a page-by-page symptom can originate in shared chrome. This is why isolated visual tweaks should wait until the shared shell and route contracts are audited.

Key history:

- [Public chrome and mobile Planner route](https://github.com/ayushoando/23082026/commit/5a65f3b9ed2e251e90c9bf2b7f7f7b346d4e0f2f)
- [1024px navigation and token changes](https://github.com/ayushoando/23082026/commit/72875451f7be7b62e1d65be7a25eef6d75976d47)
- [Homepage i18n links](https://github.com/ayushoando/23082026/commit/4915f0d9d68a68bce7de876e13f5318040d50e14)
- [Mobile tab/consent interaction changes](https://github.com/ayushoando/23082026/commit/57d1b4acd38d92219249c3f1dcdd4a6d7bd8b5ad)

### F-06 — Consent-bar and FAB clearance are coupled to mobile layout state

**Severity:** Medium–High  
**Confidence:** Confirmed source coupling; runtime impact unverified

The mobile shell derives content padding and FAB positions from the tab-bar height and consent-bar height. The consent component measures itself at runtime and writes both `--cookie-consent-bar-height` and `--cookie-consent-bar-offset`. Multiple commits changed the formulas and mounting behavior.

The audit must verify all state transitions, not just the initial page:

1. page before consent appears;
2. consent visible;
3. consent dismissed;
4. consent bar resized or text wrapped at a narrower width;
5. route transition while the inner scroller is not at the top.

Evidence:

- [Mobile layout change](https://github.com/ayushoando/23082026/commit/57d1b4acd38d92219249c3f1dcdd4a6d7bd8b5ad)
- [Cookie consent height change](https://github.com/ayushoando/23082026/commit/b8415f8bd5740a4e5211438ba141df5e046626df)
- [Consent offset variable change](https://github.com/ayushoando/23082026/commit/31ef7ac16d7c6a579a312d2466578371f291f53f)

### F-07 — CSP changes are a secondary runtime risk

**Severity:** Medium  
**Confidence:** Confirmed source change; blocked-resource impact unverified

The historical CSP tightening removed New Relic script and connect origins from the static and dynamic policies. Current source has deliberately restored the narrow allowances required by the vendored Browser agent (`js-agent.newrelic.com` for `script-src`; `bam.nr-data.net` and `*.nr-data.net` for `connect-src`) while retaining nonce-based CSP. Local endpoint checks now return `/newrelic.js` as JavaScript; production Browser reporting and the full viewport matrix remain unverified.

This is not currently identified as the primary cause of the layout regression. It should be checked during browser evidence collection so CSP errors are not mistaken for i18n or layout failures.

Evidence:

- [CSP refinement commit](https://github.com/ayushoando/23082026/commit/9c355e10d72d938ce93996d4aedb13c329e392cb)
- [Current proxy CSP implementation](https://github.com/ayushoando/23082026/blob/main/site/proxy.ts)
- [Current static headers](https://github.com/ayushoando/23082026/blob/main/site/next.config.js)

### F-08 — A historical mobile CTA disappearance must be classified, not silently restored

**Severity:** Medium  
**Confidence:** Confirmed historical change; current-state classification required

Commit `57d1b4a` changed the mobile app-shell primary CTA class from `btn-primary mobile-app-bar__cta` to `hidden`. The current `main` source no longer contains that exact hidden class in the inspected `MobileAppShell.tsx`, so later history appears to have changed or superseded it.

This must be classified as either an intended product decision or a transient regression. It must not be resolved by restoring an old file. The correct action is to inspect the current component contract and verify the expected mobile action at runtime.

Evidence:

- [Historical CTA change](https://github.com/ayushoando/23082026/commit/57d1b4acd38d92219249c3f1dcdd4a6d7bd8b5ad)
- [Current MobileAppShell](https://github.com/ayushoando/23082026/blob/main/site/components/site/MobileAppShell.tsx)

## Findings not yet established

The following conclusions require live browser or authorized local evidence and are intentionally not claimed as facts:

- the exact first bad commit;
- whether 1024px renders both desktop and hamburger controls in production;
- whether 768px is being treated as phone or tablet at the exact CSS breakpoint;
- whether the consent bar currently covers content or creates excess blank space;
- whether any locale is missing a key at runtime;
- whether translated CTA hrefs actually lead to the wrong flow;
- whether CSP blocks a required client-side resource;
- whether the canonical deployed host differs from current `main`.

## Page-by-page verification order

| Order | Surface | First checks |
|---:|---|---|
| 1 | Shared shell | Header mode, hamburger visibility, inner scroll owner, consent/FAB offsets |
| 2 | Locale/navigation | Locale initialization, translated labels, hrefs, language switching, hydration |
| 3 | Homepage | Hero CTA destinations, wrapping, header mode, mobile chrome |
| 4 | `/access` | Redirects, auth state, form layout, locale and viewport behavior |
| 5 | Public client-hub pages | Header/footer links, route transitions, overflow, loading/error states |
| 6 | Planner entry | `/planner` versus `/ooplanner` contract and mobile entry behavior |
| 7 | Studio/Admin/remaining routes | Only after shared contracts are stable |

## Required runtime matrix

At minimum, each page must be checked at:

- 1024×768;
- 768×1024;
- 390×844;
- 412×915;
- 1280×800;
- 1440×900.

For every run record route, locale, viewport, orientation, scroll position, consent state, expected result, actual result, and evidence.

## Immediate next action

Populate the shared-shell ledger first. At 1024×768 and 768×1024, record exactly which header controls are visible, whether the page has one scroll owner, which route the Planner controls use, and whether consent/FAB elements cover or displace content. Then audit the homepage in English and Hindi before changing any file.

## Report status

This report is complete as a read-only source/history audit. It does not authorize a broad rollback and does not claim that the browser audit or any repair is complete.
