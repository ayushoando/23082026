# Site React Custom Hooks (`site/hooks/`) Architecture Audit

**Date:** 2026-09-04  
**Target:** [`site/hooks/`](file:///d:/23082026/site/hooks/)  
**Framework:** React 19 Custom Hooks  
**Footprint:** 18 Custom Hooks across `Planner/` (10), `Studio/` (7), and Root (1)

---

## Executive Summary

The [`site/hooks/`](file:///d:/23082026/site/hooks/) directory encapsulates all **client-side React lifecycle management, 2D/3D canvas coordination, keyboard shortcut listeners, and undo/redo history trees**. 

It is also the **sole location in application code where inline `react-hooks/exhaustive-deps` suppressions exist**, evading the CI `audit-eslint-disable.mjs` scanner because `site/hooks/` was historically omitted from the checked directories list.

```
site/hooks/ Subsystem Map:
├── Planner/                 # Floor Planner Custom Hooks (10 Hooks)
│   ├── usePlannerCanvasCore.ts       # 14.1 KB Primary 2D canvas event pipeline & object selection
│   ├── usePlannerFabric.ts           # Fabric.js canvas initialization & disposal lifecycle
│   ├── usePlannerHistory.ts          # Undo/Redo stack with snapshot compression
│   ├── usePlannerKeyboardShortcuts.ts# Global window keydown listener (Del, Esc, Ctrl+Z)
│   ├── usePlannerSessionWarning.ts   # Idle session timeout timer & modal trigger
│   ├── usePlannerTouchGestures.ts    # Mobile pinch-to-zoom and multi-touch pan solver
│   └── usePlannerViewport.ts         # Coordinates 2D canvas zoom with 3D Three.js camera
├── Studio/                  # Furniture Customizer Custom Hooks (7 Hooks)
│   ├── useStudioCanvasCore.ts        # 13.0 KB Furniture part assembly & drag constraints
│   ├── useStudioFabric.ts            # Fabric.js customizer initialization & disposal
│   ├── useStudioHistory.ts           # Part transformation undo/redo stack
│   ├── useStudioKeyboardShortcuts.ts # Window keydown handlers for rotation and alignment
│   └── useStudioDraftAutosave.ts     # Debounced localStorage draft autosave coordinator
└── useSectorTabs.ts         # Marketing category tab selection coordinator
```

---

## 1. The 5 Inline Hook Suppressions Audit

All 5 React hook dependency suppressions identified during the Oxlint audit reside in this directory:

| Hook File & Line | Suppressed Rule | Reason for Suppression | Risk & Hardening Fix |
| :--- | :--- | :--- | :--- |
| [`Studio/useStudioFabric.ts:56`](file:///d:/23082026/site/hooks/Studio/useStudioFabric.ts#L56) | `react-hooks/exhaustive-deps` | Canvas teardown `useEffect` runs only on unmount. | Wrap canvas disposal in a dedicated `useMountEffect` helper with explicit unmount semantics. |
| [`Planner/usePlannerFabric.ts:81`](file:///d:/23082026/site/hooks/Planner/usePlannerFabric.ts#L81) | `react-hooks/exhaustive-deps` | Canvas teardown `useEffect` runs only on unmount. | Same as above. |
| [`Studio/useStudioKeyboardShortcuts.ts:135`](file:///d:/23082026/site/hooks/Studio/useStudioKeyboardShortcuts.ts#L135) | `react-hooks/exhaustive-deps` | Window keydown listener registration. | Use `useRef` to store the mutable shortcut handler, eliminating the stale closure warning cleanly. |
| [`Planner/usePlannerKeyboardShortcuts.ts:201`](file:///d:/23082026/site/hooks/Planner/usePlannerKeyboardShortcuts.ts#L201) | `react-hooks/exhaustive-deps` | Window keydown listener registration. | Same as above. |
| [`Planner/usePlannerSessionWarning.ts:72`](file:///d:/23082026/site/hooks/Planner/usePlannerSessionWarning.ts#L72) | `react-hooks/exhaustive-deps` | Idle session countdown timer. | Use functional state updater (`setRemaining(r => r - 1)`) to avoid capturing outer state variables. |

---

## 2. Why They Evaded CI Detection

The repository guardrail [`scripts/general/audit-eslint-disable.mjs`](file:///d:/23082026/scripts/general/audit-eslint-disable.mjs) scans:
* `site/app`, `site/components`, `site/features`, `site/lib`, `tests`, `scripts`

**`site/hooks/` was omitted from `SCAN_DIRS`.**  
*Remediation:* Expand `SCAN_DIRS` in `audit-eslint-disable.mjs` to include `site/hooks` after applying the `useRef` refactoring above.
