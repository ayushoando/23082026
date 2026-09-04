# FOCSS Design System (`site/focss/`) Subsystem Audit

**Date:** 2026-09-04  
**Target:** [`site/focss/`](file:///d:/23082026/site/focss/)  
**Design Architecture:** Token-Driven Modular Vanilla CSS (`@focss/*`)  
**Footprint:** 151 CSS Files across 5 Layered Domains

---

## Executive Summary

The [`site/focss/`](file:///d:/23082026/site/focss/) directory contains **FOCSS** (Functional Object-Oriented Cascading Style Sheets), the bespoke design system powering Oando. It replaces utility frameworks (like Tailwind CSS) on the primary website with strict, high-performance CSS custom properties (tokens), ensuring predictable cascades, zero runtime JavaScript CSS overhead, and full WCAG color contrast compliance.

```
site/focss/ Subsystem Architecture:
├── base/                    # Core Design Tokens & Resets (Global Layer)
│   ├── tokens/              # Primitives: colors.css, spacing.css, radii.css, elevation.css
│   ├── type/                # Typography scale and font-face bindings (Inter/Outfit)
│   ├── document.css         # Normalize, box-sizing, and root HTML variables
│   └── animations.css       # Keyframes, micro-interactions, and motion timings
├── site/                    # Marketing & Catalog Component Classes
│   ├── components/          # Buttons, modals, product cards, compare docks, drawers
│   └── layout/              # Header, footer, container queries, and navigation rails
├── admin/                   # Admin Operations Theme
│   └── admin.css            # Data tables, KPI metric tiles, and CRM drawer styling
├── planner/                 # 2D/3D Floor Planner Theme
│   └── planner.css          # Dockview layout overrides, canvas crosshairs, toolbars
└── studio/                  # Furniture Customizer Theme
    └── studio.css           # Material swatch grids, canvas transform handles, 3D viewport
```

---

## 1. The FOCSS Cascade & Token Rules

### 1.1 The "Zero Raw Hex" Law
Per repository governance (`Agents/07-css.md`), **zero raw `#hex` color literals** are permitted in component or route CSS:
```css
/* ❌ FORBIDDEN: Raw hex literal */
.product-card { background: #ffffff; color: #111827; }

/* ✅ CANONICAL: Semantic CSS Token Variable */
.product-card { 
  background: var(--color-surface-base); 
  color: var(--color-text-strong); 
}
```
All colors must resolve through the semantic palette defined in [`base/tokens/colors.css`](file:///d:/23082026/site/focss/base/tokens/).

### 1.2 Isolated Suite Overrides
While `base/` sets global brand standards, `admin/`, `planner/`, and `studio/` load scoped stylesheet bundles that override variables for dark-mode canvas viewports without affecting the public marketing site.

---

## 2. Verification & CI Guardrails

The integrity of FOCSS is mechanically verified by three automated pipelines:
1. **`pnpm run verify:focss` ([`scripts/AsNeeded/verify-focss.mjs`](file:///d:/23082026/scripts/AsNeeded/verify-focss.mjs)):**  
   Scans all 151 files. Asserts zero circular `@import` statements, zero dead class declarations, and zero untracked tokens. *(Result: PASS, 151/151 files clean)*.
2. **`pnpm run check:style-tokens` ([`scripts/AsNeeded/check-style-tokens.mjs`](file:///d:/23082026/scripts/AsNeeded/check-style-tokens.mjs)):**  
   Ratchet check against [`config/quality/style-token-baseline.json`](file:///d:/23082026/config/quality/style-token-baseline.json). Ensures inline style exceptions across the monorepo never exceed the 201 legacy baseline.
3. **`pnpm run lint:ui:strict`:**  
   Enforces structural cleanliness and CSS naming conventions.
