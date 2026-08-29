/**
 * Fabric v7-safe canvas serialize helpers for Planner.
 * `toJSON()` takes no properties; use `toObject(extraProps)` for custom `data`.
 */
import type { Canvas } from "fabric";
import type {
  FabricLikeCanvas,
  FabricLikeObject,
} from "@planner/lib/fabricGeometryBridge";
import { collectSceneGeometry } from "@planner/lib/fabricGeometryBridge";
import {
  PLANNER_GEOMETRY_CONTRACT_VERSION,
  PLANNER_GEOMETRY_SCHEMA_VERSION,
  PLANNER_GEOMETRY_UNIT,
  PLANNER_SCALE_PX_PER_MM,
  readPlannerGeometry,
  type PlannerGeometryReadResult,
  type PlannerGeometrySnapshotV1,
} from "@planner/lib/plannerGeometryContract";

export const PLANNER_FABRIC_OBJECT_PROPS = [
  "data",
  "selectable",
  "evented",
  "lockRotation",
  "lockScalingX",
  "lockScalingY",
] as const;

export type FabricSerializeCanvas = Pick<Canvas, "toObject">;

export function serializeFabricCanvas(
  canvas: FabricSerializeCanvas,
  propertiesToInclude: readonly string[] = PLANNER_FABRIC_OBJECT_PROPS,
): Record<string, unknown> {
  return canvas.toObject([...propertiesToInclude]) as Record<string, unknown>;
}

export function serializeFabricCanvasJson(
  canvas: FabricSerializeCanvas,
  propertiesToInclude: readonly string[] = PLANNER_FABRIC_OBJECT_PROPS,
): string {
  return JSON.stringify(serializeFabricCanvas(canvas, propertiesToInclude));
}

/** Serialize view-independent millimetre geometry with explicit Planner scale metadata. */
export function serializePlannerGeometry(
  canvas: FabricLikeCanvas | FabricLikeObject[] | null | undefined,
  canvasSnapshot?: Record<string, unknown>,
): PlannerGeometrySnapshotV1 {
  return {
    contractVersion: PLANNER_GEOMETRY_CONTRACT_VERSION,
    schemaVersion: PLANNER_GEOMETRY_SCHEMA_VERSION,
    unit: PLANNER_GEOMETRY_UNIT,
    scalePxPerMm: PLANNER_SCALE_PX_PER_MM,
    geometry: collectSceneGeometry(canvas, PLANNER_SCALE_PX_PER_MM),
    ...(canvasSnapshot ? { canvasSnapshot } : {}),
  };
}

/**
 * Deserialize persisted Planner geometry. Validates scale metadata, adapts
 * known legacy snapshots deterministically, and returns an explicit error for
 * unsupported scale/version rather than silently applying Studio scale.
 *
 * This is the canonical deserialization entry point for the persistence
 * boundary (Gate B contract).
 */
export function deserializePlannerGeometry(
  input: unknown,
): PlannerGeometryReadResult {
  return readPlannerGeometry(input);
}
