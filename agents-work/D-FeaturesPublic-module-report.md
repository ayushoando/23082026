# D-FeaturesPublic — Module-Wise Review

**Slice:** `site/features` (208) + `site/public` (1392) = **1600 files**
**Baseline (frozen pre-output):** 4096 files workspace-wide — 4095 tracked + 1 untracked (`plans/repository-suggestions.md`) via `git -C D:/23082026 ls-files --cached --others --exclude-standard` at freeze point; 7 generated report outputs in `agents-work/` excluded from coverage; transient scratch `*.txt` (alldirs.txt, dirs7.txt, either.txt, has01.txt, has1.txt) were agent-created and deleted — not reviewed repository inputs.
**Repo:** D:/23082026 (HEAD `fdef1ba`) — Next.js 16.3.3 / React 19.2.8 / TS 7
**Reviewers:**  (features 208) &  (public 1392)

---

## 1. Manifest

**Manifest frozen pre-report at 4096 (4095 tracked + 1 pre-existing untracked plans/repository-suggestions.md); 7 generated report outputs in agents-work/ excluded from coverage; transient scratch *.txt (alldirs.txt, dirs7.txt, either.txt, has01.txt, has1.txt) were agent-created/removed — not reviewed repository inputs.**

```
git -C D:/23082026 ls-files --cached --others --exclude-standard -- site/features site/public | sort
```

**Count: 1600** (208 features + 1392 public). Zero untracked files inside these prefixes.

### Composition

| Group | Files |
|---|---|
| `site/features/site` | 77 |
| `site/features/admin` | 66 |
| `site/features/shared` | 41 |
| `site/features/crm` | 16 |
| `site/features/Planner` | 5 |
| `site/features/Studio` | 2 |
| `site/features/ops` | 1 |
| **features subtotal** | **208** |
| `site/public/assets/catalog` | 1134 |
| `site/public/assets/marketing` | 155 |
| `site/public/assets/others` | 86 |
| `site/public` root + `.well-known` + `images/clients` | 17 |
| **public subtotal** | **1392** |

### Public by asset type

| Ext | Files | Bytes |
|---|---:|---:|
| webp | 1248 | 204,475,534 |
| otf | 40 | 2,672,652 |
| ttf | 24 | 1,952,558 |
| woff2 | 18 | 735,780 |
| png | 21 | 837,014 |
| jpg | 20 | 438,397 |
| svg | 8 | 117,640 |
| ico | 3 | 5,973 |
| woff | 1 | 46,916 |
| js/json/md/txt/xml/webmanifest | 8 | 9,175 |
| **Total** | **1392** | **211,291,639** |

---

## 2. Cluster Summaries

### 2.1 site/features/shared — auth, API contract, shell (41 files)

**Strengths.** withAuth resolves identity and roles before handlers, rejects missing users, and keeps development bypass host-gated. Server actions call the shared admin guard and rate limiter. Auth, dashboard, entry, catalog, quote, and shell boundaries remain explicit.

**Findings.** No defect remained after full read of all 41 files.

**Six-month guidance.** Add contract tests for missing identity, insufficient role, invalid CSRF, and disallowed bypass hosts. Keep new actions behind the same guard and rate-limit sequence.

### 2.2 site/features/admin — catalog, pricing, dashboards, workstation (66 files)

**Strengths.** Pinned quote calculations resolve against the pinned price-book version and propagate unavailable SKUs. Catalog REST and server-action paths converge on shared handlers; destructive catalog removal is an archive. Admin forms validate at the action boundary.

**Findings.** No grounded defect remained after full read.

**Six-month guidance.** Preserve the pinned-version invariant with a version-advance regression test. Require every admin action to invoke authorization and rate limiting before domain work.

### 2.3 site/features/site — customer-facing feature code (77 files)

**Strengths.** Catalog/PDP, planner landing, portal, contact, assistant, SEO/data, and route helpers have explicit boundaries. Numeric helpers defend malformed dimensions and image/plan-SVG fallbacks are centralized.

**Findings.** C-06 below: the exported calculator misses runtime validation used by sibling helpers.

**Six-month guidance.** Validate route, persisted, and imported values before calculators. Add tests for unknown preset IDs, non-finite dimensions, and unavailable media.

### 2.4 site/features/crm — CRM state and transitions (16 files)

**Strengths.** Client deletion clears dependent project references, project deletion cascades quotes, and demo seed/state transitions are explicit. Route and metrics modules keep derivations separate from mutations.

**Findings.** No actionable defect remained after full read.

**Six-month guidance.** Add invariant tests for delete cascades and persisted-store rehydration. Document demo-vs-production data boundaries.

### 2.5 site/features/Planner, site/features/Studio, and site/features/ops (8 files)

**Strengths.** Planner and Studio layouts are forked and do not import one another. The operations page stays behind its route-level access path.

**Findings.** No defect remained after full read.

**Six-month guidance.** Keep fork-boundary checks in CI and smoke-test direct editor navigation and denied operations access.

### 2.6 `site/public` (1392 files, 211,291,639 bytes)

All 1,392 frozen public paths were processed. Seventeen UTF-8 text/support files were opened fully. The remaining 1,375 binaries were checked for non-zero size, extension/header consistency, SHA-256, and format decodability; 1,292 raster images were decoded and dimensions recorded. Three `.ico` paths are failed because each is a 1,991-byte PNG mislabeled as ICO. The binary inventory contains 26 SHA-256 duplicate groups covering 54 files; the largest validated raster is 3,718,668 bytes at `site/public/assets/catalog/seating/mesh/oando-seating--flex/image-6.webp`.

---

## 3. Findings

### C-01 — P1 — Define Studio semantic text colors

**Path and range:** site/focss/studio/base/semantic.css:10-11.

text-strong and text-body both reference color-pure-black, but no owned FOCSS file defines that custom property. Studio document and control rules consume these roles without fallbacks, so declarations become invalid at computed-value time and color falls back to inheritance on every Studio paint. Use existing defined ink roles (color-ink-900 for strong and color-ink-800 for body), or define the missing palette token in the Studio-reachable palette.

### C-02 — P2 — Supply or remove the Planner Inter font variable

**Path and range:** site/focss/planner/base/layout.css:9-10.

Both Planner font stacks begin with font-inter, but no owned CSS file defines it and the self-contained Planner entry does not import the site's runtime font layer. Because the unresolved var() makes the entire font-family declaration invalid at computed-value time, Planner falls back to inherited or initial typography, including numeric readouts derived from font-sans. Either mount a real font-inter variable for Planner or remove it from both declarations.

### C-03 — P1 — Stop the permanent ruler animation loop

**Paths and ranges:** site/components/Planner/PlannerRulers.tsx:115-123; site/components/Studio/StudioRulers.tsx:115-123.

Each mounted ruler schedules a new requestAnimationFrame from its callback forever. draw resizes and clears both backing canvases and iterates tick marks every frame despite no self-animation, consuming continuous CPU/paint budget in both editors. The effect also depends on unused offset; Planner supplies a fresh object literal, causing teardown/recreation on parent renders. Remove the unconditional loop and redraw on actual Fabric/viewport/resize changes; remove the unused dependency/prop or memoize the caller value.

### C-04 — P2 — Hide Studio ruler decoration from assistive technology

**Path and range:** site/components/Studio/StudioRulers.tsx:130-133.

Studio renders the ruler corner and two canvas elements without aria-hidden, while the equivalent Planner fork marks all three decorative elements hidden. Assistive-technology traversal of /oostudio can therefore encounter unlabeled decorative graphics. Add aria-hidden=true to the corner and both canvases, matching Planner.

### C-05 — P2 — Reject non-finite NumberStepper input

**Path and range:** site/components/ui/NumberStepper.tsx:51-54.

The controlled number input passes Number(e.target.value) directly through clamp. While a browser is editing intermediate strings such as -, 1e, or ., conversion yields NaN; Math.max/Math.min preserve it, so parent state receives a non-finite value. Downstream dimensions, quantities, or prices can then become NaN, while the component displays an empty field. Ignore empty/intermediate non-finite values or retain a separate draft string before invoking the numeric callback.

### C-06 — P2 — Guard unknown density preset IDs

**Path and range:** site/features/site/tools/spaceCalculator.ts:126-130.

calculateSpace indexes DENSITY_PRESETS[input.presetId] and immediately dereferences preset.circulationRatio; an unrecognised runtime ID yields undefined and throws. isDensityPresetId and sibling numeric helpers defend invalid values, but this exported boundary is not. A malformed URL, persisted state, or import can crash the feature rather than return a safe result. Validate the ID and return a documented fallback or typed validation error before dereferencing.

### P-A1 — Correct mislabeled favicon assets (P2)

`site/public/favicon.ico`, `site/public/assets/favicon.ico`, `site/public/assets/marketing/brand/logos/favicon.ico`

Binary validation measured each path as a 1,991-byte PNG with header `89504e470d0a1a0a0000000d49484452`, not an ICO container. A server selecting `image/x-icon` from the `.ico` suffix can send a mismatched content type/body pair, causing favicon decoders or caches to reject the response. Rename to `.png` and update references, or encode valid ICO containers at these exact paths. All three share SHA-256 prefix `7fe61366b4282d15…`.

### P-A2 — Consolidate duplicate public binaries (P3)

`site/public/**`

SHA-256 over all 1,375 public binaries measured 26 duplicate groups covering 54 files; the set includes three identical `icon-512.png` paths and repeated catalog images under alternate names. The duplicate bytes increase clone/CDN transfer and allow path-dependent branding. Select canonical paths, remove or redirect duplicates, and add a duplicate-hash check to the asset pipeline.

## 4. Advisor Guidance — Feature-code priorities (six-month view)

1. **P1 — fix C-03:** replace both ruler RAF loops with redraws driven by Fabric/viewport/resize changes and remove unused offset dependencies.
2. **P1 — fix C-01:** align Studio semantic text roles with defined ink tokens, then add token-resolution verification to verify:focss.
3. **P2 — fix C-05 and C-06:** reject non-finite numeric edits and validate calculator preset IDs at the exported boundary; add focused contract tests.
4. **P2 — fix C-04 and C-02:** restore Studio ruler aria-hidden and either provide Planner Inter through next/font or remove the dead variable.
5. Keep Planner/Studio fork parity explicit with a recurring diff and document intentional hook capability differences before adding shared abstractions.

## 4A. Public-asset guidance (prioritized six-month view)

1. **P2 — Correct P-A1 before the next asset deployment:** choose valid ICO containers or rename and update every favicon reference; verify MIME/header agreement at the CDN.
2. **P3 — Consolidate P-A2 within the next quarter:** retain one canonical copy per SHA-256 group and add CI checks for duplicate hashes and extension/header mismatches.
3. **Within six months:** add an asset manifest check that validates dimensions, decodability, and path references after every catalog export; keep large WebP derivatives below the agreed performance budget.

## 5. Intentionally Excluded (Ignored) — Reconciliation

Workspace ignored total: **100,271** files via
`git ls-files --others --ignored --exclude-standard`.

| Path | Files | Reason (`.gitignore`) |
|---|---|---|
| `node_modules/` | 91,212 | Generated dependencies — installed from lockfile, never authored |
| `site/.next/` | 8,425 | Next.js build output, regenerated on every build |
| `site/tsconfig.tsbuildinfo` | 1 | TS incremental build cache |
| `results/` | 410 | Local tool dumps |
| `generated-documents/` | 180 | tech-docs generator output |
| `tech-docs-generator/` | 34 | Local generator build |
| `.commandcode/` | 3 | Harness metadata |
| `.vercel/` | 2 | Deploy metadata |
| `tests/`, `config/`, `site/`, `.env.local`, `skills-lock.json` | 5 | Build artifacts and local secrets |

All are generated dependencies or build artifacts. Coverage in this report is
over the **frozen 4096-file manifest** (4095 tracked + 1 untracked), not the ignored tree. Transient scratch files are excluded from the frozen input; 7 generated reports in `agents-work/` are excluded from coverage.

---

---

## 6. Coverage and evidence ledger

The frozen 1,600-path slice is fully enumerated in the two appendices below: 208 feature-code paths and 1,392 public paths, with no duplicate, missing, or unexpected path within this slice. All 208 feature-code inputs were opened fully and recorded `read-full` by `FreshComponentsFeatures`.

Public validation recorded 17 UTF-8 support files as `read-full`, 1,372 successfully checked binaries as `binary-validated`, and three failed binaries. The failures are exact, reproducible extension/header mismatches: each `.ico` is a 1,991-byte PNG beginning `89504e470d0a1a0a0000000d49484452`.

### Failed public inputs

- `site/public/favicon.ico` — extension/header mismatch (`.ico` suffix, PNG signature).
- `site/public/assets/favicon.ico` — extension/header mismatch (`.ico` suffix, PNG signature).
- `site/public/assets/marketing/brand/logos/favicon.ico` — extension/header mismatch (`.ico` suffix, PNG signature).

Because three inputs failed binary validation, this slice is **partial**; the appendices retain the failures rather than treating them as reviewed successfully. Public binary checks covered existence, non-zero size, extension/header consistency, SHA-256 duplicate grouping, and supported raster decoding with dimensions.

## Appendix A — Feature-code per-file review ledger (208 inputs)

| path | status | module | reviewer | finding IDs |
|---|---|---|---|---|
| site/features/Planner/layout.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/Planner/page.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/Planner/projects/[id]/page.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/Planner/projects/page.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/Planner/starterProjectTemplate.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/Studio/layout.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/Studio/page.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/analytics/AdminAnalyticsPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/api/adminActionGuards.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/api/adminCatalogClient.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/api/catalogAdminHandlers.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/catalog/AdminCatalogAssetPreview.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/catalog/AdminCatalogEditorDrawer.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/catalog/AdminCatalogListView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/catalog/AdminCatalogManager.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/catalog/AdminCatalogPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/catalog/AdminCatalogTable.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/catalog/AdminProductFamilyForm.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/catalog/ConfiguratorCatalogPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/catalog/adminCatalogManagerUtils.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/catalog/adminCatalogSearchParams.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/catalog/catalogItemActions.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/catalog/configuratorCatalogFormSchema.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/catalog/productFamilyContract.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/catalog/releasedCatalogContract.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/catalog/standardCatalogFormSchema.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/dashboard/AdminDashboardPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/dashboard/AdminEntryHero.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/dashboard/adminEntryContent.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/design-kit/DesignKitPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/feature-flags/AdminFeatureFlagsPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/feature-flags/updateFeatureFlags.server.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/feature-flags/updateFeatureFlagsAction.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/inventory/AdminInventoryPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/plans/AdminPlanDetailPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/plans/AdminPlansPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/plans/adminPlansSearchParams.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/plans/plannerAdminLinks.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/pricing/AdminPriceBookPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/pricing/data/price-books/_price-book-audit.jsonl | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/pricing/data/price-books/pb-linear-2026-q3.json | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/pricing/emitPriceBookContract.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/pricing/fixtures/linear-desk-2026-q3.json | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/pricing/plannerPricingAuthority.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/pricing/priceBookAdmin.server.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/pricing/priceBookContract.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/pricing/priceBookDrizzleStore.server.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/pricing/priceBookFileStore.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/pricing/priceBookGovernance.server.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/pricing/priceBookGovernance.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/pricing/priceBookService.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/pricing/quotePriceBookPin.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/pricing/resolveWorkspaceCommercialPricing.server.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/settings/AdminSettingsPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/ui/AdminAlert.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/ui/AdminFocssField.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/ui/AdminFormFields.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/ui/AdminHubLinkCard.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/ui/AdminKpiLink.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/ui/AdminLayoutShell.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/ui/AdminLoadingPanel.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/ui/AdminPanelCard.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/ui/adminMobileReview.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/ui/adminNav.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/workspace-catalog/AdminWorkspaceCatalogPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/workspace-config/workspaceConfigurationAudit.server.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/workspace-config/workspaceConfigurationEnvelope.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/workspace-config/workspaceConfigurationRepository.server.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/workstation/WorkstationFamilyAuthorFields.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/workstation/workstationFamilyAuthor.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/workstation/workstationFamilyContract.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/workstation/workstationFamilyDrive.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/admin/workstation/workstationFamilyRelease.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/crm/ClientsView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/crm/CrmDemoBanner.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/crm/CrmHubView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/crm/CrmSubnav.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/crm/CrmWorkspaceBanner.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/crm/ProjectDetailView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/crm/ProjectsView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/crm/QuotesView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/crm/businessStats.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/crm/contactSurfaces.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/crm/crmAdminUi.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/crm/crmMetrics.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/crm/crmRoutes.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/crm/crmUi.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/crm/stores/crmDemoSeed.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/crm/stores/crmStore.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/ops/CustomerQueriesOpsPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/analytics/index.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/analytics/types.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/api/ApiError.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/api/apiResponse.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/api/readApiErrorMessage.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/api/routeObservability.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/api/schemas.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/api/withAuth.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/auth/components/AuthControls.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/auth/components/AuthShell.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/auth/components/LoginPage.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/auth/components/ResendVerificationButton.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/auth/components/SignupPage.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/auth/components/SuspendedPage.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/auth/index.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/auth/lib/AuthProvider.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/auth/lib/humanizeAuthError.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/auth/lib/session.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/auth/lib/useDocumentTitle.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/auth/types.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/catalog/catalogAssetStorage.server.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/catalog/index.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/catalog/productFamilyContract.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/catalog/productFamilyPersistence.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/catalog/releasedCatalogProductContract.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/catalog/types.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/components/GuestBadge.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/components/RestrictedActionButton.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/crm/index.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/crm/types.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/dashboard/DashboardClient.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/dashboard/workspaceHub.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/entry/AccessPage.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/entry/ChooseProductPage.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/entry/OpenAssistantButton.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/entry/ProductEntryPage.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/quotes/index.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/quotes/types.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/shell/GlobalNavHeader.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/shell/MemberSuiteShell.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/shared/shell/memberSuiteRoutes.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/advisor/aiAdvisor.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/assistant/AdvancedBot.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/assistant/DynamicBotWrapper.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/assistant/UnifiedAssistant.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/catalog/CatalogLastUpdated.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/catalog/CategoryCatalogMotionShell.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/catalog/CategoryListingHero.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/catalog/CategoryPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/catalog/FilterGrid.components.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/catalog/FilterGrid.helpers.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/catalog/FilterGrid.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/catalog/FilterGridInner.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/catalog/InlinePlanSymbolPreview.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/catalog/ProductViewer.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/clients/ClientsPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/compare/ComparePageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/contact/createCustomerQuery.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/contact/customerQuerySchema.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/contact/submitContactAction.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/aboutPage.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/assistant.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/brand.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/careerJobs.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/careerPage.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/categoryFaqs.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/clientLogos.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/clientWorkPhotos.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/clientsPage.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/contact.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/contactPage.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/downloadsPage.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/fallbacks.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/heroCarousel.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/homepage.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/htmlSitemap.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/legalPage.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/localCatalogIndex.json | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/marketing.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/navigation.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/planningPage.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/productSuite.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/productsPage.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/proof.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/routeChromeRules.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/routeClassification.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/routeCopy.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/routeMetadata.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/seo.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/servicePage.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/showroomsPage.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/siteSeoContract.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/solutionsPage.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/support.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/sustainabilityPage.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/data/trustedByPage.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/offline/OfflinePageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/planSvg/resolvePdpPlanSvgThumb.server.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/planSvg/resolvePdpPlanSvgThumb.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/planner/help/PlannerHelpPage.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/planner/help/helpSections.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/planner/landing/PlannerBreadcrumbs.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/planner/landing/PlannerFeatureDemo.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/planner/landing/PlannerFeaturePageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/planner/landing/PlannerFeaturesHubPage.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/planner/landing/PlannerFloorplanHero.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/planner/landing/PlannerLandingPage.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/planner/landing/PlannerLayoutGraphic.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/planner/landing/PlannerSuite.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/planner/landing/plannerFeaturePages.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/planner/landing/plannerLandingData.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/planner/landing/plannerLandingIcons.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/portal/GuestPortalPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/portal/PortalPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/portal/PortalPlanPageView.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/portal/PortalShell.tsx | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/portal/plannerProjectListing.ts | read-full | feature-code | FreshComponentsFeatures | none |
| site/features/site/tools/spaceCalculator.ts | read-full | feature-code | FreshComponentsFeatures | C-06 |

## 7. Verdict

| Field | Value |
|---|---|
| **overall_correctness** | `incorrect` |
| **confidence** | 0.96 |
| **explanation** | The complete 1,600-path slice is represented in the feature-code and public-asset appendices. Six grounded feature findings (C-01–C-06) and two measured public-asset findings (P-A1–P-A2) remain actionable; three public favicon inputs failed the required extension/header check and are explicitly retained as failed rather than counted as validated. **Coverage is partial until those three binaries are corrected or accepted.** |

## 8. Appendix — Report Outputs Excluded from Coverage

Generated by this review, excluded from the 4096 frozen source baseline
(7 outputs across all D-* slices):

- `agents-work/D-FeaturesPublic-module-report.md` (this file)
- `agents-work/D-AppRoutes-module-report.md`
- `agents-work/D-ComponentsFocss-module-report.md`
- `agents-work/D-LibPlatform-module-report.md`
- `agents-work/D-RootMeta-module-report.md`
- `agents-work/D-ScriptsInfra-module-report.md`
- `agents-work/D-Tests-module-report.md`

None fall under `site/features` or `site/public`.

### Slice reconciliation (frozen)

| Slice | Count |
|---|---|
| D-AppRoutes | 174 |
| D-ComponentsFocss | 364 |
| D-LibPlatform | 503 |
| **D-FeaturesPublic** | **1600** |
| D-Tests | 932 |
| D-ScriptsInfra | 1769 |
| D-RootMeta | 146 |
| **Total** | **4096** |


## Appendix B — Public-asset per-file evidence (1392 inputs)

Each frozen `site/public/**` path appears exactly once. `read-full` denotes complete UTF-8 text reading; `binary-validated` denotes successful binary checks; `failed` records the exact header mismatch listed in P-A1.

| path | status | module | reviewer | finding IDs |
|---|---|---|---|---|
| `site/public/.well-known/security.txt` | read-full | `site/public` | D-ScriptsInfra | none |
| `site/public/BingSiteAuth.xml` | read-full | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/brand/placeholder.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/collaborative/oando-collaborative--cocoon-pod/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/collaborative/oando-collaborative--cocoon-pod/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/collaborative/oando-collaborative--cocoon-pod/image-21.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/collaborative/oando-collaborative--cocoon-pod/image-27.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/collaborative/oando-collaborative--cocoon-pod/image-33.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/collaborative/oando-collaborative--cocoon-pod/image-73.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/collaborative/oando-collaborative--cocoon-pod/image-8.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/collaborative/oando-collaborative--nuvora-pod/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/collaborative/oando-collaborative--nuvora-pod/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/collaborative/oando-collaborative--nuvora-pod/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/collaborative/oando-collaborative--solace-pod/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--academia/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--academia/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--academia/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--academia/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--audi-chair/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--audi-chair/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--audi-chair/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--audi-chair/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--classcraft/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--classcraft/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--classcraft/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--classcraft/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--connecta/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--connecta/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--connecta/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--connecta/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--forma/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--forma/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--forma/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--learnix/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--learnix/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--learnix/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--learnix/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--magazine-rack/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--magazine-rack/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--magazine-rack/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--magazine-rack/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--metal-bed/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--metal-bed/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--metal-bed/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--performer/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--performer/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--performer/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--performer/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--podium/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--podium/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--podium/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--podium/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--wooden-bed/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--wooden-bed/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--wooden-bed/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--wooden-bed/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--xplorer/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--xplorer/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--xplorer/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/educational/oando-educational--xplorer/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/flagship/categories/soft-seating.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/flagship/categories/storages.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/flagship/categories/tables.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/flagship/categories/workstations.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/products/dauble paper tray.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/products/imported/workstations-copy/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/products/imported/workstations-copy/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/products/imported/workstations-copy/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/products/imported/workstations-copy/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/products/imported/workstations-copy/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/products/imported/workstations-copy/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/products/imported/workstations-copy/image-8.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/products/imported/workstations-copy/image-9.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--cafe-sleek/cafe_high_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/cafe/oando-seating--cafe-sleek/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/cafe/oando-seating--cafe-sleek/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva-high/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva-high/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva-high/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva-high/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva-high/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva-high/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva-high/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva-high/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva-high/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva-high/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva-high/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva-high/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva/686d3b55385e7b905b01d3a5_69271916dc242830c5bd1bd3_caneva_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--caneva/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--casca/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/cafe/oando-seating--casca/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/cafe/oando-seating--casca/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/cafe/oando-seating--casca/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/cafe/oando-seating--casca/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--casca/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--casca/image-8.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--casca/image-9.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fusion/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fusion/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fusion/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fusion/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fusion/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fusion/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fusion/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fusion/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fusion/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fusion/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fynn/686d3b55385e7b905b01d3a5_692af3e311e33e59fa4fc9a6_fynn_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fynn/image-02.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fynn/image-03.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fynn/image-04.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fynn/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fynn/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fynn/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fynn/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fynn/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fynn/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fynn/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--fynn/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--halo/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/cafe/oando-seating--halo/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--halo/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/cafe/oando-seating--halo/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/cafe/oando-seating--halo/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/cafe/oando-seating--halo/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/cafe/oando-seating--halo/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--halo/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--leaf/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--leaf/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--leaf/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--leaf/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--leaf/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--leaf/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--leaf/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--leaf/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--leaf/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--leaf/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--leaf/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--leaf/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lexus/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lexus/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lexus/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lexus/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lexus/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lexus/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lexus/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lexus/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lexus/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lexus/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lexus/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lisbo/image-04.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lisbo/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lisbo/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lisbo/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lisbo/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lisbo/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--lisbo/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--nordic/686d3b55385e7b905b01d3a5_68a31b177c1f6e1027de894f_nordic_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--nordic/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--nordic/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--nordic/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--nordic/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--nordic/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--nordic/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--nordic/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--nordic/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--nordic/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--nordic/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--nordic/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--nordic/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--rio/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--rio/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--rio/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--rio/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--rio/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--rio/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--rio/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--rio/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--rio/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--rio/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--rio/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--rio/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--smile/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--smile/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--smile/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--smile/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--smile/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--smile/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--smile/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--smile/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--smile/image-13.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--smile/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--smile/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--smile/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--smile/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--snap/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--snap/image-02.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/cafe/oando-seating--snap/image-03.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--snap/image-04.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--snap/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--snap/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--snap/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--snap/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--snap/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--snap/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/cafe/oando-seating--snap/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--zilo/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--zilo/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--zilo/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--zilo/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--zilo/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--zilo/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--zilo/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--zilo/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--zilo/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--zilo/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--zilo/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/cafe/oando-seating--zilo/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--arvo/1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--arvo/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--arvo/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--arvo/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--arvo/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--arvo/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--arvo/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--arvo/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--arvo/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--arvo/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--arvo/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--arvo/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--brim/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--brim/image-02.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/fabric/oando-seating--brim/image-03.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--brim/image-04.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--brim/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--brim/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--brim/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--brim/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--brim/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--brim/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/fabric/oando-seating--brim/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--brim/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--canaret/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--canaret/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--canaret/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--canaret/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--canaret/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--canaret/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--canaret/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--canaret/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--canaret/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--canaret/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--canaret/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--canaret/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--copse/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--copse/image-02.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/fabric/oando-seating--copse/image-03.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--copse/image-04.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--copse/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--copse/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--copse/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--copse/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--copse/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--copse/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/fabric/oando-seating--copse/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--copse/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crotch/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crotch/image-02.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crotch/image-03.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crotch/image-04.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crotch/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crotch/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crotch/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crotch/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/fabric/oando-seating--crotch/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crotch/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/fabric/oando-seating--crotch/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crotch/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crotch/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crotch/image-13.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crox/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crox/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crox/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crox/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crox/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--crox/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--dive/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--dive/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--dive/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--dive/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--dive/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--dive/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--dive/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--dive/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--dive/image-13.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--dive/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--dive/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--dive/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--dive/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--ember/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--ember/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--ember/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--ember/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--ember/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--ember/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--ember/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--ember/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--ember/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--ember/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--ember/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--ember/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flare/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flare/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flare/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flare/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flare/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flare/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flare/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flare/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flare/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flare/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flare/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flip/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flip/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flip/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flip/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flip/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flip/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flip/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flip/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flip/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/fabric/oando-seating--flip/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--grace/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--grace/image-02.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/leather/oando-seating--grace/image-03.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--grace/image-04.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--grace/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--grace/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--grace/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--grace/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--grace/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--grace/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/leather/oando-seating--grace/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--grace/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--grace/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--grace/image-13.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--grace/image-14.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--moonlight/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--moonlight/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--moonlight/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--moonlight/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--moonlight/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--moonlight/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--moonlight/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--moonlight/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--moonlight/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--pinnacle/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--pinnacle/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--pinnacle/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--pinnacle/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--pinnacle/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--pinnacle/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--pinnacle/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--pinnacle/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--pinnacle/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--pinnacle/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--pinnacle/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--pinnacle/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--rider/686d3b55385e7b905b01d3a5_694bcf8096a17717780b2a15_rider_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--rider/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--rider/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--rider/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--rider/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--rider/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--rider/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--rider/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--rider/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--rider/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--rider/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/leather/oando-seating--rider/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--breeze/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--breeze/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--breeze/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--breeze/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--breeze/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--breeze/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--breeze/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--breeze/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--breeze/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--breeze/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--breeze/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--breeze/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--flex/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--flex/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--flex/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--flex/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--flex/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--flex/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--flex/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--flex/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--flex/image-13.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--flex/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--flex/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--flex/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--flex/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--flex/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--flex/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--flex/image-9.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid-x/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid-x/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid-x/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid-x/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid-x/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid-x/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid-x/image-14.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid-x/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid-x/image-20.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid-x/image-26.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid-x/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid-x/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid-x/image-43.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid-x/image-46.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid-x/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid-x/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid-x/image-9.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid/image-13.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid/image-14.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid/image-15.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid/image-16.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--fluid/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--logica/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--logica/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--logica/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--logica/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--logica/image-13.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--logica/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--logica/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--logica/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--logica/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--logica/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--myel/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--myel/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--myel/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--myel/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--myel/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--myel/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--myel/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--myel/image-13.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--myel/image-14.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--myel/image-17.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--myel/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--myel/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--myel/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--myel/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--myel/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--myel/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--nuvic/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--nuvic/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--nuvic/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--nuvic/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--nuvic/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--nuvic/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--nuvic/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--nuvic/image-13.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--nuvic/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--nuvic/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--nuvic/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--nuvic/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--nuvic/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--nuvic/image-9.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--orbit/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--orbit/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--orbit/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--orbit/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--orbit/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--orbit/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--orbit/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--orbit/image-13.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--orbit/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--orbit/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--orbit/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--orbit/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--orbit/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-13.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-14.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-15.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-26.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-27.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--phoenix/image-9.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--revoq/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--revoq/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--revoq/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--revoq/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--revoq/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--revoq/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--revoq/image-9.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--rock/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--rock/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--rock/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--rock/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--rock/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--rock/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--rock/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--rock/image-13.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--rock/image-14.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--rock/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--rock/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--rock/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--rock/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--rock/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--solace/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--solace/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--solace/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-03.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-04.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-13.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-14.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-15.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-19.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-20.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-23.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--spino/image-8.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sullion/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sullion/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sullion/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sullion/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sullion/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sullion/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sullion/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sullion/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sullion/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sullion/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sullion/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sullion/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sullion/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sullion/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sullion/image-8.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sullion/image-9.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-13.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-14.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-15.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-16.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-17.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-18.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-19.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-20.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-21.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-22.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-23.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-25.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-26.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-28.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-29.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-31.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--sway/image-9.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-03.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-04.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-05.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-13.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-14.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-15.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-16.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-17.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-18.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-19.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-20.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/mesh/oando-seating--toro/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--x-mesh/image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--x-mesh/image-08.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--x-mesh/image-09.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--x-mesh/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--x-mesh/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--x-mesh/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--x-mesh/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--x-mesh/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--x-mesh/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--x-mesh/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--x-mesh/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-seating--x-mesh/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/seating/mesh/oando-soft-seating--omnia/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/mesh/oando-soft-seating--omnia/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/seating/mesh/oando-soft-seating--omnia/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-seating--solace/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-seating--solace/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-seating--solace/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-seating--solace/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-seating--solace/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--accent/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--accent/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--accent/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--accent/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--accent/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--accent/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--accent/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--adam/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--adam/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--adam/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--adam/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--adam/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--adam/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--adam/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--adam/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--allure/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--alonzo/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--alonzo/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--alonzo/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--alonzo/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--alonzo/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--alonzo/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--arcana/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--arcana/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--arcana/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--arcana/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--arcana/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--arcana/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--arco/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--arco/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--arco/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--arco/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--armora/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--armora/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--armora/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--armora/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--armora/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--armora/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--armora/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--brim/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--brim/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--brim/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--brim/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--casca/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--casca/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--casca/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--casca/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--ceda/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--ceda/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--ceda/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--ceda/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--ceda/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--ceda/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cirq/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cirq/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cirq/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cirq/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cirq/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cirq/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cirq/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cirq/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cirq/image-8.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cirq/image-9.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cocoon/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cocoon/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cocoon/image-14.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cocoon/image-19.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cocoon/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cocoon/image-20.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cocoon/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cocoon/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cocoon/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cocoon/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cocoon/image-8.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cocoon/image-9.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--como/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--como/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--como/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--como/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--como/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cove/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cove/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cove/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cove/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cove/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cove/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cove/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--covea/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--covea/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--covea/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--covea/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--covea/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--covea/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--covea/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cozy/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cozy/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cozy/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cozy/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--cozy/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--crossa/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--crossa/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--crossa/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--crossa/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--crossa/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--crossa/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--eclips/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--eclips/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--eclips/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--eclips/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--eclips/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--eclips/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--eclips/image-8.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--embrace/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--embrace/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--embrace/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--embrace/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--embrace/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--esmor/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--esmor/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--esmor/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--esmor/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--esmor/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--fynn/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--fynn/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--fynn/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--fynn/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--fynn/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--grace/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--grace/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--grace/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--grace/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--grace/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--grace/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--grace/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--halo/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--halo/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--halo/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--halo/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--halo/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--high-cafe/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--high-cafe/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--high-cafe/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--hush/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--hush/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--hush/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--hush/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--lura/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--lura/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--lura/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--lura/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--lura/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--lura/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--margas/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--margas/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--margas/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--margas/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--mellow/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--mellow/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--moon/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--moon/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--moon/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--moon/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--moon/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--moon/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--moon/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--moon/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--nook/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--nook/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--nook/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--nook/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--nuvora/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--nuvora/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--nuvora/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--nuvora/image-22.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--nuvora/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--nuvora/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--nuvora/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--nuvora/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--nuvora/image-8.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--opera/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--opera/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--opera/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--opera/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--opera/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--opera/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--orb/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--orb/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--orb/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--orb/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--orb/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--orb/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--orb/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--padora/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--padora/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--padora/image-21.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--padora/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--padora/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--padora/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--padora/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--plumb/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--plumb/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--plumb/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--plumb/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--plumb/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--plumb/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--plumb/image-8.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--rattique/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--rattique/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--rattique/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--rattique/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--relax/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--relax/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--relax/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--relax/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--relax/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--spectrum/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--spectrum/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--spectrum/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--spectrum/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--spectrum/image-15.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--spectrum/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--spectrum/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--spectrum/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--spectrum/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--spectrum/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--spectrum/image-8.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--spectrum/image-9.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--trion/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--trion/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--trion/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--trion/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--trion/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--trion/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--velto/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--velto/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--velto/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--velto/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--velto/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--velto/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--verka/686d3b55385e7b905b01d3a5_6939802f2888fbf1adb26438_verka_1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--verka/686d3b55385e7b905b01d3a5_693980333cdae13ef3a5a392_verka_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--verka/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--verka/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--verka/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--verka/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--virello/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--virello/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--virello/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/soft-seating/oando-soft-seating--virello/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--accessories/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/storage/oando-storage--accessories/image-14.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--accessories/image-23.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--accessories/image-28.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--accessories/image-41.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--accessories/image-42.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--accessories/image-47.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--accessories/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/storage/oando-storage--accessories/image-51.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--accessories/image-52.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--accessories/image-9.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--compactor/686d3b55385e7b905b01d3a5_68a33d0e4e87f59cb2024410_compactor_1.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/storage/oando-storage--compactor/686d3b55385e7b905b01d3a5_68a33d1345008068da79673a_compactor_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--compactor/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/storage/oando-storage--compactor/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--compactor/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--compactor/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--heavy-duty-racks/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--heavy-duty-racks/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--heavy-duty-racks/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--heavy-duty-racks/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--heavy-duty-racks/racks_1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-locker/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-locker/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-locker/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-locker/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-locker/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-locker/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-pedestal/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-pedestal/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-pedestal/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-pedestal/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-pedestal/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-pedestal/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-storages/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-storages/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-storages/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-storages/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-storages/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-storages/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--metal-storages/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--pedestal/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--pedestal/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--pedestal/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--pedestal/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--pedestal/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--pedestal/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--prelam-locker/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--prelam-locker/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--prelam-locker/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--prelam-locker/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--prelam-locker/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--prelam-locker/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--prelam-locker/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--prelam-storage/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--prelam-storage/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--prelam-storage/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--prelam-storage/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--prelam-storage/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--prelam-storage/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--prelam-storage/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/storage/oando-storage--prelam-storage/image-8.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--apex/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--apex/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--consulate/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--consulate/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--consulate/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--convene/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--convene/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--convene/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--convene/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--convesso/686d3b55385e7b905b01d3a5_68ac09820580a18498c921c1_convesso.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--convesso/686d3b55385e7b905b01d3a5_68ac098849f11a71a090963b_convesso_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--convesso/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--convesso/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--convesso/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--convesso/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--convesso/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--crest/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--crest/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--crest/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--curvivo-meet/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--curvivo-meet/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--curvivo-meet/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--curvivo-meet/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--curvivo-meet/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--curvivo-meet/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--curvivo-meet/x_meet.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--curvivo-meet/x_meet_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--desk-meet/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--desk-meet/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--desk-meet/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--desk-meet/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--desk-meet/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--exquisite/686d3b55385e7b905b01d3a5_68ac094917fc68ec2512db40_exquisite.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--exquisite/686d3b55385e7b905b01d3a5_68ac095a49f11a71a090684a_exquisite_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--exquisite/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--exquisite/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--exquisite/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--impulse/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--impulse/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--impulse/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--impulse/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--inox/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--inox/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--inox/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--inox/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--letz-think/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--letz-think/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--letz-think/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--letz-think/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--letz-think/letz_think.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--letz-think/letz_think_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--modulus/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--modulus/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--modulus/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--modulus/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--nextable/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--nextable/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--nextable/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--nextable/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--opus-2/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--opus-2/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--opus-2/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--opus-2/inbox-opus.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--opus-2/inbox-opus_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--presidency/686d3b55385e7b905b01d3a5_68a2e46703f08bf146fecda9_presidency_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--presidency/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--presidency/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--presidency/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--presidency/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--presidency/side_unit_1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--presidency/side_unit_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--sleek-meet/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--sleek-meet/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--sleek-meet/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--sleek-meet/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--sleek-tab/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--sleek-tab/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--stake/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--stake/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--stake/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--stake/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--stake/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-10.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-11.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-12.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-13.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-14.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-15.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-16.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-17.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-18.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-19.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-20.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-21.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-22.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-23.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-24.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-25.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-8.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--uniflip/image-9.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--x-meet/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--x-meet/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--x-meet/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/tables/oando-tables--x-meet/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--adaptable/686d3b55385e7b905b01d3a5_69032603a8e79285af52415c_adaptable.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--adaptable/686d3b55385e7b905b01d3a5_6903260701d2bf979d2892e8_adaptable_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--adaptable/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--adaptable/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--adaptable/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--adaptable/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--adaptable/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--adaptable/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--adaptable/image-7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--curvivo/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--curvivo/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--curvivo/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--curvivo/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--curvivo/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--deskpro/686d3b55385e7b905b01d3a5_68a2e32607cc220a51bf8b9d_deskpro_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--deskpro/desk_meet.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--deskpro/desk_meet_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--deskpro/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--deskpro/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--deskpro/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--deskpro/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--deskpro/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--deskpro/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--fenix/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--fenix/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--fenix/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--fenix/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--fenix/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--honda-office/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--honda-office/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--panel-pro/686d3b55385e7b905b01d3a5_68a2e19ce6798d83eab6341c_panelpro_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--panel-pro/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--panel-pro/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--panel-pro/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--panel-pro/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--panel-pro/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--sleek/686d3b55385e7b905b01d3a5_68a2e2ecfb7309f199638de2_sleek_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--sleek/686d3b55385e7b905b01d3a5_68ac09a549f11a71a090b1bc_sleek_meet.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--sleek/686d3b55385e7b905b01d3a5_68ac09a949f11a71a090b349_sleek_meet_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--sleek/686d3b55385e7b905b01d3a5_68ac0a913ae62d06453da920_cafe_sleek_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--sleek/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--sleek/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--sleek/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--sleek/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--sleek/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--sleek/image-6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--tcs-workspace/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--tcs-workspace/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--tcs-workspace/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--trio-2/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--trio-2/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--trio-2/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--trio-2/trio_2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--x-bench/image-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--x-bench/image-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--x-bench/image-3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--x-bench/image-4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/catalog/workstations/oando-workstations--x-bench/image-5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/favicon.ico` | failed | `site/public` | D-ScriptsInfra | P-A1,P-A2 |
| `site/public/assets/icon-192.png` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/icon-512.png` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/assets/logo.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/Showroom/OneandOnly _showroom1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/Showroom/OneandOnly _showroom2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/Showroom/OneandOnly _showroom3.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/Showroom/OneandOnly _showroom4.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/Showroom/OneandOnly _showroom5.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/Showroom/OneandOnly _showroom6.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/Showroom/OneandOnly _showroom7.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/Showroom/OneandOnly _showroom8.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/brand/logos/favicon.ico` | failed | `site/public` | D-ScriptsInfra | P-A1,P-A2 |
| `site/public/assets/marketing/brand/logos/logo-sharp-white.png` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/brand/logos/logo-sharp.png` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/BSPHCL.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/JSW.png` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/Sonalika.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/ambuja-neotia.png` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/annapurna-finance.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/asian-paints-limited.svg` | read-full | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/bhel.svg` | read-full | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/bureau-of-indian-standards.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/canara-bank-limited.svg` | read-full | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/canara-bank.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/coca-cola.svg` | read-full | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/corporation-bank.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/cri-pumps.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/customs-and-central-excise.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/essel-utilities.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/fhi-360.png` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/franklin-templeton.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/gd-goenka.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/government-of-bihar.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/hdfc-limited.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/hyundai-limited.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/idbi-bank.png` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/income-tax-department.png` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/iocl.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/iocl.svg` | read-full | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/l-and-t-finance-limited.png` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/maruti-suzuki-limited.png` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/mecon-limited.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/paradeep-phosphates.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/shriram-commercial-vehicle-finance.png` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/siti-networks.png` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/state-bank-of-india.svg` | read-full | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/steel-authority-of-india-limited.png` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/survey-of-india.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/syndicate-bank-limited.png` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/tata-motors.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/tata-motors.svg` | read-full | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/titan-limited.png` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/ujjivan-small-finance-bank.jpg` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/union-bank-of-india.svg` | read-full | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/united-bank-limited.png` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/client-logos/usha-international-ltd.png` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/DMRC/IMG_20200612_123416.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/DMRC/IMG_20200612_175502.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/DMRC/dmrc-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/DMRC/dmrc-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/DMRC/dmrc-office-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/DMRC/dmrc-office-03.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/DMRC/dmrc-workspace-02.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/DMRC/dmrc.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/FranklinTempleton/franklin-templeton-office.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/FranklinTempleton/office-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/Govenment/government-hero.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/TVS/27-06-2025-Image-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/TVS/27-06-2025-Image-02-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/TVS/27-06-2025-Image-03.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/TVS/27-06-2025-Image-04.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/TVS/27-06-2025-Image-06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/TVS/27-06-2025-Image-07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/TVS/IMG-20200129-WA0036-Copy.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/TVS/hero-wide.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/TVS/hero.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/Titan/gallery-1688104539759_edited.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/Titan/gallery-1688105524557-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/Titan/hero.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/Titan/project-gallery-02.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/Titan/titan-gallery.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/Titan/titan-hero.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/Titan/titan-office.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/Usha/DSC_0077_edited.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/Usha/DSC_0080.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/clients/Usha/DSC_0111.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/pages/Other3-oneandonly-bright.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/pages/Other3-oneandonly.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/pages/Planner-oneandonly-bright.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/pages/Planner-oneandonly.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/pages/about-oneandonly-bright.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/pages/about-oneandonly.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/pages/contact-oneandonly-bright.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/pages/contact-oneandonly.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/pages/solutions-oneandonly-bright.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/slides/Dmrc-Oneandonly-bright.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/slides/Dmrc-Oneandonly.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/slides/Spare/titan-hero.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/slides/Spare/tvs-patna-hq.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/slides/TVS-Oneandonly-bright.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/slides/TVS-Oneandonly.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/slides/TVS2-Oneandonly-bright.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/slides/TVS2-Oneandonly.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/slides/TVS3-Oneandonly-bright.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/slides/TVS3-Oneandonly.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/slides/Titan-Oneandonly-bright.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/slides/Titan-Oneandonly.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/slides/Titan2-Oneandonly-bright.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/slides/Titan2-Oneandonly.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/slides/Usha-Oneandonly-bright.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/hero/slides/Usha-Oneandonly.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/DMRC/IMG_20200612_123416.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/DMRC/IMG_20200612_175502.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/DMRC/dmrc-1.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/DMRC/dmrc-2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/DMRC/dmrc-office-01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/DMRC/dmrc-office-03.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/DMRC/dmrc-workspace-02.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/DMRC/dmrc.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/FranklinTempleton/WhatsApp Image 2020-08-28 at 12.40.54 (1).webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/FranklinTempleton/franklin-templeton-office.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/Govenment/20140707_124458_compressed.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/TVS/27-06-2025 Image 01.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/TVS/27-06-2025 Image 02 (1).webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/TVS/27-06-2025 Image 03.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/TVS/27-06-2025 Image 04.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/TVS/27-06-2025 Image 06.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/TVS/27-06-2025 Image 07.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/TVS/IMG-20200129-WA0036 - Copy.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/TVS/edit this.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/TVS/tvs.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/Titan/project-gallery-02.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/Titan/snapedit_1688104539759_edited.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/Titan/snapedit_1688105524557 (1).webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/Titan/titan-gallery.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/Titan/titan-hero.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/Titan/titan-office.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/Usha/DSC_0077_edited.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/Usha/DSC_0080.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/projects/Usha/DSC_0111.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/team/portraits/arvind.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/team/portraits/ayush.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/ui/categories/education-clean.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/ui/categories/education-v2.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/ui/categories/education.nowm.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/ui/categories/education.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/ui/categories/seating-clean.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/ui/categories/seating.nowm.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/ui/categories/soft-seating-clean.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/ui/categories/soft-seating.nowm.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/ui/categories/storages-clean.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/ui/categories/storages.nowm.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/ui/categories/storages.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/ui/categories/tables-clean.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/ui/categories/tables.nowm.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/ui/categories/workstations-clean.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/ui/categories/workstations.nowm.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/marketing/ui/categories/workstations.webp` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/cisco-sans/CiscoSans-Bold.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/cisco-sans/CiscoSans-Bold.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/cisco-sans/CiscoSans-BoldOblique.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/cisco-sans/CiscoSans-ExtraLight.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/cisco-sans/CiscoSans-ExtraLightOblique.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/cisco-sans/CiscoSans-Heavy.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/cisco-sans/CiscoSans-HeavyOblique.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/cisco-sans/CiscoSans-Oblique.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/cisco-sans/CiscoSans-Thin.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/cisco-sans/CiscoSans-ThinOblique.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/cisco-sans/CiscoSans.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/cisco-sans/CiscoSans.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/Helvetica Neue 57 Condensed.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/Helvetica Neue Italic.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/Helvetica Neue Light.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/Helvetica Neue ME Bold.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/Helvetica Neue ME.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/Helvetica Neue Regular.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/Helvetica Neue Thin.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/Helvetica Neue UltraLight Italic.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/Helvetica Neue WGL.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaBlkIt.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-Black.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-BlackCond.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-BlackCondObl.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-BlackExt.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-BlackExtObl.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-Bold.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-Bold.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-BoldCondObl.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-BoldExt.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-BoldExtObl.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-Condensed.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-CondensedBlack.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-CondensedObl.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-ExtBlackCond.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-ExtBlackCondObl.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-Extended.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-ExtendedObl.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-Heavy.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-HeavyCond.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-HeavyCondObl.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-HeavyExt.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-HeavyExtObl.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-HeavyItalic.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-Light.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-LightCondObl.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-LightExt.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-LightExtObl.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-Medium.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-Medium.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-MediumCond.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-MediumCondObl.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-MediumExt.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-MediumExt.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-MediumExtObl.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-Roman.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-Roman.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-Thin.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-ThinCond.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-ThinCondObl.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-ThinExtObl.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-ThinItalic.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-UltraLigCond.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-UltraLigCondObl.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeue-UltraLigExt.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeueBlackCondensed.woff` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeueBlackCondensed.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeueBold.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeueBoldCondensed.woff2` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeueBoldItalic.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeueCondensedBlack.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeueCondensedBold.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeueItalic.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeueLight.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeueLightItalic.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeueMedium.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeueUltraLight.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/HelveticaNeueUltraLightItal.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/helvetica-46-light-italic-587ebdb0ea724.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/helvetica-47-light-condensed-587ebd7b5a6f6.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/helvetica-75-bold-outline-587ebe00b76ba.ttf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/fonts/helvetica-neue/helveticaneueltstd_blk.otf` | binary-validated | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/system/CONTENTS.md` | read-full | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/system/manifest.json` | read-full | `site/public` | D-ScriptsInfra | none |
| `site/public/assets/others/system/sw.js` | read-full | `site/public` | D-ScriptsInfra | none |
| `site/public/favicon.ico` | failed | `site/public` | D-ScriptsInfra | P-A1,P-A2 |
| `site/public/icon-192.png` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/icon-512.png` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/icon.png` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/images/clients/README.md` | read-full | `site/public` | D-ScriptsInfra | none |
| `site/public/llms.txt` | read-full | `site/public` | D-ScriptsInfra | none |
| `site/public/logo-v2.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/logo.webp` | binary-validated | `site/public` | D-ScriptsInfra | P-A2 |
| `site/public/security.txt` | read-full | `site/public` | D-ScriptsInfra | none |
| `site/public/site.webmanifest` | read-full | `site/public` | D-ScriptsInfra | none |
