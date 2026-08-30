"use client";

import { useCallback, useRef, useState, useSyncExternalStore, type SetStateAction } from "react";

export type PanelResizeEdge = "start" | "end";

type UsePanelResizeOptions = {
  storageKey: string;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  /** `start` = left panel (grows when dragging right). `end` = right panel (grows when dragging left). */
  edge: PanelResizeEdge;
};

function readStoredWidth(key: string, fallback: number, min: number, max: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, Math.round(n)));
  } catch {
    return fallback;
  }
}

export function usePanelResize({
  storageKey,
  defaultWidth,
  minWidth = 220,
  maxWidth = 560,
  edge,
}: UsePanelResizeOptions) {
  const [active, setActive] = useState(false);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);
  const storageEventName = `planner-panel-resize:${storageKey}`;
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      window.addEventListener(storageEventName, onStoreChange);
      window.addEventListener("storage", onStoreChange);
      return () => {
        window.removeEventListener(storageEventName, onStoreChange);
        window.removeEventListener("storage", onStoreChange);
      };
    },
    [storageEventName],
  );
  const getSnapshot = useCallback(
    () => readStoredWidth(storageKey, defaultWidth, minWidth, maxWidth),
    [storageKey, defaultWidth, minWidth, maxWidth],
  );
  const getServerSnapshot = useCallback(() => defaultWidth, [defaultWidth]);
  const width = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setWidth = useCallback(
    (nextWidth: SetStateAction<number>) => {
      const currentWidth = readStoredWidth(storageKey, defaultWidth, minWidth, maxWidth);
      const resolvedWidth = typeof nextWidth === "function"
        ? nextWidth(currentWidth)
        : nextWidth;
      const boundedWidth = Math.min(maxWidth, Math.max(minWidth, Math.round(resolvedWidth)));
      try {
        localStorage.setItem(storageKey, String(boundedWidth));
      } catch {
        /* noop */
      }
      window.dispatchEvent(new Event(storageEventName));
    },
    [defaultWidth, maxWidth, minWidth, storageEventName, storageKey],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);
      dragRef.current = { startX: event.clientX, startW: width };
      setActive(true);

      const onMove = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        const delta = edge === "start" ? ev.clientX - drag.startX : drag.startX - ev.clientX;
        const next = Math.min(maxWidth, Math.max(minWidth, Math.round(drag.startW + delta)));
        setWidth(next);
      };

      const onUp = (ev: PointerEvent) => {
        dragRef.current = null;
        setActive(false);
        try {
          target.releasePointerCapture(ev.pointerId);
        } catch {
          /* noop */
        }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [edge, maxWidth, minWidth, setWidth, width],
  );

  const resizeBy = useCallback(
    (delta: number) => {
      setWidth((current) => Math.min(maxWidth, Math.max(minWidth, current + delta)));
    },
    [maxWidth, minWidth, setWidth],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const direction = edge === "start" ? 1 : -1;
      const step = event.shiftKey ? 40 : 10;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        resizeBy(-step * direction);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        resizeBy(step * direction);
      } else if (event.key === "Home") {
        event.preventDefault();
        setWidth(minWidth);
      } else if (event.key === "End") {
        event.preventDefault();
        setWidth(maxWidth);
      }
    },
    [edge, maxWidth, minWidth, resizeBy, setWidth],
  );

  return {
    width,
    setWidth,
    active,
    handleProps: {
      role: "separator" as const,
      tabIndex: 0,
      "aria-label": edge === "start" ? "Resize left panel" : "Resize right panel",
      "aria-orientation": "vertical" as const,
      "aria-valuenow": width,
      "aria-valuemin": minWidth,
      "aria-valuemax": maxWidth,
      "aria-valuetext": `${width} pixels wide`,
      "data-testid": "side-panel-resize",
      onKeyDown,
      onPointerDown,
    },
  };
}
