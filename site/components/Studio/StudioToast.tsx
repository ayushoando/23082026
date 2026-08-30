"use client";
import { useEffect, useReducer } from "react";
import { useStudioUIStore } from "@studio/store/studioUiStore";

/** Matches the `toast-out` keyframe duration in `focss/studio/chrome.css`. */
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
  const toast = useStudioUIStore((s) => s.toast);
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
    <div className="toast-viewport">
      <div className={`toast toast--${shown.kind}${leaving ? " toast--leaving" : ""}`}>{shown.message}</div>
    </div>
  );
};

export default Toast;
