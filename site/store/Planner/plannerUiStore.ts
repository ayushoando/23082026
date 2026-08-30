"use client";
import { create } from "zustand";

/** Floor Planner UI state. The Studio has its own independent store. */

export type PlannerUnit = "mm" | "cm" | "m" | "in";
type ToastKind = "ok" | "error" | string;

type ToastState = {
  id: number;
  message: string;
  kind: ToastKind;
} | null;

type PlannerUIStore = {
  accessMode: "authenticated" | "guest";
  setAccessMode: (mode: "authenticated" | "guest") => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
  unit: PlannerUnit;
  setUnit: (unit: PlannerUnit) => void;
  snapEnabled: boolean;
  toggleSnap: () => void;
  gridSize: number;
  setGridSize: (gridSize: number) => void;
  showGrid: boolean;
  toggleGrid: () => void;
  toast: ToastState;
  showToast: (message: string, kind?: ToastKind) => void;
  dismissToast: () => void;
};

export const usePlannerUIStore = create<PlannerUIStore>((set) => ({
  accessMode: "guest",
  setAccessMode: (accessMode) => set({ accessMode }),

  hasUnsavedChanges: false,
  setHasUnsavedChanges: (hasUnsavedChanges) => set({ hasUnsavedChanges }),

  unit: "mm",
  setUnit: (unit) => set({ unit }),

  snapEnabled: true,
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),

  gridSize: 100,
  setGridSize: (gridSize) => set({ gridSize }),

  showGrid: true,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

  toast: null,
  dismissToast: () => set({ toast: null }),
  showToast: (message, kind = "ok") => {
    const id = Date.now();
    set({ toast: { id, message, kind } });
    // Errors require explicit acknowledgement so recovery information is not
    // removed before assistive-technology or keyboard users can act on it.
    if (kind === "error") return;
    setTimeout(
      () => set((s) => (s.toast?.id === id ? { toast: null } : s)),
      5000,
    );
  },
}));

/**
 * Guard Planner-owned links and imperative navigation while the editor holds
 * work that has not been persisted. The caller remains responsible for
 * starting navigation after this returns true; a cancelled decision leaves
 * the document and its dirty marker untouched.
 */
export function confirmPlannerNavigation(
  message = "You have unsaved changes. Leave this plan without saving?",
): boolean {
  const { hasUnsavedChanges, setHasUnsavedChanges } = usePlannerUIStore.getState();
  if (!hasUnsavedChanges || typeof window === "undefined") return true;

  const shouldLeave = window.confirm(message);
  if (shouldLeave) {
    // The destination owns a fresh workflow. Clear the cross-route marker only
    // after the user explicitly accepts the destructive navigation.
    setHasUnsavedChanges(false);
  }
  return shouldLeave;
}
