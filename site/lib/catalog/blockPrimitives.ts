/**
 * Shared 2D block primitive vocabulary (mm space, origin = block top-left).
 *
 * Split out of blocks2d.ts so surface2d5.ts (which blocks2d.ts depends on for
 * surface rendering) does not need to import back into blocks2d.ts just for
 * the `Prim` type — that created a circular dependency in the static import
 * graph. blocks2d.ts re-exports these types for existing consumers.
 */

export interface BasePrim {
  shadowColor?: string;
  shadowBlur?: number;
  shadowOpacity?: number;
  shadowOffsetY?: number;
  fillLinearGradientStartPoint?: { x: number; y: number };
  fillLinearGradientEndPoint?: { x: number; y: number };
  fillLinearGradientColorStops?: readonly (number | string)[];
  rotation?: number; // degrees
  offsetX?: number;
  offsetY?: number;
}

export interface RectPrim extends BasePrim {
  kind: "rect";
  x: number; y: number; w: number; h: number;
  fill?: string; stroke?: string; strokeWidth?: number; radius?: number;
}
export interface LinePrim extends BasePrim {
  kind: "line";
  points: readonly number[];
  stroke: string; strokeWidth: number; dash?: readonly number[];
  lineCap?: "butt" | "round" | "square";
}
export interface CirclePrim extends BasePrim {
  kind: "circle";
  cx: number; cy: number; r: number;
  fill?: string; stroke?: string; strokeWidth?: number;
  dash?: number[];
}
export interface ArcPrim extends BasePrim {
  kind: "arc";
  cx: number; cy: number; r: number;
  startAngle: number; endAngle: number;
  stroke: string; strokeWidth: number; fill?: string;
  lineCap?: "butt" | "round" | "square";
}
export interface PathPrim extends BasePrim {
  kind: "path";
  data: string; // SVG path string
  fill?: string; stroke?: string; strokeWidth?: number;
  lineCap?: "butt" | "round" | "square";
}

export type Prim = RectPrim | LinePrim | CirclePrim | ArcPrim | PathPrim;
