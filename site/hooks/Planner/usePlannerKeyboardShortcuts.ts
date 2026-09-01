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
  // Latest-handler ref (28.2): the keydown listener is registered once, but
  // every dispatch reads the newest handlers object. This kills the
  // stale-capture class of bugs where a first-render closure kept invoking
  // e.g. `save` with a stale `projectId` — after the first save changed the
  // project id, Ctrl+S still took the create-branch and produced a duplicate
  // project. `deps` is kept for call-site/API compatibility; with the ref in
  // place the handlers are always current even when callers pass no deps.
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

      // Editing text must never trigger canvas mutations (for example Cmd+A
      // selecting every object or Backspace deleting a selection). Escape is
      // intentionally allowed so an open modal/menu can still close.
      if (inField && key !== "escape") return;
      if (e.repeat && (key === "delete" || key === "backspace" || (ctrl && key === "d"))) {
        return;
      }

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

      // Arrow keys: Shift+Arrow = resize, plain Arrow = move (nudge).
      // Route through semantic commands so pointer, touch, keyboard,
      // and accessible controls all invoke the same logic (Req 7.1–7.3).
      if (key === "arrowleft") {
        e.preventDefault();
        if (e.shiftKey) h.resizeWidthShrink?.();
        else h.moveLeft?.();
        return;
      }
      if (key === "arrowright") {
        e.preventDefault();
        if (e.shiftKey) h.resizeWidthGrow?.();
        else h.moveRight?.();
        return;
      }
      if (key === "arrowup") {
        e.preventDefault();
        if (e.shiftKey) h.resizeHeightShrink?.();
        else h.moveUp?.();
        return;
      }
      if (key === "arrowdown") {
        e.preventDefault();
        if (e.shiftKey) h.resizeHeightGrow?.();
        else h.moveDown?.();
        return;
      }

      // +/- keys: zoom through semantic commands (Req 7.7 — explicit
      // alternatives for multi-pointer gestures).
      if (key === "+" || key === "=") {
        e.preventDefault();
        h.zoomIn?.();
        return;
      }
      if (key === "-" || key === "_") {
        e.preventDefault();
        h.zoomOut?.();
        return;
      }

      if (key === "v") {
        h.tool?.("select");
        return;
      }
      if (key === "r") {
        // R with selection rotates; without selection switches to rect tool.
        // The rotate handler returns early when nothing is selected.
        if (h.rotate) {
          h.rotate();
        } else {
          h.tool?.("rect");
        }
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
