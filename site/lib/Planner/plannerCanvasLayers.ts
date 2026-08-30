import type { FabricObject } from "fabric";
import type { LayerRow, OoFabricObject } from "@planner/lib/plannerTypes";

/** Shapes smaller than this are treated as accidental clicks. */
export const MIN_DRAW_SIZE_PX = 4;

export function isCanvasHelperObject(o: FabricObject): boolean {
  const oo = o as OoFabricObject;
  const data = oo.data;
  if (
    data?.isGridLine ||
    data?.isSheet ||
    data?.isGuide ||
    data?.isPreview ||
    data?.isDimPreview
  ) {
    return true;
  }
  return oo.excludeFromExport === true && !data?.id;
}

export function isUserLayerObject(o: FabricObject): boolean {
  if (isCanvasHelperObject(o)) return false;
  const id = (o as OoFabricObject).data?.id;
  return typeof id === "string" && id.length > 0;
}

function labelFor(o: OoFabricObject): string {
  return String(o.data?.label ?? o.type ?? "Object");
}

export function collectUserLayerRows(objects: FabricObject[]): LayerRow[] {
  return objects
    .filter(isUserLayerObject)
    .map((o) => {
      const oo = o as OoFabricObject;
      return {
        id: String(oo.data?.id),
        label: labelFor(oo),
        visible: o.visible !== false,
        locked: !!o.lockMovementX,
      };
    });
}

type PersistedLayerRow = {
  id: string;
  label?: string;
  visible?: boolean;
  locked?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readPersistedLayerRows(value: unknown): PersistedLayerRow[] {
  if (!Array.isArray(value)) return [];
  const rows: PersistedLayerRow[] = [];
  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.id !== "string" || !entry.id.trim()) {
      continue;
    }
    rows.push({
      id: entry.id,
      ...(typeof entry.label === "string" && entry.label.trim()
        ? { label: entry.label.trim() }
        : {}),
      ...(typeof entry.visible === "boolean" ? { visible: entry.visible } : {}),
      ...(typeof entry.locked === "boolean" ? { locked: entry.locked } : {}),
    });
  }
  return rows;
}

/**
 * Reconcile the opaque Gate B layer payload with the Fabric snapshot.
 *
 * The canvas snapshot remains the source of geometry and object identity. The
 * known UI layer fields are applied only when present, while missing/legacy
 * rows fall back to the hydrated object metadata. The returned order matches
 * the Planner panel's top-first convention used by save requests.
 */
export function restorePersistedLayerRows(
  objects: FabricObject[],
  persisted: unknown,
): LayerRow[] {
  const persistedRows = readPersistedLayerRows(persisted);
  const byId = new Map(persistedRows.map((row) => [row.id, row]));

  for (const object of objects) {
    if (!isUserLayerObject(object)) continue;
    const oo = object as OoFabricObject;
    const id = String(oo.data?.id);
    const row = byId.get(id);
    if (!row) continue;

    if (row.label) {
      oo.data = { ...(oo.data ?? {}), label: row.label };
    }
    if (row.visible !== undefined) {
      object.visible = row.visible;
    }
    if (row.locked !== undefined) {
      object.set({
        lockMovementX: row.locked,
        lockMovementY: row.locked,
        lockScalingX: row.locked,
        lockScalingY: row.locked,
        lockRotation: row.locked,
        selectable: !row.locked,
      });
    }
  }

  const rows = collectUserLayerRows(objects).reverse();
  const persistedOrder = new Map(
    persistedRows.map((row, index) => [row.id, index]),
  );
  return rows.sort((left, right) => {
    const leftOrder = persistedOrder.get(left.id);
    const rightOrder = persistedOrder.get(right.id);
    if (leftOrder === undefined && rightOrder === undefined) return 0;
    if (leftOrder === undefined) return 1;
    if (rightOrder === undefined) return -1;
    return leftOrder - rightOrder;
  });
}

export function isTooSmallDrawnShape(o: FabricObject, tool: string): boolean {
  const min = MIN_DRAW_SIZE_PX;
  if (tool === "rect" || tool === "roundedRect" || tool === "triangle" || tool === "star" || tool === "ellipse") {
    return o.getScaledWidth() < min && o.getScaledHeight() < min;
  }
  if (tool === "circle" || tool === "arc") {
    const ellipse = o as FabricObject & { rx?: number; ry?: number; radius?: number };
    const sx = o.scaleX ?? 1;
    const sy = o.scaleY ?? 1;
    if (typeof ellipse.radius === "number") {
      return ellipse.radius * 2 * Math.max(sx, sy) < min;
    }
    return (ellipse.rx ?? 0) * 2 * sx < min && (ellipse.ry ?? 0) * 2 * sy < min;
  }
  if (tool === "line" || tool === "wall" || tool === "arrow") {
    const line = o as FabricObject & { x1?: number; y1?: number; x2?: number; y2?: number };
    if (typeof line.x1 === "number") {
      const dx = (line.x2 ?? 0) - (line.x1 ?? 0);
      const dy = (line.y2 ?? 0) - (line.y1 ?? 0);
      return Math.hypot(dx, dy) < min;
    }
    return o.getScaledWidth() < min && o.getScaledHeight() < min;
  }
  return false;
}

export function isDragDrawTool(tool: string): boolean {
  return (
    tool === "rect" ||
    tool === "roundedRect" ||
    tool === "circle" ||
    tool === "ellipse" ||
    tool === "triangle" ||
    tool === "star" ||
    tool === "line" ||
    tool === "arrow" ||
    tool === "arc" ||
    tool === "wall"
  );
}
