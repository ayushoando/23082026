"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { filterCommands, type PlannerCommand } from "@planner/lib/commands/registry";

type Props = {
  open: boolean;
  commands: readonly PlannerCommand[];
  onClose: () => void;
};

export function PlannerCommandPalette({ open, commands, onClose }: Props) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => filterCommands(commands, query), [commands, query]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const invokerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      invokerRef.current?.focus();
      invokerRef.current = null;
      return;
    }
    invokerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    queueMicrotask(() => inputRef.current?.focus());
  }, [open]);

  // Close when the user clicks outside the dialog panel (Req 7.6).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (
        dialogRef.current &&
        event.target instanceof Node &&
        !dialogRef.current.contains(event.target)
      ) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop — blocks pointer events to canvas so aria-modal is visually
          backed by a real inert surface. Clicking the scrim triggers the
          pointer-down close handler above (Req 7.6, 8.1). */}
      <div
        className="planner-command-palette-scrim"
        aria-hidden="true"
        data-testid="planner-command-palette-scrim"
      />
      <div
        ref={dialogRef}
        className="planner-command-palette"
        data-testid="planner-command-palette"
        role="dialog"
        aria-modal="true"
        aria-labelledby="planner-command-palette-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
            return;
          }
          if (event.key !== "Tab") return;
          const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
            'input, button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          );
          if (!focusable?.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <h2 id="planner-command-palette-title" className="planner-command-palette__title">
          Command palette
        </h2>
        <label className="sr-only" htmlFor="planner-command-query">
          Search available Planner commands
        </label>
        <input
          ref={inputRef}
          id="planner-command-query"
          className="input"
          placeholder="Type a command…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="planner-command-query"
          aria-controls="planner-command-list"
          aria-describedby="planner-command-result-count"
          onKeyDown={(e) => {
            if (e.key === "Enter" && filtered[0]) {
              e.preventDefault();
              filtered[0].run();
              onClose();
            }
          }}
        />
        <p id="planner-command-result-count" className="sr-only" role="status" aria-live="polite">
          {filtered.length === 0 ? "No matching commands" : `${filtered.length} command${filtered.length === 1 ? "" : "s"} available`}
        </p>
        <ul id="planner-command-list" data-testid="planner-command-list" aria-label="Available Planner commands">
          {filtered.map((cmd) => (
            <li key={cmd.id}>
              <button
                type="button"
                className="btn btn--sm"
                data-testid={`planner-command-${cmd.id}`}
                onClick={() => {
                  cmd.run();
                  onClose();
                }}
              >
                {cmd.label}
              </button>
            </li>
          ))}
          {filtered.length === 0 ? <li className="planner-command-palette__empty">No matching commands</li> : null}
        </ul>
        <button type="button" className="btn btn--sm" onClick={onClose} data-testid="planner-command-close">
          Close
        </button>
      </div>
    </>
  );
}
