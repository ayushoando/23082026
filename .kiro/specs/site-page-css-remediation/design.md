# Design: Page-wise FOCSS CSS remediation

## 1. Implementation model

The remediation is organized as an ownership graph, not as 61 independent CSS patches:

1. **Shell contract first.** Confirm whether the route is public marketing, auth/workspace, Admin, Planner, Studio, Offline, or redirect-only. This resolves the footer heuristic before any page styling.
2. **Zone primitives second.** Correct the repeated target-size and type rules in the existing zone primitives.
3. **Page-family sheets third.** Adjust only the page-family sheet that owns the remaining layout context.
4. **Markup/runtime separately.** Accessible names, landmarks, redirects, and console errors are tracked beside CSS but never represented as CSS fixes.
5. **Viewport evidence last.** Recheck every route at exactly 1920, 1440, 1078, 768, and 390.

The graph source is `results/site/page-component-graph/page-component-graph.json`; direct page/view ownership is listed in `tasks.md`.

## 2. Zone and entry ownership

| Zone | Entry/layout owner | Canonical CSS import surface | Allowed scope | Forbidden scope |
|---|---|---|---|---|
| Site | `site/app/(site)/layout.tsx`, `RouteChromeSuspense`, `MobileAppShell` | `site/focss/site/entry.css` → `site/focss/site/components/index.css` | Public marketing, auth/workspace chrome that is rendered by the site layout, catalog, portal | Admin, Planner fork, Studio fork CSS |
| Admin | `site/app/admin/layout.tsx` → `site/features/admin/ui/AdminLayoutShell.tsx` | `site/focss/admin/entry.css` | Admin shell, Admin page views, Admin controls | Public site footer/marketing barrels, Planner/Studio CSS |
| Planner | `site/features/Planner/layout.tsx` → `@focss/planner/entry.css` | `site/focss/planner/entry.css` | OO Planner top bar, projects, canvas, dock, workspace | `base/scan.css`, site marketing, Admin, Studio |
| Studio | `site/features/Studio/layout.tsx` → `@focss/studio/entry.css` | `site/focss/studio/entry.css` | OO Studio top bar, tools, dock, workspace | Planner, Admin, site marketing |
| Offline | `site/features/site/offline/OfflinePageView.tsx` | Existing site error sheet through the site/global CSS path | Offline utility shell and `ReloadButton` | Public footer fabrication, runtime-error masking |

The site and Admin entries may use the repository's shared base sheets as already imported. Planner has its own Tailwind import and is intentionally not a consumer of `site/focss/base/scan.css`.

## 3. Existing canonical CSS files

### Site shell and shared primitives

- `site/focss/site/components/chrome/index.css` is the shell barrel. It imports `shell-nav.css`, `shell-global-nav.css`, `shell-footer.css`, `shell-workspace.css`, `shell-access.css`, `shell-portal.css`, `marketing-layout.css`, `app-shell.css`, `site-footer.css`, and `marketing-nav.css`.
- `site/focss/site/components/shared/index.css` is the marketing primitive barrel. It imports `buttons.css`, `cards.css`, `catalog-suite-filters.css`, `nav.css`, `route-hero.css`, `route-spacing.css`, and `mobile-tap-targets.css` among others.
- `site/focss/base/type/type.css` and `site/focss/base/type/typography.css` own shared type vocabulary. Do not add a second label scale.
- `site/focss/site/components/homepage/index.css` owns homepage sheets including `home-type.css`, `home-marketing-interactions.css`, and `home-mobile.css`.
- `site/focss/site/components/products/index.css` owns the product package: `products-page.css`, `product-entry-page.css`, `catalog-cards.css`, `catalog-category-hero.css`, `catalog-desktop.css`, `catalog-filters.css`, `catalog-mobile.css`, `shell-pdp.css`, `pdp-detail.css`, `pdp-cta.css`, `product-viewer.css`, `choose-product-page.css`, and `workspace-hub.css`.

### Existing site page-family sheets

`site/focss/site/components/index.css` already imports the following route-family sheets. Use these before considering a new file:

- Editorial and proof: `about/about-page.css`, `career/career-page.css`, `clients/clients-page.css`, `downloads/downloads-page.css`, `planning/planning-page.css`, `sustainability/sustainability-page.css`, `trusted-by/trusted-by-page.css`.
- Service and location: `service/service-page.css`, `showrooms/showrooms-page.css`, `contact/contact-page-pass.css`, `contact/contact-page.css`.
- Legal and solutions: `legal/legal-page.css`, `solutions/solutions-page.css`.
- Utility families: `compare/compare-page.css`, `quote-cart/quote-cart-page.css`, `sitemap/sitemap-page.css`, `error/error-page.css`.
- Planner marketing: `planner/planner-landing-shared.css`, `planner/planner-landing-page.css`, `planner/planner-landing-mobile.css`, `planner/planner-feature-pages.css`.

There is no verified route-local tools/calculator sheet in this tree. There is no live graph owner matching `CatalogFilterPanel.tsx`, `CatalogToolbar.tsx`, `catalog/ProductCard.tsx`, `tools-engine-placeholder`, or `tools-faq`; those names must not appear as implementation targets.

### Admin

`site/focss/admin/entry.css` imports the Admin-owned base and component files:

- Base: `base/tokens.css`, `base/shell.css`, `base/shell-main.css`, `base/type.css`, `base/buttons.css`, `base/primitives.css`.
- Components: `components/pages.css`, `components/entry-hero.css`, `components/hub.css`, `components/catalog.css`, `components/crm.css`.
- The only route-local style import found in the graph is `site/focss/admin/components/design-kit.css` for `/admin/design-kit`.

`AdminLayoutShell.tsx` is the markup owner for Admin topbar, mobile menu, sidebar, nav groups, and sidebar footer. Admin does not receive the public site footer.

### Planner and Studio

Planner and Studio intentionally have parallel but separate sheet names:

- Planner: `site/focss/planner/entry.css`, `base/palette.css`, `base/semantic.css`, `base/layout.css`, `base/document.css`, `chrome.css`, `controls.css`, `polish.css`, `workspace-shell.css`, `workspace.css`, `dock.css`.
- Studio: `site/focss/studio/entry.css`, `base/index.css`, `base/palette.css`, `base/semantic.css`, `base/layout.css`, `base/document.css`, `chrome.css`, `controls.css`, `polish.css`, `workspace-shell.css`, `workspace.css`, `dock.css`.

A similarly named file in the other fork is not a shared owner. Any control change must be made in both forks independently when both audits require it.

## 4. Shell contract design

`site/features/site/data/routeChromeRules.ts` is the contract for the site layout:

| Route family | Header/footer contract | CSS/markup owner | Plan disposition |
|---|---|---|---|
| Public marketing/editorial/legal/products | Full site chrome | `RouteChromeSuspense`, site chrome barrel, page component | Fix CSS where H/T is real; inspect F only if full chrome fails to render |
| `/access` | Workspace mode: hidden public chrome | `AccessSignInView`, `shell-access.css`, `shell-workspace.css` | Audit-contract first; CSS only for actual auth controls |
| `/choose-product` | Full marketing chrome | `ChooseProductPage`, product chooser sheet | Not a workspace exception; preserve footer contract |
| `/dashboard`, `/portal`, `/portal/[id]` | Hidden public chrome | `DashboardClient`, `PortalPageView`, `PortalPlanPageView`, workspace/portal sheets | Audit-contract plus actual in-frame target CSS |
| `/portal/guest` | Public site route | `GuestPortalPageView`, portal sheet | Treat as public until DOM confirms otherwise |
| `/portal/guest/view/[id]` | Redirect-oriented in graph | route page and `plannerRedirect` | Redirect/audit-contract; no invented viewer CSS owner |
| `/login` | Hidden/full header depending on `next`; `login-tools` footer | route page, auth redirect, shell access/login rules | Redirect/auth contract; no missing-landmark CSS patch |
| `/admin/*` | Admin-only shell | `AdminLayoutShell` and Admin sheets | Intentional footerless app shell; no site footer |
| `/ooplanner*` | Planner app shell | `features/Planner/layout.tsx`, Planner components/sheets | Intentional footerless app shell; Planner-only CSS |
| `/oostudio` | Studio app shell | `features/Studio/layout.tsx`, Studio components/sheets | Intentional footerless app shell; Studio-only CSS |
| `/offline` | Utility shell | `OfflinePageView`, `ReloadButton`, `error-page.css` | Intentional footerless shell; runtime error separate |

The 130 F findings are therefore a classification exercise. A required public footer may be fixed in markup and styled by the existing footer sheet; an intentional shell is closed by the audit contract, not by adding markup solely to satisfy a heuristic.

## 5. Component-to-CSS ownership by family

| Family | Verified page/view owners | Canonical CSS owner(s) | Primary work |
|---|---|---|---|
| Homepage | `HomepageHero`, `Collections`, `HomeDeferredSections`, `home/layout/index` | `homepage/index.css`, `home-type.css`, `home-marketing-interactions.css`, `home-mobile.css`, shared buttons/tap targets | Flagship/Trusted by type and mobile/tablet controls |
| Editorial/proof/service | `AboutPageView`, `CareerPageView`, `ClientsPageView`, `DownloadsPageView`, `PlanningPageView`, `ServicePageView`, `ShowroomsPageView`, `SustainabilityPageView`, `TrustedByPageView` | Matching page sheet plus shared buttons/tap targets, route spacing, marketing layout | H target sizing in cards, CTAs, links, and responsive grids |
| Contact | `ContactPageView`, `ContactTeaser` | `contact-page-pass.css`, `contact-page.css`, `contact-band.css`, `home-contact-page.css`, `home-contact-teaser.css` | Form and CTA target sizing; preserve field density |
| Compare/quote/sitemap | `ComparePageView`, quote page direct `MarketingCtaLink`, `SitemapPageView` | `compare-page.css`, `quote-cart-page.css`, `sitemap-page.css`, shared buttons/tap targets | Tablet action/link line boxes |
| Legal | `LegalRouteHero`, `LegalBodyReveal`, `QuerySectionScroll`, `RouteCtaBand`, `MarketingCtaLink` | `legal/legal-page.css`, shared button/tap targets | Link/accordion/CTA target sizing |
| Solutions | `SolutionsPageView`, `SolutionsCategoryPageView` | `solutions/solutions-page.css`, shared cards/buttons/tap targets | Card/filter/CTA sizing and media wrapping |
| Planner marketing | `PlannerLandingPage`, `PlannerFeaturesHubPage`, `PlannerFeaturePageView`, `PlannerHelpPage` | `planner-landing-shared.css`, `planner-landing-page.css`, `planner-landing-mobile.css`, `planner-feature-pages.css` | Tablet/mobile CTA, feature links, help navigation |
| Product catalog | `ProductsPageView`, `CategoryPageView`, `FilterGridInner`, `FilterGrid.components`, `CategoryListingHero` | product barrel, especially `catalog-filters.css`, `catalog-mobile.css`, `catalog-category-hero.css`, `catalog-cards.css` | Name controls in markup, then target/wrapping CSS |
| Product detail | `ProductViewer` and its reachable viewer/detail controls | `product-viewer.css`, `pdp-detail.css`, `pdp-cta.css`, `shell-pdp.css` | Mobile breadcrumb type and action controls |
| Redirect/owner-gap pages | `/login`, `/products/category/[slug]`, `/portal/guest/view/[id]`, both tools calculators | Existing shell/product barrel only where rendered; no invented page sheet | Confirm redirect/placeholder behavior before CSS |
| Admin | Admin page views in `tasks.md`, `AdminLayoutShell` | Admin entry, shell/base primitives, `pages.css`, family `catalog.css`/`crm.css`/`hub.css`, design-kit sheet only where imported | Shared nav/table/form/toggle targets; shell contract |
| Planner app | `features/Planner/page.tsx`, projects page, project detail page, `PlannerTopBar` | Planner `controls.css`, `chrome.css`, `workspace-shell.css`, `workspace.css`, `dock.css` | Labels, dock/workspace targets, runtime ownership |
| Studio app | `features/Studio/page.tsx`, `StudioTopBar` | Studio `controls.css`, `chrome.css`, `workspace-shell.css`, `workspace.css`, `dock.css` | Studio-only tool/dock targets |

## 6. Responsive strategy

- Keep the existing FOCSS breakpoints. Do not create a breakpoint only for this plan.
- At 768, wrap or stack control groups before reducing text or target boxes.
- At 390, preserve a 40px interactive box, allow labels to wrap, and prevent horizontal clipping.
- Fix the target's box, not only its icon glyph. For an icon-only control, preserve an accessible name and enlarge the button wrapper.
- Keep decorative overflow separate from content overflow; each fix must identify the measured offending element.
- Use semantic surface, text, type, spacing, and control tokens already owned by the zone.

## 7. Execution waves

### Wave 0 — Evidence and shell contract
Freeze the route inventory, dynamic samples, direct component owners, and all F dispositions. Inspect DOM/screenshots for F/N/H/T before editing. Record current class, computed box, viewport, and CSS owner.

### Wave 1 — Shared primitives
Review base type, site buttons/tap targets, Admin buttons/primitives, and each fork's controls/dock sheets. Fix repeated target/type rules at the narrowest shared owner.

### Wave 2 — Site families
Apply the shared fixes to marketing/editorial/legal/service/solution/planner-marketing routes. Use existing page sheets for residual layout contexts.

### Wave 3 — Product and owner gaps
Fix canonical category markup and product CSS. Verify the legacy category redirect. Investigate the calculators and any route whose graph has no live control owner.

### Wave 4 — Admin
Fix `AdminLayoutShell` and Admin primitives once, then page-family exceptions. Preserve the intentional Admin shell/footer contract.

### Wave 5 — Planner and Studio
Make independent fork changes in Planner and Studio. Reproduce Planner runtime errors. Do not share a CSS import to reduce duplication.

### Wave 6 — Evidence closure
Re-run the deterministic audit at all five widths, compare every route row, capture screenshots for changed routes, and record remaining CSS, Markup, Runtime, Audit-contract, and Owner-gap statuses.

## 8. Evidence record

Each completed item records:

- route pattern and concrete audit path;
- source page and direct component owner;
- zone and exact CSS file changed;
- viewport(s) changed;
- finding code before/after;
- DOM selector/class and measured box where applicable;
- screenshot path and audit artifact path;
- classification: CSS, Markup, Runtime, Audit contract, or Owner gap.

Durable planning stays in `.kiro/specs/site-page-css-remediation/`; generated evidence stays under `results/**`.
