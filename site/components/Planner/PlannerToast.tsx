"use client";
import { useEffect, useRef, useState } from "react";
import { usePlannerUIStore } from "@planner/store/plannerUiStore";
import { PhIcon } from "@planner/components/ui/PlannerPhIcon";

/** Matches the `toast-out` keyframe duration in `focss/planner/chrome.css`. */
const EXIT_MS = 180;

export const Toast = () => {
  const toast = usePlannerUIStore((s) => s.toast);
  const dismissToast = usePlannerUIStore((s) => s.dismissToast);
  const [shown, setShown] = useState(toast);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    if (toast) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShown(toast);
      setLeaving(false);
      return;
    }
    if (shownRef.current) {
      setLeaving(true);
      timerRef.current = setTimeout(() => {
        setShown(null);
        setLeaving(false);
      }, EXIT_MS);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast]);

  if (!shown) return null;
  return (
    <div className="toast-viewport" aria-live={shown.kind === "error" ? "assertive" : "polite"}>
      <div
        className={`toast toast--${shown.kind}${leaving ? " toast--leaving" : ""}`}
        role={shown.kind === "error" ? "alert" : "status"}
      >
        <span className="toast__message">{shown.message}</span>
        <button
          type="button"
          className="toast__dismiss"
          onClick={dismissToast}
          aria-label="Dismiss notification"
        >
          <PhIcon name="x" size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
