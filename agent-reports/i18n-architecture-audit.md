# Internationalization (`i18n/` & `site/i18n/`) Architecture Audit

**Date:** 2026-09-04  
**Target:** [`i18n/`](file:///d:/23082026/i18n/) and [`site/i18n/`](file:///d:/23082026/site/i18n/)  
**Framework:** `next-intl` v3.26+ with Next.js App Router  
**Supported Locales:** `en` (English, source), `hi` (Hindi, machine-translated)

---

## Executive Summary

The repository implements a **two-locale localization system** (`en` and `hi`) powered by `next-intl`. 

A critical architectural necessity is the existence of the root bridge file [`i18n/request.ts`](file:///d:/23082026/i18n/request.ts), which re-exports the true implementation from [`site/i18n/request.ts`](file:///d:/23082026/site/i18n/request.ts) to satisfy Next.js webpack resolution when running from the monorepo root.

```
i18n Topology:
├── i18n/request.ts          # Root Bridge: Re-exports ../site/i18n/request (Fixes process.cwd() resolution)
└── site/i18n/               # True Implementation
    ├── config.ts            # Locale definitions: ['en', 'hi'], default 'en'
    ├── routing.ts           # Pathnames routing and prefix configuration
    ├── request.ts           # getRequestConfig() loading messages/${locale}.json
    ├── marketing-parity-manifest.json # Key-parity tracking between English and Hindi
    ├── messages/
    │   ├── en.json          # Canonical source translation strings
    │   └── hi.json          # Hindi translated strings
    └── pending-translations/# Untranslated string queue
```

---

## 1. The Root Bridge Pattern (`i18n/request.ts`)

### Why Does Root `i18n/` Exist?
In [`site/next.config.js:11`](file:///d:/23082026/site/next.config.js#L11):
```javascript
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
```
When running commands from the monorepo root (e.g. `next build site --webpack`), `next-intl` validates the request file against `process.cwd()` (`d:\23082026`). 

If the root `i18n/request.ts` were removed, Next.js would fail to boot with:
`Error: Could not resolve './i18n/request.ts' from 'd:\23082026'`.

The root file acts as a seamless 3-line bridge:
```typescript
/** Re-export so next-intl can resolve `./i18n/request.ts` from monorepo cwd. */
export { default } from "../site/i18n/request";
```

---

## 2. Localization Implementation & Constraints

1. **Strict Two-Locale Policy:**  
   [`site/i18n/config.ts:1-4`](file:///d:/23082026/site/i18n/config.ts#L1-L4) defines:
   ```typescript
   /** English is source. Hindi is machine-generated. No fr/de/es. */
   export const locales = ['en', 'hi'] as const;
   export const defaultLocale: Locale = 'en';
   ```
   Other international languages (`fr`, `de`, `es`) are explicitly out of scope for the Indian office furniture market.
2. **Key Parity Enforcement:**  
   [`site/i18n/marketing-parity-manifest.json`](file:///d:/23082026/site/i18n/marketing-parity-manifest.json) tracks translation coverage. CI gates verify that every key added to `en.json` has a corresponding entry in `hi.json` to prevent runtime fallback crashes.
3. **Routing Strategy:**  
   Uses localized path prefixes (`/en/...` and `/hi/...`) with root domain redirection. Apex requests to `https://oando.co.in/` negotiate the user's `Accept-Language` header and route to `en` by default.
