# Subsystem Module 1: UI Alignment, FOCSS Tokens & Mobile Chrome (<768px)

**Document:** `plans/05092026/01-ui-focss-and-mobile-chrome.md`  
**Governing Standard:** `AGENTS.md` (Authority floor: User instruction > live code/fresh command output > `AGENTS.md` > `Agents/` > `docs/`)  
**Scope:** FOCSS Semantic Architecture, Tailwind v4 Engine, Style Token Ratchet, Phosphor Icons, GSAP Motion, Mobile Chrome Stacking (<768px).  
**Constraint:** **Alignment & Polish Only — Strictly No Redesign**.

---

## 1. FOCSS Architecture & Tailwind v4 Isolation

FOCSS (`site/focss/`) is a plain CSS architectural layer built atop Tailwind CSS v4 (`@tailwindcss/postcss` 4.3.3). It is deliberately **not** an npm package. It enforces strict boundary isolation across 4 zones:

```
site/focss/
  ├── base/             # Shared tokens, typography, document baseline
  │     ├── tokens/     # palette.css, semantic.css, layout.css
  │     ├── type/       # typography.css, type.css (typ-* utilities)
  │     ├── animations.css  # @keyframes and motion utilities
  │     ├── containers.css  # Container query definitions
  │     ├── document.css    # <html>/<body> base resets and vars
  │     ├── index.css       # Consolidated foundation (imports above)
  │     ├── root.css        # :root custom-property declarations
  │     ├── runtime.css     # @import "tw-animate-css"
  │     └── scan.css        # @import "tailwindcss" scanner
  ├── site/             # Public marketing zone entrypoint (site/entry.css)
  ├── admin/            # Admin portal zone entrypoint (admin/entry.css)
  ├── planner/          # Planner workspace self-contained fork (planner/entry.css)
  └── studio/           # Furniture Studio workspace fork (studio/entry.css)
```

### 1.1 Zone Entry Import Rules (`site/focss/README.md`)
- **Site (`site/entry.css`):** Imports `base/scan.css` → runtime → document → index → marketing component sheets.
- **Admin (`admin/entry.css`):** Scopes Admin overrides strictly to `.shell-admin-layout`. Prohibited from overriding document-level body tokens.
- **Planner (`planner/entry.css`):** Self-contained fork. Imports its own `@import "tailwindcss"`, flat palette, and flat `planner/base/{palette,semantic,layout,document}.css`. Strictly prohibited from importing `base/scan.css`.
- **Studio (`studio/entry.css`):** Imports product base + `studio/base/index.css` + workspace chrome.
- **Cross-Zone Quarantine:** Planner must never import Studio (or vice versa); Site must never import Admin. `features/product/` is completely retired.

### 1.2 Automated FOCSS Verification (`scripts/AsNeeded/verify-focss.mjs`)
- Validates 4 distinct scopes: `structure`, `imports`, `fences`, `modules`.
- Enforces zero forbidden paths (`entries`, `zones`, `chrome`, `modules`, `tech-stack`, `features/product/`).
- Maximum stylesheet line limit: 800 lines.
- Evaluates complete acyclic dependency graph across all 151 CSS files.

---

## 2. Style Token Ratchet Governance (`scripts/general/check-style-tokens.mjs`)

Governance rules C3, C4, C5, C6, C7, and C10 prohibit styling drift and arbitrary utility bypasses:
- **Baseline File:** `config/quality/style-token-baseline.json`.
- **Current Ratchet Ceiling:** **200 findings** across 57 files.
- **Inspection Targets:** Evaluates only styling positions (`className="..."`, `className={...}`, `style={{...}}`, and non-token CSS declarations). Whole-file greps are strictly prohibited.
- **Specific Rules Enforced:**
  - `C3_raw_hex`: `#000000` or raw hex in classes/styles/CSS (must use `var(--color-*)`).
  - `C4_px_literal`: `p-[18px]`, `w-[320px]`, or raw `px` in inline styles.
  - `C5_arbitrary`: Arbitrary bracket utilities like `rounded-[var(--radius-card)]`, `top-[64px]`.
- **Ratchet Invariant:** The gate fails only when finding count **rises** above baseline (200). Remediation permanently lowers the recorded baseline.

### 2.1 Targeted Polish & Alignment Remediations
1. `site/app/(site)/tools/page.tsx`: Standardize card radius utility from arbitrary brackets to semantic `rounded-xl`.
2. `site/components/ui/ViewportControls.tsx`: Standardize button spacing and padding using semantic 4px scale.
3. `site/components/site/MobileNavDrawer.tsx`: Replace raw px offsets with semantic layout tokens.

---

## 3. Phosphor Icon Standard

- **Unified Icon Component:** All icon renderings across marketing, tools, planner, and admin surfaces must route through `site/components/site/PhIcon.tsx`.
- **Mapping Registry:** Governed by `site/lib/icons/phIconMap.ts`.
- **Forbidden Invariants:**
  - Inline `<svg>` declarations in TSX files are strictly forbidden (checked by `scripts/general/check-product-icons.mjs`).
  - Direct Lucide icon imports (`lucide-react`) are strictly forbidden; Phosphor icons (`@phosphor-icons/react`) are the sole icon library.

---

## 4. GSAP Motion & Viewport Coordination (`site/lib/helpers/gsapMotion.ts`)

- **The Phone Marketing Shell Trap:**
  On mobile (<768px), the viewport scroller is `.mobile-app-main`, **not** the browser `window`. Using `window` as the ScrollTrigger scroller causes `from()` animations to freeze at `opacity: 0` indefinitely.
- **Dynamic Scroller Resolver:**
  ```typescript
  export function gsapPageScroller(from?: Element | null): HTMLElement | undefined {
    if (typeof document === "undefined") return undefined;
    const root = from instanceof Element ? from : document.body;
    const main = root.closest?.(".mobile-app-main") ?? document.querySelector(".mobile-app-main");
    if (!(main instanceof HTMLElement)) return undefined;
    const overflowY = getComputedStyle(main).overflowY;
    if (overflowY !== "auto" && overflowY !== "scroll") return undefined;
    return main;
  }
  ```
- **Global Defaults:** `ScrollTrigger.defaults({ scroller: scroller ?? window })`.
- **Accessibility:** `gsapReducedMotion()` honors `prefers-reduced-motion: reduce`.
- **Standard Motion Tokens:** `GSAP_EASE_OUT = "power3.out"`, `GSAP_EASE_IN_OUT = "power2.inOut"`, `GSAP_REVEAL = { y: 16, opacity: 1, duration: 0.7, stagger: 0.07 }`.

---

## 5. Mobile Chrome (<768px) Viewport Ergonomics

Mobile viewports must cleanly coordinate 5 interactive floating layers without collision:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Bar: [Logo]                                    [Search] [Drawer ☰] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                          Page Content Area                             │
│                         (.mobile-app-main)                             │
│                                                                        │
│                                                           ┌──────────┐ │
│                                                           │   FAB    │ │
│                                                           └──────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│ Cookie Consent Bar (z-index 40, sits exactly above bottom nav)         │
├────────────────────────────────────────────────────────────────────────┤
│ Bottom Nav (5 Tabs): [Products] [Planner] [Quote] [Portfolio] [Sign in] │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Layer Rules & Target Files
1. **Top Bar Simplification (`site/components/site/MobileAppShell.tsx`):**
   - Top bar contains exactly 3 elements: Brand Logo, search trigger button, and hamburger drawer trigger.
   - Redundant primary CTAs (e.g. "Get Quote") are eliminated from the top bar.
2. **Drawer Menu Scope:**
   - Slide-over drawer menu is restricted strictly to the 6 designated overflow destinations: `About`, `Clients`, `Trusted By`, `FAQ`, `Planning`, `Downloads`.
3. **Dynamic Offset Rules (`site/focss/site/components/chrome/app-shell.css`):**
    - Floating Action Button (FAB) bottom offset: `--site-fab-bottom: calc(var(--mobile-tab-bar-height) + 0.75rem);`.
    - Cookie consent bar position: `bottom: calc(var(--mobile-tab-bar-height) + 1px) !important;` at `z-index: 40`.
    - Do not hide either FAB merely because the cookie bar is present. Preserve visible FABs above the tab bar with safe-area padding; allow a narrowly scoped hide only when the open consent bar creates a demonstrated collision with no safe placement.
4. **Viewport Acceptance:** At 375px, verify the top bar has no `Get Quote`, bottom tabs retain `Products`, `Planner`, `Quote`, `Portfolio`, and `Sign in`, the drawer has only the six overflow links, and the cookie bar is above the tab bar. Compare the desktop header before accepting the mobile change.

---

## 6. Multi-Viewport Layout Contract (1920px, 1440px, 1080px, 768px, 390px)

Derived from the empirical audit documented in `docs/audit 05092026/homepage-and-auth-audit.md`:

### 6.1 Viewport Breakpoints & Invariants
1. **1920px (Desktop Ultrawide / 2XL):**
   - Container max width: `--container-home-max: 82.5rem` (`1320px`) leaves ~300px side gutters.
   - Title line-clamp relaxation: Relax `max-width: 11ch` on `.home-hero-title-homepage` in `site/focss/site/components/homepage/home-type.css` to allow the headline to span naturally across wide viewports rather than forcing an awkward 3-line word wrap.
2. **1440px (Standard Desktop Baseline):**
   - Hero Action CTAs restoration: In `site/components/home/HomepageHero.tsx`, restore the primary/secondary action buttons container (`.home-actions` with "Explore Catalog" and "Launch Planner").
3. **1080px (Compact Desktop / FHD):**
   - Value-props grid threshold: In `site/components/home/WhyChooseUs.tsx:48`, update `xl:grid-cols-4` to `lg:grid-cols-4` so 4 cards maintain a 4-column row between 1024px and 1280px instead of collapsing into 2 wide horizontal slabs.
4. **768px (Tablet Boundary Fence):**
   - Coordinate `app-shell.css` mobile chrome cutoff (`display: none` at `>=768px`) with desktop `SiteHeader` link density to prevent desktop navigation crowding between 768px and 1024px.
5. **390px (Mobile Standard):**
   - Cookie consent banner must stack cleanly above the 56px bottom tab bar (`--mobile-nav-height`) without permanently occluding >15% of the viewport.
## Test reconciliation update (2026-09-05)

Verify marketing selectors against current components before CSS changes; use measured 375px/768px header, drawer, cookie and FAB assertions plus desktop comparison. Separate capture-only jobs from regression tests and review replacement baselines for the six absent site screenshots.

Acceptance: record current path, owner, destination/disposition, preserved assertions, affected commands, and evidence. A filename or age alone is insufficient grounds for retirement. Runtime validation remains pending; this update changes planning documents only.

