/**
 * Module-level types, constants, and configuration for the Studio canvas.
 * Extracted from Studio.tsx to keep the component file focused on runtime logic.
 */
import type { FurnitureDimensions, OoFabricObject, ToolRailEntry } from "@studio/lib/studioTypes";
import { OO_DRAW } from "@studio/lib/studioPalette";
import * as fabric from "fabric";
import {
  StudioColorPanel,
  StudioLayersPanel,
  StudioPropsPanel,
} from "@studio/components/dock/StudioDockPanels";

// ─── Local types ────────────────────────────────────────────────────────────

export type LayerItem = {
  id: string | undefined;
  label: string;
  visible: boolean;
  locked: boolean;
};

export type PropObjProps = {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  fill: string | fabric.TFiller | null;
  stroke: string | null;
  strokeWidth: number;
  opacity: number;
  rx: number;
};

export type PropObjState = {
  __props: PropObjProps;
  __obj: OoFabricObject;
} | null;

export type SaveDataState = {
  name: string;
  category: string;
  subcategory: string;
  tags: string;
  width_mm: number;
  depth_mm: number;
  height_mm: number;
  notes: string;
};

export type AiSuggestion = {
  name?: string;
  category?: string;
  tags?: string[];
  dimensions?: FurnitureDimensions;
  svg?: string;
};

export type Point2D = { x: number; y: number };

// ─── Canvas helpers ──────────────────────────────────────────────────────────

export const asOo = (obj: fabric.FabricObject): OoFabricObject =>
  obj as OoFabricObject;

export const getErrorMessage = (e: unknown): string => {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e)
    return String((e as { message: unknown }).message);
  return String(e);
};

export const getApiErrorMessage = (e: unknown): string => {
  if (typeof e === "object" && e !== null && "response" in e) {
    const resp = (e as { response?: { data?: { detail?: unknown } } }).response;
    if (resp?.data?.detail !== null && resp?.data?.detail !== undefined)
      return String(resp.data.detail);
  }
  return getErrorMessage(e);
};

/** Monotonic id generator — survives HMR because it lives at module scope. */
const _nextObjIdCounter = { n: 0 };
export const nextObjId = (): string =>
  `o${Date.now().toString(36)}_${(++_nextObjIdCounter.n).toString(36)}`;

export const tag = (obj: OoFabricObject, label?: string): OoFabricObject => {
  obj.data = obj.data || {};
  if (!obj.data.id) obj.data.id = nextObjId();
  if (label) obj.data.label = label;
  return obj;
};

// ─── Draw defaults ───────────────────────────────────────────────────────────

export const DEFAULT_STROKE = OO_DRAW.stroke;
export const DEFAULT_FILL = OO_DRAW.fill;

// ─── Tool rail entries ───────────────────────────────────────────────────────

export const STUDIO_TOOLS = [
  { id: "select", label: "Select", icon: "cursor", shortcut: "V" },
  { id: "pan", label: "Pan", icon: "hand", shortcut: "H" },
  { divider: true } as unknown as ToolRailEntry,
  { id: "rect", label: "Rectangle", icon: "rect", shortcut: "R" },
  { id: "roundedRect", label: "Rounded rect", icon: "roundedRect" },
  { id: "circle", label: "Circle", icon: "circle", shortcut: "C" },
  { id: "ellipse", label: "Ellipse", icon: "ellipse" },
  { id: "triangle", label: "Triangle", icon: "triangle" },
  { id: "star", label: "Star", icon: "star" },
  { id: "line", label: "Line", icon: "line", shortcut: "L" },
  { id: "arrow", label: "Arrow", icon: "arrow" },
  { id: "arc", label: "Arc", icon: "arc" },
  { id: "polygon", label: "Polygon", icon: "polygon", shortcut: "P" },
  { divider: true } as unknown as ToolRailEntry,
  { id: "freehand", label: "Freehand", icon: "freehand", shortcut: "M" },
  { id: "pen", label: "Pen", icon: "pen" },
  { id: "brush", label: "Brush", icon: "brush" },
  { divider: true } as unknown as ToolRailEntry,
  { id: "text", label: "Text", icon: "text", shortcut: "T" },
  { id: "dimension", label: "Measure", icon: "dimension", shortcut: "D" },
] as ToolRailEntry[];

// ─── Dock panel configurations ───────────────────────────────────────────────

export const STUDIO_LEFT_PANELS = [
  { id: "color", title: "Color", render: StudioColorPanel },
  {
    id: "layers",
    title: "Layers",
    render: StudioLayersPanel,
    position: { direction: "below" },
  },
];

export const STUDIO_RIGHT_PANELS = [
  { id: "props", title: "Properties", render: StudioPropsPanel },
];
