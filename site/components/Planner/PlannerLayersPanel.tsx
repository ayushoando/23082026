"use client";
import React from "react";
import { PanelEmptyState } from "@planner/components/ui/PlannerPanelEmptyState";
import { PhIcon } from "@planner/components/ui/PlannerPhIcon";
import type { LayerRow } from "@planner/lib/plannerTypes";

interface LayersPanelProps {
  objects: LayerRow[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, delta: number) => void;
}

export const LayersPanel = ({
  objects,
  selectedId,
  onSelect,
  onToggleVisible,
  onToggleLock,
  onDelete,
  onReorder,
}: LayersPanelProps) => {
  if (!objects || objects.length === 0) {
    return (
      <PanelEmptyState
        icon="layers"
        title="No objects yet"
        body="Draw walls, doors, or furniture with the tools on the left."
        testId="layers-empty-state"
      />
    );
  }
  return (
    <ul
      id="planner-canvas-object-list"
      className="planner-layer-list"
      data-testid="layers-panel"
      aria-label="Canvas objects"
    >
      {objects.map((o) => (
        <li
          key={o.id}
          className="layer-item"
          data-selected={o.id === selectedId}
          data-testid={`layer-${o.id}`}
        >
          <button
            type="button"
            className="layer-item__select"
            aria-label={`Select ${o.label}`}
            aria-pressed={o.id === selectedId}
            onClick={() => onSelect(o.id)}
          >
            {o.label}
          </button>
          <div className="layer-item__actions" role="group" aria-label={`${o.label} actions`}>
            <button type="button" className="layer-item__icon-btn" onClick={() => onReorder(o.id, -1)} title="Bring forward" aria-label={`Bring ${o.label} forward`}>
              <PhIcon name="arrowUp" size={18} />
            </button>
            <button type="button" className="layer-item__icon-btn" onClick={() => onReorder(o.id, 1)} title="Send backward" aria-label={`Send ${o.label} backward`}>
              <PhIcon name="arrowDown" size={18} />
            </button>
            <button type="button" className="layer-item__icon-btn" onClick={() => onToggleVisible(o.id)} title="Toggle visibility" aria-label={`${o.visible ? "Hide" : "Show"} ${o.label}`} aria-pressed={o.visible}>
              <PhIcon name={o.visible ? "eye" : "eyeOff"} size={18} />
            </button>
            <button type="button" className="layer-item__icon-btn" onClick={() => onToggleLock(o.id)} title="Toggle lock" aria-label={`${o.locked ? "Unlock" : "Lock"} ${o.label}`} aria-pressed={o.locked}>
              <PhIcon name={o.locked ? "lock" : "unlock"} size={18} />
            </button>
            <button type="button" className="layer-item__icon-btn" onClick={() => onDelete(o.id)} title="Delete" aria-label={`Delete ${o.label}`}>
              <PhIcon name="trash" size={18} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default LayersPanel;
