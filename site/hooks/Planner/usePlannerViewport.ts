"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Viewport class for Planner responsive layout.
 *
 * - phone:   0–639px   (single-column, bottom chrome, no side panels)
 * - tablet:  640–1023px (overlay panels, dismissible, stacked chrome)
 * - desktop: 1024px+    (side-by-side panels, full toolbar labels)
 *
 * Breakpoints align with Tailwind v4 --breakpoint-sm (640) and --breakpoint-lg (1024).
 */
export type PlannerViewportClass = "phone" | "tablet" | "desktop";

/** Orientation derived from the visual viewport or window dimensions. */
export type PlannerOrientation = "portrait" | "landscape";

export interface PlannerViewportState {
  /** Current viewport class */
  viewportClass: PlannerViewportClass;
  /** Current orientation */
  orientation: PlannerOrientation;
  /** Whether the viewport is phone-sized */
  isPhone: boolean;
  /** Whether the viewport is tablet-sized */
  isTablet: boolean;
  /** Whether the viewport is desktop-sized */
  isDesktop: boolean;
  /** Visual viewport width (accounts for on-screen keyboard) */
  viewportWidth: number;
  /** Visual viewport height (accounts for on-screen keyboard) */
  viewportHeight: number;
}

/** Breakpoint thresholds (inclusive lower bound). */
const TABLET_MIN = 640;
const DESKTOP_MIN = 1024;

function classifyWidth(width: number): PlannerViewportClass {
  if (width >= DESKTOP_MIN) return "desktop";
  if (width >= TABLET_MIN) return "tablet";
  return "phone";
}

function deriveOrientation(width: number, height: number): PlannerOrientation {
  return width >= height ? "landscape" : "portrait";
}

function getVisualViewportDimensions(): { width: number; height: number } {
  if (typeof window === "undefined") {
    return { width: 1024, height: 768 };
  }
  // Prefer visualViewport for accurate dimensions when on-screen keyboard is open
  const vv = window.visualViewport;
  if (vv) {
    return { width: vv.width, height: vv.height };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Planner viewport class hook.
 *
 * Classifies the current viewport into phone / tablet / desktop and tracks
 * orientation. Uses the visual viewport API when available so that on-screen
 * keyboards are accounted for.
 *
 * State is preserved across resize and orientation changes — this hook only
 * reports the viewport class; it never resets document content, unsaved
 * state, active tool, or selection.
 */
export function usePlannerViewport(): PlannerViewportState {
  const [state, setState] = useState<PlannerViewportState>(() => {
    const { width, height } = getVisualViewportDimensions();
    const vc = classifyWidth(width);
    return {
      viewportClass: vc,
      orientation: deriveOrientation(width, height),
      isPhone: vc === "phone",
      isTablet: vc === "tablet",
      isDesktop: vc === "desktop",
      viewportWidth: width,
      viewportHeight: height,
    };
  });

  // Ref to track previous viewport class for transition detection
  const prevClassRef = useRef(state.viewportClass);

  const update = useCallback(() => {
    const { width, height } = getVisualViewportDimensions();
    const vc = classifyWidth(width);
    const orientation = deriveOrientation(width, height);

    setState((prev) => {
      if (
        prev.viewportClass === vc &&
        prev.orientation === orientation &&
        prev.viewportWidth === width &&
        prev.viewportHeight === height
      ) {
        return prev;
      }
      prevClassRef.current = vc;
      return {
        viewportClass: vc,
        orientation,
        isPhone: vc === "phone",
        isTablet: vc === "tablet",
        isDesktop: vc === "desktop",
        viewportWidth: width,
        viewportHeight: height,
      };
    });
  }, []);

  useEffect(() => {
    // Initial sync (SSR → client)
    update();

    // Listen to both window resize and visual viewport resize/scroll
    const vv = window.visualViewport;

    window.addEventListener("resize", update);
    if (vv) {
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
    }

    // Orientation change on mobile
    const mql = window.matchMedia("(orientation: portrait)");
    const onOrientationChange = () => update();
    mql.addEventListener("change", onOrientationChange);

    return () => {
      window.removeEventListener("resize", update);
      if (vv) {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
      }
      mql.removeEventListener("change", onOrientationChange);
    };
  }, [update]);

  return state;
}

export { TABLET_MIN, DESKTOP_MIN };
