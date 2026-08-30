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

const storedWidthListeners = new Set<() => void>();
const inMemoryWidths = new Map<string, number>();

function readStoredWidth(key: string, fallback: number, min: number, max: number): number {
  const inMemoryWidth = inMemoryWidths.get(key);
  if (inMemoryWidth !== undefined) return inMemoryWidth;
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

function subscribeToStoredWidths(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null) inMemoryWidths.clear();
    else inMemoryWidths.delete(event.key);
    listener();
  };
  storedWidthListeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    storedWidthListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function notifyStoredWidthListeners() {
  for (const listener of storedWidthListeners) listener();
}

export function usePanelResize({
  storageKey,
  defaultWidth,
  minWidth = 220,
  maxWidth = 560,
  edge,
}: UsePanelResizeOptions) {
  const getStoredWidth = useCallback(
    () => readStoredWidth(storageKey, defaultWidth, minWidth, maxWidth),
    [storageKey, defaultWidth, minWidth, maxWidth],
  );
  const getServerWidth = useCallback(() => defaultWidth, [defaultWidth]);
  const width = useSyncExternalStore(subscribeToStoredWidths, getStoredWidth, getServerWidth);
  const setWidth = useCallback(
    (nextValue: SetStateAction<number>) => {
      const currentWidth = getStoredWidth();
      const requestedWidth = typeof nextValue === "function" ? nextValue(currentWidth) : nextValue;
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, Math.round(requestedWidth)));
      inMemoryWidths.set(storageKey, nextWidth);
      try {
        localStorage.setItem(storageKey, String(nextWidth));
      } catch {
        /* preserve the in-memory width when persistence is unavailable */
      }
      notifyStoredWidthListeners();
    },
    [getStoredWidth, maxWidth, minWidth, storageKey],
  );
  const [active, setActive] = useState(false);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);

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

  return {
    width,
    setWidth,
    active,
    handleProps: {
      role: "separator" as const,
      "aria-orientation": "vertical" as const,
      "aria-valuenow": width,
      "aria-valuemin": minWidth,
      "aria-valuemax": maxWidth,
      "data-testid": "side-panel-resize",
      onPointerDown,
    },
  };
}
