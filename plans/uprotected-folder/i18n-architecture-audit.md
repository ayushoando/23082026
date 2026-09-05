# Internationalization (`i18n/` & `site/i18n/`) Architecture Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`i18n/`](file:///d:/23082026/i18n/) and [`site/i18n/`](file:///d:/23082026/site/i18n/)  
**Method:** Live file inspections of the root bridge, next-intl plugins, locale dictionaries, and translation parity checkers.

---

## 1. Subsystem Topology & Architecture

```
i18n/
└── request.ts           ← Load-bearing root bridge (re-exports ../site/i18n/request)

site/i18n/
├── config.ts            ← Supported locales ['en', 'hi'], defaultLocale 'en'
├── routing.ts           ← Sub-path routing & locale prefix rules
├── request.ts           ← getRequestConfig() loader for message catalogs
├── marketing-parity-manifest.json ← Translation key parity registry
├── messages/
│   ├── en.json          ← Canonical English source dictionary
│   └── hi.json          ← Machine-translated Hindi dictionary
└── pending-translations/ ← Untranslated key staging area
```

---

## 2. The Load-Bearing Root Bridge Pattern

In `site/next.config.js`:
```javascript
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
```

Because Next.js builds run from monorepo root (`d:\23082026`), `process.cwd()` is the repository root. The `next-intl` plugin resolves its request configuration relative to cwd.

[`i18n/request.ts`](file:///d:/23082026/i18n/request.ts) acts as a mandatory bridge:
```typescript
/** Re-export so next-intl can resolve `./i18n/request.ts` from monorepo cwd. */
export { default } from "../site/i18n/request";
```

**Rule:** Never delete `i18n/request.ts`. Deleting it breaks `pnpm run build:site`.

---

## 3. Translation Parity & Key Validation

The repository guards against missing keys in localized pages using `scripts/check-i18n-key-parity.mjs`:
- Compares keys between `en.json` and `hi.json`.
- Enforces parity for marketing routes listed in `marketing-parity-manifest.json`.
- Included in the `check:site-ui` release step.

---

## 4. Verification & Testing Commands

```powershell
# 1. Verify i18n translation key parity
pnpm run check:i18n:parity

# 2. Check full site UI contracts (including i18n and dialect checks)
pnpm run check:site-ui

# 3. Test i18n request resolution in site build
pnpm run build:site
```
