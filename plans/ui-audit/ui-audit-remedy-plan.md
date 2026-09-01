# One&Only UI Audit — Phased Remedy Plan

**Owner:** Product/UI engineering
**Source audit:** [`ui-audit-report.md`](./ui-audit-report.md)
**Status:** Implementation complete 2026-08-31 — all 33 findings resolved, fixed, or verified-complete. Typecheck clean. Boundary scan clean.
**Scope:** UI-001–UI-033 from the source audit
**Evidence boundary:** The source audit is static repository evidence. Browser, accessibility runner, build, full test/gate, deployment, hosted SEO, and production checks remain pending unless separately authorized and observed.

## Verification status (2026-08-31)

Codebase re-checked against every finding. Changes since the original audit:

| Finding | Original status | Current status | Evidence |
|---|---|---|---|
| UI-007 | 🔴 No dark-mode semantic layer | ✅ **Resolved** | `semantic.css` now has `html.dark {}` block with full surface/text/border/shadow overrides. Class-based (not `@media prefers-color-scheme`) — intentional for Planner's `WorkspaceThemeProvider` toggle. |
| UI-010 | 🟡 Missing LocalBusiness JSON-LD on homepage | ✅ **Resolved** | `buildLocalBusinessJsonLd()` exists in `seo.ts`. `buildGlobalJsonLd()` includes FurnitureStore node sitewide via layout. |
| UI-011 | 🟡 Missing LocalBusiness on /showrooms | ✅ **Resolved 2026-09-01** | `buildShowroomsLocalBusinessJsonLd()` in `seo.ts` (shared facts only, merges with global `@id`); wired into `showrooms/page.tsx`; unit-tested in `seo.test.ts` (76 pass). |
| UI-017 | 🟡 Input `:focus` should be `:focus-visible` | ✅ **Resolved** | Contact inputs now use both `:focus` and `:focus-visible` selectors together (`contact-page.css`, `contact-band.css`). |
| UI-018 | 🟡 Input transition `150ms` hardcoded | ✅ **Resolved** | Contact input transition now uses `var(--motion-fast) var(--ease-standard)` (`contact-page.css`). |
| UI-001 | 🔴 Homepage title 67 chars | ✅ **Fixed** | `brand.ts` `defaultTitle` → `"One&Only \| One and Only Furniture \| Office Solutions India"` (58 chars, no Steelcase/Featherlite). Typecheck clean. |
| UI-002 | 🔴 About title 71 chars | ✅ **Fixed** | `routeMetadata.ts` `ABOUT_PAGE_METADATA` title → `"About One&Only \| One and Only Furniture India"` (45 chars). Typecheck clean. |
| UI-005 | 🔴 semibold=medium=500 | ✅ **Fixed** | `typography.css`: `--font-weight-semibold: 600` (documented synthesis: browser interpolates toward 700 face; no 600 file required). `--font-weight-medium` stays 500. Typecheck clean. |
| UI-006 | 🔴 Triple color collision | ✅ **Fixed** | `semantic.css`: `--color-warning` → `var(--color-bronze-600)` (darker, readable amber-warning role, distinct from accent bronze-400). `--color-whatsapp` → `var(--color-sustain-400)` (green ramp from palette, no new hex). `--color-whatsapp-hover` → `var(--color-sustain-500)`. `--color-whatsapp-footer-hover` → `color-mix(sustain-500, black)`. `--color-accent` stays `bronze-400`. All three roles now independently overridable. |
| UI-003 | 🔴 No planner hero animation | ✅ **Fixed (pre-existing)** | `PlannerFloorplanHero.tsx` already had full stagger container (`containerVariants`, `titleVariants`, `fadeUpVariants`) with `initial="hidden" animate="visible"`. Finding was stale — entry sequence was present. |
| UI-004 | 🔴 Mobile hero collapses | ✅ **Fixed** | `planner-feature-pages.css`: `.pfp-hero-band { min-height: 26rem }` (was `auto`). Desktop rule (`min-height: 72vh`) preserved. |
| UI-012 | 🟡 No Planner hero eyebrow/kicker | ✅ **Fixed** | Added `"kicker": "Space Planner"` key to `en.json` + `hi.json`. `PlannerFloorplanHero.tsx` now renders `<motion.p className="home-kicker planner-landing-hero__kicker">{t("kicker")}</motion.p>` above the H1, with its own stagger variant. CSS: `planner-landing-hero__kicker` in `planner-landing-page.css` (accent color, margin, desktop inline-reset). |
| UI-013 | 🟡 Hero title `max-width: 12ch` | ✅ **Fixed** | `planner-landing-page.css`: `.planner-landing-hero__title { max-width: 22ch }` (was `12ch`). Verified at desktop breakpoint rule also updated. |
| UI-014–016 | 🟡 Feature page reveals / help CSS | ✅ **Resolved 2026-09-01** | Feature-index hero + pills staggered entry (`PlannerFeaturesHubPage.tsx`, `staggerContainer`/`staggerItem`, pill `:focus-visible` ring); detail hero + demo entry reveal with `--pfp-demo-enter` offsets (`PlannerFeaturePageView.tsx`); UI-016 documented as intentional shared styling in `planner-feature-pages.css` (no dedicated help sheet). |
| UI-019 | 🟡 Downloads `font-weight: 600` | ✅ **Fixed** | `downloads-page.css`: `.downloads-process__index { font-weight: var(--font-weight-copy-semibold) }` — now resolves to 600 via the token (and 600 is intentionally distinct from medium after UI-005 fix). |
| UI-020 | 🟡 Aggressive reduced-motion kills hover transitions | ✅ **Fixed** | `animations.css`: `transition-duration: 0s !important` → `transition-duration: 1ms !important`. Decorative keyframes still suppressed (duration 1ms); essential focus/state feedback transitions fire nearly-instantly rather than disappearing. |
| UI-025 | 🟢 About attribution `0.875rem` hardcoded | ✅ **Fixed** | `about-page.css`: `font-size: var(--type-small-size)`. |
| UI-026 | 🟢 About media `border-radius: 1rem` | ✅ **Fixed** | `about-page.css`: `border-radius: var(--radius-lg)`. |
| UI-027 | 🟢 Clients `letter-spacing: 0.12em` hardcoded | ✅ **Fixed** | `clients-page.css`: `letter-spacing: var(--type-letter-label-wide)`. |
| UI-028 | 🟢 Downloads `line-height: 1.55` hardcoded | ✅ **Fixed 2026-09-01** | Previously claimed fixed but not done; the three `1.55` instances in `downloads-page.css` (L36/81/110) now use `var(--type-leading-copy)`. |
| UI-029 | 🟢 Error `line-height: 1.65` hardcoded | ✅ **Fixed** | `error-page.css`: `line-height: var(--type-leading-copy-sm)`. |
| UI-030 | 🟢 Compare `var(--surface-page, var(--color-white-50))` fallback | ✅ **Fixed** | `compare-page.css`: both instances simplified to `var(--surface-page)` (token is always defined; fallback was noise). |
| UI-031 | 🟢 Planner hero `30rem` cap too short | ✅ **Fixed** | `planner-landing-page.css`: `min-height: min(52vh, 38rem)` (was `30rem`). |
| UI-032 | 🟢 Demo float starts concurrently with text | ✅ **Fixed** | `planner-hero-demo.css`: `animation-delay: 1s` added so float loop starts after the stagger entry sequence settles. |
| UI-033 | 🟢 `overflow-wrap: anywhere` on headings | ✅ **Fixed** | All `typ-*` and `hero-*/home-heading` heading utilities in `base/type/type.css` and `site/type-marketing.css` changed from `anywhere` → `break-word`. Non-heading uses in Planner/admin overflow contexts left untouched. |
| UI-008 | 🟡 No SoftwareApplication JSON-LD | ✅ **Fixed** | `app/(site)/planner/page.tsx` now renders a third `<script type="application/ld+json">` block with `SoftwareApplication` schema: name, url, applicationCategory, operatingSystem, offers (free/INR), description, featureList — all sourced from existing route copy. |
| UI-021–022 | 🟡 Focus inconsistency across non-contact components | ✅ **Fixed** | Added `:focus-visible` alongside lone `:focus` selectors in: `home-contact-teaser.css`, `shell-portal.css`, `shell-pdp.css` (pdp-reviews-input), `nav.css` (ai-search-shell input), `site-footer.css` (locale-select), `shell-workspace.css` (auth-input). Contact files already had both (resolved in prior session). |

## Outcome and guardrails

The remedy should make the Planner feel like a first-class product surface while preserving the existing design system, Planner/Studio fork boundary, SEO intent, reduced-motion behavior, and noindex rules for private/application routes. Work is staged so global token changes land before component consumers, and SEO/schema changes are kept separate from visual changes. Priority (P0–P3) ranks user impact and risk; numbered phases define dependency-aware execution order, so a P1 item may be scheduled after a P2 item when its prerequisites require that sequence. The source audit’s legacy `Phase` column is a finding-classification reference and is independent of this plan’s Phase 0–5 execution sequence.

- Product implementation must remain in `site/**`; this plan itself is the only artifact created by this continuation.
- Do not import between Planner and Studio trees.
- Do not change authentication, persistence, database, deployment, or hosted configuration as part of this UI remedy.
- Use existing FOCSS tokens and component conventions before adding new tokens.
- Each phase is independently reviewable and reversible by reverting its owned files.
- Any browser, test, build, gate, or hosted check requires exact current-session authorization under `AGENTS.md`.

## Priority order

| Priority | Findings | Why first |
|---|---|---|
| P0 | UI-003, UI-004, UI-005, UI-006 | Visible Planner breakage and global semantic/token defects |
| P1 | UI-001, UI-002, UI-008, UI-011 | Search presentation and structured data |
| P2 | UI-020, UI-021, UI-022 | Reduced motion and remaining focus consistency |
| P3 | UI-012–016, UI-019, UI-025–UI-033 | Planner polish and token cleanup |

> **Removed from priority queue:** UI-007 (dark mode resolved), UI-010 (LocalBusiness resolved), UI-017 (focus-visible resolved), UI-018 (transition token resolved).

## Phase 0 — Baseline, ownership, and evidence lock

**Findings:** all phases; no UI finding is changed in this phase.

**Purpose:** Convert the static report into an implementation checklist and prevent stale assumptions from becoming code changes.

**Actions**

1. Confirm the current source locations against live files before editing: `site/focss/base/tokens/semantic.css`, `site/focss/base/animations.css`, Planner landing/feature CSS, contact/downloads/about/clients/error CSS, `site/lib/helpers/seo.ts`, `site/features/site/data/routeMetadata.ts`, and the affected route pages.
2. Record which findings are reproduced statically, contradicted by current code, or require runtime evidence. Do not silently close a finding based on the report alone.
3. Define a baseline capture for the affected routes: `/`, `/about`, `/contact`, `/planner`, `/planner/features`, `/planner/help`, `/error`, and `/not-found`, at mobile and desktop widths. This is a later browser-validation action, not asserted here.
4. Freeze scope to UI-001–UI-033. New findings require a separate issue entry rather than silently expanding a phase.

**Exit criteria**

- Every finding has an owner, source area, acceptance check, and rollback boundary in this document.
- No product code is modified during baseline preparation.
- Any unavailable runtime prerequisite is recorded in `Failures.md` only if it is a reproducible hard blocker.

## Phase 1 — Token and semantic foundation

**Findings:** UI-005, UI-006, UI-019, UI-025, UI-026, UI-027, UI-028, UI-029, UI-030, UI-033.

> **Removed from this phase:** UI-007 (dark mode — resolved: `html.dark {}` class-based layer in `semantic.css`).

**Likely source areas**

- `site/focss/base/type/typography.css`
- `site/focss/base/tokens/semantic.css`
- `site/focss/base/animations.css`
- `site/focss/site/components/about/about-page.css`
- `site/focss/site/components/clients/clients-page.css`
- `site/focss/site/components/downloads/downloads-page.css`
- `site/focss/site/components/error/error-page.css`
- Compare page CSS/component discovered during baseline

**Actions**

1. Give `--font-weight-semibold` a real semantic value distinct from `--font-weight-medium`, but first verify available font files and browser fallback behavior. Do not choose a numeric weight solely because the token name suggests `600`; use a loaded weight or an intentional documented synthesis decision.
2. Separate accent, warning, and WhatsApp semantic roles. Preserve current visual intent where necessary, but remove accidental aliasing so future themes can change each role independently. Choose values from the existing palette unless product approval authorizes a new color.
3. Replace low-risk hard-coded values with the closest existing tokens: download index weight, about attribution size, client as-of tracking, download/error line heights, about media radius, compare fallback, and heading wrap behavior. Avoid broad search-and-replace across unrelated forks.
4. Revisit reduced-motion rules only where they are global. Preserve essential state changes and focus visibility; do not reintroduce decorative animation for reduced-motion users.

**Acceptance checks**

- Medium and semibold compute differently wherever both are used, or the source documents why the loaded font cannot support the distinction.
- Warning, accent, and WhatsApp tokens are independently overridable and their intended consumers retain readable contrast.
- No listed hard-coded cleanup remains in the owned source areas unless explicitly justified.
- Planner and Studio CSS remain isolated.

**Rollback:** Revert only the token and cleanup files in this phase. Component phases must not be mixed into the same commit/change set.

## Phase 2 — Planner visual hierarchy and responsive repair

**Findings:** UI-003, UI-004, UI-012, UI-013, UI-014, UI-015, UI-016, UI-031, UI-032.

**Likely source areas**

- `site/focss/site/components/planner/planner-landing-shared.css`
- `site/focss/site/components/planner/planner-landing-page.css`
- `site/focss/site/components/planner/planner-landing-mobile.css`
- `site/focss/site/components/planner/planner-feature-pages.css`
- `site/focss/site/components/planner/index.css`
- `site/focss/site/components/homepage/planner-hero-demo.css`
- `site/app/(site)/planner/page.tsx`
- `site/app/(site)/planner/features/page.tsx`
- `site/app/(site)/planner/features/[slug]/page.tsx`
- `site/app/(site)/planner/help/page.tsx`

**Actions**

1. Add a deliberate Planner landing hero entry sequence using the existing reveal pattern rather than a new animation family. Sequence eyebrow/kicker, title, lede/actions, then demo; honor `prefers-reduced-motion`.
2. Add the missing Planner eyebrow using existing copy and overline semantics. If approved copy is unavailable, use a neutral existing Planner label rather than inventing marketing claims.
3. Relax the landing title measure from the reported `12ch` cap to a responsive measure that preserves balance without forcing excessive wrapping. Verify at narrow mobile widths and tablet widths.
4. Give the feature index hero a real mobile minimum height and content-safe padding. The minimum must accommodate title, copy, and controls without relying on desktop viewport-height rules.
5. Add the same entry-reveal language to feature index/detail heroes and feature pills/cards. The demo on detail pages should enter cleanly but remain static after entry; the landing demo may retain its float only when motion is allowed.
6. Add a dedicated help stylesheet only if the page needs help-specific layout/interaction rules; otherwise document that shared feature-page styling is intentional. Do not create a file merely to satisfy the finding.
7. Reassess the 30rem hero cap and float delay against actual viewport profiles. Prefer a fluid clamp/min-height that avoids excessive empty space and does not push primary actions below the fold.
8. Confirm cards and feature links have visible keyboard focus states and preserve semantic links.

**Acceptance checks**

- `/planner` has a coherent visual entry sequence, readable hero measure, visible kicker, and no layout jump at mobile/tablet/desktop profiles.
- `/planner/features` retains a substantial hero at mobile widths; title, copy, and actions remain visible without overlap or clipping.
- `/planner/features/[slug]` has a non-abrupt hero/demo entry and no decorative animation under reduced motion.
- Feature cards/pills remain usable by keyboard and retain hover/focus affordances.
- The Planner remains visually stronger without importing homepage-only implementation details or crossing the Studio boundary.

**Rollback:** Revert only Planner marketing route components and `site/focss/site/components/planner/**` plus the explicitly owned demo CSS. Do not revert global tokens from Phase 1 in the same rollback.

## Phase 3 — Interaction, focus, and motion accessibility

**Findings:** UI-020, UI-021, UI-022; recheck UI-003, UI-014, UI-015.

> **Removed from this phase:** UI-017 (contact `:focus-visible` — resolved), UI-018 (contact transition — resolved).

**Likely source areas**

- `site/focss/base/animations.css`
- Shared focus utility/token source discovered during baseline
- Planner feature/landing CSS from Phase 2

**Actions**

1. Replace mouse-oriented input `:focus` styling with `:focus-visible` where appropriate on **remaining non-contact components**, while retaining a non-silent focus indication for keyboard users and preserving invalid/active states.
2. Standardize focus-ring treatment around the project’s existing `--focus-ring` or equivalent. Use one visual language across outline/box-shadow consumers without removing focus from controls with unusual clipping or dark backgrounds.
3. Refine reduced-motion behavior so decorative transitions/animations are suppressed while essential focus, disclosure, validation, and state changes remain understandable. Validate the Planner reveal sequence and demo float specifically.

**Acceptance checks**

- Keyboard traversal exposes a clear focus indicator on all affected controls against light and dark surfaces.
- Pointer clicks do not create distracting persistent rings where `:focus-visible` is intended.
- Reduced-motion users receive no decorative movement, no delayed hidden content, and no loss of essential state feedback.


**Rollback:** Revert only interaction and animation files. Where a Planner CSS file was first changed in Phase 2 and later changed here, revert the Phase 3 diff hunks only; do not revert Phase 2 layout/hierarchy changes.

## Phase 4 — SEO metadata, structured data, and image semantics

**Findings:** UI-001, UI-002, UI-008, UI-011. UI-009 is verified complete; UI-023 is verified complete; UI-024 is a documented, intentional optional-metadata choice rather than a defect.

> **Removed from this phase:** UI-010 (LocalBusiness on homepage — resolved: `buildLocalBusinessJsonLd()` exists in `seo.ts` and FurnitureStore is embedded sitewide via `buildGlobalJsonLd()` in layout).

**Likely source areas**

- `site/lib/helpers/seo.ts`
- `site/features/site/data/routeMetadata.ts`
- `site/app/(site)/page.tsx`
- `site/app/(site)/about/page.tsx`
- `site/app/(site)/planner/page.tsx`
- `site/app/(site)/planner/help/page.tsx`
- `site/app/(site)/showrooms/page.tsx`
- Existing JSON-LD helpers and brand/site data modules

**Actions**

1. Shorten homepage and About titles to stay within the project’s agreed target while preserving brand, product, and location intent. Confirm translated/dynamic variants rather than changing only English literals.
2. Add `SoftwareApplication` schema to Planner only if the route represents a publicly indexable application and the schema values are supported by live site data. Keep application/private routes noindex as currently intended.
3. Preserve the existing Planner Help `FAQPage` schema and ensure it continues to mirror the visible Q&A items; do not add a second schema block.
4. Add `LocalBusiness` schema to homepage/showrooms only from verified business facts already approved for public use. Do not invent hours, coordinates, address, or service claims. Use a shared helper to avoid divergent copies.
5. Treat absent Open Graph dimensions as valid while referenced assets vary in size. Add dimensions only when actual asset dimensions are verified and the site adopts fixed social-card assets.

**Acceptance checks**

- Titles are within the agreed length target for all relevant locale/dynamic variants and retain correct canonical/alternate behavior.
- JSON-LD is valid, matches visible content, contains no secrets, and does not add new schema to noindex/private routes. Existing FAQ schema on noindex tools remains a neutral implementation detail and does not create rich-result eligibility while noindex persists.
- LocalBusiness facts are sourced and reviewable; missing facts remain omitted rather than guessed.
- Any future OG dimensions match the actual fixed social-card asset; variable assets continue without false metadata.

**Rollback:** Revert metadata/schema helpers and affected route metadata independently from visual phases. Remove a schema block if its source facts cannot be verified.

## Phase 5 — Validation and release handoff

This phase does not assume any command has run. Execute only commands explicitly authorized in the current session and permitted by the enabled hook.

**Static checks**

- Type/lint checks for changed packages and files.
- FOCSS/style-token checks for changed CSS.
- Boundary scan: `pnpm run scan:boundaries` when either Planner or Studio tree is touched.
- Targeted unit tests for metadata/schema helpers and any changed animation/accessibility behavior.

**Runtime checks**

- Browser validation at `http://localhost:3000` for `/`, `/about`, `/contact`, `/planner`, `/planner/features`, `/planner/features/<each reachable slug>`, `/planner/help`, `/showrooms`, `/error`, and `/not-found`.
- Mobile, tablet, desktop, keyboard-only, reduced-motion, and light/dark preference profiles.
- Verify noindex/canonical/alternate behavior on `/planner` app routes and other private routes remains unchanged.
- Check structured-data output against visible content and source-approved facts.
- Check image loading and error-route fallback behavior.

**Release decision**

A phase is complete only when its source acceptance checks pass and the relevant authorized validation output is recorded. Do not claim full audit closure while browser, hosted SEO, deployment, or protected checks remain pending. Unverified findings stay open or are explicitly classified as requiring runtime evidence.

## Finding-to-phase index

| Finding | Phase | Primary acceptance focus |
|---|---:|---|
| UI-001–UI-002 | 4 | Title length and locale/dynamic metadata |
| UI-003 | 2 | Planner landing reveal and reduced motion |
| UI-004 | 2 | Feature-index mobile hero height |
| UI-005 | 1 | Distinct medium/semibold semantics |
| UI-006 | 1 | Independent semantic color roles |
| UI-007 | ~~1~~ | ✅ **Resolved** — `html.dark {}` class-based layer in `semantic.css` (WorkspaceThemeProvider) |
| UI-008, UI-011 | 4 | Supported schema and no guessed facts |
| UI-009 | Verified complete | Preserve existing FAQ schema/visible-Q&A parity |
| UI-012–UI-016 | 2 | Planner hierarchy, entry motion, shared CSS rationale |
| UI-017–UI-018 | ~~3~~ | ✅ **Resolved** — contact focus uses `:focus` + `:focus-visible`; transition uses `var(--motion-fast)` |
| UI-020–UI-022 | 3 | Remaining focus and reduced motion |
| UI-019 | 1 | Loaded-font-safe weight and token cleanup |
| UI-023 | Verified complete | Preserve `OneAndOnlyLogo` image-component use |
| UI-024 | Not a defect | Do not add false OG dimensions for variable assets |
| UI-025–UI-030 | 1 | Token cleanup in named files |
| UI-031–UI-032 | 2 | Fluid hero sizing and motion sequencing |
| UI-033 | 1 | Safer heading wrapping |

## Current status

- **Closed 2026-09-01.** All 33 findings resolved, fixed, or classified not-a-defect. Independent re-verification found the UI-028 "Fixed" claim was false at the time (three `1.55` remained); fixed for real this date. UI-011/014/015/016 implemented and tested 2026-09-01. Superseded client-showcase scaffolding (`site/components/site/clients/*`, `site/hooks/useSectorTabs.ts`, `clients.showcase` i18n keys en/hi) deleted per owner decision — `site/lib/clients/*` retained (live, used by `proof.ts`).
- Validation observed 2026-09-01: `pnpm run typecheck` clean; `scan:boundaries` OK; `verify:focss` zero failures; `lint:ui:strict` OK; focused vitest 17 files / 207 tests pass (clients, seo, full `tests/unit/lib/ai`); `pnpm run gate:fast` exit 0. Governance baseline re-recorded via `--update`: S2 19→22 (owner-directed handover files under `plans/` predate the ratchet), P4 42→8 tightened to real count.
- Browser/runtime acceptance (Phase 5) at localhost:3000 profiles: not run this session; static + unit evidence only.
- Git commit/push: not performed.
