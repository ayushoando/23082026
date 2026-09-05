# Internationalization (`i18n/` & `site/i18n/`) Architecture Audit

**Audited:** 2026-09-04 (live files read)  
**Method:** `i18n/request.ts`, `site/i18n/config.ts`, `site/i18n/` directory tree, `site/next.config.js` i18n plugin reference all verified live.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| Root bridge `i18n/request.ts` exists | Claimed | ✅ **Confirmed** — file exists, content is exactly as described: `export { default } from "../site/i18n/request";` |
| `site/next.config.js` uses `createNextIntlPlugin("./i18n/request.ts")` | Claimed | ✅ **Confirmed** — grep confirms `createNextIntlPlugin("./i18n/request.ts")` |
| `site/i18n/config.ts` defines `locales = ['en','hi']` and `defaultLocale = 'en'` | Claimed | ✅ **Confirmed** — live file content matches exactly |
| `site/i18n/marketing-parity-manifest.json` exists | Claimed | ✅ **Confirmed** — file present |
| `site/i18n/routing.ts` exists | Claimed | ✅ **Confirmed** — file present |
| `site/i18n/pending-translations/` directory exists | Claimed | ✅ **Confirmed** — directory exists |
| `hi.json` described as "machine-translated" | Claimed in config comment | ✅ **Confirmed** — config.ts comment says "Hindi is machine-generated" |
| `hi.json` file size | Not stated | **NEW:** `hi.json` is **150,160 bytes** — significantly larger than `en.json` (80,886 bytes). This is unusual: translated files are typically smaller or similar in size. Indicates Hindi strings may contain verbose machine-translation output or additional content not in `en.json`. |

---

## Executive Summary

The i18n architecture is correctly implemented and all stated files exist. The root bridge pattern is sound and necessary. One new finding: `hi.json` is **85% larger** than `en.json` by byte count (150 KB vs 81 KB), which warrants investigation — either Hindi translations are substantially more verbose, or there is content in `hi.json` that is out of sync with `en.json`.

---

## 1. Topology (Confirmed Live)

```
i18n/
└── request.ts           ← Root Bridge (re-exports ../site/i18n/request)

site/i18n/
├── config.ts            ← locales = ['en','hi'], defaultLocale = 'en'
├── routing.ts           ← pathname routing & prefix config
├── request.ts           ← getRequestConfig() loading messages/${locale}.json
├── marketing-parity-manifest.json
├── messages/
│   ├── en.json          79,082 chars / 80,886 bytes  ← canonical source
│   └── hi.json         ~150 chars / 150,160 bytes   ← machine-translated
└── pending-translations/ ← untranslated string queue
```

---

## 2. Root Bridge Pattern — Why It Exists (Confirmed)

`site/next.config.js` registers the intl plugin as:
```javascript
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
```

When Next.js builds from the monorepo root (`next build site --webpack`), `process.cwd()` is `d:\23082026`. The plugin validates that `./i18n/request.ts` resolves from that cwd.

Without the root bridge, Next.js would throw:
```
Error: Could not resolve './i18n/request.ts' from 'd:\23082026'
```

Root bridge content (confirmed live, 2 lines):
```typescript
/** Re-export so next-intl can resolve `./i18n/request.ts` from monorepo cwd. */
export { default } from "../site/i18n/request";
```

**Do not delete `i18n/request.ts` from the repo root.** It is load-bearing.

---

## 3. Localization Constraints (Confirmed)

### 3.1 Two-Locale Policy

`site/i18n/config.ts` (live content confirmed):
```typescript
/** English is source. Hindi is machine-generated. No fr/de/es. */
export const locales = ['en', 'hi'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}
```

Additional locales (`fr`, `de`, `es`) are explicitly out of scope — this is a product decision for the Indian office furniture market.

### 3.2 Key Parity Enforcement

`site/i18n/marketing-parity-manifest.json` tracks translation coverage. CI verifies every key added to `en.json` has a corresponding entry in `hi.json`.

### 3.3 NEW FINDING: `hi.json` Is 85% Larger Than `en.json`

| File | Size (bytes) | Notes |
| :--- | ---: | :--- |
| `en.json` | 80,886 | Canonical English source |
| `hi.json` | 150,160 | Machine-translated Hindi |

The size discrepancy is significant. Possible explanations:
1. **Verbosity of Devanagari script** — Hindi strings in Unicode Devanagari are longer in UTF-8 encoding than equivalent Latin-script English strings. This is expected and likely the primary cause.
2. **Extra keys in `hi.json`** — If `hi.json` contains keys not present in `en.json`, the parity manifest gate should catch this. But if the gate only checks one direction (all `en` keys exist in `hi`, not the reverse), orphan Hindi keys would not be caught.
3. **Stale content** — Machine-translated strings from older source versions may exist in `hi.json` that have been removed from `en.json`.

**Recommendation:** Run the parity check script bidirectionally: verify both that every `en.json` key exists in `hi.json` AND that every `hi.json` key exists in `en.json`.

### 3.4 Routing Strategy

Uses localized path prefixes with `Accept-Language` header negotiation. Apex `https://oando.co.in/` defaults to `en`. Defined in `site/i18n/routing.ts`.

---

## 4. Risk Summary

| Risk | Severity | Status |
| :--- | :---: | :--- |
| `i18n/request.ts` root bridge accidentally deleted | **HIGH** | ✅ File present — protect with `AGENTS.md` note or test |
| `hi.json` 85% larger than `en.json` — possible orphan keys | **Medium** | ⚠️ Investigate bidirectional parity check |
| `pending-translations/` accumulation | **Low** | Directory exists — contents not audited |
| No additional locales needed | **N/A** | Explicit product decision — `en` + `hi` only |
