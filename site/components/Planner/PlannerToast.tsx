"use client";

import { useEffect, useReducer } from "react";
import { usePlannerUIStore } from "@planner/store/plannerUiStore";
import { PhIcon } from "@planner/components/ui/PlannerPhIcon";

/** Matches the `toast-out` keyframe duration in `focss/planner/chrome.css`. */
const EXIT_MS = 180;

type ToastMessage = {
  id: number;
  message: string;
  kind: string;
};

type ToastViewState = {
  shown: ToastMessage | null;
  leaving: boolean;
};

type ToastViewAction =
  | { type: "show"; toast: ToastMessage }
  | { type: "begin-exit" }
  | { type: "finish-exit" };

function toastViewReducer(state: ToastViewState, action: ToastViewAction): ToastViewState {
  switch (action.type) {
    case "show":
      return { shown: action.toast, leaving: false };
    case "begin-exit":
      return state.shown && !state.leaving ? { ...state, leaving: true } : state;
    case "finish-exit":
      return state.shown ? { shown: null, leaving: false } : state;
  }
}

export const Toast = () => {
  const toast = usePlannerUIStore((s) => s.toast);
  const dismissToast = usePlannerUIStore((s) => s.dismissToast);
  const [{ shown, leaving }, dispatch] = useReducer(toastViewReducer, { shown: toast, leaving: false });

  useEffect(() => {
    if (toast) {
      dispatch({ type: "show", toast });
      return;
    }
    dispatch({ type: "begin-exit" });
    const timer = window.setTimeout(() => dispatch({ type: "finish-exit" }), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!shown) return null;
  return (
    <div className="toast-viewport" aria-live={shown.kind === "error" ? "assertive" : "polite"}>
      <div
        className={`toast toast--${shown.kind}${leaving ? " toast--leaving" : ""}`}
        role={shown.kind === "error" ? "alert" : "status"}
        data-state={shown.kind === "error" ? "server-error" : "success"}
      >
        <span className="toast__icon" aria-hidden="true">
          <PhIcon name={shown.kind === "error" ? "warning" : "checkCircle"} size={18} weight="duotone" />
        </span>
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
