---
name: i18n
description: "Enforce thermonuclear internationalization standards across English and Hindi locales. Guarantees 100% key parity across all 26 marketing namespaces, zero English leaks in Hindi mode, identical dynamic interpolation placeholders, ban on hardcoded JSX strings, and automated contract verification."
---

# i18n — Thermonuclear Internationalization Standard

Use this skill whenever authoring, updating, or reviewing internationalization, locale routing, and translations across the Oando platform (`site/i18n/`). In this repository, localization is an invariant-enforced runtime subsystem, not an afterthought. Every customer-facing surface must deliver authentic, high-quality localization with zero broken layouts, zero missing keys, and zero English text leaking into Hindi viewports.

---

## 1. The Thermonuclear Truth Floor for i18n

Under `AGENTS.md` Rule 1:
$$\text{User Instruction} > \text{Live Code / Fresh Command Output} > \text{AGENTS.md} > \text{Agents/} > \text{docs/}$$

- **Target Locales:** Strictly `['en', 'hi']` per [`site/i18n/config.ts`](file:///d:/23082026/site/i18n/config.ts). Default locale is `en`. Deferred or third-party locales (fr, de, es, ar) are explicitly banned.
- **Canonical Dictionaries:**
  - Source English: [`site/i18n/messages/en.json`](file:///d:/23082026/site/i18n/messages/en.json)
  - Target Hindi: [`site/i18n/messages/hi.json`](file:///d:/23082026/site/i18n/messages/hi.json)
- **Manifest of Record:** [`site/i18n/marketing-parity-manifest.json`](file:///d:/23082026/site/i18n/marketing-parity-manifest.json) tracks all 26 official marketing namespaces and 29 consumer component paths.
- **Automated Enforcement:** Parity is verified by physical file inspection and `pnpm run check:i18n:parity`. An unverified translation claim is invalid.
- **Scope Discipline:** Do exactly the stated task. Do not expand scope, refactor adjacent code, or make opportunistic improvements. Make the smallest reversible change that achieves the requested outcome. If scope is exceeded, stop and report it.

---

## 2. The Seven Non-Negotiable Laws of i18n

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THE 7 THERMONUCLEAR LAWS OF i18n                     │
├────────────────────────────────────────────────────────────────────────┤
│ 1. 100% DEVANAGARI PARITY & ZERO ENGLISH LEAKS IN HINDI                │
│ 2. DYNAMIC PARAMETER & INTERPOLATION TOKEN INVARIANT                   │
│ 3. ABSOLUTE BAN ON HARDCODED UI STRINGS IN JSX/TSX                     │
│ 4. STRICT NAMESPACE GOVERNANCE & MANIFEST ALIGNMENT                    │
│ 5. DEVANAGARI VISUAL EXPANSION & RESPONSIVE LAYOUT SAFETY              │
│ 6. LOCALE ROUTING, COOKIE & HEADER DISCIPLINE                          │
│ 7. MANDATORY AUTOMATED PARITY & VITEST TEST VERIFICATION               │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Law 1: 100% Devanagari Parity & Zero English Leaks in Hindi
- Every JSON key path existing in `en.json` must exist with exact 1:1 structural correspondence in `hi.json`.
- Zero empty strings (`""`), zero `null`, zero `undefined`, and zero stub translations.
- Hindi values must be written in genuine **Devanagari script**.
- **No English Leaks:** Latin alphabet strings leaking into `hi.json` (such as untranslated labels, navigation items, or CTA buttons) are strictly prohibited, with the sole exception of registered brand marks ("Oando", "One and Only", "Studio", "Planner") where intentional.

### Law 2: Dynamic Parameter & Interpolation Token Invariant
- Dynamic placeholders enclosed in curly brackets (e.g. `{name}`, `{count}`, `{year}`, `{time}`) must match identically between `en.json` and `hi.json`.
- If `en.json` defines `"welcome": "Welcome back, {name}!"`, `hi.json` must preserve `{name}`: `"welcome": "वापसी पर स्वागत है, {name}!"`.
- **Zero Tolerance:** Renaming, translating, omitting, or modifying placeholders inside `{...}` is a fatal runtime bug that crashes `next-intl` or prints raw interpolation markers in the user interface.

### Law 3: Absolute Ban on Hardcoded UI Strings in JSX/TSX
- No customer-facing text may be hardcoded as raw string literals in `site/app/(site)/` or `site/components/`.
- Client components must consume translations via `useTranslations(namespace)`.
- Server components must consume translations via `getTranslations(namespace)`.
- Static data files that feed UI components (e.g. navigation links, feature lists, pricing matrices) must either reference translation keys or be structured in locale-aware dictionaries.

### Law 4: Strict Namespace Governance & Manifest Alignment
- All translation keys must belong to the approved 26 marketing namespaces cataloged in `site/i18n/marketing-parity-manifest.json`:
  `about`, `news`, `legal`, `solutions`, `contact`, `products`, `career`, `downloads`, `gallery`, `planning`, `portfolio`, `clients`, `service`, `showrooms`, `social`, `sustainability`, `tracking`, `trustedBy`, `supportIvr`, `home`, `faq`, etc.
- When creating a new namespace:
  1. Add the namespace to `allMarketingNamespaces` and `wave1Namespaces` in `marketing-parity-manifest.json`.
  2. Populate both `en.json` and `hi.json` with identical structures.
  3. Register consumer component paths in `i18nConsumerPaths`.

### Law 5: Devanagari Visual Expansion & Responsive Layout Safety
- Devanagari glyphs and conjuncts typically expand text length by **15% to 25%** horizontally and require greater vertical line height (`leading-relaxed` / `leading-normal`).
- **No Rigid Widths:** Never constrain localized text containers with rigid pixel widths (e.g. `w-[140px]`). Containers must use flexible sizing (`min-w`, `w-full`, `max-w-fit`) to prevent ugly wrapping or clipping.
- **Button & Touch Target Integrity:** All localized buttons, tabs, and interactive chips must preserve the repository-wide minimum 44px (ideally 48px) touch target standard without text truncation or overflow into adjacent chrome.

### Law 6: Locale Routing, Cookie & Header Discipline
- Handled through [`site/i18n/routing.ts`](file:///d:/23082026/site/i18n/routing.ts) and Next.js middleware.
- The locale switcher ([`site/components/site/LanguageSwitcher.tsx`](file:///d:/23082026/site/components/site/LanguageSwitcher.tsx)) updates the `NEXT_LOCALE` cookie (`en` or `hi`).
- Switching locales must maintain the current route path and search parameters. It must never drop users back to the homepage or trigger full hydration flash.

### Law 7: Mandatory Automated Parity & Vitest Test Verification
- A translation is never accepted on visual inspection alone.
- Every modification to `en.json` or `hi.json` must be validated by running the automated parity gate:
  `pnpm run check:i18n:parity`
  `pnpm run check:site-ui`
- Vitest i18n unit tests must pass with 100% success rate:
  `tests/unit/i18n/messages.test.ts`
  `tests/unit/lib/i18n/parity.test.ts`

---

## 3. Thermonuclear i18n Maintenance Workflow

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THERMONUCLEAR i18n UPDATE PIPELINE                   │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Key Definition:                                                     │
│    • Define the English string and key path under the proper namespace │
│    • Ensure dynamic parameters use {parameterName} syntax              │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Devanagari Translation:                                             │
│    • Author authentic Hindi translation maintaining exact placeholders │
│    • Check for Devanagari punctuation and natural phrasing             │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Atomic File Synchronization:                                        │
│    • Update site/i18n/messages/en.json                                 │
│    • Update site/i18n/messages/hi.json in the identical location       │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Automated Parity Verification:                                      │
│    • pnpm run check:i18n:parity                                        │
│    • pnpm exec vitest run tests/unit/i18n/messages.test.ts             │
│    • pnpm run check:site-ui                                            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Verification & Audit Runbook

Run these commands to certify that an i18n change meets the thermonuclear standard:

```powershell
# 1. Run deep key parity check between en.json and hi.json
pnpm run check:i18n:parity

# 2. Run composite site-ui contract verification (routes, JSX, i18n, dialects)
pnpm run check:site-ui

# 3. Run i18n unit tests under Vitest with site configuration
pnpm exec vitest run tests/unit/i18n/messages.test.ts --config tests/vitest.config.ts
pnpm exec vitest run tests/unit/lib/i18n/parity.test.ts --config tests/vitest.config.ts

# 4. Run the full site-ui gate
pnpm run gate:site-ui
```
