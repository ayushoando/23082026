"use client";

import { useEffect, useRef } from "react";

/**
 * Warns the user before their session expires when they have unsaved Planner
 * work, so they can choose to save or reauthenticate before work is lost.
 *
 * Requirement 8.8 — IF a timeout can cause loss of Planner work, THEN warn
 * the user first and provide an extension or recovery path.
 *
 * Strategy: each successful authenticated API call (project load or save)
 * resets the warning timer. After `warnBeforeMs` milliseconds without a
 * successful reset, if `hasUnsavedChanges` is true, the caller's `onWarn`
 * callback fires. The Planner component surfaces this as a dismissible
 * save-state alert with "Save now" and "Sign in again" actions.
 *
 * The hook does nothing when `enabled` is false (guest sessions, SSR).
 */

export interface UsePlannerSessionWarningOptions {
  /** Whether session warning is active (false for guest or SSR). */
  enabled: boolean;
  /** Whether the current canvas has unsaved changes that could be lost. */
  hasUnsavedChanges: boolean;
  /**
   * Milliseconds after the last reset before warning fires.
   * Default: 12 minutes (giving ~3 minutes before a typical 15 min session).
   */
  warnBeforeMs?: number;
  /** Called when the warning threshold is reached. */
  onWarn: () => void;
}

const DEFAULT_WARN_BEFORE_MS = 12 * 60 * 1000; // 12 minutes

export interface UsePlannerSessionWarningReturn {
  /** Call this after every successful authenticated operation to reset the timer. */
  resetSessionTimer: () => void;
}

export function usePlannerSessionWarning({
  enabled,
  hasUnsavedChanges,
  warnBeforeMs = DEFAULT_WARN_BEFORE_MS,
  onWarn,
}: UsePlannerSessionWarningOptions): UsePlannerSessionWarningReturn {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUnsavedRef = useRef(hasUnsavedChanges);
  const onWarnRef = useRef(onWarn);
  hasUnsavedRef.current = hasUnsavedChanges;
  onWarnRef.current = onWarn;

  const resetSessionTimer = () => {
    if (!enabled) return;
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (hasUnsavedRef.current) {
        onWarnRef.current();
      }
    }, warnBeforeMs);
  };

  // Start the timer once when enabled, and clean up on unmount.
  useEffect(() => {
    if (!enabled) return;
    resetSessionTimer();
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
    // resetSessionTimer is defined in the function body — stable reference via closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, warnBeforeMs]);

  return { resetSessionTimer };
}
