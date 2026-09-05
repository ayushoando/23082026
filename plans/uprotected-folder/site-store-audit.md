# Site Client State Stores (`site/store/`) Architecture Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`site/store/`](file:///d:/23082026/site/store/)  
**Method:** Live file inspection of Zustand store declarations, fork boundary compliance, and coverage gate integration.

---

## 1. Store Inventory & Responsibilities

The application state architecture utilizes Zustand stores split strictly by application domain:

```
site/store/
├── Planner/
│   ├── plannerUiStore.ts      ← Viewport pan/zoom, active tool, selected canvas item, dockview state
│   └── plannerCatalogStore.ts ← Catalog item cache, search index, category filters, block descriptors
└── Studio/
    ├── studioUiStore.ts       ← 2D/3D mode switch, camera perspective, active swatch, autosave status
    └── studioCatalogStore.ts  ← Furniture templates, material palette registry, customization state
```

---

## 2. Platform Boundaries: Strict Fork Isolation

Per `AGENTS.md §3` and `oando-master`:
- **Studio and Planner are forked trees and must never share or cross-import state stores.**
- `site/store/Planner/` must never import from `site/store/Studio/` or `@studio/*`.
- `site/store/Studio/` must never import from `site/store/Planner/` or `@planner/*`.
- Verified in CI via `pnpm run scan:boundaries`.

---

## 3. Strict Gate Coverage Requirements

Stores represent critical business logic. In [`tests/vitest.config.ts`](file:///d:/23082026/tests/vitest.config.ts), store files are held to the strict release gate standard:
- **Lines:** 100%
- **Functions:** 100%
- **Statements:** 95%
- **Branches:** 95%

Any untested action or state branch fails the release gate.

---

## 4. Verification & Testing Commands

```powershell
# 1. Run fork boundary scanner
pnpm run scan:boundaries

# 2. Run unit tests for Planner stores
pnpm exec vitest run tests/unit/site/store/Planner/

# 3. Run unit tests for Studio stores
pnpm exec vitest run tests/unit/site/store/Studio/
```
