"use client";

import { useCallback, useEffect } from "react";

interface PlannerTabletPanelScrimProps {
  /** Whether any panel overlay is currently visible */
  visible: boolean;
  /** Called when the user taps the scrim to dismiss panels */
  onDismiss: () => void;
}

/**
 * Narrow-viewport scrim behind open overlay panels.
 *
 * On tablet and phone viewports (0–1023px), side panels are overlaid rather
 * than inline. This scrim provides a dismissal surface so panels do not
 * obscure the canvas or command chrome without a reversible exit.
 *
 * On desktop, the scrim is hidden via CSS.
 */
export function PlannerTabletPanelScrim({
  visible,
  onDismiss,
}: PlannerTabletPanelScrimProps) {
  // Dismiss on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && visible) {
        e.preventDefault();
        onDismiss();
      }
    },
    [visible, onDismiss],
  );

  useEffect(() => {
    if (!visible) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, handleKeyDown]);

  return (
    <div
      className="tablet-panel-scrim"
      data-visible={visible ? "true" : "false"}
      data-testid="tablet-panel-scrim"
      role="presentation"
      aria-hidden="true"
      onClick={onDismiss}
    />
  );
}
