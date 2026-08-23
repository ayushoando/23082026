import { NextResponse } from "next/server";
import { getFurnitureCatalogMode } from "@/lib/catalog/furnitureCatalogMode";
import { getPlannerPersistenceMode } from "@/lib/Planner/plannerPersistenceMode";

export type DiskFileKind = "furniture" | "planner";

/** Returns 404 when the disk file surface is not active (production uses Supabase/R2). */
export function diskFileUnavailableResponse(kind: DiskFileKind): NextResponse | null {
  const disk =
    kind === "furniture"
      ? getFurnitureCatalogMode() === "disk"
      : getPlannerPersistenceMode() === "disk";
  if (!disk) {
    return NextResponse.json({ detail: "Not available in production mode" }, { status: 404 });
  }
  return null;
}
