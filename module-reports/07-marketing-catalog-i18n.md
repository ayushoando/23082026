# Module 07 - marketing, catalog, and internationalization

## Summary

The public site is a broad App Router surface with product catalog pages, solutions, tools, portal/access flows, contact/legal pages, and generated metadata/discovery routes. It uses next-intl for locale selection and a dedicated site FOCSS entry.

The live implementation supports English and Hindi. Repository documentation and comments do not consistently describe that state, so the primary risk here is maintenance/release communication rather than a confirmed routing failure.

## Marketing route families

The `(site)` route group contains the home page and supporting public surfaces including products, product categories/details, solutions, planning, tools, quote cart, portfolio, showrooms, sustainability, contact, service, FAQ, access/login, portal, and legal policy pages. The site layout provides the next-intl client provider, React Query/Nuqs providers, sanitized JSON-LD, navigation chrome, footer, and cart integration.

The route configuration contains marketing aliases and redirects for older paths. The live redirect list should be treated as authoritative over descriptive route documents.

## i18n flow

[`site/i18n/config.ts`](../site/i18n/config.ts) declares `en` and `hi`, with English as default. [`site/i18n/request.ts`](../site/i18n/request.ts) reads `NEXT_LOCALE`, validates it against the configured locale list, loads the matching message file, and falls back to English.

[`LanguageSwitcher.tsx`](../site/components/site/LanguageSwitcher.tsx) exposes the same two choices. The Planner entry uses translated `workspace` messages, so the live code is not simply English-only. However:

- `README.md` describes an English-only request configuration;
- architecture documentation describes Planner/Studio/Admin as not wired to next-intl;
- a Header comment lists `en`, `hi`, `fr`, `de`, and `es`, while only `en` and `hi` are configured.

The practical state should be captured in one locale capability document and kept synchronized with config.

## Catalog and product data

Marketing catalog/configurator data belongs to the Products Supabase project. Furniture rows and descriptors belong to Admin, even though Planner catalog reads and Studio furniture publishing are separate product entry points. The shared asset layer makes project selection by path prefix explicit.

This split allows the public site to consume marketing catalog data without granting it access to staff/furniture administration. It also means asset and row ownership must be documented together so a new module does not use the wrong Supabase client.

## Styling and performance

The site FOCSS entry loads site base/runtime/document layers plus marketing typography, headings, and components. The component index intentionally ships a broad common set on marketing routes. This is an explicit simplification/tradeoff, but page-level bundle and CSS size should be measured before optimizing or changing the contract.

Images are configured through the shared Next config with remote patterns and production unoptimized behavior by default. SVGs are not allowed through the image configuration.

## Findings and recommendations

1. Reconcile locale docs/comments with the live `en`/`hi` implementation.
2. Add a single capability matrix for which route groups actually render translated messages.
3. Document Products versus Admin catalog/asset ownership by API and path prefix.
4. Measure FOCSS and image payloads before deciding whether the broad component bundle is a problem.
5. Include redirect-map review in route changes because old marketing/product URLs are actively redirected.

## Evidence

- [`site/app/(site)/layout.tsx`](<../site/app/(site)/layout.tsx>)
- [`site/i18n/config.ts`](../site/i18n/config.ts)
- [`site/i18n/request.ts`](../site/i18n/request.ts)
- [`site/components/site/LanguageSwitcher.tsx`](../site/components/site/LanguageSwitcher.tsx)
- [`site/components/Planner/PlannerEntry.tsx`](../site/components/Planner/PlannerEntry.tsx)
- [`site/focss/site/entry.css`](../site/focss/site/entry.css)
- [`site/focss/site/components/index.css`](../site/focss/site/components/index.css)
- [`config/build/next.config.js`](../config/build/next.config.js)
- [`docs/architecture/stack.md`](../docs/architecture/stack.md)
- [`README.md`](../README.md)

