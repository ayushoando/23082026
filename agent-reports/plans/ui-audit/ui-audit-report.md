# One&Only — Comprehensive UI Audit Report

**Date:** 2025-07-31  
**Site:** oando.co.in  
**Scope:** Typography · CSS Architecture · Animations · Images · Layout · SEO · Security · Accessibility  
**Pages audited:** 34 routes  
**Severity key:** 🔴 Critical · 🟡 Medium · 🟢 Low · ✅ Pass

---

## Executive Summary

The site has a well-engineered design-system foundation: a dual-font display/body hierarchy (Cisco Sans + Helvetica Neue), a three-scale colour palette (Dark Midnight Blue / Ocean Boat Blue / Bronze), and a token-driven motion system. The homepage and editorial pages (About, Clients, Career, Contact) reach a high standard of typographic rhythm and animation polish. The FOCSS CSS module system is logically structured, @theme-driven, and production-quality.

**Five critical findings:**

1. **Planner UI is visually superficial.** The `/planner` landing page hero title tops out at `clamp(2.35rem→3.75rem)` — significantly below the site's display scale (`clamp(4rem→5.625rem)`). Feature cards have no scroll-reveal, no stagger entry, and weak hover shadows. `/planner/features/[slug]` hero has `min-height: auto` on mobile, collapsing to near-zero height. `/planner/help` has no dedicated CSS file at all.

2. **`--font-weight-semibold` and `--font-weight-medium` are both `500`.** Every `typ-*` utility that declares semibold weight renders identically to medium. There is no visual distinction between medium and semibold across the site.

3. **No dark-mode semantic layer.** `siteViewport.ts` declares a dark `themeColor` (`--color-dark-midnight-blue-950`) but `semantic.css` contains zero `@media (prefers-color-scheme: dark)` rules. Users in dark mode see the full light ecru surface.

4. **`--color-warning`, `--color-accent`, and `--color-whatsapp` all resolve to `bronze-400` (`#9D876C`).** These three semantically distinct roles share an identical computed value, making future theming brittle and creating confusing debugging.

5. **Several SEO titles exceed 60 characters.** `/about` title is 71 chars, and `/products` title references a dynamic string that can overflow. `/tools/*` pages are correctly noindexed and already emit FAQPage JSON-LD; the schema is not a crawlability substitute while those routes remain noindex.

**Quality scores:**

| Category | Score |
|---|---|
| Typography system | 8/10 |
| Animation system | 8/10 |
| Color system | 7/10 |
| Layout & containers | 9/10 |
| Images | 6/10 |
| SEO | 7/10 |
| Security | 8/10 |
| Accessibility | 7/10 |
| **Planner specifically** | **4/10** |

---

## G1. Typography System

### Font Loading

- **Display:** `ciscoSans` via `next/font/local`, CSS var `--font-cisco-sans`
  - Weights loaded: 250 (Thin .ttf), 300 (ExtraLight .ttf), 400 regular (.woff2) + italic (.ttf), 700 bold (.woff2) + italic (.ttf)
  - `display: "swap"`, `preload: true`, `adjustFontFallback: "Arial"`
- **Body:** `helveticaNeue` via `next/font/local`, CSS var `--font-helvetica-neue`
  - Weights loaded: 300 (.otf), 400 (.woff2), 500 (.woff2), 700 (.woff2)
  - `display: "swap"`, `preload: true`, `adjustFontFallback: "Arial"`
- **Fallback chain:** `--font-display: var(--font-cisco-sans), sans-serif` / `--font-sans: var(--font-helvetica-neue), var(--font-cisco-sans), sans-serif`
- **Mono (code/IDs only):** `ui-monospace, "Cascadia Mono", "Segoe UI Mono", monospace`

### Type Size Scale

| Token | Value | Resolved range |
|---|---|---|
| `--type-display-size` | `clamp(4rem, 6.2vw, 5.625rem)` | 64px → 90px |
| `--type-title-lg-size` | `clamp(2rem, 2.3vw, 2.8125rem)` | 32px → 45px |
| `--type-title-sm-size` | `clamp(1.125rem, 1.04rem + 0.24vw, 1.25rem)` | 18px → 20px |
| `--type-card-title-size` | `clamp(1rem, 0.98rem + 0.18vw, 1.15rem)` | 16px → 18.4px |
| `--type-project-title-size` | `clamp(1.1rem, 1rem + 0.35vw, 1.4rem)` | 17.6px → 22.4px |
| `--type-project-display-size` | `clamp(1.75rem, 2.4vw, 2.75rem)` | 28px → 44px |
| `--type-partner-title-size` | `clamp(1.5rem, 1.8vw, 2.1rem)` | 24px → 33.6px |
| `--type-stat-size` | `clamp(2rem, 3.5vw, 3.25rem)` | 32px → 52px |
| `--type-body-lg-size` | `clamp(1rem, 0.99rem + 0.14vw, 1.0625rem)` | 16px → 17px |
| `--type-body-size` | `1rem` | 16px fixed |
| `--type-small-size` | `0.8125rem` | 13px fixed |
| `--type-tiny-size` | `0.6875rem` | 11px fixed |
| `--type-label-size` | `0.75rem` | 12px fixed |

### Weight Scale

| Token | Value | Issue |
|---|---|---|
| `--font-weight-light` | 300 | ✅ |
| `--font-weight-regular` | 400 | ✅ |
| `--font-weight-medium` | 500 | ✅ |
| `--font-weight-semibold` | **500** | 🔴 Same as medium |
| `--font-weight-bold` | 700 | ✅ |
| `--font-weight-display-light` | → light (300) | ✅ |
| `--font-weight-display-regular` | → regular (400) | ✅ |
| `--font-weight-copy-regular` | → regular (400) | ✅ |
| `--font-weight-copy-medium` | → medium (500) | ✅ |
| `--font-weight-copy-semibold` | → semibold **(500)** | 🔴 No visual difference |

### Letter-Spacing Scale

| Token | Value |
|---|---|
| `--type-letter-tight` | -0.05em |
| `--type-letter-title` | -0.04em |
| `--type-letter-h3` | -0.038em |
| `--type-letter-copy` | -0.008em |
| `--type-letter-card` | -0.035em |
| `--type-letter-stat` | -0.06em |
| `--type-letter-label` | 0.05em |
| `--type-letter-label-wide` | 0.11em |
| `--type-letter-nav` | 0.01em |
| `--type-letter-nav-sm` | 0.02em |
| `--type-letter-cta` | 0.04em |
| `--type-letter-micro` | 0.08em |

### Line-Height Scale

| Token | Value | Note |
|---|---|---|
| `--type-leading-display` | 0.94 | Sub-1 — intentional for large display type; risk of descender clipping at small sizes |
| `--type-leading-title` | 1.08 | ✅ |
| `--type-leading-h3` | 1.14 | ✅ |
| `--type-leading-copy` | 1.52 | ✅ |
| `--type-leading-copy-sm` | 1.6 | ✅ |
| `--type-leading-nav` | 1.4 | ✅ |
| `--type-leading-label` | 1.3 | ✅ |
| `--type-leading-cta` | 1.3 | ✅ |
| `--type-leading-stat` | 1 | ✅ |
| `--type-leading-body` | 1.7 | ✅ |

### Utility Classes (`@utility typ-*`)

| Class | Font | Size | Weight | Letter-spacing | Line-height | Role |
|---|---|---|---|---|---|---|
| `typ-h1` / `typ-display` | display | display-size | display-light (300) | tight (-0.05em) | display (0.94) | H1 hero |
| `typ-h2` | display | title-lg | display-light (300) | title (-0.04em) | title (1.08) | Section heading |
| `typ-section` | display | clamp(2rem,3.6vw,2.9rem) | display-light | title | 1.08 | Alt section |
| `typ-section-title` | display | clamp(1.75rem,4vw,2.75rem) | 300 | -0.04em | 1.08 | Alt section |
| `typ-section-subtitle` | sans | body-lg | copy-regular | copy | copy | Section sub |
| `section-title` | display | title-lg | display-regular | title | title | Section (regular weight) |
| `typ-page-title` | display | title-lg | display-light | title | title | Utility pages |
| `typ-subsection-title` | display | clamp(1.75rem,2.4vw,2.25rem) | display-light | title | title | Sub-sections |
| `typ-h3` | display | title-sm | display-light | h3 (-0.038em) | h3 (1.14) | H3 headings |
| `typ-card` | display | card-title | display-regular | card (-0.035em) | h3 | Cards |
| `typ-body` | sans | body | copy-regular | copy | copy | Body |
| `typ-body-lg` | sans | body-lg | copy-regular | copy | copy | Large body |
| `typ-small` | sans | small | copy-regular | copy | copy-sm | Small text |
| `typ-label` | sans | label | copy-semibold | label-wide | label | Labels/overlines |
| `typ-overline` | sans | label | copy-semibold | label-wide | label | Eyebrow overlines |
| `typ-lead` | sans | body-lg | copy-medium | copy | copy | Lead paragraph |

**Known inconsistencies:**
- `typ-section` uses hard-coded `clamp(2rem, 3.6vw, 2.9rem)` instead of `--type-title-lg-size` — slightly diverges from system
- `typ-section-title` overlaps semantically with `typ-section` but uses different letter-spacing source
- `text-wrap: balance` on all heading utilities — good for multiline, but browser support is Chromium 114+ / Firefox 121+ / Safari 17.4+ — ~95% global coverage, acceptable
- `overflow-wrap: anywhere` on headings — aggressive; may break single-word headings at narrow widths

---

## G2. Color System

### Palette

| Scale | Range | Hex extremes |
|---|---|---|
| Ocean Boat Blue | 50–950 (20 steps) | #EDF4FA → #0A1A29 |
| Dark Midnight Blue | 50–950 (20 steps) | #CCD6E3 → #05080C |
| White | 50–500 (10 steps) | #FFFFFF → #ACBDD1 |
| Ecru | 50–950 (9 steps) | #FAFAF8 → #221E16 |
| Bronze | 50–900 | #f5f6f7 → #2c3134 |
| Sustain | 300–500 | #7FAF96 → #476D58 |
| Error Red | raw hex on palette | standalone |

### Semantic Tokens (key)

**Surfaces (light):**
- `--surface-page`: ecru-100 (#F3F2EF) — warm off-white page background
- `--surface-soft`, `--surface-muted`: color-mixed ecru/white variants
- `--surface-card`, `--surface-panel`, `--surface-panel-strong`: ecru-50 (#FAFAF8)
- `--surface-inverse`: dark-midnight-blue-900 (#070D12) — dark sections
- `--surface-canvas`: dark-midnight-blue-950 (#05080C)

**Text:**
- `--text-strong`, `--text-body`, `--text-muted`, `--text-subtle` — on light
- `--text-heading`, `--text-inverse`, `--text-inverse-body`, `--text-inverse-muted` — on dark

**Brand/Accent:**
- `--color-primary`: dark-midnight-blue-500 (#1F3653)
- `--color-accent`: bronze-400 (#9D876C)
- `--color-warning`: bronze-400 (#9D876C) **← same as accent**
- `--color-whatsapp`: bronze-400 (#9D876C) **← same as accent and warning**

### Critical Issues

🔴 **Bronze triple-role collision:** `--color-accent`, `--color-warning`, and `--color-whatsapp` all resolve to `var(--color-bronze-400)` = `#9D876C`. These are semantically distinct roles sharing one value. A warning state visually matches an accent decoration; a WhatsApp CTA looks identical to an accent button.

🟡 **No dark mode semantic layer:** `siteViewport.ts` declares `themeColor: dark → --color-dark-midnight-blue-950` and the viewport exports it. However, `semantic.css` has **zero** `@media (prefers-color-scheme: dark)` blocks. Users with dark OS preference see the full light ecru surface.

🟢 **`color-mix()` usage:** 90+ instances across semantic.css and component CSS. Browser support: Chrome 111+, Firefox 113+, Safari 16.2+. Safe for modern browsers; no IE concern.

🟢 **Potential contrast risk:** `--surface-page` ecru-100 (#F3F2EF) with `--text-muted` (resolves to ocean-boat-blue-600 #406F99) — estimated contrast ~4.2:1, passing AA for normal text (≥4.5:1 required for small text). Needs formal WCAG audit.

---

## G3. Animation & Motion System

### Duration Tokens

| Token | Value |
|---|---|
| `--motion-fast` | 260ms |
| `--motion-base` | 360ms |
| `--motion-slow` | 480ms |
| `--motion-slower` | 640ms |
| `--motion-slowest` | 820ms |

### Easing

- `--ease-standard`: `cubic-bezier(0.22, 1, 0.36, 1)` — gentle deceleration
- Interactions also use `cubic-bezier(0.16, 1, 0.3, 1)` — spring-like

### Keyframe Registry

| Name | File | Duration | From → To | Target | Reduced-motion |
|---|---|---|---|---|---|
| `marquee-left` | animations.css | 110s linear infinite | translateX(0) → (-50%) | Footer logo track | `animation: none` ✅ |
| `marquee-right` | animations.css | 110s linear infinite | translateX(-50%) → (0) | Reverse marquee | `animation: none` ✅ |
| `hero-slider-bounce` | animations.css | — | translateY(0.375rem), opacity 0.4 at 50% | Hero slider indicator | Covered by global override ✅ |
| `consent-slide-in` | animations.css + footer | — | translateY(100%)→0, opacity 0→1 | Cookie consent banner | Global override ✅ |
| `home-reveal-up` | home-base.css | 900ms | opacity 0.45→1, translateY(1.125rem→0) | Scroll-revealed sections | `opacity:1; transform:none; animation:none` ✅ |
| `planner-demo-float` | planner-hero-demo.css | 11s `cubic-bezier(0.45,0,0.55,1)` infinite | translateY(0) ↔ (-3px) | Planner demo widget | `animation: none` ✅ |
| `marketing-cta-band` reveal | home-interactions.css | 900ms `cubic-bezier(0.16,1,0.3,1)` | implicit opacity/transform | CTA dark bands | `animation: none` ✅ |

### GSAP Integration

From `site/lib/helpers/gsapMotion.ts`:
- `GSAP_REVEAL`: `{ y: 18, opacity: 0, duration: 0.7, stagger: 0.08 }`
- `GSAP_EASE_OUT`: `"power3.out"` (approximately cubic-bezier(0.22,1,0.36,1))
- `gsapReducedMotion()` guard checks `window.matchMedia("(prefers-reduced-motion: reduce)")`
- `useGSAP` hook with context cleanup (`ctx.revert()`) and `requestAnimationFrame` delay before init
- Used on: `/quote-cart` header reveal, other GSAP-powered pages

### Panel Hover Transitions

```css
/* home-marketing-interactions.css */
.home-section :is(article, div).scheme-panel {
  transition:
    transform var(--motion-slow) cubic-bezier(0.16, 1, 0.3, 1),   /* 480ms */
    box-shadow var(--motion-slow) cubic-bezier(0.16, 1, 0.3, 1),
    border-color var(--motion-base) var(--ease-standard);          /* 360ms */
}
hover: translateY(-2px), --shadow-lift, --border-strong
```

### prefers-reduced-motion Coverage

Global nuclear override in `animations.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-delay: -1ms !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
}
```
This covers all CSS animations globally. **However, `transition-duration: 0s` also removes hover transitions entirely**, which is overly aggressive — hover transitions (panel lift, nav link colour) should persist in reduced-motion at a shorter duration.

🟡 The `home-tools-floor-demo:hover` transition (`transform var(--motion-base) var(--ease-standard)`) has an individual reduced-motion override (`transform: none`) but the global `transition-duration: 0s` already covers it — redundant but harmless.

---

## G4. Layout System

### Container Hierarchy

| Utility | Max-width | Padding mobile | Padding desktop |
|---|---|---|---|
| `home-shell-xl` | `var(--container-home-max)` = **82.5rem** | `--space-4` (1rem) | `--container-padding-desktop` (2.5rem) |
| `home-shell` | `var(--container-max)` = **105rem** | `--space-5` (1.25rem) | 2.5rem |
| Wide containers | `var(--container-wide-max)` = **121.25rem** | — | — |

### Section Rhythm

| Token | Value | Range |
|---|---|---|
| `--section-space-sm` | `clamp(3rem, 4.5vw, 4rem)` | 48px → 64px |
| `--section-space-md` | `clamp(3.75rem, 5.5vw, 5rem)` | 60px → 80px |
| `--section-space-lg` | `clamp(4.5rem, 6.5vw, 6rem)` | 72px → 96px |

### Scroll / Fixed Nav

- `html { scroll-padding-top: 4rem }` — prevents fixed nav from covering jump targets
- Fixed nav height = `--shell-topbar-h: 3.5rem` but scroll-padding-top uses 4rem (0.5rem safety buffer) ✅
- `site-main-under-header` adds `padding-top: 4rem` for non-underlap pages

### Skip Link (WCAG 2.4.1)

```css
.site-skip-link {
  position: absolute; left: -9999px; top: 0; z-index: 100;
  padding: 0.75rem 1.25rem;
  background: var(--surface-page); color: var(--text-body);
  border: 1px solid currentcolor; border-radius: 0 0 0.375rem 0;
}
.site-skip-link:focus, .site-skip-link:focus-visible { left: 0; }
```
✅ Correctly positioned off-screen and revealed on focus. Z-index 100 above fixed nav (nav is lower). Implementation is WCAG 2.4.1 compliant.

---

## G5. Image Standards

### Format Distribution

Public assets scan: `.webp` files dominate (hero slides, page heroes, product imagery). Some `.png` exist for logos/SVG-derived assets. `.jpg`/`.jpeg` used for legacy catalog images.

### Next/Image Usage

- Pattern: mostly `fill` layout within aspect-ratio containers (product cards, hero slots)
- `sizes` prop: present on major hero images and product cards; missing on some editorial section images
- `priority` prop: used on above-fold hero images on most pages
- `blurDataURL`: sparse — used on some product detail images, missing on others
- Empty `alt=""` found on decorative images (correct) — no confirmed empty alt on informative images
- The audited offline/error brand surface now renders `OneAndOnlyLogo`, which uses `next/image` with intrinsic dimensions. No raw image remediation is currently indicated for that surface.

---

## G6. SEO Standards

### Title Template Compliance

Pattern: `"[Page Title] | One&Only"` (≤60 chars target)

| Page | Title | Chars | Status |
|---|---|---|---|
| / | `One&Only \| One and Only Furniture \| Premium Office Solutions India` | 67 | 🔴 Over |
| /about | `About One&Only \| One and Only Furniture India — Steelcase & Featherlite` | 70 | 🔴 Over |
| /contact | `Contact One and Only Furniture \| Sales \| One&Only` | 50 | ✅ |
| /sustainability | `Sustainable office furniture \| One&Only` | 41 | ✅ |
| /service | `[SERVICE_PAGE_COPY.heroTitle] \| One&Only` | dynamic | 🟡 Verify |
| /career | `Careers \| Office furniture jobs \| One&Only` | 44 | ✅ |
| /showrooms | `One and Only Furniture showroom Patna \| One&Only` | 49 | ✅ |
| /terms | `Terms & Conditions \| One&Only office furniture` | 48 | ✅ |
| /privacy | dynamic via `t("privacy.metadataTitle")` | dynamic | 🟡 Verify |
| /quote-cart | `[QUOTE_CART_ROUTE_COPY.title] \| One&Only` | dynamic | noindex ✅ |
| /access | noindex ✅ | — | — |
| /choose-product | noindex ✅ | — | — |
| /tools/* | noindex ✅ | — | — |
| /compare | noindex ✅ | — | — |

### OG Image

`SITE_BRAND.ogImage` referenced in `buildSiteMetadata` — path defined in brand.ts. No explicit width/height declared (comment in seo.ts notes the image is not 1200×630 so false dimensions are intentionally omitted).

✅ The deliberate omission of OG dimensions is valid for variable-size assets: the Open Graph fields are optional, and the existing code correctly avoids publishing false dimensions. Confirm each referenced asset only if a later design decision requires fixed social-card dimensions.

### JSON-LD Types Per Page

| Page | JSON-LD Types |
|---|---|
| / | WebPage, Organization (sitewide), BreadcrumbList |
| /about | WebPage, BreadcrumbList |
| /contact | ContactPage, BreadcrumbList |
| /planner | WebPage, BreadcrumbList |
| /solutions | CollectionPage, BreadcrumbList |
| /products | CollectionPage, BreadcrumbList |
| /products/[category]/[product] | Product (via buildProductJsonLd) |
| /tools/* | WebPage, FAQPage, BreadcrumbList ✅ |
| /privacy, /terms | WebPage |

**Missing:**
- 🟡 `LocalBusiness` on homepage — critical for local SEO (Patna showroom)
- 🟡 `SoftwareApplication` on `/planner` — Planner is a web app, this schema type improves rich results
- 🟢 `SiteLinksSearchBox` on homepage

### hreflang

`en-IN`, `hi-IN`, `x-default` — implemented via `buildLocaleAlternates()` in seo.ts ✅

### Noindex Pages (correct)

`/quote-cart`, `/compare`, `/access`, `/choose-product`, `/tools/*`, `/portal/*` — all flagged `indexable: false` ✅

---

## G7. Security

### security.txt (RFC 9116)

```
Contact: mailto:sales@oando.co.in
Contact: tel:+91-98356-30940
Expires: 2027-08-09T00:00:00.000Z
Preferred-Languages: en, hi
Canonical: https://oando.co.in/.well-known/security.txt
Policy: https://oando.co.in/privacy/
Hiring: https://oando.co.in/career/
```
✅ RFC 9116 compliant. Expires in future. Canonical is HTTPS. Response served with `X-Content-Type-Options: nosniff`. Cached 24h.

### CSP Nonce

`requestNonce` called in root layout, injected as `nonce` on `<html>`. All `dangerouslySetInnerHTML` JSON-LD scripts are wrapped in `sanitizeJsonForScript()` (strips `</script>` injection vectors). ✅

### Next.config Security Headers

From `next.config.ts` (limited data available):
- 🟡 Full `Content-Security-Policy` header status not confirmed — nonce is generated but whether it's emitted as a header needs verification
- 🟡 `X-Frame-Options: DENY` — status unknown from config read
- 🟡 `Permissions-Policy` — not seen in config
- 🟡 `Referrer-Policy: strict-origin-when-cross-origin` — not confirmed

### Middleware

`middleware.ts` present — handles locale routing and auth guards. Exact CSP header injection location needs verification.

---

## G8. Accessibility

### Skip Link

✅ `.site-skip-link` implemented correctly per WCAG 2.4.1. Off-screen at `left: -9999px`, becomes `left: 0` on focus. Z-index 100 clears fixed header.

### focus-visible

From CSS scan: `focus-visible` present on:
- `.shell-global-nav__brand:focus-visible` — `outline: 0.125rem solid var(--color-primary)`
- `.shell-global-nav__menu-toggle:focus-visible` — same ring
- `.shell-global-nav__link:focus-visible` — inferred (transition property present)
- `.home-tools-floor-demo:focus-visible` — `outline: 0.125rem solid var(--color-accent)`
- `.pfp-card:focus-visible` — `box-shadow: var(--focus-ring)` (planner feature card) ✅
- `.pfp-anchor:focus-visible` — present

🟡 Focus ring using `outline` on some elements vs `box-shadow: var(--focus-ring)` on others — inconsistent approach. Should standardise on one system.

🟡 Input fields in contact teaser use `:focus` (not `:focus-visible`) — should use `:focus-visible` to avoid ring on mouse click.

### Landmarks

- `<html lang>` correctly set from locale ✅
- Root layout uses `suppressHydrationWarning` on html+body ✅
- Site layout provides full SiteLayout wrapper

🟡 Confirm `<main>`, `<nav>`, `<header>`, `<footer>` landmark elements are present in all page templates — not directly verifiable from CSS alone.

---

## Per-Page Audit

---

### / — Homepage

**Typography**
- H1: `.home-hero-title-homepage` (inferred from CSS utilities) or `typ-h1` — Cisco Sans, `clamp(4rem, 6.2vw, 5.625rem)`, weight 300, letter-spacing -0.05em, line-height 0.94
- Section headings: `home-heading` utility — Cisco Sans, `--type-title-lg-size` (clamp 2rem→2.8125rem), weight 300, letter-spacing -0.04em
- Body: Helvetica Neue, 1rem, weight 400, line-height 1.52
- ✅ Typography hierarchy is correct and well-executed

**Layout**
- Container: `home-shell-xl` (max 82.5rem), `home-shell` (max 105rem) for wide bands
- Cinema hero underlaps fixed nav via `data-hero-underlap="true"`
- Section variants: `--sand`, `--soft`, `--white`, `--dark` — each with distinct gradient backgrounds
- Section rhythm: `--section-space-md` / `--section-space-lg`

**Animations**
- `home-reveal-up` on all section entries: 900ms, cubic-bezier(0.16,1,0.3,1), opacity 0.45→1, y 1.125rem→0 ✅ reduced-motion handled
- `marketing-cta-band`: 900ms reveal, only on `prefers-reduced-motion: no-preference` ✅
- Panel hover: translateY(-2px), 480ms spring easing ✅
- Marquee in footer: 110s linear, hover pause ✅
- `planner-demo-float`: 11s on planner widget shown on homepage tools band ✅

**Images**
- Hero: `next/image` fill, `priority` set ✅
- Showcase: `next/image`, `sizes` should be present
- 🟡 blurDataURL coverage on hero images unclear

**Color**
- Surface: `--surface-page` (ecru-100), `--surface-inverse` (dark bands)
- ✅ No hardcoded hex found in homepage CSS

**SEO**
- Title: "One&Only | One and Only Furniture | Premium Office Solutions India" — **67 chars** 🔴 Over 60
- Description: brand+location+products — ~160 chars ✅
- OG image: SITE_BRAND.ogImage (path TBC) 🟡
- JSON-LD: WebPage, Organization ✅
- 🟡 Missing `LocalBusiness` schema (Patna showroom, address, phone, hours)

**A11y**
- Skip link: ✅ present
- `scroll-padding-top: 4rem` ✅
- Selection colour: `bg-primary / text-inverse` ✅

**Issues**
- 🔴 Title 67 chars, 7 over limit — will truncate in SERPs
- 🟡 Missing LocalBusiness JSON-LD schema
- 🟡 OG image dimensions not declared
- 🟢 `overflow-wrap: anywhere` on h1 may break very short titles at narrow viewport

---

### /about — About Page

**Typography**
- H1 (`.about-hero__title`): `text-wrap: pretty` set on element, uses `home-hero-title-route` — Cisco Sans, `clamp(2.5rem, 8.5vw, 3.75rem)`, weight 300, color `--text-inverse`
- Craft quote (`.about-craft-quote__text`): Cisco Sans, `clamp(1.35rem, 2.35vw, 1.75rem)`, weight 300, line-height 1.45, letter-spacing -0.02em
- Story lead (`.about-story__lead`): Helvetica Neue, `clamp(1.05rem, 2.4vw, 1.2rem)`, weight 400, line-height 1.6
- Attribution: `0.875rem` — **hardcoded**, not using `--type-small-size` (0.8125rem) 🟡

**Layout**
- Asymmetric story grid: `minmax(0, 1.15fr) minmax(0, 0.85fr)` at 56rem breakpoint
- Media: `aspect-ratio: 4/5` → `5/6` on desktop, `max-height: 36rem`, `border-radius: 1rem`
- Craft strip: `border-block` with `color-mix` bronze separator
- CTA ink band: `--surface-inverse`, 2-column at 48rem

**Animations**
- Hero underlap: ✅ `.about-hero` class triggers padding-top:0 in soft-bands.css
- `home-reveal` applied to sections ✅
- 🟡 No explicit scroll-reveal stagger on pillars section — they appear instantly

**Images**
- Story media: `fill` within aspect-ratio container, `object-position: 58% 42%` (custom focal point) ✅
- 🟡 `priority` on above-fold hero image — verify in component

**Color**
- Hero: `--surface-inverse` (dark), `--text-inverse`
- Story: `--surface-page`, `--text-body`
- Craft strip: `color-mix(in srgb, --color-bronze-300 9%, --color-white-50)` ✅

**SEO**
- Title: "About One&Only | One and Only Furniture India — Steelcase & Featherlite" — **71 chars** 🔴 Over
- Description: from `ABOUT_PAGE_COPY.heroSubtitle` — verify length
- JSON-LD: WebPage, BreadcrumbList ✅
- Keywords: 10 terms, well-targeted ✅

**Issues**
- 🔴 Title 71 chars — needs shortening
- 🟡 Attribution font-size `0.875rem` hardcoded — should be `--type-small-size`
- 🟡 Pillar cards lack scroll-reveal stagger
- 🟢 `border-radius: 1rem` on media container — not using `--radius-lg` (1.25rem) token

---

### /career — Career Page

**Typography**
- Hero: `.career-hero` class triggers underlap — uses `home-hero-title-route` pattern
- Career card titles: via `career-page.css` — tokens used correctly
- Body: Helvetica Neue, `--type-body-size`, `--type-leading-copy`

**Layout**
- Hero underlap ✅
- Job grid: `career-page.css` defines card layout with clamp gaps
- Mobile: single column, stacked

**Animations**
- Hero reveal: standard `home-reveal` ✅
- Card hover: likely inherits `scheme-panel` hover from home-interactions.css ✅

**SEO**
- Title: "Careers | Office furniture jobs | One&Only" — 44 chars ✅
- JSON-LD: WebPage, BreadcrumbList (from page.tsx pattern)
- Keywords: job-specific terms ✅

**Issues**
- 🟢 Verify `priority` on hero image

---

### /clients — Clients Page

**Typography**
- Proof strip: `.clients-proof-strip__value` — Cisco Sans, `--type-stat-size` (clamp 2rem→3.25rem), weight 300, letter-spacing -0.06em, line-height 1 ✅ excellent stat display
- Labels: `--type-label-size` (0.75rem), `--font-weight-copy-medium`, `--type-letter-label-wide` (0.11em) uppercase ✅
- Pull-quote: uses `border-inline-start` with bronze accent

**Layout**
- Work mosaic: `grid-template-columns: repeat(2, minmax(0, 1fr))` — 2-column image grid
- Pull quotes: 2-up at 48rem breakpoint ✅
- `.clients-proof-strip__item:first-child { border-inline-start: none }` — removes left border on first stat ✅

**Color**
- Strip background: `color-mix(in srgb, --color-bronze-300 8%, --color-white-50)` — subtle warm tint ✅
- Borders: `color-mix(in srgb, --color-bronze-400 28%, transparent)` ✅

**Issues**
- 🟡 `.clients-proof-strip__as-of` has hardcoded `letter-spacing: 0.12em` — not using a token
- 🟢 Missing reduced-motion test for any JS scroll-triggered animations

---

### /compare — Compare Page

**Typography**
- `.compare-status__count`: Cisco Sans, `clamp(2.5rem, 6vw, 3.25rem)`, line-height 1, `--text-inverse` — large stat display ✅
- `.compare-header__title`: uses `typ-page-title` ✅
- `.compare-bronze` strips: standard bronze decoration

**Layout**
- No hero theater — `padding-block-start: 4rem` (fixed header clearance) ✅
- Header grid: 1.15fr/0.85fr at 64rem ✅

**SEO**
- `indexable: false` ✅ correctly noindexed
- `alternates: false` ✅

**Issues**
- 🟢 `background: var(--surface-page, var(--color-white-50))` — fallback value for surface-page is redundant (surface-page is always defined)

---

### /contact — Contact Page

**Typography**
- Hero: `home-hero-title-route` — Cisco Sans, clamp 2.5rem→3.75rem, weight 300 ✅
- Form section title (`.contact-form-band__title`): Cisco Sans, `clamp(1.5rem, 2.8vw, 2rem)`, weight 300, letter-spacing -0.04em ✅
- Input: Helvetica Neue, `--type-body-lg-size`, weight 400, letter-spacing -0.008em ✅
- Input focus: `:focus` not `:focus-visible` 🟡

**Layout**
- Hero underlap ✅
- Quick desk sidebar + main form panel — responsive grid

**Animations**
- `home-reveal` on hero ✅
- Input transitions: `border-color, box-shadow, background-color` at `150ms` — **hardcoded, not using `--motion-fast` (260ms)** 🟡

**SEO**
- Title: "Contact One and Only Furniture | Sales | One&Only" — 50 chars ✅
- OG image: TVS3 hero slide ✅
- JSON-LD: ContactPage, BreadcrumbList ✅

**Issues**
- 🟡 Input `:focus` should be `:focus-visible`
- 🟡 Input transition `150ms` hardcoded — use `--motion-fast`

---

### /downloads — Downloads Page (Resource Desk)

**Typography**
- Resource title: inherits `typ-card` or similar
- Process index: `0.75rem`, `font-weight: 600` — **hardcoded 600** 🟡 (no 600 weight loaded; browser synthesises bold)
- Process title/detail: uses `--text-inverse` / `--text-inverse-body` ✅
- Note bullets: `0.5rem` circle — presentational ✅

**Layout**
- Resource rows: `0.38fr / 1fr / auto` grid at 48rem ✅
- Process steps: `border-inline-start: 2px solid color-mix(bronze 55%)` — consistent with site pattern ✅

**Issues**
- 🟡 `.downloads-process__index` uses `font-weight: 600` — weight not loaded, will synthesise
- 🟢 `line-height: 1.55` on detail copy — not using a token (nearest: `--type-leading-copy: 1.52`)

---

### /planning — Planning Page

**SEO**
- Title: generated from `copy.heroTitle | One&Only` via `generateMetadata` ✅
- JSON-LD: WebPage, BreadcrumbList ✅

**Issues**
- 🟢 No dedicated planning-page.css found — relies entirely on shared utilities (fine if intentional)

---

### /planner — Planner Landing Page ⚠️ DETAILED REVIEW

**Typography**

The planner hero title is significantly undersized compared to the homepage and other editorial heroes:

| Context | Size |
|---|---|
| Homepage H1 | `clamp(4rem, 6.2vw, 5.625rem)` = 64–90px |
| About/Career/Contact route hero | `clamp(2.5rem, 8.5vw, 3.75rem)` = 40–60px |
| **Planner landing hero title** | `clamp(2.35rem, 8vw, 2.85rem)` mobile / `clamp(2.75rem, 2.8vw, 3.75rem)` desktop |

At desktop viewport (1280px): planner title = 3.75rem (matches route heroes) ✅  
At mid viewport (768px): planner title = ~2.75rem vs homepage ~4.6rem 🔴 **significant gap**

- Hero title: `.planner-landing-hero__title` — Cisco Sans, weight 300, `--type-letter-title` (-0.04em), `--type-leading-title` (1.08), `text-wrap: balance` ✅
- Lede: `.planner-landing-hero__lede` — Helvetica Neue, `--type-body-lg-size`, `--type-leading-copy-sm` ✅
- Feature card titles: via `planner-landing-shared.css` (specific class TBC)
- **No kicker/eyebrow above hero title** — homepage, about, contact all have a `typ-overline` kicker above H1; planner landing does not 🟡

**Layout**

Hero:
- Grid: `minmax(0, 0.42fr) minmax(0, 0.58fr)` at md breakpoint — copy column slightly narrow
- Mobile: copy first (order 0), demo second (order 1) ✅
- `min-height: min(52vh, 30rem)` at 64rem+ — ✅ but 30rem cap can feel short on tall displays
- `max-width: 12ch` on title — very constrained, forces 3-4 word wrap at any size 🟡

Feature grid (planner-landing-shared.css):
- `.planner-landing-features`: grid layout — columns not yet confirmed from available data
- `.planner-landing-feature`: individual feature card
- Mobile: single column (from planner-landing-mobile.css) ✅

**Animations**
- Hero entry: **NO `home-reveal` animation on hero heading/lede** 🔴 — the homepage hero, about hero, and contact hero all have explicit reveal animations; planner landing hero loads with no entry animation
- Planner demo widget: `planner-demo-float` 11s float ✅, but `animation: none` in `.pfp-hero-demo-wrap .planner-hero-demo` on feature pages (correct for sub-pages)
- Feature cards: hover uses `transform/box-shadow` from `.planner-landing-feature` — 🟡 verify transition tokens match site standards; no stagger entry on cards
- `marketing-cta-band` present at bottom of page — receives 900ms reveal ✅

**Images**
- Planner demo widget: CSS/SVG based (not a photo) ✅
- Feature card images: likely Next/Image with aspect-ratio containers — verify `sizes` prop

**Color**
- Hero background: `--surface-inverse` (dark midnight blue) — consistent with site dark hero pattern ✅
- Hero text: `--text-inverse`, `--text-inverse-body` ✅
- Feature section: `--surface-page` (ecru-100) ✅

**SEO**
- Metadata: `PLANNER_LANDING_PAGE_METADATA` from routeMetadata.ts — title/description not directly read
- JSON-LD: WebPage + BreadcrumbList ✅
- 🟡 **Missing `SoftwareApplication` JSON-LD** — the planner is a web application; this schema type enables app-specific rich results

**A11y**
- Focus: `.pfp-card:focus-visible` has `box-shadow: var(--focus-ring)` ✅ (on feature pages)
- 🟡 Planner landing feature cards — verify `focus-visible` state on individual card links

**Issues**
- 🔴 **No hero entry animation** — static load while rest of site reveals. Add `home-reveal` stagger to `.planner-landing-hero__title`, `.planner-landing-hero__lede`, `.planner-landing-hero__actions`
- 🔴 **Hero title capped at `max-width: 12ch`** — forces narrow measure; on mobile feels cramped. Consider `max-width: 16ch` or `text-wrap: balance` without fixed ch limit
- 🟡 **No eyebrow/kicker** above H1 — every other editorial hero has `typ-overline` kicker (e.g. "Workspace Planning Tool")
- 🟡 **Missing `SoftwareApplication` JSON-LD**
- 🟡 Feature cards lack scroll-reveal stagger
- 🟡 `min-height: min(52vh, 30rem)` — 30rem cap is 480px; on a 1400px tall display the hero occupies only ~34% of viewport
- 🟢 Demo widget float (11s) is smooth but could benefit from a subtle entry delay (`animation-delay: 0.5s`) to let the hero text reveal first

---

### /planner/features — Planner Features Index

**Typography**
- Hero uses `pfp-hero-band` + `pfp-hero-copy` from `planner-feature-pages.css`
- Hero background: `--surface-inverse` with overlay gradients ✅
- Hero min-height: `72vh` at 1280px+ — but `auto` below md breakpoint 🔴 collapses to near-zero on mobile
- `.home-hero-title-homepage` class used for title on mobile — but this is a sub-page, not homepage
- Feature pills: `.pfp-feature-strip` grid (1→2→4 columns at sm→md→75rem) ✅

**Animations**
- Feature strip overlaps hero bottom by `-1.75rem` (`margin-top: -1.75rem`) for depth effect ✅
- `.pfp-feature-pill` hover: `translateY(-2px)`, `border-color mix`, `--shadow-soft` ✅
- 🟡 No page entry animation — feature strip loads instantly

**Issues**
- 🔴 `.pfp-hero-band { min-height: auto }` on mobile — hero collapses. Set minimum `min-height: 50vw` or `min-height: 18rem`
- 🟡 Feature pill reduced-motion: hover covered by global override ✅ but explicit rule would be cleaner
- 🟡 No breadcrumb visible in hero (breadcrumb JSON-LD exists but visual breadcrumb not confirmed)

---

### /planner/features/[slug] — Feature Detail Page

**Typography**
- Hero: `pfp-hero-band` with full `72vh` min-height at 1280px ✅
- Copy: `pfp-hero-copy` (max-width 43rem) — reasonable measure for copy ✅
- `.pfp-card` body content: uses standard `typ-*` utilities
- `pfp-demo` panel: blueprint-grid background, contains SVG illustration

**Layout**
- Hero 2-column at lg: `0.95fr / minmax(22.5rem, 1.05fr)` ✅
- `pfp-feature-strip`: shows related feature pills below hero (overlap -1.75rem) ✅
- `.pfp-card`: `flex-direction: column`, `gap: 0.85rem`, `border-radius: var(--radius-xl)` ✅

**Animations**
- `.pfp-card` hover: `translateY(-3px)`, `border-color mix primary 35%`, `--shadow-soft` — slightly deeper lift than home panels (2px vs 3px) 🟢 intentional differentiation
- `.pfp-card:focus-visible`: `box-shadow: var(--focus-ring)` ✅
- Demo widget: `animation: none` (no float on sub-pages — correct) ✅
- 🟡 No page entry reveal animation

**Issues**
- 🟡 `animation: none` on pfp demo widget is correct but the widget also lacks an entry fade — it pops in abruptly
- 🟡 No `home-reveal` on hero heading
- 🟢 `.pfp-anchor` opacity 0.72 on non-hover — subtle; may be hard to discover

---

### /planner/help — Planner Help Page

**Typography**
- Uses `pfp-page` + `pfp-hero-band` pattern (from planner-feature-pages.css)
- **No dedicated `planner-help.css` file exists** 🟡

**Issues**
- 🟡 No dedicated help CSS — page relies entirely on shared pfp utilities
- ✅ FAQPage JSON-LD is already emitted from the route using `PLANNER_HELP_FAQ_ITEMS`; preserve its parity with visible Q&A content.
- 🟡 No visible breadcrumb back to `/planner/features`

---

### /products — Products Listing

**SEO**
- Metadata: `PRODUCTS_PAGE_METADATA` from routeMetadata ✅
- JSON-LD: CollectionPage + BreadcrumbList ✅

**Issues**
- 🟡 Verify product card `sizes` prop on Next/Image

---

### /products/[category] — Category Page

**SEO**
- `generateMetadata` — dynamic ✅
- JSON-LD: CollectionPage ✅

---

### /products/[category]/[product] — Product Detail

**SEO**
- `generateMetadata` — dynamic ✅
- JSON-LD: Product (via `buildProductJsonLd`) ✅

**Images**
- Product gallery should have `priority` on first image ✅ verify
- `sizes` prop critical for product gallery images — verify presence

---

### /quote-cart — Quote Cart

**Typography**
- H1: `home-heading` utility (Cisco Sans, `--type-title-lg-size`, weight 300) ✅
- Kicker: `typ-overline` ✅
- Body: `page-copy` class

**Animations**
- GSAP reveal on header: `gsap.from()` with `y: 18, opacity: 0, duration: 0.7, stagger: 0.08` ✅
- `gsapReducedMotion()` guard ✅
- RAF delay before init ✅

**SEO**
- `indexable: false` ✅
- `alternates: false` ✅

**Issues**
- 🟢 Empty cart state — verify `typ-lead` class sizing for empty state heading

---

### /service, /showrooms, /trusted-by, /sustainability — Editorial Pages

All follow same pattern: `HomeMarketingLayout`, route hero with `home-hero-title-route`, `home-reveal` entries, `ContactTeaser` footer section. SEO metadata from `routeMetadata.ts`. Breadcrumb JSON-LD. ✅

**/showrooms**
- Title: "One and Only Furniture showroom Patna | One&Only" — 49 chars ✅
- 🟡 Missing `LocalBusiness` schema with address, hours, geo coordinates

**/sustainability**
- Title: "Sustainable office furniture | One&Only" — 41 chars ✅

**/trusted-by**
- Uses `trusted-by-hero` underlap ✅

---

### /solutions and /solutions/[category] — Solutions Hub

**SEO**
- `SOLUTIONS_PAGE_METADATA`: title and description from routeCopy ✅
- JSON-LD: CollectionPage + BreadcrumbList ✅
- Note: solutions page comment says "GSAP reveals" — verify these are present

**Issues**
- 🟡 Verify GSAP reveal actually fires on solutions category grid

---

### /terms, /privacy, /refund-and-return-policy — Legal Pages

**Typography**
- `data-legal-reveal` attribute for scroll reveal animation (JS-driven, not CSS `home-reveal`) ✅
- Aside: `scheme-panel-dark` / `scheme-panel` — correct dark/light aside pattern
- Cookie table: `--type-body-size`, `--font-weight-copy-medium` ✅
- Cookie card name: `font-weight: 700` hardcoded — fine as bold is loaded ✅

**Layout**
- `legal-layout` grid: `0.9fr/1.1fr` (privacy) or `0.92fr/1.08fr` (terms) at lg breakpoint ✅
- Aside: `rounded-2xl border p-6 sm:p-7 md:p-9` — Tailwind utility classes mixed with FOCSS 🟢 consistent with project approach

**SEO**
- Terms: `alternates: false` ✅ (legal pages skip hreflang)
- Privacy: `generateMetadata` with translation key ✅
- 🟡 Legal pages have no JSON-LD — consider `WebPage` minimum

---

### /tools/office-space-calculator, /tools/meeting-room-capacity-calculator

**SEO**
- Both: `indexable: false` ✅
- Both: `FAQPage` JSON-LD ✅ (tools pages actually do have FAQ schema — this is correct)
- Both: BreadcrumbList ✅

---

### /portal, /portal/guest, /portal/[id] — Client Portal

**SEO**
- Portal routes should all be `indexable: false` — verify each sub-route
- No marketing layout — workspace shell

---

### /choose-product, /access — App Entry Pages

**SEO**
- Both: `indexable: false`, `alternates: false` ✅

---

### /not-found (404), /error (500), /offline

**Typography (error page)**
- `.site-error__title`: Cisco Sans, `--type-title-lg-size`, `--font-weight-display-regular` (400) ✅
- `.site-error__kicker`: `color: var(--color-bronze-500)` — ✅ bronze accent correct
- `.site-error__copy`: `color: var(--text-muted)`, line-height 1.65 (hardcoded — near `--type-leading-copy-sm: 1.6`) 🟢

**Layout**
- `min-height: 100dvh` ✅ uses dynamic viewport
- `backdrop-filter: blur(6px)` on panel ✅
- `width: min(100%, 28rem)` — centered card ✅

**Images**
- `site-error__brand` renders `OneAndOnlyLogo`, which already uses `next/image` with intrinsic dimensions ✅
- Background: CSS `url("/media/hero/planning-poster.webp")` with 0.22 opacity — decorative ambient ✅

**Issues**
- ✅ No raw image remediation is indicated for the audited offline/error brand surface.
- 🟢 `line-height: 1.65` hardcoded — use `--type-leading-copy-sm`

---

### /admin/* — Admin Routes

Admin has its own FOCSS subtree (`focss/admin/`). Out of scope for this marketing site audit. Security: admin routes should be fully authenticated — verify middleware covers all `/admin/*` paths.

---

## Issue Register

| ID | Page | Category | Finding | Severity | Phase |
|---|---|---|---|---|---|
| UI-001 | / | SEO | Title 67 chars (limit 60) | 🔴 | 6 |
| UI-002 | /about | SEO | Title 71 chars (limit 60) | 🔴 | 6 |
| UI-003 | /planner | Animation | No entry animation on hero heading/lede/actions | 🔴 | 4 |
| UI-004 | /planner/features | Layout | `pfp-hero-band min-height: auto` on mobile collapses hero | 🔴 | 4 |
| UI-005 | Global | Color | `--font-weight-semibold` = 500 = `--font-weight-medium` — no visual distinction | 🔴 | 1 |
| UI-006 | Global | Color | `--color-warning`, `--color-accent`, `--color-whatsapp` all resolve to bronze-400 | 🔴 | 2 |
| UI-007 | Global | Color | No dark mode semantic layer despite dark themeColor declared | 🔴 | 2 |
| UI-008 | /planner | SEO | Missing `SoftwareApplication` JSON-LD | 🟡 | 6 |
| UI-009 | /planner/help | SEO | FAQPage JSON-LD verified present; preserve parity with visible Q&A | ✅ | — |
| UI-010 | / | SEO | Missing `LocalBusiness` JSON-LD | 🟡 | 6 |
| UI-011 | /showrooms | SEO | Missing `LocalBusiness` JSON-LD with address/hours/geo | 🟡 | 6 |
| UI-012 | /planner | Typography | No eyebrow/kicker above H1 (all other editorial heroes have one) | 🟡 | 4 |
| UI-013 | /planner | Typography | Hero title `max-width: 12ch` forces excessive wrapping on mobile | 🟡 | 4 |
| UI-014 | /planner/features | Animation | No page entry reveal animation on hero or feature pills | 🟡 | 4 |
| UI-015 | /planner/features/[slug] | Animation | No hero entry reveal; demo widget entry is abrupt | 🟡 | 4 |
| UI-016 | /planner/help | CSS | No dedicated CSS file — entirely relies on shared pfp utilities | 🟡 | 4 |
| UI-017 | /contact | CSS | Input `:focus` should be `:focus-visible` | 🟡 | 7 |
| UI-018 | /contact | CSS | Input transition `150ms` hardcoded — should use `--motion-fast` | 🟡 | 3 |
| UI-019 | /downloads | Typography | `font-weight: 600` hardcoded (weight not loaded; browser synthesises) | 🟡 | 1 |
| UI-020 | Global | Animation | Global `transition-duration: 0s` in reduced-motion is overly aggressive — kills hover transitions | 🟡 | 3 |
| UI-021 | Global | A11y | `focus-visible` vs `:focus` inconsistency across inputs | 🟡 | 7 |
| UI-022 | Global | A11y | Focus ring approach inconsistent (`outline` vs `box-shadow`) | 🟡 | 7 |
| UI-023 | /offline/error surface | Images | Branded logo verified to use `next/image` via `OneAndOnlyLogo` | ✅ | — |
| UI-024 | Global | SEO | Optional OG dimensions intentionally omitted for variable-size assets; no false metadata | ✅ | — |
| UI-025 | /about | Typography | Attribution `0.875rem` hardcoded — use `--type-small-size` | 🟢 | 1 |
| UI-026 | /about | CSS | `border-radius: 1rem` on media — use `--radius-lg` (1.25rem) | 🟢 | 1 |
| UI-027 | /clients | CSS | `letter-spacing: 0.12em` hardcoded on proof strip as-of — use token | 🟢 | 1 |
| UI-028 | /downloads | CSS | `line-height: 1.55` hardcoded — use `--type-leading-copy` | 🟢 | 1 |
| UI-029 | /error | CSS | `line-height: 1.65` hardcoded — use `--type-leading-copy-sm` | 🟢 | 1 |
| UI-030 | /compare | CSS | `var(--surface-page, var(--color-white-50))` — unnecessary fallback | 🟢 | 1 |
| UI-031 | /planner | Layout | `min-height: min(52vh, 30rem)` — 30rem cap too short on tall displays | 🟢 | 4 |
| UI-032 | /planner | Animation | Demo widget float could use `animation-delay: 0.5s` to sequence after text reveal | 🟢 | 4 |
| UI-033 | Global | Typography | `overflow-wrap: anywhere` on headings may break short heading text | 🟢 | 1 |

---

## Appendix A — Token Reference

### Type Scale Summary

| Token | Range |
|---|---|
| Display | 64–90px |
| Title LG | 32–45px |
| Stat | 32–52px |
| Section (utility) | 32–46px |
| Project Display | 28–44px |
| Partner Title | 24–33.6px |
| Title SM | 18–20px |
| Card Title | 16–18.4px |
| Body LG | 16–17px |
| Body | 16px |
| Small | 13px |
| Label | 12px |
| Tiny | 11px |

### Motion Tokens

| Token | Value |
|---|---|
| fast | 260ms |
| base | 360ms |
| slow | 480ms |
| slower | 640ms |
| slowest | 820ms |
| ease-standard | cubic-bezier(0.22, 1, 0.36, 1) |

### Container Tokens

| Token | Value |
|---|---|
| home-max | 82.5rem (1320px) |
| container-max | 105rem (1680px) |
| container-wide-max | 121.25rem (1940px) |
| padding mobile | 1.5rem |
| padding desktop | 2.5rem |
