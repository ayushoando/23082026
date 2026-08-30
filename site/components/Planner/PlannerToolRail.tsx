"use client";
import React, { ReactNode, useRef } from "react";
import { IconButton } from "@planner/components/PlannerIconButton";
import type { ToolRailEntry } from "@planner/lib/plannerTypes";
import { useRovingTabindex } from "@planner/hooks/usePlannerFocusManager";

type ToolRailProps = {
  tools: ToolRailEntry[];
  activeTool: string;
  onSelect: (id: string) => void;
  extras?: ReactNode;
};

export const ToolRail = ({ tools, activeTool, onSelect, extras }: ToolRailProps) => {
  const railRef = useRef<HTMLDivElement>(null);
  const { onKeyDown } = useRovingTabindex(railRef, { orientation: "vertical" });

  return (
    <div
      ref={railRef}
      className="tool-rail"
      data-testid="tool-rail"
      role="toolbar"
      tabIndex={0}
      aria-label="Canvas tools"
      aria-orientation="vertical"
      onKeyDown={onKeyDown}
    >
      {tools.map((t, i) =>
        t.divider ? (
          <div key={`d${i}`} className="tool-rail__divider" />
        ) : (
          <IconButton
            key={t.id}
            icon={t.icon}
            label={t.label + (t.shortcut ? ` (${t.shortcut})` : "")}
            active={activeTool === t.id}
            onClick={() => onSelect(t.id)}
            testId={`tool-${t.id}`}
          />
        ),
      )}
      <div style={{ flex: 1 }} />
      {extras}
    </div>
  );
};

export default ToolRail;
