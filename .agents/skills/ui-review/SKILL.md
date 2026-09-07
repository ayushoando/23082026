---
name: ui-review
description: "Execute or review UI redesigns and implementations under zero-compromise thermonuclear standards. Covers evidence-led visual direction, single-route blast radius, local asset primacy, FOCSS tokens, mobile chrome, typography, Phosphor icons, accessibility, and i18n."
---

# UI Design & Review — Zero-Compromise Visual & Ergonomic Standard

Use this skill when designing, redesigning, restyling, auditing, or reviewing any user interface route or component in the Oando platform (`site/app/(site)/`, `site/components/`). This standard is **merciless, exhaustive, and uncompromising**: elevate visual rhythm, ergonomics, and brand distinction with **zero room for escape**, zero tolerance for arbitrary styles, and zero leniency for desktop-only validation.

---

## 1. The 4-Phase Evidence-Led Redesign Protocol

When implementing or redesigning a route, follow this structured execution pipeline:

```
┌────────────────────────────────────────────────────────────────────────┐
│                 THERMONUCLEAR UI IMPLEMENTATION PIPELINE               │
├────────────────────────────────────────────────────────────────────────┤
│ 1. DISCOVERY & VISUAL DIRECTION                                        │
│    • Inspect live route, existing data contracts, and imported styles  │
│    • Prioritize local photography and verified SVG client logos first  │
│    • Define clear visual hierarchy: value prop, hero CTA, trust strip  │
├────────────────────────────────────────────────────────────────────────┤
│ 2. SINGLE-ROUTE BLAST RADIUS & MANIFEST                                │
│    • Confine edits strictly to requested route and its owned components│
│    • Never opportunistically redesign shared navigation or headers    │
├────────────────────────────────────────────────────────────────────────┤
│ 3. TOKENIZED IMPLEMENTATION & MOBILE CHROME                            │
│    • Apply semantic @focss/* design tokens (surfaces, borders, text)   │
│    • Structure mobile layout with .mobile-app-main scroller            │
│    • Ensure minimum 48px touch targets on all interactive controls     │
├────────────────────────────────────────────────────────────────────────┤
│ 4. MULTI-VIEWPORT VERIFICATION & AUDIT                                 │
│    • Verify: 390px (Mobile), 768px (Tablet), 1440px (Desktop)          │
│    • Run automated style token, i18n parity, and layout gates          │
└────────────────────────────────────────────────────────────────────────┘
```

- **Local Assets First:** Always prioritize existing high-resolution photography under `site/public/assets/marketing/` and verified SVG client logos under `site/public/assets/marketing/client-logos/`. Never generate synthetic or AI imagery when authentic project assets exist locally.
- **Single-Route Containment:** Confine edits strictly to the requested route and its direct subcomponents. Do not redesign global chrome or adjacent pages without explicit user instruction.

---

## 2. The Eight Unforgivable UI Sins (Automatic Immediate Rejection)

Any occurrence of the following triggers an **immediate FAIL** verdict:

1. **Arbitrary Styling & Token Bypasses:** Inline hex codes (`#1a1a1a`), RGB literals, arbitrary Tailwind brackets (`text-[#...]`, `bg-[#...]`, `w-[347px]`, `p-[13px]`). All styling must consume FOCSS semantic tokens.
2. **Desktop-Only Validation:** Declaring a page reviewed or redesigned without verifying Mobile (390×844 iPhone 12/13/14), Tablet (768×1024 / 1024×768), and Desktop (1440×900).
3. **The Window Scroller Trap on Mobile:** In `<768px` viewports, page content scrolls inside `<div className="mobile-app-main">`. If GSAP ScrollTrigger, parallax, or intersection observers bind to `window`, animations freeze permanently at `opacity: 0`.
4. **Ad-hoc Inline SVGs & Icon Chaos:** Using raw `<svg>` elements or mixing icon sets. The platform standard is strictly `@phosphor-icons/react` with consistent weight (`regular`, `bold`, or `fill`).
5. **Hardcoded Strings (i18n Bypass):** Any user-visible text in JSX not routed through `useTranslations()` from `next-intl`.
6. **Sub-44px Touch Targets:** Clickable/tappable elements (buttons, links, tab items, dropdown items) with hit boxes smaller than $44 \times 44\text{ px}$ (standard 48px) on touch viewports.
7. **Contrast & Illegibility Violations:** Text or interactive controls failing WCAG 2.2 AA minimum contrast ratios (4.5:1 for normal text, 3:1 for large text/icons).
8. **Layout Shift (CLS) & Missing Aspect Ratios:** Unsized images or dynamic content causing cumulative layout shift during page hydration (CLS must equal 0).

---

## 3. FOCSS 4-Zone Design Token Architecture

The repository isolates CSS into 4 independent zones under `site/focss/`:
- `site/`: Public marketing and client-hub routes
- `admin/`: Commercial admin and staff portal
- `planner/`: Interactive architectural floor planner
- `studio/`: Parametric furniture specification studio

### Strict Token Evaluation Rules
- **Color Tokens:** Must map to `@focss` theme variables (`--color-surface-*`, `--color-text-*`, `--color-border-*`, `--color-brand-*`). Never commit raw hex, `hsl()`, or `rgb()`.
- **Typography Weights:** Must strictly consume semantic font weight tokens (`--font-weight-medium: 500`, `--font-weight-semibold: 600`).
- **Zone Boundaries:** Components in `planner/` must NEVER import `base/scan.css` or cross-import from `studio/` (`scan:boundaries`).
- **Style Token Ratchet:** Verified via `node scripts/general/check-style-tokens.mjs`. Debt baseline is locked at 200 findings across 57 files. New styling violations are strictly forbidden.

---

## 4. Responsive & Mobile Chrome Layering

On viewports `< 768px`, the mobile application shell activates (`site/components/site/MobileAppShell.tsx`).

### Mobile Chrome Invariants
- **Bottom Tab Bar (5 Tabs):**
  - Canonical tabs: `products` (`/products`), `planner` (`/planner`), `quote` (`/contact`), `portfolio` (`/portfolio`), and `account` (`/access`).
  - Height: exactly $64\text{ px}$ plus `env(safe-area-inset-bottom)`.
  - Content Offset: page containers must apply bottom padding (`pb-20` or `--mobile-bar-height`) so interactive buttons (e.g. submit, checkout, zoom) are never concealed behind the navigation bar.
- **Top Header & Drawer:**
  - Sticky header must have explicit `z-index` coordination (`z-header: 40`, `z-drawer: 50`, `z-modal: 60`).
  - Hamburger menu opens full-height mobile drawer with focus lock and scroll freeze on underlying content.
- **Scroll Container Invariant:**
  - Viewport scroll happens inside `.mobile-app-main`, **never** `window`.
  - All GSAP motion animations must use `gsapPageScroller()` (`site/lib/helpers/gsapMotion.ts`) to attach `ScrollTrigger.defaults({ scroller: ".mobile-app-main" })`.

---

## 5. Accessibility (a11y) & Ergonomic Standards

- **Touch Ergonomics:** All clickable items must have `min-h-[44px]` (ideally `min-h-[48px]`) and `min-w-[44px]` touch targets, or utilize pseudo-element hit area expansion (`after:absolute after:-inset-2`).
- **Color Contrast Ratios:**
  - Normal text ($< 18\text{ pt}$ or $< 14\text{ pt}$ bold): $\ge 4.5:1$.
  - Large text ($\ge 18\text{ pt}$ or $\ge 14\text{ pt}$ bold): $\ge 3.0:1$.
  - Graphical UI components & state borders: $\ge 3.0:1$.
- **Keyboard Navigation & Focus Management:**
  - Interactive elements must show a distinct, high-contrast focus ring (`focus-visible:ring-2 focus-visible:ring-brand-primary`).
  - Tab order must follow logical visual reading rhythm.
  - Modals, drawers, and popovers must trap focus and close on `Escape`.
- **Form Controls & Inputs:**
  - Every `<input>`, `<select>`, and `<textarea>` must have an associated `<label>` (explicit `htmlFor` or wrapping label).
  - Validation states must announce errors via `aria-invalid="true"` and `aria-describedby="error-id"`.

---

## 6. Iconography, Media & Catalog Asset Contracts

- **Iconography Standard:**
  - Strictly `@phosphor-icons/react`.
  - Icon size classes must be standardized: `size-4` (16px), `size-5` (20px), `size-6` (24px).
  - Decorative icons must have `aria-hidden="true"`. Standalone icon buttons must have an `aria-label`.
- **Plan Symbol PNG Contract (`site/lib/catalog/planSymbolPngContract.ts`):**
  - Raster scale: locked at exactly **2.0 px/mm** (`PLAN_SYMBOL_PX_PER_MM = 2`).
  - Padding: locked at exactly **40 mm** padding per side (`PLAN_SYMBOL_PAD_MM = 40`), yielding 80px raster pad per side.
  - Format: strictly `image/png` with valid SHA-256 checksum hex.
- **Image Optimization:**
  - Marketing assets must load from Cloudflare R2 WebP storage with the Next.js `unoptimized` flag.
  - Explicit `width` and `height` or aspect-ratio boxes (`aspect-[16/9]`, `aspect-square`) to prevent Cumulative Layout Shift (CLS = 0).

---

## 7. Internationalization (i18n) & Typography

- **Zero Hardcoded Strings:**
  - All text must consume `useTranslations(namespace)`.
  - Both `site/i18n/messages/en.json` and `site/i18n/messages/hi.json` must maintain 100% key and placeholder parity (`pnpm run check:i18n:parity`).
- **Non-Latin Typography Fallbacks:**
  - Devanagari text must render legibly without clipping ascenders or descenders (`line-height` safety margin $\ge 1.4$).
  - Font families must include standard Indian system fallbacks (`system-ui`, `sans-serif`).

---

## 8. Verification & Audit Runbook

```powershell
# 1. Verify style tokens remain within baseline cap
node scripts/general/check-style-tokens.mjs

# 2. Verify site UI contracts and route integrity
node scripts/check-site-ui-contract.mjs
node scripts/check-homepage-dialect.mjs

# 3. Verify 100% key parity for all added translation strings
node scripts/check-i18n-key-parity.mjs

# 4. Verify TypeScript builds without errors
pnpm run check:layout
```
