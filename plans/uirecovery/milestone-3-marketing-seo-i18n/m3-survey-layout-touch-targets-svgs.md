# Milestone 3 Survey: Marketing Layout, Touch Targets, Tokens & SVGs

**Report ID**: `M3-SURVEY-01`  
**Milestone**: Milestone 3 (Public Marketing, SEO & i18n)  
**Assigned Agent**: `explorer_m3_1` (`teamwork_preview_explorer`)  
**Parent Conversation ID**: `253f8e0a-8c5e-4be3-a6fc-c8099ab17118`  
**Timestamp**: 2026-09-07T00:50:00Z  
**Status**: Completed & Verified  

---

## 1. Executive Summary

A comprehensive, read-only investigation was conducted across all 17 public marketing and client hub routes, shared layout wrappers, and marketing components. The audit systematically cataloged:
1. Raw inline SVGs and direct Phosphor icon imports in marketing components.
2. Interactive touch target violations (<48×48px) on marketing buttons, hero slide progress bars, category tabs, and filter pills.
3. Arbitrary bracket style token classes (`-[...]`) that bypass FOCSS design system tokens.
4. Viewport responsiveness across 390w mobile and 1920w desktop screen widths.
5. Brand Rule "One and Only" (No '&') violations in marketing route titles and descriptions.

---

## 2. Key Empirical Observations

### 2.1 Raw Inline SVGs in Marketing Components
- **`site/components/site/Footer.tsx`**:
  - Lines 18–24: `FacebookIcon` function contains raw `<svg viewBox="0 0 24 24">` with hardcoded path. Requires replacement with Phosphor `FacebookLogo`.
  - Lines 26–32: `YouTubeIcon` function contains raw `<svg viewBox="0 0 24 24">` with hardcoded path. Requires replacement with Phosphor `YoutubeLogo`.
  - Line 16: Direct import `import { Envelope, Phone } from "@phosphor-icons/react";`.
- **`site/components/site/SiteErrorBoundary.tsx`**:
  - Lines 72–85: Raw `<svg viewBox="0 0 24 24">` alert triangle icon with hardcoded path. Requires replacement with Phosphor `Warning`.

### 2.2 Direct Phosphor Imports Bypassing Centralized Mapping
Unlike `PlannerPhIcon` and `StudioPhIcon`, marketing components currently import Phosphor icons directly:
- `site/components/home/HomepageHero.tsx:6`: `ArrowRight, SealCheck`
- `site/components/home/Collections.tsx:6`: `ArrowRight`
- `site/components/home/PlannerToolsShowcase.tsx:5`: `ArrowRight, Sparkle`
- `site/components/home/WhyChooseUs.tsx:5`: `Gauge, Plant, ShieldCheck, Stack`
- `site/components/home/ShowcaseCarousel.tsx:9`: `CaretLeft, CaretRight`
- `site/components/shared/ContactTeaser.tsx:12`: `ArrowUpRight, ChatCircleDots, ChatText, PhoneCall`
- `site/components/about/AboutPageView.tsx:6`: `ArrowRight, Briefcase, Leaf, Question, Storefront`
- `site/components/trusted-by/TrustedByPageView.tsx:6`: `CaretLeft, CaretRight, MagnifyingGlass, Sparkle, X`
- `site/components/products/ProductsPageView.tsx:7`: `ArrowRight, CheckCircle, Clock, ShieldCheck`
- `site/features/site/catalog/FilterGridInner.tsx:5`: `MagnifyingGlass, FadersHorizontal, X, GitDiff`
- `site/features/site/catalog/FilterGrid.components.tsx:5`: `CaretDown, CaretUp, GitDiff, X`

### 2.3 Interactive Touch Targets (<48×48px)
1. **Global Marketing CTA Links & Action Cards**:
   - `site/components/ui/MarketingCtaLink.tsx:57`: Hardcodes `min-h-11` (44px) on primary marketing CTAs used throughout all 17 public routes.
   - `site/components/shared/RouteActionCard.tsx:22-23`: Hardcodes `min-h-11` (44px).
   - `site/focss/site/components/shared/buttons.css`: `.btn-primary`, `.btn-outline`, `.btn-outline-light`, `.btn-accent`, and `.home-btn-secondary` hardcode `min-height: 2.75rem;` (44px).
2. **Homepage Hero Progress Buttons**:
   - `site/focss/site/components/homepage/home-premium-pass.css:88-115`: Base `.home-hero-progress-btn` defined with `min-width: 1.5rem; min-height: 1.5rem;` (24×24px). Mobile override specifies `width: 2.25rem; height: 2.75rem;` (36×44px). Both violate the 48×48px standard.
   - `site/focss/site/components/shared/mobile-tap-targets.css:115`: Explicitly exempts `.home-hero-progress-btn` from mobile tap target enforcement.
3. **Carousel Indicators & Lightbox Controls**:
   - `home-showcase-carousel.css:133-134`: `.home-showcase-dot` defines `width: 2.75rem; height: 2.75rem;` (44px).
   - `trusted-by-page.css:502-503`: Lightbox controls define `width: 2.75rem; height: 2.75rem;` (44px).
   - `clients-page.css:408-409`: Lightbox controls define `min-width: 2.75rem; min-height: 2.75rem;` (44px).
4. **Category Pills & Tabs**:
   - `clients-showcase.css:26-27`: `.clients-showcase__tab` defines `min-height: 44px; min-width: 44px;`.
   - `trusted-by-page.css:122`: `.trusted-by-roster__filter` has `min-height: 2.75rem;` (44px).
   - `faq-page.css:91`: `.faq-category-pill` has `min-height: 2.75rem;` (44px).
   - `catalog-category-hero.css:137`: `.catalog-category-hero__chip` has `min-height: 2.75rem;` (44px).
   - `catalog-cards.css:41-42`: `.catalog-card__compare` specifies `min-height: var(--control-height-xs);` (36px).
   - `Footer.tsx:44, 47, 184, 191, 198, 205`: Social icons and links use `min-h-11 min-w-11` (44px).

### 2.4 Arbitrary Bracket Token Findings
190 findings in `check-style-tokens.mjs` identified arbitrary bracket classes in marketing components:
- `HomepageHero.tsx:166, 185, 203, 234`: `h-[115%]`, `md:object-[64%_48%]`, `text-[color:var(--color-bronze-300)]`.
- `Collections.tsx:45`: `aspect-[5/4]`.
- `ShowcaseCarousel.tsx:216, 220, 223`: `basis-[min(88vw,22rem)]`, `rounded-[var(--radius-giant)]`, `aspect-[4/5]`.
- `FooterLogoMarquee.tsx:40`: `ease-[cubic-bezier(0.22,1,0.36,1)]`.
- `SiteErrorBoundary.tsx:64, 65, 104, 110`: Arbitrary gradient stops and overlay brackets.

### 2.5 Viewport Responsiveness Invariants
- **390w Mobile**:
  - `/compare`: `.compare-table-shell` has `overflow-x: auto`, preventing viewport blowout.
  - `/clients`: `.clients-showcase__tabs` has `overflow-x: auto; scroll-snap-type: x proximity;`.
  - Content containers use `.home-shell-xl` with 16px lateral padding.
- **1920w Desktop**:
  - Max container width clamped via `--container-home-max` (1320px) and `--container-wide-max` (1940px). Layouts remain centered without overstretched line lengths.

---

## 3. Actionable Remediation Roadmap

1. **SVGs & Icons**: Replace Facebook and YouTube SVGs in `Footer.tsx` with Phosphor logos; replace alert triangle in `SiteErrorBoundary.tsx` with Phosphor `Warning`.
2. **Touch Targets**: Upgrade `MarketingCtaLink.tsx`, `RouteActionCard.tsx`, and `buttons.css` to `min-height: 3rem;` (48px); expand `.home-hero-progress-btn` touch hitbox to 48×48px.
3. **Tokens**: Normalize arbitrary bracket classes to semantic FOCSS tokens.
4. **Brand Rule**: Replace legacy `One&Only` strings with `One and Only`.
