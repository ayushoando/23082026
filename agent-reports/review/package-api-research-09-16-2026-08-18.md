# Package / API facts for plans 09–16

> **Historical (2026-08-22):** Numbered plan files cited below are retired. Active plan: [`plans/PLAN.md`](../../plans/PLAN.md).

Date: 2026-08-18 · Method: installed `package.json` + `node_modules/<pkg>/package.json` first, then official docs / GitHub changelogs / npm, then Reddit as labeled community signal. No plan checkboxes ticked. No product or `plans/*.md` edits.

Plans in scope: `09-mobile-marketing` … `16-desktop-detail`. Adjacent pin (not edited): `plans/08-mobile-audit.md` already names this research file family.

## 1. Installed versions

| Package | `package.json` | `node_modules/…/package.json` | Upstream note |
|---|---|---|---|
| `next` | `16.3.1` | `16.3.1` | Docs at `node_modules/next/dist/docs/`; proxy convention is current |
| `react` / `react-dom` | `19.2.8` | `19.2.8` | — |
| `@playwright/test` + `playwright` | `^1.62.1` | `1.62.1` | Device registry + `page.setViewportSize` |
| `happy-dom` | `^20.11.1` | `20.11.2` | Vitest DOM lane — not a layout engine |
| `vitest` | `^4.1.10` | `4.1.10` | Two lanes (`pnpm run test`) |
| `tailwindcss` + `@tailwindcss/postcss` | `^4.3.3` | `4.3.3` | v4.3 docs: `theme(--breakpoint-*)` in media queries |
| `fabric` | `7.4.0` | `7.4.0` | Pinned; changelog `## [7.4.0]` is the installed tag |
| `dockview-react` | `7.0.4` | `7.0.4` | npm latest fetched 2026-08-18 is **8.1.0** — stay on 7 unless a plan upgrades |
| `react-aria-components` | `1.20.0` | `1.20.0` | GitHub tag `react-aria-components@1.20.0` (2026-07-31) |
| `zustand` | `5.0.15` | `5.0.15` | Planner/Studio stores |
| `@axe-core/playwright` | `^4.13.0` | (dev) | a11y lane, not tap-size |

Repo tokens (not invented breakpoints): `--breakpoint-sm: 640px`, `--breakpoint-md: 768px`, `--breakpoint-lg: 1024px`, `--breakpoint-xl: 1280px`, `--breakpoint-2xl: 107.5rem` in `site/focss/base/tokens/layout.css`. Tap floor `--control-height-sm` / `--touch-target-min: 2.75rem` (44px at 16px root).

## 2. Cross-cutting APIs (cite these, not folklore)

### Playwright 1.62 — viewports

Official: [Emulation](https://playwright.dev/docs/emulation) + [`locator.boundingBox()`](https://playwright.dev/docs/api/class-locator#locator-bounding-box).

- Project default here is `…devices["Desktop Chrome"]` (`config/build/playwright.config.ts`). Device presets include `userAgent`, `viewport`, `hasTouch`, `isMobile`.
- Override size with `page.setViewportSize({ width, height })` or `test.use({ viewport })`. Docs: put `viewport` **after** spreading `devices`, or the device viewport wins.
- `setViewportSize` does **not** add touch / iOS UA / `isMobile`. Phone CSS that keys off those will not match a desktop Chromium + size-only override.
- `locator.boundingBox()` → `{ x, y, width, height }` in CSS px relative to the main-frame viewport, or `null` if not visible. `x`/`y` can be negative after scroll. This is the API for FAB on-canvas, tap floors, and DB1 canvas-share.
- 1.62 adds `signal` (AbortSignal) and `scroll: "none"` on click/check. Use `scroll: "none"` when asserting a control is already reachable (plan 11 tap / FAB).
- Repo phone contract is **390×844** (labeled “iPhone 14” in `tests/e2e/site-navigation-screenshots.spec.ts`). Official emulation page examples `devices['iPhone 13']`, not 14 — do not invent a device name; set size explicitly.

### WCAG 2.2 tap size — cite both

| Bar | Level | Size | Authority |
|---|---|---|---|
| SC **2.5.8** Target Size (Minimum) | **AA** | **24×24 CSS px** (or spacing exception) | https://www.w3.org/TR/WCAG22/#target-size-minimum · Understanding: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html |
| SC **2.5.5** Target Size (Enhanced) | **AAA** | **44×44 CSS px** | https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html |

Repo bar is 44×44 (`docs/governance/benchmarks.md` §1; `mobile-tap-targets.css`; planner phone e2e). That **exceeds AA** (meets AAA 2.5.5). 2.5.8 allows undersized targets with a 24px-diameter spacing circle, plus **inline** / **equivalent** / **user-agent** / **essential** exceptions. Plan 11’s `data-tap-exempt` for prose links matches the 2.5.8 **inline** exception — keep that exemption, do not require 44×44 on in-sentence links.

Technique for the 44 bar: [C44](https://www.w3.org/WAI/WCAG22/Techniques/css/C44) (`min-height` / `min-width`). Plan 11 already says min-height + padding, not font growth.

### CSS `env(safe-area-inset-*)`

- Spec: [CSS Environment Variables L1](https://www.w3.org/TR/css-env-1) §2.1 — `safe-area-inset-top|right|bottom|left` are lengths; **0 on rectangular displays**.
- MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env — names are case-sensitive; `env(name, fallback)`.
- Non-zero insets need `viewport-fit=cover`. Repo sets `viewportFit: "cover"` in `site/lib/siteViewport.ts` (Next `Viewport` export). Next 16.3.1 `generateViewport` page documents `width` / `initialScale` / `themeColor` but **does not list `viewportFit`** — local type + MDN remain the pin.
- Playwright Chromium + `setViewportSize(390,844)` typically reports **0** insets (rectangular viewport). FAB/cookie `calc(… + env(safe-area-inset-bottom, 0px))` will not move in that harness. Do not treat a green 390×844 box test as iOS-notch proof.

### Tailwind v4 `theme()`

Official: [Upgrade guide — theme()](https://tailwindcss.com/docs/upgrade-guide#using-the-theme-function) and [Responsive design](https://tailwindcss.com/docs/responsive-design) (v4.3).

- In custom CSS **media queries**, use `theme(--breakpoint-md)` (CSS-variable name), **not** deprecated `theme(screens.md)`.
- Elsewhere prefer `var(--breakpoint-md)`.
- Defaults: `sm` 40rem / 640px, `md` 48rem / 768px, `lg` 64rem / 1024px, `xl` 80rem / 1280px. `max-md` = `width < 48rem`.
- Docs: keep breakpoint units consistent (defaults are `rem`). This repo overrides `--breakpoint-*: 640px/768px/…` in px — do not add a rem-only sibling cut.
- **768×1024 is at `md`, not below it.** `@media (width < theme(--breakpoint-md))` and `max-width: 639.98px` do **not** apply at 768. Plan 09 Task 4’s 768 loop is a tablet width; phone-only FOCSS will look “already desktop.”

### Fabric 7.4.0

Changelog: https://github.com/fabricjs/fabric.js/blob/master/CHANGELOG.md · homepage http://fabricjs.com/

- **v7.0.0 breaking:** `originX`/`originY` deprecated, default **center/center**; `toJSON()` takes no extra props (use `toObject(extraProps)`); min Node 20; multi-touch via westures; Next.js node-export restriction removed.
- **v7.4.0 (installed):** viewport rotation in `getZoom` / dimensions / control coords (#10977); SVG export sanitizes unsafe CSS (**CVE-2026-44311**).
- Local already v7-safe: `site/lib/Studio/studioFabricSerialize.ts` — `toObject([...propertiesToInclude])`, comment “`toJSON()` takes no properties.”
- Types in use: `Canvas`, `FabricObject`, `ModifiedEvent`, `TPointerEvent`, `TPointerEventInfo` from `"fabric"`.
- DB1 measurement is **DOM** `boundingBox` of the canvas element ÷ shell, not `canvas.getZoom()` / `getWidth()`.

### dockview-react 7.0.4

- Installed API (local `PlannerDockShell.tsx` / `StudioDockShell.tsx`): `DockviewReact`, `themeAbyss`, `themeLight`, `onReady`, `components`, `theme`, `disableFloatingGroups`, `floatingGroupBounds`, `singleTabMode`, `rightHeaderActionsComponent`. Stylesheet: `dockview-react/dist/styles/dockview.css`.
- npm readme (current package, still documents the same component): `onReady={(event) => event.api.addPanel({ id, component })}`. Local close path: `api.getPanel(id)?.api?.close()`.
- Comment in Planner shell: **v7 defaults to `themeAbyss` if `theme` omitted** — always pass `themeLight` for marketing-adjacent desktop.
- npm latest 8.1.0 (2026-08). Do not import v8-only APIs on 7.0.4. Keywords include `touch` / `mobile` — phone collapse is **our** `matchMedia("(max-width: 639px)")`, not a dockview breakpoint.

### React Aria 1.20.0

Release: https://github.com/adobe/react-spectrum/releases/tag/react-aria-components%401.20.0 · notes https://react-aria.adobe.com/releases/v1-20-0

New: `PreviewTrigger`, `TokenField` (alpha), `MenuTrigger trigger="contextMenu"`, interactive cells in Table. **No change to matchMedia or 639px.** Assistant / chrome stay on existing RAC + `window.matchMedia("(max-width: 639px)")` (`UnifiedAssistant.tsx:509`).

### Next 16.3.1 — scroll + proxy

- **Scroll:** v16 no longer forces `scroll-behavior: auto` during SPA nav. To restore the old snap-to-top, set `data-scroll-behavior="smooth"` on `<html>` (`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` §Scroll Behavior Override). Root layout uses `className="… scroll-smooth"` **without** that attribute — marketing e2e may see smooth scroll-to-top. Add the attribute only if tests need instant snap; do not invent a desktop-only scroll CSS tree.
- **Proxy:** `middleware` → `proxy` (v16.0.0). File `site/proxy.ts`, named export `proxy`. Official: https://nextjs.org/docs/app/api-reference/file-conventions/proxy (docs version 16.3.1). Defaults to **Node** runtime. Already adopted; plans 09–16 do not re-migrate.
- Admin/desktop: `DEV_AUTH_BYPASS=1` is honored only when `NODE_ENV !== "production"` (`site/lib/auth/devAuthBypass.ts`). Production always false even if the flag is set.

### happy-dom 20.11.x

JavaScript DOM, not a browser. Plan 09 already: class/DOM contracts, **never pixel math** in JS tests. Overflow, tap boxes, canvas-share, FAB clip → Playwright `boundingBox` / `evaluate`.

## 3. Per-plan revision bullets

Evidence under `results/` must be **`.txt` (or PNG)**, never hand-written Markdown reports (`AGENTS.md` §3 / trap 6). Plan 12 already says `defects.txt`; several later plans still say `defects.md`.

### 09 — mobile-marketing (FOCSS home/catalog/PDP, happy-dom, 390×844)

- Consume `results/mobile-audit/defects.txt` (not `.md`).
- APIs: happy-dom class assertions; Playwright `setViewportSize({ width: 390, height: 844 })` and `{ width: 768, height: 1024 }`; overflow via `document.documentElement.scrollWidth - clientWidth`.
- FOCSS: `home-mobile.css`, `catalog-mobile.css`, `shell-pdp.css`. Cuts already in file: `theme(--breakpoint-md)` and `639.98px`. Do not add 390 as a new `@media` cut unless a defect row names it.
- At **768**, `md` utilities apply. Horizontal-scroll failures at 768 are tablet/desktop-adjacent, not `home-mobile.css` (`width < theme(--breakpoint-md)`).
- `scroll-smooth` on `<html>` (Next 16 does not override) — wait for `networkidle` / layout, not just `domcontentloaded`, if screenshots smear.

### 10 — mobile-apps (Planner/Studio, fabric 7.4.0, dockview-react 7.0.4, zustand 5, 639px, DB1 ≥60%)

- `matchMedia("(max-width: 639px)")` in `Planner.tsx:182` / `Studio.tsx:216` is **one CSS px below `--breakpoint-sm: 640px`**. Keep that; do not change to 768 or `theme(--breakpoint-md)`.
- Fabric: serialize with `toObject`, not `toJSON`. 7.4.0 `getZoom` accounts for viewport rotation — if a zoom HUD looks “wrong” after rotate, check #10977 before rewriting CSS.
- Dockview: `DockviewReact` + explicit `theme={themeLight|themeAbyss}`; `floatingGroupBounds.minimumWidthWithinViewport: 48` is already below the 44 tap floor — do not shrink further.
- DB1: `locator.boundingBox()` of canvas vs shell; record `results/mobile-fixes/canvas-share.txt` (four numbers, each ≥ 0.60). Bar is derived (`docs/governance/benchmarks.md` DB1), not a WCAG number.
- `pnpm run scan:boundaries` on every fork commit. Mirror fixes by hand.
- Consume `surface=planner-app|studio-app` from `defects.txt`.

### 11 — mobile-chrome (FAB vars, 44×44, safe-area, cookie bar)

- Cite **both** 2.5.8 (24 AA) and 2.5.5 (44 AAA). Implement 44 via `--control-height-sm` / `min-width/min-height: 44px`.
- Public interface: `--site-fab-*` and `--cookie-consent-bar-offset` in `shell-site-fabs.css`. Keep `env(safe-area-inset-*, 0px)` in the `calc()`.
- SITE-S08 is **390×844 only** (`shell-site-fabs.css:188-190`, `@media (max-width: 639.98px)`). Do not port it to desktop (plan 15 already says this).
- FAB e2e: `locator('.site-fab-anchor:visible').boundingBox()` vs `{0,0,390,844}`. Chromium will not exercise notch insets.
- Cookie bar: `CookieConsentBar.tsx` already `pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]`.
- Close-out: update `results/mobile-audit/defects.txt` statuses, not `.md`.

### 12 — desktop-audit (1440×900 + 1920×1080, charter R25)

- Playwright APIs same as §2. Charter widths are **not** Tailwind breakpoints (xl = 1280; repo 2xl = 107.5rem).
- **Script gap:** `scripts/responsive-audit.mjs` `VIEWPORTS` is only `mobile 390×844` and `desktop 1920×1080`. Header says the same. **1440×900 is not in this script** (it is in `scripts/launch-smoke.mjs` and `planner-phone-chrome.spec.ts` DESKTOP). Task 1 must extend the script or add a second Playwright loop — running the script as-is will not produce 1440 evidence.
- Defect list: `results/desktop-audit/defects.txt` (already specified). Do not create `defects.md`.
- Existing code cuts to reuse: `900px` toolbar labels, `75rem` / `1280px` layouts — do not invent 1440 as a CSS breakpoint.

### 13 — desktop-marketing (same FOCSS as 09, desktop widths)

- Consume `results/desktop-audit/defects.txt`. Desktop = `width >= theme(--breakpoint-md)` (768+). 1440 and 1920 both sit above `xl` (1280).
- Task 4 “>1440px max-width violations vs the layout token” is underspecified: tokens are `--container-max: 105rem` (1680px) and `--container-home-max: 82.5rem` (1320px), not 1440. Assert against the **token**, not a new 1440 cap.
- Same happy-dom + Playwright `setViewportSize` pair as 09.

### 14 — desktop-apps (Planner/Studio desktop, scan:boundaries)

- FOCSS lives at `site/focss/planner/` and `site/focss/studio/` — **not** `site/focss/site/Planner/` (that path does not exist). Marketing planner landing CSS is a different tree (`site/focss/site/components/planner/`).
- No-op / DB1 evidence: `results/desktop-fixes/planner-noop.txt` and `db1-canvas-share.txt` (not `.md`).
- Same Fabric 7.4.0 / dockview 7.0.4 APIs as plan 10. Desktop should **not** collapse on 639px; if panels collapse at 1440, the matchMedia contract is broken.
- `pnpm run scan:boundaries` every commit.

### 15 — desktop-chrome (header/footer/FAB; SITE-S08 mobile-only)

- SITE-S08 stays in plan 11. Desktop FAB uses the unscoped `--site-fab-*` values (not the `639.98px` block).
- No-op: `results/desktop-fixes/chrome-header-noop.txt`.
- `scroll-smooth` / Next 16 scroll override is more visible on desktop marketing chrome than on the workspace (workspace is DB5: no page-level shell scroll).

### 16 — desktop-detail (admin FOCSS, DEV_AUTH_BYPASS, close-out)

- Admin CSS: `site/focss/admin/` (`entry.css`, `components/*`).
- Run audits with `DEV_AUTH_BYPASS=1` on a **non-production** `pnpm dev`. `isDevAuthBypassEnabled()` is false when `NODE_ENV === "production"`.
- Close-out: `results/desktop-fixes/summary.txt` (already `.txt`). No-op: `admin-noop.txt`.
- Consume leftover rows from `defects.txt`, not `defects.md`.

## 4. Stale claims

| Claim in plans | Truth | Evidence |
|---|---|---|
| `results/mobile-audit/defects.md` / `results/desktop-audit/defects.md` | Defect inventories are `.txt` | `plans/08-mobile-audit.md`, `plans/12-desktop-audit.md`, `AGENTS.md` §3 |
| Plan 14 `site/focss/site/Planner/` + `site/focss/site/Studio/` | Actual trees: `site/focss/planner/`, `site/focss/studio/` | disk listing |
| Plan 14/15/16 `*-noop.md`, `db1-canvas-share.md` | `results/` reports are `.txt` | `AGENTS.md` trap 6 |
| Plan 12 “read desktop viewport flags” implying 1440 is already in the audit script | Script has 390 + 1920 only | `scripts/responsive-audit.mjs:119-123` |
| Plan 09 “`theme(--breakpoint-md)` / `width < 639.98px`” as one pattern | Two different cuts (768 vs ~640). Apps use 639px matchMedia | `layout.css`, `Planner.tsx:182`, `shell-site-fabs.css:190` |
| Treating 768×1024 as a phone FOCSS viewport | 768 is Tailwind `md` (styles at-and-above apply) | https://tailwindcss.com/docs/responsive-design |
| WCAG AA requires 44×44 | AA 2.5.8 is **24×24**; 44 is AAA 2.5.5 / this repo’s bar | W3C Understanding 2.5.8 + 2.5.5; `benchmarks.md` |
| Plan 13 1440px max-width as the layout token | Tokens are 105rem / 82.5rem | `layout.css:44-46` |
| Inventing 1440 or 1920 as CSS breakpoints | Charter R25 viewports only; CSS cuts are 640 / 768 / 1024 / 1280 / 107.5rem | `layout.css:74-78` |
| Fabric `canvas.toJSON(extraProps)` | v6+ `toJSON()` takes no properties | fabric CHANGELOG v6/v7; local `studioFabricSerialize.ts` |
| Plan 08 `results/mobile-audit/README.md` (adjacent) | Evidence index should be `.txt` | same `results/` rule |

## 5. Reddit appendix (community signal only — not authority)

| Signal | Thread |
|---|---|
| iOS 26 full-viewport height; authors mixing `100dvh` with `env(safe-area-inset-bottom)` and still missing the home indicator | https://www.reddit.com/r/css/comments/1nk3uzp/full_viewport_height_on_ios_26/ |
| Fabric.js object model vs React state — keep canvas mutations off the React render path | https://www.reddit.com/r/reactjs/comments/kz12f9/having_trouble_updating_state_and_showing_changes/ |
| Canvas-library comparison naming Fabric for selection/resize (old; still the same performance warning: too many objects / full re-renders) | https://www.reddit.com/r/javascript/comments/pdib99/askjs_what_is_the_best_canvas_library_to_make_an/ |
| Docking / split-panel library shopping (pre-dockview-v7; “use a real dock manager, don’t hand-roll”) | https://www.reddit.com/r/learnprogramming/comments/v7w5dh/what_is_a_good_javascript_library_that_has/ |

No high-signal 2026 Playwright-390 flake thread was retrieved this pass. Local risk is already specified: `setViewportSize` without `devices[…]` / `isMobile` / `hasTouch`, plus Playwright’s own warning that `locator.all()` is flaky on dynamic lists.

## 6. Sources

- Installed manifests: `E:\oando1408\package.json`; `node_modules/{next,playwright,@playwright/test,fabric,dockview-react,react-aria-components,zustand,tailwindcss,happy-dom,react}/package.json`
- Local tokens / APIs: `site/focss/base/tokens/layout.css`; `site/lib/siteViewport.ts`; `site/lib/auth/devAuthBypass.ts`; `site/lib/Studio/studioFabricSerialize.ts`; `site/components/Planner/{Planner.tsx,PlannerDockShell.tsx}`; `site/components/Studio/Studio.tsx`; `site/focss/site/components/chrome/shell-site-fabs.css`; `site/focss/site/components/shared/mobile-tap-targets.css`; `site/app/layout.tsx`; `config/build/playwright.config.ts`; `scripts/responsive-audit.mjs`; `docs/governance/benchmarks.md`; `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`
- Playwright: https://playwright.dev/docs/emulation · https://playwright.dev/docs/api/class-locator#locator-bounding-box
- WCAG: https://www.w3.org/TR/WCAG22/#target-size-minimum · https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html · https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html
- CSS env: https://www.w3.org/TR/css-env-1 · https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env
- Tailwind v4.3: https://tailwindcss.com/docs/responsive-design · https://tailwindcss.com/docs/upgrade-guide#using-the-theme-function · https://tailwindcss.com/docs/theme
- Fabric: https://github.com/fabricjs/fabric.js/blob/master/CHANGELOG.md (7.4.0 / 7.0.0)
- dockview-react: https://www.npmjs.com/package/dockview-react · https://dockview.dev
- React Aria 1.20.0: https://github.com/adobe/react-spectrum/releases/tag/react-aria-components%401.20.0 · https://react-aria.adobe.com/releases/v1-20-0
- Next 16.3.1: https://nextjs.org/docs/app/api-reference/file-conventions/proxy · https://nextjs.org/docs/app/api-reference/functions/generate-viewport
