# Oando Subsystem Remediation Plan: Interactive Workspaces (Studio & Planner)

**File Target:** `plans/05092026/03-interactive-workspaces-studio-planner.md`  
**Governing Standard:** `AGENTS.md` (Authority floor: User instruction > live code/fresh command output > `AGENTS.md`)  
**Execution State:** **FROZEN / PLANNING ONLY** (`NO CODE CHANGE`, `NO AUTO IMPLEMENT`)  
**Methodology:** Strict Fork Isolation, Mathematical Scale Invariants, Fabric 7 Canvas Engine, Dockview Windowing, and Decoupled State Management.

---

## 1. Subsystem Overview & Architectural Split

Oando features two high-performance interactive 2D design workspaces:
1. **Planner (`/ooplanner`):** Architectural floor planner for commercial interior layout, space planning, walls, furniture blocks, and clearance zones.
2. **Studio (`/oostudio`):** Detailed furniture specification and 2D symbol configurator for parametric block authoring, materials, and catalog publishing.

```
┌────────────────────────────────────────────────────────────────────────┐
│             FORKED INTERACTIVE WORKSPACES TOPOLOGY                     │
├───────────────────────────────────┬────────────────────────────────────┤
│         Planner Subsystem         │          Studio Subsystem          │
│            (/ooplanner)           │            (/oostudio)             │
├───────────────────────────────────┼────────────────────────────────────┤
│ • site/features/Planner           │ • site/features/Studio             │
│ • site/components/Planner         │ • site/components/Studio           │
│ • site/lib/Planner                │ • site/lib/Studio                  │
│ • site/hooks/Planner              │ • site/hooks/Studio                │
│ • site/store/Planner              │ • site/store/Studio                │
│ • site/server/Planner             │ • site/server/Studio               │
│ • site/app/api/Planner            │ • site/app/api/Studio              │
│ • site/focss/planner/entry.css    │ • site/focss/studio/entry.css      │
├───────────────────────────────────┴────────────────────────────────────┤
│                STRICT BOUNDARY ISOLATION (ZERO IMPORTS)                │
│                  Enforced by scripts/scan-boundaries.mjs               │
├───────────────────────────────────┬────────────────────────────────────┤
│ Architectural Scale: 0.05 px/mm   │ Parametric Scale: 0.2 px/mm        │
│ (1 px = 20 mm; 1000mm = 50px)     │ (1 px = 5 mm; 1000mm = 200px)      │
├───────────────────────────────────┴────────────────────────────────────┤
│               Published Symbol PNG Contract (Shared Standard)          │
│        site/lib/catalog/planSymbolPngContract.ts (2.0 px/mm, 40mm pad) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Fork Boundary Isolation Rules

The Planner and Studio trees are **strictly forked**. Under no circumstances may a file in Planner import from Studio, or vice versa.

### Authority Anchors
Enforced by `scripts/scan-boundaries.mjs`:
- **Planner Anchors:**
  - `site/lib/Planner/plannerPalette.ts`
  - `site/lib/Planner/plannerTokens.ts`
  - `site/lib/Planner/plannerTypes.ts`
  - `site/server/Planner/plannerStore.ts`
- **Studio Anchors:**
  - `site/lib/Studio/studioPalette.ts`
  - `site/lib/Studio/studioTokens.ts`
  - `site/lib/Studio/studioTypes.ts`
  - `site/server/Studio/studioStore.ts`

### Boundary Enforcement Rules
1. **No Cross-Product Imports:** AST and regex import scanning rejects any import matching `@/components/Studio`, `@/lib/Studio`, `@/hooks/Studio`, `@/store/Studio`, `@/server/Studio` from within any Planner module (and inverse).
2. **Forbidden Shared Abstractions:** Neither app may introduce generic shared workspace abstractions that blur product lines. Shared furniture data is accessed only through `@/lib/catalog/` contracts.
3. **FOCSS Zone Isolation:** Planner styles must reside exclusively in `@focss/planner/entry.css`; Studio in `@focss/studio/entry.css`. Planner must never import `base/scan.css`.
4. **API Route Partitioning:** All endpoints are scoped strictly to `/api/Planner/*` and `/api/Studio/*`.

---

## 3. Scale Invariants & Catalog PNG Contract

Coordinate systems in 2D space planning require strict mathematical discipline to avoid visual distortion or rounding errors when converting between physical millimeters and screen pixels.

### Scale Invariants Table
| Entity | Scale (px/mm) | Inverted Scale (mm/px) | 1000 mm Equivalent | Primary Purpose |
|--------|---------------|------------------------|--------------------|-----------------|
| **Planner Workspace** | `0.05` | `20.0` | `50 px` | Floorplate overview, architectural walls, room layouts. |
| **Studio Workspace** | `0.20` | `5.0` | `200 px` | Detailed furniture design, parametric edge bevels, hardware placement. |
| **Plan Symbol Raster Contract** | `2.00` | `0.5` | `2000 px` | High-res catalog rasterization, print export, PDP top-down previews. |

### Plan Symbol PNG Specification (`site/lib/catalog/planSymbolPngContract.ts`)
```typescript
export const PLAN_SYMBOL_PX_PER_MM = 2 as const;
export const PLAN_SYMBOL_PAD_MM = 40 as const;
export const PLAN_SYMBOL_MIME = "image/png" as const;
export const PNG_CATALOG_PUBLIC_PATH = "/png-catalog" as const;
export const PLANNER_SYMBOLS_STORAGE_PREFIX = "planner-symbols" as const;

export const PLAN_SYMBOL_PNG_FIELD = {
  url: "planSymbolPngUrl",
  checksum: "planSymbolPngChecksum",
  mime: "planSymbolMime",
} as const;
```

- **Raster Math:**
  - Given physical dimensions $(W_{\text{mm}}, D_{\text{mm}})$:
  - $\text{Core Width (px)} = \text{round}(W_{\text{mm}} \times 2)$
  - $\text{Core Height (px)} = \text{round}(D_{\text{mm}} \times 2)$
  - $\text{Raster Width (px)} = \text{round}((W_{\text{mm}} + 2 \times 40) \times 2)$
  - $\text{Raster Height (px)} = \text{round}((D_{\text{mm}} + 2 \times 40) \times 2)$
- **Checksum & Integrity:** Each published symbol must compute a SHA-256 digest of the PNG buffer to guarantee cache immutability across CDNs.

---

## 4. Canvas Engine & Windowing Architecture

### Fabric.js 7 Engine
Both workspaces utilize a modernized Fabric 7 canvas wrapper:
- **Planner Canvas:**
  - Handles spatial layering: Background grid -> Wall paths -> Clearance polygons -> Furniture blocks -> Dimension lines -> Snap guides.
  - Snap grid: 50mm primary, 100mm secondary, 500mm architectural grid.
  - Collision detection: SAT (Separating Axis Theorem) bounding polygon checks to prevent overlapping architectural walls or furniture blocks without authorized clearance.
- **Studio Canvas:**
  - Handles component assemblies: Table top polygon -> Leg extrusions -> Hardware mounts -> Cable management channels.
  - Precise snapping to object vertices and midpoints.

### Dockview 8.2.0 Integration
Both `/ooplanner` and `/oostudio` employ Dockview 8.2.0 for modular window management:
- **Panels Supported:**
  - `LeftPanel`: Catalog drawer, item search, filter facets.
  - `CenterPanel`: Primary Fabric 7 canvas viewport.
  - `RightPanel`: Property inspector, dimensional inputs, material swatches.
  - `BottomPanel`: BOM (Bill of Materials) summary, pricing calculator, validation logs.
- **State Hydration:** Dockview layout serialized to `localStorage` under isolated keys: `oando:planner:dockview:v1` and `oando:studio:dockview:v1`.

---

## 5. State Management & Undo/Redo Architecture

Both applications use isolated Zustand stores with zero cross-talk:

### Planner Store (`site/store/Planner/`)
- `plannerProjectStore`: Current project metadata, floor level, units (metric mm).
- `plannerSceneStore`: Canvas entity graph (walls, rooms, furniture instances).
- `plannerHistoryStore`: Command pattern undo/redo stack (max 50 states) serializing differential mutations to minimize memory footprint.
- `plannerCatalogStore`: Cached catalog metadata and raster symbols loaded from Admin DB.

### Studio Store (`site/store/Studio/`)
- `studioDesignStore`: Current parametric model descriptor (primitives, parameters, constraints).
- `studioMaterialStore`: Active material libraries, finishes, textures.
- `studioPublishStore`: Validation state machine for publishing descriptors to the Admin DB catalog.

---

## 6. Verification & Boundary Testing Runbook

### Authorized Boundary Audit
```bash
# Verify zero cross-imports and valid namespace anchors
pnpm run scan:boundaries
```
*Expected Output:* Proves 0 boundary violations across all 10 destination roots.

### Unit & Integration Verification
```bash
# Run unit tests for Studio & Planner components
pnpm vitest run tests/unit/components/Studio/
pnpm vitest run tests/unit/components/Planner/
pnpm vitest run tests/unit/lib/catalog/planSymbolPngContract.test.ts
```

### Preflight Checks for Workspace Changes
1. Never import a utility or type across the `Planner` <-> `Studio` boundary.
2. If both need a mathematical utility, place it in an explicitly neutral location such as `site/lib/geometry/` or `site/lib/catalog/`.
3. Re-run `pnpm run scan:boundaries` before staging any workspace commit.
## Test reconciliation update (2026-09-05)

Map open3d, Planner and Studio specs to current implementations. Keep fork-specific helpers separate, compare overlapping comprehensive-audit assertions before consolidation, and replace missing-control skips when the control is required.

Acceptance: record current path, owner, destination/disposition, preserved assertions, affected commands, and evidence. A filename or age alone is insufficient grounds for retirement. Runtime validation remains pending; this update changes planning documents only.
