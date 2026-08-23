"use client";
import { OO_DRAW } from "@planner/lib/plannerPalette";
import React, { type ReactNode } from "react";
import { PropertiesPanel } from "@planner/components/PlannerPropertiesPanel";
import { LayersPanel } from "@planner/components/PlannerLayersPanel";
import { ColorPalette } from "@planner/components/PlannerColorPalette";
import { SheetSettings } from "@planner/components/PlannerSheetSettings";
import CatalogRail from "@planner/components/PlannerCatalogRail";
import { BoqPanel } from "@planner/components/PlannerBoqPanel";
import { ValidationPanel } from "@planner/components/PlannerValidationPanel";
import { usePlanner } from "@planner/hooks/usePlannerDockBridge";
import { ToolRail } from "@planner/components/PlannerToolRail";
import { PhIcon } from "@planner/components/ui/PlannerPhIcon";
import type { ToolRailEntry } from "@planner/lib/plannerTypes";

export const PLANNER_TOOLS: ToolRailEntry[] = [
  { id: "select", label: "Select", icon: "cursor", shortcut: "V" },
  { id: "pan", label: "Pan", icon: "hand", shortcut: "H" },
  { divider: true, id: "divider-1", label: "", icon: "" },
  { id: "wall", label: "Wall", icon: "wall", shortcut: "W" },
  { id: "door", label: "Door", icon: "door" },
  { id: "window", label: "Window", icon: "window" },
  { divider: true, id: "divider-2", label: "", icon: "" },
  { id: "line", label: "Line", icon: "line", shortcut: "L" },
  { id: "dimension", label: "Measure", icon: "dimension", shortcut: "D" },
  { id: "text", label: "Text", icon: "text", shortcut: "T" },
];

export const PlannerToolsPanel = () => {
  const { tool, setTool, undo, redo } = usePlanner();
  return (
    <div className="dock-panel dock-panel--tools">
      <ToolRail
        tools={PLANNER_TOOLS}
        activeTool={tool}
        onSelect={setTool}
        extras={(
          <>
            <button type="button" className="icon-btn" onClick={undo} title="Undo" aria-label="Undo" data-testid="btn-undo">
              <PhIcon name="undo" size={18} />
            </button>
            <button type="button" className="icon-btn" onClick={redo} title="Redo" aria-label="Redo" data-testid="btn-redo">
              <PhIcon name="redo" size={18} />
            </button>
          </>
        )}
      />
    </div>
  );
};

const pad = (children: ReactNode) => <div className="dock-panel">{children}</div>;

export const PlannerCatalogPanel = () => {
  const { placeFurnitureItem } = usePlanner();
  return (
    <div className="dock-panel dock-panel--catalog">
      <CatalogRail onItemClick={placeFurnitureItem} />
    </div>
  );
};

export const PlannerSheetPanel = () => {
  const { sheet, setSheet } = usePlanner();
  return pad(<SheetSettings sheet={sheet} onChange={setSheet} />);
};

export const PlannerPropsPanel = () => {
  const { propObj, scalePxPerMm, setObjectProp } = usePlanner();
  return pad(<PropertiesPanel selected={propObj} scalePxPerMm={scalePxPerMm} onChange={setObjectProp} />);
};

export const PlannerLayersPanel = () => {
  const { layers, selectedIds, layerSelect, layerToggleVisible, layerToggleLock, layerDelete, layerReorder } = usePlanner();
  return pad(
    <LayersPanel
      objects={layers}
      selectedId={selectedIds[0]}
      onSelect={layerSelect}
      onToggleVisible={layerToggleVisible}
      onToggleLock={layerToggleLock}
      onDelete={layerDelete}
      onReorder={layerReorder}
    />
  );
};

export const PlannerColorPanel = () => {
  const { propObj, applyFill, applyStroke } = usePlanner();
  return pad(
    <ColorPalette
      fill={propObj?.__props?.fill || "transparent"}
      stroke={propObj?.__props?.stroke || OO_DRAW.stroke}
      onFillChange={applyFill}
      onStrokeChange={applyStroke}
    />
  );
};

export const PlannerBoqPanel = () => pad(<BoqPanel />);

export const PlannerValidationPanel = () => pad(<ValidationPanel />);
