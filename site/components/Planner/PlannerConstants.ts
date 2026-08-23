/**
 * Module-level types, constants, and panel configuration for the Planner canvas.
 * Extracted from Planner.tsx to keep the component file focused on runtime logic.
 */
import type { FurnitureItem, OoFabricObject, OoObjectData, PlannerSheet } from "@planner/lib/plannerTypes";
import { DEFAULT_SHEET_MM, SCALE_PX_PER_MM } from "@planner/lib/plannerPalette";
import * as fabric from "fabric";
import {
  PlannerBoqPanel,
  PlannerCatalogPanel,
  PlannerColorPanel,
  PlannerLayersPanel,
  PlannerPropsPanel,
  PlannerSheetPanel,
  PlannerToolsPanel,
  PlannerValidationPanel,
} from "@planner/components/dock/PlannerDockPanels";

// ─── Local types ────────────────────────────────────────────────────────────

export type PlannerTool =
  | "select"
  | "pan"
  | "wall"
  | "door"
  | "window"
  | "rect"
  | "line"
  | "dimension"
  | "text";

export type Point2D = { x: number; y: number };

export type AutoArrangeParams = {
  items: Array<FurnitureItem & { count?: number }>;
  gap_mm: number;
  margin_mm: number;
};

export type FabricCanvasJson = {
  objects: Array<{ data?: OoObjectData }>;
  [key: string]: unknown;
};

// ─── Canvas helpers ──────────────────────────────────────────────────────────

export const asOo = (obj: fabric.FabricObject): OoFabricObject =>
  obj as OoFabricObject;

export const errMessage = (e: unknown): string =>
  e instanceof Error ? e.message : String(e);

/** Monotonic id generator — survives HMR because it lives at module scope. */
const _nextObjIdCounter = { n: 0 };
export const nextObjId = (): string =>
  `o${Date.now().toString(36)}_${(++_nextObjIdCounter.n).toString(36)}`;

export const tag = (
  obj: fabric.FabricObject,
  label?: string,
  kind?: string,
): OoFabricObject => {
  const oo = asOo(obj);
  oo.data = oo.data || {};
  if (!oo.data.id) oo.data.id = nextObjId();
  if (label) oo.data.label = label;
  if (kind) oo.data.kind = kind;
  return oo;
};

// ─── Sheet default ──────────────────────────────────────────────────────────

export const DEFAULT_SHEET: PlannerSheet = {
  width_mm: DEFAULT_SHEET_MM.width_mm,
  height_mm: DEFAULT_SHEET_MM.height_mm,
  unit: "mm",
  scale_px_per_mm: SCALE_PX_PER_MM,
};

// ─── Session storage key ─────────────────────────────────────────────────────

/**
 * Fallback binding for "which project was I last editing" — survives a hard
 * refresh even when the address bar doesn't carry the project id.
 */
export const PLANNER_LAST_PROJECT_KEY = "ooplanner.last-project-id";

// ─── Dock panel configurations ───────────────────────────────────────────────

export const PLANNER_TOOLS_PANELS = [
  { id: "tools", title: "Tools", render: PlannerToolsPanel },
];

export const PLANNER_LEFT_CATALOG_PANELS = [
  { id: "catalog", title: "Catalog", render: PlannerCatalogPanel },
];

export const PLANNER_DRAW_SHEET_PANEL = {
  id: "sheet",
  title: "Sheet",
  render: PlannerSheetPanel,
};

export const PLANNER_DRAW_COLOR_PANEL = {
  id: "color",
  title: "Color",
  render: PlannerColorPanel,
  position: { direction: "below" as const },
};

/** Place step — inspect selection and properties. */
export const PLANNER_RIGHT_PLACE_PANELS = [
  { id: "props", title: "Properties", render: PlannerPropsPanel },
];

/** Review step base docks — BOQ/validation gated by feature flags at runtime. */
export const PLANNER_RIGHT_REVIEW_BASE = [
  {
    id: "sheet",
    title: "Sheet",
    render: PlannerSheetPanel,
    position: { direction: "below" as const },
  },
  {
    id: "layers",
    title: "Layers",
    render: PlannerLayersPanel,
    position: { direction: "below" as const },
  },
  {
    id: "color",
    title: "Color",
    render: PlannerColorPanel,
    position: { direction: "below" as const },
  },
  {
    id: "props",
    title: "Properties",
    render: PlannerPropsPanel,
    position: { direction: "below" as const },
  },
];

/** Review step BOQ panel (appended when feature flag is on). */
export const PLANNER_BOQ_PANEL = {
  id: "boq",
  title: "Bill of Quantities",
  render: PlannerBoqPanel,
  position: { direction: "below" as const },
};

/** Review step validation panel (appended when feature flag is on). */
export const PLANNER_VALIDATION_PANEL = {
  id: "validation",
  title: "Validation",
  render: PlannerValidationPanel,
  position: { direction: "below" as const },
};
