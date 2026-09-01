"use client";
import { useEffect, useRef, type DependencyList } from "react";

type ShortcutHandlers = {
  undo?: () => void;
  redo?: () => void;
  duplicate?: () => void;
  group?: () => void;
  save?: () => void;
  selectAll?: () => void;
  copy?: () => void;
  paste?: () => void;
  delete?: () => void;
  escape?: () => void;
  tool?: (id: string) => void;
};

export const useKeyboardShortcuts = (handlers: ShortcutHandlers, deps: DependencyList = []) => {
  // Latest-handler ref: the keydown listener reads the newest handlers object
  // on every dispatch, so handlers passed here may be plain per-render
  // closures without stale-capture (28.4 — the previous deps array only
  // included undo/redo, leaving save/delete/copy/paste bound to their
  // first-render closures). `deps` is kept for API compatibility.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const h = handlersRef.current;
      const target = e.target as HTMLElement | null;
      const inField =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Editing text must never trigger canvas mutations — this check has to
      // run BEFORE the Ctrl+* blocks, or Ctrl+A/Z/S/D/C/V inside an input or
      // textarea are hijacked to canvas actions (28.4; mirrors the Planner
      // hook). Escape is intentionally allowed so an open modal/menu can
      // still close.
      if (inField && key !== "escape") return;

      if (ctrl && key === "z" && !e.shiftKey) {
        e.preventDefault();
        h.undo?.();
        return;
      }
      if ((ctrl && key === "y") || (ctrl && e.shiftKey && key === "z")) {
        e.preventDefault();
        h.redo?.();
        return;
      }
      if (ctrl && key === "d") {
        e.preventDefault();
        h.duplicate?.();
        return;
      }
      if (ctrl && key === "g") {
        e.preventDefault();
        h.group?.();
        return;
      }
      if (ctrl && key === "s") {
        e.preventDefault();
        h.save?.();
        return;
      }
      if (ctrl && key === "a") {
        e.preventDefault();
        h.selectAll?.();
        return;
      }
      if (ctrl && key === "c") {
        h.copy?.();
        return;
      }
      if (ctrl && key === "v") {
        h.paste?.();
        return;
      }

      if (key === "delete" || key === "backspace") {
        e.preventDefault();
        h.delete?.();
        return;
      }
      if (key === "escape") {
        h.escape?.();
        return;
      }
      if (key === "v") {
        h.tool?.("select");
        return;
      }
      if (key === "r") {
        h.tool?.("rect");
        return;
      }
      if (key === "c") {
        h.tool?.("circle");
        return;
      }
      if (key === "l") {
        h.tool?.("line");
        return;
      }
      if (key === "p") {
        h.tool?.("polygon");
        return;
      }
      if (key === "t") {
        h.tool?.("text");
        return;
      }
      if (key === "w") {
        h.tool?.("wall");
        return;
      }
      if (key === "h") {
        h.tool?.("pan");
        return;
      }
      if (key === "d") {
        h.tool?.("dimension");
        return;
      }
      if (key === "m") {
        h.tool?.("freehand");
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
