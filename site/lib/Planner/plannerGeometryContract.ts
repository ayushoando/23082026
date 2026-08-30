/** Planner-only, versioned geometry persistence contract (Gate B). */

import type {
  PlannerMmRect,
  PlannerMmWall,
  PlannerMmOpening,
  PlannerSceneGeometry,
} from "@planner/lib/fabricGeometryBridge";

export const PLANNER_GEOMETRY_CONTRACT_VERSION = 1 as const;
export const PLANNER_GEOMETRY_SCHEMA_VERSION = 1 as const;
export const PLANNER_SCALE_PX_PER_MM = 0.05 as const;
export const PLANNER_GEOMETRY_UNIT = "mm" as const;

/**
 * Studio scale (0.2 px/mm) is the only known legacy scale that may exist in
 * older persisted snapshots. Deterministic adaptation rescales physical values
 * from the legacy scale to the canonical Planner scale without data loss.
 *
 * Unknown or zero scales are rejected with UNSUPPORTED_PLANNER_SCALE.
 */
export const STUDIO_SCALE_PX_PER_MM = 0.2 as const;
export const PLANNER_KNOWN_LEGACY_SCALES: ReadonlySet<number> = new Set([
  STUDIO_SCALE_PX_PER_MM,
]);

export interface PlannerGeometrySnapshotV1 {
  contractVersion: typeof PLANNER_GEOMETRY_CONTRACT_VERSION;
  schemaVersion: typeof PLANNER_GEOMETRY_SCHEMA_VERSION;
  unit: typeof PLANNER_GEOMETRY_UNIT;
  scalePxPerMm: typeof PLANNER_SCALE_PX_PER_MM;
  geometry: PlannerSceneGeometry;
  canvasSnapshot?: Record<string, unknown>;
}

export type PlannerGeometryReadErrorCode =
  | "INVALID_GEOMETRY"
  | "UNSUPPORTED_GEOMETRY_VERSION"
  | "UNSUPPORTED_PLANNER_SCALE";

export type PlannerGeometryReadResult =
  | {
      ok: true;
      value: PlannerGeometrySnapshotV1;
      /** "current" = already V1 Planner scale; "legacy" = adapted from a known legacy form. */
      source: "current" | "legacy";
    }
  | {
      ok: false;
      code: PlannerGeometryReadErrorCode;
      message: string;
      source: unknown;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlannerSceneGeometry(value: unknown): value is PlannerSceneGeometry {
  if (!isRecord(value)) return false;
  const furniture = value.furniture;
  const walls = value.walls;
  const doors = value.doors;
  const windows = value.windows;
  if (![furniture, walls, doors, windows].every(Array.isArray)) return false;
  const fList = furniture as unknown[];
  const wList = walls as unknown[];
  const dList = doors as unknown[];
  const winList = windows as unknown[];

  return (
    fList.every(
      (item) =>
        isRecord(item) &&
        validId(item.id) &&
        finite(item.xMm) &&
        finite(item.yMm) &&
        finite(item.widthMm) &&
        item.widthMm >= 0 &&
        finite(item.depthMm) &&
        item.depthMm >= 0 &&
        finite(item.rotationDeg),
    ) &&
    wList.every(
      (wall) =>
        isRecord(wall) &&
        validId(wall.id) &&
        finite(wall.x1Mm) &&
        finite(wall.y1Mm) &&
        finite(wall.x2Mm) &&
        finite(wall.y2Mm) &&
        finite(wall.thicknessMm) &&
        wall.thicknessMm > 0,
    ) &&
    [...dList, ...winList].every(
      (opening) =>
        isRecord(opening) &&
        validId(opening.id) &&
        (opening.kind === "door" || opening.kind === "window") &&
        finite(opening.xMm) &&
        finite(opening.yMm) &&
        finite(opening.widthMm) &&
        opening.widthMm >= 0 &&
        finite(opening.depthMm) &&
        opening.depthMm >= 0 &&
        finite(opening.rotationDeg),
    )
  );
}

export function assertPlannerScale(scalePxPerMm: number): void {
  if (scalePxPerMm !== PLANNER_SCALE_PX_PER_MM) {
    throw new Error(
      `Unsupported Planner scale ${String(scalePxPerMm)}; expected ${PLANNER_SCALE_PX_PER_MM} px/mm`,
    );
  }
}

export function plannerMmToPx(mm: number): number {
  if (!Number.isFinite(mm)) throw new Error("Planner millimetres must be finite");
  return mm * PLANNER_SCALE_PX_PER_MM;
}

export function plannerPxToMm(px: number): number {
  if (!Number.isFinite(px)) throw new Error("Planner pixels must be finite");
  return px / PLANNER_SCALE_PX_PER_MM;
}

export function readPlannerGeometry(input: unknown): PlannerGeometryReadResult {
  if (!isRecord(input)) {
    return {
      ok: false,
      code: "INVALID_GEOMETRY",
      message: "Planner geometry must be an object",
      source: input,
    };
  }

  const contractVersion = input.contractVersion ?? input.geometry_contract_version;
  const schemaVersion = input.schemaVersion ?? input.schema_version;
  const unit = input.unit ?? PLANNER_GEOMETRY_UNIT;
  if (unit !== PLANNER_GEOMETRY_UNIT) {
    return {
      ok: false,
      code: "INVALID_GEOMETRY",
      message: `Unsupported Planner geometry unit ${String(unit)}`,
      source: input,
    };
  }
  if (
    contractVersion !== undefined &&
    contractVersion !== PLANNER_GEOMETRY_CONTRACT_VERSION
  ) {
    return {
      ok: false,
      code: "UNSUPPORTED_GEOMETRY_VERSION",
      message: `Unsupported Planner geometry contract version ${String(contractVersion)}`,
      source: input,
    };
  }
  if (
    schemaVersion !== undefined &&
    schemaVersion !== PLANNER_GEOMETRY_SCHEMA_VERSION
  ) {
    return {
      ok: false,
      code: "UNSUPPORTED_GEOMETRY_VERSION",
      message: `Unsupported Planner geometry schema version ${String(schemaVersion)}`,
      source: input,
    };
  }

  const legacySheet = isRecord(input.sheet) ? input.sheet : undefined;
  const scale =
    input.scalePxPerMm ??
    input.scale_px_per_mm ??
    legacySheet?.scale_px_per_mm ??
    PLANNER_SCALE_PX_PER_MM;

  // Known legacy scale: the geometry values are in correct millimetres
  // (extracted at the legacy scale: px / legacyScale = mm). Re-tag with
  // canonical Planner scale metadata without rescaling the mm values.
  // This preserves physical dimensions, placement, and rotation.
  if (scale !== PLANNER_SCALE_PX_PER_MM && PLANNER_KNOWN_LEGACY_SCALES.has(scale as number)) {
    const geometry = input.geometry;
    if (!isPlannerSceneGeometry(geometry)) {
      return {
        ok: false,
        code: "INVALID_GEOMETRY",
        message: "Normalized millimetre geometry is missing or invalid in legacy-scale snapshot",
        source: input,
      };
    }
    const canvasSnapshot = isRecord(input.canvasSnapshot)
      ? input.canvasSnapshot
      : isRecord(input.canvas_json)
        ? input.canvas_json
        : undefined;
    return {
      ok: true,
      source: "legacy",
      value: {
        contractVersion: PLANNER_GEOMETRY_CONTRACT_VERSION,
        schemaVersion: PLANNER_GEOMETRY_SCHEMA_VERSION,
        unit: PLANNER_GEOMETRY_UNIT,
        scalePxPerMm: PLANNER_SCALE_PX_PER_MM,
        geometry,
        ...(canvasSnapshot ? { canvasSnapshot } : {}),
      },
    };
  }

  // Unknown or zero scale: reject explicitly rather than silently applying
  // Studio scale.
  if (scale !== PLANNER_SCALE_PX_PER_MM) {
    return {
      ok: false,
      code: "UNSUPPORTED_PLANNER_SCALE",
      message: `Unsupported Planner geometry scale ${String(scale)} px/mm`,
      source: input,
    };
  }

  const geometry = input.geometry;
  if (!isPlannerSceneGeometry(geometry)) {
    return {
      ok: false,
      code: "INVALID_GEOMETRY",
      message: "Normalized millimetre geometry is missing or invalid",
      source: input,
    };
  }

  const canvasSnapshot = isRecord(input.canvasSnapshot)
    ? input.canvasSnapshot
    : isRecord(input.canvas_json)
      ? input.canvas_json
      : undefined;
  return {
    ok: true,
    source:
      contractVersion === PLANNER_GEOMETRY_CONTRACT_VERSION &&
      schemaVersion === PLANNER_GEOMETRY_SCHEMA_VERSION
        ? "current"
        : "legacy",
    value: {
      contractVersion: PLANNER_GEOMETRY_CONTRACT_VERSION,
      schemaVersion: PLANNER_GEOMETRY_SCHEMA_VERSION,
      unit: PLANNER_GEOMETRY_UNIT,
      scalePxPerMm: PLANNER_SCALE_PX_PER_MM,
      geometry,
      ...(canvasSnapshot ? { canvasSnapshot } : {}),
    },
  };
}

// ---------------------------------------------------------------------------
// Legacy scale adaptation (deterministic, pure)
// ---------------------------------------------------------------------------

/**
 * Rescale millimetre geometry values that were persisted under a different
 * px/mm scale to the canonical Planner scale.
 *
 * The conversion preserves physical meaning: if a legacy snapshot stored
 * values as `px / legacyScale`, we convert to `px / PLANNER_SCALE` by
 * multiplying each mm value by `legacyScale / PLANNER_SCALE`.
 *
 * Rotation (degrees) is scale-independent and passed through unchanged.
 */
export function rescaleGeometry(
  geometry: PlannerSceneGeometry,
  legacyScalePxPerMm: number,
): PlannerSceneGeometry {
  const factor = legacyScalePxPerMm / PLANNER_SCALE_PX_PER_MM;
  const rescaleMm = (mm: number): number => mm * factor;

  const furniture: PlannerMmRect[] = geometry.furniture.map((item) => ({
    ...item,
    xMm: rescaleMm(item.xMm),
    yMm: rescaleMm(item.yMm),
    widthMm: rescaleMm(item.widthMm),
    depthMm: rescaleMm(item.depthMm),
    // rotationDeg is scale-independent
  }));

  const walls: PlannerMmWall[] = geometry.walls.map((wall) => ({
    ...wall,
    x1Mm: rescaleMm(wall.x1Mm),
    y1Mm: rescaleMm(wall.y1Mm),
    x2Mm: rescaleMm(wall.x2Mm),
    y2Mm: rescaleMm(wall.y2Mm),
    thicknessMm: rescaleMm(wall.thicknessMm),
  }));

  const doors: PlannerMmOpening[] = geometry.doors.map((opening) => ({
    ...opening,
    xMm: rescaleMm(opening.xMm),
    yMm: rescaleMm(opening.yMm),
    widthMm: rescaleMm(opening.widthMm),
    depthMm: rescaleMm(opening.depthMm),
    // rotationDeg is scale-independent
  }));

  const windows: PlannerMmOpening[] = geometry.windows.map((opening) => ({
    ...opening,
    xMm: rescaleMm(opening.xMm),
    yMm: rescaleMm(opening.yMm),
    widthMm: rescaleMm(opening.widthMm),
    depthMm: rescaleMm(opening.depthMm),
    // rotationDeg is scale-independent
  }));

  return { furniture, walls, doors, windows };
}
