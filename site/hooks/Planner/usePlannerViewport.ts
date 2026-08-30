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
const INITIAL_VIEWPORT_DIMENSIONS = { width: DESKTOP_MIN, height: 768 } as const;

function classifyWidth(width: number): PlannerViewportClass {
  if (width >= DESKTOP_MIN) return "desktop";
  if (width >= TABLET_MIN) return "tablet";
  return "phone";
}

function deriveOrientation(width: number, height: number): PlannerOrientation {
  return width >= height ? "landscape" : "portrait";
}

function createPlannerViewportState(
  width: number,
  height: number,
): PlannerViewportState {
  const viewportClass = classifyWidth(width);
  return {
    viewportClass,
    orientation: deriveOrientation(width, height),
    isPhone: viewportClass === "phone",
    isTablet: viewportClass === "tablet",
    isDesktop: viewportClass === "desktop",
    viewportWidth: width,
    viewportHeight: height,
  };
}

const INITIAL_VIEWPORT_STATE = createPlannerViewportState(
  INITIAL_VIEWPORT_DIMENSIONS.width,
  INITIAL_VIEWPORT_DIMENSIONS.height,
);

function getVisualViewportDimensions(): { width: number; height: number } {
  if (typeof window === "undefined") return INITIAL_VIEWPORT_DIMENSIONS;

  // Prefer visualViewport for accurate dimensions when on-screen keyboard is open.
  const visualViewport = window.visualViewport;
  if (visualViewport) {
    return { width: visualViewport.width, height: visualViewport.height };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Planner viewport class hook.
 *
 * The server and the first client render must share this fixed desktop snapshot
 * so SSR can hydrate without structurally changing the docks. The effect below
 * then measures the real visual viewport and maintains it through resize and
 * orientation changes.
 */
export function usePlannerViewport(): PlannerViewportState {
  const [state, setState] = useState<PlannerViewportState>(INITIAL_VIEWPORT_STATE);

  // Ref to track previous viewport class for transition detection
  const prevClassRef = useRef(state.viewportClass);

  const update = useCallback(() => {
    const { width, height } = getVisualViewportDimensions();
    const nextState = createPlannerViewportState(width, height);

    setState((previousState) => {
      if (
        previousState.viewportClass === nextState.viewportClass &&
        previousState.orientation === nextState.orientation &&
        previousState.viewportWidth === nextState.viewportWidth &&
        previousState.viewportHeight === nextState.viewportHeight
      ) {
        return previousState;
      }
      prevClassRef.current = nextState.viewportClass;
      return nextState;
    });
  }, []);

  useEffect(() => {
    // Measure only after hydration so the first browser tree matches SSR.
    update();

    // Listen to both window resize and visual viewport resize/scroll.
    const visualViewport = window.visualViewport;

    window.addEventListener("resize", update);
    if (visualViewport) {
      visualViewport.addEventListener("resize", update);
      visualViewport.addEventListener("scroll", update);
    }

    // Orientation change on mobile.
    const mediaQuery = window.matchMedia("(orientation: portrait)");
    const onOrientationChange = () => update();
    mediaQuery.addEventListener("change", onOrientationChange);

    return () => {
      window.removeEventListener("resize", update);
      if (visualViewport) {
        visualViewport.removeEventListener("resize", update);
        visualViewport.removeEventListener("scroll", update);
      }
      mediaQuery.removeEventListener("change", onOrientationChange);
    };
  }, [update]);

  return state;
}

export { TABLET_MIN, DESKTOP_MIN };
