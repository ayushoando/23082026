"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { PhIcon } from "@planner/components/ui/PlannerPhIcon";
import type { ContextMenuItem } from "@planner/lib/plannerTypes";

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose?: () => void;
}

export const ContextMenu = ({ x, y, items, onClose }: ContextMenuProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const invokerRef = useRef<HTMLElement | null>(
    typeof document !== "undefined" && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  const [pos, setPos] = useState({ x, y });

  if (pos.x !== x || pos.y !== y) {
    setPos({ x, y });
  }

  const close = useCallback(() => {
    onClose?.();
    queueMicrotask(() => invokerRef.current?.focus());
  }, [onClose]);

  useEffect(() => {
    const firstEnabled = itemRefs.current.find((item) => item && !item.disabled);
    firstEnabled?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && event.target instanceof Node && !ref.current.contains(event.target)) {
        close();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [close]);

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({
      x: Math.max(8, Math.min(x, window.innerWidth - rect.width - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - rect.height - 8)),
    });
  }, [x, y, items]);

  const moveFocus = (current: number, delta: number) => {
    if (itemRefs.current.length === 0) return;
    let next = current;
    for (let count = 0; count < itemRefs.current.length; count += 1) {
      next = (next + delta + itemRefs.current.length) % itemRefs.current.length;
      const candidate = itemRefs.current[next];
      if (candidate && !candidate.disabled) {
        candidate.focus();
        return;
      }
    }
  };

  return (
    <div
      ref={ref}
      className="context-menu"
      style={{ left: pos.x, top: pos.y }}
      data-testid="context-menu"
      role="menu"
      aria-label="Canvas actions"
      onKeyDown={(event) => {
        if (event.key === "Escape" || event.key === "Tab") {
          event.preventDefault();
          close();
        }
      }}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={`separator-${index}`} className="context-menu__sep" role="separator" />;
        }
        return (
          <button
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            key={item.id || index}
            className="context-menu__item"
            type="button"
            tabIndex={-1}
            onClick={() => {
              item.onClick?.();
              close();
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                moveFocus(index, 1);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                moveFocus(index, -1);
              } else if (event.key === "Home") {
                event.preventDefault();
                moveFocus(-1, 1);
              } else if (event.key === "End") {
                event.preventDefault();
                moveFocus(0, -1);
              }
            }}
            disabled={item.disabled}
            data-testid={`ctx-${item.id}`}
            role="menuitem"
          >
            {item.icon ? <PhIcon name={item.icon} size={18} /> : null}
            <span className="context-menu__label">{item.label}</span>
            {item.shortcut ? <span className="context-menu__shortcut">{item.shortcut}</span> : null}
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;
