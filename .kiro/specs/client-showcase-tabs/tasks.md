# Implementation Plan: Client Showcase Tabs

## Overview

Implement a four-tab sector showcase on the existing `/clients` marketing page. The feature is entirely compile-time: a static TypeScript registry drives RSC and client components; no new route, no database, no new package is introduced. Implementation proceeds in dependency order: types → data layer → hook → leaf RSC components → composite client components → page integration → static assets → tests → i18n.

---

## Tasks

- [ ] 1. Types and data layer

  - [ ] 1.1 Create `site/lib/clients/clientTypes.ts`
    - Define and export `SectorTabId`, `SectorTabMeta`, `ClientRecord`, and `LogoApprovalRecord` interfaces exactly as specified in the design document
    - All four types must be named exports; no default exports
    - _Requirements: 1.1, 1.2, 3.1, 5.1, 7.2_
    - _Validates: P1, P2, P8_

  - [ ] 1.2 Create `site/lib/clients/clientRegistry.ts` — constants and registry array
    - Export the `SECTOR_TABS: SectorTabMeta[]` constant with all four entries in the required order and with the exact label strings from the requirements IA table
    - Declare `CLIENT_REGISTRY: ClientRecord[]` containing all 87 source-inventory entries; every entry must have `published: false` and a `// @review` comment
    - Add `// @review` comments matching all nine Initial Review Cue rows from Requirement 5.7 on the relevant entries (Tata Motors / Tata Motors Limited duplicate cue; TVS Limited, Bharti Airtel Limited, DMI repeated-entry cues; Dalmia DSP PO, Itian Limited, Bihar State Pul Nirman Nigam Limited, Bharti Nxtra Limited, June Elevators unclear-identity cues)
    - All `logoPath` fields absent — no logos committed until Logo Approval Records are created
    - _Requirements: 1.1, 1.4, 5.1, 5.3, 5.7, 4.1, 4.4_
    - _Validates: P1, P4, P8, P13_

  - [ ] 1.3 Add `getPublishedRecords` and `getGroupedRecords` to `clientRegistry.ts`
    - `getPublishedRecords()` filters `CLIENT_REGISTRY` to `published === true` entries only
    - `getGroupedRecords()` groups published records by `sectorTab`, applies `Intl.Collator('en-IN')` sort on `displayName` with `canonicalId` as tiebreaker, and returns `Record<SectorTabId, ClientRecord[]>`
    - All four sector keys must always be present in the returned object (empty array for tabs with no published records)
    - _Requirements: 1.2, 1.4, 1.6, 5.5, 6.1, 6.2_
    - _Validates: P2, P4, P9, P10_

- [ ] 2. Core keyboard hook

  - [ ] 2.1 Create `site/hooks/useSectorTabs.ts`
    - Implement roving-focus pattern: only `activeTab` has `tabIndex={0}`; all others have `tabIndex={-1}`
    - `getTabProps(tab, index)` returns `{ role: 'tab', id, 'aria-selected', 'aria-controls', tabIndex, onKeyDown, onClick }`
    - `getTabListProps()` returns `{ role: 'tablist' }`
    - `getPanelProps(tab)` returns `{ role: 'tabpanel', id, 'aria-labelledby', hidden }`
    - Keyboard transitions: ArrowRight moves focus forward with wrap 3→0; ArrowLeft moves focus backward with wrap 0→3; Home moves to index 0; End moves to index 3; Enter/Space activates the focused tab (sets `activeTab`); Tab exits the tablist naturally — none of these keys change `activeTab` except Enter/Space
    - Export the `UseSectorTabsReturn` interface alongside the hook
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
    - _Validates: P5_

- [ ] 3. Leaf RSC components

  - [ ] 3.1 Create `site/components/site/clients/ClientLogoArea.tsx`
    - Props interface: `{ displayName: string; logoPath?: string }`
    - When `logoPath` is present: render `<img>` with `object-contain`, `onError` handler that sets local `imgFailed` state, and falls back to Logo Fallback on error (`useState` required — must render inside a client boundary)
    - When `logoPath` is absent or `imgFailed` is true: render Logo Fallback — a `bg-[var(--surface-muted)]` surface containing initials derived from `getInitials(displayName)` per the two-word algorithm in the design
    - Implement `getInitials` as a named export for testability: single-word → first two chars uppercased; multi-word → first chars of first two words uppercased
    - Logo area wrapper must use `relative aspect-[3/2] w-full`
    - _Requirements: 3.2, 3.3, 3.4_
    - _Validates: P6_

  - [ ] 3.2 Create `site/components/site/clients/ClientCard.tsx`
    - Props interface: `{ record: ClientRecord }`
    - Render `<article>` with `aria-label` derived from `record.displayName`
    - Compose `<ClientLogoArea>` with `displayName` and `logoPath` from the record
    - Render `record.displayName` as visible text content (truncated single line via `truncate`)
    - Apply card container classes: `group relative border border-[var(--border-soft)] rounded-lg overflow-hidden bg-[var(--surface-card)] transition-shadow hover:shadow-[var(--shadow-lift)]`
    - _Requirements: 3.1, 3.6, 3.7_
    - _Validates: P6, P7_

- [ ] 4. Composite client-boundary components

  - [ ] 4.1 Create `site/components/site/clients/SectorTabButton.tsx`
    - Props interface: `{ tab: SectorTabMeta; isSelected: boolean; tabProps: ReturnType<UseSectorTabsReturn['getTabProps']>; ref?: React.Ref<HTMLButtonElement> }`
    - Spread `tabProps` onto a `<button>` element
    - Apply `min-h-[44px] min-w-[44px] px-4 py-2.5` for WCAG 44px target size
    - Apply `focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2` for visible focus indicator
    - Apply `shrink-0 whitespace-nowrap` for mobile scroll row; use `selected` styling to distinguish active tab
    - _Requirements: 2.1, 2.7, 2.8_
    - _Validates: P5_

  - [ ] 4.2 Create `site/components/site/clients/ClientTabPanel.tsx`
    - Props interface: `{ tab: SectorTabMeta; records: ClientRecord[]; panelProps: ReturnType<UseSectorTabsReturn['getPanelProps']> }`
    - Spread `panelProps` (including `hidden` attribute) onto the panel `<div>`
    - When `records.length > 0`: render an auto-sizing grid `grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 md:gap-6` containing one `<ClientCard>` per record
    - When `records.length === 0`: render the empty-sector state — `<div role="status" aria-live="polite">` containing the i18n empty-sector message with `tab.label` interpolated
    - _Requirements: 1.6, 6.3, 6.4, 6.5, 8.3_
    - _Validates: P7, P11_

  - [ ] 4.3 Create `site/components/site/clients/SectorTabList.tsx`
    - Props interface: `{ tabs: SectorTabMeta[]; activeTab: SectorTabId; onSelect: (id: SectorTabId) => void }`
    - Call `useSectorTabs` and spread `getTabListProps()` onto the list container
    - Render one `<SectorTabButton>` per tab; pass `getTabProps(tab, index)` and `isSelected` to each
    - Container: `flex overflow-x-auto snap-x md:flex-wrap md:overflow-visible gap-2` for mobile-scroll / desktop-wrap behavior
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.9_
    - _Validates: P5_

  - [ ] 4.4 Create `site/components/site/clients/ClientShowcase.tsx`
    - Mark `'use client'` at top of file
    - Props interface: `{ grouped: Record<SectorTabId, ClientRecord[]>; tabs: SectorTabMeta[] }`
    - Initialize `activeTab` state to `'financial-services'`
    - Render `<SectorTabList>` and one `<ClientTabPanel>` per tab (all panels rendered, each receiving its `panelProps` with `hidden` managed by the hook)
    - _Requirements: 1.1, 2.1, 2.6_
    - _Validates: P1, P5, P11_

- [ ] 5. Page-level RSC wrapper and integration

  - [ ] 5.1 Create `site/components/site/clients/ClientShowcaseSection.tsx`
    - Named RSC export; no `'use client'` directive
    - Call `getGroupedRecords()` synchronously (no `await`) and pass the result to `<ClientShowcase>`
    - Outer `<section>`: `w-full overflow-x-hidden section-y-sm` with an accessible landmark label
    - Inner container: `shell-container` FOCSS utility (max 1680px, centered)
    - Render a section `<h2>` heading using the i18n section-heading key
    - Render `<ClientShowcase grouped={grouped} tabs={SECTOR_TABS} />`
    - _Requirements: 8.1, 8.2, 8.4, 8.5_
    - _Validates: P14_

  - [ ] 5.2 Integrate `ClientShowcaseSection` into `ClientsPageView`
    - Modify `site/features/site/clients/ClientsPageView.tsx`
    - Import `ClientShowcaseSection` from `@/components/site/clients/ClientShowcaseSection`
    - Add a new `<HomeSection variant="white" spacing="sm">` block containing `<HomeSectionInner><ClientShowcaseSection /></HomeSectionInner>` immediately after the existing case-studies `HomeSection`
    - No other changes to `ClientsPageView`; preserve existing import order and all unrelated markup
    - _Requirements: 8.1_
    - _Validates: P14_

- [ ] 6. Static assets directory

  - [ ] 6.1 Create `site/public/images/clients/README.md`
    - Create the directory `site/public/images/clients/` by placing a `README.md` inside it
    - Content: note that logo files for the client registry go here, each file named after `canonicalId`, and that a Logo Approval Record must exist and have status `Approved for Web Display` before any file is committed; no logo files are committed now
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 7. Checkpoint — verify data layer and hook before tests
  - Ensure `site/lib/clients/clientTypes.ts`, `site/lib/clients/clientRegistry.ts`, and `site/hooks/useSectorTabs.ts` are coherent TypeScript with no type errors.
  - Ensure all 87 registry entries are present, all have `published: false`, and all nine review-cue entries carry `@review` comments.
  - Ask the user if questions arise before proceeding to tests.

- [ ] 8. Unit and property-based tests

  - [ ] 8.1 Write tests for `clientRegistry.ts` — constants and filtering
    - Test file: `tests/unit/lib/clients/clientRegistry.test.ts`
    - Unit test: `SECTOR_TABS` has length 4 and labels equal the exact IA sequence (exhaustive constant check)
    - Property test (fast-check): for any generated `ClientRecord[]` with varying `sectorTab`, `getGroupedRecords()` places every published record in exactly one group matching its `sectorTab` — no record absent, none duplicated across groups
    - Example test: fixture containing `published: true` State Bank of India record appears only in `'financial-services'`
    - Property test (fast-check): every record with `published: false` is absent from all groups returned by `getGroupedRecords()`
    - Tag each test with `// Feature: client-showcase-tabs, Property N: <text>` as per the design
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
    - _Validates: P1, P2, P3, P4_

  - [ ] 8.2 Write tests for `clientRegistry.ts` — ordering and deduplication
    - Test file: `tests/unit/lib/clients/clientRegistry.test.ts` (same file, additional `describe` block)
    - Property test (fast-check): for any permutation of the same published `ClientRecord[]`, `getGroupedRecords()` returns the same ordered sequence in each tab (en-IN collation on `displayName`, `canonicalId` as tiebreaker)
    - Property test (fast-check): for any generated registry where multiple records share the same `canonicalId`, `getGroupedRecords()` for the matching tab returns at most one entry per unique `canonicalId`
    - _Requirements: 5.5, 6.1, 6.2_
    - _Validates: P9, P10_

  - [ ] 8.3 Write model-based tests for `useSectorTabs`
    - Test file: `tests/unit/lib/hooks/useSectorTabs.test.ts` (use `renderHook` from `@testing-library/react`)
    - Enumerate all 4 × 6 = 24 combinations of focused-tab index (0–3) × key (`ArrowRight`, `ArrowLeft`, `Home`, `End`, `Enter`, `Space`)
    - Assert exact `focusedIndex` after each Arrow/Home/End transition; assert `activeTab` unchanged
    - Assert `activeTab` equals focused tab after Enter/Space; assert `focusedIndex` unchanged
    - Assert `tabIndex` assignment: only active tab gets `tabIndex={0}`, all others get `tabIndex={-1}`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
    - _Validates: P5_

  - [ ] 8.4 Write component tests for `ClientLogoArea`
    - Test file: `tests/unit/components/site/clients/ClientLogoArea.test.tsx`
    - With `logoPath` present and image load success: `<img>` rendered; fallback not rendered
    - With `logoPath` absent: fallback initials rendered; no `<img>` element
    - Simulate `onError` on `<img>`: fallback renders; `<img>` removed from output; card-level wrapper stays in DOM
    - Unit test `getInitials`: single word → first two chars; multi-word → first chars of first two words; all uppercase
    - _Requirements: 3.2, 3.3, 3.4_
    - _Validates: P6_

  - [ ] 8.5 Write component tests for `ClientCard`
    - Test file: `tests/unit/components/site/clients/ClientCard.test.tsx`
    - `aria-label` on the card article equals `record.displayName`
    - Visible text content contains the full `displayName`
    - _Requirements: 3.6, 3.7_
    - _Validates: P6_

  - [ ] 8.6 Write component tests for `ClientTabPanel`
    - Test file: `tests/unit/components/site/clients/ClientTabPanel.test.tsx`
    - When given zero records: empty-sector state element present; `tab.label` appears in the message
    - When given zero records: all four `SectorTabButton` elements remain present and not `disabled` (render full `ClientShowcase` with one empty sector)
    - Property test (fast-check): for any generated mixture of records with and without `logoPath`, the set of rendered `aria-label` values on card articles equals the set of `displayName` values of the published records passed to the panel
    - _Requirements: 6.3, 6.4, 6.5_
    - _Validates: P7, P11_

- [ ] 9. Playwright browser checks

  - [ ] 9.1 Create `tests/e2e/clients-showcase-keyboard.spec.ts`
    - At viewport widths 320, 768, and 1024px: navigate to `/clients`
    - Tab into the tab list; confirm focus lands on Financial Services tab
    - ArrowRight through all four tabs; confirm focus wraps from Corporates & Multinationals back to Financial Services
    - Press Enter on Education, Social Impact & Development; confirm that tab panel becomes active
    - Confirm each full tab label is visible (not clipped by overflow)
    - Confirm focused tab has a visible ring (`focus-visible` style present)
    - Confirm no horizontal page scrollbar at 768px and 1024px; the 320px mobile scroll row is allowed within the section
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_
    - _Validates: P12_

  - [ ] 9.2 Create `tests/e2e/clients-showcase-layout.spec.ts`
    - At viewport widths 320, 768, 1280, 1440, and 1920px: navigate to `/clients`
    - Assert `document.documentElement.scrollWidth === window.innerWidth` (no horizontal page scrollbar)
    - Assert `ClientShowcaseSection` is horizontally centered: left offset equals right offset (within 1px)
    - Assert no `ClientCard` or tab element overflows the container boundary (bounding rect right ≤ container right)
    - Assert auto-sizing grid column count increases from 320px through 1920px with no trailing empty columns wider than one card (check rendered column count via `getComputedStyle`)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
    - _Validates: P14_

- [ ] 10. i18n string keys

  - [ ] 10.1 Add `clients.showcase` namespace to `site/i18n/messages/en.json`
    - Add the following two keys under a new `"clients"` → `"showcase"` path (merge with existing `"clients"` key if one already exists):
      - `"sectionHeading"`: `"Our Clients"`
      - `"emptySector"`: `"No published clients in {sector} yet."`
    - Keep all existing keys unchanged; add only the new namespace
    - _Requirements: 6.3_

- [ ] 11. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; the empty-sector i18n string and the component rendering will still work because the message can be hard-coded temporarily.
- Every registry entry starts as `published: false`; the showcase renders correctly with an empty tab for every sector until a Content Reviewer flips individual entries to `published: true`.
- No new packages are introduced; `fast-check@4.9.0` is already in `devDependencies`.
- Tests tagged `// Feature: client-showcase-tabs, Property N: <text>` allow the test runner to filter by property ID.
- The `shell-container` FOCSS utility (1680px max-width, centered) is the established repo maximum for marketing content — wider than `max-w-screen-xl` (1280px) but consistent with the header chrome gutter.
- `ClientLogoArea` uses `useState` for the `imgFailed` flag and therefore must remain inside the client boundary provided by `ClientShowcase`.
- All component files under `site/components/site/clients/` use named exports only.
- All hook files under `site/hooks/` use `useFeatureName.ts` naming.
- Property test iterations minimum: 100 per property (fast-check default).

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "2.1"] },
    { "id": 3, "tasks": ["3.1", "3.2", "10.1"] },
    { "id": 4, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 5, "tasks": ["4.4"] },
    { "id": 6, "tasks": ["5.1", "6.1"] },
    { "id": 7, "tasks": ["5.2"] },
    { "id": 8, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6"] },
    { "id": 9, "tasks": ["9.1", "9.2"] }
  ]
}
```
