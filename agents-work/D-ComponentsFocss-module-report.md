# D-ComponentsFocss — Exhaustive Module Review

**Reviewer:** `FreshComponentsFeatures`  
**Workspace:** `D:/23082026`  
**Frozen baseline:** `HEAD fdef1ba7106328ecf43e7a3232dd4bd9859b97be`; 4,095 tracked paths plus literal `plans/repository-suggestions.md` = 4,096 inputs.  
**Owned inputs:** exactly 364 paths from the frozen ComponentsFeatures partition: `site/components/**` (194), `site/focss/**` (152), and `site/hooks/**` (18). Feature-code `site/features/**` (208) is reported only in D-FeaturesPublic. Generated reports are outputs and are excluded.

## 1. Review method and coverage

The frozen manifest was read before review and every listed component, FOCSS, and hook path was opened as UTF-8 text/code/style/config content in an independent read-only sweep. The sweep inspected **364/364 files**, **1,796,315 bytes**, and **59,524 lines**, with no missing files or parse failures. No owned path is a binary asset, so every row is `read-full`; no `binary-validated` or `failed` rows apply. Findings below were retained only after rereading and verifying the exact supporting code ranges.

The review checked Planner/Studio fork boundaries, CSS import fences and token resolution, client boundaries, listener/timer/animation cleanup, keyboard and pointer interactions, ARIA labels and focus behavior, image alternatives, commercial/admin guards, and CRM state transitions. The CSS skill's FOCSS-first architecture was applied; no source files were changed.

## 2. Module summaries

### 2.1 `site/components/**` (194 files)

**Strengths.** Shared primitives use React Aria for buttons/dialogs and `forwardRef` where native focus/measurement requires it. Planner and Studio editors keep separate import trees (`@planner/*` vs `@studio/*`). Consent, analytics, keyboard shortcuts, resize observers, and event listeners have paired cleanup paths. Decorative ruler canvases are hidden from assistive technology in Planner, and product images carry alternative text.

**Findings.** C-01, C-03, C-04, and C-05 below. C-03 is present in both editor ruler forks; C-04 is Studio-only fork drift; C-05 affects the shared NumberStepper primitive.

**Six-month guidance.** Remove the unconditional ruler animation loop and redraw from Fabric/resize/cursor transitions. Add a fork-parity check for Planner/Studio components, especially ARIA and focus behavior. Keep numeric input state finite at the primitive boundary and add behavior tests for intermediate number strings.

### 2.2 `site/focss/**` (152 files)

**Strengths.** The site, admin, Planner, and Studio entries keep explicit import fences; Planner and Studio do not cross-import. Palette and semantic layers separate raw colors from roles, and Planner's entry remains self-contained rather than pulling the site's scan barrel.

**Findings.** C-01 and C-02 identify unresolved custom properties in the Studio and Planner semantic layers. The declarations are consumed by reachable document/control rules, so they are not merely unused-token hygiene.

**Six-month guidance.** Add a value-resolution phase to `verify:focss`: each `var(--x)` should be defined in the reachable graph, have a fallback, or be explicitly allow-listed as runtime supplied. Add a known-alias fork diff so semantic drift is caught before visual regressions.

### 2.3 `site/hooks/**` (18 files)

**Strengths.** Planner/Studio hooks mirror latest callback handlers through refs where effects intentionally have stable subscriptions. Timers, observers, RAF handles, and DOM listeners are cleaned up. The planner session warning clears timers on unmount and touch/focus hooks stay within their own fork.

**Findings.** No actionable correctness defect remained after full read. Capability differences (Planner viewport/session warning versus Studio draft autosave) are not defects without a product contract establishing parity.

**Six-month guidance.** Add focused hook tests for unmount during pending timers/RAF and for pointer cancellation. Document which capabilities are deliberately fork-specific, then enforce only the documented parity contract.

## 3. Grounded findings

### C-01 · P1 · Define Studio semantic text colors

**Path and range:** `site/focss/studio/base/semantic.css:10-11`.

`--text-strong` and `--text-body` both reference `--color-pure-black`, but the complete owned FOCSS tree contains no definition for that custom property. Studio's `base/document.css:8` and its chrome/control rules consume these roles without fallbacks, so their declarations become invalid at computed-value time and body/control color falls back to inheritance.

**Observed Reproduction Input/Output:**
- *Input:* Search all 152 files in `site/focss/**` for `--color-pure-black:`.
- *Observed Output:* `0` definitions found. Usages in `site/focss/studio/base/semantic.css:10-11` (`--text-strong: var(--color-pure-black);`, `--text-body: var(--color-pure-black);`).
- *Result:* Evaluates to invalid custom property reference at computed-value time, dropping the color declaration.

**Fix:** Use the existing defined ink token used by the Planner fork (`--color-ink-900` for strong and `--color-ink-800` for body), or define the missing palette token in the Studio-reachable palette.

### C-02 · P2 · Supply or remove the Planner Inter font variable

**Path and range:** `site/focss/planner/base/layout.css:9-10`.

Both Planner font stacks begin with `var(--font-inter)`, but no owned CSS file defines it and the Planner entry intentionally does not import the site's runtime font layer. Because the unresolved var() makes the entire font-family declaration invalid at computed-value time, Planner falls back to inherited or initial typography, including numeric readouts derived from `--font-sans`. Either mount a real `--font-inter` variable for Planner or remove it from both declarations so the configured stack states the actual behavior.

### C-03 · P1 · Stop the permanent ruler animation loop

**Paths and ranges:** `site/components/Planner/PlannerRulers.tsx:115-123`; `site/components/Studio/StudioRulers.tsx:115-123`.

Each mounted ruler calls `draw()` and schedules a new `requestAnimationFrame` forever. `draw()` resizes/clears both backing canvases and iterates tick marks every frame despite no self-animation. This consumes a continuous paint/CPU budget in both editors; the effect also includes the `offset` object even though the draw body never reads it, and the Planner caller supplies a fresh object literal, causing teardown/recreation on parent renders.

**Observed Reproduction Input/Output:**
- *Input:* Inspection of `useEffect` in both ruler components.
- *Observed Code:* `const loop = () => { draw(); animId = requestAnimationFrame(loop); }; animId = requestAnimationFrame(loop);`
- *Result:* Unconditional scheduling of new animation frames on every frame tick (60-144 Hz) regardless of canvas dirty state or user interaction, causing continuous CPU/GPU redraw churn.

**Fix:** Remove the unconditional loop and redraw on actual Fabric/viewport/resize changes; remove the unused `offset` dependency/prop or memoize the caller value.

### C-04 · P2 · Hide Studio ruler decoration from assistive technology

**Path and range:** `site/components/Studio/StudioRulers.tsx:130-133`.

Studio renders the ruler corner and two canvas elements without `aria-hidden`, while the equivalent Planner fork marks all three decorative elements hidden. A screen-reader traversal of `/oostudio` consequently encounters unlabeled decorative graphics. Add `aria-hidden="true"` to the corner and both canvases, matching the Planner implementation.

### C-05 · P2 · Reject non-finite NumberStepper input

**Path and range:** `site/components/ui/NumberStepper.tsx:51-54`.

The controlled number input passes `Number(e.target.value)` directly through `clamp`. While the browser is editing intermediate strings such as `-`, `1e`, or `.`, conversion yields `NaN`; `Math.max`/`Math.min` preserve `NaN`, so parent state receives a non-finite number. Subsequent arithmetic in dimensions, quantities, or prices can then become `NaN`, while the component displays an empty field. Ignore empty/intermediate non-finite values (or retain a separate draft string) before calling the numeric callback.

## 4. Verdict

- **overall_correctness:** `incorrect`
- **confidence:** `0.94`
- **explanation:** Five patch-anchored defects remain: two unresolved FOCSS token/font contracts, continuous ruler repainting in both editor forks, missing decorative ARIA hiding in Studio, and non-finite NumberStepper propagation. All 364 owned inputs have an explicit successful read status; no failures or binary assets occurred.

## Appendix A — Per-file review ledger (364 inputs)

| path | status | module | reviewer | finding IDs |
|---|---|---|---|---|
| site/components/ClientBadge.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/Planner.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerAiPanel.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerAlignBar.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerAutoArrangeDialog.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerBoqPanel.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerCatalogRail.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerColorPalette.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerCommandPalette.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerConstants.ts | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerContextMenu.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerDockShell.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerEntry.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerErrorBoundary.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerHandoffDialog.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerIconButton.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerLayersPanel.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerProjectAccessState.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerProjectLoadState.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerProjectMenu.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerProjectsList.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerPropertiesPanel.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerRulers.tsx | read-full | components | FreshComponentsFeatures | C-03 |
| site/components/Planner/PlannerSheetSettings.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerTabletPanelScrim.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerToast.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerToolRail.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerTopBar.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerTopToolbar.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerUnitPill.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerValidationPanel.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerViewportControls.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/PlannerWorkflowBar.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/SketchToPlanDialog.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/dock/PlannerDockPanels.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/plannerLoadState.ts | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/plannerProjectsListState.ts | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/PlannerDockFloatHeaderActions.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/PlannerDockPanelButtons.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/PlannerDockTab.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/PlannerDraggableCanvasOverlay.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/PlannerExportMenu.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/PlannerHueSlider.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/PlannerOoButton.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/PlannerOoDialog.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/PlannerOoInput.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/PlannerPanelEmptyState.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/PlannerPhIcon.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/PlannerPropertiesEmptyHint.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/PlannerSidePanelResizeHandle.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/PlannerStateSurface.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/PlannerTopBarGitUser.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/PlannerTopBarShell.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/plannerExportMenuTypes.ts | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/plannerPhIconMap.ts | read-full | components | FreshComponentsFeatures | none |
| site/components/Planner/ui/usePlannerPanelResize.ts | read-full | components | FreshComponentsFeatures | none |
| site/components/ProductGallery.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Reviews.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/Studio.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/StudioAiPanel.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/StudioAlignBar.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/StudioColorPalette.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/StudioColorRail.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/StudioConstants.ts | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/StudioContextMenu.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/StudioDockShell.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/StudioIconButton.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/StudioLayersPanel.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/StudioPropertiesPanel.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/StudioRulers.tsx | read-full | components | FreshComponentsFeatures | C-03, C-04 |
| site/components/Studio/StudioToast.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/StudioToolRail.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/StudioTopBar.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/StudioTopToolbar.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/StudioViewportControls.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/dock/StudioDockPanels.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/ui/StudioDockFloatHeaderActions.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/ui/StudioDockPanelButtons.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/ui/StudioDraggableCanvasOverlay.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/ui/StudioExportMenu.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/ui/StudioFloatingPanel.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/ui/StudioHueSlider.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/ui/StudioPanelEmptyState.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/ui/StudioPhIcon.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/ui/StudioPropertiesEmptyHint.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/ui/StudioSidePanelResizeHandle.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/ui/StudioTopBarGitUser.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/ui/StudioTopBarShell.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/ui/studioExportMenuTypes.ts | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/ui/studioPhIconMap.ts | read-full | components | FreshComponentsFeatures | none |
| site/components/Studio/ui/useStudioPanelResize.ts | read-full | components | FreshComponentsFeatures | none |
| site/components/about/AboutHeroMedia.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/about/AboutPageView.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/analytics/KpiIntegrityMonitor.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/career/CareerPageView.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/career/JobCard.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/clients/ClientsCaseStudies.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/clients/ClientsHero.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/clients/ClientsProofStrip.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/compare/ComparePageHeader.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/contact/ContactPageView.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/contact/CustomerQueryForm.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/downloads/DownloadsPageView.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/faq/FaqPageView.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/CategoryGrid.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/Collections.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/CollectionsSectionHeading.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/HomeDeferredSections.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/HomepageHero.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/InteractiveTools.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/KpiCounter.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/PartnershipBanner.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/PlannerHeroDemo.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/PlannerToolsShowcase.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/ShowcaseCarousel.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/TrustStrip.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/WhyChooseUs.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/layout/HomeCatalogLayout.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/layout/HomeMarketingLayout.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/layout/HomeSection.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/layout/HomeSectionInner.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/layout/SiteWorkspaceShell.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/home/layout/index.ts | read-full | components | FreshComponentsFeatures | none |
| site/components/legal/LegalBodyReveal.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/legal/LegalRouteHero.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/legal/QuerySectionScroll.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/planning/PlanningPageView.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/products/CategoryTileImage.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/products/CompareColumnActions.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/products/CompareDock.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/products/CompareShortlistHydrator.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/products/ProductsPageView.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/pwa/ServiceWorkerRegister.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/security/CsrfBootstrap.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/service/ServicePageView.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/shared/ContactTeaser.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/shared/OfficeMap.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/shared/RouteActionCard.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/shared/RouteCtaBand.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/shared/SectionIntro.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/showrooms/ShowroomsPageView.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/CookieConsentBar.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/EditorialHeroMedia.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/EditorialRoute.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/Footer.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/FooterLogoMarquee.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/Header.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/HeaderProductsMegaMenu.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/HeaderSearchPanel.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/LanguageSwitcher.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/MaintenanceBanner.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/MarketingImage.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/MobileAppShell.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/MobileNavDrawer.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/QuoteCartChrome.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/RouteChrome.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/RouteChromeSuspense.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/SiteAnalytics.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/SiteConversionTracker.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/SiteErrorBoundary.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/ZarazConsentBridge.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/clients/ClientCard.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/clients/ClientLogoArea.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/clients/ClientShowcase.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/clients/ClientShowcaseSection.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/clients/ClientTabPanel.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/clients/SectorTabButton.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/clients/SectorTabList.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/site/headerSearchTypes.ts | read-full | components | FreshComponentsFeatures | none |
| site/components/sitemap/SitemapPageView.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/solutions/SolutionsCategoryPageView.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/solutions/SolutionsPageView.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/sustainability/SustainabilityPageView.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/trusted-by/TrustedByPageView.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/Button.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/Field.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/IconButton.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/Input.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/Label.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/Logo.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/MarketingCta.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/MarketingCtaLink.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/NumberStepper.tsx | read-full | components | FreshComponentsFeatures | C-05 |
| site/components/ui/Panel.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/PlannerLaunchLink.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/Toolbar.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/TrackedLink.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/ViewportControls.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/WhatsAppCTA.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/dialog.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/form.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/switch.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/textarea.tsx | read-full | components | FreshComponentsFeatures | none |
| site/components/ui/useFocssResolvedScheme.ts | read-full | components | FreshComponentsFeatures | none |
| site/focss/README.md | read-full | focss | FreshComponentsFeatures | none |
| site/focss/admin/base/buttons.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/admin/base/primitives.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/admin/base/shell-main.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/admin/base/shell.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/admin/base/tokens.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/admin/base/type.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/admin/components/catalog.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/admin/components/crm.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/admin/components/design-kit.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/admin/components/entry-hero.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/admin/components/hub.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/admin/components/pages.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/admin/entry.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/base/animations.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/base/containers.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/base/document.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/base/index.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/base/root.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/base/runtime.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/base/scan.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/base/tokens/layout.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/base/tokens/palette.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/base/tokens/semantic.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/base/type/type.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/base/type/typography.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/planner/base/document.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/planner/base/layout.css | read-full | focss | FreshComponentsFeatures | C-02 |
| site/focss/planner/base/palette.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/planner/base/semantic.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/planner/chrome.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/planner/controls.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/planner/dock.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/planner/entry.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/planner/polish.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/planner/responsive.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/planner/states.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/planner/workspace-lists.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/planner/workspace-overlays.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/planner/workspace-shell.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/planner/workspace.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/about/about-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/career/career-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/chrome/app-shell.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/chrome/index.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/chrome/marketing-layout.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/chrome/marketing-nav.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/chrome/misc-chrome.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/chrome/shell-access.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/chrome/shell-assistant-bot.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/chrome/shell-assistant.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/chrome/shell-cta.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/chrome/shell-footer.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/chrome/shell-global-nav.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/chrome/shell-nav.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/chrome/shell-portal.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/chrome/shell-quick-contact.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/chrome/shell-site-fabs.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/chrome/shell-workspace.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/chrome/site-footer.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/clients/clients-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/clients/clients-showcase.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/compare/compare-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/contact/contact-band.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/contact/contact-page-pass.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/contact/home-contact-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/contact/home-contact-teaser.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/downloads/downloads-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/error/error-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/faq/faq-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/homepage/home-base.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/homepage/home-extras.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/homepage/home-layout.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/homepage/home-marketing-interactions.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/homepage/home-mobile.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/homepage/home-premium-pass.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/homepage/home-projects.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/homepage/home-sections.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/homepage/home-showcase-carousel.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/homepage/home-showcase-shared.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/homepage/home-tool-cards-fallback.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/homepage/home-tool-cards.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/homepage/home-type.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/homepage/index.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/homepage/planner-hero-demo.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/homepage/soft-bands.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/index.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/legal/legal-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/planner/index.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/planner/planner-feature-pages.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/planner/planner-landing-mobile.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/planner/planner-landing-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/planner/planner-landing-shared.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/planning/planning-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/products/catalog-cards.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/products/catalog-category-hero.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/products/catalog-desktop.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/products/catalog-filters.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/products/catalog-mobile.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/products/choose-product-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/products/index.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/products/pdp-cta.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/products/pdp-detail.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/products/product-entry-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/products/product-viewer.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/products/products-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/products/shell-pdp.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/products/workspace-hub.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/quote-cart/quote-cart-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/service/service-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/badges.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/buttons.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/cards.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/catalog-card-media.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/catalog-suite-filters.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/client-badge.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/contact-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/custom.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/editorial-hero.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/home-media-layers.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/index.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/mobile-tap-targets.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/nav.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/office-map.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/plan-symbol-preview.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/route-hero.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/route-spacing.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/schemes.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/shared-component-layer.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/stats.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/theme-utils.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/shared/tools.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/showrooms/showrooms-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/sitemap/sitemap-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/solutions/solutions-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/sustainability/sustainability-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/components/trusted-by/trusted-by-page.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/entry.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/heading-document.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/site/type-marketing.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/studio/base/document.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/studio/base/index.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/studio/base/layout.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/studio/base/palette.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/studio/base/semantic.css | read-full | focss | FreshComponentsFeatures | C-01 |
| site/focss/studio/chrome.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/studio/controls.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/studio/dock.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/studio/entry.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/studio/polish.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/studio/workspace-shell.css | read-full | focss | FreshComponentsFeatures | none |
| site/focss/studio/workspace.css | read-full | focss | FreshComponentsFeatures | none |
| site/hooks/Planner/usePlannerCanvasCore.ts | read-full | hooks | FreshComponentsFeatures | none |
| site/hooks/Planner/usePlannerDockBridge.ts | read-full | hooks | FreshComponentsFeatures | none |
| site/hooks/Planner/usePlannerFabric.ts | read-full | hooks | FreshComponentsFeatures | none |
| site/hooks/Planner/usePlannerFocusManager.ts | read-full | hooks | FreshComponentsFeatures | none |
| site/hooks/Planner/usePlannerGitUserEmail.ts | read-full | hooks | FreshComponentsFeatures | none |
| site/hooks/Planner/usePlannerHistory.ts | read-full | hooks | FreshComponentsFeatures | none |
| site/hooks/Planner/usePlannerKeyboardShortcuts.ts | read-full | hooks | FreshComponentsFeatures | none |
| site/hooks/Planner/usePlannerSessionWarning.ts | read-full | hooks | FreshComponentsFeatures | none |
| site/hooks/Planner/usePlannerTouchGestures.ts | read-full | hooks | FreshComponentsFeatures | none |
| site/hooks/Planner/usePlannerViewport.ts | read-full | hooks | FreshComponentsFeatures | none |
| site/hooks/Studio/useStudioCanvasCore.ts | read-full | hooks | FreshComponentsFeatures | none |
| site/hooks/Studio/useStudioDockBridge.ts | read-full | hooks | FreshComponentsFeatures | none |
| site/hooks/Studio/useStudioDraftAutosave.ts | read-full | hooks | FreshComponentsFeatures | none |
| site/hooks/Studio/useStudioFabric.ts | read-full | hooks | FreshComponentsFeatures | none |
| site/hooks/Studio/useStudioGitUserEmail.ts | read-full | hooks | FreshComponentsFeatures | none |
| site/hooks/Studio/useStudioHistory.ts | read-full | hooks | FreshComponentsFeatures | none |
| site/hooks/Studio/useStudioKeyboardShortcuts.ts | read-full | hooks | FreshComponentsFeatures | none |
| site/hooks/useSectorTabs.ts | read-full | hooks | FreshComponentsFeatures | none |
