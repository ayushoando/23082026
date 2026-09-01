# Design Document — Client Showcase Tabs

## Overview

Client Showcase Tabs adds a sectored client logo-and-name wall to the existing `/clients` marketing page. The feature is entirely client-content driven: a static TypeScript registry (`site/lib/clients/clientRegistry.ts`) holds published client records, a `'use client'` tab shell manages active-tab state and keyboard interaction, and the rest of the tree is React Server Components. No new route, no database, no new package.

The four Sector Tabs (Financial Services · Government & Public Sector · Education, Social Impact & Development · Corporates & Multinationals) are fixed by the requirements information architecture. Content is withheld until a Content Reviewer approves each record; the registry file is the enforcement point for that gate.

---

## Architecture

### Component responsibility map

```
ClientShowcaseSection          — RSC: page-level <section>, FOCSS zone wrapper, semantic landmark
  └─ ClientShowcase            — 'use client': owns activeTab state, passes handlers down
       ├─ SectorTabList        — 'use client': renders tab row, receives activeTab + onSelect + onKeyDown
       │    └─ SectorTabButton — RSC-like (rendered inside client boundary): individual tab button
       └─ ClientTabPanel       — RSC-like (rendered inside client boundary): panel for active tab
            └─ ClientCard      — RSC: one card per Published Client Record
                 └─ ClientLogoArea — RSC: logo img or Logo Fallback initials block
```

**Rendering strategy:**
- `ClientShowcaseSection` is a pure RSC export — it receives the full filtered record list from the data layer and passes it to `ClientShowcase`.
- `ClientShowcase` is the only stateful boundary (`'use client'`). It initializes `activeTab` to `'financial-services'` and passes `setActiveTab` down.
- `SectorTabList` lives inside the client boundary. It calls the `useSectorTabs` hook for roving-focus keyboard logic.
- `SectorTabButton`, `ClientTabPanel`, `ClientCard`, and `ClientLogoArea` are authored as named exports with no hooks — they render inside the client tree but contain no client-only logic themselves.

### Data flow

```
clientRegistry.ts (static module, import-time)
  ↓  getPublishedRecords()  →  grouped by SectorTabId
ClientShowcaseSection (RSC)
  ↓  passes { grouped: Record<SectorTabId, ClientRecord[]>, tabs: SectorTabMeta[] }
ClientShowcase ('use client')
  ↓  activeTab, handlers
SectorTabList + ClientTabPanel
```

No `fetch`, no `async` server action, no API route is introduced. The registry is a compile-time constant.

### File locations

| File | Kind | Role |
|---|---|---|
| `site/lib/clients/clientRegistry.ts` | Data module | Source of truth; exports `getPublishedRecords()`, `getGroupedRecords()`, `SECTOR_TABS` |
| `site/lib/clients/clientTypes.ts` | Types | `SectorTabId`, `ClientRecord`, `SectorTabMeta` |
| `site/hooks/useSectorTabs.ts` | Hook | Roving-focus keyboard logic |
| `site/components/site/clients/ClientShowcaseSection.tsx` | RSC | Page-level section wrapper |
| `site/components/site/clients/ClientShowcase.tsx` | Client | State + handler root |
| `site/components/site/clients/SectorTabList.tsx` | Client-boundary | Tab row; delegates keyboard to hook |
| `site/components/site/clients/SectorTabButton.tsx` | Client-boundary | Single tab button |
| `site/components/site/clients/ClientTabPanel.tsx` | Client-boundary | Tab panel |
| `site/components/site/clients/ClientCard.tsx` | Client-boundary | Client card |
| `site/components/site/clients/ClientLogoArea.tsx` | Client-boundary | Logo or fallback |
| `site/public/images/clients/` | Static assets | Logo files; absence triggers fallback |

### Page integration

The showcase is injected into the existing `ClientsPageView` (`site/features/site/clients/ClientsPageView.tsx`) as a new `HomeSection` block below the case-studies section. The `page.tsx` at `site/app/(site)/clients/page.tsx` is unchanged — no new route is created.

```tsx
// Inside ClientsPageView, after the case-studies HomeSection:
import { ClientShowcaseSection } from "@/components/site/clients/ClientShowcaseSection";

<HomeSection variant="white" spacing="sm">
  <HomeSectionInner>
    <ClientShowcaseSection />
  </HomeSectionInner>
</HomeSection>
```

`ClientShowcaseSection` calls `getGroupedRecords()` synchronously (static import, no `await`), so it does not need to be `async`.

---

## Components and Interfaces

### `SectorTabId` and `SectorTabMeta`

```ts
// site/lib/clients/clientTypes.ts

export type SectorTabId =
  | 'financial-services'
  | 'government-public-sector'
  | 'education-social-impact'
  | 'corporates-multinationals';

export interface SectorTabMeta {
  id: SectorTabId;
  label: string;         // Display label — must match requirements IA exactly
  panelId: string;       // "panel-<id>" — used for aria-controls / id
  tabId: string;         // "tab-<id>" — used for aria-labelledby / id
}

export interface ClientRecord {
  canonicalId: string;
  displayName: string;
  sectorTab: SectorTabId;
  logoPath?: string;     // Relative to /images/clients/; absent = fallback
  published: boolean;
}

export interface LogoApprovalRecord {
  logoAssetRef: string;
  sourceRef: string;
  rightsRef: string;
  approvalStatus: 'Approved for Web Display' | 'Not Approved' | 'Pending';
  approvalDate?: string;
  approvingReviewerId?: string;
}
```

### `SECTOR_TABS` constant

```ts
// site/lib/clients/clientRegistry.ts (excerpt)

export const SECTOR_TABS: SectorTabMeta[] = [
  {
    id: 'financial-services',
    label: 'Financial Services',
    panelId: 'panel-financial-services',
    tabId: 'tab-financial-services',
  },
  {
    id: 'government-public-sector',
    label: 'Government & Public Sector',
    panelId: 'panel-government-public-sector',
    tabId: 'tab-government-public-sector',
  },
  {
    id: 'education-social-impact',
    label: 'Education, Social Impact & Development',
    panelId: 'panel-education-social-impact',
    tabId: 'tab-education-social-impact',
  },
  {
    id: 'corporates-multinationals',
    label: 'Corporates & Multinationals',
    panelId: 'panel-corporates-multinationals',
    tabId: 'tab-corporates-multinationals',
  },
];
```

The label string must match the requirements IA table exactly. The order is enforced by array position, not by sort.

### `getPublishedRecords` and `getGroupedRecords`

```ts
// site/lib/clients/clientRegistry.ts (excerpt)

export function getPublishedRecords(): ClientRecord[] {
  return CLIENT_REGISTRY.filter((r) => r.published);
}

export function getGroupedRecords(): Record<SectorTabId, ClientRecord[]> {
  const published = getPublishedRecords();
  const collator = new Intl.Collator('en-IN');
  const grouped = {} as Record<SectorTabId, ClientRecord[]>;

  for (const tab of SECTOR_TABS) {
    grouped[tab.id] = published
      .filter((r) => r.sectorTab === tab.id)
      .sort((a, b) => {
        const name = collator.compare(a.displayName, b.displayName);
        return name !== 0 ? name : a.canonicalId.localeCompare(b.canonicalId);
      });
  }
  return grouped;
}
```

Ordering is deterministic: primary key is `displayName` via `en-IN` collation; secondary key is `canonicalId` lexicographic. This satisfies Requirement 6.1 and property P10.

### `useSectorTabs` hook

```ts
// site/hooks/useSectorTabs.ts (interface)

interface UseSectorTabsOptions {
  tabs: SectorTabMeta[];
  initialTab?: SectorTabId;
}

interface UseSectorTabsReturn {
  activeTab: SectorTabId;
  focusedIndex: number;
  setActiveTab: (id: SectorTabId) => void;
  getTabProps: (tab: SectorTabMeta, index: number) => {
    role: 'tab';
    id: string;
    'aria-selected': boolean;
    'aria-controls': string;
    tabIndex: number;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onClick: () => void;
  };
  getTabListProps: () => { role: 'tablist' };
  getPanelProps: (tab: SectorTabMeta) => {
    role: 'tabpanel';
    id: string;
    'aria-labelledby': string;
    hidden: boolean;
  };
}
```

Keyboard implementation: roving `tabIndex` pattern. Only the active tab has `tabIndex={0}`; all others have `tabIndex={-1}`. Arrow keys move `focusedIndex` and call `focus()` on the button ref — focus moves without changing `activeTab` until Enter/Space is pressed. Home moves to index 0, End to index 3, both wrapping as specified. This satisfies Requirement 2.2–2.6.

### `ClientShowcase` props interface

```ts
interface ClientShowcaseProps {
  grouped: Record<SectorTabId, ClientRecord[]>;
  tabs: SectorTabMeta[];
}
```

### `SectorTabList` props interface

```ts
interface SectorTabListProps {
  tabs: SectorTabMeta[];
  activeTab: SectorTabId;
  onSelect: (id: SectorTabId) => void;
}
```

### `SectorTabButton` props interface

```ts
interface SectorTabButtonProps {
  tab: SectorTabMeta;
  isSelected: boolean;
  tabProps: ReturnType<UseSectorTabsReturn['getTabProps']>;
  ref?: React.Ref<HTMLButtonElement>;
}
```

### `ClientTabPanel` props interface

```ts
interface ClientTabPanelProps {
  tab: SectorTabMeta;
  records: ClientRecord[];
  panelProps: ReturnType<UseSectorTabsReturn['getPanelProps']>;
}
```

### `ClientCard` props interface

```ts
interface ClientCardProps {
  record: ClientRecord;
}
```

### `ClientLogoArea` props interface

```ts
interface ClientLogoAreaProps {
  displayName: string;
  logoPath?: string;
}
```

---

## Data Models

### Registry structure

The `CLIENT_REGISTRY` array in `clientRegistry.ts` is the Client Content Registry. It holds all records including unpublished and review-required ones. Only records with `published: true` are surfaced publicly.

Each entry maps to the full `ClientRecord` interface. The registry is the single maintainable source; logo paths are relative to `site/public/images/clients/`. Absent `logoPath` means no approved logo → Logo Fallback is rendered.

### Logo Fallback initials algorithm

```ts
function getInitials(displayName: string): string {
  const words = displayName.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
```

The Logo Fallback is a neutral `bg-[var(--surface-muted)]` surface with the two-letter initials centered. It is rendered in `ClientLogoArea` when `logoPath` is absent or when the `<img>` fires an `onError` event (Requirement 3.3–3.4).

### Content Review Queue (non-public)

Review queue membership is enforced by the `published: false` flag. Records with `published: false` never pass through `getPublishedRecords()` and therefore never appear in any Tab Panel (Requirement 1.4–1.5). The initial review cues table (Requirement 5.7) is captured as `// @review` comments in the registry source for each affected entry.

---

## Layout and Wide-Viewport Containment (Requirement 8)

### Container strategy

The project's existing FOCSS `shell-container` utility (`max-width: 1680px`, `margin-inline: auto`, horizontal padding that steps from `1.5rem` to `var(--container-padding-desktop)` at `md`) is used as the inner wrapper. This is wider than the suggested `max-w-screen-xl` (1280px) but is the established repo maximum for marketing content and keeps the showcase consistent with the header chrome gutter.

At 1920px, the `shell-container` stays at 1680px wide and auto-margins center it — satisfying Requirement 8.2 and P14.

```
<section class="w-full overflow-x-hidden section-y-sm">   ← ClientShowcaseSection
  <div class="shell-container">                            ← inner container, centered, max 1680px
    <h2 .../>                                              ← section heading
    <SectorTabList .../>                                   ← tab row
    <ClientTabPanel .../>                                  ← active panel
  </div>
</section>
```

### Tab row layout

- Mobile (< 768px): `flex overflow-x-auto snap-x` — horizontally scrollable with each tab fully visible through scroll; no horizontal page bleed because the row is inside `overflow-x-hidden`.
- Tablet and above (≥ 768px): `flex flex-wrap gap-2` — tabs wrap within the container; no overflow.
- Every tab button: `shrink-0 min-w-0 whitespace-nowrap` on mobile; `whitespace-normal` on desktop when labels may wrap.

This satisfies Requirement 2.9 and Requirement 8.4.

### Client Card grid

```html
<div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 md:gap-6">
```

No per-breakpoint column counts anywhere in component markup. `auto-fill` + `minmax(160px,1fr)` means:
- At 320px: ~2 columns (2 × 140px + gap ≈ 300px)
- At 768px: ~4 columns
- At 1280px: ~7 columns
- At 1680px (container max): ~9 columns

Columns fill available width naturally; no trailing empty columns wider than one card because `auto-fill` packs tracks. This satisfies Requirement 8.3 and P14.

### Overflow containment

The outer `<section>` uses `w-full overflow-x-hidden`. All child elements use `min-w-0` on flex/grid children to prevent intrinsic-size bleed. Cards use `overflow-hidden` on the card container. This satisfies Requirement 8.4 and Requirement 2.10.

---

## ARIA and Keyboard Pattern (Requirement 2)

### Roles and attributes

```
<div role="tablist">
  <button
    role="tab"
    id="tab-financial-services"
    aria-selected="true"
    aria-controls="panel-financial-services"
    tabIndex={0}
  >Financial Services</button>
  ...
</div>
<div
  role="tabpanel"
  id="panel-financial-services"
  aria-labelledby="tab-financial-services"
>
  ...cards...
</div>
```

Hidden panels are rendered to the DOM with `hidden` attribute (not `display:none` via CSS class) so that screen readers do not announce hidden panel content. This satisfies Requirement 2.1.

### Roving focus map

| Key | Focus moves to | Active tab changes? |
|---|---|---|
| ArrowRight | next tab (wraps 3→0) | No |
| ArrowLeft | prev tab (wraps 0→3) | No |
| Home | tab 0 | No |
| End | tab 3 | No |
| Enter / Space | — | Yes — selects focused tab |
| Tab | next focusable element outside tablist | — |

This maps precisely to Requirement 2.2–2.6 and P5.

### Target size

Every `SectorTabButton` has `min-h-[44px] min-w-[44px] px-4 py-2.5` ensuring the WCAG 2.2 Level AA 44×44 CSS pixel target size (Requirement 2.7). This exceeds the repo's 24px floor and meets the 44px advisory for primary controls.

### Focus indicator

Selected and focused tabs receive a visible outline using `focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2`. This satisfies Requirement 2.8.

---

## Client Card Design

### Visual structure

```
┌─────────────────────────────────────┐
│  [3:2 ratio logo area]              │
│   <img object-contain> OR           │
│   <div initials fallback>           │
├─────────────────────────────────────┤
│  Display name (truncated, 1 line)   │
└─────────────────────────────────────┘
```

Tailwind classes:
- Card container: `group relative border border-[var(--border-soft)] rounded-lg overflow-hidden bg-[var(--surface-card)] transition-shadow hover:shadow-[var(--shadow-lift)]`
- Logo area wrapper: `relative aspect-[3/2] w-full bg-[var(--surface-muted)] flex items-center justify-center p-3`
- Logo `<img>`: `object-contain w-full h-full`
- Fallback surface: `absolute inset-0 flex items-center justify-center bg-[var(--surface-muted)]`
- Fallback initials: `text-sm font-medium text-[var(--text-muted)] select-none`
- Display name: `px-3 py-2 text-xs font-medium text-[var(--text-body)] truncate`

The card's `aria-label` is derived from `displayName` (Requirement 3.6). The display name is rendered as visible text content (Requirement 3.7).

### Logo error handling

`ClientLogoArea` holds a `useState` flag `imgFailed`. The `<img>` has `onError={() => setImgFailed(true)}`. When `imgFailed` is true, the Logo Fallback replaces the image. Since `ClientLogoArea` uses `useState` it must render inside the client boundary (provided by `ClientShowcase`). This satisfies Requirement 3.4.

---

## Error Handling

| Scenario | Handling |
|---|---|
| `logoPath` absent from registry | `ClientLogoArea` renders Logo Fallback immediately (no img attempt) |
| `logoPath` present but image load fails | `onError` sets `imgFailed = true`; Logo Fallback rendered; card remains |
| Selected tab has zero Published Client Records | `ClientTabPanel` detects empty array and renders empty-sector state with tab name |
| All tabs empty | Each tab still renders its empty-sector state; all tabs remain selectable |
| Registry import error at build time | TypeScript compilation fails — caught at build, never reaches runtime |

Empty-sector state markup:

```tsx
<div role="status" aria-live="polite" className="py-12 text-center">
  <p className="text-sm text-[var(--text-muted)]">
    No published clients in {tab.label} yet.
  </p>
</div>
```

This satisfies Requirement 6.3–6.4 and P11.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

This feature is primarily UI rendering with a small pure-data layer (`getGroupedRecords`). PBT applies to the data-layer functions (ordering, grouping, filtering) and to the `useSectorTabs` keyboard state machine. UI rendering properties are verified via Vitest component tests and Playwright browser checks.

### Property 1: Sector tab sequence is always exactly four in the fixed order

*For any* call to `SECTOR_TABS`, the returned array has length 4 and the labels equal `['Financial Services', 'Government & Public Sector', 'Education, Social Impact & Development', 'Corporates & Multinationals']` in that order.

**Validates: Requirements 1.1**
**Test type:** Unit test (constant — no variation needed; single example is exhaustive)

---

### Property 2: Every published record appears in exactly one tab panel

*For any* generated `CLIENT_REGISTRY` containing records with varying `sectorTab` values, `getGroupedRecords()` produces a map where every published record appears in exactly one group matching its `sectorTab`, and no published record is absent or duplicated across groups.

**Validates: Requirements 1.2, 1.6**
**Test type:** Property-based test (Vitest + fast-check; generate arrays of `ClientRecord` with random `sectorTab` values)

---

### Property 3: State Bank of India appears only in Financial Services

*For any* registry that contains a published record with `displayName = 'State Bank of India'`, `getGroupedRecords()['financial-services']` contains that record and no other group does.

**Validates: Requirements 1.3**
**Test type:** Example test (concrete fixture)

---

### Property 4: Review-required records are excluded from all public groups

*For any* generated registry, every record with `published: false` is absent from all values of `getGroupedRecords()`.

**Validates: Requirements 1.4, 1.5**
**Test type:** Property-based test (fast-check; generate mixed published/unpublished arrays)

---

### Property 5: Keyboard state machine produces correct transitions

*For each* focused tab index from 0 through 3, and for each key in `{ArrowRight, ArrowLeft, Home, End, Enter, Space}`, the `useSectorTabs` hook produces the `focusedIndex` and `activeTab` transitions specified in Requirement 2.

**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6**
**Test type:** Model-based Vitest test (renderHook; enumerate all 4 × 6 = 24 combinations; assert exact outputs)

---

### Property 6: Logo presence determines logo vs fallback, never removes card

*For any* generated `ClientRecord`, `ClientLogoArea` renders an `<img>` element when `logoPath` is present and image load succeeds, renders the initials fallback when `logoPath` is absent or image load fails, and the `ClientCard` remains in the DOM in both cases.

**Validates: Requirements 3.2, 3.3, 3.4**
**Test type:** Vitest component tests (render with logoPath; render without; simulate onError)

---

### Property 7: Partial-logo tabs render the full published set

*For any* generated mix of records where some have `logoPath` and some do not, the rendered Canonical Client ID set in a `ClientTabPanel` equals the set of published records assigned to that tab.

**Validates: Requirements 3.5**
**Test type:** Property-based Vitest test (fast-check; generate arrays of records; render panel; compare rendered `aria-label` set to expected set)

---

### Property 8: Submitted names are stored byte-for-byte

*For any* string added to `CLIENT_REGISTRY` as `submittedName`, reading that field back from the registry entry returns the identical string with no transformation.

**Validates: Requirements 5.1**
**Test type:** Unit test (registry source review + static assertion at import time; no transformation code exists in the data path)

---

### Property 9: Canonical ID merge produces one card per canonical ID

*For any* generated registry in which multiple `ClientRecord` entries share the same `canonicalId`, `getGroupedRecords()` for the corresponding tab contains exactly one entry per unique `canonicalId`.

**Validates: Requirements 5.5**
**Test type:** Property-based Vitest test (fast-check; generate records with intentional `canonicalId` collisions)

---

### Property 10: Client card order is stable under record permutation

*For any* permutation of the same Published Client Records array, `getGroupedRecords()` returns the same ordered sequence in every tab panel (en-IN collation on `displayName`, then `canonicalId`).

**Validates: Requirements 6.1, 6.2**
**Test type:** Property-based Vitest test (fast-check; shuffle same array; assert sorted output is identical across permutations)

---

### Property 11: Empty tab shows empty-sector state, leaves all tabs selectable

*For any* valid `SectorTabId` with zero Published Client Records in that tab, the rendered `ClientTabPanel` contains the empty-sector state element and all four `SectorTabButton` elements remain present and not `disabled`.

**Validates: Requirements 6.3, 6.4**
**Test type:** Vitest component test (render with empty grouped data; assert empty-sector text; assert four tab buttons present)

---

### P12 and P14 — Browser checks (Playwright)

These properties are verified by Playwright browser checks, not Vitest component tests.

**P12** — At viewport widths 320, 768, and 1024px: keyboard user can Tab into the tab list, focus every Sector Tab with Arrow keys, and activate with Enter; each full tab label and each card `displayName` is available (not clipped by overflow); no horizontal page scrollbar (other than the 320px mobile tab row which is contained within the section); focused tab has a visible ring.

**P14** — At viewport widths 320, 768, 1280, 1440, and 1920px: `ClientShowcaseSection` is horizontally centered; `document.documentElement.scrollWidth` equals `window.innerWidth`; no card or tab overflows the container boundary; auto-sizing grid column count adjusts at each width with no trailing empty columns wider than one card.

**Validates: Requirements 2.2, 2.7–2.10, 8.1–8.5, P12, P14**

---

### P13 — Initial Review Queue content (example test)

Before any record is published, the Content Review Queue (represented as `published: false` registry entries with `@review` annotations) contains every entry from the Initial Review Cues table in Requirement 5.

**Validates: Requirements 5.7, P13**
**Test type:** Example test (import registry; assert each cue name from the table has a corresponding `published: false` record)

---

## Testing Strategy

### Unit and component tests (Vitest)

| Scope | What is tested |
|---|---|
| `clientRegistry.ts` | `getPublishedRecords`, `getGroupedRecords` ordering, grouping, de-duplication by `canonicalId`, empty-tab handling |
| `useSectorTabs` | All key transitions (model-based); focus wrap; `tabIndex` assignment |
| `ClientLogoArea` | Logo path present + load success → img rendered; logo absent → fallback; img `onError` → fallback |
| `ClientCard` | `aria-label` derived from `displayName`; display name text present |
| `ClientTabPanel` | Empty-sector state text; published records rendered; hidden panels not visible |
| `ClientShowcaseSection` | Tab count = 4; tab labels match IA |

Property-based tests use [fast-check](https://fast-check.io/) which is already in the test ecosystem. Each property test runs a minimum of 100 iterations. Tests are tagged with `// Feature: client-showcase-tabs, Property N: <text>` comments.

### Browser checks (Playwright)

Two Playwright checks cover P12 and P14 at the specified viewport widths. These are run as part of the existing `config/build/playwright.config.ts` harness:

- `tests/e2e/clients-showcase-keyboard.spec.ts` — keyboard navigation at 320/768/1024px
- `tests/e2e/clients-showcase-layout.spec.ts` — layout and overflow containment at 320/768/1280/1440/1920px

### What is not unit-tested

- WCAG conformance: stated; requires manual assistive-technology review.
- Visual appearance of focus ring: verified by browser check, not unit test.
- en-IN collation correctness for specific strings: deferred to Content Reviewer acceptance.
