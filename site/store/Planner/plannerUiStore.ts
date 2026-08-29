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
