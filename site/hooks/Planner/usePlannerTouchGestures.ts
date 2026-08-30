"use client";
/**
 * usePlannerTouchGestures — routes two-finger pinch and pan touch gestures
 * through the semantic Planner viewport command layer.
 *
 * This hook intercepts native pointer/touch events on the canvas wrapper
 * element and converts multi-pointer gestures into calls to
 * `applyPlannerViewportCommand`. Using the canonical viewport mutator ensures
 * that pinch-zoom and two-finger-drag produce exactly the same result as the
 * keyboard (+/-) and button (ViewportControls) alternatives.
 *
 * Requirements 7.4 (touch-action scoped to gesture region) is enforced by the
 * CSS in `focss/planner/workspace-shell.css` (canvas element only, not the
 * page). This hook does not set `touch-action` — the CSS handles it.
 *
 * Requirements 7.7 — if multi-pointer gesture is unavailable, visible controls
 * in ViewportControls provide the equivalent zoom and pan.
 *
 * Requirements 7.1–7.3 — pointer, touch, and keyboard all invoke the same
 * viewport logic through `applyPlannerViewportCommand`.
 */

import { useEffect, type MutableRefObject } from "react";
import type * as fabricNs from "fabric";
import {
  applyPlannerViewportCommand,
  type FabricCanvasLike,
} from "@planner/lib/commands/canvasCommands";

interface TouchGestureOptions {
  /** The Fabric canvas reference. */
  fabricRef: MutableRefObject<fabricNs.Canvas | null>;
  /** Whether the Fabric canvas is ready. */
  ready: boolean;
  /** The outer wrapper element that receives touch events. */
  wrapperRef: MutableRefObject<HTMLDivElement | null>;
  /** Callback to synchronise React viewport state after a gesture. */
  onViewportChanged?: (zoom: number) => void;
}

/**
 * Intercept pointer events on the canvas wrapper to implement two-finger
 * pinch-to-zoom and two-finger drag-to-pan. Both are routed through
 * `applyPlannerViewportCommand` so the gesture coalesces to the same result
 * as keyboard or button alternatives.
 */
export const usePlannerTouchGestures = ({
  fabricRef,
  ready,
  wrapperRef,
  onViewportChanged,
}: TouchGestureOptions): void => {
  useEffect(() => {
    if (!ready) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Active pointer tracking (by pointerId).
    const pointers = new Map<number, { x: number; y: number }>();

    // Helper: distance between two pointer positions.
    const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(a.x - b.x, a.y - b.y);

    // Helper: midpoint between two pointer positions.
    const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    });

    // Snapshot of the last two-pointer state (for delta computation).
    let prevSpan = 0;
    let prevMid = { x: 0, y: 0 };
    let gestureActive = false;

    const onPointerDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        prevSpan = dist(a, b);
        prevMid = mid(a, b);
        gestureActive = true;
        // Capture so we keep receiving events even if the pointer leaves the element.
        try {
          wrapper.setPointerCapture(e.pointerId);
        } catch {
          /* ignore — not all environments support this */
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size < 2 || !gestureActive) return;

      const c = fabricRef.current as FabricCanvasLike | null;
      if (!c) return;

      const [a, b] = [...pointers.values()];
      const currentSpan = dist(a, b);
      const currentMid = mid(a, b);

      // Pinch: zoom toward the midpoint.
      if (prevSpan > 0) {
        const ratio = currentSpan / prevSpan;
        const rawZoom = c.getZoom() * ratio;
        const zoom = Math.max(0.1, Math.min(8, rawZoom));

        // Convert client midpoint to canvas element-local coordinates.
        const rect = wrapper.getBoundingClientRect();
        const origin = {
          x: currentMid.x - rect.left,
          y: currentMid.y - rect.top,
        };

        applyPlannerViewportCommand(c, { type: "zoom", zoom, origin });
        onViewportChanged?.(zoom);
      }

      // Two-finger drag: pan by the midpoint delta.
      const dx = currentMid.x - prevMid.x;
      const dy = currentMid.y - prevMid.y;
      if (dx !== 0 || dy !== 0) {
        const vpt = [...c.viewportTransform] as number[];
        vpt[4] += dx;
        vpt[5] += dy;
        applyPlannerViewportCommand(c, { type: "pan", viewportTransform: vpt });
        onViewportChanged?.(c.getZoom());
      }

      prevSpan = currentSpan;
      prevMid = currentMid;
    };

    const onPointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) {
        gestureActive = false;
        prevSpan = 0;
        prevMid = { x: 0, y: 0 };
      }
    };

    const onPointerCancel = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) {
        gestureActive = false;
        prevSpan = 0;
        prevMid = { x: 0, y: 0 };
      }
    };

    wrapper.addEventListener("pointerdown", onPointerDown);
    wrapper.addEventListener("pointermove", onPointerMove);
    wrapper.addEventListener("pointerup", onPointerUp);
    wrapper.addEventListener("pointercancel", onPointerCancel);

    return () => {
      wrapper.removeEventListener("pointerdown", onPointerDown);
      wrapper.removeEventListener("pointermove", onPointerMove);
      wrapper.removeEventListener("pointerup", onPointerUp);
      wrapper.removeEventListener("pointercancel", onPointerCancel);
      pointers.clear();
      gestureActive = false;
    };
  }, [ready, fabricRef, wrapperRef, onViewportChanged]);
};
