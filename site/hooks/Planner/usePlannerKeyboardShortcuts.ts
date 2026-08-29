"use client";
import { useEffect, type DependencyList } from "react";

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
  /** Arrow-key nudge (move selected object by one step). */
  moveLeft?: () => void;
  moveRight?: () => void;
  moveUp?: () => void;
  moveDown?: () => void;
  /** Shift+Arrow resize (grow/shrink selected object). */
  resizeWidthGrow?: () => void;
  resizeWidthShrink?: () => void;
  resizeHeightGrow?: () => void;
  resizeHeightShrink?: () => void;
  /** +/- zoom through semantic commands. */
  zoomIn?: () => void;
  zoomOut?: () => void;
  /** Rotate selected object. */
  rotate?: () => void;
};

export const useKeyboardShortcuts = (handlers: ShortcutHandlers, deps: DependencyList = []) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Editing text must never trigger canvas mutations (for example Cmd+A
      // selecting every object or Backspace deleting a selection). Escape is
      // intentionally allowed so an open modal/menu can still close.
      if (inField && key !== "escape") return;
      if (e.repeat && (key === "delete" || key === "backspace" || (ctrl && key === "d"))) {
        return;
      }

      if (ctrl && key === "z" && !e.shiftKey) {
        e.preventDefault();
        handlers.undo?.();
        return;
      }
      if ((ctrl && key === "y") || (ctrl && e.shiftKey && key === "z")) {
        e.preventDefault();
        handlers.redo?.();
        return;
      }
      if (ctrl && key === "d") {
        e.preventDefault();
        handlers.duplicate?.();
        return;
      }
      if (ctrl && key === "g") {
        e.preventDefault();
        handlers.group?.();
        return;
      }
      if (ctrl && key === "s") {
        e.preventDefault();
        handlers.save?.();
        return;
      }
      if (ctrl && key === "a") {
        e.preventDefault();
        handlers.selectAll?.();
        return;
      }
      if (ctrl && key === "c") {
        handlers.copy?.();
        return;
      }
      if (ctrl && key === "v") {
        handlers.paste?.();
        return;
      }

      if (key === "delete" || key === "backspace") {
        e.preventDefault();
        handlers.delete?.();
        return;
      }
      if (key === "escape") {
        handlers.escape?.();
        return;
      }

      // Arrow keys: Shift+Arrow = resize, plain Arrow = move (nudge).
      // Route through semantic commands so pointer, touch, keyboard,
      // and accessible controls all invoke the same logic (Req 7.1–7.3).
      if (key === "arrowleft") {
        e.preventDefault();
        if (e.shiftKey) handlers.resizeWidthShrink?.();
        else handlers.moveLeft?.();
        return;
      }
      if (key === "arrowright") {
        e.preventDefault();
        if (e.shiftKey) handlers.resizeWidthGrow?.();
        else handlers.moveRight?.();
        return;
      }
      if (key === "arrowup") {
        e.preventDefault();
        if (e.shiftKey) handlers.resizeHeightShrink?.();
        else handlers.moveUp?.();
        return;
      }
      if (key === "arrowdown") {
        e.preventDefault();
        if (e.shiftKey) handlers.resizeHeightGrow?.();
        else handlers.moveDown?.();
        return;
      }

      // +/- keys: zoom through semantic commands (Req 7.7 — explicit
      // alternatives for multi-pointer gestures).
      if (key === "+" || key === "=") {
        e.preventDefault();
        handlers.zoomIn?.();
        return;
      }
      if (key === "-" || key === "_") {
        e.preventDefault();
        handlers.zoomOut?.();
        return;
      }

      if (key === "v") {
        handlers.tool?.("select");
        return;
      }
      if (key === "r") {
        // R with selection rotates; without selection switches to rect tool.
        // The rotate handler returns early when nothing is selected.
        if (handlers.rotate) {
          handlers.rotate();
        } else {
          handlers.tool?.("rect");
        }
        return;
      }
      if (key === "c") {
        handlers.tool?.("circle");
        return;
      }
      if (key === "l") {
        handlers.tool?.("line");
        return;
      }
      if (key === "p") {
        handlers.tool?.("polygon");
        return;
      }
      if (key === "t") {
        handlers.tool?.("text");
        return;
      }
      if (key === "w") {
        handlers.tool?.("wall");
        return;
      }
      if (key === "h") {
        handlers.tool?.("pan");
        return;
      }
      if (key === "d") {
        handlers.tool?.("dimension");
        return;
      }
      if (key === "m") {
        handlers.tool?.("freehand");
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
