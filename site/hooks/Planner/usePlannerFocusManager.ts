"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Shared focus management hook for Planner surfaces (menus, panels, dialogs).
 *
 * Provides:
 * - Invoker capture on open (stores the element that had focus before the surface opened)
 * - Focus move into the surface on open (targets first focusable or a specific element)
 * - Optional modal focus trapping (Tab wraps within the surface)
 * - Invoker restoration on close
 *
 * Requirements 7.5, 7.6, 8.1, 8.2
 */

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface UsePlannerFocusManagerOptions {
  /** Whether the surface is currently open. */
  open: boolean;
  /** Ref to the surface container element. */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Whether to trap focus inside the surface (only for modal surfaces). */
  modal?: boolean;
  /** An optional ref to the initial focus target inside the surface. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Called when the surface should close (Escape key). */
  onClose?: () => void;
}

interface UsePlannerFocusManagerReturn {
  /** Ref that holds the element that was focused before the surface opened.
   *  Can be read after close to verify restoration. */
  invokerRef: React.RefObject<HTMLElement | null>;
}

export function usePlannerFocusManager({
  open,
  containerRef,
  modal = false,
  initialFocusRef,
  onClose,
}: UsePlannerFocusManagerOptions): UsePlannerFocusManagerReturn {
  const invokerRef = useRef<HTMLElement | null>(null);

  // Capture invoker and move focus into the surface on open.
  useEffect(() => {
    if (!open) return;

    // Capture the currently focused element as the invoker.
    invokerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Move focus into the surface after layout settles.
    const frame = requestAnimationFrame(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }
      const container = containerRef.current;
      if (!container) return;
      const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        // Fallback: focus the container itself if it's focusable.
        container.focus();
      }
    });

    return () => {
      cancelAnimationFrame(frame);
      // Restore invoker focus on close.
      invokerRef.current?.focus();
      invokerRef.current = null;
    };
  }, [open, containerRef, initialFocusRef]);

  // Modal focus trap: wrap Tab within the surface.
  useEffect(() => {
    if (!open || !modal) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onClose) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;

      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
      );

      if (focusables.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, modal, containerRef, onClose]);

  return { invokerRef };
}

/**
 * Hook for roving tabindex in toolbars.
 * Only the active/focused item in the toolbar has tabindex=0;
 * others have tabindex=-1. Arrow keys move focus between items.
 *
 * Requirement 7.5 — logical visible focus in toolbar order.
 */
export function useRovingTabindex(
  containerRef: React.RefObject<HTMLElement | null>,
  options?: { orientation?: "horizontal" | "vertical" },
) {
  const orientation = options?.orientation ?? "horizontal";

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const isNext =
        (orientation === "horizontal" && event.key === "ArrowRight") ||
        (orientation === "vertical" && event.key === "ArrowDown");
      const isPrev =
        (orientation === "horizontal" && event.key === "ArrowLeft") ||
        (orientation === "vertical" && event.key === "ArrowUp");
      const isHome = event.key === "Home";
      const isEnd = event.key === "End";

      if (!isNext && !isPrev && !isHome && !isEnd) return;
      event.preventDefault();

      const items = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [role="tab"]:not([disabled])',
        ),
      );
      if (items.length === 0) return;

      const currentIndex = items.findIndex((item) => item === document.activeElement);

      let nextIndex: number;
      if (isHome) {
        nextIndex = 0;
      } else if (isEnd) {
        nextIndex = items.length - 1;
      } else if (isNext) {
        nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
      } else {
        nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
      }

      // Update tabindex: -1 on all, 0 on the new target.
      for (const item of items) {
        item.setAttribute("tabindex", "-1");
      }
      items[nextIndex].setAttribute("tabindex", "0");
      items[nextIndex].focus();
    },
    [containerRef, orientation],
  );

  // Initialize: set first item to tabindex=0, rest to -1.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = Array.from(
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [role="tab"]:not([disabled])',
      ),
    );
    items.forEach((item, index) => {
      item.setAttribute("tabindex", index === 0 ? "0" : "-1");
    });
  });

  return { onKeyDown };
}
