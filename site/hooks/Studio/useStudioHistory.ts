"use client";
import { useEffect, useRef, useCallback, useState, type MutableRefObject } from "react";
import type { Canvas } from "fabric";
import {
  serializeFabricCanvasJson,
  STUDIO_FABRIC_OBJECT_PROPS,
} from "@studio/lib/studioFabricSerialize";

const MAX_STACK = 60;

export const useHistory = (
  fabricRef: MutableRefObject<Canvas | null>,
  ready: boolean,
  // Default to the module-level constant directly (not `[...STUDIO_FABRIC_OBJECT_PROPS]`,
  // which allocated a brand-new array — and therefore a new `commit` identity —
  // on every render). An unstable `commit` re-ran the listener-registration
  // effect below on every React render, calling `commit()` each time (28.3;
  // the Planner hook fixed exactly this — see usePlannerHistory.ts).
  propsToInclude: readonly string[] = STUDIO_FABRIC_OBJECT_PROPS,
  // Called after a successful loadFromJSON so the caller can re-draw
  // canvas-managed decorations (grid lines) that are deliberately excluded
  // from the serialized snapshot and would otherwise be dropped on undo/redo.
  onRestore?: () => void,
) => {
  const past = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const suppress = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const snapshot = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return null;
    return serializeFabricCanvasJson(c, propsToInclude);
  }, [fabricRef, propsToInclude]);

  const commit = useCallback(() => {
    const c = fabricRef.current;
    if (!c || suppress.current) return;
    const snap = serializeFabricCanvasJson(c, propsToInclude);
    const last = past.current[past.current.length - 1];
    if (last === snap) return;
    past.current.push(snap);
    if (past.current.length > MAX_STACK) past.current.shift();
    future.current = [];
    setCanUndo(past.current.length > 1);
    setCanRedo(false);
  }, [fabricRef, propsToInclude]);

  const loadJson = useCallback(
    (json: string) => {
      const c = fabricRef.current;
      if (!c) return;
      // Guard JSON.parse: a corrupt snapshot must not throw out of
      // undo()/redo() and must not leave `suppress` set (which would
      // permanently stop history recording).
      let parsed: object;
      try {
        parsed = JSON.parse(json) as object;
      } catch {
        return;
      }
      suppress.current = true;
      void c
        .loadFromJSON(parsed)
        .then(() => {
          c.requestRenderAll();
          // loadFromJSON replaces the entire object list, which discards
          // canvas-managed decorations (grid lines) that are deliberately
          // excluded from the serialized snapshot. Let the caller re-draw
          // them so undo/redo doesn't visually corrupt the canvas.
          onRestore?.();
        })
        .catch(() => {
          c.requestRenderAll();
        })
        .finally(() => {
          suppress.current = false;
        });
    },
    [fabricRef, onRestore],
  );

  const undo = useCallback(() => {
    if (past.current.length < 2) return;
    const current = past.current.pop();
    if (current === undefined) return;
    future.current.push(current);
    const prev = past.current[past.current.length - 1];
    if (prev) loadJson(prev);
    setCanUndo(past.current.length > 1);
    setCanRedo(future.current.length > 0);
  }, [loadJson]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const next = future.current.pop();
    if (next === undefined) return;
    past.current.push(next);
    loadJson(next);
    setCanUndo(past.current.length > 1);
    setCanRedo(future.current.length > 0);
  }, [loadJson]);

  const reset = useCallback(() => {
    past.current = [];
    future.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const c = fabricRef.current;
    if (!c) return;
    const onChange = () => commit();
    c.on("object:added", onChange);
    c.on("object:modified", onChange);
    c.on("object:removed", onChange);
    c.on("path:created", onChange);
    commit();
    return () => {
      c.off("object:added", onChange);
      c.off("object:modified", onChange);
      c.off("object:removed", onChange);
      c.off("path:created", onChange);
    };
  }, [ready, fabricRef, commit]);

  return { commit, undo, redo, reset, canUndo, canRedo, snapshot };
};
