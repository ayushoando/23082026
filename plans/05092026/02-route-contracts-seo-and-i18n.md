# Oando Subsystem Remediation Plan: Route Contracts, SEO Registry, and Bilingual i18n

**File Target:** `plans/05092026/02-route-contracts-seo-and-i18n.md`  
**Governing Standard:** `AGENTS.md` (Authority floor: User instruction > live code/fresh command output > `AGENTS.md`)  
**Execution State:** **FROZEN / PLANNING ONLY** (`NO CODE CHANGE`, `NO AUTO IMPLEMENT`)  
**Methodology:** Exhaustive Route Specification, Static SEO Metadata Registry Contract, JSON-LD Schema Architecture, and Bilingual i18n Key Parity.

---

## 1. Subsystem Overview & Architectural Scope

The Oando public platform combines a Next.js 16.3.3 App Router frontend (`site/app/(site)/`), a strict static SEO registry (`site/features/site/data/siteSeoContract.ts`), and a bilingual internationalization architecture powered by `next-intl` (`site/i18n/`).

```
┌────────────────────────────────────────────────────────────────────────┐
│               OANDO ROUTING, SEO & LOCALIZATION SUBSYSTEM               │
├────────────────────────────────────────────────────────────────────────┤
│                           Public Routes                                │
│       site/app/(site)/[route]/page.tsx  •  site/app/sitemap.ts        │
├────────────────────────────────────────────────────────────────────────┤
│                     Static SEO Metadata Registry                       │
│    SEO01_STATIC_METADATA (site/features/site/data/siteSeoContract.ts)  │
│    • 24 canonical routes  • Trailing slash norm  • Canonical sanitizer │
├────────────────────────────────────────────────────────────────────────┤
│                       Structured Data (JSON-LD)                        │
│   WebPage • CollectionPage • ContactPage • Product • BreadcrumbList   │
├────────────────────────────────────────────────────────────────────────┤
│                 Bilingual i18n Engine (next-intl)                      │
│   • en.json & hi.json (861 keys across 26 namespaces)                  │
│   • LOCALE_HREFLANG: en-IN, hi-IN                                      │
│   • check-i18n-key-parity.mjs & sync-marketing-i18n-messages.mjs       │
├────────────────────────────────────────────────────────────────────────┤
│                     Edge Proxy SEO Invariants                          │
│   • RFC 9116 security.txt                                              │
│   • Strip noindex headers strictly for PUBLIC_INDEXABLE_HOSTS          │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Invariants
1. **Route Lifecycle Before SEO:** A public indexable route MUST return the expected canonical-host `200` and be registered in `SEO01_STATIC_METADATA`. A route classified `not-found`, redirected, access-controlled, or otherwise non-public must not be put in public navigation, the footer, or HTML/XML sitemaps merely because a source component or metadata object exists.
2. **Canonical URL Sanitization:** All canonical URLs must route through `sanitizeCanonicalPath` to reject open redirects and protocol-relative attacks.
3. **Google Hreflang Compliance:** With `localePrefix: "never"`, all locales share one URL; Google rejects identical hrefs across multiple hreflang tags. Thus, hreflang emits only the serving language + `x-default`.
4. **100% Bilingual Parity:** `site/i18n/messages/en.json` and `site/i18n/messages/hi.json` must have identical leaf keys, identical argument placeholders, and zero English leakage in Hindi navigation keys.

---

## 2. Public & Marketing Route Inventory

The platform defines the following source-route inventory. A source component is not a deployment contract: inclusion in a public sitemap requires a current public `200` and an `indexable` route classification.

| Path | Page Component | Metadata Helper / Source | JSON-LD Schema Type |
|------|---------------|--------------------------|----------------------|
| `/` | `site/app/(site)/page.tsx` | `SITE_BRAND.defaultTitle` / `SITE_BRAND.description` | `WebPage`, `Organization` |
| `/about` | `site/app/(site)/about/page.tsx` | `ABOUT_PAGE_METADATA` | `WebPage` |
| `/products` | `site/app/(site)/products/page.tsx` | `PRODUCTS_PAGE_METADATA` | `CollectionPage` |
| `/clients` | `site/app/(site)/clients/page.tsx` | `CLIENT_DIRECTORY_PAGE_METADATA` | `CollectionPage` |
| `/planning` | `site/app/(site)/planning/page.tsx` | `PLANNING_PAGE_METADATA` | `WebPage` |
| `/tools` | `site/app/(site)/tools/page.tsx` | Source metadata may exist; **current lifecycle: `not-found`, nonindexable** | None while canonical host is `404` |
| `/tools/office-space-calculator` | `site/app/(site)/tools/office-space-calculator/page.tsx` | Source metadata may exist; **current lifecycle: `not-found`, nonindexable** | None while canonical host is `404` |
| `/tools/meeting-room-capacity-calculator` | `site/app/(site)/tools/meeting-room-capacity-calculator/page.tsx` | Source metadata may exist; **current lifecycle: `not-found`, nonindexable** | None while canonical host is `404` |
| `/planner` | `site/app/(site)/planner/page.tsx` | `PLANNER_LANDING_PAGE_METADATA` | `WebPage` |
| `/planner/help` | `site/app/(site)/planner/help/page.tsx` | `PLANNER_HELP_PAGE_METADATA` | `ItemPage` |
| `/planner/features` | `site/app/(site)/planner/features/page.tsx` | `PLANNER_FEATURES_PAGE_METADATA` | `ItemPage` |
| `/contact` | `site/app/(site)/contact/page.tsx` | `CONTACT_PAGE_METADATA` | `ContactPage` |
| `/downloads` | `site/app/(site)/downloads/page.tsx` | `DOWNLOADS_PAGE_METADATA` | `CollectionPage` |
| `/faq` | `site/app/(site)/faq/page.tsx` | `FAQ_PAGE_METADATA` | `FAQPage` |
| `/career` | `site/app/(site)/career/page.tsx` | `CAREER_PAGE_METADATA` | `WebPage` |
| `/compare` | `site/app/(site)/compare/page.tsx` | `COMPARE_PAGE_METADATA` | `ItemPage` |
| `/trusted-by` | `site/app/(site)/trusted-by/page.tsx` | `TRUSTED_BY_PAGE_METADATA` | `WebPage` |
| `/showrooms` | `site/app/(site)/showrooms/page.tsx` | `SHOWROOMS_PAGE_METADATA` | `CollectionPage` |
| `/terms` | `site/app/(site)/terms/page.tsx` | `TERMS_PAGE_METADATA` | `WebPage` |
| `/refund-and-return-policy` | `site/app/(site)/refund-and-return-policy/page.tsx` | `REFUND_POLICY_PAGE_METADATA` | `WebPage` |
| `/sustainability` | `site/app/(site)/sustainability/page.tsx` | `SUSTAINABILITY_PAGE_METADATA` | `WebPage` |
| `/portfolio` | `site/app/(site)/portfolio/page.tsx` | `CLIENTS_PAGE_METADATA` | `CollectionPage` |
| `/service` | `site/app/(site)/service/page.tsx` | `SERVICE_PAGE_METADATA` | `WebPage` |
| `/sitemap` | `site/app/(site)/sitemap/page.tsx` | Direct `buildPageMetadata` | `CollectionPage` |

### Route Canonical Rules
- **Trailing Slash Normalization:** Implemented via `canonicalPath(path)` (`site/features/site/data/seo.ts#L93-L97`):
  ```typescript
  export function canonicalPath(path: string): string {
    if (!path || path === "/") return "/";
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return normalized.endsWith("/") ? normalized : `${normalized}/`;
  }
  ```
- **Security Path Sanitization:** Implemented via `sanitizeCanonicalPath(path)` (`site/features/site/data/seo.ts#L105-L140`):
  - Strips query parameters and hash fragments (`path.search(/[?#]/)`).
  - Rejects encoded protocols (`/%2f%2f/i`), backslashes (`/%5c/i`), and null bytes (`/%00/i`).
  - Catches invalid URI decodings and defaults safely to `/`.
  - Rejects external schemes (`http:`, `https:`, `javascript:`, `data:`).

---

## 3. SEO Metadata Architecture & Structured Data

### Static Metadata Registry Contract
The static registry enforces that every route exports a unique `<title>` and `<meta name="description">` that adheres to Google search display guidelines:
- Title length: 30–60 characters.
- Description length: 110–160 characters.
- Canonical tag: absolute URL formatted as `https://oando.in${canonicalPath}`.
- OpenGraph: `og:title`, `og:description`, `og:url`, `og:site_name`, `og:locale` (`en_IN` or `hi_IN`), and `og:image` (fallback to `/images/og-default.jpg`).
- Twitter Card: `summary_large_image`, `@oando_in`.

### Structured Data (JSON-LD) Implementations
Defined in `site/features/site/data/seo.ts`:
1. **Organization Schema:** Emitted on homepage and about page, including legal name, founding date, founders, official address, and social links.
2. **Product Schema:** (`buildProductJsonLd`):
   - Supports `sku`, `name`, `description`, `image`, `brand` ("One&Only"), `category`, and availability.
   - Strictly conforms to Schema.org `Product` specification.
3. **BreadcrumbList Schema:** (`buildBreadcrumbJsonLd`):
   - Sequenced items from root `/` to the current leaf route.

### Edge Proxy SEO Guardrails (`workers/oando-worker-proxy/`)
- Intercepts incoming requests at the Cloudflare edge.
- Inspects `PUBLIC_INDEXABLE_HOSTS` (`oando.in`, `www.oando.in`).
- If request arrives on a preview or staging host, it forcefully injects `X-Robots-Tag: noindex, nofollow`.
- For production canonical hosts, it preserves indexability headers.
- Serves RFC 9116 compliant `/.well-known/security.txt` at the edge without hitting the Next.js origin.

---

## 4. Bilingual Internationalization (`next-intl`)

### Locale Configuration (`site/i18n/config.ts`)
- Supported locales: `["en", "hi"]`.
- Default locale: `"en"`.
- Locale BCP 47 mappings: `en: "en-IN"`, `hi: "hi-IN"`.
- Routing mode: `localePrefix: "never"` (domain-level serving with cookie / header preference).

### Key Parity & Hierarchy
The translation catalog contains **861 leaf keys** across **26 namespaces**:
- Namespaces: `common`, `nav`, `footer`, `home`, `about`, `products`, `product_detail`, `clients`, `planning`, `tools`, `planner`, `contact`, `downloads`, `faq`, `career`, `compare`, `trusted_by`, `showrooms`, `terms`, `refund`, `sustainability`, `portfolio`, `service`, `errors`, `search`, `aria`.
- Translation Manifest: `site/i18n/marketing-parity-manifest.json`.

### Parity Audit Logic (`scripts/check-i18n-key-parity.mjs`)
The audit script enforces zero missing keys and placeholder parity:
1. Recursive key collection across nested JSON structures.
2. Namespace isolation to ensure no stray root keys.
3. Regex extraction of `{placeholder}` tokens (`value.match(/\{[a-zA-Z0-9_]+\}/g)`).
4. Asserting that any variable expected in English exists in the corresponding Hindi translation.
5. Detecting English fallback leaks in navigation strings.

---

## 5. Verification & Audit Runbook

### Authorized Verification Commands
To audit route contracts, SEO metadata, and i18n parity without modifying any source files:

1. **Audit i18n Key Parity:**
   ```bash
   pnpm run check:i18n:parity
   # or directly:
   node scripts/check-i18n-key-parity.mjs
   ```
   *Expected Output:* `check-i18n-key-parity: ok (locales hi)`

2. **Audit Site UI Contracts & Dialect:**
   ```bash
   pnpm run check:site-ui
   ```
   *Executes:* `check-site-ui-contract.mjs && check-i18n-key-parity.mjs && check-homepage-dialect.mjs`.

3. **Verify SEO Standards Unit Tests:**
   ```bash
   pnpm vitest run tests/unit/features/site/data/seoStandardsAudit.test.ts
   pnpm vitest run tests/unit/features/site/data/seo.test.ts
   pnpm vitest run tests/unit/features/site/data/seo.localePrefix.test.ts
   ```

4. **Verify i18n Unit Tests:**
   ```bash
   pnpm vitest run tests/unit/lib/i18n/parity.test.ts
   pnpm vitest run tests/unit/i18n/messages.test.ts
   ```

---

## 5. Supplementary Route Data Files (`site/features/site/data/`)

Beyond `siteSeoContract.ts`, the data directory contains additional files that govern per-route behaviour. Every agent touching route metadata must be aware of the full surface:

| File | Role | Relationship to SEO Contract |
|------|------|------------------------------|
| [`siteSeoContract.ts`](file:///d:/23082026/site/features/site/data/siteSeoContract.ts) | `SEO01_STATIC_METADATA` registry for public, indexable routes. | Downstream consumers may use an entry only when lifecycle status is public and indexable. |
| [`routeMetadata.ts`](file:///d:/23082026/site/features/site/data/routeMetadata.ts) | `buildPageMetadata()` factory — constructs the Next.js `Metadata` object from a registry entry. Called by every `page.tsx` in `(site)/`. | Metadata presence does not override a non-public lifecycle classification. |
| [`routeClassification.ts`](file:///d:/23082026/site/features/site/data/routeClassification.ts) | Per-route classification, `indexable`/`noindex` flags, and HTTP status intent. | Public navigation and HTML/XML sitemap generation must derive from this state; conflicts are an acceptance-test failure to resolve, not a reason to index a `404`. |
| [`routeChromeRules.ts`](file:///d:/23082026/site/features/site/data/routeChromeRules.ts) | Per-route chrome layout rules (e.g. which routes hide the header, show a fullscreen canvas shell, or suppress the mobile bottom tab bar). | Independent of SEO; consumed by `MobileAppShell.tsx` and `Header.tsx`. |
| [`routeCopy.ts`](file:///d:/23082026/site/features/site/data/routeCopy.ts) | Route-level editorial copy (hero headlines, section subtitles) kept separate from i18n messages for non-translated content variants. | No SEO dependency, but copy must be bilingual-safe. |
| [`solutionsPage.ts`](file:///d:/23082026/site/features/site/data/solutionsPage.ts) | Static data for the Solutions editorial route — product groupings and use-case copy. | Solutions is routed under `/products/`; check `siteSeoContract.ts` for the canonical entry. |
| [`assistant.ts`](file:///d:/23082026/site/features/site/data/assistant.ts) | AI assistant configuration data — suggested prompts, persona copy, and feature-flag gate. | No SEO dependency. |

### Invariant: Route Lifecycle Protocol (Updated)
For every route in `site/app/(site)/`, first record the intended lifecycle: public `200`, redirect, authenticated/utility, or `not-found`.

1. For a new public `200`, add the `SEO01_STATIC_METADATA` entry, `indexable` classification, metadata factory call, and sitemap entries together.
2. For a redirect, authenticated/utility route, or `not-found`, set its classification first and exclude it from public navigation/footer and HTML/XML sitemaps.
3. A source page or historical metadata object does not justify adding SEO titles, sitemap URLs, or footer links to a dead route.
4. If the route has non-standard chrome (no header, fullscreen), add a rule to `routeChromeRules.ts` independently of SEO.

---

## 6. Preflight & Remediation Guardrails

- **Zero Untranslated English in UI:** When adding or updating marketing copy, developers must never commit English strings directly into `hi.json`. Use `scripts/sync-marketing-i18n-messages.mjs` to synchronize schema keys before manual Hindi translation.
- **Route Additions Protocol:** Only a newly verified public `200` route receives an entry in `SEO01_STATIC_METADATA` and `site/app/sitemap.ts`; all other lifecycle states must be excluded from public discovery surfaces.

---

## 7. Authentication & Edge Proxy Route Contracts (`/access` & `/dashboard`)

Derived from the forensic audit documented in `docs/audit 05092026/homepage-and-auth-audit.md`:

### 7.1 `/access` Edge Proxy Invariants (`site/proxy.ts`)
1. **Loop Prevention on `/access`:** Edge middleware must never unconditionally redirect requests matching `/access` to `/dashboard` based on unverified client cookie presence (`hasSessionAuthCookies()`). An expired or corrupted `sb-*-auth-token` cookie will otherwise trigger an infinite HTTP 307 loop with server layout guards.
2. **Local Development Bypass Exception:** When `DEV_AUTH_BYPASS=1` is active, navigating to `/access` must be permitted for sign-in testing without aggressive forced redirection to `/dashboard`.
3. **Canonical Trailing Slash Sanitization:** `/access/` must redirect canonical 308 to `/access`, preserving query parameters (`?next=...`).

### 7.2 Session Termination & Client Sign-Out Contract
1. **Server Action Delegation:** Client-side components (such as `site/features/shared/dashboard/DashboardClient.tsx`) must never invoke `createAuthClient().auth.signOut()` directly in browser bundles, as server-only Supabase environment variables (`NEXT_ADMIN_SUPABASE_URL`) are omitted from client bundles and throw unhandled exceptions.
2. **Standard Handler:** All client sign-out events must invoke the Server Action `signOutFromSupabase()` in `site/lib/auth/supabaseServerActions.ts`.
## Test reconciliation update (2026-09-05)

Map each navigation target to its source route and classification; separate /planner marketing from /ooplanner workspace journeys. Preserve negative/redirect tests for removed routes rather than recreating pages for stale assertions.

Acceptance: record current path, owner, destination/disposition, preserved assertions, affected commands, and evidence. A filename or age alone is insufficient grounds for retirement. Runtime validation remains pending; this update changes planning documents only.

