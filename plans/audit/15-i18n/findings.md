# 15 — i18n

**Overall: solid parity architecture; drift in workspace strings.**

## Key parity (verified)

`en.json` 1,060 keys, `hi.json` 1,089 pattern matches (delta is multi-line array *formatting*, not extra keys). **Top-level namespaces identical (25/25)**: common, home, plannerLanding, planner, about, contact, products, solutions, workspace, news, legal, career, downloads, gallery, planning, portfolio, clients, service, showrooms, social, sustainability, tracking, trustedBy, supportIvr, marketing. Gate `scripts/check-i18n-key-parity.mjs` requires hi to mirror every top-level en key (line 131), checks extra keys and placeholder mismatches. `site/i18n/config.ts`: en source, hi machine-generated; `localePrefix: 'never'` with `NEXT_LOCALE` cookie (`site/i18n/request.ts`); root `i18n/request.ts` re-exports for monorepo cwd. Manifest `site/i18n/marketing-parity-manifest.json` declares `parityLocales: ["hi"]` plus the consumer-path registry.

## Pattern

Marketing strings flow server→client as props (`(site)/about/page.tsx:23-50` uses `getTranslations("about")`, passes ~22 props into `AboutPageView`).

## Findings

| # | Severity | Finding |
|---|----------|---------|
| 15.1 | **Med** | **Locale content drift:** `solutions.deliveryMedia.src` differs per locale — hi serves a DMRC project photo where en serves the about-bright hero (`site/i18n/messages/hi.json:534` vs `en.json:653`). |
| 15.2 | **Med** | Only 18/193 components use next-intl; the Planner/Studio workspace trees hardcode user-facing English despite a `workspace` namespace existing in both message files (sole consumer: `app/(site)/access/page.tsx:37`). E.g. `site/components/Planner/PlannerEntry.tsx:32-46` ("Guest workspace", "Sign in to save", "View saved plans"). hi users get English workspace chrome. |
| 15.3 | Low | Hardcoded English `aria-label="Planner access status"` in the same tree (`PlannerEntry.tsx:27`). |
| 15.4 | Low | `site/i18n/pending-translations/` directory exists — deferred translation backlog persisted in-tree. |
