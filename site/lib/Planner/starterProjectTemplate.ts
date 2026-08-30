import {
  PLANNER_SCALE_PX_PER_MM,
  plannerMmToPx,
} from "@planner/lib/plannerGeometryContract";

const STARTER_ITEMS = [
  { id: "starter-desk-1", name: "Workstation 1", width_mm: 1400, depth_mm: 700, left_mm: 2000, top_mm: 1500 },
  { id: "starter-desk-2", name: "Workstation 2", width_mm: 1400, depth_mm: 700, left_mm: 4000, top_mm: 1500 },
  { id: "starter-chair-1", name: "Task chair", width_mm: 600, depth_mm: 600, left_mm: 2000, top_mm: 2800 },
  { id: "starter-chair-2", name: "Task chair", width_mm: 600, depth_mm: 600, left_mm: 4000, top_mm: 2800 },
  { id: "starter-table-1", name: "Meeting table", width_mm: 2400, depth_mm: 1200, left_mm: 6500, top_mm: 2000 },
  { id: "starter-storage-1", name: "Storage unit", width_mm: 900, depth_mm: 450, left_mm: 9000, top_mm: 1500 },
] as const;

function furnitureRect(item: (typeof STARTER_ITEMS)[number]) {
  const wPx = plannerMmToPx(item.width_mm);
  const dPx = plannerMmToPx(item.depth_mm);
  const left = plannerMmToPx(item.left_mm);
  const top = plannerMmToPx(item.top_mm);
  return {
    type: "Rect",
    version: "7.4.0",
    originX: "left",
    originY: "top",
    left,
    top,
    width: wPx,
    height: dPx,
    fill: "#F4F0E8",
    stroke: "#1A1A1A",
    strokeWidth: 1.2,
    strokeUniform: true,
    data: {
      id: item.id,
      kind: "furniture",
      label: item.name,
      furniture_id: item.id,
      dimensions: {
        width_mm: item.width_mm,
        depth_mm: item.depth_mm,
        height_mm: 750,
      },
    },
  };
}

/** Bundled starter floor plan for onboarding (plan 21 module 5). */
export function buildStarterProjectPayload() {
  return {
    name: "Sample small office",
    canvas_json: {
      version: "7.4.0",
      objects: STARTER_ITEMS.map(furnitureRect),
      background: "#FFFFFF",
    },
    sheet: {
      width_mm: 15000,
      height_mm: 10000,
      unit: "mm",
      scale_px_per_mm: PLANNER_SCALE_PX_PER_MM,
    },
    layers: [],
  };
}
